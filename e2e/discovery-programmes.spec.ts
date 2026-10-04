import { expect, test, type Page } from "@playwright/test";

test.use({ timezoneId: "Europe/Paris" });
const state = { profile: { name: "QA Horizons", startDate: "2026-10-01" }, sessions: [], measurements: [], favoriteRouteIds: [],
  preferences: { soundCues: false, voiceCues: false, haptics: false, keepScreenAwake: false } };
const complete = (id: string, route = false) => ({ id, templateId: route ? `climb-${id}` : id, ...(route ? { routeId: id } : {}),
  date: "2026-10-03T10:00:00Z", duration: 30, xp: 40, points: 1, kind: "endurance", intensity: "easy", bonus: false,
  metrics: { source: "manual", ...(route ? { completedRoute: true } : { completedWorkout: true }) } });
async function seed(page: Page, sessions: object[] = []) {
  await page.addInitScript((value) => { if (!localStorage.getItem("veloquest:v1")) localStorage.setItem("veloquest:v1", JSON.stringify(value)); }, { ...state, sessions });
  await page.goto("/"); await expect(page.getByRole("heading", { name: "QA Horizons, ta quête continue.", exact: true })).toBeVisible();
}
const card = (page: Page, name: string) => page.getByRole("heading", { name, exact: true }).locator("xpath=ancestor::article");
const browse = (page: Page) => page.getByRole("button", { name: /Parcours/ }).click();
const stored = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem("veloquest:v1")!));
const objectives = (page: Page) => page.getByText("Campagnes et carnets · 17 objectifs à découvrir", { exact: true }).click();
async function programs(page: Page) {
  if (await page.locator(".workoutPrograms").getAttribute("open") === null) await page.getByText("Programmes découverte · 3 chemins pour progresser", { exact: true }).click();
}
const overflow = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth > innerWidth);

test("Route Napoléon groups fourteen sourced road sections and prepares local landmarks", async ({ page }, testInfo) => {
  const errors: string[] = []; page.on("pageerror", (error) => errors.push(error.message));
  await seed(page); await browse(page); await page.getByRole("button", { name: /Route Napoléon Quatorze tronçons/ }).click();
  await expect(page.locator(".routeLibraryCard")).toHaveCount(14);
  await expect(page.getByLabel("Thème", { exact: true })).toHaveValue("napoleon");
  const route = card(page, "Route Napoléon · Golfe-Juan → Grasse");
  await route.getByText("Découvrir le paysage", { exact: true }).click();
  await expect(route).toContainText("Mouans-Sartoux");
  await route.getByText("Les villes traversées · 6 repères", { exact: true }).click();
  await expect(route.locator(".routePlaces li strong")).toHaveText(["Golfe-Juan", "Cannes", "Le Cannet", "Mougins · secteur routier", "Mouans-Sartoux", "Grasse"]);
  await route.getByRole("button", { name: "Entraînement", exact: true }).click();
  await page.locator(".sessionPreview").getByText("Découvrir le paysage et son profil", { exact: true }).click();
  await expect(page.locator(".sessionPreview")).toContainText("IGN RGE ALTI");
  expect(await overflow(page)).toBe(false);
  await page.screenshot({ path: testInfo.outputPath("route-napoleon-preparation.png") }); expect(errors).toEqual([]);
});

test("Route Napoléon accepts out-of-order completions and ignores partial stages and sectors", async ({ page }) => {
  await seed(page, [complete("napoleon-sisteron-gap", true),
    { ...complete("napoleon-golfe-grasse", true), metrics: { source: "manual", completedRoute: false } },
    { ...complete("napoleon-grasse-vallier", true), metrics: { source: "manual", completedRoute: true, segmentAttackIndex: 0 } }]);
  await browse(page); await objectives(page);
  const notebook = card(page, "Route Napoléon · de la mer à Gap");
  await expect(notebook).toContainText("1/8");
  await expect(notebook.locator(".campaignStages > span").nth(7)).toHaveClass("done");
  await expect(notebook.locator(".campaignStages > span").nth(0)).toHaveClass("current");
  await expect(notebook.locator(".campaignStages > span").nth(1)).not.toHaveClass("done");
  await notebook.getByRole("button", { name: /Continuer/ }).click();
  await expect(page.locator(".sessionPreview")).toContainText("Golfe-Juan → Grasse");
});

test("short duration filtering composes with themes and clearly distinguishes the Verdon effort", async ({ page }, testInfo) => {
  await seed(page); await browse(page); await page.getByRole("button", { name: "Une balade en 30 minutes", exact: true }).click();
  await expect(page.locator(".routeLibraryCard")).toHaveCount(12);
  await expect(page.getByLabel("Durée simulée")).toHaveValue("30");
  await page.getByLabel("Thème", { exact: true }).selectOption("azure");
  await expect(page.locator(".routeLibraryCard")).toHaveCount(4);
  await page.getByRole("button", { name: /Lacs et gorges du Verdon/ }).click();
  await page.getByLabel("Durée simulée").selectOption("30");
  await expect(page.locator(".routeLibraryCard")).toHaveCount(1);
  const route = card(page, "Verdon · Riez → Montagnac"); await expect(route).toContainText("Difficulté 2/5");
  await route.getByRole("button", { name: "Entraînement", exact: true }).click();
  await expect(page.locator(".previewStats")).toContainText("soutenu");
  expect(await overflow(page)).toBe(false); await page.screenshot({ path: testInfo.outputPath("format-court-verdon.png") });
});

test("an actual short coastal ride restores after pause and validates only its own step", async ({ page }) => {
  await page.clock.install(); await seed(page); await browse(page); await page.getByLabel("Rechercher").fill("Antibes → Golfe-Juan");
  await card(page, "Antibes → Golfe-Juan").getByRole("button", { name: "Partir en balade", exact: true }).click();
  await page.getByRole("button", { name: "Démarrer la séance" }).click(); await page.clock.fastForward(10 * 60_000);
  await page.getByRole("button", { name: "Pause", exact: true }).click(); await page.clock.fastForward(6000); await page.reload();
  await page.getByRole("button", { name: "Reprendre", exact: true }).click();
  await expect(page.locator(".routePlaceNow strong")).toHaveText("Antibes");
  await page.getByRole("button", { name: "Reprendre", exact: true }).click(); await page.clock.fastForward(17 * 60_000);
  await page.getByRole("button", { name: /Valider la quête/ }).click();
  await expect.poll(async () => (await stored(page)).sessions.length).toBe(1);
  expect((await stored(page)).sessions[0].metrics.completedRoute).toBe(true);
  expect((await stored(page)).sessions[0].routeId).toBe("antibes-golfe-juan-short");
  await browse(page); await objectives(page);
  await expect(card(page, "Escales du Sud")).toContainText("1/5");
  await expect(card(page, "Passeport azuréen")).toContainText("0/3");
});

test("a discovery programme completes with a real workout, earns its trophy and rolls back after deletion", async ({ page }, testInfo) => {
  const errors: string[] = []; page.on("pageerror", (error) => errors.push(error.message));
  await page.clock.install(); await seed(page, [complete("fluid-cadence-30"), complete("first-pedals-15"), complete("contemplative-25"),
    { ...complete("breathing-18"), id: "partial", metrics: { source: "manual", completedWorkout: false } }]);
  await page.getByRole("button", { name: /Séances/ }).click(); await programs(page);
  const program = card(page, "Trouver son rythme"); await expect(program).toContainText("3/4");
  await expect(program.locator(".programSteps button.done")).toHaveCount(3);
  await program.getByRole("button", { name: /Souffle tranquille/ }).click();
  await page.getByRole("button", { name: "Démarrer la séance" }).click(); await page.clock.fastForward(19 * 60_000);
  await page.getByLabel("RPE ressenti /10").fill("3"); await page.getByRole("button", { name: /Valider la quête/ }).click();
  await expect.poll(async () => (await stored(page)).sessions.length).toBe(5);
  await page.getByRole("button", { name: /Séances/ }).click(); await programs(page);
  await expect(program).toContainText("Programme terminé");
  expect(await overflow(page)).toBe(false); await page.screenshot({ path: testInfo.outputPath("programme-decouverte-termine.png") });
  await page.getByRole("button", { name: /Plus/ }).click();
  const trophy = page.locator(".badge").filter({ has: page.getByRole("heading", { name: "Trouver son rythme", exact: true }) });
  await expect(trophy).toContainText("Débloqué");
  await page.getByRole("button", { name: /Suivi/ }).click();
  await page.locator(".sessionHistoryRow").filter({ hasText: "Souffle tranquille" }).first().click();
  page.once("dialog", (dialog) => dialog.accept()); await page.getByRole("button", { name: "Supprimer cette séance" }).click();
  await page.getByRole("button", { name: /Séances/ }).click(); await programs(page); await expect(program).toContainText("3/4");
  await page.getByRole("button", { name: /Plus/ }).click(); await expect(trophy).toContainText("3/4"); expect(errors).toEqual([]);
});

test("historic cols expose their landscape and indicative locations before and during the ride", async ({ page }, testInfo) => {
  await page.clock.install(); await seed(page); await browse(page); await page.getByLabel("Rechercher").fill("Chalet Reynard");
  const route = card(page, "Mont Ventoux"); await expect(route).toBeVisible();
  await route.getByText("Découvrir le paysage", { exact: true }).click(); await expect(route).toContainText("Saint-Estève");
  await route.getByText("Les villes traversées · 4 repères", { exact: true }).click();
  await expect(route).toContainText("ne sont pas des positions GPS");
  await route.getByRole("button", { name: "Entraînement", exact: true }).click();
  await page.locator(".sessionPreview").getByText("Découvrir le paysage et son profil", { exact: true }).click();
  await expect(page.locator(".sessionPreview")).toContainText("Chalet Reynard");
  await page.getByRole("button", { name: "Démarrer la séance" }).click(); await expect(page.locator(".routePlaceNow strong")).toHaveText("Bédoin");
  await page.getByText("Ton carnet de paysage", { exact: true }).click(); await expect(page.locator(".climbSession")).toContainText("Géant de Provence");
  expect(await overflow(page)).toBe(false); await page.screenshot({ path: testInfo.outputPath("ventoux-fiche-uniformisee.png") });
});
