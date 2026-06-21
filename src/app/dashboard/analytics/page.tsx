import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Analytics", robots: { index: false } };

// Aruba midnight for a given YYYY-MM-DD, in UTC (AST is UTC-4, no DST).
const arubaStartUTC = (ymd: string) => `${ymd}T04:00:00.000Z`;
const ymd = (d: Date) => d.toISOString().slice(0, 10);
function addDays(s: string, n: number) {
  const d = new Date(`${s}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return ymd(d);
}

type Daily = {
  day: string;
  page_views: number;
  unique_sessions: number;
  qr_scans: number;
  nfc_taps: number;
  video_plays: number;
  directions_clicks: number;
  call_clicks: number;
  link_clicks: number;
};

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const { days } = await searchParams;
  const N = [7, 30, 90].includes(Number(days)) ? Number(days) : 30;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: mem } = await supabase
    .from("tenant_members")
    .select("tenant_id, tenants(name)")
    .limit(1)
    .maybeSingle();
  if (!mem) {
    return (
      <main className="mx-auto w-full max-w-2xl px-6 py-10">
        <h1 className="font-display text-2xl font-semibold text-ink">Analytics</h1>
        <p className="mt-3 rounded-card border border-line p-4 text-muted">
          No views yet. Share your link or place your QR to get started.
        </p>
      </main>
    );
  }
  const tenantId = mem.tenant_id;
  const tenantName = (mem.tenants as unknown as { name: string } | null)?.name ?? "";

  const todayStr = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Aruba" }).format(new Date());
  const sinceStr = addDays(todayStr, -(N - 1));

  const [{ data: daily }, { data: todayEvents }, { data: itemEvents }, { data: menuItems }] =
    await Promise.all([
      supabase
        .from("analytics_daily")
        .select("*")
        .eq("tenant_id", tenantId)
        .gte("day", sinceStr)
        .order("day")
        .returns<Daily[]>(),
      supabase
        .from("analytics_events")
        .select("event_type, session_id")
        .eq("tenant_id", tenantId)
        .gte("created_at", arubaStartUTC(todayStr)),
      supabase
        .from("analytics_events")
        .select("item_id, event_type")
        .eq("tenant_id", tenantId)
        .not("item_id", "is", null)
        .in("event_type", ["item_view", "video_play"])
        .gte("created_at", arubaStartUTC(sinceStr)),
      supabase.from("menu_items").select("id, name").eq("tenant_id", tenantId),
    ]);

  // Today's live counts (not yet rolled up).
  const te = todayEvents ?? [];
  const liveCount = (type: string) => te.filter((e) => e.event_type === type).length;
  const liveSessions = new Set(
    te.filter((e) => e.event_type === "page_view").map((e) => e.session_id)
  ).size;

  const rolled = daily ?? [];
  const sum = (k: keyof Daily) => rolled.reduce((a, r) => a + Number(r[k] || 0), 0);

  const cards = [
    { label: "Page views", value: sum("page_views") + liveCount("page_view") },
    { label: "Unique sessions", value: sum("unique_sessions") + liveSessions },
    { label: "QR scans", value: sum("qr_scans") + liveCount("qr_scan") },
    { label: "NFC taps", value: sum("nfc_taps") + liveCount("nfc_tap") },
    { label: "Directions", value: sum("directions_clicks") + liveCount("directions_click") },
    { label: "Calls", value: sum("call_clicks") + liveCount("call_click") },
  ];

  // Trend (page views per day across the range).
  const byDay = new Map(rolled.map((r) => [r.day, r.page_views]));
  const series = Array.from({ length: N }, (_, i) => {
    const d = addDays(sinceStr, i);
    const rolledV = Number(byDay.get(d) ?? 0);
    return { day: d, value: d === todayStr ? rolledV + liveCount("page_view") : rolledV };
  });
  const max = Math.max(1, ...series.map((s) => s.value));

  // Top dishes by views (+ plays).
  const names = new Map((menuItems ?? []).map((m) => [m.id, m.name]));
  const stat = new Map<string, { views: number; plays: number }>();
  for (const e of itemEvents ?? []) {
    if (!e.item_id) continue;
    const s = stat.get(e.item_id) ?? { views: 0, plays: 0 };
    if (e.event_type === "item_view") s.views++;
    else s.plays++;
    stat.set(e.item_id, s);
  }
  const topDishes = [...stat.entries()]
    .map(([id, s]) => ({ name: names.get(id) ?? "-", ...s }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 5);

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10">
      <Link href="/dashboard" className="text-sm text-muted hover:text-ink">
        ← Dashboard
      </Link>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold text-ink">Analytics · {tenantName}</h1>
        <div className="flex gap-1 text-sm">
          {[7, 30, 90].map((d) => (
            <Link
              key={d}
              href={`/dashboard/analytics?days=${d}`}
              className={`rounded-full px-3 py-1 font-medium ${d === N ? "bg-accent text-white" : "bg-line text-ink"}`}
            >
              {d}d
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-card border border-line p-4">
            <p className="text-2xl font-semibold text-ink">{c.value}</p>
            <p className="text-sm text-muted">{c.label}</p>
          </div>
        ))}
      </div>

      <h2 className="mt-8 font-display text-lg font-semibold text-ink">Page views</h2>
      <div className="mt-3 flex h-32 items-end gap-0.5 rounded-card border border-line p-3">
        {series.map((s) => (
          <div
            key={s.day}
            title={`${s.day}: ${s.value}`}
            className="flex-1 rounded-t bg-accent/80"
            style={{ height: `${(s.value / max) * 100}%`, minHeight: s.value ? 2 : 0 }}
          />
        ))}
      </div>

      <h2 className="mt-8 font-display text-lg font-semibold text-ink">Top dishes</h2>
      <div className="mt-3 space-y-2">
        {topDishes.length === 0 ? (
          <p className="rounded-card border border-line p-4 text-sm text-muted">
            No dish views yet in this range.
          </p>
        ) : (
          topDishes.map((d) => (
            <div key={d.name} className="flex items-center justify-between rounded-card border border-line p-3 text-sm">
              <span className="font-medium text-ink">{d.name}</span>
              <span className="text-muted">
                {d.views} views · {d.plays} plays
              </span>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
