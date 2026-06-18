-- Fix: column guards must NOT block the service role.
-- Postgres triggers fire for ALL roles (the service role bypasses RLS, not triggers).
-- The guards exist to stop a logged-in MEMBER (auth.uid() present, not admin) from
-- escalating privileged columns. The service role has no auth session (auth.uid() is
-- null) and is how admin actions / webhooks legitimately write plan/status/published_at.
-- Anonymous clients can never reach these triggers because RLS already blocks them from
-- updating tenant/profile rows.

create or replace function public.guard_tenant_cols()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.is_admin() then
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

create or replace function public.guard_profile_cols()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.is_admin()
     and new.is_platform_admin is distinct from old.is_platform_admin then
    raise exception 'Not allowed';
  end if;
  return new;
end $$;
