"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type Result = { ok: true } | { ok: false; error: string };

async function memberTenant() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, tenantId: null as string | null, userId: null as string | null };
  const { data: mem } = await supabase.from("tenant_members").select("tenant_id, tenants(slug)").limit(1).maybeSingle();
  const tenantId = (mem?.tenant_id as string | undefined) ?? null;
  const slug = (mem?.tenants as unknown as { slug: string } | null)?.slug ?? null;
  return { supabase, tenantId, userId: user.id, slug };
}

// Owner sets their standing member perk + whether they're listed on the Plato Card.
export async function saveWalletPerk(discount: string, listed: boolean): Promise<Result> {
  const { supabase, tenantId, slug } = await memberTenant();
  if (!tenantId) return { ok: false, error: "We couldn't find your menu." };

  const { error } = await supabase.from("tenants")
    .update({ wallet_discount: discount.trim() || null, wallet_partner: listed })
    .eq("id", tenantId);
  if (error) return { ok: false, error: "Could not save, please try again." };

  revalidatePath("/dashboard/plato-card");
  revalidatePath("/card");
  if (slug) revalidatePath(`/${slug}`);
  return { ok: true };
}

// Owner requests a promo blast; lands in the admin queue (admin sends + invoices).
export async function requestPromo(message: string, scheduledAt?: string): Promise<Result> {
  const text = message.trim();
  if (!text) return { ok: false, error: "Describe the special you want to push." };

  const { tenantId, userId, supabase } = await memberTenant();
  if (!tenantId) return { ok: false, error: "We couldn't find your menu." };

  const { error } = await supabase.from("wallet_blasts").insert({
    tenant_id: tenantId, message: text, status: "requested",
    scheduled_at: scheduledAt || null, requested_by: userId, price: 75,
  });
  if (error) return { ok: false, error: "Could not send, please try again." };
  revalidatePath("/dashboard/plato-card");
  return { ok: true };
}
