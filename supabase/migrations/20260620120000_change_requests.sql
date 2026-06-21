-- Change requests: owners ask the Plato team for menu/video/price updates.
-- Lands in the admin Requests queue (design.md §4, §5b).
create table if not exists public.change_requests (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  kind text not null default 'general',          -- general, menu, video, price, hours, photo
  message text not null,
  status text not null default 'open',            -- open, in_progress, done
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists change_requests_tenant_idx on public.change_requests (tenant_id, created_at desc);

alter table public.change_requests enable row level security;
drop policy if exists cr_all on public.change_requests;
create policy cr_all on public.change_requests
  for all using (public.is_member_of(tenant_id) or public.is_admin())
  with check (public.is_member_of(tenant_id) or public.is_admin());
