import * as THREE from "three";

const vertexShader = `
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  varying vec3 vNormal;
  uniform vec3 glowColor;
  void main() {
    float rim = 1.0 - abs(dot(normalize(vNormal), vec3(0.0, 0.0, 1.0)));
    float intensity = pow(rim, 7.0);
    gl_FragColor = vec4(glowColor, intensity * 0.35);
  }
`;

/** Thin fresnel-based halo around the globe — deliberately subtle, no big bloom. */
export function createAtmosphere(radius = 1) {
  const geometry = new THREE.SphereGeometry(radius * 1.015, 48, 48);
  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      glowColor: { value: new THREE.Color(0x6fb4ff) },
    },
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false,
  });

  return new THREE.Mesh(geometry, material);
}
