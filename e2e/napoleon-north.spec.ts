import { expect, test, type Page } from "@playwright/test";

test.use({ timezoneId: "Europe/Paris" });
const southIds = ["napoleon-golfe-grasse", "napoleon-grasse-vallier", "napoleon-vallier-seranon", "napoleon-seranon-castellane", "napoleon-castellane-barreme", "napoleon-barreme-digne", "napoleon-digne-sisteron", "napoleon-sisteron-gap"];
const northIds = ["napoleon-gap-fare", "napoleon-fare-corps", "napoleon-corps-mure", "napoleon-mure-laffrey", "napoleon-laffrey-vizille", "napoleon-vizille-grenoble"];
const complete = (id: string) => ({ id, templateId: `climb-${id}`, routeId: id, date: "2026-10-03T10:00:00Z", duration: 30, xp: 40, points: 1, kind: "endurance", intensity: "moderate", bonus: false, metrics: { source: "manual", completedRoute: true } });
async function seed(page: Page, sessions: object[] = []) {
  await page.addInitScript((value) => { if (!localStorage.getItem("veloquest:v1")) localStorage.setItem("veloquest:v1", JSON.stringify(value)); }, {
    profile: { name: "QA Dauphiné", startDate: "2026-10-01" }, sessions, measurements: [], favoriteRouteIds: [],
    preferences: { soundCues: false, voiceCues: false, haptics: false, keepScreenAwake: false }
  });
  await page.goto("/"); await expect(page.getByRole("heading", { name: "QA Dauphiné, ta quête continue.", exact: true })).toBeVisible();
}
const card = (page: Page, name: string) => page.getByRole("heading", { name, exact: true }).locator("xpath=ancestor::article");
const browse = (page: Page) => page.getByRole("button", { name: /Parcours/ }).click();
const objectives = (page: Page) => page.getByText("Campagnes et carnets · 20 objectifs à découvrir", { exact: true }).click();
const stored = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem("veloquest:v1")!));
const overflow = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth > innerWidth);

test("the northern sections expose actual towns, Bayard terrain and the independent Gap junction", async ({ page }, testInfo) => {
  const errors: string[] = []; page.on("pageerror", (error) => errors.push(error.message));
  await seed(page); await browse(page); await page.getByLabel("Thème", { exact: true }).selectOption("napoleon");
  await expect(page.locator(".routeLibraryCard")).toHaveCount(18);
  await page.getByLabel("Rechercher").fill("col bayard");
  const route = card(page, "Route Napoléon · Gap → La Fare");
  await route.getByText("Découvrir le paysage", { exact: true }).click(); await expect(route).toContainText("Champsaur");
  await route.getByText("Les villes traversées · 3 repères", { exact: true }).click();
  await expect(route.locator(".routePlaces li strong")).toHaveText(["Gap", "Col Bayard", "La Fare-en-Champsaur"]);
  await route.getByRole("button", { name: "Entraînement", exact: true }).click();
  await page.locator(".sessionPreview").getByText("Découvrir le paysage et son profil", { exact: true }).click();
  await expect(page.locator(".sessionPreview")).toContainText("Michelin");
  await expect(page.locator(".sessionPreview")).toContainText("260 m");
  expect(await overflow(page)).toBe(false); await page.screenshot({ path: testInfo.outputPath("bayard-preparation.png") });
  await page.getByRole("button", { name: "Mettre la séance de côté", exact: true }).click();
  await browse(page); await page.getByLabel("Rechercher").fill("Vizille → Grenoble");
  const final = card(page, "Route Napoléon · Vizille → Grenoble");
  await final.getByText("Les villes traversées · 4 repères", { exact: true }).click();
  await expect(final.locator(".routePlaces li strong")).toHaveText(["Vizille", "Brié-et-Angonnes · secteur routier", "Eybens", "Grenoble"]);
  expect(await overflow(page)).toBe(false); await page.screenshot({ path: testInfo.outputPath("grenoble-local-places.png") }); expect(errors).toEqual([]);
});

test("the old carnet stays complete and the new carnet marks only actual out-of-order stages", async ({ page }, testInfo) => {
  await seed(page, [...southIds.map(complete), complete(northIds[5]),
    { ...complete(northIds[0]), metrics: { source: "manual", completedRoute: false } },
    { ...complete(northIds[1]), metrics: { source: "manual", completedRoute: true, segmentAttackIndex: 0 } }]);
  await browse(page); await objectives(page);
  await expect(card(page, "Route Napoléon · de la mer à Gap")).toContainText("Campagne terminée");
  const north = card(page, "Route Napoléon · de Gap à Grenoble"); await expect(north).toContainText("1/6");
  await expect(north.locator(".campaignStages > span").nth(5)).toHaveClass("done");
  await expect(north.locator(".campaignStages > span").nth(0)).toHaveClass("current");
  await expect(north.locator(".campaignStages > span").nth(1)).not.toHaveClass("done");
  expect(await overflow(page)).toBe(false); await north.scrollIntoViewIfNeeded(); await page.screenshot({ path: testInfo.outputPath("north-out-of-order.png") });
  await north.getByRole("button", { name: /Continuer/ }).click(); await expect(page.locator(".sessionPreview")).toContainText("Gap → La Fare");
  await page.getByRole("button", { name: "Mettre la séance de côté", exact: true }).click();
  await page.getByRole("button", { name: /Plus/ }).click();
  const trophy = page.locator(".badge").filter({ has: page.getByRole("heading", { name: "Traversée impériale", exact: true }) });
  await expect(trophy).toContainText("9/14");
});

test("a real northern ride resumes, completes both the new carnet and trophy, then deletion recomputes them", async ({ page }) => {
  const errors: string[] = []; page.on("pageerror", (error) => errors.push(error.message));
  await page.clock.install(); await seed(page, [...southIds, ...northIds.filter((id) => id !== northIds[4])].map(complete));
  await browse(page); await page.getByLabel("Rechercher").fill("Laffrey → Vizille");
  await card(page, "Route Napoléon · Laffrey → Vizille").getByRole("button", { name: "Entraînement", exact: true }).click();
  await page.getByRole("button", { name: "Démarrer la séance" }).click(); await page.clock.fastForward(10 * 60_000);
  await page.getByRole("button", { name: "Pause", exact: true }).click(); await page.clock.fastForward(6000); await page.reload();
  await page.getByRole("button", { name: "Reprendre", exact: true }).click();
  await expect(page.locator(".routePlaceNow strong")).toHaveText("Laffrey");
  await page.getByRole("button", { name: "Reprendre", exact: true }).click(); await page.clock.fastForward(18 * 60_000);
  await page.getByRole("button", { name: /Valider la quête/ }).click();
  await expect.poll(async () => (await stored(page)).sessions.length).toBe(14);
  expect((await stored(page)).sessions.at(-1).metrics.completedRoute).toBe(true);
  await browse(page); await objectives(page); await expect(card(page, "Route Napoléon · de Gap à Grenoble")).toContainText("Campagne terminée");
  await page.getByRole("button", { name: /Plus/ }).click();
  const trophy = page.locator(".badge").filter({ has: page.getByRole("heading", { name: "Traversée impériale", exact: true }) });
  await expect(trophy).toContainText("Débloqué");
  await page.getByRole("button", { name: /Suivi/ }).click();
  await page.locator(".sessionHistoryRow").filter({ hasText: "Laffrey → Vizille" }).first().click();
  page.once("dialog", (dialog) => dialog.accept()); await page.getByRole("button", { name: "Supprimer cette séance" }).click();
  await page.reload(); await browse(page); await objectives(page);
  await expect(card(page, "Route Napoléon · de Gap à Grenoble")).toContainText("5/6");
  await expect(card(page, "Route Napoléon · de la mer à Gap")).toContainText("Campagne terminée");
  await page.getByRole("button", { name: /Plus/ }).click(); await expect(trophy).toContainText("13/14"); expect(errors).toEqual([]);
});
