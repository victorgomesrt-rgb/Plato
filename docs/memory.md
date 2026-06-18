# memory.md: Project Memory

Purpose: keep context, decisions, and open questions in one place so any future session picks up fast.

## Context
- Founder: Victor, Aruba. Innovation Advisor, runs Aurum Innovations. Strong local network across government, tourism, and small business.
- Inspiration: platepost.io. Video first menus for restaurants. Hosted pages at path slugs, QR and tablet in store, a coming Discovery Network. Their case study sites run on Lovable.
- Goal: a local SaaS for Aruba and the wider Caribbean. Nothing like it exists locally.
- Price band: $100 to $500 per month. Confirmed three tiers at $99, $249, $499.
- Each restaurant lives at platodigital.io/restaurantname. Custom domains available on paid tiers.
- Physical add-ons are core: QR stickers, NFC stickers, table stands, window decals, flyers.

## Market facts (verified June 2026)
- Aruba tourist dining spend 2025: USD 204.4 million, the top expenditure category.
- Stayover visitors about 1.4 million per year, growing near 10%.
- 78% of visitors from North America, paying in USD.
- Average stay 7.8 nights. Gen Z arrivals rising.

## Decisions made
- Name: Plato. Confirmed. Domain platodigital.io secured.
- Stack: Next.js, Supabase, Bunny Stream, Vercel, shadcn and Tailwind, Stripe, Resend.
- Auth: Supabase Auth, not Clerk. RLS depends on auth.uid(). Small auth surface since diners never log in. Revisit Clerk only for org UI or enterprise SSO later.
- Multi-tenancy: single app, single database, RLS isolation by tenant_id.
- Routing: path-based. platodigital.io/[slug] for tenant pages. Reserved-slug guard required. Custom domains by host via Vercel. No wildcard DNS needed.
- Public pages: server rendered with the service role and ISR, not open anon policies. Safer and fast.
- Video: short muted loops, 4 to 12 seconds, poster first.
- Service model: content capture is a service in every plan. You go on-site, shoot photos and videos, and build the menu. The owner gets a dashboard for quick edits only, not for building. Owners do not self-register.
- Plans defined. Starter: online menu, restaurant info and buttons, on-site capture, one QR code stand, dashboard, basic analytics. Growth: all that plus full video menu, advanced analytics, NFC and QR sticker pack, window decal, custom domain, EN and ES. Premium: all that plus Discovery feature spot, priority support, flyer design, quarterly re-shoot, full kit.
- Re-shoot cadence: Starter pays per visit, Growth one per year, Premium quarterly.
- Setup fee covers the first capture visit. Starter $199, Growth $299, Premium $499.
- Client accounts are provisioned by admin. No plaintext passwords. Send an invite or set-password link, or use magic link for non-technical owners.
- Tablet display: rent, do not sell. About $35 per month, you own and redeploy it, kiosk locked, small deposit and a 6 to 12 month minimum. Optional on any plan. Track the fleet in admin.
- Templates: four layouts, Reel, Grid, Classic, Spotlight. Same data, swappable layout. Build Grid first.
- Featured band: a Most Popular row at the top of every template, driven by an is_featured flag and a featured_rank order on items, capped at eight, hidden when empty. Inspired by the strongest part of the PlatePost layout, made cross-template instead of a fixed page.
- Action bar: configurable buttons stored in tenants.links. Directions, call, WhatsApp, website, reserve, order, email, socials, reviews, menu PDF, wifi, share. Map pin picker in the editor.
- QR and NFC route through tracked redirects /q and /t for reliable scan and tap counts.
- Analytics: cookieless, with a nightly rollup into analytics_daily. Keeps dashboards fast and avoids a cookie wall.
- Billing is method-agnostic. Launch with manual invoicing through admin, with the invoice emailed by Resend and marked paid by hand to activate the tenant. Stripe through the US entity, Skirbi LLC, is an optional card path. Add Sentoo once the Aruba Bank account is open. The plan and status model does not change when the method changes.
- Currency: prices stored in the tenant base currency. The public page has a USD and AWG toggle at the fixed peg, default 1.80, editable. Converted prices round for a clean look. Market-price items do not convert.
- Languages: English and Spanish at launch. Enter the source language, auto-translate fills the second as a draft, you review and fix before publish. Keep dish names as they are.
- Video standard: capture vertical 9 by 16, 4 to 8 seconds, 30 fps, no audio, loopable, under about 60 MB. Crops to square for Grid and Classic. Full framing and lighting rules in design.md.
- Translation provider: the Claude API. It keeps dish names, matches tone, covers EN and ES now and Papiamento later via the existing skill. One vendor.
- AWG rate default 1.80, converted prices rounded to the nearest 0.25.
- Admin QR generator: paste a URL or pick a tenant tracked link, modern styled QR with accent color, center logo, and caption, download PNG, SVG, and print-ready PDF, plus a branded print sheet and bulk generate per tenant.
- Workflow tools planned: QR generator and print pack, menu import from a photo via Claude vision, bulk media uploader, on-site capture checklist, per-tenant onboarding progress, monthly owner analytics email, re-shoot reminders, and a monthly billing run. Owner dashboard stays tiny: sold out, price edit, special, preview and share, download QR, request a change.
- v1 excludes online ordering, reservations, POS, and advanced Discover features. A minimal Discover directory of published restaurants ships in v1 so the Premium featured-placement promise is real.
- Publish gate: a tenant page is live only when published_at is set and status is not suspended or canceled. Status starts at building during onboarding, so half-built menus never leak.
- Video has an async processing state on each item. Page shows the poster until the clip is ready. Loops must be muted and playsinline to autoplay on iPhone, and only the in-view tile autoplays.
- Phone photos: convert HEIC to web format, fix and strip EXIF orientation on upload.
- All date logic uses America/Aruba, AST, UTC minus 4, no daylight saving. Rollup day boundary and open-now both use Aruba time.
- First platform admin is set by a one-time SQL flag after sign-in. Schema kept in supabase/migrations with a seed for the demo tenant.
- Legal docs are a pre-launch must: Terms, Privacy, and a client agreement covering subscription, filmed-content ownership, tablet deposit and term, cancellation, and a non-refundable setup fee.
- Filming service is both a moat and a revenue line on paid tiers.

## Open questions to resolve
- Hardware suppliers. Confirm NFC bulk source and a fast local print shop. Lock unit costs. Source one or two test tablets.
- Capture capacity. Who shoots and edits as you grow. You alone first, then a part-time shooter.
- Template gating. All templates on all plans, or Reel and Spotlight as an upsell.
- Content ownership. Define in the contract who owns filmed video and what happens on cancellation, and the tablet return terms.

## Recommended starting point
- Sell hands-on for the first 10 customers. Build the flagship free, film it, use it to close. Open self-serve signup once the funnel and onboarding are proven.

## Brand note
- Plato: plate in Spanish and Papiamento. Reads clean at platodigital.io/restaurantname. Travels across the Dutch Caribbean and into Latin America, so it supports expansion.
- Logo: a P formed from a play button, food in motion. Artwork saved in the brand folder: full sheet, lockup, mark, app icon, reversed mark. Documented in design.md.
- Brand color is Plato Orange #FB6A1A, sampled from the logo, on ink #16110E. This replaced the earlier coral across docs and mockups.
- Considered and dropped: Dushi, Smak, Wowo. Plato won on travel and URL fit.

## Files in this project
README.md, plan.md, architecture.md, design.md, finance.md, gtm.md, qa.md, memory.md.

## Status
Planning complete. Name and domain locked: Plato, platodigital.io. Next action: create the Supabase project, run the schema and RLS from architecture.md, scaffold the Next.js repo with path-based middleware and the reserved-slug guard, and start Week 1 of the sprint in plan.md.
