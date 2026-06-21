"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { isOpenNow, type Hours } from "@/lib/hours";
import { PlatoMark } from "@/components/plato-logo";

export type DiscoverCard = {
  slug: string;
  name: string;
  description: string | null;
  cover_url: string | null;
  logo_url: string | null;
  accent_color: string | null;
  plan: string;
  hours: Hours;
  address: string | null;
};

function useHydrated() {
  return useSyncExternalStore(() => () => {}, () => true, () => false);
}

const DEMO = "/book";

function Card({ t, hydrated }: { t: DiscoverCard; hydrated: boolean }) {
  const accent = t.accent_color ?? "#FB6A1A";
  const open = hydrated && t.hours ? isOpenNow(t.hours) : null;
  return (
    <Link href={`/${t.slug}`} className="group relative block overflow-hidden rounded-card ring-1 ring-white/10 transition hover:ring-white/25">
      <div className="relative h-44 w-full">
        {t.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={t.cover_url} alt="" className="h-full w-full object-cover transition group-hover:scale-105" />
        ) : (
          <div className="h-full w-full" style={{ background: `linear-gradient(135deg, ${accent}, ${accent}55 60%, #0E5B5B)` }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute left-3 top-3 flex gap-2">
          {t.plan === "premium" && (
            <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-white">Featured</span>
          )}
          {open !== null && (
            <span className="flex items-center gap-1.5 rounded-full bg-black/45 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: open ? "#18A999" : "#cbb9aa" }} />
              {open ? "Open" : "Closed"}
            </span>
          )}
        </div>
        <div className="absolute inset-x-0 bottom-0 p-3">
          {t.logo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={t.logo_url} alt="" className="mb-1.5 h-8 w-8 rounded-md object-cover" />
          )}
          <p className="font-display text-lg font-semibold text-white drop-shadow">{t.name}</p>
          {(t.description || t.address) && (
            <p className="line-clamp-1 text-sm text-white/75">{t.description ?? t.address}</p>
          )}
        </div>
      </div>
    </Link>
  );
}

export function DiscoverList({ tenants }: { tenants: DiscoverCard[] }) {
  const hydrated = useHydrated();
  const [q, setQ] = useState("");
  const [openOnly, setOpenOnly] = useState(false);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return tenants.filter(
      (t) =>
        (!needle || t.name.toLowerCase().includes(needle) || (t.description ?? "").toLowerCase().includes(needle)) &&
        (!openOnly || (t.hours ? isOpenNow(t.hours) : false))
    );
  }, [tenants, q, openOnly]);

  const featured = filtered.filter((t) => t.plan === "premium");
  const rest = filtered.filter((t) => t.plan !== "premium");

  return (
    <div className="min-h-screen bg-ink text-white">
      {/* Top bar */}
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <Link href="/" className="flex items-center gap-2">
            <PlatoMark className="h-7 w-auto" onDark />
            <span className="font-display font-extrabold">Plato</span>
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <a href={DEMO} className="text-white/70 hover:text-white">Add your restaurant</a>
            <Link href="/login" className="text-white/70 hover:text-white">Log in</Link>
          </div>
        </div>
      </header>

      {/* Hero + search */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-accent/25 blur-[110px]" />
        <div className="mx-auto max-w-3xl px-5 py-14 text-center">
          <h1 className="font-display text-4xl font-extrabold leading-tight sm:text-5xl">
            See the food before<br className="hidden sm:block" /> you sit down.
          </h1>
          <p className="mt-3 text-white/70">Browse Aruba&apos;s restaurants with menus that actually move.</p>
          <div className="mx-auto mt-6 flex max-w-lg items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2.5">
            <Search className="h-5 w-5 text-white/50" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search restaurants, dishes…"
              className="flex-1 bg-transparent text-white outline-none placeholder:text-white/40"
            />
          </div>
          <div className="mt-4 flex justify-center gap-2 text-sm">
            <button onClick={() => setOpenOnly(false)} className={`rounded-full px-3 py-1 font-medium ${!openOnly ? "bg-accent text-white" : "bg-white/10 text-white/80"}`}>All</button>
            <button onClick={() => setOpenOnly(true)} className={`rounded-full px-3 py-1 font-medium ${openOnly ? "bg-accent text-white" : "bg-white/10 text-white/80"}`}>Open now</button>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-5 pb-16">
        {filtered.length === 0 ? (
          <p className="rounded-card border border-white/10 bg-white/5 p-8 text-center text-white/70">
            No menus match. Try another search.
          </p>
        ) : (
          <>
            {featured.length > 0 && (
              <section>
                <h2 className="font-display text-lg font-semibold">Featured</h2>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  {featured.map((t) => <Card key={t.slug} t={t} hydrated={hydrated} />)}
                </div>
              </section>
            )}
            {rest.length > 0 && (
              <section className="mt-8">
                <h2 className="font-display text-lg font-semibold">All restaurants</h2>
                <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {rest.map((t) => <Card key={t.slug} t={t} hydrated={hydrated} />)}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
