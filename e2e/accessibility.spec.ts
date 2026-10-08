import { expect, test, type Page, type Locator } from "@playwright/test";

async function prepare(page: Page) {
  await page.addInitScript(() => {
    if (!localStorage.getItem("veloquest:v1")) localStorage.setItem("veloquest:v1", JSON.stringify({
      profile: { name: "Accessibilité QA", startDate: "2026-10-01" }, sessions: [], measurements: [],
      preferences: { readerView: "full", soundCues: false, voiceCues: false, haptics: false, keepScreenAwake: false }
    }));
  });
  await page.goto("/");
  await expect(page.locator(".hero")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize()!.width);
  await page.getByRole("button", { name: /⚡ Séances/ }).click();
  const opener = page.getByRole("heading", { name: "Décrassage", exact: true }).locator("xpath=ancestor::article").getByRole("button", { name: "Voir / démarrer" });
  await opener.focus();
  await page.keyboard.press("Enter");
  return opener;
}

async function noHorizontalOverflow(dialog: Locator) {
  expect(await dialog.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
}

test("keyboard stays in the session, follows each phase and returns after saving", async ({ page }, info) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  const opener = await prepare(page);
  const dialog = page.getByRole("dialog");
  await expect(dialog).toHaveAccessibleName("Préparer la séance");
  await expect(dialog.getByRole("heading", { name: "Décrassage", exact: true })).toBeFocused();
  expect(await page.locator(".bottomNav").evaluate(el => (el as HTMLElement).inert)).toBe(true);
  await page.locator(".bottomNav button").first().evaluate((el: HTMLElement) => el.focus());
  expect(await dialog.evaluate(el => el.contains(document.activeElement))).toBe(true);
  const close = dialog.getByRole("button", { name: "Mettre la séance de côté" });
  const start = dialog.getByRole("button", { name: "Démarrer la séance" });
  await close.focus(); await page.keyboard.press("Shift+Tab"); await expect(start).toBeFocused();
  await page.keyboard.press("Tab"); await expect(close).toBeFocused();
  await start.focus(); await page.keyboard.press("Enter");
  await expect(dialog).toHaveAccessibleName("Séance en cours");
  await expect(dialog.locator("h2").first()).toBeFocused();
  await dialog.getByRole("button", { name: "Pause", exact: true }).press("Space");
  const details = dialog.getByRole("button", { name: "Réglages et détails", exact: true });
  await details.press("Enter");
  await expect(dialog.getByRole("button", { name: "Revenir à la séance" })).toBeFocused();
  await page.keyboard.press("Escape"); await expect(details).toBeFocused();
  await dialog.getByRole("button", { name: "Terminer et enregistrer" }).press("Enter");
  await expect(dialog).toHaveAccessibleName("Bilan de séance");
  await expect(dialog.getByRole("heading", { name: "Enregistre ta performance" })).toBeFocused();
  await dialog.getByLabel("Note", { exact: true }).fill("Clavier vérifié");
  await page.keyboard.press("Escape"); await expect(close).toBeFocused();
  await expect(dialog.getByLabel("Note", { exact: true })).toHaveValue("Clavier vérifié");
  await dialog.getByLabel("J’ai vérifié le bilan et les champs facultatifs.").press("Space");
  await dialog.getByRole("button", { name: /Valider la quête/ }).press("Enter");
  await expect(dialog).toHaveCount(0);
  await expect(opener).toBeFocused();
  expect(await page.evaluate(() => document.body.style.overflow)).toBe("");
  expect(await page.locator(".bottomNav").evaluate(el => (el as HTMLElement).inert)).toBe(false);
  await page.screenshot({ path: info.outputPath("clavier-retour.png") });
  await page.reload();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("veloquest:v1")!).sessions);
  expect(saved).toHaveLength(1); expect(saved[0].note).toBe("Clavier vérifié");
});

test("200 percent text reflows the landscape journey without losing review inputs", async ({ page }, info) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await prepare(page);
  await page.addStyleTag({ content: "html { font-size:200% !important; }" });
  const dialog = page.getByRole("dialog");
  await noHorizontalOverflow(dialog);
  const sections = dialog.locator(".journeyBody > section");
  const first = (await sections.nth(0).boundingBox())!;
  const second = (await sections.nth(1).boundingBox())!;
  expect(second.y).toBeGreaterThanOrEqual(first.y + first.height);
  await dialog.getByLabel("Rythme de pédalage").selectOption("10");
  await dialog.getByRole("button", { name: "Démarrer la séance" }).click();
  await dialog.getByRole("button", { name: "Pause", exact: true }).click();
  expect(await page.evaluate(() => innerWidth)).toBe(1024);
  await noHorizontalOverflow(dialog);
  await dialog.getByRole("button", { name: "Terminer et enregistrer" }).click();
  await dialog.getByLabel("Distance (km)", { exact: true }).fill("2.4");
  await dialog.getByLabel("Note", { exact: true }).fill("Texte agrandi");
  await page.setViewportSize({ width: 768, height: 1024 });
  await expect(dialog.getByLabel("Note", { exact: true })).toHaveValue("Texte agrandi");
  await page.setViewportSize({ width: 1024, height: 768 });
  await noHorizontalOverflow(dialog);
  await dialog.getByLabel("J’ai vérifié le bilan et les champs facultatifs.").check();
  const submit = dialog.getByRole("button", { name: /Valider la quête/ });
  await submit.scrollIntoViewIfNeeded();
  await expect(submit).toBeInViewport({ ratio: 1 });
  await page.screenshot({ path: info.outputPath("bilan-texte-200.png") });
  await submit.click();
  await page.reload();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("veloquest:v1")!).sessions);
  expect(saved).toHaveLength(1); expect(saved[0]).toMatchObject({ note: "Texte agrandi", metrics: { distanceKm: 2.4 } });
});

test("320 pixel manual journey keeps the review usable and preserves a parked session", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await prepare(page);
  const dialog = page.getByRole("dialog");
  await noHorizontalOverflow(dialog);
  await dialog.getByRole("button", { name: "Démarrer la séance" }).click();
  await dialog.getByRole("button", { name: "Pause", exact: true }).click();
  await expect.poll(() => page.evaluate(() => localStorage.getItem("veloquest:active-session:v1"))).not.toBeNull();
  await dialog.getByRole("button", { name: "Mettre la séance de côté" }).click();
  await expect(dialog).toHaveCount(0);
  await page.reload();
  await page.getByRole("button", { name: "Reprendre", exact: true }).click();
  await expect(dialog).toHaveAccessibleName("Séance en cours");
  await dialog.getByRole("button", { name: "Terminer et enregistrer" }).click();
  await noHorizontalOverflow(dialog);
  await dialog.getByLabel("Date et heure de la séance").fill("2026-10-08T10:00");
  await dialog.getByLabel("RPE ressenti /10").fill("4");
  await dialog.getByLabel("J’ai vérifié le bilan et les champs facultatifs.").check();
  await dialog.getByRole("button", { name: /Valider la quête/ }).click();
  await page.reload();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("veloquest:v1")!).sessions.length)).toBe(1);
  expect(await page.evaluate(() => localStorage.getItem("veloquest:active-session:v1"))).toBeNull();
});
