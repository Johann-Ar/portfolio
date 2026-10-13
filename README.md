# Johann Arata — portfolio

Portfolio de designer numérique : expériences web immersives et temps réel.
Vite + Three.js (nuage de points WebGL) + Lenis (smooth scroll), sans framework.

Structure inspirée de [dorianlods.com](https://www.dorianlods.com/) (liste de projets, grands mots en tuiles,
fiches projet en galerie horizontale), entièrement réécrite :
- nuage de points où **la luminance de chaque pixel détermine sa profondeur** ; dans la section Projets,
  il montre l'image de couverture du projet survolé et se fait tourner au glisser ;
- au bout d'une fiche projet, continuer à défiler remplit une jauge puis ouvre le projet suivant ;
- thème sombre par défaut, thème clair noir et blanc ; fond aux couleurs du logo Apple TV ;
- typos libres : Instrument Serif (titres), Figtree (texte), IBM Plex Mono (étiquettes).

## Lancer en local

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # génère dist/
npm run preview   # sert dist/
```

## Modifier le contenu

Tout est dans **`src/content.js`** : textes, ordre des projets, galeries, liens, parcours.

| Je veux…                         | Où                                              |
| -------------------------------- | ----------------------------------------------- |
| changer un texte                 | `src/content.js`                                |
| ajouter / réordonner un projet   | tableau `projects` dans `src/content.js`        |
| changer l'image du nuage d'un projet | champ `cloud` du projet (couverture du portfolio) |
| changer les couleurs, typos      | variables en haut de `src/styles/main.css` (`--font-display` pour la typo des titres) |
| régler les tuiles                | `src/tiles.js`                                  |
| régler le nuage de points        | `src/webgl/PointCloud.js`, `points.vert`        |

## Ajouter des images

1. Déposer les fichiers sources (png/jpg, idéalement en haute définition) dans `media-src/<projet>/`
   (ce dossier n'est pas versionné).
2. `npm run media` : convertit en WebP optimisés dans `public/media/` et met à jour
   `src/media-manifest.json` (dimensions, pour éviter les sauts de mise en page).
3. Référencer `<projet>/<nom>.webp` dans `src/content.js`.

## Mise en ligne (GitHub Pages)

Le workflow `.github/workflows/deploy.yml` construit et publie le site à chaque push sur `main`.
À activer une fois : *Settings → Pages → Source : GitHub Actions*.
Le site est servi en chemins relatifs : il fonctionne aussi sur un domaine perso.

## Crédits

Photographies de la série « Invisible » et « La couleur de l'eau » : © Nicolas Floc'h.
Captations ROV : Schmidt Ocean Institute.
