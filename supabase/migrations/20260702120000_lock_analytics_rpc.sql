-- Lock down the analytics maintenance functions.
-- rollup_analytics_day() and prune_analytics() are SECURITY DEFINER and, via Postgres's
-- default PUBLIC EXECUTE grant, were callable by the anon/authenticated roles over
-- PostgREST rpc. That let anyone with the public anon key run
--   POST /rest/v1/rpc/prune_analytics  {"keep_days": 0}
-- and irreversibly delete every tenant's analytics_events. Only the nightly cron
-- (service role, in /api/cron/analytics-rollup) ever calls these.
revoke execute on function public.prune_analytics(int) from public, anon, authenticated;
revoke execute on function public.rollup_analytics_day(date) from public, anon, authenticated;

grant execute on function public.prune_analytics(int) to service_role;
grant execute on function public.rollup_analytics_day(date) to service_role;
