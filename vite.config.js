import { createReadStream, existsSync, statSync } from 'node:fs'
import { join, resolve, sep } from 'node:path'
import { pathToFileURL } from 'node:url'
import { defineConfig } from 'vite'

/**
 * Volumétrie SHARP (mode développement) : les .spz (≈ 80 Mo) restent dans `splats/`, hors du site publié.
 * Ils sont servis sous /splats/ par `npm run dev` et `npm run preview` uniquement.
 */
const SPLATS = resolve('splats')
function localSplats() {
  const serve = (req, res, next) => {
    const i = req.url?.indexOf('/splats/') ?? -1
    if (i < 0) return next()
    const file = resolve(join(SPLATS, decodeURIComponent(req.url.slice(i + 8).split('?')[0])))
    if (!file.startsWith(SPLATS + sep) || !existsSync(file) || statSync(file).isDirectory()) return next()
    res.setHeader('Content-Type', file.endsWith('.json') ? 'application/json' : 'application/octet-stream')
    createReadStream(file).pipe(res)
  }
  return {
    name: 'local-splats',
    configureServer(server) {
      server.middlewares.use(serve)
    },
    configurePreviewServer(server) {
      server.middlewares.use(serve)
    },
  }
}

/** Adresse publique du site (aperçus de liens : image de partage, URL canonique). */
const SITE_URL = (process.env.SITE_URL || 'https://johann-ar.github.io/portfolio/').replace(/\/?$/, '/')

/**
 * Contenu pré-rendu : les sections (src/render.js) sont écrites directement dans le HTML publié,
 * lisibles sans JavaScript ; les métadonnées de partage reçoivent des adresses complètes.
 */
function prerender() {
  return {
    name: 'prerender',
    async transformIndexHtml(html) {
      const { appHtml } = await import(`${pathToFileURL(resolve('src/render.js')).href}?t=${Date.now()}`)
      return html
        .replace('<main id="app"></main>', `<main id="app">${appHtml()}</main>`)
        .replace('content="share.jpg"', `content="${SITE_URL}share.jpg"`)
        .replace('</head>', `  <link rel="canonical" href="${SITE_URL}" />\n    <meta property="og:url" content="${SITE_URL}" />\n    <meta name="twitter:image" content="${SITE_URL}share.jpg" />\n  </head>`)
    },
  }
}

// base relative : le site fonctionne sur GitHub Pages (/portfolio/) comme sur un domaine perso.
export default defineConfig({
  base: './',
  plugins: [localSplats(), prerender()],
  build: {
    target: 'es2022',
    assetsInlineLimit: 0,
  },
})
