import { recentFeedback, targetRpe } from "./adaptive-program";
import type { AppState, WeekTarget, WorkoutTemplate } from "./types";
import { guidanceSessions } from "./onboarding";

export type CoachEnergy = "easy" | "normal" | "hard";

export type CoachWeeklyState = {
  sessions: number;
  minutes: number;
  points: number;
  hard: number;
  variety: number;
};

export type CoachRecommendation = {
  workout: WorkoutTemplate;
  reasons: string[];
  load: "recovery" | "balanced" | "push";
  personalization: "initial" | "learning" | "personalized";
  suggestedResistanceDelta: -1 | 0 | 1;
};

function hoursAgo(iso: string, now: Date) {
  return Math.max(0, (now.getTime() - new Date(iso).getTime()) / 3_600_000);
}

function intensityRank(workout: WorkoutTemplate) {
  return workout.intensity === "hard" ? 3 : workout.intensity === "moderate" ? 2 : 1;
}

function average(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : undefined;
}

export function recommendAdaptiveWorkout({
  state,
  workouts,
  target,
  weekly,
  availableMinutes,
  energy,
  now = new Date()
}: {
  state: AppState;
  workouts: WorkoutTemplate[];
  target: WeekTarget;
  weekly: CoachWeeklyState;
  availableMinutes: number;
  energy: CoachEnergy;
  now?: Date;
}): CoachRecommendation {
  const candidates = workouts.filter((workout) => !workout.bonus && workout.id !== "free-ride");
  if (!candidates.length) throw new Error("Aucune séance structurée disponible.");

  const recent = [...state.sessions]
    .filter((session) => !session.bonus)
    .sort((a,b) => b.date.localeCompare(a.date));
  const last72 = recent.filter((session) => hoursAgo(session.date, now) <= 72);
  const last48Hard = recent.filter((session) => session.intensity === "hard" && hoursAgo(session.date, now) <= 48);
  const recentRpeValues = recent
    .filter((session) => hoursAgo(session.date, now) <= 168 && typeof session.rpe === "number")
    .map((session) => session.rpe as number);
  const avgRecentRpe = average(recentRpeValues);
  const lastTemplateId = recent[0]?.templateId;
  const discovering = state.guidance?.status === "active" && guidanceSessions(state, now).length < 3;

  const feedback = recentFeedback(state, workouts, now);
  const recoveryNeeded =
    feedback.difficult || feedback.returnAfterBreak ||
    discovering ||
    energy === "easy" ||
    last72.length >= 4 ||
    (avgRecentRpe !== undefined && avgRecentRpe >= 8.5) ||
    last48Hard.length >= 2;

  const canPush =
    !recoveryNeeded &&
    energy === "hard" &&
    weekly.hard < target.maxHard &&
    last48Hard.length === 0;

  const desiredRank = recoveryNeeded ? 1 : canPush ? 3 : 2;
  const pointsMissing = Math.max(0, target.points - weekly.points);
  const varietyMissing = Math.max(0, target.variety - weekly.variety);

  const scored = candidates.map((workout) => {
    let score = 0;
    const rank = intensityRank(workout);
    const timeDelta = Math.abs(workout.duration - availableMinutes);

    score += Math.max(-20, 30 - timeDelta);
    if (workout.duration > availableMinutes + 7) score -= 45;
    if (rank === desiredRank) score += 30;
    else score -= Math.abs(rank - desiredRank) * 18;

    if (recoveryNeeded && workout.kind === "recovery") score += 45;
    if (recoveryNeeded && workout.intensity === "hard") score -= 80;
    if (canPush && workout.intensity === "hard") score += 25;
    if (weekly.hard >= target.maxHard && workout.intensity === "hard") score -= 100;
    if (last48Hard.length && workout.intensity === "hard") score -= 55;

    if (workout.id === lastTemplateId) score -= 22;
    if (state.guidance?.status === "active" && state.guidance.goal === "endurance" && workout.kind === "endurance" && !recoveryNeeded) score += 8;
    if (varietyMissing > 0 && !recent.slice(0,6).some((session) => session.kind === workout.kind)) score += 18;
    // Game points never raise training intensity.

    return { workout, score };
  }).sort((a,b) => b.score - a.score);

  const workout = scored[0].workout;
  const reasons: string[] = [];

  if (recoveryNeeded) {
    if (feedback.difficult) reasons.push("Ton ressenti a dépassé les consignes récentes : une séance plus facile est proposée.");
    if (feedback.returnAfterBreak) reasons.push("Après une interruption, retrouve tes repères sans rattrapage.");
    if (discovering) reasons.push("Tes trois premiers repères se construisent avec des séances faciles.");
    if (energy === "easy") reasons.push("Tu as demandé une journée tranquille.");
    if (last72.length >= 4) reasons.push(`${last72.length} séances sur les 72 dernières heures : priorité à l’assimilation.`);
    if (avgRecentRpe !== undefined && avgRecentRpe >= 8.5) reasons.push(`RPE récent élevé (${avgRecentRpe.toFixed(1)}/10).`);
    if (last48Hard.length >= 2) reasons.push("Deux séances dures ont déjà été réalisées en 48 h.");
  } else if (canPush) {
    reasons.push("Tu as de l’énergie et aucune séance dure récente.");
    if (weekly.hard < target.maxHard) reasons.push(`Il reste ${target.maxHard-weekly.hard} créneau${target.maxHard-weekly.hard > 1 ? "x" : ""} intense${target.maxHard-weekly.hard > 1 ? "s" : ""} dans la cible hebdomadaire.`);
  } else {
    reasons.push("Charge actuelle compatible avec une séance soutenue mais contrôlée.");
  }

  if (pointsMissing > 0) reasons.push(`Il reste ${pointsMissing} point${pointsMissing > 1 ? "s" : ""} à valider cette semaine.`);
  if (varietyMissing > 0) reasons.push(`Il manque encore ${varietyMissing} famille${varietyMissing > 1 ? "s" : ""} de séance pour l’objectif de variété.`);
  if (workout.id !== lastTemplateId && lastTemplateId) reasons.push("La recommandation évite de répéter immédiatement la dernière séance.");
  reasons.push(`Le format de ${workout.duration} min correspond au créneau disponible de ${availableMinutes} min.`);

  const sameWorkoutRpe = recent
    .filter((session) => session.templateId === workout.id && typeof session.rpe === "number")
    .slice(0,3)
    .map((session) => session.rpe as number);
  const sameWorkoutAvgRpe = average(sameWorkoutRpe);
  const suggestedResistanceDelta: -1 | 0 | 1 =
    discovering ? 0 :
    sameWorkoutRpe.length >= 2 && sameWorkoutAvgRpe !== undefined && sameWorkoutAvgRpe < (targetRpe(workout) ?? 4) - 1 ? 1 :
    sameWorkoutRpe.length >= 2 && sameWorkoutAvgRpe !== undefined && sameWorkoutAvgRpe > (targetRpe(workout) ?? 4) + 1.5 ? -1 : 0;

  const rpeCount = recent.filter((session) => typeof session.rpe === "number").length;
  const personalization = rpeCount >= 8 ? "personalized" : rpeCount >= 3 ? "learning" : "initial";

  return {
    workout,
    reasons,
    load: recoveryNeeded ? "recovery" : canPush ? "push" : "balanced",
    personalization,
    suggestedResistanceDelta
  };
}
