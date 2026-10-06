import { expect, it } from "vitest";
import { startCalories, sampleCalories, measuredCaloriesEligible, bestCalorieAttempt } from "../lib/calorie-challenge";
import type { CompletedSession } from "../lib/types";
it("subtracts a fresh baseline, requires coverage and excludes energy after the finish", () => {
 let attempt = startCalories(1000, 300, { kcal: 200, at: 1000 }, "Bike");
 for (let t = 6000; t <= 301000; t += 5000) attempt = sampleCalories(attempt, 200 + (t-1000)/5000, t);
 expect(attempt.kcal).toBe(60); expect(measuredCaloriesEligible(attempt)).toBe(true);
 expect(sampleCalories(attempt, 999, 302000).kcal).toBe(60);
 expect(measuredCaloriesEligible(sampleCalories(startCalories(0, 300, {kcal: 200, at: 0}), 230, 300000))).toBe(false);
 expect(startCalories(10000, 300, { kcal: 200, at: 0 }).valid).toBe(false);
});
it("rejects resets and missing end measurements without inventing calories", () => {
 const initial = startCalories(0, 300, { kcal: 200, at: 0 });
 expect(sampleCalories(initial, 0, 5000).valid).toBe(false);
 expect(measuredCaloriesEligible(sampleCalories(initial, 201, 5000))).toBe(false);
 expect(sampleCalories(startCalories(0, 300), 55, 5000).kcal).toBeUndefined();
});
it("keeps duration, device, declared values and incomplete attempts separate", () => {
 const entry = (id: string, source: "manual" | "ftms", kcal: number, deviceName = "Bike", eligible = true) => ({ id, templateId: id.startsWith("ten") ? "calories-10" : "calories-5", metrics: { calorieChallenge: { version: 1, durationSeconds: 300, source, kcal, deviceName, eligible } } } as CompletedSession);
 const rows = [entry("best", "ftms", 40), entry("ten", "ftms", 80), entry("other", "ftms", 90, "Other"), entry("declared", "manual", 100), entry("incomplete", "ftms", 200, "Bike", false)];
 expect(bestCalorieAttempt(rows, "calories-5", "ftms", "Bike")?.id).toBe("best");
 expect(bestCalorieAttempt(rows, "calories-5", "manual")?.id).toBe("declared");
});
