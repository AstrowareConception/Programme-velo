import { expect, test, type Page } from '@playwright/test';
async function seed(page: Page, existing = false, sound = false) {
  await page.addInitScript(({ existing, sound }) => {
    if (localStorage.getItem('veloquest:v1')) return;
    const now = new Date(), dates = [2, 1].map(age => { const d = new Date(now); d.setDate(d.getDate() - age); return d.toISOString(); });
    const session = (date: string, id: string) => ({ id, date, templateId: 'short-loosen-10', duration: 10, points: .5, xp: 15, bonus: false, intensity: 'easy', kind: 'recovery' });
    localStorage.setItem('veloquest:v1', JSON.stringify({ profile: { name: 'Reward QA', startDate: dates[0].slice(0, 10) }, sessions: existing ? [...dates, now.toISOString()].map((d, i) => session(d, String(i))) : dates.map((d, i) => session(d, String(i))), measurements: [], preferences: { soundCues: sound, voiceCues: false, haptics: false }, guidance: { version: 1, status: 'dismissed', step: 3 } }));
  }, { existing, sound }); await page.goto('/');
}
test('third recorded day celebrates with sound once, then opens the trophy gallery', async ({ page }, info) => {
  await page.addInitScript(() => {
    (window as any).rewardFrequencies = [];
    (window as any).AudioContext = class {
      state = 'running'; currentTime = 0; destination = {};
      resume() { return Promise.resolve(); } close() { this.state = 'closed'; return Promise.resolve(); }
      createOscillator() { const o: any = { frequency: { value: 0 }, connect: () => o, start: () => (window as any).rewardFrequencies.push(o.frequency.value), stop: () => {}, disconnect: () => {}, addEventListener: () => {} }; return o; }
      createGain() { const g: any = { gain: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} }, connect: () => g, disconnect: () => {} }; return g; }
    };
  });
  await seed(page, false, true);
  await page.getByRole('button', { name: /⚡ Séances/ }).click(); await page.getByRole('heading', { name: 'Délier les jambes', exact: true }).locator('xpath=ancestor::article').getByRole('button', { name: 'Voir / démarrer' }).click();
  await page.getByRole('button', { name: 'Démarrer la séance' }).click();
  await expect(page.getByRole('complementary', { name: 'Récompense obtenue' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Terminer et enregistrer', exact: true }).click(); await page.getByLabel('J’ai vérifié le bilan et les champs facultatifs.').check(); await page.getByRole('button', { name: /Valider la quête/ }).click();
  const reward = page.getByRole('complementary', { name: 'Récompense obtenue' }); await expect(reward).toContainText('Trois rendez-vous');
  await expect.poll(() => page.evaluate(() => (window as any).rewardFrequencies.filter((f: number) => f === 1046.5).length)).toBe(1);
  await reward.screenshot({ path: info.outputPath('trophy-reward.png') }); await reward.getByRole('button', { name: 'Voir mes trophées' }).click();
  await expect(page.locator('#trophy-gallery')).toBeFocused(); await expect(page.locator('.badge').filter({ hasText: 'Trois rendez-vous' })).toHaveClass(/unlocked/);
  await page.reload(); await expect(reward).toHaveCount(0);
});
test('recognizes new historic trophies in a single quiet notice and respects reduced motion', async ({ page }, info) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.emulateMedia({ reducedMotion: 'reduce' }); await seed(page, true, false);
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  const reward = page.getByRole('complementary', { name: 'Récompense obtenue' }); await expect(reward).toContainText('TON HISTORIQUE RÉCOMPENSÉ'); await expect(reward).not.toContainText('Premier tour de roue');
  expect(await reward.evaluate(el => getComputedStyle(el).animationName)).toBe('none');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  const box = await reward.boundingBox(); expect(box!.x).toBeGreaterThanOrEqual(0); expect(box!.x + box!.width).toBeLessThanOrEqual(321);
  expect(await reward.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  await page.screenshot({ path: info.outputPath('historic-trophy.png') }); await reward.getByRole('button', { name: 'Continuer', exact: true }).click(); await page.reload(); await expect(reward).toHaveCount(0);
});
