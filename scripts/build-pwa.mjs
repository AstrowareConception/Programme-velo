import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const hash = bytes => createHash('sha256').update(bytes).digest('hex');
export async function buildPwa(root) {
  let packaged = false;
  try {
    const config = JSON.parse(await readFile(join(root, '.next/output/config.json'), 'utf8'));
    if (config.version !== 3) throw new Error('Format du paquet Vercel non pris en charge');
    packaged = true;
  }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  const staticRoot = join(root, packaged ? '.next/output/static/_next/static' : '.next/static');
  const htmlPath = join(root, packaged ? '.next/output/functions/index.prerender-fallback.html' : '.next/server/app/index.html');
  const files = await readdir(staticRoot, { recursive: true });
  const paths = files.filter(p => /\.(js|css|woff2?)$/.test(p)).sort();
  if (!paths.some(p => p.endsWith('.js')) || !paths.some(p => p.endsWith('.css'))) throw new Error('Build PWA incomplet');
  const core = [{ url: '/', sha256: hash(await readFile(htmlPath)) }];
  for (const path of paths) core.push({ url: '/_next/static/' + path, sha256: hash(await readFile(join(staticRoot, path))) });
  for (const url of ['/manifest.webmanifest', '/logo.svg', '/icon.svg', '/pwa-icon/192', '/pwa-icon/512']) core.push({ url });
  const photos = Object.values(JSON.parse(await readFile(join(root, 'lib/landscape-photos.json'), 'utf8'))).map(photo => ({ url: photo.src, sha256: photo.sha256 }));
  const release = process.env.VERCEL_GIT_COMMIT_SHA || execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
  const version = release + '-' + hash(JSON.stringify(core)).slice(0, 12);
  const worker = await readFile(join(root, 'scripts/pwa-worker.js'), 'utf8');
  const generated = `const RELEASE=${JSON.stringify(release)};\nconst VERSION=${JSON.stringify(version)};\nconst CORE=${JSON.stringify(core)};\nconst PHOTOS=${JSON.stringify(photos)};\n` + worker;
  await writeFile(join(root, 'public/sw.js'), generated);
  // The adapter copies public/ before this post-build step. Replace its copy too,
  // including a worker left over from a preceding local build.
  if (packaged) await writeFile(join(root, '.next/output/static/sw.js'), generated);
  console.log(`PWA : ${core.length} fichiers essentiels vérifiables ; ${photos.length} photos facultatives ; ${release.slice(0, 7)} ; ${packaged ? 'paquet Vercel' : 'build Next.js'}`);
  return { release, version, core, photos };
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await buildPwa(process.cwd());
