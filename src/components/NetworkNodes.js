import * as THREE from "three";
import { latLonToVector3, createGlowTexture, lerp } from "./utils.js";

/** Group order matches the five HTML labels: Web · IA · Réseaux · Systèmes · Infrastructure. */
export const GROUPS = ["web", "ai", "network", "systems", "infra"];

export const CITIES = [
  { name: "Paris", lat: 48.8566, lon: 2.3522 },
  { name: "London", lat: 51.5074, lon: -0.1278 },
  { name: "New York", lat: 40.7128, lon: -74.006 },
  { name: "San Francisco", lat: 37.7749, lon: -122.4194 },
  { name: "Montreal", lat: 45.5019, lon: -73.5674 },
  { name: "Dubai", lat: 25.2048, lon: 55.2708 },
  { name: "Tel Aviv", lat: 32.0853, lon: 34.7818 },
  { name: "Singapore", lat: 1.3521, lon: 103.8198 },
  { name: "Tokyo", lat: 35.6762, lon: 139.6503 },
  { name: "Sydney", lat: -33.8688, lon: 151.2093 },
  { name: "Frankfurt", lat: 50.1109, lon: 8.6821 },
  { name: "Amsterdam", lat: 52.3676, lon: 4.9041 },
  { name: "Madrid", lat: 40.4168, lon: -3.7038 },
  { name: "Milan", lat: 45.4642, lon: 9.19 },
  { name: "Zurich", lat: 47.3769, lon: 8.5417 },
  { name: "Stockholm", lat: 59.3293, lon: 18.0686 },
].map((city, i) => ({ ...city, group: i % GROUPS.length }));

const vertexShader = `
  attribute float aGroup;
  attribute float aSize;
  varying float vGroup;
  uniform float pixelRatio;
  void main() {
    vGroup = aGroup;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * pixelRatio * (3.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = `
  varying float vGroup;
  uniform float hoverGroup;
  uniform float hoverStrength;
  uniform vec3 uColor;
  uniform sampler2D uSprite;
  void main() {
    vec4 tex = texture2D(uSprite, gl_PointCoord);
    float alpha = 1.0;
    if (hoverGroup >= 0.0) {
      bool match = abs(vGroup - hoverGroup) < 0.5;
      float dimmed = match ? 1.4 : 0.22;
      alpha = mix(1.0, dimmed, hoverStrength);
    }
    gl_FragColor = vec4(uColor, tex.a * clamp(alpha, 0.0, 1.4));
  }
`;

function buildFillerNodes(count, radius) {
  const fillers = [];
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const pos = new THREE.Vector3(
      radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.sin(theta)
    );
    fillers.push({ name: null, group: i % GROUPS.length, pos });
  }
  return fillers;
}

/** Builds the world-network points as a single draw call, with per-group hover highlighting. */
export function createNetworkNodes({ radius = 1, isMobile = false, pixelRatio = 1 }) {
  const cityNodes = CITIES.map((c) => ({
    name: c.name,
    group: c.group,
    pos: latLonToVector3(c.lat, c.lon, radius),
  }));

  const fillerCount = isMobile ? 8 : 20;
  const nodes = cityNodes.concat(buildFillerNodes(fillerCount, radius));

  const positions = new Float32Array(nodes.length * 3);
  const groups = new Float32Array(nodes.length);
  const sizes = new Float32Array(nodes.length);

  nodes.forEach((node, i) => {
    positions[i * 3] = node.pos.x;
    positions[i * 3 + 1] = node.pos.y;
    positions[i * 3 + 2] = node.pos.z;
    groups[i] = node.group;
    sizes[i] = node.name ? 5.5 : 3.2;
  });

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aGroup", new THREE.BufferAttribute(groups, 1));
  geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));

  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      pixelRatio: { value: pixelRatio },
      hoverGroup: { value: -1 },
      hoverStrength: { value: 0 },
      uColor: { value: new THREE.Color(0xbfe5ff) },
      uSprite: { value: createGlowTexture() },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.NormalBlending,
  });

  const points = new THREE.Points(geometry, material);

  let activeGroup = -1;
  let strength = 0;

  function update(delta, hoverGroupTarget) {
    const factor = Math.min(1, delta * 5);
    if (hoverGroupTarget >= 0) {
      activeGroup = hoverGroupTarget;
      strength = lerp(strength, 1, factor);
    } else {
      strength = lerp(strength, 0, factor);
      if (strength < 0.01) activeGroup = -1;
    }
    material.uniforms.hoverGroup.value = activeGroup;
    material.uniforms.hoverStrength.value = strength;
  }

  return { points, nodes, update };
}
