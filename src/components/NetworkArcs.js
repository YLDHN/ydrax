import * as THREE from "three";
import { createGlowTexture, lerp } from "./utils.js";

const NAMED_PAIRS = [
  ["Paris", "New York"],
  ["Paris", "Tokyo"],
  ["London", "Singapore"],
  ["New York", "San Francisco"],
  ["Montreal", "Amsterdam"],
  ["Dubai", "Singapore"],
  ["Tel Aviv", "Frankfurt"],
  ["Tokyo", "Sydney"],
  ["Zurich", "Milan"],
  ["Stockholm", "Madrid"],
];

function buildCurve(start, end, radius) {
  const mid = start.clone().add(end).multiplyScalar(0.5);
  const lift = radius * (1 + Math.min(start.distanceTo(end) * 0.16, 0.3));
  mid.normalize().multiplyScalar(lift);
  return new THREE.QuadraticBezierCurve3(start, mid, end);
}

/** Curved great-circle-like arcs above the globe surface, plus small packets travelling along a subset of them. */
export function createNetworkArcs({ nodes, radius = 1, isMobile = false }) {
  const group = new THREE.Group();
  const lines = [];
  const flows = [];
  const glowTexture = createGlowTexture();

  const byName = new Map(nodes.filter((n) => n.name).map((n) => [n.name, n]));
  const pairs = [];

  NAMED_PAIRS.forEach(([a, b]) => {
    const nodeA = byName.get(a);
    const nodeB = byName.get(b);
    if (nodeA && nodeB) pairs.push([nodeA, nodeB]);
  });

  const cityNodes = nodes.filter((n) => n.name);
  const fillerNodes = nodes.filter((n) => !n.name);
  const maxFillerLinks = isMobile ? 6 : 16;

  fillerNodes.slice(0, maxFillerLinks).forEach((filler) => {
    const sameGroupCities = cityNodes.filter((c) => c.group === filler.group);
    const target = sameGroupCities[Math.floor(Math.random() * sameGroupCities.length)];
    if (target) pairs.push([filler, target]);
  });

  pairs.forEach(([a, b]) => {
    const curve = buildCurve(a.pos.clone(), b.pos.clone(), radius);
    const points = curve.getPoints(48);
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const baseOpacity = 0.16 + Math.random() * 0.08;

    const material = new THREE.LineBasicMaterial({
      color: 0x8fd0ff,
      transparent: true,
      opacity: baseOpacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const line = new THREE.Line(geometry, material);
    line.userData = { group: a.group, baseOpacity, curve };
    lines.push(line);
    group.add(line);
  });

  const flowCount = Math.min(isMobile ? 7 : 14, lines.length);
  const shuffled = [...lines].sort(() => Math.random() - 0.5);

  for (let i = 0; i < flowCount; i++) {
    const line = shuffled[i];
    const material = new THREE.SpriteMaterial({
      map: glowTexture,
      color: 0xdff2ff,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(0.05, 0.05, 0.05);
    sprite.userData = {
      curve: line.userData.curve,
      group: line.userData.group,
      t: Math.random(),
      speed: 0.035 + Math.random() * 0.03,
    };
    flows.push(sprite);
    group.add(sprite);
  }

  function update(delta, hoverGroupTarget, animateFlow) {
    const factor = Math.min(1, delta * 5);

    lines.forEach((line) => {
      const { group: lineGroup, baseOpacity } = line.userData;
      let target = baseOpacity;
      if (hoverGroupTarget >= 0) {
        target = lineGroup === hoverGroupTarget ? Math.min(1, baseOpacity * 3.2) : baseOpacity * 0.22;
      }
      line.material.opacity = lerp(line.material.opacity, target, factor);
    });

    if (animateFlow) {
      flows.forEach((sprite) => {
        sprite.userData.t += sprite.userData.speed * delta;
        if (sprite.userData.t > 1) sprite.userData.t = 0;
        sprite.position.copy(sprite.userData.curve.getPointAt(sprite.userData.t));
      });
    }

    flows.forEach((sprite) => {
      const target = hoverGroupTarget >= 0 && sprite.userData.group !== hoverGroupTarget ? 0.25 : 0.95;
      sprite.material.opacity = lerp(sprite.material.opacity, target, factor);
    });
  }

  return { group, lines, flows, update };
}
