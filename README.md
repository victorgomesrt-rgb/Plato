# Plato: Video Menus for Caribbean Restaurants

> Brand: Plato. Domain: platodigital.io (secured). Restaurant pages live at platodigital.io/restaurantname.

## One line
A subscription platform that gives every restaurant a fast, mobile-first video menu on its own web address, plus the physical QR and NFC tools to send diners straight to it.

## Why this wins in Aruba
- Dining is the #1 tourist spend category in Aruba. USD 204.4M in 2025.
- ~1.4M stayover visitors per year, growing about 10% year over year.
- 78% of visitors come from North America and pay in USD.
- Average stay is 7.8 nights, so each tourist eats out many times.
- Gen Z arrivals are rising. This group decides what to eat from video.
- No local SaaS offers hosted video menus today. First mover advantage.

## What the customer gets
- A menu page at `platodigital.io/yourname` or their own custom domain.
- A choice of four menu layouts: Reel, Grid, Classic, Spotlight.
- Looping video or image clips for each dish. People eat with their eyes.
- A configurable button bar: directions, call, WhatsApp, website, reserve, order, reviews, wifi, and more.
- We come on-site and shoot your food photos and videos, on every plan.
- A simple dashboard for quick edits like sold out and price changes.
- A QR code stand on every plan. Sticker pack, window decal, and more on higher plans, all tracked.
- An optional rented tablet display in kiosk mode for your counter or entrance.
- Optional flyer design on Premium.
- Basic analytics: views, top dishes, scans, directions clicks.

## Pricing at a glance
- Starter: $99/mo
- Growth: $249/mo
- Premium: $499/mo
- Annual: pay 10 months, get 12.
- One-time setup and hardware add-ons per plan.

Full numbers in `finance.md`.

## The documents in this folder
1. `plan.md`: the full plan and the 2 to 4 week build sprint.
2. `architecture.md`: stack, database schema, auth, RLS, multi-tenancy, video, billing, redirects, SEO.
3. `design.md`: design system, templates, action bar, every screen, UX flows, empty states.
4. `finance.md`: pricing, revenue forecast, profit forecast, hardware costs.
5. `gtm.md`: go to market, sales motion, physical products, partnerships.
6. `qa.md`: QA checklist, RLS tests, launch checklist.
7. `memory.md`: decisions log, open questions, context for future sessions.
8. `review.md`: full project review, blindspot audit, and priorities.
9. `CLAUDE.md`: the build brief for Claude Code. Build order, conventions, guardrails, acceptance.
10. `operations.md`: the service runbook. Capture, build, hardware, billing, support, capacity.
11. `legal.md`: outline for Terms, Privacy, and the client service agreement. A pre-launch blocker.
12. `copy.md`: transactional emails in English and Spanish, plus the interface strings.
13. `sales-kit.md`: the one-page pitch, the demo script, and objection answers.
14. `claude-code-handoff.md`: setup, the kickoff prompt, and the build milestones.

Mockups in `mockups`: `landing.html`, `menu.html` (Grid template), `admin.html` (with the QR generator), `dashboard.html` (owner dashboard), `reel.html` (Reel template).

## Stack summary
Next.js (App Router), Supabase (Postgres, Auth, Storage, RLS), Bunny Stream for video, Vercel hosting, shadcn/ui and Tailwind, Resend for email, Stripe for billing.

## Naming and domain (decided)
Brand: **Plato**. Plate in Spanish and Papiamento. Travels across the Dutch Caribbean and into Latin America, so it carries the expansion well.

Logo: a P built from a play button, food in motion. Artwork is in the `brand` folder. Brand color is Plato Orange `#FB6A1A` on ink `#16110E`. Logo usage is documented in `design.md`.

Domain: **platodigital.io**, secured.

URL structure: path-based. Each restaurant lives at `platodigital.io/restaurantname`, for example `platodigital.io/hungparadise`. Custom domains stay available on paid tiers for owners who want their own web address.
