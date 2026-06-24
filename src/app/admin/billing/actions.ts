"use server";

import { revalidatePath } from "next/cache";
import { currentAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail, emailLayout, emailButton } from "@/lib/email";
import { buildInvoicePdf } from "@/lib/invoice-pdf";
import { remindInvoice } from "@/lib/billing";

type Result<T = unknown> = { ok: true; data?: T } | { ok: false; error: string };

const PAYMENT_INSTRUCTIONS =
  process.env.INVOICE_PAYMENT_INSTRUCTIONS ||
  "Pay by bank transfer or in person. Reply to this email and we'll share the current payment details.";

function money(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}
function fmtDate(d: string | null) {
  if (!d) return "-";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "America/Aruba" }).format(
    new Date(d)
  );
}
function periodLabel(start: string | null, end: string | null) {
  if (!start || !end) return "this period";
  return `${fmtDate(start)} - ${fmtDate(end)}`;
}
function arubaYear() {
  return new Intl.DateTimeFormat("en-US", { timeZone: "America/Aruba", year: "numeric" }).format(
    new Date()
  );
}

async function ownerEmail(svc: ReturnType<typeof createAdminClient>, tenantId: string) {
  const { data } = await svc
    .from("tenant_members")
    .select("profiles(email)")
    .eq("tenant_id", tenantId)
    .eq("role", "owner")
    .limit(1)
    .maybeSingle();
  // profiles embed is to-one
  return (data?.profiles as unknown as { email: string | null } | null)?.email ?? null;
}

type LineInput = { serviceId: string | null; description: string; quantity: number; unitPrice: number };
const round2 = (n: number) => Math.round(n * 100) / 100;

export async function createInvoice(input: {
  tenantId: string;
  periodStart: string;
  periodEnd: string;
  dueDate: string;
  lines: LineInput[];
}): Promise<Result> {
  if (!(await currentAdmin())) return { ok: false, error: "Not authorized" };

  // Sanitize + price the lines on the server (never trust the UI total).
  const lines = (input.lines ?? [])
    .map((l, i) => {
      const quantity = Number(l.quantity) || 0;
      const unit_price = round2(Number(l.unitPrice) || 0);
      return {
        service_id: l.serviceId || null,
        description: (l.description ?? "").trim(),
        quantity,
        unit_price,
        amount: round2(quantity * unit_price),
        sort_order: i,
      };
    })
    .filter((l) => l.description && l.quantity > 0);
  if (lines.length === 0) return { ok: false, error: "Add at least one line item" };
  const total = round2(lines.reduce((a, l) => a + l.amount, 0));
  const summary =
    lines.length === 1 ? lines[0].description : `${lines[0].description} +${lines.length - 1} more`;

  const svc = createAdminClient();
  const year = arubaYear();
  const { count } = await svc
    .from("invoices")
    .select("id", { count: "exact", head: true })
    .like("number", `PLATO-${year}-%`);

  // Insert with a number, retrying if a concurrent insert took it.
  let seq = (count ?? 0) + 1;
  for (let attempt = 0; attempt < 5; attempt++) {
    const number = `PLATO-${year}-${String(seq).padStart(4, "0")}`;
    const { data: inv, error } = await svc
      .from("invoices")
      .insert({
        tenant_id: input.tenantId,
        number,
        amount: total,
        currency: "USD",
        description: summary,
        period_start: input.periodStart,
        period_end: input.periodEnd,
        due_date: input.dueDate,
        method: "manual",
        status: "draft",
      })
      .select("id")
      .single();
    if (!error && inv) {
      const { error: liErr } = await svc
        .from("invoice_line_items")
        .insert(lines.map((l) => ({ invoice_id: inv.id, ...l })));
      if (liErr) return { ok: false, error: liErr.message };
      revalidatePath("/admin/billing");
      return { ok: true };
    }
    if (error?.code === "23505") {
      seq++;
      continue;
    }
    return { ok: false, error: error?.message ?? "Could not create the invoice" };
  }
  return { ok: false, error: "Could not assign an invoice number" };
}

// Add-on service catalog (admin Billing → Manage services). Editable prices.
export async function saveService(input: {
  id?: string;
  name: string;
  description: string;
  unitPrice: number;
  unit: string;
  active?: boolean;
}): Promise<Result> {
  if (!(await currentAdmin())) return { ok: false, error: "Not authorized" };
  const name = (input.name ?? "").trim();
  if (!name) return { ok: false, error: "Name is required" };
  const svc = createAdminClient();
  const row = {
    name,
    description: (input.description ?? "").trim(),
    unit_price: round2(Number(input.unitPrice) || 0),
    unit: input.unit || "each",
    active: input.active ?? true,
  };
  const { error } = input.id
    ? await svc.from("billing_services").update(row).eq("id", input.id)
    : await svc.from("billing_services").insert({ ...row, sort_order: 100 });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/billing");
  return { ok: true };
}

export async function deleteService(id: string): Promise<Result> {
  if (!(await currentAdmin())) return { ok: false, error: "Not authorized" };
  const svc = createAdminClient();
  const { error } = await svc.from("billing_services").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/billing");
  return { ok: true };
}

export async function sendInvoice(invoiceId: string): Promise<Result> {
  if (!(await currentAdmin())) return { ok: false, error: "Not authorized" };
  const svc = createAdminClient();
  const { data: inv } = await svc
    .from("invoices")
    .select("*, tenants(name, slug, plan)")
    .eq("id", invoiceId)
    .maybeSingle();
  if (!inv) return { ok: false, error: "Invoice not found" };
  const tenant = inv.tenants as unknown as { name: string; slug: string; plan: string };

  const to = await ownerEmail(svc, inv.tenant_id);
  if (!to) return { ok: false, error: "That tenant has no owner email" };

  const { data: liData } = await svc
    .from("invoice_line_items")
    .select("description, quantity, unit_price, amount")
    .eq("invoice_id", invoiceId)
    .order("sort_order");
  const lines = (liData ?? []).map((l) => ({
    description: l.description as string,
    quantity: Number(l.quantity),
    unitPrice: Number(l.unit_price),
    amount: Number(l.amount),
  }));

  const pdf = buildInvoicePdf({
    number: inv.number,
    restaurant: tenant.name,
    periodLabel: periodLabel(inv.period_start, inv.period_end),
    amount: Number(inv.amount),
    currency: inv.currency,
    dueDate: fmtDate(inv.due_date),
    planLabel: tenant.plan,
    paymentInstructions: PAYMENT_INSTRUCTIONS,
    lines,
  });

  const path = `${inv.tenant_id}/${inv.number}.pdf`;
  await svc.storage.from("invoices").upload(path, pdf, {
    contentType: "application/pdf",
    upsert: true,
  });
  const { data: signed } = await svc.storage.from("invoices").createSignedUrl(path, 60 * 60 * 24 * 30);

  const html = emailLayout(
    `<p>Here is your invoice for ${periodLabel(inv.period_start, inv.period_end)}.</p>
     <p><strong>Amount:</strong> ${money(Number(inv.amount), inv.currency)}<br/>
     <strong>Due:</strong> ${fmtDate(inv.due_date)}</p>
     <p>Pay by transfer or in person. Details are in the invoice.</p>
     ${signed ? emailButton(signed.signedUrl, "View invoice") : ""}
     <p>Thanks for building with Plato.</p>`
  );
  const { error: mailErr } = await sendEmail({
    to,
    subject: `Invoice ${inv.number} for ${tenant.name}`,
    html,
    attachments: [{ filename: `${inv.number}.pdf`, content: pdf }],
  });
  if (mailErr) return { ok: false, error: `Email failed: ${mailErr.message}` };

  await svc
    .from("invoices")
    .update({ status: "sent", sent_at: new Date().toISOString(), pdf_url: path })
    .eq("id", invoiceId);
  revalidatePath("/admin/billing");
  return { ok: true };
}

export async function markPaid(invoiceId: string): Promise<Result> {
  if (!(await currentAdmin())) return { ok: false, error: "Not authorized" };
  const svc = createAdminClient();
  const { data: inv } = await svc
    .from("invoices")
    .select("*, tenants(name, slug, plan)")
    .eq("id", invoiceId)
    .maybeSingle();
  if (!inv) return { ok: false, error: "Invoice not found" };
  const tenant = inv.tenants as unknown as { name: string; slug: string; plan: string };

  await svc
    .from("invoices")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("id", invoiceId);

  // Activate the tenant (service role bypasses the privileged-column guard).
  await svc.from("tenants").update({ status: "active" }).eq("id", inv.tenant_id);

  // Roll the subscription period forward one month from the later of now / current end.
  const { data: sub } = await svc
    .from("subscriptions")
    .select("current_period_end")
    .eq("tenant_id", inv.tenant_id)
    .maybeSingle();
  const now = new Date();
  const base = sub?.current_period_end && new Date(sub.current_period_end) > now
    ? new Date(sub.current_period_end)
    : now;
  base.setMonth(base.getMonth() + 1);
  await svc.from("subscriptions").upsert({
    tenant_id: inv.tenant_id,
    plan: tenant.plan,
    status: "active",
    interval: "month",
    current_period_end: base.toISOString(),
  });

  const to = await ownerEmail(svc, inv.tenant_id);
  if (to) {
    await sendEmail({
      to,
      subject: "Payment received, thank you",
      html: emailLayout(
        `<p>We received your payment of ${money(Number(inv.amount), inv.currency)} for ${periodLabel(
          inv.period_start,
          inv.period_end
        )}. Your menu stays live. Nothing else to do.</p>`
      ),
    });
  }
  revalidatePath("/admin/billing");
  return { ok: true };
}

export async function sendReminder(invoiceId: string): Promise<Result> {
  if (!(await currentAdmin())) return { ok: false, error: "Not authorized" };
  const r = await remindInvoice(invoiceId);
  if (r.ok) revalidatePath("/admin/billing");
  return r.ok ? { ok: true } : { ok: false, error: r.error ?? "Failed" };
}

export async function voidInvoice(invoiceId: string): Promise<Result> {
  if (!(await currentAdmin())) return { ok: false, error: "Not authorized" };
  const svc = createAdminClient();
  const { error } = await svc.from("invoices").update({ status: "void" }).eq("id", invoiceId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/billing");
  return { ok: true };
}

export async function invoiceSignedUrl(invoiceId: string): Promise<Result<{ url: string }>> {
  if (!(await currentAdmin())) return { ok: false, error: "Not authorized" };
  const svc = createAdminClient();
  const { data: inv } = await svc
    .from("invoices")
    .select("pdf_url")
    .eq("id", invoiceId)
    .maybeSingle();
  if (!inv?.pdf_url) return { ok: false, error: "No PDF yet, send the invoice first" };
  const { data } = await svc.storage.from("invoices").createSignedUrl(inv.pdf_url, 60 * 10);
  if (!data) return { ok: false, error: "Could not create link" };
  return { ok: true, data: { url: data.signedUrl } };
}
