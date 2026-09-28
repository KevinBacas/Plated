import assert from 'node:assert/strict';
import test from 'node:test';

import paths from '../data/department-map.json';
import { COUNTRIES, DEPARTMENTS, EU_COUNTRIES, getTargetById } from '../data/targets';
import { collectionTargets, findCodeTargets, groupTargets, scopeObservations, selectTargets } from '../lib/collection';
import { heatLevel } from '../lib/heatmap';
import { createJournalStore, OBSERVATIONS_KEY } from '../lib/journal-storage';
import type { Observation } from '../lib/observations';
import { sessionInsights } from '../lib/sessions';

const entries: Observation[] = [
  { id: 'a', targetId: 'department-75', targetType: 'department', observedAt: '2026-09-01T08:00:00Z', note: null },
  { id: 'b', targetId: 'department-75', targetType: 'department', observedAt: '2026-09-02T08:00:00Z', sessionId: 'trip', note: null },
  { id: 'c', targetId: 'country-CH', targetType: 'country', observedAt: '2026-09-02T08:01:00Z', sessionId: 'trip', note: null },
  { id: 'd', targetId: 'country-CH', targetType: 'country', observedAt: '2026-09-02T08:02:00Z', sessionId: 'trip', note: null },
  { id: 'e', targetId: 'country-DE', targetType: 'country', observedAt: '2026-09-02T08:03:00Z', sessionId: 'trip', note: null },
  { id: 'f', targetId: 'department-34', targetType: 'department', observedAt: '2026-09-03T08:00:00Z', sessionId: 'next', note: null },
];

const trip = { id: 'trip', startedAt: '2026-09-02T07:59:00Z', endedAt: '2026-09-02T09:00:00Z' };

test('global and trip filters use the same scope for status and search', () => {
  assert.equal(scopeObservations(entries, null).length, 6);
  assert.equal(scopeObservations(entries, 'trip').length, 4);
  assert.equal(selectTargets(entries, 'all', 'found', '').length, 4);
  const current = scopeObservations(entries, 'trip');
  assert.deepEqual(selectTargets(current, 'department', 'missing', '34').map((t) => t.id), ['department-34']);
  assert.deepEqual(selectTargets(entries, 'department', 'missing', '34'), []);
  assert.deepEqual(selectTargets(current, 'other', 'found', '').map((t) => t.id), ['country-CH']);
});

test('country expansion preserves IDs and EU completion while sorting French names', () => {
  assert.equal(EU_COUNTRIES.length, 26);
  assert.equal(COUNTRIES.length, 29);
  assert.equal(COUNTRIES[0].name, 'Allemagne');
  assert.ok(COUNTRIES.indexOf(getTargetById('country-CY')!) < COUNTRIES.indexOf(getTargetById('country-HR')!));
  assert.equal(getTargetById('country-DE')?.code, 'D');
  assert.equal(collectionTargets('all').length, 130);
  assert.equal(collectionTargets('department').length, 101);
  assert.equal(collectionTargets('eu').length, 26);
  assert.deepEqual(collectionTargets('other').map((t) => t.id).sort(), ['country-CH', 'country-GB', 'country-MC']);
  assert.equal(selectTargets([], 'eu', 'all', '').length, 26);
  assert.equal(selectTargets([], 'other', 'all', '').length, 3);
  assert.deepEqual(selectTargets([], 'all', 'all', 'gb').map((t) => t.id), ['country-GB']);
});

test('region groups sort in French and keep department codes in order', () => {
  const groups = groupTargets(DEPARTMENTS);
  assert.equal(groups[0].name, 'Auvergne-Rhône-Alpes');
  assert.equal(groups[1].name, 'Bourgogne-Franche-Comté');
  assert.deepEqual(groups.find((g) => g.name === 'Corse')?.targets.map((t) => t.code), ['2A', '2B']);
});

test('quick entry accepts complete codes and aliases without saving prefixes', () => {
  for (const [kind, query, id] of [
    ['department', '75', 'department-75'], ['department', '2a', 'department-2A'],
    ['department', '971', 'department-971'], ['country', 'd', 'country-DE'],
    ['country', 'DE', 'country-DE'], ['country', 'GB', 'country-GB'],
    ['country', 'UK', 'country-GB'], ['country', ' CH ', 'country-CH'], ['country', 'MC', 'country-MC'],
  ] as const) assert.deepEqual(findCodeTargets(kind, query).map((t) => t.id), [id]);
  for (const query of ['', '97', '2', '999']) assert.deepEqual(findCodeTargets('department', query), []);
  for (const query of ['', 'C', 'U', 'Paris']) assert.deepEqual(findCodeTargets('country', query), []);
  assert.deepEqual(findCodeTargets('department', 'CH'), []);
});

test('trip insights separate repeated sightings, new discoveries and EU countries', () => {
  const result = sessionInsights(entries, trip);
  assert.equal(result.total, 4);
  assert.equal(result.departments, 1);
  assert.equal(result.countries, 2);
  assert.equal(result.euCountries, 1);
  assert.deepEqual(result.discoveries.sort(), ['country-CH', 'country-DE']);
  assert.equal(result.frequencies[0][0], 'country-CH');
  assert.equal(result.frequencies[0][1].count, 2);
  assert.deepEqual(sessionInsights(entries.filter((e) => e.id !== 'd'), trip).frequencies.map(([id]) => id), ['country-DE', 'department-75', 'country-CH']);
  assert.equal(sessionInsights([], trip).discoveries.length, 0);
});

test('all 101 department shapes are bundled, including overseas and Corsica', () => {
  assert.equal(paths.length, 101);
  assert.deepEqual(paths.map((p) => p.code).sort(), DEPARTMENTS.map((d) => d.code).sort());
  assert.equal(new Set(paths.map((p) => p.code)).size, 101);
  assert.ok(paths.every((p) => p.path.startsWith('M') && p.path.endsWith('Z') && !p.path.includes('NaN')));
  assert.deepEqual([0, 1, 2, 4, 5, 20].map(heatLevel), [0, 1, 2, 2, 3, 3]);
});

test('new countries, repeated quick entries, undo and reload retain legacy data', () => {
  const values = new Map<string, string>([[OBSERVATIONS_KEY, JSON.stringify([entries[0]])]]);
  const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); } };
  const store = createJournalStore(storage);
  const session = store.startSession(trip.startedAt).sessions[0];
  const first = store.addObservation('country-CH', 'country').observation;
  const second = store.addObservation('country-CH', 'country').observation;
  assert.equal(sessionInsights(store.read().observations, session).total, 2);
  store.deleteObservation(second.id);
  const restored = createJournalStore(storage).read();
  assert.ok(restored.observations.some((e) => e.id === first.id));
  assert.deepEqual(restored.observations.find((e) => e.id === 'a'), entries[0]);
  assert.equal(sessionInsights(restored.observations, session).total, 1);
});

test('same-millisecond sightings keep the older journal entry as the first discovery', () => {
  const older: Observation = { ...entries[0], id: 'z', observedAt: trip.startedAt };
  const newer: Observation = { ...older, id: 'a', sessionId: trip.id };
  assert.deepEqual(sessionInsights([newer, older], trip).discoveries, []);
  assert.deepEqual(sessionInsights([newer], trip).discoveries, ['department-75']);
});
