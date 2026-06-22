"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { planPrice } from "@/lib/plans";
import { createInvoice, sendInvoice, markPaid, sendReminder, voidInvoice, invoiceSignedUrl } from "./actions";

type Tenant = { id: string; name: string; slug: string; plan: string };
export type Invoice = {
  id: string;
  number: string;
  amount: number;
  currency: string;
  created_at: string | null;
  due_date: string | null;
  status: string;
  pdf_url: string | null;
  tenants: { name: string } | null;
};

const money = (a: number, c = "USD") => new Intl.NumberFormat("en-US", { style: "currency", currency: c, maximumFractionDigits: 0 }).format(a);
const fmtDay = (d: string | null) => (d ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "America/Aruba" }).format(new Date(d)) : "—");
const isoDate = (d: Date) => d.toISOString().slice(0, 10);
const monthStart = () => { const d = new Date(); return isoDate(new Date(d.getFullYear(), d.getMonth(), 1)); };
const monthEnd = () => { const d = new Date(); return isoDate(new Date(d.getFullYear(), d.getMonth() + 1, 0)); };
const plusDays = (n: number) => { const d = new Date(); d.setDate(d.getDate() + n); return isoDate(d); };

const STATUS_STYLE: Record<string, string> = {
  draft: "bg-line text-muted",
  sent: "bg-sea/10 text-sea",
  paid: "bg-emerald-100 text-emerald-700",
  overdue: "bg-accent/10 text-accent-deep",
  void: "bg-line text-muted line-through",
};
const STATUS_LABEL: Record<string, string> = { draft: "Draft", sent: "Sent", paid: "Paid", overdue: "Overdue", void: "Void" };

export function BillingAdmin({ tenants, invoices }: { tenants: Tenant[]; invoices: Invoice[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [tenantId, setTenantId] = useState(tenants[0]?.id ?? "");
  const [amount, setAmount] = useState(String(planPrice(tenants[0]?.plan ?? "starter")));
  const [periodStart, setPeriodStart] = useState(monthStart());
  const [periodEnd, setPeriodEnd] = useState(monthEnd());
  const [dueDate, setDueDate] = useState(plusDays(14));

  const run = (p: Promise<{ ok: boolean; error?: string }>) =>
    start(async () => { const r = await p; setErr(r.ok ? null : (r.error ?? "Something went wrong")); if (r.ok) router.refresh(); });

  function onTenant(id: string) {
    setTenantId(id);
    const t = tenants.find((x) => x.id === id);
    if (t) setAmount(String(planPrice(t.plan)));
  }
  async function viewPdf(id: string) {
    const r = await invoiceSignedUrl(id);
    if (r.ok && r.data) window.open(r.data.url, "_blank");
    else setErr(r.ok ? "No link" : r.error);
  }

  const today = isoDate(new Date());
  const ym = today.slice(0, 7);
  const eff = (i: Invoice) => (i.status === "sent" && i.due_date && i.due_date < today ? "overdue" : i.status);
  const sum = (f: (i: Invoice) => boolean) => invoices.filter(f).reduce((a, i) => a + Number(i.amount), 0);
  const cards = [
    { label: "Billed this month", value: money(sum((i) => i.status !== "void" && (i.created_at ?? "").slice(0, 7) === ym)), color: "text-ink" },
    { label: "Collected", value: money(sum((i) => i.status === "paid" && (i.created_at ?? "").slice(0, 7) === ym)), color: "text-emerald-600" },
    { label: "Outstanding", value: money(sum((i) => eff(i) === "sent")), color: "text-amber-600" },
    { label: "Overdue", value: money(sum((i) => eff(i) === "overdue")), color: "text-accent-deep" },
  ];

  const field = "rounded-btn border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent";

  return (
    <div className="mt-5">
      {err && <p className="mb-3 rounded-btn bg-accent/10 px-3 py-2 text-sm text-accent-deep">{err}</p>}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-card border border-line bg-surface p-4">
            <p className="text-xs text-muted">{c.label}</p>
            <p className={`mt-1 font-display text-2xl font-bold ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <h2 className="font-display text-base font-semibold text-ink">Invoices</h2>
        <button onClick={() => setOpen((v) => !v)} className="rounded-btn border border-line bg-surface px-3 py-1.5 text-sm font-medium text-ink hover:border-ink/30">{open ? "Close" : "+ New invoice"}</button>
      </div>

      {open && (
        <div className="mt-3 rounded-card border border-line bg-surface p-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="text-sm text-ink">Tenant
              <select value={tenantId} onChange={(e) => onTenant(e.target.value)} className={`mt-1 w-full ${field}`}>
                {tenants.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.plan})</option>)}
              </select>
            </label>
            <label className="text-sm text-ink">Amount (USD)<input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" className={`mt-1 w-full ${field}`} /></label>
            <label className="text-sm text-ink">Due date<input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={`mt-1 w-full ${field}`} /></label>
            <label className="text-sm text-ink">Period start<input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} className={`mt-1 w-full ${field}`} /></label>
            <label className="text-sm text-ink">Period end<input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} className={`mt-1 w-full ${field}`} /></label>
          </div>
          <button disabled={pending || !tenantId} onClick={() => run(createInvoice({ tenantId, amount: Number(amount), periodStart, periodEnd, dueDate }))}
            className="mt-3 rounded-btn bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{pending ? "Working…" : "Create draft"}</button>
        </div>
      )}

      <div className="mt-3 overflow-x-auto rounded-card border border-line bg-surface">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-[11px] uppercase tracking-wide text-muted">
              <th className="px-4 py-2.5 font-medium">Invoice</th>
              <th className="px-3 py-2.5 font-medium">Tenant</th>
              <th className="px-3 py-2.5 font-medium">Amount</th>
              <th className="px-3 py-2.5 font-medium">Issued</th>
              <th className="px-3 py-2.5 font-medium">Due</th>
              <th className="px-3 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 text-right font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => {
              const s = eff(inv);
              return (
                <tr key={inv.id} className="border-b border-line/60 last:border-0 hover:bg-line/20">
                  <td className="px-4 py-3 font-medium text-ink">{inv.number}</td>
                  <td className="px-3 py-3 text-ink">{inv.tenants?.name ?? "—"}</td>
                  <td className="px-3 py-3 font-medium text-ink">{money(Number(inv.amount), inv.currency)}</td>
                  <td className="px-3 py-3 text-muted">{fmtDay(inv.created_at)}</td>
                  <td className="px-3 py-3 text-muted">{fmtDay(inv.due_date)}</td>
                  <td className="px-3 py-3"><span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLE[s] ?? "bg-line text-muted"}`}>{STATUS_LABEL[s] ?? s}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2 text-xs">
                      {s === "draft" && <button disabled={pending} onClick={() => run(sendInvoice(inv.id))} className="rounded-btn bg-accent px-3 py-1.5 font-semibold text-white disabled:opacity-60">Send</button>}
                      {s === "sent" && <button disabled={pending} onClick={() => run(sendReminder(inv.id))} className="rounded-btn border border-line px-3 py-1.5 font-medium text-ink hover:border-ink/30">Remind</button>}
                      {s === "overdue" && <button disabled={pending} onClick={() => run(sendReminder(inv.id))} className="rounded-btn bg-ink px-3 py-1.5 font-semibold text-white hover:bg-ink/90">Chase</button>}
                      {s === "paid" && <button onClick={() => viewPdf(inv.id)} disabled={!inv.pdf_url} className="rounded-btn border border-line px-3 py-1.5 font-medium text-ink hover:border-ink/30 disabled:opacity-50">View</button>}
                      {s !== "paid" && s !== "void" && <button disabled={pending} onClick={() => run(markPaid(inv.id))} className="text-muted hover:text-emerald-700">Mark paid</button>}
                      {s !== "paid" && s !== "void" && <button disabled={pending} onClick={() => run(voidInvoice(inv.id))} className="text-muted hover:text-accent-deep">Void</button>}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {invoices.length === 0 && <p className="px-4 py-8 text-center text-sm text-muted">No invoices yet. Create one above.</p>}
      </div>
    </div>
  );
}
