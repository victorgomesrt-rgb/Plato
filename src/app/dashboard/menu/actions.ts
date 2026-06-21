"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type Res = { ok: true } | { ok: false; error: string };

// RLS limits these to the signed-in owner's own tenant items.
export async function setItemAvailable(id: string, available: boolean): Promise<Res> {
  const supabase = await createClient();
  const { error } = await supabase.from("menu_items").update({ is_available: available }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard/menu");
  return { ok: true };
}

export async function setItemPrice(id: string, price: number | null): Promise<Res> {
  const supabase = await createClient();
  const { error } = await supabase.from("menu_items").update({ price }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard/menu");
  return { ok: true };
}
