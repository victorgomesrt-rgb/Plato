import "server-only";
import { cache } from "react";
import { createClient } from "./supabase/server";

export type AdminUser = { id: string; email: string };

// Returns the signed-in user iff they are a platform admin, else null.
// - cache(): dedupes the layout + page calls within one request render.
// - getClaims(): verifies the JWT locally when the project uses asymmetric signing keys
//   (no auth-server round-trip), falling back to a network check otherwise — so it's as
//   fast as possible and never less safe than getUser.
export const currentAdmin = cache(async (): Promise<AdminUser | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (error || !claims?.sub) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_platform_admin")
    .eq("id", claims.sub)
    .maybeSingle();
  if (!profile?.is_platform_admin) return null;

  return { id: claims.sub, email: (claims.email as string | undefined) ?? "" };
});
