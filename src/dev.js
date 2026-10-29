/**
 * Mode développement (`?dev`, mémorisé ; `?dev=0` pour le quitter ; toujours actif avec `npm run dev`) :
 * panneau de réglages, volumétrie SHARP, ancien rendu de l'accueil, marqueurs « à compléter »
 * et projets en attente d'accord. Faux à la compilation : le HTML publié ne contient que le site public.
 */
export const DEV = (() => {
  if (typeof window === 'undefined') return false
  const q = new URLSearchParams(location.search).get('dev')
  try {
    if (q === '0') localStorage.removeItem('dev')
    else if (q !== null) localStorage.setItem('dev', '1')
    return Boolean(import.meta.env?.DEV) || localStorage.getItem('dev') === '1'
  } catch {
    return Boolean(import.meta.env?.DEV) || (q !== null && q !== '0')
  }
})()
