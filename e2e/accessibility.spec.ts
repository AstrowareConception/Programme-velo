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
  expect(await dialog.page().evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(dialog.page().viewportSize()!.width);
  const box = await dialog.boundingBox();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(dialog.page().viewportSize()!.width + 1);
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

async function seedSecondaryDialogs(page: Page) {
  await page.addInitScript(() => { if (!localStorage.getItem("veloquest:v1")) localStorage.setItem("veloquest:v1", JSON.stringify({
    profile: { name: "Fenêtres QA", startDate: "2026-10-01" }, measurements: [],
    sessions: [{ id: "dialog-history", templateId: "recovery-30", date: "2026-10-02T12:00:00Z",
      duration: 30, xp: 35, points: 1, intensity: "easy", kind: "recovery", bonus: false, note: "Séance conservée" }],
    preferences: { soundCues: false, voiceCues: false, haptics: false, keepScreenAwake: false }
  })); });
  await page.goto("/");
  await expect(page.locator(".hero")).toBeVisible();
}

async function checkDialogKeyboard(page: Page, dialog: Locator) {
  await expect(dialog).toHaveAttribute("aria-modal", "true");
  await expect(dialog.locator("h2").first()).toBeFocused();
  const close = dialog.locator(".close");
  await close.focus();
  await page.keyboard.press("Shift+Tab");
  const lastFocused = await dialog.evaluate(el => el.contains(document.activeElement) && document.activeElement !== el.querySelector(".close"));
  expect(lastFocused).toBe(true);
  await page.keyboard.press("Tab");
  await expect(close).toBeFocused();
  expect(await page.locator(".bottomNav").evaluate(el => Boolean(el.closest("[inert]")))).toBe(true);
  await page.locator(".bottomNav button").first().evaluate((el: HTMLElement) => el.focus());
  expect(await dialog.evaluate(el => el.contains(document.activeElement))).toBe(true);
}

for (const choice of [
  { name: "sectors", opener: /Segments/, label: "Choisir un secteur", action: /Secteur 2/, route: "Tour des Corniches" },
  { name: "route challenges", opener: /Défis/, label: "Choisir un défi de parcours", action: /Pacing progressif/, route: "Alpe d’Huez" }
]) test(`${choice.name}: Escape restores the launcher and the reader handoff keeps focus`, async ({ page }, info) => {
  await seedSecondaryDialogs(page);
  await page.getByRole("button", { name: /▲ Parcours/ }).click();
  await page.getByLabel("Rechercher", { exact: true }).fill(choice.route);
  const opener = page.locator("article.routeLibraryCard").getByRole("button", { name: choice.opener });
  await opener.focus(); await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: choice.label, exact: true });
  await checkDialogKeyboard(page, dialog);
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0); await expect(opener).toBeFocused();
  expect(await page.evaluate(() => document.body.style.overflow)).toBe("");
  await page.keyboard.press("Enter");
  await page.addStyleTag({ content: "html { font-size:200% !important; }" });
  await noHorizontalOverflow(dialog);
  const action = dialog.getByRole("button", { name: choice.action });
  await action.scrollIntoViewIfNeeded();
  await expect(action).toBeInViewport({ ratio: 1 });
  await page.screenshot({ path: info.outputPath(`${choice.name.replaceAll(" ", "-")}-texte-200.png`) });
  await action.press("Enter");
  const reader = page.getByRole("dialog", { name: "Préparer la séance", exact: true });
  await expect(reader.locator("h2").first()).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(reader.getByRole("button", { name: "Mettre la séance de côté" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(reader).toHaveCount(0); await expect(opener).toBeFocused();
  expect(await page.locator(".bottomNav").evaluate(el => Boolean(el.closest("[inert]")))).toBe(false);
});

test("Voyage choices survive Escape and rotation, then hand focus to the session", async ({ page }, info) => {
  await seedSecondaryDialogs(page);
  await page.getByRole("button", { name: /▲ Parcours/ }).click();
  await page.getByLabel("Rechercher", { exact: true }).fill("Tour des Corniches");
  const opener = page.locator("article.routeLibraryCard").getByRole("button", { name: /Voyage en plusieurs séances/ });
  await opener.focus(); await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Préparer mon voyage", exact: true });
  await checkDialogKeyboard(page, dialog);
  await dialog.getByLabel("Temps disponible").selectOption("15");
  await page.setViewportSize({ width: 960, height: 600 });
  await page.addStyleTag({ content: "html { font-size:200% !important; }" });
  await noHorizontalOverflow(dialog);
  await page.screenshot({ path: info.outputPath("voyage-texte-200-paysage.png") });
  await page.keyboard.press("Escape"); await expect(opener).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(dialog.getByLabel("Temps disponible")).toHaveValue("15");
  await page.setViewportSize({ width: 320, height: 740 });
  await noHorizontalOverflow(dialog);
  await dialog.getByRole("button", { name: "Commencer mon voyage", exact: true }).press("Enter");
  const reader = page.getByRole("dialog", { name: "Préparer la séance", exact: true });
  await expect(reader.locator("h2").first()).toBeFocused();
  await reader.getByRole("button", { name: "Mettre la séance de côté" }).press("Enter");
  await expect(reader).toHaveCount(0); await expect(opener).toBeFocused();
});

test("journal detail traps focus, closes by Escape or backdrop and returns safely after deletion", async ({ page }, info) => {
  await seedSecondaryDialogs(page);
  await page.getByRole("button", { name: /↗ Suivi/ }).click();
  const opener = page.locator(".sessionHistoryRow");
  await opener.focus(); await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Détail de la séance", exact: true });
  await checkDialogKeyboard(page, dialog);
  await expect(dialog).toContainText("Séance conservée");
  await page.keyboard.press("Escape"); await expect(opener).toBeFocused();
  await page.keyboard.press("Enter");
  await page.locator(".auxiliaryBackdrop").click({ position: { x: 2, y: 2 } });
  await expect(dialog).toHaveCount(0); await expect(opener).toBeFocused();
  await page.keyboard.press("Enter");
  await page.setViewportSize({ width: 320, height: 740 });
  await page.addStyleTag({ content: "html { font-size:200% !important; }" });
  await noHorizontalOverflow(dialog);
  await page.screenshot({ path: info.outputPath("journal-texte-200-320.png") });
  page.once("dialog", confirmation => confirmation.dismiss());
  await dialog.getByRole("button", { name: "Supprimer cette séance" }).press("Enter");
  await expect(dialog).toBeVisible();
  page.once("dialog", confirmation => confirmation.accept());
  await dialog.getByRole("button", { name: "Supprimer cette séance" }).press("Enter");
  await expect(dialog).toHaveCount(0);
  await expect(page.locator(".bottomNav button.active")).toBeFocused();
  expect(await page.evaluate(() => document.body.style.overflow)).toBe("");
});

test("profile edits survive Escape, backdrop, rotation and storage refusal before saving", async ({ page }, info) => {
  await seedSecondaryDialogs(page);
  await page.getByRole("button", { name: /••• Plus/ }).click();
  const opener = page.getByRole("button", { name: "Modifier le profil et les objectifs" });
  await opener.focus(); await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Profil et objectifs", exact: true });
  await checkDialogKeyboard(page, dialog);
  await dialog.getByLabel("Prénom ou pseudo").fill("Profil modifié");
  await dialog.getByLabel("Objectif poids", { exact: true }).fill("90.5");
  await page.keyboard.press("Escape");
  await expect(dialog.getByRole("button", { name: "Fermer le profil" })).toBeFocused();
  await expect(dialog.getByLabel("Prénom ou pseudo")).toHaveValue("Profil modifié");
  await page.locator(".auxiliaryBackdrop").click({ position: { x: 2, y: 2 } });
  await expect(dialog).toBeVisible();
  await page.setViewportSize({ width: 320, height: 740 });
  await page.addStyleTag({ content: "html { font-size:200% !important; }" });
  await noHorizontalOverflow(dialog);
  await expect(dialog.getByLabel("Objectif poids", { exact: true })).toHaveValue("90.5");
  await page.screenshot({ path: info.outputPath("profil-texte-200-320.png") });
  await page.setViewportSize({ width: 960, height: 600 });
  await noHorizontalOverflow(dialog);
  await page.evaluate(() => {
    const write = Storage.prototype.setItem;
    (window as typeof window & { restoreProfileStorage?: () => void }).restoreProfileStorage = () => { Storage.prototype.setItem = write; };
    Storage.prototype.setItem = function(key, value) {
      if (key === "veloquest:v1") throw new DOMException("Quota QA", "QuotaExceededError");
      write.call(this, key, value);
    };
  });
  await dialog.getByRole("button", { name: "Enregistrer mon profil" }).press("Enter");
  await expect(dialog.getByRole("alert")).toContainText("Tes saisies restent ici");
  await expect(dialog.getByLabel("Prénom ou pseudo")).toHaveValue("Profil modifié");
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("veloquest:v1")!).profile.name)).toBe("Fenêtres QA");
  await page.evaluate(() => (window as typeof window & { restoreProfileStorage: () => void }).restoreProfileStorage());
  await dialog.getByRole("button", { name: "Réessayer l’enregistrement du profil" }).press("Enter");
  await expect(dialog).toHaveCount(0); await expect(opener).toBeFocused();
  await page.reload();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("veloquest:v1")!));
  expect(saved.profile).toMatchObject({ name: "Profil modifié", targetWeight: 90.5 });
  expect(saved.sessions).toHaveLength(1); expect(saved.sessions[0].note).toBe("Séance conservée");
  expect(saved.measurements).toEqual([]);
});

test("the first-use guide keeps keyboard focus and enlarged choices through the first saved session", async ({ page }, info) => {
  await page.clock.install();
  await page.goto("/");
  const guide = page.getByRole("dialog");
  await expect(guide).toHaveAccessibleName("Bienvenue, commençons simplement.");
  await expect(guide.locator("h2")).toBeFocused();
  await page.setViewportSize({ width: 320, height: 740 });
  await page.addStyleTag({ content: "html { font-size:200% !important; }" });
  await noHorizontalOverflow(guide);
  await guide.getByLabel("Ce qui te donne envie").scrollIntoViewIfNeeded();
  await page.screenshot({ path: info.outputPath("demarrage-select-texte-200-320.png") });
  const first = guide.getByLabel(/Prénom ou pseudo/);
  await first.focus(); await page.keyboard.press("Shift+Tab");
  await expect(guide.getByRole("button", { name: "Explorer librement" })).toBeFocused();
  await page.keyboard.press("Tab"); await expect(first).toBeFocused();
  await first.fill("Découverte clavier");
  await guide.getByLabel("Ce qui te donne envie").selectOption("explore");
  await guide.getByRole("button", { name: "Continuer", exact: true }).press("Enter");
  await expect(guide.locator("h2")).toBeFocused();
  await guide.getByLabel("Temps habituel pour une séance").selectOption("25");
  await noHorizontalOverflow(guide);
  await guide.getByRole("button", { name: "Retour", exact: true }).press("Enter");
  await expect(first).toHaveValue("Découverte clavier");
  await page.setViewportSize({ width: 960, height: 600 });
  await noHorizontalOverflow(guide);
  await guide.getByRole("button", { name: "Continuer", exact: true }).press("Enter");
  await expect(guide.getByLabel("Temps habituel pour une séance")).toHaveValue("25");
  await guide.getByRole("button", { name: "Continuer", exact: true }).press("Enter");
  await guide.getByLabel("Un son aux changements de segment").uncheck();
  await guide.getByRole("button", { name: "Continuer", exact: true }).press("Enter");
  await expect(guide.locator("h2")).toBeFocused();
  await noHorizontalOverflow(guide);
  await page.screenshot({ path: info.outputPath("demarrage-texte-200-paysage.png") });
  await guide.getByRole("button", { name: "Préparer ma première séance", exact: true }).press("Enter");
  const reader = page.getByRole("dialog");
  await expect(reader).toHaveAccessibleName("Préparer la séance");
  await expect(reader.locator("h2").first()).toBeFocused();
  await reader.getByRole("button", { name: "Démarrer la séance" }).press("Enter");
  await page.clock.fastForward(16 * 60 * 1000);
  await expect(reader).toHaveAccessibleName("Bilan de séance");
  await reader.getByLabel("Note", { exact: true }).fill("Première séance au clavier");
  await reader.getByLabel("J’ai vérifié le bilan et les champs facultatifs.").check();
  await reader.getByRole("button", { name: /Valider la quête/ }).press("Enter");
  await expect(reader).toHaveCount(0);
  await expect(page.locator(".bottomNav button.active")).toBeFocused();
  await page.reload();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("veloquest:v1")!));
  expect(saved.sessions).toHaveLength(1);
  expect(saved.sessions[0]).toMatchObject({ note: "Première séance au clavier", metrics: { completedWorkout: true } });
  expect(saved.profile.name).toBe("Découverte clavier"); expect(saved.guidance.sessionMinutes).toBe(25);
  await page.getByRole("button", { name: /••• Plus/ }).click();
  await page.getByRole("button", { name: "Revoir le guide de démarrage" }).press("Enter");
  await expect(guide.locator("h2")).toBeFocused();
  await expect(guide.getByLabel(/Prénom ou pseudo/)).toHaveValue("Découverte clavier");
  await page.keyboard.press("Escape");
  await expect(guide).toHaveCount(0);
  await expect(page.locator(".bottomNav button.active")).toBeFocused();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("veloquest:v1")!).guidance.goal)).toBe("explore");
});
