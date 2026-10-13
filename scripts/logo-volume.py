#!/usr/bin/env python3
"""Prépare le logo « So » pour l'accueil : calque ombré (RGBA) + carte de hauteur (tube arrondi).

  python3 scripts/logo-volume.py media-src/site/logo-source.png public/media/site/

Sorties : logo-layer.png (couleur ombrée + alpha) et logo-height.png (hauteur 0-255).
La hauteur suit la section d'un tube : h = sqrt(r² - (r - d)²), d = distance au bord,
r = demi-épaisseur locale du trait. L'ombrage vient des normales de cette hauteur.
"""
import sys
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage

src, out = Path(sys.argv[1]), Path(sys.argv[2])
img = np.asarray(Image.open(src).convert('RGB')).astype(np.float32) / 255
# trait bleu sur fond blanc
blue = np.clip((img[..., 2] - img[..., 0]) * 1.6, 0, 1)
mask = blue > 0.35
ys, xs = np.where(mask)
pad = 24
y0, y1, x0, x1 = ys.min() - pad, ys.max() + pad, xs.min() - pad, xs.max() + pad
blue = blue[y0:y1, x0:x1]
mask = mask[y0:y1, x0:x1]

# suréchantillonnage x2 pour des bords et un relief lisses
up = 2
alpha = np.asarray(Image.fromarray((blue * 255).astype(np.uint8)).resize((blue.shape[1] * up, blue.shape[0] * up), Image.LANCZOS)) / 255
mask = alpha > 0.5
d = ndimage.distance_transform_edt(mask)
dmax = d.max()
r = ndimage.maximum_filter(d, size=int(dmax * 2.2))  # demi-épaisseur locale
r = np.maximum(r, 1)
h = np.sqrt(np.clip(r ** 2 - (r - np.minimum(d, r)) ** 2, 0, None)) / dmax
h = ndimage.gaussian_filter(h, 1.2) * mask

# normales et ombrage (lumière haut-gauche, comme le soleil couchant de face)
gy, gx = np.gradient(h * dmax * 0.9)
n = np.dstack([-gx, gy, np.ones_like(h)])
n /= np.linalg.norm(n, axis=2, keepdims=True)
L = np.array([-0.45, 0.55, 0.7]); L /= np.linalg.norm(L)
lam = np.clip((n * L).sum(2), 0, 1)
H_ = L + np.array([0, 0, 1.0]); H_ /= np.linalg.norm(H_)
spec = np.clip((n * H_).sum(2), 0, 1) ** 60
rim = (1 - n[..., 2]) ** 2
base = np.array([0.93, 0.92, 1.0])  # blanc légèrement lavande : lisible en mono, couleur et bleu
shade = 0.42 + 0.58 * lam
rgb = base * shade[..., None] + spec[..., None] * 0.9 + rim[..., None] * np.array([0.35, 0.3, 0.6]) * 0.6
rgb = np.clip(rgb, 0, 1)
layer = np.dstack([rgb, np.clip(alpha, 0, 1)])
out.mkdir(parents=True, exist_ok=True)
Image.fromarray((layer * 255).astype(np.uint8), 'RGBA').save(out / 'logo-layer.png', optimize=True)
Image.fromarray((np.clip(h, 0, 1) * 255).astype(np.uint8), 'L').save(out / 'logo-height.png', optimize=True)
print('logo', layer.shape, 'dmax', round(float(dmax), 1))
