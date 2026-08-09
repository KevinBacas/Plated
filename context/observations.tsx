import 'expo-sqlite/localStorage/install';

import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import type { TargetType } from '@/data/targets';
import type { Observation } from '@/lib/observations';

const STORAGE_KEY = 'plated.observations.v1';

type ObservationContextValue = {
  observations: Observation[];
  loading: boolean;
  addObservation: (targetId: string, targetType: TargetType) => Promise<Observation>;
  undoObservation: (id: string) => Promise<void>;
  deleteObservation: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
};

const ObservationContext = createContext<ObservationContextValue | null>(null);

function readObservations(): Observation[] {
  if (typeof globalThis.localStorage === 'undefined') return [];
  try {
    const stored = globalThis.localStorage.getItem(STORAGE_KEY);
    const observations = stored ? JSON.parse(stored) : [];
    return Array.isArray(observations) ? observations : [];
  } catch {
    return [];
  }
}

function persist(observations: Observation[]) {
  globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(observations));
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function ObservationsProvider({ children }: PropsWithChildren) {
  const [observations, setObservations] = useState<Observation[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setObservations(readObservations());
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const commit = useCallback((next: Observation[]) => {
    persist(next);
    setObservations(next);
  }, []);

  const value = useMemo<ObservationContextValue>(() => ({
    observations,
    loading,
    refresh,
    addObservation: async (targetId, targetType) => {
      const observation: Observation = { id: makeId(), targetId, targetType, observedAt: new Date().toISOString(), note: null };
      commit([observation, ...observations]);
      return observation;
    },
    undoObservation: async (id) => commit(observations.filter((observation) => observation.id !== id)),
    deleteObservation: async (id) => commit(observations.filter((observation) => observation.id !== id)),
  }), [commit, loading, observations, refresh]);

  return <ObservationContext.Provider value={value}>{children}</ObservationContext.Provider>;
}

export function useObservations() {
  const value = useContext(ObservationContext);
  if (!value) throw new Error('useObservations must be used inside ObservationsProvider');
  return value;
}
