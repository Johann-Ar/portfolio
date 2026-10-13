import manifest from './media-manifest.json'
import { projects } from './content.js'

const BASE = import.meta.env.BASE_URL
const mediaUrl = (src) => `${BASE}media/${src}`
// distance à « tirer » au bout de la galerie pour passer au projet suivant
const PULL_THRESHOLD = 650
const esc = (str = '') =>
  str.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

function renderMedia(item, i) {
  const src = item.youtube ? item.poster : item.src
  const [w, h] = item.youtube ? [1600, 900] : manifest[src] || [1200, 900]
  const img = `<img src="${mediaUrl(src)}" alt="${esc(item.alt)}" width="${w}" height="${h}" ${
    i < 2 ? 'fetchpriority="high"' : 'loading="lazy"'
  } decoding="async" />`
  const play = item.youtube
    ? `<button class="media__play" type="button" data-youtube="${esc(item.youtube)}" aria-label="Lire la vidéo : ${esc(item.alt)}"><span>Lire le film</span></button>`
    : ''
  return `<figure class="media" style="--ar:${(w / h).toFixed(4)}">
    ${img}${play}
  </figure>`
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
    const iframe = document.createElement('iframe')
    iframe.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(btn.dataset.youtube)}?autoplay=1&rel=0`
    iframe.title = btn.getAttribute('aria-label')
    iframe.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen'
    iframe.allowFullscreen = true
    btn.parentElement.querySelector('img')?.remove()
    btn.replaceWith(iframe)
  }

  render(project) {
    const index = projects.indexOf(project)
    const next = projects[(index + 1) % projects.length]

    this.el.innerHTML = `
      <button class="case__close" type="button" data-close>Fermer</button>
      <div class="case__track" tabindex="-1">
        <div class="case__intro">
          <h1 class="case__title" id="case-title">${esc(project.title)}</h1>
          <p class="case__text">${esc(project.text)}</p>
          <dl class="case__infos">
            ${project.infos.map(([k, v]) => `<div><dt>${esc(k)} :</dt><dd><i>//</i> ${esc(v)}</dd></div>`).join('')}
          </dl>
          ${
            project.link
              ? `<a class="case__link" href="${esc(project.link.href)}" target="_blank" rel="noopener"><span>${esc(project.link.label)}</span></a>`
              : ''
          }
        </div>
        <div class="case__media">
          ${project.media.map(renderMedia).join('')}
          <a class="case__next" href="#/${next.slug}">
            <small>Projet suivant</small>
            <strong>${esc(next.title)}</strong>
            <span class="case__pull" aria-hidden="true"><span></span></span>
            <em>Continuez à défiler</em>
          </a>
        </div>
      </div>
      <div class="case__progress" aria-hidden="true"><span></span></div>`

    this.track = this.el.querySelector('.case__track')
    this.bar = this.el.querySelector('.case__progress span')
    this.nextSlug = next.slug
    this.#setPull(0)
    this.#bindScroll()
  }

  /** Défilement horizontal : la molette verticale fait avancer la galerie, avec inertie. */
  #bindScroll() {
    const track = this.track
    this.target = this.current = 0
    this.animating = false
    track.addEventListener(
      'wheel',
      (e) => {
        if (this.mobile.matches || e.ctrlKey) return
        const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX
        e.preventDefault()
        const max = track.scrollWidth - track.clientWidth
        const d = delta * (e.deltaMode === 1 ? 32 : 1)
        // au bout : on « tire » contre une résistance avant de passer au projet suivant
        if (d > 0 && this.target >= max - 1) this.#pullBy(d * 0.55)
        else if (d < 0 && this.pull > 0) this.#pullBy(d)
        else this.target = Math.min(Math.max(this.target + d, 0), max)
        this.#tick()
      },
      { passive: false },
    )
    // mobile : même principe en bas de page
    let touchY = null
    this.el.addEventListener('touchstart', (e) => (touchY = e.touches[0].clientY), { passive: true })
    this.el.addEventListener(
      'touchmove',
      (e) => {
        if (!this.mobile.matches || touchY === null) return
        const y = e.touches[0].clientY
        const atEnd = this.el.scrollTop + this.el.clientHeight >= this.el.scrollHeight - 2
        if (atEnd && y < touchY) this.#pullBy((touchY - y) * 1.2)
        touchY = y
      },
      { passive: true },
    )
    this.el.addEventListener('touchend', () => (touchY = null), { passive: true })
    // clavier, doigt, barre : on resynchronise la cible
    track.addEventListener('scroll', () => {
      if (!this.animating) this.target = this.current = track.scrollLeft
      this.#progress()
    })
  }

  #tick() {
    if (this.animating) return
    this.animating = true
    const step = () => {
      if (!this.isOpen) return (this.animating = false)
      this.current += (this.target - this.current) * 0.1
      if (Math.abs(this.target - this.current) < 0.5) this.current = this.target
      this.track.scrollLeft = this.current
      if (this.current !== this.target) requestAnimationFrame(step)
      else this.animating = false
    }
    requestAnimationFrame(step)
  }

  #setPull(v) {
    this.pull = Math.max(0, v)
    this.el.style.setProperty('--pull', Math.min(this.pull / PULL_THRESHOLD, 1).toFixed(3))
  }

  #pullBy(d) {
    if (this.leaving) return
    this.#setPull(this.pull + d)
    this.lastPull = performance.now()
    if (this.pull >= PULL_THRESHOLD) {
      this.leaving = true
      location.hash = `#/${this.nextSlug}`
      return
    }
    // sans nouvel effort, la jauge redescend
    if (!this.releasing) {
      this.releasing = true
      const relax = (now) => {
        if (!this.isOpen || this.pull <= 0) return (this.releasing = false)
        if (now - this.lastPull > 160) this.#setPull(this.pull * 0.9 - 2)
        requestAnimationFrame(relax)
      }
      requestAnimationFrame(relax)
    }
  }

  #progress() {
    const t = this.track
    const max = t.scrollWidth - t.clientWidth
    if (this.bar && max > 0) this.bar.style.transform = `scaleX(${t.scrollLeft / max})`
  }

  open(project) {
    const reopen = this.isOpen
    this.leaving = false
    clearTimeout(this.hideTimer)
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
      this.el.hidden = true
      this.el.innerHTML = ''
    }, 650)
  }
}
