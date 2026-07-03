// 2-tenant RLS isolation test (qa.md §1 — highest-priority pre-launch check).
//
// Provisions two throwaway tenants (A, B), each with a real password-auth owner, seeds a
// row per tenant-scoped table, then acts AS owner A (an RLS-scoped anon client carrying A's
// JWT — NOT the service role, which bypasses RLS) and proves:
//   - A cannot read / update / insert / delete tenant B's data (any table)
//   - A cannot read admin-only tables (leads, billing_services, wallet_passes)
//   - A cannot change privileged columns on its own tenant (plan/status/published_at/slug)
//   - A cannot self-escalate (profiles.is_platform_admin, tenant_members into B)
//   - A CAN read + write its own tenant (positive controls — proves the test isn't vacuous)
// Everything is cleaned up in a finally block.
//
// Run: node --env-file=.env.local scripts/qa-rls-isolation.mjs

import { createClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SVC = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !ANON || !SVC) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const svc = createClient(URL, SVC, { auth: { persistSession: false } });
const ts = Date.now();

let passed = 0, failed = 0;
const fails = [];
// A check "passes" when the isolation held. `ok` is that boolean.
function check(name, ok, detail = "") {
  if (ok) { passed++; console.log(`  ✓ ${name}`); }
  else { failed++; fails.push(name); console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ""}`); }
}

// Seed one tenant + owner (confirmed, with a password so we can sign in and get an RLS JWT).
async function makeTenant(tag) {
  const slug = `rls-test-${tag}-${ts}`;
  const { data: t, error: te } = await svc
    .from("tenants")
    .insert({ slug, name: `RLS ${tag}`, status: "active", base_currency: "USD", fx_rate: 1.8, published_at: new Date().toISOString() })
    .select("id, slug, plan, status")
    .single();
  if (te) throw new Error(`seed tenant ${tag}: ${te.message}`);

  const email = `rls-${tag}-${ts}@platodigital.io`;
  const password = `Rls!${ts}${tag}xZ`;
  const { data: u, error: ue } = await svc.auth.admin.createUser({ email, password, email_confirm: true });
  if (ue) throw new Error(`seed user ${tag}: ${ue.message}`);
  const userId = u.user.id;
  const { error: me } = await svc.from("tenant_members").insert({ tenant_id: t.id, user_id: userId, role: "owner" });
  if (me) throw new Error(`seed member ${tag}: ${me.message}`);

  // A row in each tenant-scoped table so cross-reads have something to (fail to) find.
  const { data: cat } = await svc.from("menu_categories").insert({ tenant_id: t.id, name: `${tag} cat`, sort_order: 0 }).select("id").single();
  const { data: item } = await svc.from("menu_items").insert({ tenant_id: t.id, category_id: cat.id, name: `${tag} dish`, price: 10 }).select("id").single();
  const { data: inv } = await svc.from("invoices").insert({ tenant_id: t.id, number: `RLS-${tag}-${ts}`, amount: 99, currency: "USD", status: "sent" }).select("id").single();
  const { data: cr } = await svc.from("change_requests").insert({ tenant_id: t.id, kind: "general", message: `${tag} secret note`, status: "open" }).select("id").single();
  const { data: sl } = await svc.from("short_links").insert({ tenant_id: t.id, code: `rls${tag}${ts}`.slice(0, 12), kind: "qr", placement: "table" }).select("id").single();
  await svc.from("analytics_events").insert({ tenant_id: t.id, event_type: "page_view" });
  await svc.from("subscriptions").upsert({ tenant_id: t.id, plan: t.plan, status: "active", interval: "month" });

  return { ...t, email, password, userId, catId: cat.id, itemId: item.id, invoiceId: inv.id, crId: cr.id, slId: sl.id };
}

async function run() {
  console.log(`\n=== 2-Tenant RLS Isolation Test (${new Date().toISOString()}) ===\n`);
  const A = await makeTenant("a");
  const B = await makeTenant("b");
  console.log(`Seeded tenant A (${A.slug}) and B (${B.slug}). Acting as owner A against B.\n`);

  // RLS-scoped client carrying owner A's JWT.
  const cA = createClient(URL, ANON, { auth: { persistSession: false } });
  const { error: se } = await cA.auth.signInWithPassword({ email: A.email, password: A.password });
  if (se) throw new Error(`owner A sign-in failed: ${se.message}`);

  console.log("── Cross-tenant READ (expect 0 rows of B) ──");
  for (const [tbl, col, id] of [
    ["tenants", "id", B.id], ["menu_categories", "id", B.catId], ["menu_items", "id", B.itemId],
    ["invoices", "id", B.invoiceId], ["change_requests", "id", B.crId], ["short_links", "id", B.slId],
    ["subscriptions", "tenant_id", B.id], ["analytics_events", "tenant_id", B.id],
  ]) {
    const { data } = await cA.from(tbl).select("*").eq(col, id);
    check(`read B.${tbl}`, (data?.length ?? 0) === 0, `saw ${data?.length} row(s)`);
  }

  console.log("\n── Admin-only tables (expect 0 rows for an owner) ──");
  for (const tbl of ["leads", "billing_services", "wallet_passes", "ticker_items"]) {
    const { data } = await cA.from(tbl).select("*");
    check(`read ${tbl}`, (data?.length ?? 0) === 0, `saw ${data?.length} row(s)`);
  }

  console.log("\n── Cross-tenant WRITE (expect blocked) ──");
  {
    const { data } = await cA.from("menu_items").update({ price: 0 }).eq("id", B.itemId).select("id");
    const { data: after } = await svc.from("menu_items").select("price").eq("id", B.itemId).single();
    check("update B.menu_items", (data?.length ?? 0) === 0 && Number(after.price) === 10, `matched ${data?.length}, price=${after.price}`);
  }
  {
    const { data } = await cA.from("change_requests").update({ status: "done" }).eq("id", B.crId).select("id");
    check("update B.change_requests", (data?.length ?? 0) === 0);
  }
  {
    const { data } = await cA.from("menu_items").delete().eq("id", B.itemId).select("id");
    const { count } = await svc.from("menu_items").select("id", { count: "exact", head: true }).eq("id", B.itemId);
    check("delete B.menu_items", (data?.length ?? 0) === 0 && count === 1);
  }
  {
    const { error } = await cA.from("menu_items").insert({ tenant_id: B.id, category_id: B.catId, name: "injected", price: 1 });
    check("insert into B.menu_items", !!error, "insert unexpectedly succeeded");
  }
  {
    const { error } = await cA.from("change_requests").insert({ tenant_id: B.id, kind: "general", message: "x" });
    check("insert into B.change_requests", !!error, "insert unexpectedly succeeded");
  }

  console.log("\n── Privileged-column guard on A's OWN tenant (expect blocked) ──");
  for (const [col, val] of [["plan", "premium"], ["status", "suspended"], ["published_at", null], ["slug", `hijacked-${ts}`]]) {
    const { error } = await cA.from("tenants").update({ [col]: val }).eq("id", A.id);
    const { data: after } = await svc.from("tenants").select(col).eq("id", A.id).single();
    const unchanged = col === "published_at" ? after[col] !== null : String(after[col]) !== String(val);
    check(`guard tenants.${col}`, !!error || unchanged, `err=${!!error} after=${after[col]}`);
  }

  console.log("\n── Self-escalation (expect blocked) ──");
  {
    await cA.from("profiles").update({ is_platform_admin: true }).eq("id", A.userId);
    const { data } = await svc.from("profiles").select("is_platform_admin").eq("id", A.userId).single();
    check("profiles.is_platform_admin stays false", data.is_platform_admin !== true, `is=${data.is_platform_admin}`);
  }
  {
    const { error } = await cA.from("tenant_members").insert({ tenant_id: B.id, user_id: A.userId, role: "owner" });
    const { count } = await svc.from("tenant_members").select("tenant_id", { count: "exact", head: true }).eq("tenant_id", B.id).eq("user_id", A.userId);
    check("cannot join tenant B", !!error || count === 0);
  }
  {
    const { data } = await cA.from("profiles").select("*").eq("id", B.userId);
    check("cannot read B owner's profile", (data?.length ?? 0) === 0, `saw ${data?.length}`);
  }

  console.log("\n── Positive controls (A CAN use its OWN tenant) ──");
  {
    const { data } = await cA.from("menu_items").select("id").eq("tenant_id", A.id);
    check("read own menu_items", (data?.length ?? 0) >= 1, `saw ${data?.length}`);
  }
  {
    const { data, error } = await cA.from("menu_items").insert({ tenant_id: A.id, category_id: A.catId, name: "own new", price: 5 }).select("id");
    check("insert own menu_item", !error && (data?.length ?? 0) === 1, error?.message);
  }
  {
    const { error } = await cA.from("tenants").update({ description: "own edit ok" }).eq("id", A.id);
    check("edit own non-privileged column", !error, error?.message);
  }

  await cA.auth.signOut();
}

async function cleanup() {
  console.log("\n── Cleanup ──");
  for (const tag of ["a", "b"]) {
    const slug = `rls-test-${tag}-${ts}`;
    const { data: t } = await svc.from("tenants").select("id").eq("slug", slug).maybeSingle();
    if (t) await svc.from("tenants").delete().eq("id", t.id); // cascades to child rows
    const email = `rls-${tag}-${ts}@platodigital.io`;
    const { data: list } = await svc.auth.admin.listUsers({ page: 1, perPage: 200 });
    const u = list?.users?.find((x) => x.email === email);
    if (u) await svc.auth.admin.deleteUser(u.id);
  }
  console.log("  removed test tenants + users");
}

try {
  await run();
} catch (e) {
  console.error("\nFATAL:", e.message);
  failed++;
} finally {
  await cleanup();
}

console.log(`\n=== ${failed === 0 ? "✓ PASS" : "✗ FAIL"} — ${passed} passed, ${failed} failed ===`);
if (fails.length) console.log("Failed:", fails.join(", "));
process.exit(failed === 0 ? 0 : 1);
