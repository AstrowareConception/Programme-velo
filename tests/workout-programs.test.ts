import { describe, expect, it } from "vitest";
import { workoutPrograms, workoutProgramProgress, workoutProgramBonusXp } from "../lib/workout-programs";
import { discoveryWorkouts } from "../lib/discovery-workouts";
import { badges, emptyState, totalXp, weeklyStats, workouts } from "../lib/data";
import { createBackup, parseBackup } from "../lib/storage";
import type { CompletedSession } from "../lib/types";

function completed(id: string, metrics: CompletedSession["metrics"] = { source: "manual", completedWorkout: true }): CompletedSession {
  const workout = discoveryWorkouts.find((item) => item.id === id)!;
  return { id, templateId: id, date: "2026-10-03T10:00:00Z", duration: workout.duration, points: workout.points, xp: workout.xp,
    kind: workout.kind, intensity: workout.intensity, bonus: Boolean(workout.bonus), metrics };
}

describe("flexible discovery programmes", () => {
  it("has coherent guided workouts and no bonus or unknown template in a programme", () => {
    expect(discoveryWorkouts).toHaveLength(11);
    discoveryWorkouts.forEach((workout) => expect(workout.segments.reduce((sum, segment) => sum+segment.minutes, 0)).toBe(workout.duration));
    for (const program of workoutPrograms) {
      expect(new Set(program.workoutIds).size).toBe(program.workoutIds.length);
      program.workoutIds.forEach((id) => { const workout = workouts.find(w => w.id === id); expect(workout).toBeDefined(); expect(workout?.bonus).not.toBe(true); });
    }
  });
  it("marks the actual completed workout out of order and ignores repeated discoveries", () => {
    const program = workoutPrograms[0];
    const progress = workoutProgramProgress(program, [completed(program.workoutIds[3]), completed(program.workoutIds[3])]);
    expect(progress.count).toBe(1); expect(progress.completedIds.has(program.workoutIds[0])).toBe(false);
    expect(progress.completedIds.has(program.workoutIds[3])).toBe(true); expect(progress.nextWorkoutId).toBe(program.workoutIds[0]);
  });
  it("rejects partial workouts, bonus, sectors, route attempts and invalid or future dates", () => {
    const program = workoutPrograms[0]; const id = program.workoutIds[0];
    const sessions = [completed(id, { source: "manual", completedWorkout: false }),
      completed(id, { source: "manual", completedWorkout: true, segmentAttackIndex: 0 }),
      completed(id, { source: "manual", completedWorkout: true, timeAttack: true }),
      { ...completed(id), routeId: "unrelated-route" }, { ...completed(id), bonus: true },
      { ...completed(id), date: "invalid" }, { ...completed(id), date: "2099-01-01T00:00:00Z" },
      completed("bonus-pause-8")];
    expect(workoutProgramProgress(program, sessions).count).toBe(0);
    expect(workoutProgramBonusXp(sessions)).toBe(0);
  });
  it("accepts legacy complete durations without promoting legacy partial sessions", () => {
    const program = workoutPrograms[0]; const legacy = completed(program.workoutIds[0], undefined); delete legacy.metrics;
    expect(workoutProgramProgress(program, [legacy]).count).toBe(1);
    expect(workoutProgramProgress(program, [{ ...legacy, duration: 5 }]).count).toBe(0);
  });
  it("grants one programme bonus, preserves it when deleting a repeat, and removes it after the last required completion", () => {
    const program = workoutPrograms[0]; const state = emptyState(); state.sessions = program.workoutIds.map((id) => completed(id));
    expect(workoutProgramBonusXp(state.sessions)).toBe(120); const xp = totalXp(state);
    state.sessions.push({ ...completed(program.workoutIds[0]), id: "repeat" });
    expect(totalXp(state)).toBe(xp+25); expect(workoutProgramBonusXp(state.sessions)).toBe(120);
    const imported = parseBackup(JSON.stringify(createBackup(state, []))).state;
    expect(badges(imported).find((badge) => badge.id === "program-find-your-rhythm")?.unlocked).toBe(true);
    state.sessions = state.sessions.filter((session) => session.id !== "repeat");
    expect(workoutProgramBonusXp(state.sessions)).toBe(120);
    state.sessions = state.sessions.filter((session) => session.templateId !== program.workoutIds[0]);
    expect(totalXp(state)).toBe(xp-25-120); expect(workoutProgramBonusXp(state.sessions)).toBe(0);
  });
  it("keeps the eight-minute bonus in the shared weekly cap while awarding points without structured sessions or programme completion", () => {
    const state = emptyState(); state.profile.startDate = "2026-10-01";
    state.sessions = Array.from({ length: 8 }, (_, i) => ({ ...completed("bonus-pause-8"), id: String(i) }));
    expect(totalXp(state)).toBe(60); expect(weeklyStats(state, 1).points).toBe(4); expect(weeklyStats(state, 1).sessions).toBe(0); expect(workoutProgramBonusXp(state.sessions)).toBe(0);
  });
});
