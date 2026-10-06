import { describe, expect, it } from "vitest";
import { addCadenceInterval, cadenceSummary, emptyCadenceScore, numericRange, resistanceTarget } from "../lib/effort";
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
    const one = addCadenceInterval(emptyCadenceScore(), 0, "libre", 40, 0);
    let many = emptyCadenceScore();
    for (let i=0;i<400;i++) many = addCadenceInterval(many, 0, "libre", .1, 0);
    expect(one.points).toBe(1000);
    expect(many.points).toBeCloseTo(one.points);
    expect(one.bestComboSeconds).toBe(40);
    expect(cadenceSummary(one)).toMatchObject({ percent: 100, grade: "S" });
    const missed = addCadenceInterval(one, 1, "80–90", 1, 100);
    expect(missed.comboSeconds).toBe(0);
    expect(missed.bestComboSeconds).toBe(40);
    expect(addCadenceInterval(missed, 1, "80–90", 1, 85).points).toBe(1010);
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
