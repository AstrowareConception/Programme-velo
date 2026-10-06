import { test, expect } from "@playwright/test";
test("weekly goals are editable, coherent and persist without losing sessions", async ({ page }, info) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem("veloquest:v1")) localStorage.setItem("veloquest:v1", JSON.stringify({ profile: { name: "Routine QA", startDate: "2026-10-06" }, sessions: [{ id: "before-goals", templateId: "recovery-30", date: "2026-10-06T16:00:00Z", duration: 25, points: 2, xp: 50, intensity: "easy", kind: "recovery", bonus: false }], measurements: [], preferences: { soundCues: false, voiceCues: false } }));
  });
  await page.goto("/");
  await expect(page.locator(".weeklyGoalHint")).toContainText("4 séances · 120 min");
  await page.getByRole("button", { name: "Régler mes objectifs" }).click();
  const form = page.getByRole("region", { name: "Objectifs hebdomadaires" });
  await form.getByLabel("Séances par semaine").fill("5");
  await form.getByLabel("Durée habituelle (min)").fill("25");
  await expect(form).toContainText("5 × 25 min = 125 min");
  await form.getByRole("button", { name: "Enregistrer mes objectifs" }).click();
  await form.screenshot({ path: info.outputPath("weekly-goals.png") });
  await page.getByRole("button", { name: /⌂ Quête/ }).click();
  await expect(page.locator(".weeklyGoalHint")).toContainText("5 séances · 125 min");
  await page.reload();
  await expect(page.locator(".weeklyGoalHint")).toContainText("5 séances · 125 min");
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("veloquest:v1")!));
  expect(saved.sessions).toHaveLength(1); expect(saved.sessions[0].id).toBe("before-goals");
  expect(saved.weeklyGoals[0]).toMatchObject({ minutes: 125, sessions: 5, points: 10, variety: 3 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
