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

export function isOpenNow(hours: Hours, now: { day: DayKey; minutes: number } = arubaNow()): boolean {
  if (!hours) return false;
  const { day, minutes } = now;
  // Today's own range. For a wrap (e.g. 20:00-02:00, close<=open) only the EVENING part
  // [open..24:00) belongs to today — the after-midnight tail belongs to the next calendar
  // day (handled by the previous-day branch below), so we must NOT count `minutes < close`
  // here or an early-morning time would look open before today's opening.
  const range = hours[day];
  if (range) {
    const [open, close] = range.map(toMinutes);
    if (close <= open ? minutes >= open : minutes >= open && minutes < close) return true;
  }
  // A wrap that opened YESTERDAY and runs past midnight into now (e.g. Fri 20:00-02:00 is
  // still open at Sat 01:00, where today's own entry may be null or a later range).
  const prev = DAY_KEYS[(DAY_KEYS.indexOf(day) + 6) % 7];
  const prevRange = hours[prev];
  if (prevRange) {
    const [open, close] = prevRange.map(toMinutes);
    if (close <= open && minutes < close) return true;
  }
  return false;
}
