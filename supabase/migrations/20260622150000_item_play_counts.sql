-- Per-item video-play counts, aggregated in the database.
-- Counting in JS by fetching every event row hits PostgREST's 1000-row cap (so
-- busy dishes under-count) and doesn't scale. This function does the group-by in
-- SQL. It is SECURITY INVOKER, so the analytics_read RLS policy still applies:
-- a member sees only their tenant, an admin/service-role sees all.
create or replace function public.item_play_counts(p_tenant uuid, p_since timestamptz)
returns table(item_id uuid, plays bigint)
language sql
stable
as $$
  select item_id, count(*)::bigint as plays
  from public.analytics_events
  where tenant_id = p_tenant
    and event_type = 'video_play'
    and item_id is not null
    and created_at >= p_since
  group by item_id;
$$;

grant execute on function public.item_play_counts(uuid, timestamptz) to authenticated, service_role;
