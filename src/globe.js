import { initGlobeScene } from "./components/GlobeScene.js";

function boot() {
  const sceneEl = document.getElementById("networkScene");
  const canvas = document.getElementById("globeCanvas");
  if (!sceneEl || !canvas) return;

  const labels = Array.from(sceneEl.querySelectorAll(".network-label"));

  initGlobeScene({
    container: sceneEl,
    canvas,
    sceneEl,
    labels,
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
