import { PROFILES, PROFILE_LABELS, profileDefaults } from './webgl/settings.js'

/**
 * Panneau flottant de réglage des splats (touche P).
 * Un jeu de réglages par type d'image (accueil, projets, contact, autres) : le panneau édite
 * celui de la section affichée. Modifications mémorisées dans ce navigateur.
 */

const STORAGE_KEY = 'splat-settings-v21'

const SLIDERS = [
  { key: 'size', label: 'Taille des points', min: 0.2, max: 2.5, step: 0.01 },
  { key: 'relief', label: 'Relief', min: 0, max: 4, step: 0.01 },
  { key: 'push', label: 'Distance', min: -15, max: 60, step: 0.5 },
  { key: 'curve', label: 'Courbure (− sphère / + concave)', min: -1.5, max: 1.5, step: 0.01 },
  { key: 'opacity', label: 'Opacité', min: 0.1, max: 2, step: 0.01 },
  { key: 'contrast', label: 'Contraste', min: 0, max: 3, step: 0.01 },
  { key: 'brightness', label: 'Luminosité', min: 0, max: 3, step: 0.01 },
  { key: 'veil', label: 'Calque couleurs (accueil, contact)', min: 0, max: 1, step: 0.01 },
  { key: 'veilBlack', label: 'Calque « points » : noirs sans couleur', min: 0, max: 1, step: 0.01 },
  { key: 'vignette', label: 'Vignettage (écran)', min: 0, max: 1, step: 0.01 },
  { key: 'imgVignette', label: 'Vignettage de l’image', min: 0, max: 1.5, step: 0.01 },
  { key: 'anim', label: 'Fumée', min: 0, max: 3, step: 0.01 },
  { key: 'animSpeed', label: 'Fumée : vitesse', min: 0, max: 5, step: 0.05 },
  { key: 'smokeHover', label: 'Fumée au survol', min: 0, max: 4, step: 0.05 },
  { key: 'smokeWarp', label: 'Fumée : déformation de l’image', min: 0, max: 1.5, step: 0.01 },
  { key: 'rgb', label: 'Pixels RVB (OLED)', min: 0, max: 1, step: 0.01 },
  { key: 'rgbGlow', label: 'Pixels RVB : halo', min: 0, max: 2, step: 0.01 },
  { key: 'glass', label: 'Verre', min: 0, max: 3, step: 0.01 },
  { key: 'reflect', label: 'Reflets du fond', min: 0, max: 4, step: 0.01 },
  { key: 'glassIor', label: 'Verre 3D : réfraction', min: 0, max: 0.6, step: 0.005 },
  { key: 'glassRough', label: 'Verre 3D : dispersion', min: 0, max: 1, step: 0.01 },
  { key: 'glassBack', label: 'Verre 3D : faces arrière', min: 0, max: 1, step: 0.01 },
  { key: 'glassSat', label: 'Verre 3D : saturation', min: 0, max: 2.5, step: 0.01 },
  { key: 'glassSpeed', label: 'Verre 3D : rotation', min: 0, max: 5, step: 0.05 },
  { key: 'mouseRadius', label: 'Rayon souris', min: 0, max: 10, step: 0.1 },
  { key: 'mouseForce', label: 'Force souris', min: 0, max: 4, step: 0.05 },
  { key: 'breath', label: 'Respiration', min: 0, max: 6, step: 0.05 },
  { key: 'parallax', label: 'Parallaxe', min: 0, max: 4, step: 0.05 },
]

const MODES = ['Mono', 'Couleur', 'Bleu']

function load() {
  let saved = {}
  try {
    saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
  } catch {}
  const all = {}
  for (const name of Object.keys(PROFILES)) all[name] = { ...profileDefaults(name), ...saved[name] }
  return all
}

function save(profiles) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles))
  } catch {}
}

const fmt = (v, step) => (step >= 1 ? String(v) : Number(v).toFixed(step < 0.1 ? 2 : 1))

export class SplatPanel {
  /**
   * @param {object} o
   * @param {(mode:number) => void} o.onMode      changement de mode couleur
   * @param {() => boolean} o.getHeroOld          rendu « ancien » de l'accueil (touche B)
   * @param {(v:boolean) => void} o.setHeroOld
   * @param {() => string} o.getVolume            'points' ou 'sharp'
   * @param {(v:string) => void} o.setVolume
   */
  constructor({ onMode, getHeroOld, setHeroOld, getVolume, setVolume }) {
    this.getVolume = getVolume
    this.setVolume = setVolume
    this.onMode = onMode
    this.getHeroOld = getHeroOld
    this.setHeroOld = setHeroOld
    this.profiles = load()
    this.profile = 'hero' // profil modifié par le panneau (section affichée)
    this.settings = this.profiles[this.profile]
    this.pageProfile = 'other' // profil de l'image visible (habillage de la page)

    const el = document.createElement('aside')
    el.className = 'splat-panel'
    el.setAttribute('data-lenis-prevent', '') // la molette fait défiler le panneau, pas la page
    el.hidden = true
    el.setAttribute('aria-label', 'Réglages des splats')
    el.innerHTML = `
      <header class="splat-panel__head">
        <span>Réglages — <b data-profile></b></span>
        <button type="button" data-close aria-label="Fermer le panneau">×</button>
      </header>
      <span class="splat-panel__label">Volumétrie</span>
      <div class="splat-panel__row splat-panel__modes splat-panel__modes--2" role="group" aria-label="Volumétrie">
        <button type="button" data-volume="points">Points</button>
        <button type="button" data-volume="sharp" title="SHARP (Apple) · Spark · SPZ">SHARP</button>
      </div>
      <p class="splat-panel__status" data-status></p>
      <span class="splat-panel__label">Élément 3D</span>
      <div class="splat-panel__row splat-panel__modes" role="group" aria-label="Élément 3D">
        <button type="button" data-shape="none">Caché</button>
        <button type="button" data-shape="logo">Logo</button>
        <button type="button" data-shape="prisms">Prismes (réf.)</button>
      </div>
      <span class="splat-panel__label">Forme des points</span>
      <div class="splat-panel__row splat-panel__modes" role="group" aria-label="Forme des points">
        <button type="button" data-pshape="round">Rond</button>
        <button type="button" data-pshape="square">Carré</button>
        <button type="button" data-pshape="diamond">Losange</button>
      </div>
      <span class="splat-panel__label">Couleur</span>
      <div class="splat-panel__row splat-panel__modes" role="group" aria-label="Rendu">
        ${MODES.map((m, i) => `<button type="button" data-mode="${i}">${m}</button>`).join('')}
      </div>
      <span class="splat-panel__label">Calque couleurs</span>
      <div class="splat-panel__row splat-panel__modes splat-panel__modes--4" role="group" aria-label="Placement du calque couleurs">
        <button type="button" data-veil="front" title="Par-dessus tout, textes compris">Devant</button>
        <button type="button" data-veil="over" title="Sur l'image, sous les textes">Sur l'image</button>
        <button type="button" data-veil="behind" title="Derrière l'image">Derrière</button>
        <button type="button" data-veil="points" title="Teinte seulement les points">Points</button>
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
        save(this.profiles)
      }
      if (e.target.matches('[data-hero-old]')) this.setHeroOld(e.target.checked)
    })
    el.addEventListener('click', (e) => {
      if (e.target.closest('[data-close]')) this.toggle(false)
      if (e.target.closest('[data-reset]')) this.reset()
      if (e.detail) e.target.closest('button')?.blur() // clic souris : pas de contour persistant
      const mode = e.target.closest('[data-mode]')
      if (mode) this.onMode(Number(mode.dataset.mode))
      const shape = e.target.closest('[data-shape]')
      if (shape) {
        for (const p of Object.values(this.profiles)) p.glassShape = shape.dataset.shape // forme commune
        save(this.profiles)
        this.#apply('glassShape')
        this.sync()
      }
      const ps = e.target.closest('[data-pshape]')
      if (ps) {
        this.settings.shape = ps.dataset.pshape
        save(this.profiles)
        this.#apply('shape')
        this.sync()
      }
      const veil = e.target.closest('[data-veil]')
      if (veil) {
        this.settings.veilMode = veil.dataset.veil
        save(this.profiles)
        this.#apply('veilMode')
        this.sync()
      }
      const volume = e.target.closest('[data-volume]')
      if (volume) this.setVolume(volume.dataset.volume)
    })
    // les touches du site ne doivent pas agir quand on manipule un curseur
    el.addEventListener('keydown', (e) => {
      if (e.code === 'Space') e.stopPropagation()
    })
  }

  /** Met à jour l'affichage du panneau ; les calques de la scène lisent leurs réglages eux-mêmes. */
  #apply(key) {
    const keys = key ? [key] : Object.keys(this.settings)
    for (const k of keys) {
      if ((k === 'veil' || k === 'veilMode' || k === 'vignette') && this.profile === this.pageProfile) this.#writePage()
      const input = this.el.querySelector(`[data-key="${k}"]`)
      const s = SLIDERS.find((x) => x.key === k)
      if (input) input.value = this.settings[k]
      const out = this.el.querySelector(`[data-out="${k}"]`)
      if (out && s) out.textContent = fmt(this.settings[k], s.step)
    }
  }

  /** Habillage de la page (calque couleurs, vignettage écran) : celui de l'image visible. */
  #writePage() {
    const s = this.profiles[this.pageProfile] || this.profiles.other
    const root = document.documentElement
    root.style.setProperty('--veil', s.veil)
    root.style.setProperty('--vignette', s.vignette)
    root.dataset.veil = s.veilMode
  }

  /** L'image d'un profil commence à apparaître (ou la scène se vide : 'other'). */
  setPage(profile) {
    this.pageProfile = PROFILES[profile] ? profile : 'other'
    this.#writePage()
  }

  /** Réglages d'un profil (lus en continu par la scène). */
  get(profile) {
    return this.profiles[profile] || this.profiles.other
  }

  /** Profil modifié par le panneau : celui de la section affichée. */
  setProfile(name) {
    if (!PROFILES[name] || name === this.profile) return
    this.profile = name
    this.settings = this.profiles[name]
    this.#apply()
    this.sync()
  }

  /** Mode de couleur (Espace ou boutons) du profil courant. */
  setMode(mode) {
    this.settings.mode = ((mode % 3) + 3) % 3
    save(this.profiles)
    this.sync()
    return this.settings.mode
  }

  sync() {
    this.el.querySelector('[data-profile]').textContent = PROFILE_LABELS[this.profile]
    const mode = this.settings.mode ?? 0
    this.el.querySelectorAll('[data-mode]').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.mode) === mode)))
    this.el.querySelector('[data-hero-old]').checked = this.getHeroOld()
    this.el.querySelectorAll('[data-pshape]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.pshape === this.settings.shape)))
    this.el.querySelectorAll('[data-veil]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.veil === this.settings.veilMode)))
    this.el.querySelectorAll('[data-shape]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.shape === this.settings.glassShape)))
    const vol = this.getVolume()
    this.el.querySelectorAll('[data-volume]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.volume === vol)))
  }

  status(text) {
    this.el.querySelector('[data-status]').textContent = text
  }

  /** Revient aux réglages par défaut du profil courant. */
  reset() {
    this.profiles[this.profile] = this.settings = profileDefaults(this.profile)
    save(this.profiles)
    this.#apply()
    if (this.profile === this.pageProfile) this.#writePage()
    this.sync()
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
