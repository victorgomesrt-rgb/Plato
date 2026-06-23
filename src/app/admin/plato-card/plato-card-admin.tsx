"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Send, Check, Clock } from "lucide-react";
import { toast } from "@/components/toast";
import { sendNetworkBlast, approveBlast, declineBlast } from "./actions";

export type Blast = {
  id: string; tenant_id: string | null; message: string; status: string;
  scheduled_at: string | null; sent_at: string | null; created_at: string;
  tenants: { name: string } | null;
};

const fmt = (d: string | null) => (d ? new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "America/Aruba" }).format(new Date(d)) : "—");
const STATUS: Record<string, string> = {
  requested: "bg-citrus/25 text-ink", scheduled: "bg-sea/10 text-sea", sent: "bg-emerald-100 text-emerald-700", declined: "bg-line text-muted",
};

export function PlatoCardAdmin({ blasts, partnerCount, sentThisWeek, weeklyCap }: { blasts: Blast[]; partnerCount: number; sentThisWeek: number; weeklyCap: number }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState("");
  const [when, setWhen] = useState("");

  const queue = blasts.filter((b) => b.status === "requested");
  const history = blasts.filter((b) => b.status !== "requested").slice(0, 8);

  function send() {
    if (!msg.trim()) { toast("Write a message first."); return; }
    start(async () => {
      const r = await sendNetworkBlast(msg, when || undefined);
      if (r.ok) { toast(when ? "Blast scheduled" : "Blast sent"); setMsg(""); setWhen(""); router.refresh(); }
      else toast(r.error);
    });
  }
  function approve(id: string) { start(async () => { const r = await approveBlast(id); toast(r.ok ? "Sent + invoiced" : r.error); if (r.ok) router.refresh(); }); }
  function decline(id: string) { start(async () => { const r = await declineBlast(id); if (r.ok) router.refresh(); else toast(r.error); }); }

  return (
    <div className="mt-5 space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Partners", value: String(partnerCount) },
          { label: "Blasts this week", value: `${sentThisWeek} / ${weeklyCap}` },
          { label: "Notifications", value: "15k / mo" },
        ].map((m) => (
          <div key={m.label} className="rounded-card border border-line bg-surface p-4">
            <p className="text-xs text-muted">{m.label}</p>
            <p className="mt-1 font-display text-2xl font-bold text-ink">{m.value}</p>
          </div>
        ))}
      </div>

      <section className="rounded-card border border-line bg-surface p-5">
        <p className="font-display text-base font-semibold text-ink">Send a network blast</p>
        <p className="mt-1 text-sm text-muted">Pushes to every Plato member. Keep it curated, this is the whole island.</p>
        <textarea value={msg} onChange={(e) => setMsg(e.target.value)} rows={3} placeholder="This week on Plato: new spots in Palm Beach. Tap to explore."
          className="mt-3 w-full rounded-card border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-accent" />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <label className="text-sm text-muted">Schedule (optional)
            <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} className="ml-2 h-9 rounded-btn border border-line bg-surface px-2 text-sm text-ink outline-none focus:border-accent" />
          </label>
          <button disabled={pending} onClick={send} className="ml-auto inline-flex items-center gap-2 rounded-btn bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-ink/90 disabled:opacity-60">
            <Send className="h-4 w-4" />{when ? "Schedule blast" : "Send to all members"}
          </button>
        </div>
      </section>

      <section className="rounded-card border border-line bg-surface p-5">
        <div className="flex items-center justify-between">
          <p className="font-display text-base font-semibold text-ink">Promo requests</p>
          {queue.length > 0 && <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-white">{queue.length} waiting</span>}
        </div>
        {queue.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No promo requests right now.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {queue.map((b) => (
              <li key={b.id} className="rounded-card border border-line p-3">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-ink">{b.tenants?.name ?? "Restaurant"}</span>
                  <span className="rounded-full bg-citrus/25 px-2 py-0.5 text-[11px] font-medium text-ink">$75</span>
                  <span className="ml-auto text-xs text-muted">{fmt(b.created_at)}</span>
                </div>
                <p className="mt-1.5 text-sm text-muted">{b.message}</p>
                <div className="mt-2.5 flex gap-2">
                  <button disabled={pending} onClick={() => approve(b.id)} className="inline-flex items-center gap-1.5 rounded-btn bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-deep disabled:opacity-60"><Send className="h-3.5 w-3.5" />Approve &amp; send</button>
                  <button disabled={pending} onClick={() => decline(b.id)} className="rounded-btn border border-line px-3 py-1.5 text-xs font-medium text-muted hover:text-ink">Decline</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-card border border-line bg-surface p-5">
        <p className="font-display text-base font-semibold text-ink">Recent blasts</p>
        {history.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No blasts sent yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {history.map((b) => (
              <li key={b.id} className="flex items-center gap-3 py-2.5">
                {b.status === "scheduled" ? <Clock className="h-4 w-4 text-muted" /> : <Check className="h-4 w-4 text-emerald-600" />}
                <span className="min-w-0 flex-1 truncate text-sm text-ink">{b.tenants?.name ? `${b.tenants.name}: ` : ""}{b.message}</span>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS[b.status] ?? "bg-line text-muted"}`}>{b.status === "scheduled" ? `Scheduled ${fmt(b.scheduled_at)}` : `Sent ${fmt(b.sent_at)}`}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
