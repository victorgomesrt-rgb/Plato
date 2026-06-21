"use server";

import { revalidatePath } from "next/cache";
import { currentAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

type Res = { ok: true } | { ok: false; error: string };

export async function setChangeRequestStatus(id: string, status: string): Promise<Res> {
  const admin = await currentAdmin();
  if (!admin) return { ok: false, error: "Not authorized" };
  const { error } = await createAdminClient().from("change_requests").update({ status }).eq("id", id);
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
