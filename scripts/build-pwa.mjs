import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const hash = bytes => createHash('sha256').update(bytes).digest('hex');
export async function buildPwa(root) {
  const files = await readdir(join(root, '.next/static'), { recursive: true });
  const paths = files.filter(p => /\.(js|css|woff2?)$/.test(p)).sort();
  if (!paths.some(p => p.endsWith('.js')) || !paths.some(p => p.endsWith('.css'))) throw new Error('Build PWA incomplet');
  const core = [{ url: '/', sha256: hash(await readFile(join(root, '.next/server/app/index.html'))) }];
  for (const path of paths) core.push({ url: '/_next/static/' + path, sha256: hash(await readFile(join(root, '.next/static', path))) });
  for (const url of ['/manifest.webmanifest', '/logo.svg', '/icon.svg', '/pwa-icon/192', '/pwa-icon/512']) core.push({ url });
  const photos = Object.values(JSON.parse(await readFile(join(root, 'lib/landscape-photos.json'), 'utf8'))).map(photo => ({ url: photo.src, sha256: photo.sha256 }));
  const release = process.env.VERCEL_GIT_COMMIT_SHA || execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
  const version = release + '-' + hash(JSON.stringify(core)).slice(0, 12);
  const worker = await readFile(join(root, 'scripts/pwa-worker.js'), 'utf8');
  await writeFile(join(root, 'public/sw.js'), `const RELEASE=${JSON.stringify(release)};\nconst VERSION=${JSON.stringify(version)};\nconst CORE=${JSON.stringify(core)};\nconst PHOTOS=${JSON.stringify(photos)};\n` + worker);
  console.log(`PWA : ${core.length} fichiers essentiels vérifiables ; ${photos.length} photos facultatives ; ${release.slice(0, 7)}`);
  return { release, version, core, photos };
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await buildPwa(process.cwd());
