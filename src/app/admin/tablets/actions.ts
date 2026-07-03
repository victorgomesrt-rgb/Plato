"use server";

import { revalidatePath } from "next/cache";
import { currentAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createInvoice } from "../billing/actions";
import { arubaToday, arubaBillingPeriod } from "@/lib/aruba";

type Res = { ok: true } | { ok: false; error: string };

export async function addTablet(assetTag: string, model: string): Promise<Res> {
  if (!(await currentAdmin())) return { ok: false, error: "Not authorized" };
  if (!assetTag.trim()) return { ok: false, error: "Asset tag required" };
  const { error } = await createAdminClient().from("tablets").insert({ asset_tag: assetTag.trim(), model: model.trim() || null });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/tablets");
  return { ok: true };
}

export async function assignTablet(id: string, tenantId: string): Promise<Res> {
  if (!(await currentAdmin())) return { ok: false, error: "Not authorized" };
  if (!tenantId) return { ok: false, error: "Pick a tenant" };
  const { error } = await createAdminClient().from("tablets").update({ tenant_id: tenantId, status: "deployed", deployed_at: arubaToday(), returned_at: null }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/tablets");
  return { ok: true };
}

export async function returnTablet(id: string): Promise<Res> {
  if (!(await currentAdmin())) return { ok: false, error: "Not authorized" };
  const { error } = await createAdminClient().from("tablets").update({ tenant_id: null, status: "in_stock", returned_at: arubaToday() }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/tablets");
  return { ok: true };
}

// Raise this month's rental invoice for a deployed tablet — connects the fleet to billing
// (a draft invoice the admin then sends from /admin/billing).
export async function billTabletRental(id: string): Promise<Res> {
  if (!(await currentAdmin())) return { ok: false, error: "Not authorized" };
  const { data: t } = await createAdminClient()
    .from("tablets")
    .select("tenant_id, monthly_fee, asset_tag")
    .eq("id", id)
    .maybeSingle();
  if (!t?.tenant_id) return { ok: false, error: "Assign this tablet to a tenant first" };
  if (!t.monthly_fee) return { ok: false, error: "Set a monthly fee on this tablet first" };
  const { periodStart, periodEnd, dueDate } = arubaBillingPeriod();
  const r = await createInvoice({
    tenantId: t.tenant_id,
    periodStart,
    periodEnd,
    dueDate,
    lines: [{
      serviceId: null,
      description: `Tablet rental${t.asset_tag ? ` (${t.asset_tag})` : ""} · monthly`,
      quantity: 1,
      unitPrice: Number(t.monthly_fee),
    }],
  });
  if (!r.ok) return r;
  revalidatePath("/admin/tablets");
  return { ok: true };
}
