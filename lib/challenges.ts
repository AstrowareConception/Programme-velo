import type { ChallengeResult, TimeAttackSplit } from "./types";
import type { ClimbChallenge } from "./routes";
import { routeCategory } from "./routes";

export type ChallengeKind =
  | "no_pause"
  | "cadence_floor"
  | "negative_split"
  | "final_quarter"
  | "beat_pb"
  | "beat_pb_2pct"
  | "progressive_quarters"
  | "stage_finish";

export type RouteChallenge = {
  id: string;
  kind: ChallengeKind;
  title: string;
  description: string;
  icon: string;
  baseMode: "training" | "timeAttack";
  xpBonus: number;
  target?: number;
  requiresPb?: boolean;
  requiresCadence?: boolean;
  stagesOnly?: boolean;
};

export type ChallengeContext = {
  route: ClimbChallenge;
  completedRoute: boolean;
  pauseCount: number;
  avgCadenceRpm?: number;
  elapsedSeconds?: number;
  pbBeforeSeconds?: number;
  checkpointSplits?: TimeAttackSplit[];
};

export const routeChallenges: RouteChallenge[] = [
  {
    id: "no-pause",
    kind: "no_pause",
    title: "Sans poser pied",
    description: "Termine le parcours sans mettre la séance en pause.",
    icon: "⏯",
    baseMode: "training",
    xpBonus: 60
  },
  {
    id: "cadence-80",
    kind: "cadence_floor",
    title: "Métronome",
    description: "Termine le parcours avec au moins 80 RPM de cadence moyenne.",
    icon: "🔁",
    baseMode: "training",
    xpBonus: 80,
    target: 80,
    requiresCadence: true
  },
  {
    id: "negative-split",
    kind: "negative_split",
    title: "Negative split",
    description: "Parcours la seconde moitié plus vite que la première.",
    icon: "📉",
    baseMode: "timeAttack",
    xpBonus: 110
  },
  {
    id: "final-quarter",
    kind: "final_quarter",
    title: "Finisseur",
    description: "Fais les 25 derniers % plus vite que le quart précédent.",
    icon: "⚔️",
    baseMode: "timeAttack",
    xpBonus: 100
  },
  {
    id: "beat-pb",
    kind: "beat_pb",
    title: "Chasseur de PB",
    description: "Bats ton record personnel sur ce parcours.",
    icon: "👻",
    baseMode: "timeAttack",
    xpBonus: 140,
    requiresPb: true
  },
  {
    id: "progressive-quarters",
    kind: "progressive_quarters",
    title: "Pacing progressif",
    description: "Chaque quart du parcours doit être plus rapide que le précédent.",
    icon: "📈",
    baseMode: "timeAttack",
    xpBonus: 130
  },
  {
    id: "beat-pb-2pct",
    kind: "beat_pb_2pct",
    title: "Briseur de record",
    description: "Améliore ton record personnel d’au moins 2 %.",
    icon: "💥",
    baseMode: "timeAttack",
    xpBonus: 180,
    requiresPb: true
  },
  {
    id: "stage-finish",
    kind: "stage_finish",
    title: "Grand fond",
    description: "Va au bout de l’étape multi-cols.",
    icon: "🏔️",
    baseMode: "training",
    xpBonus: 160,
    stagesOnly: true
  }
];

export function challengesForRoute(route: ClimbChallenge, hasPb: boolean) {
  return routeChallenges.filter((challenge) => {
    if (challenge.requiresPb && !hasPb) return false;
    if (challenge.stagesOnly && routeCategory(route) !== "stage") return false;
    return true;
  });
}

function splitAt(splits: TimeAttackSplit[] | undefined, ratio: number, routeDistanceKm: number) {
  if (!splits?.length) return undefined;
  const target = routeDistanceKm * ratio;
  return [...splits].sort((a,b) => Math.abs(a.km-target) - Math.abs(b.km-target))[0];
}

export function evaluateRouteChallenge(challenge: RouteChallenge, context: ChallengeContext): ChallengeResult {
  const fail = (summary: string): ChallengeResult => ({ id: challenge.id, success: false, summary, xpBonus: 0 });
  const success = (summary: string): ChallengeResult => ({ id: challenge.id, success: true, summary, xpBonus: challenge.xpBonus });

  if (!context.completedRoute) return fail("Parcours non terminé.");

  switch (challenge.kind) {
    case "no_pause":
      return context.pauseCount === 0
        ? success("Parcours terminé sans pause.")
        : fail(`${context.pauseCount} pause${context.pauseCount > 1 ? "s" : ""} enregistrée${context.pauseCount > 1 ? "s" : ""}.`);

    case "cadence_floor": {
      if (context.avgCadenceRpm === undefined) return fail("Cadence moyenne non disponible.");
      const target = challenge.target ?? 80;
      return context.avgCadenceRpm >= target
        ? success(`${Math.round(context.avgCadenceRpm)} RPM de moyenne, objectif ${target} atteint.`)
        : fail(`${Math.round(context.avgCadenceRpm)} RPM de moyenne, objectif ${target}.`);
    }

    case "negative_split": {
      if (context.elapsedSeconds === undefined) return fail("Chrono final non disponible.");
      const half = splitAt(context.checkpointSplits, 0.5, context.route.distanceKm);
      if (!half) return fail("Split 50 % non disponible.");
      const firstHalf = half.elapsedSeconds;
      const secondHalf = context.elapsedSeconds - firstHalf;
      return secondHalf < firstHalf
        ? success(`2e moitié plus rapide de ${Math.round(firstHalf-secondHalf)} s.`)
        : fail(`2e moitié plus lente de ${Math.round(secondHalf-firstHalf)} s.`);
    }

    case "final_quarter": {
      if (context.elapsedSeconds === undefined) return fail("Chrono final non disponible.");
      const half = splitAt(context.checkpointSplits, 0.5, context.route.distanceKm);
      const threeQuarter = splitAt(context.checkpointSplits, 0.75, context.route.distanceKm);
      if (!half || !threeQuarter) return fail("Splits 50/75 % non disponibles.");
      const previousQuarter = threeQuarter.elapsedSeconds - half.elapsedSeconds;
      const finalQuarter = context.elapsedSeconds - threeQuarter.elapsedSeconds;
      return finalQuarter < previousQuarter
        ? success(`Dernier quart plus rapide de ${Math.round(previousQuarter-finalQuarter)} s.`)
        : fail(`Dernier quart plus lent de ${Math.round(finalQuarter-previousQuarter)} s.`);
    }

    case "beat_pb":
      if (context.elapsedSeconds === undefined) return fail("Chrono final non disponible.");
      if (context.pbBeforeSeconds === undefined) return fail("Aucun record de référence.");
      return context.elapsedSeconds < context.pbBeforeSeconds
        ? success(`PB amélioré de ${Math.round(context.pbBeforeSeconds-context.elapsedSeconds)} s.`)
        : fail(`Il manque ${Math.round(context.elapsedSeconds-context.pbBeforeSeconds)} s pour battre le PB.`);

    case "beat_pb_2pct": {
      if (context.elapsedSeconds === undefined) return fail("Chrono final non disponible.");
      if (context.pbBeforeSeconds === undefined) return fail("Aucun record de référence.");
      const target = context.pbBeforeSeconds * 0.98;
      return context.elapsedSeconds <= target
        ? success(`PB amélioré de ${((1-context.elapsedSeconds/context.pbBeforeSeconds)*100).toFixed(1)} %.`)
        : fail(`Objectif : ${Math.round(target)} s ou mieux.`);
    }

    case "progressive_quarters": {
      if (context.elapsedSeconds === undefined) return fail("Chrono final non disponible.");
      const q1 = splitAt(context.checkpointSplits, 0.25, context.route.distanceKm);
      const q2 = splitAt(context.checkpointSplits, 0.5, context.route.distanceKm);
      const q3 = splitAt(context.checkpointSplits, 0.75, context.route.distanceKm);
      if (!q1 || !q2 || !q3) return fail("Splits 25/50/75 % non disponibles.");
      const durations = [
        q1.elapsedSeconds,
        q2.elapsedSeconds - q1.elapsedSeconds,
        q3.elapsedSeconds - q2.elapsedSeconds,
        context.elapsedSeconds - q3.elapsedSeconds
      ];
      const progressive = durations.every((value, index) => index === 0 || value < durations[index - 1]);
      return progressive
        ? success("Chaque quart a été plus rapide que le précédent.")
        : fail("Tous les quarts ne sont pas progressivement plus rapides.");
    }

    case "stage_finish":
      return routeCategory(context.route) === "stage"
        ? success("Étape multi-cols terminée.")
        : fail("Ce défi est réservé aux étapes multi-cols.");
  }
}
