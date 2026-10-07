import { expect, test, type Page } from "@playwright/test";
import { openReaderDetails, closeReaderDetails } from "./reader-layout-helpers";

async function seed(page: Page) {
  await page.addInitScript(() => {
    if (!localStorage.getItem("veloquest:v1")) localStorage.setItem("veloquest:v1", JSON.stringify({
      profile: { name: "Tablette QA", startDate: "2026-10-01" }, sessions: [], measurements: [],
      preferences: { readerView: "full", soundCues: false, voiceCues: false, haptics: false, keepScreenAwake: false }
    }));
  });
  await page.goto("/");
}
async function workout(page: Page) {
  await page.getByRole("button", { name: /⚡ Séances/ }).click();
  await page.getByRole("heading", { name: "Décrassage", exact: true }).locator("xpath=ancestor::article").getByRole("button", { name: "Voir / démarrer" }).click();
  await page.getByRole("button", { name: "Démarrer la séance", exact: true }).click();
}
async function fits(page: Page) {
  const reader = page.locator(".activeSessionModal");
  await expect.poll(() => reader.evaluate(el => ({
    horizontal: el.scrollWidth > el.clientWidth + 1, vertical: el.scrollHeight > el.clientHeight + 1
  }))).toEqual({ horizontal: false, vertical: false });
  for (const selector of [".dashboardHeader", ".sessionEssentials", ".actualResistance", ".effortAdjustments", ".sessionOverall", ".readerControls"]) {
    const item = reader.locator(selector);
    await expect(item).toBeInViewport({ ratio: 1 });
  }
  for (const name of ["Alléger −1", "Renforcer +1", "Terminer et enregistrer", "Réglages et détails"]) {
    const button = reader.getByRole("button", { name, exact: true });
    expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  }
}

for (const viewport of [{ width: 1024, height: 768 }, { width: 1180, height: 820 }, { width: 1280, height: 800 }, { width: 960, height: 600 }]) {
  test(`tablet ${viewport.width}×${viewport.height}: controls fit and rotation preserves the session`, async ({ page }, info) => {
    await page.setViewportSize(viewport); await seed(page); await workout(page);
    await page.getByRole("button", { name: "Pause", exact: true }).click();
    await fits(page);
    const before = await page.locator(".timer").textContent();
    await page.getByRole("button", { name: "Alléger −1" }).click();
    const target = await page.locator(".sessionEssentials .resistance strong").textContent();
    await page.screenshot({ path: info.outputPath(`tablet-${viewport.width}.png`) });
    await page.setViewportSize({ width: viewport.height, height: viewport.width });
    await expect(page.locator(".timer")).toHaveText(before!);
    await expect(page.getByRole("button", { name: "Reprendre", exact: true })).toBeVisible();
    await page.setViewportSize(viewport); await fits(page);
    await expect(page.locator(".sessionEssentials .resistance strong")).toHaveText(target!);
    await openReaderDetails(page);
    await page.getByText("Son, voix et média", { exact: true }).click();
    await page.getByLabel("Voix du coach", { exact: true }).check();
    await page.getByRole("button", { name: "Revenir à la séance" }).press("Escape");
    await expect(page.getByRole("button", { name: "Réglages et détails", exact: true })).toBeFocused();
    await fits(page);
    await page.getByRole("button", { name: "Mettre la séance de côté" }).click();
    await page.reload();
    await page.getByRole("button", { name: "Reprendre", exact: true }).click();
    await expect(page.locator(".timer")).toHaveText(before!);
    await page.getByRole("button", { name: "Terminer et enregistrer" }).click();
    await page.getByLabel("J’ai vérifié le bilan et les champs facultatifs.").check();
    await page.getByRole("button", { name: /Valider la quête/ }).click();
    await expect(page.locator(".sessionModal")).toHaveCount(0);
    await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("veloquest:v1")!).sessions.length)).toBe(1);
    await page.reload();
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("veloquest:v1")!));
    expect(saved.sessions).toHaveLength(1); expect(saved.preferences.voiceCues).toBe(true);
  });
}

for (const mode of ["Entraînement", "⏱ Time Attack", "⚡ Segments"]) {
  test(`tablet route ${mode}: map, profiles and timing remain visible`, async ({ page }, info) => {
    await page.setViewportSize({ width: 1024, height: 768 }); await seed(page);
    await page.getByRole("button", { name: /▲ Parcours/ }).click();
    await page.getByLabel("Rechercher", { exact: true }).fill("Galibier");
    const card = page.getByRole("heading", { name: "Col du Galibier", exact: true }).locator("xpath=ancestor::article");
    await card.getByRole("button", { name: mode, exact: true }).click();
    if (mode === "⚡ Segments") await page.locator(".segmentAttackChoice").first().click();
    await page.getByRole("button", { name: mode === "Entraînement" ? "Démarrer la séance" : "Lancer le chrono", exact: true }).click();
    await fits(page);
    await expect(page.locator(".routeMap")).toBeInViewport({ ratio: 1 });
    await expect(page.locator(".activeSessionModal .profileWrap")).toBeInViewport({ ratio: 1 });
    await page.screenshot({ path: info.outputPath("tablet-route.png") });
    await page.setViewportSize({ width: 960, height: 600 }); await fits(page);
    await expect(page.locator(".routeMap")).toBeInViewport({ ratio: 1 });
    await page.getByRole("button", { name: "Vue essentielle" }).click(); await fits(page);
    await expect(page.locator(".routeMap")).toHaveCount(0);
    await page.getByRole("button", { name: "Vue complète" }).click(); await fits(page);
    await openReaderDetails(page); await closeReaderDetails(page);
    if (mode !== "Entraînement") await expect(page.getByRole("button", { name: "Chrono actif" })).toBeDisabled();
    await page.getByRole("button", { name: "Mettre la séance de côté" }).click();
    const snapshot = await page.evaluate(() => JSON.parse(localStorage.getItem("veloquest:active-session:v1")!));
    expect(snapshot.routeMode).toBe(mode === "Entraînement" ? "training" : mode === "⏱ Time Attack" ? "timeAttack" : "segmentAttack");
  });
}
