-- Pre-launch bug-hunt hardening (2026-08-06).
--
-- (M1 + L2) Extend guard_tenant_cols() so a tenant MEMBER can't write Plato-managed
-- columns via a raw PostgREST PATCH (tenants_update RLS allows members to update their own
-- row). Adds:
--   * previous_slug — used by /[slug] to 308-redirect; writable → an owner could squat any
--     unclaimed slug onto their own menu.
--   * base_currency, fx_rate, dual_currency — the currency peg/toggle (Plato-managed).
--   * trial_ends_at — billing.
-- Keeps the existing service-role bypass (auth.uid() is null) and every previously-guarded
-- column. Owner-editable columns (accent_color, template, description, address, phone,
-- whatsapp, lat, lng, links, hours, logo_url, cover_url) are intentionally NOT guarded.
create or replace function public.guard_tenant_cols()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    if new.plan is distinct from old.plan
       or new.status is distinct from old.status
       or new.published_at is distinct from old.published_at
       or new.custom_domain is distinct from old.custom_domain
       or new.slug is distinct from old.slug
       or new.previous_slug is distinct from old.previous_slug
       or new.base_currency is distinct from old.base_currency
       or new.fx_rate is distinct from old.fx_rate
       or new.dual_currency is distinct from old.dual_currency
       or new.trial_ends_at is distinct from old.trial_ends_at
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

-- (L3) A member must not reopen or edit a change_request that is already 'done'. The
-- cr_update RLS WITH CHECK only constrains the NEW status (it can't see OLD), so a raw
-- PATCH could flip status 'done' -> 'in_progress' and rewrite the message. Enforce with a
-- trigger that can see OLD. Admins (is_admin) and the service role (auth.uid() null) bypass.
create or replace function public.guard_change_request_done()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.is_admin() and old.status = 'done' then
    raise exception 'This request is closed';
  end if;
  return new;
end $$;

drop trigger if exists guard_change_request_done on public.change_requests;
create trigger guard_change_request_done
  before update on public.change_requests
  for each row execute function public.guard_change_request_done();
