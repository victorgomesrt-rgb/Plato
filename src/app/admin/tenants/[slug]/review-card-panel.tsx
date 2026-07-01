"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Star, Copy, Check, ImagePlus } from "lucide-react";
import { toast } from "@/components/toast";
import { createClient } from "@/lib/supabase/client";
import { ReviewQr } from "./review-qr";

type Res = { ok: boolean; error?: string };

// Resize + re-encode to WebP in the browser (also strips EXIF). No server image lib — sharp's
// native binary (libvips) fails to load in a Vercel route handler.
function toWebp(file: File, max: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      const scale = Math.min(1, max / Math.max(img.width, img.height || 1));
      const w = Math.max(1, Math.round(img.width * scale)), h = Math.max(1, Math.round(img.height * scale));
      const c = document.createElement("canvas"); c.width = w; c.height = h;
      const ctx = c.getContext("2d"); if (!ctx) return reject(new Error("Canvas not supported"));
      ctx.drawImage(img, 0, 0, w, h);
      c.toBlob((bl) => (bl ? resolve(bl) : reject(new Error("Could not encode image"))), "image/webp", 0.85);
    };
    img.onerror = () => reject(new Error("Could not read image — use PNG, JPG, or WebP"));
    img.src = URL.createObjectURL(file);
  });
}

export function ReviewCardPanel({
  tenantId, slug, site, name, reviewUrl, reviewActive, reviewPaidThrough, reviewCode, logoUrl,
}: {
  tenantId: string; slug: string; site: string; name: string;
  reviewUrl: string | null; reviewActive: boolean; reviewPaidThrough: string | null; reviewCode: string | null; logoUrl: string | null;
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

  // Route Handler, not a Server Action (the actions 500'd only on Vercel).
  const post = (op: string, extra: Record<string, unknown> = {}): Promise<Res & { url?: string }> =>
    fetch(`/admin/tenants/${slug}/review`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ op, tenantId, ...extra }) })
      .then((r) => r.json() as Promise<Res & { url?: string }>)
      .catch(() => ({ ok: false, error: "Network error" }));

  const fileRef = useRef<HTMLInputElement>(null);
  const [logo, setLogo] = useState(logoUrl);
  const [uploading, setUploading] = useState(false);
  async function onLogoFile(file: File) {
    setUploading(true);
    try {
      const webp = await toWebp(file, 512);
      const up = await createClient().storage.from("item-images").upload(`${tenantId}/_logo.webp`, webp, { contentType: "image/webp", upsert: true });
      if (up.error) throw new Error(up.error.message);
      const r = await post("logo");
      if (!r.ok) throw new Error(r.error ?? "Could not save logo");
      setLogo(r.url ?? null);
      toast("Logo updated");
      router.refresh();
    } catch (e) {
      toast((e as Error).message);
    }
    setUploading(false);
  }
  function removeLogo() {
    setUploading(true);
    post("removeLogo").then((r) => { setUploading(false); if (r.ok) { setLogo(null); toast("Logo removed"); router.refresh(); } else toast(r.error ?? "Could not remove"); });
  }

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
        <button disabled={pending} onClick={() => run(post("save", { url, active, paidThrough: paidThrough || null }))}
          className="rounded-btn bg-accent px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-60">Save</button>
      </div>

      <div className="mt-3 flex items-center gap-3 border-t border-line pt-3">
        <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-lg border border-line bg-line/40">
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt="" className="h-full w-full object-contain" />
          ) : (
            <ImagePlus className="h-5 w-5 text-muted" />
          )}
        </div>
        <div className="min-w-0 text-xs text-muted">
          <p className="font-medium text-ink">Logo</p>
          <p>Used in the QR center &amp; on the review page.</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onLogoFile(f); e.target.value = ""; }} />
          <button type="button" disabled={uploading} onClick={() => fileRef.current?.click()} className="rounded-btn border border-line px-3 py-1.5 text-xs font-medium text-ink hover:border-accent hover:text-accent-deep disabled:opacity-60">{uploading ? "Uploading…" : logo ? "Change" : "Upload logo"}</button>
          {logo && <button type="button" disabled={uploading} onClick={removeLogo} className="text-xs text-muted hover:text-accent-deep">Remove</button>}
        </div>
      </div>

      <div className="mt-3 space-y-2 border-t border-line pt-3">
        <div className="flex flex-wrap items-center gap-2">
          <button disabled={pending} onClick={() => run(post("bill"), "Draft invoice created — send it from Billing")}
            className="rounded-btn border border-line px-3 py-1.5 text-xs font-medium text-ink hover:border-accent hover:text-accent-deep disabled:opacity-60">Bill 1 month</button>
          <span className="text-xs text-muted">Creates a draft invoice; paid-through extends a month when you mark it paid.</span>
        </div>
        {cardUrl ? (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted">Print this on the card / decal / NFC:</span>
              <code className="rounded-btn bg-line/40 px-2 py-1 text-xs text-ink">{cardUrl}</code>
              <button onClick={copy} className="inline-flex items-center gap-1 rounded-btn border border-line px-2 py-1 text-xs font-medium text-ink hover:border-ink/30">
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}{copied ? "Copied" : "Copy"}
              </button>
            </div>
            <ReviewQr url={`https://${cardUrl}`} name={name} logoUrl={logo} />
          </>
        ) : (
          <button disabled={pending} onClick={() => run(post("generate"), "Review code created")}
            className="rounded-btn border border-line px-3 py-1.5 text-xs font-medium text-ink hover:border-accent hover:text-accent-deep disabled:opacity-60">Generate review code</button>
        )}
      </div>
    </div>
  );
}
