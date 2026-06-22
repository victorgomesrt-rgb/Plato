"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Search } from "lucide-react";

type T = { name: string; slug: string; plan: string };

// ⌘K command-palette-lite: focuses on ⌘K/Ctrl+K, filters tenants as you type.
export function AdminSearch({ tenants }: { tenants: T[] }) {
  const [q, setQ] = useState("");
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        ref.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const term = q.trim().toLowerCase();
  const matches = term ? tenants.filter((t) => `${t.name} ${t.slug}`.toLowerCase().includes(term)).slice(0, 6) : [];

  return (
    <div className="relative w-full sm:max-w-sm">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
      <input
        ref={ref}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search tenants, invoices…"
        aria-label="Search tenants"
        className="h-10 w-full rounded-full border border-line bg-surface pl-9 pr-12 text-sm text-ink outline-none focus:border-accent"
      />
      <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-line bg-line/60 px-1.5 py-0.5 text-[10px] font-medium text-muted">⌘K</kbd>
      {matches.length > 0 && (
        <div className="absolute z-30 mt-1.5 w-full overflow-hidden rounded-card border border-line bg-surface shadow-[0_14px_40px_-18px_rgba(0,0,0,0.35)]">
          {matches.map((t) => (
            <Link key={t.slug} href={`/admin/tenants/${t.slug}`} onClick={() => setQ("")} className="flex items-center justify-between gap-3 px-3 py-2 text-sm hover:bg-line/40">
              <span className="truncate font-medium text-ink">{t.name}</span>
              <span className="shrink-0 text-xs text-muted">/{t.slug} · {t.plan}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
