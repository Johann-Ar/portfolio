import { DEFAULT_SETTINGS } from './webgl/PointCloud.js'

/**
 * Panneau flottant de réglage des splats (touche P).
 * Agit en direct sur l'image affichée ; les réglages sont mémorisés dans ce navigateur.
 */

const STORAGE_KEY = 'splat-settings'

const SLIDERS = [
  { key: 'size', label: 'Taille des points', min: 0.2, max: 2.5, step: 0.01 },
  { key: 'relief', label: 'Relief', min: 0, max: 4, step: 0.01 },
  { key: 'push', label: 'Distance', min: -15, max: 60, step: 0.5 },
  { key: 'curve', label: 'Courbure (− sphère / + concave)', min: -1.5, max: 1.5, step: 0.01 },
  { key: 'opacity', label: 'Opacité', min: 0.1, max: 2, step: 0.01 },
  { key: 'mouseRadius', label: 'Rayon souris', min: 0, max: 10, step: 0.1 },
  { key: 'mouseForce', label: 'Force souris', min: 0, max: 4, step: 0.05 },
  { key: 'breath', label: 'Respiration', min: 0, max: 6, step: 0.05 },
  { key: 'parallax', label: 'Parallaxe', min: 0, max: 4, step: 0.05 },
]

const MODES = ['Mono', 'Couleur', 'Bleu']

function load() {
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

function save(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {}
}

const fmt = (v, step) => (step >= 1 ? String(v) : Number(v).toFixed(step < 0.1 ? 2 : 1))

export class SplatPanel {
  /**
   * @param {object} o
   * @param {() => import('./webgl/PointCloud.js').PointCloud|null} o.getCloud
   * @param {(mode:number) => void} o.onMode      changement de mode couleur
   * @param {() => boolean} o.getHeroOld          rendu « ancien » de l'accueil (touche B)
   * @param {(v:boolean) => void} o.setHeroOld
   */
  constructor({ getCloud, onMode, getHeroOld, setHeroOld }) {
    this.getCloud = getCloud
    this.onMode = onMode
    this.getHeroOld = getHeroOld
    this.setHeroOld = setHeroOld
    this.settings = load()

    const el = document.createElement('aside')
    el.className = 'splat-panel'
    el.hidden = true
    el.setAttribute('aria-label', 'Réglages des splats')
    el.innerHTML = `
      <header class="splat-panel__head">
        <span>Splat — réglages</span>
        <button type="button" data-close aria-label="Fermer le panneau">×</button>
      </header>
      <div class="splat-panel__row splat-panel__modes" role="group" aria-label="Rendu">
        ${MODES.map((m, i) => `<button type="button" data-mode="${i}">${m}</button>`).join('')}
      </div>
      <label class="splat-panel__check"><input type="checkbox" data-hero-old /> Ancien rendu de l’accueil (B)</label>
      ${SLIDERS.map(
        (s) => `<label class="splat-panel__slider">
          <span>${s.label}<output data-out="${s.key}"></output></span>
          <input type="range" data-key="${s.key}" min="${s.min}" max="${s.max}" step="${s.step}" />
        </label>`,
      ).join('')}
      <footer class="splat-panel__foot">
        <button type="button" data-reset>Réinitialiser</button>
        <span><kbd>P</kbd> fermer</span>
      </footer>`
    document.body.append(el)
    this.el = el

    el.addEventListener('input', (e) => {
      const key = e.target.dataset.key
      if (key) {
        this.settings[key] = Number(e.target.value)
        this.#apply(key)
        save(this.settings)
      }
      if (e.target.matches('[data-hero-old]')) this.setHeroOld(e.target.checked)
    })
    el.addEventListener('click', (e) => {
      if (e.target.closest('[data-close]')) this.toggle(false)
      if (e.target.closest('[data-reset]')) this.reset()
      if (e.detail) e.target.closest('button')?.blur() // clic souris : pas de contour persistant
      const mode = e.target.closest('[data-mode]')
      if (mode) this.onMode(Number(mode.dataset.mode))
    })
    // les touches du site ne doivent pas agir quand on manipule un curseur
    el.addEventListener('keydown', (e) => {
      if (e.code === 'Space') e.stopPropagation()
    })
  }

  #apply(key) {
    const cloud = this.getCloud()
    const keys = key ? [key] : Object.keys(this.settings)
    for (const k of keys) {
      cloud?.set(k, this.settings[k])
      const input = this.el.querySelector(`[data-key="${k}"]`)
      const s = SLIDERS.find((x) => x.key === k)
      if (input) input.value = this.settings[k]
      const out = this.el.querySelector(`[data-out="${k}"]`)
      if (out && s) out.textContent = fmt(this.settings[k], s.step)
    }
  }

  /** À appeler quand le nuage est prêt : applique les réglages mémorisés. */
  attach() {
    this.#apply()
  }

  sync() {
    const mode = this.getCloud()?.colorMode ?? 0
    this.el.querySelectorAll('[data-mode]').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.mode) === mode)))
    this.el.querySelector('[data-hero-old]').checked = this.getHeroOld()
  }

  reset() {
    this.settings = { ...DEFAULT_SETTINGS }
    save(this.settings)
    this.#apply()
  }

  toggle(force) {
    const open = force ?? this.el.hidden
    this.el.hidden = !open
    if (open) {
      this.#apply()
      this.sync()
    }
  }
}
