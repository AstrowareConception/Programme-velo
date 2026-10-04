import type { Badge, CompletedSession } from "./types";
import { discoveryWorkouts } from "./discovery-workouts";

export const workoutPrograms = [
  { id: "find-your-rhythm", title: "Trouver son rythme", icon: "🌱", description: "Quatre séances faciles, de 15 à 30 minutes, pour découvrir le souffle et la cadence.", workoutIds: ["first-pedals-15", "breathing-18", "contemplative-25", "fluid-cadence-30"], xpBonus: 120 },
  { id: "first-undulations", title: "Premières ondulations", icon: "〰️", description: "Des faux-plats aux petites collines : trois séances à choisir lorsque le pédalage facile est confortable.", workoutIds: ["false-flats-20", "two-hills-25", "little-waves-40"], xpBonus: 160 },
  { id: "fluid-regularity", title: "Souplesse et régularité", icon: "🪶", description: "Trois séances faciles pour varier la cadence et installer un rythme régulier.", workoutIds: ["soft-cadence-20", "nomadic-endurance-30", "fluid-cadence-30"], xpBonus: 140 }
];
type Program = typeof workoutPrograms[number];

export function workoutProgramProgress(program: Program, sessions: CompletedSession[], now = new Date()) {
  const completedIds = new Set(sessions.filter((session) => {
    const template = discoveryWorkouts.find((workout) => workout.id === session.templateId);
    const time = Date.parse(session.date);
    return template && !template.bonus && !session.bonus && !session.routeId &&
      session.metrics?.segmentAttackIndex === undefined && !session.metrics?.timeAttack &&
      Number.isFinite(time) && time <= now.getTime() &&
      (session.metrics?.completedWorkout === true || (session.metrics?.completedWorkout === undefined && session.duration >= template.duration));
  }).map((session) => session.templateId));
  const count = program.workoutIds.filter((id) => completedIds.has(id)).length;
  return { completedIds, count, total: program.workoutIds.length, complete: count === program.workoutIds.length,
    nextWorkoutId: program.workoutIds.find((id) => !completedIds.has(id)) };
}

export function workoutProgramBonusXp(sessions: CompletedSession[]) {
  return workoutPrograms.reduce((sum, program) => sum + (workoutProgramProgress(program, sessions).complete ? program.xpBonus : 0), 0);
}

export function workoutProgramBadges(sessions: CompletedSession[]): Badge[] {
  return workoutPrograms.map((program) => {
    const progress = workoutProgramProgress(program, sessions);
    return { id: `program-${program.id}`, name: program.title, icon: program.icon,
      description: `Terminer les ${progress.total} séances différentes du programme, dans l’ordre de ton choix. Récompense unique : ${program.xpBonus} XP.`,
      unlocked: progress.complete, progress: `${progress.count}/${progress.total}` };
  });
}
