/**
 * Langue du site : français par défaut, anglais au choix (bouton FR / EN, mémorisé).
 * Un texte traduit s'écrit L('français', 'english') ; tr() renvoie la version de la langue active.
 */

const KEY = 'lang'
const read = () => {
  const q = new URLSearchParams(location.search).get('lang')
  if (q === 'fr' || q === 'en') return q
  try {
    const s = localStorage.getItem(KEY)
    if (s === 'fr' || s === 'en') return s
  } catch {}
  return navigator.language?.toLowerCase().startsWith('fr') ? 'fr' : 'en'
}

export let lang = read()
const listeners = []

export const L = (fr, en) => ({ fr, en })
export const tr = (v) => (v && typeof v === 'object' && 'fr' in v ? v[lang] : v)

export function setLang(next) {
  if (next === lang) return
  lang = next
  try {
    localStorage.setItem(KEY, next)
  } catch {}
  listeners.forEach((fn) => fn(lang))
}

export const onLang = (fn) => listeners.push(fn)

/** Libellés de l'interface. */
export const ui = {
  role: L('Designer numérique', 'Digital designer'),
  nav: L('Navigation principale', 'Main navigation'),
  work: L('Projets', 'Work'),
  about: L('À propos', 'About'),
  contact: L('Contact', 'Contact'),
  scroll: L('Défiler', 'Scroll'),
  skip: L('Aller au contenu', 'Skip to content'),
  copied: L('Adresse copiée', 'Address copied'),
  workTitle: L('Projets choisis', 'Selected work'),
  skills: L('Compétences', 'Skills'),
  langSwitch: L('Read in English', 'Lire en français'),
  next: L('Projet suivant', 'Next project'),
  keepScrolling: L('Continuez à défiler', 'Keep scrolling'),
  close: L('Fermer', 'Close'),
  playFilm: L('Lire le film', 'Play the film'),
  playVideo: L('Lire la vidéo', 'Play the video'),
  description: L(
    'Johann Arata, designer numérique. Des images réelles transformées en espaces 3D à explorer dans le navigateur.',
    'Johann Arata, digital designer. Real images turned into 3D spaces you can explore in the browser.',
  ),
}
