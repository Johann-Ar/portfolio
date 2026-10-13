import '@fontsource/ibm-plex-mono/latin-300.css'
import '@fontsource/ibm-plex-mono/latin-400.css'
import '@fontsource/ibm-plex-mono/latin-500.css'
import '@fontsource/ibm-plex-sans/latin-400.css'
import '@fontsource/ibm-plex-sans/latin-500.css'
import '@fontsource/ibm-plex-sans/latin-600.css'
import './styles/main.css'

import Lenis from 'lenis'
import { site, practice, about, research, timeline, projects } from './content.js'
import { CaseView } from './case.js'

const BASE = import.meta.env.BASE_URL
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const esc = (str = '') =>
  str.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
const bold = (str) => esc(str).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
const pad = (n) => String(n).padStart(2, '0')

/* ------------------------------------------------------------------
   Rendu des sections
------------------------------------------------------------------- */

const app = document.getElementById('app')
app.innerHTML = `
  <section class="hero" id="top" data-cloud="name">
    <h1 class="u-visually-hidden">${esc(site.name)}, ${esc(site.role.toLowerCase())}</h1>
    <div class="hero__fallback display" aria-hidden="true">${esc(site.name)}</div>
    <p class="hero__intro words" data-words>${esc(site.intro)}</p>
    <span class="hero__scroll" aria-hidden="true">Défiler</span>
  </section>

  <section class="projects" id="projets" data-cloud="cover" data-cloud-opacity="0.55">
    <span class="section-label reveal">Projets — ${pad(projects.length)}</span>
    <ol class="project-list">
      ${projects
        .map(
          (p, i) => `
        <li class="reveal" style="--i:${i}">
          <a class="project-link" href="#/${p.slug}" data-slug="${p.slug}">
            <span class="project-link__index">${pad(i + 1)}</span>
            <span class="project-link__title">${esc(p.title)}<span class="project-link__sub">${esc(p.subtitle)}</span></span>
            <span class="project-link__meta">${esc(p.medium)} // ${esc(p.year)}</span>
          </a>
        </li>`,
        )
        .join('')}
    </ol>
  </section>

  <section class="practice" aria-label="Pratique" data-cloud="terrain" data-cloud-opacity="0.5">
    <span class="section-label reveal">Pratique</span>
    <p class="practice__words display words" data-words-raw>
      ${practice.map((w) => `<span class="w">${esc(w)}</span>`).join('<span class="w sep">/</span>')}
    </p>
  </section>

  <section class="about" id="a-propos" data-cloud="terrain" data-cloud-opacity="0.12">
    <span class="section-label reveal" style="text-align:center">À propos</span>
    <div class="about__text">
      ${about.map((p) => `<p class="words" data-words>${bold(p)}</p>`).join('')}
    </div>

    <div class="about__research reveal">
      <div>
        <span class="section-label">${esc(research.label)}</span>
        <h3>${esc(research.title)}</h3>
      </div>
      <div>${research.body.map((p) => `<p>${esc(p)}</p>`).join('')}</div>
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
                  <span class="timeline__name">${esc(it.name)}</span>
                  ${it.detail ? `<span class="timeline__detail">${esc(it.detail)}</span>` : ''}
                </li>`,
              )
              .join('')}
          </ul>
        </div>`,
        )
        .join('')}
    </div>
  </section>

  <section class="contact" id="contact" data-cloud="cover" data-cloud-opacity="0.22">
    <span class="section-label reveal">Contact</span>
    <h2 class="contact__title display words" data-words>Écrire</h2>
    <a class="contact__mail hl reveal" href="mailto:${esc(site.email)}">${esc(site.email)}</a>
    <ul class="socials reveal">
      ${site.socials
        .map((s) => `<li><a class="hl" href="${esc(s.href)}" ${s.href.startsWith('http') ? 'target="_blank" rel="noopener"' : ''}>${esc(s.label)}</a></li>`)
        .join('')}
    </ul>
  </section>

  <footer class="footer">
    <span>© ${new Date().getFullYear()} ${esc(site.name)}</span>
    <span>${esc(site.location)}</span>
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
document.querySelectorAll('[data-words-raw] .w').forEach((w, i) => w.style.setProperty('--i', i * 2))

/* Apparitions au scroll */
const revealObserver = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        e.target.classList.add('is-in')
        revealObserver.unobserve(e.target)
      }
    }
  },
  { rootMargin: '0px 0px -12% 0px' },
)

/* ------------------------------------------------------------------
   Smooth scroll
------------------------------------------------------------------- */

const lenis = reducedMotion ? null : new Lenis({ autoRaf: true, lerp: 0.09 })
const scrollTo = (target) => {
  if (lenis) lenis.scrollTo(target, { offset: 0, duration: 1.4 })
  else (typeof target === 'number' ? window.scrollTo(0, target) : target.scrollIntoView())
}

document.querySelectorAll('a[href^="#"]:not([href^="#/"])').forEach((a) => {
  a.addEventListener('click', (e) => {
    const id = a.getAttribute('href').slice(1)
    const target = id === 'top' ? 0 : document.getElementById(id)
    if (target === null) return
    e.preventDefault()
    if (location.hash.startsWith('#/')) closeProject()
    scrollTo(target)
  })
})

/* ------------------------------------------------------------------
   Nuage de points WebGL
------------------------------------------------------------------- */

let cloud = null
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
    document.documentElement.classList.add('no-webgl')
    return
  }
  const [{ PointCloud }, { textTarget, imageTarget }] = await Promise.all([
    import('./webgl/PointCloud.js'),
    import('./webgl/targets.js'),
  ])
  cloud = new PointCloud(canvas, { color: '#3b21ff', reducedMotion })
  cloud.register('name', textTarget(site.name.toUpperCase().split(' ')))
  cloud.register('cover', imageTarget(`${BASE}media/site/squid-cloud.webp`, { invert: true, gamma: 1.2, depth: 5 }))
  cloud.register('terrain', imageTarget(`${BASE}media/site/terrain-cloud.webp`, { invert: true, gamma: 1.2, depth: 5 }))
  for (const p of projects) cloud.register(p.slug, imageTarget(`${BASE}media/${p.cloud}`))
  await cloud.show('name', { instant: true })
  cloud.preload('cover')
}

/* Choix de la cible selon la section au centre de l'écran, ou du projet survolé */
const sections = [...document.querySelectorAll('[data-cloud]')]
let hovered = null

function updateCloud() {
  if (!cloud) return
  const vh = window.innerHeight
  const y = window.scrollY
  const mid = vh * 0.5
  let section = sections[0]
  for (const s of sections) {
    const r = s.getBoundingClientRect()
    if (r.top <= mid && r.bottom >= mid) section = s
  }
  const key = hovered || section.dataset.cloud
  cloud.show(key)

  const heroProgress = Math.min(y / vh, 1)
  cloud.setScroll(key === 'name' ? heroProgress * 0.6 : 0)
  // chaque section règle l'intensité du nuage pour garder les textes lisibles
  const base = Number(section.dataset.cloudOpacity ?? 1)
  cloud.setOpacity(hovered ? 0.9 : key === 'name' ? base - heroProgress * 0.4 : base)
  cloud.setOffset(hovered && !isTouch ? 0.16 : 0)
}

const isTouch = !window.matchMedia('(hover: hover)').matches
const list = document.querySelector('.project-list')
const links = [...document.querySelectorAll('.project-link')]
const setHover = (slug) => {
  hovered = slug
  list.classList.toggle('has-hover', !!slug)
  links.forEach((l) => l.classList.toggle('is-active', l.dataset.slug === slug))
  updateCloud()
}

if (window.matchMedia('(hover: hover)').matches) {
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
  new IntersectionObserver(([e]) => !e.isIntersecting && setHover(null)).observe(list)
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
    })
  },
  { passive: true },
)

/* ------------------------------------------------------------------
   Pages projet (routage par hash : #/slug)
------------------------------------------------------------------- */

const caseView = new CaseView(document.getElementById('case'), {
  onClose: () => {
    history.pushState('', document.title, location.pathname + location.search)
    route()
  },
})
const topbar = document.querySelector('.topbar')
const baseTitle = document.title
let lastLink = null

function openProject(project) {
  lastLink = document.querySelector(`.project-link[data-slug="${project.slug}"]`)
  caseView.open(project)
  document.title = `${project.title} — ${site.name}`
  topbar.classList.add('is-hidden')
  lenis?.stop()
  document.documentElement.style.overflow = 'hidden'
  setTimeout(() => caseView.isOpen && cloud?.pause(), 700)
}

function closeProject() {
  if (!caseView.isOpen) return
  caseView.close()
  document.title = baseTitle
  topbar.classList.remove('is-hidden')
  document.documentElement.style.overflow = ''
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
let goal = 0.1
const minTime = new Promise((r) => setTimeout(r, reducedMotion ? 0 : 900))

function animateLoader() {
  shown += (goal - shown) * 0.12
  if (goal >= 1 && 1 - shown < 0.005) shown = 1
  count.textContent = String(Math.round(shown * 100)).padStart(3, '0')
  bar.style.transform = `scaleX(${shown})`
  if (shown < 1) requestAnimationFrame(animateLoader)
}
requestAnimationFrame(animateLoader)

document.fonts.ready.then(() => (goal = Math.max(goal, 0.5)))

Promise.all([
  document.fonts.ready,
  initCloud().catch((err) => {
    console.warn('WebGL indisponible', err)
    document.documentElement.classList.add('no-webgl')
  }),
  minTime,
]).then(() => {
  goal = 1
  setTimeout(
    () => {
      loader.classList.add('is-hidden')
      document.querySelectorAll('.words, .reveal').forEach((el) => revealObserver.observe(el))
      updateCloud()
      route()
    },
    reducedMotion ? 0 : 450,
  )
})
