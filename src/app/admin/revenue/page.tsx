import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { currentAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { planPrice } from "@/lib/plans";
import { AreaTrend, Donut } from "@/components/charts";

export const metadata: Metadata = { title: "Admin · Revenue", robots: { index: false } };

const usd = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

type Tenant = { plan: string; status: string; created_at: string };

export default async function AdminRevenuePage() {
  if (!(await currentAdmin())) notFound();
  const svc = createAdminClient();
  const [{ data: tData }, { data: tabData }] = await Promise.all([
    svc.from("tenants").select("plan, status, created_at").returns<Tenant[]>(),
    svc.from("tablets").select("monthly_fee, status").returns<{ monthly_fee: number | null; status: string }[]>(),
  ]);
  const tenants = tData ?? [];
  const active = tenants.filter((t) => t.status === "active");
  const subMrr = active.reduce((a, t) => a + planPrice(t.plan), 0);
  const tabletMrr = (tabData ?? []).filter((t) => t.status === "deployed").reduce((a, t) => a + Number(t.monthly_fee ?? 0), 0);

  const nowD = new Date();
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(Date.UTC(nowD.getUTCFullYear(), nowD.getUTCMonth() - (11 - i) + 1, 0));
    return { label: new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" }).format(d), end: d };
  });
  const mrrTrend = months.map((m) => ({
    label: m.label,
    value: tenants.filter((t) => new Date(t.created_at) <= m.end && t.status !== "canceled").reduce((a, t) => a + planPrice(t.plan), 0),
  }));

  const planMix = [
    { name: "Starter", value: active.filter((t) => t.plan === "starter").length, color: "#CFC8BF" },
    { name: "Growth", value: active.filter((t) => t.plan === "growth").length, color: "#0E5B5B" },
    { name: "Premium", value: active.filter((t) => t.plan === "premium").length, color: "#FB6A1A" },
  ];

  const cards = [
    { label: "Subscription MRR", value: usd(subMrr) },
    { label: "Tablet rentals / mo", value: usd(tabletMrr) },
    { label: "Total recurring / mo", value: usd(subMrr + tabletMrr) },
    { label: "Annualized", value: usd((subMrr + tabletMrr) * 12) },
  ];

  return (
    <main className="mx-auto max-w-6xl px-5 py-6 lg:px-8 lg:py-8">
      <h1 className="font-display text-2xl font-bold text-ink">Revenue</h1>
      <p className="text-sm text-muted">Recurring revenue across subscriptions and tablet rentals.</p>

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-card border border-line bg-surface p-4">
            <p className="font-display text-2xl font-bold text-ink">{c.value}</p>
            <p className="text-xs text-muted">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <section className="rounded-card border border-line bg-surface p-5">
          <div className="flex items-baseline justify-between">
            <div>
              <h2 className="font-display text-base font-semibold text-ink">MRR over time</h2>
              <p className="text-xs text-muted">Trailing 12 months</p>
            </div>
            <p className="font-display text-xl font-bold text-ink">{usd(subMrr)}</p>
          </div>
          <div className="mt-3"><AreaTrend data={mrrTrend} gradId="rev" height={210} /></div>
        </section>
        <section className="rounded-card border border-line bg-surface p-5">
          <h2 className="font-display text-base font-semibold text-ink">Plan mix</h2>
          <p className="text-xs text-muted">{active.length} active menu pages</p>
          <div className="mt-4"><Donut data={planMix} centerValue={active.length} centerLabel="pages" height={150} /></div>
        </section>
      </div>
    </main>
  );
}
