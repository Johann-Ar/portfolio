# Johann Arata — portfolio

Portfolio de designer numérique : expériences web immersives et temps réel.
Vite + Three.js (nuage de points WebGL) + Lenis (smooth scroll), sans framework.

Structure inspirée de [dorianlods.com](https://www.dorianlods.com/) ; les fiches projet reprennent sa composition
(défilement vertical qui fait glisser un bloc horizontal : texte + infos, puis images de 100 % de hauteur).
- « splat » : chaque image devient une grille de points (un par pixel échantillonné), avec sa couleur ;
  **la luminance détermine la profondeur**. Touche **Espace** : monochrome → couleurs → monochrome bleu ; **B** : ancien rendu de l'accueil ; **P** : panneau de réglages
  (taille des points, relief, distance, courbure, opacité, verre, reflets du fond, souris, respiration, parallaxe — mémorisés dans le navigateur) ;
- pixels RVB (panneau P) : chaque point devient un pixel d'écran OLED (PenTile, losanges) vu au microscope, halo réglable ;
- effet verre : chaque point est une bille qui reflète les couleurs du fond situées derrière elle ;
- accueil et contact : images reculées, bord à bord, profondeur inversée (clair = loin), courbure concave réglable ;
- accueil : photo plein écran qui déborde du cadre ; section Projets : couverture du projet survolé,
  rotation limitée au glisser ;
- fiches projet : petites images regroupées par deux (bento) ; au bout, continuer à défiler ouvre le projet suivant ;
- thème sombre par défaut, thème clair noir et blanc ; fond en dégradé de la palette du site, derrière tout
  (rose bonbon `#FF98E5`, bleu lavande `#B2A3E9`, vert menthe `#98DDBE`, rose corail `#F799AB`) ;
- contact : splat du tableau de Thomas Gainsborough, *View near King's Bromley-on-Trent* ;
- accueil : élément 3D en verre au centre, même technique que celui de dorianlods.com, réécrite pour Three.js
  (`src/webgl/GlassElement.js`) : la scène derrière le verre et les normales des faces arrière sont rendues
  dans deux textures, puis le verre réfracte avec une dispersion sur 6 longueurs d'onde × 16 échantillons
  (IOR 1.15 / 1.78 / 1.57 / 1.39 / 1.24 / 1.34), reflets de studio et Fresnel. Forme « Logo » (vague + anneau,
  par défaut) ou « Prismes » (7 barres en étoile, comme la référence), au choix dans le panneau P ;
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
| régler le splat (points, profondeur) | `src/webgl/targets.js`, `src/webgl/PointCloud.js` |

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

## Volumétrie SHARP (touche V)

Mode alternatif : vrais Gaussian splats 3D au lieu du nuage de points.

1. **SHARP** (Apple, [github.com/apple/ml-sharp](https://github.com/apple/ml-sharp)) : une image → un `.ply` de gaussiennes 3D.
   Fonctionne sur CPU (~90 s par image) :
   ```bash
   sharp predict -i images/ -o ply/ --device cpu --no-render
   ```
2. **SPZ** (Niantic, [github.com/nianticlabs/spz](https://github.com/nianticlabs/spz)) : compression (~4–5× plus léger) :
   ```bash
   python3 scripts/ply-to-spz.py ply/ public/splats/            # pleine qualité
   python3 scripts/ply-to-spz.py ply/ public/splats/ --max 600000  # allégé pour le web
   ```
   Le script écrit des SPZ v3 (gzip), la v4 (zstd) n'étant pas encore lue par Spark.
3. **Spark** (World Labs, [sparkjs.dev](https://sparkjs.dev)) : rendu dans la scène Three.js, chargé à la demande.

Les noms des fichiers (`hero`, `contact`, slug du projet) relient chaque scène à sa section.

## Crédits

Photographies de la série « Invisible » et « La couleur de l'eau » : © Nicolas Floc'h.
Captations ROV : Schmidt Ocean Institute.
Contact : Thomas Gainsborough, *View near King's Bromley-on-Trent* (domaine public).
Volumétrie : Apple Machine Learning Research Model is licensed under the Apple Machine Learning Research Model License
Agreement (`public/splats/LICENSE_MODEL.txt`). Les fichiers `public/splats/*.spz` sont des dérivés du modèle SHARP
(gaussiennes prédites puis compressées en SPZ), réservés à un usage non commercial de recherche.
