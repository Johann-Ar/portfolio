varying vec4 vColor;
varying vec2 vScreen;
varying float vSize;
varying vec2 vCell;

uniform float uGlass;    // effet verre : bille, reflet spéculaire, bord lumineux
uniform float uReflect;  // intensité des couleurs du fond reflétées
uniform float uLight;
uniform float uAspect;
uniform float uVeilTint; // calque couleurs posé uniquement sur les points
uniform float uRgb;      // effet « pixels RVB » : chaque point devient un pixel d'écran OLED (PenTile) vu au microscope
uniform float uRgbGlow;  // halo lumineux autour des sous-pixels
uniform float uSizeFactor;
uniform float uShape; // forme des points : 0 rond, 1 carré, 2 losange


/**
 * Pixel d'écran vu au microscope. p : position dans le point (-1 à 1), y vers le haut.
 * Renvoie la couleur émise (prémultipliée) et la couverture dans alpha.
 */
vec4 subpixels(vec2 p, vec3 rgb, float aa) {
  vec3 col = vec3(0.0);
  float cover = 0.0;
  // le luminophore paraît plus intense que la moyenne du pixel : on compense la surface éteinte
  vec3 c = clamp(rgb, 0.0, 1.0);
  {
    // OLED PenTile : losanges ; les cases paires portent un vert (petit), les impaires rouge ou bleu (grand)
    float even = mod(vCell.x + vCell.y, 2.0);
    vec3 mask;
    float size;
    if (even < 0.5) {
      mask = vec3(0.0, 1.0, 0.0);
      size = 0.48;
    } else {
      mask = mod(vCell.x, 2.0) < 0.5 ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 0.0, 1.0);
      size = 0.72;
    }
    float d = (abs(p.x) + abs(p.y)) - size; // losange
    float shape = 1.0 - smoothstep(-aa * 1.4, aa * 1.4, d);
    float glow = exp(-max(d, 0.0) * 6.0) * uRgbGlow;
    // la sous-trame reçoit la couleur du pixel complet (le voisinage compense la teinte absente)
    float v = dot(c, mask) * 0.7 + dot(c, vec3(0.2126, 0.7152, 0.0722)) * 0.3;
    col = mask * v * (shape * 2.6 + glow * 0.9);
    cover = max(shape, glow * 0.6) * (0.25 + 0.75 * v);
  }
  return vec4(col, cover);
}

// Les couleurs du fond de la page (mêmes positions que le dégradé CSS .backdrop)
vec3 backdrop(vec2 uv) {
  vec2 p = vec2(uv.x, 1.0 - uv.y); // repère CSS : y vers le bas
  vec3 c[5];
  vec2 at[5];
  vec2 r[5];
  // RVB (mêmes positions que le calque .veil)
  c[0] = vec3(1.0, 0.0, 0.0); at[0] = vec2(0.12, 0.18); r[0] = vec2(0.70, 0.60); // rouge
  c[1] = vec3(0.0, 0.0, 1.0); at[1] = vec2(0.88, 0.14); r[1] = vec2(0.65, 0.60); // bleu
  c[2] = vec3(0.0, 1.0, 0.0); at[2] = vec2(0.84, 0.86); r[2] = vec2(0.70, 0.60); // vert
  c[3] = vec3(1.0, 0.0, 0.0); at[3] = vec2(0.14, 0.88); r[3] = vec2(0.65, 0.60); // rouge
  c[4] = vec3(0.0, 0.0, 1.0); at[4] = vec2(0.50, 0.50); r[4] = vec2(0.55, 0.50); // bleu
  vec3 sum = vec3(0.0);
  float wsum = 0.0;
  for (int i = 0; i < 5; i++) {
    float w = 1.0 - smoothstep(0.0, 0.72, length((p - at[i]) / r[i]));
    sum += c[i] * w;
    wsum += w;
  }
  return wsum > 0.001 ? sum / wsum : vec3(0.75);
}

void main() {
  if (vColor.a < 0.01) discard;
  vec2 q = gl_PointCoord * 2.0 - 1.0;
  q.y = -q.y;
  // distance « de forme » : rond, carré ou losange
  float sd = uShape < 0.5 ? length(q) : (uShape < 1.5 ? max(abs(q.x), abs(q.y)) : (abs(q.x) + abs(q.y)));
  float r2 = sd * sd;
  if (r2 > 1.0 && uRgb < 0.01) discard;
  float inside = step(r2, 1.0);

  // chaque point est une petite bille : normale de sphère
  vec3 n = vec3(q, sqrt(max(0.0, 1.0 - r2)));
  float fresnel = pow(1.0 - n.z, 2.0);
  float spec = pow(max(dot(n, normalize(vec3(-0.45, 0.55, 1.0))), 0.0), 28.0);

  // reflet : couleur du fond, légèrement déviée par la courbure de la bille
  vec3 env = backdrop(vScreen + n.xy * vec2(0.05 / max(uAspect, 0.01), 0.05));
  float envLum = dot(env, vec3(0.2126, 0.7152, 0.0722));
  env = clamp(mix(vec3(envLum), env, 1.0 + uReflect * 0.6), 0.0, 1.0);

  float baseLum = dot(vColor.rgb, vec3(0.2126, 0.7152, 0.0722));
  // thème clair : billes sombres qui se teintent ; thème sombre : billes claires teintées
  vec3 tinted = env * mix(0.7 + 0.5 * baseLum, 0.35 + 0.4 * baseLum, uLight);
  float refl = clamp(uGlass * uReflect * (0.4 + 0.6 * fresnel) * 0.55, 0.0, 1.0);
  vec3 rgb = mix(vColor.rgb, tinted, refl);
  rgb += spec * 0.55 * min(uGlass, 2.0) * mix(1.0, 0.6, uLight);
  rgb += fresnel * env * 0.25 * min(uGlass, 2.0);
  // calque couleurs « seulement sur les points » : teinte de la palette, à la luminosité du point
  vec3 veilCol = backdrop(vScreen) * (0.35 + 0.9 * max(max(rgb.r, rgb.g), rgb.b));
  rgb = mix(rgb, veilCol, clamp(uVeilTint, 0.0, 1.0));

  // bord lissé sur environ un pixel, quelle que soit la taille du point : disques nets
  float r = sqrt(r2);
  float aa = clamp(2.0 / vSize, 0.04, 0.6);
  float edge = 1.0 - smoothstep(1.0 - aa, 1.0, r);
  float alpha = inside * vColor.a * edge * mix(1.0, 0.65 + 0.35 * fresnel + spec, clamp(uGlass, 0.0, 1.0) * 0.5);

  // pixels RVB : le point devient un pixel d'écran (sous-pixels rouge, vert, bleu)
  if (uRgb > 0.001) {
    // coordonnées dans la case de la grille (le point peut déborder si la taille > 1) : joints noirs entre pixels
    vec2 cq = q * max(uSizeFactor, 0.05);
    float inCell = step(max(abs(cq.x), abs(cq.y)), 1.0);
    vec4 sp = subpixels(cq, rgb, clamp(2.5 / (vSize / max(uSizeFactor, 0.05)), 0.03, 0.5));
    sp *= inCell;
    vec3 spCol = sp.a > 0.0 ? sp.rgb / sp.a : vec3(0.0);
    float spA = sp.a * min(vColor.a * 1.4, 1.0);
    rgb = mix(rgb, spCol, uRgb);
    alpha = mix(alpha, spA, uRgb);
  }
  if (alpha < 0.004) discard;
  gl_FragColor = vec4(clamp(rgb, 0.0, 1.0), alpha);
}
