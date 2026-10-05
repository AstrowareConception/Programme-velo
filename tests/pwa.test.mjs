import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { createHash, webcrypto } from 'node:crypto';
import { runInNewContext } from 'node:vm';

const script = readFileSync(new URL('../scripts/pwa-worker.js', import.meta.url), 'utf8');
const sha = body => createHash('sha256').update(body).digest('hex');
const base = 'https://veloquest.example';
const core = [{ url: '/', sha256: sha('html') }, { url: '/_next/static/app.js', sha256: sha('js') }];
const photos = [{ url: '/landscapes/one.webp', sha256: sha('photo') }];
function harness() {
  const listeners = {}, cachesByName = new Map(), requested = [], clients = [];
  let failed = '', wrong = false, skipped = 0, claimed = 0;
  const cache = () => {
    const rows = new Map();
    return { rows, match: async key => rows.get(typeof key === 'string' ? key : key.url)?.clone(), put: async (key, value) => rows.set(typeof key === 'string' ? key : key.url, value.clone()) };
  };
  const caches = {
    open: async key => { if (!cachesByName.has(key)) cachesByName.set(key, cache()); return cachesByName.get(key); },
    keys: async () => [...cachesByName.keys()], delete: async key => cachesByName.delete(key),
    match: async key => { for (const value of cachesByName.values()) { const found = await value.match(key); if (found) return found; } }
  };
  class Channel {
    constructor() {
      this.port1 = { close() {}, postMessage: data => queueMicrotask(() => this.port2.onmessage?.({ data })) };
      this.port2 = { close() {}, postMessage: data => queueMicrotask(() => this.port1.onmessage?.({ data })) };
    }
  }
  const self = { location: { origin: base }, addEventListener: (type, fn) => { listeners[type] = fn; },
    skipWaiting: async () => { skipped++; }, clients: { matchAll: async () => clients, claim: async () => { claimed++; } } };
  runInNewContext(`const RELEASE='r'; const VERSION='r-v'; const CORE=${JSON.stringify(core)}; const PHOTOS=${JSON.stringify(photos)};` + script,
    { self, caches, crypto: webcrypto, URL, Uint8Array, Response, MessageChannel: Channel, setTimeout, clearTimeout, fetch: async url => {
      requested.push(url); if (url.endsWith(failed) && failed) return new Response('', { status: 503 });
      return new Response(wrong ? 'wrong' : url.endsWith('app.js') ? 'js' : url.endsWith('.webp') ? 'photo' : 'html');
    } });
  async function run(type, extra = {}) { let wait = Promise.resolve(); listeners[type]({ ...extra, waitUntil: promise => { wait = promise; } }); return wait; }
  async function send(type) { let reply; await run('message', { data: { type }, source: { url: base + '/' }, ports: [{ postMessage: data => { reply = data; } }] }); return reply; }
  return { caches, cachesByName, requested, clients, run, send, fail: url => { failed = url; }, wrong: () => { wrong = true; }, skipped: () => skipped, claimed: () => claimed };
}
describe('production PWA worker', () => {
  it('refuses an incomplete install or mixed build and preserves the previous cache', async () => {
    for (const corrupt of [false, true]) {
      const h = harness(); await h.caches.open('veloquest-v15');
      if (corrupt) h.wrong(); else h.fail('app.js');
      await expect(h.run('install')).rejects.toThrow(); expect((await h.send('VQ_STATUS')).ready).toBe(false);
      expect(h.skipped()).toBe(0); expect(await h.caches.keys()).toContain('veloquest-v15');
    }
  });
  it('prepares essential files without fetching photos and never activates a replacement automatically', async () => {
    const h = harness(); await h.run('install'); expect(h.skipped()).toBe(0);
    expect(await h.send('VQ_STATUS')).toEqual({ release: 'r', ready: true, photos: 0, photoTotal: 1 });
    expect(h.requested).toEqual(core.map(a => base + a.url));
  });
  it('prepares photos explicitly, validates bytes and avoids fetching an already valid image twice', async () => {
    const h = harness(); await h.run('install'); h.fail('one.webp');
    expect((await h.send('VQ_PHOTOS')).error).toBeTruthy(); expect((await h.send('VQ_STATUS')).photos).toBe(0);
    h.fail(''); expect((await h.send('VQ_PHOTOS')).photos).toBe(1); const count = h.requested.length;
    await h.send('VQ_PHOTOS'); expect(h.requested).toHaveLength(count); expect((await h.send('VQ_STATUS')).ready).toBe(true);
  });
  it('detects cache eviction and repairs only missing or corrupt essentials', async () => {
    const h = harness(); await h.run('install'); const cache = await h.caches.open('veloquest-pwa-r-v');
    cache.rows.delete(base + '/_next/static/app.js'); expect((await h.send('VQ_STATUS')).ready).toBe(false);
    const count = h.requested.length; expect((await h.send('VQ_REPAIR')).ready).toBe(true); expect(h.requested.slice(count)).toEqual([base + '/_next/static/app.js']);
    await cache.put(base + '/', new Response('corrupt')); expect((await h.send('VQ_STATUS')).ready).toBe(false);
  });
  it('a single busy client cancels the update for every consenting tab', async () => {
    const h = harness(); await h.run('install'); const cancellation = [];
    for (const safe of [true, false]) h.clients.push({ postMessage: (data, ports) => { if (ports) ports[0].postMessage({ safe }); else cancellation.push(data.type); } });
    expect((await h.send('VQ_APPLY')).error).toMatch(/différée/); expect(h.skipped()).toBe(0); expect(cancellation).toEqual(['VQ_UPDATE_CANCELLED', 'VQ_UPDATE_CANCELLED']);
  });
  it('activates after all idle tabs consent and retains one preceding cache', async () => {
    const h = harness(); await h.caches.open('veloquest-v14'); await h.caches.open('veloquest-v15'); await h.run('install');
    h.clients.push({ postMessage: (_data, ports) => ports[0].postMessage({ safe: true }) });
    expect(await h.send('VQ_APPLY')).toEqual({ accepted: true }); expect(h.skipped()).toBe(1);
    await h.run('activate'); expect(await h.caches.keys()).toEqual(['veloquest-v15', 'veloquest-pwa-r-v']); expect(h.claimed()).toBe(1);
  });
  it('keeps the active shell stable across query navigation and excludes version, privacy and remote maps', async () => {
    const h = harness(); await h.run('install'); let response;
    await h.run('fetch', { request: { url: base + '/?tab=more', method: 'GET', mode: 'navigate' }, respondWith: value => { response = value; } });
    expect(await (await response).text()).toBe('html');
    for (const url of [base + '/api/version', base + '/confidentialite', 'https://tiles.example/map.png']) {
      let intercepted = false; await h.run('fetch', { request: { url, method: 'GET', mode: 'navigate' }, respondWith: () => { intercepted = true; } }); expect(intercepted).toBe(false);
    }
  });
});
