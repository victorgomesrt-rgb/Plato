# qa.md: QA and Launch Checklist

## 1. Security and RLS (highest priority)
Multi-tenant data isolation is the thing you cannot get wrong.

- [ ] Create two test tenants, A and B, with separate owners.
- [ ] Owner A cannot read tenant B rows in tenants, menu_categories, menu_items, media_assets, subscriptions, hardware_orders, analytics_events.
- [ ] Owner A cannot update or delete tenant B rows.
- [ ] A direct API call with owner A token and a tenant B id returns no rows.
- [ ] Anon role cannot read private tables directly. Confirm in the SQL editor as the anon role.
- [ ] Public page renders only visible categories and available items.
- [ ] Service role is never shipped to the client bundle. Check the network tab and the JS.
- [ ] Storage: owner A cannot write under tenant B prefix.
- [ ] Platform admin can read across tenants. Non admin cannot.
- [ ] A member cannot set is_platform_admin on their own profile. The trigger rejects it.
- [ ] A member cannot change their tenant plan, status, published_at, custom_domain, or slug directly. The trigger rejects it. Only admin or the service role can.
- [ ] Impersonation in admin is logged and scoped.

## 2. Auth
- [ ] Sign up creates a profile and a tenant and a membership.
- [ ] Magic link and password both work.
- [ ] Forgot password works end to end.
- [ ] Session persists and refresh works.
- [ ] Sign out clears the session.
- [ ] Invited team member joins the correct tenant with the correct role.
- [ ] Admin New Client form creates the tenant, owner account, and membership, then sends a working invite link.
- [ ] No plaintext password is ever generated, shown, or emailed.
- [ ] Owner accepts the invite, sets a password, and reaches only their own dashboard.
- [ ] Magic link sign-in works for an owner with no password set.
- [ ] A member can read only the tablet assigned to their tenant. Non-admins cannot write the tablets table.

## 3. Menu editor
- [ ] Add, edit, delete category and item.
- [ ] Drag to reorder persists.
- [ ] Availability toggle reflects on the public page after revalidation.
- [ ] Item cap enforced per plan on the server, not only the UI.
- [ ] Price formats correctly for the chosen currency.
- [ ] Translation fields save per locale.

## 4. Media and video
- [ ] Image upload, optimization, and display.
- [ ] HEIC photo from an iPhone converts to a web format and shows the right way up. EXIF is stripped.
- [ ] Video upload to Bunny, transcode completes, poster appears, video_status flips to ready.
- [ ] While a clip is processing, the page shows the poster, not a broken player. A failed clip falls back to the still image.
- [ ] Loops are muted and playsinline and autoplay on a real iPhone in Safari.
- [ ] On the grid, only the in-view tile plays. Others are paused.
- [ ] Upload flags a clip that misses the standard, wrong ratio, too long, or oversized, before it goes live.
- [ ] A 9 by 16 source crops cleanly to square for Grid and Classic with the dish still centered.
- [ ] Large file handled gracefully with progress and error states.
- [ ] Reduced motion setting shows posters only.

## 5. Public page
- [ ] Path slug resolves to the right tenant at platodigital.io/slug.
- [ ] A building tenant with no published_at returns a clean not found. It is never publicly visible.
- [ ] Setting the tenant live from admin publishes the page within seconds.
- [ ] Renaming a slug 301 redirects the old slug to the new one.
- [ ] Reserved slugs like dashboard, admin, api, login cannot be claimed at signup or on slug change.
- [ ] Custom domain resolves and serves HTTPS.
- [ ] Unknown slug shows a clean not found, not a crash.
- [ ] Suspended tenant shows the soft placeholder.
- [ ] Discover page lists only published tenants, with Premium featured first.
- [ ] Dashboard, admin, and api routes carry noindex. Public menus are indexable.
- [ ] Directions, call, WhatsApp, and social links work.
- [ ] Action bar shows only enabled buttons, in the set order, each opening the right target.
- [ ] Each template renders the same menu correctly: Reel, Grid, Classic, Spotlight.
- [ ] Switching template updates the live page after revalidation.
- [ ] QR redirect /q/{code} logs a scan then opens the menu. NFC redirect /t/{code} logs a tap then opens the menu.
- [ ] Shared link shows a correct Open Graph title, description, and image on WhatsApp and Instagram.
- [ ] Map pin set in the editor drives the Directions button and the footer map.
- [ ] price_text shows when price is empty, for example market price.
- [ ] Currency toggle switches USD and AWG, converts at the tenant rate, and rounds cleanly. Market-price items stay as text.
- [ ] Featured band shows the marked items in featured_rank order, capped at eight, and hides fully when none are marked.
- [ ] Tapping a featured card opens the same item view. In the Reel template the featured dishes lead the feed.
- [ ] Language toggle switches all visible strings and item fields.
- [ ] Loads under 2 seconds on a throttled 4G profile on a mid-range phone.
- [ ] Works on iOS Safari and Android Chrome.

## 6. Billing
- [ ] Admin creates an invoice, Resend emails it, and the PDF link works.
- [ ] Marking an invoice paid sets the tenant active and rolls the period forward.
- [ ] An unpaid invoice triggers a reminder on schedule.
- [ ] Optional Stripe path: checkout sets plan and status, and the webhook updates on success, cancel, and failure.
- [ ] Billing is method-agnostic. Adding a method does not change plan or status logic.
- [ ] Past due shows the banner and the grace behavior, then the soft notice.
- [ ] Upgrade and downgrade change feature gates immediately.

## 7. Hardware and QR generator
- [ ] Order request creates a row and shows status.
- [ ] Admin sees the order in the queue and can advance status.
- [ ] Catalog respects plan inclusions.
- [ ] QR generator builds a code from a pasted URL and from a tenant tracked link.
- [ ] A tenant-link QR points at the /q redirect, and scanning it counts a scan.
- [ ] Styled output applies the accent color, center logo, and caption.
- [ ] Download works for PNG, SVG, and print-ready PDF.
- [ ] Bulk generate produces table, window, and host-stand codes for a tenant.

## 8. Analytics
- [ ] Events fire for page view, item view, video play, directions, call, link click, QR scan, NFC tap.
- [ ] Events insert via service role from the public page API, not from an open client policy.
- [ ] Nightly rollup writes analytics_daily correctly and the dashboard reads the rollup.
- [ ] The rollup day boundary uses Aruba time. An 11 PM view counts on the right day.
- [ ] Analytics use no cookie and store no personal data. No consent wall appears.
- [ ] Obvious bot traffic is filtered before counting.
- [ ] Owner sees only their own tenant data.
- [ ] Date range and trend render correctly with real and empty data.

## 9. Empty states
- [ ] Every empty state in design.md renders and looks intentional.
- [ ] No raw blank screens anywhere.

## 10. Admin console
- [ ] Tenant table search and filters work.
- [ ] MRR, plan mix, churn, new this month compute correctly.
- [ ] Suspend, activate, change plan all take effect.

## 11. Accessibility and polish
- [ ] Contrast passes AA on accent over white and over photo overlays.
- [ ] Keyboard navigation across the dashboard.
- [ ] Tap targets at least 44px.
- [ ] Loading and error states on every async action.
- [ ] No console errors in production build.

## 12. Localization and currency
- [ ] EN and ES complete on the public page and editor labels.
- [ ] Auto-translate fills the second language as an editable draft. It never publishes without review.
- [ ] Dish proper names are preserved through translation.
- [ ] Fallback to default locale when a translation is missing.
- [ ] Currency toggle and date formats correct in both currencies.

## 13. Launch checklist
- [ ] Production Supabase with RLS verified.
- [ ] platodigital.io live with SSL. Custom domain flow and per-domain SSL working.
- [ ] Stripe in live mode with webhooks pointed at production.
- [ ] Bunny production library with delivery limits set.
- [ ] Backups enabled on Supabase.
- [ ] First platform admin flag set. No tenant can self-grant admin.
- [ ] Terms, Privacy, and the client agreement published and linked.
- [ ] Resend domain verified with SPF and DKIM. Invite and receipt emails land.
- [ ] Error monitoring set up.
- [ ] Flagship restaurant live and filmed.
- [ ] Sales one pager, price sheet, and demo link ready.
- [ ] Hardware stock on hand to place within a week of closing.
