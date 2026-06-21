"use server";

import { revalidatePath } from "next/cache";
import { currentAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

type Res = { ok: true } | { ok: false; error: string };

export async function createHardwareOrder(input: { tenantId: string; itemType: string; quantity: number; notes: string }): Promise<Res> {
  if (!(await currentAdmin())) return { ok: false, error: "Not authorized" };
  if (!input.tenantId) return { ok: false, error: "Pick a tenant" };
  const { error } = await createAdminClient().from("hardware_orders").insert({
    tenant_id: input.tenantId, item_type: input.itemType, quantity: Math.max(1, input.quantity || 1), notes: input.notes.trim() || null,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/hardware");
  return { ok: true };
}

export async function advanceHardware(id: string, status: string): Promise<Res> {
  if (!(await currentAdmin())) return { ok: false, error: "Not authorized" };
  const { error } = await createAdminClient().from("hardware_orders").update({ status }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/hardware");
  return { ok: true };
}
