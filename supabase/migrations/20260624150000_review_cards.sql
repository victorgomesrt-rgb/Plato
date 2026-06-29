-- Review Cards (v1): a payment-gated QR/NFC redirect to a restaurant's Google review page.
-- The /r/<code> route (short_links kind='review') redirects to tenants.review_url only
-- while the card is active and paid through today (AST); otherwise a neutral paused page.
-- Admin-managed add-on. Reuses short_links + analytics_events. See docs (review cards).

alter table public.tenants add column if not exists review_url text;
alter table public.tenants add column if not exists review_active boolean not null default false;
alter table public.tenants add column if not exists review_paid_through date;

-- The gate must be Plato-managed: an owner must not set their own review URL or extend
-- their own paid-through window (that would be free service). Re-create the column guard
-- with the review_* columns added to the privileged set.
-- NOTE the `auth.uid() is not null` condition: it preserves the service-role bypass from
-- 20260618120500_fix_guard_service_role.sql (service role has no auth session). Omitting it
-- would block admin actions (setTenantStatus/changeTenantPlan/markPaid) — do not drop it.
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
       or new.review_paid_through is distinct from old.review_paid_through then
      raise exception 'These fields are managed by Plato';
    end if;
  end if;
  new.updated_at = now();
  return new;
end $$;
