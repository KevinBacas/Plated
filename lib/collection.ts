import { COUNTRIES, DEPARTMENTS, TARGETS, type Target, type TargetType } from '../data/targets';
import { normalize } from './format';
import type { Observation } from './observations';
import { buildTargetProgress, filterTargets } from './target-stats';

export type CollectionKind = TargetType | 'all';
export type CountryFilter = 'all' | 'eu' | 'other';
export type CollectionFilter = 'all' | 'found' | 'missing';

export function scopeObservations(observations: Observation[], sessionId: string | null) {
  return sessionId === null ? observations : observations.filter((entry) => entry.sessionId === sessionId);
}

export function selectTargets(observations: Observation[], kind: CollectionKind, countryFilter: CountryFilter, filter: CollectionFilter, query: string) {
  const progress = buildTargetProgress(observations);
  const catalog = kind === 'department' ? DEPARTMENTS : kind === 'country' ? COUNTRIES : TARGETS;
  return filterTargets(catalog, query).filter((target) => {
    const matchesCountry = target.type !== 'country' || countryFilter === 'all' || (countryFilter === 'eu' ? target.eu : !target.eu);
    const found = progress.has(target.id);
    return matchesCountry && (filter === 'all' || (filter === 'found' ? found : !found));
  });
}

export function groupTargets(targets: Target[]) {
  const groups = new Map<string, Target[]>();
  for (const target of targets) {
    const name = target.region ?? 'Pays';
    groups.set(name, [...(groups.get(name) ?? []), target]);
  }
  return [...groups].sort(([a], [b]) => a.localeCompare(b, 'fr')).map(([name, entries]) => ({
    name,
    targets: [...entries].sort((a, b) => a.type === 'country'
      ? a.name.localeCompare(b.name, 'fr')
      : a.code.localeCompare(b.code, 'fr', { numeric: true })),
  }));
}

// Exact matching deliberately prevents 97 → 971 or C → CH from saving while typing.
export function findCodeTargets(kind: TargetType, query: string) {
  const code = normalize(query);
  if (!code) return [];
  return (kind === 'department' ? DEPARTMENTS : COUNTRIES).filter((target) =>
    normalize(target.code) === code || target.aliases?.some((alias) => normalize(alias) === code));
}
