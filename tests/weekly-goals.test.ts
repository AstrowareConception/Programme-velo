import { describe, expect, it } from "vitest";
import { changeWeeklyGoals, emptyState, normalizeWeeklyGoals, personalWeekTarget, weekTargetFor, weekTargets, workouts, weeklyStats } from "../lib/data";
import { createBackup, parseBackup } from "../lib/storage";
describe("personal weekly goals", () => {
  it("defaults to four half-hour sessions without increasing the volume", () => {
    const state = emptyState();
    expect(weekTargetFor(state, 1)).toMatchObject({ sessions: 4, minutes: 120, points: 8, variety: 3 });
    expect(weekTargetFor(state, 11).minutes).toBe(120);
    expect(personalWeekTarget(1, 5, 25)).toMatchObject({ sessions: 5, minutes: 125, points: 10 });
  });
  it("freezes past legacy targets during migration and subsequent edits", () => {
    const migrated = normalizeWeeklyGoals(undefined, 3);
    expect(migrated[0]).toEqual(weekTargets[0]); expect(migrated[1]).toEqual(weekTargets[1]);
    expect(migrated[2].minutes).toBe(120);
    const state = { ...emptyState(), weeklyGoals: migrated };
    const changed = changeWeeklyGoals(state, 3, 5, 25);
    expect(changed.weeklyGoals!.slice(0,2)).toEqual(migrated.slice(0,2));
    expect(changed.weeklyGoals![2].minutes).toBe(125);
    expect(changed.sessions).toBe(state.sessions);
    expect(normalizeWeeklyGoals(changed.weeklyGoals, 4)).toEqual(changed.weeklyGoals);
  });
  it("retains goals in backup and replaces invalid targets", () => {
    const state = changeWeeklyGoals(emptyState(), 1, 5, 25);
    const backup = createBackup(state, []);
    expect(parseBackup(JSON.stringify(backup)).state.weeklyGoals).toEqual(state.weeklyGoals);
    expect(normalizeWeeklyGoals([{ week: 1, minutes: -5 }], 1)[0].minutes).toBe(120);
  });
});

it("keeps half points through weekly totals and backup without repricing previous sessions", () => {
  const state = emptyState(); state.profile.startDate = "2026-10-01";
  const w = workouts.find(w => w.id === "express-reset-3")!;
  state.sessions = [0,1].map(i => ({id:String(i), templateId:w.id,date:"2026-10-02T12:00:00Z",duration:w.duration,points:w.points,xp:w.xp,intensity:w.intensity,kind:w.kind,bonus:false}));
  state.sessions.push({...state.sessions[0],id:"historic",points:2});
  expect(weeklyStats(state,1).points).toBe(3);
  const restored = parseBackup(JSON.stringify(createBackup(state,[]))).state;
  expect(restored.sessions.map(s => s.points)).toEqual([0.5,0.5,2]);
  expect(weeklyStats(restored,1).points).toBe(3);
});
it("makes short sessions complements and values sustained easy sessions", () => {
  expect(workouts.filter(w => w.duration < 10).every(w => w.points <= 0.5)).toBe(true);
  expect(workouts.find(w => w.id === "calories-10")!.points).toBe(1);
  expect(workouts.filter(w => !w.bonus && w.intensity === "easy" && w.duration >= 25 && w.duration <= 30).every(w => w.points === 2)).toBe(true);
  expect(workouts.filter(w => w.bonus).every(w => w.points === 0.5)).toBe(true);
});
