#!/usr/bin/env python3
"""Rebuild the five source-pinned landscape additions (requires Pillow).

Run from the repository root. Only the explicitly documented sources are used.
Originals remain in the ignored cache; no crop or generative retouching is applied.
"""
import hashlib
import json
import subprocess
from pathlib import Path
from PIL import Image, ImageOps

sources = json.loads(Path('scripts/landscape-sources.json').read_text())
manifest_path = Path('lib/landscape-photos.json')
manifest = json.loads(manifest_path.read_text())
cache = Path('.cache/landscape-originals')
cache.mkdir(parents=True, exist_ok=True)
for photo_id, source in sources.items():
    original = cache / f'{photo_id}.jpg'
    if not original.exists():
        subprocess.run(['curl', '-fsSL', '--retry', '2', '--max-time', '60',
                        source['originalUrl'], '-o', str(original)], check=True)
    if hashlib.sha256(original.read_bytes()).hexdigest() != source['originalSha256']:
        raise ValueError(f'{photo_id}: original changed; inspect the source and licence before rebuilding')
    image = ImageOps.exif_transpose(Image.open(original)).convert('RGB')
    image.thumbnail((source['maxWidth'], source['maxHeight']), Image.Resampling.LANCZOS)
    output = Path('public' + source['src'])
    image.save(output, 'WEBP', quality=source['quality'], method=6)
    raw = output.read_bytes()
    if len(raw) >= 100_000:
        raise ValueError(f'{photo_id}: exceeds the per-image budget')
    photo = {key: value for key, value in source.items() if key not in ('quality', 'maxWidth', 'maxHeight')}
    photo.update(width=image.width, height=image.height, bytes=len(raw), sha256=hashlib.sha256(raw).hexdigest())
    manifest[photo_id] = photo
manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
print(f'{len(sources)} photos rebuilt, {sum(photo["bytes"] for photo in manifest.values())} total bytes')
