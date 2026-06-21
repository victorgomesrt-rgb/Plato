"use client";

import { useState } from "react";
import Image from "next/image";
import { Play, LayoutGrid, List, Sparkles } from "lucide-react";

type Key = "reel" | "grid" | "classic" | "spotlight";

const OPTIONS: { key: Key; name: string; body: string; icon: typeof Play }[] = [
  { key: "reel", name: "Reel", body: "Full-screen video, swipe up. TikTok energy.", icon: Play },
  { key: "grid", name: "Grid", body: "Two-column cards. Scannable, holds a lot.", icon: LayoutGrid },
  { key: "classic", name: "Classic", body: "Elegant single-column list. Calm, fine-dining.", icon: List },
  { key: "spotlight", name: "Spotlight", body: "Magazine hero per category. Editorial feel.", icon: Sparkles },
];

const img = (n: number) => `/landing/dish-${n}.jpg`;

function PhoneFrame({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <div className="mx-auto h-[560px] w-[272px] rounded-[40px] bg-[#14110F] p-2 shadow-[0_50px_100px_-30px_rgba(0,0,0,0.8),0_0_0_2px_rgba(255,255,255,0.06)]">
      <div className={`relative h-full w-full overflow-hidden rounded-[32px] ${dark ? "bg-black" : "bg-white"}`}>
        <div className="absolute left-1/2 top-0 z-10 h-[22px] w-[100px] -translate-x-1/2 rounded-b-2xl bg-[#14110F]" />
        {children}
      </div>
    </div>
  );
}

const Reel = () => (
  <PhoneFrame dark>
    <Image src={img(9)} alt="" fill sizes="272px" className="object-cover" style={{ animation: "plato-kenburns 14s ease-in-out infinite alternate" }} />
    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/30" />
    <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-black/50 px-2 py-1 text-[10px] font-bold text-white backdrop-blur"><span className="h-1.5 w-1.5 rounded-full bg-accent" style={{ animation: "plato-pulse 1.4s infinite" }} /> LIVE CLIP</span>
    <span className="absolute left-1/2 top-1/2 grid h-12 w-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/20 backdrop-blur"><Play className="h-5 w-5 fill-white text-white" /></span>
    <div className="absolute inset-x-4 bottom-5">
      <p className="text-[10px] font-bold uppercase tracking-wider text-accent">Chef&apos;s pick</p>
      <p className="font-display text-2xl font-extrabold leading-tight text-white drop-shadow">Caribbean Lobster</p>
      <p className="text-xs text-white/80">Grilled over coals, lime butter.</p>
      <span className="mt-2 inline-block rounded-full bg-accent px-3 py-1 text-sm font-bold text-white">$46</span>
    </div>
  </PhoneFrame>
);

const Grid = () => (
  <PhoneFrame>
    <div className="relative h-[120px]">
      <Image src="/landing/cover-hungparadise.jpg" alt="" fill sizes="272px" className="object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
      <p className="absolute bottom-2 left-3 font-display text-xl font-extrabold text-white drop-shadow">Brisa</p>
    </div>
    <div className="p-3">
      <p className="text-[11px] font-semibold text-ink">From the Sea</p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {[["Garlic Shrimp", "$24", 7], ["Conch Ceviche", "$14", 6], ["Coconut Shrimp", "$22", 1], ["Red Snapper", "$27", 8]].map(([n, p, d]) => (
          <div key={n as string} className="overflow-hidden rounded-lg border border-line">
            <div className="relative h-[68px]"><Image src={img(d as number)} alt="" fill sizes="120px" className="object-cover" /></div>
            <div className="p-1.5"><p className="truncate text-[10px] font-semibold text-ink">{n}</p><p className="text-[10px] font-bold text-accent">{p}</p></div>
          </div>
        ))}
      </div>
    </div>
  </PhoneFrame>
);

const Classic = () => (
  <PhoneFrame>
    <div className="px-4 pt-7">
      <p className="font-display text-xl font-extrabold text-ink">Brisa</p>
      <p className="mt-2 text-[11px] font-semibold text-muted">Starters</p>
      <div className="mt-2 divide-y divide-line">
        {[["Pastechi", "$9", "Flaky turnovers, gouda or beef.", 10], ["Conch Ceviche", "$14", "Lime, scotch bonnet, cilantro.", 6], ["Pan Bati & Dips", "$7", "Sweet cornmeal flatbread.", 2], ["Keshi Yena", "$21", "Stuffed gouda, spiced chicken.", 1]].map(([n, p, d, im]) => (
          <div key={n as string} className="flex items-center gap-2.5 py-2.5">
            <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-md"><Image src={img(im as number)} alt="" fill sizes="36px" className="object-cover" /></span>
            <div className="min-w-0 flex-1"><p className="truncate text-[12px] font-semibold text-ink">{n}</p><p className="truncate text-[10px] text-muted">{d}</p></div>
            <span className="text-[12px] font-bold text-accent">{p}</span>
          </div>
        ))}
      </div>
    </div>
  </PhoneFrame>
);

const Spotlight = () => (
  <PhoneFrame>
    <div className="px-4 pt-7">
      <p className="text-[10px] font-bold uppercase tracking-wider text-accent">From the Sea</p>
      <div className="relative mt-2 h-[150px] overflow-hidden rounded-2xl">
        <Image src={img(9)} alt="" fill sizes="240px" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        <div className="absolute bottom-2.5 left-3"><p className="font-display text-lg font-extrabold text-white drop-shadow">Catch of the Day</p></div>
        <span className="absolute bottom-3 right-3 rounded-full bg-accent px-2.5 py-0.5 text-xs font-bold text-white">$29</span>
      </div>
      <div className="mt-3 divide-y divide-line">
        {[["Garlic Shrimp", "$24", "Garlic butter, white wine.", 7], ["Caribbean Lobster", "$46", "Grilled, lime butter.", 8]].map(([n, p, d, im]) => (
          <div key={n as string} className="flex items-center gap-2.5 py-2.5">
            <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-md"><Image src={img(im as number)} alt="" fill sizes="36px" className="object-cover" /></span>
            <div className="min-w-0 flex-1"><p className="truncate text-[12px] font-semibold text-ink">{n}</p><p className="truncate text-[10px] text-muted">{d}</p></div>
            <span className="text-[12px] font-bold text-accent">{p}</span>
          </div>
        ))}
      </div>
    </div>
  </PhoneFrame>
);

const PREVIEW: Record<Key, () => React.ReactElement> = { reel: Reel, grid: Grid, classic: Classic, spotlight: Spotlight };

export function TemplateSwitcher() {
  const [active, setActive] = useState<Key>("reel");
  const Preview = PREVIEW[active];
  return (
    <div className="mt-12 grid items-center gap-10 md:grid-cols-2">
      <div className="space-y-3">
        {OPTIONS.map((o) => {
          const on = active === o.key;
          return (
            <button key={o.key} onClick={() => setActive(o.key)}
              className={`flex w-full items-center gap-4 rounded-card border p-4 text-left transition ${on ? "border-accent/60 bg-accent/10" : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"}`}>
              <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${on ? "bg-accent text-white" : "bg-white/10 text-white/80"}`}><o.icon className="h-5 w-5" /></span>
              <div className="flex-1">
                <p className="font-display font-bold text-white">{o.name}</p>
                <p className="text-sm text-white/60">{o.body}</p>
              </div>
              {on && <span className="h-2 w-2 rounded-full bg-accent" style={{ animation: "plato-pulse 1.6s ease-in-out infinite" }} />}
            </button>
          );
        })}
      </div>
      <div key={active} style={{ animation: "plato-fadeswap 0.45s ease" }}>
        <Preview />
      </div>
    </div>
  );
}
