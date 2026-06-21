import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Eye, Video, QrCode, Navigation, Phone, ArrowUpRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AreaTrend, Donut } from "@/components/charts";

export const metadata: Metadata = { title: "Dashboard", robots: { index: false } };

const ymd = (d: Date) => d.toISOString().slice(0, 10);
const arubaStartUTC = (s: string) => `${s}T04:00:00.000Z`;
function addDays(s: string, n: number) {
  const d = new Date(`${s}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return ymd(d);
}
const shortDay = (s: string) =>
  new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(`${s}T00:00:00Z`));

type Daily = {
  day: string; page_views: number; unique_sessions: number; qr_scans: number; nfc_taps: number;
  video_plays: number; directions_clicks: number; call_clicks: number; link_clicks: number;
};

function Delta({ pct }: { pct: number }) {
  const up = pct >= 0;
  return (
    <span className={`text-xs font-semibold ${up ? "text-emerald-600" : "text-accent-deep"}`}>
      {up ? "▲" : "▼"} {Math.abs(pct)}% <span className="font-normal text-muted">vs prev</span>
    </span>
  );
}

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const { days } = await searchParams;
  const N = [7, 30, 90].includes(Number(days)) ? Number(days) : 30;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: mem } = await supabase
    .from("tenant_members")
    .select("tenant_id, tenants(name, slug)")
    .limit(1)
    .maybeSingle();

  if (!mem) {
    return (
      <main className="mx-auto max-w-5xl px-5 py-10 lg:px-8">
        <h1 className="font-display text-2xl font-semibold text-ink">Dashboard</h1>
        <p className="mt-4 rounded-card border border-line bg-surface p-6 text-muted">
          We&apos;re building your menu from your shoot. It goes live shortly — you&apos;ll see your numbers here.
        </p>
      </main>
    );
  }

  const tenantId = mem.tenant_id as string;
  const tn = mem.tenants as unknown as { name: string; slug: string };
  const todayStr = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Aruba" }).format(new Date());
  const curStart = addDays(todayStr, -(N - 1));
  const prevStart = addDays(todayStr, -(2 * N - 1));

  const [{ data: daily }, { data: todayEvents }, { data: itemEvents }, { data: menuItems }] = await Promise.all([
    supabase.from("analytics_daily").select("*").eq("tenant_id", tenantId).gte("day", prevStart).order("day").returns<Daily[]>(),
    supabase.from("analytics_events").select("event_type, session_id").eq("tenant_id", tenantId).gte("created_at", arubaStartUTC(todayStr)),
    supabase.from("analytics_events").select("item_id, event_type").eq("tenant_id", tenantId).not("item_id", "is", null).in("event_type", ["item_view", "video_play"]).gte("created_at", arubaStartUTC(curStart)),
    supabase.from("menu_items").select("id, name").eq("tenant_id", tenantId),
  ]);

  const rows = daily ?? [];
  const curRows = rows.filter((r) => r.day >= curStart);
  const prevRows = rows.filter((r) => r.day < curStart && r.day >= prevStart);
  const te = todayEvents ?? [];
  const live = (t: string) => te.filter((e) => e.event_type === t).length;
  const sumK = (rs: Daily[], k: keyof Daily) => rs.reduce((a, r) => a + Number(r[k] || 0), 0);
  const pct = (cur: number, prev: number) => (prev > 0 ? Math.round(((cur - prev) / prev) * 100) : cur > 0 ? 100 : 0);

  const metrics = [
    { label: "Menu views", icon: Eye, k: "page_views" as const, ev: "page_view" },
    { label: "Video plays", icon: Video, k: "video_plays" as const, ev: "video_play" },
    { label: "QR scans", icon: QrCode, k: "qr_scans" as const, ev: "qr_scan" },
    { label: "Directions", icon: Navigation, k: "directions_clicks" as const, ev: "directions_click" },
    { label: "Calls", icon: Phone, k: "call_clicks" as const, ev: "call_click" },
  ].map((m) => {
    const cur = sumK(curRows, m.k) + live(m.ev);
    const prev = sumK(prevRows, m.k);
    return { label: m.label, icon: m.icon, value: cur, pct: pct(cur, prev) };
  });

  // Trend (menu views per day in the current window).
  const byDay = new Map(curRows.map((r) => [r.day, r.page_views]));
  const series = Array.from({ length: N }, (_, i) => {
    const d = addDays(curStart, i);
    const v = Number(byDay.get(d) ?? 0) + (d === todayStr ? live("page_view") : 0);
    return { label: shortDay(d), value: v };
  });
  const viewsTotal = metrics[0].value;

  // How diners arrive.
  const qr = sumK(curRows, "qr_scans") + live("qr_scan");
  const nfc = sumK(curRows, "nfc_taps") + live("nfc_tap");
  const direct = Math.max(0, viewsTotal - qr - nfc);
  const arrive = [
    { name: "QR scan", value: qr, color: "#FB6A1A" },
    { name: "NFC tap", value: nfc, color: "#0E5B5B" },
    { name: "Direct link", value: direct, color: "#F4B740" },
  ];

  // Most-played dishes.
  const names = new Map((menuItems ?? []).map((m) => [m.id, m.name]));
  const plays = new Map<string, number>();
  for (const e of itemEvents ?? []) {
    if (e.event_type !== "video_play" || !e.item_id) continue;
    plays.set(e.item_id, (plays.get(e.item_id) ?? 0) + 1);
  }
  const topDishes = [...plays.entries()].map(([id, n]) => ({ name: names.get(id) ?? "—", plays: n }))
    .sort((a, b) => b.plays - a.plays).slice(0, 4);
  const maxPlays = Math.max(1, ...topDishes.map((d) => d.plays));
  const monthName = new Intl.DateTimeFormat("en-US", { month: "long", timeZone: "America/Aruba" }).format(new Date());

  return (
    <main className="mx-auto max-w-5xl px-5 py-6 lg:px-8 lg:py-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Dashboard</h1>
          <p className="text-sm text-muted">How {tn.name}&apos;s menu is performing</p>
        </div>
        <div className="flex gap-2">
          <a href={`/${tn.slug}`} target="_blank" rel="noopener noreferrer" className="rounded-btn border border-line bg-surface px-3 py-2 text-sm font-medium text-ink hover:border-ink/20">View live menu</a>
          <a href={`mailto:hello@platodigital.io?subject=Change%20request%20—%20${encodeURIComponent(tn.name)}`} className="rounded-btn bg-accent px-3 py-2 text-sm font-medium text-white">Request a change</a>
        </div>
      </div>

      <div className="mt-5 flex gap-1 text-sm">
        {[7, 30, 90].map((d) => (
          <Link key={d} href={`/dashboard?days=${d}`} className={`rounded-full px-3 py-1 font-medium ${d === N ? "bg-accent text-white" : "bg-line text-ink"}`}>
            {d} days
          </Link>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {metrics.map((m) => (
          <div key={m.label} className="rounded-card border border-line bg-surface p-4">
            <div className="flex items-center justify-between text-muted">
              <span className="text-xs">{m.label}</span>
              <m.icon className="h-4 w-4 text-accent" />
            </div>
            <p className="mt-2 font-display text-2xl font-bold text-ink">{m.value.toLocaleString()}</p>
            <div className="mt-1"><Delta pct={m.pct} /></div>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <section className="rounded-card border border-line bg-surface p-5">
          <div className="flex items-baseline justify-between">
            <div>
              <h2 className="font-display text-base font-semibold text-ink">Menu views</h2>
              <p className="text-xs text-muted">Last {N} days</p>
            </div>
            <p className="font-display text-xl font-bold text-ink">{viewsTotal.toLocaleString()}</p>
          </div>
          <div className="mt-3"><AreaTrend data={series} gradId="views" height={210} /></div>
        </section>

        <section className="rounded-card border border-line bg-surface p-5">
          <h2 className="font-display text-base font-semibold text-ink">How diners arrive</h2>
          <p className="text-xs text-muted">QR · NFC · direct</p>
          <div className="mt-4"><Donut data={arrive} centerValue={(qr + nfc).toLocaleString()} centerLabel="scans" height={150} /></div>
        </section>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <section className="rounded-card border border-line bg-surface p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-ink">Most-played dishes</h2>
            <Link href="/dashboard/analytics" className="text-sm font-medium text-accent">All insights →</Link>
          </div>
          <div className="mt-4 space-y-3">
            {topDishes.length === 0 ? (
              <p className="text-sm text-muted">No dish plays yet in this range.</p>
            ) : topDishes.map((d) => (
              <div key={d.name}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-ink">{d.name}</span>
                  <span className="text-muted">{d.plays.toLocaleString()} plays</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-line">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${(d.plays / maxPlays) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-card bg-ink p-5 text-white">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-accent">Monthly recap</p>
          <h2 className="mt-2 font-display text-lg font-semibold">Your {monthName} numbers</h2>
          <ul className="mt-3 space-y-2 text-sm text-white/80">
            <li>✓ {viewsTotal.toLocaleString()} menu views in the last {N} days</li>
            {topDishes[0] && <li>✓ {topDishes[0].name} was your most-played dish</li>}
            <li>✓ {(qr + nfc).toLocaleString()} QR &amp; NFC scans</li>
          </ul>
          <Link href="/dashboard/analytics" className="mt-4 inline-flex items-center gap-1 rounded-btn bg-white px-3 py-2 text-sm font-semibold text-ink">
            View full report <ArrowUpRight className="h-4 w-4" />
          </Link>
        </section>
      </div>
    </main>
  );
}
