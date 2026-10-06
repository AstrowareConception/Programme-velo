import { expect, it } from "vitest";
import { expressWorkouts } from "../lib/express-workouts";
import { parseVoiceCommand } from "../lib/voice-commands";
import { workouts } from "../lib/data";
it("provides complete short workouts at all intensities with unique stable IDs", () => {
  expect(expressWorkouts).toHaveLength(8);
  expect(new Set(workouts.map(w => w.id)).size).toBe(workouts.length);
  expect(new Set(expressWorkouts.map(w => w.intensity))).toEqual(new Set(["easy", "moderate", "hard"]));
  for (const w of expressWorkouts) {
    expect(w.duration).toBeGreaterThanOrEqual(3); expect(w.duration).toBeLessThan(10);
    expect(w.segments.reduce((sum, s) => sum + s.minutes, 0)).toBeCloseTo(w.duration);
    expect(w.segments.every(s => s.minutes > 0)).toBe(true);
    expect(w.segments.at(-1)?.rpe).toMatch(/1|2/);
    if (w.intensity === "hard") { expect(w.bonus).not.toBe(true); expect(w.segments[0].minutes).toBeGreaterThanOrEqual(3); }
  }
});
it("requires a complete explicit command and rejects ambient, negated and compound phrases", () => {
  expect(parseVoiceCommand("Vélo, allège !")).toBe("lighter");
  expect(parseVoiceCommand("VÉLO RENFORCE")).toBe("harder");
  expect(parseVoiceCommand("vélo pause")).toBe("pause");
  expect(parseVoiceCommand("Velo reprends.")).toBe("resume");
  for (const text of ["allège", "ne renforce pas", "vélo ne renforce pas", "vélo allège puis renforce", "vélo termine", "on parle du vélo pause"]) expect(parseVoiceCommand(text)).toBeUndefined();
});
