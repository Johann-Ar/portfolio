import manifest from './media-manifest.json'
import { projects } from './content.js'
import { lang, tr, ui } from './i18n.js'

/**
 * Fiche projet : même mécanique que la référence.
 * La section défile verticalement (un espaceur donne la hauteur), et ce défilement
 * fait glisser horizontalement le bloc fixe : titre + texte + infos, puis les images.
 * Les petites images sont regroupées par deux, empilées dans une colonne (bento).
 * Au bout, continuer à défiler remplit une jauge puis ouvre le projet suivant.
 */

const BASE = import.meta.env.BASE_URL
const mediaUrl = (src) => `${BASE}media/${src}`
const esc = (str = '') =>
  str.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

const PULL_THRESHOLD = 650 // distance à « tirer » au bout pour passer au projet suivant
const SMALL_WIDTH = 700 // en dessous (largeur d'origine), une image est regroupée avec sa voisine

const sizeOf = (item) => (item.youtube ? [1600, 900] : manifest[item.src] || [1200, 900])
const isSmall = (item) => !item.youtube && sizeOf(item)[0] < SMALL_WIDTH

function img(item, eager) {
  const src = item.youtube ? item.poster : item.src
  const [w, h] = sizeOf(item)
  return `<img class="media__img" src="${mediaUrl(src)}" alt="${esc(tr(item.alt))}" width="${w}" height="${h}" ${
    eager ? 'fetchpriority="high"' : 'loading="lazy"'
  } decoding="async" />`
}

function single(item, i) {
  const play = item.youtube
    ? `<button class="media__play" type="button" data-youtube="${esc(item.youtube)}" aria-label="${esc(tr(ui.playVideo))} : ${esc(tr(item.alt))}"><span>${esc(tr(ui.playFilm))}</span></button>`
    : ''
  return `<div class="media">${img(item, i < 2)}${play}</div>`
}

/** Regroupe les petites images consécutives par deux. */
function layout(media) {
  const out = []
  for (let i = 0; i < media.length; i++) {
    const a = media[i]
    const b = media[i + 1]
    if (isSmall(a) && b && isSmall(b)) {
      out.push(`<div class="media-double">${single(a, i)}${single(b, i + 1)}</div>`)
      i++
    } else out.push(single(a, i))
  }
  return out.join('')
}

export class CaseView {
  constructor(el, { onClose }) {
    this.el = el
    this.onClose = onClose
    this.isOpen = false
    this.mobile = window.matchMedia('(max-width: 768px), (max-width: 1100px) and (orientation: portrait)')

    this.onKey = (e) => {
      if (e.key === 'Escape') this.onClose()
    }
    el.addEventListener('click', (e) => {
      const play = e.target.closest('[data-youtube]')
      if (play) this.#playVideo(play)
      if (e.target.closest('[data-close]')) this.onClose()
    })
    el.addEventListener('load', (e) => e.target.tagName === 'IMG' && e.target.classList.add('is-loaded'), true)
    el.addEventListener('scroll', () => this.#onScroll(), { passive: true })
    el.addEventListener('wheel', (e) => this.#onWheel(e), { passive: false })

    let touchY = null
    el.addEventListener('touchstart', (e) => (touchY = e.touches[0].clientY), { passive: true })
    el.addEventListener(
      'touchmove',
      (e) => {
        if (touchY === null) return
        const y = e.touches[0].clientY
        if (this.#atEnd() && y < touchY) this.#pullBy((touchY - y) * 1.2)
        touchY = y
      },
      { passive: true },
    )
    el.addEventListener('touchend', () => (touchY = null), { passive: true })
    window.addEventListener('resize', () => this.isOpen && this.#measure())
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
    this.project = project
    const index = projects.indexOf(project)
    const next = projects[(index + 1) % projects.length]
    this.nextSlug = next.slug

    this.el.innerHTML = `
      <div class="case__spacer"></div>
      <div class="case__wrapper">
        <div class="case__title-wrapper">
          <h1 id="case-title" translate="no">${esc(project.title)}</h1>
          <p>${esc(tr(project.text))}</p>
          <div class="case__infos">
            ${project.infos
              .map(
                ([k, v]) =>
                  `<p class="info-item${v?.todo ? ' todo' : ''}"><span class="info-category">${esc(tr(k))}${lang === 'fr' ? ' :' : ':'}</span><b>//</b><span class="info-value">${esc(tr(v))}</span></p>`,
              )
              .join('')}
            ${
              project.link
                ? `<a class="case__link" href="${esc(project.link.href)}" target="_blank" rel="noopener"><span>${esc(tr(project.link.label))}</span></a>`
                : ''
            }
          </div>
        </div>
        <div class="case__images">
          ${layout(project.media)}
        </div>
        <a class="case__next" href="#/${next.slug}">
          <small>${esc(tr(ui.next))}</small>
          <strong translate="no">${esc(next.title)}</strong>
          <span class="case__pull" aria-hidden="true"><span></span></span>
          <em>${esc(tr(ui.keepScrolling))}</em>
        </a>
      </div>
      <div class="case__close"><button type="button" data-close>${esc(tr(ui.close))}</button></div>
      <div class="case__progress" aria-hidden="true"><span></span></div>`

    this.wrapper = this.el.querySelector('.case__wrapper')
    this.spacer = this.el.querySelector('.case__spacer')
    this.progressBar = this.el.querySelector('.case__progress span')
    this.current = 0
    this.#setPull(0)
  }

  /** Hauteur de l'espaceur = largeur du contenu à faire défiler + hauteur d'écran (comme la référence). */
  #measure() {
    if (this.mobile.matches) {
      this.spacer.style.height = '0px'
      this.wrapper.style.transform = ''
      return
    }
    const travel = Math.max(0, this.wrapper.scrollWidth - window.innerWidth)
    this.travel = travel
    this.spacer.style.height = `${travel + window.innerHeight}px`
  }

  /** Barre de progression de la lecture du projet (0 → 1). */
  #progress(p) {
    if (this.progressBar) this.progressBar.style.transform = `scaleX(${Math.min(Math.max(p, 0), 1).toFixed(4)})`
  }

  #onScroll() {
    if (this.mobile.matches) {
      const max = this.el.scrollHeight - this.el.clientHeight
      this.#progress(max > 0 ? this.el.scrollTop / max : 0)
      return
    }
    if (this.animating) return
    this.animating = true
    const step = () => {
      const target = Math.min(this.el.scrollTop, this.travel || 0)
      this.current += (target - this.current) * 0.12
      if (Math.abs(target - this.current) < 0.3) this.current = target
      this.wrapper.style.transform = `translate3d(${-this.current.toFixed(1)}px,0,0)`
      this.#progress(this.travel ? this.current / this.travel : 0)
      if (this.current !== target && this.isOpen) requestAnimationFrame(step)
      else this.animating = false
    }
    requestAnimationFrame(step)
  }

  #atEnd() {
    return this.el.scrollTop + this.el.clientHeight >= this.el.scrollHeight - 2
  }

  #onWheel(e) {
    if (!this.isOpen || e.ctrlKey) return
    const raw = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX
    const d = raw * (e.deltaMode === 1 ? 32 : 1)
    // le bloc est en position fixe : la molette ne remonte pas jusqu'à la section, on la pilote ici
    if (!this.mobile.matches) {
      e.preventDefault()
      this.el.scrollTop += d
    }
    // au bout : on « tire » contre une résistance avant de passer au projet suivant
    if (d > 0 && this.#atEnd()) this.#pullBy(d * 0.55)
    else if (d < 0 && this.pull > 0) this.#pullBy(d)
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

  #enter(project) {
    this.render(project)
    this.el.scrollTop = 0
    this.#measure()
    requestAnimationFrame(() => {
      this.el.classList.remove('is-leaving')
      this.el.classList.add('is-open')
      this.el.focus({ preventScroll: true })
    })
  }

  open(project) {
    const reopen = this.isOpen
    this.isOpen = true
    this.leaving = false
    clearTimeout(this.hideTimer)
    clearTimeout(this.swapTimer)
    document.addEventListener('keydown', this.onKey)
    this.el.hidden = false
    if (reopen) {
      // projet suivant : le contenu sort vers la gauche, puis le nouveau entre
      this.el.classList.add('is-leaving')
      this.el.classList.remove('is-open')
      this.swapTimer = setTimeout(() => this.#enter(project), 550)
    } else {
      void this.el.offsetWidth
      this.#enter(project)
    }
  }

  /** Changement de langue : la fiche ouverte est réécrite à la même position. */
  relang() {
    if (!this.isOpen || !this.project) return
    const top = this.el.scrollTop
    this.render(this.project)
    this.#measure()
    this.el.scrollTop = top
    this.current = Math.min(top, this.travel || 0)
    this.#onScroll()
  }

  close() {
    if (!this.isOpen) return
    this.isOpen = false
    document.removeEventListener('keydown', this.onKey)
    clearTimeout(this.swapTimer)
    this.el.classList.remove('is-open', 'is-leaving')
    clearTimeout(this.hideTimer)
    this.hideTimer = setTimeout(() => {
      this.el.hidden = true
      this.el.innerHTML = ''
    }, 900)
  }
}
