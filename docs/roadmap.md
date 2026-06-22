# roadmap.md — post-launch enhancements (planned 2026-06-22)

Advisory plans for ideas raised after the core build. Priority order. Status updated as built.

Already done (verified): **logo in QR center** (qr-code-styling, `imageSize 0.28`, "with logo" toggle); **per-restaurant theme rendering** (diner page consumes `tenants.accent_color` via `--color-accent`).

---

## 1. Accessibility — pragmatic AA pass  ·  Priority 1  ·  DONE (with one accepted exception)
Fixed the AA issues that matter; no formal conformance paperwork.
- ✅ Image alt text (dish name), ✅ global `:focus-visible` keyboard ring.
- **Contrast — ACCEPTED AS-IS (decision 2026-06-22)**: white-on-orange `#FB6A1A` ≈ 2.9:1 is below AA 4.5:1 but kept deliberately to preserve the brand/mockup look (used in ~21 CTAs + onboarding card). Documented in qa-audit.md §11 rather than changed. If revisited later: darker `#C2410C` CTAs (white text) or ink text on the bright orange.
- **Keyboard**: every interactive control reachable + visible focus; no carousel traps.
- **ARIA/labels**: `aria-label` on icon-only buttons, `aria-hidden` on decorative icons + the marquee, meaningful `alt` (dish name) on dish images.
- **Structure**: one `<h1>` per page; landmarks; optional skip link.
- Done when: Lighthouse a11y ≥ 95, 0 serious axe violations, keyboard walkthrough works.

## 2. Dietary filter chips  ·  Priority 2  ·  PLANNED
Diners filter the menu by dietary needs. (Tags already display on dishes + are editable in the admin editor; only the diner filter UI + vocab are missing.)
- Expand tag vocab: `vegetarian, vegan, gluten_free, dairy_free, nut_free, raw, halal` (filterable) vs `popular, new, spicy` (promo badges). EN/ES labels.
- Filter chip bar on the diner page, showing only tags present in this tenant's menu; client-side filter (reuse locale/currency state); empty categories collapse.
- Decision: **AND** filtering (diner with restrictions wants dishes matching all).
- Done when: chips filter every template, empty categories hide, EN/ES labels render.

## 3. Theme-color edit UI  ·  Priority 3  ·  PLANNED
Each restaurant sets its own accent (rendering already works).
- Color field in Page Settings → `updateTenantInfo` → `tenants.accent_color` (unguarded column, owner-editable). Gentle contrast warning (ties to #1).
- Done when: changing the color updates the live diner page after revalidation.

## 4. DB index tune-up  ·  Priority 4  ·  LOW URGENCY (defer to scale)
Hot paths already indexed (analytics_events, menu_items ×2, menu_categories, change_requests; slug/custom_domain unique; subscriptions PK by tenant). Add when data grows:
- `invoices(tenant_id, created_at desc)`, confirm `analytics_daily` PK `(tenant_id, day)`, `analytics_events(item_id)` for top-dishes, minor `leads`/`hardware_orders`.
- Done when: `EXPLAIN ANALYZE` on dashboard/rollup queries shows index scans. Not needed pre-launch.
