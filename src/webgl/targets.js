/**
 * Génération des cibles du nuage de points (« splat »).
 *
 * Chaque image est convertie en une grille complète : un point par cellule,
 * avec la couleur de l'image et une profondeur donnée par la luminance (lissée).
 * Rien n'est jeté : l'image reste entièrement lisible.
 *
 * Une cible renvoie :
 *   pos  : Float32Array(count × 4)  x, y, z, taille de cellule (unités monde)
 *   col  : Float32Array(count × 4)  r, g, b, présence (0 = invisible)
 *   tone : Float32Array(count × 2)  opacité en mode monochrome (thème sombre, thème clair)
 */

function canvas2d(w, h) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return c.getContext('2d', { willReadFrequently: true })
}

const imageCache = new Map()
function loadImage(src) {
  if (!imageCache.has(src)) {
    imageCache.set(
      src,
      new Promise((resolve, reject) => {
        const img = new Image()
        img.decoding = 'async'
        img.onload = () => resolve(img)
        img.onerror = reject
        img.src = src
      }),
    )
  }
  return imageCache.get(src)
}

const luma = (r, g, b) => (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255

/**
 * fit     'contain' : tient dans `size` ; 'cover' : remplit l'écran et déborde du cadre
 * size    largeur max (fraction de l'écran) en mode contain
 * overscan débordement en mode cover (1.15 = 15 % au-delà du cadre)
 * paper   image imprimée sur fond blanc : le papier devient transparent
 * depth   amplitude de la profondeur
 * focusX  point de l'image (0 à 1) placé au centre sur mobile en mode cover
 */
export function imageTarget(src, { fit = 'contain', size = 0.5, mobileSize = 0.92, overscan = 1.15, paper = false, depth = 5, focusX = 0.5 } = {}) {
  return async (count, view, isSmall) => {
    const img = await loadImage(src)
    const ratio = img.naturalWidth / img.naturalHeight

    // grille la plus fine possible avec le budget de points
    const gw = Math.max(1, Math.floor(Math.sqrt(count * ratio)))
    const gh = Math.max(1, Math.min(Math.floor(count / gw), Math.round(gw / ratio)))
    const cells = gw * gh

    const ctx = canvas2d(gw, gh)
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(img, 0, 0, gw, gh)
    const data = ctx.getImageData(0, 0, gw, gh).data

    // profondeur lissée : des surfaces continues plutôt qu'un bruit de pixels
    const blur = canvas2d(gw, gh)
    blur.filter = `blur(${Math.max(1, gw / 160)}px)`
    blur.drawImage(img, 0, 0, gw, gh)
    const soft = blur.getImageData(0, 0, gw, gh).data

    // étirement du contraste (min/max) pour exploiter toute la plage
    let lo = 1
    let hi = 0
    for (let i = 0; i < cells; i++) {
      const l = luma(data[i * 4], data[i * 4 + 1], data[i * 4 + 2])
      if (l < lo) lo = l
      if (l > hi) hi = l
    }
    const span = Math.max(hi - lo, 1e-3)
    const norm = (l) => Math.min(1, Math.max(0, (l - lo) / span))

    // placement
    let cell
    if (fit === 'cover') {
      cell = Math.max((view.w * overscan) / gw, (view.h * overscan) / gh)
    } else {
      const maxW = view.w * (isSmall ? mobileSize : size)
      const maxH = view.h * (isSmall ? 0.5 : 0.72)
      cell = Math.min(maxW / gw, maxH / gh)
    }
    // sur mobile (cover), on recentre sur le sujet ; sans dépasser les bords de l'image
    let x0 = (-gw * cell) / 2
    if (fit === 'cover' && isSmall) {
      const half = view.w / 2
      x0 = Math.min(-half, Math.max(half - gw * cell, -focusX * gw * cell))
    }
    const y0 = (gh * cell) / 2

    const pos = new Float32Array(count * 4)
    const col = new Float32Array(count * 4)
    const tone = new Float32Array(count * 2)

    for (let j = 0; j < gh; j++) {
      for (let i = 0; i < gw; i++) {
        const k = j * gw + i
        const d = k * 4
        const l = norm(luma(data[d], data[d + 1], data[d + 2]))
        const z = norm(luma(soft[d], soft[d + 1], soft[d + 2]))

        pos[d] = x0 + (i + 0.5) * cell
        pos[d + 1] = y0 - (j + 0.5) * cell
        pos[d + 2] = (z - 0.5) * depth
        pos[d + 3] = cell

        col[d] = data[d] / 255
        col[d + 1] = data[d + 1] / 255
        col[d + 2] = data[d + 2] / 255
        if (paper) {
          // l'encre est visible, le papier blanc disparaît
          const ink = Math.min(1, Math.max(0, (1 - l - 0.04) / 0.8))
          col[d + 3] = ink
          tone[k * 2] = ink
          tone[k * 2 + 1] = ink
        } else {
          col[d + 3] = 1
          tone[k * 2] = l // thème sombre : points clairs là où l'image est claire
          tone[k * 2 + 1] = 1 - l // thème clair : points foncés là où l'image est foncée
        }
      }
    }

    // points restants (budget non divisible) : posés sur la grille, invisibles
    for (let k = cells; k < count; k++) {
      const from = Math.floor(Math.random() * cells) * 4
      pos.set(pos.subarray(from, from + 4), k * 4)
    }

    return { pos, col, tone }
  }
}
