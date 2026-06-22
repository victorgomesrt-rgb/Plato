"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { toast } from "@/components/toast";
import { addTickerItem, removeTickerItem } from "./actions";

type Item = { id: string; name: string; position: number };

export function LandingAdmin({ items }: { items: Item[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [pending, start] = useTransition();

  function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    start(async () => {
      const r = await addTickerItem(name);
      if (r.ok) { setName(""); toast("Added"); router.refresh(); }
      else toast(r.error);
    });
  }

  function remove(id: string) {
    start(async () => {
      const r = await removeTickerItem(id);
      if (r.ok) { toast("Removed"); router.refresh(); }
      else toast(r.error);
    });
  }

  return (
    <div className="mt-6">
      <form onSubmit={add} className="flex gap-2">
        <input
          value={name} onChange={(e) => setName(e.target.value)} maxLength={60}
          placeholder="Add a restaurant name"
          className="h-11 flex-1 rounded-btn border border-line bg-surface px-3 text-sm text-ink outline-none focus:border-accent" />
        <button type="submit" disabled={pending || !name.trim()}
          className="inline-flex h-11 items-center gap-1.5 rounded-btn bg-accent px-4 text-sm font-semibold text-white disabled:opacity-60">
          <Plus className="h-4 w-4" /> Add
        </button>
      </form>

      {items.length === 0 ? (
        <p className="mt-6 rounded-card border border-line bg-surface p-6 text-center text-sm text-muted">No names yet. Add one above.</p>
      ) : (
        <ul className="mt-4 flex flex-wrap gap-2">
          {items.map((it) => (
            <li key={it.id} className="inline-flex items-center gap-2 rounded-full border border-line bg-surface py-1.5 pl-3.5 pr-2 text-sm font-medium text-ink">
              {it.name}
              <button type="button" disabled={pending} onClick={() => remove(it.id)} aria-label={`Remove ${it.name}`}
                className="grid h-5 w-5 place-items-center rounded-full text-muted hover:bg-line hover:text-accent-deep disabled:opacity-50">
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-4 text-xs text-muted">Changes appear on the public landing page within a moment.</p>
    </div>
  );
}
