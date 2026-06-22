"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail, emailLayout, escapeHtml } from "@/lib/email";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function submitLead(email: string, company?: string): Promise<{ ok: true } | { ok: false; error: string }> {
  // Honeypot: real users never fill the hidden "company" field; bots do. Drop silently.
  if (company && company.trim() !== "") return { ok: true };

  const e = email?.trim().toLowerCase();
  if (!EMAIL_RE.test(e)) return { ok: false, error: "Please enter a valid email." };

  const svc = createAdminClient();
  // Dedup: if we already captured this email, don't re-insert or re-notify.
  const { data: existing } = await svc.from("leads").select("id").eq("email", e).maybeSingle();
  if (existing) return { ok: true };

  await svc.from("leads").insert({ email: e, source: "landing" });
  await sendEmail({
    to: process.env.BOOKING_TO || "adrian@platodigital.online",
    subject: `New lead, ${e}`,
    html: emailLayout(`<p>New menu-upgrade lead from the landing page:</p><p style="font-size:16px"><strong>${escapeHtml(e)}</strong></p>`),
  });
  return { ok: true };
}
