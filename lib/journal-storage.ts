import type { TargetType } from '../data/targets';
import type { Observation } from './observations';
import { getActiveSession, type TripSession } from './sessions';

export const OBSERVATIONS_KEY = 'plated.observations.v1';
export const SESSIONS_KEY = 'plated.sessions.v1';

type JournalStorage = Pick<Storage, 'getItem' | 'setItem'>;
export type Journal = { observations: Observation[]; sessions: TripSession[] };

function readArray<T>(storage: JournalStorage, key: string): T[] {
  const stored = storage.getItem(key);
  if (stored === null) return [];
  const parsed: unknown = JSON.parse(stored);
  if (!Array.isArray(parsed)) throw new Error('Le journal enregistré est illisible.');
  return parsed;
}

// Each action writes one key. Existing observations keep their original format and key.
// Read before every mutation so rapid actions cannot overwrite a stale React snapshot.
export function createJournalStore(storage: JournalStorage) {
  const read = (): Journal => ({
    observations: readArray<Observation>(storage, OBSERVATIONS_KEY),
    sessions: readArray<TripSession>(storage, SESSIONS_KEY),
  });
  const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  return {
    read,
    startSession(now = new Date().toISOString()): Journal {
      const journal = read();
      if (getActiveSession(journal.sessions)) return journal;
      const session: TripSession = { id: makeId(), startedAt: now, endedAt: null };
      const sessions = [session, ...journal.sessions];
      storage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
      return { ...journal, sessions };
    },
    endSession(id: string, now = new Date().toISOString()): Journal {
      const journal = read();
      const sessions = journal.sessions.map((session) => session.id === id && session.endedAt === null
        ? { ...session, endedAt: now < session.startedAt ? session.startedAt : now }
        : session);
      storage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
      return { ...journal, sessions };
    },
    addObservation(targetId: string, targetType: TargetType): { journal: Journal; observation: Observation } {
      const journal = read();
      const observation: Observation = {
        id: makeId(), targetId, targetType, observedAt: new Date().toISOString(), note: null,
        sessionId: getActiveSession(journal.sessions)?.id ?? null,
      };
      const observations = [observation, ...journal.observations];
      storage.setItem(OBSERVATIONS_KEY, JSON.stringify(observations));
      return { journal: { ...journal, observations }, observation };
    },
    deleteObservation(id: string): Journal {
      const journal = read();
      const observations = journal.observations.filter((observation) => observation.id !== id);
      storage.setItem(OBSERVATIONS_KEY, JSON.stringify(observations));
      return { ...journal, observations };
    },
  };
}
