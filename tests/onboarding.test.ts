import { describe, expect, it } from "vitest";
import { emptyState, workouts } from "../lib/data";
import { initialGuidance, normalizeGuidance, guidanceSessions, guidanceCandidates, firstGuidedWorkout } from "../lib/onboarding";
import { normalizeState, createBackup, parseBackup } from "../lib/storage";
import { recommendAdaptiveWorkout } from "../lib/coach";
import type { CompletedSession } from "../lib/types";

const now = new Date("2026-10-04T12:00:00Z");
const session = (patch: Partial<CompletedSession> = {}): CompletedSession => ({ id: "one", templateId: "first-pedals-15", date: "2026-10-03T18:00:00Z", duration: 15, xp: 25, points: 1, kind: "recovery", intensity: "easy", bonus: false, rpe: 3, ...patch });

describe("progressive onboarding", () => {
  it("starts only fresh accounts, and preserves legacy profiles and histories", () => {
    expect(emptyState().guidance?.status).toBe("setup");
    const legacy = normalizeState({ profile: { name: "Ancien", startDate: "2026-09-01" }, sessions: [session()] });
    expect(legacy.guidance).toBeUndefined();
    expect(legacy.sessions).toEqual([session()]);
    expect(guidanceCandidates(legacy, workouts)).toBe(workouts);
  });
  it("preserves a partial guide and settings in v3 export/import", () => {
    const state = emptyState();
    state.guidance = { ...initialGuidance(), step: 2, goal: "explore", sessionMinutes: 25, weeklySessions: 3 };
    state.profile.name = "Nouveau";
    const restored = parseBackup(JSON.stringify(createBackup(state, []))).state;
    expect(restored.guidance).toEqual(state.guidance);
    expect(restored.profile).toEqual(state.profile);
    expect(restored.preferences).toEqual(state.preferences);
  });
  it("rejects unknown guide versions and repairs invalid preferences", () => {
    expect(normalizeGuidance({ version: 2, status: "setup" })).toBeUndefined();
    expect(normalizeGuidance({ version: 1, status: ["active"] })).toBeUndefined();
    const fixed = normalizeGuidance({ version: 1, status: "active", step: 99, sessionMinutes: -1, weeklySessions: Infinity, goal: ["explore"] });
    expect(fixed).toEqual({ ...initialGuidance(), status: "active" });
  });
  it("counts full sessions, not bonuses, sectors, incomplete attempts or future entries, and recomputes after deletion", () => {
    const state = emptyState();
    state.sessions = [session(), session({ id: "old-manual", metrics: { source: "manual" } }),
      session({ bonus: true }), session({ duration: 5 }), session({ date: "2030-01-01T00:00:00Z" }),
      session({ date: "invalid" }), session({ metrics: { source: "manual", completedWorkout: false } }),
      session({ metrics: { source: "manual", completedRoute: false } }),
      session({ metrics: { source: "manual", segmentAttackIndex: 0, completedRoute: true } })];
    expect(guidanceSessions(state, now).map((item) => item.id)).toEqual(["one", "old-manual"]);
    state.sessions = state.sessions.filter((item) => item.id !== "one");
    expect(guidanceSessions(state, now)).toHaveLength(1);
  });
  it("offers a genuine 15 minute structured session and respects short slots despite hard energy", () => {
    const first = firstGuidedWorkout(workouts);
    expect(first.bonus).toBeUndefined();
    expect(first.segments.reduce((sum, segment) => sum + segment.minutes, 0)).toBe(15);
    const state = emptyState(); state.guidance!.status = "active";
    const candidates = guidanceCandidates(state, workouts, 15, now);
    expect(candidates.every((workout) => workout.intensity === "easy" && workout.duration <= 15)).toBe(true);
    const recommendation = recommendAdaptiveWorkout({ state, workouts: candidates, availableMinutes: 15, energy: "hard", now,
      target: { week: 1, points: 2, minutes: 30, sessions: 2, variety: 1, maxHard: 1 }, weekly: { sessions: 0, points: 0, minutes: 0, hard: 0, variety: 0 } });
    expect(recommendation.workout.id).toBe("first-pedals-15");
    expect(recommendation.load).toBe("recovery");
    expect(recommendation.suggestedResistanceDelta).toBe(0);
  });
  it("introduces moderate formats progressively and falls back to easy after high effort", () => {
    const state = emptyState(); state.guidance = { ...initialGuidance(), status: "active", sessionMinutes: 30 };
    state.sessions = Array.from({ length: 3 }, (_, i) => session({ id: String(i) }));
    expect(guidanceCandidates(state, workouts, 45, now).some((workout) => workout.intensity === "moderate")).toBe(true);
    expect(guidanceCandidates(state, workouts, 45, now).some((workout) => workout.intensity === "hard")).toBe(false);
    state.sessions.push(session({ id: "high-rpe", rpe: 9 }));
    expect(guidanceCandidates(state, workouts, 45, now).every((workout) => workout.intensity === "easy")).toBe(true);
    state.guidance.status = "dismissed";
    expect(guidanceCandidates(state, workouts)).toBe(workouts);
  });
});
