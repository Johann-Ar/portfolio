import manifest from './media-manifest.json'
import { projects } from './content.js'

const BASE = import.meta.env.BASE_URL
const mediaUrl = (src) => `${BASE}media/${src}`
const ratio = (src) => {
  const s = manifest[src]
  return s ? s[0] / s[1] : 4 / 3
}
const esc = (str = '') =>
  str.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

function img(src, alt) {
  const [w, h] = manifest[src] || [1200, 900]
  return `<img src="${mediaUrl(src)}" alt="${esc(alt)}" width="${w}" height="${h}" loading="lazy" decoding="async" />`
}

function frame(src, alt, extra = '') {
  return `<div class="m__frame" style="--ar:${ratio(src).toFixed(4)}">${img(src, alt)}${extra}</div>`
}

function renderMedia(item) {
  switch (item.type) {
    case 'image':
      return `<figure class="m m--img" style="--ar:${ratio(item.src).toFixed(4)}">
        ${frame(item.src, item.caption)}
        <figcaption>${esc(item.caption)}</figcaption>
      </figure>`
    case 'pair': {
      const ar = Math.max(...item.items.map((i) => ratio(i.src)))
      return `<div class="m m--pair" style="--ar:${ar.toFixed(4)}">
        ${item.items
          .map((i) => `<figure>${frame(i.src, i.caption)}<figcaption>${esc(i.caption)}</figcaption></figure>`)
          .join('')}
      </div>`
    }
    case 'youtube':
      return `<figure class="m m--img" style="--ar:${(16 / 9).toFixed(4)}">
        <div class="m__frame" style="--ar:1.7778">
          ${img(item.poster, item.caption)}
          <button class="m__play" type="button" data-youtube="${esc(item.id)}" aria-label="Lire la vidéo : ${esc(item.caption)}">
            <span><svg width="12" height="14" viewBox="0 0 12 14" aria-hidden="true"><path d="M0 0l12 7-12 7z" fill="currentColor"/></svg>Lire le film</span>
          </button>
        </div>
        <figcaption>${esc(item.caption)}</figcaption>
      </figure>`
    case 'text':
      return `<div class="m m--text">
        <span class="case__count">${esc(item.label)}</span>
        <h3>${esc(item.title)}</h3>
        ${item.body.map((p) => `<p>${esc(p)}</p>`).join('')}
      </div>`
    default:
      return ''
  }
}

export class CaseView {
  constructor(el, { onClose }) {
    this.el = el
    this.onClose = onClose
    this.isOpen = false
    this.mobile = window.matchMedia('(max-width: 768px)')

    this.onKey = (e) => {
      if (e.key === 'Escape') this.onClose()
    }

    el.addEventListener('click', (e) => {
      const play = e.target.closest('[data-youtube]')
      if (play) this.#playVideo(play)
      if (e.target.closest('[data-close]')) this.onClose()
    })
    el.addEventListener('load', (e) => e.target.tagName === 'IMG' && e.target.classList.add('is-loaded'), true)
  }

  #playVideo(btn) {
    const id = btn.dataset.youtube
    const iframe = document.createElement('iframe')
    iframe.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0`
    iframe.title = btn.getAttribute('aria-label')
    iframe.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen'
    iframe.allowFullscreen = true
    btn.parentElement.replaceChildren(iframe)
  }

  render(project) {
    const index = projects.indexOf(project)
    const next = projects[(index + 1) % projects.length]
    const pad = (n) => String(n).padStart(2, '0')

    this.el.innerHTML = `
      <div class="case__track" tabindex="-1">
        <div class="case__close"><button type="button" data-close>Fermer</button></div>
        <div class="case__intro">
          <span class="case__count">${pad(index + 1)} / ${pad(projects.length)} — ${esc(project.medium)}</span>
          <h1 class="case__title display" id="case-title">${esc(project.title)}</h1>
          <p class="case__subtitle">${esc(project.subtitle)}</p>
          <p class="case__question">${esc(project.question)}</p>
          <div class="case__text">${project.intro.map((p) => `<p>${esc(p)}</p>`).join('')}</div>
          <dl class="case__infos">
            ${project.infos.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}
          </dl>
          ${
            project.link
              ? `<a class="case__link hl" href="${esc(project.link.href)}" target="_blank" rel="noopener">${esc(project.link.label)}</a>`
              : ''
          }
        </div>
        <div class="case__media">
          ${project.media.map(renderMedia).join('')}
          <div class="m m--next">
            <a href="#/${next.slug}">
              <small>Projet suivant</small>
              <strong class="display">${esc(next.title)} →</strong>
            </a>
          </div>
        </div>
      </div>
      <div class="case__progress"><span></span></div>`

    this.track = this.el.querySelector('.case__track')
    this.bar = this.el.querySelector('.case__progress span')
    this.#bindScroll()
  }

  /** Défilement horizontal : la molette verticale fait avancer la galerie, avec inertie. */
  #bindScroll() {
    const track = this.track
    this.target = 0
    this.current = 0
    track.addEventListener(
      'wheel',
      (e) => {
        if (this.mobile.matches) return
        const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX
        e.preventDefault()
        const max = track.scrollWidth - track.clientWidth
        this.target = Math.min(Math.max(this.target + delta * (e.deltaMode === 1 ? 32 : 1), 0), max)
        this.#tick()
      },
      { passive: false },
    )
    // clavier, glisser au doigt, barre : on resynchronise la cible
    track.addEventListener('scroll', () => {
      if (!this.animating) this.target = this.current = track.scrollLeft
      this.#progress()
    })
    this.el.addEventListener('scroll', () => this.#progress())
  }

  #tick() {
    if (this.animating) return
    this.animating = true
    const step = () => {
      this.current += (this.target - this.current) * 0.12
      if (Math.abs(this.target - this.current) < 0.5) this.current = this.target
      this.track.scrollLeft = this.current
      if (this.current !== this.target && this.isOpen) requestAnimationFrame(step)
      else this.animating = false
    }
    requestAnimationFrame(step)
  }

  #progress() {
    const t = this.track
    const max = t.scrollWidth - t.clientWidth
    if (this.bar && max > 0) this.bar.style.transform = `scaleX(${t.scrollLeft / max})`
  }

  open(project) {
    const reopen = this.isOpen
    this.render(project)
    this.el.hidden = false
    this.el.scrollTop = 0
    document.addEventListener('keydown', this.onKey)
    if (reopen) {
      this.el.classList.remove('is-open')
      void this.el.offsetWidth
    }
    requestAnimationFrame(() => {
      this.el.classList.add('is-open')
      this.track.focus({ preventScroll: true })
    })
    this.isOpen = true
  }

  close() {
    if (!this.isOpen) return
    this.isOpen = false
    document.removeEventListener('keydown', this.onKey)
    this.el.classList.remove('is-open')
    clearTimeout(this.hideTimer)
    this.hideTimer = setTimeout(() => {
      if (!this.isOpen) {
        this.el.hidden = true
        this.el.innerHTML = ''
      }
    }, 650)
  }
}
