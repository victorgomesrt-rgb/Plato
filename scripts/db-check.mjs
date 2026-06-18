// Quick health check of the linked Supabase project after M1.
// Run: node --env-file=.env.local scripts/db-check.mjs
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

const q = (sql) => client.query(sql).then((r) => r.rows);

await client.connect();

const [tenant] = await q(
  `select slug, name, status, plan, (published_at is not null) as published
   from tenants where slug = 'hungparadise'`
);
const [counts] = await q(
  `select
     (select count(*) from menu_categories) as categories,
     (select count(*) from menu_items) as items,
     (select count(*) from menu_items where is_featured) as featured`
);
const rls = await q(
  `select relname from pg_class c join pg_namespace n on n.oid=c.relnamespace
   where n.nspname='public' and c.relkind='r' and c.relrowsecurity=false`
);
const triggers = await q(
  `select tgname from pg_trigger
   where tgname in ('trg_guard_tenant','trg_guard_profile','trg_items_updated_at','trg_on_auth_user_created')
   order by tgname`
);
const buckets = await q(`select id from storage.buckets order by id`);
const tableCount = await q(
  `select count(*) as n from pg_class c join pg_namespace n on n.oid=c.relnamespace
   where n.nspname='public' and c.relkind='r'`
);

console.log("Demo tenant:   ", tenant);
console.log("Menu counts:   ", counts);
console.log("Public tables: ", tableCount[0].n);
console.log("RLS DISABLED on:", rls.length ? rls.map((r) => r.relname) : "none ✓");
console.log("Guard triggers:", triggers.map((t) => t.tgname));
console.log("Storage buckets:", buckets.map((b) => b.id));

await client.end();
