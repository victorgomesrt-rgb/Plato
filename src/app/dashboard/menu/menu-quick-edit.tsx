"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/toast";
import { setItemAvailable, setItemPrice } from "./actions";

export type QItem = { id: string; name: string; price: number | null; price_text: string | null; is_available: boolean; category_id: string | null };
export type QCat = { id: string; name: string };

function PriceField({ item, currency }: { item: QItem; currency: string }) {
  const router = useRouter();
  const [val, setVal] = useState(item.price != null ? String(item.price) : "");
  const [saving, setSaving] = useState(false);

  async function save() {
    const next = val.trim() === "" ? null : Number(val);
    if (next != null && Number.isNaN(next)) { setVal(item.price != null ? String(item.price) : ""); return; }
    if (next === item.price) return;
    setSaving(true);
    const r = await setItemPrice(item.id, next);
    setSaving(false);
    if (r.ok) { toast("Price updated"); router.refresh(); }
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-muted">{currency}</span>
      <input
        inputMode="decimal"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
        placeholder={item.price_text || "—"}
        className={`h-11 w-20 rounded-btn border px-2 text-sm text-ink outline-none focus:border-accent ${saving ? "border-accent" : "border-line"}`}
      />
    </div>
  );
}

function SoldOutToggle({ item }: { item: QItem }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const available = item.is_available;
  return (
    <button
      disabled={pending}
      onClick={() => start(async () => { const r = await setItemAvailable(item.id, !available); if (r.ok) { toast(available ? "Marked sold out" : "Marked available"); router.refresh(); } })}
      className="grid h-11 w-11 place-items-center disabled:opacity-60"
      aria-label={available ? "Available — tap to mark sold out" : "Sold out — tap to mark available"}
    >
      <span className={`relative block h-6 w-11 rounded-full transition ${available ? "bg-sea" : "bg-line"}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${available ? "left-[22px]" : "left-0.5"}`} />
      </span>
    </button>
  );
}

export function MenuQuickEdit({ categories, items, currency }: { categories: QCat[]; items: QItem[]; currency: string }) {
  const byCat = (cid: string) => items.filter((i) => i.category_id === cid);
  const uncategorized = items.filter((i) => !i.category_id);

  return (
    <div className="mt-6 space-y-6">
      {[...categories.map((c) => ({ id: c.id, name: c.name, list: byCat(c.id) })), ...(uncategorized.length ? [{ id: "_", name: "Other", list: uncategorized }] : [])]
        .filter((g) => g.list.length > 0)
        .map((g) => (
          <section key={g.id}>
            <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-muted">{g.name}</h2>
            <ul className="mt-2 divide-y divide-line rounded-card border border-line bg-surface">
              {g.list.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <span className={`min-w-0 flex-1 truncate text-sm ${item.is_available ? "text-ink" : "text-muted line-through"}`}>{item.name}</span>
                  <PriceField item={item} currency={currency} />
                  <div className="flex items-center gap-2">
                    <span className="hidden text-xs text-muted sm:inline">{item.is_available ? "Available" : "Sold out"}</span>
                    <SoldOutToggle item={item} />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
    </div>
  );
}
