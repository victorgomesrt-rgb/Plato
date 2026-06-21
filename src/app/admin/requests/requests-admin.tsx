"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setChangeRequestStatus, setHardwareStatus } from "./actions";

export type ChangeReq = { id: string; kind: string; message: string; status: string; created_at: string; tenants: { name: string; slug: string } | null };
export type HardwareReq = { id: string; item_type: string; quantity: number; notes: string | null; status: string; created_at: string; tenants: { name: string; slug: string } | null };

const fmt = (d: string) => new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "America/Aruba" }).format(new Date(d));
const STATUS_STYLE: Record<string, string> = { open: "bg-citrus/20 text-ink", requested: "bg-citrus/20 text-ink", in_progress: "bg-sea/10 text-sea", shipped: "bg-sea/10 text-sea", done: "bg-line text-muted", fulfilled: "bg-line text-muted" };

const CR_NEXT: Record<string, { to: string; label: string }> = { open: { to: "in_progress", label: "Start" }, in_progress: { to: "done", label: "Mark done" } };
const HW_NEXT: Record<string, { to: string; label: string }> = { requested: { to: "shipped", label: "Mark shipped" }, shipped: { to: "fulfilled", label: "Mark fulfilled" } };

export function RequestsAdmin({ changeRequests, hardwareOrders }: { changeRequests: ChangeReq[]; hardwareOrders: HardwareReq[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const run = (p: Promise<{ ok: boolean; error?: string }>) =>
    start(async () => { const r = await p; setErr(r.ok ? null : (r.error ?? "Error")); if (r.ok) router.refresh(); });

  return (
    <div className="mt-6 space-y-8">
      {err && <p className="rounded-btn bg-accent/10 px-3 py-2 text-sm text-accent-deep">{err}</p>}

      <section>
        <h2 className="font-display text-lg font-semibold text-ink">Change requests <span className="text-sm font-normal text-muted">({changeRequests.length})</span></h2>
        {changeRequests.length === 0 ? (
          <p className="mt-3 rounded-card border border-line bg-surface p-5 text-sm text-muted">No change requests right now.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {changeRequests.map((r) => {
              const next = CR_NEXT[r.status];
              return (
                <li key={r.id} className="rounded-card border border-line bg-surface p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-medium text-ink">{r.tenants?.name ?? "—"} <span className="text-xs font-normal uppercase tracking-wide text-muted">· {r.kind}</span></span>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLE[r.status] ?? "bg-line text-muted"}`}>{r.status.replace("_", " ")}</span>
                  </div>
                  <p className="mt-1.5 text-sm text-ink">{r.message}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-muted">{fmt(r.created_at)}</span>
                    {next && <button disabled={pending} onClick={() => run(setChangeRequestStatus(r.id, next.to))} className="rounded-btn bg-accent px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60">{next.label}</button>}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <h2 className="font-display text-lg font-semibold text-ink">Hardware orders <span className="text-sm font-normal text-muted">({hardwareOrders.length})</span></h2>
        {hardwareOrders.length === 0 ? (
          <p className="mt-3 rounded-card border border-line bg-surface p-5 text-sm text-muted">No hardware orders right now.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {hardwareOrders.map((r) => {
              const next = HW_NEXT[r.status];
              return (
                <li key={r.id} className="rounded-card border border-line bg-surface p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-medium text-ink">{r.tenants?.name ?? "—"} <span className="text-xs font-normal text-muted">· {r.quantity}× {r.item_type}</span></span>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLE[r.status] ?? "bg-line text-muted"}`}>{r.status}</span>
                  </div>
                  {r.notes && <p className="mt-1.5 text-sm text-muted">{r.notes}</p>}
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-muted">{fmt(r.created_at)}</span>
                    {next && <button disabled={pending} onClick={() => run(setHardwareStatus(r.id, next.to))} className="rounded-btn bg-accent px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60">{next.label}</button>}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
