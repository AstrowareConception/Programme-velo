import { expect, it } from "vitest";
import { emptyState, weeklyStats, workouts } from "../lib/data";
import { shortWorkouts } from "../lib/short-workouts";
import { createBackup, parseBackup } from "../lib/storage";

it("awards every catalog workout and applies the short-session difficulty scale", () => {
  expect(workouts.every(w => w.points >= 0.5)).toBe(true);
  for (const w of workouts.filter(w => w.duration >= 10 && w.duration <= 20)) {
    expect(w.points, w.id).toBe(w.intensity === "easy" ? 0.5 : w.intensity === "hard" && w.duration === 20 ? 2 : 1);
  }
});

it("adds eight unique complete short workouts with easy opening and closing segments", () => {
  expect(shortWorkouts).toHaveLength(8);
  expect(new Set(workouts.map(w => w.id)).size).toBe(workouts.length);
  for (const w of shortWorkouts) {
    expect(w.duration).toBeGreaterThanOrEqual(10); expect(w.duration).toBeLessThanOrEqual(20);
    expect(w.segments.reduce((sum, s) => sum + s.minutes, 0), w.id).toBe(w.duration);
    expect(w.segments.every(s => s.minutes > 0 && s.resistance && s.rpe && s.cadence)).toBe(true);
    expect(w.segments[0].rpe).toMatch(/^2/); expect(w.segments.at(-1)!.rpe).toMatch(/^[12]/);
    expect(w.bonus).not.toBe(true);
  }
  expect(shortWorkouts.filter(w => w.intensity === "hard").map(w => w.duration)).toEqual([20, 20]);
});

it("sums new bonus points and hard sessions without repricing history, including after backup", () => {
  const state = emptyState(); state.profile.startDate = "2026-10-01";
  const bonus = workouts.find(w => w.bonus && w.duration === 10)!;
  const hard = shortWorkouts.find(w => w.intensity === "hard")!;
  state.sessions = [bonus, hard].map(w => ({ id: w.id, templateId: w.id, date: "2026-10-02T12:00:00Z", duration: w.duration, points: w.points, xp: w.xp, intensity: w.intensity, kind: w.kind, bonus: !!w.bonus }));
  state.sessions.push({ ...state.sessions[0], id: "legacy-zero", points: 0 });
  state.sessions.push({ ...state.sessions[1], id: "legacy-one", points: 1, intensity: "easy" });
  const restored = parseBackup(JSON.stringify(createBackup(state, []))).state;
  expect(restored.sessions.map(s => s.points)).toEqual([0.5, 2, 0, 1]);
  expect(weeklyStats(restored, 1)).toMatchObject({ points: 3.5, sessions: 2, hard: 1, bonuses: 2 });
});
