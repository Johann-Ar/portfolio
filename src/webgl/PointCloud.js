import {
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

/**
 * Nuage de points plein écran.
 * Chaque « cible » (texte ou image) est échantillonnée en N points :
 * la densité suit la luminance, et la luminance pilote la profondeur (z).
 * On passe d'une cible à l'autre par un morph avec dispersion.
 */

const MORPH_DURATION = 1.8
const DELAY_SPREAD = 0.35

const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

export class PointCloud {
  constructor(canvas, { color, reducedMotion = false } = {}) {
    this.canvas = canvas
    this.reducedMotion = reducedMotion
    this.isSmall = window.matchMedia('(max-width: 768px)').matches
    this.count = this.isSmall ? 40000 : 110000

    this.renderer = new WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: 'high-performance' })
    this.renderer.setClearColor(0x000000, 0)
    this.scene = new Scene()
    this.camera = new PerspectiveCamera(35, 1, 0.1, 200)
    this.camera.position.set(0, 0, 30)

    this.targets = new Map()
    this.pending = new Map()
    this.mouse = new Vector2(9999, 9999)
    this.mouseWorld = new Vector3(9999, 9999, 0)
    this.parallax = new Vector2()
    this.parallaxTarget = new Vector2()
    this.progress = 1
    this.currentKey = null
    this.running = true
    this.time = 0
    this.scrollTarget = 0
    this.opacityTarget = 1
    this.offsetTarget = 0
    // rotation manuelle (glisser), avec inertie
    this.userRot = { x: 0, y: 0, vx: 0, vy: 0 }

    this.#buildPoints(color)
    this.resize()

    this.onResize = () => this.resize()
    this.onPointer = (e) => this.#pointer(e)
    this.onLeave = () => this.mouse.set(9999, 9999)
    window.addEventListener('resize', this.onResize)
    canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault()
      this.pause()
      this.onContextLost?.()
    })
    window.addEventListener('pointermove', this.onPointer, { passive: true })
    document.addEventListener('pointerleave', this.onLeave)

    this.last = performance.now()
    this.loop = this.loop.bind(this)
    requestAnimationFrame(this.loop)
  }

  #buildPoints(color) {
    const n = this.count
    const geo = new BufferGeometry()
    this.from = new Float32Array(n * 4) // xyz + luminance
    this.to = new Float32Array(n * 4)
    const rand = new Float32Array(n * 4)
    for (let i = 0; i < n * 4; i++) rand[i] = Math.random()
    this.rand = rand

    geo.setAttribute('position', new BufferAttribute(new Float32Array(n * 3), 3))
    geo.setAttribute('aFrom', new BufferAttribute(this.from, 4))
    geo.setAttribute('aTo', new BufferAttribute(this.to, 4))
    geo.setAttribute('aRand', new BufferAttribute(rand, 4))

    this.uniforms = {
      uTime: { value: 0 },
      uMix: { value: 1 },
      uDelaySpread: { value: DELAY_SPREAD },
      uScroll: { value: 0 },
      uMouse: { value: this.mouseWorld },
      uMouseRadius: { value: this.isSmall ? 2.2 : 3.2 },
      uColor: { value: new Color(color) },
      uOpacity: { value: 1 },
      uSize: { value: this.isSmall ? 1.0 : 1.35 },
      uPixelRatio: { value: 1 },
      uMotion: { value: this.reducedMotion ? 0 : 1 },
    }

    this.material = new ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: this.uniforms,
      transparent: true,
      depthWrite: false,
      depthTest: false,
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
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    this.renderer.setPixelRatio(dpr)
    this.renderer.setSize(w, h, false)
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    this.uniforms.uPixelRatio.value = dpr * (h / 900)
    // les cibles dépendent du cadrage : on les recalcule (sauf si seule la hauteur change, ex. barre d'adresse mobile)
    const widthChanged = this.lastWidth !== undefined && this.lastWidth !== w
    this.lastWidth = w
    if (widthChanged && this.targets.size) {
      const keys = [...this.targets.keys()]
      this.targets.clear()
      clearTimeout(this.resizeTimer)
      this.resizeTimer = setTimeout(() => {
        for (const k of keys) if (k === this.currentKey) this.show(k, { instant: true })
      }, 200)
    }
  }

  #pointer(e) {
    this.mouse.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1)
    this.parallaxTarget.set(this.mouse.x, this.mouse.y)
  }

  /** Enregistre une cible : un générateur asynchrone qui renvoie un Float32Array (x, y, z, lum). */
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

  /** Passe au nuage `key`. */
  async show(key, { instant = false } = {}) {
    this.wanted = key
    const data = await this.#resolve(key)
    if (!data || this.wanted !== key) return
    if (key === this.currentKey && !instant) return

    if (instant || this.reducedMotion) {
      this.from.set(data)
      this.to.set(data)
      this.progress = 1
    } else {
      this.#snapshot()
      this.to.set(data)
      this.progress = 0
    }
    this.currentKey = key
    const g = this.points.geometry
    g.attributes.aFrom.needsUpdate = true
    g.attributes.aTo.needsUpdate = true
  }

  /** Fige la position courante (même calcul que le shader) dans `from`, pour enchaîner sans saut. */
  #snapshot() {
    const { from, to, rand } = this
    const p = this.progress
    if (p >= 1) {
      from.set(to)
      return
    }
    for (let i = 0; i < this.count; i++) {
      const o = i * 4
      const local = Math.min(Math.max((p - rand[o] * DELAY_SPREAD) / (1 - DELAY_SPREAD), 0), 1)
      const m = easeInOutCubic(local)
      const burst = Math.sin(Math.PI * m)
      from[o] = from[o] + (to[o] - from[o]) * m + (rand[o + 1] - 0.5) * burst * 6
      from[o + 1] = from[o + 1] + (to[o + 1] - from[o + 1]) * m + (rand[o + 2] - 0.5) * burst * 6
      from[o + 2] = from[o + 2] + (to[o + 2] - from[o + 2]) * m + (rand[o + 3] - 0.5) * burst * 10
      from[o + 3] = from[o + 3] + (to[o + 3] - from[o + 3]) * m
    }
  }

  /** Valeurs amorties dans la boucle de rendu. */
  setScroll(v) {
    this.scrollTarget = v
  }

  setOpacity(v) {
    this.opacityTarget = v
  }

  /** Rotation au glisser : dx, dy en pixels. */
  drag(dx, dy) {
    this.userRot.vy = dx * 0.006
    this.userRot.vx = dy * 0.004
    this.userRot.y += this.userRot.vy
    this.userRot.x = Math.max(-0.9, Math.min(0.9, this.userRot.x + this.userRot.vx))
    this.dragging = true
  }

  release() {
    this.dragging = false
  }

  setColor(color) {
    this.uniforms.uColor.value.set(color)
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

    if (this.progress < 1) {
      this.progress = Math.min(this.progress + dt / MORPH_DURATION, 1)
    }
    this.uniforms.uMix.value = this.progress
    this.uniforms.uTime.value = this.time
    const k = 1 - Math.pow(0.001, dt) // amortissement indépendant du framerate
    this.uniforms.uScroll.value += (this.scrollTarget - this.uniforms.uScroll.value) * k
    this.uniforms.uOpacity.value += (this.opacityTarget - this.uniforms.uOpacity.value) * k
    const ox = this.offsetTarget * this.viewSize.w
    this.points.position.x += (ox - this.points.position.x) * (1 - Math.pow(0.02, dt))

    // souris -> plan z = 0
    const { w, h } = this.viewSize
    this.mouseWorld.set((this.mouse.x * w) / 2 - this.points.position.x, (this.mouse.y * h) / 2, 0)

    // légère parallaxe de caméra
    if (!this.reducedMotion) {
      this.parallax.lerp(this.parallaxTarget, 0.04)
      const u = this.userRot
      if (!this.dragging) {
        // inertie puis retour lent face caméra
        u.y += u.vy
        u.x = Math.max(-0.9, Math.min(0.9, u.x + u.vx))
        u.vx *= Math.pow(0.02, dt)
        u.vy *= Math.pow(0.02, dt)
        u.x *= Math.pow(0.6, dt)
        u.y *= Math.pow(0.6, dt)
      }
      this.points.rotation.y = this.parallax.x * 0.12 + u.y
      this.points.rotation.x = -this.parallax.y * 0.08 + u.x
    }

    this.renderer.render(this.scene, this.camera)
    requestAnimationFrame(this.loop)
  }
}
