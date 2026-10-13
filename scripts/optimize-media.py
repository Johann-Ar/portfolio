#!/usr/bin/env python3
"""Convertit media-src/<dossier>/*.(png|jpg) en WebP optimisés dans public/media/.

- version d'affichage : largeur max 1800 px, qualité 82
- src/media-manifest.json : dimensions de chaque image (évite les sauts de mise en page)

Usage : npm run media
"""
import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC, OUT = ROOT / "media-src", ROOT / "public" / "media"
MAX_W, QUALITY = 1800, 82
MANIFEST = ROOT / "src" / "media-manifest.json"
sizes = {}

for f in sorted(SRC.rglob("*")):
    if f.suffix.lower() not in {".png", ".jpg", ".jpeg", ".webp"}:
        continue
    rel = f.relative_to(SRC).with_suffix(".webp")
    dst = OUT / rel
    dst.parent.mkdir(parents=True, exist_ok=True)
    im = Image.open(f)
    im = im.convert("RGBA" if "A" in im.getbands() or "transparency" in im.info else "RGB")
    if im.width > MAX_W:
        im = im.resize((MAX_W, round(im.height * MAX_W / im.width)), Image.LANCZOS)
    im.save(dst, "WEBP", quality=QUALITY, method=6)
    sizes[rel.as_posix()] = [im.width, im.height]
    print(f"{rel}  {im.width}x{im.height}  {dst.stat().st_size // 1024} Ko")

MANIFEST.write_text(json.dumps(sizes, indent=0, sort_keys=True))
print(f"-> {MANIFEST.relative_to(ROOT)} ({len(sizes)} fichiers)")
