// Apply a single migration .sql file to the linked Supabase project.
// Run: node --env-file=.env.local scripts/db-migrate.mjs supabase/migrations/<file>.sql
// Uses the session pooler (IPv4). Needs SUPABASE_DB_PASSWORD + NEXT_PUBLIC_SUPABASE_URL.
// Wraps the file in a transaction so a failure rolls back cleanly.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import pg from "pg";

const file = process.argv[2];
if (!file) {
  console.error("Usage: node --env-file=.env.local scripts/db-migrate.mjs <path-to-.sql>");
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const password = process.env.SUPABASE_DB_PASSWORD;
const region = process.env.SUPABASE_DB_REGION ?? "us-west-2";
if (!url || !password) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_DB_PASSWORD.");
  process.exit(1);
}
const ref = new URL(url).hostname.split(".")[0];

const client = new pg.Client({
  host: process.env.SUPABASE_POOLER_HOST ?? `aws-1-${region}.pooler.supabase.com`,
  port: 5432, // session pooler
  user: `postgres.${ref}`,
  password,
  database: "postgres",
  ssl: { rejectUnauthorized: false },
});

const sql = readFileSync(resolve(process.cwd(), file), "utf8");

try {
  await client.connect();
  await client.query("begin");
  await client.query(sql);
  await client.query("commit");
  console.log(`✓ Applied ${file}`);
} catch (err) {
  try { await client.query("rollback"); } catch {}
  console.error("✗ Migration failed:", err.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
