"use server";

import { revalidatePath } from "next/cache";
import { currentAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

type Res = { ok: true } | { ok: false; error: string };
const today = () => new Date().toISOString().slice(0, 10);

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
  const { error } = await createAdminClient().from("tablets").update({ tenant_id: tenantId, status: "deployed", deployed_at: today(), returned_at: null }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/tablets");
  return { ok: true };
}

export async function returnTablet(id: string): Promise<Res> {
  if (!(await currentAdmin())) return { ok: false, error: "Not authorized" };
  const { error } = await createAdminClient().from("tablets").update({ tenant_id: null, status: "in_stock", returned_at: today() }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/tablets");
  return { ok: true };
}
