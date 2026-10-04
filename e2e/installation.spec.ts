import { expect, test, type Page } from "@playwright/test";

const state = {
  profile: { name: "QA Installation", startDate: "2026-10-01" },
  sessions: [{ id: "previous-session", templateId: "recovery-20", date: "2026-10-02T10:00:00Z", duration: 20, points: 1, xp: 35, intensity: "easy", kind: "recovery", bonus: false, rpe: 3 }],
  measurements: [{ id: "previous-measurement", date: "2026-10-02T10:00:00Z", weight: 78 }], favoriteRouteIds: ["galibier-valloire"],
  preferences: { soundCues: false, voiceCues: false, haptics: false, keepScreenAwake: false, keepTelemetryTrace: true, resistanceOffset: 0 }
};
async function open(page: Page) {
  await page.addInitScript((value) => localStorage.setItem("veloquest:v1", JSON.stringify(value)), state);
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /QA Installation, ta quête continue/ })).toBeVisible();
}
const card = (page: Page) => page.getByRole("button", { name: "Installer VeloQuest", exact: true });
const more = (page: Page) => page.getByRole("button", { name: /Plus/ }).click();
async function invitation(page: Page, outcome: "accepted" | "dismissed" | "failed" | "pending") {
  return page.evaluate((choice) => {
    const qa = { calls: 0, resolve: (_: { outcome: string }) => {} };
    Object.assign(window, { installationQA: qa });
    const event = new Event("beforeinstallprompt", { cancelable: true });
    Object.assign(event, {
      prompt: async () => { qa.calls++; if (choice === "failed") throw new Error("Unavailable"); },
      userChoice: choice === "pending" ? new Promise((resolve) => { qa.resolve = resolve; }) : Promise.resolve({ outcome: choice })
    });
    return window.dispatchEvent(event);
  }, outcome);
}
const calls = (page: Page) => page.evaluate(() => (window as unknown as { installationQA: { calls: number } }).installationQA.calls);

test("invitation received on Quête survives tabs, is consumed once and waits for appinstalled", async ({ page }) => {
  const errors: string[] = []; page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => {
    localStorage.setItem("veloquest:custom-routes:v1", "[]");
    localStorage.setItem("veloquest:active-session:v1", JSON.stringify({ version: 1, savedAt: Date.now(), workoutId: "progressive-35", routeMode: "training", segmentIndex: 2, secondsLeft: 180, running: false, sessionStarted: true, showFinish: false, timeAttackElapsedSeconds: 0, timeAttackSplits: [], pauseCount: 0, sessionResistanceDelta: 0, telemetrySamples: [], hadBikeConnection: false }));
  });
  await open(page);
  expect(await invitation(page, "dismissed")).toBe(false);
  await more(page);
  const retained = () => page.evaluate(() => ["veloquest:v1", "veloquest:custom-routes:v1", "veloquest:active-session:v1"].map((key) => localStorage.getItem(key)));
  const before = await retained();
  await expect(card(page)).toContainText("Ouvre la confirmation");
  await card(page).click();
  await expect(page.getByRole("status")).toContainText("Installation annulée");
  expect(await calls(page)).toBe(1);
  await page.getByRole("button", { name: /Séances/ }).click(); await more(page);
  await card(page).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  expect(await calls(page)).toBe(1);
  await page.getByRole("button", { name: "J’ai compris" }).click();
  await invitation(page, "pending");
  await card(page).click();
  await expect(card(page)).toBeDisabled();
  expect(await calls(page)).toBe(1);
  await page.evaluate(() => (window as unknown as { installationQA: { resolve: (value: { outcome: string }) => void } }).installationQA.resolve({ outcome: "accepted" }));
  await expect(page.getByRole("status")).toContainText("Installation acceptée");
  await expect(page.getByRole("region", { name: "VeloQuest installée" })).toHaveCount(0);
  await page.evaluate(() => window.dispatchEvent(new Event("appinstalled")));
  await expect(page.getByRole("region", { name: "VeloQuest installée" })).toBeVisible();
  await expect(card(page)).toHaveCount(0);
  expect(await retained()).toEqual(before);
  expect(errors).toEqual([]);
});

test("a failed native invitation opens help and does not reuse the consumed event", async ({ page }) => {
  const errors: string[] = []; page.on("pageerror", (error) => errors.push(error.message));
  await open(page); await more(page); await invitation(page, "failed");
  await card(page).click();
  await expect(page.getByRole("dialog")).toContainText("n’a pas pu ouvrir");
  await page.getByRole("button", { name: "J’ai compris" }).click();
  await card(page).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  expect(await calls(page)).toBe(1);
  expect(errors).toEqual([]);
});

test("help accepts a later browser invitation without a reload", async ({ page }) => {
  await open(page); await more(page); await card(page).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await invitation(page, "accepted");
  await page.getByRole("button", { name: "Installer maintenant" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("status")).toContainText("Installation acceptée");
  expect(await calls(page)).toBe(1);
});

test("the whole card opens accessible help, restores keyboard focus and fits the viewport", async ({ page }, testInfo) => {
  await open(page); await more(page);
  await page.screenshot({ path: testInfo.outputPath("installation-card.png") });
  await card(page).focus(); await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("heading")).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("installation-help.png") });
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(card(page)).toBeFocused();
  await card(page).locator(".installTitle").click();
  await expect(dialog).toBeVisible();
});

for (const [label, userAgent, touchPoints, title, instruction] of [
  ["iPhone", "Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 Version/26.0 Mobile Safari/604.1", 1, "Sur iPhone ou iPad", "Ouvrir comme app web"],
  ["iPad desktop mode", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15 Version/26.0 Safari/605.1.15", 5, "Sur iPhone ou iPad", "écran d’accueil"],
  ["Safari Mac", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15 Version/26.0 Safari/605.1.15", 0, "Avec Safari sur Mac", "Ajouter au Dock"],
  ["Android", "Mozilla/5.0 (Linux; Android 16) AppleWebKit/537.36 Chrome/154.0 Mobile Safari/537.36", 1, "Sur Android", "Installer l’application"],
  ["Edge", "Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 Chrome/154.0 Safari/537.36 Edg/154.0", 0, "Avec Microsoft Edge", "Applications"]
] as const) {
  test(`manual installation guide: ${label}`, async ({ page }) => {
    await page.addInitScript(({ ua, touches }) => {
      Object.defineProperty(navigator, "userAgent", { get: () => ua });
      Object.defineProperty(navigator, "maxTouchPoints", { get: () => touches });
    }, { ua: userAgent, touches: touchPoints });
    await open(page); await more(page); await card(page).click();
    await expect(page.getByRole("dialog", { name: title })).toContainText(instruction);
  });
}

for (const mode of ["ios-standalone", "display-mode"] as const) {
  test(`already launched as an app: ${mode}`, async ({ page }) => {
    await page.addInitScript((value) => {
      if (value === "ios-standalone") Object.defineProperty(navigator, "standalone", { get: () => true });
      else {
        const original = window.matchMedia.bind(window);
        window.matchMedia = (query) => {
          const result = original(query);
          if (query === "(display-mode: standalone)") Object.defineProperty(result, "matches", { get: () => true });
          return result;
        };
      }
    }, mode);
    await open(page); await more(page);
    await expect(page.getByRole("region", { name: "VeloQuest installée" })).toBeVisible();
    await expect(card(page)).toHaveCount(0);
  });
}

test("manifest raster fallbacks are valid PNGs at their declared sizes", async ({ request }) => {
  const response = await request.get("/manifest.webmanifest");
  const manifest = await response.json();
  for (const size of [192, 512]) {
    const icon = manifest.icons.find((entry: { sizes: string }) => entry.sizes === `${size}x${size}`);
    expect(icon.type).toBe("image/png");
    const image = await request.get(icon.src);
    expect(image.ok()).toBe(true);
    expect(image.headers()["content-type"]).toContain("image/png");
    const bytes = await image.body();
    expect(bytes.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
    expect(bytes.readUInt32BE(16)).toBe(size);
    expect(bytes.readUInt32BE(20)).toBe(size);
  }
  expect((await request.get("/pwa-icon/999")).status()).toBe(404);
});
