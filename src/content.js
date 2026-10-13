/**
 * Tout le contenu éditorial du site.
 * Modifier ce fichier suffit pour changer les textes, l'ordre des projets ou les images.
 *
 * Médias : chemins relatifs à public/media/ (générés par `npm run media` depuis media-src/).
 * Dans une galerie :
 *   { src, caption }                     image
 *   { youtube: 'id', poster, caption }   vidéo chargée seulement au clic
 * Dans un texte, les segments entre ** sont mis en gras.
 */

export const site = {
  name: 'Johann Arata',
  role: 'Designer numérique',
  location: 'Auvergne-Rhône-Alpes, France',
  email: 'arata.johann@gmail.com',
  intro:
    'Designer numérique. Je conçois et développe des expériences web immersives et temps réel : WebGL, Three.js, nuages de points et images captées.',
  socials: [
    { label: 'Mail', href: 'mailto:arata.johann@gmail.com' },
    { label: 'GitHub', href: 'https://github.com/holosene' },
    { label: 'YouTube', href: 'https://www.youtube.com/watch?v=1lXEIx5jFCQ' },
  ],
}

/** Grand bloc de mots en tuiles (compétences). */
export const skills = [
  'WebGL',
  'Three.js',
  'Shaders',
  'Nuages de points',
  'Gaussian Splatting',
  'IA & profondeur',
  'Segmentation',
  'Temps réel',
  'Interfaces',
  'React',
  'Motion',
  'Vidéo',
  'Direction artistique',
]

export const about = [
  'Je suis **designer numérique**, diplômé d’un DNMADe Design numérique. Je conçois et je développe des **expériences interactives dans le navigateur** : volumes, nuages de points, espaces navigables et interfaces, en **WebGL et Three.js**.',
  'Mon point de départ, ce sont des **images réelles** : photographies sous-marines, vidéos de submersibles, captations GoPro. Je les traduis en **volumes que l’on peut traverser**, avec des outils d’IA (segmentation SAM2, estimation de profondeur), des shaders sur mesure et un vrai travail de mise en scène.',
  'Je mène les projets de bout en bout : **direction artistique, prototypage, développement front-end**, son et mise en espace. Ce qui me motive, c’est le moment où une intention de design devient **un système temps réel qui tourne à 60 images par seconde**.',
  'Je recherche un **stage en design et développement créatif** dans un studio qui fabrique des expériences interactives.',
]

export const timeline = [
  {
    title: 'Formation',
    items: [
      { year: '2025 — 26', name: 'Année de césure', detail: 'Projets personnels en WebGL, captation et 3D temps réel' },
      { year: '2022 — 25', name: 'DNMADe Design numérique', detail: 'Lycée René Goscinny, Drap (06)' },
      { year: '2019 — 22', name: 'Baccalauréat général', detail: 'Lycée La Saulaie (38)' },
    ],
  },
  {
    title: 'Expériences',
    items: [
      { year: '2024', name: 'Le Hublot, Nice', detail: 'Stage, centre de création numérique : création visuelle, identité, supports' },
      { year: '2023', name: 'CréapiConcept, Nice', detail: 'Stage auprès d’un designer freelance : conception visuelle, production d’images' },
      { year: '2022', name: 'Workshop MuséoMix', detail: 'Musée des Arts Asiatiques, Nice : dispositif de médiation' },
    ],
  },
  {
    title: 'Outils',
    items: [
      { year: 'Dev', name: 'Three.js, WebGL, shaders', detail: 'JavaScript, HTML/CSS, React, Web Audio' },
      { year: '3D / IA', name: 'Gaussian Splatting, SAM2', detail: 'Depth Anything V2, Luma AI' },
      { year: 'Image', name: 'Suite Adobe', detail: 'Photoshop, Illustrator, InDesign, After Effects, DaVinci Resolve' },
      { year: 'Langues', name: 'Français, anglais B2', detail: '' },
    ],
  },
]

export const projects = [
  {
    slug: 'dumbo',
    title: 'Dumbo',
    tag: 'WebGL, IA',
    cloud: 'dumbo/041.webp',
    text: 'Une expérience WebGL qui transforme des vidéos de submersibles du Schmidt Ocean Institute en présences spatiales. J’isole les créatures avec la segmentation SAM2, puis la luminance de chaque pixel pilote sa profondeur : chaque image devient un nuage de points animé. Les volumes sont exposés dans une galerie que l’on parcourt à la première personne. On s’approche d’une créature abyssale comme d’une sculpture, à la distance que l’on choisit.',
    infos: [
      ['Rôle', 'Conception, DA, développement'],
      ['Stack', 'Three.js, WebGL, shaders, SAM2'],
      ['Source', 'Schmidt Ocean Institute'],
      ['Année', '2026'],
    ],
    link: { label: 'Ouvrir le projet', href: 'https://holosene.github.io/dumbo-biovolume/' },
    media: [
      { src: 'dumbo/058.webp', caption: 'Volume généré par la luminance d’une captation ROV' },
      { src: 'dumbo/053.webp', caption: 'La source reste visible, seulement mise en volume' },
      { src: 'dumbo/054.webp', caption: 'Le point de vue change l’aspect de la projection' },
      { src: 'dumbo/057.webp', caption: 'Vue de l’espace, proche d’un mur' },
      { src: 'dumbo/056.webp', caption: 'Vue de l’espace, l’entrée' },
      { src: 'dumbo/046.webp', caption: 'Prototype luminance' },
      { src: 'dumbo/048.webp', caption: 'Prototype DA, trace spatiale du mouvement' },
      { src: 'dumbo/052.webp', caption: 'Galerie de reconstructions volumétriques' },
      { src: 'dumbo/041.webp', caption: 'Segmentation SAM2' },
      { src: 'dumbo/061.webp', caption: 'Volume, présence 03' },
    ],
  },
  {
    slug: 'photographique-volume',
    title: 'Photographique Volume',
    tag: 'WebGL, Web Audio',
    cloud: 'photographique-volume/033.webp',
    text: 'Une expérience web qui redonne leur profondeur à des photographies sous-marines des Calanques, signées Nicolas Floc’h. Après plusieurs prototypes (particules, voxels, empilements d’images), j’ai combiné l’estimation de profondeur Depth Anything V2 à la luminance des pixels pour obtenir des volumes organiques plutôt que des aplats. Deux séries se croisent : l’une donne la structure, l’autre la couleur de l’eau. Sept volumes à traverser, du littoral vers le large, portés par une ambiance sonore en Web Audio.',
    infos: [
      ['Rôle', 'Conception, DA, développement'],
      ['Stack', 'Three.js, WebGL, Web Audio API'],
      ['IA', 'Depth Anything V2'],
      ['Année', '2025 — 2026'],
    ],
    link: { label: 'Ouvrir le projet', href: 'https://holosene.github.io/photographique-volume' },
    media: [
      { src: 'photographique-volume/034.webp', caption: 'Vue de l’expérience web' },
      { src: 'photographique-volume/036.webp', caption: 'Test de projection en salle d’exposition 3D' },
      { src: 'photographique-volume/029.webp', caption: 'Volume photographique, état 01' },
      { src: 'photographique-volume/030.webp', caption: 'Volume photographique, état 03' },
      { src: 'photographique-volume/031.webp', caption: 'Volume photographique, état 07' },
      { src: 'photographique-volume/028.webp', caption: 'Depth Anything V2 et détection de luminance' },
      { src: 'photographique-volume/027.webp', caption: 'Carte de profondeur colorisée' },
      { src: 'photographique-volume/017.webp', caption: 'Prototype, bloc photographique avec densité' },
      { src: 'photographique-volume/018.webp', caption: 'Décomposition en particules' },
      { src: 'photographique-volume/033.webp', caption: 'Source : Nicolas Floc’h, « Invisible »' },
    ],
  },
  {
    slug: '4derives',
    title: '4Dérives',
    tag: 'Film, 4D Splatting',
    cloud: '4derives/080.webp',
    text: 'Un court film tourné en GoPro au fil d’une descente de rivière, structuré en trois saisons (automne, hiver, printemps) par l’étalonnage, le montage et le son. Le projet se prolonge en R&D : reconstruire la scène en 4D Gaussian Splatting pour étendre l’espace au-delà du cadre filmé et libérer la caméra. Les outils actuels montrent leurs limites dans une production légère, et cet écart entre l’image linéaire et l’espace qu’elle contient est devenu le sujet du projet.',
    infos: [
      ['Rôle', 'Captation, montage, étalonnage, R&D 3D'],
      ['Outils', 'DaVinci Resolve, 4D Gaussian Splatting, Luma AI'],
      ['Année', '2025 — 2026'],
    ],
    link: { label: 'Voir le film', href: 'https://www.youtube.com/watch?v=1lXEIx5jFCQ' },
    media: [
      { youtube: '1lXEIx5jFCQ', poster: '4derives/084.webp', caption: 'Film 4Dérives' },
      { src: '4derives/080.webp', caption: 'Automne' },
      { src: '4derives/078.webp', caption: 'Hiver' },
      { src: '4derives/082.webp', caption: 'Printemps' },
      { src: '4derives/086.webp', caption: 'Extension du cadre, après traitement' },
      { src: '4derives/073.webp', caption: 'Caméra libre dans un volume 4D' },
      { src: '4derives/075.webp', caption: '4D Shape of Motion' },
      { src: '4derives/077.webp', caption: 'Rendu 3D, Luma AI' },
      { src: '4derives/067.webp', caption: 'Outil de production' },
    ],
  },
  {
    slug: 'mondes-immerges',
    title: 'Mondes Immergés',
    tag: 'Édition, recherche',
    cloud: 'mondes-immerges/004.webp',
    text: 'Un article de recherche édité, réalisé pour le DNMADe Design numérique, autour d’une question : comment le design immersif peut-il rendre perceptibles des milieux aquatiques en dégradation ? Il analyse des dispositifs existants et développe des expérimentations graphiques à partir de données scientifiques : particules, aurores boréales, déformations. C’est la base théorique des projets qui ont suivi.',
    infos: [
      ['Cadre', 'DNMADe Design numérique'],
      ['Rôle', 'Recherche, écriture, mise en page'],
      ['Outils', 'InDesign, Photoshop, outils génératifs'],
      ['Année', '2025'],
    ],
    link: { label: 'Lire l’article', href: 'https://indd.adobe.com/view/dc3c7dff-f28e-4969-9c00-527dc66c4321' },
    media: [
      { src: 'mondes-immerges/011.webp', caption: 'Couverture' },
      { src: 'mondes-immerges/013.webp', caption: 'Page d’ouverture' },
      { src: 'mondes-immerges/012.webp', caption: 'Expérimentation volumétrique' },
      { src: 'mondes-immerges/010.webp', caption: 'Expérimentation graphique' },
      { src: 'mondes-immerges/004.webp', caption: 'Exploration et dégradation visuelle' },
      { src: 'mondes-immerges/009.webp', caption: 'Aurores boréales en particules dynamiques' },
      { src: 'mondes-immerges/005.webp', caption: 'Visualisation de données scientifiques' },
    ],
  },
]
