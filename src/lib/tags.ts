// Menu item tags. "dietary" tags are filterable by diners on the public page; the
// others (popular/new) are promo badges. Labels are localized EN/ES.
export type TagDef = { en: string; es: string; dietary: boolean };

export const TAG_DEFS: Record<string, TagDef> = {
  popular: { en: "Popular", es: "Popular", dietary: false },
  new: { en: "New", es: "Nuevo", dietary: false },
  spicy: { en: "Spicy", es: "Picante", dietary: true },
  vegetarian: { en: "Vegetarian", es: "Vegetariano", dietary: true },
  vegan: { en: "Vegan", es: "Vegano", dietary: true },
  gluten_free: { en: "Gluten-free", es: "Sin gluten", dietary: true },
  dairy_free: { en: "Dairy-free", es: "Sin lácteos", dietary: true },
  nut_free: { en: "Nut-free", es: "Sin frutos secos", dietary: true },
  raw: { en: "Raw", es: "Crudo", dietary: true },
  halal: { en: "Halal", es: "Halal", dietary: true },
};

// Stable display order for the admin tag picker.
export const ALL_TAGS = Object.keys(TAG_DEFS);
export const DIETARY_TAGS = ALL_TAGS.filter((t) => TAG_DEFS[t].dietary);

export function tagLabel(tag: string, locale: string): string {
  const d = TAG_DEFS[tag];
  if (!d) return tag.replace(/_/g, " ");
  return locale === "es" ? d.es : d.en;
}
