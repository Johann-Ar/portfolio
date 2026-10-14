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
 * Textes traduits : L('français', 'english') (bouton FR / EN).
 */

import { L } from './i18n.js'

export const site = {
  name: 'Johann Arata',
  role: L('Designer numérique', 'Digital designer'),
  location: 'France',
  email: 'arata.johann@gmail.com',
  phone: '+33 7 71 70 25 85',
  intro: L(
    'Designer numérique. Je transforme des images réelles en espaces 3D à explorer dans le navigateur.',
    'Digital designer. I turn real images into 3D spaces you can explore in the browser.',
  ),
  socials: [
    { label: 'Mail', href: 'mailto:arata.johann@gmail.com' },
    { label: 'GitHub', href: 'https://github.com/holosene' },
    { label: 'YouTube', href: 'https://www.youtube.com/watch?v=1lXEIx5jFCQ' },
  ],
}

/** Grand bloc de mots : compétences listées dans le CV. */
export const skills = [
  'Three.js',
  'WebGL',
  'Shaders',
  'Gaussian Splatting',
  L('IA pour l’image', 'AI imaging'),
  'JavaScript',
  'React',
  L('Vidéo', 'Video'),
  L('Étalonnage', 'Colour grading'),
  'After Effects',
  L('Suite Adobe', 'Adobe Suite'),
]

export const about = [
  L(
    'Designer numérique, je suis en **master Design numérique** à la Faculté des arts de Strasbourg, après un DNMADe Design numérique.',
    'I’m a digital designer, studying for a **master’s in Digital Design** at the Faculty of Arts in Strasbourg, after a three-year design degree (DNMADe).',
  ),
  L(
    'Je pars d’**images réelles** — photos sous-marines, vidéos de grands fonds, une rivière filmée en GoPro — pour en faire des **espaces 3D à parcourir**. Je les développe moi-même, en Three.js, avec l’IA pour lire la profondeur et isoler les formes.',
    'I start from **real images** — underwater photographs, deep-sea footage, a river filmed on a GoPro — and turn them into **3D spaces you can move through**. I build them myself in Three.js, using AI to read depth and isolate shapes.',
  ),
  L('Je cherche un **stage en design numérique et 3D temps réel**.', 'I’m looking for an **internship in digital design and real-time 3D**.'),
]

export const timeline = [
  {
    title: L('Formation', 'Education'),
    items: [
      { year: '2026 —', name: L('Master Design numérique', 'Master’s in Digital Design'), detail: L('Faculté des arts, Université de Strasbourg', 'Faculty of Arts, University of Strasbourg') },
      { year: '2025 — 26', name: L('Année de césure', 'Gap year'), detail: L('Projets personnels autour des milieux naturels', 'Personal projects on natural environments') },
      { year: '2022 — 25', name: L('DNMADe Design numérique', 'DNMADe in Digital Design'), detail: L('Lycée René Goscinny, Drap', 'Three-year design degree, Lycée René Goscinny, Drap') },
      { year: '2019 — 22', name: L('Baccalauréat général', 'French baccalaureate'), detail: 'Lycée La Saulaie' },
    ],
  },
  {
    title: L('Expériences', 'Experience'),
    items: [
      { year: '2024', name: L('Stage, Le Hublot, Nice', 'Internship, Le Hublot, Nice'), detail: L('Centre de création numérique : identité graphique, supports de communication', 'Digital arts centre: visual identity, communication materials') },
      { year: '2023', name: L('Stage, CréapiConcept, Nice', 'Internship, CréapiConcept, Nice'), detail: L('Conception visuelle, production d’images', 'Visual design, image production') },
      { year: '2022', name: L('Workshop MuséoMix', 'MuséoMix workshop'), detail: L('Musée des Arts asiatiques, Nice : un dispositif de médiation conçu en équipe', 'Museum of Asian Arts, Nice: a visitor experience designed as a team') },
    ],
  },
  {
    title: L('Outils', 'Tools'),
    items: [
      { year: '3D', name: 'Three.js, WebGL, shaders', detail: 'Gaussian Splatting' },
      { year: L('IA', 'AI'), name: L('Segmentation, profondeur', 'Segmentation, depth'), detail: 'SAM2, Depth Anything V2' },
      { year: 'Dev', name: 'JavaScript, HTML/CSS, React', detail: '' },
      { year: 'Image', name: 'DaVinci Resolve, After Effects', detail: 'Photoshop, Illustrator, InDesign' },
      { year: L('Langues', 'Languages'), name: L('Français, anglais B2', 'French, English (B2)'), detail: '' },
    ],
  },
]

const personal = L('Projet personnel', 'Personal project')
const CONTEXT = L('Cadre', 'Context')
const TOOLS = L('Outils', 'Tools')
const YEAR = L('Année', 'Year')
const SOURCES = L('Sources', 'Sources')
const OPEN = L('Ouvrir le projet', 'Open the project')

export const projects = [
  {
    slug: 'dumbo',
    title: 'Dumbo',
    year: '2026',
    tag: L('Three.js, IA', 'Three.js, AI'),
    cloud: 'dumbo/cover.webp',
    text: L(
      'Des vidéos de grands fonds du Schmidt Ocean Institute deviennent des volumes à parcourir. L’IA isole les créatures, la lumière de chaque pixel lui donne sa profondeur. On circule ensuite dans une galerie, à la première personne, pour approcher une créature abyssale comme une sculpture.',
      'Deep-sea footage from the Schmidt Ocean Institute turned into volumes you can walk around. AI isolates the creatures; the brightness of each pixel gives it depth. You then move through a first-person gallery and approach a deep-sea creature like a sculpture.',
    ),
    infos: [
      [CONTEXT, personal],
      [SOURCES, L('Vidéos de submersibles, Schmidt Ocean Institute', 'Submersible footage, Schmidt Ocean Institute')],
      [TOOLS, 'Three.js, WebGL, SAM2'],
      [YEAR, '2026'],
    ],
    link: { label: OPEN, href: 'https://holosene.github.io/dumbo-biovolume/' },
    media: [
      { src: 'dumbo/058.webp', alt: L('Volume créé à partir d’une vidéo de submersible', 'Volume built from submersible footage') },
      { src: 'dumbo/053.webp', alt: L('La vidéo source mise en volume', 'The source footage turned into a volume') },
      { src: 'dumbo/054.webp', alt: L('Le volume vu de côté', 'The volume seen from the side') },
      { src: 'dumbo/057.webp', alt: L('L’espace Dumbo, près d’un mur', 'The Dumbo space, close to a wall') },
      { src: 'dumbo/056.webp', alt: L('L’espace Dumbo, l’entrée', 'The Dumbo space, the entrance') },
      { src: 'dumbo/046.webp', alt: L('Prototype à partir de la lumière de l’image', 'Prototype based on image brightness') },
      { src: 'dumbo/048.webp', alt: L('Direction artistique : trace du mouvement d’un requin', 'Art direction: trail of a shark’s movement') },
      { src: 'dumbo/052.webp', alt: L('Galerie de volumes', 'Gallery of volumes') },
      { src: 'dumbo/041.webp', alt: L('L’IA isole le sujet de l’image', 'AI isolating the subject') },
      { src: 'dumbo/061.webp', alt: L('Volume d’une créature', 'Volume of a creature') },
    ],
  },
  {
    slug: 'photographique-volume',
    title: 'Photographique Volume',
    year: '2025 — 26',
    tag: L('Three.js, son', 'Three.js, sound'),
    cloud: 'photographique-volume/cover.webp',
    text: L(
      'Les photographies sous-marines de Nicolas Floc’h, prises dans les Calanques, deviennent des paysages 3D. L’IA reconstruit la profondeur, la lumière de l’image l’affine. Deux séries se croisent : « Invisible » donne la forme, « La Couleur de l’eau » la couleur. Sept images, du rivage vers le large.',
      'Nicolas Floc’h’s underwater photographs of the Calanques turned into 3D landscapes. AI rebuilds the depth, the light in the image refines it. Two series meet: “Invisible” gives the shape, “La Couleur de l’eau” the colour. Seven images, from the shore out to the open sea.',
    ),
    infos: [
      [CONTEXT, personal],
      [SOURCES, L('Photographies de Nicolas Floc’h, Calanques, 2018 — 2020', 'Photographs by Nicolas Floc’h, Calanques, 2018 — 2020')],
      [TOOLS, 'Three.js, WebGL, Web Audio, Depth Anything V2'],
      [YEAR, '2025 — 2026'],
    ],
    link: { label: OPEN, href: 'https://holosene.github.io/photographique-volume' },
    media: [
      { src: 'photographique-volume/034.webp', alt: L('Le site web', 'The website') },
      { src: 'photographique-volume/036.webp', alt: L('Test de projection dans une salle d’exposition 3D', 'Projection test in a 3D exhibition room') },
      { src: 'photographique-volume/029.webp', alt: L('Volume photographique, état 01', 'Photographic volume, state 01') },
      { src: 'photographique-volume/030.webp', alt: L('Volume photographique, état 03', 'Photographic volume, state 03') },
      { src: 'photographique-volume/031.webp', alt: L('Volume photographique, état 07', 'Photographic volume, state 07') },
      { src: 'photographique-volume/028.webp', alt: L('Profondeur reconstruite par l’IA et la lumière', 'Depth rebuilt from AI and light') },
      { src: 'photographique-volume/027.webp', alt: L('Version colorisée', 'Coloured version') },
      { src: 'photographique-volume/017.webp', alt: L('Prototype : bloc photographique', 'Prototype: photographic block') },
      { src: 'photographique-volume/018.webp', alt: L('Prototype : photographie en particules', 'Prototype: photograph as particles') },
      { src: 'photographique-volume/033.webp', alt: L('Nicolas Floc’h, série Invisible', 'Nicolas Floc’h, Invisible series') },
    ],
  },
  {
    slug: '4derives',
    title: '4Dérives',
    year: '2025 — 26',
    tag: L('Film, 3D', 'Film, 3D'),
    cloud: '4derives/cover.webp',
    text: L(
      'Une descente de rivière filmée en GoPro à hauteur d’yeux, en trois saisons : automne, hiver, printemps. L’étalonnage, la musique et le rythme font les variations. Des essais en 4D Gaussian Splatting prolongent l’espace hors du cadre, et montrent les limites des outils accessibles aujourd’hui.',
      'A river descent filmed on a GoPro at eye level, across three seasons: autumn, winter, spring. Grading, music and pace carry the changes. Tests in 4D Gaussian Splatting extend the space beyond the frame, and show the limits of today’s accessible tools.',
    ),
    infos: [
      [CONTEXT, personal],
      [L('Tournage', 'Shot on'), L('GoPro, à hauteur d’yeux', 'GoPro, at eye level')],
      [TOOLS, '4D Gaussian Splatting, Luma AI'],
      [YEAR, '2025 — 2026'],
    ],
    link: { label: L('Voir le film', 'Watch the film'), href: 'https://www.youtube.com/watch?v=1lXEIx5jFCQ' },
    media: [
      { youtube: '1lXEIx5jFCQ', poster: '4derives/084.webp', alt: L('Film 4Dérives', '4Dérives, the film') },
      { src: '4derives/080.webp', alt: L('Image du film, automne', 'Still from the film, autumn') },
      { src: '4derives/078.webp', alt: L('Image du film, hiver', 'Still from the film, winter') },
      { src: '4derives/082.webp', alt: L('Image du film, printemps', 'Still from the film, spring') },
      { src: '4derives/086.webp', alt: L('Image après traitement', 'Processed image') },
      { src: '4derives/073.webp', alt: L('Mouvement de caméra dans un volume 4D', 'Camera move inside a 4D volume') },
      { src: '4derives/075.webp', alt: L('Essai 4D Shape of Motion', '4D Shape of Motion test') },
      { src: '4derives/077.webp', alt: L('Rendu 3D Luma AI', 'Luma AI 3D render') },
      { src: '4derives/067.webp', alt: L('Outil de production', 'Production tool') },
    ],
  },
  {
    slug: 'mondes-immerges',
    title: 'Mondes Immergés',
    year: '2024 — 25',
    tag: L('Recherche', 'Research'),
    cloud: 'mondes-immerges/cover.webp',
    text: L(
      'Article de recherche de DNMADe : comment le design immersif peut-il rendre sensibles des milieux aquatiques qui se dégradent ? Il croise écologie et représentation visuelle, analyse des dispositifs existants et propose des expérimentations graphiques. Il pose les bases des projets qui ont suivi.',
      'Research paper written during my design degree: how can immersive design make damaged aquatic environments felt? It brings ecology and visual representation together, reviews existing works and proposes graphic experiments. It laid the groundwork for the projects that followed.',
    ),
    infos: [
      [CONTEXT, L('DNMADe Design numérique, Lycée René Goscinny', 'DNMADe in Digital Design, Lycée René Goscinny')],
      ['Format', L('Article de recherche édité', 'Published research paper')],
      [YEAR, '2024 — 2025'],
    ],
    link: { label: L('Lire l’article', 'Read the paper'), href: 'https://indd.adobe.com/view/dc3c7dff-f28e-4969-9c00-527dc66c4321' },
    media: [
      { src: 'mondes-immerges/011.webp', alt: L('Couverture du livre Mondes Immergés', 'Cover of Mondes Immergés') },
      { src: 'mondes-immerges/013.webp', alt: L('Page d’ouverture', 'Opening spread') },
      { src: 'mondes-immerges/012.webp', alt: L('Expérimentation en volume', 'Volume experiment') },
      { src: 'mondes-immerges/010.webp', alt: L('Expérimentation graphique', 'Graphic experiment') },
      { src: 'mondes-immerges/004.webp', alt: L('Exploration et dégradation visuelle', 'Visual exploration and degradation') },
      { src: 'mondes-immerges/009.webp', alt: L('Aurores boréales transformées en particules', 'Northern lights turned into particles') },
      { src: 'mondes-immerges/005.webp', alt: L('Données scientifiques mises en image', 'Scientific data made visual') },
    ],
  },
]
