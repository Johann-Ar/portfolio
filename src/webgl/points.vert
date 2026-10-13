attribute vec4 aFrom;      // xyz (relief) + taille de cellule
attribute vec4 aTo;
attribute vec4 aColFrom;   // rgb + présence
attribute vec4 aColTo;
attribute vec2 aToneFrom;  // opacité monochrome (thème sombre, thème clair)
attribute vec2 aToneTo;
attribute float aOffFrom;  // recul de l'image
attribute float aOffTo;
attribute vec4 aRand;
attribute vec3 aUv;        // position dans l'image + sens du ton (animation de l'image)

uniform sampler2D uImage;  // image affichée par les points
uniform float uAnim;       // animation de l'image (0 : figée)
uniform float uAnimSpeed;
uniform float uToneGain;

uniform float uTime;
uniform float uMix;
uniform float uDelaySpread;
uniform float uScroll;
uniform vec3 uMouse;
uniform float uMouseRadius;
uniform float uMouseForce;
uniform vec3 uColor;
uniform float uLight;
uniform float uColorMix;
uniform float uBlueMix;
uniform float uOpacity;
uniform float uOpacityMul;
uniform float uSizeFactor;
uniform float uDepthScale;
uniform float uPush;
uniform float uBreath;
uniform float uContrast; // contraste de l'image
uniform float uCamZ;
uniform float uCurve;     // courbure des images reculées : > 0 concave, < 0 sphérique
uniform float uViewH;     // hauteur visible du plan z = 0
uniform float uScreenScale;
uniform float uMotion;

varying vec4 vColor;
varying vec2 vScreen;
varying float vSize; // taille du point en pixels
varying vec2 vCell; // case de la grille d'origine (motif de sous-pixels) // position à l'écran (0 à 1), pour lire les couleurs du fond

uniform float uSmokeHover; // fumée renforcée sous la souris
uniform float uAspectRatio;

// ---- fumée : bruit de valeur 3D + fbm + déformation de domaine (domain warping) ----
float hash13(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.zyx + 31.32);
  return fract((p.x + p.y) * p.z);
}
float vnoise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(hash13(i), hash13(i + vec3(1, 0, 0)), f.x), mix(hash13(i + vec3(0, 1, 0)), hash13(i + vec3(1, 1, 0)), f.x), f.y),
    mix(mix(hash13(i + vec3(0, 0, 1)), hash13(i + vec3(1, 0, 1)), f.x), mix(hash13(i + vec3(0, 1, 1)), hash13(i + vec3(1, 1, 1)), f.x), f.y),
    f.z);
}
float fbm(vec3 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * vnoise(p);
    p = p * 2.03 + vec3(1.7, 9.2, 3.1);
    a *= 0.5;
  }
  return v;
}
// renvoie la position déformée (xy) et la densité de fumée (z)
vec3 smoke(vec2 uv, float t) {
  vec2 p = uv * vec2(uAspectRatio, 1.0) * 2.2;
  vec2 q = vec2(fbm(vec3(p, t * 0.06)), fbm(vec3(p + vec2(5.2, 1.3), t * 0.06)));
  vec2 r = vec2(fbm(vec3(p + 3.5 * q + vec2(1.7, 9.2), t * 0.09)), fbm(vec3(p + 3.5 * q + vec2(8.3, 2.8), t * 0.09)));
  float dens = fbm(vec3(p + 3.0 * r, t * 0.05));
  return vec3(r - 0.5, dens);
}

float easeInOutCubic(float t) {
  return t < 0.5 ? 4.0 * t * t * t : 1.0 - pow(-2.0 * t + 2.0, 3.0) / 2.0;
}

void main() {
  // morph avec décalage par point + dispersion à mi-parcours
  float local = clamp((uMix - aRand.x * uDelaySpread) / (1.0 - uDelaySpread), 0.0, 1.0);
  float m = easeInOutCubic(local);
  float burst = sin(3.14159265 * m);

  vec3 pos = mix(aFrom.xyz, aTo.xyz, m);
  pos.z *= uDepthScale;
  pos += (aRand.yzw - 0.5) * vec3(6.0, 6.0, 10.0) * burst;
  float cell = mix(aFrom.w, aTo.w, m);
  vec4 col = mix(aColFrom, aColTo, m);
  col.rgb = clamp((col.rgb - 0.5) * uContrast + 0.5, 0.0, 1.0);
  vec2 toneRaw = mix(aToneFrom, aToneTo, m);
  // fumée : les points restent fixes, l'image se déforme en volutes dessous ; plus forte sous la souris
  float baseOffEarly = mix(aOffFrom, aOffTo, m);
  float kEarly = (uCamZ + baseOffEarly + uPush) / uCamZ;
  float hoverF = smoothstep(uMouseRadius * 1.6 * kEarly, 0.0, length(pos.xy - uMouse.xy * kEarly)) * uMotion;
  float amt = uAnim + hoverF * uSmokeHover;
  if (amt > 0.001 && aColTo.a > 0.0) {
    float ta = uTime * uAnimSpeed;
    vec4 c0 = texture2D(uImage, aUv.xy);
    vec3 sm = smoke(aUv.xy, ta + hoverF * 2.0);
    vec2 wuv = clamp(aUv.xy + sm.xy * 0.045 * amt, 0.001, 0.999);
    vec3 c1 = texture2D(uImage, wuv).rgb;
    // densité : voile lumineux qui épouse les zones claires (nuage), creux dans les zones sombres
    float lum1 = dot(c1, vec3(0.2126, 0.7152, 0.0722));
    c1 += (sm.z - 0.5) * 0.35 * amt * (0.25 + lum1);
    vec3 dc = (c1 - c0.rgb) * min(amt, 1.6) * m * c0.a; // le logo (alpha 0) reste net
    col.rgb = clamp(col.rgb + dc, 0.0, 1.0);
    float dl = dot(dc, vec3(0.2126, 0.7152, 0.0722)) * uToneGain;
    toneRaw += vec2(aUv.z, aUv.z == 0.0 ? 0.0 : -1.0) * dl;
  }
  vec2 tone = clamp((toneRaw - 0.5) * uContrast + 0.5, 0.0, 1.0);
  float baseOff = mix(aOffFrom, aOffTo, m);
  float off = baseOff + uPush;

  // courbure : l'image n'est plus un plan parallèle à l'écran (seulement les images reculées)
  float scaleAtDepth = (uCamZ + baseOff) / uCamZ;
  vec2 q = pos.xy / (uViewH * 0.5 * scaleAtDepth);
  pos.z += uCurve * dot(q, q) * 12.0 * scaleAtDepth * step(0.5, baseOff);

  // légère respiration
  float t = uTime * 0.5;
  pos.z += uMotion * uBreath * 0.08 * sin(t + aRand.y * 30.0 + pos.x * 0.4);

  // la souris écarte les points et les pousse vers l'avant (souris ramenée à la profondeur de l'image)
  vec2 mouse = uMouse.xy * (uCamZ + off) / uCamZ;
  vec2 d = pos.xy - mouse;
  float radius = uMouseRadius * (uCamZ + off) / uCamZ;
  float f = smoothstep(radius, 0.0, length(d)) * uMotion * uMouseForce;
  pos.xy += normalize(d + 1e-4) * f * 0.7 * (uCamZ + off) / uCamZ;
  pos.z += f * 2.5;

  // sortie au scroll : le nuage se déploie en profondeur
  pos.z += uScroll * (aRand.y - 0.5) * 30.0;
  pos.z -= off;

  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mv;
  vScreen = gl_Position.xy / gl_Position.w * 0.5 + 0.5;
  // une cellule couvre sa place dans la grille : l'image reste continue
  gl_PointSize = max(1.5, cell * uSizeFactor * uScreenScale / -mv.z);
  vSize = gl_PointSize;
  vCell = floor(aTo.xy / max(aTo.w, 1e-5) + 0.5);

  // monochrome / couleurs / monochrome bleu (comme les couvertures de projet)
  float mono = mix(tone.x, tone.y, uLight);
  float L = smoothstep(0.02, 0.95, dot(col.rgb, vec3(0.2126, 0.7152, 0.0722)));
  vec3 blueLo = mix(vec3(0.04, 0.02, 0.16), vec3(0.231, 0.129, 1.0), uLight);
  vec3 blueHi = mix(vec3(0.62, 0.57, 1.0), vec3(0.93, 0.92, 1.0), uLight);
  vec3 blue = mix(blueLo, blueHi, L);

  vec3 rgb = mix(mix(uColor, col.rgb, uColorMix), blue, uBlueMix);
  float alpha = mix(mix(mono, col.a, uColorMix), col.a, uBlueMix);
  vColor = vec4(rgb, alpha * uOpacity * uOpacityMul);
}
