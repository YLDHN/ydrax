/**
 * Génère l'« exemple de devis » PDF du simulateur.
 * jsPDF est chargé à la demande depuis jsDelivr (déjà pré-connecté) ; en cas
 * d'échec, l'appelant retombe sur l'impression du navigateur.
 */
import { EDITION, TERMS } from "./pricing/data.js";
import { formatEuro as formatEuroHtml } from "./pricing/compute.js";

/** Les polices standard du PDF n'ont pas l'espace fine insécable de fr-FR. */
const formatEuro = value => formatEuroHtml(value).replace(/[\u202f\u00a0]/g, " ");

const JSPDF_URL = "https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js";

const PAGE = { w: 210, h: 297, margin: 18 };
const CONTENT_W = PAGE.w - PAGE.margin * 2;
const INK = [17, 24, 32];
const MUTED = [110, 120, 132];
const LINE = [220, 226, 232];
const ACCENT = [43, 127, 214];
const WARN_BG = [255, 246, 230];
const WARN_INK = [150, 88, 0];

let jsPdfPromise;
/** Le build ES de jsPDF garde des imports nus (@babel/runtime) : on charge le build UMD. */
function loadJsPdf() {
  if (window.jspdf?.jsPDF) return Promise.resolve(window.jspdf.jsPDF);
  if (!jsPdfPromise) {
    jsPdfPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = JSPDF_URL;
      script.async = true;
      script.onload = () => resolve(window.jspdf?.jsPDF);
      script.onerror = () => { jsPdfPromise = null; reject(new Error("jsPDF n'a pas pu être chargé")); };
      document.head.appendChild(script);
    });
  }
  return jsPdfPromise;
}

export async function downloadEstimatePdf({ state, result, url, client = {} }) {
  const jsPDF = await loadJsPdf();
  if (!jsPDF) throw new Error("jsPDF indisponible");

  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  const today = new Date();
  const dateLabel = today.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  const { pkg, lines, oneTime, monthly } = result;

  let y = 0;
  const text = (str, x, yy, opts = {}) => doc.text(String(str), x, yy, opts);
  const setFont = (style = "normal", size = 10, color = INK) => {
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
    doc.setTextColor(...color);
  };

  function pageChrome() {
    /* Filigrane */
    doc.saveGraphicsState();
    doc.setGState(new doc.GState({ opacity: 0.075 }));
    setFont("bold", 54, [40, 60, 90]);
    text("EXEMPLE DE DEVIS", PAGE.w / 2, PAGE.h / 2 + 10, { angle: 32, align: "center" });
    setFont("bold", 22, [40, 60, 90]);
    text("NON CONTRACTUEL", PAGE.w / 2 + 12, PAGE.h / 2 + 34, { angle: 32, align: "center" });
    doc.restoreGraphicsState();

    /* En-tête */
    setFont("bold", 15, INK);
    doc.text("YDRA", PAGE.margin, 20);
    const w = doc.getTextWidth("YDRA");
    setFont("bold", 15, [150, 158, 168]);
    doc.text("x", PAGE.margin + w + 0.5, 20);
    setFont("normal", 7, MUTED);
    doc.text("BUILD  ·  CONNECT  ·  SCALE", PAGE.margin, 24.5);

    setFont("bold", 10.5, ACCENT);
    text("EXEMPLE DE DEVIS", PAGE.w - PAGE.margin, 19, { align: "right" });
    setFont("normal", 7.5, MUTED);
    text(`Non contractuel · généré le ${dateLabel}`, PAGE.w - PAGE.margin, 24, { align: "right" });

    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.3);
    doc.line(PAGE.margin, 29, PAGE.w - PAGE.margin, 29);
    y = 36;
  }

  function ensure(height) {
    if (y + height > PAGE.h - 19) {
      doc.addPage();
      pageChrome();
    }
  }

  function paragraph(str, { size = 9, color = INK, style = "normal", width = CONTENT_W, x = PAGE.margin, lineHeight = 1.45 } = {}) {
    setFont(style, size, color);
    const rows = doc.splitTextToSize(str, width);
    const step = size * 0.3528 * lineHeight;
    ensure(rows.length * step);
    rows.forEach(row => { text(row, x, y); y += step; });
  }

  pageChrome();

  /* Titre */
  setFont("bold", 20, INK);
  text("Estimation de votre projet web", PAGE.margin, y);
  y += 6.5;
  setFont("normal", 9.5, MUTED);
  text(`${pkg.name} · grille tarifaire édition ${EDITION} · prix hors taxes`, PAGE.margin, y);
  y += 5;
  if (client.name || client.email) {
    setFont("normal", 9.5, INK);
    text(`Préparé pour : ${[client.name, client.email].filter(Boolean).join(" · ")}`, PAGE.margin, y);
    y += 6;
  }
  y += 1;

  /* Avertissement */
  const warning =
    "Ce document est un exemple de devis généré automatiquement par le simulateur de ydrax.vercel.app. " +
    "Il n'a aucune valeur contractuelle et ne constitue pas un devis officiel. Les montants « à partir de » sont des minimums, " +
    "précisés après échange. Pour obtenir un devis officiel, détaillé ligne par ligne, gratuit et sans engagement, " +
    "contactez-nous : contact.ydrax@gmail.com";
  setFont("normal", 8.5, WARN_INK);
  const warnRows = doc.splitTextToSize(warning, CONTENT_W - 10);
  const warnH = warnRows.length * 4.2 + 7;
  ensure(warnH + 6);
  doc.setFillColor(...WARN_BG);
  doc.setDrawColor(235, 200, 140);
  doc.roundedRect(PAGE.margin, y, CONTENT_W, warnH, 2, 2, "FD");
  let wy = y + 6;
  warnRows.forEach(row => { text(row, PAGE.margin + 5, wy); wy += 4.2; });
  y += warnH + 8;

  /* Tableau des lignes */
  const col = { label: PAGE.margin, detail: PAGE.margin + 62, amount: PAGE.w - PAGE.margin };
  const detailW = col.amount - col.detail - 32;

  function tableHeader() {
    ensure(12);
    doc.setFillColor(243, 246, 249);
    doc.rect(PAGE.margin, y - 4.5, CONTENT_W, 7, "F");
    setFont("bold", 7.5, MUTED);
    text("DÉSIGNATION", col.label + 2, y);
    text("DÉTAIL", col.detail, y);
    text("MONTANT HT", col.amount - 2, y, { align: "right" });
    y += 7;
  }

  function tableRow(label, detail, amountLabel, { bold = false, accent = false } = {}) {
    setFont("normal", 8.5, MUTED);
    const detailRows = detail ? doc.splitTextToSize(detail, detailW) : [];
    setFont(bold ? "bold" : "normal", 9.5, INK);
    const labelRows = doc.splitTextToSize(label, col.detail - col.label - 6);
    const rowsCount = Math.max(labelRows.length, detailRows.length, 1);
    const h = rowsCount * 4.4 + 2.6;
    ensure(h);
    let ly = y;
    labelRows.forEach(row => { text(row, col.label + 2, ly); ly += 4.6; });
    setFont("normal", 8.5, MUTED);
    let dy = y;
    detailRows.forEach(row => { text(row, col.detail, dy); dy += 4.6; });
    setFont(bold ? "bold" : "normal", 9.5, accent ? [30, 130, 80] : INK);
    text(amountLabel, col.amount - 2, y, { align: "right" });
    y += h;
    doc.setDrawColor(...LINE);
    doc.line(PAGE.margin, y - 2, PAGE.w - PAGE.margin, y - 2);
  }

  setFont("bold", 11.5, INK);
  ensure(10);
  text("Projet (paiement unique)", PAGE.margin, y);
  y += 7;
  tableHeader();

  for (const line of lines) {
    const amount = line.included ? "Inclus" : `${line.from ? "dès " : ""}${formatEuro(line.amount)}`;
    tableRow(line.label, line.detail || "", amount, { bold: line.kind === "package", accent: line.included });
  }

  /* Totaux */
  y += 3;
  const totals = [
    ["Sous-total HT", `${oneTime.from ? "à partir de " : ""}${formatEuro(oneTime.ht)}`, false],
    ["TVA 20 %", formatEuro(oneTime.tva), false],
    ["Total TTC", `${oneTime.from ? "à partir de " : ""}${formatEuro(oneTime.ttc)}`, true],
  ];
  ensure(totals.length * 6.5 + 6);
  for (const [label, value, strong] of totals) {
    setFont(strong ? "bold" : "normal", strong ? 11 : 9.5, strong ? INK : MUTED);
    text(label, col.amount - 60, y, { align: "right" });
    setFont(strong ? "bold" : "normal", strong ? 11 : 9.5, INK);
    text(value, col.amount - 2, y, { align: "right" });
    y += strong ? 7 : 5.5;
  }
  y += 2;

  /* Mensuel */
  setFont("bold", 11.5, INK);
  ensure(14);
  text("Après la mise en ligne (chaque mois)", PAGE.margin, y);
  y += 6.5;
  if (monthly.lines.length) {
    tableHeader();
    for (const line of monthly.lines) {
      tableRow(line.label, line.detail || "", `${line.from ? "dès " : ""}${formatEuro(line.amount)} / mois`);
    }
    y += 3;
    ensure(16);
    setFont("normal", 9.5, MUTED);
    text("Mensuel HT", col.amount - 60, y, { align: "right" });
    setFont("normal", 9.5, INK);
    text(`${monthly.from ? "à partir de " : ""}${formatEuro(monthly.ht)}`, col.amount - 2, y, { align: "right" });
    y += 6;
    setFont("bold", 10.5, INK);
    text("Mensuel TTC", col.amount - 60, y, { align: "right" });
    text(`${monthly.from ? "à partir de " : ""}${formatEuro(monthly.ttc)}`, col.amount - 2, y, { align: "right" });
    y += 8;
  } else {
    paragraph("Sans forfait de maintenance : vous gérez vous-même l'hébergement et les mises à jour après la première année.", { color: MUTED });
    y += 3;
  }
  paragraph("Nom de domaine offert la première année, puis 15 € / an. Modifications hors forfait : 60 € / heure ou sur devis.", { size: 8.5, color: MUTED });
  y += 4;

  /* Modalités */
  setFont("bold", 11.5, INK);
  ensure(14);
  text("Modalités (pour information)", PAGE.margin, y);
  y += 6;
  for (const term of TERMS.conditions) {
    paragraph(`•  ${term}`, { size: 8.5, color: MUTED, lineHeight: 1.35 });
    y += 0.8;
  }
  y += 4;

  /* Prochaine étape */
  ensure(22);
  doc.setFillColor(238, 244, 251);
  doc.setDrawColor(200, 218, 240);
  doc.roundedRect(PAGE.margin, y, CONTENT_W, 21, 2, 2, "FD");
  setFont("bold", 10, INK);
  text("Et maintenant ? Obtenez votre devis officiel.", PAGE.margin + 5, y + 6.5);
  setFont("normal", 8.5, MUTED);
  text("Écrivez-nous à contact.ydrax@gmail.com ou via ydrax.vercel.app/contact : réponse sous 48 h avec un devis détaillé.", PAGE.margin + 5, y + 12);
  setFont("normal", 7.5, ACCENT);
  const shortUrl = url.length > 110 ? `${url.slice(0, 107)}…` : url;
  doc.textWithLink(`Reprendre cette simulation : ${shortUrl}`, PAGE.margin + 5, y + 17.3, { url });
  y += 26;

  /* Pieds de page */
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i += 1) {
    doc.setPage(i);
    doc.setDrawColor(...LINE);
    doc.line(PAGE.margin, PAGE.h - 16, PAGE.w - PAGE.margin, PAGE.h - 16);
    setFont("normal", 7.5, MUTED);
    text("YDRAx — Exemple de devis non contractuel, généré par le simulateur en ligne · contact.ydrax@gmail.com · ydrax.vercel.app", PAGE.margin, PAGE.h - 11);
    text(`${i} / ${pages}`, PAGE.w - PAGE.margin, PAGE.h - 11, { align: "right" });
  }

  const slug = pkg.name.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase();
  const stamp = today.toISOString().slice(0, 10);
  doc.save(`YDRAx-exemple-de-devis-${slug}-${stamp}.pdf`);
}
