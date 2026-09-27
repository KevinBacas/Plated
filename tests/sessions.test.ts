import assert from 'node:assert/strict';
import test from 'node:test';

import { createJournalStore, OBSERVATIONS_KEY, SESSIONS_KEY } from '../lib/journal-storage';
import { formatSessionDuration, getActiveSession, summarizeSession } from '../lib/sessions';

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
  };
}

const start = '2026-09-06T08:00:00.000Z';
const end = '2026-09-06T09:25:00.000Z';

test('legacy observations stay unchanged and outside sessions when starting a trip', () => {
  const storage = memoryStorage();
  const legacy = [{ id: 'legacy', targetId: 'department-75', targetType: 'department', observedAt: start, note: 'Paris' }];
  const original = JSON.stringify(legacy);
  storage.setItem(OBSERVATIONS_KEY, original);
  const store = createJournalStore(storage);
  assert.deepEqual(store.read(), { observations: legacy, sessions: [] });
  const journal = store.startSession(start);
  assert.equal(storage.getItem(OBSERVATIONS_KEY), original);
  assert.deepEqual(journal.observations, legacy);
  assert.equal(summarizeSession(journal.observations, journal.sessions[0].id).total, 0);
});

test('a trip resumes after reopening and rapid starts create only one active session', () => {
  const storage = memoryStorage();
  const store = createJournalStore(storage);
  const first = store.startSession(start).sessions[0];
  const reopened = createJournalStore(storage);
  assert.deepEqual(getActiveSession(reopened.read().sessions), first);
  assert.equal(reopened.startSession(end).sessions.length, 1);
  const a = store.addObservation('department-75', 'department').observation;
  const b = reopened.addObservation('country-DE', 'country').observation;
  assert.equal(a.sessionId, first.id);
  assert.equal(b.sessionId, first.id);
  assert.equal(store.read().observations.length, 2);
});

test('completed trips stay separate from new trips and outside-session observations', () => {
  const store = createJournalStore(memoryStorage());
  const before = store.addObservation('department-34', 'department').observation;
  const first = store.startSession(start).sessions[0];
  store.addObservation('department-75', 'department');
  store.endSession(first.id, end);
  assert.equal(getActiveSession(store.read().sessions), null);
  const after = store.addObservation('department-34', 'department').observation;
  assert.equal(before.sessionId, null);
  assert.equal(after.sessionId, null);
  const second = store.startSession(end).sessions[0];
  store.addObservation('country-DE', 'country');
  // A delayed finish from the first screen must never finish the next trip.
  store.endSession(first.id, '2026-09-06T10:00:00.000Z');
  const journal = store.read();
  assert.equal(getActiveSession(journal.sessions)?.id, second.id);
  assert.equal(journal.sessions[1].endedAt, end);
  assert.equal(summarizeSession(journal.observations, first.id).total, 1);
  assert.equal(summarizeSession(journal.observations, second.id).total, 1);
  assert.equal(journal.observations.length, 4);
});

test('recaps count repeated sightings and unique departments/countries, and update after undo/delete', () => {
  const store = createJournalStore(memoryStorage());
  const session = store.startSession(start).sessions[0];
  const first = store.addObservation('department-75', 'department').observation;
  const second = store.addObservation('department-75', 'department').observation;
  store.addObservation('country-DE', 'country');
  let summary = summarizeSession(store.read().observations, session.id);
  assert.equal(summary.total, 3);
  assert.equal(summary.departments, 1);
  assert.equal(summary.countries, 1);
  store.deleteObservation(second.id);
  summary = summarizeSession(store.read().observations, session.id);
  assert.equal(summary.total, 2);
  assert.equal(summary.departments, 1);
  store.endSession(session.id, end);
  store.deleteObservation(first.id);
  summary = summarizeSession(store.read().observations, session.id);
  assert.equal(summary.total, 1);
  assert.equal(summary.departments, 0);
  assert.equal(summary.countries, 1);
});

test('empty completed sessions survive a reload', () => {
  const storage = memoryStorage();
  const store = createJournalStore(storage);
  const session = store.startSession(start).sessions[0];
  store.endSession(session.id, end);
  const restored = createJournalStore(storage).read();
  assert.equal(restored.sessions.length, 1);
  assert.equal(restored.sessions[0].endedAt, end);
  assert.deepEqual(summarizeSession(restored.observations, session.id), { observations: [], total: 0, departments: 0, countries: 0, topRegions: [] });
});

test('storage write failures leave persisted observations and session state intact', () => {
  const storage = memoryStorage();
  const store = createJournalStore(storage);
  const session = store.startSession(start).sessions[0];
  store.addObservation('department-75', 'department');
  const before = store.read();
  const failing = createJournalStore({ getItem: storage.getItem, setItem: () => { throw new Error('Quota exceeded'); } });
  assert.throws(() => failing.endSession(session.id, end), /Quota exceeded/);
  assert.throws(() => failing.addObservation('country-DE', 'country'), /Quota exceeded/);
  assert.throws(() => failing.deleteObservation(before.observations[0].id), /Quota exceeded/);
  assert.deepEqual(store.read(), before);
  const empty = createJournalStore({ getItem: () => null, setItem: () => { throw new Error('Quota exceeded'); } });
  assert.throws(() => empty.startSession(start), /Quota exceeded/);
});

test('unreadable saved data is never silently replaced by an empty journal', () => {
  for (const key of [OBSERVATIONS_KEY, SESSIONS_KEY]) {
    for (const invalid of ['{broken', '{}', 'null']) {
      const storage = memoryStorage();
      storage.setItem(key, invalid);
      const store = createJournalStore(storage);
      assert.throws(() => store.read());
      assert.throws(() => store.startSession(start));
      assert.throws(() => store.addObservation('department-75', 'department'));
      assert.equal(storage.getItem(key), invalid);
    }
  }
});

test('duration handles short trips, hours, days, finished trips and a backwards clock', () => {
  const session = { id: 'trip', startedAt: start, endedAt: null };
  assert.equal(formatSessionDuration(session, Date.parse(start) + 30_000), 'Moins d’une minute');
  assert.equal(formatSessionDuration(session, Date.parse(start) + 60_000), '1 min');
  assert.equal(formatSessionDuration(session, Date.parse(start) + 3_600_000), '1 h');
  assert.equal(formatSessionDuration({ ...session, endedAt: end }), '1 h 25 min');
  assert.equal(formatSessionDuration(session, Date.parse(start) + 90_000_000), '25 h');
  assert.equal(formatSessionDuration(session, Date.parse(start) - 60_000), 'Moins d’une minute');
  const store = createJournalStore(memoryStorage());
  const active = store.startSession(end).sessions[0];
  assert.equal(store.endSession(active.id, start).sessions[0].endedAt, end);
});


test('the region podium ranks sightings, keeps the top three, and excludes countries and other trips', () => {
  const store = createJournalStore(memoryStorage());
  store.addObservation('department-75', 'department');
  const session = store.startSession(start).sessions[0];
  for (const id of ['department-75', 'department-75', 'department-92', 'department-34', 'department-31', 'department-01', 'department-29']) {
    store.addObservation(id, 'department');
  }
  store.addObservation('country-DE', 'country');
  const summary = summarizeSession(store.read().observations, session.id);
  assert.deepEqual(summary.topRegions, [
    { region: 'Île-de-France', count: 3 },
    { region: 'Occitanie', count: 2 },
    { region: 'Auvergne-Rhône-Alpes', count: 1 },
  ]);
  assert.equal(summary.total, 8);
});

test('the podium handles fewer than three regions and recalculates after deleting a sighting', () => {
  const store = createJournalStore(memoryStorage());
  const session = store.startSession(start).sessions[0];
  store.addObservation('country-DE', 'country');
  assert.deepEqual(summarizeSession(store.read().observations, session.id).topRegions, []);
  const paris = store.addObservation('department-75', 'department').observation;
  assert.deepEqual(summarizeSession(store.read().observations, session.id).topRegions, [{ region: 'Île-de-France', count: 1 }]);
  store.addObservation('department-34', 'department');
  assert.equal(summarizeSession(store.read().observations, session.id).topRegions.length, 2);
  store.deleteObservation(paris.id);
  assert.deepEqual(summarizeSession(store.read().observations, session.id).topRegions, [{ region: 'Occitanie', count: 1 }]);
});
