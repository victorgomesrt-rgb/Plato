"use server";

import { revalidatePath } from "next/cache";
import { currentAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { changeTenantPlan } from "../actions";

type Res = { ok: true } | { ok: false; error: string };

export async function setChangeRequestStatus(id: string, status: string): Promise<Res> {
  const admin = await currentAdmin();
  if (!admin) return { ok: false, error: "Not authorized" };
  const { error } = await createAdminClient().from("change_requests").update({ status }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/requests");
  return { ok: true };
}

// Apply a plan-change request in one step: change the tenant's plan AND close the
// request, so the two can't drift (admin marking done without actually changing it).
export async function applyPlanFromRequest(requestId: string, tenantId: string, plan: string): Promise<Res> {
  const admin = await currentAdmin();
  if (!admin) return { ok: false, error: "Not authorized" };
  const r = await changeTenantPlan(tenantId, plan);
  if (!r.ok) return r;
  const { error } = await createAdminClient().from("change_requests").update({ status: "done" }).eq("id", requestId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/requests");
  return { ok: true };
}

export async function setHardwareStatus(id: string, status: string): Promise<Res> {
  const admin = await currentAdmin();
  if (!admin) return { ok: false, error: "Not authorized" };
  const { error } = await createAdminClient().from("hardware_orders").update({ status }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/requests");
  return { ok: true };
}
