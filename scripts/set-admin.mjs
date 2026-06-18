// One-time bootstrap: grant platform admin to a profile by email.
// The account must exist first (the person signs in once, or you provision them).
// Run: npm run set-admin -- you@platodigital.io
import { createClient } from "@supabase/supabase-js";

const email = process.argv[2]?.toLowerCase();
if (!email) {
  console.error("Usage: npm run set-admin -- <email>");
  process.exit(1);
}

const svc = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

// Service role has no auth session, so the privileged-column guard allows this.
const { data, error } = await svc
  .from("profiles")
  .update({ is_platform_admin: true })
  .eq("email", email)
  .select("id, email, is_platform_admin");

if (error) {
  console.error("Error:", error.message);
  process.exit(1);
}
if (!data?.length) {
  console.error(
    `No profile found for ${email}. Create/sign in the account first, then re-run.`
  );
  process.exit(1);
}
console.log("✓ Platform admin granted:", data[0]);
