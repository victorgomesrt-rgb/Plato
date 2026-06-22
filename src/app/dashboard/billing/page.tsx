import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { resolveDashboard } from "@/lib/dashboard-context";

export const metadata: Metadata = { title: "Billing", robots: { index: false } };

const money = (a: number, c = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: c }).format(a);
const fmt = (d: string | null) =>
  d ? new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "America/Aruba" }).format(new Date(d)) : "-";

type Sub = { plan: string; status: string; current_period_end: string | null; tenants: { name: string } | null };
type Inv = { number: string; amount: number; currency: string; status: string; due_date: string | null; tenants: { name: string } | null };

export default async function OwnerBillingPage() {
  const res = await resolveDashboard();
  if (res.state === "redirect") redirect("/login");

  // Explicit tenant filter (not RLS-only) so this is safe when reading via the service
  // role during admin impersonation, and scoped to the one resolved tenant.
  let subs: Sub[] = [], invoices: Inv[] = [];
  if (res.state === "ok") {
    const { db, tenantId } = res.ctx;
    subs = (await db.from("subscriptions").select("plan, status, current_period_end, tenants(name)").eq("tenant_id", tenantId).returns<Sub[]>()).data ?? [];
    invoices = (await db.from("invoices").select("number, amount, currency, status, due_date, tenants(name)").eq("tenant_id", tenantId).order("created_at", { ascending: false }).returns<Inv[]>()).data ?? [];
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-10">
      <Link href="/dashboard" className="text-sm text-muted hover:text-ink">
        ← Dashboard
      </Link>
      <h1 className="mt-2 font-display text-2xl font-semibold text-ink">Billing</h1>

      <h2 className="mt-6 font-display text-lg font-semibold text-ink">Your plan</h2>
      <div className="mt-2 space-y-2">
        {(subs ?? []).map((s, i) => (
          <div key={i} className="rounded-card border border-line p-4">
            <p className="font-medium capitalize text-ink">
              {s.tenants?.name} · {s.plan}
            </p>
            <p className="text-sm text-muted">
              {s.status} · renews {fmt(s.current_period_end)}
            </p>
          </div>
        ))}
        {(!subs || subs.length === 0) && (
          <p className="rounded-card border border-line p-4 text-sm text-muted">
            No active subscription yet.
          </p>
        )}
        <p className="text-xs text-muted">To change your plan, reply to any Plato email and we will sort it out.</p>
      </div>

      <h2 className="mt-8 font-display text-lg font-semibold text-ink">Invoices</h2>
      <div className="mt-2 space-y-2">
        {(invoices ?? []).map((inv) => (
          <div key={inv.number} className="flex items-center justify-between rounded-card border border-line p-3 text-sm">
            <span className="font-medium text-ink">{inv.number}</span>
            <span className="text-muted">
              {money(Number(inv.amount), inv.currency)} · {inv.status} · due {inv.due_date ?? "-"}
            </span>
          </div>
        ))}
        {(!invoices || invoices.length === 0) && <p className="text-sm text-muted">No invoices yet.</p>}
      </div>
    </main>
  );
}
