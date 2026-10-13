/**
 * Génération des cibles du nuage de points.
 * Chaque cible renvoie un Float32Array de `count` × (x, y, z, luminance).
 */

const SAMPLE_RES = 320

/** Échantillonne `count` points proportionnellement à `weights`, et les place dans un rectangle monde. */
function sample({ weights, lum, w, h, count, rect, depth }) {
  const cdf = new Float32Array(weights.length)
  let total = 0
  for (let i = 0; i < weights.length; i++) {
    total += weights[i]
    cdf[i] = total
  }
  const out = new Float32Array(count * 4)
  if (total === 0) return out

  for (let i = 0; i < count; i++) {
    const r = Math.random() * total
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
    const o = i * 4
    out[o] = rect.x + (px / w) * rect.w
    out[o + 1] = rect.y - (py / h) * rect.h
    out[o + 2] = (l - 0.5) * depth + (Math.random() - 0.5) * 0.25
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

/** Le nom, en lettres pleines ; la profondeur suit l'épaisseur du trait. */
export function textTarget(lines, { font = 'IBM Plex Sans', weight = 600 } = {}) {
  return async (count, view, isSmall) => {
    await document.fonts.load(`${weight} 100px "${font}"`)
    const fontSize = 200
    const lineHeight = fontSize * 0.92
    const probe = canvas2d(10, 10)
    probe.font = `${weight} ${fontSize}px "${font}"`
    const textW = Math.max(...lines.map((l) => probe.measureText(l).width))
    const pad = fontSize * 0.2
    const cw = Math.ceil(textW + pad * 2)
    const ch = Math.ceil(lineHeight * lines.length + pad * 2)

    const ctx = canvas2d(cw, ch)
    ctx.font = probe.font
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = '#fff'
    lines.forEach((l, i) => ctx.fillText(l, cw / 2, pad + lineHeight * (i + 0.5)))
    const sharp = ctx.getImageData(0, 0, cw, ch).data

    // version floutée : le cœur des lettres est « plus lumineux » donc plus profond
    const blur = canvas2d(cw, ch)
    blur.filter = `blur(${fontSize * 0.06}px)`
    blur.drawImage(ctx.canvas, 0, 0)
    const soft = blur.getImageData(0, 0, cw, ch).data

    const weights = new Float32Array(cw * ch)
    const lum = new Float32Array(cw * ch)
    for (let i = 0; i < cw * ch; i++) {
      const a = sharp[i * 4] / 255
      weights[i] = a > 0.5 ? 1 : 0
      lum[i] = soft[i * 4] / 255
    }

    const maxW = view.w * (isSmall ? 0.9 : 0.78)
    const maxH = view.h * (isSmall ? 0.5 : 0.6)
    const scale = Math.min(maxW / cw, maxH / ch)
    const rect = { w: cw * scale, h: ch * scale }
    rect.x = -rect.w / 2
    rect.y = rect.h / 2 + view.h * 0.06

    return sample({ weights, lum, w: cw, h: ch, count, rect, depth: 2.4 })
  }
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

    const weights = new Float32Array(w * h)
    const lum = new Float32Array(w * h)
    for (let i = 0; i < w * h; i++) {
      const o = i * 4
      let l = (0.2126 * data[o] + 0.7152 * data[o + 1] + 0.0722 * data[o + 2]) / 255
      if (invert) l = 1 - l
      l *= data[o + 3] / 255
      lum[i] = l
      weights[i] = Math.pow(l, gamma)
    }

    const maxW = view.w * (isSmall ? mobileSize : size)
    const maxH = view.h * (isSmall ? 0.5 : 0.7) * Math.min(1, size / 0.62)
    const scale = Math.min(maxW / w, maxH / h)
    const rect = { w: w * scale, h: h * scale }
    rect.x = -rect.w / 2
    rect.y = rect.h / 2

    return sample({ weights, lum, w, h, count, rect, depth })
  }
}
