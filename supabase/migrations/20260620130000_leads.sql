-- Landing-page email capture (waitlist / "leave your email"). Inserted server-side
-- via the service role from a server action; only admins can read.
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  source text default 'landing',
  created_at timestamptz not null default now()
);
alter table public.leads enable row level security;
drop policy if exists leads_admin_read on public.leads;
create policy leads_admin_read on public.leads for select using (public.is_admin());
