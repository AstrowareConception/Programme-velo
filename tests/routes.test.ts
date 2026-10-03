import { describe, expect, it } from "vitest";
import { resistanceForGrade } from "../lib/routes";

describe("resistanceForGrade", () => {
  it("makes descents easy and steep climbs hard", () => {
    expect(resistanceForGrade(-6)).toBe(5);
    expect(resistanceForGrade(0)).toBe(8);
    expect(resistanceForGrade(4)).toBe(15);
    expect(resistanceForGrade(8)).toBe(23);
    expect(resistanceForGrade(13)).toBe(29);
  });

  it("is monotonic across representative grades", () => {
    const grades = [-8,-4,-1,1,3,5,6,8,9,11,14];
    const levels = grades.map(resistanceForGrade);
    for (let i = 1; i < levels.length; i++) expect(levels[i]).toBeGreaterThanOrEqual(levels[i - 1]);
  });
});
