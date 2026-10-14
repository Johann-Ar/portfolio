# Johann Arata — portfolio

Portfolio de designer numérique : expériences web immersives et temps réel.
Vite + Three.js (nuage de points WebGL) + Lenis (smooth scroll), sans framework.

Structure inspirée de [dorianlods.com](https://www.dorianlods.com/) ; les fiches projet reprennent sa composition
(défilement vertical qui fait glisser un bloc horizontal : texte + infos, puis images de 100 % de hauteur).
- scène : chaque image est un calque indépendant (ses points, ses réglages, sa position) ; aucune transition
  ne relie deux images : l'image affichée disparaît entièrement (points qui se dispersent et s'éteignent,
  l'apparition jouée à l'envers), puis la suivante apparaît seule, avec ses réglages ; l'habillage de la page
  (calque couleurs, vignettage) suit l'image visible (`src/webgl/PointCloud.js`) ;
- « splat » : chaque image devient une grille de points (un par pixel échantillonné), avec sa couleur ;
  **la luminance détermine la profondeur**. Touche **Espace** : monochrome → couleurs → monochrome bleu ; **B** : ancien rendu de l'accueil ; **P** : panneau de réglages
  (taille des points, relief, distance, courbure, opacité, verre, reflets du fond, souris, respiration, parallaxe — mémorisés dans le navigateur) ;
- fumée (panneau P) : les points restent fixes, l'image se déforme en volutes de fumée dessous (fbm + domain warping),
  plus fort sous la souris ; intensité, vitesse et fumée au survol réglables ;
- élément 3D en verre caché par défaut (panneau P : Caché / Logo / Prismes) ; un logo en volume reste possible
  via l'option `overlay` d'`imageTarget` (`scripts/logo-volume.py`) ;
- pixels RVB (panneau P) : chaque point devient un pixel d'écran OLED (PenTile, losanges) vu au microscope, halo réglable ;
- effet verre : chaque point est une bille qui reflète les couleurs du fond situées derrière elle ;
- accueil et contact : images reculées, bord à bord, profondeur inversée (clair = loin), courbure concave réglable ;
- accueil : photo plein écran qui déborde du cadre ; Compétences et À propos : aucune image ; section Projets : couverture du projet survolé,
  rotation limitée au glisser ;
- fiches projet : petites images regroupées par deux (bento) ; au bout, continuer à défiler ouvre le projet suivant ;
- thème sombre uniquement ; fond en dégradé de la palette du site, derrière tout
  (rose bonbon `#FF98E5`, bleu lavande `#B2A3E9`, vert menthe `#98DDBE`, rose corail `#F799AB`) ;
- accueil et contact : images passées en niveaux de gris hors du site (`scripts/grayscale.py` : sources et volumes SHARP) ;
- raccourcis (Espace, B, V, P) actifs mais non affichés ;
- contact : splat du tableau de Thomas Gainsborough, *View near King's Bromley-on-Trent* ;
- accueil : élément 3D en verre au centre, même technique que celui de dorianlods.com, réécrite pour Three.js
  (`src/webgl/GlassElement.js`) : la scène derrière le verre et les normales des faces arrière sont rendues
  dans deux textures, puis le verre réfracte avec une dispersion sur 6 longueurs d'onde × 16 échantillons
  (IOR 1.15 / 1.78 / 1.57 / 1.39 / 1.24 / 1.34), reflets de studio et Fresnel. Forme « Logo » (vague + anneau)
  ou « Prismes » (7 barres en étoile, comme la référence), au choix dans le panneau P ;
- mobile et tactile : nuage atténué et décalé sous la liste des projets, fiche projet en colonne (aussi sur tablette
  en portrait), pas de « souris fantôme » après un toucher, raccourcis clavier masqués ;
- français / anglais : bouton FR / EN en haut à droite (seul élément de la barre du haut) (langue du navigateur par défaut, choix mémorisé,
  `?lang=en` force l'anglais) ; les textes changent sur place sans recharger la 3D ;
- typos libres : Bricolage Grotesque variable (titres, taille optique), Figtree (texte), IBM Plex Mono (étiquettes).

## Mode développement

Les outils de réglage ne sont pas chargés pour les visiteurs. Ajouter **`?dev`** à l'adresse (mémorisé dans le
navigateur, `?dev=0` pour en sortir ; toujours actif avec `npm run dev`) donne accès au panneau de réglages (**P**),
aux touches **Espace** (mono / couleur / bleu), **B** (ancien rendu de l'accueil) et **V** (volumétrie SHARP),
et à l'élément 3D en verre. Les fichiers SHARP (`splats/`, ≈ 80 Mo) ne sont pas publiés : ils ne sont servis
que par `npm run dev` et `npm run preview`.

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
| changer un texte                 | `src/content.js` — `L('français', 'english')`   |
| changer un libellé d'interface   | `src/i18n.js` (objet `ui`)                      |
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
   python3 scripts/ply-to-spz.py ply/ splats/            # pleine qualité
   python3 scripts/ply-to-spz.py ply/ splats/ --max 600000  # allégé pour le web
   ```
   Le script écrit des SPZ v3 (gzip), la v4 (zstd) n'étant pas encore lue par Spark.
3. **Spark** (World Labs, [sparkjs.dev](https://sparkjs.dev)) : rendu dans la scène Three.js, chargé à la demande.

Les noms des fichiers (`hero`, `contact`, slug du projet) relient chaque scène à sa section.

## Crédits

Photographies de la série « Invisible » et « La couleur de l'eau » : © Nicolas Floc'h.
Captations ROV : Schmidt Ocean Institute.
Contact : Thomas Gainsborough, *View near King's Bromley-on-Trent* (domaine public).
Volumétrie : Apple Machine Learning Research Model is licensed under the Apple Machine Learning Research Model License
Agreement (`splats/LICENSE_MODEL.txt`). Les fichiers `splats/*.spz` sont des dérivés du modèle SHARP
(gaussiennes prédites puis compressées en SPZ), réservés à un usage non commercial de recherche.
