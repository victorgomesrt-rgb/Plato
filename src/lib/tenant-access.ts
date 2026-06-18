import "server-only";
import { createClient } from "./supabase/server";

// Authorizes the current user for a tenant via RLS (member or platform admin) and
// returns the fields editor actions need. Throws if not allowed.
export async function assertTenantAccess(tenantId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tenants")
    .select("id, slug, plan")
    .eq("id", tenantId)
    .maybeSingle();
  if (!data) throw new Error("Not authorized for this tenant");
  return data as { id: string; slug: string; plan: string };
}
