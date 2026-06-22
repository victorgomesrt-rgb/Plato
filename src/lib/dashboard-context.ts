import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const IMP_COOKIE = "plato_imp";

export type DashboardCtx = {
  db: SupabaseClient; // service-role when impersonating; the RLS session client otherwise
  tenantId: string;
  impersonating: boolean;
};

export type Resolved =
  | { state: "redirect" } // not signed in
  | { state: "no_tenant" } // a real user with no tenant membership
  | { state: "ok"; ctx: DashboardCtx };

// Decides which tenant the owner dashboard should show.
// A platform admin with an active impersonation cookie sees that tenant, read via the
// service role (the admin is not an RLS member of it). The cookie alone grants nothing:
// we re-check is_platform_admin on every load, so a forged cookie from a non-admin is ignored.
// Everyone else sees their own tenant through the RLS session client (unchanged behaviour).
// cache(): the layout and the page both call this in one render — dedupe to a single
// auth+membership resolution per request. getClaims(): verifies the JWT locally (no
// auth-server round-trip) when the project uses asymmetric keys, so navigation is fast.
export const resolveDashboard = cache(async (): Promise<Resolved> => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub as string | undefined;
  if (error || !userId) return { state: "redirect" };

  const impId = (await cookies()).get(IMP_COOKIE)?.value;
  if (impId) {
    const { data: profile } = await supabase
      .from("profiles").select("is_platform_admin").eq("id", userId).maybeSingle();
    if (profile?.is_platform_admin) {
      const svc = createAdminClient();
      const { data: t } = await svc.from("tenants").select("id").eq("id", impId).maybeSingle();
      if (t) return { state: "ok", ctx: { db: svc, tenantId: t.id, impersonating: true } };
    }
  }

  const { data: mem } = await supabase
    .from("tenant_members").select("tenant_id").limit(1).maybeSingle();
  if (!mem) return { state: "no_tenant" };
  return { state: "ok", ctx: { db: supabase, tenantId: mem.tenant_id as string, impersonating: false } };
});
