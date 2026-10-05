import { test as base, expect, type Page } from '@playwright/test';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { climbs, climbToWorkout } from '../lib/routes';

type Fixture = { url: string; revision: number; failChunk: boolean };
const test = base.extend<{ pwaServer: Fixture }>({
  pwaServer: async ({}, use) => {
    const fixture: Fixture = { url: '', revision: 0, failChunk: false };
    const worker = await readFile('public/sw.js', 'utf8');
    const server = createServer(async (req, res) => {
      try {
        if (req.url === '/sw.js') {
          res.writeHead(200, { 'Content-Type': 'application/javascript', 'Cache-Control': 'no-store', 'Service-Worker-Allowed': '/' });
          res.end(worker.replace(/const VERSION=(.*);/, (_, value) => `const VERSION=${JSON.stringify(JSON.parse(value) + '-qa' + fixture.revision)};`));
          return;
        }
        if (fixture.failChunk && req.url?.endsWith('.js')) { res.writeHead(503); res.end(''); return; }
        const response = await fetch('http://127.0.0.1:3000' + req.url);
        const bytes = Buffer.from(await response.arrayBuffer());
        res.writeHead(response.status, { 'Content-Type': response.headers.get('content-type') || 'application/octet-stream', 'Cache-Control': 'no-store' });
        res.end(bytes);
      } catch { res.writeHead(502); res.end(''); }
    });
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
    fixture.url = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
    await use(fixture);
    server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve()));
  }
});
test.use({ serviceWorkers: 'allow' });
const state = {
  profile: { name: 'PWA QA', startDate: '2026-10-01' },
  sessions: [{ id: 'old', templateId: 'recovery-30', date: '2026-10-01T12:00:00Z', duration: 30, points: 1, xp: 35, intensity: 'easy', kind: 'recovery', bonus: false }],
  measurements: [{ id: 'm', date: '2026-10-01T12:00:00Z', weight: 100 }],
  favoriteRouteIds: ['cagnes-cannes-littoral'], voyage: { routeId: 'cagnes-cannes-littoral', minutes: 15 },
  preferences: { readerView: 'full', soundCues: false, voiceCues: false, haptics: false, keepScreenAwake: false, resistanceOffset: 0 }
};
const panel = (page: Page) => page.getByRole('region', { name: 'Disponibilité hors connexion' });
const stored = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem('veloquest:v1') || '{}'));
async function boot(page: Page, fixture: Fixture) {
  await page.addInitScript(value => { if (!localStorage.getItem('veloquest:v1')) localStorage.setItem('veloquest:v1', JSON.stringify(value)); }, state);
  await page.goto(fixture.url);
  await page.getByRole('button', { name: /••• Plus/ }).click();
  try { await expect(panel(page)).toContainText('Séances et parcours prêts hors connexion'); }
  catch (error) {
    console.log('PWA bootstrap', await page.evaluate(async () => {
      const reg = await navigator.serviceWorker.getRegistration(); const keys = await caches.keys();
      return { active: reg?.active?.state, installing: reg?.installing?.state, waiting: reg?.waiting?.state, controller: navigator.serviceWorker.controller?.state, caches: await Promise.all(keys.map(async key => ({ key, files: (await (await caches.open(key)).keys()).map(r => new URL(r.url).pathname) }))) };
    })); throw error;
  }
}
async function replacement(page: Page, fixture: Fixture) {
  fixture.revision++;
  await page.evaluate(async () => { await (await navigator.serviceWorker.getRegistration())!.update(); });
  await expect(panel(page)).toContainText('Une mise à jour est prête');
}
async function route(page: Page) {
  await page.getByRole('button', { name: /▲ Parcours/ }).click();
  await page.getByRole('textbox', { name: 'Rechercher', exact: true }).fill('Cagnes');
  return page.locator('.routeLibraryCard').filter({ has: page.getByRole('heading', { name: 'Côte d’Azur · Cagnes-sur-Mer → Cannes', exact: true }) });
}
test('real offline shell and explicitly prepared photos survive a cold reload with the existing data', async ({ page, context, pwaServer }, info) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await boot(page, pwaServer); await expect(panel(page)).toContainText('Photos : 0/5');
  await panel(page).getByRole('button', { name: 'Préparer les photos · 263 Ko', exact: true }).click();
  await expect(panel(page)).toContainText('Photos : 5/5');
  await panel(page).screenshot({ path: info.outputPath('pwa-ready.png') });
  await context.setOffline(true); await page.reload();
  await page.getByRole('button', { name: /••• Plus/ }).click();
  await expect(panel(page)).toContainText('HORS CONNEXION'); await expect(panel(page)).toContainText('Séances et parcours prêts');
  const card = await route(page); await card.getByText(/Voir les photos ·/).click();
  const gallery = card.getByRole('region', { name: 'Photos du parcours' });
  for (let i = 0; i < 4; i++) {
    await expect.poll(() => gallery.getByRole('img').evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth === 960)).toBe(true);
    if (i < 3) await gallery.getByRole('button', { name: 'Photo suivante', exact: true }).click();
  }
  const data = await stored(page); expect(data.sessions).toEqual(state.sessions); expect(data.measurements).toEqual(state.measurements); expect(data.favoriteRouteIds).toEqual(state.favoriteRouteIds); expect(data.voyage).toEqual(state.voyage); expect(errors).toEqual([]);
});
test('missing photos stay textual offline and an evicted required file is detected then repaired online', async ({ page, context, pwaServer }) => {
  await boot(page, pwaServer); await context.setOffline(true);
  const card = await route(page); await card.getByText(/Voir les photos ·/).click();
  await expect(card).toContainText('Réessayer la photo'); await expect(card).toContainText('Olivier Cleynen');
  await page.evaluate(async () => { const key = (await caches.keys()).find(k => k.startsWith('veloquest-pwa-'))!; const cache = await caches.open(key); const asset = (await cache.keys()).find(r => new URL(r.url).pathname.endsWith('.js'))!; await cache.delete(asset); });
  await page.getByRole('button', { name: /••• Plus/ }).click();
  await panel(page).getByRole('button', { name: 'Vérifier la disponibilité', exact: true }).click();
  await expect(panel(page)).toContainText('Préparation à vérifier');
  await context.setOffline(false); await panel(page).getByRole('button', { name: 'Vérifier la disponibilité', exact: true }).click();
  await expect(panel(page)).toContainText('Séances et parcours prêts');
  expect((await stored(page)).sessions).toEqual(state.sessions);
});
test('waiting update is refused by a paused Voyage in another tab and preserves recovery after consent', async ({ page, context, pwaServer }) => {
  await boot(page, pwaServer);
  const riding = await context.newPage(); await riding.goto(pwaServer.url);
  await riding.getByRole('region', { name: 'Mon voyage' }).getByRole('button', { name: 'Commencer mon voyage', exact: true }).click();
  await riding.getByRole('button', { name: 'Démarrer la séance', exact: true }).click();
  await riding.getByRole('button', { name: 'Pause', exact: true }).click();
  await replacement(page, pwaServer);
  await panel(page).getByRole('button', { name: 'Mettre à jour maintenant', exact: true }).click();
  await expect(panel(page)).toContainText('Mise à jour différée');
  await expect(riding.getByRole('button', { name: 'Reprendre', exact: true })).toBeVisible();
  await riding.getByRole('button', { name: 'Mettre la séance de côté', exact: true }).click();
  const snapshot = await riding.evaluate(() => JSON.parse(localStorage.getItem('veloquest:active-session:v1')!));
  const before = await stored(page);
  await panel(page).getByRole('button', { name: 'Mettre à jour maintenant', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Reprendre là où tu t’es arrêté ?' })).toBeVisible();
  await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller?.state)).toBe('activated');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('veloquest:active-session:v1')!))).toEqual(snapshot);
  expect(await stored(page)).toEqual(before);
  await context.setOffline(true); await page.getByRole('button', { name: 'Reprendre', exact: true }).click();
  await expect(page.locator('.sessionModal')).toContainText('VOYAGE');
  await expect(page.getByRole('button', { name: 'Reprendre', exact: true })).toBeVisible();
});
test('unknown tab defers the update; closing it allows a deliberate reload without data changes', async ({ page, context, pwaServer }) => {
  await boot(page, pwaServer); const before = await stored(page);
  const unknown = await context.newPage(); await unknown.goto(pwaServer.url + '/confidentialite');
  await replacement(page, pwaServer);
  await panel(page).getByRole('button', { name: 'Mettre à jour maintenant', exact: true }).click();
  await expect(panel(page)).toContainText('Mise à jour différée'); await unknown.close();
  const reload = page.waitForNavigation({ waitUntil: 'domcontentloaded' });
  await panel(page).getByRole('button', { name: 'Mettre à jour maintenant', exact: true }).click(); await reload;
  await page.getByRole('button', { name: /••• Plus/ }).click();
  await expect(panel(page)).not.toContainText('Une mise à jour est prête'); expect(await stored(page)).toEqual(before);
});
test('a saved Time Attack keeps its clock, splits and profile through update and offline resume', async ({ page, context, pwaServer }) => {
  const route = climbs.find(r => r.id === 'cagnes-cannes-littoral')!;
  const workout = climbToWorkout(route);
  const snapshot = { version: 1, savedAt: Date.now(), workoutId: workout.id, routeId: route.id, routeMode: 'timeAttack', segmentIndex: 0, secondsLeft: 60, running: false, sessionStarted: true, showFinish: false, timeAttackElapsedSeconds: 65, timeAttackSplits: [{ km: 0.2, elapsedSeconds: 60 }], pauseCount: 1, sessionResistanceDelta: 0, telemetrySamples: [], hadBikeConnection: false };
  await page.addInitScript(value => { if (!localStorage.getItem('veloquest:active-session:v1')) localStorage.setItem('veloquest:active-session:v1', JSON.stringify(value)); }, snapshot);
  await boot(page, pwaServer); const before = await stored(page); await replacement(page, pwaServer);
  const reload = page.waitForNavigation({ waitUntil: 'domcontentloaded' });
  await panel(page).getByRole('button', { name: 'Mettre à jour maintenant', exact: true }).click(); await reload;
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('veloquest:active-session:v1')!))).toEqual(snapshot);
  expect(await stored(page)).toEqual(before); await context.setOffline(true);
  await page.getByRole('button', { name: 'Reprendre', exact: true }).click();
  await expect(page.locator('.sessionModal')).toContainText('VS PB');
  await expect(page.getByRole('button', { name: 'Chrono actif', exact: true })).toBeDisabled();
  await expect(page.locator('.sessionModal')).toContainText('1:05');
  expect((await stored(page)).sessions).toEqual(before.sessions);
});
test('failed snapshot storage keeps the paused reader open and blocks a cross-tab update', async ({ page, context, pwaServer }) => {
  await boot(page, pwaServer); const riding = await context.newPage(); await riding.goto(pwaServer.url);
  await riding.evaluate(() => { const original = Storage.prototype.setItem; Storage.prototype.setItem = function(key, value) { if (key === 'veloquest:active-session:v1') throw new DOMException('Quota', 'QuotaExceededError'); original.call(this, key, value); }; });
  await riding.getByRole('region', { name: 'Mon voyage' }).getByRole('button', { name: 'Commencer mon voyage', exact: true }).click();
  await riding.getByRole('button', { name: 'Démarrer la séance', exact: true }).click();
  await riding.getByRole('button', { name: 'Pause', exact: true }).click();
  await riding.getByRole('button', { name: 'Mettre la séance de côté', exact: true }).click();
  await expect(riding.locator('.sessionModal')).toBeVisible(); await expect(riding.getByText(/La reprise n’a pas pu être enregistrée/)).toBeVisible();
  await replacement(page, pwaServer); await panel(page).getByRole('button', { name: 'Mettre à jour maintenant', exact: true }).click();
  await expect(panel(page)).toContainText('Mise à jour différée'); expect((await stored(page)).sessions).toEqual(state.sessions);
});
