"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { updateTenantInfo, processBrandImage, removeBrandImage } from "./actions";

function ImageUploader({ tenantId, kind, current, aspect }: { tenantId: string; kind: "logo" | "cover"; current: string | null; aspect: string }) {
  const router = useRouter();
  const [url, setUrl] = useState(current);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onFile(file: File) {
    setErr(null);
    setBusy(true);
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const tmpPath = `${tenantId}/_tmp/${crypto.randomUUID()}.${ext}`;
    const supabase = createClient();
    const up = await supabase.storage.from("item-images").upload(tmpPath, file, { upsert: true });
    if (up.error) { setErr(up.error.message); setBusy(false); return; }
    const res = await processBrandImage(tenantId, kind, tmpPath);
    setBusy(false);
    if (res.ok && res.data) { setUrl(res.data.url); router.refresh(); }
    else if (!res.ok) setErr(res.error);
  }

  return (
    <div>
      <div className={`relative overflow-hidden rounded-card border border-line bg-line/40 ${aspect}`}>
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full w-full place-items-center text-muted"><ImagePlus className="h-6 w-6" /></div>
        )}
        {busy && <div className="absolute inset-0 grid place-items-center bg-black/40 text-sm font-medium text-white">Uploading…</div>}
      </div>
      <div className="mt-2 flex items-center gap-3 text-sm">
        <label className="cursor-pointer font-medium text-accent hover:text-accent-deep">
          {url ? "Replace" : "Upload"}
          <input type="file" accept="image/*,.heic,.heif" className="hidden" disabled={busy}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ""; }} />
        </label>
        {url && (
          <button type="button" disabled={busy} onClick={async () => { setBusy(true); await removeBrandImage(tenantId, kind); setUrl(null); setBusy(false); router.refresh(); }}
            className="inline-flex items-center gap-1 text-muted hover:text-accent-deep"><Trash2 className="h-3.5 w-3.5" /> Remove</button>
        )}
      </div>
      {err && <p className="mt-1 text-sm text-accent-deep">{err}</p>}
    </div>
  );
}

export function PageSettingsForm({ tenantId, description, address, logoUrl, coverUrl }: {
  tenantId: string; description: string | null; address: string | null; logoUrl: string | null; coverUrl: string | null;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [desc, setDesc] = useState(description ?? "");
  const [addr, setAddr] = useState(address ?? "");
  const [msg, setMsg] = useState<string | null>(null);

  function save(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    start(async () => {
      const r = await updateTenantInfo(tenantId, { description: desc, address: addr });
      setMsg(r.ok ? "Saved." : r.error);
      if (r.ok) router.refresh();
    });
  }

  return (
    <div className="mt-6 space-y-6">
      <section className="rounded-card border border-line bg-surface p-5">
        <h2 className="font-display text-base font-semibold text-ink">Logo & cover</h2>
        <p className="mt-1 text-sm text-muted">Shown at the top of your menu. We optimize images automatically.</p>
        <div className="mt-4 grid gap-5 sm:grid-cols-[160px_1fr]">
          <div>
            <p className="mb-1.5 text-sm font-medium text-ink">Logo</p>
            <ImageUploader tenantId={tenantId} kind="logo" current={logoUrl} aspect="aspect-square w-40" />
          </div>
          <div>
            <p className="mb-1.5 text-sm font-medium text-ink">Cover</p>
            <ImageUploader tenantId={tenantId} kind="cover" current={coverUrl} aspect="aspect-[16/9]" />
          </div>
        </div>
      </section>

      <form onSubmit={save} className="rounded-card border border-line bg-surface p-5">
        <h2 className="font-display text-base font-semibold text-ink">Details</h2>
        <label className="mt-3 block text-sm font-medium text-ink">Description
          <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} placeholder="Beachfront Caribbean kitchen — fresh catch, island classics."
            className="mt-1 w-full rounded-card border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-accent" />
        </label>
        <label className="mt-3 block text-sm font-medium text-ink">Address
          <input value={addr} onChange={(e) => setAddr(e.target.value)} placeholder="J.E. Irausquin Blvd 230, Palm Beach, Aruba"
            className="mt-1 h-11 w-full rounded-btn border border-line px-3 text-sm text-ink outline-none focus:border-accent" />
          <span className="mt-1 block text-xs text-muted">This drives your Directions button and the map on your page.</span>
        </label>
        {msg && <p className="mt-2 text-sm text-muted">{msg}</p>}
        <button type="submit" disabled={pending} className="mt-4 rounded-btn bg-accent px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
          {pending ? "Saving…" : "Save details"}
        </button>
      </form>
    </div>
  );
}
