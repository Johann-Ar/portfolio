/**
 * Mots en « tuiles » : chaque lettre est posée sur un carreau grainé,
 * avec un léger décalage vertical (carreaux jointifs, sans rotation).
 */

const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

// pseudo-aléatoire stable (même rendu à chaque chargement)
let seed = 7
const rand = () => {
  seed = (seed * 16807) % 2147483647
  return (seed - 1) / 2147483646
}
const r = (min, max) => (min + rand() * (max - min)).toFixed(3)

/** Renvoie le HTML d'une suite de mots en tuiles. `words` : chaîne ou tableau de chaînes. */
export function tiles(words, { tag = 'span', className = '', label } = {}) {
  const list = Array.isArray(words) ? words : [words]
  const text = label ?? list.join(' ')
  const inner = list
    .map((word) => {
      const letters = [...word]
        .map((ch) => {
          if (ch === ' ') return '<span class="tile-space"></span>'
          const c = esc(ch)
          return `<span class="tile" style="--dy:${r(-0.035, 0.035)}"><span class="tile__g">${c}</span></span>`
        })
        .join('')
      return `<span class="tile-word">${letters}</span>`
    })
    .join('')
  return `<${tag} class="tiles ${className}" aria-label="${esc(text)}"><span aria-hidden="true" class="tiles__inner">${inner}</span></${tag}>`
}
