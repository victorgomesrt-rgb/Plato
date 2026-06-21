"use client";

import { useSyncExternalStore } from "react";
import { Check } from "lucide-react";

// Minimal toast: a module store + useSyncExternalStore (no setState-in-effect).
type Item = { id: number; msg: string };
let items: Item[] = [];
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());

export function toast(msg: string) {
  const id = Date.now() + Math.random();
  items = [...items, { id, msg }];
  emit();
  setTimeout(() => { items = items.filter((t) => t.id !== id); emit(); }, 2400);
}

export function Toaster() {
  const list = useSyncExternalStore(
    (cb) => { subs.add(cb); return () => subs.delete(cb); },
    () => items,
    () => items
  );
  return (
    <div className="pointer-events-none fixed bottom-5 left-1/2 z-[60] flex -translate-x-1/2 flex-col items-center gap-2">
      {list.map((t) => (
        <div key={t.id} className="flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-medium text-white shadow-lg">
          <Check className="h-4 w-4 text-accent" /> {t.msg}
        </div>
      ))}
    </div>
  );
}
