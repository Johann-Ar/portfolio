/** Réglages par défaut du panneau. */
export const DEFAULT_SETTINGS = {
  size: 0.61, // taille des points (1 = cellules jointives)
  relief: 0.67, // amplitude de la profondeur
  push: -12.5, // recul global
  opacity: 1.02, // opacité globale
  mouseRadius: 5.1, // rayon d'action de la souris
  mouseForce: 1.05, // force de l'écartement
  breath: 0, // respiration
  parallax: 0.15, // parallaxe à la souris
  curve: 0.46, // courbure des images plein écran : > 0 concave, < 0 sphérique
  glass: 0, // effet verre (bille, reflet, bord lumineux)
  reflect: 0, // intensité des couleurs du fond reflétées
  contrast: 1, // contraste de l'image affichée
  veil: 0.4, // calque aux couleurs du fond par-dessus l'accueil et le contact
  veilBlack: 0, // calque « points » : 1 = pas de couleur sur les zones noires
  veilMode: 'over', // placement du calque : 'front' devant tout, 'over' sur l'image, 'behind' derrière, 'points' seulement les points
  vignette: 0, // vignettage (bords assombris)
  anim: 0.8, // fumée : l'image se déforme en volutes (les points restent fixes)
  smokeHover: 1.5, // fumée renforcée sous la souris
  shape: 'round', // forme des points : 'round', 'square' ou 'diamond'
  smokeWarp: 0.3, // déformation de l'image par la fumée (0 : aucune)
  imgVignette: 0, // vignettage appliqué à l'image (ses bords noircissent)
  animSpeed: 1, // vitesse de l'animation
  rgb: 0, // effet « pixels RVB » (0 à 1)
  rgbGlow: 0.5, // halo des sous-pixels
  glassShape: 'none', // élément 3D de l'accueil : 'none' (caché, logo intégré à l'image), 'logo' ou 'prisms'
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
    size: 0.81,
    relief: 0.95,
    push: 0,
    curve: -0.13,
    opacity: 1.1,
    contrast: 1.6,
    veil: 0.08,
    veilMode: 'behind',
    vignette: 1,
    imgVignette: 1.24,
    anim: 1.35,
    animSpeed: 2.1,
    smokeHover: 2.85,
    smokeWarp: 0.09,
    rgb: 0,
    glass: 0,
    reflect: 0,
    mouseRadius: 3.4,
    mouseForce: 0,
    breath: 0,
    rgbGlow: 0.5,
    parallax: 0.15,
  },
  project: {
    mode: 1,
    size: 1.27,
    relief: 0.82,
    push: 0,
    curve: 0,
    opacity: 1.2,
    contrast: 0.53,
    veil: 0.09,
    veilMode: 'points',
    vignette: 1,
    imgVignette: 0,
    anim: 0.8,
    animSpeed: 1,
    smokeHover: 1.5,
    smokeWarp: 0.3,
    rgb: 0,
    rgbGlow: 0.5,
    glass: 0,
    reflect: 0,
    mouseRadius: 5.1,
    mouseForce: 1.05,
    breath: 0,
    parallax: 0.55,
    shape: 'round',
  },
  contact: {
    mode: 0,
    size: 1.62,
    relief: 0,
    push: -0.5,
    curve: 0.01,
    opacity: 0.46,
    contrast: 1.39,
    veil: 0.2,
    veilMode: 'points',
    veilBlack: 1,
    vignette: 0,
    imgVignette: 0,
    anim: 0.69,
    animSpeed: 1.5,
    smokeHover: 1.25,
    smokeWarp: 1.42,
    rgb: 0,
    rgbGlow: 0.03,
    glass: 0,
    reflect: 0,
    mouseRadius: 1.8,
    mouseForce: 0,
    breath: 0,
    parallax: 0.55,
    shape: 'round',
  },
  other: { veil: 0, vignette: 1 }, // compétences, à propos : pas d'image, vignettage écran seulement
}

export const PROFILE_LABELS = { hero: 'Accueil', project: 'Projets', contact: 'Contact', other: 'Autres sections' }

export const profileDefaults = (name) => ({ mode: 0, ...DEFAULT_SETTINGS, ...PROFILES[name] })
