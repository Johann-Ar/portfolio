/**
 * Tout le contenu éditorial du site.
 * Modifier ce fichier suffit pour changer les textes, l'ordre des projets ou les images.
 * Règle : uniquement des informations issues du CV et du portfolio de Johann.
 *
 * Médias : chemins relatifs à public/media/ (générés par `npm run media` depuis media-src/).
 * Dans une galerie :
 *   { src, alt }                         image (alt : description pour l'accessibilité, non affichée)
 *   { youtube: 'id', poster, alt }       vidéo chargée seulement au clic
 * Dans un texte, les segments entre ** sont mis en gras.
 */

export const site = {
  name: 'Johann Arata',
  role: 'Designer numérique',
  location: 'Auvergne-Rhône-Alpes, France',
  email: 'arata.johann@gmail.com',
  intro:
    'Designer numérique. Je transforme des captations réelles en espaces 3D explorables dans le navigateur, avec Three.js et WebGL.',
  socials: [
    { label: 'Mail', href: 'mailto:arata.johann@gmail.com' },
    { label: 'GitHub', href: 'https://github.com/holosene' },
    { label: 'YouTube', href: 'https://www.youtube.com/watch?v=1lXEIx5jFCQ' },
  ],
}

/** Grand bloc de mots en tuiles : compétences listées dans le CV. */
export const skills = [
  'Three.js',
  'WebGL',
  'Shaders',
  'Gaussian Splatting',
  'Segmentation IA',
  'Estimation de profondeur',
  'JavaScript',
  'React',
  'Captation vidéo',
  'Étalonnage',
  'After Effects',
  'Suite Adobe',
]

export const about = [
  'Je suis **designer numérique**, formé en DNMADe Design numérique au lycée René Goscinny de Drap (2022 — 2025).',
  'Je travaille à partir de **captations réelles** : photographies sous-marines, vidéos de submersibles, une descente de rivière filmée en GoPro. Je les traduis en **volumes et en espaces navigables**, développés en **Three.js et WebGL**, avec des outils d’IA appliqués à l’image : segmentation (SAM2) et estimation de profondeur (Depth Anything V2).',
  'Je recherche un **stage en design numérique et 3D temps réel**.',
]

export const timeline = [
  {
    title: 'Formation',
    items: [
      { year: '2025 — 26', name: 'Année de césure', detail: 'Développement de projets de captation et de traduction spatiale des milieux naturels' },
      { year: '2022 — 25', name: 'DNMADe mention Design numérique', detail: 'Lycée René Goscinny, Drap (06), 180 ECTS' },
      { year: '2019 — 22', name: 'Baccalauréat général', detail: 'Lycée La Saulaie (38)' },
    ],
  },
  {
    title: 'Expériences',
    items: [
      { year: '2024', name: 'Stage, Le Hublot, Nice', detail: 'Centre de création numérique. Création visuelle, identité graphique, supports de communication' },
      { year: '2023', name: 'Stage, CréapiConcept, Nice', detail: 'Designer freelance. Conception visuelle et production d’images' },
      { year: '2022', name: 'Workshop MuséoMix', detail: 'Musée des Arts Asiatiques, Nice. Conception collective d’un dispositif de médiation' },
    ],
  },
  {
    title: 'Outils',
    items: [
      { year: '3D', name: 'Three.js, WebGL, shaders', detail: 'Gaussian Splatting' },
      { year: 'IA', name: 'Segmentation, profondeur', detail: 'SAM2, Depth Anything V2' },
      { year: 'Dev', name: 'JavaScript, HTML/CSS, React', detail: '' },
      { year: 'Image', name: 'DaVinci Resolve, After Effects', detail: 'Photoshop, Illustrator, InDesign' },
      { year: 'Langues', name: 'Français, anglais B2', detail: '' },
    ],
  },
]

export const projects = [
  {
    slug: 'dumbo',
    title: 'Dumbo',
    tag: 'Three.js, SAM2',
    cloud: 'dumbo/cover.webp',
    text: 'Des vidéos de submersibles du Schmidt Ocean Institute traduites en volumes navigables. La segmentation SAM2 isole les formes vivantes dans l’image, puis la luminance de chaque pixel détermine sa profondeur : chaque pixel devient un point dans l’espace. Les volumes sont disposés comme des écrans dans une galerie que l’on parcourt en première personne, pour s’approcher d’une créature abyssale comme d’une sculpture.',
    infos: [
      ['Cadre', 'Projet personnel'],
      ['Sources', 'Vidéos de submersibles, Schmidt Ocean Institute'],
      ['Outils', 'Three.js, WebGL, SAM2'],
      ['Année', '2026'],
    ],
    link: { label: 'Ouvrir le projet', href: 'https://holosene.github.io/dumbo-biovolume/' },
    media: [
      { src: 'dumbo/058.webp', alt: 'Volume généré à partir de la luminance d’une captation de submersible' },
      { src: 'dumbo/053.webp', alt: 'La source documentaire mise en volume dans l’espace' },
      { src: 'dumbo/054.webp', alt: 'Projection volumétrique vue de côté' },
      { src: 'dumbo/057.webp', alt: 'Vue de l’espace Dumbo, proche d’un mur' },
      { src: 'dumbo/056.webp', alt: 'Vue de l’espace Dumbo, l’entrée' },
      { src: 'dumbo/046.webp', alt: 'Prototype luminance' },
      { src: 'dumbo/048.webp', alt: 'Prototype de direction artistique, trace du mouvement d’un requin' },
      { src: 'dumbo/052.webp', alt: 'Galerie de reconstructions volumétriques' },
      { src: 'dumbo/041.webp', alt: 'Segmentation SAM2 isolant le sujet' },
      { src: 'dumbo/061.webp', alt: 'Volume d’une créature' },
    ],
  },
  {
    slug: 'photographique-volume',
    title: 'Photographique Volume',
    tag: 'Three.js, Web Audio',
    cloud: 'photographique-volume/cover.webp',
    text: 'Des photographies sous-marines de Nicolas Floc’h, prises dans les Calanques, transformées en environnements 3D. Après plusieurs prototypes (nuages de particules, voxels, empilements d’images), la profondeur est reconstruite avec Depth Anything V2, combinée à la luminance des pixels pour retrouver des volumes organiques. Deux séries se croisent : « Invisible » donne la structure, « La couleur de l’eau » donne la couleur. Les sept images suivent un ordre géographique, du littoral vers le large.',
    infos: [
      ['Cadre', 'Projet personnel'],
      ['Sources', 'Photographies de Nicolas Floc’h, Calanques, 2018 — 2020'],
      ['Outils', 'Three.js, WebGL, Web Audio API, Depth Anything V2'],
      ['Année', '2025 — 2026'],
    ],
    link: { label: 'Ouvrir le projet', href: 'https://holosene.github.io/photographique-volume' },
    media: [
      { src: 'photographique-volume/034.webp', alt: 'Vue du site web' },
      { src: 'photographique-volume/036.webp', alt: 'Test de projection de l’expérience dans une salle d’exposition 3D' },
      { src: 'photographique-volume/029.webp', alt: 'Volume photographique, état 01' },
      { src: 'photographique-volume/030.webp', alt: 'Volume photographique, état 03' },
      { src: 'photographique-volume/031.webp', alt: 'Volume photographique, état 07' },
      { src: 'photographique-volume/028.webp', alt: 'Volume traité par Depth Anything V2 et détection de luminance' },
      { src: 'photographique-volume/027.webp', alt: 'Traitement colorisé' },
      { src: 'photographique-volume/017.webp', alt: 'Prototype, bloc photographique avec densité' },
      { src: 'photographique-volume/018.webp', alt: 'Prototype, décomposition photographique en particules' },
      { src: 'photographique-volume/033.webp', alt: 'Nicolas Floc’h, série Invisible' },
    ],
  },
  {
    slug: '4derives',
    title: '4Dérives',
    tag: 'Film, 4D Gaussian Splatting',
    cloud: '4derives/cover.webp',
    text: 'Une descente de rivière filmée en GoPro à hauteur des yeux, structurée en trois états saisonniers : automne, hiver, printemps. L’étalonnage, la musique et le rythme construisent ces variations. Le film se prolonge par des expérimentations en 4D Gaussian Splatting pour étendre l’espace au-delà du cadre initial. Elles montrent les limites actuelles des outils accessibles dans un cadre de production léger.',
    infos: [
      ['Cadre', 'Projet personnel'],
      ['Captation', 'GoPro, point de vue à hauteur des yeux'],
      ['Outils', '4D Gaussian Splatting, Luma AI'],
      ['Année', '2025 — 2026'],
    ],
    link: { label: 'Voir le film', href: 'https://www.youtube.com/watch?v=1lXEIx5jFCQ' },
    media: [
      { youtube: '1lXEIx5jFCQ', poster: '4derives/084.webp', alt: 'Film 4Dérives' },
      { src: '4derives/080.webp', alt: 'Image du film, automne' },
      { src: '4derives/078.webp', alt: 'Image du film, hiver' },
      { src: '4derives/082.webp', alt: 'Image du film, printemps' },
      { src: '4derives/086.webp', alt: 'Image après traitement' },
      { src: '4derives/073.webp', alt: 'Déplacement de caméra dans un volume 4D' },
      { src: '4derives/075.webp', alt: 'Expérimentation 4D Shape of Motion' },
      { src: '4derives/077.webp', alt: 'Rendu 3D Luma AI' },
      { src: '4derives/067.webp', alt: 'Outil de production' },
    ],
  },
  {
    slug: 'mondes-immerges',
    title: 'Mondes Immergés',
    tag: 'Article de recherche',
    cloud: 'mondes-immerges/cover.webp',
    text: 'Article de recherche rédigé dans le cadre du DNMADe Design numérique : comment le design immersif peut-il rendre perceptibles des milieux aquatiques en dégradation ? Il croise sciences écologiques et pratiques de représentation visuelle, analyse plusieurs dispositifs existants et développe des expérimentations graphiques à partir de sources documentaires et scientifiques. Ce travail pose le cadre des projets qui ont suivi.',
    infos: [
      ['Cadre', 'DNMADe Design numérique, Lycée René Goscinny'],
      ['Format', 'Article de recherche édité'],
      ['Année', '2024 — 2025'],
    ],
    link: { label: 'Lire l’article', href: 'https://indd.adobe.com/view/dc3c7dff-f28e-4969-9c00-527dc66c4321' },
    media: [
      { src: 'mondes-immerges/011.webp', alt: 'Couverture du livre Mondes Immergés' },
      { src: 'mondes-immerges/013.webp', alt: 'Page d’ouverture et deuxième de couverture' },
      { src: 'mondes-immerges/012.webp', alt: 'Page d’expérimentation volumétrique' },
      { src: 'mondes-immerges/010.webp', alt: 'Page d’expérimentation graphique' },
      { src: 'mondes-immerges/004.webp', alt: 'Exploration et dégradation visuelle' },
      { src: 'mondes-immerges/009.webp', alt: 'Photographies d’aurores boréales transformées en particules dynamiques' },
      { src: 'mondes-immerges/005.webp', alt: 'Visualisation évocatrice de données scientifiques' },
    ],
  },
]
