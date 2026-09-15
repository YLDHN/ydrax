import * as THREE from "three";
import { createStarField } from "./StarField.js";
import { createAtmosphere } from "./Atmosphere.js";
import { createOrbitRings, updateOrbitRings } from "./OrbitRings.js";
import { createNetworkNodes, GROUPS } from "./NetworkNodes.js";
import { createNetworkArcs } from "./NetworkArcs.js";
import { clamp, lerp } from "./utils.js";

const EARTH_MAP_URL = "https://cdn.jsdelivr.net/npm/three-globe@2.31.0/example/img/earth-dark.jpg";
const EARTH_BUMP_URL = "https://cdn.jsdelivr.net/npm/three-globe@2.31.0/example/img/earth-topology.png";
const GLOBE_RADIUS = 1;

function isWebGLAvailable() {
  try {
    const canvas = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (canvas.getContext("webgl") || canvas.getContext("experimental-webgl")));
  } catch (e) {
    return false;
  }
}

export function initGlobeScene({ container, canvas, sceneEl, labels }) {
  if (!isWebGLAvailable()) {
    canvas.style.display = "none";
    return;
  }

  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const fineHoverQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
  const isMobile = window.innerWidth < 760;

  let reduceMotion = reducedMotionQuery.matches;
  const canHover = fineHoverQuery.matches;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(0, 0, 3.1);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setClearColor(0x000000, 0);
  const pixelRatio = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2);
  renderer.setPixelRatio(pixelRatio);
  if (renderer.outputColorSpace !== undefined) renderer.outputColorSpace = THREE.SRGBColorSpace;

  const globeGroup = new THREE.Group();
  scene.add(globeGroup);

  // Lighting — subtle, no strong specular hot-spots.
  scene.add(new THREE.AmbientLight(0x2c4258, 1.15));
  const keyLight = new THREE.DirectionalLight(0xcfe6ff, 1.9);
  keyLight.position.set(-3, 2, 4);
  scene.add(keyLight);
  const rimLight = new THREE.DirectionalLight(0x2a5578, 0.45);
  rimLight.position.set(3, -1, -4);
  scene.add(rimLight);

  // Earth sphere — dark, faintly metallic. A near-white tint keeps the
  // earth-dark map's own land/ocean contrast intact after the multiply.
  const earthMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.7,
    metalness: 0.2,
    emissive: 0x081420,
    emissiveIntensity: 0.4,
  });
  const earthMesh = new THREE.Mesh(new THREE.SphereGeometry(GLOBE_RADIUS, 64, 64), earthMaterial);
  globeGroup.add(earthMesh);

  const textureLoader = new THREE.TextureLoader();
  textureLoader.load(EARTH_MAP_URL, (tex) => {
    if (tex.colorSpace !== undefined) tex.colorSpace = THREE.SRGBColorSpace;
    earthMaterial.map = tex;
    earthMaterial.needsUpdate = true;
    if (reduceMotion) frame();
  }, undefined, () => {});
  textureLoader.load(EARTH_BUMP_URL, (tex) => {
    earthMaterial.bumpMap = tex;
    earthMaterial.bumpScale = 0.015;
    earthMaterial.needsUpdate = true;
    if (reduceMotion) frame();
  }, undefined, () => {});

  const atmosphere = createAtmosphere(GLOBE_RADIUS);
  globeGroup.add(atmosphere);

  const orbitRings = createOrbitRings();
  globeGroup.add(orbitRings);

  const { points: nodePoints, nodes, update: updateNodes } = createNetworkNodes({
    radius: GLOBE_RADIUS * 1.01,
    isMobile,
    pixelRatio,
  });
  globeGroup.add(nodePoints);

  const { group: arcsGroup, update: updateArcs } = createNetworkArcs({ nodes, radius: GLOBE_RADIUS, isMobile });
  globeGroup.add(arcsGroup);

  const starField = createStarField(isMobile ? 450 : 700);
  scene.add(starField);

  // Resize
  function resize() {
    const rect = container.getBoundingClientRect();
    const width = Math.max(1, rect.width);
    const height = Math.max(1, rect.height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    if (reduceMotion) frame();
  }

  let resizeObserver;
  if (window.ResizeObserver) {
    resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
  } else {
    window.addEventListener("resize", resize);
  }

  // Mouse-driven tilt + light parallax.
  const targetTilt = { x: 0, y: 0 };
  const currentTilt = { x: 0, y: 0 };
  const targetParallax = { x: 0, y: 0 };
  const currentParallax = { x: 0, y: 0 };

  if (canHover && !reduceMotion) {
    window.addEventListener("pointermove", (event) => {
      const nx = event.clientX / window.innerWidth - 0.5;
      const ny = event.clientY / window.innerHeight - 0.5;
      targetTilt.y = nx * 0.35;
      targetTilt.x = ny * 0.22;
      targetParallax.x = nx * 18;
      targetParallax.y = ny * 12;
    });
  }

  // Scroll-driven fade / shift / scale of the whole scene container.
  let scrollProgress = 0;
  function updateScroll() {
    const rect = sceneEl.closest(".hero")?.getBoundingClientRect();
    if (!rect) return;
    const raw = -rect.top / (rect.height * 0.85);
    scrollProgress = clamp(raw, 0, 1);
  }
  window.addEventListener("scroll", updateScroll, { passive: true });
  updateScroll();

  // Hover on the five HTML labels highlights the matching nodes / arcs.
  let hoverGroup = -1;
  labels.forEach((label) => {
    const group = GROUPS.indexOf(label.dataset.group);
    if (group === -1) return;
    label.addEventListener("pointerenter", () => {
      hoverGroup = group;
      label.classList.add("active");
      if (reduceMotion) frame();
    });
    label.addEventListener("pointerleave", () => {
      hoverGroup = -1;
      label.classList.remove("active");
      if (reduceMotion) frame();
    });
  });

  let lastTime = performance.now();
  let autoRotation = 0;
  let rafId = null;

  function frame() {
    const now = performance.now();
    const delta = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;
    const animate = !reduceMotion;

    if (animate) {
      autoRotation += delta * 0.035;
      currentTilt.x = lerp(currentTilt.x, targetTilt.x, 0.04);
      currentTilt.y = lerp(currentTilt.y, targetTilt.y, 0.04);
      currentParallax.x = lerp(currentParallax.x, targetParallax.x, 0.055);
      currentParallax.y = lerp(currentParallax.y, targetParallax.y, 0.055);
      updateOrbitRings(orbitRings, delta);
      starField.rotation.y += delta * 0.003;
    }

    globeGroup.rotation.y = autoRotation + currentTilt.y;
    globeGroup.rotation.x = currentTilt.x;

    updateNodes(animate ? delta : 1, hoverGroup);
    updateArcs(animate ? delta : 1, hoverGroup, animate);

    sceneEl.style.transform =
      `translateY(calc(-50% + ${currentParallax.y}px)) ` +
      `translateX(${currentParallax.x + scrollProgress * 36}px) ` +
      `scale(${1 - scrollProgress * 0.1})`;
    sceneEl.style.opacity = String(1 - scrollProgress * 0.5);

    renderer.render(scene, camera);

    rafId = animate ? requestAnimationFrame(frame) : null;
  }

  resize();
  frame();

  reducedMotionQuery.addEventListener("change", (event) => {
    reduceMotion = event.matches;
    if (!reduceMotion && rafId === null) {
      lastTime = performance.now();
      frame();
    }
  });
}
