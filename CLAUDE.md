# CLAUDE.md: Build Brief for Plato

This file guides the build. Read it first, then build to the specs in the other docs. Do not invent product behavior. When unsure, follow architecture.md and design.md, and ask before deviating.

## What we are building
Plato is a multi-tenant SaaS that gives each restaurant a fast, mobile-first video menu at platodigital.io/slug, plus a private dashboard and an internal admin. Diners never log in. Our team captures the food, builds the menu, and publishes it.

## Sources of truth
- architecture.md: stack, database schema, RLS, triggers, routing, video, billing, currency, env, migrations.
- design.md: design system, logo, tokens, templates, screens, empty states, capture standard.
- plan.md: scope and build order.
- qa.md: the acceptance checklist. A feature is done when its checks pass.
- finance.md, gtm.md: pricing and go to market context.
- brand: logo artwork and the brand color.

## Stack and conventions
- Next.js App Router, TypeScript, server components and server actions.
- Supabase for Postgres, Auth, Storage, RLS. Bunny Stream for video. Vercel hosting. shadcn/ui and Tailwind. Resend for email. Stripe optional, manual invoicing first.
- Schema, functions, and policies live in supabase/migrations as ordered files. A seed.sql creates the demo tenant.
- Tailwind tokens match design.md. Plato Orange #FB6A1A, ink #16110E. Display font Bricolage Grotesque, body Inter.
- Keep components small. Keep the public page server rendered and cached.

## Build order
1. Project scaffold, Tailwind tokens, shadcn, env from architecture.md.
2. Supabase migrations: tables, helper functions, RLS, the privileged-column trigger guards. Seed the demo tenant.
3. Auth and path-based middleware with the reserved-slug guard. Custom domains by host.
4. Admin New Client provisioning and the invite flow. Set the first admin by SQL once.
5. Menu editor, media upload, the Bunny video pipeline with processing state.
6. Public menu page, Grid template first, with the publish gate, currency toggle, language toggle, action bar, OG metadata, schema.org.
7. Tracked redirects /q and /t. QR generator with PNG, SVG, and print PDF.
8. Billing: manual invoices emailed by Resend, mark paid in admin. Stripe optional. Keep it method-agnostic for Sentoo later.
9. Analytics events, the nightly rollup in Aruba time, the analytics view.
10. Admin console, Discover directory, remaining templates, empty states, EN and ES.

## Non-negotiable guardrails
- Never ship the Supabase service role to the client. Server only.
- Do not open anonymous RLS on private tables. Render the public page on the server with the service role and a publish gate.
- Enforce plan caps on the server action, never only in the UI.
- Keep the privileged-column trigger guards. A member must not change plan, status, published_at, custom_domain, slug, or is_platform_admin.
- A page is public only when published_at is set and status is not suspended or canceled. Building tenants 404.
- Video loops must be muted and playsinline and autoplay only the in-view tile.
- Analytics are cookieless with no personal data. No consent wall.
- All date logic uses America/Aruba, AST, UTC minus 4, no daylight saving.
- Convert HEIC to a web format and fix and strip EXIF on image upload.
- Prices store in the tenant base currency. The USD and AWG toggle converts at fx_rate, default 1.80, rounded to the nearest 0.25.

## Definition of done per feature
- Matches design.md, including the empty state.
- Passes the relevant qa.md checks.
- Mobile first and responsive. Visible keyboard focus. Reduced motion respected.
- No console errors in a production build.
- Tenant isolation verified for any feature that touches tenant data.

## First-run
- After your first sign-in, set is_platform_admin true on your profile by SQL. Nothing in the app grants admin.
- Seed one demo tenant, platodigital.io/hungparadise, with a full menu.

## Environment
See architecture.md section 23 for the full list. Scaffold an .env.example. Required: Supabase URL and keys, Bunny keys, Resend key, site URL. Stripe keys when the card path is enabled.
