import {
  PACKAGES, GROUPS, OPTIONS, MAINTENANCE, EXTRAS, INFO_SERVICES, MODIFIERS, PRESETS, EDITION,
} from "./pricing/data.js";
import {
  PACKAGE_BY_ID, OPTION_BY_ID, EXTRA_BY_ID,
  compute, createState, suggestedMaintenance, isGroupAvailable, isOptionAvailable, isOptionIncluded,
  isModifierAvailable, defaultQuantities, optionAmount, formatEuro, priceLabel,
  encodeState, decodeState, stateFromPreset,
} from "./pricing/compute.js";
import { downloadEstimatePdf } from "./devis-pdf.js";

const $ = (sel, root = document) => root.querySelector(sel);
const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const els = {
  forfaits: $("#forfaits"),
  main: $("#simMain"),
  summary: $("#simSummary"),
  presets: $("#presets"),
};
if (!els.forfaits || !els.main || !els.summary) throw new Error("Simulateur : conteneurs manquants");

/* ------------------------------------------------------------------ STATE */
let state = decodeState(location.search) || createState("pro");
let activePreset = null;
let result = compute(state);
let mobileOpen = false;

function setState(mutate, { rerender = false } = {}) {
  mutate(state);
  result = compute(state);
  if (rerender) renderMain();
  else refreshRows();
  renderForfaits();
  renderSummary();
  syncUrl();
}

function syncUrl() {
  const query = encodeState(state);
  history.replaceState(null, "", `${location.pathname}?${query}${location.hash}`);
}

function selectPackage(pkgId, { keepOptions = true } = {}) {
  activePreset = null;
  setState(s => {
    const previous = s.pkg;
    s.pkg = pkgId;
    if (!keepOptions) s.options = {};
    // Maintenance follows the package unless the visitor chose something else on purpose.
    if (s.maintenance === suggestedMaintenance(previous) || s.maintenance === null) {
      s.maintenance = suggestedMaintenance(pkgId);
    }
    if (pkgId !== "dynamique" && pkgId !== "app") s.modifiers.complex = false;
  }, { rerender: true });
  renderPresets();
}

/* --------------------------------------------------------------- FORFAITS */
function renderForfaits() {
  els.forfaits.querySelectorAll(".forfait").forEach(card => {
    const selected = card.dataset.pkg === state.pkg;
    card.classList.toggle("is-selected", selected);
    card.setAttribute("aria-pressed", String(selected));
  });
}

els.forfaits.addEventListener("click", event => {
  const card = event.target.closest(".forfait");
  if (!card) return;
  selectPackage(card.dataset.pkg);
  const target = $("#simMain");
  if (window.innerWidth < 980) target.scrollIntoView({ behavior: "smooth", block: "start" });
});

/* ---------------------------------------------------------------- PRESETS */
function renderPresets() {
  if (!els.presets) return;
  els.presets.innerHTML =
    `<span style="color:var(--muted);font-size:15px;align-self:center">Partir d'un exemple :</span>` +
    PRESETS.map(p => `
      <button type="button" class="preset${activePreset === p.id ? " is-active" : ""}" data-preset="${p.id}" title="${esc(p.desc)}">
        ${esc(p.title)} <em>${formatEuro(p.total)}</em>
      </button>`).join("");
}

els.presets?.addEventListener("click", event => {
  const button = event.target.closest("[data-preset]");
  if (!button) return;
  const preset = PRESETS.find(p => p.id === button.dataset.preset);
  state = stateFromPreset(preset);
  activePreset = preset.id;
  result = compute(state);
  renderMain();
  renderForfaits();
  renderSummary();
  renderPresets();
  syncUrl();
});

/* ------------------------------------------------------------ CATALOGUE */
function renderMain() {
  const pkg = PACKAGE_BY_ID[state.pkg];
  const groupsHtml = GROUPS.map(group => renderGroup(group, pkg)).join("");
  const modifiersHtml = MODIFIERS.filter(m => isModifierAvailable(m, pkg.id)).map(renderModifier).join("");

  els.main.innerHTML = `
    <div>
      <div class="sim-step">
        <span>ÉTAPE 02</span>
        <div class="sim-step-copy">
          <h2>Ajoutez vos options</h2>
          <p>Prix unitaires, à ajouter au forfait <strong style="color:#fff;font-weight:500">${esc(pkg.name)}</strong>. Les options déjà comprises dans ce forfait sont marquées « inclus ».</p>
        </div>
      </div>
      <div class="sim-groups">${groupsHtml}</div>
    </div>

    <div>
      <div class="sim-step">
        <span>ÉTAPE 03</span>
        <div class="sim-step-copy">
          <h2>Ajustez le projet</h2>
          <p>Ce qui peut faire varier le prix, dans un sens comme dans l'autre.</p>
        </div>
      </div>
      <div class="sim-group">
        <div class="opts">${modifiersHtml}</div>
      </div>
    </div>

    <div>
      <div class="sim-step">
        <span>ÉTAPE 04</span>
        <div class="sim-step-copy">
          <h2>Après la mise en ligne</h2>
          <p>Hébergement, maintenance et services : facturés chaque mois, séparément du projet.</p>
        </div>
      </div>
      <div class="sim-group">
        <div class="sim-group-head">
          <h3>Forfait Sérénité</h3>
          <small>Hébergement, sauvegardes, mises à jour et modifications chaque mois</small>
        </div>
        <div class="opts" id="maintenanceOpts">
          ${MAINTENANCE.map(plan => renderMaintenance(plan, pkg)).join("")}
          ${renderMaintenance(null, pkg)}
        </div>
        <div class="sim-group-head" style="border-top:1px solid var(--line)">
          <h3>Services</h3>
        </div>
        <div class="opts">${EXTRAS.map(renderExtra).join("")}</div>
        <div class="sim-info">
          ${INFO_SERVICES.map(i => `<div><span>${esc(i.name)} — ${esc(i.desc)}</span><span>${esc(i.priceLabel)}</span></div>`).join("")}
        </div>
      </div>
    </div>
  `;
  refreshRows();
}

function renderGroup(group, pkg) {
  const available = isGroupAvailable(group, pkg.id);
  if (!available) {
    // Sections sans note de déverrouillage : simplement absentes pour ce forfait.
    if (!group.lockedNote) return "";
    const unlock = PACKAGE_BY_ID[group.unlockWith];
    return `
      <section class="sim-group is-locked" data-group="${group.id}">
        <div class="sim-group-head"><h3>${esc(group.title)}</h3></div>
        <div class="sim-group-locked">
          <span>${esc(group.lockedNote)}</span>
          <button type="button" class="button button-secondary" data-unlock="${unlock.id}">Passer à ${esc(unlock.name)} <span>→</span></button>
        </div>
      </section>`;
  }

  const options = OPTIONS.filter(o => o.group === group.id && isOptionAvailable(o, pkg.id));
  const slots = group.id === "modules" && pkg.moduleSlots
    ? `<span class="count" data-slots>${pkg.moduleSlots} module${pkg.moduleSlots > 1 ? "s" : ""} inclus</span>`
    : "";

  return `
    <section class="sim-group" data-group="${group.id}">
      <div class="sim-group-head">
        <h3>${esc(group.title)}</h3>
        ${slots}
      </div>
      ${group.intro ? `<p class="sim-group-intro">${esc(group.intro)}</p>` : ""}
      <div class="opts">${options.map(o => renderOption(o, pkg)).join("")}</div>
    </section>`;
}

function renderOption(option, pkg) {
  const included = isOptionIncluded(option, pkg.id);
  const checked = included || Boolean(state.options[option.id]);
  const quantities = state.options[option.id] || defaultQuantities(option, pkg);
  const hasQty = Boolean(option.unit || option.quantities);

  let qtyHtml = "";
  if (hasQty && !included) {
    const specs = option.quantities || [{ key: "qty", label: option.unit + (option.unit.endsWith("s") ? "" : "(s)"), min: 1, max: 200 }];
    qtyHtml = `
      <div class="opt-qty"${checked ? "" : " hidden"}>
        ${specs.map(spec => `
          <div class="opt-qty-field">
            <div class="stepper" role="group" aria-label="${esc(spec.label)}">
              <button type="button" data-step="-1" data-key="${spec.key}" aria-label="Moins">−</button>
              <input type="number" inputmode="numeric" min="${spec.min}" max="${spec.max}" value="${quantities[spec.key]}" data-key="${spec.key}" aria-label="${esc(spec.label)}" />
              <button type="button" data-step="1" data-key="${spec.key}" aria-label="Plus">+</button>
            </div>
            <span>${esc(spec.label)}</span>
          </div>`).join("")}
        <span class="opt-qty-total" data-line-total></span>
      </div>`;
  }

  return `
    <div class="opt${included ? " is-included" : ""}${checked ? " is-checked" : ""}" data-option="${option.id}">
      <label class="opt-main">
        <input type="checkbox" ${checked ? "checked" : ""} ${included ? "disabled" : ""} />
        <span class="opt-check" aria-hidden="true"></span>
        <span class="opt-text">
          <strong>${esc(option.name)}</strong>
          <small>${esc(option.desc)}</small>
        </span>
        <span class="opt-price" data-price>${included ? `<span class="badge badge-included">Inclus</span>` : esc(priceLabel(option))}</span>
      </label>
      ${qtyHtml}
    </div>`;
}

function renderModifier(modifier) {
  const checked = Boolean(state.modifiers[modifier.id]);
  return `
    <div class="opt${checked ? " is-checked" : ""}" data-modifier="${modifier.id}">
      <label class="opt-main">
        <input type="checkbox" ${checked ? "checked" : ""} />
        <span class="opt-check" aria-hidden="true"></span>
        <span class="opt-text"><strong>${esc(modifier.name)}</strong><small>${esc(modifier.desc)}</small></span>
        <span class="opt-price">${esc(modifier.effect)}</span>
      </label>
    </div>`;
}

function renderMaintenance(plan, pkg) {
  const id = plan ? plan.id : "";
  const checked = (state.maintenance || "") === id;
  const suggested = plan && plan.suggestedFor.includes(pkg.id);
  return `
    <div class="opt is-radio${checked ? " is-checked" : ""}" data-maintenance="${id}">
      <label class="opt-main">
        <input type="radio" name="maintenance" value="${id}" ${checked ? "checked" : ""} />
        <span class="opt-check" aria-hidden="true"></span>
        <span class="opt-text">
          <strong>${plan ? esc(plan.name) : "Sans forfait de maintenance"}</strong>
          <small>${plan ? esc(plan.desc) : "Vous gérez vous-même l'hébergement et les mises à jour après la première année."}</small>
        </span>
        <span class="opt-price">${plan ? `${plan.from ? "à partir de " : ""}${formatEuro(plan.price)}<small>par mois HT</small>` : "—"}${suggested ? `<br><span class="badge badge-suggest">Recommandé</span>` : ""}</span>
      </label>
    </div>`;
}

function renderExtra(extra) {
  const checked = Boolean(state.extras[extra.id]);
  const qty = state.extras[extra.id]?.qty || 1;
  return `
    <div class="opt${checked ? " is-checked" : ""}" data-extra="${extra.id}">
      <label class="opt-main">
        <input type="checkbox" ${checked ? "checked" : ""} />
        <span class="opt-check" aria-hidden="true"></span>
        <span class="opt-text"><strong>${esc(extra.name)}</strong><small>${esc(extra.desc)}</small></span>
        <span class="opt-price">${formatEuro(extra.price)} / ${esc(extra.unit)}<small>par mois HT</small></span>
      </label>
      <div class="opt-qty"${checked ? "" : " hidden"}>
        <div class="opt-qty-field">
          <div class="stepper" role="group" aria-label="Nombre de boîtes">
            <button type="button" data-step="-1" data-key="qty" aria-label="Moins">−</button>
            <input type="number" inputmode="numeric" min="1" max="50" value="${qty}" data-key="qty" aria-label="Nombre de boîtes" />
            <button type="button" data-step="1" data-key="qty" aria-label="Plus">+</button>
          </div>
          <span>boîte(s)</span>
        </div>
        <span class="opt-qty-total" data-line-total></span>
      </div>
    </div>`;
}

/** Met à jour badges, totaux de ligne et états sans reconstruire le DOM. */
function refreshRows() {
  const pkg = PACKAGE_BY_ID[state.pkg];
  const lineById = Object.fromEntries(result.lines.filter(l => l.id).map(l => [l.id, l]));

  els.main.querySelectorAll("[data-option]").forEach(row => {
    const option = OPTION_BY_ID[row.dataset.option];
    const included = isOptionIncluded(option, pkg.id);
    const selected = Boolean(state.options[option.id]);
    row.classList.toggle("is-checked", included || selected);
    const qtyBox = row.querySelector(".opt-qty");
    if (qtyBox) qtyBox.hidden = !selected;

    if (included) return;
    const price = row.querySelector("[data-price]");
    const line = lineById[option.id];
    if (line && line.included) {
      price.innerHTML = `<span class="is-struck">${esc(priceLabel(option))}</span><span class="badge badge-slot">Inclus dans le socle</span>`;
    } else {
      price.textContent = priceLabel(option);
    }
    const total = row.querySelector("[data-line-total]");
    if (total && selected) {
      const amount = optionAmount(option, state.options[option.id]);
      total.textContent = line && line.included ? "Inclus dans le socle" : `= ${formatEuro(amount)} HT`;
    }
  });

  els.main.querySelectorAll("[data-extra]").forEach(row => {
    const extra = EXTRA_BY_ID[row.dataset.extra];
    const selected = Boolean(state.extras[extra.id]);
    row.classList.toggle("is-checked", selected);
    row.querySelector(".opt-qty").hidden = !selected;
    if (selected) row.querySelector("[data-line-total]").textContent = `= ${formatEuro(extra.price * state.extras[extra.id].qty)} / mois HT`;
  });

  els.main.querySelectorAll("[data-modifier]").forEach(row => {
    row.classList.toggle("is-checked", Boolean(state.modifiers[row.dataset.modifier]));
  });
  els.main.querySelectorAll("[data-maintenance]").forEach(row => {
    row.classList.toggle("is-checked", (state.maintenance || "") === row.dataset.maintenance);
  });

  const slots = els.main.querySelector("[data-slots]");
  if (slots) slots.textContent = `${result.slotsUsed} / ${result.slotsTotal} module${result.slotsTotal > 1 ? "s" : ""} inclus utilisé${result.slotsUsed > 1 ? "s" : ""}`;
}

/* Interactions du catalogue (délégation) */
els.main.addEventListener("change", event => {
  const input = event.target;
  const optionRow = input.closest("[data-option]");
  const modifierRow = input.closest("[data-modifier]");
  const maintenanceRow = input.closest("[data-maintenance]");
  const extraRow = input.closest("[data-extra]");
  activePreset = null;
  renderPresets();

  if (optionRow && input.type === "checkbox") {
    const option = OPTION_BY_ID[optionRow.dataset.option];
    setState(s => {
      if (input.checked) s.options[option.id] = defaultQuantities(option, PACKAGE_BY_ID[s.pkg]);
      else delete s.options[option.id];
    });
    return;
  }
  if (optionRow && input.type === "number") {
    applyQuantity(optionRow, input.dataset.key, input.value);
    return;
  }
  if (modifierRow) {
    setState(s => { s.modifiers[modifierRow.dataset.modifier] = input.checked; });
    return;
  }
  if (maintenanceRow) {
    setState(s => { s.maintenance = maintenanceRow.dataset.maintenance || null; });
    return;
  }
  if (extraRow && input.type === "checkbox") {
    setState(s => {
      if (input.checked) s.extras[extraRow.dataset.extra] = { qty: 1 };
      else delete s.extras[extraRow.dataset.extra];
    });
    return;
  }
  if (extraRow && input.type === "number") {
    applyQuantity(extraRow, "qty", input.value);
  }
});

els.main.addEventListener("click", event => {
  const unlock = event.target.closest("[data-unlock]");
  if (unlock) {
    selectPackage(unlock.dataset.unlock);
    els.forfaits.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  const step = event.target.closest("[data-step]");
  if (!step) return;
  const row = step.closest("[data-option], [data-extra]");
  const input = row.querySelector(`input[type="number"][data-key="${step.dataset.key}"]`);
  input.value = Number(input.value) + Number(step.dataset.step);
  applyQuantity(row, step.dataset.key, input.value);
});

function applyQuantity(row, key, rawValue) {
  const input = row.querySelector(`input[type="number"][data-key="${key}"]`);
  const min = Number(input.min) || 1;
  const max = Number(input.max) || 200;
  const value = Math.min(max, Math.max(min, Math.round(Number(rawValue) || min)));
  input.value = value;
  activePreset = null;
  renderPresets();

  if (row.dataset.option) {
    setState(s => { if (s.options[row.dataset.option]) s.options[row.dataset.option][key] = value; });
  } else {
    setState(s => { if (s.extras[row.dataset.extra]) s.extras[row.dataset.extra].qty = value; });
  }
}

/* ---------------------------------------------------------------- SUMMARY */
let formOpen = false;
let formSent = null;

function renderSummary() {
  const { oneTime, monthly, lines } = result;
  const fromLabel = oneTime.from ? "<em>à partir de</em>" : "";

  const linesHtml = lines.map(line => `
    <li class="${line.kind === "package" ? "is-package" : ""}${line.kind === "modifier" ? "is-modifier" : ""}">
      <span>${esc(line.label)}</span>
      <span class="amt${line.included ? " is-free" : ""}">${line.included ? "inclus" : `${line.from ? "dès " : ""}${formatEuro(line.amount)}`}</span>
      ${line.detail ? `<small>${esc(line.detail)}</small>` : ""}
    </li>`).join("");

  const optionCount = lines.filter(l => l.kind === "option").length;
  const emptyHint = optionCount === 0 ? `<li class="is-empty">Aucune option pour l'instant : cochez des fonctionnalités à l'étape 2.</li>` : "";

  const monthlyHtml = monthly.lines.length
    ? `
    <div class="sum-monthly">
      <header>
        <span>Puis chaque mois</span>
        <b>${monthly.from ? "dès " : ""}${formatEuro(monthly.ht)} <small>HT · ${formatEuro(monthly.ttc)} TTC</small></b>
      </header>
      <ul class="sum-lines">
        ${monthly.lines.map(line => `<li><span>${esc(line.label)}</span><span class="amt">${line.from ? "dès " : ""}${formatEuro(line.amount)}</span>${line.detail ? `<small>${esc(line.detail)}</small>` : ""}</li>`).join("")}
      </ul>
      <p>Nom de domaine offert la première année, puis 15 € / an.</p>
    </div>`
    : `<div class="sum-monthly"><header><span>Puis chaque mois</span><b>0 €</b></header><p>Sans forfait de maintenance. Nom de domaine offert la première année, puis 15 € / an.</p></div>`;

  els.summary.innerHTML = `
    <div class="sum-bar" id="sumBar">
      <div>
        <p class="eyebrow">Votre estimation</p>
        <span class="sum-bar-total">${oneTime.from ? "dès " : ""}${formatEuro(oneTime.ht)} <small>HT · ${formatEuro(oneTime.ttc)} TTC</small></span>
      </div>
      <button type="button" class="sum-toggle" id="sumToggle" aria-expanded="${mobileOpen}" aria-controls="simSummary">Détail <i>▲</i></button>
    </div>

    <div class="sum-total">
      <div class="sum-total-ht">${fromLabel}<strong>${formatEuro(oneTime.ht)}</strong><em>HT</em></div>
      <div class="sum-total-ttc">soit <b>${formatEuro(oneTime.ttc)} TTC</b> · TVA 20 % : ${formatEuro(oneTime.tva)}</div>
    </div>

    <div class="sum-body">
      <ul class="sum-lines">${linesHtml}${emptyHint}</ul>
      <hr class="sum-sep" />
      <div class="sum-tots">
        <div><span>Total projet HT</span><b>${formatEuro(oneTime.ht)}</b></div>
        <div><span>TVA 20 %</span><span>${formatEuro(oneTime.tva)}</span></div>
        <div class="is-ttc"><span>Total projet TTC</span><b>${formatEuro(oneTime.ttc)}</b></div>
      </div>
      ${monthlyHtml}
    </div>

    <div class="sum-actions">
      <button type="button" class="button button-primary" id="pdfButton">Télécharger l'exemple de devis (PDF) <span>↓</span></button>
      <button type="button" class="button button-secondary" id="mailButton" aria-expanded="${formOpen}">Recevoir ce devis par email <span>→</span></button>
    </div>

    ${formSent ? renderSent() : renderForm()}

    <div class="sum-link">
      <button type="button" id="copyLink">Copier le lien de cette simulation</button>
      <span class="copied" id="copiedNotice" hidden>Lien copié ✓</span>
    </div>

    <p class="sum-note">
      Estimation indicative calculée à partir de la grille tarifaire YDRAx (édition ${EDITION}), hors taxes, TVA 20 %.
      Elle ne constitue pas un devis officiel : <a href="/contact">contactez-nous</a> pour un devis détaillé, gratuit et sans engagement.
    </p>
  `;

  els.summary.classList.toggle("is-open", mobileOpen);
  bindSummary();
}

function renderForm() {
  return `
    <form class="sum-form${formOpen ? " is-open" : ""}" id="sumForm" novalidate>
      <div class="form-field" id="sf-name">
        <label for="sf-name-input">Nom complet</label>
        <input id="sf-name-input" name="name" type="text" autocomplete="name" placeholder="Jean Dupont" required />
        <small class="form-err">Merci d'indiquer votre nom.</small>
      </div>
      <div class="form-field" id="sf-email">
        <label for="sf-email-input">Email</label>
        <input id="sf-email-input" name="email" type="email" autocomplete="email" placeholder="jean@entreprise.fr" required />
        <small class="form-err">Adresse email invalide.</small>
      </div>
      <div class="form-field" id="sf-phone">
        <label for="sf-phone-input">Téléphone <span>(facultatif)</span></label>
        <input id="sf-phone-input" name="phone" type="tel" autocomplete="tel" placeholder="06 12 34 56 78" />
      </div>
      <div class="form-field" id="sf-message">
        <label for="sf-message-input">Un mot sur votre projet <span>(facultatif)</span></label>
        <textarea id="sf-message-input" name="note" placeholder="Activité, délais souhaités, site existant…"></textarea>
      </div>
      <div class="form-hp" aria-hidden="true">
        <label for="sf-company">Société</label>
        <input id="sf-company" name="company" type="text" tabindex="-1" autocomplete="off" />
      </div>
      <div class="form-notice" id="sumNotice" role="status" aria-live="polite"></div>
      <button class="button button-primary" type="submit" id="sumSubmit">Envoyer l'estimation <span>→</span></button>
    </form>`;
}

function renderSent() {
  return `
    <div class="sum-success" role="status">
      <strong>Estimation envoyée ✓</strong>
      ${formSent.copySent
        ? "Une copie vient de vous être envoyée par email. Nous revenons vers vous sous 48 h avec un devis détaillé."
        : "Nous l'avons bien reçue et revenons vers vous sous 48 h avec un devis détaillé."}
    </div>`;
}

function bindSummary() {
  $("#pdfButton").addEventListener("click", async event => {
    const button = event.currentTarget;
    const original = button.innerHTML;
    button.disabled = true;
    button.innerHTML = "Génération du PDF…";
    try {
      await downloadEstimatePdf({ state, result, url: shareUrl() });
    } catch (error) {
      console.error(error);
      window.print();
    } finally {
      button.disabled = false;
      button.innerHTML = original;
    }
  });

  $("#mailButton").addEventListener("click", () => {
    formOpen = !formOpen;
    formSent = null;
    renderSummary();
    if (formOpen) $("#sf-name-input").focus();
  });

  $("#copyLink").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(shareUrl());
      const notice = $("#copiedNotice");
      notice.hidden = false;
      setTimeout(() => { notice.hidden = true; }, 2500);
    } catch {
      prompt("Copiez ce lien :", shareUrl());
    }
  });

  const toggle = $("#sumToggle");
  const bar = $("#sumBar");
  const toggleSheet = () => {
    if (window.innerWidth > 980) return;
    mobileOpen = !mobileOpen;
    els.summary.classList.toggle("is-open", mobileOpen);
    toggle.setAttribute("aria-expanded", String(mobileOpen));
    document.body.classList.toggle("sheet-open", mobileOpen);
    setBackdrop(mobileOpen);
  };
  toggle.addEventListener("click", event => { event.stopPropagation(); toggleSheet(); });
  bar.addEventListener("click", toggleSheet);

  $("#sumForm")?.addEventListener("submit", submitEstimate);
}

function setBackdrop(show) {
  let backdrop = $("#sheetBackdrop");
  if (show && !backdrop) {
    backdrop = document.createElement("div");
    backdrop.className = "sheet-backdrop";
    backdrop.id = "sheetBackdrop";
    backdrop.addEventListener("click", () => {
      mobileOpen = false;
      els.summary.classList.remove("is-open");
      document.body.classList.remove("sheet-open");
      setBackdrop(false);
    });
    document.body.appendChild(backdrop);
  } else if (!show && backdrop) {
    backdrop.remove();
  }
}

function shareUrl() {
  return `${location.origin}${location.pathname}?${encodeState(state)}#simulateur`;
}

/** Récapitulatif texte envoyé par email. */
function estimateText() {
  const { oneTime, monthly, lines } = result;
  const out = [];
  out.push(`ESTIMATION SIMULATEUR — grille ${EDITION}`);
  out.push("");
  for (const line of lines) {
    const amount = line.included ? "inclus" : `${line.from ? "dès " : ""}${formatEuro(line.amount)}`;
    out.push(`• ${line.label}${line.detail ? ` (${line.detail})` : ""} : ${amount}`);
  }
  out.push("");
  out.push(`Total projet HT : ${oneTime.from ? "à partir de " : ""}${formatEuro(oneTime.ht)}`);
  out.push(`TVA 20 % : ${formatEuro(oneTime.tva)}`);
  out.push(`Total projet TTC : ${formatEuro(oneTime.ttc)}`);
  out.push("");
  if (monthly.lines.length) {
    out.push(`Chaque mois : ${monthly.from ? "à partir de " : ""}${formatEuro(monthly.ht)} HT (${formatEuro(monthly.ttc)} TTC)`);
    for (const line of monthly.lines) out.push(`• ${line.label} : ${line.from ? "dès " : ""}${formatEuro(line.amount)}`);
  } else {
    out.push("Sans forfait de maintenance.");
  }
  out.push("");
  out.push(`Lien de la simulation : ${shareUrl()}`);
  return out.join("\n");
}

async function submitEstimate(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const notice = $("#sumNotice");
  const submit = $("#sumSubmit");
  const fields = {
    name: { box: $("#sf-name"), ok: v => v.trim().length >= 2 },
    email: { box: $("#sf-email"), ok: v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) },
  };
  let valid = true;
  for (const { box, ok } of Object.values(fields)) {
    const input = box.querySelector("input");
    const good = ok(input.value);
    box.classList.toggle("invalid", !good);
    if (!good) valid = false;
  }
  if (!valid) {
    notice.innerHTML = `<div class="err">Merci de corriger les champs surlignés.</div>`;
    return;
  }

  const data = new FormData(form);
  const note = String(data.get("note") || "").trim();
  const payload = {
    name: data.get("name"),
    email: data.get("email"),
    phone: data.get("phone"),
    company: data.get("company"),
    type: "Estimation via le simulateur",
    budget: `${result.oneTime.from ? "à partir de " : ""}${formatEuro(result.oneTime.ht)} HT`,
    message: (note ? `${note}\n\n` : "") + estimateText(),
    estimate: true,
  };

  const original = submit.innerHTML;
  submit.disabled = true;
  submit.innerHTML = '<span class="form-spinner"></span> Envoi…';
  notice.innerHTML = "";

  try {
    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      notice.innerHTML = `<div class="err">${esc(body.error || "L'envoi a échoué. Réessayez.")}</div>`;
      return;
    }
    formSent = { copySent: Boolean(body.copySent) };
    formOpen = false;
    renderSummary();
  } catch {
    notice.innerHTML = `<div class="err">Connexion impossible. Écrivez-nous à contact.ydrax@gmail.com.</div>`;
  } finally {
    submit.disabled = false;
    submit.innerHTML = original;
  }
}

/* ------------------------------------------------------------------- INIT */
renderPresets();
renderForfaits();
renderMain();
renderSummary();

window.matchMedia("(min-width: 981px)").addEventListener("change", event => {
  if (event.matches && mobileOpen) {
    mobileOpen = false;
    els.summary.classList.remove("is-open");
    document.body.classList.remove("sheet-open");
    setBackdrop(false);
  }
});
