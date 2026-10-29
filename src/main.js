import '@fontsource-variable/bricolage-grotesque/opsz.css'
import '@fontsource/figtree/latin-400.css'
import '@fontsource/figtree/latin-600.css'
import '@fontsource/figtree/latin-700.css'
import '@fontsource/ibm-plex-mono/latin-400.css'
import './styles/main.css'

import Lenis from 'lenis'
import { site, skills, about, timeline, projects } from './content.js'
import { CaseView } from './case.js'
import { ProfileStore } from './webgl/settings.js'
import { lang, tr, ui, setLang, onLang } from './i18n.js'
import { appHtml, esc, bold, rows, rowHtml, metaText, timelineCol } from './render.js'

const BASE = import.meta.env.BASE_URL

/*
 * Mode développement (`?dev`, mémorisé ; `?dev=0` pour le quitter ; toujours actif avec `npm run dev`) :
 * panneau de réglages (P), touches Espace / B / V, volumétrie SHARP, élément en verre, ancien rendu de l'accueil.
 * En ligne, le visiteur ne charge que le site, avec les réglages par défaut.
 */
const DEV = (() => {
  const q = new URLSearchParams(location.search).get('dev')
  try {
    if (q === '0') localStorage.removeItem('dev')
    else if (q !== null) localStorage.setItem('dev', '1')
    return import.meta.env.DEV || localStorage.getItem('dev') === '1'
  } catch {
    return import.meta.env.DEV || (q !== null && q !== '0')
  }
})()

// au lancement, on arrive toujours sur l'accueil (pas de reprise de scroll ni d'ancre de section)
if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
if (location.hash && !location.hash.startsWith('#/')) history.replaceState(null, '', location.pathname + location.search)
window.scrollTo(0, 0)
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const isTouch = !window.matchMedia('(hover: hover)').matches
const isSmall = () => window.matchMedia('(max-width: 768px)').matches

const root = document.documentElement
const POINTS_COLOR = '#ffffff'
let cloud = null

/* ------------------------------------------------------------------
   Rendu
------------------------------------------------------------------- */

const app = document.getElementById('app')
app.innerHTML = appHtml() // même rendu que le HTML pré-généré à la compilation (src/render.js)

/* Découpe en mots pour l'apparition mot à mot */
function splitWords(el) {
  let i = 0
  const walk = (node) => {
    for (const child of [...node.childNodes]) {
      if (child.nodeType === 3) {
        const frag = document.createDocumentFragment()
        child.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return
          if (/^\s+$/.test(part)) return frag.append(part)
          const s = document.createElement('span')
          s.className = 'w'
          s.style.setProperty('--i', Math.min(i++, 40))
          s.textContent = part
          frag.append(s)
        })
        child.replaceWith(frag)
      } else if (child.nodeType === 1) walk(child)
    }
  }
  walk(el)
}
document.querySelectorAll('[data-words]').forEach(splitWords)

/* ------------------------------------------------------------------
   Langue (FR / EN) : les textes changent sur place, sans recharger le WebGL
------------------------------------------------------------------- */

const langBtn = document.querySelector('.lang-switch')
const metaDesc = document.querySelector('meta[name="description"]')
function applyLang() {
  root.lang = lang
  document.querySelectorAll('[data-t]').forEach((el) => (el.innerHTML = tr(ui[el.dataset.t])))
  document.querySelectorAll('[data-t-label]').forEach((el) => el.setAttribute('aria-label', tr(ui[el.dataset.tLabel])))
  document.querySelector('.skills').setAttribute('aria-label', tr(ui.skills))
  const intro = document.querySelector('.hero__intro')
  intro.textContent = tr(site.intro)
  splitWords(intro)
  document.querySelectorAll('.about__text p').forEach((el, i) => {
    el.innerHTML = bold(tr(about[i]))
    splitWords(el)
  })
  document.querySelectorAll('.work-link').forEach((l) => {
    const p = projects.find((x) => x.slug === l.dataset.slug)
    l.querySelector('.work-link__meta').textContent = metaText(p)
  })
  document.querySelectorAll('.skills__row').forEach((el, i) => (el.innerHTML = rowHtml(rows[i])))
  document.querySelectorAll('.timeline > div').forEach((el, i) => (el.innerHTML = timelineCol(timeline[i])))
  metaDesc?.setAttribute('content', tr(ui.description))
  baseTitle = `${site.name} — ${tr(ui.role)}`
  if (!caseView?.isOpen) document.title = baseTitle
  caseView?.relang()
  langBtn.querySelectorAll('[data-lang]').forEach((b) => b.classList.toggle('is-active', b.dataset.lang === lang))
  langBtn.setAttribute('aria-label', tr(ui.langSwitch))
  langBtn.setAttribute('lang', lang === 'fr' ? 'en' : 'fr')
}
langBtn.addEventListener('click', () => setLang(lang === 'fr' ? 'en' : 'fr'))
onLang(applyLang)

const revealObserver = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        e.target.classList.add('is-in')
        revealObserver.unobserve(e.target)
      }
    }
  },
  { rootMargin: '0px 0px -10% 0px' },
)

/* ------------------------------------------------------------------
   Scroll
------------------------------------------------------------------- */

const lenis = reducedMotion ? null : new Lenis({ autoRaf: true, lerp: 0.09 })
const scrollToTarget = (target) => {
  if (lenis) lenis.scrollTo(target, { duration: 1.4 })
  else if (typeof target === 'number') window.scrollTo(0, target)
  else target.scrollIntoView()
}

document.querySelectorAll('a[href^="#"]:not([href^="#/"])').forEach((a) => {
  a.addEventListener('click', (e) => {
    const id = a.getAttribute('href').slice(1)
    const target = id === 'top' ? 0 : document.getElementById(id)
    if (target === null) return
    e.preventDefault()
    if (location.hash.startsWith('#/')) closeRoute()
    scrollToTarget(target)
  })
})

/* ------------------------------------------------------------------
   Nuage de points WebGL
------------------------------------------------------------------- */

const canvas = document.getElementById('scene')

function hasWebGL() {
  try {
    const c = document.createElement('canvas')
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')))
  } catch {
    return false
  }
}

async function initCloud() {
  await panelReady // les réglages (panneau en mode développement) avant la première image
  if (!hasWebGL()) {
    root.classList.add('no-webgl')
    return
  }
  const [{ PointCloud }, { imageTarget, sampledTarget }] = await Promise.all([
    import('./webgl/PointCloud.js'),
    import('./webgl/targets.js'),
  ])
  // chaque image lit les réglages de son profil (panneau P) ; l'habillage de la page suit l'image qui apparaît
  cloud = new PointCloud(canvas, { color: POINTS_COLOR, reducedMotion, getSettings: (profile) => panel.get(profile) })
  cloud.onStage = (profile) => {
    panel.setPage(profile || 'other')
    root.classList.toggle('show-veil', !!profile)
  }
  cloud.onContextLost = () => root.classList.add('no-webgl')
  // accueil : la photo remplit l'écran et déborde du cadre
  const portrait = `${BASE}media/site/portrait.webp`
  // accueil et contact : images reculées, bord à bord, profondeur inversée (clair = loin, foncé = proche)
  const far = { fit: 'cover', distance: 34, depth: 14, invertDepth: true }
  // logo en volume possible via l'option overlay d'imageTarget (voir scripts/logo-volume.py)
  cloud.register('hero', imageTarget(portrait, { ...far, focusX: 0.6 }))
  // mode développement, touche B : ancienne version (points répartis selon la lumière), toujours plein écran
  cloud.register('hero-old', sampledTarget(portrait, { distance: 34, depth: 14, invertDepth: true, focusX: 0.6 }))
  // contact : Thomas Gainsborough, « View near King's Bromley-on-Trent » (domaine public)
  cloud.register('contact', imageTarget(`${BASE}media/site/view-near.webp`, far))
  // projets : les couvertures du portfolio (imprimées sur fond blanc)
  for (const p of projects) cloud.register(p.slug, imageTarget(`${BASE}media/${p.cloud}`, { paper: true, size: 0.5, depth: 6 }))
  await cloud.preload('hero')
}

const sections = [...document.querySelectorAll('[data-cloud]')]
const list = document.querySelector('.work__list')
const links = [...document.querySelectorAll('.work-link')]
const workSection = document.getElementById('projets')
// projet affiché dans le nuage : reste sélectionné quand on quitte la liste pour manipuler le nuage
let selected = projects[0].slug
let inWork = false
let heroOld = false // touche B
let stageReady = false // la scène démarre quand le chargement se termine

/* Panneau de réglage des splats (touche P) */
function setColorMode(mode) {
  panel.setMode(mode) // l'image du profil courant passe en douceur au nouveau mode
}
/* Volumétrie : nuage de points (par défaut) ou vrais Gaussian splats SHARP (Spark + SPZ) */
let volume = 'points'
let sharp = null
let sharpLoading = null
async function setVolume(v) {
  volume = v
  panel.sync()
  if (v === 'sharp' && !sharp && cloud) {
    sharpLoading ??= (async () => {
      panel.status('Chargement de Spark…')
      const [{ SharpLayer }, index] = await Promise.all([
        import('./webgl/SharpLayer.js'),
        fetch(`${BASE}splats/index.json`).then((r) => r.json()),
      ])
      const layout = { hero: { fit: 'cover', distance: 34 }, contact: { fit: 'cover', distance: 34 } }
      for (const p of projects) layout[p.slug] = { fit: 'contain', distance: 0, size: 0.5 }
      sharp = new SharpLayer(cloud, index, `${BASE}splats/`, layout)
      sharp.onStatus = (t) => panel.status(t)
      cloud.onResized = () => sharp.relayout()
      panel.status('')
    })().catch((err) => {
      console.warn('Volumétrie SHARP indisponible', err)
      panel.status('Volumétrie SHARP indisponible sur cet appareil.')
      volume = 'points'
      panel.sync()
    })
    await sharpLoading
  }
  sharp?.setEnabled(volume === 'sharp')
  updateCloud()
}

function setHeroOld(v) {
  heroOld = v
  updateCloud()
  panel.sync()
}
// réglages par profil (valeurs par défaut) ; le panneau P (éditable, mémorisé) prend le relais quand il est chargé :
// touche P à tout moment, d'emblée en mode développement ou si des réglages ont été enregistrés dans ce navigateur
let panel = new ProfileStore()
let panelReady = Promise.resolve()
let panelLoaded = false
function loadPanel() {
  if (panelLoaded) return panelReady
  panelLoaded = true
  panelReady = import('./panel.js').then(({ SplatPanel }) => {
    const prev = panel
    panel = new SplatPanel({ onMode: setColorMode, getHeroOld: () => heroOld, setHeroOld, getVolume: () => volume, setVolume })
    panel.setProfile(prev.profile)
    panel.setPage(prev.pageProfile)
  })
  return panelReady
}
const hasSavedSettings = (() => {
  try {
    return Object.keys(localStorage).some((k) => k.startsWith('splat-settings'))
  } catch {
    return false
  }
})()
if (DEV || hasSavedSettings) loadPanel()

function updateCloud() {
  const vh = window.innerHeight
  const heroProgress = Math.min(window.scrollY / vh, 1)
  // une section prend la main dès qu'elle couvre le bas de l'écran (l'image précédente part avant l'arrivée du titre)
  const mid = vh * 0.7
  let section = sections[0]
  for (const s of sections) {
    if (s.getBoundingClientRect().top <= mid) section = s
  }
  const nowInWork = section === workSection
  if (nowInWork !== inWork) {
    inWork = nowInWork
    links.forEach((l) => l.classList.toggle('is-active', inWork && l.dataset.slug === selected))
    list.classList.toggle('has-selection', inWork)
  }
  // le panneau modifie les réglages de la section affichée
  const profile = { top: 'hero', projets: 'project', contact: 'contact' }[section.id] || 'other'
  panel.setProfile(profile)
  if (!cloud || !stageReady) return

  let key = inWork ? selected : section.dataset.cloud
  if (key === 'none') {
    // section sans image (compétences, à propos) : l'image disparaît, la scène reste vide
    cloud.hide()
    sharp?.show(null)
    return
  }
  sharp?.show(key)
  if (key === 'hero' && heroOld) key = 'hero-old'
  // mobile : le projet passe au-dessus de la liste, plus discret pour garder le texte lisible
  const smallWork = inWork && isSmall()
  cloud.show(key, {
    profile,
    opacity: smallWork ? 0.55 : Number(section.dataset.cloudOpacity ?? 1),
    offset: [inWork && !isSmall() ? 0.17 : 0, smallWork ? 0.2 : 0],
  })
  cloud.setScroll(section.id === 'top' ? heroProgress * 0.4 : 0)
}

/* Contact : un clic sur l'adresse la copie aussi (utile sans logiciel de messagerie) */
const mailLink = document.querySelector('.contact__mail')
const copiedNote = document.querySelector('.contact__copied')
let copiedTimer
mailLink.addEventListener('click', () => {
  navigator.clipboard
    ?.writeText(site.email)
    .then(() => {
      copiedNote.textContent = tr(ui.copied)
      copiedNote.classList.add('is-on')
      clearTimeout(copiedTimer)
      copiedTimer = setTimeout(() => copiedNote.classList.remove('is-on'), 2000)
    })
    .catch(() => {})
})

/* Le texte d'accueil fond quand le titre « Projets choisis » apparaît */
const workTitle = document.getElementById('work-title')
function updateIntro() {
  const vh = window.innerHeight
  const top = workTitle.getBoundingClientRect().top
  // 0 quand le titre entre par le bas de l'écran, 1 quand il a remonté d'un huitième d'écran (fondu court)
  const f = Math.min(Math.max((vh - top) / (vh * 0.125), 0), 1)
  root.style.setProperty('--intro-fade', f.toFixed(3))
}

/* Compétences : les lignes défilent en continu (sens opposés), plus vite quand on fait défiler la page */
const skillRows = [...document.querySelectorAll('.skills__row')]
const skillsSection = document.querySelector('.skills')
const skills$ = { visible: false, widths: null, offset: 0, boost: 0, lastY: 0, lastT: 0 }
const measureSkills = () => (skills$.widths = skillRows.map((row) => row.firstElementChild.offsetWidth))
function tickSkills(t) {
  if (!skills$.visible) return
  const dt = skills$.lastT ? Math.min((t - skills$.lastT) / 1000, 0.05) : 0
  skills$.lastT = t
  const dy = Math.abs(window.scrollY - skills$.lastY)
  skills$.lastY = window.scrollY
  // élan donné par le défilement, qui retombe doucement
  skills$.boost += (Math.min(dy, 120) * 9 - skills$.boost) * (1 - Math.pow(0.02, dt))
  skills$.offset += (45 + skills$.boost) * dt
  if (!skills$.widths) measureSkills()
  skillRows.forEach((row, i) => {
    const w = skills$.widths[i] || 1
    const x = skills$.offset % w
    row.style.transform = `translate3d(${row.dataset.dir > 0 ? -x : x - w}px,0,0)`
  })
  requestAnimationFrame(tickSkills)
}
if (!reducedMotion) {
  new IntersectionObserver(([e]) => {
    skills$.visible = e.isIntersecting
    skills$.lastT = 0
    skills$.lastY = window.scrollY
    if (skills$.visible) requestAnimationFrame(tickSkills)
  }).observe(skillsSection)
  window.addEventListener('resize', () => (skills$.widths = null))
  onLang(() => (skills$.widths = null))
}

/* Survol des projets */
function select(slug) {
  if (selected === slug) return
  selected = slug
  links.forEach((l) => l.classList.toggle('is-active', inWork && l.dataset.slug === slug))
  updateCloud()
}

// survol / focus : le projet pointé s'affiche
links.forEach((l) => {
  if (!isTouch) l.addEventListener('pointerenter', () => select(l.dataset.slug))
  l.addEventListener('focus', () => select(l.dataset.slug))
})

// tactile : le projet au centre de l'écran s'affiche
if (isTouch) {
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) if (e.isIntersecting) select(e.target.dataset.slug)
    },
    { rootMargin: '-45% 0px -45% 0px' },
  )
  links.forEach((l) => io.observe(l))
}

/* Le nuage du projet se manipule : glisser pour le faire tourner (rotation limitée, sans changer de projet) */
const stage = document.querySelector('.work__stage')
let dragFrom = null
stage.addEventListener('pointerdown', (e) => {
  dragFrom = { x: e.clientX, y: e.clientY }
  stage.setPointerCapture(e.pointerId)
  stage.classList.add('is-dragging')
})
stage.addEventListener('pointermove', (e) => {
  if (!dragFrom || !cloud) return
  cloud.drag(e.clientX - dragFrom.x, e.clientY - dragFrom.y)
  dragFrom = { x: e.clientX, y: e.clientY }
})
const endDrag = () => {
  dragFrom = null
  cloud?.release()
  stage.classList.remove('is-dragging')
}
stage.addEventListener('pointerup', endDrag)
stage.addEventListener('pointercancel', endDrag)

/* Espace : monochrome / couleurs de l'image. B : ancienne version du splat de l'accueil */
window.addEventListener('keydown', (e) => {
  if (e.repeat || !cloud || caseView.isOpen || e.metaKey || e.ctrlKey || e.altKey) return
  const inPanel = e.target.closest?.('.splat-panel')
  if ((e.key === 'p' || e.key === 'P') && (inPanel || !e.target.closest?.('input, textarea, select, [contenteditable]'))) {
    loadPanel().then(() => panel.toggle()) // le panneau se charge à la première demande
    return
  }
  if (!panelLoaded) return // les autres touches de réglage ne servent qu'avec le panneau
  if (e.target.closest?.('input, textarea, select, button, a, [contenteditable]')) return
  if (e.code === 'Space') {
    e.preventDefault()
    setColorMode(panel.settings.mode + 1) // monochrome -> couleurs -> bleu
  } else if (e.key === 'v' || e.key === 'V') {
    setVolume(volume === 'sharp' ? 'points' : 'sharp')
  } else if (e.key === 'b' || e.key === 'B') {
    setHeroOld(!heroOld)
  }
})

let ticking = false
window.addEventListener(
  'scroll',
  () => {
    if (ticking) return
    ticking = true
    requestAnimationFrame(() => {
      ticking = false
      updateCloud()
      updateIntro()
    })
  },
  { passive: true },
)

/* ------------------------------------------------------------------
   Pages projet (routage par hash : #/slug)
------------------------------------------------------------------- */

const caseView = new CaseView(document.getElementById('case'), { onClose: () => closeRoute() })
let baseTitle = document.title
applyLang() // langue mémorisée ou celle du navigateur
const background = [app, document.querySelector('.topbar')]
let lastLink = null

function closeRoute() {
  history.pushState('', document.title, location.pathname + location.search)
  route()
}

function openProject(project) {
  lastLink = document.querySelector(`.work-link[data-slug="${project.slug}"]`)
  caseView.open(project)
  document.title = `${project.title} — ${site.name}`
  background.forEach((el) => (el.inert = true))
  root.classList.add('case-open')
  lenis?.stop()
  clearTimeout(pauseTimer)
  pauseTimer = setTimeout(() => caseView.isOpen && cloud?.pause(), 1000)
}
let pauseTimer

function closeProject() {
  if (!caseView.isOpen) return
  caseView.close()
  document.title = baseTitle
  background.forEach((el) => (el.inert = false))
  root.classList.remove('case-open')
  lenis?.start()
  cloud?.resume()
  lastLink?.focus({ preventScroll: true })
}

function route() {
  const slug = location.hash.startsWith('#/') ? decodeURIComponent(location.hash.slice(2)) : null
  const project = projects.find((p) => p.slug === slug)
  if (project) openProject(project)
  else closeProject()
}
window.addEventListener('hashchange', route)

/* ------------------------------------------------------------------
   Chargement
------------------------------------------------------------------- */

const loader = document.getElementById('loader')
const count = document.getElementById('loader-count')
const bar = document.getElementById('loader-bar')
let shown = 0
let goal = 0.15
const minTime = new Promise((r) => setTimeout(r, reducedMotion ? 0 : 900))

function animateLoader() {
  shown += (goal - shown) * 0.12
  if (goal >= 1 && 1 - shown < 0.005) shown = 1
  count.textContent = String(Math.round(shown * 100)).padStart(3, '0')
  bar.style.transform = `scaleX(${shown})`
  if (shown < 1) requestAnimationFrame(animateLoader)
}
requestAnimationFrame(animateLoader)
document.fonts.ready.then(() => {
  goal = Math.max(goal, 0.6)
  // typo identitaire Bagherich (si installée ou fournie) : réglages typographiques adaptés
  document.fonts
    .load('48px Bagherich')
    .then((faces) => faces.some((f) => f.family.replace(/["']/g, '') === 'Bagherich') && root.classList.add('has-bagherich'))
    .catch(() => {})
})

// le chargement ne dure jamais plus de ~2 s : si la 3D est plus lente, la page s'ouvre et l'image arrive ensuite
const cloudReady = initCloud()
  .catch((err) => {
    console.warn('WebGL indisponible', err)
    root.classList.add('no-webgl')
  })
  .then(() => stageReady && updateCloud())
Promise.race([
  Promise.all([document.fonts.ready, cloudReady, minTime]),
  new Promise((r) => setTimeout(r, 2000)),
]).then(() => {
  goal = 1
  setTimeout(
    () => {
      loader.classList.add('is-hidden')
      root.classList.add('is-ready')
      document.querySelectorAll('.words, .reveal').forEach((el) => revealObserver.observe(el))
      stageReady = true
      // les points dispersés se rassemblent pour former l'image d'accueil
      updateCloud()
      updateIntro()
      route()
      const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 1200))
      // les autres images se préparent une par une, aux moments creux (jamais toutes d'un coup pendant une transition)
      const queue = [...projects.map((p) => p.slug), 'contact']
      const next = () => queue.length && cloud?.preload(queue.shift()).then(() => idle(next))
      idle(next)
    },
    reducedMotion ? 0 : 450,
  )
})
