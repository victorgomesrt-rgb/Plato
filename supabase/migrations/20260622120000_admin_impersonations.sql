-- Audit log of admin "view as owner" impersonation sessions (qa §1: logged + scoped).
-- A platform admin starting an impersonation writes one row here; the dashboard reads
-- the impersonated tenant via the service role and shows a read-only banner.
create table if not exists public.admin_impersonations (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.profiles(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admin_impersonations enable row level security;
drop policy if exists imp_admin_all on public.admin_impersonations;
create policy imp_admin_all on public.admin_impersonations
  for all using (public.is_admin()) with check (public.is_admin());
