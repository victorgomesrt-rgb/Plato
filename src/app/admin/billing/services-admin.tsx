"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { saveService, deleteService } from "./actions";
import type { Service } from "./billing-admin";

const UNITS = ["each", "month", "one-time"];
const field = "rounded-btn border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent";

function ServiceRow({ svc }: { svc: Service }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [name, setName] = useState(svc.name);
  const [description, setDescription] = useState(svc.description);
  const [unit, setUnit] = useState(svc.unit);
  const [price, setPrice] = useState(String(svc.unit_price));
  const [active, setActive] = useState(svc.active);
  const [err, setErr] = useState<string | null>(null);

  const dirty = name !== svc.name || description !== svc.description || unit !== svc.unit || (Number(price) || 0) !== svc.unit_price || active !== svc.active;

  const save = () => start(async () => {
    const r = await saveService({ id: svc.id, name, description, unitPrice: Number(price) || 0, unit, active });
    setErr(r.ok ? null : r.error); if (r.ok) router.refresh();
  });
  const del = () => {
    if (!window.confirm(`Remove "${svc.name}"? Past invoices keep their line items.`)) return;
    start(async () => { const r = await deleteService(svc.id); setErr(r.ok ? null : r.error); if (r.ok) router.refresh(); });
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 rounded-btn border border-line p-2 ${active ? "bg-[#FAF8F4]" : "bg-line/20 opacity-70"}`}>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" aria-label="Service name" className={`${field} min-w-0 flex-1`} />
      <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Invoice description" aria-label="Invoice description" className={`${field} min-w-0 flex-1`} />
      <select value={unit} onChange={(e) => setUnit(e.target.value)} aria-label="Unit" className={`${field} w-28`}>
        {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
      </select>
      <div className="relative">
        <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted">$</span>
        <input value={price} onChange={(e) => setPrice(e.target.value)} inputMode="decimal" aria-label="Unit price" className={`${field} w-24 pl-5`} />
      </div>
      <label className="flex items-center gap-1.5 text-xs text-muted" title="Show in the invoice charge picker">
        <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="accent-accent" />Active
      </label>
      <button disabled={pending || !dirty} onClick={save} className="rounded-btn bg-ink px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40">Save</button>
      <button disabled={pending} onClick={del} aria-label="Remove service" className="grid h-8 w-8 place-items-center rounded-btn text-muted hover:bg-accent/10 hover:text-accent-deep"><Trash2 className="h-4 w-4" /></button>
      {err && <p className="w-full text-xs text-accent-deep">{err}</p>}
    </div>
  );
}

function AddService() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [unit, setUnit] = useState("each");
  const [price, setPrice] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const add = () => start(async () => {
    const r = await saveService({ name, description, unitPrice: Number(price) || 0, unit });
    setErr(r.ok ? null : r.error);
    if (r.ok) { setName(""); setDescription(""); setUnit("each"); setPrice(""); router.refresh(); }
  });

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-btn border border-dashed border-line p-2">
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="New service name" aria-label="New service name" className={`${field} min-w-0 flex-1`} />
      <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Invoice description" aria-label="New invoice description" className={`${field} min-w-0 flex-1`} />
      <select value={unit} onChange={(e) => setUnit(e.target.value)} aria-label="Unit" className={`${field} w-28`}>
        {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
      </select>
      <div className="relative">
        <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted">$</span>
        <input value={price} onChange={(e) => setPrice(e.target.value)} inputMode="decimal" aria-label="New unit price" placeholder="0" className={`${field} w-24 pl-5`} />
      </div>
      <button disabled={pending || !name.trim()} onClick={add} className="rounded-btn bg-accent px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-40">{pending ? "Adding…" : "Add service"}</button>
      {err && <p className="w-full text-xs text-accent-deep">{err}</p>}
    </div>
  );
}

export function ServicesAdmin({ services }: { services: Service[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-base font-semibold text-ink">Services &amp; prices</h2>
        <button onClick={() => setOpen((v) => !v)} className="rounded-btn border border-line bg-surface px-3 py-1.5 text-sm font-medium text-ink hover:border-ink/30">{open ? "Close" : "Manage services & prices"}</button>
      </div>
      {open && (
        <div className="mt-3 space-y-2 rounded-card border border-line bg-surface p-4">
          <p className="text-xs text-muted">Default add-on prices used when building an invoice. Subscription and setup fees come from the plan, not here.</p>
          {services.map((s) => <ServiceRow key={s.id} svc={s} />)}
          {services.length === 0 && <p className="rounded-btn border border-dashed border-line px-3 py-4 text-center text-sm text-muted">No services yet. Add one below.</p>}
          <div className="border-t border-line pt-3"><AddService /></div>
        </div>
      )}
    </div>
  );
}
