-- Plato trigger guards + housekeeping triggers — see docs/architecture.md §6, §21
-- Postgres RLS is row-level, not column-level, so privileged columns are protected here.
-- plan/status/published_at are written only by the service role (admin actions, webhooks),
-- which bypasses these guards.

-- Block non-admins from changing privileged tenant columns
create or replace function public.guard_tenant_cols()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    if new.plan is distinct from old.plan
       or new.status is distinct from old.status
       or new.published_at is distinct from old.published_at
       or new.custom_domain is distinct from old.custom_domain
       or new.slug is distinct from old.slug then
      raise exception 'These fields are managed by Plato';
    end if;
  end if;
  new.updated_at = now();
  return new;
end $$;

create trigger trg_guard_tenant before update on public.tenants
  for each row execute function public.guard_tenant_cols();

-- Block non-admins from granting themselves admin
create or replace function public.guard_profile_cols()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() and new.is_platform_admin is distinct from old.is_platform_admin then
    raise exception 'Not allowed';
  end if;
  return new;
end $$;

create trigger trg_guard_profile before update on public.profiles
  for each row execute function public.guard_profile_cols();

-- updated_at on menu_items (tenants handled inside guard_tenant_cols above)
create trigger trg_items_updated_at before update on public.menu_items
  for each row execute function public.set_updated_at();

-- Create a profile automatically when an auth user is created
create trigger trg_on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();
