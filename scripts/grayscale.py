#!/usr/bin/env python3
"""Passe en niveaux de gris, hors du site, les images de l'accueil et du contact.

Les fichiers eux-mêmes sont convertis (le site n'a rien à recalculer) :
  - les sources media-src/site/*.png (puis `npm run media` régénère les .webp) ;
  - les volumes SHARP public/splats/*.spz : la couleur de chaque gaussienne devient sa luminance.

    python3 scripts/grayscale.py
"""
import gzip
import struct
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
IMAGES = ["media-src/site/portrait.png", "media-src/site/view-near.png"]
SPLATS = ["public/splats/hero.spz", "public/splats/contact.spz"]
LUMA = np.array([0.2126, 0.7152, 0.0722])  # Rec. 709, comme les shaders du site


def gray_image(path: Path):
    img = Image.open(path)
    alpha = img.getchannel("A") if img.mode in ("RGBA", "LA") else None
    rgb = np.asarray(img.convert("RGB"), dtype=np.float64) / 255
    # luminance calculée en lumière linéaire, puis ré-encodée en sRGB (gris fidèles aux valeurs perçues)
    lin = np.where(rgb <= 0.04045, rgb / 12.92, ((rgb + 0.055) / 1.055) ** 2.4)
    y = lin @ LUMA
    s = np.where(y <= 0.0031308, y * 12.92, 1.055 * np.power(y, 1 / 2.4) - 0.055)
    out = Image.fromarray(np.clip(s * 255 + 0.5, 0, 255).astype(np.uint8), "L").convert("RGB")
    if alpha is not None:
        out.putalpha(alpha)
    out.save(path)
    print(f"{path.name} : niveaux de gris")


def gray_spz(path: Path):
    """SPZ v2/v3 (gzip) : en-tête 16 octets, puis positions, alphas, couleurs (3 octets), échelles, rotations, SH."""
    data = bytearray(gzip.decompress(path.read_bytes()))
    magic, version, n, sh_degree = struct.unpack_from("<IIIB", data)
    assert magic == 0x5053474E and version in (2, 3), "format SPZ inattendu"
    start = 16 + n * 9 + n  # après positions (3 × 24 bits) et alphas
    col = np.frombuffer(data, np.uint8, n * 3, start).reshape(n, 3).astype(np.float64)
    # l'octet de couleur est une fonction affine du coefficient DC : la moyenne pondérée reste exacte
    y = np.clip(col @ LUMA + 0.5, 0, 255).astype(np.uint8)
    data[start : start + n * 3] = np.repeat(y, 3).tobytes()
    sh_dim = {0: 0, 1: 3, 2: 8, 3: 15}[sh_degree]
    if sh_dim:
        rot = 4 if version >= 3 else 3
        sh_start = start + n * 3 + n * 3 + n * rot
        sh = np.frombuffer(data, np.uint8, n * sh_dim * 3, sh_start).reshape(n, sh_dim, 3).astype(np.float64)
        g = np.clip(sh @ LUMA + 0.5, 0, 255).astype(np.uint8)
        data[sh_start : sh_start + n * sh_dim * 3] = np.repeat(g[..., None], 3, axis=2).tobytes()
    path.write_bytes(gzip.compress(bytes(data), 9))
    print(f"{path.name} : {n} gaussiennes en niveaux de gris")


if __name__ == "__main__":
    for p in IMAGES:
        gray_image(ROOT / p)
    for p in SPLATS:
        gray_spz(ROOT / p)
