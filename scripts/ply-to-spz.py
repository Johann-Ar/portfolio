#!/usr/bin/env python3
"""Convertit les sorties de SHARP (.ply, 3D Gaussian splats) en .spz pour le web (Spark).

Chaîne complète (voir README, section « Volumétrie SHARP ») :
  1. SHARP (Apple, github.com/apple/ml-sharp) : une image -> un .ply de gaussiennes 3D
       sharp predict -i images/ -o ply/ --device cpu --no-render
  2. ce script : .ply -> .spz (format compressé de Niantic, github.com/nianticlabs/spz)
       python3 scripts/ply-to-spz.py ply/ public/splats/ [--max 600000]

Étapes : les éléments annexes du .ply de SHARP (caméra, etc.) sont retirés, les gaussiennes
quasi transparentes sont écartées, la scène est passée du repère OpenCV (x droite, y bas,
z avant) au repère Three.js (x droite, y haut, z arrière) puis recentrée.
Un fichier public/splats/index.json décrit chaque scène (centre, taille, nombre de gaussiennes).
"""
import json
import os
import sys
import tempfile
from pathlib import Path

import numpy as np
import spz
from plyfile import PlyData, PlyElement

MIN_OPACITY = 0.02  # en dessous, la gaussienne est invisible : on l'écarte


def convert(src: Path, dst: Path, max_count: int | None = None) -> dict:
    ply = PlyData.read(str(src))
    v = ply["vertex"].data
    opacity = 1 / (1 + np.exp(-v["opacity"].astype(np.float64)))
    keep = opacity > MIN_OPACITY
    v = v[keep]
    # allègement pour le web : on garde les gaussiennes qui comptent le plus (opacité × surface)
    if max_count and len(v) > max_count:
        area = np.exp(v["scale_0"].astype(np.float64) + v["scale_1"] + v["scale_2"])
        weight = opacity[keep] * np.cbrt(area) ** 2
        v = v[np.sort(np.argsort(weight)[-max_count:])]

    # .ply réduit aux seules gaussiennes (les éléments caméra de SHARP gênent certains lecteurs)
    with tempfile.NamedTemporaryFile(suffix=".ply", delete=False) as tmp:
        PlyData([PlyElement.describe(v, "vertex")], byte_order="<").write(tmp.name)
        tmp_path = tmp.name

    unpack = spz.UnpackOptions()
    unpack.to_coord = spz.CoordinateSystem.RUB  # repère Three.js
    cloud = spz.load_splat_from_ply(tmp_path, unpack)
    os.unlink(tmp_path)

    # recentrage : on travaille sur les positions (la rotation/échelle des gaussiennes n'en dépend pas)
    pos = np.asarray(cloud.positions, dtype=np.float32).reshape(-1, 3)
    lo = np.percentile(pos, 2, axis=0)
    hi = np.percentile(pos, 98, axis=0)
    center = (lo + hi) / 2
    pos -= center
    cloud.positions = pos.reshape(-1)

    pack = spz.PackOptions()
    pack.from_coord = spz.CoordinateSystem.RUB
    pack.version = 3  # SPZ v3 (gzip) : la v4 (zstd) n'est pas encore lue par Spark
    spz.save_spz(cloud, pack, str(dst))

    size = (hi - lo).tolist()
    info = {"file": dst.name, "count": int(cloud.num_points), "bytes": dst.stat().st_size,
            "size": [round(s, 4) for s in size]}
    print(f"{src.name}: {len(opacity)} -> {cloud.num_points} gaussiennes, "
          f"{src.stat().st_size // 1024} Ko -> {dst.stat().st_size // 1024} Ko, taille {np.round(size, 2)}")
    return info


def main():
    args = sys.argv[1:]
    max_count = None
    if "--max" in args:
        i = args.index("--max")
        max_count = int(args[i + 1])
        del args[i : i + 2]
    src_dir, out_dir = Path(args[0]), Path(args[1])
    out_dir.mkdir(parents=True, exist_ok=True)
    index = {}
    for ply in sorted(src_dir.glob("*.ply")):
        index[ply.stem] = convert(ply, out_dir / f"{ply.stem}.spz", max_count)
    (out_dir / "index.json").write_text(json.dumps(index, indent=2))


if __name__ == "__main__":
    main()
