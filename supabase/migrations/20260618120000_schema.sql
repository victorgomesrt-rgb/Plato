-- Plato schema — see docs/architecture.md §4
-- Tables, columns, and indexes. RLS, functions, triggers, and storage live in later migrations.

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
  slug text not null unique check (slug ~ '^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$'),
  name text not null,
  custom_domain text unique,
  description text,
  logo_url text,
  cover_url text,
  accent_color text default '#FB6A1A',
  base_currency text not null default 'USD',
  fx_rate numeric(8,4) not null default 1.80,
  dual_currency boolean not null default true,
  address text,
  lat double precision,
  lng double precision,
  phone text,
  whatsapp text,
  hours jsonb,
  socials jsonb,
  links jsonb default '[]'::jsonb,
  template text not null default 'grid',
  theme jsonb default '{}'::jsonb,
  default_locale text not null default 'en',
  locales text[] not null default array['en','es'],
  plan text not null default 'starter',
  status text not null default 'building',
  published_at timestamptz,
  previous_slug text,
  trial_ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Membership, links users to tenants with a role
create table public.tenant_members (
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'owner',
  created_at timestamptz not null default now(),
  primary key (tenant_id, user_id)
);

-- Menu categories
create table public.menu_categories (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  name_i18n jsonb,
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
  price_text text,
  options jsonb,
  image_url text,
  video_provider text,
  video_id text,
  video_thumb_url text,
  video_status text not null default 'none',
  tags text[],
  is_available boolean not null default true,
  is_featured boolean not null default false,
  featured_rank int,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Media library, optional shared asset store
create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  kind text not null,
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
  interval text default 'month',
  current_period_end timestamptz,
  updated_at timestamptz not null default now()
);

-- Invoices for manual billing now, and any method later
create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  number text unique,
  amount numeric(10,2) not null,
  currency text not null default 'USD',
  period_start date,
  period_end date,
  method text not null default 'manual',  -- manual, stripe, sentoo
  status text not null default 'draft',
  due_date date,
  sent_at timestamptz,
  paid_at timestamptz,
  pdf_url text,
  created_at timestamptz not null default now()
);

-- Hardware orders
create table public.hardware_orders (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  item_type text not null,
  quantity int not null default 1,
  notes text,
  status text not null default 'requested',
  created_at timestamptz not null default now()
);

-- Rented tablet fleet
create table public.tablets (
  id uuid primary key default gen_random_uuid(),
  asset_tag text unique,
  model text,
  status text not null default 'in_stock',
  tenant_id uuid references public.tenants(id) on delete set null,
  monthly_fee numeric(10,2) default 35,
  deposit numeric(10,2),
  term_months int default 6,
  deployed_at date,
  returned_at date,
  created_at timestamptz not null default now()
);

-- Tracked short links for QR codes and NFC tags
create table public.short_links (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  code text not null unique,
  kind text not null,
  placement text,
  scans int not null default 0,
  created_at timestamptz not null default now()
);

-- Analytics events, append only
create table public.analytics_events (
  id bigint generated always as identity primary key,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  item_id uuid,
  event_type text not null,
  session_id text,
  referrer text,
  created_at timestamptz not null default now()
);
create index on public.analytics_events (tenant_id, created_at);

-- Daily rollup
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

-- Hot-path indexes
create index on public.menu_items (tenant_id, category_id, sort_order);
create index on public.menu_items (tenant_id, is_featured, featured_rank);
create index on public.menu_categories (tenant_id, sort_order);
