-- Atomic scan counter. short_links.scans was incremented read-modify-write in JS, so
-- concurrent QR/NFC/review scans lost increments. This does it in one statement.
-- SECURITY DEFINER + locked down: only the service role (the tracked-redirect routes) calls it.
create or replace function public.bump_scan(p_id uuid)
returns void
language sql
security definer
set search_path = public as $$
  update public.short_links set scans = coalesce(scans, 0) + 1 where id = p_id;
$$;

revoke execute on function public.bump_scan(uuid) from public, anon, authenticated;
grant execute on function public.bump_scan(uuid) to service_role;
