import "server-only";
import { createAdminClient } from "./supabase/admin";
import { sendEmail, emailLayout, emailButton } from "./email";

const money = (a: number, c = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: c }).format(a);
const fmtDate = (d: string | null) =>
  d ? new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "America/Aruba" }).format(new Date(d)) : "-";

async function ownerEmail(svc: ReturnType<typeof createAdminClient>, tenantId: string) {
  const { data } = await svc
    .from("tenant_members")
    .select("profiles(email)")
    .eq("tenant_id", tenantId)
    .eq("role", "owner")
    .limit(1)
    .maybeSingle();
  return (data?.profiles as unknown as { email: string | null } | null)?.email ?? null;
}

// Sends the unpaid-invoice reminder (copy.md 1.5). Service-role only, no auth gate -
// callers (admin action / cron) authorize first.
export async function remindInvoice(invoiceId: string): Promise<{ ok: boolean; error?: string }> {
  const svc = createAdminClient();
  const { data: inv } = await svc
    .from("invoices")
    .select("*, tenants(name)")
    .eq("id", invoiceId)
    .maybeSingle();
  if (!inv) return { ok: false, error: "Invoice not found" };
  if (inv.status === "paid") return { ok: false, error: "Invoice already paid" };
  const tenant = inv.tenants as unknown as { name: string };
  const to = await ownerEmail(svc, inv.tenant_id);
  if (!to) return { ok: false, error: "No owner email" };

  const signed = inv.pdf_url
    ? (await svc.storage.from("invoices").createSignedUrl(inv.pdf_url, 60 * 60 * 24 * 14)).data
    : null;

  const { error } = await sendEmail({
    to,
    subject: `A quick reminder about invoice ${inv.number}`,
    html: emailLayout(
      `<p>Invoice ${inv.number} for ${money(Number(inv.amount), inv.currency)} was due on ${fmtDate(
        inv.due_date
      )}. To keep ${tenant.name} live, please send payment. Reply if you have a question.</p>
       ${signed ? emailButton(signed.signedUrl, "View invoice") : ""}`
    ),
  });
  if (error) return { ok: false, error: error.message };
  // Record the send so the cron throttles (at most every few days, capped total).
  await svc
    .from("invoices")
    .update({ last_reminded_at: new Date().toISOString(), reminder_count: (inv.reminder_count ?? 0) + 1 })
    .eq("id", invoiceId);
  return { ok: true };
}

// Sent + overdue + unpaid invoices that are due a reminder: not reminded in the last few
// days, and under the total cap so a stuck invoice doesn't email the owner forever.
const REMINDER_GAP_DAYS = 3;
const REMINDER_MAX = 4;
export async function overdueInvoiceIds(): Promise<string[]> {
  const svc = createAdminClient();
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Aruba" }).format(new Date());
  const cutoff = new Date(Date.now() - REMINDER_GAP_DAYS * 86_400_000).toISOString();
  const { data } = await svc
    .from("invoices")
    .select("id")
    .eq("status", "sent")
    .lt("due_date", today)
    .lt("reminder_count", REMINDER_MAX)
    .or(`last_reminded_at.is.null,last_reminded_at.lt.${cutoff}`);
  return (data ?? []).map((r) => r.id);
}

// Dunning, run daily by the invoice-reminders cron. A tenant with a sent + overdue
// invoice moves active/trialing -> past_due; a past_due tenant whose overdue invoices
// are gone (paid or voided) moves back to active. Self-healing and idempotent.
// past_due still serves the public page (short grace window, see publicState) — taking a
// page offline (suspended) stays a manual admin decision, never automatic.
export async function applyDunning(): Promise<{ pastDue: number; restored: number }> {
  const svc = createAdminClient();
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Aruba" }).format(new Date());
  const { data: od } = await svc.from("invoices").select("tenant_id").eq("status", "sent").lt("due_date", today);
  const overdue = new Set((od ?? []).map((r) => r.tenant_id as string));

  let pastDue = 0;
  if (overdue.size) {
    const { data } = await svc
      .from("tenants")
      .update({ status: "past_due" })
      .in("id", [...overdue])
      .in("status", ["active", "trialing"])
      .select("id");
    pastDue = data?.length ?? 0;
  }

  const { data: pd } = await svc.from("tenants").select("id").eq("status", "past_due");
  const restore = (pd ?? []).map((r) => r.id as string).filter((id) => !overdue.has(id));
  let restored = 0;
  if (restore.length) {
    const { data } = await svc.from("tenants").update({ status: "active" }).in("id", restore).select("id");
    restored = data?.length ?? 0;
  }
  return { pastDue, restored };
}
