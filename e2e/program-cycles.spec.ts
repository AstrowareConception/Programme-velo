import { expect, test, type Page } from '@playwright/test';
async function seed(page: Page) {
  await page.addInitScript(() => {
    if (localStorage.getItem('veloquest:v1')) return;
    const now = new Date(), start = new Date(); start.setDate(start.getDate() - 90);
    const date = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    localStorage.setItem('veloquest:v1', JSON.stringify({ profile: { name: 'Cycles QA', startDate: date(start) },
      sessions: [{ id: 'preserved', templateId: 'recovery-30', date: start.toISOString(), duration: 30, points: 2, xp: 35, bonus: false, intensity: 'easy', kind: 'recovery', rpe: 3 }],
      measurements: [{ id: 'weight', date: now.toISOString(), weight: 100 }], preferences: { soundCues: false, voiceCues: false, haptics: false }, guidance: { version: 1, status: 'dismissed', step: 3 } }));
  }); await page.goto('/');
}
test('completed cycle is previewed, confirmed and reloaded with history and XP intact', async ({ page }, info) => {
  await seed(page); const panel = page.getByRole('region', { name: 'Ton cycle de douze semaines est terminé' });
  await expect(panel).toContainText('30 min'); const xp = await page.locator('.levelPill').textContent();
  await panel.getByRole('button', { name: 'Préparer un nouveau cycle' }).click();
  await panel.getByLabel('Objectif du prochain cycle').selectOption('endurance');
  await panel.getByLabel('Créneau maximum du prochain cycle').selectOption('20');
  await expect(panel.getByRole('button', { name: 'Confirmer le départ du cycle' })).toBeDisabled();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('veloquest:v1')!).programTimeline)).toBeUndefined();
  await panel.getByLabel('J’ai vérifié le bilan et le départ du nouveau cycle aujourd’hui.').check();
  await panel.getByRole('button', { name: 'Confirmer le départ du cycle' }).click();
  const current = page.getByRole('region', { name: 'Mon cycle 2' });
  await expect(current).toContainText('Nouveau cycle enregistré'); await expect(page.locator('.levelPill')).toHaveText(xp!);
  await page.reload(); await expect(current).toContainText('Endurance');
  const data = await page.evaluate(() => JSON.parse(localStorage.getItem('veloquest:v1')!));
  expect(data.sessions[0].id).toBe('preserved'); expect(data.measurements[0].id).toBe('weight'); expect(data.programTimeline.history).toHaveLength(1);
  await current.getByText('Mes cycles précédents (1)', { exact: true }).click(); await current.locator('.closedCycle > summary').click();
  await expect(current.locator('.closedCycle')).toContainText('30 min');
  await current.screenshot({ path: info.outputPath('cycles-history.png') });
  await page.setViewportSize({ width: 320, height: 720 }); await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await current.getByRole('button', { name: 'Préparer un nouveau cycle' }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await page.screenshot({ path: info.outputPath('cycles-320-text-200.png') });
});
test('restart produces easy dated rides and cancel leaves the cycle untouched', async ({ page }) => {
  await seed(page); const panel = page.getByRole('region', { name: 'Ton cycle de douze semaines est terminé' });
  await panel.getByRole('button', { name: 'Préparer une reprise après pause' }).click();
  await panel.getByRole('button', { name: 'Annuler la proposition' }).click();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('veloquest:v1')!).programTimeline)).toBeUndefined();
  await panel.getByRole('button', { name: 'Préparer une reprise après pause' }).click();
  await panel.getByLabel('J’ai vérifié le bilan et le départ du nouveau cycle aujourd’hui.').check(); await panel.getByRole('button', { name: 'Confirmer le départ du cycle' }).click();
  const week = page.getByRole('region', { name: 'Ma semaine adaptée' }); await week.getByRole('button', { name: 'Proposer ma semaine' }).click();
  await expect(week).toContainText('Retour en selle'); await expect(week.locator('.plannedRides')).not.toContainText('modérée');
  await week.getByRole('button', { name: 'Confirmer cette semaine' }).click(); await page.reload();
  await expect(week).toContainText('Retour en selle');
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('veloquest:v1')!)); expect(saved.programPlans[0].rides.every((r: { date: string }) => r.date >= saved.programTimeline.active.startDate)).toBe(true);
});
test('storage refusal keeps the proposal open and the previous cycle intact', async ({ page }) => {
  await seed(page); const panel = page.getByRole('region', { name: 'Ton cycle de douze semaines est terminé' });
  await panel.getByRole('button', { name: 'Préparer un nouveau cycle' }).click();
  await panel.getByLabel('J’ai vérifié le bilan et le départ du nouveau cycle aujourd’hui.').check();
  await page.evaluate(() => { const original = Storage.prototype.setItem; Storage.prototype.setItem = function (key, value) { if (key === 'veloquest:v1') throw new DOMException('Full', 'QuotaExceededError'); original.call(this, key, value); }; (window as any).restoreCycleStorage = () => { Storage.prototype.setItem = original; }; });
  await panel.getByRole('button', { name: 'Confirmer le départ du cycle' }).click();
  await expect(panel.getByRole('alert')).toContainText('n’a pas pu être enregistré'); expect(await page.evaluate(() => JSON.parse(localStorage.getItem('veloquest:v1')!).programTimeline)).toBeUndefined();
  await page.evaluate(() => (window as any).restoreCycleStorage());
  await panel.getByRole('button', { name: 'Confirmer le départ du cycle' }).click(); await expect(page.getByRole('region', { name: 'Mon cycle 2' })).toBeVisible();
});
