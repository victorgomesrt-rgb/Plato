// Localized fields + UI strings, design.md §10. EN/ES at launch; fall back to the
// default locale when a translation is missing. Dish proper names are kept as entered.

export function localized(
  base: string | null,
  i18n: Record<string, string> | null | undefined,
  locale: string,
  defaultLocale: string
): string {
  if (locale === defaultLocale) return base ?? "";
  return i18n?.[locale]?.trim() || base || "";
}

type Dict = Record<string, string>;

const STRINGS: Record<string, Dict> = {
  en: {
    mostPopular: "Most Popular",
    soldOut: "Sold out",
    directions: "Directions",
    call: "Call",
    whatsapp: "WhatsApp",
    website: "Website",
    reserve: "Reserve",
    order: "Order",
    email: "Email",
    instagram: "Instagram",
    tiktok: "TikTok",
    facebook: "Facebook",
    reviews: "Reviews",
    menu_pdf: "Menu",
    wifi: "WiFi",
    share: "Share",
    poweredBy: "Powered by Plato",
    privacy: "Privacy",
    openNow: "Open now",
    closed: "Closed",
    hours: "Hours",
    close: "Close",
    linkCopied: "Link copied",
  },
  es: {
    mostPopular: "Lo Más Popular",
    soldOut: "Agotado",
    directions: "Cómo llegar",
    call: "Llamar",
    whatsapp: "WhatsApp",
    website: "Sitio web",
    reserve: "Reservar",
    order: "Ordenar",
    email: "Correo",
    instagram: "Instagram",
    tiktok: "TikTok",
    facebook: "Facebook",
    reviews: "Reseñas",
    menu_pdf: "Menú",
    wifi: "WiFi",
    share: "Compartir",
    poweredBy: "Powered by Plato",
    privacy: "Privacidad",
    openNow: "Abierto ahora",
    closed: "Cerrado",
    hours: "Horario",
    close: "Cerrar",
    linkCopied: "Enlace copiado",
  },
};

export function t(locale: string, key: string): string {
  return STRINGS[locale]?.[key] ?? STRINGS.en[key] ?? key;
}

export const LOCALE_LABELS: Record<string, string> = { en: "EN", es: "ES", nl: "NL", pap: "PAP" };
