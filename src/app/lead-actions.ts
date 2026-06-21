"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail, emailLayout } from "@/lib/email";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function submitLead(email: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const e = email?.trim().toLowerCase();
  if (!EMAIL_RE.test(e)) return { ok: false, error: "Please enter a valid email." };

  const svc = createAdminClient();
  await svc.from("leads").insert({ email: e, source: "landing" });
  await sendEmail({
    to: process.env.BOOKING_TO || "adrian@platodigital.online",
    subject: `New lead, ${e}`,
    html: emailLayout(`<p>New menu-upgrade lead from the landing page:</p><p style="font-size:16px"><strong>${e}</strong></p>`),
  });
  return { ok: true };
}
