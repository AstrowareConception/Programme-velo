import { test, expect } from "@playwright/test";
test("unconfigured cloud stays offline and preserves existing data and exports", async ({ page }) => {
  const requests: string[] = [];
  page.on("request", r => { if (/firebase|firestore|identitytoolkit|securetoken/.test(r.url())) requests.push(r.url()); });
  await page.addInitScript(() => { localStorage.setItem("veloquest:v1", JSON.stringify({ profile: { name: "Local QA", startDate: "2026-10-08" }, sessions: [], measurements: [] })); });
  await page.goto("/"); await page.getByRole("button", { name: /••• Plus/ }).click();
  await expect(page.getByRole("region", { name: "Sauvegarde et synchronisation" })).toContainText("Le cloud n’est pas encore activé");
  await expect(page.getByRole("button", { name: "Exporter une sauvegarde JSON v3" })).toBeVisible();
  expect(requests).toEqual([]);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("veloquest:v1")!).profile.name)).toBe("Local QA");
});
test("an interrupted cloud install exposes its recovery backup instead of overwriting it", async ({ page }) => {
  await page.addInitScript(() => {
    const state = { profile: { name: "Recovery QA", startDate: "2026-10-08" }, sessions: [], measurements: [] };
    localStorage.setItem("veloquest:cloud-apply:v1", JSON.stringify({ "veloquest:v1": JSON.stringify(state), "veloquest:custom-routes:v1": "[]", "veloquest:cloud-link:v1": JSON.stringify({ uid: "u", revision: "r" }) }));
    const write = Storage.prototype.setItem; Storage.prototype.setItem = function(key, value) { if (key === "veloquest:cloud-link:v1") throw new DOMException("quota", "QuotaExceededError"); return write.call(this, key, value); };
  });
  await page.goto("/"); await expect(page.getByRole("heading", { name: "Ta restauration locale est protégée" })).toBeVisible();
  await expect(page.getByLabel("Texte complet de la sauvegarde")).toContainText("Recovery QA");
  expect(await page.evaluate(() => Boolean(localStorage.getItem("veloquest:cloud-apply:v1")))).toBe(true);
});
