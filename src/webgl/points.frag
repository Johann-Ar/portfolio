varying vec4 vColor;

void main() {
  if (vColor.a < 0.01) discard;
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;
  gl_FragColor = vec4(vColor.rgb, vColor.a * smoothstep(0.5, 0.35, d));
}
