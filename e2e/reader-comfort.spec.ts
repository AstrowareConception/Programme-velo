import { expect, test as baseTest, type Page } from "@playwright/test";

const test = baseTest.extend<{ pageErrors: string[] }>({
  pageErrors: [async ({ page }, use) => {
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await use(errors);
    expect(errors).toEqual([]);
  }, { auto: true }]
});

const originalSession = { id: "before-comfort", templateId: "recovery-30", date: "2026-10-04T18:00:00Z", duration: 30, points: 1, xp: 35, intensity: "easy", kind: "recovery", bonus: false };
const base = { profile: { name: "Comfort QA", startDate: "2026-10-01" }, sessions: [originalSession], measurements: [{ id: "measure-before", date: "2026-10-04T18:00:00Z", weight: 100 }], favoriteRouteIds: ["galibier-valloire"], preferences: { soundCues: false, voiceCues: false, haptics: false, keepScreenAwake: true, keepTelemetryTrace: true, resistanceOffset: 2 } };

async function seed(page: Page, prefs = {}, wakeMode: "grant" | "refuse" | "pending" | "missing" = "grant") {
  await page.addInitScript(({ value, mode }) => {
    if (!localStorage.getItem("veloquest:v1")) localStorage.setItem("veloquest:v1", JSON.stringify(value));
    const w = window as any;
    w.__spoken = []; w.__wakeEvents = []; w.__wakeMode = mode; w.__visibility = "visible";
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => w.__visibility });
    class Lock extends EventTarget {
      released = false;
      async release() { if (!this.released) { this.released = true; w.__wakeEvents.push("release"); this.dispatchEvent(new Event("release")); } }
    }
    Object.defineProperty(navigator, "wakeLock", { configurable: true, value: mode === "missing" ? undefined : {
      async request() {
        w.__wakeEvents.push("request");
        if (w.__wakeMode === "refuse") throw new Error("System refused");
        if (w.__wakeMode === "pending") return await new Promise(resolve => { w.__resolveWake = () => { const lock = new Lock(); w.__lastLock = lock; resolve(lock); }; });
        const lock = new Lock(); w.__lastLock = lock; return lock;
      }
    } });
    class Utterance { constructor(public text: string) {} }
    Object.defineProperty(window, "SpeechSynthesisUtterance", { configurable: true, value: Utterance });
    Object.defineProperty(window, "speechSynthesis", { configurable: true, value: { cancel() {}, speak(utterance: any) { w.__spoken.push({ text: utterance.text, volume: utterance.volume }); } } });
  }, { value: { ...base, preferences: { ...base.preferences, ...prefs } }, mode: wakeMode });
}
const reader = (page: Page) => page.locator(".sessionModal");
async function workout(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: /⚡ Séances/ }).click();
  await page.getByRole("heading", { name: "Décrassage", exact: true }).locator("xpath=ancestor::article").getByRole("button", { name: "Voir / démarrer" }).click();
}
async function start(page: Page) { await reader(page).getByRole("button", { name: "Démarrer la séance", exact: true }).click(); }
const saved = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem("veloquest:v1")!));
const spoken = (page: Page) => page.evaluate(() => (window as any).__spoken);
async function visible(page: Page, state: "hidden" | "visible") { await page.evaluate(value => { (window as any).__visibility = value; document.dispatchEvent(new Event("visibilitychange")); }, state); }
async function setVolume(page: Page, value: number) {
  const slider = reader(page).getByRole("slider", { name: "Volume des alertes", exact: true });
  await slider.press("Home");
  for (let step = 0; step < value / 5; step++) await slider.press("ArrowRight");
  await expect(slider).toHaveValue(String(value));
}
async function noOverflow(page: Page) { expect(await reader(page).evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true); }

test("audio settings persist without changing existing history and can be tested before starting", async ({ page }) => {
  await seed(page); await workout(page);
  await reader(page).getByText("Son, voix et média", { exact: true }).click();
  await reader(page).getByLabel("Voix du coach").check();
  await setVolume(page, 25);
  await reader(page).getByLabel("Fréquence des annonces").selectOption("changes");
  await reader(page).getByLabel("Prévenir 10 secondes avant le changement").check();
  await reader(page).getByRole("button", { name: "Vue essentielle" }).click();
  await reader(page).getByRole("button", { name: "Tester mes alertes" }).click();
  await expect(reader(page).getByText(/Test envoyé/)).toBeVisible();
  await expect.poll(() => spoken(page)).toContainEqual({ text: "Test des alertes VéloQuest. niveau 10. Effort visé 3 sur dix.", volume: 0.25 });
  await expect(reader(page).getByRole("button", { name: "Démarrer la séance" })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("veloquest:active-session:v1"))).toBeNull();
  await expect.poll(async () => (await saved(page)).preferences.readerView).toBe("essential");
  const before = await saved(page);
  expect(before.sessions).toEqual(base.sessions); expect(before.measurements).toEqual(base.measurements); expect(before.favoriteRouteIds).toEqual(base.favoriteRouteIds);
  await page.reload(); await page.getByRole("button", { name: /••• Plus/ }).click();
  await page.getByText("Son, voix et média", { exact: true }).click();
  await expect(page.getByLabel("Volume des alertes", { exact: true })).toHaveValue("25");
  await expect(page.getByLabel("Fréquence des annonces")).toHaveValue("changes");
  await expect(page.getByRole("button", { name: "Vue essentielle" })).toHaveAttribute("aria-pressed", "true");
  expect((await saved(page)).sessions).toEqual(base.sessions);
});

test("essential workout pauses, restores and finishes without losing its settings", async ({ page }, info) => {
  await seed(page, { readerView: "essential" }); await page.clock.install(); await workout(page); await start(page);
  await expect(reader(page)).toHaveClass(/essentialSession/);
  await expect(reader(page).getByText("Écran maintenu éveillé", { exact: true })).toBeVisible();
  await expect(reader(page).getByText("05:00", { exact: true })).toBeVisible();
  await reader(page).getByRole("button", { name: "Pause", exact: true }).click();
  await page.clock.fastForward(5000);
  await page.reload(); await page.getByRole("button", { name: "Reprendre", exact: true }).click();
  await expect(reader(page)).toHaveClass(/essentialSession/);
  await expect(reader(page).getByText("05:00", { exact: true })).toBeVisible();
  await reader(page).getByRole("button", { name: "Reprendre", exact: true }).click();
  await noOverflow(page); await page.screenshot({ path: info.outputPath("essential-reader.png") });
  await page.clock.fastForward(30 * 60 * 1000);
  await expect(page.getByRole("heading", { name: "Enregistre ta performance" })).toBeVisible();
  await page.getByLabel("J’ai vérifié le bilan et les champs facultatifs.").check(); await page.getByRole("button", { name: /Valider/ }).click();
  await expect.poll(async () => (await saved(page)).sessions.length).toBe(2);
  const data = await saved(page); expect(data.sessions[0]).toEqual(originalSession); expect(data.sessions[1].metrics.completedWorkout).toBe(true);
});

test("screen status follows grants, pause, visibility, system release and retry", async ({ page }) => {
  await seed(page, { readerView: "essential" }); await workout(page);
  await expect(reader(page)).not.toContainText("Écran maintenu éveillé"); await start(page);
  await expect(reader(page)).toContainText("Écran maintenu éveillé");
  await reader(page).getByRole("button", { name: "Pause", exact: true }).click();
  await expect(reader(page)).toContainText("Maintien de l’écran en pause");
  await reader(page).getByRole("button", { name: "Reprendre", exact: true }).click();
  await expect(reader(page)).toContainText("Écran maintenu éveillé");
  await visible(page, "hidden"); await expect(reader(page)).toContainText("Maintien de l’écran interrompu");
  await visible(page, "visible"); await expect(reader(page)).toContainText("Écran maintenu éveillé");
  await expect(reader(page)).toContainText("De retour dans VéloQuest");
  await page.evaluate(() => (window as any).__lastLock.release());
  await expect(reader(page)).toContainText("Maintien de l’écran interrompu");
  await reader(page).getByRole("button", { name: "Réessayer le maintien" }).click();
  await expect(reader(page)).toContainText("Écran maintenu éveillé");
  expect(await page.evaluate(() => (window as any).__wakeEvents)).toEqual(["request", "release", "request", "release", "request", "release", "request"]);
  expect((await saved(page)).sessions).toEqual(base.sessions);
});

for (const mode of ["refuse", "missing"] as const) test(`a ${mode} screen lock keeps manual controls available`, async ({ page }) => {
  await seed(page, { readerView: "essential" }, mode); await workout(page); await start(page);
  await expect(reader(page)).toContainText(mode === "refuse" ? "Maintien de l’écran refusé" : "Maintien de l’écran indisponible");
  await expect(reader(page).getByRole("button", { name: "Pause", exact: true })).toBeEnabled();
  if (mode === "refuse") {
    await page.evaluate(() => { (window as any).__wakeMode = "grant"; });
    await reader(page).getByRole("button", { name: "Réessayer le maintien" }).click();
    await expect(reader(page)).toContainText("Écran maintenu éveillé");
  }
  await noOverflow(page);
});

test("a late screen grant after parking is released and cannot claim an active lock", async ({ page }) => {
  await seed(page, {}, "pending"); await workout(page); await start(page);
  await expect(reader(page)).toContainText("Maintien de l’écran en cours");
  await page.getByRole("button", { name: "Mettre la séance de côté" }).click();
  await page.evaluate(() => (window as any).__resolveWake());
  await expect.poll(() => page.evaluate(() => (window as any).__wakeEvents)).toEqual(["request", "release"]);
  await expect(reader(page)).toHaveCount(0);
  await page.getByRole("button", { name: /⌂ Quête/ }).click();
  await expect(page.getByText("SÉANCE INTERROMPUE")).toBeVisible();
});

test("calibrated voice warns once before a timed change and respects mute", async ({ page }) => {
  await seed(page, { voiceCues: true, cueVolume: 25, announceUpcoming: true, cueFrequency: "changes", readerView: "essential" });
  await page.clock.install(); await workout(page); await start(page);
  await expect.poll(async () => (await spoken(page)).length).toBe(1);
  expect((await spoken(page))[0].text).toContain("niveau 7–9");
  await page.clock.fastForward(290000);
  await expect.poll(async () => (await spoken(page)).length).toBe(2);
  expect((await spoken(page))[1]).toMatchObject({ text: "Dans dix secondes. Roulage facile. niveau 9–12. Effort visé 3–4 sur dix. Cadence 65–75 tours par minute.", volume: 0.25 });
  await page.clock.fastForward(2000); expect((await spoken(page)).length).toBe(2);
  await page.clock.fastForward(8000); await expect.poll(async () => (await spoken(page)).length).toBe(3);
  await reader(page).getByText("Son, voix et média", { exact: true }).click();
  await setVolume(page, 0);
  await reader(page).getByRole("button", { name: "Tester mes alertes" }).click();
  await expect(reader(page)).toContainText("volume des alertes est à zéro");
  await reader(page).getByRole("button", { name: "Suivant →" }).click();
  expect((await spoken(page)).length).toBe(3);
});

for (const mode of ["training", "timeAttack", "segmentAttack"] as const) test(`essential view preserves ${mode} and can return to the map`, async ({ page }) => {
  await seed(page, { readerView: "essential" }); await page.clock.install({ time: new Date("2026-10-05T12:00:00Z") }); await page.clock.pauseAt(new Date("2026-10-05T12:00:01Z")); await page.goto("/");
  await page.getByRole("button", { name: /▲ Parcours/ }).click(); await page.getByLabel("Rechercher").fill("Galibier");
  const card = page.getByRole("heading", { name: "Col du Galibier", exact: true }).locator("xpath=ancestor::article");
  await card.getByRole("button", { name: mode === "training" ? "Entraînement" : mode === "timeAttack" ? "⏱ Time Attack" : "⚡ Segments", exact: true }).click();
  if (mode === "segmentAttack") await page.locator(".segmentAttackChoice").first().click();
  await reader(page).getByRole("button", { name: mode === "training" ? "Démarrer la séance" : "Lancer le chrono", exact: true }).click();
  await expect(page.locator(".leaflet-container")).toHaveCount(0);
  await page.clock.fastForward(5000);
  if (mode !== "training") { await expect(page.getByText("0:05", { exact: true }).first()).toBeVisible(); await expect(page.getByRole("button", { name: "Chrono actif" })).toBeDisabled(); }
  const position = await reader(page).locator(".timer").textContent();
  await reader(page).getByRole("button", { name: "Vue complète" }).click();
  await expect(page.locator(".leaflet-container")).toBeVisible();
  expect(await reader(page).locator(".timer").textContent()).toBe(position);
  await reader(page).getByRole("button", { name: "Vue essentielle" }).click();
  await noOverflow(page);
  await page.getByRole("button", { name: "Mettre la séance de côté" }).click();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("veloquest:active-session:v1")!).routeMode)).toBe(mode);
  expect((await saved(page)).sessions).toEqual(base.sessions);
});

test("essential controls remain reachable in landscape", async ({ page }, info) => {
  await page.setViewportSize({ width: 844, height: 390 });
  await seed(page, { readerView: "essential" }); await workout(page); await start(page); await noOverflow(page);
  await reader(page).getByRole("button", { name: "Pause", exact: true }).click();
  await expect(reader(page).getByRole("button", { name: "Reprendre", exact: true })).toBeVisible();
  expect(await reader(page).evaluate(el => {
    const essential = el.querySelector(".sessionEssentials")!.getBoundingClientRect();
    const controls = el.querySelector(".readerControls")!.getBoundingClientRect();
    return essential.bottom <= controls.top;
  })).toBe(true);
  await page.screenshot({ path: info.outputPath("essential-landscape.png") });
});


test("cadence difficulty is reversible, stored and restored with the active workout", async ({ page }) => {
  await seed(page); await workout(page);
  await expect(page.getByLabel("Rythme de pédalage")).toHaveValue("-15");
  await page.getByLabel("Rythme de pédalage").selectOption("10");
  await page.getByLabel("Rythme de pédalage").selectOption("-15");
  await start(page);
  await expect(reader(page)).toContainText("Cible 60–70 tr/min");
  await reader(page).getByRole("button", { name: "Pause", exact: true }).click();
  await reader(page).getByRole("button", { name: "Alléger −1" }).click();
  await page.reload();
  await page.getByRole("button", { name: "Reprendre", exact: true }).click();
  await expect(reader(page)).toContainText("Cible 60–70 tr/min");
  expect((await saved(page)).sessions).toEqual(base.sessions);
});

test("coach announces plateaus and sustained pacing advice but stays quiet during pauses", async ({ page }) => {
  await seed(page, { voiceCues: true }); await page.clock.install(); await workout(page);
  await page.evaluate(() => { window.speechSynthesis.speak = (utterance: any) => { (window as any).__spoken.push({ text: utterance.text }); utterance.onend?.(); }; });
  await start(page);
  await page.clock.runFor(61000);
  await expect.poll(async () => (await spoken(page)).some((item: any) => item.text.includes("Résistance cible : niveau 8"))).toBe(true);
  await page.clock.runFor(30000);
  await expect.poll(async () => (await spoken(page)).some((item: any) => item.text.includes("de la réserve"))).toBe(true);
  await reader(page).getByRole("button", { name: "Pause", exact: true }).click();
  const count = (await spoken(page)).length;
  await page.clock.runFor(100000);
  expect((await spoken(page)).length).toBe(count);
});
