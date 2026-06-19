-- Analytics rollup + prune (architecture §17). Aggregates a single Aruba-calendar day
-- of raw events into analytics_daily so dashboards stay fast, then prunes old raw rows.
-- The day boundary is America/Aruba midnight, not UTC, so evening service counts on the
-- right day. Called nightly by the service role from /api/cron/analytics-rollup.

create or replace function public.rollup_analytics_day(target_day date)
returns void
language plpgsql
security definer
set search_path = public as $$
declare
  v_start timestamptz := (target_day::timestamp) at time zone 'America/Aruba';
  v_end   timestamptz := ((target_day + 1)::timestamp) at time zone 'America/Aruba';
begin
  insert into public.analytics_daily (
    tenant_id, day, page_views, unique_sessions, qr_scans, nfc_taps,
    video_plays, directions_clicks, call_clicks, link_clicks
  )
  select
    tenant_id,
    target_day,
    count(*) filter (where event_type = 'page_view'),
    count(distinct session_id) filter (where event_type = 'page_view'),
    count(*) filter (where event_type = 'qr_scan'),
    count(*) filter (where event_type = 'nfc_tap'),
    count(*) filter (where event_type = 'video_play'),
    count(*) filter (where event_type = 'directions_click'),
    count(*) filter (where event_type = 'call_click'),
    count(*) filter (where event_type = 'link_click')
  from public.analytics_events
  where created_at >= v_start and created_at < v_end
  group by tenant_id
  on conflict (tenant_id, day) do update set
    page_views        = excluded.page_views,
    unique_sessions   = excluded.unique_sessions,
    qr_scans          = excluded.qr_scans,
    nfc_taps          = excluded.nfc_taps,
    video_plays       = excluded.video_plays,
    directions_clicks = excluded.directions_clicks,
    call_clicks       = excluded.call_clicks,
    link_clicks       = excluded.link_clicks;
end $$;

create or replace function public.prune_analytics(keep_days int default 30)
returns void
language plpgsql
security definer
set search_path = public as $$
begin
  delete from public.analytics_events
  where created_at < now() - make_interval(days => keep_days);
end $$;
