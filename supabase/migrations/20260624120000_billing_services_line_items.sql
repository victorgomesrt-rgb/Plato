-- Editable add-on service catalog + multi-line invoices (admin Billing).
-- finance.md §1/§3a + Plato Card. The catalog is platform-global config the admin
-- edits in-app; invoice line items snapshot price/description and roll up to invoices.amount.
-- Plan subscription + setup stay code-derived (lib/plans.ts) — they are not in this catalog.

-- Add-on service catalog (admin-editable: add / rename / remove / reprice).
create table if not exists public.billing_services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',          -- default line description on the invoice
  unit_price numeric(10,2) not null default 0,
  unit text not null default 'each',             -- display hint: each, month, one-time
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.billing_services enable row level security;
drop policy if exists bs_admin on public.billing_services;
create policy bs_admin on public.billing_services
  for all using (public.is_admin()) with check (public.is_admin());
drop trigger if exists billing_services_updated on public.billing_services;
create trigger billing_services_updated before update on public.billing_services
  for each row execute function public.set_updated_at();

-- Invoice line items. quantity × unit_price = amount; sum(amount) = invoices.amount.
-- service_id is ON DELETE SET NULL so deleting a catalog service never corrupts history
-- (each line keeps its own description / unit_price / amount snapshot).
create table if not exists public.invoice_line_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  service_id uuid references public.billing_services(id) on delete set null,
  description text not null,
  quantity numeric(10,2) not null default 1,
  unit_price numeric(10,2) not null default 0,
  amount numeric(10,2) not null default 0,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists invoice_line_items_invoice_idx
  on public.invoice_line_items (invoice_id, sort_order);
alter table public.invoice_line_items enable row level security;
drop policy if exists ili_read on public.invoice_line_items;
drop policy if exists ili_admin on public.invoice_line_items;
create policy ili_read on public.invoice_line_items
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.invoices i
      where i.id = invoice_id and public.is_member_of(i.tenant_id)
    )
  );
create policy ili_admin on public.invoice_line_items
  for all using (public.is_admin()) with check (public.is_admin());

-- Seed the catalog from the current presets, only when empty.
insert into public.billing_services (name, description, unit_price, unit, sort_order)
select v.name, v.description, v.unit_price, v.unit, v.sort_order
from (values
  ('Plato Card blast',        'Promoted special · wallet blast',  75::numeric, 'each',  10),
  ('Plato Card promotions',   'Plato Card promotions · monthly', 199::numeric, 'month', 20),
  ('Tablet rental',           'Tablet rental · monthly',          35::numeric, 'month', 30),
  ('Extra capture / re-shoot','Extra capture / re-shoot',        250::numeric, 'each',  40),
  ('Window decal / hardware', 'Window decal / hardware',          25::numeric, 'each',  50),
  ('NFC + QR sticker pack',   'NFC + QR sticker pack',            20::numeric, 'each',  60),
  ('Flyer design',            'Flyer design',                     75::numeric, 'each',  70)
) as v(name, description, unit_price, unit, sort_order)
where not exists (select 1 from public.billing_services);
