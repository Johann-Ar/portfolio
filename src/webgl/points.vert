attribute vec4 aFrom;   // xyz + luminance
attribute vec4 aTo;
attribute vec4 aRand;

uniform float uTime;
uniform float uMix;
uniform float uDelaySpread;
uniform float uScroll;
uniform vec3 uMouse;
uniform float uMouseRadius;
uniform float uSize;
uniform float uPixelRatio;
uniform float uMotion;
uniform float uOpacity;

varying float vAlpha;

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
  float lum = mix(aFrom.w, aTo.w, m);

  // respiration : dérive lente, comme en suspension dans l'eau
  float t = uTime * 0.6;
  pos += uMotion * 0.06 * vec3(
    sin(t + aRand.y * 40.0),
    cos(t * 0.8 + aRand.z * 40.0),
    sin(t * 0.7 + aRand.w * 40.0) * 2.0
  );

  // la souris écarte les points et les pousse en profondeur
  vec2 d = pos.xy - uMouse.xy;
  float dist = length(d);
  float f = smoothstep(uMouseRadius, 0.0, dist) * uMotion;
  pos.xy += normalize(d + 1e-4) * f * 0.9;
  pos.z += f * (1.5 + lum * 3.0);

  // sortie au scroll : le nuage se déploie en profondeur
  float s = uScroll;
  pos.z += s * (aRand.y - 0.5) * 40.0 + s * lum * 8.0;
  pos.xy *= 1.0 + s * 0.35;

  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uSize * (0.55 + lum * 0.9) * uPixelRatio * (30.0 / -mv.z);

  vAlpha = (0.35 + 0.65 * lum) * uOpacity;
}
