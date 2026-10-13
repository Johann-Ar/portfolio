/**
 * Tout le contenu éditorial du site.
 * Modifier ce fichier suffit pour changer les textes, l'ordre des projets ou les images.
 *
 * Médias : chemins relatifs à public/media/ (générés par `npm run media` depuis media-src/).
 * Types de médias dans une galerie :
 *   { type: 'image', src, caption }
 *   { type: 'pair', items: [image, image] }        deux images empilées
 *   { type: 'youtube', id, poster, caption }        vidéo chargée seulement au clic
 *   { type: 'text', label, title, body: [..] }      carte de texte dans la galerie
 */

export const site = {
  name: 'Johann Arata',
  role: 'Artiste visuel',
  tagline: 'Image, espace et captation',
  location: 'Auvergne-Rhône-Alpes, France',
  email: 'arata.johann@gmail.com',
  intro:
    'Artiste visuel. Je pars de captations environnementales réelles et je les traduis en volumes, en espaces et en images que l’on peut traverser.',
  socials: [
    { label: 'Mail', href: 'mailto:arata.johann@gmail.com' },
    { label: 'GitHub', href: 'https://github.com/holosene' },
    { label: 'YouTube', href: 'https://www.youtube.com/watch?v=1lXEIx5jFCQ' },
  ],
}

/** Grand bloc de mots-clés (équivalent du bloc « compétences » du site de référence). */
export const practice = [
  'Captation',
  'Luminance',
  'Profondeur',
  'Volume',
  'Segmentation IA',
  'Gaussian Splatting',
  'Three.js',
  'WebGL',
  'Vidéo',
  'Étalonnage',
  'Son',
  'Édition',
]

/** Texte « à propos ». Les segments entre ** sont mis en gras. */
export const about = [
  'Un photographe documente des fonds sous-marins aux Calanques. Un submersible enregistre une créature à 3000 mètres. Une GoPro capte la descente d’une rivière. Chacune produit une image qui répond à une fonction : **documenter, transmettre, archiver**.',
  'Mes travaux partent de ce que ces images contiennent **au-delà de cette fonction**. La structure lumineuse d’une photographie sous-marine contient une profondeur que la mise à plat lui a retirée. Une captation de submersible contient la trace d’une présence dans l’obscurité. Une vidéo de rivière filmée à hauteur de corps contient un rythme, une saison, une résistance physique.',
  'Chaque projet teste une hypothèse de traduction : **comment ce qui a été capté peut-il devenir perceptible autrement qu’en image plate ?**',
]

export const research = {
  label: 'Pré-projet de mémoire',
  title: 'Ce que l’image a capté sans pouvoir le montrer',
  body: [
    'Recherche sur la captation documentaire comme matière perceptive. Dans 4Dérives, je filme une rivière en continu et je cherche ce que le cadre n’a pas pu retenir. Dans Dumbo, je pars d’une vidéo scientifique et je teste jusqu’où elle peut produire autre chose qu’une preuve. Dans Photographique Volume, je prends une photographie documentaire et je lui redonne la profondeur que la prise de vue lui a retirée.',
    'Trois projets, une seule question : ce que l’image a déjà enregistré, comment le rendre perceptible sans le trahir ?',
  ],
}

export const timeline = [
  {
    title: 'Formation',
    items: [
      { year: '2025 — 2026', name: 'Année de césure', detail: 'Développement de projets de captation et de traduction spatiale des milieux naturels.' },
      { year: '2022 — 2025', name: 'DNMADe mention Design numérique', detail: 'Lycée René Goscinny, Drap (06). 180 ECTS.' },
      { year: '2019 — 2022', name: 'Baccalauréat général', detail: 'Lycée La Saulaie (38).' },
    ],
  },
  {
    title: 'Expériences',
    items: [
      { year: '2024', name: 'Le Hublot, centre de création numérique, Nice', detail: 'Stage. Création visuelle, identité graphique, supports de communication.' },
      { year: '2023', name: 'CréapiConcept, designer freelance, Nice', detail: 'Stage. Pratique indépendante de la conception visuelle et de la production d’images.' },
      { year: '2022', name: 'Workshop MuséoMix, Musée des Arts Asiatiques, Nice', detail: 'Conception collective d’un dispositif de médiation entre espace, image et visiteur.' },
    ],
  },
  {
    title: 'Outils',
    items: [
      { year: 'Image', name: 'Captation vidéo, montage, étalonnage', detail: 'DaVinci Resolve, After Effects.' },
      { year: 'Espace', name: 'Visualisation 3D temps réel', detail: 'Three.js, WebGL, shaders, Gaussian Splatting.' },
      { year: 'IA', name: 'Outils appliqués à l’image', detail: 'Segmentation (SAM2), estimation de profondeur (Depth Anything V2).' },
      { year: 'Design', name: 'Suite Adobe', detail: 'Photoshop, Illustrator, InDesign. Interfaces en JavaScript, HTML/CSS, React.' },
      { year: 'Langues', name: 'Français, anglais (B2)', detail: '' },
    ],
  },
]

export const projects = [
  {
    slug: 'dumbo',
    title: 'Dumbo',
    subtitle: 'Présences aquatiques rares',
    year: '2026',
    medium: 'WebGL',
    cloud: 'dumbo/041.webp',
    question: 'Comment transformer une image documentaire en présence spatiale traversable ?',
    intro: [
      'Traduction de vidéos scientifiques en espaces explorables. Des captations de submersibles du Schmidt Ocean Institute deviennent des volumes navigables, disposés comme les œuvres d’une galerie.',
      'Pas de reconstitution, pas de fiction : la luminance de chaque pixel détermine sa profondeur dans l’espace. La même lumière qui a servi à filmer sert à construire la forme.',
    ],
    infos: [
      ['Année', '2026'],
      ['Sources', 'Captations de submersibles, Schmidt Ocean Institute'],
      ['Outils', 'Three.js, WebGL, SAM2'],
    ],
    link: { label: 'Voir l’expérience', href: 'https://holosene.github.io/dumbo-biovolume/' },
    media: [
      { type: 'image', src: 'dumbo/058.webp', caption: 'Volume généré par la luminance d’une captation ROV' },
      { type: 'image', src: 'dumbo/054.webp', caption: 'Le point de vue change radicalement l’aspect de la projection' },
      {
        type: 'text',
        label: 'Expérimentation',
        title: 'Traduire une vidéo en volume',
        body: [
          'L’objectif n’est pas de produire une reconstruction réaliste, mais de comprendre comment un signal visuel peut devenir une matière spatiale.',
          'Une segmentation par réseau neuronal (SAM2) isole d’abord les formes vivantes dans l’image. La luminance sert ensuite de valeur de translation : chaque pixel devient un point dont la profondeur est déterminée par son intensité lumineuse.',
        ],
      },
      { type: 'image', src: 'dumbo/048.webp', caption: 'Prototype DA, le mouvement du requin produit une trace spatiale étendue' },
      { type: 'image', src: 'dumbo/046.webp', caption: 'Prototype luminance, les zones lumineuses produisent une variété de points plus riche' },
      {
        type: 'pair',
        items: [
          { src: 'dumbo/041.webp', caption: 'Traitement SAM2, la segmentation isole le sujet' },
          { src: 'dumbo/039.webp', caption: 'Traitement SAM2' },
        ],
      },
      {
        type: 'text',
        label: 'Expérimentation',
        title: 'Construire un espace navigable',
        body: [
          'Les volumes générés à partir de la vidéo sont intégrés dans un espace navigable, disposés comme des écrans.',
          'La perception du volume dépend autant de la position des écrans et de l’échelle de l’espace que de la reconstruction volumétrique elle-même.',
        ],
      },
      { type: 'image', src: 'dumbo/051.webp', caption: 'Réglage des écrans de projection' },
      { type: 'image', src: 'dumbo/052.webp', caption: 'L’espace fonctionne comme une galerie où l’on circule entre les reconstructions' },
      {
        type: 'text',
        label: 'Choix créatif',
        title: 'Dispositif d’exposition',
        body: [
          'Le visiteur se déplace en première personne, sujet à la gravité, sur un sol. Il marche vers la créature. Il choisit sa distance.',
          'Ce n’est pas un environnement aquatique mais une galerie. Approcher une créature abyssale comme on s’approche d’une sculpture.',
        ],
      },
      { type: 'image', src: 'dumbo/055.webp', caption: 'Image d’inspiration, Musée Océanographique de Monaco' },
      { type: 'image', src: 'dumbo/053.webp', caption: 'La source documentaire reste visible : elle n’est pas dégradée, seulement mise en volume' },
      { type: 'image', src: 'dumbo/057.webp', caption: 'Vue de l’espace Dumbo, proche d’un mur' },
      { type: 'image', src: 'dumbo/056.webp', caption: 'Vue de l’espace Dumbo, l’entrée' },
      {
        type: 'text',
        label: 'Ouverture',
        title: 'Un protocole reproductible',
        body: [
          'Ces volumes ne représentent pas une créature. Ils traduisent sa luminosité dans l’espace : la lumière captée à 3000 mètres détermine le relief de ce que le visiteur traverse.',
          'Si la traduction par luminance fonctionne pour la vidéo ROV, elle peut fonctionner pour d’autres captations, d’autres instruments, d’autres milieux.',
        ],
      },
      {
        type: 'pair',
        items: [
          { src: 'dumbo/060.webp', caption: 'Volume, présence 02' },
          { src: 'dumbo/061.webp', caption: 'Volume, présence 03' },
        ],
      },
    ],
  },
  {
    slug: 'photographique-volume',
    title: 'Photographique Volume',
    subtitle: 'Lumière captée, profondeur restituée',
    year: '2025 — 2026',
    medium: 'WebGL',
    cloud: 'photographique-volume/033.webp',
    question: 'Comment redonner une profondeur à une image que la photographie a aplatie ?',
    intro: [
      'Transformation de photographies sous-marines en environnements 3D. Exploration de la profondeur à partir de la luminance et navigation interactive.',
      'Le projet restitue à l’image la dimension que le capteur lui avait retirée. Il ne reconstitue pas : il traduit ce qui a été capté.',
    ],
    infos: [
      ['Année', '2025 — 2026'],
      ['Sources', 'Photographies de Nicolas Floc’h, Calanques 2018 — 2020'],
      ['Outils', 'Three.js, WebGL, Web Audio API, Depth Anything V2'],
    ],
    link: { label: 'Voir l’expérience', href: 'https://holosene.github.io/photographique-volume' },
    media: [
      { type: 'image', src: 'photographique-volume/034.webp', caption: 'Vue site web' },
      { type: 'image', src: 'photographique-volume/036.webp', caption: 'Maquette web, test de projection dans une salle d’exposition 3D' },
      {
        type: 'text',
        label: 'Expérimentation',
        title: 'Prospection technique',
        body: [
          'La question n’est pas de reconstruire un relief exact, mais de préserver la trace lumineuse captée par la photographie.',
          'Les premiers prototypes explorent différentes approches : nuages de particules, voxels, empilements d’images. Ils permettent d’identifier ce qui fait apparaître un volume perceptible et une image reconnaissable.',
        ],
      },
      { type: 'image', src: 'photographique-volume/016.webp', caption: 'Prototype, bloc photographique sans reliefs de profondeur' },
      { type: 'image', src: 'photographique-volume/017.webp', caption: 'Prototype, bloc photographique avec densité' },
      {
        type: 'pair',
        items: [
          { src: 'photographique-volume/018.webp', caption: 'Décomposition photographique en particules, état 01' },
          { src: 'photographique-volume/021.webp', caption: 'Décomposition photographique en particules, état 02' },
        ],
      },
      {
        type: 'text',
        label: 'Expérimentation',
        title: 'Décision de traduction',
        body: [
          'J’ai ensuite reconstruit la profondeur par intelligence artificielle. Depth Anything V2 analyse la structure photographique et produit une estimation géométrique de la scène. Le volume obtenu est plus précis dans ses formes, mais il imposait une interprétation calculée sur ce que le capteur avait enregistré dans l’eau.',
          'J’ai donc combiné cette analyse à la luminance des pixels pour atténuer l’effet d’aplats et retrouver des volumes organiques.',
        ],
      },
      { type: 'image', src: 'photographique-volume/024.webp', caption: 'Volume traité par Depth Anything V2' },
      { type: 'image', src: 'photographique-volume/028.webp', caption: 'Volume traité par Depth Anything V2 et détection de luminance' },
      {
        type: 'pair',
        items: [
          { src: 'photographique-volume/022.webp', caption: 'Photographie non analysée, non traitée' },
          { src: 'photographique-volume/023.webp', caption: 'Photographie analysée et traitée' },
        ],
      },
      { type: 'image', src: 'photographique-volume/025.webp', caption: 'Sans traitement' },
      { type: 'image', src: 'photographique-volume/026.webp', caption: 'Avec traitement Depth Anything V2' },
      { type: 'image', src: 'photographique-volume/027.webp', caption: 'Avec traitement colorisé' },
      {
        type: 'text',
        label: 'Choix créatif',
        title: 'Double source photographique',
        body: [
          'Deux séries de Nicolas Floc’h, réalisées aux mêmes endroits à la même période. Invisible fournit la structure : paysages sous-marins en noir et blanc. La couleur de l’eau fournit la couleur : relevé chromatique de la colonne d’eau, profondeur par profondeur.',
          'Les sept images de l’expérience suivent un ordre géographique, du littoral vers le large. Naviguer dans l’expérience, c’est traverser le parc sous-marin des Calanques.',
        ],
      },
      { type: 'image', src: 'photographique-volume/033.webp', caption: 'Nicolas Floc’h, « Invisible »' },
      { type: 'image', src: 'photographique-volume/032.webp', caption: 'Nicolas Floc’h, « La couleur de l’eau »' },
      { type: 'image', src: 'photographique-volume/029.webp', caption: 'Volume photographique, état 01' },
      { type: 'image', src: 'photographique-volume/030.webp', caption: 'Volume photographique, état 03' },
      { type: 'image', src: 'photographique-volume/031.webp', caption: 'Volume photographique, état 07' },
      {
        type: 'text',
        label: 'Ouverture',
        title: 'Ce que révèle le projet',
        body: [
          'Si une image photographique contient déjà une structure lumineuse capable de produire un volume, cette logique pourrait s’appliquer à d’autres formes de captation : relevés acoustiques, scans, mesures environnementales.',
          'Mais lorsque le milieu devient rare et difficile d’accès, comment valoriser les fragments que nous parvenons à capter ?',
        ],
      },
      { type: 'image', src: 'photographique-volume/035.webp', caption: 'Vue site web, caméra orientée sur le côté' },
    ],
  },
  {
    slug: '4derives',
    title: '4Dérives',
    subtitle: 'La rivière au-delà du cadre',
    year: '2025 — 2026',
    medium: 'Film — 4D',
    cloud: '4derives/080.webp',
    question: 'L’espace que le cadre a traversé peut-il rester présent après l’avoir quitté ?',
    intro: [
      'Captation GoPro d’une descente de rivière, structurée en trois états saisonniers : automne, hiver, printemps. L’étalonnage, la musique et le rythme construisent ces variations.',
      'Le film se prolonge par une recherche en reconstruction volumétrique (4D Gaussian Splatting) visant à étendre l’espace au-delà du cadre initial.',
    ],
    infos: [
      ['Année', '2025 — 2026'],
      ['Captation', 'GoPro, point de vue à hauteur des yeux'],
      ['Outils', 'DaVinci Resolve, 4D Gaussian Splatting, Luma AI'],
    ],
    link: { label: 'Voir le film', href: 'https://www.youtube.com/watch?v=1lXEIx5jFCQ' },
    media: [
      { type: 'youtube', id: '1lXEIx5jFCQ', poster: '4derives/084.webp', caption: 'Film 4Dérives' },
      {
        type: 'text',
        label: 'Choix créatif',
        title: 'Un film, un dispositif',
        body: [
          'Une descente de rivière filmée en GoPro à hauteur des yeux.',
          'La narration ne passe pas par le commentaire, mais par les résistances et les flux que l’image et le son laissent apparaître.',
        ],
      },
      { type: 'image', src: '4derives/080.webp', caption: 'Frame, automne' },
      { type: 'image', src: '4derives/078.webp', caption: 'Frame, hiver' },
      { type: 'image', src: '4derives/082.webp', caption: 'Frame, printemps' },
      {
        type: 'text',
        label: 'Expérimentation',
        title: 'Extension du cadre',
        body: [
          'La 4D dynamique propose d’analyser la vidéo source afin d’en extraire une mémoire spatio-temporelle potentielle. La trajectoire de la caméra devient une lecture parmi d’autres d’un espace plus large.',
          'L’image n’est plus seulement une surface cadrée, mais l’indice d’un volume en partie latent.',
        ],
      },
      {
        type: 'pair',
        items: [
          { src: '4derives/087.webp', caption: 'Avant traitement' },
          { src: '4derives/086.webp', caption: 'Après traitement' },
        ],
      },
      { type: 'image', src: '4derives/073.webp', caption: 'Déplacement de caméra dans un volume 4D' },
      { type: 'image', src: '4derives/075.webp', caption: 'Expérimentations 4D Shape of Motion' },
      { type: 'image', src: '4derives/076.webp', caption: 'Rendu d’espace 3D, Luma AI' },
      { type: 'image', src: '4derives/077.webp', caption: 'Rendu 3D, Luma AI' },
      {
        type: 'text',
        label: 'Expérimentation',
        title: 'Ce que la mémoire 4D restitue',
        body: [
          'Il ne s’agit pas de reconstruire ce que la caméra n’a pas vu, mais d’étendre ce qu’elle a capté. Les bords de l’image deviennent les zones d’un espace déjà contenu dans le signal.',
          'Ce qui traverse le champ ne disparaît pas : il persiste en périphérie. La quatrième dérive désigne cette diffusion de l’image au-delà de son cadre.',
        ],
      },
      {
        type: 'pair',
        items: [
          { src: '4derives/068.webp', caption: 'Vue originale' },
          { src: '4derives/069.webp', caption: 'Vue traitée' },
        ],
      },
      { type: 'image', src: '4derives/067.webp', caption: 'Outil de production' },
      {
        type: 'text',
        label: 'Ouverture',
        title: 'Un écart comme espace de travail',
        body: [
          'Les expérimentations montrent les limites actuelles des outils accessibles pour produire une extension stable dans un cadre de production léger.',
          'Le projet met en évidence un écart entre une captation linéaire du réel et la possibilité d’en révéler une structure plus étendue. Cet écart ouvre vers des formes où l’image ne serait plus regardée, mais explorée.',
        ],
      },
    ],
  },
  {
    slug: 'mondes-immerges',
    title: 'Mondes Immergés',
    subtitle: 'Article de recherche',
    year: '2025',
    medium: 'Édition',
    cloud: 'mondes-immerges/004.webp',
    question: 'Comment le design immersif peut-il rendre perceptibles des milieux aquatiques en dégradation ?',
    intro: [
      'Article de recherche rédigé dans le cadre du DNMADe Design numérique, Lycée René Goscinny, Drap. Il croise sciences écologiques et pratiques de représentation visuelle.',
      'Il interroge les conditions dans lesquelles une image, photographique, vidéo ou issue d’un instrument, peut transmettre l’état d’un milieu à qui n’y a pas accès. Ce travail pose le cadre des questions que les projets suivants continuent d’explorer.',
    ],
    infos: [
      ['Année', '2024 — 2025'],
      ['Cadre', 'DNMADe Design numérique'],
      ['Outils', 'InDesign, Photoshop, expérimentations génératives'],
    ],
    link: { label: 'Lire l’article', href: 'https://indd.adobe.com/view/dc3c7dff-f28e-4969-9c00-527dc66c4321' },
    media: [
      { type: 'image', src: 'mondes-immerges/011.webp', caption: 'Livre, article de recherche Mondes Immergés' },
      {
        type: 'pair',
        items: [
          { src: 'mondes-immerges/013.webp', caption: 'Page d’ouverture et deuxième de couverture' },
          { src: 'mondes-immerges/012.webp', caption: 'Page d’expérimentation volumétrique' },
        ],
      },
      { type: 'image', src: 'mondes-immerges/010.webp', caption: 'Page d’expérimentation graphique' },
      {
        type: 'text',
        label: 'Ouverture',
        title: 'De la recherche aux projets',
        body: [
          'Les milieux aquatiques sont par nature des espaces immersifs pour l’humain, dont il s’est peu à peu éloigné. Le numérique peut permettre d’en retrouver une expérience sensible.',
          'Il ne s’agit pas d’illustrer des données, mais de les traduire en formes que l’on peut traverser.',
        ],
      },
      { type: 'image', src: 'mondes-immerges/004.webp', caption: 'Exploration et dégradation visuelle' },
      { type: 'image', src: 'mondes-immerges/007.webp', caption: 'Expérimentation graphique' },
      { type: 'image', src: 'mondes-immerges/005.webp', caption: 'Visualisation évocatrice de données scientifiques' },
      { type: 'image', src: 'mondes-immerges/008.webp', caption: 'Expérimentation graphique' },
      { type: 'image', src: 'mondes-immerges/009.webp', caption: 'Photographies d’aurores boréales transformées en particules dynamiques' },
    ],
  },
]
