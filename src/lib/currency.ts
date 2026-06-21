// USD ⇄ AWG display, docs/architecture.md §9a, design.md §10.
// Prices are stored in the tenant base currency. The florin is pegged to the dollar,
// so conversion is a fixed multiply. Round AWG to 0.25, USD to 0.05 for a clean look.

export type DisplayCurrency = "USD" | "AWG";

function roundTo(value: number, step: number): number {
  return Math.round(value / step) * step;
}

export function convertPrice(
  base: number,
  baseCurrency: string,
  to: DisplayCurrency,
  fxRate: number
): number {
  const usd = baseCurrency === "AWG" ? base / fxRate : base;
  return to === "USD" ? roundTo(usd, 0.05) : roundTo(usd * fxRate, 0.25);
}

export function formatPrice(value: number, currency: DisplayCurrency): string {
  return currency === "USD" ? `$${value.toFixed(2)}` : `Afl. ${value.toFixed(2)}`;
}

// Full label for an item. price_text (e.g. "Market price") never converts.
export function priceLabel(
  price: number | null,
  priceText: string | null,
  to: DisplayCurrency,
  baseCurrency: string,
  fxRate: number
): string {
  if (priceText) return priceText;
  if (price == null) return "";
  return formatPrice(convertPrice(price, baseCurrency, to, fxRate), to);
}
