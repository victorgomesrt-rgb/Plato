# plato-card.md — Plato Card (Apple Wallet coalition loyalty) · build plan

Planned 2026-06-23. **Plan only — no code yet.** v1 = the shared "Plato Card" model:
one Plato-branded Apple Wallet pass, a standing member discount at partnered
restaurants, and admin-curated + restaurant-paid push blasts. Built on PassBuddy
(`https://www.passbuddy.xyz`). Per-diner points are explicitly **out of v1** (see §10).

Why: a QR video menu is a one-time scan with no retention. A wallet pass Plato owns
turns that scan into a re-engagement channel **we** control, and we sell reach back to
restaurants. New recurring revenue + a moat no plain-QR competitor can copy.

## 1. The decision that shapes everything
PassBuddy ties points + push to a single `passId` (`notify` = "all devices that
installed *that* pass"). v1 uses **ONE shared Plato Card** that every diner adds:
- ✅ One `notify` call reaches every Plato member (island-wide blast). Cheap: 1 pass, metered notifications.
- ✅ No login needed — adding is anonymous (fits Plato's no-diner-login rule).
- ❌ Points/tier fields are shared, so **no per-diner points** and **no per-restaurant push targeting**. Those need per-diner passes (Phase 2, §10).

So v1 sells **member discount (perk)** + **network reach (blasts)**, not accumulating points.

## 2. v1 scope
**In:** one shared Plato Card; diner "Add to Apple Wallet"; per-restaurant standing
member discount; admin-only network blasts (now or scheduled); restaurant promo
requests → admin approves/sends → invoiced; participating-restaurants list.
**Out:** per-diner points/stamps, scan-to-earn, redemption logging, per-restaurant
push targeting, Android/Google Wallet (PassBuddy is Apple-only).

## 3. How it works (three actors)
- **Diner:** taps "Add the Plato Card" on a partnered menu (or `/card`). It opens the
  hosted `.pkpass` → card lands in Apple Wallet, Plato-branded. The card back lists
  partner restaurants + their member discount. No account, no per-diner pass created.
- **Owner (dashboard):** sets/edits their standing member discount (e.g. "10% off"),
  toggles participation, and submits a **promo blast request** (compose special +
  preferred date). Reuses the change-request + billing patterns already built. Owners
  **cannot** push directly.
- **Admin = Plato HQ (you):** the only one who sends. Compose a network blast (now or
  `scheduledAt`); review the restaurant promo queue → **Send** (calls notify + logs +
  raises an invoice for the charge) or **Decline**. Manage the Plato Card branding.

## 4. Data model (new migrations)
- `wallet_passes` — pass registry (built flexible so Phase 2 reuses it):
  `id, kind ('plato_card' in v1), passbuddy_pass_id, slug, serial, share_id, pass_url, created_at`.
  v1 holds exactly one row (the Plato Card). RLS: admin/service-role only.
- `wallet_blasts` — every push, and the monetization ledger:
  `id, tenant_id (null = Plato's own network blast; set = a restaurant's paid promo),
  message, status (requested|approved|scheduled|sent|declined), scheduled_at, sent_at,
  requested_by, sent_by, passbuddy_message_id, invoice_id (null until billed), price, created_at`.
  RLS: owners INSERT/READ their own tenant's rows; admin all; send/decline = admin only.
- `tenants` add: `wallet_partner boolean default false`, `wallet_discount text` (the
  perk shown on the card back + diner page, e.g. "10% off"). Both owner-editable
  (unguarded columns, like `accent_color`).

## 5. Server lib — `src/lib/passbuddy.ts` (server-only)
Thin wrapper, `import "server-only"`, never reaches the client bundle:
- `createPass(input)` → `{ passId, slug, serial, shareId, passUrl }`
- `updatePass(passId, fields)` (auto-pushes per their API)
- `notify(passId, message, scheduledAt?)` → `{ messageId, status }`
All return a `Result` (`{ok}|{ok:false,error}`); map their error codes
(`PASS_LIMIT_EXCEEDED`, `NOTIFICATION_LIMIT_EXCEEDED`, etc.) to friendly messages.
Calls live only in admin route handlers / server actions + a one-off provisioning
script. Wrapped so a PassBuddy outage never blocks menu rendering.

## 6. Secrets / config (server only, never client)
- `.env.local` + Vercel: `PASSBUDDY_USER_ID`, `PASSBUDDY_API_KEY`.
- Use a **Plato-owned PassBuddy account** (all passes under it, tagged per tenant in our
  DB). The Plato Card's identifiers live in `wallet_passes`, not env.

## 7. Build phases (each independently shippable)
**1a — Card exists + reachable.** lib/passbuddy.ts; one-off script to create the Plato
Card → store in `wallet_passes`; diner "Add to Apple Wallet" button (action bar + a
`/card` page) linking to the hosted pass URL; admin "send network blast (now/scheduled)".
*Done when:* card adds on a real iPhone; an admin blast is received in Wallet; keys never in client bundle; build clean.

**1b — Monetized restaurant promos.** owner "request a promo" form → `wallet_blasts`
(requested); admin queue → Send (notify + log) / Decline; on send, raise an invoice
(reuse invoices) for the blast fee.
*Done when:* owner request appears in admin queue; admin send pushes + creates a Paid-able invoice; decline closes it; cadence cap enforced.

**1c — Discount + partner list.** owner sets `wallet_discount` + `wallet_partner` in
page settings; diner page + card back + `/discover` show the perk and participating spots.
*Done when:* setting a discount shows it on the live diner page after revalidation; partner list renders.

## 8. Guardrails
- **Admin-only send** (currentAdmin gate; notify only in admin routes).
- **Cadence cap** (e.g. ≤ N network blasts/week) enforced server-side to protect the
  diner experience; paid sends framed as curated "featured this week".
- PassBuddy failures caught + surfaced to admin; never block the menu.
- `NOTIFICATION_LIMIT_EXCEEDED` handled gracefully (queue + alert you).
- Cookieless/no-PII unchanged — the shared pass needs no diner identity.

## 9. Verifiable success criteria (whole of v1)
Card creates once + adds on iPhone; diner add works from menu + `/card`; owner sets
discount + submits a promo; admin sends a network blast (push received), approves a
promo (push + invoice), declines one; cadence cap holds; discount + partner list render
on the diner page; all PassBuddy calls server-only; clean production build, no console errors.

## 10. Assumptions to confirm (Karpathy: surfaced, not assumed silently)
1. **Hosted pass URL** — PassBuddy hosts the `.pkpass` (returns `slug`/`passShareId`);
   v1 links to that public URL as "Add to Wallet". *Confirm the exact URL format against
   a real created pass before building 1a.*
2. **One Plato PassBuddy account** for the whole platform (founder's account = Plato's is fine).
3. **Plan limits** — need the PassBuddy plan's pass + notification caps to size the
   cadence cap + blast pricing. *Get these numbers.*
4. **Blast pricing** — a flat per-blast fee vs a monthly "promotions" add-on. *Your call (a number).*
5. **Discount validation** — v1 = visual proof (staff honor the card on sight); no barcode
   scan / redemption logging (logging pushes toward Phase 2).
6. **Apple-only** acceptable for v1 (Android diners excluded).

## 12. Verified findings (2026-06-23, live API test — the real Plato Card exists)
Created the actual Plato Card with the live key (free plan, 1-pass slot used; fully
refinable via PATCH). Learnings that change the build:
- **Created card:** `passId=k575wdz0kj187tvs975eybbywx897p46`, `slug=plato-card`,
  `passShareId=share-1392f159-ff50-445a-9b11-54c187e7fec9`, `organizationId=org_3FVJXVYSywcPPnSeBnljcoA9wJY`. Store these in `wallet_passes` when building 1a.
- **Logo must be ≤160px wide** (1x) or create 500s (`PKPASS_GENERATION_FAILED`). Host a
  properly-sized 1x/2x/3x logo on platodigital.io for prod (currently using a weserv
  proxy resize as a stopgap — replace it; don't depend on a 3rd-party image proxy).
- **`stripImage` is REQUIRED** despite the docs marking it optional (375×144). Need a
  *designed* Plato strip banner (currently a placeholder: white mark on ink). 
- **The API does NOT return the hosted .pkpass / Add-to-Wallet URL.** GET on a pass is
  405; no public URL pattern resolves. The shareable link lives in the PassBuddy
  dashboard (keyed off `passShareId`). **Blocker for the diner button: get the real
  share URL from the dashboard once, then we hardcode/store the pattern.**
- **Plan fit:** Free = 1 pass + 15,000 notifications/mo → **covers all of v1** (v1 uses
  exactly 1 pass). Pro (3 passes / 150k notif) only needed for Phase 2 or extra cards.
- **Notification budget = the real constraint.** A blast pushes to every device with the
  card; confirm with PassBuddy whether the quota counts **per send (1)** or **per device
  (N)**. If per-device, audience × sends burns the quota (e.g. 15k free ≈ 3 blasts to a
  5k-member base) — this caps how many paid blasts you can fulfill and informs pricing +
  the cadence cap. *Confirm before pricing is finalized.*

## 13. Blast pricing — recommendation + comparables
Marginal cost of a wallet push is ~$0, so price on **value**, not cost. Comparables:
SMS marketing ≈ $0.008–0.05 per text (Twilio ~$0.0079; Attentive/Klaviyo all-in higher);
local "featured"/promoted placements $25–$200; loyalty/marketing SaaS (Square Marketing,
Thanx, Yotpo) $15–$300+/mo. Wallet push is premium (lock-screen visibility, you curate,
exclusive channel). Recommended start:
- **$75 flat per promoted blast**, positioned "reach every Plato member in Aruba, one tap,
  higher engagement than SMS or boosting a post."
- **$199/mo "always promoting" bundle** (up to 4 blasts/mo) for predictable revenue.
- **Premium plan perk:** 1 free blast/mo (drives plan upgrades).
Adjust from real data; ensure price comfortably exceeds the per-blast notification cost.

## 11. Future — Phase 2 (per-diner points), only if traction warrants
Unique pass per diner → real cross-restaurant points + individual targeting. Needs:
unique passes (`wallet_passes.kind='member'`), a points ledger, a staff "scan to award"
flow, and N-call or segmented blasts. Much bigger + scales PassBuddy cost with diners.
The v1 schema above is shaped so this layers on without a rewrite.
