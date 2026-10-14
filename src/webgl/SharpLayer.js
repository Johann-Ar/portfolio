import { Color } from 'three'
import { SparkRenderer, SplatMesh } from '@sparkjsdev/spark'
import { CAM_Z } from './targets.js'

/**
 * Mode « Volumétrie SHARP » : vrais Gaussian splats 3D au lieu du nuage de points.
 *
 * Chaîne : SHARP (Apple, une image -> gaussiennes 3D) -> SPZ (Niantic, compression)
 * -> Spark (World Labs, rendu Three.js). Les .spz sont générés hors ligne
 * (scripts/ply-to-spz.py) et décrits dans public/splats/index.json.
 *
 * Les splats suivent l'image affichée (repère `cloud.anchor`) : ils héritent du décalage de la section
 * Projets, de la parallaxe et de la rotation au glisser. Chargement à la demande.
 */

const FADE = 2.2 // vitesse du fondu entre deux scènes

export class SharpLayer {
  /**
   * @param {import('./PointCloud.js').PointCloud} cloud
   * @param {object} index    contenu de public/splats/index.json
   * @param {string} baseUrl  dossier des .spz
   * @param {object} layout   clé -> { fit: 'cover' | 'contain', distance, size }
   */
  constructor(cloud, index, baseUrl, layout) {
    this.cloud = cloud
    this.index = index
    this.baseUrl = baseUrl
    this.layout = layout
    this.meshes = new Map()
    this.current = null
    this.enabled = false
    this.onStatus = null

    this.spark = new SparkRenderer({ renderer: cloud.renderer })
    cloud.scene.add(this.spark)
    cloud.frameHooks.push((dt) => this.#frame(dt))
  }

  has(key) {
    return !!this.index[key]
  }

  setEnabled(v) {
    this.enabled = v
    if (v && this.wanted) this.show(this.wanted)
    if (!v) this.cloud.hidePoints = false
  }

  /** Affiche la scène SHARP associée à `key` (si elle existe). */
  async show(key) {
    this.wanted = key
    if (!this.enabled) return
    if (!this.has(key)) {
      this.current = null
      this.cloud.hidePoints = false
      return
    }
    const mesh = await this.#load(key)
    if (this.wanted !== key || !this.enabled) return
    this.current = key
    this.#place(key, mesh)
    // le nuage de points s'efface au profit des gaussiennes
    this.cloud.hidePoints = true
  }

  async #load(key) {
    if (this.meshes.has(key)) return this.meshes.get(key)
    const info = this.index[key]
    this.onStatus?.(`Chargement ${key} (${(info.bytes / 1e6).toFixed(1)} Mo)…`)
    const mesh = new SplatMesh({ url: `${this.baseUrl}${info.file}` })
    mesh.opacity = 0
    mesh.userData.fade = 0
    mesh.userData.info = info
    this.meshes.set(key, mesh)
    this.cloud.anchor.add(mesh) // suit la position et la rotation de l'image affichée
    await mesh.initialized
    this.onStatus?.('')
    return mesh
  }

  /** Mise à l'échelle et placement : bord à bord au loin (accueil, contact) ou cadré (projets). */
  #place(key, mesh) {
    const { size } = mesh.userData.info
    const [w, h, d] = size
    const view = this.cloud.viewSize
    const lay = this.layout[key] || { fit: 'contain', distance: 0, size: 0.5 }
    const push = this.cloud.settings.push
    let s
    if (lay.fit === 'cover') {
      const k = (CAM_Z + lay.distance) / CAM_Z
      s = Math.max((view.w * k * 1.05) / w, (view.h * k * 1.05) / h)
    } else {
      s = Math.min((view.w * lay.size) / w, (view.h * 0.72) / h)
    }
    // la profondeur ne doit pas venir jusqu'à la caméra
    s = Math.min(s, (CAM_Z + lay.distance - 2) / Math.max(d / 2, 1e-3))
    mesh.scale.setScalar(s)
    mesh.position.set(0, 0, -(lay.distance + push))
    mesh.userData.baseScale = s
  }

  /** Teinte selon le mode de couleur (Espace) : couleurs d'origine ou bleu. */
  #tint() {
    const mode = this.cloud.colorMode
    if (mode === 2) return new Color(0.62, 0.56, 1.0)
    return new Color(1, 1, 1)
  }

  #frame(dt) {
    if (!this.meshes.size) return
    const k = 1 - Math.exp(-FADE * dt)
    const opacity = Math.min(this.cloud.displayOpacity, 1)
    const tint = this.#tint()
    for (const [key, mesh] of this.meshes) {
      const target = this.enabled && key === this.current ? 1 : 0
      mesh.userData.fade += (target - mesh.userData.fade) * k
      mesh.opacity = mesh.userData.fade * opacity
      mesh.visible = mesh.userData.fade > 0.002
      mesh.recolor.lerp(tint, k)
      if (key === this.current) mesh.position.z = -((this.layout[key]?.distance || 0) + this.cloud.settings.push)
    }
  }

  /** Recalcule les placements (redimensionnement de la fenêtre). */
  relayout() {
    for (const [key, mesh] of this.meshes) this.#place(key, mesh)
  }
}
