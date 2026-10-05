import { climbToWorkout, type ClimbChallenge } from "./routes";
import type { CompletedSession, VoyagePortion, WorkoutTemplate } from "./types";
import { voyageRoutes } from "./voyage-progress";

export function voyageProgress(route: ClimbChallenge, sessions: CompletedSession[]) {
  const saved = voyageRoutes(sessions).find(p => p.routeId === route.id && p.routeDistanceKm === route.distanceKm && p.routeXp === route.xp);
  return saved ?? { coveredKm: 0, complete: false, nextStartKm: 0, nextEndKm: route.distanceKm, intervals: [] };
}

export function voyagePlan(route: ClimbChallenge, sessions: CompletedSession[], minutes: number): VoyagePortion | null {
  const progress = voyageProgress(route, sessions);
  if (progress.complete) return null;
  const budget = [15, 30, 45, 60].includes(minutes) ? minutes : 30;
  return { version: 1, startKm: progress.nextStartKm,
    endKm: Math.min(progress.nextEndKm, progress.nextStartKm + budget / 4),
    routeDistanceKm: route.distanceKm, routeXp: route.xp,
    completedPortion: false, positionSource: "simulation" };
}

export function voyageWorkout(route: ClimbChallenge, portion: VoyagePortion): WorkoutTemplate {
  const base = climbToWorkout(route);
  const segments = route.profile.slice(1).flatMap((point, i) => {
    const startKm = Math.max(portion.startKm, route.profile[i].km);
    const endKm = Math.min(portion.endKm, point.km);
    if (endKm <= startKm) return [];
    return [{ ...base.segments[i], label: `${endKm.toFixed(2)} km · ${point.grade.toFixed(1)} %`,
      minutes: Math.max(1, Math.round((endKm - startKm) * 240)) / 60 }];
  });
  return { ...base, id: `voyage-${route.id}-${portion.startKm}-${portion.endKm}`,
    name: `${route.name} · Voyage`, tagline: `${portion.startKm.toFixed(2)} → ${portion.endKm.toFixed(2)} km`,
    description: "Portion à rythme simulé de 15 km/h. Le relief et les lieux du parcours original sont conservés.",
    xp: 0, points: Math.round(route.points * (portion.endKm - portion.startKm) / route.distanceKm * 100) / 100,
    duration: segments.reduce((sum, s) => sum + s.minutes, 0), segments };
}
