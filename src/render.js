/**
 * Gabarit HTML des sections (accueil, projets, compétences, à propos, contact).
 * Utilisé par le navigateur (src/main.js) et à la compilation (vite.config.js) : le contenu est ainsi présent
 * directement dans le HTML publié, lisible sans JavaScript (moteurs de recherche, aperçus de liens).
 * Aucune dépendance au navigateur ici.
 */
import { site, skills, about, timeline, projects } from './content.js'
import { tr, ui } from './i18n.js'

export const esc = (str = '') =>
  str.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
export const bold = (str) => esc(str).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')

// les compétences, réparties en lignes qui défilent en continu, en sens opposés
export const rows = [[], [], []]
skills.forEach((s, i) => rows[i % rows.length].push(s))
// une ligne = son texte répété deux fois (boucle sans raccord) ; la copie est ignorée par les lecteurs d'écran
export const rowText = (row) => row.map((w) => `${tr(w)}, `).join('')
export const rowHtml = (row) => `<span>${esc(rowText(row))}</span><span aria-hidden="true">${esc(rowText(row))}</span>`
export const metaText = (p) => `// ${tr(p.tag)}`
export const timelineCol = (col) => `
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

export const appHtml = () => `
  <section class="hero" id="top" data-cloud="hero">
    <div class="hero__content">
      <h1 class="hero__name">
        <span class="u-visually-hidden"><span translate="no">${esc(site.name)}</span>, <span data-t="role">${esc(tr(ui.role))}</span></span>
        <span class="hero__line notranslate" translate="no" aria-hidden="true">${[...site.name].map((c, i) => (c === ' ' ? ' ' : `<span class="ch" style="--i:${i}">${esc(c)}</span>`)).join('')}</span>
      </h1>
      <p class="hero__intro words" data-words>${esc(tr(site.intro))}</p>
    </div>
    <span class="hero__scroll" aria-hidden="true" data-t="scroll">${esc(tr(ui.scroll))}</span>
  </section>

  <section class="work" id="projets" data-cloud="project" aria-labelledby="work-title">
    <div class="work__pin">
    <div class="work__stage" aria-hidden="true"></div>
    <div class="work__inner">
      <h2 class="section-title reveal" id="work-title" data-t="workTitle">${esc(tr(ui.workTitle))}</h2>
      <ul class="work__list">
        ${projects
          .map(
            (p, i) => `
          <li class="reveal" style="--i:${i}">
            <a class="work-link" href="#/${p.slug}" data-slug="${p.slug}">
              <b translate="no">${esc(p.title)}</b>
              <span class="work-link__meta">${esc(metaText(p))}</span>
            </a>
          </li>`,
          )
          .join('')}
      </ul>
    </div>
    </div>
  </section>

  <section class="skills" aria-label="${esc(tr(ui.skills))}" data-cloud="none">
    ${rows.map((row, i) => `<p class="skills__row" data-dir="${i % 2 ? -1 : 1}">${rowHtml(row)}</p>`).join('')}
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

  <section class="contact" id="contact" data-cloud="none" aria-labelledby="contact-title">
    <h2 class="section-title section-title--center reveal" id="contact-title">Contact</h2>
    <a class="contact__mail reveal notranslate" translate="no" href="mailto:${esc(site.email)}"><span>${esc(site.email)}</span></a>
    <span class="contact__copied" role="status" aria-live="polite"></span>
    <ul class="socials reveal">
      ${site.socials
        .map(
          (s) =>
            `<li><a href="${esc(s.href)}" ${s.href.startsWith('http') ? 'target="_blank" rel="noopener"' : ''}>${esc(s.label)}</a></li>`,
        )
        .join('')}
    </ul>
  </section>
`
