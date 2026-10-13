varying vec4 vColor;
varying vec2 vScreen;
varying float vSize;

uniform float uGlass;    // effet verre : bille, reflet spéculaire, bord lumineux
uniform float uReflect;  // intensité des couleurs du fond reflétées
uniform float uLight;
uniform float uAspect;
uniform float uVeilTint; // calque couleurs posé uniquement sur les points

// Les couleurs du fond de la page (mêmes positions que le dégradé CSS .backdrop)
vec3 backdrop(vec2 uv) {
  vec2 p = vec2(uv.x, 1.0 - uv.y); // repère CSS : y vers le bas
  vec3 c[5];
  vec2 at[5];
  vec2 r[5];
  c[0] = vec3(1.0, 0.596, 0.898);   at[0] = vec2(0.12, 0.18); r[0] = vec2(0.70, 0.60); // rose bonbon
  c[1] = vec3(0.698, 0.639, 0.914); at[1] = vec2(0.88, 0.14); r[1] = vec2(0.65, 0.60); // bleu lavande
  c[2] = vec3(0.596, 0.867, 0.745); at[2] = vec2(0.84, 0.86); r[2] = vec2(0.70, 0.60); // vert menthe
  c[3] = vec3(0.969, 0.600, 0.671); at[3] = vec2(0.14, 0.88); r[3] = vec2(0.65, 0.60); // rose corail
  c[4] = vec3(0.698, 0.639, 0.914); at[4] = vec2(0.50, 0.50); r[4] = vec2(0.55, 0.50); // bleu lavande
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
  float r2 = dot(q, q);
  if (r2 > 1.0) discard;

  // chaque point est une petite bille : normale de sphère
  vec3 n = vec3(q, sqrt(1.0 - r2));
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
  float alpha = vColor.a * edge * mix(1.0, 0.65 + 0.35 * fresnel + spec, clamp(uGlass, 0.0, 1.0) * 0.5);
  gl_FragColor = vec4(clamp(rgb, 0.0, 1.0), alpha);
}
