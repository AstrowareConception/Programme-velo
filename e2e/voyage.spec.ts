import { expect, test as baseTest, type Page } from "@playwright/test";
import { climbs } from "../lib/routes";
import { voyagePlan, voyageWorkout } from "../lib/voyage";

const test = baseTest.extend<{ pageErrors: string[] }>({ pageErrors: [async ({ page }, use) => {
  const errors: string[] = []; page.on("pageerror", e => errors.push(e.message)); await use(errors); expect(errors).toEqual([]);
}, { auto: true }] });
const route = climbs.find(r => r.id === "napoleon-mougins-mouans-short")!;
const original = { id: "old", templateId: "recovery-30", date: "2026-10-01T12:00:00Z", duration: 30, points: 1, xp: 35, intensity: "easy", kind: "recovery", bonus: false };
const base = { profile: { name: "Voyage QA", startDate: "2026-10-01" }, sessions: [original], measurements: [{ id: "m", date: "2026-10-01T12:00:00Z", weight: 100 }], favoriteRouteIds: [route.id], preferences: { readerView: "essential", soundCues: false, voiceCues: false, haptics: false, keepScreenAwake: false, keepTelemetryTrace: true, resistanceOffset: 0 } };
const stored = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem("veloquest:v1")!));
const panel = (page: Page) => page.getByRole("region", { name: "Mon voyage" });
const reader = (page: Page) => page.locator(".sessionModal").filter({ has: page.getByRole("button", { name: "Mettre la séance de côté" }) });
async function seed(page: Page, state = base, snapshot?: unknown) {
  await page.addInitScript(({ state, snapshot }) => {
    if (!localStorage.getItem("veloquest:v1")) {
      localStorage.setItem("veloquest:v1", JSON.stringify(state));
      if (snapshot) localStorage.setItem("veloquest:active-session:v1", JSON.stringify(snapshot));
    }
  }, { state, snapshot });
}
async function prepare(page: Page) {
  await page.getByRole("button", { name: /▲ Parcours/ }).click();
  await page.getByLabel("Rechercher", { exact: true }).fill(route.name);
  await page.locator("article.routeLibraryCard").getByRole("button", { name: /Voyage en plusieurs séances/ }).click();
  await panel(page).getByLabel("Temps disponible").selectOption("15");
}
async function begin(page: Page, continuation = false) {
  await panel(page).getByRole("button", { name: continuation ? "Continuer mon voyage" : "Commencer mon voyage", exact: true }).click();
  await reader(page).getByRole("button", { name: "Démarrer la séance", exact: true }).click();
}
async function finish(page: Page, minutes: number) {
  await page.clock.fastForward(Math.ceil(minutes * 60 + 1) * 1000);
  await expect(reader(page).getByText(/Portion achevée/)).toBeVisible();
  await page.getByLabel("J’ai vérifié le bilan et les champs facultatifs.").check(); await reader(page).getByRole("button", { name: "Enregistrer ma portion" }).click();
}
async function noOverflow(page: Page) { expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true); }

test("a Voyage saves one portion, resumes after reload, completes once and preserves the old journal", async ({ page }, info) => {
  await seed(page); await page.clock.install(); await page.goto("/"); await prepare(page);
  await expect(panel(page)).toContainText("0.00 → 3.75 km"); await begin(page);
  await expect(reader(page).getByRole("button", { name: "Suivant →" })).toBeDisabled();
  await expect(reader(page).getByText(/Voyage · position simulée/)).toBeVisible();
  if (info.project.name === "mobile-chromium") {
    await page.setViewportSize({ width: 844, height: 390 });
    expect(await reader(page).evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
    const timerBox = await reader(page).locator(".timer").boundingBox();
    const controlsBox = await reader(page).locator(".readerControls").boundingBox();
    expect(timerBox!.y + timerBox!.height).toBeLessThanOrEqual(controlsBox!.y + 2);
    await page.screenshot({ path: info.outputPath("voyage-landscape.png") });
    await page.setViewportSize({ width: 390, height: 844 });
  }
  await page.clock.fastForward(60_000); await reader(page).getByRole("button", { name: "Pause", exact: true }).click();
  const before = await reader(page).locator(".timer").innerText();
  await reader(page).getByRole("button", { name: "Mettre la séance de côté" }).click();
  await page.getByRole("button", { name: /⌂ Quête/ }).click();
  await expect(panel(page).getByRole("button", { name: "Commencer mon voyage" })).toBeDisabled();
  await page.clock.fastForward(5000); await page.reload();
  await page.getByRole("button", { name: "Reprendre", exact: true }).click();
  await expect(reader(page).locator(".timer")).toHaveText(before);
  await reader(page).getByRole("button", { name: "Reprendre", exact: true }).click();
  await finish(page, 15);
  await page.getByRole("button", { name: /⌂ Quête/ }).click();
  await expect(panel(page)).toContainText(`3.75 / ${route.distanceKm.toFixed(2)} km`);
  await expect(page.locator(".levelPill")).toContainText("35 XP");
  await page.screenshot({ path: info.outputPath("voyage-progress.png") }); await noOverflow(page);
  await page.reload(); await expect(panel(page).getByLabel("Temps disponible")).toHaveValue("15");
  await begin(page, true);
  const remainder = voyageWorkout(route, voyagePlan(route, (await stored(page)).sessions, 15)!).duration;
  await finish(page, remainder);
  await expect(panel(page)).toContainText("Voyage achevé");
  await expect(panel(page).getByRole("button", { name: "Continuer mon voyage" })).toHaveCount(0);
  await expect(page.locator(".levelPill")).toContainText(`${35 + route.xp} XP`);
  const data = await stored(page);
  expect(data.sessions).toHaveLength(3); expect(data.sessions[0]).toEqual(original);
  expect(data.sessions.slice(1).every((s: any) => s.xp === 0 && s.metrics.completedRoute === false && s.metrics.voyage.completedPortion)).toBe(true);
  expect(data.measurements).toEqual(base.measurements); expect(data.favoriteRouteIds).toEqual(base.favoriteRouteIds);
});

test("early finish or an edited measured distance cannot validate a Voyage portion", async ({ page }) => {
  await seed(page); await page.clock.install(); await page.goto("/"); await prepare(page); await begin(page);
  await page.clock.fastForward(90_000); await reader(page).getByRole("button", { name: "Terminer et enregistrer" }).click();
  await expect(reader(page).getByText(/Portion inachevée/)).toBeVisible();
  await reader(page).getByRole("button", { name: "Continuer cette portion" }).click();
  await expect(reader(page).getByRole("button", { name: "Reprendre", exact: true })).toBeVisible();
  await reader(page).getByRole("button", { name: "Terminer et enregistrer" }).click();
  await reader(page).getByLabel("Distance (km)", { exact: true }).fill("999");
  await page.getByLabel("J’ai vérifié le bilan et les champs facultatifs.").check(); await reader(page).getByRole("button", { name: "Enregistrer ma portion" }).click();
  await page.getByRole("button", { name: /⌂ Quête/ }).click();
  await expect(panel(page)).toContainText("0.00 → 3.75 km");
  const session = (await stored(page)).sessions[1];
  expect(session.metrics.voyage.completedPortion).toBe(false); expect(session.metrics.completedRoute).toBe(false); expect(session.duration).toBe(1.5);
  await expect(page.locator(".levelPill")).toContainText("35 XP");
});

test("deleting an earlier portion reopens the missing gap, removes trophies and route XP", async ({ page }) => {
  const half = route.distanceKm / 2;
  const portions = [0, half].map((start, i) => ({ ...original, id: `portion-${i}`, templateId: "voyage-qa", routeId: route.id, xp: 0, points: 0,
    date: `2026-10-0${i + 2}T12:00:00Z`, metrics: { source: "manual", completedRoute: false, voyage: { version: 1, startKm: start, endKm: i ? route.distanceKm : half, routeDistanceKm: route.distanceKm, routeXp: route.xp, completedPortion: true, positionSource: "simulation" } } }));
  await seed(page, { ...base, sessions: [original, ...portions], voyage: { routeId: route.id, minutes: 30 } } as any); await page.goto("/");
  await expect(panel(page)).toContainText("Voyage achevé");
  await page.getByRole("button", { name: /Suivi/ }).click();
  await page.locator(".sessionHistoryRow").filter({ hasText: route.name }).last().click();
  await expect(page.getByText(/Cette séance seule ne valide pas/)).toBeVisible();
  page.once("dialog", d => d.accept()); await page.getByRole("button", { name: "Supprimer cette séance" }).click();
  await page.getByRole("button", { name: /⌂ Quête/ }).click();
  await expect(panel(page)).toContainText(`0.00 → ${half.toFixed(2)} km`);
  await expect(page.locator(".levelPill")).toContainText("35 XP");
  await page.reload(); await expect(panel(page).getByRole("button", { name: "Continuer mon voyage" })).toBeVisible();
  await page.getByRole("button", { name: /Plus/ }).click();
  await expect(page.locator(".badge").filter({ has: page.getByRole("heading", { name: "Au bout du voyage" }) })).toContainText("0/1");
});

test("backup restores a Voyage selection and preserves an interrupted race", async ({ page }) => {
  const raceRoute = climbs.find(r => r.id === "alpe-dhuez")!;
  const snapshot = { version: 1, savedAt: Date.now(), workoutId: `climb-${raceRoute.id}`, routeId: raceRoute.id, routeMode: "timeAttack", segmentIndex: 0, secondsLeft: 30, running: false, sessionStarted: true, showFinish: false, timeAttackElapsedSeconds: 120, timeAttackSplits: [], pauseCount: 0, sessionResistanceDelta: 0, telemetrySamples: [], hadBikeConnection: false };
  await seed(page, base, snapshot); await page.goto("/"); await prepare(page);
  await expect(panel(page).getByRole("button", { name: "Commencer mon voyage" })).toBeDisabled();
  await page.getByRole("button", { name: "Fermer le voyage" }).click();
  await page.getByRole("button", { name: /Plus/ }).click();
  const backup = { format: "veloquest-backup-v3", state: { ...base, voyage: { routeId: route.id, minutes: 45 } }, customClimbs: [] };
  await page.locator('input[type="file"][accept="application/json"]').setInputFiles({ name: "voyage.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(backup)) });
  await page.getByRole("button", { name: /⌂ Quête/ }).click();
  await expect(panel(page).getByLabel("Temps disponible")).toHaveValue("45");
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("veloquest:active-session:v1")!).routeId)).toBe(raceRoute.id);
  await page.getByRole("button", { name: "Reprendre", exact: true }).click();
  await expect(reader(page).getByText("CHRONO", { exact: true })).toBeVisible();
  await expect(reader(page).getByText("2:00", { exact: true })).toBeVisible();
});

test("a missing personal GPX keeps the Voyage journal and offers another route", async ({ page }) => {
  await seed(page, { ...base, voyage: { routeId: "gpx-removed", minutes: 30 } } as any); await page.goto("/");
  await expect(page.getByRole("heading", { name: "Parcours du voyage indisponible" })).toBeVisible();
  await page.getByRole("button", { name: "Choisir un autre voyage" }).click();
  await expect(page.getByLabel("Rechercher", { exact: true })).toBeVisible();
  expect((await stored(page)).sessions).toEqual(base.sessions);
});

test("a personal GPX Voyage restores from JSON, finishes on its own geometry and survives GPX deletion", async ({ page }) => {
  await seed(page); await page.clock.install(); await page.goto("/");
  const custom = { ...route, id: "gpx-voyage-qa", name: "Mon GPX Voyage", category: "imported" };
  const portion = { ...original, id: "gpx-portion", routeId: custom.id, templateId: "voyage-gpx", xp: 0, points: 0,
    metrics: { source: "manual", completedRoute: false, voyage: { version: 1, startKm: 0, endKm: 2, routeDistanceKm: custom.distanceKm, routeXp: custom.xp, completedPortion: true, positionSource: "simulation" } } };
  const backup = { format: "veloquest-backup-v3", state: { ...base, sessions: [original, portion], voyage: { routeId: custom.id, minutes: 15 } }, customClimbs: [custom] };
  await page.getByRole("button", { name: /Plus/ }).click();
  await page.locator('input[type="file"][accept="application/json"]').setInputFiles({ name: "gpx-voyage.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(backup)) });
  await page.getByRole("button", { name: /⌂ Quête/ }).click();
  await expect(panel(page)).toContainText(`2.00 → ${custom.distanceKm.toFixed(2)} km`);
  await begin(page, true);
  await reader(page).getByRole("button", { name: "Vue complète", exact: true }).click();
  await expect(reader(page).getByText("Mon GPX Voyage", { exact: true })).toBeVisible();
  await expect(reader(page).getByRole("img", { name: "Profil altimétrique de Mon GPX Voyage" })).toBeVisible();
  await noOverflow(page);
  await finish(page, voyageWorkout(custom as any, voyagePlan(custom as any, [portion] as any, 15)!).duration);
  await expect(panel(page)).toContainText("Voyage achevé");
  await expect(page.locator(".levelPill")).toContainText(`${35 + custom.xp} XP`);
  await noOverflow(page);
  const reward = page.getByRole('complementary', { name: 'Récompense obtenue' });
  if (await reward.isVisible()) await reward.getByRole('button', { name: 'Continuer', exact: true }).click();
  await page.getByRole("button", { name: /▲ Parcours/ }).click(); await page.getByLabel("Rechercher", { exact: true }).fill(custom.name);
  await page.locator("article.routeLibraryCard").getByRole("button", { name: "Supprimer", exact: true }).click();
  await page.getByRole("button", { name: /⌂ Quête/ }).click();
  await expect(page.getByRole("heading", { name: "Parcours du voyage indisponible" })).toBeVisible();
  await expect(page.locator(".levelPill")).toContainText(`${35 + custom.xp} XP`);
  expect((await stored(page)).sessions.filter((s: any) => s.routeId === custom.id)).toHaveLength(2);
});
