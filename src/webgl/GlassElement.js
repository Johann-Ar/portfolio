import {
  BackSide,
  BoxGeometry,
  CanvasTexture,
  CatmullRomCurve3,
  FrontSide,
  Group,
  HalfFloatType,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  RepeatWrapping,
  ShaderMaterial,
  SphereGeometry,
  SRGBColorSpace,
  TorusGeometry,
  TubeGeometry,
  Vector2,
  Vector3,
  WebGLRenderTarget,
} from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { CAM_Z } from './targets.js'

/**
 * Élément 3D en verre de l'accueil.
 *
 * Même technique que l'élément central de dorianlods.com, réécrite pour Three.js :
 *  1. la scène située derrière le verre (fond abstrait coloré + nuage de points) est rendue
 *     dans une texture ;
 *  2. les normales des faces arrière du verre sont rendues dans une seconde texture ;
 *  3. le verre lit la première texture, déviée par sa normale (mélangée à celle des faces arrière),
 *     avec une dispersion sur 6 longueurs d'onde (R, Y, G, C, B, P) et 16 échantillons,
 *     puis reçoit reflets spéculaires et Fresnel.
 *
 * Deux formes : « logo » (la vague et l'anneau de Johann) et « prismes » (7 barres en étoile,
 * comme sur la référence). Les réglages passent par cloud.settings (panneau P).
 */

// ---------- géométries ----------

// tracé de la vague (pixels de l'image du logo, 1254 × 1254)
const WAVE = [
  [688, 180], [560, 205], [420, 265], [320, 360], [282, 440], [318, 505], [430, 560], [540, 615],
  [578, 700], [545, 800], [470, 890], [432, 965], [470, 1012], [580, 1028], [690, 1060],
]
const TUBE_R = 38
const RING = { x: 845, y: 708, R: 118, r: 40 }
const CENTER = [600, 620]

function logoParts() {
  const unit = 1 / 920
  const toV = ([x, y]) => new Vector3((x - CENTER[0]) * unit, -(y - CENTER[1]) * unit, 0)
  const pts = WAVE.map(toV)
  pts.forEach((p, i) => (p.z = Math.sin((i / (pts.length - 1)) * Math.PI * 2) * 0.035))
  const curve = new CatmullRomCurve3(pts, false, 'centripetal')
  const r = TUBE_R * unit
  const capA = new SphereGeometry(r, 48, 24).translate(...curve.getPoint(0).toArray())
  const capB = new SphereGeometry(r, 48, 24).translate(...curve.getPoint(1).toArray())
  const tube = new TubeGeometry(curve, 360, r, 48, false)
  // une seule géométrie pour la vague (indices homogènes)
  const wave = mergeGeometries([tube.toNonIndexed(), capA.toNonIndexed(), capB.toNonIndexed()])
  wave.computeVertexNormals()
  const ring = new TorusGeometry(RING.R * unit, RING.r * unit, 64, 180)
  return [
    { geometry: wave, position: new Vector3() },
    { geometry: ring, position: toV([RING.x, RING.y]), spin: true },
  ]
}

/** 7 barres de verre en étoile, comme sur la référence (géométrie recréée, pas l'asset d'origine). */
function prismParts() {
  const parts = []
  const n = 7
  for (let i = 0; i < n; i++) {
    const a = (-i / n) * Math.PI * 2
    const geometry = new BoxGeometry(0.16, 0.4, 0.1)
    parts.push({
      geometry,
      position: new Vector3(Math.sin(a) * 0.36, Math.cos(a) * 0.36, 0),
      rotationZ: -a,
      bar: true,
      index: i,
    })
  }
  return parts
}

// ---------- fond abstrait réfracté (équivalent de la texture « Abstract Background ») ----------

function abstractTexture() {
  const size = 1024
  const c = document.createElement('canvas')
  c.width = c.height = size
  const g = c.getContext('2d')
  g.fillStyle = '#0a1238'
  g.fillRect(0, 0, size, size)

  // pseudo-aléatoire stable
  let seed = 11
  const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646

  // bandes diagonales de couleurs (bleu, cyan, violet, magenta, orange, turquoise), séparées de zones sombres
  const hues = ['#1f3bff', '#2fb8ff', '#6a3dff', '#ff3ea5', '#ff8a1a', '#16d4c0', '#3b5bff', '#5fe0ff', '#0b1660']
  g.save()
  g.translate(size / 2, size / 2)
  g.rotate(-0.6)
  g.translate(-size, -size)
  g.globalCompositeOperation = 'lighter'
  let x = 0
  while (x < size * 2) {
    const w = 25 + rnd() * 110
    const col = hues[Math.floor(rnd() * hues.length)]
    const grd = g.createLinearGradient(x, 0, x + w, 0)
    grd.addColorStop(0, 'rgba(0,0,0,0)')
    grd.addColorStop(0.5, col)
    grd.addColorStop(1, 'rgba(0,0,0,0)')
    g.globalAlpha = 0.45 + rnd() * 0.5
    g.fillStyle = grd
    g.fillRect(x, 0, w, size * 2)
    x += w * (0.45 + rnd() * 0.8)
  }
  // traits blancs fins : les éclats sur les arêtes
  g.globalAlpha = 0.7
  g.fillStyle = '#ffffff'
  for (let i = 0; i < 9; i++) g.fillRect(rnd() * size * 2, 0, 2 + rnd() * 5, size * 2)
  g.restore()
  g.globalAlpha = 1
  g.globalCompositeOperation = 'source-over'
  g.filter = 'blur(5px)'
  g.drawImage(c, 0, 0)

  const tex = new CanvasTexture(c)
  tex.colorSpace = SRGBColorSpace
  tex.wrapS = tex.wrapT = RepeatWrapping
  tex.repeat.set(2, 2)
  return tex
}

// ---------- shaders ----------

const glassVert = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vEye;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vEye = normalize(mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`

const backVert = glassVert
const backFrag = /* glsl */ `
  varying vec3 vNormal;
  void main() {
    gl_FragColor = vec4(normalize(vNormal) * 0.5 + 0.5, 1.0);
  }
`

const glassFrag = /* glsl */ `
  uniform sampler2D uScene;
  uniform sampler2D uBack;
  uniform vec2 uRes;
  uniform float uIOR;
  uniform float uRoughness;
  uniform float uBackInfluence;
  uniform float uSaturation;
  uniform float uIorR, uIorY, uIorG, uIorC, uIorB, uIorP;
  uniform float uOpacity;
  varying vec3 vNormal;
  varying vec3 vEye;

  const int LOOP = 16;

  vec3 sat(vec3 rgb, float k) {
    float l = dot(rgb, vec3(0.2125, 0.7154, 0.0721));
    return mix(vec3(l), rgb, k);
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / uRes;
    vec3 n = normalize(vNormal);
    if (!gl_FrontFacing) n = -n;
    vec3 bn = texture2D(uBack, uv).rgb * 2.0 - 1.0;
    n = normalize(n * (1.0 - uBackInfluence) - bn * uBackInfluence);
    vec3 ev = normalize(vEye);

    // dispersion : 6 longueurs d'onde, 16 échantillons étalés par la rugosité de réfraction
    vec3 R = vec3(0.0);
    for (int i = 0; i < LOOP; i++) {
      float slide = float(i) / float(LOOP) * uRoughness;
      vec2 oR = refract(ev, n, 1.0 / uIorR).xy;
      vec2 oY = refract(ev, n, 1.0 / uIorY).xy;
      vec2 oG = refract(ev, n, 1.0 / uIorG).xy;
      vec2 oC = refract(ev, n, 1.0 / uIorC).xy;
      vec2 oB = refract(ev, n, 1.0 / uIorB).xy;
      vec2 oP = refract(ev, n, 1.0 / uIorP).xy;

      float r = texture2D(uScene, uv + oR * (uIOR + slide)).x * 0.5;
      vec3 sy = texture2D(uScene, uv + oY * (uIOR + slide)).rgb;
      float y = (sy.x * 2.0 + sy.y * 2.0 - sy.z) / 6.0;
      float g = texture2D(uScene, uv + oG * (uIOR + slide * 2.0)).y * 0.5;
      vec3 sc = texture2D(uScene, uv + oC * (uIOR + slide * 2.5)).rgb;
      float c = (sc.y * 2.0 + sc.z * 2.0 - sc.x) / 6.0;
      float b = texture2D(uScene, uv + oB * (uIOR + slide * 3.0)).z * 0.5;
      vec3 sp = texture2D(uScene, uv + oP * (uIOR + slide)).rgb;
      float p = (sp.z * 2.0 + sp.x * 2.0 - sp.y) / 6.0;

      R.r += r + (2.0 * p + 2.0 * y - c) / 3.0;
      R.g += g + (2.0 * y + 2.0 * c - p) / 3.0;
      R.b += b + (2.0 * c + 2.0 * p - y) / 3.0;
    }
    R /= float(LOOP);
    R = sat(R, uSaturation);

    // reflets d'environnement « studio » : dégradé bleu nuit -> bleu clair et boîtes à lumière
    vec3 l = normalize(vec3(-0.6, 0.8, 0.6));
    vec3 h = normalize(l - ev);
    float spec = pow(max(dot(n, h), 0.0), 90.0) * 1.4 + pow(max(dot(n, h), 0.0), 14.0) * 0.1;
    vec3 refl = reflect(ev, n);
    vec3 env = mix(vec3(0.03, 0.05, 0.16), vec3(0.45, 0.62, 1.0), smoothstep(-0.6, 0.9, refl.y));
    env += vec3(1.0) * smoothstep(0.72, 0.9, refl.y) * 0.9; // boîte à lumière haute
    env += vec3(0.7, 0.85, 1.0) * smoothstep(0.82, 0.97, abs(refl.x)) * 0.6; // boîtes latérales
    float fresnel = pow(1.0 - abs(dot(-ev, n)), 3.0);

    R = clamp((R - 0.5) * 1.15 + 0.5, 0.0, 1.0); // contraste : corps sombre, éclats vifs
    vec3 color = R * 0.95 + env * (0.32 + fresnel * 0.68) + vec3(spec);
    gl_FragColor = vec4(color, uOpacity);
  }
`

// ---------- élément ----------

export class GlassElement {
  constructor(cloud) {
    this.cloud = cloud
    const renderer = cloud.renderer
    this.renderer = renderer

    this.rtScale = 0.5
    this.rtScene = new WebGLRenderTarget(2, 2, { type: HalfFloatType })
    this.rtBack = new WebGLRenderTarget(2, 2, { type: HalfFloatType })

    this.uniforms = {
      uScene: { value: this.rtScene.texture },
      uBack: { value: this.rtBack.texture },
      uRes: { value: new Vector2(1, 1) },
      uIOR: { value: 0.13 },
      uRoughness: { value: 0.2 },
      uBackInfluence: { value: 0.33 },
      uSaturation: { value: 1.17 },
      uIorR: { value: 1.15 },
      uIorY: { value: 1.78 },
      uIorG: { value: 1.57 },
      uIorC: { value: 1.39 },
      uIorB: { value: 1.24 },
      uIorP: { value: 1.34 },
      uOpacity: { value: 1 },
    }
    this.material = new ShaderMaterial({ vertexShader: glassVert, fragmentShader: glassFrag, uniforms: this.uniforms, side: FrontSide })
    this.backMaterial = new ShaderMaterial({ vertexShader: backVert, fragmentShader: backFrag, side: BackSide })

    // fond abstrait, uniquement visible à travers le verre (rendu dans la texture de réfraction)
    this.backdrop = new Mesh(new PlaneGeometry(1, 1), new MeshBasicMaterial({ map: abstractTexture(), depthWrite: false }))
    this.backdrop.position.z = -60
    this.backdrop.visible = false
    cloud.scene.add(this.backdrop)

    this.root = new Group() // suit la souris
    this.tilt = new Group() // inclinaison (vue de dessus pour les prismes)
    this.root.add(this.tilt)
    this.root.position.z = 6
    cloud.scene.add(this.root)

    this.meshes = []
    this.shape = null
    this.setShape('logo')

    this.mouse = new Vector2()
    this.damped = new Vector2()
    this.time = 0
    this.progress = 0
    this.rotSpeed = 4 // comme la référence : rapide à l'apparition, puis 0.6
    window.addEventListener(
      'pointermove',
      (e) => this.mouse.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1),
      { passive: true },
    )
    cloud.frameHooks.push((dt) => this.#frame(dt))
  }

  /** 'logo' (vague + anneau) ou 'prisms' (7 barres, comme la référence). */
  setShape(shape) {
    if (shape === this.shape) return
    this.shape = shape
    for (const m of this.meshes) {
      this.tilt.remove(m)
      m.geometry.dispose()
    }
    this.meshes = []
    const parts = shape === 'none' ? [] : shape === 'prisms' ? prismParts() : logoParts()
    for (const part of parts) {
      const mesh = new Mesh(part.geometry, this.material)
      mesh.rotation.order = 'ZYX' // la rotation y se fait autour de l'axe long de la barre
      mesh.position.copy(part.position)
      if (part.rotationZ) mesh.rotation.z = part.rotationZ
      mesh.userData = part
      this.tilt.add(mesh)
      this.meshes.push(mesh)
    }
    this.rotSpeed = 4
  }

  setProgress(p) {
    this.progress = p
  }

  #resize() {
    const size = this.renderer.getDrawingBufferSize(new Vector2())
    if (size.x === this.uniforms.uRes.value.x && size.y === this.uniforms.uRes.value.y) return
    this.uniforms.uRes.value.copy(size)
    this.rtScene.setSize(Math.max(2, size.x * this.rtScale), Math.max(2, size.y * this.rtScale))
    this.rtBack.setSize(size.x, size.y)
  }

  #frame(dt) {
    const set = this.cloud.settings
    const u = this.uniforms
    u.uIOR.value = set.glassIor ?? 0.13
    u.uRoughness.value = set.glassRough ?? 0.2
    u.uBackInfluence.value = set.glassBack ?? 0.33
    u.uSaturation.value = set.glassSat ?? 1.17
    if (set.glassShape && set.glassShape !== this.shape) this.setShape(set.glassShape)

    this.time += dt
    const motion = this.cloud.reducedMotion ? 0 : 1
    const view = this.cloud.viewSize
    const k = (CAM_Z - this.root.position.z) / CAM_Z
    const small = this.cloud.isSmall
    const p = this.progress
    const ease = p * p * (3 - 2 * p)
    const prisms = this.shape === 'prisms'
    const fit = Math.min(view.h * k * 0.55, view.w * k * (small ? 0.62 : 0.45))
    this.root.scale.setScalar(fit * (prisms ? 0.75 : 1) * (1 - ease * 0.35))
    this.root.position.y = view.h * k * (0.04 + ease * 0.55)
    this.root.visible = p < 0.98 && this.meshes.length > 0

    // l'ensemble suit le curseur (amorti), comme sur la référence
    this.damped.lerp(this.mouse, 1 - Math.pow(0.04, dt))
    this.root.rotation.x = this.damped.y * -0.2 * motion
    this.root.rotation.y = this.damped.x * 0.2 * motion

    // vitesse de rotation : 4 à l'apparition, puis 0.6 (× réglage)
    this.rotSpeed += (0.6 - this.rotSpeed) * (1 - Math.pow(0.35, dt))
    const speed = this.rotSpeed * (set.glassSpeed ?? 1) * motion
    if (prisms) {
      this.tilt.rotation.x = 0.7
      this.tilt.rotation.z = 0.35
      for (const m of this.meshes) m.rotation.y += dt * speed // chaque barre tourne sur son axe long
      this.tilt.rotation.y = 0
    } else {
      this.tilt.rotation.x = Math.sin(this.time * 0.37) * 0.08 * motion
      this.tilt.rotation.y = Math.sin(this.time * 0.25 * Math.max(speed, 0.2)) * 0.35 * motion
      for (const m of this.meshes) if (m.userData.spin) m.rotation.y += dt * speed * 0.8
    }
    this.root.position.y += motion * Math.sin(this.time * 0.8) * 0.06

    this.#renderPasses()
  }

  /** Passes préalables : scène derrière le verre, puis normales des faces arrière. */
  #renderPasses() {
    if (!this.root.visible) return
    this.#resize()
    const r = this.renderer
    const scene = this.cloud.scene
    const camera = this.cloud.camera
    const prevTarget = r.getRenderTarget()
    const prevAlpha = r.getClearAlpha()

    // fond abstrait à la taille de l'écran, derrière tout
    const view = this.cloud.viewSize
    const kb = (CAM_Z - this.backdrop.position.z) / CAM_Z
    this.backdrop.scale.set(view.w * kb * 1.1, view.h * kb * 1.1, 1)

    // 1. ce que le verre réfracte : le fond abstrait seul (comme la référence ; les points créeraient un moiré)
    this.root.visible = false
    this.backdrop.visible = true
    const hidden = []
    scene.traverseVisible((o) => {
      if (o !== scene && o !== this.backdrop && (o.isPoints || o.isMesh || o.type === 'SparkRenderer')) hidden.push(o)
    })
    hidden.forEach((o) => (o.visible = false))
    r.setRenderTarget(this.rtScene)
    r.setClearColor(0x000000, 1)
    r.clear()
    r.render(scene, camera)
    hidden.forEach((o) => (o.visible = true))
    this.backdrop.visible = false

    // 2. normales des faces arrière du verre
    this.root.visible = true
    const vis = []
    scene.traverseVisible((o) => {
      if (o !== scene && !this.root.getObjectById(o.id) && o !== this.root && (o.isMesh || o.isPoints)) vis.push(o)
    })
    vis.forEach((o) => (o.visible = false))
    scene.overrideMaterial = this.backMaterial
    r.setRenderTarget(this.rtBack)
    r.setClearColor(0x8080ff, 1)
    r.clear()
    r.render(scene, camera)
    scene.overrideMaterial = null
    vis.forEach((o) => (o.visible = true))

    r.setRenderTarget(prevTarget)
    r.setClearColor(0x000000, prevAlpha)
  }
}
