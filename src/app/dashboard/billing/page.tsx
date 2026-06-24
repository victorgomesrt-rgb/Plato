import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Check, FileText, Mail } from "lucide-react";
import { resolveDashboard } from "@/lib/dashboard-context";
import { planPrice, planFeatures } from "@/lib/plans";
import { DashboardHeader } from "../dashboard-header";

export const metadata: Metadata = { title: "Billing", robots: { index: false } };

const money = (a: number, c = "USD") => new Intl.NumberFormat("en-US", { style: "currency", currency: c }).format(a);
const fmtLong = (d: string | null) => (d ? new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeZone: "America/Aruba" }).format(new Date(d)) : "—");
const fmtShort = (d: string | null) => (d ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "America/Aruba" }).format(new Date(d)) : "—");
// Invoice line date: period_start is a date-only column, so format in UTC (anchored at
// noon) to avoid the Aruba offset rolling it back a day.
const fmtDateOnly = (d: string | null) => (d ? new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(d.length === 10 ? `${d}T12:00:00Z` : d)) : "—");


type Sub = { plan: string; status: string; current_period_end: string | null };
type Inv = { id: string; number: string; amount: number; currency: string; description: string | null; status: string; period_start: string | null; paid_at: string | null; created_at: string; pdf_url: string | null };
type LineItem = { invoice_id: string; description: string; quantity: number; unit_price: number; amount: number };

export default async function OwnerBillingPage() {
  const res = await resolveDashboard();
  if (res.state === "redirect") redirect("/login");

  let sub: Sub | null = null, invoices: Inv[] = [], slug = "", plan = "premium";
  const lineMap: Record<string, LineItem[]> = {};
  if (res.state === "ok") {
    const { db, tenantId } = res.ctx;
    const [{ data: t }, { data: s }, { data: inv }] = await Promise.all([
      db.from("tenants").select("slug, plan").eq("id", tenantId).maybeSingle(),
      db.from("subscriptions").select("plan, status, current_period_end").eq("tenant_id", tenantId).maybeSingle(),
      db.from("invoices").select("id, number, amount, currency, description, status, period_start, paid_at, created_at, pdf_url").eq("tenant_id", tenantId).order("period_start", { ascending: false, nullsFirst: false }).returns<Inv[]>(),
    ]);
    slug = (t as { slug: string } | null)?.slug ?? "";
    plan = (s as Sub | null)?.plan ?? (t as { plan: string } | null)?.plan ?? "premium";
    sub = (s as Sub | null) ?? null;
    invoices = inv ?? [];

    const ids = invoices.map((i) => i.id);
    if (ids.length) {
      const { data: li } = await db
        .from("invoice_line_items")
        .select("invoice_id, description, quantity, unit_price, amount")
        .in("invoice_id", ids)
        .order("sort_order")
        .returns<LineItem[]>();
      for (const row of li ?? []) (lineMap[row.invoice_id] ??= []).push(row);
    }
  }

  const price = planPrice(plan);
  const features = planFeatures(plan);
  const renews = sub?.current_period_end ?? null;

  return (
    <main className="mx-auto max-w-5xl px-5 py-6 lg:px-8 lg:py-8">
      <DashboardHeader title="Billing" subtitle="Your plan, payment method and invoices" slug={slug} />

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.7fr_1fr]">
        {/* Plan hero */}
        <section className="relative overflow-hidden rounded-card bg-ink p-6 text-white" style={{ backgroundImage: "radial-gradient(130% 130% at 100% 100%, rgba(251,106,26,0.22), transparent 55%)" }}>
          <div className="flex items-start justify-between gap-4">
            <span className="inline-flex rounded-full bg-accent/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-accent">{plan} plan</span>
            <p className="font-display text-3xl font-bold">{money(price).replace(".00", "")}<span className="text-base font-medium text-white/60">/mo</span></p>
          </div>
          <p className="mt-3 text-sm text-white/70">Renews {fmtLong(renews)} · cancel anytime</p>
          <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {features.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-white/90"><Check className="h-4 w-4 shrink-0 text-emerald-400" />{f}</li>
            ))}
          </ul>
          <div className="mt-5 flex gap-2">
            <Link href="/dashboard/requests" className="rounded-btn bg-white px-4 py-2 text-sm font-semibold text-ink hover:bg-white/90">Change plan</Link>
            <a href="mailto:adrian@platodigital.online" className="rounded-btn border border-white/20 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10">Contact billing</a>
          </div>
        </section>

        <div className="space-y-4">
          <section className="rounded-card border border-line bg-surface p-5">
            <p className="text-sm text-muted">Next invoice</p>
            <p className="mt-1 font-display text-2xl font-bold text-ink">{money(price)} <span className="text-sm font-medium text-muted">on {fmtShort(renews)}</span></p>
          </section>
          <section className="rounded-card border border-line bg-surface p-5">
            <p className="text-sm text-muted">Payment method</p>
            <div className="mt-2 flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-line text-muted"><Mail className="h-4 w-4" /></span>
              <div>
                <p className="text-sm font-medium text-ink">Invoiced by email</p>
                <p className="text-xs text-muted">We email each invoice; no card on file. Pay by transfer or card link.</p>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Invoices */}
      <section className="mt-4 overflow-hidden rounded-card border border-line bg-surface">
        <div className="grid grid-cols-[1.2fr_1.6fr_1fr_0.8fr_0.6fr] gap-3 border-b border-line bg-[#FAF8F4] px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted">
          <span>Invoice</span><span>Description</span><span>Amount</span><span>Status</span><span className="text-right">Receipt</span>
        </div>
        {invoices.length === 0 ? (
          <p className="px-5 py-6 text-sm text-muted">No invoices yet.</p>
        ) : invoices.map((inv) => (
          <div key={inv.number} className="grid grid-cols-[1.2fr_1.6fr_1fr_0.8fr_0.6fr] items-center gap-3 border-b border-line px-5 py-4 last:border-0">
            <div>
              <p className="font-semibold text-ink">{inv.number}</p>
              <p className="text-xs text-muted">{fmtDateOnly(inv.period_start ?? inv.created_at)}</p>
            </div>
            <div className="min-w-0">
              {(lineMap[inv.id]?.length ?? 0) > 0 ? (
                <ul className="space-y-0.5">
                  {lineMap[inv.id].map((li, idx) => (
                    <li key={`${inv.id}-${idx}`} className="text-sm text-ink">
                      {li.description}
                      {Number(li.quantity) !== 1 && <span className="text-muted"> × {Number(li.quantity)}</span>}
                      <span className="text-muted"> · {money(Number(li.amount), inv.currency)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="text-sm text-ink">{inv.description ?? "—"}</span>
              )}
            </div>
            <span className="font-medium text-ink">{money(Number(inv.amount), inv.currency)}</span>
            <span>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${inv.status === "paid" ? "bg-emerald-100 text-emerald-700" : inv.status === "overdue" || inv.status === "past_due" ? "bg-accent/10 text-accent-deep" : "bg-citrus/25 text-ink"}`}>
                {inv.status === "paid" ? "Paid" : inv.status === "past_due" ? "Overdue" : inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
              </span>
            </span>
            <span className="text-right">
              {inv.pdf_url ? (
                <a href={inv.pdf_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-btn border border-line px-2.5 py-1.5 text-xs font-medium text-ink hover:border-ink/20"><FileText className="h-3.5 w-3.5" />PDF</a>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-btn border border-line px-2.5 py-1.5 text-xs font-medium text-muted opacity-60" title="Available once issued"><FileText className="h-3.5 w-3.5" />PDF</span>
              )}
            </span>
          </div>
        ))}
      </section>
    </main>
  );
}
