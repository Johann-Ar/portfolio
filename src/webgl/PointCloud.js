import {
  BufferAttribute,
  BufferGeometry,
  Color,
  Group,
  LinearFilter,
  PerspectiveCamera,
  Points,
  Scene,
  ShaderMaterial,
  Texture,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three'
import vertexShader from './points.vert?raw'
import fragmentShader from './points.frag?raw'
import { CAM_Z } from './targets.js'
import { DEFAULT_SETTINGS } from './settings.js'

/**
 * Scène de points (« splats »).
 *
 * Chaque image est un calque indépendant (ses points, ses réglages, sa position).
 * Aucune transition ne relie deux images :
 *   - l'image affichée disparaît entièrement (ses points se dispersent et s'éteignent),
 *   - puis, scène vide, l'image suivante apparaît (points dispersés qui se rassemblent).
 * La disparition est exactement l'apparition jouée à l'envers : une seule valeur `reveal`
 * (0 → 1 → 0), lue par le shader. Un calque garde ses propres réglages jusqu'au bout :
 * rien ne glisse d'une image vers la suivante.
 *
 * Les réglages viennent des profils du panneau (accueil, projets, contact…) via `getSettings(profil)`,
 * lus à chaque image : une modification dans le panneau s'applique en douceur au calque concerné.
 */

const APPEAR = 1.7 // durée de l'apparition (s)
const DISAPPEAR = 1.1 // durée de la disparition (s)
const DELAY_SPREAD = 0.15 // léger décalage entre les points : tous bougent ensemble, sans points restés figés
const HANDOVER = 0.12 // l'image suivante commence quand la précédente est presque éteinte (pas de temps mort)
const ROT_LIMIT = { x: 0.22, y: 0.4 } // rotation manuelle volontairement limitée

// réglage du panneau -> uniform du shader (valeurs continues, rejointes en douceur)
const SETTING_UNIFORMS = {
  size: 'uSizeFactor',
  relief: 'uDepthScale',
  push: 'uPush',
  opacity: 'uOpacityMul',
  mouseForce: 'uMouseForce',
  mouseRadius: 'uMouseRadius',
  breath: 'uBreath',
  curve: 'uCurve',
  glass: 'uGlass',
  reflect: 'uReflect',
  contrast: 'uContrast',
  brightness: 'uBrightness',
  saturation: 'uSaturation',
  veilBlack: 'uVeilBlack',
  anim: 'uAnim',
  animSpeed: 'uAnimSpeed',
  smokeHover: 'uSmokeHover',
  smokeWarp: 'uSmokeWarp',
  imgVignette: 'uImgVignette',
  rgb: 'uRgb',
  rgbGlow: 'uRgbGlow',
}
const SHAPES = { round: 0, square: 1, diamond: 2 }

const clamp = (v, a, b) => Math.min(b, Math.max(a, v))
const damp = (dt, base = 0.001) => 1 - Math.pow(base, dt) // amorti indépendant du framerate

/** Un calque = une image : ses points, son matériau, son état d'apparition. */
class Layer {
  constructor(key, data, shared, count) {
    this.key = key
    this.data = data
    this.reveal = 0 // 0 invisible (dispersé), 1 image formée
    this.dir = 0 // +1 apparaît, -1 disparaît, 0 stable
    this.opts = { profile: 'other', opacity: 1, offset: [0, 0] }
    this.scroll = 0
    this.scrollTarget = 0

    const geo = new BufferGeometry()
    geo.setAttribute('position', shared.position)
    geo.setAttribute('aRand', shared.rand)
    geo.setAttribute('aPos', new BufferAttribute(data.pos, 4))
    geo.setAttribute('aCol', new BufferAttribute(data.col, 4))
    geo.setAttribute('aTone', new BufferAttribute(data.tone, 2))
    geo.setAttribute('aOff', new BufferAttribute(data.off, 1))
    geo.setAttribute('aUv', new BufferAttribute(data.uv || new Float32Array(count * 3), 3))

    data.texture ??= data.image
      ? Object.assign(new Texture(data.image), { minFilter: LinearFilter, generateMipmaps: false, needsUpdate: true })
      : null
    const im = data.image
    this.uniforms = {
      ...shared.uniforms, // temps, caméra, écran : communs à tous les calques
      uReveal: { value: 0 },
      uScroll: { value: 0 },
      uMouse: { value: new Vector3(9999, 9999, 0) },
      uOpacity: { value: 1 },
      uColorMix: { value: 0 },
      uBlueMix: { value: 0 },
      uVeilTint: { value: 0 },
      uShape: { value: 0 },
      uImage: { value: data.texture },
      uToneGain: { value: data.toneGain || 1 },
      uAspectRatio: { value: im ? (im.naturalWidth || im.width) / (im.naturalHeight || im.height) : 1 },
      uImgHalf: { value: new Vector2(...(data.half || [1, 1])) },
    }
    for (const u of Object.values(SETTING_UNIFORMS)) this.uniforms[u] = { value: 0 }

    this.material = new ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: this.uniforms,
      transparent: true,
      depthWrite: false,
      depthTest: true, // les points restent derrière l'élément en verre
    })
    this.points = new Points(geo, this.material)
    this.points.frustumCulled = false
    this.points.visible = false
  }

  /** Valeurs visées par les uniforms, d'après les réglages du profil du calque. */
  targets(s, isSmall) {
    const t = {}
    for (const [key, u] of Object.entries(SETTING_UNIFORMS)) t[u] = s[key] ?? DEFAULT_SETTINGS[key]
    if (isSmall) t.uMouseRadius *= 0.7
    t.uVeilTint = s.veilMode === 'points' ? s.veil : 0 // calque couleurs posé seulement sur les points
    t.uColorMix = s.mode === 1 ? 1 : 0
    t.uBlueMix = s.mode === 2 ? 1 : 0
    t.uOpacity = this.opts.opacity
    return t
  }

  /** Applique les réglages : d'un coup (`k` = 1, au début de l'apparition) ou en douceur. */
  applySettings(s, isSmall, k) {
    const u = this.uniforms
    for (const [name, v] of Object.entries(this.targets(s, isSmall))) u[name].value += (v - u[name].value) * k
    u.uShape.value = SHAPES[s.shape] ?? 0
  }

  dispose() {
    this.points.geometry.dispose()
    this.material.dispose()
  }
}

export class PointCloud {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {object} o
   * @param {string} o.color                        couleur des points en monochrome
   * @param {boolean} o.reducedMotion
   * @param {(profile:string) => object} o.getSettings  réglages d'un profil (lus à chaque image)
   */
  constructor(canvas, { color, reducedMotion = false, getSettings = () => DEFAULT_SETTINGS } = {}) {
    this.canvas = canvas
    this.reducedMotion = reducedMotion
    this.getSettings = getSettings
    this.isSmall = window.matchMedia('(max-width: 768px)').matches
    this.count = this.isSmall ? 50000 : 120000

    this.renderer = new WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: 'high-performance' })
    this.renderer.setClearColor(0x000000, 0)
    this.scene = new Scene()
    this.camera = new PerspectiveCamera(35, 1, 0.1, 200)
    this.camera.position.set(0, 0, CAM_Z)
    // repère qui suit l'image affichée (volumétrie SHARP)
    this.anchor = new Group()
    this.scene.add(this.anchor)

    this.frameHooks = []
    this.factories = new Map() // clé -> fonction qui calcule la cible
    this.targets = new Map() // clé -> données calculées (points, couleurs, texture)
    this.layers = new Map() // clé -> calque
    this.current = null // calque affiché ou en train d'apparaître
    this.leaving = null // calque en train de disparaître
    this.wanted = null // { key, profile, opacity, offset } : image demandée
    this.warm = [] // calques à envoyer au GPU à l'avance (évite un à-coup à leur apparition)
    this.hidePoints = false // masqués par la volumétrie SHARP

    this.mouse = new Vector2(9999, 9999)
    this.parallax = new Vector2()
    this.parallaxTarget = new Vector2()
    this.userRot = { x: 0, y: 0, vx: 0, vy: 0 }
    this.time = 0
    this.running = true
    // qualité adaptative : si l'appareil peine, la résolution du rendu baisse par paliers
    this.quality = 1
    this.perf = { frames: 0, time: 0 }

    this.#buildShared(color)
    this.resize()

    this.onResize = () => this.resize()
    this.onPointer = (e) => {
      this.mouse.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1)
      this.parallaxTarget.copy(this.mouse)
    }
    this.onLeave = () => {
      this.mouse.set(9999, 9999)
      this.parallaxTarget.set(0, 0)
    }
    // au doigt, l'effet ne dure que pendant le contact : on relâche la « souris » en levant le doigt
    this.onPointerUp = (e) => e.pointerType !== 'mouse' && this.onLeave()
    window.addEventListener('resize', this.onResize)
    window.addEventListener('pointermove', this.onPointer, { passive: true })
    window.addEventListener('pointerdown', this.onPointer, { passive: true })
    window.addEventListener('pointerup', this.onPointerUp, { passive: true })
    window.addEventListener('pointercancel', this.onPointerUp, { passive: true })
    document.addEventListener('pointerleave', this.onLeave)
    canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault()
      this.pause()
      this.onContextLost?.()
    })

    this.last = performance.now()
    this.loop = this.loop.bind(this)
    requestAnimationFrame(this.loop)
  }

  /** Données communes à tous les calques : ordre d'apparition des points, uniforms d'écran. */
  #buildShared(color) {
    const n = this.count
    const rand = new Float32Array(n * 4)
    for (let i = 0; i < n * 4; i++) rand[i] = Math.random()
    this.shared = {
      position: new BufferAttribute(new Float32Array(n * 3), 3),
      rand: new BufferAttribute(rand, 4),
      uniforms: {
        uTime: { value: 0 },
        uDelaySpread: { value: DELAY_SPREAD },
        uColor: { value: new Color(color) },
        uLight: { value: 0 },
        uCamZ: { value: CAM_Z },
        uViewH: { value: 1 },
        uAspect: { value: 1 },
        uScreenScale: { value: 1 },
        uMotion: { value: this.reducedMotion ? 0 : 1 },
      },
    }
  }

  /** Taille visible du plan z = 0, en unités monde. */
  get viewSize() {
    const h = 2 * Math.tan((this.camera.fov * Math.PI) / 360) * this.camera.position.z
    return { w: h * this.camera.aspect, h }
  }

  /** Réglages de l'image affichée (élément en verre, volumétrie SHARP). */
  get settings() {
    const layer = this.current || this.leaving
    return this.getSettings(layer?.opts.profile || this.wanted?.profile || 'hero')
  }

  get colorMode() {
    return this.settings.mode ?? 0
  }

  /** Opacité effective de l'image affichée (volumétrie SHARP). */
  get displayOpacity() {
    const layer = this.current || this.leaving
    if (!layer) return 0
    const u = layer.uniforms
    return u.uOpacity.value * u.uOpacityMul.value * layer.reveal
  }

  resize() {
    const w = window.innerWidth
    const h = window.innerHeight
    // rendu au moins en double résolution (suréchantillonnage) : des points de 2 px restent des disques nets
    const dpr = Math.max(1, Math.min(Math.max(window.devicePixelRatio || 1, 2), this.isSmall ? 2 : 2.5) * this.quality)
    this.renderer.setPixelRatio(dpr)
    this.renderer.setSize(w, h, false)
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    const u = this.shared.uniforms
    u.uViewH.value = this.viewSize.h
    u.uAspect.value = w / h
    // pixels écran par unité monde à distance 1 : une cellule de la grille couvre exactement sa place
    u.uScreenScale.value = (h * dpr) / (2 * Math.tan((this.camera.fov * Math.PI) / 360))

    // les cibles dépendent du cadrage : on les recalcule (sauf si seule la hauteur change, ex. barre d'adresse mobile)
    const widthChanged = this.lastWidth !== undefined && this.lastWidth !== w
    this.lastWidth = w
    this.onResized?.()
    if (widthChanged && this.targets.size) {
      clearTimeout(this.resizeTimer)
      this.resizeTimer = setTimeout(() => this.#rebuild(), 200)
    }
  }

  /** Recalcule toutes les cibles ; l'image demandée réapparaît directement formée. */
  #rebuild() {
    for (const layer of this.layers.values()) {
      this.scene.remove(layer.points)
      layer.dispose()
    }
    for (const data of this.targets.values()) data.texture?.dispose()
    this.layers.clear()
    this.targets.clear()
    this.current = this.leaving = null
    this.warm = []
    if (this.wanted) this.#resolve(this.wanted.key).then(() => this.#start(true))
  }

  /** Enregistre une cible : fonction asynchrone (count, view, isSmall) -> { pos, col, tone, off, uv, image }. */
  register(key, factory) {
    this.factories.set(key, factory)
  }

  #resolve(key) {
    if (this.targets.has(key)) return Promise.resolve(this.targets.get(key))
    this.resolving ??= new Map()
    if (!this.resolving.has(key)) {
      const factory = this.factories.get(key)
      if (!factory) return Promise.resolve(null)
      const job = factory(this.count, this.viewSize, this.isSmall).then((data) => {
        this.resolving.delete(key)
        this.targets.set(key, data)
        return data
      })
      this.resolving.set(key, job)
    }
    return this.resolving.get(key)
  }

  #layer(key) {
    let layer = this.layers.get(key)
    if (!layer) {
      layer = new Layer(key, this.targets.get(key), this.shared, this.count)
      this.layers.set(key, layer)
      this.scene.add(layer.points)
    }
    return layer
  }

  /** Calcule une cible à l'avance et l'envoie au GPU (son apparition sera fluide). */
  async preload(key) {
    const data = await this.#resolve(key)
    if (data && !this.layers.has(key)) this.warm.push(this.#layer(key))
    return data
  }

  /**
   * Demande une image. `profile` : réglages à utiliser, `opacity` : opacité de section,
   * `offset` : décalage [x, y] en fraction de l'écran. Rappeler avec la même clé met à jour ces options.
   */
  show(key, { profile = 'other', opacity = 1, offset = [0, 0], instant = false } = {}) {
    this.wanted = { key, profile, opacity, offset }
    const opts = { profile, opacity, offset }
    if (this.current?.key === key) {
      this.current.opts = opts
      return
    }
    // retour sur l'image en train de disparaître : elle se reforme (apparition reprise là où elle en est)
    if (!this.current && this.leaving?.key === key) {
      this.current = this.leaving
      this.leaving = null
      this.current.dir = 1
      this.current.opts = opts
      return
    }
    if (this.current) this.#leave(this.current)
    this.#resolve(key).then(() => instant && this.wanted?.key === key && this.#start(true))
  }

  /** Section sans image : l'image affichée disparaît, la scène reste vide. */
  hide() {
    this.wanted = null
    if (this.current) this.#leave(this.current)
  }

  #leave(layer) {
    if (this.leaving && this.leaving !== layer) this.#drop(this.leaving)
    layer.dir = -1
    this.leaving = layer
    this.current = null
  }

  #drop(layer) {
    layer.reveal = 0
    layer.dir = 0
    layer.points.visible = false
    if (this.leaving === layer) this.leaving = null
    if (this.current === layer) this.current = null
  }

  /** Rapport de taille apparente à la profondeur de l'image (recul de l'image + réglage « Distance »). */
  #depthScale(layer) {
    const off = (layer.data.off[0] || 0) + layer.uniforms.uPush.value
    return Math.max(0.05, (CAM_Z + off) / CAM_Z)
  }

  /** Décalage de l'image (fraction de l'écran) converti à sa profondeur : elle reste au même endroit à l'écran, quelle que soit la distance. */
  #offsetAt(layer) {
    const { w, h } = this.viewSize
    const k = this.#depthScale(layer)
    return [layer.opts.offset[0] * w * k, layer.opts.offset[1] * h * k]
  }

  /** Fait apparaître l'image demandée (scène vide) avec ses propres réglages, appliqués d'un coup. */
  #start(instant = false) {
    const w = this.wanted
    if (!w || !this.targets.has(w.key)) return
    if (instant) {
      if (this.leaving) this.#drop(this.leaving)
      if (this.current && this.current.key !== w.key) this.#drop(this.current)
    }
    const layer = this.#layer(w.key)
    layer.opts = { profile: w.profile, opacity: w.opacity, offset: w.offset }
    layer.applySettings(this.getSettings(w.profile), this.isSmall, 1)
    layer.scroll = layer.scrollTarget
    layer.uniforms.uScroll.value = layer.scroll
    const [ox, oy] = this.#offsetAt(layer)
    layer.points.position.set(ox, oy, 0)
    layer.points.rotation.set(0, 0, 0)
    this.userRot.x = this.userRot.y = this.userRot.vx = this.userRot.vy = 0
    layer.reveal = instant || this.reducedMotion ? 1 : 0
    layer.dir = layer.reveal < 1 ? 1 : 0
    layer.uniforms.uReveal.value = layer.reveal
    layer.points.visible = true
    this.current = layer
    this.onStage?.(w.profile) // l'habillage de la page (calque, vignettage) suit l'image qui apparaît
  }

  /** Rotation au glisser (dx, dy en pixels), limitée. */
  drag(dx, dy) {
    const u = this.userRot
    u.vy = dx * 0.004
    u.vx = dy * 0.003
    u.y = clamp(u.y + u.vy, -ROT_LIMIT.y, ROT_LIMIT.y)
    u.x = clamp(u.x + u.vx, -ROT_LIMIT.x, ROT_LIMIT.x)
    this.dragging = true
  }

  release() {
    this.dragging = false
  }

  /** Sortie au scroll de l'accueil (le nuage se déploie en profondeur) : agit sur l'image affichée. */
  setScroll(v) {
    if (this.current) this.current.scrollTarget = v
  }

  pause() {
    this.running = false
  }

  resume() {
    if (this.running) return
    this.running = true
    this.last = performance.now()
    requestAnimationFrame(this.loop)
  }

  #advance(layer, dt) {
    if (!layer.dir) return
    const duration = this.reducedMotion ? 0.35 : layer.dir > 0 ? APPEAR : DISAPPEAR
    layer.reveal = clamp(layer.reveal + (layer.dir * dt) / duration, 0, 1)
    layer.uniforms.uReveal.value = layer.reveal * layer.reveal * (3 - 2 * layer.reveal) // départ et fin adoucis
    if (layer.dir > 0 && layer.reveal >= 1) layer.dir = 0
    if (layer.dir < 0 && layer.reveal <= 0) {
      this.#drop(layer)
      if (!this.current) this.onStage?.(null) // scène vide : l'habillage de l'image partie s'en va avec elle
    }
  }

  /** Mesure le rythme d'affichage ; en dessous de ~42 images/s, on baisse la résolution (jusqu'à 55 %). */
  #adapt(rawDt) {
    if (rawDt > 0.25 || !(this.current || this.leaving)) return // onglet en pause ou scène vide : pas de mesure
    const p = this.perf
    p.frames++
    p.time += rawDt
    if (p.time < 2) return
    const fps = p.frames / p.time
    p.frames = p.time = 0
    if (fps < 42 && this.quality > 0.55) {
      this.quality = Math.max(0.55, this.quality - 0.15)
      this.resize()
    }
  }

  loop(now) {
    if (!this.running) return
    const rawDt = (now - this.last) / 1000
    const dt = Math.min(rawDt, 0.05)
    this.last = now
    this.#adapt(rawDt)
    this.time += dt
    this.shared.uniforms.uTime.value = this.time

    // 1. la disparition en cours se poursuit, figée dans son état (réglages, position, rotation)
    if (this.leaving) this.#advance(this.leaving, dt)
    // 2. scène (presque) vide : l'image demandée apparaît dès qu'elle est prête
    const sceneFree = !this.leaving || this.leaving.reveal < HANDOVER
    if (sceneFree && !this.current && this.wanted && this.targets.has(this.wanted.key)) this.#start()

    // 3. l'image affichée suit ses réglages (modifications du panneau), sa position et la souris
    const layer = this.current
    const { w, h } = this.viewSize
    if (layer) {
      this.#advance(layer, dt)
      const s = this.getSettings(layer.opts.profile)
      layer.applySettings(s, this.isSmall, damp(dt))
      layer.scroll += (layer.scrollTarget - layer.scroll) * damp(dt)
      layer.uniforms.uScroll.value = layer.scroll
      const p = layer.points.position
      const [ox, oy] = this.#offsetAt(layer)
      p.x += (ox - p.x) * damp(dt, 0.02)
      p.y += (oy - p.y) * damp(dt, 0.02)
      // souris ramenée dans le repère de l'image : le shader la projette ensuite à la profondeur de l'image
      const k = this.#depthScale(layer)
      layer.uniforms.uMouse.value.set((this.mouse.x * w) / 2 - p.x / k, (this.mouse.y * h) / 2 - p.y / k, 0)

      if (!this.reducedMotion) {
        this.parallax.lerp(this.parallaxTarget, damp(dt, 0.08))
        const r = this.userRot
        if (!this.dragging) {
          r.y = clamp(r.y + r.vy, -ROT_LIMIT.y, ROT_LIMIT.y)
          r.x = clamp(r.x + r.vx, -ROT_LIMIT.x, ROT_LIMIT.x)
          r.vx *= Math.pow(0.02, dt)
          r.vy *= Math.pow(0.02, dt)
          r.x *= Math.pow(0.5, dt)
          r.y *= Math.pow(0.5, dt)
        }
        const px = s.parallax ?? DEFAULT_SETTINGS.parallax
        layer.points.rotation.y = this.parallax.x * 0.08 * px + r.y
        layer.points.rotation.x = -this.parallax.y * 0.05 * px + r.x
      }
    }
    const shown = this.current || this.leaving
    if (shown) {
      this.anchor.position.copy(shown.points.position)
      this.anchor.rotation.copy(shown.points.rotation)
    }
    for (const l of [this.current, this.leaving]) if (l) l.material.visible = !this.hidePoints

    // 4. un calque préchargé est dessiné une fois, invisible (reveal 0) : ses données partent au GPU maintenant
    const warming = this.warm.shift()
    const warmOnce = warming && warming !== this.current && warming !== this.leaving
    if (warmOnce) warming.points.visible = true

    for (const hook of this.frameHooks) hook(dt) // calques additionnels (élément en verre, volumétrie SHARP)
    // scène vide (sections sans image) : une dernière image vide, puis plus aucun rendu
    const empty = !this.current && !this.leaving && !warmOnce && !this.frameHooks.length
    if (!empty || !this.clearedEmpty) this.renderer.render(this.scene, this.camera)
    this.clearedEmpty = empty
    if (warmOnce) warming.points.visible = false
    requestAnimationFrame(this.loop)
  }
}
