import assert from "node:assert/strict";
import { test } from "node:test";
import { PRESETS, OPTIONS, GROUPS, PACKAGES } from "../src/pricing/data.js";
import { compute, stateFromPreset, createState, encodeState, decodeState } from "../src/pricing/compute.js";

test("chaque exemple de devis de la grille retombe sur son total", () => {
  for (const preset of PRESETS) {
    const result = compute(stateFromPreset(preset));
    assert.equal(result.oneTime.ht, preset.total, `${preset.title}: attendu ${preset.total}, obtenu ${result.oneTime.ht}`);
  }
});

test("TVA à 20 % et TTC cohérents", () => {
  const r = compute(stateFromPreset(PRESETS[0]));
  assert.equal(r.oneTime.tva, 268);
  assert.equal(r.oneTime.ttc, 1608);
  assert.equal(r.monthly.ht, 29);
  assert.equal(r.monthly.ttc, 34.8);
});

test("les options incluses dans un forfait ne coûtent rien", () => {
  const s = createState("pro");
  s.options.blog = { qty: 1 };
  s.options.galerie = { qty: 1 };
  const r = compute(s);
  assert.equal(r.oneTime.ht, 1490);
  assert.ok(r.lines.filter(l => l.included).length === 2);
});

test("multilingue = 350 + 60 × langues × pages", () => {
  const s = createState("pro");
  s.options.multilingue = { langues: 2, pages: 8 };
  assert.equal(compute(s).oneTime.ht, 1490 + 350 + 60 * 2 * 8);
});

test("modules au-delà des inclus sont facturés, majoration règles métier sur modules payants", () => {
  const s = createState("dynamique");
  s.options.mod_crm = { qty: 1 };     // inclus (1 slot)
  s.options.mod_devis = { qty: 1 };   // 1500
  s.modifiers.complex = true;
  const r = compute(s);
  assert.equal(r.oneTime.complexSurcharge, 450);
  assert.equal(r.oneTime.ht, 2900 + 1500 + 450);
});

test("refonte −20 % sur le forfait puis délai réduit +25 % sur le projet", () => {
  const s = createState("essentiel");
  s.options.seo_local = { qty: 1 };
  s.modifiers.redesign = true;
  s.modifiers.rush = true;
  const r = compute(s);
  assert.equal(r.oneTime.forfait, 712);
  assert.equal(r.oneTime.rushSurcharge, Math.round((712 + 200) * 0.25));
});

test("les options non disponibles pour le forfait sont ignorées", () => {
  const s = createState("essentiel");
  s.options.mod_crm = { qty: 1 };
  s.options.variantes = { qty: 1 };
  assert.equal(compute(s).oneTime.ht, 890);
});

test("encode/decode de l'état est stable", () => {
  for (const preset of PRESETS) {
    const s = stateFromPreset(preset);
    s.extras.email_pro = { qty: 3 };
    s.modifiers.rush = true;
    const back = decodeState(encodeState(s));
    assert.deepEqual(compute(back).oneTime, compute(s).oneTime);
    assert.deepEqual(compute(back).monthly, compute(s).monthly);
  }
});

test("données cohérentes : groupes et forfaits référencés existent", () => {
  const groups = new Set(GROUPS.map(g => g.id));
  const pkgs = new Set(PACKAGES.map(p => p.id));
  const ids = new Set();
  for (const o of OPTIONS) {
    assert.ok(groups.has(o.group), `groupe inconnu ${o.group}`);
    assert.ok(!ids.has(o.id), `id en double ${o.id}`);
    ids.add(o.id);
    for (const p of [...(o.includedIn || []), ...(o.availableFor || [])]) assert.ok(pkgs.has(p), `forfait inconnu ${p}`);
  }
});
