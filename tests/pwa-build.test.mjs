import { afterEach, describe, expect, it, vi } from 'vitest';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { buildPwa } from '../scripts/build-pwa.mjs';

const roots = [];
const sha = body => createHash('sha256').update(body).digest('hex');
async function put(root, path, body) { await mkdir(dirname(join(root, path)), { recursive: true }); await writeFile(join(root, path), body); }
async function fixture(packaged = false) {
  vi.stubEnv('VERCEL_GIT_COMMIT_SHA', 'tested-release');
  const root = await mkdtemp(join(tmpdir(), 'veloquest-build-test-')); roots.push(root);
  await put(root, 'public/sw.js', 'old worker');
  await put(root, 'scripts/pwa-worker.js', '/* real worker source placeholder */');
  await put(root, 'lib/landscape-photos.json', JSON.stringify({ one: { src: '/photo.webp', sha256: sha('photo') } }));
  const base = packaged ? '.next/output/static/_next/static' : '.next/static';
  await put(root, base + '/chunks/app.js', 'app script');
  await put(root, base + '/chunks/app.css', 'app styles');
  await put(root, base + '/media/font.woff2', 'font');
  await put(root, packaged ? '.next/output/functions/index.prerender-fallback.html' : '.next/server/app/index.html', 'exact html');
  if (packaged) {
    await put(root, '.next/output/config.json', JSON.stringify({ version: 3 }));
    await put(root, '.next/output/static/sw.js', 'old packaged worker');
    await put(root, '.next/server/app/index.html', 'stale html must not be hashed');
    await put(root, '.next/static/chunks/stale.js', 'stale script');
  }
  return root;
}
afterEach(async () => { vi.unstubAllEnvs(); await Promise.all(roots.splice(0).map(root => rm(root, { recursive: true, force: true }))); });
describe('PWA build artifacts', () => {
  it('uses the self-hosted build HTML, scripts, styles and fonts', async () => {
    const root = await fixture(); const result = await buildPwa(root);
    expect(result.release).toBe('tested-release');
    expect(result.core.find(a => a.url === '/').sha256).toBe(sha('exact html'));
    expect(result.core.find(a => a.url.endsWith('app.js')).sha256).toBe(sha('app script'));
    expect(result.core.some(a => a.url.endsWith('font.woff2'))).toBe(true);
    expect(result.photos).toEqual([{ url: '/photo.webp', sha256: sha('photo') }]);
    expect(await readFile(join(root, 'public/sw.js'), 'utf8')).toContain('tested-release');
  });
  it('hashes the actual adapter package and replaces both copies of a stale worker', async () => {
    const root = await fixture(true); const result = await buildPwa(root);
    expect(result.core.find(a => a.url === '/').sha256).toBe(sha('exact html'));
    expect(result.core.some(a => a.url.endsWith('stale.js'))).toBe(false);
    expect(result.core.find(a => a.url.endsWith('app.js')).sha256).toBe(sha('app script'));
    const worker = await readFile(join(root, 'public/sw.js'), 'utf8');
    expect(await readFile(join(root, '.next/output/static/sw.js'), 'utf8')).toBe(worker);
    expect(worker).toContain('tested-release');
  });
  it('refuses an incomplete adapter package without falling back to stale build files', async () => {
    const root = await fixture(true); await rm(join(root, '.next/output/functions/index.prerender-fallback.html'));
    await expect(buildPwa(root)).rejects.toThrow();
    expect(await readFile(join(root, 'public/sw.js'), 'utf8')).toBe('old worker');
    expect(await readFile(join(root, '.next/output/static/sw.js'), 'utf8')).toBe('old packaged worker');
  });
});
