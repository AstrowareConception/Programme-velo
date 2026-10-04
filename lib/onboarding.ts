import type { AppState, CompletedSession, Guidance, WorkoutTemplate } from "./types";

export function initialGuidance(): Guidance {
  return { version: 1, status: "setup", step: 0, experience: "beginner", goal: "habit", sessionMinutes: 15, weeklySessions: 2 };
}

export function normalizeGuidance(value: unknown): Guidance | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const raw = value as Record<string, unknown>;
  if (raw.version !== 1 || typeof raw.status !== "string" || !["setup", "active", "dismissed"].includes(raw.status)) return undefined;
  const base = initialGuidance();
  return {
    ...base,
    status: raw.status as Guidance["status"],
    step: [0, 1, 2, 3].includes(raw.step as number) ? raw.step as Guidance["step"] : 0,
    experience: raw.experience === "regular" ? "regular" : "beginner",
    goal: typeof raw.goal === "string" && ["habit", "endurance", "explore"].includes(raw.goal) ? raw.goal as Guidance["goal"] : base.goal,
    sessionMinutes: [15, 25, 30].includes(raw.sessionMinutes as number) ? raw.sessionMinutes as Guidance["sessionMinutes"] : 15,
    weeklySessions: [2, 3, 4].includes(raw.weeklySessions as number) ? raw.weeklySessions as Guidance["weeklySessions"] : 2
  };
}

export function guidanceSessions(state: AppState, now = new Date()): CompletedSession[] {
  return state.sessions.filter((session) =>
    !session.bonus && session.duration >= 10 &&
    Number.isFinite(new Date(session.date).getTime()) && new Date(session.date) <= now &&
    session.metrics?.segmentAttackIndex === undefined &&
    session.metrics?.completedRoute !== false && session.metrics?.completedWorkout !== false
  ).sort((a, b) => b.date.localeCompare(a.date));
}

// The normal coach retains its charge rules. During discovery, it selects from
// comfortable formats that fit the chosen slot; existing accounts are unchanged.
export function guidanceCandidates(state: AppState, workouts: WorkoutTemplate[], availableMinutes = state.guidance?.sessionMinutes ?? 35, now = new Date()) {
  const guide = state.guidance;
  if (!guide || guide.status !== "active") return workouts;
  const sessions = guidanceSessions(state, now);
  const recent = sessions.filter((session) => now.getTime() - new Date(session.date).getTime() <= 7 * 86_400_000);
  const uncomfortable = recent.some((session) => typeof session.rpe === "number" && session.rpe >= 8);
  const easyOnly = sessions.length < 3 || uncomfortable;
  const avoidHard = guide.experience === "beginner" && sessions.length < 6;
  const candidates = workouts.filter((workout) => !workout.bonus && workout.id !== "free-ride" &&
    workout.duration <= availableMinutes &&
    (!easyOnly || workout.intensity === "easy") && (!avoidHard || workout.intensity !== "hard"));
  return candidates.length ? candidates : workouts.filter((workout) => workout.id === "first-pedals-15");
}

export function firstGuidedWorkout(workouts: WorkoutTemplate[]) {
  const workout = workouts.find((item) => item.id === "first-pedals-15");
  if (!workout) throw new Error("La séance de premiers pas est manquante.");
  return workout;
}
