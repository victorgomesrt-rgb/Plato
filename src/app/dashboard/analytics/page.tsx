import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { resolveDashboard } from "@/lib/dashboard-context";
import { ViewsPlaysTrend } from "@/components/charts";
import { DashboardHeader } from "../dashboard-header";
import { ExportButton } from "./export-button";

export const metadata: Metadata = { title: "Insights", robots: { index: false } };

const arubaStartUTC = (ymd: string) => `${ymd}T04:00:00.000Z`;
const ymd = (d: Date) => d.toISOString().slice(0, 10);
function addDays(s: string, n: number) { const d = new Date(`${s}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return ymd(d); }
const shortDay = (s: string) => new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(`${s}T00:00:00Z`));

type Daily = { day: string; page_views: number; video_plays: number; qr_scans: number; nfc_taps: number; directions_clicks: number; call_clicks: number };
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const { days } = await searchParams;
  const N = [7, 30, 90].includes(Number(days)) ? Number(days) : 30;

  const res = await resolveDashboard();
  if (res.state === "redirect") redirect("/login");
  if (res.state === "no_tenant") {
    return (
      <main className="mx-auto w-full max-w-5xl px-5 py-8 lg:px-8">
        <h1 className="font-display text-2xl font-bold text-ink">Insights</h1>
        <p className="mt-4 rounded-card border border-line bg-surface p-6 text-muted">No views yet. Share your link or place your QR to get started.</p>
      </main>
    );
  }
  const { db, tenantId } = res.ctx;
  const tenant = ((await db.from("tenants").select("slug").eq("id", tenantId).maybeSingle()).data ?? { slug: "" }) as { slug: string };

  const todayStr = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Aruba" }).format(new Date());
  const since = addDays(todayStr, -(N - 1));

  const [{ data: daily }, { data: todayEvents }, { data: playEvents }, { data: menuItems }] = await Promise.all([
    db.from("analytics_daily").select("day, page_views, video_plays, qr_scans, nfc_taps, directions_clicks, call_clicks").eq("tenant_id", tenantId).gte("day", since).order("day").returns<Daily[]>(),
    db.from("analytics_events").select("event_type").eq("tenant_id", tenantId).gte("created_at", arubaStartUTC(todayStr)),
    db.from("analytics_events").select("item_id").eq("tenant_id", tenantId).eq("event_type", "video_play").not("item_id", "is", null).gte("created_at", arubaStartUTC(since)),
    db.from("menu_items").select("id, name, image_url").eq("tenant_id", tenantId),
  ]);

  const te = todayEvents ?? [];
  const live = (t: string) => te.filter((e) => e.event_type === t).length;
  const rows = daily ?? [];
  const byDay = new Map(rows.map((r) => [r.day, r]));

  // Trend (views + plays per day), adding today's live counts to today.
  const series = Array.from({ length: N }, (_, i) => {
    const d = addDays(since, i);
    const r = byDay.get(d);
    const isToday = d === todayStr;
    return {
      label: shortDay(d),
      views: Number(r?.page_views ?? 0) + (isToday ? live("page_view") : 0),
      plays: Number(r?.video_plays ?? 0) + (isToday ? live("video_play") : 0),
    };
  });
  const totalViews = series.reduce((a, s) => a + s.views, 0);
  const totalPlays = series.reduce((a, s) => a + s.plays, 0);

  // Busiest days: share of views by weekday, normalized to the busiest = 100%.
  const wd = Array(7).fill(0);
  for (const r of rows) wd[new Date(`${r.day}T00:00:00Z`).getUTCDay()] += Number(r.page_views || 0);
  const wdMax = Math.max(1, ...wd);
  const busiest = [1, 2, 3, 4, 5, 6, 0].map((d) => ({ label: WEEKDAYS[d], pct: Math.round((wd[d] / wdMax) * 100), peak: wd[d] === wdMax }));

  // Dishes by video plays.
  const meta = new Map((menuItems ?? []).map((m) => [m.id, { name: m.name, img: m.image_url as string | null }]));
  const plays = new Map<string, number>();
  for (const e of playEvents ?? []) { const id = (e as { item_id: string }).item_id; plays.set(id, (plays.get(id) ?? 0) + 1); }
  const dishes = [...plays.entries()].filter(([id]) => meta.has(id)).map(([id, n]) => ({ name: meta.get(id)!.name, img: meta.get(id)!.img, plays: n })).sort((a, b) => b.plays - a.plays).slice(0, 6);
  const dishMax = Math.max(1, ...dishes.map((d) => d.plays));

  const csvRows = series.map((s, i) => { const d = addDays(since, i); const r = byDay.get(d); return { day: d, views: s.views, plays: s.plays, qr: Number(r?.qr_scans ?? 0), nfc: Number(r?.nfc_taps ?? 0), directions: Number(r?.directions_clicks ?? 0), calls: Number(r?.call_clicks ?? 0) }; });

  return (
    <main className="mx-auto max-w-5xl px-5 py-6 lg:px-8 lg:py-8">
      <DashboardHeader title="Insights" subtitle="Views, plays, scans and audience" slug={tenant.slug} />

      <div className="mt-5 flex items-center justify-between gap-3">
        <div className="flex gap-2 text-sm">
          {[7, 30, 90].map((d) => (
            <Link key={d} href={`/dashboard/analytics?days=${d}`} className={`rounded-full px-3 py-1 font-medium ${d === N ? "bg-accent text-white" : "border border-line bg-surface text-ink hover:border-ink/20"}`}>{d} days</Link>
          ))}
        </div>
        <ExportButton rows={csvRows} filename={`plato-insights-${N}d.csv`} />
      </div>

      <section className="mt-4 rounded-card border border-line bg-surface p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-base font-semibold text-ink">Views &amp; video plays over time</h2>
            <p className="text-xs text-muted">Last {N} days</p>
          </div>
          <div className="flex gap-6 text-right">
            <div><p className="text-xs text-muted">Views</p><p className="font-display text-xl font-bold text-ink">{totalViews.toLocaleString()}</p></div>
            <div><p className="text-xs text-muted">Plays</p><p className="font-display text-xl font-bold text-accent">{totalPlays.toLocaleString()}</p></div>
          </div>
        </div>
        <div className="mt-3"><ViewsPlaysTrend data={series} height={340} /></div>
        <div className="mt-2 flex gap-5 text-sm text-muted">
          <span className="flex items-center gap-2"><span className="h-0.5 w-5 rounded bg-ink" />Menu views</span>
          <span className="flex items-center gap-2"><span className="h-0.5 w-5 rounded bg-accent" />Video plays</span>
        </div>
      </section>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <section className="rounded-card border border-line bg-surface p-5">
          <h2 className="font-display text-base font-semibold text-ink">Dishes by video plays</h2>
          <div className="mt-4 space-y-3">
            {dishes.length === 0 ? (
              <p className="text-sm text-muted">No video plays yet in this range.</p>
            ) : dishes.map((d) => (
              <div key={d.name} className="flex items-center gap-3">
                <span className="h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-line">
                  {d.img && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={d.img} alt="" className="h-full w-full object-cover" />
                  )}
                </span>
                <span className="w-28 shrink-0 truncate text-sm font-medium text-ink">{d.name}</span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-line">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${(d.plays / dishMax) * 100}%` }} />
                </div>
                <span className="w-14 shrink-0 text-right text-sm font-semibold text-ink">{d.plays.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-card border border-line bg-surface p-5">
          <h2 className="font-display text-base font-semibold text-ink">Busiest days</h2>
          <div className="mt-6 flex h-48 items-end justify-between gap-2">
            {busiest.map((b) => (
              <div key={b.label} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                <span className="text-xs font-medium text-muted">{b.pct}%</span>
                <div className={`w-full rounded-t-lg ${b.peak ? "bg-accent" : "bg-line"}`} style={{ height: `${Math.max(4, b.pct)}%` }} />
                <span className="text-xs text-muted">{b.label}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
