import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Nightly rollup (architecture §17). Aggregates yesterday's Aruba-calendar day into
// analytics_daily, then prunes raw events older than 30 days. Secret-protected.
// Pass ?day=YYYY-MM-DD to roll up a specific day (used for testing).
function yesterdayAruba(): string {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Aruba" }).format(new Date());
  const d = new Date(`${today}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  const qs = request.nextUrl.searchParams.get("secret");
  if (!secret || (auth !== `Bearer ${secret}` && qs !== secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const day = request.nextUrl.searchParams.get("day") ?? yesterdayAruba();
  const svc = createAdminClient();
  const { error: rollupErr } = await svc.rpc("rollup_analytics_day", { target_day: day });
  const { error: pruneErr } = await svc.rpc("prune_analytics", { keep_days: 30 });
  if (rollupErr || pruneErr) {
    return NextResponse.json({ error: rollupErr?.message ?? pruneErr?.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, day });
}
