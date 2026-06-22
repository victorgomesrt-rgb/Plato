"use client";

import { useState, useTransition } from "react";
import { Send } from "lucide-react";
import { checkSlug, provisionClient, type SlugCheck } from "../actions";

const PLANS = [
  { value: "starter", name: "Starter", price: "$99", desc: "On-site capture. QR stand." },
  { value: "growth", name: "Growth", price: "$249", desc: "Full video menu. Stickers + decal." },
  { value: "premium", name: "Premium", price: "$499", desc: "Everything. Quarterly re-shoot." },
];

function suggestSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export function NewClientForm() {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [plan, setPlan] = useState("growth");
  const [currency, setCurrency] = useState("USD");
  const [email, setEmail] = useState("");
  const [slugState, setSlugState] = useState<SlugCheck | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function onName(v: string) {
    setName(v);
    if (!slug || slug === suggestSlug(name)) { const s = suggestSlug(v); setSlug(s); void verifySlug(s); }
  }
  async function verifySlug(s: string) { setSlugState(s ? await checkSlug(s) : null); }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);
    start(async () => {
      const res = await provisionClient({ name, slug, plan, email, currency });
      if (res.ok) {
        setResult(`✓ Created /${res.slug}. ${res.ownerExisted ? "Linked to the owner's existing account." : "Invite sent to set their password."}`);
        setName(""); setSlug(""); setEmail(""); setSlugState(null);
      } else setResult(`✗ ${res.error}`);
    });
  }

  const slugOk = slugState?.available === true;
  const field = "h-11 w-full rounded-btn border border-line bg-surface px-3 text-sm text-ink outline-none focus:border-accent";

  return (
    <form onSubmit={onSubmit} className="mt-5 max-w-2xl rounded-card border border-line bg-surface p-6">
      <label className="block text-sm font-medium text-ink">Restaurant name
        <input required value={name} onChange={(e) => onName(e.target.value)} placeholder="e.g. Brisa" className={`mt-1 ${field}`} />
      </label>

      <label className="mt-4 block text-sm font-medium text-ink">Page address
        <div className="mt-1 flex h-11 items-center rounded-btn border border-line bg-surface px-3 focus-within:border-accent">
          <span className="text-sm text-muted">platodigital.io/</span>
          <input required value={slug} onChange={(e) => { const s = e.target.value.toLowerCase(); setSlug(s); void verifySlug(s); }} placeholder="brisa" className="flex-1 bg-transparent text-sm text-ink outline-none" />
        </div>
        {slugState?.reason && <span className={`mt-1 block text-xs ${slugOk ? "text-sea" : "text-accent-deep"}`}>{slugState.reason}</span>}
        {slugOk && !slugState?.reason && <span className="mt-1 block text-xs text-sea">Available</span>}
      </label>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-ink">Owner email
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="owner@restaurant.com" className={`mt-1 ${field}`} />
        </label>
        <div>
          <span className="block text-sm font-medium text-ink">Base currency</span>
          <div className="mt-1 flex gap-2">
            {["USD", "AWG"].map((c) => (
              <button key={c} type="button" onClick={() => setCurrency(c)}
                className={`h-11 flex-1 rounded-btn text-sm font-semibold ${currency === c ? "bg-accent text-white" : "border border-line bg-surface text-ink hover:border-ink/30"}`}>{c}</button>
            ))}
          </div>
        </div>
      </div>

      <span className="mt-4 block text-sm font-medium text-ink">Plan</span>
      <div className="mt-1 grid gap-2 sm:grid-cols-3">
        {PLANS.map((p) => {
          const on = plan === p.value;
          return (
            <button type="button" key={p.value} onClick={() => setPlan(p.value)}
              className={`rounded-card border p-3 text-left transition ${on ? "border-accent bg-accent/5 ring-1 ring-accent" : "border-line hover:border-ink/30"}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-ink">{p.name}</span>
                <span className={`grid h-4 w-4 place-items-center rounded-full border ${on ? "border-accent" : "border-line"}`}>{on && <span className="h-2 w-2 rounded-full bg-accent" />}</span>
              </div>
              <p className="text-lg font-bold text-ink">{p.price}<span className="text-xs font-normal text-muted">/mo</span></p>
              <p className="text-xs text-muted">{p.desc}</p>
            </button>
          );
        })}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
        <p className="max-w-sm text-xs text-muted">No password is created. The owner gets a secure set-password link by email, plus a magic-link sign in.</p>
        <button type="submit" disabled={pending || slugState?.available === false}
          className="inline-flex items-center gap-2 rounded-btn bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-deep disabled:opacity-60">
          <Send className="h-4 w-4" /> {pending ? "Creating…" : "Create client & send invite"}
        </button>
      </div>

      {result && <p className="mt-3 text-sm text-ink">{result}</p>}
    </form>
  );
}
