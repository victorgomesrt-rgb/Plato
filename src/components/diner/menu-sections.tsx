"use client";

import type { Item } from "@/lib/menu";
import { CardMedia } from "./card-media";

// Shared render props for every template's item layout. The same data, different
// presentation (design.md §3a). l/price are closures from the page; track wires video_play.
export type SectionView = {
  cdnHost: string;
  accent: string;
  soldOut: string;
  l: (base: string | null, i18n: Record<string, string> | null) => string;
  price: (it: Item) => string;
  onOpen: (it: Item) => void;
  onPlay: (it: Item) => void;
};

function Tags({ tags }: { tags: string[] | null }) {
  if (!tags?.length) return null;
  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {tags.map((tag) => (
        <span key={tag} className="rounded-full bg-line px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-muted">
          {tag}
        </span>
      ))}
    </div>
  );
}

/* ---------- Grid: two-column cards ---------- */
export function GridList({ items, v }: { items: Item[]; v: SectionView }) {
  return (
    <div className="mt-3 grid grid-cols-2 gap-3">
      {items.map((it) => (
        <button
          key={it.id}
          onClick={() => v.onOpen(it)}
          className={`overflow-hidden rounded-card border border-line text-left ${it.is_available ? "" : "opacity-50"}`}
        >
          <CardMedia it={it} cdnHost={v.cdnHost} accent={v.accent} onPlay={() => v.onPlay(it)} className="aspect-square w-full object-cover" />
          <div className="p-2">
            <p className="text-sm font-medium text-ink">{v.l(it.name, it.name_i18n)}</p>
            <p className="text-sm font-semibold" style={{ color: v.accent }}>{v.price(it)}</p>
            {!it.is_available && <p className="text-xs text-muted">{v.soldOut}</p>}
            <Tags tags={it.tags} />
          </div>
        </button>
      ))}
    </div>
  );
}

/* ---------- Classic: single-column list with small thumbnail ---------- */
export function ClassicList({ items, v }: { items: Item[]; v: SectionView }) {
  return (
    <ul className="mt-3 divide-y divide-line">
      {items.map((it) => (
        <li key={it.id}>
          <button
            onClick={() => v.onOpen(it)}
            className={`flex w-full items-start gap-3 py-3 text-left ${it.is_available ? "" : "opacity-50"}`}
          >
            <CardMedia it={it} cdnHost={v.cdnHost} accent={v.accent} onPlay={() => v.onPlay(it)} className="h-16 w-16 shrink-0 rounded-md object-cover" />
            <div className="flex-1">
              <p className="font-medium text-ink">{v.l(it.name, it.name_i18n)}</p>
              {v.l(it.description, it.description_i18n) && (
                <p className="text-sm text-muted">{v.l(it.description, it.description_i18n)}</p>
              )}
              {!it.is_available && <p className="text-xs text-muted">{v.soldOut}</p>}
              <Tags tags={it.tags} />
            </div>
            <span className="shrink-0 font-semibold" style={{ color: v.accent }}>{v.price(it)}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

/* ---------- Spotlight: large hero item, smaller ones below ---------- */
export function SpotlightList({ items, v }: { items: Item[]; v: SectionView }) {
  if (items.length === 0) return null;
  const [hero, ...rest] = items;
  return (
    <div className="mt-3 space-y-3">
      <button
        onClick={() => v.onOpen(hero)}
        className={`block w-full overflow-hidden rounded-card border border-line text-left ${hero.is_available ? "" : "opacity-50"}`}
      >
        <CardMedia it={hero} cdnHost={v.cdnHost} accent={v.accent} onPlay={() => v.onPlay(hero)} className="aspect-[16/10] w-full object-cover" />
        <div className="p-3">
          <p className="font-display text-lg font-semibold text-ink">{v.l(hero.name, hero.name_i18n)}</p>
          {v.l(hero.description, hero.description_i18n) && (
            <p className="text-sm text-muted">{v.l(hero.description, hero.description_i18n)}</p>
          )}
          <p className="mt-1 font-semibold" style={{ color: v.accent }}>{v.price(hero)}</p>
          <Tags tags={hero.tags} />
        </div>
      </button>
      {rest.length > 0 && <GridList items={rest} v={v} />}
    </div>
  );
}
