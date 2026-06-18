// Verifies the M3 provisioning DB flow with the service role (mirrors admin/actions.ts).
// Uses createUser (no email) instead of inviteUserByEmail so tests don't send mail.
// Run: node --env-file=.env.local scripts/db-test-provision.mjs
import { createClient } from "@supabase/supabase-js";

const svc = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

const stamp = Date.now().toString().slice(-7);
const email = `m3test_${stamp}@example.com`;
const slug = `m3test-${stamp}`;
let userId, tenantId, pass = true;
const ok = (label, cond) => {
  console.log(`${cond ? "PASS ✓" : "FAIL ✗"}  ${label}`);
  if (!cond) pass = false;
};

try {
  // 1. Create owner auth user (trigger should create the profile).
  const { data: created, error: cErr } = await svc.auth.admin.createUser({
    email,
    email_confirm: true,
  });
  ok("owner auth user created", !cErr && !!created?.user?.id);
  userId = created.user.id;

  // 2. Profile auto-created by handle_new_user trigger.
  const { data: profile } = await svc
    .from("profiles")
    .select("id, email, is_platform_admin")
    .eq("id", userId)
    .maybeSingle();
  ok("profile auto-created by trigger", profile?.id === userId);
  ok("new profile is NOT platform admin", profile?.is_platform_admin === false);

  // 3. Tenant created as 'building' (private until published).
  const { data: tenant, error: tErr } = await svc
    .from("tenants")
    .insert({ slug, name: "M3 Test Kitchen", plan: "growth", status: "building" })
    .select("id, status, published_at")
    .single();
  ok("tenant created", !tErr && !!tenant?.id);
  ok("tenant starts unpublished (building, no published_at)",
     tenant?.status === "building" && tenant?.published_at === null);
  tenantId = tenant.id;

  // 4. Membership links owner ↔ tenant.
  const { error: mErr } = await svc
    .from("tenant_members")
    .insert({ tenant_id: tenantId, user_id: userId, role: "owner" });
  ok("owner membership created", !mErr);

  // 5. Duplicate slug rejected by the unique constraint.
  const { error: dupErr } = await svc
    .from("tenants")
    .insert({ slug, name: "Dupe", plan: "starter", status: "building" });
  ok("duplicate slug rejected by DB", !!dupErr);
} catch (e) {
  console.error("unexpected error:", e.message);
  pass = false;
} finally {
  // Cleanup
  if (tenantId) await svc.from("tenants").delete().eq("id", tenantId);
  if (userId) await svc.auth.admin.deleteUser(userId);
  console.log("cleaned up test user + tenant");
}

process.exitCode = pass ? 0 : 1;
