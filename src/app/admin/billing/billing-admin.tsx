"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { planPrice } from "@/lib/plans";
import {
  createInvoice,
  sendInvoice,
  markPaid,
  sendReminder,
  voidInvoice,
  invoiceSignedUrl,
} from "./actions";

type Tenant = { id: string; name: string; slug: string; plan: string };
type Invoice = {
  id: string;
  number: string;
  amount: number;
  currency: string;
  period_start: string | null;
  period_end: string | null;
  due_date: string | null;
  status: string;
  pdf_url: string | null;
  tenants: { name: string } | null;
};

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}
function monthStart() {
  const d = new Date();
  return isoDate(new Date(d.getFullYear(), d.getMonth(), 1));
}
function monthEnd() {
  const d = new Date();
  return isoDate(new Date(d.getFullYear(), d.getMonth() + 1, 0));
}
function plusDays(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return isoDate(d);
}
const money = (a: number, c = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: c }).format(a);

const STATUS_COLOR: Record<string, string> = {
  draft: "text-muted",
  sent: "text-citrus",
  paid: "text-sea",
  void: "text-muted line-through",
};

export function BillingAdmin({ tenants, invoices }: { tenants: Tenant[]; invoices: Invoice[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const [tenantId, setTenantId] = useState(tenants[0]?.id ?? "");
  const [amount, setAmount] = useState(String(planPrice(tenants[0]?.plan ?? "starter")));
  const [periodStart, setPeriodStart] = useState(monthStart());
  const [periodEnd, setPeriodEnd] = useState(monthEnd());
  const [dueDate, setDueDate] = useState(plusDays(14));

  const run = (p: Promise<{ ok: boolean; error?: string }>) =>
    startTransition(async () => {
      const r = await p;
      setErr(r.ok ? null : (r.error ?? "Something went wrong"));
      if (r.ok) router.refresh();
    });

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

  const field = "rounded-btn border border-line px-3 py-2 text-sm outline-none focus:border-accent";

  return (
    <div className="mt-6 space-y-8">
      {err && <p className="rounded-btn bg-accent/10 px-3 py-2 text-sm text-accent-deep">{err}</p>}

      {/* Create */}
      <section className="rounded-card border border-line p-4">
        <h2 className="font-display text-lg font-semibold text-ink">New invoice</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="text-sm text-ink">
            Tenant
            <select value={tenantId} onChange={(e) => onTenant(e.target.value)} className={`mt-1 w-full bg-surface ${field}`}>
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.plan})
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-ink">
            Amount (USD)
            <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" className={`mt-1 w-full ${field}`} />
          </label>
          <label className="text-sm text-ink">
            Period start
            <input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} className={`mt-1 w-full ${field}`} />
          </label>
          <label className="text-sm text-ink">
            Period end
            <input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} className={`mt-1 w-full ${field}`} />
          </label>
          <label className="text-sm text-ink">
            Due date
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={`mt-1 w-full ${field}`} />
          </label>
        </div>
        <div className="mt-3">
          <Button
            disabled={pending || !tenantId}
            onClick={() =>
              run(
                createInvoice({
                  tenantId,
                  amount: Number(amount),
                  periodStart,
                  periodEnd,
                  dueDate,
                })
              )
            }
          >
            {pending ? "Working…" : "Create draft"}
          </Button>
        </div>
      </section>

      {/* List */}
      <section>
        <h2 className="font-display text-lg font-semibold text-ink">Invoices ({invoices.length})</h2>
        <div className="mt-3 space-y-2">
          {invoices.map((inv) => (
            <div key={inv.id} className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-line p-3">
              <div className="text-sm">
                <p className="font-medium text-ink">
                  {inv.number} · {inv.tenants?.name}
                </p>
                <p className="text-muted">
                  {money(Number(inv.amount), inv.currency)} ·{" "}
                  <span className={STATUS_COLOR[inv.status] ?? "text-muted"}>{inv.status}</span> · due{" "}
                  {inv.due_date ?? "-"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {inv.status === "draft" && (
                  <Button size="sm" disabled={pending} onClick={() => run(sendInvoice(inv.id))}>
                    Send
                  </Button>
                )}
                {(inv.status === "sent" || inv.status === "draft") && (
                  <Button size="sm" variant="secondary" disabled={pending} onClick={() => run(markPaid(inv.id))}>
                    Mark paid
                  </Button>
                )}
                {inv.status === "sent" && (
                  <Button size="sm" variant="outline" disabled={pending} onClick={() => run(sendReminder(inv.id))}>
                    Reminder
                  </Button>
                )}
                {inv.pdf_url && (
                  <Button size="sm" variant="ghost" onClick={() => viewPdf(inv.id)}>
                    PDF
                  </Button>
                )}
                {inv.status !== "paid" && inv.status !== "void" && (
                  <Button size="sm" variant="ghost" disabled={pending} onClick={() => run(voidInvoice(inv.id))}>
                    Void
                  </Button>
                )}
              </div>
            </div>
          ))}
          {invoices.length === 0 && <p className="text-sm text-muted">No invoices yet.</p>}
        </div>
      </section>
    </div>
  );
}
