"use client";

import { useRef, useState } from "react";
import { Compass, Phone, Share2 } from "lucide-react";
import type { Item } from "@/lib/menu";
import { LOCALE_LABELS, t as tr } from "@/lib/i18n";
import type { DisplayCurrency } from "@/lib/currency";
import { VideoTile } from "./video-tile";

type ReelTenant = {
  name: string;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  logo_url: string | null;
};

type Props = {
  dishes: Item[];
  tenant: ReelTenant;
  accent: string;
  cdnHost: string;
  locale: string;
  setLocale: (v: string) => void;
  activeLocales: string[];
  cur: DisplayCurrency;
  setCurrency: (v: string) => void;
  dualCurrency: boolean;
  shareUrl: string;
  categoryName: (it: Item) => string;
  l: (base: string | null, i18n: Record<string, string> | null) => string;
  price: (it: Item) => string;
  onPlay: (it: Item) => void;
  onLinkClick: (type: string) => void;
};

const SHADE = "linear-gradient(to top, rgba(0,0,0,.80) 0%, rgba(0,0,0,.25) 38%, rgba(0,0,0,0) 60%)";

export function ReelView({
  dishes,
  tenant,
  accent,
  cdnHost,
  locale,
  setLocale,
  activeLocales,
  cur,
  setCurrency,
  dualCurrency,
  shareUrl,
  categoryName,
  l,
  price,
  onPlay,
  onLinkClick,
}: Props) {
  const feedRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  function onScroll() {
    const el = feedRef.current;
    if (!el) return;
    const i = Math.round(el.scrollTop / el.clientHeight);
    if (i !== active) setActive(i);
    setScrolled(el.scrollTop > 40);
  }

  const directionsHref =
    tenant.lat != null && tenant.lng != null
      ? `https://www.google.com/maps/search/?api=1&query=${tenant.lat},${tenant.lng}`
      : null;

  async function share() {
    onLinkClick("share");
    try {
      if (navigator.share) await navigator.share({ title: tenant.name, url: shareUrl });
      else await navigator.clipboard.writeText(shareUrl);
    } catch {
      /* cancelled */
    }
  }

  const pill = "rounded-full px-2.5 py-1 text-[11px] font-semibold backdrop-blur";
  const glass = "bg-black/35 text-white";

  return (
    <div
      className="relative mx-auto h-[100dvh] w-full max-w-[480px] overflow-hidden bg-ink text-white"
      style={{ ["--color-accent" as string]: accent } as React.CSSProperties}
    >
      {/* Top overlay: segment bars + header */}
      <div className="absolute inset-x-0 top-0 z-30 px-4 pt-4">
        <div className="flex gap-1.5">
          {dishes.map((d, i) => (
            <div key={d.id} className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/30">
              <span className="block h-full bg-white transition-all" style={{ width: i <= active ? "100%" : "0%" }} />
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2">
          {tenant.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={tenant.logo_url} alt="" className="h-7 w-7 shrink-0 rounded-lg object-cover" />
          ) : (
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg" style={{ background: accent }}>
              <svg width="10" height="10" viewBox="0 0 12 12" fill="white"><path d="M3 2l6.5 4-6.5 4z" /></svg>
            </span>
          )}
          <span className="font-display text-sm font-extrabold drop-shadow">{tenant.name}</span>
          <div className="ml-auto flex items-center gap-1.5">
            {activeLocales.length > 1 &&
              activeLocales.map((lc) => (
                <button key={lc} onClick={() => setLocale(lc)} className={`${pill} ${locale === lc ? "text-white" : glass}`} style={locale === lc ? { background: accent } : undefined}>
                  {LOCALE_LABELS[lc] ?? lc.toUpperCase()}
                </button>
              ))}
            {dualCurrency &&
              (["USD", "AWG"] as DisplayCurrency[]).map((c) => (
                <button key={c} onClick={() => setCurrency(c)} className={`${pill} ${cur === c ? "text-white" : glass}`} style={cur === c ? { background: accent } : undefined}>
                  {c}
                </button>
              ))}
          </div>
        </div>
      </div>

      {/* Feed */}
      <div ref={feedRef} onScroll={onScroll} className="h-full snap-y snap-mandatory overflow-y-scroll [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {dishes.map((d) => {
          const mp4 = d.video_status === "ready" && d.video_id ? `https://${cdnHost}/${d.video_id}/play_480p.mp4` : null;
          return (
            <section key={d.id} className="relative h-full w-full snap-start overflow-hidden" style={{ background: `linear-gradient(135deg, ${accent}, ${accent}55 55%, #0E5B5B)` }}>
              {mp4 ? (
                <VideoTile poster={d.video_thumb_url ?? d.image_url} mp4Url={mp4} className="absolute inset-0 h-full w-full object-cover" onPlay={() => onPlay(d)} />
              ) : d.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={d.image_url} alt="" className="absolute inset-0 h-full w-full object-cover" />
              ) : null}
              <div className="absolute inset-0" style={{ background: SHADE }} />

              {/* Right action rail */}
              <div className="absolute bottom-40 right-3 z-20 flex flex-col items-center gap-4">
                {directionsHref && (
                  <a href={directionsHref} target="_blank" rel="noopener noreferrer" onClick={() => onLinkClick("directions")} className="flex flex-col items-center gap-1">
                    <span className="grid h-11 w-11 place-items-center rounded-full bg-black/35 backdrop-blur"><Compass className="h-5 w-5" /></span>
                    <span className="text-[10px] font-medium">{tr(locale, "directions")}</span>
                  </a>
                )}
                {tenant.phone && (
                  <a href={`tel:${tenant.phone}`} onClick={() => onLinkClick("call")} className="flex flex-col items-center gap-1">
                    <span className="grid h-11 w-11 place-items-center rounded-full bg-black/35 backdrop-blur"><Phone className="h-5 w-5" /></span>
                    <span className="text-[10px] font-medium">{tr(locale, "call")}</span>
                  </a>
                )}
                <button onClick={share} className="flex flex-col items-center gap-1">
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-black/35 backdrop-blur"><Share2 className="h-5 w-5" /></span>
                  <span className="text-[10px] font-medium">{tr(locale, "share")}</span>
                </button>
              </div>

              {/* Bottom info */}
              <div className="absolute inset-x-0 bottom-0 z-10 p-5 pb-8 pr-20">
                <div className="text-[12px] font-semibold uppercase tracking-wider text-white/70">{categoryName(d)}</div>
                <h2 className="mt-1 font-display text-3xl font-extrabold leading-tight drop-shadow">{l(d.name, d.name_i18n)}</h2>
                {l(d.description, d.description_i18n) && (
                  <p className="mt-1.5 max-w-xs text-sm text-white/80">{l(d.description, d.description_i18n)}</p>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-full px-3 py-1 text-sm font-bold text-white" style={{ background: accent }}>{price(d)}</span>
                  {(d.tags ?? []).map((tag) => (
                    <span key={tag} className="rounded-full bg-black/35 px-2.5 py-1 text-[11px] font-medium backdrop-blur">{tag}</span>
                  ))}
                </div>
              </div>
            </section>
          );
        })}
      </div>

      {/* Scroll hint */}
      <div className="pointer-events-none absolute bottom-6 left-1/2 z-30 -translate-x-1/2 flex-col items-center gap-1 text-[11px] text-white/70 transition-opacity" style={{ display: "flex", opacity: scrolled ? 0 : 1 }}>
        <span>Swipe up</span>
        <span className="animate-bounce text-lg leading-none">⌃</span>
      </div>
    </div>
  );
}
