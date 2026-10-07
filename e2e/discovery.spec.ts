import { expect, test, type Page } from "@playwright/test";

const seenKey = "veloquest:release-seen:v1";
const announcement = (page: Page) => page.getByRole("region", { name: "Dernières nouveautés" });
const legacy = {
  profile: { name: "Découverte QA", startDate: "2026-10-01" },
  sessions: [{ id: "discovery-existing", templateId: "contemplative-25", date: "2026-10-03T18:00:00Z", duration: 25, xp: 40, points: 1, intensity: "easy", kind: "endurance", bonus: false, rpe: 4 }],
  measurements: [{ id: "measure-existing", date: "2026-10-02T10:00:00Z", weight: 80 }],
  favoriteRouteIds: ["chambord-petit-tour"],
  preferences: { soundCues: false, voiceCues: false, haptics: false, keepScreenAwake: false }
};
async function seed(page: Page) {
  await page.addInitScript(value => {
    if (!localStorage.getItem("veloquest:v1")) localStorage.setItem("veloquest:v1", JSON.stringify(value));
  }, legacy);
  await page.goto("/");
}

test("release notes are acknowledged once, stay accessible and preserve training data", async ({ page }, info) => {
  await seed(page);
  await expect(announcement(page)).toBeVisible();
  await announcement(page).getByRole("button", { name: "Voir les nouveautés" }).click();
  await expect(page.getByRole("heading", { name: "Quoi de neuf ?" })).toBeFocused();
  const notes = page.getByRole("region", { name: "Quoi de neuf ?" });
  await expect(notes).toContainText("Tes repères, au bon moment");
  await notes.getByText(/Plus d’espace pour ta séance ·/).click();
  await expect(notes).toContainText("séances classiques comme pour les parcours");
  await notes.screenshot({ path: info.outputPath("nouveautes.png") });
  await page.reload();
  await expect(page.locator(".hero")).toBeVisible();
  await expect(announcement(page)).toHaveCount(0);
  const state = await page.evaluate(() => JSON.parse(localStorage.getItem("veloquest:v1")!));
  expect(state.sessions).toEqual(legacy.sessions);
  expect(state.measurements).toEqual(legacy.measurements);
  expect(state.favoriteRouteIds).toEqual(legacy.favoriteRouteIds);
  await page.getByRole("button", { name: /••• Plus/ }).click();
  await expect(notes).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("dismissal follows other tabs and a previous milestone is announced again", async ({ page, context }) => {
  await seed(page);
  const other = await context.newPage();
  await other.goto("/");
  await expect(announcement(other)).toBeVisible();
  await announcement(page).getByRole("button", { name: "Masquer l’annonce des nouveautés" }).click();
  await expect(announcement(other)).toHaveCount(0);
  await page.reload();
  await expect(page.locator(".hero")).toBeVisible();
  await expect(announcement(page)).toHaveCount(0);
  await other.evaluate(key => localStorage.setItem(key, "previous-milestone"), seenKey);
  await expect(announcement(page)).toBeVisible();
  await other.close();
});

test("help is optional, keeps preparation settings and leaves the landscape start accessible", async ({ page }, info) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await seed(page);
  await page.getByRole("button", { name: /⚡ Séances/ }).click();
  await page.getByRole("heading", { name: "Décrassage", exact: true }).locator("xpath=ancestor::article").getByRole("button", { name: "Voir / démarrer" }).click();
  await expect(announcement(page)).toHaveCount(0);
  const modal = page.locator(".sessionJourneyModal");
  const help = modal.locator(".readerHelp");
  await expect(help).not.toHaveAttribute("open");
  await modal.getByLabel("Rythme de pédalage").selectOption("10");
  await help.locator("summary").focus();
  await page.keyboard.press("Enter");
  await expect(help).toHaveAttribute("open", "");
  await expect(help).toContainText("ne signifie pas zéro");
  await expect(modal.getByRole("button", { name: "Démarrer la séance" })).toBeInViewport({ ratio: 1 });
  await page.screenshot({ path: info.outputPath("reperes-tablette.png") });
  await page.setViewportSize({ width: 768, height: 1024 });
  await expect(help).toHaveAttribute("open", "");
  await expect(modal.getByLabel("Rythme de pédalage")).toHaveValue("10");
  await modal.getByRole("button", { name: "Démarrer la séance" }).click();
  await expect(page.locator(".activeSessionModal")).toBeVisible();
  await expect(page.locator(".readerHelp")).toHaveCount(0);
  await expect(announcement(page)).toHaveCount(0);
});

test("new users keep their first action and optional storage failure cannot block navigation", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(announcement(page)).toHaveCount(0);
  for (let step = 0; step < 3; step++) await page.getByRole("button", { name: "Continuer", exact: true }).click();
  await page.getByRole("button", { name: "Plus tard, ouvrir ma quête" }).click();
  await expect(page.getByRole("button", { name: "Préparer ma première séance", exact: true })).toBeVisible();
  await expect(announcement(page)).toHaveCount(0);
  await page.getByRole("button", { name: /••• Plus/ }).click();
  await expect(page.getByRole("region", { name: "Quoi de neuf ?" })).toBeVisible();

  await page.addInitScript(key => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (name, value) {
      if (name === key) throw new DOMException("Optional preference blocked", "QuotaExceededError");
      original.call(this, name, value);
    };
  }, seenKey);
  await page.evaluate(value => localStorage.setItem("veloquest:v1", JSON.stringify(value)), legacy);
  await page.reload();
  await announcement(page).getByRole("button", { name: "Voir les nouveautés" }).click();
  await expect(page.getByRole("heading", { name: "Quoi de neuf ?" })).toBeFocused();
  await page.getByRole("button", { name: /⌂ Quête/ }).click();
  await expect(announcement(page)).toHaveCount(0);
});
