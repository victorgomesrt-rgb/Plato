// Apply supabase/seed.sql to the linked Supabase project.
// Run: node --env-file=.env.local scripts/db-seed.mjs
// Uses the session pooler (IPv4). Needs SUPABASE_DB_PASSWORD + NEXT_PUBLIC_SUPABASE_URL.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));

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

const sql = readFileSync(resolve(__dirname, "../supabase/seed.sql"), "utf8");

try {
  await client.connect();
  await client.query(sql);
  console.log("✓ Seed applied.");
} catch (err) {
  console.error("✗ Seed failed:", err.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
