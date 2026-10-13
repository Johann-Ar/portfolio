import {
  LinearFilter,
  Texture,
  BufferAttribute,
  BufferGeometry,
  Color,
  PerspectiveCamera,
  Points,
  Scene,
  ShaderMaterial,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three'
import vertexShader from './points.vert?raw'
import fragmentShader from './points.frag?raw'
import { CAM_Z } from './targets.js'
import { DEFAULT_SETTINGS } from './settings.js'

/**
 * Nuage de points plein écran (« splat »).
 * Chaque cible (image) est une grille de points colorés dont la profondeur suit la luminance.
 * On passe d'une cible à l'autre par un morph avec dispersion.
 * Trois rendus (touche Espace) : monochrome (blanc / noir selon le thème),
 * couleurs de l'image, monochrome bleu (traitement des couvertures de projet).
 * Les réglages fins (panneau, touche P) passent par `settings` / `set()`.
 */


const MORPH_DURATION = 1.8
const DELAY_SPREAD = 0.35
const ROT_LIMIT = { x: 0.22, y: 0.4 } // rotation manuelle volontairement limitée

const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const clamp = (v, a, b) => Math.min(b, Math.max(a, v))

export class PointCloud {
  constructor(canvas, { color, light = false, reducedMotion = false } = {}) {
    this.canvas = canvas
    this.reducedMotion = reducedMotion
    this.isSmall = window.matchMedia('(max-width: 768px)').matches
    this.count = this.isSmall ? 50000 : 120000

    this.renderer = new WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: 'high-performance' })
    this.renderer.setClearColor(0x000000, 0)
    this.scene = new Scene()
    this.camera = new PerspectiveCamera(35, 1, 0.1, 200)
    this.camera.position.set(0, 0, CAM_Z)

    this.frameHooks = []
    this.targets = new Map()
    this.pending = new Map()
    this.mouse = new Vector2(9999, 9999)
    this.mouseWorld = new Vector3(9999, 9999, 0)
    this.parallax = new Vector2()
    this.parallaxTarget = new Vector2()
    this.userRot = { x: 0, y: 0, vx: 0, vy: 0 }
    this.progress = 1
    this.currentKey = null
    this.running = true
    this.time = 0
    this.scrollTarget = 0
    this.opacityTarget = 1
    this.offsetTarget = 0
    this.colorMode = 0 // 0 monochrome, 1 couleurs, 2 bleu
    this.mix = { color: 0, blue: 0 }
    this.settings = { ...DEFAULT_SETTINGS }

    this.#build(color, light)
    for (const [k, v] of Object.entries(this.settings)) this.set(k, v, true) // réglages par défaut appliqués d'emblée
    this.resize()

    this.onResize = () => this.resize()
    this.onPointer = (e) => {
      this.mouse.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1)
      this.parallaxTarget.copy(this.mouse)
    }
    this.onLeave = () => this.mouse.set(9999, 9999)
    window.addEventListener('resize', this.onResize)
    window.addEventListener('pointermove', this.onPointer, { passive: true })
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

  #build(color, light) {
    const n = this.count
    const geo = new BufferGeometry()
    this.buf = {
      from: new Float32Array(n * 4),
      to: new Float32Array(n * 4),
      colFrom: new Float32Array(n * 4),
      colTo: new Float32Array(n * 4),
      toneFrom: new Float32Array(n * 2),
      toneTo: new Float32Array(n * 2),
      offFrom: new Float32Array(n),
      offTo: new Float32Array(n),
      uv: new Float32Array(n * 3),
    }
    const rand = new Float32Array(n * 4)
    for (let i = 0; i < n * 4; i++) rand[i] = Math.random()
    this.rand = rand

    // départ : nuage dispersé et invisible, pour l'apparition au chargement
    for (let i = 0; i < n; i++) {
      const o = i * 4
      this.buf.from[o] = (rand[o + 1] - 0.5) * 60
      this.buf.from[o + 1] = (rand[o + 2] - 0.5) * 40
      this.buf.from[o + 2] = (rand[o + 3] - 0.5) * 40
      this.buf.from[o + 3] = 0.05
    }
    this.buf.to.set(this.buf.from)

    geo.setAttribute('position', new BufferAttribute(new Float32Array(n * 3), 3))
    geo.setAttribute('aFrom', new BufferAttribute(this.buf.from, 4))
    geo.setAttribute('aTo', new BufferAttribute(this.buf.to, 4))
    geo.setAttribute('aColFrom', new BufferAttribute(this.buf.colFrom, 4))
    geo.setAttribute('aColTo', new BufferAttribute(this.buf.colTo, 4))
    geo.setAttribute('aToneFrom', new BufferAttribute(this.buf.toneFrom, 2))
    geo.setAttribute('aToneTo', new BufferAttribute(this.buf.toneTo, 2))
    geo.setAttribute('aOffFrom', new BufferAttribute(this.buf.offFrom, 1))
    geo.setAttribute('aOffTo', new BufferAttribute(this.buf.offTo, 1))
    geo.setAttribute('aUv', new BufferAttribute(this.buf.uv, 3))
    geo.setAttribute('aRand', new BufferAttribute(rand, 4))

    this.uniforms = {
      uTime: { value: 0 },
      uMix: { value: 1 },
      uDelaySpread: { value: DELAY_SPREAD },
      uScroll: { value: 0 },
      uMouse: { value: this.mouseWorld },
      uMouseRadius: { value: this.isSmall ? 2.2 : 3.2 },
      uColor: { value: new Color(color) },
      uLight: { value: light ? 1 : 0 },
      uColorMix: { value: 0 },
      uBlueMix: { value: 0 },
      uOpacity: { value: 1 },
      uOpacityMul: { value: 1 },
      uSizeFactor: { value: DEFAULT_SETTINGS.size },
      uDepthScale: { value: 1 },
      uPush: { value: 0 },
      uMouseForce: { value: 1 },
      uBreath: { value: 1 },
      uCamZ: { value: CAM_Z },
      uCurve: { value: DEFAULT_SETTINGS.curve },
      uViewH: { value: 1 },
      uGlass: { value: DEFAULT_SETTINGS.glass },
      uContrast: { value: 1 },
      uVeilTint: { value: 0 },
      uImage: { value: null }, // image affichée, relue avec un mouvement lent (animation de l'image)
      uAnim: { value: 0 },
      uAnimSpeed: { value: 1 },
      uToneGain: { value: 1 },
      uSmokeHover: { value: 1.5 },
      uAspectRatio: { value: 2 },
      uRgb: { value: 0 },
      uRgbGlow: { value: 0.5 },
      uReflect: { value: DEFAULT_SETTINGS.reflect },
      uAspect: { value: 1 },
      uScreenScale: { value: 1 },
      uMotion: { value: this.reducedMotion ? 0 : 1 },
    }

    this.material = new ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: this.uniforms,
      transparent: true,
      depthWrite: false,
      depthTest: true, // les points restent derrière le logo en verre
    })
    this.points = new Points(geo, this.material)
    this.points.frustumCulled = false
    this.scene.add(this.points)
  }

  /** Taille visible du plan z = 0, en unités monde. */
  get viewSize() {
    const h = 2 * Math.tan((this.camera.fov * Math.PI) / 360) * this.camera.position.z
    return { w: h * this.camera.aspect, h }
  }

  resize() {
    const w = window.innerWidth
    const h = window.innerHeight
    // rendu au moins en double résolution (suréchantillonnage) : des points de 2 px restent des disques nets
    const dpr = Math.min(Math.max(window.devicePixelRatio || 1, 2), this.isSmall ? 2 : 2.5)
    this.renderer.setPixelRatio(dpr)
    this.renderer.setSize(w, h, false)
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    this.uniforms.uViewH.value = this.viewSize.h
    this.uniforms.uAspect.value = w / h
    // pixels écran par unité monde à distance 1 : une cellule de la grille couvre exactement sa place
    this.uniforms.uScreenScale.value = (h * dpr) / (2 * Math.tan((this.camera.fov * Math.PI) / 360))

    // les cibles dépendent du cadrage : on les recalcule (sauf si seule la hauteur change, ex. barre d'adresse mobile)
    const widthChanged = this.lastWidth !== undefined && this.lastWidth !== w
    this.lastWidth = w
    this.onResized?.()
    if (widthChanged && this.targets.size) {
      this.targets.clear()
      clearTimeout(this.resizeTimer)
      this.resizeTimer = setTimeout(() => this.currentKey && this.show(this.currentKey, { instant: true, force: true }), 200)
    }
  }

  /** Applique un réglage ; sauf `immediate`, la valeur est rejointe en douceur (changement de section). */
  set(name, value, immediate = false) {
    this.settings[name] = value
    const map = { size: 'uSizeFactor', relief: 'uDepthScale', push: 'uPush', opacity: 'uOpacityMul', mouseForce: 'uMouseForce', breath: 'uBreath', curve: 'uCurve', glass: 'uGlass', reflect: 'uReflect', contrast: 'uContrast', mouseRadius: 'uMouseRadius', veilTint: 'uVeilTint', anim: 'uAnim', animSpeed: 'uAnimSpeed', smokeHover: 'uSmokeHover', rgb: 'uRgb', rgbGlow: 'uRgbGlow' }
    const uniform = map[name]
    if (!uniform) return
    const v = name === 'mouseRadius' ? value * (this.isSmall ? 0.7 : 1) : value
    this.uniformTargets ??= {}
    this.uniformTargets[uniform] = v
    if (immediate) this.uniforms[uniform].value = v
  }

  /** Enregistre une cible : fonction asynchrone (count, view, isSmall) -> { pos, col, tone, off }. */
  register(key, factory) {
    this.pending.set(key, factory)
  }

  async #resolve(key) {
    if (this.targets.has(key)) return this.targets.get(key)
    const factory = this.pending.get(key)
    if (!factory) return null
    const data = await factory(this.count, this.viewSize, this.isSmall)
    this.targets.set(key, data)
    return data
  }

  preload(key) {
    return this.#resolve(key)
  }

  async show(key, { instant = false, force = false } = {}) {
    this.wanted = key
    const data = await this.#resolve(key)
    if (!data || this.wanted !== key) return
    if (key === this.currentKey && !force) return

    const b = this.buf
    if (instant || this.reducedMotion) {
      b.from.set(data.pos)
      b.colFrom.set(data.col)
      b.toneFrom.set(data.tone)
      b.offFrom.set(data.off)
      this.progress = 1
    } else {
      this.#snapshot()
      this.progress = 0
    }
    b.to.set(data.pos)
    b.colTo.set(data.col)
    b.toneTo.set(data.tone)
    b.offTo.set(data.off)
    if (data.uv) b.uv.set(data.uv)
    // texture de l'image (une par cible), pour l'animer sous la grille de points
    if (data.image) {
      data.texture ??= Object.assign(new Texture(data.image), { minFilter: LinearFilter, generateMipmaps: false, needsUpdate: true })
      this.uniforms.uImage.value = data.texture
      this.uniforms.uToneGain.value = data.toneGain || 1
      const im = data.image
      this.uniforms.uAspectRatio.value = (im.naturalWidth || im.width) / (im.naturalHeight || im.height)
    }
    this.currentKey = key
    this.userRot.vx = this.userRot.vy = 0

    const a = this.points.geometry.attributes
    for (const name of ['aFrom', 'aTo', 'aColFrom', 'aColTo', 'aToneFrom', 'aToneTo', 'aOffFrom', 'aOffTo', 'aUv']) a[name].needsUpdate = true
  }

  /** Fige l'état courant (même calcul que le shader) dans `from`, pour enchaîner sans saut. */
  #snapshot() {
    const { from, to, colFrom, colTo, toneFrom, toneTo, offFrom, offTo } = this.buf
    const rand = this.rand
    const p = this.progress
    if (p >= 1) {
      from.set(to)
      colFrom.set(colTo)
      toneFrom.set(toneTo)
      offFrom.set(offTo)
      return
    }
    for (let i = 0; i < this.count; i++) {
      const o = i * 4
      const local = clamp((p - rand[o] * DELAY_SPREAD) / (1 - DELAY_SPREAD), 0, 1)
      const m = easeInOutCubic(local)
      const burst = Math.sin(Math.PI * m)
      from[o] += (to[o] - from[o]) * m + (rand[o + 1] - 0.5) * burst * 6
      from[o + 1] += (to[o + 1] - from[o + 1]) * m + (rand[o + 2] - 0.5) * burst * 6
      from[o + 2] += (to[o + 2] - from[o + 2]) * m + (rand[o + 3] - 0.5) * burst * 10
      from[o + 3] += (to[o + 3] - from[o + 3]) * m
      for (let c = 0; c < 4; c++) colFrom[o + c] += (colTo[o + c] - colFrom[o + c]) * m
      toneFrom[i * 2] += (toneTo[i * 2] - toneFrom[i * 2]) * m
      toneFrom[i * 2 + 1] += (toneTo[i * 2 + 1] - toneFrom[i * 2 + 1]) * m
      offFrom[i] += (offTo[i] - offFrom[i]) * m
    }
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

  setColor(color, light) {
    this.uniforms.uColor.value.set(color)
    this.uniforms.uLight.value = light ? 1 : 0
  }

  /** Mode de couleur : 0 monochrome, 1 couleurs de l'image, 2 monochrome bleu. */
  setColorMode(mode) {
    this.colorMode = ((mode % 3) + 3) % 3
    return this.colorMode
  }

  cycleColorMode() {
    return this.setColorMode(this.colorMode + 1)
  }

  setScroll(v) {
    this.scrollTarget = v
  }

  setOpacity(v) {
    this.opacityTarget = v
  }

  /** Décalage horizontal du nuage, en fraction de la largeur visible. */
  setOffset(v) {
    this.offsetTarget = v
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

  loop(now) {
    if (!this.running) return
    const dt = Math.min((now - this.last) / 1000, 0.05)
    this.last = now
    this.time += dt

    if (this.progress < 1) this.progress = Math.min(this.progress + dt / MORPH_DURATION, 1)
    const u = this.uniforms
    u.uMix.value = this.progress
    u.uTime.value = this.time

    // valeurs amorties, indépendantes du framerate
    const k = 1 - Math.pow(0.001, dt)
    u.uScroll.value += (this.scrollTarget - u.uScroll.value) * k
    u.uOpacity.value += (this.opacityTarget - u.uOpacity.value) * k
    for (const name in this.uniformTargets) u[name].value += (this.uniformTargets[name] - u[name].value) * k
    u.uColorMix.value += ((this.colorMode === 1 ? 1 : 0) - u.uColorMix.value) * k
    u.uBlueMix.value += ((this.colorMode === 2 ? 1 : 0) - u.uBlueMix.value) * k
    const ox = this.offsetTarget * this.viewSize.w
    this.points.position.x += (ox - this.points.position.x) * (1 - Math.pow(0.02, dt))

    const { w, h } = this.viewSize
    this.mouseWorld.set((this.mouse.x * w) / 2 - this.points.position.x, (this.mouse.y * h) / 2, 0)

    if (!this.reducedMotion) {
      this.parallax.lerp(this.parallaxTarget, 1 - Math.pow(0.08, dt))
      const r = this.userRot
      if (!this.dragging) {
        r.y = clamp(r.y + r.vy, -ROT_LIMIT.y, ROT_LIMIT.y)
        r.x = clamp(r.x + r.vx, -ROT_LIMIT.x, ROT_LIMIT.x)
        r.vx *= Math.pow(0.02, dt)
        r.vy *= Math.pow(0.02, dt)
        r.x *= Math.pow(0.5, dt)
        r.y *= Math.pow(0.5, dt)
      }
      const px = this.settings.parallax
      this.points.rotation.y = this.parallax.x * 0.08 * px + r.y
      this.points.rotation.x = -this.parallax.y * 0.05 * px + r.x
    }

    for (const hook of this.frameHooks) hook(dt) // calques additionnels (logo, volumétrie SHARP)
    this.renderer.render(this.scene, this.camera)
    requestAnimationFrame(this.loop)
  }
}
