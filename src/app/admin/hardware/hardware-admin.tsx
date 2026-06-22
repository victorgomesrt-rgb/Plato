"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { QrCode, Wifi, Tablet, Square, FileText } from "lucide-react";
import { toast } from "@/components/toast";
import { createHardwareOrder, advanceHardware } from "./actions";

export type Order = { id: string; item_type: string; quantity: number; notes: string | null; status: string; created_at: string; tenants: { name: string } | null };
type TenantOpt = { id: string; name: string };

const ITEM_TYPES = ["QR sticker", "NFC sticker", "Table stand", "Window decal", "Flyer"];

const CATALOG = [
  { icon: QrCode, name: "QR sticker pack", spec: "Set of 10, vinyl", avail: "All plans" },
  { icon: Wifi, name: "NFC tap sticker", spec: "NTAG213, printed", avail: "Growth +" },
  { icon: Tablet, name: "Table stand", spec: "Acrylic A6, QR + NFC", avail: "All plans" },
  { icon: Square, name: "Window decal", spec: "Static cling, 120mm", avail: "Growth +" },
  { icon: FileText, name: "Flyer design", spec: "Print-ready PDF", avail: "Premium · on demand" },
];

const STATUS_STYLE: Record<string, string> = { requested: "bg-citrus/30 text-ink", shipped: "bg-sea/10 text-sea", fulfilled: "bg-line text-muted" };
const STATUS_LABEL: Record<string, string> = { requested: "Queued", shipped: "Shipped", fulfilled: "Fulfilled" };
const NEXT: Record<string, { to: string; label: string }> = { requested: { to: "shipped", label: "Mark shipped" }, shipped: { to: "fulfilled", label: "Mark fulfilled" } };
const fmt = (d: string) => new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "America/Aruba" }).format(new Date(d));

export function HardwareAdmin({ orders, tenants }: { orders: Order[]; tenants: TenantOpt[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [f, setF] = useState({ tenantId: "", itemType: ITEM_TYPES[0], quantity: 1, notes: "" });

  const run = (p: Promise<{ ok: boolean; error?: string }>) =>
    start(async () => { const r = await p; setErr(r.ok ? null : (r.error ?? "Error")); if (r.ok) { toast("Updated"); router.refresh(); } });

  return (
    <div className="mt-6 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
      <section>
        <h2 className="font-display text-base font-semibold text-ink">Hardware catalog</h2>
        <div className="mt-3 space-y-2">
          {CATALOG.map((c) => (
            <div key={c.name} className="flex items-center gap-3 rounded-card border border-line bg-surface p-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-line text-muted"><c.icon className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-ink">{c.name}</p>
                <p className="text-xs text-muted">{c.spec}</p>
              </div>
              <span className="shrink-0 text-xs font-medium text-muted">{c.avail}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-display text-base font-semibold text-ink">Fulfillment queue</h2>
        <div className="mt-3 space-y-2">
          {orders.length === 0 ? (
            <p className="rounded-card border border-line bg-surface p-5 text-sm text-muted">No hardware orders yet.</p>
          ) : orders.map((o) => {
            const next = NEXT[o.status];
            return (
              <div key={o.id} className="rounded-card border border-line bg-surface p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">{o.tenants?.name ?? "—"}</p>
                    <p className="text-xs text-muted">{o.quantity}× {o.item_type}{o.notes ? ` · ${o.notes}` : ""}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLE[o.status] ?? "bg-line text-muted"}`}>{STATUS_LABEL[o.status] ?? o.status}</span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-muted">{fmt(o.created_at)}</span>
                  {next && <button disabled={pending} onClick={() => run(advanceHardware(o.id, next.to))} className="rounded-btn bg-accent px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60">{next.label}</button>}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <form onSubmit={(e) => { e.preventDefault(); run(createHardwareOrder(f)); }} className="rounded-card border border-line bg-surface p-4 lg:col-span-2">
        <p className="text-sm font-semibold text-ink">New hardware order</p>
        {err && <p className="mt-2 text-sm text-accent-deep">{err}</p>}
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <select value={f.tenantId} onChange={(e) => setF({ ...f, tenantId: e.target.value })} className="rounded-btn border border-line bg-surface px-3 py-2 text-sm">
            <option value="">Tenant…</option>
            {tenants.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <select value={f.itemType} onChange={(e) => setF({ ...f, itemType: e.target.value })} className="rounded-btn border border-line bg-surface px-3 py-2 text-sm">
            {ITEM_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
          <input type="number" min={1} value={f.quantity} onChange={(e) => setF({ ...f, quantity: Number(e.target.value) })} className="rounded-btn border border-line px-3 py-2 text-sm outline-none focus:border-accent" />
          <input value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} placeholder="Notes (optional)" className="rounded-btn border border-line px-3 py-2 text-sm outline-none focus:border-accent" />
        </div>
        <button disabled={pending} className="mt-3 rounded-btn bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">Create order</button>
      </form>
    </div>
  );
}
