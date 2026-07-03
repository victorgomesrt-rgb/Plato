import "server-only";

// America/Aruba (AST, UTC-4, no DST) calendar helpers. CLAUDE.md: all Plato date logic
// runs in AST. Vercel servers run in UTC, so `new Date()` month/day math drifts a day
// (a whole month at month-end) — use these instead for date-only stamps and billing periods.

export function arubaToday(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Aruba" }).format(new Date());
}

// "This month" in Aruba time as a billing period, plus a due date N days out.
export function arubaBillingPeriod(dueInDays = 14): {
  periodStart: string;
  periodEnd: string;
  dueDate: string;
} {
  const today = arubaToday(); // YYYY-MM-DD
  const [y, m] = today.split("-").map(Number);
  const periodStart = `${y}-${String(m).padStart(2, "0")}-01`;
  // Date.UTC month is 0-based, so month=m (1-based) day=0 → last day of the 1-based month.
  const periodEnd = new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);
  const due = new Date(`${today}T00:00:00Z`);
  due.setUTCDate(due.getUTCDate() + dueInDays);
  return { periodStart, periodEnd, dueDate: due.toISOString().slice(0, 10) };
}
