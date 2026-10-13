import '@fontsource/manufacturing-consent/latin-400.css'
import '@fontsource/figtree/latin-400.css'
import '@fontsource/figtree/latin-600.css'
import '@fontsource/figtree/latin-700.css'
import '@fontsource/ibm-plex-mono/latin-400.css'
import './styles/main.css'

import Lenis from 'lenis'
import { site, skills, about, timeline, projects } from './content.js'
import { CaseView } from './case.js'
import { tiles, TileMotion } from './tiles.js'

const BASE = import.meta.env.BASE_URL
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const isTouch = !window.matchMedia('(hover: hover)').matches
const isSmall = () => window.matchMedia('(max-width: 768px)').matches
const esc = (str = '') =>
  str.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
const bold = (str) => esc(str).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')

/* ------------------------------------------------------------------
   Thème (sombre par défaut)
------------------------------------------------------------------- */

const root = document.documentElement
const themeToggle = document.getElementById('theme-toggle')
const themeColors = { dark: { bg: '#050407', points: '#ffffff' }, light: { bg: '#ffffff', points: '#3b21ff' } }
let cloud = null

function applyTheme(theme, save = false) {
  root.dataset.theme = theme
  if (save) {
    try {
      localStorage.setItem('theme', theme)
    } catch {}
  }
  document.querySelector('meta[name="theme-color"]').content = themeColors[theme].bg
  themeToggle.querySelector('.theme-toggle__label').textContent = theme === 'dark' ? 'Clair' : 'Sombre'
  themeToggle.setAttribute('aria-label', theme === 'dark' ? 'Passer en thème clair' : 'Passer en thème sombre')
  cloud?.setColor(themeColors[theme].points)
}
applyTheme(root.dataset.theme === 'light' ? 'light' : 'dark')
themeToggle.addEventListener('click', () => applyTheme(root.dataset.theme === 'dark' ? 'light' : 'dark', true))

/* ------------------------------------------------------------------
   Rendu
------------------------------------------------------------------- */

const [first, ...rest] = site.name.split(' ')
document.getElementById('title-layer').innerHTML = tiles([first, rest.join(' ')], {
  tag: 'div',
  className: 'name-tiles',
  label: site.name,
})

// les compétences, réparties en lignes qui glissent en sens opposés au scroll
const rows = [[], [], []]
skills.forEach((s, i) => rows[i % rows.length].push(s))

const app = document.getElementById('app')
app.innerHTML = `
  <section class="hero" id="top" data-cloud="cover">
    <h1 class="u-visually-hidden">${esc(site.name)}, ${esc(site.role.toLowerCase())}</h1>
    <p class="hero__intro words" data-words>${esc(site.intro)}</p>
    <span class="hero__scroll" aria-hidden="true">Défiler</span>
  </section>

  <section class="work" id="projets" data-cloud="cover" data-cloud-opacity="0.9" aria-labelledby="work-title">
    <div class="work__inner">
      <h2 id="work-title">${tiles(['Projets', 'choisis'], { className: 'section-tiles reveal' })}</h2>
      <ul class="work__list">
        ${projects
          .map(
            (p, i) => `
          <li class="reveal" style="--i:${i}">
            <a class="work-link" href="#/${p.slug}" data-slug="${p.slug}">
              <b>${esc(p.title)}</b><span>// ${esc(p.tag)}</span>
            </a>
          </li>`,
          )
          .join('')}
      </ul>
    </div>
  </section>

  <section class="skills" aria-label="Compétences" data-cloud="terrain" data-cloud-opacity="0.75">
    ${rows
      .map(
        (row, i) =>
          `<div class="skills__row" data-dir="${i % 2 ? -1 : 1}">${tiles(
            row.map((w, j) => (j < row.length - 1 || i < rows.length - 1 ? `${w},` : w)),
            { className: 'skills__tiles' },
          )}</div>`,
      )
      .join('')}
  </section>

  <section class="about" id="a-propos" data-cloud="terrain" data-cloud-opacity="0.25" aria-labelledby="about-title">
    <h2 id="about-title">${tiles('À propos', { className: 'section-tiles section-tiles--center reveal' })}</h2>
    <div class="about__text">
      ${about.map((p) => `<p class="words" data-words>${bold(p)}</p>`).join('')}
    </div>
    <div class="timeline">
      ${timeline
        .map(
          (col, i) => `
        <div class="reveal" style="--i:${i}">
          <h3>${esc(col.title)}</h3>
          <ul>
            ${col.items
              .map(
                (it) => `<li>
                  <span class="timeline__year">${esc(it.year)}</span>
                  <span><b>${esc(it.name)}</b>${it.detail ? `<br />${esc(it.detail)}` : ''}</span>
                </li>`,
              )
              .join('')}
          </ul>
        </div>`,
        )
        .join('')}
    </div>
  </section>

  <section class="contact" id="contact" data-cloud="cover" data-cloud-opacity="0.8" aria-labelledby="contact-title">
    <h2 id="contact-title">${tiles('Contact', { className: 'section-tiles section-tiles--center reveal' })}</h2>
    <p class="contact__text reveal">Un stage, un projet, une question : écrivez-moi.</p>
    <a class="contact__mail reveal" href="mailto:${esc(site.email)}"><span>${esc(site.email)}</span></a>
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
    <span>${esc(site.role)} — ${esc(site.location)}</span>
  </footer>
`

/* Découpe en mots pour l'apparition mot à mot */
document.querySelectorAll('[data-words]').forEach((el) => {
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
})

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

const tileMotion = new TileMotion({ hero: document.getElementById('title-layer'), reducedMotion })

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
  const [{ PointCloud }, { imageTarget }] = await Promise.all([
    import('./webgl/PointCloud.js'),
    import('./webgl/targets.js'),
  ])
  cloud = new PointCloud(canvas, { color: themeColors[root.dataset.theme].points, reducedMotion })
  cloud.onContextLost = () => root.classList.add('no-webgl')
  const cover = { invert: true, gamma: 1.2, depth: 5 }
  cloud.register('cover', imageTarget(`${BASE}media/site/squid-cloud.webp`, { ...cover, size: 0.46, mobileSize: 0.95 }))
  cloud.register('terrain', imageTarget(`${BASE}media/site/terrain-cloud.webp`, { ...cover, size: 0.8 }))
  for (const p of projects) cloud.register(p.slug, imageTarget(`${BASE}media/${p.cloud}`, { size: 0.42, mobileSize: 0.85, gamma: 2.2, depth: 9 }))
  await cloud.show('cover', { instant: true })
}

const sections = [...document.querySelectorAll('[data-cloud]')]
const workSection = document.getElementById('projets')
let hovered = null

function updateCloud() {
  const vh = window.innerHeight
  const heroProgress = Math.min(window.scrollY / vh, 1)
  root.style.setProperty('--hp', heroProgress.toFixed(3))
  const mid = vh * 0.5
  let section = sections[0]
  for (const s of sections) {
    const r = s.getBoundingClientRect()
    if (r.top <= mid) section = s
  }
  // le nom s'efface derrière les textes longs (à propos, contact)
  root.classList.toggle('title-dim', section.id === 'a-propos' || section.id === 'contact')
  if (!cloud) return
  if (hovered && section !== workSection) setHover(null)
  const key = hovered || section.dataset.cloud
  cloud.show(key)

  cloud.setScroll(section.id === 'top' ? heroProgress * 0.5 : 0)
  cloud.setOpacity(hovered ? 1 : Number(section.dataset.cloudOpacity ?? 1))
  cloud.setOffset(hovered && !isSmall() ? 0.2 : 0)
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
const list = document.querySelector('.work__list')
const links = [...document.querySelectorAll('.work-link')]
function setHover(slug) {
  if (hovered === slug) return
  hovered = slug
  list.classList.toggle('has-hover', !!slug)
  links.forEach((l) => l.classList.toggle('is-active', l.dataset.slug === slug))
  updateCloud()
}

if (!isTouch) {
  links.forEach((l) => {
    l.addEventListener('pointerenter', () => setHover(l.dataset.slug))
    l.addEventListener('focus', () => setHover(l.dataset.slug))
    l.addEventListener('blur', () => setHover(null))
  })
  list.addEventListener('pointerleave', () => setHover(null))
} else {
  // tactile : le projet au centre de l'écran pilote le nuage
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) if (e.isIntersecting) setHover(e.target.dataset.slug)
    },
    { rootMargin: '-45% 0px -45% 0px' },
  )
  links.forEach((l) => io.observe(l))
}

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
const baseTitle = document.title
const background = [app, document.querySelector('.topbar'), document.getElementById('title-layer')]
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
  setTimeout(() => caseView.isOpen && cloud?.pause(), 700)
}

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
      tileMotion.rects = null
      document.querySelectorAll('.words, .reveal').forEach((el) => revealObserver.observe(el))
      updateCloud()
      updateSkills()
      route()
      // préchargement discret des nuages de projets
      const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 1200))
      idle(() => projects.forEach((p) => cloud?.preload(p.slug)))
    },
    reducedMotion ? 0 : 450,
  )
})
