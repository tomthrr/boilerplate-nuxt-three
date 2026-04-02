varying vec3 vWorldPosition;
varying float vNoise;

uniform vec3 u_base;
uniform vec3 u_eroded;

void main() {
    // mapping du bruit
    vec3 base = u_base;
    vec3 eroded = u_eroded;
    vec3 color = mix(base, eroded, vNoise);

    gl_FragColor = vec4(color, 1.0);
}