# architecture.md: Technical Architecture

## 1. Stack
- Frontend and backend: Next.js App Router on Vercel.
- Database and auth: Supabase (Postgres, Auth, Storage, RLS).
- Video: Bunny Stream. Cheap global CDN, automatic transcoding, HLS, poster frames. Good fit for Caribbean delivery cost.
- Images: Supabase Storage with Next.js image optimization.
- Billing: Stripe. Checkout, Customer Portal, webhooks.
- Email: Resend.
- UI: shadcn/ui plus Tailwind.
- QR generation: a QR library at build time or on demand. Store the target URL per tenant.

Rationale: this is your known stack from prior builds. It moves fast and the RLS model fits multi-tenant SaaS cleanly.

## 2. Multi-tenancy model

Single Next.js app. Single Postgres database. Tenant isolation enforced by Row Level Security on every table with a `tenant_id`.

### Routing (path-based)
- Marketing site: `platodigital.io` and `www.platodigital.io`. Routes like `/`, `/pricing`, `/about`, `/login`, `/signup`.
- App dashboard: `platodigital.io/dashboard`.
- Admin console: `platodigital.io/admin`.
- API and webhooks: `platodigital.io/api/...`.
- Tenant public pages: `platodigital.io/[slug]`, for example `platodigital.io/hungparadise`.
- Custom domains: a tenant maps `menu.restaurant.com` through Vercel domains. Store the mapping in `tenants.custom_domain`. These resolve by host.

### Reserved slugs
Because tenant pages share the root path, no restaurant may take a slug that collides with a real route. Block a reserved list at signup and on slug change. Start with: `dashboard`, `admin`, `api`, `login`, `signup`, `logout`, `pricing`, `about`, `contact`, `terms`, `privacy`, `blog`, `help`, `support`, `discover`, `app`, `www`, `static`, `assets`, `favicon`, `robots`, `sitemap`. Validate the slug as lowercase letters, numbers, and hyphens only.

### Tenant resolution
Use Next.js middleware.
- If the host is a custom domain in `tenants.custom_domain`, attach that tenant and render the public menu.
- Else on the root domain, read the first path segment.
  - If it is empty or a reserved word, route to marketing, dashboard, admin, or api as normal.
  - Otherwise treat it as a tenant slug. Look up the tenant. Attach the tenant id. Render the public menu. If no tenant matches, render a clean not found.

Cache the slug to tenant and host to tenant lookups. They change rarely.

## 3. Auth

### Decision: Supabase Auth, not a separate provider
Use Supabase Auth. Do not split auth into Clerk or another service. Reasons:
- The entire RLS model depends on `auth.uid()` from the Supabase session. Native Supabase Auth gives that for free. A separate provider means bridging its token into Supabase so RLS still works, which is extra setup and one more thing to break.
- Only restaurant owners and you log in. Diners never log in. The auth surface is small, so a heavy auth product adds cost without much gain.
- One system means one bill, one mental model, faster shipping in the sprint.

When Clerk would make sense: if you later want their prebuilt organization and member management UI, many social logins fast, or enterprise SSO. Supabase supports third-party auth, so you could adopt Clerk later and point RLS at the Clerk token. Not needed now.

### Setup
- Email magic link plus email and password. Add Google sign-in for convenience.
- Owner signs up, a `profile` row is created by trigger.
- A user belongs to one or more tenants through `tenant_members` with a role.
- Platform admin is a flag on `profiles.is_platform_admin`. Only you.
- Public menu pages need no auth. They read published data through a cached server fetch.

## 4. Database schema

Run this in Supabase SQL editor. Adjust names to taste.

```sql
-- Extensions
create extension if not exists "pgcrypto";

-- Profiles, linked to auth.users
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  is_platform_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- Tenants, one per restaurant
create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$'),  -- lowercase, numbers, hyphens. Reserved words blocked in app logic
  name text not null,
  custom_domain text unique,
  description text,
  logo_url text,
  cover_url text,
  accent_color text default '#FB6A1A',
  base_currency text not null default 'USD', -- the currency you price in, USD or AWG
  fx_rate numeric(8,4) not null default 1.80, -- USD to AWG peg, editable per tenant
  dual_currency boolean not null default true, -- show the USD and AWG toggle on the page
  address text,
  lat double precision,
  lng double precision,
  phone text,
  whatsapp text,
  hours jsonb,            -- structured opening hours
  socials jsonb,          -- legacy. prefer links below
  links jsonb default '[]'::jsonb,  -- ordered action bar. [{type, url, label, enabled}]. types: website, directions, call, whatsapp, email, reserve, order, instagram, tiktok, facebook, reviews, menu_pdf, wifi, share
  template text not null default 'grid',  -- grid, reel, classic, spotlight
  theme jsonb default '{}'::jsonb,        -- per-template options: font pairing, layout density
  default_locale text not null default 'en',
  locales text[] not null default array['en','es'],
  plan text not null default 'starter',     -- starter, growth, premium
  status text not null default 'building',  -- building, trialing, active, past_due, suspended, canceled
  published_at timestamptz,                 -- null until you publish. public page 404s until set
  previous_slug text,                       -- keep old slug after a rename, 301 redirect from it
  trial_ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Membership, links users to tenants with a role
create table public.tenant_members (
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'owner',  -- owner, manager, staff
  created_at timestamptz not null default now(),
  primary key (tenant_id, user_id)
);

-- Menu categories
create table public.menu_categories (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  name_i18n jsonb,        -- {es:"...", nl:"...", pap:"..."}
  sort_order int not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now()
);

-- Menu items
create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  category_id uuid references public.menu_categories(id) on delete set null,
  name text not null,
  name_i18n jsonb,
  description text,
  description_i18n jsonb,
  price numeric(10,2),
  price_text text,        -- for "market price", ranges, or "from $12". Falls back when price is null
  options jsonb,          -- optional sizes or variants for display. [{label:"Large", price:18}]
  image_url text,
  video_provider text,    -- bunny
  video_id text,          -- bunny video guid
  video_thumb_url text,
  video_status text not null default 'none',  -- none, processing, ready, failed. page shows poster until ready
  tags text[],            -- spicy, vegan, gluten_free, popular, new
  is_available boolean not null default true,
  is_featured boolean not null default false, -- shows in the Most Popular band
  featured_rank int,                          -- order within the band, lower first
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Media library, optional shared asset store
create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  kind text not null,      -- image, video
  provider text,
  provider_id text,
  url text,
  thumb_url text,
  created_at timestamptz not null default now()
);

-- Subscriptions, mirror of Stripe state
create table public.subscriptions (
  tenant_id uuid primary key references public.tenants(id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan text not null default 'starter',
  status text not null default 'trialing',
  interval text default 'month',     -- month, year
  current_period_end timestamptz,
  updated_at timestamptz not null default now()
);

-- Invoices for manual billing now, and any method later
create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  number text unique,            -- human readable, PLATO-2026-0001
  amount numeric(10,2) not null,
  currency text not null default 'USD',
  period_start date,
  period_end date,
  method text not null default 'manual',  -- manual, stripe, sentoo
  status text not null default 'draft',    -- draft, sent, paid, void
  due_date date,
  sent_at timestamptz,
  paid_at timestamptz,
  pdf_url text,
  created_at timestamptz not null default now()
);
create table public.hardware_orders (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  item_type text not null,   -- qr_sticker, nfc_sticker, table_stand, window_decal, flyer
  quantity int not null default 1,
  notes text,
  status text not null default 'requested', -- requested, in_production, shipped, delivered
  created_at timestamptz not null default now()
);

-- Rented tablet fleet. You own the devices and redeploy them
create table public.tablets (
  id uuid primary key default gen_random_uuid(),
  asset_tag text unique,           -- your label on the device
  model text,                      -- ipad 9th gen, etc
  status text not null default 'in_stock', -- in_stock, deployed, returned, retired
  tenant_id uuid references public.tenants(id) on delete set null, -- current assignment
  monthly_fee numeric(10,2) default 35,
  deposit numeric(10,2),
  term_months int default 6,
  deployed_at date,
  returned_at date,
  created_at timestamptz not null default now()
);

-- Tracked short links for QR codes and NFC tags
-- QR and NFC point here, not straight at the menu, so scans and taps are counted reliably
create table public.short_links (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  code text not null unique,      -- the path used in /q/{code} and /t/{code}
  kind text not null,             -- qr, nfc
  placement text,                 -- table, window, host_stand, flyer, bag
  scans int not null default 0,
  created_at timestamptz not null default now()
);

-- Analytics events, append only. Kept short term, then rolled up
create table public.analytics_events (
  id bigint generated always as identity primary key,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  item_id uuid,
  event_type text not null,  -- page_view, item_view, video_play, directions_click, call_click, link_click, qr_scan, nfc_tap
  session_id text,           -- anonymous hashed session, no cookie, no personal data
  referrer text,
  created_at timestamptz not null default now()
);
create index on public.analytics_events (tenant_id, created_at);

-- Daily rollup so dashboards stay fast and the raw table stays small
-- A nightly job aggregates yesterday into this table, then prunes old raw rows
create table public.analytics_daily (
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  day date not null,
  page_views int not null default 0,
  unique_sessions int not null default 0,
  qr_scans int not null default 0,
  nfc_taps int not null default 0,
  video_plays int not null default 0,
  directions_clicks int not null default 0,
  call_clicks int not null default 0,
  link_clicks int not null default 0,
  primary key (tenant_id, day)
);
create index on public.menu_items (tenant_id, category_id, sort_order);
create index on public.menu_items (tenant_id, is_featured, featured_rank);
create index on public.menu_categories (tenant_id, sort_order);
```

## 5. Helper for RLS

```sql
-- Returns true if the current user belongs to the tenant
create or replace function public.is_member_of(t uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.tenant_members m
    where m.tenant_id = t and m.user_id = auth.uid()
  );
$$;

-- Returns true if the current user is a platform admin
create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(
    (select is_platform_admin from public.profiles where id = auth.uid()),
    false
  );
$$;
```

## 6. Row Level Security

Enable RLS on every table. Then add policies.

```sql
alter table public.profiles enable row level security;
alter table public.tenants enable row level security;
alter table public.tenant_members enable row level security;
alter table public.menu_categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.media_assets enable row level security;
alter table public.subscriptions enable row level security;
alter table public.invoices enable row level security;
alter table public.hardware_orders enable row level security;
alter table public.tablets enable row level security;
alter table public.analytics_events enable row level security;
alter table public.analytics_daily enable row level security;
alter table public.short_links enable row level security;

-- Profiles: a user reads and edits own row. Admin reads all.
create policy profiles_self on public.profiles
  for select using (id = auth.uid() or public.is_admin());
create policy profiles_update_self on public.profiles
  for update using (id = auth.uid());

-- Tenants: members read their tenant. Admin reads all. Owners update.
create policy tenants_read on public.tenants
  for select using (public.is_member_of(id) or public.is_admin());
create policy tenants_update on public.tenants
  for update using (public.is_member_of(id) or public.is_admin());

-- Tenant members: members of the tenant read. Admin all.
create policy members_read on public.tenant_members
  for select using (public.is_member_of(tenant_id) or public.is_admin());

-- Menu categories: members manage. Admin all.
create policy cats_all on public.menu_categories
  for all using (public.is_member_of(tenant_id) or public.is_admin())
  with check (public.is_member_of(tenant_id) or public.is_admin());

-- Menu items: members manage. Admin all.
create policy items_all on public.menu_items
  for all using (public.is_member_of(tenant_id) or public.is_admin())
  with check (public.is_member_of(tenant_id) or public.is_admin());

-- Media assets
create policy media_all on public.media_assets
  for all using (public.is_member_of(tenant_id) or public.is_admin())
  with check (public.is_member_of(tenant_id) or public.is_admin());

-- Subscriptions: members read, admin all. Writes happen via service role in webhooks.
create policy subs_read on public.subscriptions
  for select using (public.is_member_of(tenant_id) or public.is_admin());

-- Invoices: members read their own. Admin all. Writes via admin or service role.
create policy invoices_read on public.invoices
  for select using (public.is_member_of(tenant_id) or public.is_admin());

-- Hardware orders: members manage their own. Admin all.
create policy hw_all on public.hardware_orders
  for all using (public.is_member_of(tenant_id) or public.is_admin())
  with check (public.is_member_of(tenant_id) or public.is_admin());

-- Tablets: the fleet is yours. Admin manages all. A member may read the tablet assigned to their tenant.
create policy tablets_admin_all on public.tablets
  for all using (public.is_admin())
  with check (public.is_admin());
create policy tablets_member_read on public.tablets
  for select using (public.is_member_of(tenant_id) or public.is_admin());

-- Analytics: members read their own. Admin all. Inserts via service role from the public page API.
create policy analytics_read on public.analytics_events
  for select using (public.is_member_of(tenant_id) or public.is_admin());

-- Daily rollups: members read their own. Admin all. Writes via service role nightly job.
create policy analytics_daily_read on public.analytics_daily
  for select using (public.is_member_of(tenant_id) or public.is_admin());

-- Short links: members read their own. Admin all. The redirect route reads and increments via service role.
create policy short_links_read on public.short_links
  for select using (public.is_member_of(tenant_id) or public.is_admin());
```

### Protect privileged columns (important)
The simple update policies above let a member update their own profile and tenant rows. By itself that lets a member set `profiles.is_platform_admin = true` on themselves, or set their tenant's `plan`, `status`, `published_at`, `custom_domain`, or `slug`. That is a privilege and billing escalation. Postgres RLS is row level, not column level, so guard the sensitive columns with a trigger that only an admin may change them. Everything else owners may edit.

```sql
-- Block non-admins from changing privileged tenant columns
create or replace function public.guard_tenant_cols()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    if new.plan is distinct from old.plan
       or new.status is distinct from old.status
       or new.published_at is distinct from old.published_at
       or new.custom_domain is distinct from old.custom_domain
       or new.slug is distinct from old.slug then
      raise exception 'These fields are managed by Plato';
    end if;
  end if;
  new.updated_at = now();
  return new;
end $$;
create trigger trg_guard_tenant before update on public.tenants
  for each row execute function public.guard_tenant_cols();

-- Block non-admins from granting themselves admin
create or replace function public.guard_profile_cols()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() and new.is_platform_admin is distinct from old.is_platform_admin then
    raise exception 'Not allowed';
  end if;
  return new;
end $$;
create trigger trg_guard_profile before update on public.profiles
  for each row execute function public.guard_profile_cols();
```

Plan, status, and published_at are written only by the Stripe webhook and your admin actions, both using the service role, which bypasses these guards.

### Public menu reads
Do not open these tables to the anonymous role directly. Instead render the public page on the server. The Next.js server uses the service role key to fetch only the published, visible data for the resolved tenant, then caches it with ISR. This keeps private fields and other tenants fully sealed while the page stays fast.

Publish gate. The public page renders only when `published_at` is set and `status` is not `suspended` or `canceled`. While `status` is `building`, the slug returns a clean not found, so a half-built menu never leaks during onboarding. Set `published_at` from admin when the menu is ready to go live. A past_due tenant stays live during a short grace window, then shows the soft notice.

Alternative if you want pure client reads on the public page: add narrow anon select policies that expose only visible categories and available items for an active tenant. The server-render path is safer and is the recommendation.

## 7. Storage
- Bucket `logos`, `covers`, `item-images`. Path prefixed by tenant id.
- Storage policies mirror the table rule: a user writes only under their tenant prefix.
- Public read on image buckets is fine since menu images are meant to be public.

### Image handling for phone photos
You shoot on a phone, so the upload must handle real-world phone files.
- Accept HEIC and JPEG. Convert HEIC to WebP or JPEG on upload, since browsers do not render HEIC.
- Read and apply EXIF orientation, then strip EXIF. Otherwise photos show sideways and leak location data.
- Generate a few sizes and serve WebP. Keep the original private, serve optimized variants on the page.

## 8. Video pipeline with Bunny Stream
1. You upload a clip in the editor.
2. Server requests a Bunny upload URL, gets a video guid. Set the item `video_status` to `processing`.
3. The file uploads straight to Bunny.
4. Bunny transcodes and creates a poster frame. A webhook or a poll flips `video_status` to `ready` and stores `video_thumb_url`.
5. The public page shows the poster while `processing`, swaps to the loop when `ready`, and falls back to the still image if `failed`.

Keep clips short, 4 to 12 seconds, no audio. This keeps delivery cost low and load fast.

### Autoplay rules that actually work on phones
- The loop must be `muted`, `playsinline`, `loop`, and `autoplay`. Without `muted` and `playsinline`, iOS Safari will not autoplay, and iPhone is the main device here.
- Do not autoplay every tile at once. On the grid, autoplay only the tile in view and pause the rest. This protects the diner's data and battery, a real concern for visitors on roaming.
- Respect reduced motion. If set, show posters only.

### Encoding and source targets
For one consistent look across the whole platform, hold to one standard. Full capture standard with framing and lighting is in design.md.
- Capture vertical, 9 by 16, 1080 by 1920. This feeds the Reel template directly and center-crops cleanly to 1 by 1 for Grid and Classic.
- Length 4 to 8 seconds, designed to loop with no hard cut.
- 30 fps, no audio.
- Source upload MP4 or MOV, H.264, kept under about 60 MB per clip. A few seconds at 1080p is small.
- Bunny transcodes to adaptive renditions and a poster frame. Store one poster per item.

## 9. Billing flow

Build billing method-agnostic. The tenant has a plan and a status. How they pay is a separate, swappable layer. This lets you start manual and add Sentoo later without reworking the model.

### Launch: manual invoicing
- In admin, generate an invoice for a tenant. It writes a row in `invoices` and a numbered PDF.
- Resend emails the invoice with payment instructions, bank transfer or in person.
- When the money arrives, mark the invoice paid in admin. That sets `tenants.status` to active and rolls the subscription period forward.
- Reminders for unpaid invoices go out by Resend on a simple schedule.
- This is the primary path until the Aruba Bank account is open.

### Optional now: card via Stripe
- Stripe does not open accounts for Aruba businesses, so any Stripe billing runs through the US entity, Skirbi LLC. Offer it as a second option for owners who prefer to pay by card.
- Stripe Checkout and the Customer Portal handle the card flow. The webhook updates `subscriptions` and `tenants.status` via the service role.

### Later: Sentoo
- Once the Aruba Bank account is open, add Sentoo for local card and bank methods. It becomes another `method` value on the invoice and another way to flip a tenant to active. The plan and status model does not change.

### Notes
- Feature gates read `tenants.plan`. Custom domain on growth and premium. Item cap by plan.
- Prices are set per tenant in their base currency. See currency display below.
- Note BBO turnover tax and US entity filing. Confirm with an accountant. Tie to the existing Aurum and Skirbi structure.

## 9a. Currency display, USD and AWG
The florin is pegged to the dollar, so conversion is a fixed multiply, not a live rate feed.
- The tenant sets `base_currency`, the currency their prices are entered in, plus `fx_rate`, default 1.80 USD to AWG, editable.
- `menu_items.price` is stored in the base currency. `price_text` items, like market price, do not convert.
- The public page shows a USD and AWG toggle when `dual_currency` is on. It converts from the base with `fx_rate` and rounds for a clean look, AWG to the nearest 0.25 and USD to the nearest 0.05.
- Show the active currency clearly so a diner is never unsure what they will pay.

## 9b. Translation workflow, English and Spanish
- Launch locales are English and Spanish, the two most spoken on the island.
- The tenant has a source locale, default English. Item and category names and descriptions store both locales in the `_i18n` fields.
- The editor offers auto-translate to fill the second locale as a draft, using a translation API. You review and fix it before publish. Never auto-publish raw machine output, since dish names and local terms need a human eye.
- Keep proper dish names as they are, for example Keshi Yena and Pan Bati. Translate only the parts that should change.
- The public toggle shows only the locales a tenant has active.

## 10. Feature gates by plan
On-site content capture and a dashboard come with every plan. The gates below are the software and hardware differences.
- starter: page at platodigital.io/slug, restaurant info and action buttons, photo and short video capture, one QR code stand, dashboard access, basic analytics, item cap 40. No custom domain.
- growth: everything in starter, plus full video menu, more items, advanced analytics, NFC and QR sticker pack, window decal, custom domain, EN and ES.
- premium: everything in growth, plus unlimited items, spot on the Discovery feature page, priority support, flyer design, quarterly re-shoot, full hardware kit.
- optional on any plan: rented tablet display in kiosk mode.

Enforce caps both in the UI and on the server action. Never trust the client.

## 11. Performance targets
- Public page Largest Contentful Paint under 2 seconds on 4G mid-range phone.
- Posters and first viewport images optimized and preloaded.
- Video lazy loaded and only on the item in view.
- ISR cache for public pages, revalidate on menu edit.

## 12. Environments
- Local with Supabase CLI.
- Preview on Vercel per branch.
- Production on Vercel with platodigital.io and the Supabase production project. Path-based routing needs no wildcard DNS. Add custom domains per tenant through the Vercel domains API.
- Secrets: Supabase service role, Bunny keys, Stripe keys, Resend key. Never expose service role to the client.

## 13. Tracked redirects for QR and NFC
Do not print a QR or NFC tag that points straight at the menu URL. Point both at a tracked redirect.
- QR scans hit `platodigital.io/q/{code}`. NFC taps hit `platodigital.io/t/{code}`.
- The route looks up the `short_links` row by code, records a `qr_scan` or `nfc_tap` event and increments `scans`, then 302 redirects to the menu page.
- This gives reliable scan and tap counts, lets you swap the target later without reprinting, and lets you compare placements like table versus window.

## 14. SEO and link sharing
When an owner shares their page on Instagram, WhatsApp, or Google, the preview must look great. It is a free growth channel.
- Per page metadata: title, description, and an Open Graph image. Generate the OG image from the cover and logo.
- Add schema.org Restaurant and Menu structured data so Google can show rich results.
- Clean canonical URL at platodigital.io/slug. Custom domain sets its own canonical.
- A simple sitemap of all active tenant pages. Helps the future Discovery directory rank.

## 15. Cache and revalidation
- Public pages use ISR. On any menu, item, branding, or template save, the server calls revalidate for that tenant path or tag. The page updates within seconds, no full redeploy.
- Cache the slug to tenant lookup. Invalidate it if a slug or custom domain changes.

## 16. Multi-location
A tenant equals one menu page. For a brand with several locations, two clean options:
- v1 simple: create one tenant per location, for example `platodigital.io/zeerovers-palmbeach`. Group them later.
- v1.1 proper: add an `accounts` layer. One account holds billing and owns several tenants. One login manages all locations. Build this only when a real multi-location customer needs it. The schema already isolates by tenant, so adding an `account_id` to `tenants` later is a small change.

## 17. Analytics job and privacy
- A nightly scheduled function aggregates yesterday from `analytics_events` into `analytics_daily`, then prunes raw rows older than a short window, for example 30 days. Dashboards read the rollup, so they stay fast as traffic grows.
- Keep analytics cookieless. Derive `session_id` from a daily rotating hash of coarse signals, never a tracking cookie and never personal data. This avoids a cookie consent wall, which also helps load speed and the EU visitor share.
- Filter obvious bot traffic before counting.
- Set Bunny delivery alerts. If one tenant's video traffic spikes, you see the cost early.

## 18. Service model: who captures and who edits
Settled. Content capture is a service in every plan. You go on-site, shoot the photos and videos, and build the menu. The owner does not build it themselves.
- Diners never log in.
- You capture and enter the menu for every customer, on every plan. This is the core service and the moat.
- Owners get a dashboard for quick edits only. The most used actions are mark sold out, change a price, and add a special. Make these one tap on mobile.
- You edit any tenant through admin impersonation for larger changes and support.
- Re-shoot cadence by plan: Starter pays per re-shoot, Growth one per year, Premium quarterly. This protects your time.
- Add a simple change request intake in the dashboard, reusing the hardware order pattern, so owners ask for updates without a call.

## 19. Client account provisioning
Owners do not self-register. You create their account during onboarding. Never generate or email a plaintext password.
- In admin, a "New client" form takes the restaurant name, slug, plan, and the owner's email.
- The server, with the service role, creates the tenant, the owner profile, and the `tenant_members` row, then sends an invite.
- Use Supabase Auth to send an invite or a set-password link. The owner clicks it and sets their own password. Their password is never seen or stored by you.
- Default to magic link sign-in for non-technical owners. They enter their email and get a one-time link. No password to forget.
- On-site option: during the visit, create the account and let the owner set a password on their phone in a few seconds, or just enable magic link.
- You always retain admin impersonation, so you can manage the page even if the owner never logs in.

## 20. Timezone
Aruba uses America/Aruba, which is AST, UTC minus 4, with no daylight saving. Use it for everything date sensitive.
- The "open now" logic compares the current Aruba time against `hours`.
- The nightly rollup day boundary is Aruba midnight, not UTC. A UTC boundary would split an evening service across two days and skew the numbers.
- Store timestamps in UTC, convert to America/Aruba for display and for day grouping.

## 21. Updated_at and slug changes
- Add `updated_at` triggers on `tenants` and `menu_items` so the admin "last edit" column is real.
- On a slug rename, copy the old value into `previous_slug` and 301 redirect `platodigital.io/oldslug` to the new slug. Printed QR and NFC are safe already because they point at the `/q` and `/t` redirects, not the slug.

## 22. Bootstrap and seed
- The first platform admin is you. After your first sign-in, set `is_platform_admin = true` on your profile with one SQL update. Document this as a one-time step. Nothing in the app should let a tenant grant themselves admin.
- Seed one demo tenant, for example `platodigital.io/hungparadise`, with a full menu so the app has realistic data for development and sales demos.

## 23. Environment variables
Claude Code should scaffold an `.env.example` with at least:
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server only, never shipped to the client)
- `BUNNY_STREAM_LIBRARY_ID`, `BUNNY_STREAM_API_KEY`, `BUNNY_CDN_HOSTNAME`
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `RESEND_API_KEY`
- `NEXT_PUBLIC_SITE_URL` (https://platodigital.io)

## 24. Migrations
- Keep the schema in `supabase/migrations` as ordered files, not pasted ad hoc into the SQL editor. Tables, functions, and policies all live in versioned migrations so the database is reproducible.
- A separate `seed.sql` creates the demo tenant.

## 25. Indexing and robots
- Index only public menu pages. Set `noindex` on dashboard, admin, and api routes.
- Publish a sitemap of published tenant pages, with custom domains using their own host.

## 26. QR generation and print
- The admin QR generator takes a URL or a tenant `short_links` code. When it uses a short link, the QR points at the `/q` redirect, so every scan is counted and the target can change without reprinting.
- Render the QR styled: rounded modules, the tenant accent color, a small center logo, and a caption. Use a QR styling library that exports SVG.
- Export PNG and SVG directly. For PDF and the branded print sheet, render the SVG into a page layout and use the pdf skill approach to produce a print-ready file.

## 27. Menu import from a photo (v1.1)
- Let the team upload a photo of the restaurant's existing paper menu.
- Send the image to the Claude API and ask for structured JSON: categories, item names, descriptions, and prices.
- Load the result as an editable draft. The team corrects it, then translates and publishes. This turns a 40-item build into minutes of review.

## 28. Translation provider
- Use the Claude API for menu translation. Instruct it to keep dish proper names, match a casual menu tone, and translate only what should change.
- One provider covers English and Spanish now, and Papiamento later through the existing Papiamento skill. No second vendor needed.

## 29. Featured band
- The public page queries featured items as: items where is_featured is true and is_available is true, ordered by featured_rank, then sort_order. Cap the result at eight.
- If no items are featured, return none and the band does not render.
- Optional later: when the team has not set any featured items, fall back to the most viewed dishes from analytics_daily so the band is never empty on an active page. Keep this off until analytics have enough data.
- The band reads the same item data, so currency and language toggles apply to it like any card.
