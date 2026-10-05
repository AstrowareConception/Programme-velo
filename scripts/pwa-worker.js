/* RELEASE, VERSION, CORE and PHOTOS are injected from the exact Next.js build. */
const CACHE = 'veloquest-pwa-' + VERSION;
const origin = self.location.origin;
const absolute = path => new URL(path, origin).href;
const digest = async bytes => [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(n => n.toString(16).padStart(2, '0')).join('');
async function verified(response, asset) {
  return Boolean(response?.ok && (!asset.sha256 || await digest(await response.clone().arrayBuffer()) === asset.sha256));
}
async function storeAsset(cache, asset) {
  const response = await fetch(absolute(asset.url), { cache: 'no-store' });
  if (!await verified(response, asset)) throw new Error('Fichier indisponible : ' + asset.url);
  await cache.put(absolute(asset.url), response);
}
async function status() {
  const cache = await caches.open(CACHE);
  const core = await Promise.all(CORE.map(async asset => verified(await cache.match(absolute(asset.url)), asset)));
  const photos = await Promise.all(PHOTOS.map(async asset => verified(await cache.match(absolute(asset.url)), asset)));
  return { release: RELEASE, ready: core.every(Boolean), photos: photos.filter(Boolean).length, photoTotal: PHOTOS.length };
}
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    for (let i = 0; i < CORE.length; i += 4) await Promise.all(CORE.slice(i, i + 4).map(asset => storeAsset(cache, asset)));
    for (const asset of PHOTOS) {
      const old = await caches.match(absolute(asset.url));
      if (await verified(old, asset)) await cache.put(absolute(asset.url), old);
    }
    await cache.put(absolute('/__veloquest_pack__'), new Response(VERSION));
    // No skipWaiting: replacements wait for user action or all old tabs to close.
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = (await caches.keys()).filter(key => key.startsWith('veloquest-'));
    let previous;
    for (const key of keys.filter(key => key !== CACHE).reverse()) {
      if (/^veloquest-v\d+$/.test(key) || await (await caches.open(key)).match(absolute('/__veloquest_pack__'))) { previous = key; break; }
    }
    await Promise.all(keys.filter(key => key !== CACHE && key !== previous).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});
function clientConsent(client) {
  return new Promise(resolve => {
    const channel = new MessageChannel();
    const timer = setTimeout(() => { channel.port1.close(); resolve(false); }, 1800);
    channel.port1.onmessage = event => { clearTimeout(timer); channel.port1.close(); resolve(event.data?.safe === true); };
    client.postMessage({ type: 'VQ_CAN_UPDATE' }, [channel.port2]);
  });
}
let updateInProgress = false;
self.addEventListener('message', event => {
  const port = event.ports[0];
  if (!port || !event.source?.url || new URL(event.source.url).origin !== origin) return;
  event.waitUntil((async () => {
    try {
      if (event.data?.type === 'VQ_STATUS') return port.postMessage(await status());
      if (event.data?.type === 'VQ_REPAIR') {
        const cache = await caches.open(CACHE);
        for (const asset of CORE) if (!await verified(await cache.match(absolute(asset.url)), asset)) await storeAsset(cache, asset);
        return port.postMessage(await status());
      }
      if (event.data?.type === 'VQ_PHOTOS') {
        const cache = await caches.open(CACHE);
        await Promise.all(PHOTOS.map(async asset => { if (!await verified(await cache.match(absolute(asset.url)), asset)) await storeAsset(cache, asset); }));
        return port.postMessage(await status());
      }
      if (event.data?.type !== 'VQ_APPLY') return;
      if (updateInProgress) return port.postMessage({ error: 'Mise à jour déjà en cours.' });
      updateInProgress = true;
      const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      const safe = (await status()).ready && (await Promise.all(clients.map(clientConsent))).every(Boolean);
      if (!safe) {
        clients.forEach(client => client.postMessage({ type: 'VQ_UPDATE_CANCELLED' }));
        updateInProgress = false;
        return port.postMessage({ error: 'Mise à jour différée : ferme le lecteur ou les autres onglets de VéloQuest, puis réessaie.' });
      }
      await self.skipWaiting();
      port.postMessage({ accepted: true });
    } catch {
      updateInProgress = false;
      port.postMessage({ error: 'Préparation incomplète. Reconnecte-toi puis réessaie ; tes données locales sont conservées.' });
    }
  })());
});
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== origin || url.pathname.startsWith('/api/') || url.pathname === '/sw.js') return;
  if (request.mode === 'navigate' && url.pathname === '/') {
    event.respondWith((async () => (await (await caches.open(CACHE)).match(absolute('/'))) || fetch(request))());
    return;
  }
  if (!url.pathname.startsWith('/_next/static/') && !PHOTOS.some(asset => asset.url === url.pathname) && !CORE.some(asset => asset.url === url.pathname)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const key = absolute(url.pathname);
    const cached = await cache.match(key);
    if (cached) return cached;
    try {
      const response = await fetch(request);
      const asset = PHOTOS.find(asset => asset.url === url.pathname) || CORE.find(asset => asset.url === url.pathname);
      if (asset && await verified(response, asset)) await cache.put(key, response.clone());
      return response;
    } catch { return new Response('', { status: 503 }); }
  })());
});
