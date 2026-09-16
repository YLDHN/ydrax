const { sendMail, isConfigured, ADMIN_EMAIL } = require("./_mail.js");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const hits = new Map();

function rateLimited(ip) {
  const now = Date.now();
  const window = hits.get(ip) || [];
  const recent = window.filter(t => now - t < 60 * 60 * 1000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 5;
}

function clean(value, max) {
  return String(value ?? "").trim().slice(0, max);
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"]/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])
  );
}

function shell(bodyHtml) {
  return `<!doctype html><html lang="fr"><body style="margin:0;padding:32px 16px;background:#030609;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,sans-serif">
    <div style="max-width:560px;margin:0 auto;background:#080d13;border:1px solid rgba(255,255,255,.09);border-radius:14px;overflow:hidden">
      <div style="padding:26px 30px;border-bottom:1px solid rgba(255,255,255,.07)">
        <div style="color:#f3f6f9;font-size:18px;letter-spacing:.23em;font-weight:500">YDRA<span style="opacity:.43">x</span></div>
      </div>
      <div style="padding:30px;color:#c8d1da;font-size:14px;line-height:1.65">${bodyHtml}</div>
    </div>
  </body></html>`;
}

function template({ name, email, phone, type, budget, message, isEstimate }) {
  const rows = [
    ["Nom", name],
    ["Email", `<a href="mailto:${escapeHtml(email)}" style="color:#9bd2ff">${escapeHtml(email)}</a>`],
    ["Téléphone", phone ? escapeHtml(phone) : ""],
    ["Type de projet", escapeHtml(type)],
    ["Budget", budget ? escapeHtml(budget) : ""],
  ]
    .filter(([, value]) => value)
    .map(
      ([label, value]) =>
        `<tr><td style="padding:9px 0;color:#7f8a95;font-size:12px;width:130px;vertical-align:top">${label}</td>
             <td style="padding:9px 0;color:#eef3f8;font-size:13px">${value}</td></tr>`
    )
    .join("");

  return shell(`
    <h1 style="margin:0 0 4px;color:#f3f6f9;font-size:20px;font-weight:500">${isEstimate ? "Estimation envoyée depuis le simulateur" : "Nouvelle demande de contact"}</h1>
    <table style="width:100%;border-collapse:collapse;margin:16px 0">${rows}</table>
    <div style="padding:14px 16px;border-left:2px solid rgba(155,210,255,.4);background:rgba(255,255,255,.03);border-radius:0 8px 8px 0;white-space:pre-wrap;color:#dce4ec">${linkify(escapeHtml(message))}</div>
  `);
}

/** Copie envoyée au visiteur qui demande à recevoir son estimation. */
function estimateReceipt({ name, message }) {
  return shell(`
    <h1 style="margin:0 0 4px;color:#f3f6f9;font-size:20px;font-weight:500">Votre estimation YDRAx</h1>
    <p style="margin:0 0 18px;color:#9aa5b1">Bonjour ${escapeHtml(name)}, voici le récapitulatif de la simulation que vous venez de nous envoyer. Nous revenons vers vous sous 48 h avec un devis détaillé.</p>
    <div style="padding:14px 16px;border-left:2px solid rgba(155,210,255,.4);background:rgba(255,255,255,.03);border-radius:0 8px 8px 0;white-space:pre-wrap;color:#dce4ec">${linkify(escapeHtml(message))}</div>
    <div style="margin-top:18px;padding:12px 14px;border:1px solid rgba(255,200,120,.35);border-radius:8px;background:rgba(255,200,120,.06);color:#f3dcb4;font-size:12px;line-height:1.55">
      Cette estimation est un exemple de devis généré automatiquement à partir de notre grille tarifaire. Elle n'a aucune valeur contractuelle et ne constitue pas un devis officiel.
    </div>
    <p style="margin:18px 0 0;color:#7f8a95;font-size:12px">YDRAx · contact.ydrax@gmail.com · ydrax.vercel.app</p>
  `);
}

function linkify(escaped) {
  return escaped.replace(/https?:\/\/[^\s<]+/g, url => `<a href="${url}" style="color:#9bd2ff">${url}</a>`);
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Méthode non autorisée" });

  const ip = (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "unknown";
  if (rateLimited(ip)) {
    return res.status(429).json({ error: "Trop de demandes. Réessayez dans une heure." });
  }

  const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};

  // Honeypot: only bots fill this.
  if (clean(body.company, 80)) return res.status(200).json({ ok: true });

  const name = clean(body.name, 120);
  const email = clean(body.email, 160);
  const phone = clean(body.phone, 40);
  const type = clean(body.type, 80) || "Non précisé";
  const budget = clean(body.budget, 60);
  const isEstimate = body.estimate === true;
  const message = clean(body.message, isEstimate ? 8000 : 4000);

  if (name.length < 2) return res.status(400).json({ error: "Merci d'indiquer votre nom." });
  if (!EMAIL_RE.test(email)) return res.status(400).json({ error: "Adresse email invalide." });
  if (message.length < 10) return res.status(400).json({ error: "Décrivez votre besoin en quelques mots." });

  if (!isConfigured()) {
    return res.status(503).json({
      error: "L'envoi n'est pas encore activé. Écrivez-nous directement à contact.ydrax@gmail.com.",
    });
  }

  const notification = await sendMail({
    to: ADMIN_EMAIL,
    replyTo: email,
    subject: isEstimate ? `Estimation YDRAx — ${name} — ${budget || "montant non précisé"}` : `Contact YDRAx — ${name} — ${type}`,
    html: template({ name, email, phone, type, budget, message, isEstimate }),
  });

  if (!notification.ok) {
    console.error("contact notification", notification.error);
    return res.status(502).json({
      error: "L'envoi a échoué. Écrivez-nous à contact.ydrax@gmail.com.",
    });
  }

  // The visitor asked to receive the estimate: best effort, the request is
  // already delivered to YDRAx even if the transport refuses external recipients.
  let copySent = false;
  if (isEstimate) {
    const copy = await sendMail({
      to: email,
      subject: "Votre estimation YDRAx (exemple de devis)",
      html: estimateReceipt({ name, message }),
    });
    copySent = copy.ok;
    if (!copy.ok) console.warn("estimate copy", copy.error);
  }

  return res.status(200).json({ ok: true, deliveredTo: ADMIN_EMAIL, copySent });
};
