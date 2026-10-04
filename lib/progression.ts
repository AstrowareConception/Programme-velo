import type { CompletedSession } from "./types";
import type { ClimbChallenge } from "./routes";
import { scenicRouteIds } from "./scenic-routes";

export type RouteCollection = {
  id: string;
  title: string;
  description: string;
  icon: string;
  routeIds: string[];
};

export const routeCollections: RouteCollection[] = [
  {
    id: "alpine-crown",
    title: "Couronne Alpine",
    description: "Conquiers les grands cols alpins natifs de VeloQuest.",
    icon: "👑",
    routeIds: ["alpe-dhuez","galibier-valloire","madeleine-maurienne","croix-de-fer-maurienne","glandon-cuines","iseran-bonneval"]
  },
  {
    id: "tour-legends",
    title: "Légendes du Tour",
    description: "Valide quatre monuments du cyclisme français.",
    icon: "🏆",
    routeIds: ["alpe-dhuez","ventoux-bedoin","tourmalet-est","galibier-valloire"]
  },
  {
    id: "grand-fond",
    title: "Grand fond",
    description: "Termine l’étape multi-cols Chaussy + Madeleine.",
    icon: "🗻",
    routeIds: ["chaussy-madeleine-stage"]
  },
  {
    id: "scenic-france", title: "La France en douceur",
    description: "Collectionne les sept balades : lacs, canaux, île et patrimoine. Les répétitions ne remplacent pas les découvertes.",
    icon: "🌿", routeIds: scenicRouteIds
  }
];

export function isRouteCompleted(session: CompletedSession) {
  if (!session.routeId) return false;
  return session.metrics?.completedRoute !== false && session.metrics?.segmentAttackIndex === undefined;
}

export function progressionStats(sessions: CompletedSession[], routes: ClimbChallenge[]) {
  const completedSessions = sessions.filter(isRouteCompleted);
  const completedRouteIds = new Set(completedSessions.map((session) => session.routeId).filter((id): id is string => Boolean(id)));
  const challengeSuccesses = sessions.filter((session) => session.metrics?.challenge?.success);
  const uniqueChallenges = new Set(challengeSuccesses.map((session) => session.metrics!.challenge!.id));
  const routeById = new Map(routes.map((route) => [route.id, route]));
  const virtualElevationGainM = completedSessions.reduce((sum, session) => sum + (routeById.get(session.routeId ?? "")?.elevationGainM ?? 0), 0);

  const pbImprovementsByRoute = new Map<string, number>();
  const timeAttacks = sessions
    .filter((session) => isRouteCompleted(session) && session.metrics?.timeAttack && Number.isFinite(session.metrics.elapsedSeconds) && (session.metrics.elapsedSeconds ?? 0) > 0)
    .sort((a,b) => a.date.localeCompare(b.date));

  const bestByRoute = new Map<string, number>();
  timeAttacks.forEach((session) => {
    const routeId = session.routeId!;
    const elapsed = session.metrics!.elapsedSeconds!;
    const best = bestByRoute.get(routeId);
    if (best !== undefined && elapsed < best) {
      pbImprovementsByRoute.set(routeId, (pbImprovementsByRoute.get(routeId) ?? 0) + 1);
    }
    if (best === undefined || elapsed < best) bestByRoute.set(routeId, elapsed);
  });

  return {
    completedRouteIds,
    uniqueRoutes: completedRouteIds.size,
    totalRouteCompletions: completedSessions.length,
    virtualElevationGainM,
    challengeSuccesses: challengeSuccesses.length,
    uniqueChallenges: uniqueChallenges.size,
    timeAttackAttempts: timeAttacks.length,
    pbImprovements: [...pbImprovementsByRoute.values()].reduce((sum, value) => sum + value, 0)
  };
}

export function collectionProgress(collection: RouteCollection, completedRouteIds: Set<string>) {
  const completed = collection.routeIds.filter((id) => completedRouteIds.has(id)).length;
  return {
    completed,
    total: collection.routeIds.length,
    percent: Math.round((completed / Math.max(1, collection.routeIds.length)) * 100),
    unlocked: completed === collection.routeIds.length
  };
}
