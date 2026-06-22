"use client";

import { useState, useTransition, useSyncExternalStore } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  createCategory,
  updateCategory,
  deleteCategory,
  reorderCategories,
  createItem,
  updateItem,
  deleteItem,
  setAvailability,
  setFeatured,
  reorderItems,
  translateItemDraft,
  type ItemInput,
} from "./actions";
import { ItemMedia } from "./item-media";
import { ALL_TAGS, tagLabel } from "@/lib/tags";

type Category = {
  id: string;
  name: string;
  name_i18n: { es?: string } | null;
  is_visible: boolean;
  sort_order: number;
};
type Item = {
  id: string;
  category_id: string | null;
  name: string;
  name_i18n: { es?: string } | null;
  description: string | null;
  description_i18n: { es?: string } | null;
  price: number | null;
  price_text: string | null;
  tags: string[] | null;
  is_available: boolean;
  is_featured: boolean;
  image_url: string | null;
  video_status: string;
  video_thumb_url: string | null;
  sort_order: number;
};
type Tenant = { id: string; slug: string; name: string; plan: string; base_currency: string };

export function MenuEditor({
  tenant,
  categories,
  items,
  cap,
}: {
  tenant: Tenant;
  categories: Category[];
  items: Item[];
  cap: number;
}) {
  const [cats, setCats] = useState(categories);
  const [its, setIts] = useState(items);
  const [, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  // Re-sync local state when fresh server data arrives (after router.refresh()).
  // Done during render (React's recommended pattern) rather than in an effect.
  const [snap, setSnap] = useState({ categories, items });
  if (snap.categories !== categories || snap.items !== items) {
    setSnap({ categories, items });
    setCats(categories);
    setIts(items);
  }

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  // dnd-kit generates non-deterministic aria ids; render the drag tree only after
  // hydration so server and client markup match. false on server + first client render.
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const run = (p: Promise<{ ok: boolean; error?: string }>) =>
    startTransition(async () => {
      const r = await p;
      if (!r.ok) setErr(r.error ?? "Something went wrong");
      else setErr(null);
    });

  const money = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: tenant.base_currency }).format(n);

  function onCatDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const ids = cats.map((c) => c.id);
    const next = arrayMove(cats, ids.indexOf(active.id as string), ids.indexOf(over.id as string));
    setCats(next);
    run(reorderCategories(tenant.id, next.map((c) => c.id)));
  }

  function onItemDragEnd(catId: string | null, e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const inCat = its.filter((i) => i.category_id === catId);
    const ids = inCat.map((i) => i.id);
    const reordered = arrayMove(inCat, ids.indexOf(active.id as string), ids.indexOf(over.id as string));
    setIts(its.filter((i) => i.category_id !== catId).concat(reordered));
    run(reorderItems(tenant.id, reordered.map((i) => i.id)));
  }

  const total = its.length;

  if (!hydrated) {
    return <p className="mt-6 text-sm text-muted">Loading editor…</p>;
  }

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">
          {total} item{total === 1 ? "" : "s"}
          {cap !== Infinity && ` · ${cap} max on ${tenant.plan}`}
        </p>
      </div>
      {err && <p className="mt-2 rounded-btn bg-accent/10 px-3 py-2 text-sm text-accent-deep">{err}</p>}

      {cats.length === 0 && (
        <div className="mt-4 rounded-card border border-dashed border-line p-6 text-center">
          <p className="font-medium text-ink">Group your menu</p>
          <p className="mt-1 text-sm text-muted">Start with a few common categories, then add dishes.</p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {["Starters", "Mains", "Drinks", "Desserts"].map((c) => (
              <button
                key={c}
                onClick={() => run(createCategory(tenant.id, c))}
                className="rounded-btn border border-line px-3 py-1.5 text-sm font-medium text-ink hover:bg-line"
              >
                + {c}
              </button>
            ))}
          </div>
        </div>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onCatDragEnd}>
        <SortableContext items={cats.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          <div className="mt-4 space-y-4">
            {cats.map((cat) => (
              <CategoryBlock
                key={cat.id}
                tenant={tenant}
                cat={cat}
                items={its.filter((i) => i.category_id === cat.id)}
                sensors={sensors}
                onItemDragEnd={onItemDragEnd}
                money={money}
                atCap={total >= cap}
                run={run}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <AddCategory tenantId={tenant.id} run={run} />
    </div>
  );
}

/* ---------- Category ---------- */

function CategoryBlock({
  tenant,
  cat,
  items,
  sensors,
  onItemDragEnd,
  money,
  atCap,
  run,
}: {
  tenant: Tenant;
  cat: Category;
  items: Item[];
  sensors: ReturnType<typeof useSensors>;
  onItemDragEnd: (catId: string | null, e: DragEndEvent) => void;
  money: (n: number) => string;
  atCap: boolean;
  run: (p: Promise<{ ok: boolean; error?: string }>) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: cat.id,
  });
  const [editing, setEditing] = useState(false);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState(cat.name);
  const [nameEs, setNameEs] = useState(cat.name_i18n?.es ?? "");

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.6 : 1 }}
      className="rounded-card border border-line p-4"
    >
      <div className="flex items-center gap-2">
        <button {...attributes} {...listeners} className="cursor-grab text-muted" aria-label="Drag category">
          ⠿
        </button>
        {editing ? (
          <div className="flex flex-1 flex-wrap items-center gap-2">
            <input value={name} onChange={(e) => setName(e.target.value)} className="rounded-btn border border-line px-2 py-1 text-sm" placeholder="Name (EN)" />
            <input value={nameEs} onChange={(e) => setNameEs(e.target.value)} className="rounded-btn border border-line px-2 py-1 text-sm" placeholder="Nombre (ES)" />
            <button onClick={() => { run(updateCategory(tenant.id, cat.id, { name, nameEs })); setEditing(false); }} className="text-sm font-medium text-accent">Save</button>
            <button onClick={() => setEditing(false)} className="text-sm text-muted">Cancel</button>
          </div>
        ) : (
          <>
            <h3 className="flex-1 font-display font-semibold text-ink">
              {cat.name}
              {!cat.is_visible && <span className="ml-2 text-xs text-muted">(hidden)</span>}
            </h3>
            <button onClick={() => run(updateCategory(tenant.id, cat.id, { isVisible: !cat.is_visible }))} className="text-xs text-muted hover:text-ink">
              {cat.is_visible ? "Hide" : "Show"}
            </button>
            <button onClick={() => setEditing(true)} className="text-xs text-muted hover:text-ink">Edit</button>
            <button onClick={() => { if (confirm(`Delete category "${cat.name}" and its items?`)) run(deleteCategory(tenant.id, cat.id)); }} className="text-xs text-accent-deep">Delete</button>
          </>
        )}
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => onItemDragEnd(cat.id, e)}>
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          <div className="mt-3 space-y-2">
            {items.map((item) => (
              <ItemRow key={item.id} tenant={tenant} item={item} money={money} run={run} />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {adding ? (
        <ItemForm
          tenantId={tenant.id}
          onCancel={() => setAdding(false)}
          onSubmit={(input) => { run(createItem(tenant.id, { ...input, categoryId: cat.id })); setAdding(false); }}
        />
      ) : (
        <button
          onClick={() => setAdding(true)}
          disabled={atCap}
          className="mt-3 text-sm font-medium text-accent disabled:opacity-50"
          title={atCap ? "Item cap reached for this plan" : undefined}
        >
          + Add item{atCap ? " (cap reached)" : ""}
        </button>
      )}
    </div>
  );
}

/* ---------- Item ---------- */

function ItemRow({
  tenant,
  item,
  money,
  run,
}: {
  tenant: Tenant;
  item: Item;
  money: (n: number) => string;
  run: (p: Promise<{ ok: boolean; error?: string }>) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });
  const [editing, setEditing] = useState(false);

  const price = item.price_text ?? (item.price != null ? money(item.price) : "-");

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.6 : 1 }}
      className={`rounded-md border border-line p-3 ${item.is_available ? "" : "bg-line/30"}`}
    >
      <div className="flex items-start gap-2">
        <button {...attributes} {...listeners} className="cursor-grab pt-0.5 text-muted" aria-label="Drag item">⠿</button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-ink">{item.name}</span>
            <span className="text-sm text-muted">{price}</span>
            {(item.tags ?? []).map((t) => (
              <span key={t} className="rounded-full bg-line px-2 py-0.5 text-[10px] uppercase text-muted">{tagLabel(t, "en")}</span>
            ))}
          </div>
          {item.description && <p className="text-sm text-muted">{item.description}</p>}
          <ItemMedia
            tenantId={tenant.id}
            itemId={item.id}
            itemName={item.name}
            imageUrl={item.image_url}
            videoStatus={item.video_status}
            videoThumbUrl={item.video_thumb_url}
          />
        </div>
        <div className="flex flex-col items-end gap-1 text-xs">
          <button onClick={() => run(setAvailability(tenant.id, item.id, !item.is_available))} className={item.is_available ? "text-sea" : "text-accent-deep"}>
            {item.is_available ? "Available" : "Sold out"}
          </button>
          <button onClick={() => run(setFeatured(tenant.id, item.id, !item.is_featured))} className={item.is_featured ? "text-citrus" : "text-muted hover:text-ink"}>
            {item.is_featured ? "★ Featured" : "☆ Feature"}
          </button>
          <button onClick={() => setEditing((v) => !v)} className="text-muted hover:text-ink">Edit</button>
          <button onClick={() => { if (confirm(`Delete "${item.name}"?`)) run(deleteItem(tenant.id, item.id)); }} className="text-accent-deep">Delete</button>
        </div>
      </div>

      {editing && (
        <ItemForm
          tenantId={tenant.id}
          initial={item}
          onCancel={() => setEditing(false)}
          onSubmit={(input) => { run(updateItem(tenant.id, item.id, input)); setEditing(false); }}
        />
      )}
    </div>
  );
}

/* ---------- Item form (add/edit) ---------- */

function ItemForm({
  tenantId,
  initial,
  onSubmit,
  onCancel,
}: {
  tenantId: string;
  initial?: Item;
  onSubmit: (input: ItemInput) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [nameEs, setNameEs] = useState(initial?.name_i18n?.es ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [descriptionEs, setDescriptionEs] = useState(initial?.description_i18n?.es ?? "");
  const [price, setPrice] = useState(initial?.price != null ? String(initial.price) : "");
  const [priceText, setPriceText] = useState(initial?.price_text ?? "");
  const [tags, setTags] = useState<string[]>(initial?.tags ?? []);
  const [translating, setTranslating] = useState(false);
  const [tErr, setTErr] = useState<string | null>(null);

  async function autoTranslate() {
    setTErr(null);
    setTranslating(true);
    const r = await translateItemDraft(tenantId, name, description);
    setTranslating(false);
    if (r.ok) {
      setNameEs(r.nameEs);
      setDescriptionEs(r.descriptionEs);
    } else {
      setTErr(r.error);
    }
  }

  const field = "w-full rounded-btn border border-line px-2 py-1.5 text-sm outline-none focus:border-accent";

  return (
    <div className="mt-3 space-y-2 rounded-md bg-line/20 p-3">
      <div className="grid grid-cols-2 gap-2">
        <input className={field} value={name} onChange={(e) => setName(e.target.value)} placeholder="Name (EN)" />
        <input className={field} value={nameEs} onChange={(e) => setNameEs(e.target.value)} placeholder="Nombre (ES)" />
        <textarea className={field} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (EN)" rows={2} />
        <textarea className={field} value={descriptionEs} onChange={(e) => setDescriptionEs(e.target.value)} placeholder="Descripción (ES)" rows={2} />
        <input className={field} value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Price (e.g. 12.50)" inputMode="decimal" />
        <input className={field} value={priceText} onChange={(e) => setPriceText(e.target.value)} placeholder="Or price text (e.g. Market price)" />
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={autoTranslate}
          disabled={translating || !name.trim()}
          className="text-xs font-medium text-accent disabled:opacity-50"
        >
          {translating ? "Translating…" : "✦ Auto-translate to ES (draft)"}
        </button>
        {tErr && <span className="text-xs text-accent-deep">{tErr}</span>}
      </div>
      <div className="flex flex-wrap gap-2">
        {ALL_TAGS.map((t) => (
          <label key={t} className="flex items-center gap-1 text-xs text-muted">
            <input
              type="checkbox"
              checked={tags.includes(t)}
              onChange={(e) => setTags((cur) => (e.target.checked ? [...cur, t] : cur.filter((x) => x !== t)))}
            />
            {tagLabel(t, "en")}
          </label>
        ))}
      </div>
      <div className="flex gap-2">
        <button
          onClick={() =>
            onSubmit({
              categoryId: initial?.category_id ?? null,
              name,
              nameEs,
              description,
              descriptionEs,
              price: price.trim() ? Number(price) : null,
              priceText: priceText.trim() || null,
              tags,
            })
          }
          className="rounded-btn bg-accent px-3 py-1.5 text-sm font-medium text-white"
        >
          {initial ? "Save" : "Add item"}
        </button>
        <button onClick={onCancel} className="text-sm text-muted">Cancel</button>
      </div>
    </div>
  );
}

/* ---------- Add category ---------- */

function AddCategory({
  tenantId,
  run,
}: {
  tenantId: string;
  run: (p: Promise<{ ok: boolean; error?: string }>) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [nameEs, setNameEs] = useState("");
  if (!open)
    return (
      <button onClick={() => setOpen(true)} className="mt-4 rounded-btn border border-line px-4 py-2 text-sm font-medium text-ink">
        + Add category
      </button>
    );
  return (
    <div className="mt-4 flex flex-wrap items-center gap-2 rounded-card border border-line p-4">
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Category (EN)" className="rounded-btn border border-line px-2 py-1.5 text-sm" />
      <input value={nameEs} onChange={(e) => setNameEs(e.target.value)} placeholder="Categoría (ES)" className="rounded-btn border border-line px-2 py-1.5 text-sm" />
      <button onClick={() => { run(createCategory(tenantId, name, nameEs)); setName(""); setNameEs(""); setOpen(false); }} className="rounded-btn bg-accent px-3 py-1.5 text-sm font-medium text-white">Add</button>
      <button onClick={() => setOpen(false)} className="text-sm text-muted">Cancel</button>
    </div>
  );
}
