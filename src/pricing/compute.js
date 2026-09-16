import {
  PACKAGES, OPTIONS, GROUPS, MAINTENANCE, EXTRAS, MODIFIERS, TVA_RATE,
} from "./data.js";

const byId = list => Object.fromEntries(list.map(item => [item.id, item]));
export const PACKAGE_BY_ID = byId(PACKAGES);
export const OPTION_BY_ID = byId(OPTIONS);
export const GROUP_BY_ID = byId(GROUPS);
export const MAINTENANCE_BY_ID = byId(MAINTENANCE);
export const EXTRA_BY_ID = byId(EXTRAS);

export const SURCHARGES = { rush: 0.25, complex: 0.3, redesign: 0.2 };

/** Un état vide, prêt pour le forfait donné. */
export function createState(pkgId = "pro") {
  return {
    pkg: pkgId,
    /** id -> quantités { qty } ou { langues, pages } ; l'ordre d'insertion sert aux modules inclus. */
    options: {},
    maintenance: suggestedMaintenance(pkgId),
    extras: {},
    modifiers: { redesign: false, rush: false, complex: false },
  };
}

export function suggestedMaintenance(pkgId) {
  const plan = MAINTENANCE.find(m => m.suggestedFor.includes(pkgId));
  return plan ? plan.id : null;
}

export function isGroupAvailable(group, pkgId) {
  return group.availableFor.includes(pkgId);
}

export function isOptionAvailable(option, pkgId) {
  const group = GROUP_BY_ID[option.group];
  if (!isGroupAvailable(group, pkgId)) return false;
  return option.availableFor ? option.availableFor.includes(pkgId) : true;
}

export function isOptionIncluded(option, pkgId) {
  return Boolean(option.includedIn && option.includedIn.includes(pkgId));
}

export function isModifierAvailable(modifier, pkgId) {
  return modifier.availableFor ? modifier.availableFor.includes(pkgId) : true;
}

export function defaultQuantities(option, pkg) {
  if (option.quantities) {
    return Object.fromEntries(
      option.quantities.map(q => [q.key, typeof q.def === "function" ? q.def(pkg) : q.def])
    );
  }
  return { qty: 1 };
}

/** Prix d'une ligne d'option pour des quantités données (sans inclusion ni majoration). */
export function optionAmount(option, quantities) {
  if (option.calc) return option.calc(quantities);
  const qty = option.unit ? Math.max(1, Number(quantities.qty) || 1) : 1;
  return option.price * qty;
}

/**
 * Applique la grille à un état et retourne le détail complet :
 * lignes une fois / mensuelles, sous-totaux, TVA, mention « à partir de ».
 */
export function compute(state) {
  const pkg = PACKAGE_BY_ID[state.pkg] || PACKAGES[0];
  const mods = state.modifiers || {};
  const lines = [];
  const monthlyLines = [];
  let from = Boolean(pkg.from);

  /* Forfait */
  let forfait = pkg.price;
  let redesignDiscount = 0;
  if (mods.redesign) {
    redesignDiscount = Math.round(pkg.price * SURCHARGES.redesign);
    forfait -= redesignDiscount;
  }
  lines.push({
    kind: "package",
    label: pkg.name,
    detail: mods.redesign ? "Refonte : remise de 20 % sur le forfait" : `Forfait · livraison sous ${pkg.delay}`,
    amount: forfait,
    from: pkg.from,
  });

  /* Options */
  let slotsLeft = pkg.moduleSlots;
  let optionsTotal = 0;
  let modulesTotal = 0;

  for (const [id, quantities] of Object.entries(state.options || {})) {
    const option = OPTION_BY_ID[id];
    if (!option || !isOptionAvailable(option, pkg.id)) continue;

    const included = isOptionIncluded(option, pkg.id);
    const usesSlot = !included && option.moduleSlot && slotsLeft > 0;
    if (usesSlot) slotsLeft -= 1;

    const base = optionAmount(option, quantities);
    const amount = included || usesSlot ? 0 : base;
    const isModule = option.group === "modules";

    if (option.monthly) {
      monthlyLines.push({ kind: "option", id, label: option.name, amount: base, from: option.from });
      continue;
    }

    optionsTotal += amount;
    if (isModule) modulesTotal += amount;
    if (option.from && amount > 0) from = true;

    lines.push({
      kind: "option",
      id,
      label: option.name,
      detail: lineDetail(option, quantities, { included, usesSlot }),
      amount,
      included: included || usesSlot,
      from: option.from && amount > 0,
    });
  }

  /* Majorations */
  let complexSurcharge = 0;
  if (mods.complex && isModifierAvailable(MODIFIERS.find(m => m.id === "complex"), pkg.id) && modulesTotal > 0) {
    complexSurcharge = Math.round(modulesTotal * SURCHARGES.complex);
    lines.push({
      kind: "modifier",
      label: "Règles métier particulières",
      detail: "+30 % sur les modules (jusqu'à +50 % selon la complexité)",
      amount: complexSurcharge,
      from: true,
    });
    from = true;
  }

  const beforeRush = forfait + optionsTotal + complexSurcharge;
  let rushSurcharge = 0;
  if (mods.rush) {
    rushSurcharge = Math.round(beforeRush * SURCHARGES.rush);
    lines.push({
      kind: "modifier",
      label: "Délai réduit de moitié",
      detail: "+25 % sur le projet",
      amount: rushSurcharge,
    });
  }

  const ht = beforeRush + rushSurcharge;
  const tva = round2(ht * TVA_RATE);
  const ttc = round2(ht + tva);

  /* Mensuel */
  const plan = state.maintenance ? MAINTENANCE_BY_ID[state.maintenance] : null;
  if (plan) {
    monthlyLines.unshift({ kind: "maintenance", id: plan.id, label: plan.name, amount: plan.price, from: plan.from });
  }
  for (const [id, quantities] of Object.entries(state.extras || {})) {
    const extra = EXTRA_BY_ID[id];
    if (!extra) continue;
    const qty = Math.max(1, Number(quantities.qty) || 1);
    monthlyLines.push({
      kind: "extra",
      id,
      label: extra.name,
      detail: qty > 1 ? `${qty} ${extra.unit}s × ${formatEuro(extra.price)}` : null,
      amount: extra.price * qty,
    });
  }
  const monthlyHt = monthlyLines.reduce((sum, line) => sum + line.amount, 0);
  const monthlyFrom = monthlyLines.some(line => line.from);

  return {
    pkg,
    lines,
    oneTime: {
      forfait,
      redesignDiscount,
      options: optionsTotal,
      complexSurcharge,
      rushSurcharge,
      ht,
      tva,
      ttc,
      from,
    },
    monthly: {
      lines: monthlyLines,
      ht: monthlyHt,
      tva: round2(monthlyHt * TVA_RATE),
      ttc: round2(monthlyHt * (1 + TVA_RATE)),
      from: monthlyFrom,
    },
    slotsUsed: pkg.moduleSlots - slotsLeft,
    slotsTotal: pkg.moduleSlots,
  };
}

function lineDetail(option, quantities, { included, usesSlot }) {
  if (included) return "Inclus dans le forfait";
  if (usesSlot) return "Module inclus dans le socle";
  if (option.calc && option.quantities) {
    const parts = option.quantities.map(q => `${quantities[q.key]} ${q.label}`);
    return parts.join(" · ");
  }
  if (option.unit) {
    const qty = Math.max(1, Number(quantities.qty) || 1);
    return `${qty} × ${formatEuro(option.price)} / ${option.unitShort || option.unit}`;
  }
  return null;
}

function round2(value) {
  return Math.round(value * 100) / 100;
}

const euro = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function formatEuro(value) {
  return euro.format(value).replace(/ €/, " €");
}

/** Libellé de prix affiché dans le catalogue (« 120 € / page », « à partir de 600 € », …). */
export function priceLabel(option) {
  if (option.priceLabel) return option.priceLabel;
  let label = formatEuro(option.price);
  if (option.unit) label += ` / ${option.unitShort || option.unit}`;
  if (option.monthly) label += " / mois";
  if (option.from) label = `à partir de ${label}`;
  return label;
}

/** Sérialisation compacte de l'état pour l'URL (partage / rechargement). */
export function encodeState(state) {
  const params = new URLSearchParams();
  params.set("f", state.pkg);
  const opts = Object.entries(state.options).map(([id, q]) => {
    const option = OPTION_BY_ID[id];
    if (option && option.quantities) return `${id}:${option.quantities.map(k => q[k.key]).join("x")}`;
    return q.qty && q.qty > 1 ? `${id}:${q.qty}` : id;
  });
  if (opts.length) params.set("o", opts.join(","));
  if (state.maintenance) params.set("m", state.maintenance);
  else params.set("m", "0");
  const extras = Object.entries(state.extras).map(([id, q]) => (q.qty > 1 ? `${id}:${q.qty}` : id));
  if (extras.length) params.set("e", extras.join(","));
  const flags = Object.entries(state.modifiers).filter(([, on]) => on).map(([id]) => id);
  if (flags.length) params.set("x", flags.join(","));
  return params.toString();
}

export function decodeState(query) {
  const params = new URLSearchParams(query);
  const pkgId = params.get("f");
  if (!pkgId || !PACKAGE_BY_ID[pkgId]) return null;
  const state = createState(pkgId);
  const pkg = PACKAGE_BY_ID[pkgId];

  for (const token of (params.get("o") || "").split(",").filter(Boolean)) {
    const [id, raw] = token.split(":");
    const option = OPTION_BY_ID[id];
    if (!option) continue;
    if (option.quantities) {
      const values = (raw || "").split("x").map(Number);
      const q = defaultQuantities(option, pkg);
      option.quantities.forEach((spec, index) => {
        if (Number.isFinite(values[index]) && values[index] >= spec.min) q[spec.key] = Math.min(spec.max, values[index]);
      });
      state.options[id] = q;
    } else {
      const qty = Math.max(1, Math.min(200, Number(raw) || 1));
      state.options[id] = { qty };
    }
  }

  const m = params.get("m");
  if (m === "0") state.maintenance = null;
  else if (m && MAINTENANCE_BY_ID[m]) state.maintenance = m;

  for (const token of (params.get("e") || "").split(",").filter(Boolean)) {
    const [id, raw] = token.split(":");
    if (EXTRA_BY_ID[id]) state.extras[id] = { qty: Math.max(1, Math.min(50, Number(raw) || 1)) };
  }

  for (const flag of (params.get("x") || "").split(",")) {
    if (flag in state.modifiers) state.modifiers[flag] = true;
  }
  return state;
}

/** Construit l'état correspondant à un exemple de devis. */
export function stateFromPreset(preset) {
  const state = createState(preset.pkg);
  const pkg = PACKAGE_BY_ID[preset.pkg];
  for (const [id, value] of Object.entries(preset.options)) {
    const option = OPTION_BY_ID[id];
    if (!option) continue;
    if (typeof value === "object") state.options[id] = { ...defaultQuantities(option, pkg), ...value };
    else state.options[id] = { qty: value };
  }
  state.maintenance = preset.maintenance || null;
  return state;
}
