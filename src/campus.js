// Campus animé du hero : silhouettes qui rejoignent les bâtiments Dev Web, IA et Sys/Infra.
(() => {
const W = 1671, H = 941;
const LOOP = 84;   // durée de la boucle (s) : la scène est strictement identique toutes les 84 s

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
      speed: (36 + rnd() * 8) * 0.7,   // pas tranquille
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
const PRESET = [[5.6,-15],[36,-15],[61.6,0],[12.8,0],[41.4,-7.5],[65.4,15],[9,-15],[33.6,-15],[72.6,-15],[31.8,-15],[42.6,0],[71.8,15],[11.8,-15],[40,-15],[78.2,15],[16.6,7.5],[44.4,15],[77.4,7.5],[22.2,7.5],[45.4,-7.5],[63.8,-15],[41,-15],[51,-7.5],[50.2,0],[6.2,0],[78.6,-15],[0.2,15],[20,-15],[55.8,15],[77,0],[36.6,-7.5],[63.8,15],[6.2,7.5],[31.8,15],[46.2,15],[10.8,15],[1.8,-7.5],[56.4,-15],[71.6,0],[50.8,7.5],[8.2,-7.5],[60.6,-15],[76.6,0],[36.8,7.5],[21,-15],[48,15],[0,-15],[33.6,15],[19.2,7.5]];
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

// Silhouettes "gens d'affaires" : costume, femme en jupe (cheveux longs) ou en pantalon (queue de cheval).
// La marche suit un vrai cycle : le pied d'appui reste posé au sol, le genou plie pendant le balancement,
// le bassin monte et descend deux fois par cycle, les bras balancent à l'opposé avec le coude qui se plie.
const INK = '#0d1017', INK_BACK = '#1b202a';   // membres du côté éloigné un peu plus clairs : on lit mieux la foulée
const DUTY = 0.58;                             // part du cycle où le pied est au sol
const hash = (i, salt) => { const v = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453; return v - Math.floor(v); };
walkers.forEach((w, i) => {
  const r = hash(i, 1);
  w.acc = w.type === 'suit' ? (r < 0.4 ? 'case' : 'none')
        : w.type === 'skirt' ? (r < 0.5 ? 'bag' : 'none')
        : (r < 0.45 ? 'pack' : 'none');
  w.hairVar = hash(i, 2);
});

function drawPerson(ctx, w, s) {
  const h = BASE_H * scaleAt(s.y) * w.h;
  const woman = w.type !== 'suit';
  const x = s.x, y = s.y;
  const fx = s.ux, fy = s.uy;                   // axe avant, dans le plan de l'image
  const px = -s.uy, py = s.ux * 0.5;            // axe latéral, écrasé par la perspective
  const wf = 0.55 + 0.45 * Math.abs(s.uy);      // largeur apparente : de profil étroit, de face large
  const S = h * (woman ? 0.3 : 0.33) * w.strideMul;   // longueur d'un pas
  const cyc = s.dist / (2 * S);
  const bob = Math.cos(2 * Math.PI * (2 * cyc - DUTY)) * h * 0.02;   // plus haut quand la jambe d'appui passe sous le bassin
  const hipY = y - h * 0.49 - bob;
  const shY = hipY - h * 0.31;
  const hipSp = h * (woman ? 0.036 : 0.046);
  const far = py >= 0 ? -1 : 1;                 // côté le plus loin de la caméra
  const T = h * 0.25, SH = h * 0.236;          // cuisse, tibia

  ctx.lineCap = ctx.lineJoin = 'round';
  const seg = (ax, ay, bx, by, wd) => { ctx.lineWidth = wd; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke(); };
  const ink = c => { ctx.fillStyle = ctx.strokeStyle = c; };
  const phaseOf = sd => (((cyc + (sd > 0 ? 0 : 0.5)) % 1) + 1) % 1;

  // --- jambes (cinématique inverse à deux segments, genou vers l'avant)
  const legs = {};
  [-1, 1].forEach(sd => {
    const p = phaseOf(sd);
    let a, lift = 0, ang;
    if (p < DUTY) {
      const q = p / DUTY;
      a = S * DUTY * (1 - 2 * q);                // pied immobile au sol pendant que le corps avance
      ang = q > 0.72 ? (q - 0.72) / 0.28 * 0.55 : 0;   // le talon décolle en fin d'appui
    } else {
      const q = (p - DUTY) / (1 - DUTY), e = q * q * (3 - 2 * q);
      a = S * DUTY * (2 * e - 1);
      lift = Math.sin(Math.PI * Math.min(1, q * 1.15)) * h * 0.055;
      ang = 0.55 * (1 - q) * (1 - q) - 0.25 * Math.sin(Math.PI * q);   // pointe tendue puis relevée avant l'attaque du talon
    }
    const hx = x + px * sd * hipSp, hy = hipY + py * sd * hipSp;
    let b = h * 0.49 + bob - h * 0.025 - lift;
    let d = Math.hypot(a, b); const dmax = (T + SH) * 0.998;
    if (d > dmax) { a *= dmax / d; b *= dmax / d; d = dmax; }
    const al = Math.acos(Math.max(-1, Math.min(1, (T * T + d * d - SH * SH) / (2 * T * d))));
    const dx = a / d, dy = b / d;
    const ka = T * (Math.cos(al) * dx + Math.sin(al) * dy), kb = T * (Math.cos(al) * dy - Math.sin(al) * dx);
    const P = (sa, sb) => [hx + fx * sa, hy + fy * sa + sb];
    const fl = h * (woman ? 0.066 : 0.078);
    legs[sd] = { hip: [hx, hy], knee: P(ka, kb), ankle: P(a, b), toe: P(a + fl * Math.cos(ang), b + fl * Math.sin(ang)), p };
  });

  const drawLeg = sd => {
    const L = legs[sd];
    if (w.type === 'skirt') {
      seg(...L.hip, ...L.knee, h * 0.07);
      seg(...L.knee, ...L.ankle, h * 0.042);
      seg(...L.ankle, ...L.toe, h * 0.03);
    } else if (woman) {
      seg(...L.hip, ...L.knee, h * 0.078);
      seg(...L.knee, ...L.ankle, h * 0.058);
      seg(...L.ankle, ...L.toe, h * 0.034);
    } else {
      seg(...L.hip, ...L.knee, h * 0.098);      // pantalon de costume, légèrement évasé en bas
      seg(...L.knee, ...L.ankle, h * 0.086);
      seg(L.ankle[0], L.ankle[1] + h * 0.006, L.toe[0], L.toe[1] + h * 0.008, h * 0.045);
    }
  };

  // --- haut du corps légèrement penché vers l'avant (cisaillement autour du bassin)
  const lean = h * 0.028;
  const kx = -fx * lean / (hipY - shY);
  const upper = fn => { ctx.save(); ctx.transform(1, 0, kx, 1, -kx * hipY, 0); fn(); ctx.restore(); };

  const shW = h * (woman ? 0.1 : 0.138) * wf;
  const armDraw = sd => {
    const p = phaseOf(sd);
    const carrying = w.acc === 'case' && sd === -far;
    const A = (woman ? 0.34 : 0.42) * (carrying ? 0.35 : 1);
    const th = -A * Math.cos(2 * Math.PI * p);  // opposé à la jambe du même côté
    const th2 = carrying ? th * 0.8 : th + 0.1 + 0.4 * Math.max(0, th / A);
    const U = h * 0.165, F = h * 0.15;
    const sx = x + px * sd * shW * 0.86, sy = shY + h * 0.045 + py * sd * shW * 0.86;
    const ea = U * Math.sin(th), eb = U * Math.cos(th);
    const ha = ea + F * Math.sin(th2), hb = eb + F * Math.cos(th2);
    const ex = sx + fx * ea, ey = sy + fy * ea + eb, hx = sx + fx * ha, hy = sy + fy * ha + hb;
    seg(sx, sy, ex, ey, h * (woman ? 0.05 : 0.066));
    seg(ex, ey, hx, hy, h * (woman ? 0.042 : 0.056));
    ctx.beginPath(); ctx.arc(hx, hy, h * 0.026, 0, Math.PI * 2); ctx.fill();
    if (carrying) {                             // mallette
      const cw = h * 0.075, ch = h * 0.085, ox = fx * cw, oy = fy * cw * 0.5;
      ctx.beginPath();
      ctx.moveTo(hx - ox, hy - oy + h * 0.015); ctx.lineTo(hx + ox, hy + oy + h * 0.015);
      ctx.lineTo(hx + ox, hy + oy + h * 0.015 + ch); ctx.lineTo(hx - ox, hy - oy + h * 0.015 + ch);
      ctx.closePath(); ctx.fill();
    }
  };

  // 1) côté éloigné
  ink(INK_BACK);
  drawLeg(far);
  upper(() => armDraw(far));
  if (w.acc === 'pack') upper(() => {           // sac à dos derrière le buste
    const bx = x - fx * h * 0.06, bw = shW * 0.8;
    ctx.beginPath();
    ctx.moveTo(bx - bw, shY + h * 0.03); ctx.lineTo(bx + bw, shY + h * 0.03);
    ctx.lineTo(bx + bw * 1.05, shY + h * 0.22); ctx.lineTo(bx - bw * 1.05, shY + h * 0.22);
    ctx.closePath(); ctx.fill();
  });

  // 2) jambe proche, jupe, buste, tête
  ink(INK);
  drawLeg(-far);
  if (w.type === 'skirt') {                     // jupe crayon qui suit l'écart des genoux
    const k0 = legs[-1].knee, k1 = legs[1].knee, hiW = h * 0.1 * wf;
    const mx = (k0[0] + k1[0]) / 2, my = Math.max(k0[1], k1[1]) + h * 0.012;
    const half = Math.max(h * 0.072 * wf, Math.abs(k0[0] - k1[0]) / 2 + h * 0.038);
    ctx.beginPath();
    ctx.moveTo(x - hiW * 0.8, hipY - h * 0.06);
    ctx.lineTo(x + hiW * 0.8, hipY - h * 0.06);
    ctx.quadraticCurveTo(x + hiW * 1.1, hipY + h * 0.02, mx + half, my);
    ctx.lineTo(mx - half, my);
    ctx.quadraticCurveTo(x - hiW * 1.1, hipY + h * 0.02, x - hiW * 0.8, hipY - h * 0.06);
    ctx.fill();
  }

  upper(() => {
    const waW = h * (woman ? 0.066 : 0.09) * wf;
    const hiW = h * (woman ? 0.09 : 0.097) * wf;
    const hemY = hipY + h * (woman ? 0.02 : 0.075);   // veste qui descend sur les hanches
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

    if (w.acc === 'bag') {                      // sac porté à l'épaule, qui se balance un peu
      const sd = -far, sw = Math.sin(2 * Math.PI * cyc) * h * 0.012;
      const sx = x + px * sd * shW * 0.7, sy = shY + h * 0.01 + py * sd * shW * 0.7;
      const bx = x + px * sd * hiW * 1.25 - fx * h * 0.02 + fx * sw, by = hipY - h * 0.02;
      ctx.lineWidth = h * 0.012; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(bx, by - h * 0.04); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(bx, by, h * 0.05, h * 0.042, 0, 0, Math.PI * 2); ctx.fill();
    }

    // cou + tête (légère oscillation avec le pas)
    const nod = Math.sin(4 * Math.PI * cyc) * h * 0.004;
    const hx = x + fx * h * 0.012;
    seg(x, shY + h * 0.01, hx, shY - h * 0.045, h * (woman ? 0.04 : 0.052));
    if (woman) {
      const hy = shY - h * 0.095 + nod;
      ctx.beginPath(); ctx.ellipse(hx, hy, h * 0.061, h * 0.074, 0, 0, Math.PI * 2); ctx.fill();
      const bx = hx - fx * h * 0.03;
      if (w.type === 'skirt') {                 // cheveux longs : épousent la tête puis s'évasent sur les épaules
        const len = 0.12 + w.hairVar * 0.05;
        ctx.beginPath();
        ctx.moveTo(bx, hy - h * 0.086);
        ctx.bezierCurveTo(bx + h * 0.083, hy - h * 0.086, bx + h * 0.074, hy + h * 0.05, bx + h * 0.08, shY + h * 0.04);
        ctx.quadraticCurveTo(bx + h * 0.075, shY + h * len, bx + h * 0.03, shY + h * (len + 0.02));
        ctx.quadraticCurveTo(bx, shY + h * (len - 0.01), bx - h * 0.03, shY + h * (len + 0.02));
        ctx.quadraticCurveTo(bx - h * 0.075, shY + h * len, bx - h * 0.08, shY + h * 0.04);
        ctx.bezierCurveTo(bx - h * 0.074, hy + h * 0.05, bx - h * 0.083, hy - h * 0.086, bx, hy - h * 0.086);
        ctx.fill();
      } else {                                  // queue de cheval qui suit le mouvement
        ctx.beginPath(); ctx.ellipse(hx - fx * h * 0.006, hy - h * 0.022, h * 0.064, h * 0.06, 0, 0, Math.PI * 2); ctx.fill();
        const tx = hx - fx * h * 0.06, ty = hy - h * 0.03, sway = Math.sin(4 * Math.PI * cyc + 1) * h * 0.012;
        ctx.lineWidth = h * 0.032;
        ctx.beginPath(); ctx.moveTo(tx, ty);
        ctx.quadraticCurveTo(tx - fx * h * 0.05, ty + h * 0.03, tx - fx * h * 0.035 + sway * fx, ty + h * 0.1);
        ctx.stroke();
      }
    } else {
      const hy = shY - h * 0.1 + nod;
      ctx.beginPath(); ctx.ellipse(hx, hy, h * 0.064, h * 0.078, 0, 0, Math.PI * 2); ctx.fill();
      // cheveux courts : léger volume sur le dessus, plus ou moins marqué
      const vol = 0.048 + w.hairVar * 0.012;
      ctx.beginPath(); ctx.ellipse(hx - fx * h * 0.012, hy - h * 0.034, h * 0.064, h * vol, 0, 0, Math.PI * 2); ctx.fill();
      // col de chemise clair visible de face
      if (s.uy > 0.35) {
        ctx.fillStyle = 'rgba(190,200,220,.35)';
        ctx.beginPath();
        ctx.moveTo(x - h * 0.022, shY - h * 0.012); ctx.lineTo(x + h * 0.022, shY - h * 0.012); ctx.lineTo(x, shY + h * 0.05);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = INK;
      }
    }

    ink(INK);
    armDraw(-far);
  });
}

const stage = document.getElementById('campusStage');
const cv = document.getElementById('campusCanvas');
if (!stage || !cv) return;
const ctx = cv.getContext('2d');
const layer = document.createElement('canvas');   // calque des silhouettes, pour leur donner un fin contour lumineux
const lctx = layer.getContext('2d');
const rim = document.createElement('canvas');     // liseré de lumière sur le haut des silhouettes
const rctx = rim.getContext('2d');
let clock = 0, last = performance.now(), running = true, raf = 0;
function resize() {
  const r = stage.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
  cv.width = layer.width = rim.width = Math.round(r.width * dpr); cv.height = layer.height = rim.height = Math.round(r.height * dpr);
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
    const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, h * 0.2);
    g.addColorStop(0, 'rgba(0,0,0,.3)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = s.alpha; ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(s.x, s.y, h * 0.2, h * 0.065, 0, 0, Math.PI * 2); ctx.fill();
  });
  ctx.globalAlpha = 1;

  // silhouettes dessinées sur un calque, puis collées avec un très léger contour et un liseré de lumière
  // sur le haut (comme l'éclairage des lampadaires), pour qu'elles se fondent dans la scène sans découpe dure
  const pass = list => {
    lctx.setTransform(1, 0, 0, 1, 0, 0); lctx.clearRect(0, 0, layer.width, layer.height);
    if (!list.length) return;
    lctx.setTransform(k, 0, 0, k, 0, 0);
    list.forEach(({ w, s }) => { lctx.globalAlpha = s.alpha; drawPerson(lctx, w, s); });
    lctx.globalAlpha = 1;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.shadowColor = 'rgba(160,178,210,.16)'; ctx.shadowBlur = Math.max(1, 1.1 * k);
    ctx.drawImage(layer, 0, 0);
    ctx.shadowBlur = 0; ctx.shadowColor = 'transparent';
    rctx.globalCompositeOperation = 'copy'; rctx.drawImage(layer, 0, 0);
    rctx.globalCompositeOperation = 'source-in'; rctx.fillStyle = 'rgba(214,222,240,.38)'; rctx.fillRect(0, 0, rim.width, rim.height);
    rctx.globalCompositeOperation = 'destination-out'; rctx.drawImage(layer, 0.35 * k, 0.9 * k);
    ctx.drawImage(rim, 0, 0);
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
