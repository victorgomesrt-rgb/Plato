"use server";

import { revalidatePath } from "next/cache";
import { currentAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

type Res = { ok: true } | { ok: false; error: string };

export async function addTickerItem(name: string): Promise<Res> {
  if (!(await currentAdmin())) return { ok: false, error: "Not authorized" };
  const n = name.trim();
  if (!n) return { ok: false, error: "Enter a name." };
  if (n.length > 60) return { ok: false, error: "Name is too long." };

  const svc = createAdminClient();
  const { data: last } = await svc.from("ticker_items").select("position").order("position", { ascending: false }).limit(1).maybeSingle();
  const position = (last?.position ?? -1) + 1;
  const { error } = await svc.from("ticker_items").insert({ name: n, position });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/");
  revalidatePath("/admin/landing");
  return { ok: true };
}

export async function removeTickerItem(id: string): Promise<Res> {
  if (!(await currentAdmin())) return { ok: false, error: "Not authorized" };
  const { error } = await createAdminClient().from("ticker_items").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/");
  revalidatePath("/admin/landing");
  return { ok: true };
}
