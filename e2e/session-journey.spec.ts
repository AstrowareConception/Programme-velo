import { expect, test } from "@playwright/test";

for (const viewport of [{ width: 1024, height: 768 }, { width: 960, height: 600 }, { width: 390, height: 844 }]) {
  test(`preparation and review ${viewport.width}×${viewport.height}: rotation keeps fields and saving persists`, async ({ page }, info) => {
    await page.setViewportSize(viewport);
    await page.addInitScript(() => {
      if (!localStorage.getItem("veloquest:v1")) localStorage.setItem("veloquest:v1", JSON.stringify({
        profile: { name: "Première séance QA", startDate: "2026-10-01" }, sessions: [], measurements: [],
        preferences: { readerView: "full", soundCues: false, voiceCues: false, haptics: false, keepScreenAwake: false }
      }));
    });
    await page.goto("/");
    await page.getByRole("button", { name: /⚡ Séances/ }).click();
    await page.getByRole("heading", { name: "Décrassage", exact: true }).locator("xpath=ancestor::article").getByRole("button", { name: "Voir / démarrer" }).click();
    const modal = page.locator(".sessionJourneyModal");
    await expect(modal.getByRole("region", { name: "Programme de la séance" })).toBeVisible();
    await expect(modal.getByText("Mode manuel", { exact: true })).toBeVisible();
    if (viewport.width >= 960) {
      await expect(modal.getByRole("button", { name: "Démarrer la séance", exact: true })).toBeInViewport({ ratio: 1 });
      expect(await modal.evaluate(el => el.scrollWidth <= el.clientWidth + 1 && el.scrollHeight <= el.clientHeight + 1)).toBe(true);
      await page.screenshot({ path: info.outputPath(`preparation-${viewport.width}.png`) });
    }
    await modal.getByLabel("Rythme de pédalage").selectOption("10");
    await page.setViewportSize({ width: viewport.height, height: viewport.width });
    await expect(modal.getByLabel("Rythme de pédalage")).toHaveValue("10");
    await page.setViewportSize(viewport);
    await modal.getByRole("button", { name: "Démarrer la séance", exact: true }).click();
    await page.getByRole("button", { name: "Terminer et enregistrer", exact: true }).click();
    await expect(modal.getByRole("region", { name: "Récapitulatif de la séance" })).toContainText("Décrassage");
    const submit = modal.getByRole("button", { name: /Valider la quête/ });
    await expect(submit).toBeDisabled();
    if (viewport.width >= 960) {
      await expect(submit).toBeInViewport({ ratio: 1 });
      await page.screenshot({ path: info.outputPath(`bilan-${viewport.width}.png`) });
    }
    await modal.getByLabel("Durée (min)", { exact: true }).fill("12");
    await modal.getByLabel("Distance (km)", { exact: true }).fill("3.2");
    await modal.getByLabel("RPE ressenti /10").fill("4");
    await modal.getByLabel("Note", { exact: true }).fill("Première séance, rotation vérifiée");
    await page.setViewportSize({ width: viewport.height, height: viewport.width });
    await expect(modal.getByLabel("Distance (km)", { exact: true })).toHaveValue("3.2");
    await expect(modal.getByLabel("Note", { exact: true })).toHaveValue("Première séance, rotation vérifiée");
    await modal.getByLabel("J’ai vérifié le bilan et les champs facultatifs.").check();
    await submit.click();
    await expect(modal).toHaveCount(0);
    await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("veloquest:v1")!).sessions.length)).toBe(1);
    await page.reload();
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("veloquest:v1")!));
    expect(saved.sessions).toHaveLength(1);
    expect(saved.sessions[0]).toMatchObject({ duration: 12, rpe: 4, note: "Première séance, rotation vérifiée", metrics: { distanceKm: 3.2 } });
    await page.getByRole("button", { name: /↗ Suivi/ }).click();
    await expect(page.locator(".sessionHistory")).toContainText("Décrassage");
  });
}
