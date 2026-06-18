# claude-code-handoff.md: Build Handoff

This is how you start the build with Claude Code. CLAUDE.md is the agent guide that lives at the repo root and sets the rules. This file is the kickoff: what to set up, the prompt to paste, and the order to build in.

## 1. Accounts to set up first
Create these yourself. Never paste secrets into the chat. Put keys in a local .env that Claude Code reads.
- GitHub repo for the project.
- Supabase project. Note the project URL, the anon key, and the service role key.
- Bunny Stream account for video.
- Vercel account, linked to the repo, with the domain platodigital.io.
- Resend account with the sending domain verified, SPF and DKIM.
- Stripe later, only when you turn on the card path. Sentoo later still.
- Node 20 or newer on your machine.

## 2. Local setup
1. Create the Next.js app with TypeScript and the App Router. Add Tailwind and shadcn/ui.
2. Put all the planning docs in a /docs folder in the repo. Copy CLAUDE.md to the repo root so Claude Code reads it on every run.
3. Add the brand assets to /public/brand.
4. Create supabase/migrations and supabase/seed.sql. Create .env.example from architecture.md section 23, and a real .env you keep private.

## 3. The kickoff prompt
Paste this into Claude Code at the repo root after setup:

"Read CLAUDE.md and the files in /docs, especially architecture.md, design.md, plan.md, and qa.md. Build Plato, a multi-tenant video-menu SaaS, in the order in CLAUDE.md. Start with milestone M1, the Supabase migrations: all tables, helper functions, RLS policies, and the privileged-column trigger guards from architecture.md, plus seed.sql for the demo tenant. Use the Plato tokens from design.md. Do not expose the service role to the client. Enforce plan caps on the server. Stop after M1 and show me the migration files and how to run them, then wait for my go-ahead before M2."

Work one milestone at a time. After each, run the matching qa.md checks, commit, then tell Claude Code to continue.

## 4. Milestones and done-checks
Each maps to the build order in CLAUDE.md and the checklist in qa.md.

M1. Database and security. All tables, functions, RLS, trigger guards, seed. Done when the qa RLS and isolation tests pass and a member cannot change a privileged column.

M2. Auth and routing. Supabase Auth, path-based middleware, reserved-slug guard, custom domain by host. Done when /login works, slugs resolve, reserved words are blocked, and an unpublished tenant 404s.

M3. Provisioning. Admin New Client form, create tenant and owner and membership, invite link, no plaintext password. Set the first admin by SQL once. Done when you can create a client and they receive a set-password link.

M4. Menu editor and media. Item and category editing, plan caps, image upload with HEIC convert and EXIF strip, Bunny upload with the processing state. Done when items save, caps hold, photos show upright, and video flips to ready with a poster.

M5. Public page, Grid template. Server rendered, publish gate, action bar, currency toggle, language toggle, OG and schema.org, fast on 4G. Done when the demo tenant page passes the public-page qa checks on a real iPhone.

M6. Tracked links and QR. /q and /t redirects that log scans, the QR generator with PNG, SVG, and print PDF. Done when a scanned tenant QR counts a scan and downloads work.

M7. Billing. Manual invoices created in admin, emailed by Resend, marked paid to activate. Method-agnostic for Sentoo later. Stripe optional. Done when the invoice flow activates a tenant end to end.

M8. Analytics. Cookieless events, the nightly rollup in Aruba time, the dashboard view. Done when views and scans show correctly and the day boundary uses Aruba time.

M9. Finish. Admin console, Discover directory, remaining templates including Reel, all empty states, English and Spanish. Done when the full launch checklist in qa.md passes.

## 5. The working loop
- Build one milestone.
- Run the qa.md checks for it.
- Fix until green.
- Commit with a clear message.
- Tell Claude Code to start the next milestone.
Keep diffs small. Review the migrations and any RLS change by hand.

## 6. Guardrails
These come from CLAUDE.md and are not optional: service role stays server side, caps enforced on the server, trigger guards kept, publish gate enforced, video muted and playsinline with only the in-view tile playing, cookieless analytics, Aruba time everywhere, prices in the base currency with the USD and AWG toggle at 1.80 rounded to 0.25.

## 7. Before the first paying customer
- Terms, Privacy, and the client service agreement signed off by a lawyer. See legal.md.
- Resend domain verified so invoices and invites land.
- One full demo tenant live and tested on a real phone.
- A backup of the database confirmed.
