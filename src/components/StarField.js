import * as THREE from "three";

/** A very discreet star field sitting behind the globe. */
export function createStarField(count = 700) {
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const radius = 16 + Math.random() * 22;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.cos(phi);
    positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    color: 0x9db8d0,
    size: 0.055,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.32,
    depthWrite: false,
  });

  const points = new THREE.Points(geometry, material);
  points.renderOrder = -1;
  return points;
}
