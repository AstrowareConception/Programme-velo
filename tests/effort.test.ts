import { describe, expect, it } from "vitest";
import { withCadenceOffset, addCadenceInterval, cadenceSummary, emptyCadenceScore, numericRange, resistanceTarget } from "../lib/effort";
const segment = { label: "Col", minutes: 1.5, resistance: "11–15", rpe: "5" };
describe("effort profile", () => {
  it("executes every plateau in the ascent and descent", () => {
    expect(Array.from({ length: 9 }, (_, i) => resistanceTarget(segment, i * 10))).toEqual([11,12,13,14,15,14,13,12,11]);
    expect(resistanceTarget(segment, 90)).toBe(11);
    expect(resistanceTarget({ ...segment, resistance: "libre" }, 20)).toBeUndefined();
    expect(resistanceTarget({ ...segment, resistance: "30–32" }, 45, 4)).toBe(32);
    expect(resistanceTarget({ ...segment, minutes: .1 }, 2)).toBe(11);
    expect(numericRange("80–95")).toEqual([80,95]);
    expect(numericRange("libre")).toBeUndefined();
  });
});
describe("coach score and combos", () => {
  it("weights elapsed time and counts both boundaries, zero and missing data correctly", () => {
    let score = emptyCadenceScore();
    score = addCadenceInterval(score, 0, "80–95", 40, 80);
    score = addCadenceInterval(score, 0, "80–95", 40, 95);
    score = addCadenceInterval(score, 0, "80–95", 20, 0);
    expect(cadenceSummary(score)).toMatchObject({ percent: 80, grade: "B+", coverage: 100 });
    score = addCadenceInterval(score, 0, "80–95", 100);
    expect(cadenceSummary(score)).toMatchObject({ percent: 80, coverage: 50, provisional: true });
    expect(score.comboSeconds).toBe(0);
  });
  it("rewards free cadence and integrates multipliers irrespective of sample rate", () => {
    const one = addCadenceInterval(emptyCadenceScore(), 0, "libre", 40, 60);
    let many = emptyCadenceScore();
    for (let i=0;i<400;i++) many = addCadenceInterval(many, 0, "libre", .1, 60);
    expect(one.points).toBe(1000);
    expect(many.points).toBeCloseTo(one.points);
    expect(one.bestComboSeconds).toBe(40);
    expect(cadenceSummary(one)).toMatchObject({ percent: 100, grade: "S" });
    const missed = addCadenceInterval(one, 1, "80–90", 1, 100);
    expect(missed.comboSeconds).toBe(0);
    expect(missed.bestComboSeconds).toBe(40);
    expect(addCadenceInterval(missed, 1, "80–90", 1, 85).points).toBeCloseTo(1000 + 100 / 6 + 85 / 6);
  });
});

import { bestCadenceAttempt, effortSettingsKey } from "../lib/effort";
import type { CompletedSession } from "../lib/types";
it("compares only matching settings and qualified completed attempts", () => {
  const key = effortSettingsKey("bike", [segment], 0, "training");
  expect(effortSettingsKey("bike", [segment], 1, "training")).not.toBe(key);
  const score = addCadenceInterval(emptyCadenceScore(), 0, "80–90", 60, 85);
  const attempt = { id: "record", metrics: { cadenceSettingsKey: key, cadenceRecordEligible: true, cadenceScore: score } } as CompletedSession;
  expect(bestCadenceAttempt([attempt], key)?.id).toBe("record");
  expect(bestCadenceAttempt([attempt], "other")).toBeUndefined();
  expect(bestCadenceAttempt([{ ...attempt, metrics: { ...attempt.metrics!, cadenceRecordEligible: false } }], key)).toBeUndefined();
});
it("reads sparse segment histories after a JSON round trip", () => {
  const score = addCadenceInterval(emptyCadenceScore(), 2, "libre", 65, 70);
  expect(cadenceSummary(JSON.parse(JSON.stringify(score)))).toMatchObject({ percent: 100, measuredSeconds: 65 });
});

it("adapts cadence without touching free segments or resistance and changes the record settings", () => {
 const workout = { id: "bonus", name: "Bonus", tagline: "", description: "", kind: "bonus" as const, intensity: "easy" as const, duration: 2, points: 0, xp: 0, segments: [{...segment, cadence: "80–90"}, {...segment, cadence: "libre"}] };
 const soft = withCadenceOffset(workout, -15);
 expect(soft.segments[0].cadence).toBe("65–75");
 expect(soft.segments[1].cadence).toBe("libre");
 expect(soft.segments[0].resistance).toBe("11–15");
 expect(workout.segments[0].cadence).toBe("80–90");
 expect(withCadenceOffset(workout, 10).segments[0].cadence).toBe("90–100");
});

it("V2 separates cadence points, target combo and grade", () => {
 const slow = addCadenceInterval(emptyCadenceScore(), 0, "60–80", 60, 60);
 const fast = addCadenceInterval(emptyCadenceScore(), 0, "60–80", 60, 75);
 expect(fast.points).toBe(slow.points * 1.25);
 expect(cadenceSummary(fast).grade).toBe(cadenceSummary(slow).grade);
 const outside = addCadenceInterval(fast, 0, "60–80", 10, 90);
 expect(outside.points - fast.points).toBe(150);
 expect(outside.comboSeconds).toBe(0);
 const stopped = addCadenceInterval(outside, 0, "libre", 10, 0);
 expect(stopped.points).toBe(outside.points);
 expect(addCadenceInterval(stopped, 0, "libre", 5).points).toBe(stopped.points);
});
it("ranks V2 points rather than grade, excludes V1 even with a matching key", () => {
 const key = effortSettingsKey("test", [segment], 0, "training");
 const base = addCadenceInterval(emptyCadenceScore(), 0, "60–80", 100, 60);
 const entry = (id: string, score: typeof base) => ({ id, metrics: { cadenceScore: score, cadenceRecordEligible: true, cadenceSettingsKey: key } } as CompletedSession);
 const high = { ...base, points: base.points + 20, segments: [{ eligibleSeconds: 100, measuredSeconds: 100, onTargetSeconds: 95 }] };
 expect(bestCadenceAttempt([entry("S", base), entry("A+", high), entry("old", {...high, version: 1, points: 999999})], key)?.id).toBe("A+");
});
