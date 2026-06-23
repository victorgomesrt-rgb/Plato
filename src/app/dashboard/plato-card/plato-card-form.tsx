"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { toast } from "@/components/toast";
import { saveWalletPerk, requestPromo } from "./actions";

export function WalletPerk({ discount, listed, readOnly }: { discount: string; listed: boolean; readOnly: boolean }) {
  const router = useRouter();
  const [d, setD] = useState(discount);
  const [on, setOn] = useState(listed);
  const [pending, start] = useTransition();

  function save(nextListed = on) {
    if (readOnly) return;
    start(async () => {
      const r = await saveWalletPerk(d, nextListed);
      if (r.ok) { toast("Saved"); router.refresh(); } else toast(r.error);
    });
  }

  return (
    <section className="rounded-card border border-line bg-surface p-5">
      <p className="font-display text-base font-semibold text-ink">Your member perk</p>
      <p className="mt-1 text-sm text-muted">Shown on the Plato Card and your menu. Members show their card at checkout.</p>
      <label className="mt-4 block text-sm font-medium text-ink">Discount or perk
        <input value={d} disabled={readOnly} onChange={(e) => setD(e.target.value)} onBlur={() => save()} placeholder="e.g. 10% off the bill"
          className="mt-1 h-11 w-full rounded-btn border border-line bg-surface px-3 text-sm text-ink outline-none focus:border-accent disabled:opacity-60" />
      </label>
      <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
        <span className="text-sm text-ink">Listed on the Plato Card</span>
        <button disabled={pending || readOnly} onClick={() => { const next = !on; setOn(next); save(next); }} aria-label="Toggle listing" className="disabled:opacity-60">
          <span className={`relative block h-6 w-11 rounded-full transition ${on ? "bg-emerald-500" : "bg-line"}`}>
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? "left-[22px]" : "left-0.5"}`} />
          </span>
        </button>
      </div>
    </section>
  );
}

export function PromoRequest({ readOnly }: { readOnly: boolean }) {
  const router = useRouter();
  const [msg, setMsg] = useState("");
  const [when, setWhen] = useState("");
  const [pending, start] = useTransition();

  function submit() {
    if (readOnly) return;
    if (!msg.trim()) { toast("Describe the special first."); return; }
    start(async () => {
      const r = await requestPromo(msg, when || undefined);
      if (r.ok) { toast("Sent to your Plato team"); setMsg(""); setWhen(""); router.refresh(); } else toast(r.error);
    });
  }

  return (
    <section className="rounded-card border border-line bg-surface p-5">
      <p className="font-display text-base font-semibold text-ink">Promote a special</p>
      <p className="mt-1 text-sm text-muted">Push a one-time message to every Plato member. Your Plato team reviews and sends. $75 per blast.</p>
      <textarea value={msg} disabled={readOnly} onChange={(e) => setMsg(e.target.value)} rows={3} placeholder="e.g. Tonight only: 2-for-1 mojitos, 6 to 8pm."
        className="mt-3 w-full rounded-card border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-accent disabled:opacity-60" />
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <label className="text-sm text-muted">Preferred date
          <input type="date" value={when} disabled={readOnly} onChange={(e) => setWhen(e.target.value)} className="ml-2 h-9 rounded-btn border border-line bg-surface px-2 text-sm text-ink outline-none focus:border-accent disabled:opacity-60" />
        </label>
        <button disabled={pending || readOnly} onClick={submit} className="ml-auto inline-flex items-center gap-2 rounded-btn bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-deep disabled:opacity-60">
          <Send className="h-4 w-4" />Request blast · $75
        </button>
      </div>
    </section>
  );
}
