# Pre-launch bug hunt — 2026-08-06

Final pre-launch review by two parallel read-only agents (Fable 5 = public diner path + billing/plan-caps; Opus = auth/RLS/isolation + admin/owner). **0 critical, 2 high, 6 medium, 7 low.**

The security crown jewels were verified solid: tenant isolation, the `guard_tenant_cols` service-role null-check + column set (across all redefinitions), impersonation being read-only via `assertWritable`, service-role staying server-only, storage-bucket scoping, and analytics RPCs revoked from anon.

**All 15 findings are FIXED and shipped** in commit `2ec175b`, with migration `20260806140000_prelaunch_guard_hardening.sql` applied to production and verified. Live smoke-tested: diner page 200, OG image 200, owner billing → login 307, lint clean.

---

## HIGH

**H1 — Owner "PDF" invoice link was a raw private-storage path (404/403).** `invoices.pdf_url` stores a path in the private `invoices` bucket; the owner page linked it directly while admin correctly used `invoiceSignedUrl()`.
Fix: the owner page now links to a membership-gated route (`/dashboard/billing/invoice/[id]`) that resolves the tenant, confirms the invoice is theirs, and 302s to a short-lived signed URL.

**H2 — Plato Card action button never rendered.** `wallet_partner` tenants inject `{type:"plato_card", url:"/card"}`, but `safeUrl()` only allows `http(s)/tel/mailto`, so the href was null and the button (and, for a partner with no other links, the whole floating bar) was empty.
Fix: `hrefFor` special-cases the internal `plato_card` link.

## MEDIUM

**M1 — `previous_slug` was member-writable → slug-redirect squatting.** It wasn't in `guard_tenant_cols()` but `tenants_update` RLS lets members update their own row, and `/[slug]` 308-redirects on it.
Fix (migration): added `previous_slug` to the privileged-column guard.

**M2 — Reserved-slug list missing 5 live routes.** `book, card, agreement, forgot, reset-password` were provision-able, which would shadow the real static routes and misroute printed QR codes.
Fix: added all five to `RESERVED_SLUGS`.

**M3 — `convertPrice` rounded even the no-conversion case.** A USD-base 9.99 rendered "$10.00"; an AWG-base 12.60 rendered "Afl. 12.50" — misstating the restaurant's own price.
Fix: return the base price untouched when the display currency equals the base; round only converted values.

**M4 — Currency/locale choice leaked across tenants.** `sessionStorage` keys were origin-global and applied regardless of `dual_currency`, so a single-currency tenant opened after a dual-currency one showed converted prices with no toggle back.
Fix: namespaced the keys per tenant slug and honor a stored currency only when the tenant offers the toggle.

**M5 — Reel template ignored category visibility and sold-out state.** It rendered items from hidden/uncategorized categories and never marked `is_available === false`, unlike grid/classic/spotlight.
Fix: reel now shows only visible-category items and badges/dims sold-out ones.

**M6 — `markPaid` month-rollover overflowed at end of month.** `setMonth(+1)` on Jan 31 → Mar 3, drifting the renewal date and compounding (same for `review_paid_through`).
Fix: a day-clamped month add (Jan 31 → Feb 28).

## LOW

**L1 — Invoice state-machine gaps.** `sendInvoice` only rejected `paid` (a `void` invoice could be re-sent and re-dunned); `voidInvoice` had no status check (a `paid` invoice could be voided).
Fix: `sendInvoice` requires `draft|sent`; `voidInvoice` refuses a `paid` invoice.

**L2 — Member could write Plato-managed currency/billing columns.** `fx_rate`, `base_currency`, `dual_currency`, `trial_ends_at` were unguarded (self-scoped only).
Fix (migration): added them to `guard_tenant_cols()`.

**L3 — A "done" change-request could be reopened via raw PostgREST.** `cr_update` RLS checks the new status but can't see the old one.
Fix (migration): a trigger blocks a member update when the old status is `done`.

**L4 — `/api/track` accepted any client-supplied `tenant_id`.** Item ownership was checked, the tenant was not, allowing cross-tenant analytics inflation.
Fix: verify the tenant is a live public tenant and, when a referer is sent, require it to match the tenant's slug/custom domain. Residual: a script that spoofs the `Referer` header can still inflate, bounded by the existing per-IP/session rate limits.

**L5 — `/q` and `/t` scan counters had no bot filter.** Link-preview unfurlers inflated scan counts.
Fix: skip the count for bot/unfurler user-agents (still redirect); also applied to `/r`.

**L6 — Overnight hours showed "Closed" after midnight.** `isOpenNow` only read the current day's range, so a Fri 20:00–02:00 venue was "Closed" at Sat 01:00. (It also mis-reported a venue as open before its own opening time.)
Fix: correctly handle wraps — a wrap's evening belongs to today, its after-midnight tail to the next day — with an injectable clock for tests.

**L7 — An unlaunched review-only tenant served a public page.** The `review_only` branch ran before the publish gate and only checked suspended/canceled.
Fix: a review-only tenant that has never been set up (no `review_active`/`review_url`) now 404s.
