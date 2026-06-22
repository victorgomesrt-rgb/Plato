# qa-audit.md — status of qa.md (audited 2026-06-22)

Verdict legend: ✅ verified in code/live · ⚠️ partial / caveat · ❌ not implemented / fails · 🔍 needs manual, runtime, device, or ops verification (can't be proven by reading code).

This records current status against `qa.md`; `qa.md` itself stays the pristine acceptance spec.

**Tally:** ✅ ~40 · ⚠️ 4 · ❌ 4 · 🔍 ~45. The build is solid on security, auth, analytics, billing-by-invoice, and the public page. The real gaps are **custom domains (not built)**, **Stripe (not wired)**, **admin impersonation (not built)**, and a large set of items that genuinely need a live 2-tenant test / real iPhone / ops config. (Slug-rename permanence and the owner set-password step were fixed 2026-06-22.)

---

## 1. Security & RLS
- 🔍 Two test tenants A/B isolation — **policies support it** (`is_member_of` on every tenant-scoped table) but the formal proof needs a live 2-tenant test.
- ✅ Owner A cannot read/update/delete B — RLS policies via `is_member_of(tenant_id)` (rls.sql).
- ✅ Anon cannot read private tables — RLS enabled, no anon policies; public page renders via service role.
- ✅ Public page renders only visible categories / available items — `getMenu` filters (lib/menu.ts).
- ✅ Service role never in client bundle — verified (only server files import `createAdminClient`).
- ✅ Storage: owner A cannot write under B prefix — storage.sql restricts writes to `is_member_of(foldername[1]::uuid)`.
- ✅ Admin reads across tenants; non-admin cannot — `is_admin()` policies.
- ✅ Member cannot self-grant `is_platform_admin` — `guard_profile_cols` trigger.
- ✅ Member cannot change plan/status/published_at/custom_domain/slug — `guard_tenant_cols` trigger (blocks authenticated non-admins; service role/admin bypass).
- ❌ Impersonation in admin logged & scoped — **no impersonation feature exists.**

## 2. Auth
- ⚠️ "Sign up creates profile+tenant+membership" — **no public self-signup by design** (CLAUDE.md: team provisions). The admin New Client flow creates all three (line below).
- ✅ Magic link AND password both work — login offers both; `auth/callback` handles PKCE + OTP.
- ✅ Forgot password end-to-end — `/forgot` + `/reset-password` + callback.
- ✅ Session persists / refresh — supabase ssr client.
- ✅ Sign out clears session — `SignOutButton`.
- ✅ Admin New Client creates tenant + owner account + membership + invite — `provisionClient`.
- ✅ No plaintext password generated/shown/emailed — uses `inviteUserByEmail` (set-password link).
- ✅ Owner accepts invite, **sets a password**, reaches dashboard — invite now redirects to the set-password screen first (`?next=/reset-password`), then the dashboard (fixed 2026-06-22).
- ✅ Magic-link sign-in for an owner with no password — supported.
- 🔍 Invited *team member* (beyond the owner) joins correct tenant/role — provisioning links the owner; no separate "invite teammate" UI found.
- 🔍 Member reads only their tenant's tablet; non-admins can't write tablets — verify tablets RLS policy.

## 3. Menu editor
- ✅ Add/edit/delete category & item — admin menu-editor.
- 🔍 Drag-to-reorder persists — verify reorder mechanism.
- ✅ Availability toggle reflects on public page after revalidation — owner quick-edit `setItemAvailable` + `revalidatePath`.
- ✅ Item cap enforced per plan on the server — `actions.ts` checks `itemCap(plan)` before insert (starter 40, premium ∞).
- ✅ Price formats correctly for currency — currency lib.
- 🔍 Translation fields save per locale — verify editor writes `*_es` fields.

## 4. Media & video (mostly device/runtime)
- ✅ Image upload, optimization, display — sharp pipeline.
- ✅ (code) HEIC→web + EXIF strip + orientation — `heic-convert` + `sharp().rotate()`; 🔍 confirm on a real iPhone photo.
- ⚠️/🔍 Bunny upload/transcode/poster/`video_status`→ready — upload path exists; **no Bunny webhook route found**, so the status→ready mechanism is unverified.
- 🔍 Processing shows poster not broken player; failed clip falls back to still.
- 🔍 Loops muted/playsinline/autoplay on real iPhone Safari.
- ✅ (code) Only in-view tile plays — IntersectionObserver in card-media/reel; 🔍 device.
- 🔍 Upload flags wrong ratio / too long / oversized before live (duration warning exists; full set unverified).
- 🔍 9:16 crops cleanly to square, centered.
- 🔍 Large file progress + error states.
- ✅ (code) Reduced motion → posters only.

## 5. Public page
- ✅ Slug resolves to right tenant.
- ✅ Building tenant (no published_at) → clean not-found; never public — `publicState` building→not_found.
- 🔍 Set live from admin publishes within seconds — status change revalidates; confirm the publish action sets `published_at`.
- ✅ Slug rename → permanent redirect — `[slug]/page.tsx` now uses `permanentRedirect()` (HTTP 308, the App Router permanent equivalent of 301; fixed 2026-06-22).
- ✅ Reserved slugs can't be claimed — `isReservedSlug` at creation/slug-change.
- ❌ Custom domain resolves + HTTPS — **not implemented**; column exists but there's no middleware/host routing.
- ✅ Unknown slug → clean not-found — verified live (404).
- ✅ Suspended → soft placeholder — `unavailable` → `<Unavailable />`.
- 🔍 Discover lists only published, Premium featured first — confirm ordering.
- ✅ Dashboard/admin/api noindex; menus indexable — verified live + robots.txt.
- ✅ Directions/Call/WhatsApp/social links work — verified live hrefs.
- ✅ Action bar shows enabled buttons in set order — now owner-editable, auto-built in fixed order.
- 🔍 Each template renders (Reel/Grid/Classic/Spotlight).
- 🔍 Switching template updates live after revalidation.
- ✅ /q and /t log scan/tap then open menu.
- ✅ OG title/description/image present — verified live.
- ✅ Map pin drives Directions + footer map — now owner-editable; footer uses free Google embed.
- ✅ price_text shows when price empty.
- 🔍 Currency toggle rounds to 0.25 cleanly — confirm rounding.
- 🔍 Featured band: featured_rank order, cap 8, hides when none.
- 🔍 Featured tap opens item; Reel leads with featured.
- ✅ Language toggle switches strings + item fields.
- 🔍 <2s on throttled 4G (perf).
- 🔍 iOS Safari + Android Chrome (device).

## 6. Billing
- ✅ Admin invoice + Resend email + PDF link — `createInvoice`/`sendInvoice` (PDF + 30-day signed URL).
- ✅ Mark paid → tenant active + period rolls forward — `markPaid`.
- ✅ Unpaid reminder on schedule — `cron/invoice-reminders` daily (13:00 UTC ≈ 9am Aruba).
- ❌/🔍 Stripe optional path — **no Stripe webhook route found**; manual invoicing only (matches "manual first", but the Stripe path isn't wired).
- ✅ Method-agnostic — manual invoicing; status logic independent.
- 🔍 Past-due banner + grace + soft notice — confirm dashboard banner.
- ✅ Upgrade/downgrade changes gates immediately — `changeTenantPlan` mirrors subscription.

## 7. Hardware & QR
- ✅ Order request creates row + status — hardware_orders + dashboard.
- ✅ Admin sees queue + advances status.
- 🔍 Catalog respects plan inclusions.
- ✅ QR from pasted URL and from tenant tracked link.
- ✅ Tenant-link QR → /q and counts a scan.
- 🔍 Styled output: accent color, center logo, caption.
- 🔍 Download PNG / SVG / print PDF.
- 🔍 Bulk generate table/window/host-stand codes.

## 8. Analytics
- ✅ Events fire for page_view/item_view/video_play/directions/call/link_click/qr_scan/nfc_tap.
- ✅ Insert via service role from the API, not an open client policy.
- ✅ Nightly rollup writes analytics_daily; dashboard reads the rollup — `cron/analytics-rollup` + dashboard.
- ✅ Rollup day boundary uses Aruba time — cron + `arubaStartUTC`.
- ✅ Cookieless, no PII, no consent wall — daily session hash only.
- ✅ Bot traffic filtered — UA regex (+ new rate limiter).
- ✅ Owner sees only their own data — RLS-scoped queries.
- ✅ Date range + trend render with real and empty data — 7/30/90 windows.

## 9. Empty states
- ✅ Empty states render (added this session).
- ✅ No raw blank screens.

## 10. Admin console
- 🔍 Tenant table search & filters — confirm on `/admin/tenants`.
- ✅ MRR / plan mix / churn / new this month compute — admin overview.
- ✅ Suspend / activate / change plan take effect — `setTenantStatus` / `changeTenantPlan`.

## 11. Accessibility & polish
- 🔍 Contrast AA on accent over white / photo overlays.
- 🔍 Keyboard navigation across dashboard.
- ✅ Tap targets ≥44px — h-11/h-12 controls.
- ✅ Loading/error states on async actions (mostly).
- 🔍 No console errors in production (runtime).

## 12. Localization & currency
- ⚠️ EN+ES complete — public page ✅; **editor/dashboard labels are largely EN-only**.
- 🔍 Auto-translate draft never auto-publishes — `translate.ts` exists; confirm review-before-publish.
- 🔍 Proper names preserved through translation.
- ✅ Fallback to default locale when translation missing.
- ✅ Currency + date formats correct in both currencies.

## 13. Launch checklist (mostly ops/config)
- ✅ Production Supabase with RLS verified.
- ✅ platodigital.io live with SSL. ❌ custom-domain flow (see §5).
- ❌/🔍 Stripe live mode + webhooks — not wired.
- 🔍 Bunny production library + delivery limits.
- 🔍 Supabase backups enabled.
- ✅ First platform admin flag set; no self-grant.
- ✅ Terms, Privacy, client agreement published + linked — live.
- 🔍 Resend domain SPF/DKIM; invite + receipt emails land (note: invites currently use Supabase's built-in mailer, not Resend).
- 🔍 Error monitoring.
- 🔍 Flagship restaurant live + filmed.
- 🔍 Sales one-pager / price sheet / demo link.
- 🔍 Hardware stock on hand.
