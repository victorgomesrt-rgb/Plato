"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/toast";
import { addTablet, assignTablet, returnTablet, billTabletRental } from "./actions";

export type Tablet = { id: string; asset_tag: string | null; model: string | null; status: string; tenant_id: string | null; monthly_fee: number | null; deposit: number | null; term_months: number | null; deployed_at: string | null; tenants: { name: string } | null };
type TenantOpt = { id: string; name: string };

const STATUS_STYLE: Record<string, string> = { in_stock: "bg-citrus/20 text-ink", deployed: "bg-sea/10 text-sea", retired: "bg-accent/10 text-accent-deep" };
const STATUS_LABEL: Record<string, string> = { in_stock: "Available", deployed: "Deployed", retired: "Retired" };
const usd = (n: number | null) => (n == null ? "—" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n));
const monthYear = (d: string) => new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric", timeZone: "America/Aruba" }).format(new Date(d));

export function TabletsAdmin({ tablets, tenants }: { tablets: Tablet[]; tenants: TenantOpt[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [tag, setTag] = useState("");
  const [model, setModel] = useState("");
  const [pick, setPick] = useState<Record<string, string>>({});

  const run = (p: Promise<{ ok: boolean; error?: string }>) =>
    start(async () => { const r = await p; setErr(r.ok ? null : (r.error ?? "Error")); if (r.ok) { toast("Updated"); router.refresh(); } });

  const deployed = tablets.filter((t) => t.status === "deployed");
  const cards = [
    { label: "Deployed", value: deployed.length },
    { label: "Available", value: tablets.filter((t) => t.status === "in_stock").length },
    { label: "Retired", value: tablets.filter((t) => t.status === "retired").length },
    { label: "Deposits held", value: usd(deployed.reduce((a, t) => a + Number(t.deposit ?? 0), 0)) },
  ];

  return (
    <div className="mt-5">
      {err && <p className="mb-3 rounded-btn bg-accent/10 px-3 py-2 text-sm text-accent-deep">{err}</p>}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-card border border-line bg-surface p-4">
            <p className="text-xs text-muted">{c.label}</p>
            <p className="mt-1 font-display text-2xl font-bold text-ink">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 overflow-x-auto rounded-card border border-line bg-surface">
        <table className="w-full min-w-[680px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-[11px] uppercase tracking-wide text-muted">
              <th className="px-4 py-2.5 font-medium">Device</th>
              <th className="px-3 py-2.5 font-medium">Customer</th>
              <th className="px-3 py-2.5 font-medium">Term</th>
              <th className="px-3 py-2.5 font-medium">Deposit</th>
              <th className="px-3 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 text-right font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {tablets.map((t) => (
              <tr key={t.id} className="border-b border-line/60 last:border-0 hover:bg-line/20">
                <td className="px-4 py-3 font-medium text-ink">{t.asset_tag ?? "—"}</td>
                <td className="px-3 py-3">
                  <p className="text-ink">{t.tenants?.name ?? "Unassigned"}</p>
                  <p className="text-xs text-muted">{t.status === "deployed" && t.deployed_at ? `Since ${monthYear(t.deployed_at)}` : t.status === "retired" ? "Retired" : "In storage"}</p>
                </td>
                <td className="px-3 py-3 text-muted">{t.status === "deployed" && t.term_months ? `${t.term_months} mo` : "—"}</td>
                <td className="px-3 py-3 text-muted">{t.status === "deployed" ? usd(t.deposit) : "—"}</td>
                <td className="px-3 py-3"><span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLE[t.status] ?? "bg-line text-muted"}`}>{STATUS_LABEL[t.status] ?? t.status}</span></td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1.5">
                    {t.status === "deployed" ? (
                      <>
                        <button disabled={pending} onClick={() => run(billTabletRental(t.id))} title="Create this month's rental invoice" className="rounded-btn border border-line px-3 py-1.5 text-xs font-medium text-ink hover:border-accent hover:text-accent-deep disabled:opacity-60">Bill rent</button>
                        <button disabled={pending} onClick={() => run(returnTablet(t.id))} className="rounded-btn border border-line px-3 py-1.5 text-xs font-medium text-ink hover:border-ink/30 disabled:opacity-60">Return</button>
                      </>
                    ) : (
                      <>
                        <select value={pick[t.id] ?? ""} onChange={(e) => setPick((p) => ({ ...p, [t.id]: e.target.value }))} className="rounded-btn border border-line bg-surface px-2 py-1.5 text-xs">
                          <option value="">Assign to…</option>
                          {tenants.map((tn) => <option key={tn.id} value={tn.id}>{tn.name}</option>)}
                        </select>
                        <button disabled={pending || !pick[t.id]} onClick={() => run(assignTablet(t.id, pick[t.id]))} className="rounded-btn bg-accent px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60">{t.status === "retired" ? "Redeploy" : "Deploy"}</button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {tablets.length === 0 && <p className="px-4 py-8 text-center text-sm text-muted">No tablets yet. Add your first below.</p>}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); run(addTablet(tag, model)); setTag(""); setModel(""); }} className="mt-3 flex flex-wrap gap-2 rounded-card border border-line bg-surface p-4">
        <input value={tag} onChange={(e) => setTag(e.target.value)} placeholder="Asset tag (PLT-012)" className="flex-1 rounded-btn border border-line px-3 py-2 text-sm outline-none focus:border-accent" />
        <input value={model} onChange={(e) => setModel(e.target.value)} placeholder="Model (optional)" className="flex-1 rounded-btn border border-line px-3 py-2 text-sm outline-none focus:border-accent" />
        <button disabled={pending} className="rounded-btn bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">Add tablet</button>
      </form>
    </div>
  );
}
