/**
 * Mots en « tuiles » : chaque lettre est posée sur un carreau grainé, légèrement désaxé.
 * Au scroll, la vitesse fait glisser des copies des lettres (effet de glitch) ;
 * sur le titre, la souris repousse les carreaux.
 */

const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

// pseudo-aléatoire stable (même rendu à chaque chargement)
let seed = 7
const rand = () => {
  seed = (seed * 16807) % 2147483647
  return (seed - 1) / 2147483646
}
const r = (min, max) => (min + rand() * (max - min)).toFixed(3)

/** Renvoie le HTML d'une suite de mots en tuiles. `words` : chaîne ou tableau de chaînes. */
export function tiles(words, { tag = 'span', className = '', label, ghost = false } = {}) {
  const list = Array.isArray(words) ? words : [words]
  const text = label ?? list.join(' ')
  const inner = list
    .map((word) => {
      const letters = [...word]
        .map((ch) => {
          if (ch === ' ') return '<span class="tile-space"></span>'
          const c = esc(ch)
          // décalage vertical seulement : les carreaux restent jointifs, sans rotation (pas de joints clairs)
          const style = `--dy:${r(-0.035, 0.035)};--k:${r(-1, 1)};--z:${r(0.4, 1)};--b1:${r(10, 55)}%;--b2:${r(10, 45)}%`
          const g = ghost ? `<span class="tile__ghost">${c}</span>` : ''
          return `<span class="tile" style="${style}"><span class="tile__g">${c}</span>${g}</span>`
        })
        .join('')
      return `<span class="tile-word">${letters}</span>`
    })
    .join('')
  return `<${tag} class="tiles ${className}" aria-label="${esc(text)}"><span aria-hidden="true" class="tiles__inner">${inner}</span></${tag}>`
}

/** Anime la vitesse de scroll (variable CSS --vel) et la répulsion souris du titre. */
export class TileMotion {
  constructor({ hero, reducedMotion }) {
    this.hero = hero
    this.reducedMotion = reducedMotion
    this.vel = 0
    this.targetVel = 0
    this.lastY = window.scrollY
    this.mouse = { x: -1e4, y: -1e4 }
    this.heroTiles = hero ? [...hero.querySelectorAll('.tile')] : []
    this.offsets = this.heroTiles.map(() => ({ x: 0, y: 0 }))

    if (reducedMotion) return
    window.addEventListener('pointermove', (e) => {
      this.mouse.x = e.clientX
      this.mouse.y = e.clientY
    }, { passive: true })
    document.addEventListener('pointerleave', () => (this.mouse.x = this.mouse.y = -1e4))
    // centres au repos (le titre est fixe : on ne mesure qu'au chargement et au redimensionnement)
    this.measure = () =>
      (this.rects = this.heroTiles.map((t, i) => {
        const b = t.getBoundingClientRect()
        return { x: b.left + b.width / 2 - this.offsets[i].x, y: b.top + b.height / 2 - this.offsets[i].y }
      }))
    window.addEventListener('resize', () => (this.rects = null))
    this.loop = this.loop.bind(this)
    requestAnimationFrame(this.loop)
  }

  loop(now) {
    // vitesse en px par image à 60 fps, amortie selon le temps réel (indépendant du framerate)
    const dt = Math.min(Math.max((now - (this.lastT ?? now)) / 1000, 1 / 240), 0.1)
    this.lastT = now
    const y = window.scrollY
    this.targetVel = ((y - this.lastY) / dt) / 60
    this.lastY = y
    this.vel += (this.targetVel - this.vel) * (1 - Math.pow(0.0005, dt))
    const v = Math.max(-40, Math.min(40, this.vel))
    const vs = Math.abs(v) < 0.05 ? '0' : v.toFixed(1)
    if (vs !== this.lastVs) document.documentElement.style.setProperty('--vel', (this.lastVs = vs))

    if (this.heroTiles.length) {
      if (!this.rects) this.measure()
      const R = 160
      this.heroTiles.forEach((t, i) => {
        const dx = this.rects[i].x - this.mouse.x
        const dy = this.rects[i].y - this.mouse.y
        const d = Math.hypot(dx, dy)
        const f = Math.max(0, 1 - d / R)
        const tx = d ? (dx / d) * f * 26 : 0
        const ty = d ? (dy / d) * f * 26 : 0
        const o = this.offsets[i]
        const k = 1 - Math.pow(0.0005, dt)
        o.x += (tx - o.x) * k
        o.y += (ty - o.y) * k
        const key = `${o.x.toFixed(1)},${o.y.toFixed(1)}`
        if (t._k === key) return
        t._k = key
        t.style.setProperty('--mx', `${o.x.toFixed(1)}px`)
        t.style.setProperty('--my', `${o.y.toFixed(1)}px`)
      })
    }
    requestAnimationFrame(this.loop)
  }
}
