/** Réglages par défaut du panneau. */
export const DEFAULT_SETTINGS = {
  size: 0.61, // taille des points (1 = cellules jointives)
  relief: 0.67, // amplitude de la profondeur
  push: -12.5, // recul global
  opacity: 1.02, // opacité globale
  mouseRadius: 5.1, // rayon d'action de la souris
  mouseForce: 1.05, // force de l'écartement
  breath: 0, // respiration
  parallax: 1.05, // parallaxe à la souris
  curve: 0.46, // courbure des images plein écran : > 0 concave, < 0 sphérique
  glass: 0, // effet verre (bille, reflet, bord lumineux)
  reflect: 0, // intensité des couleurs du fond reflétées
  contrast: 1, // contraste de l'image affichée
  veil: 0.4, // calque aux couleurs du fond par-dessus l'accueil et le contact
  glassShape: 'logo', // élément 3D de l'accueil : 'logo' ou 'prisms' (comme la référence)
  glassIor: 0.13, // intensité de la réfraction
  glassRough: 0.2, // étalement de la dispersion
  glassBack: 0.33, // influence des faces arrière
  glassSat: 1.17, // saturation des couleurs réfractées
  glassSpeed: 1, // vitesse de rotation
}

/**
 * Réglages par type d'image (appliqués selon la section affichée).
 * `mode` : 0 monochrome, 1 couleurs, 2 bleu. Les clés absentes reprennent DEFAULT_SETTINGS.
 */
export const PROFILES = {
  hero: {
    mode: 0,
    size: 0.97,
    relief: 0.67,
    push: -9.5,
    curve: 0.21,
    opacity: 1.05,
    contrast: 1.54,
    veil: 0.38,
    glass: 0,
    reflect: 0,
    breath: 0,
  },
  project: {
    mode: 1,
    size: 1.27,
    relief: 0.66,
    push: -0.5,
    curve: 0.2,
    opacity: 1.2,
    contrast: 0.86,
    veil: 0.31,
    glass: 0,
    reflect: 0,
  },
  contact: {
    mode: 0,
    size: 1.68,
    relief: 1.25,
    push: 30.5,
    curve: 0.46,
    opacity: 1.02,
    contrast: 1.38,
    veil: 0.4,
    glass: 0,
    reflect: 0,
  },
  other: {},
}

export const PROFILE_LABELS = { hero: 'Accueil', project: 'Projets', contact: 'Contact', other: 'Autres sections' }

export const profileDefaults = (name) => ({ mode: 0, ...DEFAULT_SETTINGS, ...PROFILES[name] })
