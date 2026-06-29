"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Star, Copy, Check } from "lucide-react";
import { toast } from "@/components/toast";
import { setReviewCard, generateReviewCode, billReviewCard } from "./review-actions";

type Res = { ok: boolean; error?: string };

export function ReviewCardPanel({
  tenantId, slug, site, reviewUrl, reviewActive, reviewPaidThrough, reviewCode,
}: {
  tenantId: string; slug: string; site: string;
  reviewUrl: string | null; reviewActive: boolean; reviewPaidThrough: string | null; reviewCode: string | null;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [url, setUrl] = useState(reviewUrl ?? "");
  const [active, setActive] = useState(reviewActive);
  const [paidThrough, setPaidThrough] = useState(reviewPaidThrough ?? "");
  const [copied, setCopied] = useState(false);

  const today = new Date().toISOString().slice(0, 10);
  const live = !!url && active && !!paidThrough && paidThrough >= today;
  const cardUrl = reviewCode ? `${site.replace(/^https?:\/\//, "")}/r/${reviewCode}` : null;

  const run = (p: Promise<Res>, msg = "Saved") =>
    start(async () => { const r = await p; if (r.ok) { toast(msg); router.refresh(); } else toast(r.error ?? "Could not save"); });

  function extendMonth() {
    const base = paidThrough && paidThrough >= today ? new Date(paidThrough) : new Date();
    base.setMonth(base.getMonth() + 1);
    setPaidThrough(base.toISOString().slice(0, 10));
  }
  function copy() {
    if (!cardUrl) return;
    navigator.clipboard.writeText(`https://${cardUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const field = "rounded-btn border border-line bg-surface px-2.5 py-1.5 text-sm text-ink outline-none focus:border-accent";

  return (
    <div className="mt-3 rounded-card border border-line bg-surface p-4 text-sm">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-display font-semibold text-ink"><Star className="h-4 w-4 text-accent" />Review Card</h2>
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${live ? "bg-emerald-100 text-emerald-700" : "bg-line text-muted"}`}>{live ? "Live" : "Paused"}</span>
      </div>
      <p className="mt-1 text-xs text-muted">Taps/scans go to the Google review page only while active and paid through today. Otherwise the link shows a paused page.</p>

      <label className="mt-3 block text-muted">Google review URL
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://search.google.com/local/writereview?placeid=…" className={`mt-1 w-full ${field}`} />
      </label>

      <div className="mt-3 flex flex-wrap items-end gap-4">
        <label className="flex items-center gap-2 text-muted">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="accent-accent" />Active
        </label>
        <label className="text-muted">Paid through
          <div className="mt-1 flex items-center gap-2">
            <input type="date" value={paidThrough} onChange={(e) => setPaidThrough(e.target.value)} className={field} />
            <button type="button" onClick={extendMonth} className="rounded-btn border border-line px-2.5 py-1.5 text-xs font-medium text-ink hover:border-accent hover:text-accent-deep">+1 month</button>
          </div>
        </label>
        <button disabled={pending} onClick={() => run(setReviewCard(tenantId, slug, { url, active, paidThrough: paidThrough || null }))}
          className="rounded-btn bg-accent px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-60">Save</button>
      </div>

      <div className="mt-3 space-y-2 border-t border-line pt-3">
        <div className="flex flex-wrap items-center gap-2">
          <button disabled={pending} onClick={() => run(billReviewCard(tenantId, slug), "Draft invoice created — send it from Billing")}
            className="rounded-btn border border-line px-3 py-1.5 text-xs font-medium text-ink hover:border-accent hover:text-accent-deep disabled:opacity-60">Bill 1 month</button>
          <span className="text-xs text-muted">Creates a draft invoice; paid-through extends a month when you mark it paid.</span>
        </div>
        {cardUrl ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted">Print this on the card / decal / NFC:</span>
            <code className="rounded-btn bg-line/40 px-2 py-1 text-xs text-ink">{cardUrl}</code>
            <button onClick={copy} className="inline-flex items-center gap-1 rounded-btn border border-line px-2 py-1 text-xs font-medium text-ink hover:border-ink/30">
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}{copied ? "Copied" : "Copy"}
            </button>
          </div>
        ) : (
          <button disabled={pending} onClick={() => run(generateReviewCode(tenantId, slug), "Review code created")}
            className="rounded-btn border border-line px-3 py-1.5 text-xs font-medium text-ink hover:border-accent hover:text-accent-deep disabled:opacity-60">Generate review code</button>
        )}
      </div>
    </div>
  );
}
