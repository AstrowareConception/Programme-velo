import { expect, test } from "@playwright/test";

test("a rejected history write keeps review fields and recovery until a successful retry", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.addInitScript(() => {
    if (!localStorage.getItem("veloquest:v1")) localStorage.setItem("veloquest:v1", JSON.stringify({
      profile: { name: "Sauvegarde QA", startDate: "2026-10-01" }, sessions: [{ id: "existing", templateId: "recovery-30", date: "2026-10-06T18:00:00Z", duration: 20, xp: 35, points: 1, intensity: "easy", kind: "recovery", bonus: false }], measurements: [],
      preferences: { soundCues: false, voiceCues: false, haptics: false, keepScreenAwake: false }
    }));
  });
  await page.goto("/");
  await page.getByRole("button", { name: /⚡ Séances/ }).click();
  await page.getByRole("heading", { name: "Décrassage", exact: true }).locator("xpath=ancestor::article").getByRole("button", { name: "Voir / démarrer" }).click();
  await page.getByRole("button", { name: "Démarrer la séance", exact: true }).click();
  await expect.poll(() => page.evaluate(() => localStorage.getItem("veloquest:active-session:v1"))).not.toBeNull();
  await page.getByRole("button", { name: "Terminer et enregistrer", exact: true }).click();
  await page.getByLabel("Durée (min)", { exact: true }).fill("12");
  await page.getByLabel("Distance (km)", { exact: true }).fill("3.2");
  await page.getByLabel("RPE ressenti /10").fill("4");
  await page.getByLabel("Note", { exact: true }).fill("À garder si le stockage refuse");
  await page.getByLabel("J’ai vérifié le bilan et les champs facultatifs.").check();
  const previous = await page.evaluate(() => localStorage.getItem("veloquest:v1"));
  await page.evaluate(() => {
    const set = Storage.prototype.setItem;
    const remove = Storage.prototype.removeItem;
    let blocked = true;
    window.addEventListener("qa-allow-history", () => { blocked = false; }, { once: true });
    Storage.prototype.setItem = function (key, value) {
      if (key === "veloquest:v1" && blocked) throw new DOMException("Storage full", "QuotaExceededError");
      set.call(this, key, value);
    };
    Storage.prototype.removeItem = function (key) {
      if (key === "veloquest:active-session:v1") {
        const count = JSON.parse(localStorage.getItem("veloquest:v1")!).sessions.length;
        set.call(sessionStorage, "qa:history-before-clear", String(count));
      }
      remove.call(this, key);
    };
  });
  await page.getByRole("button", { name: /Valider la quête/ }).click();
  await expect(page.locator(".finishForm").getByRole("alert")).toContainText("Séance non enregistrée");
  await expect(page.getByLabel("Note", { exact: true })).toHaveValue("À garder si le stockage refuse");
  expect(await page.evaluate(() => localStorage.getItem("veloquest:v1"))).toBe(previous);
  expect(await page.evaluate(() => localStorage.getItem("veloquest:active-session:v1"))).not.toBeNull();
  expect(await page.evaluate(() => sessionStorage.getItem("qa:history-before-clear"))).toBeNull();
  await page.setViewportSize({ width: 1024, height: 768 });
  const retry = page.getByRole("button", { name: "Réessayer l’enregistrement" });
  await expect(retry).toBeInViewport({ ratio: 1 });
  await retry.click();
  await expect(page.getByLabel("Distance (km)", { exact: true })).toHaveValue("3.2");
  await expect(page.getByLabel("Durée (min)", { exact: true })).toHaveValue("12");
  await expect(page.getByLabel("RPE ressenti /10")).toHaveValue("4");
  await page.evaluate(() => window.dispatchEvent(new Event("qa-allow-history")));
  await retry.click();
  await expect(page.locator(".finishForm")).toHaveCount(0);
  expect(await page.evaluate(() => sessionStorage.getItem("qa:history-before-clear"))).toBe("2");
  expect(await page.evaluate(() => localStorage.getItem("veloquest:active-session:v1"))).toBeNull();
  await page.reload();
  await expect(page.locator(".hero")).toBeVisible();
  const state = await page.evaluate(() => JSON.parse(localStorage.getItem("veloquest:v1")!));
  expect(state.sessions).toHaveLength(2);
  expect(state.sessions[0].id).toBe("existing");
  expect(state.sessions[1]).toMatchObject({ duration: 12, rpe: 4, note: "À garder si le stockage refuse", metrics: { distanceKm: 3.2 } });
  await expect(page.getByText("SÉANCE INTERROMPUE", { exact: true })).toHaveCount(0);
  expect(errors).toEqual([]);
});
