"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Play } from "lucide-react";
import { toast } from "@/components/toast";
import { tagLabel } from "@/lib/tags";
import { setItemAvailable, setItemPrice } from "./actions";

export type QItem = {
  id: string; name: string; description: string | null; price: number | null; price_text: string | null;
  is_available: boolean; image_url: string | null; hasVideo: boolean; tags: string[]; plays: number; category_id: string | null;
};
export type QCat = { id: string; name: string; nameEs: string | null };

// One subtle pill per item (the mockup shows a single badge). Marketing tags win,
// then dietary. Colors map to the Plato palette.
const TAG_PILL: Record<string, string> = {
  popular: "bg-accent/10 text-accent-deep",
  new: "bg-sea/10 text-sea",
  spicy: "bg-red-100 text-red-700",
  vegan: "bg-emerald-100 text-emerald-700",
  vegetarian: "bg-emerald-100 text-emerald-700",
  gluten_free: "bg-citrus/25 text-ink",
  dairy_free: "bg-citrus/25 text-ink",
  raw: "bg-sea/10 text-sea",
};
const TAG_PRIORITY = ["popular", "new", "spicy", "vegan", "vegetarian", "gluten_free", "dairy_free", "raw"];
function pickTag(tags: string[]): string | null {
  for (const t of TAG_PRIORITY) if (tags.includes(t)) return t;
  return tags[0] ?? null;
}

function PriceField({ item, currency, readOnly }: { item: QItem; currency: string; readOnly: boolean }) {
  const router = useRouter();
  const [val, setVal] = useState(item.price != null ? String(item.price) : "");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (readOnly) return;
    const next = val.trim() === "" ? null : Number(val);
    if (next != null && Number.isNaN(next)) { setVal(item.price != null ? String(item.price) : ""); return; }
    if (next === item.price) return;
    setSaving(true);
    const r = await setItemPrice(item.id, next);
    setSaving(false);
    if (r.ok) { toast("Price updated"); router.refresh(); }
  }

  return (
    <div className={`flex h-11 w-24 items-center gap-1 rounded-btn border px-2.5 ${saving ? "border-accent" : "border-line"} ${readOnly ? "opacity-60" : "focus-within:border-accent"}`}>
      <span className="text-sm text-muted">{currency === "USD" ? "$" : currency}</span>
      <input
        inputMode="decimal"
        disabled={readOnly}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
        placeholder={item.price_text || "-"}
        className="w-full bg-transparent text-sm font-semibold text-ink outline-none"
      />
    </div>
  );
}

function AvailabilityToggle({ item, readOnly }: { item: QItem; readOnly: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const available = item.is_available;
  return (
    <div className="flex items-center gap-2">
      <span className={`hidden text-sm font-medium sm:inline ${available ? "text-emerald-700" : "text-accent-deep"}`}>{available ? "Available" : "Sold out"}</span>
      <button
        disabled={pending || readOnly}
        onClick={() => start(async () => { const r = await setItemAvailable(item.id, !available); if (r.ok) { toast(available ? "Marked sold out" : "Marked available"); router.refresh(); } })}
        className="grid h-11 w-11 place-items-center disabled:opacity-60"
        aria-label={available ? "Available, tap to mark sold out" : "Sold out, tap to mark available"}
      >
        <span className={`relative block h-6 w-11 rounded-full transition ${available ? "bg-emerald-500" : "bg-line"}`}>
          <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${available ? "left-[22px]" : "left-0.5"}`} />
        </span>
      </button>
    </div>
  );
}

function ItemRow({ item, currency, readOnly }: { item: QItem; currency: string; readOnly: boolean }) {
  const tag = pickTag(item.tags);
  return (
    <li className="flex items-center gap-4 px-4 py-3.5">
      <span className="relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-line">
        {item.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.image_url} alt="" className="h-full w-full object-cover" />
        )}
        {item.hasVideo && (
          <span className="absolute inset-0 grid place-items-center bg-black/25">
            <Play className="h-4 w-4 fill-white text-white" />
          </span>
        )}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className={`truncate font-semibold ${item.is_available ? "text-ink" : "text-muted line-through"}`}>{item.name}</span>
          {tag && <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${TAG_PILL[tag] ?? "bg-line text-ink"}`}>{tagLabel(tag, "en")}</span>}
        </div>
        {item.description && <p className="truncate text-sm text-muted">{item.description}</p>}
      </div>

      <div className="hidden shrink-0 text-center sm:block">
        <p className="font-display font-bold text-ink">{item.plays.toLocaleString()}</p>
        <p className="text-xs text-muted">plays · 30d</p>
      </div>

      <PriceField item={item} currency={currency} readOnly={readOnly} />
      <AvailabilityToggle item={item} readOnly={readOnly} />
    </li>
  );
}

export function MenuQuickEdit({ categories, items, currency, readOnly = false }: { categories: QCat[]; items: QItem[]; currency: string; readOnly?: boolean }) {
  const byCat = (cid: string) => items.filter((i) => i.category_id === cid);
  const uncategorized = items.filter((i) => !i.category_id);
  const groups = [
    ...categories.map((c) => ({ id: c.id, name: c.name, nameEs: c.nameEs, list: byCat(c.id) })),
    ...(uncategorized.length ? [{ id: "_", name: "Other", nameEs: null, list: uncategorized }] : []),
  ].filter((g) => g.list.length > 0);

  return (
    <div className="mt-5 space-y-5">
      {groups.map((g) => (
        <section key={g.id} className="overflow-hidden rounded-card border border-line bg-surface">
          <div className="flex items-center justify-between gap-3 border-b border-line bg-[#FAF8F4] px-4 py-3">
            <h2 className="font-display text-base font-bold text-ink">
              {g.name} <span className="ml-1 text-sm font-normal text-muted">{g.list.length} item{g.list.length === 1 ? "" : "s"}</span>
            </h2>
            {g.nameEs && <span className="text-sm text-muted">{g.nameEs}</span>}
          </div>
          <ul className="divide-y divide-line">
            {g.list.map((item) => <ItemRow key={item.id} item={item} currency={currency} readOnly={readOnly} />)}
          </ul>
        </section>
      ))}
    </div>
  );
}
