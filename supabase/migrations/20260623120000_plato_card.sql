-- Plato Card (Apple Wallet coalition loyalty), v1. Spec: docs/plato-card.md.
-- One shared PassBuddy pass; member discount per partner; admin-curated + paid blasts.

-- Pass registry (v1 = one row, kind='plato_card'; shaped so Phase 2 per-diner reuses it).
create table if not exists public.wallet_passes (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'plato_card',
  passbuddy_pass_id text,
  slug text,
  serial text,
  share_id text,
  created_at timestamptz not null default now()
);
alter table public.wallet_passes enable row level security;
drop policy if exists wp_admin on public.wallet_passes;
create policy wp_admin on public.wallet_passes
  for all using (public.is_admin()) with check (public.is_admin());

-- Every push + the monetization ledger. tenant_id null = Plato's own network blast.
create table if not exists public.wallet_blasts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade,
  message text not null,
  status text not null default 'requested',          -- requested, approved, scheduled, sent, declined
  scheduled_at timestamptz,
  sent_at timestamptz,
  requested_by uuid references auth.users(id) on delete set null,
  passbuddy_message_id text,
  invoice_id uuid references public.invoices(id) on delete set null,
  price numeric(10,2),
  created_at timestamptz not null default now()
);
create index if not exists wallet_blasts_tenant_idx on public.wallet_blasts (tenant_id, created_at desc);
alter table public.wallet_blasts enable row level security;
drop policy if exists wb_read on public.wallet_blasts;
drop policy if exists wb_insert on public.wallet_blasts;
drop policy if exists wb_admin on public.wallet_blasts;
create policy wb_read on public.wallet_blasts
  for select using (public.is_member_of(tenant_id) or public.is_admin());
create policy wb_insert on public.wallet_blasts
  for insert with check (public.is_member_of(tenant_id) or public.is_admin());
create policy wb_admin on public.wallet_blasts
  for update using (public.is_admin()) with check (public.is_admin());

-- Partner participation + the standing member perk (owner-editable; not guarded columns).
alter table public.tenants add column if not exists wallet_partner boolean not null default false;
alter table public.tenants add column if not exists wallet_discount text;
