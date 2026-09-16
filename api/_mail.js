const nodemailer = require("nodemailer");

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "contact.ydrax@gmail.com";

let transporter;

function smtpTransport() {
  if (transporter !== undefined) return transporter;

  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT || 465),
      secure: Number(process.env.SMTP_PORT || 465) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  } else {
    transporter = null;
  }

  return transporter;
}

/**
 * Each transport only accepts a sender it has authorised: SMTP the account
 * that authenticated, Resend its shared address until a domain is verified.
 * MAIL_FROM overrides both once a real sender identity exists.
 */
function sender(viaSmtp) {
  if (process.env.MAIL_FROM) return process.env.MAIL_FROM;
  if (viaSmtp) return `YDRAx <${process.env.SMTP_USER}>`;
  return "YDRAx <onboarding@resend.dev>";
}

function isConfigured() {
  return Boolean((process.env.SMTP_USER && process.env.SMTP_PASS) || process.env.RESEND_API_KEY);
}

/** Sends through SMTP when configured, otherwise Resend. Never throws. */
async function sendMail({ to, subject, html, replyTo }) {
  const smtp = smtpTransport();

  if (smtp) {
    try {
      await smtp.sendMail({ from: sender(true), to, subject, html, replyTo });
      return { ok: true, via: "smtp" };
    } catch (error) {
      return { ok: false, via: "smtp", error: String(error) };
    }
  }

  if (!process.env.RESEND_API_KEY) return { ok: false, error: "Aucun service d'envoi configuré" };

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: sender(false),
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        reply_to: replyTo,
      }),
    });

    if (!response.ok) {
      return { ok: false, via: "resend", error: `${response.status} ${await response.text()}` };
    }
    return { ok: true, via: "resend" };
  } catch (error) {
    return { ok: false, via: "resend", error: String(error) };
  }
}

module.exports = { sendMail, isConfigured, ADMIN_EMAIL };
