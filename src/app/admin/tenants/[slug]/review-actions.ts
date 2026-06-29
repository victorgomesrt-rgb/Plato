"use server";

import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { currentAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

type Res = { ok: true } | { ok: false; error: string };
const shortCode = () => crypto.randomUUID().replace(/-/g, "").slice(0, 8);

// Review-card gate is Plato-managed (guarded columns), so it's written via the service
// role behind the admin gate — never the owner session.
export async function setReviewCard(
  tenantId: string,
  slug: string,
  input: { url: string; active: boolean; paidThrough: string | null }
): Promise<Res> {
  if (!(await currentAdmin())) return { ok: false, error: "Not authorized" };
  const url = input.url.trim();
  if (url && !/^https:\/\/\S+$/i.test(url)) return { ok: false, error: "Enter a valid https:// review URL" };
  const { error } = await createAdminClient()
    .from("tenants")
    .update({ review_url: url || null, review_active: input.active, review_paid_through: input.paidThrough || null })
    .eq("id", tenantId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/admin/tenants/${slug}`);
  return { ok: true };
}

// One review short link per tenant (idempotent) — the code printed on the QR/decal/NFC.
export async function generateReviewCode(tenantId: string, slug: string): Promise<Res> {
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
  revalidatePath(`/admin/tenants/${slug}`);
  return { ok: true };
}
