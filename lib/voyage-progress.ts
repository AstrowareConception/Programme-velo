import type { CompletedSession, VoyagePortion } from "./types";
import { climbs } from "./routes";

const nativeRoutes = new Map(climbs.map(route => [route.id, route]));

// Only a whole classic ride is a standalone completion. Voyage validation is
// derived from the union of its saved portions, never from the last session.
export function isStandaloneRouteCompleted(session: CompletedSession) {
  return Boolean(session.routeId) && session.metrics?.voyage === undefined &&
    session.metrics?.completedRoute !== false && session.metrics?.segmentAttackIndex === undefined;
}

export function validVoyagePortion(value: unknown): value is VoyagePortion {
  if (!value || typeof value !== "object") return false;
  const p = value as VoyagePortion;
  return p.version === 1 && p.positionSource === "simulation" &&
    typeof p.completedPortion === "boolean" &&
    [p.startKm, p.endKm, p.routeDistanceKm, p.routeXp].every(Number.isFinite) &&
    p.routeDistanceKm > 0 && p.routeDistanceKm <= 2000 &&
    p.startKm >= 0 && p.endKm > p.startKm && p.endKm <= p.routeDistanceKm &&
    Number.isInteger(p.routeXp) && p.routeXp >= 0 && p.routeXp <= 5000;
}

export function voyageRoutes(sessions: CompletedSession[]) {
  const grouped = new Map<string, Array<{ portion: VoyagePortion; time: number }>>();
  for (const session of sessions) {
    const p = session.metrics?.voyage;
    const time = Date.parse(session.date);
    if (!session.routeId || !Number.isFinite(time) || !validVoyagePortion(p) || !p.completedPortion ||
      session.metrics?.timeAttack || session.metrics?.segmentAttackIndex !== undefined || session.metrics?.challenge) continue;
    const native = nativeRoutes.get(session.routeId);
    if (native ? p.routeDistanceKm !== native.distanceKm || p.routeXp !== native.xp : !session.routeId.startsWith("gpx-")) continue;
    const portions = grouped.get(session.routeId) ?? [];
    portions.push({ portion: p, time });
    grouped.set(session.routeId, portions);
  }
  return [...grouped].flatMap(([routeId, portions]) => {
    const first = portions[0].portion;
    // A changed GPX or contradictory backup must not combine different tracks.
    if (portions.some(({ portion: p }) => p.routeDistanceKm !== first.routeDistanceKm || p.routeXp !== first.routeXp)) return [];
    let intervals: Array<{ startKm: number; endKm: number }> = [];
    let completedAt: number | undefined;
    for (const { portion: p, time } of [...portions].sort((a, b) => a.time - b.time)) {
      const merged: typeof intervals = [];
      for (const interval of [...intervals, { startKm: p.startKm, endKm: p.endKm }].sort((a, b) => a.startKm - b.startKm)) {
        const last = merged.at(-1);
        if (last && interval.startKm <= last.endKm + 1e-8) last.endKm = Math.max(last.endKm, interval.endKm);
        else merged.push({ ...interval });
      }
      intervals = merged;
      if (completedAt === undefined && intervals.length === 1 && intervals[0].startKm === 0 && intervals[0].endKm === first.routeDistanceKm) completedAt = time;
    }
    const coveredKm = intervals.reduce((sum, p) => sum + p.endKm - p.startKm, 0);
    const complete = intervals.length === 1 && intervals[0].startKm === 0 && intervals[0].endKm === first.routeDistanceKm;
    const nextStartKm = intervals[0]?.startKm === 0 ? intervals[0].endKm : 0;
    const nextEndKm = intervals.find(p => p.startKm > nextStartKm)?.startKm ?? first.routeDistanceKm;
    return [{ routeId, routeDistanceKm: first.routeDistanceKm, routeXp: first.routeXp, intervals, coveredKm, complete, completedAt, nextStartKm, nextEndKm }];
  });
}

export function allCompletedRouteIds(sessions: CompletedSession[]) {
  return new Set([
    ...sessions.filter(isStandaloneRouteCompleted).map(s => s.routeId!),
    ...voyageRoutes(sessions).filter(p => p.complete).map(p => p.routeId)
  ]);
}

export function voyageBonusXp(sessions: CompletedSession[]) {
  const classic = sessions.filter(isStandaloneRouteCompleted);
  return voyageRoutes(sessions).reduce((sum, p) => {
    const alreadyAwarded = classic.some(s => s.routeId === p.routeId && Date.parse(s.date) <= (p.completedAt ?? 0));
    return sum + (p.complete && !alreadyAwarded ? p.routeXp : 0);
  }, 0);
}
