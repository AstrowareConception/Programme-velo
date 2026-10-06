import { expect, test, type Page } from "@playwright/test";

test.use({ timezoneId: "Europe/Paris" });
const shortIds = ["napoleon-golfe-cannes-short", "napoleon-mougins-mouans-short", "napoleon-malijai-chateau-short", "napoleon-theoffrey-laffrey-short"];
const complete = (routeId: string) => ({ id: routeId, routeId, templateId: `climb-${routeId}`, date: "2026-10-03T10:00:00Z", duration: 25,
  xp: 45, points: 1, kind: "endurance", intensity: "easy", bonus: false, metrics: { source: "manual", completedRoute: true } });
async function seed(page: Page, sessions: object[] = []) {
  await page.addInitScript((value) => { if (!localStorage.getItem("veloquest:v1")) localStorage.setItem("veloquest:v1", JSON.stringify(value)); }, {
    profile: { name: "QA Estérel", startDate: "2026-10-01" }, sessions, measurements: [], favoriteRouteIds: [],
    preferences: { soundCues: false, voiceCues: false, haptics: false, keepScreenAwake: false }
  });
  await page.goto("/"); await expect(page.getByRole("heading", { name: "QA Estérel, ta quête continue.", exact: true })).toBeVisible();
}
const card = (page: Page, name: string) => page.getByRole("heading", { name, exact: true }).locator("xpath=ancestor::article");
const browse = (page: Page) => page.getByRole("button", { name: /Parcours/ }).click();
const objectives = (page: Page) => page.getByText("Campagnes et carnets · 22 objectifs à découvrir", { exact: true }).click();
const stored = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem("veloquest:v1")!));
const overflow = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth > innerWidth);

test("Estérel exposes actual coastal places and a separate inland stage on mobile and desktop", async ({ page }, testInfo) => {
  const errors: string[] = []; page.on("pageerror", (error) => errors.push(error.message));
  await seed(page); await browse(page); await page.getByLabel("Thème", { exact: true }).selectOption("esterel");
  await expect(page.locator(".routeLibraryCard")).toHaveCount(6);
  const coastal = card(page, "Corniche d’Or · Saint-Raphaël → Agay");
  await coastal.getByText("Découvrir le paysage", { exact: true }).click(); await expect(coastal).toContainText("île d’Or");
  await coastal.getByText("Les villes traversées · 4 repères", { exact: true }).click();
  await expect(coastal.locator(".routePlaces li strong")).toHaveText(["Saint-Raphaël", "Boulouris", "Le Dramont · secteur routier", "Agay"]);
  await page.getByLabel("Durée simulée").selectOption("30"); await expect(page.locator(".routeLibraryCard")).toHaveCount(2);
  await expect(card(page, "Estérel · Agay → Anthéor")).toContainText("Difficulté 1/5");
  expect(await overflow(page)).toBe(false); await page.screenshot({ path: testInfo.outputPath("esterel-short-coastal.png") });
  await page.getByLabel("Durée simulée").selectOption("all"); await page.getByLabel("Rechercher").fill("RN7");
  const inland = card(page, "Estérel · Théoule → Saint-Raphaël"); await expect(inland).toContainText("Difficulté 3/5");
  await inland.getByRole("button", { name: "Entraînement", exact: true }).click();
  await page.locator(".sessionPreview").getByText("Découvrir le paysage et son profil", { exact: true }).click();
  await expect(page.locator(".sessionPreview")).toContainText("l’intérieur de l’Estérel");
  await expect(page.locator(".sessionPreview")).toContainText("IGN RGE ALTI");
  expect(await overflow(page)).toBe(false); await page.screenshot({ path: testInfo.outputPath("esterel-inland-preparation.png") }); expect(errors).toEqual([]);
});

test("Estérel marks its last stage completed out of order and excludes shorts, incomplete attempts and sectors", async ({ page }, testInfo) => {
  await seed(page, [complete("esterel-theoule-raphael"), complete("esterel-raphael-boulouris-short"),
    { ...complete("esterel-raphael-agay"), metrics: { source: "manual", completedRoute: false } },
    { ...complete("esterel-agay-trayas"), metrics: { source: "manual", completedRoute: true, segmentAttackIndex: 0 } }]);
  await browse(page); await objectives(page);
  const notebook = card(page, "Estérel · entre mer et forêt"); await expect(notebook).toContainText("1/4");
  await expect(notebook.locator(".campaignStages > span").nth(3)).toHaveClass("done");
  await expect(notebook.locator(".campaignStages > span").nth(0)).toHaveClass("current");
  await expect(notebook.locator(".campaignStages > span").nth(1)).not.toHaveClass("done");
  await expect(card(page, "Parenthèses de l’Estérel")).toContainText("1/2");
  expect(await overflow(page)).toBe(false); await notebook.scrollIntoViewIfNeeded(); await page.screenshot({ path: testInfo.outputPath("esterel-carnet-out-of-order.png") });
  await page.getByRole("button", { name: /Plus/ }).click();
  await expect(page.locator(".badge").filter({ has: page.getByRole("heading", { name: "Roches rouges", exact: true }) })).toContainText("0/3");
});

test("a real Napoléon escape resumes, completes only the short carnet and recomputes it after deletion", async ({ page }, testInfo) => {
  const errors: string[] = []; page.on("pageerror", (error) => errors.push(error.message));
  await page.clock.install(); await seed(page, shortIds.slice(0, 3).map(complete));
  await browse(page); await page.getByLabel("Thème", { exact: true }).selectOption("napoleon");
  await page.getByLabel("Durée simulée").selectOption("30");
  await page.getByLabel("Rechercher").fill("Saint-Théoffrey → Laffrey");
  await card(page, "Route Napoléon · Saint-Théoffrey → Laffrey").getByRole("button", { name: "Partir en balade", exact: true }).click();
  await page.getByRole("button", { name: "Démarrer la séance" }).click(); await page.clock.fastForward(5 * 60_000);
  await page.getByRole("button", { name: "Pause", exact: true }).click(); await page.clock.fastForward(6000); await page.reload();
  await page.getByRole("button", { name: "Reprendre", exact: true }).click();
  await expect(page.locator(".routePlaceNow strong")).toHaveText("Saint-Théoffrey");
  await page.getByRole("button", { name: "Reprendre", exact: true }).click(); await page.clock.fastForward(12 * 60_000);
  await page.getByLabel("J’ai vérifié le bilan et les champs facultatifs.").check(); await page.getByRole("button", { name: /Valider la quête/ }).click();
  await expect.poll(async () => (await stored(page)).sessions.length).toBe(4);
  const result = (await stored(page)).sessions.at(-1);
  expect(result.routeId).toBe(shortIds[3]); expect(result.metrics.completedRoute).toBe(true);
  await page.reload(); await browse(page); await objectives(page);
  await expect(card(page, "Route Napoléon · petites escales")).toContainText("Campagne terminée");
  await expect(card(page, "Route Napoléon · de la mer à Gap")).toContainText("0/8");
  await expect(card(page, "Route Napoléon · de Gap à Grenoble")).toContainText("0/6");
  await page.getByRole("button", { name: /Plus/ }).click();
  const fullTrophy = page.locator(".badge").filter({ has: page.getByRole("heading", { name: "Traversée impériale", exact: true }) });
  await expect(fullTrophy).toContainText("0/14");
  await expect(page.locator(".badge").filter({ has: page.getByRole("heading", { name: "Aigle de poche", exact: true }) })).toContainText("Débloqué");
  expect(await overflow(page)).toBe(false); await page.screenshot({ path: testInfo.outputPath("napoleon-escales-trophies.png") });
  await page.getByRole("button", { name: /Suivi/ }).click();
  await page.locator(".sessionHistoryRow").filter({ hasText: "Saint-Théoffrey → Laffrey" }).first().click();
  page.once("dialog", (dialog) => dialog.accept()); await page.getByRole("button", { name: "Supprimer cette séance" }).click();
  await page.reload(); await browse(page); await objectives(page);
  await expect(card(page, "Route Napoléon · petites escales")).toContainText("3/4");
  await expect(card(page, "Route Napoléon · de Gap à Grenoble")).toContainText("0/6"); expect(errors).toEqual([]);
});
