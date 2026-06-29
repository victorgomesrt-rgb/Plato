"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { provisionReviewClient } from "../actions";

export function ReviewClientForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setErr("Enter the restaurant name"); return; }
    setErr(null);
    start(async () => {
      const r = await provisionReviewClient({ name });
      if (r.ok) router.push(`/admin/tenants/${r.slug}`);
      else setErr(r.error);
    });
  }

  return (
    <form onSubmit={submit} className="mt-5 max-w-2xl rounded-card border border-line bg-surface p-6">
      <h2 className="flex items-center gap-2 font-display text-base font-semibold text-ink"><Star className="h-4 w-4 text-accent" />Review-only client</h2>
      <p className="mt-1 text-sm text-muted">A Google-review redirect card with no menu page and no owner login. You set up the card on the next screen.</p>
      <div className="mt-4 flex flex-wrap items-end gap-3">
        <label className="min-w-[220px] flex-1 text-sm font-medium text-ink">Restaurant name
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Zeerovers" className="mt-1 h-11 w-full rounded-btn border border-line bg-surface px-3 text-sm text-ink outline-none focus:border-accent" />
        </label>
        <button type="submit" disabled={pending} className="inline-flex h-11 items-center gap-2 rounded-btn bg-accent px-5 text-sm font-semibold text-white hover:bg-accent-deep disabled:opacity-60">{pending ? "Creating…" : "Create review client"}</button>
      </div>
      {err && <p className="mt-2 text-sm text-accent-deep">{err}</p>}
    </form>
  );
}
