"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

type Res = { ok: true } | { ok: false; error: string };

async function tenantSlug(supabase: SupabaseClient): Promise<string | null> {
  const { data } = await supabase.from("tenant_members").select("tenants(slug)").limit(1).maybeSingle();
  return (data?.tenants as unknown as { slug: string } | null)?.slug ?? null;
}

// Reflect the edit on the owner page AND the public menu immediately (not just the 5-min ISR window).
async function revalidate(supabase: SupabaseClient) {
  revalidatePath("/dashboard/menu");
  const slug = await tenantSlug(supabase);
  if (slug) revalidatePath(`/${slug}`);
}

// RLS limits these to the signed-in owner's own tenant items.
export async function setItemAvailable(id: string, available: boolean): Promise<Res> {
  const supabase = await createClient();
  const { error } = await supabase.from("menu_items").update({ is_available: available }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  await revalidate(supabase);
  return { ok: true };
}

export async function setItemPrice(id: string, price: number | null): Promise<Res> {
  const supabase = await createClient();
  const { error } = await supabase.from("menu_items").update({ price }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  await revalidate(supabase);
  return { ok: true };
}
