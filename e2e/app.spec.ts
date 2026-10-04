import { expect, test, type Page } from "@playwright/test";

const state = {
  profile: { name: "QA Rider", startDate: "2026-10-01" },
  sessions: [],
  measurements: [],
  favoriteRouteIds: [],
  preferences: {
    soundCues: false,
    voiceCues: false,
    haptics: false,
    keepScreenAwake: false,
    keepTelemetryTrace: true,
    resistanceOffset: 0
  }
};

async function seed(page: Page) {
  await page.addInitScript((value) => {
    localStorage.setItem("veloquest:v1", JSON.stringify(value));
  }, state);
}

test("first-run onboarding persists across reload", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("BIENVENUE DANS VELOQUEST")).toBeVisible();
  await page.getByLabel("Prénom ou pseudo").fill("QA Rider");
  await page.getByText("Choisir ma date de départ", { exact: true }).click();
  await page.getByLabel("Date de départ").fill("2026-10-01");
  for (let i = 0; i < 3; i++) await page.getByRole("button", { name: "Continuer", exact: true }).click();
  await page.getByRole("button", { name: "Plus tard, ouvrir ma quête" }).click();
  await expect(page.getByRole("heading", { name: /QA Rider, ta quête continue/ })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: /QA Rider, ta quête continue/ })).toBeVisible();
  await expect(page.getByText("BIENVENUE DANS VELOQUEST")).toHaveCount(0);
  await expect(page.getByRole("region", { name: "Mon démarrage accompagné" })).toBeVisible();
});

test("session catalog opens a guided preflight", async ({ page }) => {
  await seed(page);
  await page.goto("/");
  await page.getByRole("button", { name: /Séances/ }).click();
  await expect(page.getByRole("heading", { name: "Choisis ta quête" })).toBeVisible();

  const card = page.getByRole("heading", { name: "Décrassage" }).locator("xpath=ancestor::article");
  await card.getByRole("button", { name: "Voir / démarrer" }).click();

  await expect(page.getByText("PRÉPARATION")).toBeVisible();
  await expect(page.getByRole("button", { name: "Démarrer la séance" })).toBeVisible();
  await expect(page.getByText(/niveau 5–7/)).toBeVisible();
});

test("route library filters and opens Time Attack", async ({ page }) => {
  await seed(page);
  await page.goto("/");
  await page.getByRole("button", { name: /Parcours/ }).click();
  await expect(page.getByRole("heading", { name: "Cols, étapes & balades." })).toBeVisible();

  await page.getByLabel("Rechercher").fill("Galibier");
  const card = page.getByRole("heading", { name: "Col du Galibier" }).locator("xpath=ancestor::article");
  await expect(card).toBeVisible();
  await card.getByRole("button", { name: /Time Attack/ }).click();

  await expect(page.getByText("TIME ATTACK").first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Lancer le chrono" })).toBeVisible();
});

test("interrupted session can be restored", async ({ page }) => {
  await seed(page);
  await page.addInitScript(() => {
    localStorage.setItem("veloquest:active-session:v1", JSON.stringify({
      version: 1,
      savedAt: Date.now(),
      workoutId: "progressive-35",
      routeMode: "training",
      segmentIndex: 2,
      secondsLeft: 180,
      running: false,
      sessionStarted: true,
      showFinish: false,
      timeAttackElapsedSeconds: 0,
      timeAttackSplits: [],
      pauseCount: 0,
      sessionResistanceDelta: 0,
      telemetrySamples: [],
      hadBikeConnection: false
    }));
  });
  await page.goto("/");
  await expect(page.getByText("SÉANCE INTERROMPUE")).toBeVisible();
  await page.getByRole("button", { name: "Reprendre" }).click();
  await expect(page.getByRole("heading", { name: "Palier II" })).toBeVisible();
  await expect(page.getByText("03:00")).toBeVisible();
});

test("manifest is served with VeloQuest metadata", async ({ request }) => {
  const response = await request.get("/manifest.webmanifest");
  expect(response.ok()).toBeTruthy();
  const manifest = await response.json();
  expect(manifest.name).toBe("VeloQuest");
  expect(manifest.display).toBe("standalone");
});


test("route favorite is persisted locally and favorites filter isolates it", async ({ page }) => {
  await seed(page);
  await page.goto("/");
  await page.getByRole("button", { name: /Parcours/ }).click();

  await page.getByLabel("Rechercher").fill("Galibier");
  const galibier = page.getByRole("heading", { name: "Col du Galibier" }).locator("xpath=ancestor::article");
  await expect(galibier).toBeVisible();
  await galibier.getByRole("button", { name: "Ajouter aux favoris" }).click();
  await expect(galibier.getByRole("button", { name: "Retirer des favoris" })).toBeVisible();

  await expect.poll(async () => page.evaluate(() => {
    const raw = localStorage.getItem("veloquest:v1");
    return raw ? JSON.parse(raw).favoriteRouteIds : [];
  })).toContain("galibier-valloire");

  await page.getByLabel("Rechercher").fill("");
  await page.getByRole("button", { name: /Favoris/ }).click();
  await expect(page.getByRole("heading", { name: "Col du Galibier" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Mont Ventoux" })).toHaveCount(0);
});

test("route filters can isolate multi-col stages", async ({ page }) => {
  await seed(page);
  await page.goto("/");
  await page.getByRole("button", { name: /Parcours/ }).click();

  await page.getByRole("button", { name: "Étapes" }).click();
  await expect(page.getByRole("heading", { name: "Chaussy + Madeleine" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Villages médiévaux de Vaison" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Tour des Corniches" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Col du Galibier" })).toHaveCount(0);
  await expect(page.locator(".routeToolbarBottom")).toContainText("31 parcours");
});

test("challenge picker launches the selected mode and constraint", async ({ page }) => {
  await seed(page);
  await page.goto("/");
  await page.getByRole("button", { name: /Parcours/ }).click();
  await page.getByLabel("Rechercher").fill("Alpe d’Huez");

  const route = page.getByRole("heading", { name: "Alpe d’Huez" }).locator("xpath=ancestor::article");
  await route.getByRole("button", { name: /Défis/ }).click();

  await expect(page.getByRole("heading", { name: "Choisis une contrainte." })).toBeVisible();
  const pacing = page.getByRole("button", { name: /Pacing progressif/ });
  await expect(pacing).toBeVisible();
  await pacing.click();

  await expect(page.getByText("TIME ATTACK").first()).toBeVisible();
  await expect(page.getByText("DÉFI ACTIF")).toBeVisible();
  await expect(page.getByText("Pacing progressif")).toBeVisible();
  await expect(page.getByRole("button", { name: "Lancer le chrono" })).toBeVisible();
});


test("Segment Attack picker launches a quarter-route race", async ({ page }) => {
  await seed(page);
  await page.goto("/");
  await page.getByRole("button", { name: /Parcours/ }).click();
  await page.getByLabel("Rechercher").fill("Tour des Corniches");

  const route = page.getByRole("heading", { name: "Tour des Corniches" }).locator("xpath=ancestor::article");
  await route.getByRole("button", { name: /Segments/ }).click();

  await expect(page.getByText(/SEGMENT ATTACK · TOUR DES CORNICHES/)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Choisis ton secteur." })).toBeVisible();

  const choices = page.locator(".segmentAttackPicker .segmentAttackChoice");
  await expect(choices).toHaveCount(4);
  const sector3 = choices.nth(2);
  await expect(sector3).toContainText(/Secteur 3/);
  await expect(sector3).toContainText(/15.7 km/);
  await sector3.click();

  await expect(page.getByText("SEGMENT ATTACK").first()).toBeVisible();
  await expect(page.getByText(/Secteur 3 · 15.7 km/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Lancer le chrono" })).toBeVisible();
});


test("campaign panel opens the next discovery stage", async ({ page }) => {
  await seed(page);
  await page.goto("/");
  await page.getByRole("button", { name: /Parcours/ }).click();

  await page.getByText("Campagnes et carnets · 17 objectifs à découvrir", { exact: true }).click();
  const campaign = page.getByRole("heading", { name: "Découverte Provence" }).locator("xpath=ancestor::article");
  await expect(campaign).toContainText("0/4");
  await expect(campaign).toContainText("Velleron – L’Isle-sur-la-Sorgue");

  await campaign.getByRole("button", { name: /Continuer · Velleron/ }).click();

  await expect(page.getByText("PARCOURS").first()).toBeVisible();
  const preflight = page.locator(".sessionPreview");
  await expect(preflight.getByRole("heading", { name: "Velleron – L’Isle-sur-la-Sorgue" })).toBeVisible();
  await expect(preflight.getByRole("button", { name: "Démarrer la séance" })).toBeVisible();
});


test("out-of-order campaign completion marks only the actual route", async ({ page }) => {
  await page.addInitScript((value) => localStorage.setItem("veloquest:v1", JSON.stringify({
    ...value,
    sessions: [{ id: "late-stage", templateId: "climb-uchaux-loop", routeId: "uchaux-loop",
      date: "2026-10-03T18:00:00Z", duration: 60, points: 3, xp: 100,
      intensity: "moderate", kind: "hills", bonus: false,
      metrics: { source: "manual", completedRoute: true } }]
  })), state);
  await page.goto("/");
  await page.getByRole("button", { name: /Parcours/ }).click();
  await page.getByText("Campagnes et carnets · 17 objectifs à découvrir", { exact: true }).click();
  const campaign = page.getByRole("heading", { name: "Découverte Provence" }).locator("xpath=ancestor::article");
  await expect(campaign).toContainText("1/4");
  await expect(campaign.locator(".campaignStages > span").nth(0)).toHaveClass("current");
  await expect(campaign.locator(".campaignStages > span").nth(2)).toHaveClass("done");
  await expect(campaign.locator(".campaignStages > span.done")).toHaveCount(1);
});
