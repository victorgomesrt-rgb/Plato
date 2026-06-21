import "server-only";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM_EMAIL || "Plato <hello@platodigital.io>";

export type Attachment = { filename: string; content: Buffer };

// Escape user-supplied text before interpolating into email HTML (prevents layout
// breakage / markup injection in the notification emails we send ourselves).
export function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  attachments?: Attachment[];
}) {
  return resend.emails.send({
    from: FROM,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    attachments: opts.attachments,
  });
}

// Minimal branded wrapper so transactional emails look consistent (copy.md voice).
export function emailLayout(bodyHtml: string): string {
  return `<div style="font-family:Inter,Arial,sans-serif;max-width:480px;margin:0 auto;color:#16110e">
    <div style="font-size:20px;font-weight:700;color:#fb6a1a;padding:8px 0">Plato</div>
    ${bodyHtml}
    <p style="color:#6b6660;font-size:12px;margin-top:24px">Plato · video menus for Aruba</p>
  </div>`;
}

export function emailButton(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:#fb6a1a;color:#fff;text-decoration:none;padding:10px 18px;border-radius:12px;font-weight:600;margin:12px 0">${label}</a>`;
}
