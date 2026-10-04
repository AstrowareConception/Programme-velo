import { expect, test, type Page } from "@playwright/test";

test.use({ timezoneId: "Europe/Paris" });
const state = { profile: { name: "QA Voyages", startDate: "2026-10-01" }, sessions: [], measurements: [{ id: "m1", date: "2026-10-02T10:00:00Z", weight: 78 }],
  favoriteRouteIds: ["galibier-valloire"], preferences: { soundCues: false, voiceCues: false, haptics: false, keepScreenAwake: false } };
const completed = (routeId: string, id = routeId) => ({ id, routeId, templateId: `climb-${routeId}`, date: "2026-10-03T18:00:00Z",
  duration: 20, xp: 40, points: 1, intensity: "easy", kind: "endurance", bonus: false, metrics: { source: "manual", completedRoute: true } });
async function seed(page: Page, sessions: object[] = []) {
  await page.addInitScript((value) => {
    if (!localStorage.getItem("veloquest:v1")) localStorage.setItem("veloquest:v1", JSON.stringify(value));
  }, { ...state, sessions });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "QA Voyages, ta quête continue.", exact: true })).toBeVisible();
}
const browse = (page: Page) => page.getByRole("button", { name: /Parcours/ }).click();
const card = (page: Page, name: string) => page.getByRole("heading", { name, exact: true }).locator("xpath=ancestor::article");
const objectives = (page: Page) => page.getByText("Campagnes et carnets · 20 objectifs à découvrir", { exact: true }).click();
const stored = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem("veloquest:v1")!));
const overflow = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth > innerWidth);

test("themes, towns and all difficulties filter the expanded catalogue without overflow", async ({ page }, testInfo) => {
  const errors: string[] = []; page.on("pageerror", (e) => errors.push(e.message));
  await seed(page); await browse(page);
  await expect(page.locator(".routeLibraryCard")).toHaveCount(71);
  await expect(page.locator(".themeCard")).toHaveCount(10);
  await expect(page.locator(".campaignDrawer")).not.toHaveAttribute("open");
  await page.getByRole("button", { name: /Côte d’Azur Ports/ }).click();
  await expect(page.getByLabel("Thème", { exact: true })).toHaveValue("azure");
  await expect(page.locator(".routeLibraryCard")).toHaveCount(14);
  await page.getByLabel("Rechercher").fill("monaco");
  await expect(page.locator(".routeLibraryCard")).toHaveCount(2);
  await expect(card(page, "Èze-sur-Mer → Menton")).toBeVisible();
  await page.getByLabel("Rechercher").fill("eze");
  await expect(page.locator(".routeLibraryCard")).toHaveCount(4);
  await page.getByLabel("Thème", { exact: true }).selectOption("");
  await page.getByLabel("Rechercher").fill("");
  for (const level of [1, 2, 3, 4, 5]) {
    await page.getByRole("button", { name: `${level}★`, exact: true }).click();
    await expect(page.locator(".routeLibraryCard").first()).toBeVisible();
    const counts = await page.locator(".routeLibraryCard").count();
    await expect(page.locator(".routeLibraryCard").filter({ hasText: `Difficulté ${level}/5` })).toHaveCount(counts);
  }
  await page.getByRole("button", { name: "Explorer les 29 balades", exact: true }).click();
  await expect(page.locator(".routeLibraryCard")).toHaveCount(29);
  expect(await overflow(page)).toBe(false);
  await page.screenshot({ path: testInfo.outputPath("nouveaux-themes-et-balades.png") });
  expect(errors).toEqual([]);
});

test("Verdon villages and real landmarks appear on the card and stage preparation", async ({ page }, testInfo) => {
  await seed(page); await browse(page);
  await page.getByRole("button", { name: /Lacs et gorges du Verdon/ }).click();
  await expect(page.locator(".routeLibraryCard")).toHaveCount(4);
  const route = card(page, "Sainte-Croix · lac et plateau");
  await route.getByText("Les villes traversées · 6 repères", { exact: true }).click();
  await expect(route.locator(".routePlaces li strong")).toHaveText(["Sainte-Croix-du-Verdon", "Chaudon", "Roumoules", "Riez", "Montagnac", "Sainte-Croix · retour"]);
  await route.getByText("Découvrir le paysage", { exact: true }).click();
  await expect(route).toContainText("ne fait pas le tour complet du lac");
  await route.getByRole("button", { name: "Entraînement", exact: true }).click();
  await page.locator(".sessionPreview").getByText("Les villes traversées · 6 repères", { exact: true }).click();
  await expect(page.locator(".sessionPreview .routePlaces")).toContainText("Roumoules");
  expect(await overflow(page)).toBe(false);
  await page.screenshot({ path: testInfo.outputPath("verdon-preparation-et-villages.png") });
});

test("Menton ride finishes at Garavan, earns one passport and survives history deletion", async ({ page }, testInfo) => {
  const errors: string[] = []; page.on("pageerror", (e) => errors.push(e.message));
  await page.clock.install();
  await seed(page, [completed("golfe-juan-cannes-balade"), completed("cagnes-cannes-littoral")]);
  await browse(page); await page.getByLabel("Rechercher").fill("Menton · promenade");
  await card(page, "Menton · promenade de Garavan").getByRole("button", { name: "Partir en balade" }).click();
  await page.getByRole("button", { name: "Démarrer la séance" }).click();
  await expect(page.locator(".routePlaceNow strong")).toHaveText("Roquebrune-Cap-Martin · Carnolès");
  await page.clock.fastForward(16 * 60 * 1000);
  await expect(page.locator(".routePlaceNow strong")).toHaveText("Menton · vieux port");
  await page.screenshot({ path: testInfo.outputPath("menton-carnet-en-seance.png") });
  await page.clock.fastForward(4 * 60 * 1000);
  await expect(page.getByLabel("RPE ressenti /10")).toBeVisible();
  await page.getByLabel("RPE ressenti /10").fill("3");
  await page.getByRole("button", { name: /Valider la quête/ }).click();
  await expect.poll(async () => (await stored(page)).sessions.length).toBe(3);
  expect((await stored(page)).sessions.at(-1).metrics.completedRoute).toBe(true);
  await browse(page); await objectives(page);
  const passport = card(page, "Passeport azuréen");
  await expect(passport).toContainText("Campagne terminée");
  await page.getByRole("button", { name: /Plus/ }).click();
  const trophy = page.locator(".badge").filter({ has: page.getByRole("heading", { name: "Riviera en poche", exact: true }) });
  await expect(trophy).toContainText("Débloqué");
  await page.getByRole("button", { name: /Suivi/ }).click();
  await page.locator(".sessionHistoryRow").filter({ hasText: "Menton · promenade" }).click();
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Supprimer cette séance" }).click();
  await browse(page); await objectives(page);
  await expect(passport).toContainText("2/3");
  await expect(passport.getByRole("button", { name: /Continuer/ })).toContainText("Menton");
  await page.getByRole("button", { name: /Plus/ }).click();
  await expect(trophy).toContainText("2/3");
  expect(errors).toEqual([]);
});

test("new objectives mark the actual out-of-order ride and offer discovery, sport and in-progress filters", async ({ page }, testInfo) => {
  await seed(page, [completed("verdon-route-cretes")]); await browse(page); await objectives(page);
  const notebook = card(page, "Carnet du Verdon");
  await expect(notebook).toContainText("1/3");
  await expect(notebook.locator(".campaignStages > span").nth(2)).toHaveClass("done");
  await expect(notebook.locator(".campaignStages > span").nth(0)).toHaveClass("current");
  await page.getByRole("button", { name: "En cours", exact: true }).click();
  await expect(page.locator(".campaignCard")).toHaveCount(1);
  await expect(notebook).toBeVisible();
  await page.getByRole("button", { name: "Découverte", exact: true }).click();
  await expect(card(page, "Passeport azuréen")).toBeVisible();
  await expect(notebook).toHaveCount(0);
  await page.getByRole("button", { name: "Sport", exact: true }).click();
  await expect(card(page, "Des forêts aux cimes")).toBeVisible();
  expect(await overflow(page)).toBe(false);
  await page.screenshot({ path: testInfo.outputPath("carnets-sportifs.png") });
});

test("incomplete rides and completed sectors unlock neither new passports nor regional trophies", async ({ page }) => {
  const invalid = [completed("golfe-juan-cannes-balade"), completed("cagnes-cannes-littoral"), completed("menton-garavan-promenade")]
    .map((s, i) => ({ ...s, metrics: { source: "manual", completedRoute: i === 2, ...(i === 2 ? { segmentAttackIndex: 0 } : {}) } }));
  await seed(page, invalid); await browse(page); await objectives(page);
  await expect(card(page, "Passeport azuréen")).toContainText("0/3");
  await page.getByRole("button", { name: /Plus/ }).click();
  await expect(page.locator(".badge").filter({ has: page.getByRole("heading", { name: "Riviera en poche", exact: true }) })).toContainText("0/3");
});

test("browsing themes leaves measurements, favorites, custom data and the interrupted reader intact", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("veloquest:custom-routes:v1", "[]");
    localStorage.setItem("veloquest:active-session:v1", JSON.stringify({ version: 1, savedAt: Date.now(), workoutId: "progressive-35", routeMode: "training", segmentIndex: 2, secondsLeft: 180, running: false, sessionStarted: true, showFinish: false, timeAttackElapsedSeconds: 0, timeAttackSplits: [], pauseCount: 0, sessionResistanceDelta: 0, telemetrySamples: [], hadBikeConnection: false }));
  });
  await seed(page);
  const keys = () => page.evaluate(() => ["veloquest:v1", "veloquest:custom-routes:v1", "veloquest:active-session:v1"].map((k) => localStorage.getItem(k)));
  const before = await keys();
  await browse(page);
  await page.getByRole("button", { name: /Villages de Provence/ }).click();
  await page.getByLabel("Rechercher").fill("Baux");
  await card(page, "Les Baux · tour du rocher").getByText("Découvrir le paysage", { exact: true }).click();
  await objectives(page); await page.getByRole("button", { name: "Découverte", exact: true }).click();
  await page.getByRole("button", { name: /Plus/ }).click();
  expect(await keys()).toEqual(before);
  await page.reload();
  await expect(page.getByRole("button", { name: /Reprendre/ }).first()).toBeVisible();
});
