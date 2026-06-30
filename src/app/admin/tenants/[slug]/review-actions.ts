"use server";

import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { currentAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

type Res = { ok: true } | { ok: false; error: string };
const shortCode = () => crypto.randomUUID().replace(/-/g, "").slice(0, 8);
const isoDate = (d: Date) => d.toISOString().slice(0, 10);

// Review-card gate is Plato-managed (guarded columns), so it's written via the service
// role behind the admin gate — never the owner session.
export async function setReviewCard(
  tenantId: string,
  slug: string,
  input: { url: string; active: boolean; paidThrough: string | null }
): Promise<Res> {
  try {
    if (!(await currentAdmin())) return { ok: false, error: "Not authorized" };
    const url = input.url.trim();
    if (url && !/^https:\/\/\S+$/i.test(url)) return { ok: false, error: "Enter a valid https:// review URL" };
    const { error } = await createAdminClient()
      .from("tenants")
      .update({ review_url: url || null, review_active: input.active, review_paid_through: input.paidThrough || null })
      .eq("id", tenantId);
    if (error) return { ok: false, error: error.message };
    revalidatePath(`/${slug}`); // public review landing — NOT the current admin page (revalidating the page you're on re-renders it inside the action and 500s on Vercel; the panel updates via router.refresh)
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

// One review short link per tenant (idempotent) — the code printed on the QR/decal/NFC.
export async function generateReviewCode(tenantId: string, slug: string): Promise<Res> {
  try {
    if (!(await currentAdmin())) return { ok: false, error: "Not authorized" };
    const svc = createAdminClient();
    const { data: existing } = await svc
      .from("short_links")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("kind", "review")
      .limit(1);
    if (!existing?.length) {
      const { error } = await svc
        .from("short_links")
        .insert({ tenant_id: tenantId, code: shortCode(), kind: "review", placement: "review" });
      if (error) return { ok: false, error: error.message };
    }
    revalidatePath(`/${slug}`); // public review landing — NOT the current admin page (revalidating the page you're on re-renders it inside the action and 500s on Vercel; the panel updates via router.refresh)
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

// Raise this month's Review Card invoice (draft). Uses the catalog "Review card" price
// when present. Paying it extends the tenant's review_paid_through (see markPaid).
// createInvoice is lazy-imported so this module's other actions never load the billing
// chain (jsPDF/Resend) at init — see translateItemDraft for the same pattern.
export async function billReviewCard(tenantId: string, slug: string): Promise<Res> {
  try {
    if (!(await currentAdmin())) return { ok: false, error: "Not authorized" };
    const svc = createAdminClient();
    const { data: rows } = await svc
      .from("billing_services")
      .select("id, unit_price, description")
      .eq("name", "Review card")
      .limit(1);
    const s = rows?.[0];
    const now = new Date();
    const due = new Date();
    due.setDate(due.getDate() + 14);
    const { createInvoice } = await import("../../billing/actions");
    const r = await createInvoice({
      tenantId,
      periodStart: isoDate(new Date(now.getFullYear(), now.getMonth(), 1)),
      periodEnd: isoDate(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
      dueDate: isoDate(due),
      lines: [{ serviceId: s?.id ?? null, description: s?.description || "Review card · monthly", quantity: 1, unitPrice: s ? Number(s.unit_price) : 25 }],
    });
    if (!r.ok) return r;
    revalidatePath(`/${slug}`); // public review landing — NOT the current admin page (revalidating the page you're on re-renders it inside the action and 500s on Vercel; the panel updates via router.refresh)
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
