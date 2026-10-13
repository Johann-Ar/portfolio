import { defineConfig } from 'vite'

// base relative : le site fonctionne sur GitHub Pages (/portfolio/) comme sur un domaine perso.
export default defineConfig({
  base: './',
  build: {
    target: 'es2022',
    assetsInlineLimit: 0,
  },
})
