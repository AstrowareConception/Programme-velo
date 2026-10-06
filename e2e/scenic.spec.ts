import { expect, test, type Page } from "@playwright/test";

test.use({ timezoneId: "Europe/Paris" });
const baseState = { profile: { name: "QA Balades", startDate: "2026-10-01" }, sessions: [], measurements: [], favoriteRouteIds: [],
  preferences: { soundCues: false, voiceCues: false, haptics: false, keepScreenAwake: false } };
const completed = (routeId: string) => ({ id: routeId, routeId, templateId: `climb-${routeId}`, date: "2026-10-03T18:00:00Z",
  duration: 30, xp: 50, points: 1, intensity: "easy", kind: "endurance", bonus: false, metrics: { source: "manual", completedRoute: true } });
async function seed(page: Page, sessions: object[] = []) {
  await page.addInitScript((value) => {
    if (!localStorage.getItem("veloquest:v1")) localStorage.setItem("veloquest:v1", JSON.stringify(value));
  }, { ...baseState, sessions });
}
async function stored(page: Page) { return page.evaluate(() => JSON.parse(localStorage.getItem("veloquest:v1")!)); }
function chambordCard(page: Page) { return page.getByRole("heading", { name: "Chambord · petit tour", exact: true }).locator("xpath=ancestor::article"); }
async function browse(page: Page) {
  await page.getByRole("button", { name: /Parcours/ }).click();
  await page.getByRole("button", { name: "Explorer les 38 balades" }).click();
}

test("scenic catalogue, landscape, map profile and favorites work without overflow", async ({ page }, testInfo) => {
  const errors: string[] = []; page.on("pageerror", (error) => errors.push(error.message));
  await seed(page); await page.goto("/"); await browse(page);
  await expect(page.locator(".routeLibraryCard")).toHaveCount(38);
  await expect(page.locator(".routeLibraryCard").filter({ hasText: "Difficulté 1/5" })).toHaveCount(38);
  await page.getByLabel("Rechercher").fill("Chambord");
  const card = chambordCard(page);
  await card.getByText("Découvrir le paysage", { exact: true }).click();
  await expect(card).toContainText("domaine de Chambord");
  await expect(card).toContainText("IGN RGE ALTI");
  await expect(card.getByRole("img", { name: "Profil altimétrique de Chambord · petit tour" })).toBeVisible();
  await card.getByRole("button", { name: "Ajouter aux favoris" }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("balade-catalogue.png"), fullPage: true });
  await page.reload(); await page.getByRole("button", { name: /Parcours/ }).click();
  await page.getByRole("button", { name: /♥ Favoris/ }).click();
  await expect(page.locator(".routeLibraryCard")).toHaveCount(1);
  await expect(chambordCard(page)).toBeVisible();
  await chambordCard(page).getByRole("button", { name: "Partir en balade" }).click();
  await expect(page.getByText("BALADE · 1/5", { exact: true })).toBeVisible();
  await expect(page.locator(".previewStats")).toContainText("facile");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("balade-preparation.png") });
  expect(errors).toEqual([]);
});

test("coastal landmarks follow the ride through towns and survive a pause and reload", async ({ page }, testInfo) => {
  const errors: string[] = []; page.on("pageerror", (error) => errors.push(error.message));
  await page.clock.install(); await seed(page); await page.goto("/"); await browse(page);
  const card = page.getByRole("heading", { name: "Côte d’Azur · Cagnes-sur-Mer → Cannes", exact: true }).locator("xpath=ancestor::article");
  await card.getByText("Les villes traversées · 7 repères", { exact: true }).click();
  await expect(card.locator(".routePlaces li strong")).toHaveText(["Cagnes-sur-Mer", "Villeneuve-Loubet", "Antibes", "Juan-les-Pins", "Golfe-Juan", "Cannes · Palm Beach", "Cannes · Croisette"]);
  await card.getByRole("button", { name: "Partir en balade" }).click();
  await expect(page.locator(".previewStats")).toContainText("facile");
  await page.getByRole("button", { name: "Démarrer la séance" }).click();
  await expect(page.locator(".routePlaceNow strong")).toHaveText("Cagnes-sur-Mer");
  await expect(page.locator(".routePlaceNow")).toContainText("À suivre : Villeneuve-Loubet");
  await page.clock.fastForward(41 * 60 * 1000);
  await expect(page.locator(".routePlaceNow strong")).toHaveText("Antibes");
  await expect(page.locator(".routePlaceNow")).toContainText("À suivre : Juan-les-Pins");
  await page.getByRole("button", { name: "Pause", exact: true }).click(); await page.reload();
  await page.getByRole("button", { name: "Reprendre", exact: true }).click();
  await expect(page.locator(".routePlaceNow strong")).toHaveText("Antibes");
  await page.locator(".routePlaceNow").scrollIntoViewIfNeeded();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("littoral-antibes.png") });
  expect(errors).toEqual([]);
});

test("the short coastal ride finishes at Cannes and never validates Cagnes to Cannes", async ({ page }) => {
  await page.clock.install(); await seed(page); await page.goto("/"); await browse(page);
  const card = page.getByRole("heading", { name: "Côte d’Azur · Golfe-Juan → Cannes", exact: true }).locator("xpath=ancestor::article");
  await card.getByRole("button", { name: "Partir en balade" }).click();
  await expect(page.locator(".previewStats")).toContainText("30 min");
  await page.getByRole("button", { name: "Démarrer la séance" }).click();
  await page.clock.fastForward(31 * 60 * 1000);
  await expect(page.getByLabel("Date et heure de la séance")).toBeVisible();
  await page.getByLabel("J’ai vérifié le bilan et les champs facultatifs.").check(); await page.getByRole("button", { name: /Valider la quête/ }).click();
  await expect.poll(async () => (await stored(page)).sessions.length).toBe(1);
  const saved = (await stored(page)).sessions[0];
  expect(saved.routeId).toBe("golfe-juan-cannes-balade");
  expect(saved.metrics.completedRoute).toBe(true);
  await page.reload(); await browse(page);
  const full = page.getByRole("heading", { name: "Côte d’Azur · Cagnes-sur-Mer → Cannes", exact: true }).locator("xpath=ancestor::article");
  await expect(full.locator(".timeAttackSummary")).toContainText("TENTATIVES0");
  await page.getByRole("button", { name: /Plus/ }).click();
  await expect(page.locator(".badge").filter({ has: page.getByRole("heading", { name: "Premier paysage", exact: true }) })).toContainText("Débloqué");
});

test("a fully ridden scenic route earns its notebook and deletion restores the missing stage", async ({ page }) => {
  await page.clock.install();
  await seed(page, [completed("re-chemins-campagne"), completed("loire-tours-villandry")]);
  await page.goto("/"); await browse(page);
  await page.getByLabel("Rechercher").fill("Chambord");
  await chambordCard(page).getByRole("button", { name: "Partir en balade" }).click();
  await page.getByRole("button", { name: "Démarrer la séance" }).click();
  await expect(page.getByText("BALADE · RYTHME DOUX", { exact: true })).toBeVisible();
  await expect(page.locator(".resistance strong")).toHaveText(/[4-9]|10/);
  await page.clock.fastForward(26 * 60 * 1000);
  await expect(page.getByLabel("Date et heure de la séance")).toBeVisible();
  await page.getByLabel("RPE ressenti /10").fill("3");
  await page.getByLabel("J’ai vérifié le bilan et les champs facultatifs.").check(); await page.getByRole("button", { name: /Valider la quête/ }).click();
  await expect.poll(async () => (await stored(page)).sessions.length).toBe(3);
  const saved = (await stored(page)).sessions.at(-1);
  expect(saved.routeId).toBe("chambord-petit-tour");
  expect(saved.intensity).toBe("easy");
  expect(saved.metrics.completedRoute).toBe(true);
  expect(saved.metrics.timeAttack).toBeUndefined();
  await page.reload(); await page.getByRole("button", { name: /Parcours/ }).click();
  await page.getByText("Campagnes et carnets · 22 objectifs à découvrir", { exact: true }).click();
  const notebook = page.getByRole("heading", { name: "Échappées patrimoine", exact: true }).locator("xpath=ancestor::article");
  await expect(notebook).toContainText("Campagne terminée");
  await page.getByRole("button", { name: /Plus/ }).click();
  await expect(page.locator(".badge").filter({ has: page.getByRole("heading", { name: "Flâneur de France", exact: true }) })).toContainText("Débloqué");
  await page.getByRole("button", { name: /Suivi/ }).click();
  await page.locator(".sessionHistoryRow").filter({ hasText: "Chambord" }).click();
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Supprimer cette séance" }).click();
  await page.getByRole("button", { name: /Parcours/ }).click();
  await page.getByText("Campagnes et carnets · 22 objectifs à découvrir", { exact: true }).click();
  await expect(notebook).toContainText("2/3");
  await expect(notebook.getByRole("button", { name: /Continuer/ })).toContainText("Chambord");
  await page.reload(); await page.getByRole("button", { name: /Plus/ }).click();
  await expect(page.locator(".badge").filter({ has: page.getByRole("heading", { name: "Flâneur de France", exact: true }) })).toContainText("2/3");
});

test("a paused scenic ride restores the gentle reader and an unfinished ride earns no landscape trophy", async ({ page }) => {
  await seed(page); await page.goto("/"); await browse(page);
  await page.getByLabel("Rechercher").fill("Chambord");
  await chambordCard(page).getByRole("button", { name: "Partir en balade" }).click();
  await page.getByRole("button", { name: "Démarrer la séance" }).click();
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await page.reload();
  await page.getByRole("button", { name: "Reprendre", exact: true }).click();
  await expect(page.getByText("BALADE · RYTHME DOUX", { exact: true })).toBeVisible();
  await page.getByText("Ton carnet de paysage", { exact: true }).click();
  await expect(page.locator(".sceneryDetails")).toContainText("Chambord");
  await page.getByRole("button", { name: "Terminer et enregistrer" }).click();
  await page.getByLabel("J’ai vérifié le bilan et les champs facultatifs.").check(); await page.getByRole("button", { name: /Valider la quête/ }).click();
  await expect.poll(async () => (await stored(page)).sessions.length).toBe(1);
  expect((await stored(page)).sessions[0].metrics.completedRoute).toBe(false);
  await page.getByRole("button", { name: /Plus/ }).click();
  await expect(page.locator(".badge").filter({ has: page.getByRole("heading", { name: "Premier paysage", exact: true }) })).toContainText("0/1");
});

test("the extra guided workouts and soft bonus keep their own preflight and manual levels", async ({ page }) => {
  await seed(page); await page.goto("/");
  await page.getByRole("button", { name: /Séances/ }).click();
  for (const title of ["Roulage contemplatif", "Cadence fluide", "Petites vagues", "Parenthèse souple"]) {
    const card = page.getByRole("heading", { name: title, exact: true }).locator("xpath=ancestor::article");
    await card.getByRole("button", { name: "Voir / démarrer" }).click();
    await expect(page.getByText("PRÉPARATION", { exact: true })).toBeVisible();
    await expect(page.locator(".segmentPlan")).toContainText("niveau");
    await page.getByRole("button", { name: "Mettre la séance de côté" }).click();
  }
  await page.getByRole("button", { name: /Quête/ }).click();
  await page.getByRole("button", { name: "12 min souples" }).click();
  await expect(page.getByRole("heading", { name: "Parenthèse souple", exact: true })).toBeVisible();
  await expect(page.locator(".previewStats")).toContainText("12 min");
});

test("route actions form a regular touch grid on narrow phones", async ({ page }, info) => {
  await seed(page); await page.goto("/"); await browse(page);
  await page.getByLabel("Rechercher").fill("Chambord");
  const actions = chambordCard(page).locator(".climbActions");
  if (info.project.name === "mobile-chromium") await page.setViewportSize({ width: 320, height: 740 });
  await actions.scrollIntoViewIfNeeded();
  const boxes = await actions.locator("button").evaluateAll(elements => elements.map(el => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height, overflow: el.scrollWidth > el.clientWidth }; }));
  expect(boxes.every(box => box.height >= 44 && !box.overflow)).toBe(true);
  if (info.project.name === "mobile-chromium") {
    expect(Math.abs(boxes[1].y - boxes[2].y)).toBeLessThan(1);
    expect(Math.abs(boxes[1].y - boxes[3].y)).toBeLessThan(1);
    expect(Math.abs(boxes[1].width - boxes[3].width)).toBeLessThan(1);
    expect(boxes[0].width).toBeGreaterThan(boxes[1].width * 2);
  }
  await actions.screenshot({ path: info.outputPath("route-actions.png") });
  await actions.getByRole("button", { name: "⚡ Segments" }).click();
  await expect(page.getByRole("heading", { name: "Choisis ton secteur." })).toBeVisible();
});

test("workout badges have space before comfortable mobile start buttons", async ({ page }, info) => {
  await seed(page); await page.goto("/"); await page.getByRole("button", { name: /Séances/ }).click();
  if (info.project.name === "mobile-chromium") await page.setViewportSize({ width: 320, height: 740 });
  const card = page.locator(".workoutCard").first();
  await card.scrollIntoViewIfNeeded();
  if (info.project.name === "mobile-chromium") {
    const layout = await card.evaluate(el => ({ gap: el.querySelector("button")!.getBoundingClientRect().top - el.querySelector(".chips")!.getBoundingClientRect().bottom, height: el.querySelector("button")!.getBoundingClientRect().height, overflow: el.scrollWidth > el.clientWidth }));
    expect(layout.gap).toBeGreaterThanOrEqual(12); expect(layout.height).toBeGreaterThanOrEqual(44); expect(layout.overflow).toBe(false);
  }
  await card.screenshot({ path: info.outputPath("workout-card.png") });
  await card.getByRole("button", { name: "Voir / démarrer" }).click();
  await expect(page.getByRole("button", { name: "Démarrer la séance", exact: true })).toBeVisible();
});
