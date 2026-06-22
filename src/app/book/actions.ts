"use server";

import { sendEmail, emailLayout, escapeHtml } from "@/lib/email";

export type BookingInput = {
  restaurant: string;
  area: string;
  cuisine: string;
  name: string;
  phone: string;
  email: string;
  menuSize: string;
  plan: string;
  timing: string;
  notes: string;
  company?: string; // honeypot
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Emails a website demo request to the Plato inbox (BOOKING_TO, default hello@).
export async function submitBooking(
  input: BookingInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  // Honeypot: real users never fill the hidden "company" field; bots do. Drop silently.
  if (input.company && input.company.trim() !== "") return { ok: true };

  const restaurant = input.restaurant?.trim();
  const email = input.email?.trim();
  if (!restaurant) return { ok: false, error: "Please add your restaurant name." };
  if (!EMAIL_RE.test(email)) return { ok: false, error: "Please add a valid email." };

  const to = process.env.BOOKING_TO || "adrian@platodigital.online";
  const rows: [string, string][] = [
    ["Restaurant", restaurant],
    ["Area", input.area || "-"],
    ["Cuisine", input.cuisine || "-"],
    ["Contact", input.name || "-"],
    ["WhatsApp / phone", input.phone || "-"],
    ["Email", email],
    ["Menu size", input.menuSize || "-"],
    ["Interested plan", input.plan || "-"],
    ["Shoot timing", input.timing || "-"],
    ["Notes", input.notes || "-"],
  ];

  const { error } = await sendEmail({
    to,
    subject: `Demo request, ${restaurant}`,
    html: emailLayout(
      `<p>New demo request from the website:</p>
       <table style="border-collapse:collapse;font-size:14px">
         ${rows.map(([k, v]) => `<tr><td style="padding:3px 12px 3px 0;color:#6b6660">${k}</td><td style="padding:3px 0;color:#16110e"><strong>${escapeHtml(v)}</strong></td></tr>`).join("")}
       </table>
       <p style="margin-top:14px">Reply to ${escapeHtml(email)} to confirm a capture time.</p>`
    ),
  });
  if (error) return { ok: false, error: "Could not send right now, please email us directly." };
  return { ok: true };
}
