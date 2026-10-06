import { expect, test, type Page } from "@playwright/test";
import { alsaceFullRouteIds, alsaceShortRouteIds } from "../lib/alsace-routes";
import { climbs } from "../lib/routes";

const complete = (routeId: string) => ({ id: routeId, routeId, templateId: `climb-${routeId}`, date: "2026-10-03T10:00:00Z", duration: 25, xp: 45, points: 1, kind: "endurance", intensity: "easy", bonus: false, metrics: { source: "manual", completedRoute: true } });
const stored = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem("veloquest:v1")!));
const card = (page: Page, title: string) => page.locator("article.card").filter({ has: page.getByRole("heading", { name: title, exact: true }) });
const browse = (page: Page) => page.getByRole("button", { name: /▲ Parcours/ }).click();
const objectives = (page: Page) => page.getByText("Campagnes et carnets · 22 objectifs à découvrir", { exact: true }).click();
async function seed(page: Page, sessions: object[] = []) {
  await page.addInitScript(value => { if (!localStorage.getItem("veloquest:v1")) localStorage.setItem("veloquest:v1", JSON.stringify(value)); }, {
    profile: { name: "QA Alsace", startDate: "2026-10-01" }, sessions, measurements: [{ id: "m", date: "2026-10-01T12:00:00Z", weight: 100 }], favoriteRouteIds: [],
    preferences: { soundCues: false, voiceCues: false, haptics: false, keepScreenAwake: false }
  });
  await page.goto("/");
}
async function noOverflow(page: Page) { expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true); }

test("Alsace shows nine distinct sourced routes and saves a favourite without altering the journal", async ({ page }, info) => {
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  await seed(page); await browse(page); await page.getByLabel("Thème", { exact: true }).selectOption("alsace-vineyards");
  await expect(page.locator("article.routeLibraryCard")).toHaveCount(9);
  await page.getByLabel("Durée simulée").selectOption("30");
  await expect(page.locator("article.routeLibraryCard")).toHaveCount(3);
  await page.getByLabel("Rechercher", { exact: true }).fill("Eguisheim");
  const route = climbs.find(r => r.id === "alsace-turckheim-eguisheim-short")!;
  const entry = card(page, route.name); await expect(entry).toContainText("1/5");
  await entry.getByRole("button", { name: /Ajouter aux favoris/ }).click();
  await page.reload(); await browse(page); await page.getByLabel("Rechercher", { exact: true }).fill(route.name);
  const photos = card(page, route.name).getByRole("region", { name: "Photos du parcours" });
  await photos.getByText(/Voir les photos/).click();
  const image = photos.getByRole("img"); await image.scrollIntoViewIfNeeded();
  await expect.poll(() => image.evaluate(el => (el as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  await expect(photos).toContainText("Gzen92"); await expect(photos).toContainText("aucune visite");
  await noOverflow(page); await photos.screenshot({ path: info.outputPath("alsace-eguisheim-gallery.png") });
  const data = await stored(page); expect(data.favoriteRouteIds).toContain(route.id); expect(data.sessions).toEqual([]); expect(data.measurements).toHaveLength(1); expect(errors).toEqual([]);
});

test("the notebooks reflect out-of-order completions and never replace full stages with short passages", async ({ page }, info) => {
  await seed(page, [complete(alsaceFullRouteIds[5]), ...alsaceShortRouteIds.map(complete)]);
  await browse(page); await objectives(page);
  const full = card(page, "Vignoble d’Alsace · la traversée");
  await expect(full).toContainText("1/6"); await expect(full.locator(".campaignStages > span").nth(5)).toHaveClass("done");
  await expect(full.locator(".campaignStages > span").nth(0)).toHaveClass("current");
  await expect(card(page, "Parenthèses alsaciennes")).toContainText("Campagne terminée");
  await full.scrollIntoViewIfNeeded(); await noOverflow(page); await full.screenshot({ path: info.outputPath("alsace-notebook.png") });
  await page.getByRole("button", { name: /••• Plus/ }).click();
  await expect(page.locator(".badge").filter({ has: page.getByRole("heading", { name: "Vignes et villages", exact: true }) })).toContainText("1/3");
  await expect(page.locator(".badge").filter({ has: page.getByRole("heading", { name: "Vignoble en poche", exact: true }) })).toContainText("Débloqué");
});

test("an Alsace escape pauses, reloads, finishes and loses its unique notebook bonus after deletion", async ({ page }) => {
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  const route = climbs.find(r => r.id === "alsace-obernai-bernardswiller-short")!;
  await page.clock.install(); await seed(page, alsaceShortRouteIds.filter(id => id !== route.id).map(complete));
  await browse(page); await page.getByLabel("Rechercher", { exact: true }).fill(route.name);
  await card(page, route.name).getByRole("button", { name: "Partir en balade", exact: true }).click();
  await page.getByRole("button", { name: "Démarrer la séance", exact: true }).click(); await page.clock.fastForward(3 * 60_000);
  await page.getByRole("button", { name: "Pause", exact: true }).click(); await page.clock.fastForward(6000); await page.reload();
  await page.getByRole("button", { name: "Reprendre", exact: true }).click();
  await expect(page.locator(".routePlaceNow strong")).toHaveText("Obernai");
  await page.getByRole("button", { name: "Reprendre", exact: true }).click(); await page.clock.fastForward(15 * 60_000);
  await page.getByLabel("J’ai vérifié le bilan et les champs facultatifs.").check(); await page.getByRole("button", { name: /Valider la quête/ }).click();
  await expect.poll(async () => (await stored(page)).sessions.length).toBe(3);
  expect((await stored(page)).sessions.at(-1).metrics.completedRoute).toBe(true);
  await page.reload(); await browse(page); await objectives(page);
  await expect(card(page, "Parenthèses alsaciennes")).toContainText("Campagne terminée");
  await expect(card(page, "Vignoble d’Alsace · la traversée")).toContainText("0/6");
  await page.getByRole("button", { name: /Suivi/ }).click();
  await page.locator(".sessionHistoryRow").filter({ hasText: "Obernai → Bernardswiller" }).first().click();
  page.once("dialog", dialog => dialog.accept()); await page.getByRole("button", { name: "Supprimer cette séance" }).click();
  await page.reload(); await browse(page); await objectives(page);
  await expect(card(page, "Parenthèses alsaciennes")).toContainText("2/3");
  expect((await stored(page)).measurements).toHaveLength(1); expect(errors).toEqual([]);
});

test("mountain and Esterel images keep the original date precision, viewpoints and credits", async ({ page }, info) => {
  const requests: string[] = []; page.on("request", r => { if (r.url().includes("/landscapes/")) requests.push(r.url()); });
  await seed(page); await browse(page);
  for (const [id, photoId, caption] of [["ventoux-bedoin", "ventoux", "août 2007"], ["galibier-valloire", "galibier", "versant opposé"], ["esterel-agay-trayas", "esterel-cap-roux", "ne représente ni la chaussée"]]) {
    await page.getByLabel("Rechercher", { exact: true }).fill(climbs.find(r => r.id === id)!.name);
    const photos = page.locator("article.routeLibraryCard").getByRole("region", { name: "Photos du parcours" });
    await expect(photos.getByRole("img")).toHaveCount(0);
    expect(requests.some(url => url.endsWith(`/${photoId}.webp`))).toBe(false);
    await photos.getByText(/Voir les photos/).click(); const image = photos.getByRole("img"); await image.scrollIntoViewIfNeeded();
    await expect.poll(() => image.evaluate(el => new URL((el as HTMLImageElement).src).pathname)).toBe(`/landscapes/${photoId}.webp`);
    await expect.poll(() => image.evaluate(el => (el as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    await expect(photos).toContainText(caption); await expect(photos.getByRole("link", { name: "Source et original ↗" })).toBeVisible();
    await noOverflow(page); await photos.screenshot({ path: info.outputPath(`${photoId}-gallery.png`) });
  }
  expect((await stored(page)).sessions).toEqual([]);
});
