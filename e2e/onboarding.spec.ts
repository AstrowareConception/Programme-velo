import { expect, test, type Page } from "@playwright/test";

test.use({ timezoneId: "Europe/Paris" });
const stored = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem("veloquest:v1")!));
const guideCard = (page: Page) => page.getByRole("region", { name: "Mon démarrage accompagné" });
async function completeGuide(page: Page) {
  await page.goto("/");
  await page.getByLabel("Prénom ou pseudo").fill("QA Débutant");
  for (let i = 0; i < 3; i++) await page.getByRole("button", { name: "Continuer", exact: true }).click();
}

test("partial setup, back navigation and manual instructions persist without requiring body measurements", async ({ page }, testInfo) => {
  const errors: string[] = []; page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByLabel("Prénom ou pseudo").fill("QA Débutant");
  await page.getByLabel("Ce qui te donne envie").selectOption("explore");
  await page.getByRole("button", { name: "Continuer", exact: true }).click();
  await page.getByLabel("Temps habituel pour une séance").selectOption("25");
  await page.getByLabel("Rendez-vous par semaine").selectOption("3");
  await page.reload();
  await expect(page.getByLabel("Temps habituel pour une séance")).toHaveValue("25");
  await expect(page.getByLabel("Rendez-vous par semaine")).toHaveValue("3");
  await page.getByRole("button", { name: "Retour", exact: true }).click();
  await expect(page.getByLabel("Prénom ou pseudo")).toHaveValue("QA Débutant");
  await page.getByText("Choisir ma date de départ", { exact: true }).click();
  await page.getByLabel("Date de départ").fill("");
  await page.getByLabel("Prénom ou pseudo").focus();
  await page.getByRole("button", { name: "Continuer", exact: true }).click();
  await page.getByRole("button", { name: "Continuer", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("sans Bluetooth");
  await page.getByLabel("Un son aux changements de segment").uncheck();
  await page.getByRole("button", { name: "Continuer", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("Premiers tours de roue");
  await page.screenshot({ path: testInfo.outputPath("onboarding-premiere-seance.png") });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole("button", { name: "Plus tard, ouvrir ma quête" }).click();
  await expect(guideCard(page)).toContainText("3 séances de 25 min");
  await expect(page.getByRole("heading", { name: "Combien de temps et quelle énergie ?" })).toBeHidden();
  expect((await stored(page)).preferences.soundCues).toBe(false);
  expect((await stored(page)).profile.startWeight).toBeUndefined();
  await page.reload(); await expect(guideCard(page)).toBeVisible();
  expect(errors).toEqual([]);
});

test("first session is prepared, paused, restored and completed before the next step", async ({ page }, testInfo) => {
  const errors: string[] = []; page.on("pageerror", (error) => errors.push(error.message));
  await page.clock.install(); await completeGuide(page);
  await page.getByRole("button", { name: "Préparer ma première séance", exact: true }).click();
  await expect(page.locator(".previewStats")).toContainText("15 min");
  await page.getByRole("button", { name: "Démarrer la séance" }).click();
  await page.clock.fastForward(2 * 60 * 1000);
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await page.clock.fastForward(6000); await page.reload();
  await expect(page.getByText("SÉANCE INTERROMPUE")).toBeVisible();
  await page.getByRole("button", { name: "Reprendre", exact: true }).click();
  await page.getByRole("button", { name: "Reprendre", exact: true }).click();
  await page.clock.fastForward(16 * 60 * 1000);
  await page.getByLabel("RPE ressenti /10").fill("3");
  await page.getByRole("button", { name: /Valider la quête/ }).click();
  await expect(guideCard(page)).toContainText("Tu as commencé");
  await expect.poll(async () => (await stored(page)).sessions.length).toBe(1);
  expect((await stored(page)).sessions[0].metrics.completedWorkout).toBe(true);
  await page.reload();
  await expect(guideCard(page).locator(".guideMilestones .done")).toHaveCount(1);
  await expect(guideCard(page)).toContainText("Comment noter mon ressenti");
  await page.evaluate(() => window.scrollTo(0, 0));
  const action = guideCard(page).getByRole("button", { name: "Préparer ma prochaine séance" });
  const box = await action.boundingBox();
  const navBox = await page.getByRole("navigation", { name: "Navigation principale" }).boundingBox();
  expect(box!.y + box!.height).toBeLessThan(navBox!.y);
  await page.screenshot({ path: testInfo.outputPath("onboarding-apres-premiere-seance.png"), fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test("an interrupted workout does not advance discovery, and deleting a completed workout rolls it back", async ({ page }) => {
  await page.clock.install(); await completeGuide(page);
  await page.getByRole("button", { name: "Préparer ma première séance", exact: true }).click();
  await page.getByRole("button", { name: "Démarrer la séance" }).click();
  await page.clock.fastForward(60_000);
  await page.getByRole("button", { name: "Terminer et enregistrer" }).click();
  await page.getByRole("button", { name: /Valider la quête/ }).click();
  await expect(guideCard(page).locator(".guideMilestones .done")).toHaveCount(0);
  await expect.poll(async () => (await stored(page)).sessions.length).toBe(1);
  expect((await stored(page)).sessions[0].metrics.completedWorkout).toBe(false);
  await guideCard(page).getByRole("button", { name: "Préparer ma première séance" }).click();
  await page.getByRole("button", { name: "Démarrer la séance" }).click();
  await page.clock.fastForward(16 * 60 * 1000);
  await page.getByRole("button", { name: /Valider la quête/ }).click();
  await expect(guideCard(page).locator(".guideMilestones .done")).toHaveCount(1);
  await expect.poll(async () => (await stored(page)).sessions.length).toBe(2);
  const completedId = (await stored(page)).sessions[1].id;
  await page.getByRole("button", { name: /Suivi/ }).click();
  await page.locator(".sessionHistoryRow").first().click();
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Supprimer cette séance", exact: true }).click();
  await expect.poll(async () => (await stored(page)).sessions.some((session: { id: string }) => session.id === completedId)).toBe(false);
  await page.reload(); await page.getByRole("button", { name: /Quête/ }).click();
  await expect(guideCard(page).locator(".guideMilestones .done")).toHaveCount(0);
});

test("existing histories remain free, guide replay and backup import preserve their data", async ({ page }) => {
  const legacy = { profile: { name: "QA Ancien", startDate: "2026-10-01", startWeight: 110 }, sessions: [{ id: "legacy-session", templateId: "contemplative-25", date: "2026-10-03T18:00:00Z", duration: 25, xp: 40, points: 1, intensity: "easy", kind: "endurance", bonus: false, rpe: 4 }], measurements: [{ id: "legacy-measure", date: "2026-10-02T10:00:00Z", weight: 109 }], favoriteRouteIds: ["chambord-petit-tour"] };
  await page.addInitScript((value) => { if (!localStorage.getItem("veloquest:v1")) localStorage.setItem("veloquest:v1", JSON.stringify(value)); }, legacy);
  await page.goto("/");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(guideCard(page)).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Combien de temps et quelle énergie ?" })).toBeVisible();
  await page.getByRole("button", { name: /Plus/ }).click();
  await page.getByRole("button", { name: "Revoir le guide de démarrage" }).click();
  await page.getByRole("button", { name: "Explorer librement", exact: true }).click();
  await page.reload(); await expect(page.getByRole("dialog")).toHaveCount(0);
  const after = await stored(page);
  expect(after.sessions).toEqual(legacy.sessions); expect(after.measurements).toEqual(legacy.measurements); expect(after.profile.startWeight).toBe(110); expect(after.favoriteRouteIds).toEqual(legacy.favoriteRouteIds);
  await page.getByRole("button", { name: /Plus/ }).click();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Exporter une sauvegarde JSON v3" }).click();
  const download = await downloadPromise;
  const path = await download.path();
  await page.getByLabel("Importer une sauvegarde").setInputFiles(path!);
  await expect.poll(async () => (await stored(page)).guidance.status).toBe("dismissed");
  await page.reload(); expect((await stored(page)).sessions).toEqual(legacy.sessions);
  expect((await stored(page)).measurements).toEqual(legacy.measurements);
});

test("the third full session reveals daily choices and easy rides while hard energy stays controlled", async ({ page }, testInfo) => {
  const errors: string[] = []; page.on("pageerror", (error) => errors.push(error.message));
  await page.clock.install();
  const initial = { profile: { name: "QA Progression", startDate: "2026-10-01" }, measurements: [], guidance: { version: 1, status: "active", step: 3, experience: "beginner", goal: "endurance", sessionMinutes: 25, weeklySessions: 3 },
    sessions: [0, 1].map((id) => ({ id: String(id), templateId: "first-pedals-15", date: "2026-10-03T18:00:00Z", duration: 15, xp: 25, points: 1, intensity: "easy", kind: "recovery", bonus: false, rpe: 3, metrics: { source: "manual", completedWorkout: true } })) };
  await page.addInitScript((value) => { if (!localStorage.getItem("veloquest:v1")) localStorage.setItem("veloquest:v1", JSON.stringify(value)); }, initial);
  await page.goto("/");
  await expect(guideCard(page).locator(".guideMilestones .done")).toHaveCount(2);
  await expect(page.getByLabel("Temps pour aujourd’hui")).toHaveCount(0);
  await guideCard(page).getByRole("button", { name: "Préparer ma prochaine séance" }).click();
  await page.getByRole("button", { name: "Démarrer la séance" }).click();
  await page.clock.fastForward(26 * 60 * 1000);
  await page.getByLabel("RPE ressenti /10").fill("4");
  await page.getByRole("button", { name: /Valider la quête/ }).click();
  await expect(guideCard(page).locator(".guideMilestones .done")).toHaveCount(3);
  await expect(page.getByLabel("Temps pour aujourd’hui")).toBeVisible();
  await page.getByLabel("Temps pour aujourd’hui").selectOption("45");
  await page.getByLabel("Énergie pour aujourd’hui").selectOption("hard");
  await expect(guideCard(page).locator(".guideWorkout")).not.toContainText("intense");
  await page.screenshot({ path: testInfo.outputPath("onboarding-programme-progressif.png"), fullPage: true });
  await guideCard(page).getByRole("button", { name: "Explorer les balades faciles" }).click();
  await expect(page.locator(".routeLibraryCard")).toHaveCount(29);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.reload(); await page.getByRole("button", { name: /Quête/ }).click();
  await expect(guideCard(page).locator(".guideMilestones .done")).toHaveCount(3);
  expect(errors).toEqual([]);
});

test("restoring an older backup from the welcome screen exits setup and restores history", async ({ page }) => {
  await page.goto("/");
  const oldState = { profile: { name: "QA Restauré", startDate: "2026-10-01" }, sessions: [{ id: "restored", templateId: "contemplative-25", date: "2026-10-03T18:00:00Z", duration: 25, xp: 40, points: 1, intensity: "easy", kind: "endurance", bonus: false }], measurements: [] };
  await page.getByLabel("Restaurer une sauvegarde").setInputFiles({ name: "ancien-v2.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify({ format: "veloquest-backup-v2", state: oldState, customClimbs: [] })) });
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: /QA Restauré, ta quête continue/ })).toBeVisible();
  await expect.poll(async () => (await stored(page)).sessions.length).toBe(1);
  expect((await stored(page)).guidance).toBeUndefined();
  await page.reload(); expect((await stored(page)).sessions).toEqual(oldState.sessions);
});

test("reopening the guide preserves an interrupted race and offers its recovery instead of a new workout", async ({ page }) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem("veloquest:v1")) localStorage.setItem("veloquest:v1", JSON.stringify({ profile: { name: "QA Reprise", startDate: "2026-10-01" }, sessions: [], measurements: [] }));
    if (!localStorage.getItem("veloquest:active-session:v1")) localStorage.setItem("veloquest:active-session:v1", JSON.stringify({ version: 1, savedAt: Date.now(), workoutId: "climb-sorgue-velleron-loop", routeId: "sorgue-velleron-loop", routeMode: "timeAttack", segmentIndex: 0, secondsLeft: 500, running: false, sessionStarted: true, showFinish: false, timeAttackElapsedSeconds: 30, timeAttackSplits: [], pauseCount: 1, sessionResistanceDelta: -1, telemetrySamples: [], hadBikeConnection: false }));
  });
  await page.goto("/");
  const before = await page.evaluate(() => localStorage.getItem("veloquest:active-session:v1"));
  await page.getByRole("button", { name: /Plus/ }).click();
  await page.getByRole("button", { name: "Revoir le guide de démarrage" }).click();
  await expect(page.getByRole("dialog")).toContainText("Une séance interrompue est conservée");
  await page.getByRole("button", { name: "Continuer", exact: true }).click();
  await page.reload(); await expect(page.getByRole("dialog")).toBeVisible();
  for (let i = 0; i < 2; i++) await page.getByRole("button", { name: "Continuer", exact: true }).click();
  await expect(page.getByRole("button", { name: "Préparer ma première séance", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Retrouver ma séance en cours", exact: true }).click();
  await expect(page.getByText("SÉANCE INTERROMPUE")).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("veloquest:active-session:v1"))).toBe(before);
  await page.getByRole("button", { name: "Reprendre", exact: true }).click();
  await expect(page.locator(".timeAttackHud")).toBeVisible();
  await expect(page.locator(".timeAttackHud")).toContainText("CHRONO0:30");
  expect((await stored(page)).sessions).toHaveLength(0);
});
