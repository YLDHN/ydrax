const navbar = document.getElementById("navbar");
const networkScene = document.getElementById("networkScene");
const canvas = document.getElementById("networkCanvas");
const ctx = canvas.getContext("2d");

let width = 0;
let height = 0;
let dpr = 1;
let nodes = [];
let particles = [];
let time = 0;
let targetX = 0;
let targetY = 0;
let currentX = 0;
let currentY = 0;

const NODE_COUNT = 44;
const PARTICLE_COUNT = 15;

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  width = rect.width;
  height = rect.height;

  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  createNetwork();
}

function createNetwork() {
  nodes = [];
  particles = [];

  for (let i = 0; i < NODE_COUNT; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.sqrt(Math.random()) * 0.43;

    nodes.push({
      baseX: width / 2 + Math.cos(angle) * width * radius,
      baseY: height / 2 + Math.sin(angle) * height * radius * 0.78,
      x: 0,
      y: 0,
      size: Math.random() * 1.5 + .8,
      phase: Math.random() * Math.PI * 2,
      drift: Math.random() * .7 + .3
    });
  }

  nodes.forEach(n => {
    n.x = n.baseX;
    n.y = n.baseY;
  });

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push({
      a: Math.floor(Math.random() * nodes.length),
      b: Math.floor(Math.random() * nodes.length),
      progress: Math.random(),
      speed: Math.random() * .003 + .0015
    });
  }
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function drawNetwork() {
  ctx.clearRect(0, 0, width, height);
  time += .008;

  nodes.forEach(n => {
    n.x = n.baseX + Math.cos(time * n.drift + n.phase) * 3.2;
    n.y = n.baseY + Math.sin(time * n.drift + n.phase) * 3.2;
  });

  // Fine orbital ellipses
  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.rotate(-0.18);

  [0.32, 0.39, 0.46].forEach((scale, i) => {
    ctx.beginPath();
    ctx.ellipse(
      0, 0,
      width * scale,
      height * (.125 + i * .032),
      0, 0, Math.PI * 2
    );
    ctx.strokeStyle = `rgba(135,205,255,${.10 - i * .018})`;
    ctx.lineWidth = .8;
    ctx.stroke();
  });

  ctx.restore();

  // Connections
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i];
      const b = nodes[j];
      const dist = distance(a, b);
      const maxDist = width * .18;

      if (dist < maxDist) {
        const alpha = (1 - dist / maxDist) * .21;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = `rgba(120,195,250,${alpha})`;
        ctx.lineWidth = .65;
        ctx.stroke();
      }
    }
  }

  // Data packets moving along selected connections
  particles.forEach(p => {
    const a = nodes[p.a];
    const b = nodes[p.b];

    if (!a || !b || distance(a, b) > width * .23) return;

    p.progress += p.speed;
    if (p.progress > 1) p.progress = 0;

    const x = a.x + (b.x - a.x) * p.progress;
    const y = a.y + (b.y - a.y) * p.progress;

    ctx.beginPath();
    ctx.arc(x, y, 1.6, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(190,230,255,.95)";
    ctx.shadowBlur = 12;
    ctx.shadowColor = "rgba(80,175,255,.9)";
    ctx.fill();
    ctx.shadowBlur = 0;
  });

  // Nodes
  nodes.forEach(n => {
    ctx.beginPath();
    ctx.arc(n.x, n.y, n.size, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(195,230,255,.9)";
    ctx.shadowBlur = 11;
    ctx.shadowColor = "rgba(75,170,255,.8)";
    ctx.fill();
    ctx.shadowBlur = 0;
  });

  requestAnimationFrame(drawNetwork);
}

window.addEventListener("resize", resizeCanvas);

window.addEventListener("mousemove", (event) => {
  const x = event.clientX / window.innerWidth - .5;
  const y = event.clientY / window.innerHeight - .5;
  targetX = x * 28;
  targetY = y * 18;
});

function animateParallax() {
  currentX += (targetX - currentX) * .055;
  currentY += (targetY - currentY) * .055;

  if (networkScene) {
    networkScene.style.transform =
      `translate3d(${currentX}px, calc(-50% + ${currentY}px), 0)`;
  }

  requestAnimationFrame(animateParallax);
}

window.addEventListener("scroll", () => {
  navbar.classList.toggle("scrolled", window.scrollY > 30);
});

const revealObserver = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: .12 }
);

document.querySelectorAll(".reveal").forEach(el => revealObserver.observe(el));

const navLinks = [...document.querySelectorAll(".nav-links a")];
const sections = [...document.querySelectorAll("main section[id]")];

const sectionObserver = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      navLinks.forEach(link => link.classList.remove("active"));
      const active = navLinks.find(
        link => link.getAttribute("href") === `#${entry.target.id}`
      );
      if (active) active.classList.add("active");
    });
  },
  { threshold: .45 }
);

sections.forEach(section => sectionObserver.observe(section));

resizeCanvas();
drawNetwork();
animateParallax();
