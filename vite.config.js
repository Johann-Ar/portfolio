import { createReadStream, existsSync, statSync } from 'node:fs'
import { join, resolve, sep } from 'node:path'
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

// base relative : le site fonctionne sur GitHub Pages (/portfolio/) comme sur un domaine perso.
export default defineConfig({
  base: './',
  plugins: [localSplats()],
  build: {
    target: 'es2022',
    assetsInlineLimit: 0,
  },
})
