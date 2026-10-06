import { expect, test, type Page } from "@playwright/test";
import { expressWorkouts } from "../lib/express-workouts";
import { effortSettingsKey, withCadenceOffset } from "../lib/effort";
async function seed(page: Page, sessions: unknown[] = []) {
  await page.addInitScript(sessions => {
    if (!localStorage.getItem("veloquest:v1")) localStorage.setItem("veloquest:v1", JSON.stringify({ profile: { name: "Express QA", startDate: "2026-10-01" }, sessions, measurements: [], preferences: { voiceCues: false, soundCues: false, haptics: false, resistanceOffset: 0, cadenceOffset: -15 } }));
  }, sessions);
}
async function catalog(page: Page) { await page.goto("/"); await page.getByRole("button", { name: /Séances/ }).click(); await page.getByRole("button", { name: "Express · moins de 10 min" }).click(); }
async function launch(page: Page) { await page.getByRole("heading", { name: "Pause active · 3 min", exact: true }).locator("xpath=ancestor::article").getByRole("button", { name: "Voir / démarrer" }).click(); await page.getByRole("button", { name: "Démarrer la séance" }).click(); }
async function speech(page: Page, text: string, final = true) { await page.evaluate(({ text, final }) => (window as any).__recognition.onresult?.({ resultIndex: 0, results: [{ isFinal: final, 0: { transcript: text } }] }), { text, final }); }
test("express filters show all intensities and persist a short workout", async ({ page }) => {
  await seed(page); await catalog(page);
  await expect(page.locator(".workoutCard")).toHaveCount(9);
  await page.getByLabel("Intensité des séances").selectOption("hard"); await expect(page.locator(".workoutCard")).toHaveCount(2);
  await page.getByLabel("Intensité des séances").selectOption("all"); await launch(page);
  await page.getByRole("button", { name: "Terminer et enregistrer", exact: true }).click();
  await page.getByLabel("J’ai vérifié le bilan et les champs facultatifs.").check();
  await page.getByRole("button", { name: /Valider la quête/ }).click();
  await page.reload();
  const sessions = await page.evaluate(() => JSON.parse(localStorage.getItem("veloquest:v1")!).sessions);
  expect(sessions[0].templateId).toBe("express-reset-3"); expect(sessions[0].duration).toBe(3);
});
test("cards show the best comparable grade and exclude unrelated settings", async ({ page }) => {
  const w = expressWorkouts[0];
  const key = effortSettingsKey(w.id, withCadenceOffset(w, -15).segments, 0, "training");
  const score = { version: 1, comboSeconds: 0, bestComboSeconds: 80, points: 1000, segments: [{ eligibleSeconds: 180, measuredSeconds: 180, onTargetSeconds: 171 }] };
  const session = { id: "best", templateId: w.id, date: "2026-10-06T17:00:00Z", duration: 3, points: 1, xp: 10, intensity: "easy", kind: "recovery", bonus: false, metrics: { source: "ftms", cadenceRecordEligible: true, cadenceSettingsKey: key, cadenceScore: score } };
  await seed(page, [session, { ...session, id: "different", metrics: { ...session.metrics, cadenceSettingsKey: "other", cadenceScore: { ...score, segments: [{ eligibleSeconds: 180, measuredSeconds: 180, onTargetSeconds: 180 }] } } }]);
  await catalog(page);
  const card = page.getByRole("heading", { name: w.name, exact: true }).locator("xpath=ancestor::article");
  await expect(card).toContainText("Record coach : A+ · 95.0 %");
  await page.reload(); await page.getByRole("button", { name: /Séances/ }).click(); await expect(card).toContainText("Record coach : A+ · 95.0 %");
});
test("voice commands need opt in, final wake phrases and stop at the finish form", async ({ page }) => {
  await seed(page);
  await page.addInitScript(() => {
    (window as any).__aborts = 0;
    class Recognition {
      onstart?: () => void; onresult?: unknown;
      constructor() { (window as any).__recognition = this; }
      start() { this.onstart?.(); } abort() { (window as any).__aborts++; }
    }
    Object.defineProperty(window, "SpeechRecognition", { configurable: true, value: Recognition });
  });
  await catalog(page); await page.clock.install(); await launch(page);
  expect(await page.evaluate(() => Boolean((window as any).__recognition))).toBe(false);
  await page.getByText("Commandes vocales", { exact: true }).click();
  await page.getByRole("button", { name: "Activer les commandes vocales" }).click();
  const target = page.locator(".sessionEssentials .resistance strong"); await expect(target).toHaveText("2");
  await speech(page, "allège"); await expect(target).toHaveText("2");
  await speech(page, "vélo allège", false); await expect(target).toHaveText("2");
  await speech(page, "vélo allège"); await expect(target).toHaveText("1");
  await speech(page, "vélo renforce"); await expect(target).toHaveText("1");
  await page.clock.runFor(2100); await speech(page, "vélo renforce"); await expect(target).toHaveText("2");
  await page.clock.runFor(2100); await speech(page, "vélo pause"); await expect(page.getByRole("button", { name: "Reprendre", exact: true })).toBeVisible();
  await page.clock.runFor(2100); await speech(page, "vélo reprends"); await expect(page.getByRole("button", { name: "Pause", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Terminer et enregistrer", exact: true }).click();
  expect(await page.evaluate(() => (window as any).__aborts)).toBe(1);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("veloquest:v1")!).sessions)).toHaveLength(0);
});
test("unsupported browsers clearly keep manual buttons available", async ({ page }) => {
  await seed(page); await page.addInitScript(() => { Object.defineProperty(window, "SpeechRecognition", { value: undefined, configurable: true }); Object.defineProperty(window, "webkitSpeechRecognition", { value: undefined, configurable: true }); });
  await catalog(page); await launch(page); await page.getByText("Commandes vocales", { exact: true }).click();
  await expect(page.getByText(/Commandes vocales indisponibles/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Alléger −1" })).toBeVisible();
});

test("microphone refusal stops listening and offers a retry without automatic permission loops", async ({ page }) => {
  await seed(page);
  await page.addInitScript(() => {
    (window as any).__starts = 0;
    class Recognition {
      onerror?: (event: { error: string }) => void;
      start() { (window as any).__starts++; this.onerror?.({ error: "not-allowed" }); }
      abort() {}
    }
    Object.defineProperty(window, "SpeechRecognition", { value: Recognition, configurable: true });
  });
  await catalog(page); await launch(page); await page.getByText("Commandes vocales", { exact: true }).click();
  await page.getByRole("button", { name: "Activer les commandes vocales" }).click();
  await expect(page.getByText(/Micro ou reconnaissance vocale refusés/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Activer les commandes vocales" })).toBeVisible();
  expect(await page.evaluate(() => (window as any).__starts)).toBe(1);
});
