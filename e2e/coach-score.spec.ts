import { test, expect } from "@playwright/test";
import { workouts } from "../lib/data";
import { effortSettingsKey } from "../lib/effort";

for (const reducedMotion of [false, true]) test(`comparable record survives saving and celebrates with reduced motion ${reducedMotion}`, async ({ page }, info) => {
  const workout = workouts.find(workout => workout.id === "recovery-30")!;
  const key = effortSettingsKey(workout.id, workout.segments, 0, "training");
  const score = (rate: number) => ({ version: 2, comboSeconds: 0, bestComboSeconds: 300, points: rate * 12000, segments: workout.segments.map(segment => ({ eligibleSeconds: segment.minutes * 60, measuredSeconds: segment.minutes * 60, onTargetSeconds: segment.minutes * 60 * rate })) });
  const history = { id: "old", templateId: workout.id, date: "2026-10-05T17:00:00Z", duration: 30, points: 1, xp: 35, intensity: "easy", kind: "recovery", bonus: false, metrics: { source: "ftms", completedWorkout: true, cadenceScore: score(.8), cadenceSettingsKey: key, cadenceRecordEligible: true } };
  await page.emulateMedia({ reducedMotion: reducedMotion ? "reduce" : "no-preference" });
  await page.addInitScript(({ history, key, score }) => {
    if (!localStorage.getItem("veloquest:v1")) {
      localStorage.setItem("veloquest:v1", JSON.stringify({ profile: { name: "Coach QA", startDate: "2026-10-01" }, sessions: [history, { ...history, id: "other-settings", metrics: { ...history.metrics, cadenceSettingsKey: "different", cadenceScore: score } }], measurements: [], preferences: { soundCues: false, voiceCues: false, haptics: false, cadenceOffset: 0, resistanceOffset: 0 } }));
      localStorage.setItem("veloquest:active-session:v1", JSON.stringify({ version: 1, savedAt: Date.now(), workoutId: "recovery-30", routeMode: "training", segmentIndex: 2, secondsLeft: 0, running: false, sessionStarted: true, showFinish: true, timeAttackElapsedSeconds: 0, timeAttackSplits: [], pauseCount: 0, sessionResistanceDelta: 0, telemetrySamples: [], hadBikeConnection: false, cadenceScore: score, cadenceSettingsKey: key, cadenceSettingsChanged: false }));
    }
  }, { history, key, score: score(1) });
  await page.goto("/");
  await page.getByRole("button", { name: "Reprendre", exact: true }).click();
  const comparison = page.getByRole("status", { name: "Comparaison du suivi" });
  await expect(comparison).toContainText("Nouveau record de score");
  await expect(comparison).toContainText("B+ · 80.0 %");
  await expect(comparison).toContainText("S · 100.0 %");
  await expect(comparison).toContainText("+2400 points");
  if (reducedMotion) expect(await comparison.evaluate(el => getComputedStyle(el).animationName)).toBe("none");
  await page.screenshot({ path: info.outputPath("coach-record.png") });
  await page.getByLabel("J’ai vérifié le bilan et les champs facultatifs.").check();
  await page.getByRole("button", { name: /Valider la quête/ }).click();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("veloquest:v1")!).sessions.length)).toBe(3);
  await page.reload();
  await page.getByRole("button", { name: /Séances/ }).click();
  await page.getByRole("heading", { name: "Décrassage", exact: true }).locator("xpath=ancestor::article").getByRole("button", { name: "Voir / démarrer" }).click();
  await expect(page.locator(".cadenceBest")).toHaveText("Meilleur score à ces réglages : 12000 pts · Note S · 100.0 %");
});
