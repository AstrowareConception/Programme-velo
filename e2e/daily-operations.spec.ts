import { expect, test, type Page } from "@playwright/test";

test.use({ timezoneId: "Europe/Paris" });
const baseState = { profile: { name: "QA Rider", startDate: "2026-10-01" }, sessions: [], measurements: [], preferences: { soundCues: false, voiceCues: false, haptics: false, keepScreenAwake: false } };
async function seed(page: Page, sessions: object[] = []) {
  await page.addInitScript((value) => {
    if (!localStorage.getItem("veloquest:v1")) localStorage.setItem("veloquest:v1", JSON.stringify(value));
  }, { ...baseState, sessions });
}
async function stored(page: Page) { return page.evaluate(() => JSON.parse(localStorage.getItem("veloquest:v1")!)); }
const completed = (id: string, routeId: string, seconds = 900) => ({ id, routeId, templateId: `climb-${routeId}`, date: "2026-10-03T18:00:00Z", duration: 60, xp: 100, points: 3, intensity: "moderate", kind: "hills", bonus: false, metrics: { source: "manual", completedRoute: true, timeAttack: true, elapsedSeconds: seconds } });

test("retroactive local session survives reload and can be deleted", async ({ page }) => {
  await seed(page); await page.goto("/");
  await page.getByRole("button", { name: /Séances/ }).click();
  await page.getByRole("button", { name: /Enregistrer une séance déjà faite/ }).click();
  await page.getByLabel("Date et heure de la séance").fill("2026-10-02T00:15");
  await page.getByLabel("Durée (min)").fill("42");
  await page.getByLabel("Distance (km)").fill("17.5");
  await page.getByLabel("Calories affichées").fill("230");
  await page.getByRole("button", { name: /Valider la quête/ }).click();
  await expect.poll(async () => (await stored(page)).sessions.length).toBe(1);
  const saved = (await stored(page)).sessions[0];
  expect(saved.date).toBe("2026-10-01T22:15:00.000Z");
  expect(saved.metrics.distanceKm).toBe(17.5);
  expect(saved.metrics.timeAttack).toBeUndefined();
  await page.reload();
  await page.getByRole("button", { name: /Suivi/ }).click();
  await page.locator(".sessionHistoryRow").click();
  await expect(page.locator(".detailDate")).toContainText("2 octobre 2026");
  await expect(page.locator(".detailDate")).toContainText("00:15");
  page.once("dialog", (dialog) => dialog.dismiss());
  await page.getByRole("button", { name: "Supprimer cette séance" }).click();
  expect((await stored(page)).sessions).toHaveLength(1);
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Supprimer cette séance" }).click();
  await expect.poll(async () => (await stored(page)).sessions.length).toBe(0);
  await page.reload(); await page.getByRole("button", { name: /Suivi/ }).click();
  await expect(page.getByText("Aucune séance enregistrée pour l’instant.")).toBeVisible();
});

test("dated measurement persists and its deletion updates the latest weight", async ({ page }) => {
  await seed(page); await page.goto("/"); await page.getByRole("button", { name: /Suivi/ }).click();
  await page.getByLabel("Date de mesure").fill("2026-10-02");
  await page.getByLabel("Poids (kg)").fill("118.4");
  await page.getByRole("button", { name: "Enregistrer", exact: true }).click();
  await expect.poll(async () => (await stored(page)).measurements.length).toBe(1);
  expect((await stored(page)).measurements[0].date).toBe("2026-10-02T10:00:00.000Z");
  await page.reload(); await page.getByRole("button", { name: /Suivi/ }).click();
  await expect(page.locator(".metricBig").filter({ hasText: "Poids" })).toContainText("118.4 kg");
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: /Supprimer la mesure du/ }).click();
  await expect.poll(async () => (await stored(page)).measurements.length).toBe(0);
  await expect(page.locator(".metricBig").filter({ hasText: "Poids" })).toContainText("— kg");
});

test("deleting the last qualifying stage removes its campaign reward and restores the next stage", async ({ page }) => {
  await seed(page, ["sorgue-velleron-loop", "vaison-medieval-loop", "uchaux-loop", "enclave-papes-loop"].map((routeId, i) => completed(String(i), routeId)));
  await page.goto("/"); await page.getByRole("button", { name: /Parcours/ }).click();
  await page.getByText("Campagnes et carnets · 22 objectifs à découvrir", { exact: true }).click();
  const campaign = page.getByRole("heading", { name: "Découverte Provence" }).locator("xpath=ancestor::article");
  await expect(campaign).toContainText("Campagne terminée");
  await page.getByRole("button", { name: /Plus/ }).click();
  const badge = page.locator(".badge").filter({ has: page.getByRole("heading", { name: "Découverte Provence" }) });
  await expect(badge).toContainText("Débloqué");
  await page.getByRole("button", { name: /Suivi/ }).click();
  await page.locator(".sessionHistoryRow").filter({ hasText: "Massif d’Uchaux" }).click();
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Supprimer cette séance" }).click();
  await expect.poll(async () => (await stored(page)).sessions.length).toBe(3);
  await page.getByRole("button", { name: /Parcours/ }).click();
  await page.getByText("Campagnes et carnets · 22 objectifs à découvrir", { exact: true }).click();
  await expect(campaign).toContainText("3/4");
  await expect(campaign.getByRole("button", { name: /Continuer/ })).toContainText("Uchaux");
  await page.getByRole("button", { name: /Plus/ }).click();
  await expect(badge).toContainText("3/4");
});

for (const mode of ["timeAttack", "segmentAttack"] as const) {
  test(`${mode} recovery preserves mode and incomplete attempts cannot become records or campaign stages`, async ({ page }) => {
    await seed(page);
    await page.addInitScript((routeMode) => localStorage.setItem("veloquest:active-session:v1", JSON.stringify({
      version: 1, savedAt: Date.now(), workoutId: "climb-sorgue-velleron-loop", routeId: "sorgue-velleron-loop", routeMode,
      segmentAttackIndex: routeMode === "segmentAttack" ? 0 : undefined,
      segmentIndex: 0, secondsLeft: 500, running: false, sessionStarted: true, showFinish: false,
      timeAttackElapsedSeconds: 30, timeAttackSplits: [], pauseCount: 0, sessionResistanceDelta: 0, telemetrySamples: [], hadBikeConnection: false
    })), mode);
    await page.goto("/"); await page.getByRole("button", { name: "Reprendre" }).click();
    await expect(page.locator(".timeAttackHud")).toBeVisible();
    await page.getByRole("button", { name: "Terminer et enregistrer" }).click();
    await page.getByRole("button", { name: /Valider la quête/ }).click();
    await expect.poll(async () => (await stored(page)).sessions.length).toBe(1);
    const metrics = (await stored(page)).sessions[0].metrics;
    expect(metrics.completedRoute).toBe(false);
    if (mode === "segmentAttack") { expect(metrics.segmentAttackIndex).toBe(0); expect(metrics.completedSegment).toBe(false); }
    else expect(metrics.timeAttack).toBe(true);
    await page.getByRole("button", { name: /Parcours/ }).click();
    await page.getByText("Campagnes et carnets · 22 objectifs à découvrir", { exact: true }).click();
    await expect(page.getByRole("heading", { name: "Découverte Provence" }).locator("xpath=ancestor::article")).toContainText("0/4");
  });
}


test("campaigns and manual logging fit the viewport without browser errors", async ({ page }, testInfo) => {
  const errors: string[] = []; page.on("pageerror", (error) => errors.push(error.message));
  await seed(page); await page.goto("/");
  await page.getByRole("button", { name: /Parcours/ }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByText("Campagnes et carnets · 22 objectifs à découvrir", { exact: true }).click();
  await expect(page.getByRole("heading", { name: "Découverte Provence" })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("campaigns.png") });
  await page.getByRole("button", { name: /Séances/ }).click();
  await page.getByRole("button", { name: /Enregistrer une séance déjà faite/ }).click();
  await expect(page.getByLabel("Date et heure de la séance")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("logging.png") });
  expect(errors).toEqual([]);
});

test("deleting the fastest route attempt restores the remaining PB after reload", async ({ page }) => {
  await seed(page, [completed("slow", "sorgue-velleron-loop", 900), completed("fast", "sorgue-velleron-loop", 800)]);
  await page.goto("/"); await page.getByRole("button", { name: /Parcours/ }).click();
  await page.getByLabel("Rechercher").fill("Velleron");
  const card = page.getByRole("heading", { name: "Velleron – L’Isle-sur-la-Sorgue" }).locator("xpath=ancestor::article");
  await expect(card).toContainText("13:20");
  await page.getByRole("button", { name: /Suivi/ }).click();
  await page.locator(".sessionHistoryRow").last().click();
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Supprimer cette séance" }).click();
  await expect.poll(async () => (await stored(page)).sessions.length).toBe(1);
  await page.reload(); await page.getByRole("button", { name: /Parcours/ }).click();
  await page.getByLabel("Rechercher").fill("Velleron");
  await expect(card).toContainText("15:00");
  await expect(card).not.toContainText("13:20");
  await page.getByText("Campagnes et carnets · 22 objectifs à découvrir", { exact: true }).click();
  const campaign = page.getByRole("heading", { name: "Découverte Provence" }).locator("xpath=ancestor::article");
  await expect(campaign).toContainText("1/4");
});

test("version endpoint exposes the build commit", async ({ request }) => {
  const response = await request.get("/api/version");
  expect(response.ok()).toBe(true);
  expect((await response.json()).commit).toMatch(/^[0-9a-f]{40}$/);
  expect(response.headers()["cache-control"]).toBe("no-store");
});
