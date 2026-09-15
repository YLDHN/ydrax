import * as THREE from "three";

const RING_CONFIGS = [
  { radius: 1.34, tiltX: 0.42, tiltZ: 0.08, speed: 0.018, opacity: 0.16 },
  { radius: 1.52, tiltX: -0.55, tiltZ: 0.3, speed: -0.013, opacity: 0.11 },
  { radius: 1.7, tiltX: 0.18, tiltZ: -0.46, speed: 0.01, opacity: 0.08 },
  { radius: 1.86, tiltX: -0.22, tiltZ: -0.12, speed: -0.008, opacity: 0.06 },
];

/** A handful of very thin orbital rings at different inclinations, rotating slowly. */
export function createOrbitRings() {
  const group = new THREE.Group();
  const rings = [];

  RING_CONFIGS.forEach((cfg) => {
    const points = [];
    const segments = 128;
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(angle) * cfg.radius, 0, Math.sin(angle) * cfg.radius));
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: 0x9fd3ff,
      transparent: true,
      opacity: cfg.opacity,
    });

    const ring = new THREE.LineLoop(geometry, material);
    ring.rotation.x = cfg.tiltX;
    ring.rotation.z = cfg.tiltZ;
    ring.userData.speed = cfg.speed;

    rings.push(ring);
    group.add(ring);
  });

  group.userData.rings = rings;
  return group;
}

export function updateOrbitRings(group, delta) {
  group.userData.rings.forEach((ring) => {
    ring.rotation.y += ring.userData.speed * delta;
  });
}
