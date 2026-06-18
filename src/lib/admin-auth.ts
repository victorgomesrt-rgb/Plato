import "server-only";
import { createClient } from "./supabase/server";
import type { User } from "@supabase/supabase-js";

// Returns the signed-in user if they are a platform admin, else null.
// Pages use this to redirect/404; server actions use it to reject.
export async function currentAdmin(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_platform_admin")
    .eq("id", user.id)
    .maybeSingle();

  return profile?.is_platform_admin ? user : null;
}
