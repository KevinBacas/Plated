import '@/lib/install-local-storage';

import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import type { TargetType } from '@/data/targets';
import { createJournalStore, type Journal } from '@/lib/journal-storage';
import type { Observation } from '@/lib/observations';
import { getActiveSession, type TripSession } from '@/lib/sessions';

type ObservationContextValue = Journal & {
  activeSession: TripSession | null;
  lastAdded: Observation | null;
  dismissLastAdded: () => void;
  loading: boolean;
  error: string | null;
  startSession: () => Promise<void>;
  endSession: (id: string) => Promise<void>;
  addObservation: (targetId: string, targetType: TargetType) => Promise<Observation>;
  undoObservation: (id: string) => Promise<void>;
  deleteObservation: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
};

const ObservationContext = createContext<ObservationContextValue | null>(null);

function getStore() {
  if (typeof globalThis.localStorage === 'undefined') throw new Error('Stockage indisponible.');
  return createJournalStore(globalThis.localStorage);
}

export function ObservationsProvider({ children }: PropsWithChildren) {
  const [journal, setJournal] = useState<Journal>({ observations: [], sessions: [] });
  const [lastAdded, setLastAdded] = useState<Observation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setJournal(getStore().read());
      setError(null);
    } catch {
      setError('Impossible de lire le journal. Vos données enregistrées sont conservées. Réessayez.');
    }
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const value = useMemo<ObservationContextValue>(() => ({
    ...journal,
    lastAdded,
    dismissLastAdded: () => setLastAdded(null),
    activeSession: getActiveSession(journal.sessions),
    loading,
    error,
    refresh,
    startSession: async () => setJournal(getStore().startSession()),
    endSession: async (id) => setJournal(getStore().endSession(id)),
    addObservation: async (targetId, targetType) => {
      const result = getStore().addObservation(targetId, targetType);
      setJournal(result.journal);
      setLastAdded(result.observation);
      return result.observation;
    },
    undoObservation: async (id) => {
      setJournal(getStore().deleteObservation(id));
      setLastAdded((current) => current?.id === id ? null : current);
    },
    deleteObservation: async (id) => {
      setJournal(getStore().deleteObservation(id));
      setLastAdded((current) => current?.id === id ? null : current);
    },
  }), [error, journal, lastAdded, loading, refresh]);

  return <ObservationContext.Provider value={value}>{children}</ObservationContext.Provider>;
}

export function useObservations() {
  const value = useContext(ObservationContext);
  if (!value) throw new Error('useObservations must be used inside ObservationsProvider');
  return value;
}
