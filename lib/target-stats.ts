import type { Target } from '../data/targets';
import type { Observation } from './observations';

export type TargetProgress = { count: number; firstSeen: string; lastSeen: string };

export function buildTargetProgress(observations: Observation[]) {
  return observations.reduce<Map<string, TargetProgress>>((progress, observation) => {
    const current = progress.get(observation.targetId);
    if (!current) {
      progress.set(observation.targetId, { count: 1, firstSeen: observation.observedAt, lastSeen: observation.observedAt });
      return progress;
    }
    progress.set(observation.targetId, {
      count: current.count + 1,
      firstSeen: current.firstSeen < observation.observedAt ? current.firstSeen : observation.observedAt,
      lastSeen: current.lastSeen > observation.observedAt ? current.lastSeen : observation.observedAt,
    });
    return progress;
  }, new Map());
}

export function filterTargets(targets: Target[], query: string) {
  const normalizedQuery = query.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  if (!normalizedQuery) return targets;
  return targets.filter((target) => `${target.code} ${target.name} ${target.region ?? ''}`.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes(normalizedQuery));
}
