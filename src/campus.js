// Campus animé du hero : silhouettes qui rejoignent les bâtiments Dev Web, IA et Sys/Infra.
(() => {
const W = 1671, H = 941;
const LOOP = 60;   // durée de la boucle (s) : la scène est strictement identique toutes les 48 s

const DOORS = { dev:{glow:[366,418]}, ia:{glow:[835,292]}, sys:{glow:[1300,426]} };

// Points de passage (coordonnées de l'image). Ils sont lissés en courbes, donc pas de virage sec.
const DEV_IN = [[370,580],[425,506],[402,455],[378,432],[366,420]];
const IA_IN  = [[640,408],[745,362],[812,326],[835,304]];
const IA_INR = [[1030,408],[925,362],[858,326],[835,304]];
const SYS_IN = [[1300,580],[1250,506],[1274,456],[1292,438],[1302,426]];
const ROUTES = [
  { door:'dev', pts:[[-50,832],[120,828],[265,765],[315,665],...DEV_IN] },
  { door:'dev', pts:[[690,1000],[540,915],[390,875],[290,800],[300,700],...DEV_IN] },
  { door:'ia',  pts:[[-50,832],[120,828],[265,765],[320,660],[400,580],[480,520],[555,462],...IA_IN] },
  { door:'ia',  pts:[[1721,832],[1550,828],[1405,765],[1355,665],[1270,580],[1190,520],[1115,462],...IA_INR] },
  { door:'ia',  pts:[[700,1000],[545,918],[395,880],[292,805],[305,700],[380,610],[470,530],[555,462],...IA_IN] },
  { door:'sys', pts:[[1721,832],[1550,828],[1405,765],[1355,665],...SYS_IN] },
  { door:'sys', pts:[[980,1000],[1130,915],[1280,875],[1380,800],[1370,700],...SYS_IN] },
  // trajets qui passent par le centre (devant le rond central ou sur ses côtés)
  { door:'sys', pts:[[-50,832],[120,828],[265,765],[330,660],[450,592],[585,600],[700,628],[838,640],[975,628],[1085,596],[1185,560],...SYS_IN.slice(1)] },
  { door:'dev', pts:[[1721,832],[1550,828],[1405,765],[1345,660],[1240,588],[1095,600],[975,628],[838,640],[700,628],[590,598],[480,560],...DEV_IN.slice(1)] },
  { door:'ia',  pts:[[700,1000],[545,918],[395,880],[292,805],[305,700],[400,610],[530,572],[622,522],[680,442],[760,372],[812,326],[835,304]] },
  { door:'ia',  pts:[[980,1000],[1130,915],[1280,875],[1380,800],[1370,700],[1290,600],[1150,570],[1055,522],[995,442],[912,372],[858,326],[835,304]] },
  { door:'sys', pts:[[700,1000],[545,918],[395,880],[292,805],[305,700],[400,612],[530,592],[700,630],[838,644],[975,630],[1085,598],[1185,560],...SYS_IN.slice(1)] },
  { door:'dev', pts:[[980,1000],[1130,915],[1280,875],[1380,800],[1370,700],[1285,612],[1170,592],[1095,602],[975,632],[838,646],[700,632],[590,600],[480,560],...DEV_IN.slice(1)] },
  { door:'ia',  pts:[[-50,832],[120,828],[265,765],[330,660],[450,592],[560,562],[630,515],[682,442],[760,372],[812,326],[835,304]] },
  { door:'ia',  pts:[[1721,832],[1550,828],[1405,765],[1345,660],[1240,588],[1120,562],[1045,515],[993,442],[912,372],[858,326],[835,304]] },
  // trajets qui passent au-dessus (derrière) le rond central : ils disparaissent derrière l'arbre puis réapparaissent
  { door:'sys', pts:[[-50,832],[120,828],[265,765],[330,660],[450,592],[560,540],[650,478],[750,452],[838,446],[925,452],[1025,476],[1125,500],[1210,522],...SYS_IN.slice(1)] },
  { door:'dev', pts:[[1721,832],[1550,828],[1405,765],[1345,660],[1240,588],[1120,540],[1028,478],[925,452],[838,446],[750,452],[650,476],[555,500],[470,522],...DEV_IN.slice(1)] },
  { door:'sys', pts:[[700,1000],[545,918],[395,880],[292,805],[305,700],[400,612],[520,560],[620,500],[720,458],[838,444],[955,458],[1050,482],[1140,505],[1215,522],...SYS_IN.slice(1)] },
  { door:'dev', pts:[[980,1000],[1130,915],[1280,875],[1380,800],[1370,700],[1285,612],[1160,555],[1060,500],[955,458],[838,444],[720,458],[625,482],[540,505],[470,522],...DEV_IN.slice(1)] },
];
const PER_ROUTE = [3,3,3,3,3,3,3, 3,3,3,3, 2,2,2,2, 2,2,2,2];

// Découpe de l'arbre central (prise dans l'image de fond) redessinée par-dessus les personnes qui passent derrière
const OCC = { x:740, y:370, w:195, h:130, img:new Image() };
OCC.img.src = '/assets/campus/arbre-centre.png';
const BEHIND_Y = 505;   // pieds plus haut que cette ligne = derrière le rond central

// Catmull-Rom centripète : transforme les points en une courbe douce, échantillonnée finement
function smooth(pts, steps = 14) {
  const P = [pts[0], ...pts, pts[pts.length - 1]], out = [];
  const tj = (a, b, t) => t + Math.max(1e-3, Math.pow(Math.hypot(b[0]-a[0], b[1]-a[1]), 0.5));
  for (let i = 0; i < P.length - 3; i++) {
    const [p0,p1,p2,p3] = [P[i],P[i+1],P[i+2],P[i+3]];
    const t0 = 0, t1 = tj(p0,p1,t0), t2 = tj(p1,p2,t1), t3 = tj(p2,p3,t2);
    for (let s = 0; s < steps; s++) {
      const t = t1 + (t2 - t1) * s / steps;
      const L = (a,b,ta,tb) => [0,1].map(k => ((tb-t)*a[k] + (t-ta)*b[k]) / (tb-ta));
      const A1 = L(p0,p1,t0,t1), A2 = L(p1,p2,t1,t2), A3 = L(p2,p3,t2,t3);
      const B1 = L(A1,A2,t0,t2), B2 = L(A2,A3,t1,t3);
      out.push(L(B1,B2,t1,t2));
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}
ROUTES.forEach(r => r.curve = smooth(r.pts));

let seed = 11;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const scaleAt = y => 0.85 + (y - 300) / 600 * 0.3;
const BASE_H = 48;
const TYPES = ['suit','suit','suit','skirt','skirt','pants','suit','skirt','pants','suit'];

const walkers = [];
ROUTES.forEach((r, ri) => {
  const n = PER_ROUTE[ri];
  for (let k = 0; k < n; k++) {
    const type = TYPES[Math.floor(rnd() * TYPES.length)];
    walkers.push({
      route: r, type,
      offset: (k / n) * LOOP + rnd() * (LOOP / n) * 0.5 + ri * 2.3,
      speed: 36 + rnd() * 8,
      lateral: (rnd() - 0.5) * 26,
      h: type === 'suit' ? 1.0 + rnd() * 0.08 : 0.92 + rnd() * 0.07,
      strideMul: 0.92 + rnd() * 0.16
    });
  }
});

// temps / distance cumulés le long de la courbe (ralentit un peu dans les escaliers)
walkers.forEach(w => {
  const c = w.route.curve;
  let tot = 0; const D = [0];
  for (let i = 1; i < c.length; i++) { tot += Math.hypot(c[i][0]-c[i-1][0], c[i][1]-c[i-1][1]); D.push(tot); }
  const T = [0]; let t = 0;
  for (let i = 1; i < c.length; i++) {
    const remain = tot - D[i], ss = Math.min(1, Math.max(0, (remain - 50) / 70));
    const slow = 0.72 + 0.28 * ss * ss * (3 - 2 * ss);
    t += (D[i] - D[i-1]) / (w.speed * scaleAt((c[i][1] + c[i-1][1]) / 2) * slow);
    T.push(t);
  }
  if (t > LOOP * 0.95) { const k = t / (LOOP * 0.95); for (let i = 0; i < T.length; i++) T[i] /= k; t /= k; }
  w.T = T; w.D = D; w.total = tot; w.dur = t;
});

// ---------------------------------------------------------------------------
// Planification anti-chevauchement : on choisit l'heure de départ de chaque personne
// pour qu'elle ne croise jamais quelqu'un de trop près (vérifié sur toute la boucle).
// ---------------------------------------------------------------------------
function schedule(ROUNDS) {
  const DT = 0.2, NS = Math.round(LOOP / DT);
  const slots = Array.from({ length: NS }, () => []);   // positions déjà occupées, par tranche de temps
  const clash = (a, b) => {
    const hm = (a[2] + b[2]) / 2;
    return Math.abs(a[0] - b[0]) < hm * 0.44 && Math.abs(a[1] - b[1]) < hm * 0.72;
  };
  // échantillons de position le long du trajet, pour un décalage latéral donné
  const sample = w => {
    const out = [];
    for (let tau = 0; tau < w.dur; tau += DT) {
      const s = stateAt(w, tau);
      out.push(s.x < -20 || s.x > W + 20 || s.y > H + 10 ? null : [s.x, s.y, BASE_H * scaleAt(s.y) * w.h]);
    }
    return out;
  };
  const conflicts = (smp, c, stopAt) => {
    let n = 0;
    for (let j = 0; j < smp.length; j++) {
      const p = smp[j]; if (!p) continue;
      const occ = slots[(c + j) % NS];
      for (let q = 0; q < occ.length; q++) if (clash(p, occ[q])) { if (++n >= stopAt) return n; break; }
    }
    return n;
  };
  // les trajets les plus longs d'abord (ce sont les plus difficiles à caser)
  const order = walkers.slice().sort((a, b) => b.dur - a.dur);
  const LATS = [-15, -7.5, 0, 7.5, 15];
  const place = (w, allowBad) => {
    const want = Math.round((((w.offset % LOOP) + LOOP) % LOOP) / DT);
    // on essaie plusieurs écarts latéraux (côté du chemin), en commençant par le plus proche de l'actuel
    const lats = LATS.slice().sort((a, b) => Math.abs(a - w.lateral) - Math.abs(b - w.lateral));
    const cands = lats.map(l => { w.lateral = l; const smp = sample(w); smp.forEach(p => p && (p.w = w)); return { l, smp }; });
    let best = null;
    search:
    for (let d = 0; d < NS; d++) {
      for (const c of d ? [(want + d) % NS, (want - d + NS) % NS] : [want]) {
        for (const cd of cands) if (conflicts(cd.smp, c, 1) === 0) { best = { c, cd, n: 0 }; break search; }
      }
    }
    if (!best) {             // aucune place parfaite : on prend celle qui gêne le moins
      best = { n: Infinity };
      for (const cd of cands) for (let c = 0; c < NS; c++) {
        const n = conflicts(cd.smp, c, best.n); if (n < best.n) best = { c, cd, n };
      }
    }
    w.offset = best.c * DT; w.lateral = best.cd.l; w.slot = best.c; w.smp = best.cd.smp;
    w.smp.forEach((p, j) => { if (p) slots[(w.slot + j) % NS].push(p); });
    return best.n;
  };
  const unplace = w => w.smp.forEach((p, j) => { if (p) { const a = slots[(w.slot + j) % NS]; a.splice(a.indexOf(p), 1); } });
  const own = w => { unplace(w); const n = conflicts(w.smp, w.slot, Infinity); w.smp.forEach((p, j) => { if (p) slots[(w.slot + j) % NS].push(p); }); return n; };

  order.forEach(w => place(w));
  // réparation : on replace les personnes qui gênent encore, jusqu'à ce que plus personne ne se touche
  let remaining = 0;
  for (let round = 0; round < ROUNDS; round++) {
    const bad = walkers.filter(w => own(w) > 0);
    remaining = bad.length;
    if (!remaining) break;
    bad.forEach(w => { unplace(w); w.offset += (round % 2 ? -1 : 1) * (1 + round) * 1.3; place(w); });
  }
  console.debug('chevauchements restants :', remaining);
  console.debug('PRESET', JSON.stringify(walkers.map(w => [Math.round(w.offset * 10) / 10, w.lateral])));  // à recoller dans PRESET
}
// Horaires pré-calculés (sans aucun chevauchement). Si tu modifies les trajets, mets PRESET = null :
// ils seront recalculés au chargement.
const PRESET = [[3.2,0],[24.6,-7.5],[43.8,7.5],[10.6,0],[28,-7.5],[45.6,-15],[8.4,-15],[27.4,7.5],[58,15],[14.8,15],[36,7.5],[55.4,7.5],[9.8,-7.5],[34,0],[58.4,15],[11.4,7.5],[34,0],[1.8,-15],[18.6,-7.5],[37,0],[1.4,0],[36.8,-7.5],[41,-7.5],[40.4,0],[16.4,15],[0,-15],[5.2,7.5],[23,7.5],[46.8,0],[58.4,-15],[32.8,-7.5],[50.8,15],[13.8,-7.5],[30.2,15],[37.6,15],[1.2,7.5],[9.2,-7.5],[26.4,-7.5],[5.4,-15],[45.4,7.5],[17.2,15],[54.4,-7.5],[4.6,0],[38,15],[26.4,-15],[45.4,15],[12,-15],[35.8,15],[25.6,7.5]];
if (PRESET && PRESET.length === walkers.length) walkers.forEach((w, i) => { w.offset = PRESET[i][0]; w.lateral = PRESET[i][1]; });
else schedule(40);

function stateAt(w, tau) {
  const c = w.route.curve, T = w.T;
  let lo = 0, hi = T.length - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (T[m] <= tau) lo = m; else hi = m; }
  const f = (tau - T[lo]) / (T[hi] - T[lo] || 1);
  let x = c[lo][0] + (c[hi][0] - c[lo][0]) * f, y = c[lo][1] + (c[hi][1] - c[lo][1]) * f;
  // direction lissée sur quelques points autour
  const a = c[Math.max(0, lo - 3)], b = c[Math.min(c.length - 1, hi + 3)];
  const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1;
  const dist = w.D[lo] + (w.D[hi] - w.D[lo]) * f, remain = w.total - dist;
  const taper = Math.min(1, remain / 140);
  const lat = w.lateral * (0.45 + 0.55 * taper * taper);
  x += (-dy / len) * lat; y += (dx / len) * lat * 0.55;
  return { x, y, ux: dx / len, uy: dy / len, dist, remain };
}

// Silhouettes noires façon "gens d'affaires" : costume, femme cheveux longs en jupe ou en pantalon
function drawPerson(ctx, w, s) {
  const h = BASE_H * scaleAt(s.y) * w.h;
  const woman = w.type !== 'suit';
  const stride = h * (woman ? 0.56 : 0.64) * w.strideMul;
  const ph = (s.dist / stride) * Math.PI;
  const bob = Math.abs(Math.cos(ph)) * h * 0.016;
  const x = s.x, y = s.y;
  const fx = s.ux, fy = s.uy * 0.5, px = -s.uy, py = s.ux * 0.5;
  const wf = 0.55 + 0.45 * Math.abs(s.uy);
  const hipY = y - h * 0.48 - bob, shY = y - h * 0.8 - bob;

  ctx.fillStyle = ctx.strokeStyle = '#000';
  ctx.lineCap = ctx.lineJoin = 'round';
  const seg = (ax, ay, bx, by, wd) => { ctx.lineWidth = wd; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke(); };

  // jambes
  const knees = [];
  const hipSp = h * (woman ? 0.038 : 0.048);
  [-1, 1].forEach(sd => {
    const lp = ph + (sd > 0 ? 0 : Math.PI);
    const sw = Math.sin(lp), lift = Math.max(0, Math.cos(lp));
    const hx = x + px * sd * hipSp, hy = hipY + py * sd * hipSp;
    const kf = (sw * 0.1 + lift * 0.05) * h, af = (sw * 0.06 - lift * 0.06) * h;
    const kx = hx + fx * kf, ky = hy + h * 0.25 + fy * kf;
    const ax = kx + fx * af, ay = ky + h * (0.235 - lift * 0.045) + fy * af;
    knees.push([kx, ky]);
    if (w.type === 'skirt') {
      seg(hx, hy, kx, ky, h * 0.075);
      seg(kx, ky, ax, ay, h * 0.045);                                   // jambe fine
      seg(ax, ay, ax + fx * h * 0.05, ay + fy * h * 0.05 + h * 0.004, h * 0.035); // escarpin
      seg(ax - fx * h * 0.005, ay, ax - fx * h * 0.008, ay + h * 0.02, h * 0.018); // talon
    } else if (woman) {
      seg(hx, hy, kx, ky, h * 0.08);
      seg(kx, ky, ax, ay, h * 0.06);
      seg(ax, ay, ax + fx * h * 0.05, ay + fy * h * 0.05 + h * 0.004, h * 0.035);
    } else {
      seg(hx, hy, kx, ky, h * 0.1);                                     // pantalon de costume
      seg(kx, ky, ax, ay, h * 0.088);
      seg(ax, ay + h * 0.005, ax + fx * h * 0.07, ay + fy * h * 0.07 + h * 0.008, h * 0.05); // chaussure
    }
  });

  // jupe crayon qui suit l'écart des genoux
  if (w.type === 'skirt') {
    const hiW = h * 0.1 * wf;
    const mx = (knees[0][0] + knees[1][0]) / 2, my = Math.max(knees[0][1], knees[1][1]) + h * 0.01;
    const half = Math.max(h * 0.075 * wf, Math.abs(knees[0][0] - knees[1][0]) / 2 + h * 0.04);
    ctx.beginPath();
    ctx.moveTo(x - hiW * 0.8, hipY - h * 0.06);
    ctx.lineTo(x + hiW * 0.8, hipY - h * 0.06);
    ctx.quadraticCurveTo(x + hiW * 1.1, hipY + h * 0.02, mx + half, my);
    ctx.lineTo(mx - half, my);
    ctx.quadraticCurveTo(x - hiW * 1.1, hipY + h * 0.02, x - hiW * 0.8, hipY - h * 0.06);
    ctx.fill();
  }

  // buste
  const shW = h * (woman ? 0.1 : 0.14) * wf;
  const waW = h * (woman ? 0.068 : 0.092) * wf;
  const hiW = h * (woman ? 0.092 : 0.098) * wf;
  const hemY = hipY + h * (woman ? 0.02 : 0.07);                        // veste qui descend sur les hanches
  const waistY = shY + (hipY - shY) * 0.6;
  ctx.beginPath();
  ctx.moveTo(x - shW, shY + h * 0.06);
  ctx.quadraticCurveTo(x - shW * 0.98, shY + h * 0.01, x - shW * 0.45, shY - h * 0.015);
  ctx.lineTo(x + shW * 0.45, shY - h * 0.015);
  ctx.quadraticCurveTo(x + shW * 0.98, shY + h * 0.01, x + shW, shY + h * 0.06);
  ctx.quadraticCurveTo(x + waW * 1.02, waistY - h * 0.08, x + waW, waistY);
  ctx.quadraticCurveTo(x + hiW * 1.05, hemY - h * 0.05, x + hiW, hemY);
  ctx.lineTo(x - hiW, hemY);
  ctx.quadraticCurveTo(x - hiW * 1.05, hemY - h * 0.05, x - waW, waistY);
  ctx.quadraticCurveTo(x - waW * 1.02, waistY - h * 0.08, x - shW, shY + h * 0.06);
  ctx.fill();

  // bras (se balancent à l'opposé des jambes)
  [-1, 1].forEach(sd => {
    const a = Math.sin(ph + (sd > 0 ? Math.PI : 0)) * (woman ? 0.8 : 1);
    const sx = x + px * sd * shW * 0.88, sy = shY + h * 0.05 + py * sd * shW * 0.88;
    const ex = sx + fx * a * 0.06 * h + px * sd * h * 0.012, ey = sy + h * 0.15 + fy * a * 0.06 * h;
    const hx = ex + fx * (a * 0.085 + 0.025) * h, hy = ey + h * 0.135 + fy * (a * 0.085 + 0.025) * h;
    seg(sx, sy, ex, ey, h * (woman ? 0.052 : 0.07));
    seg(ex, ey, hx, hy, h * (woman ? 0.044 : 0.06));
  });

  // cou + tête
  const hx = x + fx * h * 0.01;
  seg(x, shY + h * 0.01, hx, shY - h * 0.045, h * (woman ? 0.042 : 0.055));
  if (woman) {
    const hy = shY - h * 0.095;
    ctx.beginPath(); ctx.ellipse(hx, hy, h * 0.063, h * 0.076, 0, 0, Math.PI * 2); ctx.fill();
    // cheveux longs : épousent la tête puis s'évasent sur les épaules et le dos
    const bx = hx - fx * h * 0.03;
    ctx.beginPath();
    ctx.moveTo(bx, hy - h * 0.088);
    ctx.bezierCurveTo(bx + h * 0.085, hy - h * 0.088, bx + h * 0.075, hy + h * 0.05, bx + h * 0.085, shY + h * 0.05);
    ctx.quadraticCurveTo(bx + h * 0.08, shY + h * 0.13, bx + h * 0.03, shY + h * 0.15);
    ctx.quadraticCurveTo(bx, shY + h * 0.12, bx - h * 0.03, shY + h * 0.15);
    ctx.quadraticCurveTo(bx - h * 0.08, shY + h * 0.13, bx - h * 0.085, shY + h * 0.05);
    ctx.bezierCurveTo(bx - h * 0.075, hy + h * 0.05, bx - h * 0.085, hy - h * 0.088, bx, hy - h * 0.088);
    ctx.fill();
  } else {
    const hy = shY - h * 0.1;
    ctx.beginPath(); ctx.ellipse(hx, hy, h * 0.066, h * 0.08, 0, 0, Math.PI * 2); ctx.fill();
    // cheveux courts : léger volume sur le dessus
    ctx.beginPath(); ctx.ellipse(hx - fx * h * 0.01, hy - h * 0.035, h * 0.064, h * 0.052, 0, 0, Math.PI * 2); ctx.fill();
  }
}

const stage = document.getElementById('campusStage');
const cv = document.getElementById('campusCanvas');
if (!stage || !cv) return;
const ctx = cv.getContext('2d');
const layer = document.createElement('canvas');   // calque des silhouettes, pour leur donner un fin contour lumineux
const lctx = layer.getContext('2d');
let clock = 0, last = performance.now(), running = true, raf = 0;
function resize() {
  const r = stage.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
  cv.width = layer.width = Math.round(r.width * dpr); cv.height = layer.height = Math.round(r.height * dpr);
}
new ResizeObserver(resize).observe(stage); resize();

// on ne dessine que lorsque le hero est à l'écran
new IntersectionObserver(([e]) => {
  running = e.isIntersecting;
  if (running && !raf) { last = performance.now(); raf = requestAnimationFrame(frame); }
}).observe(stage);

function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000); last = now;
  clock = (clock + dt) % LOOP;
  const k = cv.width / W;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height);
  ctx.setTransform(k, 0, 0, k, 0, 0);

  const glow = { dev: 0, ia: 0, sys: 0 }, visible = [];
  walkers.forEach(w => {
    const tau = ((clock - w.offset) % LOOP + LOOP) % LOOP;
    if (tau < w.dur) {
      const s = stateAt(w, tau);
      s.alpha = Math.min(1, s.remain / 30);
      visible.push({ w, s });
    }
    const since = tau - w.dur;
    if (since >= 0 && since < 2.5) glow[w.route.door] += Math.exp(-since / 0.7) * (1 - since / 2.5);
  });

  ctx.globalCompositeOperation = 'lighter';
  for (const d in glow) {
    const g = Math.min(1, glow[d]); if (g < 0.01) continue;
    const [gx, gy] = DOORS[d].glow;
    const rg = ctx.createRadialGradient(gx, gy, 0, gx, gy, 70);
    rg.addColorStop(0, `rgba(255,220,170,${0.22 * g})`); rg.addColorStop(1, 'rgba(255,220,170,0)');
    ctx.fillStyle = rg; ctx.beginPath(); ctx.ellipse(gx, gy, 70, 40, 0, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalCompositeOperation = 'source-over';

  visible.sort((a, b) => a.s.y - b.s.y);
  // ombres au sol directement sur la scène
  visible.forEach(({ w, s }) => {
    const h = BASE_H * scaleAt(s.y) * w.h;
    ctx.globalAlpha = s.alpha; ctx.fillStyle = 'rgba(0,0,0,.38)';
    ctx.beginPath(); ctx.ellipse(s.x, s.y, h * 0.18, h * 0.06, 0, 0, Math.PI * 2); ctx.fill();
  });
  ctx.globalAlpha = 1;

  // silhouettes dessinées sur un calque, puis collées avec un halo clair très léger (visibles même à contre-jour)
  const pass = list => {
    lctx.setTransform(1, 0, 0, 1, 0, 0); lctx.clearRect(0, 0, layer.width, layer.height);
    if (!list.length) return;
    lctx.setTransform(k, 0, 0, k, 0, 0);
    list.forEach(({ w, s }) => { lctx.globalAlpha = s.alpha; drawPerson(lctx, w, s); });
    lctx.globalAlpha = 1;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.shadowColor = 'rgba(215,228,255,.55)'; ctx.shadowBlur = Math.max(2, 2.2 * k);
    ctx.drawImage(layer, 0, 0);
    ctx.shadowColor = 'rgba(215,228,255,.35)'; ctx.shadowBlur = Math.max(1, 0.8 * k);
    ctx.drawImage(layer, 0, 0);
    ctx.shadowBlur = 0; ctx.shadowColor = 'transparent';
    ctx.setTransform(k, 0, 0, k, 0, 0);
  };
  // 1) les gens derrière le rond central, 2) l'arbre par-dessus eux, 3) tous les autres
  pass(visible.filter(v => v.s.y < BEHIND_Y));
  if (OCC.img.complete) ctx.drawImage(OCC.img, OCC.x, OCC.y, OCC.w, OCC.h);
  pass(visible.filter(v => v.s.y >= BEHIND_Y));
  raf = running ? requestAnimationFrame(frame) : 0;
}
raf = requestAnimationFrame(frame);
})();
