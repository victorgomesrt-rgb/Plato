// Pick the readable text color (Plato ink or white) for a given background color, by WCAG
// relative-luminance contrast. Used where a tenant's custom accent is a background (diner
// action bar, reel price badge) so text stays legible whether their accent is light or dark.

const INK = "#16110e";
const WHITE = "#ffffff";

function luminance(hex: string): number {
  const h = hex.replace("#", "");
  const n = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const ch = [0, 2, 4].map((i) => {
    const c = parseInt(n.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}

function ratio(a: number, b: number): number {
  const hi = Math.max(a, b), lo = Math.min(a, b);
  return (hi + 0.05) / (lo + 0.05);
}

// Returns ink or white — whichever has higher contrast against `bg`.
export function textOn(bg: string): string {
  try {
    const l = luminance(bg);
    return ratio(l, luminance(INK)) >= ratio(l, luminance(WHITE)) ? INK : WHITE;
  } catch {
    return INK; // default accent is light → ink
  }
}
