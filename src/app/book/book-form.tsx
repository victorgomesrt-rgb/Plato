"use client";

import { useState, useTransition } from "react";
import { Check, Video, Camera, Rocket } from "lucide-react";
import { submitBooking } from "./actions";

const SIZES = ["Under 20", "20-40", "40-60", "60+"];
const TIMING = ["This week", "I'm flexible"];
const PLANS = [
  { key: "Starter", price: "$99", note: "Cafés & casual" },
  { key: "Growth", price: "$249", note: "Busy restaurants" },
  { key: "Premium", price: "$499", note: "Resort & fine dining" },
];
const field = "mt-1 w-full rounded-btn border border-line bg-surface px-3 py-2.5 text-ink outline-none focus:border-accent";

export function BookForm() {
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [f, setF] = useState({
    restaurant: "", area: "", cuisine: "", name: "", phone: "", email: "",
    menuSize: "20-40", plan: "Growth", timing: "This week", notes: "", company: "",
  });
  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    startTransition(async () => {
      const r = await submitBooking(f);
      if (r.ok) setDone(true);
      else setErr(r.error);
    });
  }

  if (done)
    return (
      <div className="rounded-card bg-surface p-8 text-center text-ink">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-sea/10"><Check className="h-6 w-6 text-sea" /></div>
        <h3 className="mt-3 font-display text-xl font-semibold">Request received</h3>
        <p className="mt-1 text-muted">We&apos;ll reply to confirm a capture time, usually the same day.</p>
      </div>
    );

  const selectedPlan = PLANS.find((p) => p.key === f.plan);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <form onSubmit={submit} className="rounded-card bg-surface p-6 text-ink">
        <input
          type="text" name="company" tabIndex={-1} autoComplete="off" aria-hidden="true"
          value={f.company} onChange={(e) => set("company", e.target.value)}
          className="absolute left-[-9999px] h-0 w-0 overflow-hidden" />
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">Your restaurant</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="text-sm">Restaurant name<input required value={f.restaurant} onChange={(e) => set("restaurant", e.target.value)} placeholder="e.g. Brisa" className={field} /></label>
          <label className="text-sm">Area<input value={f.area} onChange={(e) => set("area", e.target.value)} placeholder="Eagle Beach" className={field} /></label>
          <label className="text-sm">Cuisine<input value={f.cuisine} onChange={(e) => set("cuisine", e.target.value)} placeholder="Seafood" className={field} /></label>
          <label className="text-sm">Menu size
            <select value={f.menuSize} onChange={(e) => set("menuSize", e.target.value)} className={field}>
              {SIZES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </label>
        </div>

        <p className="mt-5 text-sm font-semibold uppercase tracking-wide text-accent">How to reach you</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="text-sm">Your name<input value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="Full name" className={field} /></label>
          <label className="text-sm">WhatsApp / phone<input value={f.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+297 …" className={field} /></label>
          <label className="text-sm sm:col-span-2">Email<input required type="email" value={f.email} onChange={(e) => set("email", e.target.value)} placeholder="owner@restaurant.com" className={field} /></label>
        </div>

        <p className="mt-5 text-sm font-semibold uppercase tracking-wide text-accent">Plan you&apos;re eyeing</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {PLANS.map((p) => {
            const on = f.plan === p.key;
            return (
              <button type="button" key={p.key} onClick={() => set("plan", p.key)}
                className={`rounded-card border p-3 text-left transition ${on ? "border-accent bg-accent/5 ring-1 ring-accent" : "border-line hover:border-ink/30"}`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-ink">{p.key}</span>
                  {on && <Check className="h-4 w-4 text-accent" />}
                </div>
                <p className="text-lg font-bold text-ink">{p.price}<span className="text-xs font-normal text-muted">/mo</span></p>
                <p className="text-xs text-muted">{p.note}</p>
              </button>
            );
          })}
        </div>

        <p className="mt-5 text-sm font-semibold uppercase tracking-wide text-accent">When works for the shoot?</p>
        <div className="mt-3 flex gap-2">
          {TIMING.map((tm) => (
            <button type="button" key={tm} onClick={() => set("timing", tm)}
              className={`rounded-btn px-4 py-2 text-sm font-medium transition ${f.timing === tm ? "bg-accent text-white" : "border border-line text-ink hover:border-ink/30"}`}>
              {tm}
            </button>
          ))}
        </div>

        <label className="mt-5 block text-sm font-semibold uppercase tracking-wide text-accent">Anything else?
          <textarea value={f.notes} onChange={(e) => set("notes", e.target.value)} rows={3} placeholder="Signature dishes, busy hours to avoid, parking…"
            className="mt-2 w-full rounded-card border border-line bg-surface px-3 py-2.5 text-sm font-normal normal-case text-ink outline-none focus:border-accent" />
        </label>

        {err && <p className="mt-3 text-sm text-accent-deep">{err}</p>}
        <button type="submit" disabled={pending} className="mt-5 w-full rounded-btn bg-accent px-4 py-3 font-semibold text-white disabled:opacity-60">
          {pending ? "Sending…" : "Book my demo"}
        </button>
        <p className="mt-2 text-center text-xs text-muted">No contracts · cancel anytime · one-time on-site capture fee applies.</p>
      </form>

      <aside className="space-y-4">
        <div className="rounded-card border border-white/10 bg-white/5 p-6">
          <p className="font-display text-lg font-semibold">What happens next</p>
          <ul className="mt-4 space-y-4 text-sm text-white/80">
            <li className="flex gap-3"><Rocket className="h-5 w-5 shrink-0 text-accent" /><span><strong className="text-white">We confirm a time</strong><br />A quick reply to lock the capture visit, usually same day.</span></li>
            <li className="flex gap-3"><Camera className="h-5 w-5 shrink-0 text-accent" /><span><strong className="text-white">We come and film</strong><br />Our crew shoots every dish while you keep serving.</span></li>
            <li className="flex gap-3"><Video className="h-5 w-5 shrink-0 text-accent" /><span><strong className="text-white">You go live</strong><br />Built, translated, QR placed, live in a day.</span></li>
          </ul>
        </div>
        {selectedPlan && (
          <div className="rounded-card border border-accent/30 bg-accent/10 p-5">
            <p className="text-xs uppercase tracking-wide text-white/60">Your selection</p>
            <p className="mt-1 font-display text-xl font-bold text-white">{selectedPlan.key} · {selectedPlan.price}<span className="text-sm font-normal text-white/60">/mo</span></p>
            <p className="text-sm text-white/70">{selectedPlan.note}</p>
          </div>
        )}
      </aside>
    </div>
  );
}
