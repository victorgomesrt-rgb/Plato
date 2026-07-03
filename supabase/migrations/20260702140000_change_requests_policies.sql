-- Split the change_requests `for all` policy. A member could previously DELETE their own
-- requests or flip status to 'done' directly via the anon client, bypassing the Plato
-- team's tracking. Members may now insert, read, and update only to 'open'/'in_progress'
-- (so respondToRequest still works); only admins may set 'done' or delete.
drop policy if exists cr_all on public.change_requests;

create policy cr_select on public.change_requests
  for select using (public.is_member_of(tenant_id) or public.is_admin());

create policy cr_insert on public.change_requests
  for insert with check (public.is_member_of(tenant_id) or public.is_admin());

create policy cr_update on public.change_requests
  for update using (public.is_member_of(tenant_id) or public.is_admin())
  with check (
    public.is_admin()
    or (public.is_member_of(tenant_id) and status in ('open', 'in_progress'))
  );

create policy cr_delete on public.change_requests
  for delete using (public.is_admin());
