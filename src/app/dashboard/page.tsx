import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Eye, Video, QrCode, Navigation, Phone, ArrowUpRight } from "lucide-react";
import { resolveDashboard } from "@/lib/dashboard-context";
import { AreaTrend, Donut } from "@/components/charts";
import { DashboardHeader } from "./dashboard-header";
import { OwnerOnboarding } from "./onboarding";

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

  const res = await resolveDashboard();
  if (res.state === "redirect") redirect("/login");

  if (res.state === "no_tenant") {
    return (
      <main className="mx-auto max-w-5xl px-5 py-10 lg:px-8">
        <h1 className="font-display text-2xl font-semibold text-ink">Dashboard</h1>
        <p className="mt-4 rounded-card border border-line bg-surface p-6 text-muted">
          We&apos;re building your menu from your shoot. It goes live shortly, you&apos;ll see your numbers here.
        </p>
      </main>
    );
  }

  const { db, tenantId } = res.ctx;
  const tn = ((await db.from("tenants").select("name, slug, published_at, logo_url, cover_url, phone, whatsapp, hours").eq("id", tenantId).maybeSingle()).data ?? { name: "Your restaurant", slug: "" }) as {
    name: string; slug: string; published_at?: string | null; logo_url?: string | null; cover_url?: string | null; phone?: string | null; whatsapp?: string | null; hours?: Record<string, unknown> | null;
  };
  const todayStr = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Aruba" }).format(new Date());
  const curStart = addDays(todayStr, -(N - 1));
  const prevStart = addDays(todayStr, -(2 * N - 1));

  const [{ data: daily }, { data: todayEvents }, { data: itemEvents }, { data: menuItems }, { data: shortLinks }] = await Promise.all([
    db.from("analytics_daily").select("*").eq("tenant_id", tenantId).gte("day", prevStart).order("day").returns<Daily[]>(),
    db.from("analytics_events").select("event_type, session_id").eq("tenant_id", tenantId).gte("created_at", arubaStartUTC(todayStr)),
    db.from("analytics_events").select("item_id, event_type").eq("tenant_id", tenantId).not("item_id", "is", null).in("event_type", ["item_view", "video_play"]).gte("created_at", arubaStartUTC(curStart)),
    db.from("menu_items").select("id, name, image_url").eq("tenant_id", tenantId),
    db.from("short_links").select("placement, scans").eq("tenant_id", tenantId).returns<{ placement: string | null; scans: number }[]>(),
  ]);

  const rows = daily ?? [];
  const curRows = rows.filter((r) => r.day >= curStart);
  const prevRows = rows.filter((r) => r.day < curStart && r.day >= prevStart);
  const te = todayEvents ?? [];
  const live = (t: string) => te.filter((e) => e.event_type === t).length;
  const sumK = (rs: Daily[], k: keyof Daily) => rs.reduce((a, r) => a + Number(r[k] || 0), 0);
  const pct = (cur: number, prev: number) => (prev > 0 ? Math.round(((cur - prev) / prev) * 100) : cur > 0 ? 100 : 0);

  const metrics = [
    { label: "Menu views", icon: Eye, k: "page_views" as const, ev: "page_view", fg: "#FB6A1A", bg: "rgba(251,106,26,0.12)" },
    { label: "Video plays", icon: Video, k: "video_plays" as const, ev: "video_play", fg: "#FB6A1A", bg: "rgba(251,106,26,0.12)" },
    { label: "QR scans", icon: QrCode, k: "qr_scans" as const, ev: "qr_scan", fg: "#0E5B5B", bg: "rgba(14,91,91,0.12)" },
    { label: "Directions", icon: Navigation, k: "directions_clicks" as const, ev: "directions_click", fg: "#C99320", bg: "rgba(244,183,64,0.20)" },
    { label: "Calls", icon: Phone, k: "call_clicks" as const, ev: "call_click", fg: "#16110E", bg: "rgba(22,17,14,0.07)" },
  ].map((m) => {
    const cur = sumK(curRows, m.k) + live(m.ev);
    const prev = sumK(prevRows, m.k);
    return { label: m.label, icon: m.icon, value: cur, pct: pct(cur, prev), fg: m.fg, bg: m.bg };
  });

  // Trend (menu views per day in the current window).
  const byDay = new Map(curRows.map((r) => [r.day, r.page_views]));
  const series = Array.from({ length: N }, (_, i) => {
    const d = addDays(curStart, i);
    const v = Number(byDay.get(d) ?? 0) + (d === todayStr ? live("page_view") : 0);
    return { label: shortDay(d), value: v };
  });
  const viewsTotal = metrics[0].value;

  // QR + NFC scans (used in the metrics + monthly recap).
  const qr = sumK(curRows, "qr_scans") + live("qr_scan");
  const nfc = sumK(curRows, "nfc_taps") + live("nfc_tap");

  // Where they scan: the tenant's tracked-link scans grouped by placement (short_links).
  const PLACEMENT_LABEL: Record<string, string> = { table: "Table tent", window: "Window decal", host_stand: "Host stand", business_cards: "Business cards" };
  const PLACEMENT_COLOR: Record<string, string> = { table: "#FB6A1A", window: "#0E5B5B", host_stand: "#F4B740", business_cards: "#CFC8BF" };
  const placeMap = new Map<string, number>();
  for (const l of shortLinks ?? []) {
    const key = l.placement ?? "other";
    placeMap.set(key, (placeMap.get(key) ?? 0) + Number(l.scans ?? 0));
  }
  const scanPlaces = [...placeMap.entries()]
    .map(([p, v]) => ({ name: PLACEMENT_LABEL[p] ?? p, value: v, color: PLACEMENT_COLOR[p] ?? "#CFC8BF" }))
    .sort((a, b) => b.value - a.value);
  const totalScans = scanPlaces.reduce((a, s) => a + s.value, 0);

  // Most-played dishes.
  const itemMap = new Map((menuItems ?? []).map((m) => [m.id, { name: m.name, img: m.image_url as string | null }]));
  const plays = new Map<string, number>();
  for (const e of itemEvents ?? []) {
    if (e.event_type !== "video_play" || !e.item_id) continue;
    plays.set(e.item_id, (plays.get(e.item_id) ?? 0) + 1);
  }
  const topDishes = [...plays.entries()]
    .filter(([id]) => itemMap.has(id)) // drop plays for items that no longer resolve to a named dish
    .map(([id, n]) => { const it = itemMap.get(id)!; return { name: it.name, img: it.img, plays: n }; })
    .sort((a, b) => b.plays - a.plays).slice(0, 4);
  const maxPlays = Math.max(1, ...topDishes.map((d) => d.plays));
  const monthName = new Intl.DateTimeFormat("en-US", { month: "long", timeZone: "America/Aruba" }).format(new Date());

  const onboarding = {
    live: !!tn.published_at,
    branded: !!(tn.logo_url && tn.cover_url),
    contact: !!((tn.phone || tn.whatsapp) && tn.hours),
    firstView: metrics[0].value > 0,
  };

  return (
    <main className="mx-auto max-w-5xl px-5 py-6 lg:px-8 lg:py-8">
      <DashboardHeader title="Dashboard" subtitle={`How ${tn.name}'s menu is performing`} slug={tn.slug} />

      <div className="mt-5"><OwnerOnboarding tenantId={tenantId} slug={tn.slug} {...onboarding} /></div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <div className="flex gap-2 text-sm">
          {[7, 30, 90].map((d) => (
            <Link key={d} href={`/dashboard?days=${d}`} className={`rounded-full px-3 py-1 font-medium ${d === N ? "bg-accent text-white" : "border border-line bg-surface text-ink hover:border-ink/20"}`}>
              {d} days
            </Link>
          ))}
        </div>
        <span className="hidden text-sm text-muted sm:block">Updated just now</span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {metrics.map((m) => (
          <div key={m.label} className="rounded-card border border-line bg-surface p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-ink">{m.label}</span>
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg" style={{ background: m.bg }}>
                <m.icon className="h-4 w-4" style={{ color: m.fg }} />
              </span>
            </div>
            <p className="mt-2 font-display text-[26px] font-bold leading-none text-ink">{m.value.toLocaleString()}</p>
            <div className="mt-2"><Delta pct={m.pct} /></div>
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
          <div className="mt-3"><AreaTrend data={series} gradId="views" height={210} endDot /></div>
        </section>

        <section className="rounded-card border border-line bg-surface p-5">
          <h2 className="font-display text-base font-semibold text-ink">Where they scan</h2>
          <p className="text-xs text-muted">QR &amp; NFC by placement</p>
          <div className="mt-4"><Donut data={scanPlaces} centerValue={totalScans.toLocaleString()} centerLabel="scans" height={150} /></div>
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
              <div key={d.name} className="flex items-center gap-3">
                <span className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-line">
                  {d.img && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={d.img} alt="" className="h-full w-full object-cover" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="truncate font-medium text-ink">{d.name}</span>
                    <span className="shrink-0 text-muted">{d.plays.toLocaleString()} plays</span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-line">
                    <div className="h-full rounded-full bg-accent" style={{ width: `${(d.plays / maxPlays) * 100}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="relative overflow-hidden rounded-card bg-ink p-5 text-white" style={{ backgroundImage: "radial-gradient(130% 130% at 100% 100%, rgba(251,106,26,0.22), transparent 55%)" }}>
          <span className="inline-flex rounded-full bg-accent/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-accent">Monthly recap</span>
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
