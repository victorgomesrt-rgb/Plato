import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Eye, DollarSign, Plus } from "lucide-react";
import { currentAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { planPrice } from "@/lib/plans";
import { AreaTrend, Donut } from "@/components/charts";
import { AdminSearch } from "./search";

export const metadata: Metadata = { title: "Admin · Overview", robots: { index: false } };

const usd = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
const arubaMonth = (d: string) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "America/Aruba", year: "numeric", month: "2-digit" }).format(new Date(d));

type Tenant = { id: string; name: string; slug: string; plan: string; status: string; created_at: string; updated_at: string; published_at: string | null; review_only: boolean | null };
type Inv = { amount: number; paid_at: string | null; tenants: { name: string } | null };

function relTime(ts: string, now: number) {
  const m = Math.floor((now - new Date(ts).getTime()) / 60000);
  if (m < 60) return `${Math.max(1, m)}m`;
  if (m < 1440) return `${Math.floor(m / 60)}h`;
  return `${Math.floor(m / 1440)}d`;
}

export default async function AdminOverviewPage() {
  if (!(await currentAdmin())) notFound();
  const svc = createAdminClient();

  const [{ data: tData }, { data: iData }] = await Promise.all([
    svc.from("tenants").select("id, name, slug, plan, status, created_at, updated_at, published_at, review_only").order("created_at", { ascending: false }).returns<Tenant[]>(),
    svc.from("invoices").select("amount, paid_at, tenants(name)").not("paid_at", "is", null).order("paid_at", { ascending: false }).limit(5).returns<Inv[]>(),
  ]);
  const tenants = tData ?? [];
  // Server render time, read the clock once (pure for the rest of render).
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const nowD = new Date(now);
  const thisMonth = arubaMonth(nowD.toISOString());

  // Review-only clients have no menu plan — exclude them from menu-business metrics
  // (MRR, plan mix, page counts). Their review-card revenue is tracked in Billing.
  const menu = tenants.filter((t) => !t.review_only);
  const active = menu.filter((t) => t.status === "active");
  const mrr = active.reduce((a, t) => a + planPrice(t.plan), 0);
  const pastDue = menu.filter((t) => t.status === "past_due").length;
  const churn = menu.filter((t) => t.status === "canceled" && arubaMonth(t.updated_at) === thisMonth).length;
  const newThis = menu.filter((t) => arubaMonth(t.created_at) === thisMonth).length;

  // MRR trailing 12 months (cumulative by signup, excluding canceled).
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(Date.UTC(nowD.getUTCFullYear(), nowD.getUTCMonth() - (11 - i) + 1, 0));
    return { label: new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" }).format(d), end: d };
  });
  const mrrTrend = months.map((m) => ({
    label: m.label,
    value: menu.filter((t) => new Date(t.created_at) <= m.end && t.status !== "canceled").reduce((a, t) => a + planPrice(t.plan), 0),
  }));
  const last = mrrTrend[11].value, prev = mrrTrend[10].value;
  const momPct = prev > 0 ? Math.round(((last - prev) / prev) * 1000) / 10 : 0;

  const planMix = [
    { name: "Starter", value: active.filter((t) => t.plan === "starter").length, color: "#CFC8BF" },
    { name: "Growth", value: active.filter((t) => t.plan === "growth").length, color: "#0E5B5B" },
    { name: "Premium", value: active.filter((t) => t.plan === "premium").length, color: "#FB6A1A" },
  ];

  const onboarding = menu
    .filter((t) => ["building", "trialing"].includes(t.status))
    .slice(0, 4)
    .map((t) => ({ name: t.name, label: t.status === "building" ? "Building menu" : "Ready to publish", pct: t.status === "building" ? 55 : 90 }));

  type Act = { icon: "pay" | "live"; title: string; sub: string; ts: string };
  const activity: Act[] = [
    ...(iData ?? []).filter((i) => i.paid_at).map((i): Act => ({ icon: "pay", title: `Payment received, ${i.tenants?.name ?? "-"}`, sub: usd(Number(i.amount)), ts: i.paid_at! })),
    ...menu.filter((t) => t.published_at).slice(0, 3).map((t): Act => ({ icon: "live", title: `${t.name} went live`, sub: t.plan, ts: t.published_at! })),
  ].sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime()).slice(0, 6);

  const cards: { label: string; value: string | number; pill?: string; pillGood?: boolean; sub: string }[] = [
    { label: "MRR", value: usd(mrr), pill: `${momPct >= 0 ? "▲" : "▼"} ${Math.abs(momPct)}%`, pillGood: momPct >= 0, sub: "vs last month" },
    { label: "Active tenants", value: active.length, sub: active.length === 1 ? "live page" : "live pages" },
    { label: "Past due", value: pastDue, sub: "needs follow-up" },
    { label: "Churn", value: churn, sub: "this month" },
    { label: "New this month", value: newThis, sub: "provisioned" },
  ];

  return (
    <main className="mx-auto max-w-6xl px-5 py-6 lg:px-8 lg:py-8">
      <div className="flex flex-wrap items-center gap-3">
        <div className="mr-auto">
          <h1 className="font-display text-2xl font-bold text-ink">Overview</h1>
          <p className="text-sm text-muted">Across all {menu.length} menu {menu.length === 1 ? "page" : "pages"}</p>
        </div>
        <AdminSearch tenants={tenants.map((t) => ({ name: t.name, slug: t.slug, plan: t.plan }))} />
        <Link href="/admin/new-client" className="inline-flex shrink-0 items-center gap-1.5 rounded-btn bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-deep">
          <Plus className="h-4 w-4" /> New client
        </Link>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {cards.map((c) => (
          <div key={c.label} className="rounded-card border border-line bg-surface p-4">
            <p className="text-xs text-muted">{c.label}</p>
            <p className="mt-2 font-display text-2xl font-bold text-ink">{c.value}</p>
            <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs">
              {c.pill && (
                <span className={`rounded-full px-1.5 py-0.5 font-semibold ${c.pillGood ? "bg-emerald-100 text-emerald-700" : "bg-accent/10 text-accent-deep"}`}>{c.pill}</span>
              )}
              <span className="text-muted">{c.sub}</span>
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <section className="rounded-card border border-line bg-surface p-5">
          <div className="flex items-baseline justify-between">
            <div>
              <h2 className="font-display text-base font-semibold text-ink">Monthly recurring revenue</h2>
              <p className="text-xs text-muted">Trailing 12 months</p>
            </div>
            <div className="text-right">
              <p className="font-display text-xl font-bold text-ink">{usd(mrr)}</p>
              <p className={`text-xs font-semibold ${momPct >= 0 ? "text-emerald-600" : "text-accent-deep"}`}>{momPct >= 0 ? "▲" : "▼"} {Math.abs(momPct)}% MoM</p>
            </div>
          </div>
          <div className="mt-3"><AreaTrend data={mrrTrend} gradId="mrr" height={210} suffix="" /></div>
        </section>

        <section className="rounded-card border border-line bg-surface p-5">
          <h2 className="font-display text-base font-semibold text-ink">Plan mix</h2>
          <p className="text-xs text-muted">{active.length} active menu pages</p>
          <div className="mt-4"><Donut data={planMix} centerValue={active.length} centerLabel="pages" height={150} /></div>
        </section>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <section className="rounded-card border border-line bg-surface p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-ink">Onboarding in progress</h2>
            <span className="text-xs text-muted">{onboarding.length} being built</span>
          </div>
          <div className="mt-4 space-y-4">
            {onboarding.length === 0 ? (
              <p className="text-sm text-muted">Nothing in the pipeline right now.</p>
            ) : onboarding.map((o) => {
              const filled = Math.round((o.pct / 100) * 6);
              return (
                <div key={o.name} className="flex items-start gap-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-line text-xs font-bold text-ink">{o.name.charAt(0).toUpperCase()}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-ink">{o.name}</span>
                      <span className="text-muted">{o.label}</span>
                    </div>
                    <div className="mt-1.5 flex gap-1">
                      {Array.from({ length: 6 }, (_, i) => (
                        <span key={i} className={`h-1.5 flex-1 rounded-full ${i < filled ? "bg-accent" : "bg-line"}`} />
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-card border border-line bg-surface p-5">
          <h2 className="font-display text-base font-semibold text-ink">Recent activity</h2>
          <ul className="mt-4 space-y-3">
            {activity.length === 0 ? (
              <li className="text-sm text-muted">No activity yet.</li>
            ) : activity.map((a, i) => (
              <li key={i} className="flex items-center gap-3">
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${a.icon === "pay" ? "bg-sea/10 text-sea" : "bg-accent/10 text-accent"}`}>
                  {a.icon === "pay" ? <DollarSign className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{a.title}</p>
                  <p className="truncate text-xs text-muted">{a.sub}</p>
                </div>
                <span className="text-xs text-muted">{relTime(a.ts, now)}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
