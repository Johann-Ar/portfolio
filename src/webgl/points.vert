attribute vec4 aFrom;      // xyz + taille de cellule
attribute vec4 aTo;
attribute vec4 aColFrom;   // rgb + présence
attribute vec4 aColTo;
attribute vec2 aToneFrom;  // opacité monochrome (thème sombre, thème clair)
attribute vec2 aToneTo;
attribute vec4 aRand;

uniform float uTime;
uniform float uMix;
uniform float uDelaySpread;
uniform float uScroll;
uniform vec3 uMouse;
uniform float uMouseRadius;
uniform vec3 uColor;
uniform float uLight;
uniform float uColorMode;
uniform float uOpacity;
uniform float uSizeFactor;
uniform float uScreenScale;
uniform float uMotion;

varying vec4 vColor;

float easeInOutCubic(float t) {
  return t < 0.5 ? 4.0 * t * t * t : 1.0 - pow(-2.0 * t + 2.0, 3.0) / 2.0;
}

void main() {
  // morph avec décalage par point + dispersion à mi-parcours
  float local = clamp((uMix - aRand.x * uDelaySpread) / (1.0 - uDelaySpread), 0.0, 1.0);
  float m = easeInOutCubic(local);
  float burst = sin(3.14159265 * m);

  vec3 pos = mix(aFrom.xyz, aTo.xyz, m);
  pos += (aRand.yzw - 0.5) * vec3(6.0, 6.0, 10.0) * burst;
  float cell = mix(aFrom.w, aTo.w, m);
  vec4 col = mix(aColFrom, aColTo, m);
  vec2 tone = mix(aToneFrom, aToneTo, m);

  // légère respiration
  float t = uTime * 0.5;
  pos.z += uMotion * 0.08 * sin(t + aRand.y * 30.0 + pos.x * 0.4);

  // la souris écarte les points et les pousse en profondeur
  vec2 d = pos.xy - uMouse.xy;
  float f = smoothstep(uMouseRadius, 0.0, length(d)) * uMotion;
  pos.xy += normalize(d + 1e-4) * f * 0.7;
  pos.z += f * 2.5;

  // sortie au scroll : le nuage se déploie en profondeur
  pos.z += uScroll * (aRand.y - 0.5) * 30.0;

  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mv;
  // une cellule couvre sa place dans la grille : l'image reste continue
  gl_PointSize = max(1.0, cell * uSizeFactor * uScreenScale / -mv.z);

  float mono = mix(tone.x, tone.y, uLight);
  vec3 rgb = mix(uColor, col.rgb, uColorMode);
  float alpha = mix(mono, col.a, uColorMode);
  vColor = vec4(rgb, alpha * uOpacity);
}
