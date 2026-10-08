import { expect, test, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";

async function setup(page: Page, clipboard: "success" | "denied" | "absent" = "success", failStorage = false) {
  await page.addInitScript(({ clipboard, failStorage }) => {
    localStorage.setItem("veloquest:v1", JSON.stringify({
      profile: { name: "PRIVATE_PROFILE", startDate: "2026-10-01" },
      sessions: [{ id: "PRIVATE_SESSION", templateId: "contemplative-25", date: "2026-10-03T18:00:00Z", duration: 25, xp: 40, points: 1, intensity: "easy", kind: "endurance", bonus: false, rpe: 4, notes: "PRIVATE_NOTE" }],
      measurements: [{ id: "PRIVATE_MEASURE", date: "2026-10-02T10:00:00Z", weight: 80 }],
      favoriteRouteIds: []
    }));
    if (failStorage) {
      const original = Storage.prototype.setItem;
      Storage.prototype.setItem = function (key, value) {
        if (key === "veloquest:v1") throw new DOMException("PRIVATE_STORAGE", "QuotaExceededError");
        original.call(this, key, value);
      };
    }
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: clipboard === "absent" ? undefined : {
      async writeText(text: string) {
        if (clipboard === "denied") throw new DOMException("PRIVATE_CLIPBOARD", "NotAllowedError");
        (window as any).__copiedReport = text;
      }
    } });
    Object.defineProperty(navigator, "bluetooth", { configurable: true, value: {
      requestDevice() { (window as any).__bluetoothRequested = true; throw new Error("Must not scan"); }
    } });
  }, { clipboard, failStorage });
  await page.goto("/");
  await page.getByRole("button", { name: /••• Plus/ }).click();
  return page.getByRole("region", { name: "Un souci avec VéloQuest ?" });
}

test("preview is local, private and identical to clipboard/download even after rotation", async ({ page }, info) => {
  const panel = await setup(page);
  const before = await page.evaluate(() => JSON.stringify(localStorage));
  const requests: string[] = [];
  page.on("request", request => requests.push(request.url()));
  await panel.getByRole("button", { name: "Préparer un diagnostic" }).click();
  await expect(panel.getByRole("heading", { name: "Vérifie avant de partager" })).toBeFocused();
  const field = panel.getByLabel("Rapport technique complet");
  const preview = await field.inputValue();
  expect(preview).not.toContain("PRIVATE");
  expect(JSON.parse(preview)).toMatchObject({ schema: "veloquest-support-v1", storage: { hydrated: true, stateSaveFailed: false } });
  await page.setViewportSize({ width: 1024, height: 768 });
  await expect(field).toHaveValue(preview);
  await panel.getByRole("button", { name: "Copier le rapport", exact: true }).click();
  await expect(panel.getByRole("status")).toContainText("Rapport copié");
  expect(await page.evaluate(() => (window as any).__copiedReport)).toBe(preview);
  const event = page.waitForEvent("download");
  await panel.getByRole("button", { name: "Exporter le rapport JSON" }).click();
  const download = await event;
  expect(download.suggestedFilename()).toBe("veloquest-diagnostic-support.json");
  expect(await readFile((await download.path())!, "utf8")).toBe(preview);
  await panel.getByRole("button", { name: "Actualiser le rapport" }).click();
  expect(JSON.parse(await field.inputValue()).environment.viewport).toEqual({ width: 1024, height: 768 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await panel.screenshot({ path: info.outputPath("diagnostic-tablette.png") });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await panel.getByRole("button", { name: "Effacer le diagnostic" }).click();
  await expect(field).toHaveCount(0);
  await expect(panel.getByRole("button", { name: "Préparer un diagnostic" })).toBeFocused();
  expect(await page.evaluate(() => JSON.stringify(localStorage))).toBe(before);
  expect(await page.evaluate(() => (window as any).__bluetoothRequested)).toBeUndefined();
  expect(requests).toEqual([]);
});

for (const clipboard of ["denied", "absent"] as const) {
  test(`clipboard ${clipboard}: manual copy works offline with an observed storage failure`, async ({ page, context }) => {
    const panel = await setup(page, clipboard, true);
    await context.setOffline(true);
    await panel.getByRole("button", { name: "Préparer un diagnostic" }).click();
    const field = panel.getByLabel("Rapport technique complet");
    const text = await field.inputValue();
    expect(JSON.parse(text)).toMatchObject({ environment: { online: false }, storage: { stateSaveFailed: true } });
    await panel.getByRole("button", { name: "Copier le rapport", exact: true }).click();
    await expect(panel.getByRole("status")).toContainText("Copie automatique indisponible");
    await expect(field).toBeFocused();
    expect(await field.evaluate((element: HTMLTextAreaElement) => element.selectionEnd - element.selectionStart)).toBe(text.length);
    expect(text).not.toContain("PRIVATE");
    await panel.getByRole("button", { name: "Tout sélectionner" }).click();
    await expect(field).toBeFocused();
    await page.getByRole("button", { name: /⌂ Quête/ }).click();
    await page.getByRole("button", { name: /••• Plus/ }).click();
    await expect(field).toHaveCount(0);
    await expect(panel.getByRole("button", { name: "Préparer un diagnostic" })).toBeVisible();
  });
}
