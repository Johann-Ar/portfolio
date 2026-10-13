import '@fontsource-variable/bricolage-grotesque/opsz.css'
import '@fontsource/figtree/latin-400.css'
import '@fontsource/figtree/latin-600.css'
import '@fontsource/figtree/latin-700.css'
import '@fontsource/ibm-plex-mono/latin-400.css'
import './styles/main.css'

import Lenis from 'lenis'
import { site, skills, about, timeline, projects } from './content.js'
import { CaseView } from './case.js'
import { SplatPanel } from './panel.js'
import { lang, tr, ui, setLang, onLang } from './i18n.js'

const BASE = import.meta.env.BASE_URL

// au lancement, on arrive toujours sur l'accueil (pas de reprise de scroll ni d'ancre de section)
if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
if (location.hash && !location.hash.startsWith('#/')) history.replaceState(null, '', location.pathname + location.search)
window.scrollTo(0, 0)
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const isTouch = !window.matchMedia('(hover: hover)').matches
const isSmall = () => window.matchMedia('(max-width: 768px)').matches
const esc = (str = '') =>
  str.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
const bold = (str) => esc(str).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')

const root = document.documentElement
const POINTS_COLOR = '#ffffff'
let cloud = null
let logo = null

/* ------------------------------------------------------------------
   Rendu
------------------------------------------------------------------- */

// les compétences, réparties en lignes qui glissent en sens opposés au scroll
const rows = [[], [], []]
skills.forEach((s, i) => rows[i % rows.length].push(s))
const rowText = (row, i) => row.map((w, j) => (j < row.length - 1 || i < rows.length - 1 ? `${tr(w)},` : tr(w))).join(' ')
const tagText = (p) => `// ${tr(p.tag)}`
const timelineCol = (col) => `
          <h3>${esc(tr(col.title))}</h3>
          <ul>
            ${col.items
              .map(
                (it) => `<li>
                  <span class="timeline__year">${esc(tr(it.year))}</span>
                  <span><b>${esc(tr(it.name))}</b>${tr(it.detail) ? `<br />${esc(tr(it.detail))}` : ''}</span>
                </li>`,
              )
              .join('')}
          </ul>`

const app = document.getElementById('app')
app.innerHTML = `
  <section class="hero" id="top" data-cloud="hero">
    <h1 class="u-visually-hidden">${esc(site.name)}, <span data-t="role">${esc(tr(ui.role))}</span></h1>
    <p class="hero__intro words" data-words>${esc(tr(site.intro))}</p>
    <span class="hero__scroll" aria-hidden="true" data-t="scroll">${esc(tr(ui.scroll))}</span>
  </section>

  <section class="work" id="projets" data-cloud="project" aria-labelledby="work-title">
    <div class="work__stage" aria-hidden="true"></div>
    <div class="work__inner">
      <h2 class="section-title reveal" id="work-title" data-t="workTitle">${esc(tr(ui.workTitle))}</h2>
      <ul class="work__list">
        ${projects
          .map(
            (p, i) => `
          <li class="reveal" style="--i:${i}">
            <a class="work-link" href="#/${p.slug}" data-slug="${p.slug}">
              <b>${esc(p.title)}</b><span>${esc(tagText(p))}</span>
            </a>
          </li>`,
          )
          .join('')}
      </ul>
    </div>
  </section>

  <section class="skills" aria-label="${esc(tr(ui.skills))}" data-cloud="none">
    ${rows.map((row, i) => `<p class="skills__row" data-dir="${i % 2 ? -1 : 1}">${esc(rowText(row, i))}</p>`).join('')}
  </section>

  <section class="about" id="a-propos" data-cloud="none" aria-labelledby="about-title">
    <h2 class="section-title section-title--center reveal" id="about-title" data-t="about">${esc(tr(ui.about))}</h2>
    <div class="about__text">
      ${about.map((p) => `<p class="words" data-words>${bold(tr(p))}</p>`).join('')}
    </div>
    <div class="timeline">
      ${timeline
        .map(
          (col, i) => `
        <div class="reveal" style="--i:${i}">${timelineCol(col)}
        </div>`,
        )
        .join('')}
    </div>
  </section>

  <section class="contact" id="contact" data-cloud="contact" data-cloud-opacity="0.6" aria-labelledby="contact-title">
    <h2 class="section-title section-title--center reveal" id="contact-title">Contact</h2>
    <a class="contact__mail reveal" href="mailto:${esc(site.email)}"><span>${esc(site.email)}</span></a>
    <a class="contact__phone reveal" href="tel:${esc(site.phone.replace(/\s/g, ''))}"><span>${esc(site.phone)}</span></a>
    <ul class="socials reveal">
      ${site.socials
        .map(
          (s) =>
            `<li><a href="${esc(s.href)}" ${s.href.startsWith('http') ? 'target="_blank" rel="noopener"' : ''}>${esc(s.label)}</a></li>`,
        )
        .join('')}
    </ul>
  </section>

  <footer class="footer">
    <span>© ${new Date().getFullYear()} ${esc(site.name)}</span>
    <span><span data-t="role">${esc(tr(ui.role))}</span> — ${esc(site.location)}</span>
  </footer>
`

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
    l.querySelector('span').textContent = tagText(p)
  })
  document.querySelectorAll('.skills__row').forEach((el, i) => (el.textContent = rowText(rows[i], i)))
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
  if (!hasWebGL()) {
    root.classList.add('no-webgl')
    return
  }
  const [{ PointCloud }, { imageTarget, sampledTarget }] = await Promise.all([
    import('./webgl/PointCloud.js'),
    import('./webgl/targets.js'),
  ])
  cloud = new PointCloud(canvas, { color: POINTS_COLOR, reducedMotion })
  cloud.onContextLost = () => root.classList.add('no-webgl')
  // élément 3D en verre au centre de l'accueil (technique de la référence, forme de Johann)
  import('./webgl/GlassElement.js')
    .then(({ GlassElement }) => {
      logo = new GlassElement(cloud)
      panel.attach()
      updateCloud()
    })
    .catch((err) => console.warn('Élément 3D indisponible', err))
  // accueil : la photo remplit l'écran et déborde du cadre
  const portrait = `${BASE}media/site/portrait.webp`
  // accueil et contact : images reculées, bord à bord, profondeur inversée (clair = loin, foncé = proche)
  const far = { fit: 'cover', distance: 34, depth: 14, invertDepth: true }
  // logo en volume possible via l'option overlay d'imageTarget (voir scripts/logo-volume.py)
  cloud.register('hero', imageTarget(portrait, { ...far, focusX: 0.6 }))
  // touche B : ancienne version (points répartis selon la lumière), toujours plein écran
  cloud.register('hero-old', sampledTarget(portrait, { distance: 34, depth: 14, invertDepth: true, focusX: 0.6 }))
  // contact : Thomas Gainsborough, « View near King's Bromley-on-Trent » (domaine public)
  cloud.register('contact', imageTarget(`${BASE}media/site/view-near.webp`, far))
  panel.attach()
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

/* Panneau de réglage des splats (touche P) */
function setColorMode(mode) {
  if (!cloud) return
  const m = cloud.setColorMode(mode)
  root.dataset.cloudMode = ['mono', 'color', 'blue'][m]
  panel.rememberMode(m)
  panel.sync()
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
/* calque couleurs en mode « points » : appliqué dans le shader (accueil et contact) */
function updateVeilTint() {
  const s = panel.settings
  const on = root.classList.contains('show-veil') && !root.classList.contains('case-open') && s.veilMode === 'points'
  cloud?.set('veilTint', on ? s.veil : 0)
}
const panel = new SplatPanel({
  getCloud: () => cloud,
  onMode: setColorMode,
  getHeroOld: () => heroOld,
  setHeroOld,
  getVolume: () => volume,
  setVolume,
})
panel.onVeil = () => updateVeilTint()

function updateCloud() {
  const vh = window.innerHeight
  const heroProgress = Math.min(window.scrollY / vh, 1)
  const mid = vh * 0.5
  let section = sections[0]
  for (const s of sections) {
    if (s.getBoundingClientRect().top <= mid) section = s
  }
  // calque aux couleurs du fond : sur toutes les sections qui affichent une image (accueil, projets, contact)
  root.classList.toggle('show-veil', section.dataset.cloud !== 'none')
  updateVeilTint()
  logo?.setProgress(Math.min(heroProgress * 1.8, 1)) // le logo sort avant que le texte ne le croise
  const nowInWork = section === workSection
  if (nowInWork !== inWork) {
    inWork = nowInWork
    links.forEach((l) => l.classList.toggle('is-active', inWork && l.dataset.slug === selected))
    list.classList.toggle('has-selection', inWork)
  }
  if (!cloud) return
  // réglages selon le type d'image affichée
  const profile = { top: 'hero', projets: 'project', contact: 'contact' }[section.id] || 'other'
  panel.setProfile(profile)
  let key = inWork ? selected : section.dataset.cloud
  // sections sans image (compétences, à propos) : le nuage s'efface, la dernière image reste en mémoire
  const empty = key === 'none'
  if (!empty) {
    sharp?.show(key)
    if (key === 'hero' && heroOld) key = 'hero-old'
    cloud.show(key)
  }
  cloud.setScroll(section.id === 'top' ? heroProgress * 0.4 : 0)
  // mobile : le nuage du projet passe au-dessus de la liste, plus discret pour garder le texte lisible
  const smallWork = inWork && isSmall()
  cloud.setOpacity(empty ? 0 : smallWork ? 0.55 : Number(section.dataset.cloudOpacity ?? 1))
  cloud.setOffset(inWork && !isSmall() ? 0.17 : 0, smallWork ? 0.2 : 0)
}

/* Compétences : les lignes glissent en sens opposés */
const skillRows = [...document.querySelectorAll('.skills__row')]
const skillsSection = document.querySelector('.skills')
function updateSkills() {
  if (reducedMotion) return
  const r = skillsSection.getBoundingClientRect()
  const p = (window.innerHeight - r.top) / (window.innerHeight + r.height) - 0.5
  if (p < -0.6 || p > 0.6) return
  skillRows.forEach((row) => {
    row.style.transform = `translate3d(${(row.dataset.dir * p * 24).toFixed(2)}vw,0,0)`
  })
}

/* Survol des projets */
function select(slug) {
  if (selected === slug) return
  selected = slug
  links.forEach((l) => l.classList.toggle('is-active', inWork && l.dataset.slug === slug))
  updateCloud()
}

if (!isTouch) {
  links.forEach((l) => {
    l.addEventListener('pointerenter', () => select(l.dataset.slug))
    l.addEventListener('focus', () => select(l.dataset.slug))
  })
} else {
  // tactile : le projet au centre de l'écran pilote le nuage
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
    panel.toggle()
    return
  }
  if (e.target.closest?.('input, textarea, select, button, a, [contenteditable]')) return
  if (e.code === 'Space') {
    e.preventDefault()
    setColorMode(cloud.colorMode + 1) // monochrome -> couleurs -> bleu
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
      updateSkills()
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
document.fonts.ready.then(() => (goal = Math.max(goal, 0.6)))

Promise.all([
  document.fonts.ready,
  initCloud().catch((err) => {
    console.warn('WebGL indisponible', err)
    root.classList.add('no-webgl')
  }),
  minTime,
]).then(() => {
  goal = 1
  setTimeout(
    () => {
      loader.classList.add('is-hidden')
      root.classList.add('is-ready')
      document.querySelectorAll('.words, .reveal').forEach((el) => revealObserver.observe(el))
      // les points dispersés se rassemblent pour former l'image d'accueil
      updateCloud()
      updateSkills()
      route()
      const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 1200))
      idle(() => projects.forEach((p) => cloud?.preload(p.slug)))
    },
    reducedMotion ? 0 : 450,
  )
})
