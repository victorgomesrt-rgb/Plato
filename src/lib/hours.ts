// Opening hours in America/Aruba (AST, UTC-4, no DST), docs/architecture.md §20.

export const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
export type DayKey = (typeof DAY_KEYS)[number];
export type Hours = Record<string, [string, string] | null> | null;

// Current Aruba day key + HH:MM, computed from a timezone-fixed formatter so the
// result is identical on server and client regardless of machine timezone.
export function arubaNow(): { day: DayKey; minutes: number } {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Aruba",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(new Date());
  const wd = parts.find((p) => p.type === "weekday")?.value ?? "Sun";
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  const map: Record<string, DayKey> = {
    Sun: "sun", Mon: "mon", Tue: "tue", Wed: "wed", Thu: "thu", Fri: "fri", Sat: "sat",
  };
  return { day: map[wd] ?? "sun", minutes: (hour % 24) * 60 + minute };
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + (m || 0);
}

export function isOpenNow(hours: Hours): boolean {
  if (!hours) return false;
  const { day, minutes } = arubaNow();
  const range = hours[day];
  if (!range) return false;
  const [open, close] = range.map(toMinutes);
  // Handle ranges that cross midnight (e.g. 11:00-00:00).
  return close <= open ? minutes >= open || minutes < close : minutes >= open && minutes < close;
}
