import { expect, test } from "@playwright/test";
import { workouts } from "../lib/data";

test("short catalog filters combine with intensity and exclude other duration filters", async ({ page }, info) => {
  await page.addInitScript(() => localStorage.setItem("veloquest:v1", JSON.stringify({ profile: { name: "Short QA", startDate: "2026-10-01" }, sessions: [], measurements: [] })));
  await page.goto("/"); await page.getByRole("button", { name: /⚡ Séances/ }).click();
  await page.getByRole("button", { name: "10–20 min", exact: true }).click();
  await expect(page.locator(".workoutCard")).toHaveCount(workouts.filter(w => w.duration >= 10 && w.duration <= 20).length);
  await page.locator(".workoutFilters").scrollIntoViewIfNeeded();
  await page.screenshot({ path: info.outputPath("short-catalog.png") });
  await page.getByLabel("Intensité des séances").selectOption("hard");
  await expect(page.locator(".workoutCard")).toHaveCount(3);
  await expect(page.locator(".workoutCard").filter({ hasText: "Double ascension" })).toContainText("2 pts");
  await page.getByRole("button", { name: "Express · moins de 10 min" }).click();
  await expect(page.getByRole("button", { name: "10–20 min", exact: true })).toHaveAttribute("aria-pressed", "false");
  await expect(page.getByRole("heading", { name: "Double ascension", exact: true })).toHaveCount(0);
});

for (const id of ["short-loosen-10", "short-cadence-12", "short-intervals-20", "bonus-10"]) {
  test(`saves and reloads points for ${id}`, async ({ page }) => {
    const w = workouts.find(w => w.id === id)!;
    await page.addInitScript(() => {
      if (!localStorage.getItem("veloquest:v1")) localStorage.setItem("veloquest:v1", JSON.stringify({ profile: { name: "Short QA", startDate: new Date().toISOString().slice(0, 10) }, sessions: [], measurements: [], preferences: { voiceCues: false, soundCues: false, haptics: false } }));
    });
    await page.goto("/"); await page.getByRole("button", { name: /⚡ Séances/ }).click();
    await page.getByRole("button", { name: "10–20 min", exact: true }).click();
    await page.getByRole("heading", { name: w.name, exact: true }).locator("xpath=ancestor::article").getByRole("button", { name: "Voir / démarrer" }).click();
    await page.getByRole("button", { name: "Démarrer la séance" }).click();
    await page.getByRole("button", { name: "Terminer et enregistrer", exact: true }).click();
    await page.getByLabel("J’ai vérifié le bilan et les champs facultatifs.").check();
    await page.getByRole("button", { name: /Valider la quête/ }).click();
    await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("veloquest:v1")!).sessions.length)).toBe(1);
    await page.reload();
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem("veloquest:v1")!).sessions[0])).toMatchObject({ templateId: id, points: w.points, duration: w.duration, bonus: !!w.bonus });
    await expect(page.locator(".achievement").filter({ has: page.getByText("Semaine", { exact: true }) })).toContainText(`${String(w.points).replace(".", ",")}/8 pts`);
  });
}
