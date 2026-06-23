# qa.md: QA and Launch Checklist

> Status as of 2026-06-22. `[x]` = verified in code/live. Unchecked items carry a parenthetical reason: **(NOT BUILT)**, **(manual/device/ops)** = needs a real device, live test, or operational sign-off that can't be self-certified from code, or **(partial)**. Full evidence and notes live in [qa-audit.md](qa-audit.md).

## 1. Security and RLS (highest priority)
Multi-tenant data isolation is the thing you cannot get wrong.

- [ ] Create two test tenants, A and B, with separate owners. (manual: this is the live-test setup)
- [x] Owner A cannot read tenant B rows in tenants, menu_categories, menu_items, media_assets, subscriptions, hardware_orders, analytics_events.
- [x] Owner A cannot update or delete tenant B rows.
- [x] A direct API call with owner A token and a tenant B id returns no rows.
- [x] Anon role cannot read private tables directly. Confirm in the SQL editor as the anon role.
- [x] Public page renders only visible categories and available items.
- [x] Service role is never shipped to the client bundle. Check the network tab and the JS.
- [x] Storage: owner A cannot write under tenant B prefix.
- [x] Platform admin can read across tenants. Non admin cannot.
- [x] A member cannot set is_platform_admin on their own profile. The trigger rejects it.
- [x] A member cannot change their tenant plan, status, published_at, custom_domain, or slug directly. The trigger rejects it. Only admin or the service role can.
- [x] Impersonation in admin is logged and scoped. (read-only "View as owner"; logged to admin_impersonations)

## 2. Auth
- [ ] Sign up creates a profile and a tenant and a membership. (N/A by design: no public self-signup; the admin New Client flow creates all three, see below)
- [x] Magic link and password both work.
- [x] Forgot password works end to end.
- [x] Session persists and refresh works.
- [x] Sign out clears the session.
- [ ] Invited team member joins the correct tenant with the correct role. (owner invite works; no separate "invite a teammate" UI yet)
- [x] Admin New Client form creates the tenant, owner account, and membership, then sends a working invite link.
- [x] No plaintext password is ever generated, shown, or emailed.
- [x] Owner accepts the invite, sets a password, and reaches their dashboard.
- [x] Magic link sign-in works for an owner with no password set.
- [x] A member can read only the tablet assigned to their tenant. Non-admins cannot write the tablets table.

## 3. Menu editor
- [x] Add, edit, delete category and item.
- [x] Drag to reorder persists.
- [x] Availability toggle reflects on the public page after revalidation.
- [x] Item cap enforced per plan on the server, not only the UI.
- [x] Price formats correctly for the chosen currency.
- [x] Translation fields save per locale.

## 4. Media and video
- [x] Image upload, optimization, and display.
- [ ] HEIC photo from an iPhone converts to a web format and shows the right way up. EXIF is stripped. (code present; needs a real iPhone photo)
- [ ] Video upload to Bunny, transcode completes, poster appears, video_status flips to ready. (upload present; the status→ready path is unverified, no Bunny webhook route found)
- [ ] While a clip is processing, the page shows the poster, not a broken player. A failed clip falls back to the still image. (manual)
- [ ] Loops are muted and playsinline and autoplay on a real iPhone in Safari. (device)
- [x] On the grid, only the in-view tile plays. Others are paused.
- [ ] Upload flags a clip that misses the standard, wrong ratio, too long, or oversized, before it goes live. (partial; manual)
- [ ] A 9 by 16 source crops cleanly to square for Grid and Classic with the dish still centered. (manual)
- [ ] Large file handled gracefully with progress and error states. (manual)
- [x] Reduced motion setting shows posters only.

## 5. Public page
- [x] Path slug resolves to the right tenant at platodigital.io/slug.
- [x] A building tenant with no published_at returns a clean not found. It is never publicly visible.
- [x] Setting the tenant live from admin publishes the page within seconds.
- [x] Renaming a slug 301 redirects the old slug to the new one. (permanentRedirect / HTTP 308)
- [x] Reserved slugs like dashboard, admin, api, login cannot be claimed at signup or on slug change.
- [ ] Custom domain resolves and serves HTTPS. (NOT BUILT: no host routing / middleware)
- [x] Unknown slug shows a clean not found, not a crash.
- [x] Suspended tenant shows the soft placeholder.
- [x] Discover page lists only published tenants, with Premium featured first.
- [x] Dashboard, admin, and api routes carry noindex. Public menus are indexable.
- [x] Directions, call, WhatsApp, and social links work.
- [x] Action bar shows only enabled buttons, in the set order, each opening the right target.
- [x] Each template renders the same menu correctly: Reel, Grid, Classic, Spotlight.
- [x] Switching template updates the live page after revalidation.
- [x] QR redirect /q/{code} logs a scan then opens the menu. NFC redirect /t/{code} logs a tap then opens the menu.
- [x] Shared link shows a correct Open Graph title, description, and image on WhatsApp and Instagram.
- [x] Map pin set in the editor drives the Directions button and the footer map.
- [x] price_text shows when price is empty, for example market price.
- [x] Currency toggle switches USD and AWG, converts at the tenant rate, and rounds cleanly. Market-price items stay as text.
- [x] Featured band shows the marked items in featured_rank order, capped at eight, and hides fully when none are marked.
- [x] Tapping a featured card opens the same item view. In the Reel template the featured dishes lead the feed.
- [x] Language toggle switches all visible strings and item fields.
- [ ] Loads under 2 seconds on a throttled 4G profile on a mid-range phone. (perf, manual)
- [ ] Works on iOS Safari and Android Chrome. (device)

## 6. Billing
- [x] Admin creates an invoice, Resend emails it, and the PDF link works.
- [x] Marking an invoice paid sets the tenant active and rolls the period forward.
- [x] An unpaid invoice triggers a reminder on schedule.
- [ ] Optional Stripe path: checkout sets plan and status, and the webhook updates on success, cancel, and failure. (NOT WIRED: invoice-only for now)
- [x] Billing is method-agnostic. Adding a method does not change plan or status logic.
- [x] Past due shows the banner and the grace behavior, then the soft notice.
- [x] Upgrade and downgrade change feature gates immediately.

## 7. Hardware and QR generator
- [x] Order request creates a row and shows status.
- [x] Admin sees the order in the queue and can advance status.
- [ ] Catalog respects plan inclusions. (needs check)
- [x] QR generator builds a code from a pasted URL and from a tenant tracked link.
- [x] A tenant-link QR points at the /q redirect, and scanning it counts a scan.
- [ ] Styled output applies the accent color, center logo, and caption. (needs check)
- [ ] Download works for PNG, SVG, and print-ready PDF. (needs check)
- [ ] Bulk generate produces table, window, and host-stand codes for a tenant. (needs check)

## 8. Analytics
- [x] Events fire for page view, item view, video play, directions, call, link click, QR scan, NFC tap.
- [x] Events insert via service role from the public page API, not from an open client policy.
- [x] Nightly rollup writes analytics_daily correctly and the dashboard reads the rollup.
- [x] The rollup day boundary uses Aruba time. An 11 PM view counts on the right day.
- [x] Analytics use no cookie and store no personal data. No consent wall appears.
- [x] Obvious bot traffic is filtered before counting.
- [x] Owner sees only their own tenant data.
- [x] Date range and trend render correctly with real and empty data.

## 9. Empty states
- [x] Every empty state in design.md renders and looks intentional.
- [x] No raw blank screens anywhere.

## 10. Admin console
- [ ] Tenant table search and filters work. (needs check)
- [x] MRR, plan mix, churn, new this month compute correctly.
- [x] Suspend, activate, change plan all take effect.

## 11. Accessibility and polish
- [ ] Contrast: white-on-orange CTAs are a KNOWN, ACCEPTED brand exception (decision 2026-06-22 — keep `#FB6A1A` + white per the mockups; ~2.9:1, below AA 4.5:1). Other text/contrast OK. (Dish image alt text + a global keyboard focus ring were added.)
- [ ] Keyboard navigation across the dashboard. (manual; global :focus-visible ring added)
- [x] Tap targets at least 44px.
- [x] Loading and error states on every async action.
- [ ] No console errors in a production build. (runtime check)

## 12. Localization and currency
- [ ] EN and ES complete on the public page and editor labels. (public page complete; owner/admin editor labels are EN-only)
- [x] Auto-translate fills the second language as an editable draft. It never publishes without review.
- [ ] Dish proper names are preserved through translation. (needs check)
- [x] Fallback to default locale when a translation is missing.
- [x] Currency toggle and date formats correct in both currencies.

## 13. Plato Card — Apple Wallet coalition loyalty (NEW, building 2026-06-23)
Full spec: [plato-card.md](plato-card.md). v1 = one shared pass + member discount + admin/paid blasts.
- [ ] PassBuddy keys are server-only (`PASSBUDDY_USER_ID`/`PASSBUDDY_API_KEY` never in the client bundle). (build)
- [ ] `lib/passbuddy.ts` wraps create/update/notify; maps error codes; a PassBuddy outage never blocks menu render. (build)
- [ ] `wallet_passes` + `wallet_blasts` tables with RLS (admin/service write; owners insert + read only their own blasts). (build)
- [ ] `tenants.wallet_partner` + `wallet_discount` are owner-editable (unguarded columns). (build)
- [ ] Diner `/card` page renders the card, the Add-to-Wallet link (`passbuddy.xyz/share/pass/<shareId>`), and the partner list. (build)
- [ ] "Plato Card" entry in the diner action bar links to `/card`. (build)
- [ ] Add-to-Wallet actually installs the pass in Apple Wallet. (manual/device)
- [ ] Glass surfaces stay legible (AA) with no scroll jank on a real device; solid fallback if blur stutters. (manual/device)
- [ ] Owner sets member discount + "listed" toggle → reflected on `/card` and the diner page. (build)
- [ ] Owner promo request → admin queue → approve/send pushes + raises a $75 invoice; decline closes it. (build)
- [ ] Admin network blast (now + scheduled) sends and is received in Wallet. (build + manual)
- [ ] Admin-only push enforced; owners cannot push directly (RLS + route gate). (build)
- [ ] Weekly blast cadence cap enforced server-side. (build)
- [ ] Notification budget surfaced in admin; `NOTIFICATION_LIMIT_EXCEEDED` handled gracefully. (build)
- [ ] Pricing wired: $75/blast, $199/mo bundle (4), 1 free/mo on Premium. (build/ops)
- [ ] Apple Wallet only for v1; Android/Google Wallet deferred. (scope)
- [ ] Pre-launch: replace the weserv proxy logo/strip with hosted ≤160px assets on the live card. (build/ops)

## 14. Launch checklist
- [x] Production Supabase with RLS verified.
- [ ] platodigital.io live with SSL. Custom domain flow and per-domain SSL working. (site SSL live; custom-domain flow NOT BUILT)
- [ ] Stripe in live mode with webhooks pointed at production. (NOT WIRED)
- [ ] Bunny production library with delivery limits set. (ops)
- [ ] Backups enabled on Supabase. (ops)
- [x] First platform admin flag set. No tenant can self-grant admin.
- [x] Terms, Privacy, and the client agreement published and linked.
- [x] Resend domain verified with SPF and DKIM. Invite and receipt emails land. (Resend verified; Supabase Auth + transactional both via Resend, verified)
- [ ] Error monitoring set up. (ops)
- [ ] Flagship restaurant live and filmed. (ops)
- [ ] Sales one pager, price sheet, and demo link ready. (ops)
- [ ] Hardware stock on hand to place within a week of closing. (ops)
