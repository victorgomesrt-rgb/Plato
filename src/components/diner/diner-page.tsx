"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import type { Tenant } from "@/lib/tenant";
import type { Category, Item } from "@/lib/menu";
import { localized, t, LOCALE_LABELS } from "@/lib/i18n";
import { track } from "@/lib/track-client";
import { priceLabel, type DisplayCurrency } from "@/lib/currency";
import { isOpenNow, DAY_KEYS, type DayKey } from "@/lib/hours";
import { ActionBar } from "./action-bar";
import { CardMedia } from "./card-media";
import { ReelView } from "./reel-view";
import { GridList, ClassicList, SpotlightList, type SectionView } from "./menu-sections";
import { DIETARY_TAGS, tagLabel } from "@/lib/tags";

// Hydration-safe per-session persistence (no setState-in-effect).
function useSessionState(key: string, fallback: string) {
  const value = useSyncExternalStore(
    (cb) => {
      window.addEventListener("plato-store", cb);
      return () => window.removeEventListener("plato-store", cb);
    },
    () => sessionStorage.getItem(key) ?? fallback,
    () => fallback
  );
  const set = (v: string) => {
    sessionStorage.setItem(key, v);
    window.dispatchEvent(new Event("plato-store"));
  };
  return [value, set] as const;
}

function useHydrated() {
  return useSyncExternalStore(() => () => {}, () => true, () => false);
}

type Props = {
  tenant: Tenant;
  categories: Category[];
  items: Item[];
  cdnHost: string;
  shareUrl: string;
  todayKey: DayKey;
};

const DAY_LABEL: Record<DayKey, string> = {
  sun: "Sun", mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat",
};

export function DinerPage({ tenant, categories, items, cdnHost, shareUrl, todayKey }: Props) {
  const accent = tenant.accent_color ?? "#FB6A1A";
  const defaultLocale = tenant.default_locale;
  const activeLocales = tenant.locales?.length ? tenant.locales : [defaultLocale];

  const [locale, setLocale] = useSessionState("plato:locale", defaultLocale);
  const initialCurrency: DisplayCurrency = tenant.base_currency === "AWG" ? "AWG" : "USD";
  const [currency, setCurrency] = useSessionState("plato:currency", initialCurrency);
  const cur = (currency === "AWG" ? "AWG" : "USD") as DisplayCurrency;

  const [active, setActive] = useState<string | null>(categories[0]?.id ?? null);
  const [selected, setSelected] = useState<Item | null>(null);
  const [showMini, setShowMini] = useState(false);
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const hydrated = useHydrated();
  const coverRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  // Mini header appears once the cover scrolls out of view.
  useEffect(() => {
    const el = coverRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setShowMini(!e.isIntersecting), {
      threshold: 0,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Highlight the category whose section is in view.
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.intersectionRatio - b.intersectionRatio);
        const top = visible[visible.length - 1];
        if (top?.target instanceof HTMLElement && top.target.dataset.cat) setActive(top.target.dataset.cat);
      },
      { rootMargin: "-40% 0px -55% 0px" }
    );
    Object.values(sectionRefs.current).forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, [categories.length]);

  // Cookieless page_view once per load.
  useEffect(() => {
    track(tenant.id, "page_view");
  }, [tenant.id]);

  const l = (base: string | null, i18n: Record<string, string> | null) =>
    localized(base, i18n, locale, defaultLocale);
  const price = (it: Item) =>
    priceLabel(it.price, it.price_text, cur, tenant.base_currency, tenant.fx_rate);

  const featured = items
    .filter((i) => i.is_featured && i.is_available)
    .sort((a, b) => (a.featured_rank ?? 99) - (b.featured_rank ?? 99) || a.sort_order - b.sort_order)
    .slice(0, 8);

  function jumpTo(catId: string) {
    sectionRefs.current[catId]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function openItem(it: Item) {
    setSelected(it);
    track(tenant.id, "item_view", it.id);
  }

  const template = tenant.template || "grid";
  const localizeCat = (c: Category) => l(c.name, (c.name_i18n as Record<string, string> | null) ?? null);
  const catNameById = new Map(categories.map((c) => [c.id, localizeCat(c)]));
  const categoryName = (it: Item) => (it.category_id ? catNameById.get(it.category_id) ?? "" : "");

  // Shared item-layout props for Grid / Classic / Spotlight.
  const view: SectionView = {
    cdnHost,
    accent,
    soldOut: t(locale, "soldOut"),
    locale,
    l,
    price,
    onOpen: openItem,
    onPlay: (it) => track(tenant.id, "video_play", it.id),
  };

  // Dietary filter: chips for the dietary tags actually present in this menu; a dish
  // matches when it carries ALL selected tags (so restrictions narrow the list).
  const menuTags = DIETARY_TAGS.filter((tg) => items.some((i) => (i.tags ?? []).includes(tg)));
  const matchesTags = (it: Item) => activeTags.length === 0 || activeTags.every((tg) => (it.tags ?? []).includes(tg));
  const shownFeatured = featured.filter(matchesTags);

  // Reel is a full-screen feed, not the scrollable shell, featured dishes lead.
  if (template === "reel") {
    const reelDishes = [...featured, ...items.filter((i) => !featured.some((f) => f.id === i.id))];
    return (
      <ReelView
        dishes={reelDishes}
        tenant={{ name: tenant.name, lat: tenant.lat, lng: tenant.lng, phone: tenant.phone, logo_url: tenant.logo_url }}
        accent={accent}
        cdnHost={cdnHost}
        locale={locale}
        setLocale={setLocale}
        activeLocales={activeLocales}
        cur={cur}
        setCurrency={setCurrency}
        dualCurrency={tenant.dual_currency}
        shareUrl={shareUrl}
        categoryName={categoryName}
        l={l}
        price={price}
        onPlay={(it) => track(tenant.id, "video_play", it.id)}
        onLinkClick={(type) =>
          track(tenant.id, type === "directions" ? "directions_click" : type === "call" ? "call_click" : "link_click")
        }
      />
    );
  }

  return (
    <div style={{ ["--color-accent" as string]: accent } as React.CSSProperties}>
      {/* Sticky mini header */}
      <div
        className={`fixed inset-x-0 top-0 z-40 flex items-center justify-between border-b border-line bg-surface/95 px-4 py-2 backdrop-blur transition ${
          showMini ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <span className="truncate font-display font-semibold text-ink">{tenant.name}</span>
        {tenant.lat != null && tenant.lng != null && (
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${tenant.lat},${tenant.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full px-3 py-1 text-sm font-medium text-white"
            style={{ background: accent }}
          >
            {t(locale, "directions")}
          </a>
        )}
      </div>

      <div className="mx-auto w-full max-w-2xl pb-10">
        {/* Cover */}
        <div ref={coverRef} className="relative h-56 w-full overflow-hidden sm:h-64">
          {tenant.cover_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={tenant.cover_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full" style={{ background: `linear-gradient(135deg, ${accent}, ${accent}99)` }} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-ink/75 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-4">
            {hydrated && tenant.hours && (() => {
              const open = isOpenNow(tenant.hours);
              const close = tenant.hours?.[todayKey]?.[1];
              return (
                <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-black/40 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: open ? "#18A999" : "#cbb9aa" }} />
                  {open ? `${t(locale, "openNow")}${close ? ` · until ${close}` : ""}` : t(locale, "closed")}
                </span>
              );
            })()}
            <div className="flex items-end gap-3">
              {tenant.logo_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={tenant.logo_url} alt="" className="h-12 w-12 rounded-card object-cover" />
              )}
              <h1 className="font-display text-2xl font-semibold text-white drop-shadow">{tenant.name}</h1>
            </div>
          </div>
          {/* Toggles */}
          <div className="absolute right-3 top-3 flex gap-2">
            {activeLocales.length > 1 && (
              <div className="flex overflow-hidden rounded-full bg-surface/90 text-xs font-medium">
                {activeLocales.map((lc) => (
                  <button
                    key={lc}
                    onClick={() => setLocale(lc)}
                    className={`px-2.5 py-1 ${locale === lc ? "text-white" : "text-ink"}`}
                    style={locale === lc ? { background: accent } : undefined}
                  >
                    {LOCALE_LABELS[lc] ?? lc.toUpperCase()}
                  </button>
                ))}
              </div>
            )}
            {tenant.dual_currency && (
              <div className="flex overflow-hidden rounded-full bg-surface/90 text-xs font-medium">
                {(["USD", "AWG"] as DisplayCurrency[]).map((c) => (
                  <button
                    key={c}
                    onClick={() => setCurrency(c)}
                    className={`px-2.5 py-1 ${cur === c ? "text-white" : "text-ink"}`}
                    style={cur === c ? { background: accent } : undefined}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="px-4">
          {tenant.description && <p className="mt-3 text-sm text-muted">{tenant.description}</p>}

          {/* Action bar (+ Plato Card entry for partner restaurants) */}
          {((tenant.links?.length ?? 0) > 0 || tenant.wallet_partner) && (
            <div className="mt-4">
              <ActionBar
                tenantId={tenant.id}
                links={[
                  ...(tenant.links ?? []),
                  ...(tenant.wallet_partner ? [{ type: "plato_card", url: "/card", label: "Plato Card" }] : []),
                ]}
                tenant={{
                  name: tenant.name,
                  lat: tenant.lat,
                  lng: tenant.lng,
                  phone: tenant.phone,
                  whatsapp: tenant.whatsapp,
                  address: tenant.address,
                }}
                locale={locale}
                shareUrl={shareUrl}
                accent={accent}
              />
            </div>
          )}

          {/* Featured band */}
          {shownFeatured.length > 0 && (
            <section className="mt-6">
              <h2 className="font-display text-lg font-semibold text-ink">{t(locale, "mostPopular")}</h2>
              <div className="mt-3 flex gap-3 overflow-x-auto pb-2">
                {shownFeatured.map((it) => (
                  <button
                    key={it.id}
                    onClick={() => openItem(it)}
                    className="relative w-36 shrink-0 overflow-hidden rounded-card text-left"
                  >
                    <CardMedia it={it} cdnHost={cdnHost} accent={accent} onPlay={() => track(tenant.id, "video_play", it.id)} className="aspect-[4/5] w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-2.5">
                      <p className="truncate text-sm font-semibold text-white drop-shadow">{l(it.name, it.name_i18n)}</p>
                      <span className="mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-bold text-white" style={{ background: accent }}>
                        {price(it)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sticky category nav */}
        <nav className="sticky top-0 z-30 mt-4 flex gap-2 overflow-x-auto border-b border-line bg-surface/95 px-4 py-2 backdrop-blur">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => jumpTo(c.id)}
              className={`shrink-0 rounded-full px-3 py-1 text-sm font-medium ${
                active === c.id ? "text-white" : "bg-line text-ink"
              }`}
              style={active === c.id ? { background: accent } : undefined}
            >
              {l(c.name, c.name_i18n as Record<string, string> | null)}
            </button>
          ))}
        </nav>

        {/* Sections, Grid template, two columns */}
        <div className="px-4">
          {menuTags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-6">
              <span className="text-xs font-medium uppercase tracking-wide text-muted">{locale === "es" ? "Dietético" : "Dietary"}</span>
              {menuTags.map((tg) => {
                const on = activeTags.includes(tg);
                return (
                  <button
                    key={tg}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setActiveTags(on ? activeTags.filter((x) => x !== tg) : [...activeTags, tg])}
                    className={`rounded-full px-3 py-1 text-sm font-medium transition ${on ? "text-white" : "border border-line bg-surface text-ink"}`}
                    style={on ? { background: accent } : undefined}
                  >
                    {tagLabel(tg, locale)}
                  </button>
                );
              })}
              {activeTags.length > 0 && (
                <button type="button" onClick={() => setActiveTags([])} className="text-sm font-medium text-muted underline">
                  {locale === "es" ? "Limpiar" : "Clear"}
                </button>
              )}
            </div>
          )}
          {categories.map((c) => {
            const catItems = items.filter((i) => i.category_id === c.id && matchesTags(i));
            if (catItems.length === 0) return null;
            return (
              <section
                key={c.id}
                data-cat={c.id}
                ref={(el) => {
                  sectionRefs.current[c.id] = el;
                }}
                className="scroll-mt-14 pt-6"
              >
                <h2 className="font-display text-lg font-semibold text-ink">
                  {localizeCat(c)}
                </h2>
                {template === "classic" ? (
                  <ClassicList items={catItems} v={view} />
                ) : template === "spotlight" ? (
                  <SpotlightList items={catItems} v={view} />
                ) : (
                  <GridList items={catItems} v={view} />
                )}
              </section>
            );
          })}
          {activeTags.length > 0 && !items.some(matchesTags) && (
            <p className="py-12 text-center text-sm text-muted">
              {locale === "es" ? "Ningún plato coincide con estos filtros." : "No dishes match those filters."}
            </p>
          )}
        </div>

        {/* Footer */}
        <footer className="mt-10 border-t border-line px-4 pt-6 text-sm text-muted">
          {(() => {
            const q = tenant.lat != null && tenant.lng != null
              ? `${tenant.lat},${tenant.lng}`
              : tenant.address ? encodeURIComponent(tenant.address) : null;
            return q ? (
              <iframe
                title="Map"
                src={`https://maps.google.com/maps?q=${q}&z=16&output=embed`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="mb-4 h-44 w-full rounded-card border border-line"
              />
            ) : null;
          })()}
          {tenant.address && <p className="text-ink">{tenant.address}</p>}
          {tenant.hours && (
            <div className="mt-3">
              <div className="flex items-center gap-2">
                <span className="font-medium text-ink">{t(locale, "hours")}</span>
                {hydrated && (
                  <span
                    className="rounded-full px-2 py-0.5 text-xs font-medium text-white"
                    style={{ background: isOpenNow(tenant.hours) ? "#0E5B5B" : "#6B6660" }}
                  >
                    {isOpenNow(tenant.hours) ? t(locale, "openNow") : t(locale, "closed")}
                  </span>
                )}
              </div>
              <ul className="mt-1">
                {DAY_KEYS.map((d) => {
                  const r = tenant.hours?.[d];
                  return (
                    <li key={d} className={d === todayKey ? "font-medium text-ink" : ""}>
                      {DAY_LABEL[d]} · {r ? `${r[0]}-${r[1]}` : "-"}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
          <p className="mt-6 flex items-center justify-center gap-3 pb-2 text-center text-xs">
            <a href="https://platodigital.io" className="hover:text-ink">{t(locale, "poweredBy")}</a>
            <span aria-hidden>·</span>
            <Link href="/privacy" className="hover:text-ink">{t(locale, "privacy")}</Link>
          </p>
        </footer>
      </div>

      {/* Item modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/60 sm:items-center"
          onClick={() => setSelected(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-card bg-surface sm:rounded-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              <CardMedia it={selected} cdnHost={cdnHost} accent={accent} className="aspect-square w-full object-cover" />
              <button
                onClick={() => setSelected(null)}
                aria-label={t(locale, "close")}
                className="absolute right-3 top-3 rounded-full bg-surface/90 p-1.5"
              >
                <X className="h-5 w-5 text-ink" />
              </button>
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-display text-xl font-semibold text-ink">
                  {l(selected.name, selected.name_i18n)}
                </h3>
                <span className="shrink-0 font-semibold" style={{ color: accent }}>
                  {price(selected)}
                </span>
              </div>
              {l(selected.description, selected.description_i18n) && (
                <p className="mt-2 text-muted">{l(selected.description, selected.description_i18n)}</p>
              )}
              {!selected.is_available && (
                <p className="mt-2 text-sm font-medium text-accent-deep">{t(locale, "soldOut")}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
