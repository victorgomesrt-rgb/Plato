"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/toast";
import { addTablet, assignTablet, returnTablet } from "./actions";

export type Tablet = { id: string; asset_tag: string | null; model: string | null; status: string; tenant_id: string | null; monthly_fee: number | null; deposit: number | null; deployed_at: string | null; tenants: { name: string } | null };
type TenantOpt = { id: string; name: string };

const STATUS_STYLE: Record<string, string> = { in_stock: "bg-line text-muted", deployed: "bg-sea/10 text-sea", retired: "bg-accent/10 text-accent-deep" };
const usd = (n: number | null) => (n == null ? "—" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n));

export function TabletsAdmin({ tablets, tenants }: { tablets: Tablet[]; tenants: TenantOpt[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [tag, setTag] = useState("");
  const [model, setModel] = useState("");
  const [pick, setPick] = useState<Record<string, string>>({});

  const run = (p: Promise<{ ok: boolean; error?: string }>) =>
    start(async () => { const r = await p; setErr(r.ok ? null : (r.error ?? "Error")); if (r.ok) { toast("Updated"); router.refresh(); } });

  const deployed = tablets.filter((t) => t.status === "deployed").length;

  return (
    <div className="mt-6">
      {err && <p className="mb-4 rounded-btn bg-accent/10 px-3 py-2 text-sm text-accent-deep">{err}</p>}

      <div className="grid grid-cols-3 gap-3">
        {[["Total", tablets.length], ["Deployed", deployed], ["In stock", tablets.length - deployed]].map(([l, v]) => (
          <div key={l} className="rounded-card border border-line bg-surface p-4">
            <p className="font-display text-2xl font-bold text-ink">{v}</p>
            <p className="text-xs text-muted">{l}</p>
          </div>
        ))}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); run(addTablet(tag, model)); setTag(""); setModel(""); }} className="mt-5 flex flex-wrap gap-2 rounded-card border border-line bg-surface p-4">
        <input value={tag} onChange={(e) => setTag(e.target.value)} placeholder="Asset tag (PLT-012)" className="flex-1 rounded-btn border border-line px-3 py-2 text-sm outline-none focus:border-accent" />
        <input value={model} onChange={(e) => setModel(e.target.value)} placeholder="Model (optional)" className="flex-1 rounded-btn border border-line px-3 py-2 text-sm outline-none focus:border-accent" />
        <button disabled={pending} className="rounded-btn bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">Add tablet</button>
      </form>

      <div className="mt-4 space-y-2">
        {tablets.length === 0 ? (
          <p className="rounded-card border border-line bg-surface p-5 text-sm text-muted">No tablets yet. Add your first above.</p>
        ) : tablets.map((t) => (
          <div key={t.id} className="rounded-card border border-line bg-surface p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-medium text-ink">{t.asset_tag ?? "—"} <span className="text-xs font-normal text-muted">{t.model ?? ""}</span></span>
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLE[t.status] ?? "bg-line text-muted"}`}>{t.status.replace("_", " ")}</span>
            </div>
            <p className="mt-1 text-xs text-muted">
              {t.tenants ? `With ${t.tenants.name}` : "Available"} · {usd(t.monthly_fee)}/mo · deposit {usd(t.deposit)}{t.deployed_at ? ` · since ${t.deployed_at}` : ""}
            </p>
            <div className="mt-2 flex items-center gap-2">
              {t.status === "deployed" ? (
                <button disabled={pending} onClick={() => run(returnTablet(t.id))} className="rounded-btn border border-line px-3 py-1.5 text-xs font-medium text-ink disabled:opacity-60">Mark returned</button>
              ) : (
                <>
                  <select value={pick[t.id] ?? ""} onChange={(e) => setPick((p) => ({ ...p, [t.id]: e.target.value }))} className="rounded-btn border border-line bg-surface px-2 py-1.5 text-xs">
                    <option value="">Assign to…</option>
                    {tenants.map((tn) => <option key={tn.id} value={tn.id}>{tn.name}</option>)}
                  </select>
                  <button disabled={pending || !pick[t.id]} onClick={() => run(assignTablet(t.id, pick[t.id]))} className="rounded-btn bg-accent px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60">Deploy</button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
