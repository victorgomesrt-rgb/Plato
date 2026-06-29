-- Standalone Review Card clients: a tenant that exists only for a Review Card — no menu,
-- no owner login, never published. `review_only` is admin-managed, so it joins the
-- privileged-column guard. NOTE: keep `auth.uid() is not null and` (the service-role
-- bypass from 20260618120500) or admin/service writes to these columns break.
alter table public.tenants add column if not exists review_only boolean not null default false;

create or replace function public.guard_tenant_cols()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    if new.plan is distinct from old.plan
       or new.status is distinct from old.status
       or new.published_at is distinct from old.published_at
       or new.custom_domain is distinct from old.custom_domain
       or new.slug is distinct from old.slug
       or new.review_url is distinct from old.review_url
       or new.review_active is distinct from old.review_active
       or new.review_paid_through is distinct from old.review_paid_through
       or new.review_only is distinct from old.review_only then
      raise exception 'These fields are managed by Plato';
    end if;
  end if;
  new.updated_at = now();
  return new;
end $$;
