// Verify the privileged-column guard (qa.md: a member cannot change privileged columns).
// Run: node --env-file=.env.local scripts/db-test-guards.mjs
// All writes happen inside transactions that are rolled back.
import pg from "pg";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const password = process.env.SUPABASE_DB_PASSWORD;
const region = process.env.SUPABASE_DB_REGION ?? "us-west-2";
const ref = new URL(url).hostname.split(".")[0];

const client = new pg.Client({
  host: process.env.SUPABASE_POOLER_HOST ?? `aws-1-${region}.pooler.supabase.com`,
  port: 5432,
  user: `postgres.${ref}`,
  password,
  database: "postgres",
  ssl: { rejectUnauthorized: false },
});

await client.connect();

// Test 1: simulate a logged-in non-admin member (auth.uid() set) → must be BLOCKED.
let memberBlocked = false;
try {
  await client.query("begin");
  await client.query(
    `select set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111"}', true)`
  );
  await client.query(`update tenants set plan = 'growth' where slug = 'hungparadise'`);
} catch (e) {
  memberBlocked = /managed by Plato/.test(e.message);
} finally {
  await client.query("rollback");
}

// Test 2: service-role context (no auth session, auth.uid() null) → must be ALLOWED.
let serviceAllowed = false;
try {
  await client.query("begin");
  await client.query(`update tenants set status = 'active' where slug = 'hungparadise'`);
  serviceAllowed = true;
} catch {
  serviceAllowed = false;
} finally {
  await client.query("rollback");
}

console.log(`Member blocked from changing plan:        ${memberBlocked ? "PASS ✓" : "FAIL ✗"}`);
console.log(`Service role allowed to change status:    ${serviceAllowed ? "PASS ✓" : "FAIL ✗"}`);

await client.end();
process.exitCode = memberBlocked && serviceAllowed ? 0 : 1;
