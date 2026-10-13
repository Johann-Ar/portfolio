import {
  BackSide,
  CatmullRomCurve3,
  Color,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  PlaneGeometry,
  PMREMGenerator,
  Scene,
  SphereGeometry,
  TorusGeometry,
  TubeGeometry,
  Vector2,
  Vector3,
  ACESFilmicToneMapping,
} from 'three'
import { CAM_Z } from './targets.js'

/**
 * Logo en verre au centre de l'accueil : une vague (tube) et un anneau (tore),
 * en verre physique irisé (transmission, réfraction, iridescence, dispersion).
 * Tracé repris de l'image du logo (coordonnées en pixels sur 1254 × 1254).
 */

// tracé de la vague, de haut en bas (pixels de l'image d'origine)
const WAVE = [
  [688, 180],
  [560, 205],
  [420, 265],
  [320, 360],
  [282, 440],
  [318, 505],
  [430, 560],
  [540, 615],
  [578, 700],
  [545, 800],
  [470, 890],
  [432, 965],
  [470, 1012],
  [580, 1028],
  [690, 1060],
]
const TUBE_R = 38 // rayon du tube (px)
const RING = { x: 845, y: 708, R: 118, r: 40 } // anneau : centre, rayon, épaisseur (px)
const CENTER = [600, 620] // centre visuel du logo (px)
const DEPTH = 6 // profondeur du logo devant le plan des images

/** Environnement lumineux coloré : les reflets violet, bleu, orange de l'image. */
function buildEnvironment(renderer) {
  const env = new Scene()
  env.add(new Mesh(new SphereGeometry(50, 32, 16), new MeshBasicMaterial({ color: 0x050308, side: BackSide })))
  const panel = (color, intensity, pos, size) => {
    const m = new Mesh(new PlaneGeometry(size[0], size[1]), new MeshBasicMaterial({ color: new Color(color).multiplyScalar(intensity) }))
    m.position.set(...pos)
    m.lookAt(0, 0, 0)
    env.add(m)
  }
  panel('#7a5cff', 3.5, [-18, 10, 12], [22, 14]) // violet, en haut à gauche
  panel('#4fa3ff', 3, [20, 6, 10], [18, 16]) // bleu, à droite
  panel('#ff9a4d', 2.6, [8, -16, 10], [20, 8]) // orange, en bas
  panel('#ff7ad9', 2.2, [-14, -10, -12], [14, 14]) // rose, derrière
  panel('#ffffff', 5, [0, 22, 4], [16, 3]) // bande blanche : reflet spéculaire
  const pmrem = new PMREMGenerator(renderer)
  const tex = pmrem.fromScene(env, 0.035).texture
  pmrem.dispose()
  return tex
}

export class GlassLogo {
  constructor(cloud) {
    this.cloud = cloud
    const renderer = cloud.renderer
    renderer.toneMapping = ACESFilmicToneMapping // n'affecte que les matériaux physiques (le logo)
    renderer.toneMappingExposure = 1.05

    // verre « lumineux » : le canvas est transparent, la transmission n'aurait rien à réfracter ;
    // le corps est donc translucide, éclairé par l'environnement coloré, avec irisation sur les bords
    this.material = new MeshPhysicalMaterial({
      color: new Color('#c3ccff'),
      emissive: new Color('#2a2f8f'),
      emissiveIntensity: 0.22,
      metalness: 0.15,
      roughness: 0.05,
      ior: 1.5,
      iridescence: 1,
      iridescenceIOR: 1.6,
      iridescenceThicknessRange: [180, 900],
      clearcoat: 1,
      clearcoatRoughness: 0.03,
      specularIntensity: 1,
      envMap: buildEnvironment(renderer),
      envMapIntensity: 2.4,
      transparent: true,
      opacity: 1,
    })
    // effet Fresnel : cœur transparent (on voit le splat derrière), bords lumineux et irisés
    this.material.onBeforeCompile = (shader) => {
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <dithering_fragment>',
        `#include <dithering_fragment>
        float fr = pow(1.0 - abs(dot(normalize(normal), normalize(vViewPosition))), 1.5);
        gl_FragColor.rgb += fr * vec3(0.32, 0.26, 0.55);
        gl_FragColor.a *= mix(0.38, 1.0, fr);`,
      )
    }

    this.group = new Group()
    this.inner = new Group()
    this.group.add(this.inner)

    const unit = 1 / 920 // le logo mesure ~920 px de haut : normalisé à 1
    const toV = ([x, y]) => new Vector3((x - CENTER[0]) * unit, -(y - CENTER[1]) * unit, 0)

    // vague : tube lisse + extrémités arrondies
    const pts = WAVE.map(toV)
    // léger relief en profondeur pour que la vague ne soit pas plate
    pts.forEach((p, i) => (p.z = Math.sin((i / (pts.length - 1)) * Math.PI * 2) * 0.035))
    const curve = new CatmullRomCurve3(pts, false, 'centripetal')
    const r = TUBE_R * unit
    const tube = new Mesh(new TubeGeometry(curve, 320, r, 48, false), this.material)
    const capGeo = new SphereGeometry(r, 48, 24)
    const capA = new Mesh(capGeo, this.material)
    const capB = new Mesh(capGeo, this.material)
    capA.position.copy(curve.getPoint(0))
    capB.position.copy(curve.getPoint(1))
    this.inner.add(tube, capA, capB)

    // anneau
    const ring = new Mesh(new TorusGeometry(RING.R * unit, RING.r * unit, 48, 160), this.material)
    ring.position.copy(toV([RING.x, RING.y]))
    this.ring = ring
    this.inner.add(ring)

    this.group.position.z = DEPTH
    cloud.scene.add(this.group)

    this.mouse = new Vector2()
    this.tilt = new Vector2()
    this.time = 0
    this.progress = 0 // 0 : accueil, 1 : sorti
    this.visible = 1
    window.addEventListener(
      'pointermove',
      (e) => this.mouse.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1),
      { passive: true },
    )
    cloud.frameHooks.push((dt) => this.#frame(dt))
  }

  /** Avancement du scroll sur l'accueil (0 à 1) : le logo monte, recule et disparaît. */
  setProgress(p) {
    this.progress = p
  }

  #frame(dt) {
    this.time += dt
    const view = this.cloud.viewSize
    const k = (CAM_Z - DEPTH) / CAM_Z
    const small = this.cloud.isSmall
    // taille : ~55 % de la hauteur visible (45 % de la largeur sur mobile)
    const size = Math.min(view.h * k * 0.55, view.w * k * (small ? 0.62 : 0.45))
    const p = this.progress
    const ease = p * p * (3 - 2 * p)
    this.group.scale.setScalar(size * (1 - ease * 0.35))
    this.group.position.y = view.h * k * (0.04 + ease * 0.55)
    this.group.visible = p < 0.98

    // flottement + inclinaison vers la souris
    const motion = this.cloud.reducedMotion ? 0 : 1
    this.tilt.lerp(this.mouse, 1 - Math.pow(0.05, dt))
    this.inner.rotation.y = motion * (this.tilt.x * 0.45 + Math.sin(this.time * 0.5) * 0.12)
    this.inner.rotation.x = motion * (-this.tilt.y * 0.3 + Math.sin(this.time * 0.37) * 0.06)
    this.inner.position.y = motion * Math.sin(this.time * 0.8) * 0.015
    this.ring.rotation.y = motion * Math.sin(this.time * 0.6) * 0.35
    this.ring.rotation.x = motion * Math.cos(this.time * 0.45) * 0.2
  }
}
