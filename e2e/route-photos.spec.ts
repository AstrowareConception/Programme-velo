import { openReaderDetails, closeReaderDetails } from "./reader-layout-helpers";
import { expect, test as baseTest, type Page, type Locator } from "@playwright/test";
import { climbs } from "../lib/routes";

const test = baseTest.extend<{ pageErrors: string[] }>({ pageErrors: [async ({ page }, use) => {
  const errors: string[] = []; page.on("pageerror", e => errors.push(e.message)); await use(errors); expect(errors).toEqual([]);
}, { auto: true }] });
const route = climbs.find(r => r.id === "cagnes-cannes-littoral")!;
const old = { id: "old", templateId: "recovery-30", date: "2026-10-01T12:00:00Z", duration: 30, points: 1, xp: 35, intensity: "easy", kind: "recovery", bonus: false };
const measurement = { id: "m", date: "2026-10-01T12:00:00Z", weight: 100 };
const state = { profile: { name: "Photo QA", startDate: "2026-10-01" }, sessions: [old], measurements: [measurement], favoriteRouteIds: [route.id], voyage: { routeId: route.id, minutes: 15 }, preferences: { readerView: "full", soundCues: false, voiceCues: false, haptics: false, keepScreenAwake: false, keepTelemetryTrace: true, resistanceOffset: 0 } };
const reader = (page: Page) => page.locator(".sessionModal").filter({ has: page.getByRole("button", { name: "Mettre la séance de côté" }) });
const gallery = (scope: Page | Locator) => scope.getByRole("region", { name: "Photos du parcours" });
const stored = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem("veloquest:v1")!));
async function seed(page: Page, value = state) {
  await page.addInitScript(value => { if (!localStorage.getItem("veloquest:v1")) localStorage.setItem("veloquest:v1", JSON.stringify(value)); }, value);
  await page.goto("/");
}
async function findRoute(page: Page) {
  await page.getByRole("button", { name: /▲ Parcours/ }).click();
  await page.getByLabel("Rechercher", { exact: true }).fill(route.name);
  return page.locator("article.routeLibraryCard");
}
async function openPhotos(scope: Page | Locator) {
  const photos = gallery(scope);
  await photos.getByText(/Voir les photos ·/).click();
  return photos;
}
async function loaded(photos: Locator, suffix: string) {
  const img = photos.getByRole("img");
  await expect(img).toHaveAttribute("src", new RegExp(`/landscapes/${suffix}\\.webp$`));
  expect(await img.evaluate(el => new URL((el as HTMLImageElement).src).origin === location.origin)).toBe(true);
  await img.scrollIntoViewIfNeeded();
  await expect.poll(() => img.evaluate(el => (el as HTMLImageElement).complete && (el as HTMLImageElement).naturalWidth > 0)).toBe(true);
}
async function noOverflow(page: Page) { expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true); }

test("photos load only on opening, show credits and browse the cities without changing the journal", async ({ page }, info) => {
  const requests: string[] = []; page.on("request", r => { if (r.url().includes("/landscapes/")) requests.push(r.url()); });
  await seed(page); const card = await findRoute(page);
  await expect(gallery(card).getByRole("img")).toHaveCount(0); expect(requests).toEqual([]);
  const photos = await openPhotos(card); await loaded(photos, "cagnes");
  await expect(photos).toContainText("Olivier Cleynen");
  await expect(photos.getByRole("link", { name: "CC BY 4.0", exact: true })).toHaveAttribute("href", "https://creativecommons.org/licenses/by/4.0/");
  await expect(photos.getByRole("button", { name: "Photo précédente", exact: true })).toBeDisabled();
  for (const id of ["antibes", "golfe-juan", "cannes"]) {
    await photos.getByRole("button", { name: "Photo suivante", exact: true }).click(); await loaded(photos, id);
  }
  await expect(photos).toContainText("Cannes · Croisette");
  await expect(photos).toContainText("sans recadrage");
  await expect(photos.getByRole("button", { name: "Photo suivante", exact: true })).toBeDisabled();
  await noOverflow(page); expect(await photos.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true); await photos.screenshot({ path: info.outputPath("landscape-gallery.png") });
  await photos.getByText(/Voir les photos ·/).click(); await expect(photos.getByRole("img")).toHaveCount(0);
  const data = await stored(page); expect(data.sessions).toEqual([old]); expect(data.measurements).toEqual([measurement]); expect(data.voyage).toEqual(state.voyage);
});

test("hiding photos persists after reload and restoring the choice preserves the existing profile", async ({ page }) => {
  const requests: string[] = []; page.on("request", r => { if (r.url().includes("/landscapes/")) requests.push(r.url()); });
  await seed(page); await page.getByRole("button", { name: /••• Plus/ }).click();
  await page.getByText("Son, voix et média", { exact: true }).click();
  await page.getByRole("checkbox", { name: "Photos des paysages", exact: true }).uncheck();
  await expect.poll(async () => (await stored(page)).preferences.showRoutePhotos).toBe(false);
  await page.reload(); let card = await findRoute(page); await expect(gallery(card)).toHaveCount(0); expect(requests).toEqual([]);
  await page.getByRole("button", { name: /••• Plus/ }).click(); await page.getByText("Son, voix et média", { exact: true }).click();
  await expect(page.getByRole("checkbox", { name: "Photos des paysages", exact: true })).not.toBeChecked();
  await page.getByRole("checkbox", { name: "Photos des paysages", exact: true }).check();
  card = await findRoute(page); const photos = await openPhotos(card); await loaded(photos, "cagnes");
  const data = await stored(page); expect(data.profile).toEqual(state.profile); expect(data.sessions).toEqual([old]); expect(data.measurements).toEqual([measurement]); expect(data.favoriteRouteIds).toEqual([route.id]); expect(data.voyage).toEqual(state.voyage);
});

test("Voyage photos follow absolute places, free browsing and pause recovery without granting progress", async ({ page }, info) => {
  const completed = { ...old, id: "portion", templateId: "voyage", routeId: route.id, duration: 48, points: 0, xp: 0, metrics: { completedRoute: false, voyage: { version: 1, startKm: 0, endKm: 12, routeDistanceKm: route.distanceKm, routeXp: route.xp, completedPortion: true, positionSource: "simulation" } } };
  await seed(page, { ...state, sessions: [old, completed] }); await page.clock.install();
  await page.getByRole("region", { name: "Mon voyage" }).getByRole("button", { name: "Continuer mon voyage", exact: true }).click();
  await openReaderDetails(page); let photos = await openPhotos(reader(page)); await loaded(photos, "antibes");
  await reader(page).getByRole("button", { name: "Démarrer la séance", exact: true }).click();
  await openReaderDetails(page); photos = await openPhotos(reader(page)); await loaded(photos, "antibes");
  await expect(photos).toContainText("Dernier repère illustré · Antibes");
  await photos.getByRole("button", { name: "Photo suivante", exact: true }).click(); await loaded(photos, "golfe-juan");
  await expect(photos).toContainText("Aperçu du parcours · Golfe-Juan");
  await photos.getByRole("button", { name: "Suivre les repères", exact: true }).click(); await loaded(photos, "antibes");
  await closeReaderDetails(page); await page.clock.fastForward(20_000); await reader(page).getByRole("button", { name: "Pause", exact: true }).click();
  const timer = await reader(page).locator(".timer").innerText();
  await reader(page).getByRole("button", { name: "Vue essentielle", exact: true }).click(); await expect(gallery(reader(page))).toHaveCount(0);
  if (info.project.name === "mobile-chromium") { await page.setViewportSize({ width: 844, height: 390 }); await expect(reader(page).locator(".timer")).toBeInViewport(); await page.setViewportSize({ width: 390, height: 844 }); }
  await reader(page).getByRole("button", { name: "Mettre la séance de côté", exact: true }).click(); await page.reload();
  await page.getByRole("button", { name: "Reprendre", exact: true }).click(); await expect(reader(page).locator(".timer")).toHaveText(timer);
  await reader(page).getByRole("button", { name: "Vue complète", exact: true }).click(); await openReaderDetails(page); photos = await openPhotos(reader(page)); await loaded(photos, "antibes");
  await noOverflow(page); const data = await stored(page); expect(data.sessions).toEqual([old, completed]);
});

test("an unavailable photo keeps credits and workout controls and can be retried", async ({ page }) => {
  await page.route("**/landscapes/cagnes.webp", r => r.abort());
  await seed(page); const card = await findRoute(page); await card.getByRole("button", { name: "Partir en balade", exact: true }).click();
  await openReaderDetails(page); const photos = await openPhotos(reader(page));
  await expect(photos.getByText(/Photo indisponible\./)).toBeVisible(); await expect(photos).toContainText("Olivier Cleynen");
  await page.unroute("**/landscapes/cagnes.webp"); await photos.getByRole("button", { name: "Réessayer la photo", exact: true }).click(); await loaded(photos, "cagnes");
  await reader(page).getByRole("button", { name: "Démarrer la séance", exact: true }).click(); await expect(reader(page).getByRole("button", { name: "Pause", exact: true })).toBeVisible();
  await noOverflow(page); expect((await stored(page)).sessions).toEqual([old]);
});
