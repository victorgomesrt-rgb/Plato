"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { DAY_KEYS } from "@/lib/hours";
import { updateTenantInfo, processBrandImage, removeBrandImage } from "./actions";

const field = "mt-1 h-11 w-full rounded-btn border border-line bg-surface px-3 text-sm text-ink outline-none focus:border-accent";
const DAY_LABEL: Record<string, string> = {
  sun: "Sunday", mon: "Monday", tue: "Tuesday", wed: "Wednesday", thu: "Thursday", fri: "Friday", sat: "Saturday",
};

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

type Props = {
  tenantId: string;
  description: string | null; address: string | null; logoUrl: string | null; coverUrl: string | null;
  phone: string | null; whatsapp: string | null; lat: number | null; lng: number | null;
  hours: Record<string, [string, string] | null> | null;
  reservationUrl: string | null; websiteUrl: string | null; instagram: string | null;
  wifiSsid: string | null; wifiPassword: string | null;
};

export function PageSettingsForm(p: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [f, setF] = useState({
    description: p.description ?? "", address: p.address ?? "",
    phone: p.phone ?? "", whatsapp: p.whatsapp ?? "",
    reservationUrl: p.reservationUrl ?? "", websiteUrl: p.websiteUrl ?? "",
    instagram: p.instagram ?? "", wifiSsid: p.wifiSsid ?? "", wifiPassword: p.wifiPassword ?? "",
    lat: p.lat != null ? String(p.lat) : "", lng: p.lng != null ? String(p.lng) : "",
  });
  const set = (k: keyof typeof f, v: string) => setF((prev) => ({ ...prev, [k]: v }));

  const [hours, setHours] = useState<Record<string, { open: string; close: string }>>(() => {
    const init: Record<string, { open: string; close: string }> = {};
    for (const d of DAY_KEYS) { const r = p.hours?.[d]; init[d] = { open: r?.[0] ?? "", close: r?.[1] ?? "" }; }
    return init;
  });
  const setDay = (d: string, part: "open" | "close", v: string) =>
    setHours((prev) => ({ ...prev, [d]: { ...prev[d], [part]: v } }));

  function save(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const hoursPayload: Record<string, [string, string] | null> = {};
    for (const d of DAY_KEYS) { const h = hours[d]; hoursPayload[d] = h.open && h.close ? [h.open, h.close] : null; }
    start(async () => {
      const r = await updateTenantInfo(p.tenantId, { ...f, hours: hoursPayload });
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
            <ImageUploader tenantId={p.tenantId} kind="logo" current={p.logoUrl} aspect="aspect-square w-40" />
          </div>
          <div>
            <p className="mb-1.5 text-sm font-medium text-ink">Cover</p>
            <ImageUploader tenantId={p.tenantId} kind="cover" current={p.coverUrl} aspect="aspect-[16/9]" />
          </div>
        </div>
      </section>

      <form onSubmit={save} className="space-y-6">
        <section className="rounded-card border border-line bg-surface p-5">
          <h2 className="font-display text-base font-semibold text-ink">Details</h2>
          <label className="mt-3 block text-sm font-medium text-ink">Description
            <textarea value={f.description} onChange={(e) => set("description", e.target.value)} rows={3}
              placeholder="Beachfront Caribbean kitchen, fresh catch, island classics."
              className="mt-1 w-full rounded-card border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-accent" />
          </label>
          <label className="mt-3 block text-sm font-medium text-ink">Address
            <input value={f.address} onChange={(e) => set("address", e.target.value)} placeholder="J.E. Irausquin Blvd 230, Palm Beach, Aruba" className={field} />
            <span className="mt-1 block text-xs text-muted">Drives your Directions button and the map on your page.</span>
          </label>
        </section>

        <section className="rounded-card border border-line bg-surface p-5">
          <h2 className="font-display text-base font-semibold text-ink">Contact & buttons</h2>
          <p className="mt-1 text-sm text-muted">Each field you fill becomes a button on your menu&apos;s action bar.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-medium text-ink">Phone (Call button)
              <input value={f.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+297 586 1234" className={field} />
            </label>
            <label className="text-sm font-medium text-ink">WhatsApp number
              <input value={f.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} placeholder="+297 560 1234" className={field} />
            </label>
            <label className="text-sm font-medium text-ink">Reservation link
              <input value={f.reservationUrl} onChange={(e) => set("reservationUrl", e.target.value)} placeholder="https://…" className={field} />
            </label>
            <label className="text-sm font-medium text-ink">Website
              <input value={f.websiteUrl} onChange={(e) => set("websiteUrl", e.target.value)} placeholder="https://…" className={field} />
            </label>
            <label className="text-sm font-medium text-ink">Instagram
              <input value={f.instagram} onChange={(e) => set("instagram", e.target.value)} placeholder="@yourrestaurant" className={field} />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm font-medium text-ink">WiFi network
                <input value={f.wifiSsid} onChange={(e) => set("wifiSsid", e.target.value)} placeholder="Network name" className={field} />
              </label>
              <label className="text-sm font-medium text-ink">WiFi password
                <input value={f.wifiPassword} onChange={(e) => set("wifiPassword", e.target.value)} placeholder="Optional" className={field} />
              </label>
            </div>
          </div>
        </section>

        <section className="rounded-card border border-line bg-surface p-5">
          <h2 className="font-display text-base font-semibold text-ink">Map pin</h2>
          <p className="mt-1 text-sm text-muted">Optional. Exact coordinates place the pin precisely; otherwise the map uses your address. In Google Maps, right-click your spot to copy the latitude and longitude.</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-medium text-ink">Latitude
              <input value={f.lat} onChange={(e) => set("lat", e.target.value)} inputMode="decimal" placeholder="12.5563" className={field} />
            </label>
            <label className="text-sm font-medium text-ink">Longitude
              <input value={f.lng} onChange={(e) => set("lng", e.target.value)} inputMode="decimal" placeholder="-70.0426" className={field} />
            </label>
          </div>
        </section>

        <section className="rounded-card border border-line bg-surface p-5">
          <h2 className="font-display text-base font-semibold text-ink">Opening hours</h2>
          <p className="mt-1 text-sm text-muted">Leave a day blank to show it as closed. Times are in Aruba time.</p>
          <div className="mt-3 space-y-2">
            {DAY_KEYS.map((d) => {
              const closed = !hours[d].open || !hours[d].close;
              return (
                <div key={d} className="flex items-center gap-3">
                  <span className="w-24 text-sm text-ink">{DAY_LABEL[d]}</span>
                  <input type="time" value={hours[d].open} onChange={(e) => setDay(d, "open", e.target.value)}
                    className="h-10 rounded-btn border border-line bg-surface px-2 text-sm text-ink outline-none focus:border-accent" />
                  <span className="text-muted">–</span>
                  <input type="time" value={hours[d].close} onChange={(e) => setDay(d, "close", e.target.value)}
                    className="h-10 rounded-btn border border-line bg-surface px-2 text-sm text-ink outline-none focus:border-accent" />
                  {closed && <span className="text-xs text-muted">Closed</span>}
                </div>
              );
            })}
          </div>
        </section>

        <div className="flex items-center gap-3">
          <button type="submit" disabled={pending} className="rounded-btn bg-accent px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
            {pending ? "Saving…" : "Save changes"}
          </button>
          {msg && <p className="text-sm text-muted">{msg}</p>}
        </div>
      </form>
    </div>
  );
}
