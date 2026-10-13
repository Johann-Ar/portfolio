/**
 * Génération des cibles du nuage de points.
 * Chaque cible renvoie un Float32Array de `count` × (x, y, z, luminance).
 */

const SAMPLE_RES = 440

/** Échantillonne `count` points proportionnellement à `weights`, et les place dans un rectangle monde. */
function sample({ weights, lum, depthMap, w, h, count, rect, depth }) {
  const cdf = new Float32Array(weights.length)
  let total = 0
  for (let i = 0; i < weights.length; i++) {
    total += weights[i]
    cdf[i] = total
  }
  const out = new Float32Array(count * 4)
  if (total === 0) return out

  const step = total / count
  const offset = Math.random() * step
  for (let i = 0; i < count; i++) {
    const r = offset + i * step
    let lo = 0
    let hi = cdf.length - 1
    while (lo < hi) {
      const mid = (lo + hi) >> 1
      if (cdf[mid] < r) lo = mid + 1
      else hi = mid
    }
    const px = (lo % w) + Math.random()
    const py = Math.floor(lo / w) + Math.random()
    const l = lum[lo]
    const z = depthMap ? depthMap[lo] : l
    const o = i * 4
    out[o] = rect.x + (px / w) * rect.w
    out[o + 1] = rect.y - (py / h) * rect.h
    out[o + 2] = (z - 0.5) * depth + (Math.random() - 0.5) * 0.12
    out[o + 3] = l
  }
  return out
}

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

/** Une image : densité et profondeur suivent la luminance des pixels. */
export function imageTarget(src, { invert = false, gamma = 1.5, depth = 7, size = 0.62, mobileSize = 0.92 } = {}) {
  return async (count, view, isSmall) => {
    const img = await loadImage(src)
    const ratio = img.naturalWidth / img.naturalHeight
    const w = ratio >= 1 ? SAMPLE_RES : Math.round(SAMPLE_RES * ratio)
    const h = ratio >= 1 ? Math.round(SAMPLE_RES / ratio) : SAMPLE_RES
    const ctx = canvas2d(w, h)
    ctx.drawImage(img, 0, 0, w, h)
    const data = ctx.getImageData(0, 0, w, h).data

    // carte de profondeur lissée (flou) : des surfaces continues plutôt qu'un bruit de pixels
    const blur = canvas2d(w, h)
    blur.filter = `blur(${Math.max(1, w / 140)}px)`
    blur.drawImage(img, 0, 0, w, h)
    const soft = blur.getImageData(0, 0, w, h).data

    const n = w * h
    const weights = new Float32Array(n)
    const lum = new Float32Array(n)
    const depthMap = new Float32Array(n)
    const luma = (d, o) => {
      let l = (0.2126 * d[o] + 0.7152 * d[o + 1] + 0.0722 * d[o + 2]) / 255
      if (invert) l = 1 - l
      return l * (d[o + 3] / 255)
    }
    let max = 0
    for (let i = 0; i < n; i++) {
      lum[i] = luma(data, i * 4)
      depthMap[i] = luma(soft, i * 4)
      if (lum[i] > max) max = lum[i]
    }
    // contraste normalisé : l'encre la plus dense vaut 1
    const k = max > 0 ? 1 / max : 1
    for (let i = 0; i < n; i++) {
      lum[i] = Math.min(1, lum[i] * k)
      depthMap[i] = Math.min(1, depthMap[i] * k)
      weights[i] = Math.pow(lum[i], gamma)
    }

    const maxW = view.w * (isSmall ? mobileSize : size)
    const maxH = view.h * (isSmall ? 0.5 : 0.7) * Math.min(1, size / 0.62)
    const scale = Math.min(maxW / w, maxH / h)
    const rect = { w: w * scale, h: h * scale }
    rect.x = -rect.w / 2
    rect.y = rect.h / 2

    return sample({ weights, lum, depthMap, w, h, count, rect, depth })
  }
}
