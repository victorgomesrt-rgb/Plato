import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { currentAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { planPrice } from "@/lib/plans";
import { AreaTrend } from "@/components/charts";
import { AdminHeader } from "../admin-header";

export const metadata: Metadata = { title: "Admin · Revenue", robots: { index: false } };

const usd = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
type Tenant = { name: string; slug: string; plan: string; status: string; created_at: string; review_only: boolean | null };

export default async function AdminRevenuePage() {
  if (!(await currentAdmin())) notFound();
  const svc = createAdminClient();
  const [{ data: tData }, { data: tabData }] = await Promise.all([
    svc.from("tenants").select("name, slug, plan, status, created_at, review_only").returns<Tenant[]>(),
    svc.from("tablets").select("monthly_fee, status").returns<{ monthly_fee: number | null; status: string }[]>(),
  ]);
  const tenants = tData ?? [];
  const menu = tenants.filter((t) => !t.review_only); // review-only clients aren't menu subscriptions
  const active = menu.filter((t) => t.status === "active");
  const subMrr = active.reduce((a, t) => a + planPrice(t.plan), 0);
  const tabletMrr = (tabData ?? []).filter((t) => t.status === "deployed").reduce((a, t) => a + Number(t.monthly_fee ?? 0), 0);

  const nowD = new Date();
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(Date.UTC(nowD.getUTCFullYear(), nowD.getUTCMonth() - (11 - i) + 1, 0));
    return { label: new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" }).format(d), end: d };
  });
  const mrrTrend = months.map((m) => ({
    label: m.label,
    value: menu.filter((t) => new Date(t.created_at) <= m.end && t.status !== "canceled").reduce((a, t) => a + planPrice(t.plan), 0),
  }));
  const momPct = mrrTrend[10].value > 0 ? Math.round(((mrrTrend[11].value - mrrTrend[10].value) / mrrTrend[10].value) * 1000) / 10 : 0;
  const avgPerTenant = active.length ? Math.round(subMrr / active.length) : 0;

  const cards: { label: string; value: string; pill?: string; pillGood?: boolean; sub: string }[] = [
    { label: "MRR", value: usd(subMrr), pill: `${momPct >= 0 ? "▲" : "▼"} ${Math.abs(momPct)}%`, pillGood: momPct >= 0, sub: "MoM" },
    { label: "Avg / tenant", value: usd(avgPerTenant), sub: "subscription" },
    { label: "Total recurring / mo", value: usd(subMrr + tabletMrr), sub: "subs + tablets" },
    { label: "Annualized", value: usd((subMrr + tabletMrr) * 12), sub: "run-rate" },
  ];

  const streams = [
    { name: "Subscriptions", value: subMrr, color: "#FB6A1A" },
    { name: "Tablet rentals", value: tabletMrr, color: "#0E5B5B" },
  ];
  const maxStream = Math.max(1, ...streams.map((s) => s.value));

  return (
    <main className="mx-auto max-w-6xl px-5 py-6 lg:px-8 lg:py-8">
      <AdminHeader title="Revenue" subtitle="MRR, plan mix & breakdown" tenants={tenants.map((t) => ({ name: t.name, slug: t.slug, plan: t.plan }))} />

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-card border border-line bg-surface p-4">
            <p className="text-xs text-muted">{c.label}</p>
            <p className="mt-2 font-display text-2xl font-bold text-ink">{c.value}</p>
            <p className="mt-1.5 flex items-center gap-1.5 text-xs">
              {c.pill && <span className={`rounded-full px-1.5 py-0.5 font-semibold ${c.pillGood ? "bg-emerald-100 text-emerald-700" : "bg-accent/10 text-accent-deep"}`}>{c.pill}</span>}
              <span className="text-muted">{c.sub}</span>
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <section className="rounded-card border border-line bg-surface p-5">
          <h2 className="font-display text-base font-semibold text-ink">MRR growth</h2>
          <p className="text-xs text-muted">Trailing 12 months · net of churn</p>
          <div className="mt-3"><AreaTrend data={mrrTrend} gradId="rev" height={210} /></div>
        </section>
        <section className="rounded-card border border-line bg-surface p-5">
          <h2 className="font-display text-base font-semibold text-ink">Revenue breakdown</h2>
          <p className="text-xs text-muted">Recurring streams / mo</p>
          <div className="mt-4 space-y-4">
            {streams.map((s) => (
              <div key={s.name}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-ink">{s.name}</span>
                  <span className="font-semibold text-ink">{usd(s.value)}</span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-line">
                  <div className="h-full rounded-full" style={{ width: `${Math.round((s.value / maxStream) * 100)}%`, background: s.color }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
