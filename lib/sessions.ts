import type { Observation } from './observations';
import { getTargetById } from '../data/targets';

export type RegionStanding = { region: string; count: number };

export type TripSession = {
  id: string;
  startedAt: string;
  endedAt: string | null;
};

export function getActiveSession(sessions: TripSession[]) {
  return sessions.find((session) => session.endedAt === null) ?? null;
}

export function summarizeSession(observations: Observation[], sessionId: string) {
  const entries = observations.filter((entry) => entry.sessionId === sessionId);
  const regionCounts = new Map<string, number>();
  for (const entry of entries) {
    const target = getTargetById(entry.targetId);
    if (target?.type === 'department' && target.region) {
      regionCounts.set(target.region, (regionCounts.get(target.region) ?? 0) + 1);
    }
  }
  const topRegions: RegionStanding[] = [...regionCounts].map(([region, count]) => ({ region, count }))
    .sort((a, b) => b.count - a.count || a.region.localeCompare(b.region, 'fr'))
    .slice(0, 3);
  return {
    observations: entries,
    total: entries.length,
    departments: new Set(entries.filter((entry) => entry.targetType === 'department').map((entry) => entry.targetId)).size,
    countries: new Set(entries.filter((entry) => entry.targetType === 'country').map((entry) => entry.targetId)).size,
    topRegions,
  };
}

export function formatSessionDuration(session: TripSession, now = Date.now()) {
  const elapsed = Math.max(0, (session.endedAt ? Date.parse(session.endedAt) : now) - Date.parse(session.startedAt));
  const minutes = Math.floor(elapsed / 60_000);
  if (minutes === 0) return 'Moins d’une minute';
  if (minutes < 60) return `${minutes} min`;
  const remainder = minutes % 60;
  return `${Math.floor(minutes / 60)} h${remainder ? ` ${remainder} min` : ''}`;
}
