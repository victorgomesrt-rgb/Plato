-- Plato Row Level Security — see docs/architecture.md §6
-- Public menu pages do NOT read these tables directly. They render on the server
-- with the service role behind a publish gate (architecture.md §6 "Public menu reads").

alter table public.profiles          enable row level security;
alter table public.tenants           enable row level security;
alter table public.tenant_members    enable row level security;
alter table public.menu_categories   enable row level security;
alter table public.menu_items        enable row level security;
alter table public.media_assets      enable row level security;
alter table public.subscriptions     enable row level security;
alter table public.invoices          enable row level security;
alter table public.hardware_orders   enable row level security;
alter table public.tablets           enable row level security;
alter table public.analytics_events  enable row level security;
alter table public.analytics_daily   enable row level security;
alter table public.short_links       enable row level security;

-- Profiles: a user reads/edits own row. Admin reads all.
create policy profiles_self on public.profiles
  for select using (id = auth.uid() or public.is_admin());
create policy profiles_update_self on public.profiles
  for update using (id = auth.uid());

-- Tenants: members read their tenant, admin all. Owners/admin update
-- (privileged columns are blocked by a trigger in the guards migration).
create policy tenants_read on public.tenants
  for select using (public.is_member_of(id) or public.is_admin());
create policy tenants_update on public.tenants
  for update using (public.is_member_of(id) or public.is_admin());

-- Tenant members: members of the tenant read. Admin all. Writes via service role.
create policy members_read on public.tenant_members
  for select using (public.is_member_of(tenant_id) or public.is_admin());

-- Menu categories: members manage. Admin all.
create policy cats_all on public.menu_categories
  for all using (public.is_member_of(tenant_id) or public.is_admin())
  with check (public.is_member_of(tenant_id) or public.is_admin());

-- Menu items: members manage. Admin all.
create policy items_all on public.menu_items
  for all using (public.is_member_of(tenant_id) or public.is_admin())
  with check (public.is_member_of(tenant_id) or public.is_admin());

-- Media assets: members manage. Admin all.
create policy media_all on public.media_assets
  for all using (public.is_member_of(tenant_id) or public.is_admin())
  with check (public.is_member_of(tenant_id) or public.is_admin());

-- Subscriptions: members read, admin all. Writes via service role (webhooks).
create policy subs_read on public.subscriptions
  for select using (public.is_member_of(tenant_id) or public.is_admin());

-- Invoices: members read their own, admin all. Writes via admin/service role.
create policy invoices_read on public.invoices
  for select using (public.is_member_of(tenant_id) or public.is_admin());

-- Hardware orders: members manage their own. Admin all.
create policy hw_all on public.hardware_orders
  for all using (public.is_member_of(tenant_id) or public.is_admin())
  with check (public.is_member_of(tenant_id) or public.is_admin());

-- Tablets: fleet is ours. Admin manages all. A member may read the tablet assigned to their tenant.
create policy tablets_admin_all on public.tablets
  for all using (public.is_admin())
  with check (public.is_admin());
create policy tablets_member_read on public.tablets
  for select using (public.is_member_of(tenant_id) or public.is_admin());

-- Analytics: members read their own, admin all. Inserts via service role.
create policy analytics_read on public.analytics_events
  for select using (public.is_member_of(tenant_id) or public.is_admin());

-- Daily rollups: members read their own, admin all. Writes via service role nightly job.
create policy analytics_daily_read on public.analytics_daily
  for select using (public.is_member_of(tenant_id) or public.is_admin());

-- Short links: members read their own, admin all. Redirect route reads/increments via service role.
create policy short_links_read on public.short_links
  for select using (public.is_member_of(tenant_id) or public.is_admin());
