-- Cookieless "Add to Apple Wallet" tap log (no PII) — the proxy for Plato Card members.
-- One row per tap, written by the /api/card/add redirect via the service role.
create table if not exists public.wallet_card_adds (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now()
);
create index if not exists wallet_card_adds_created_idx on public.wallet_card_adds (created_at);
alter table public.wallet_card_adds enable row level security;
drop policy if exists wca_admin_read on public.wallet_card_adds;
create policy wca_admin_read on public.wallet_card_adds for select using (public.is_admin());
