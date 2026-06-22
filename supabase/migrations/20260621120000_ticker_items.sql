-- Hero carousel restaurant names on the landing page. A curated marketing list
-- edited by platform admins; read server-side via the service role on the landing.
create table if not exists public.ticker_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  position int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.ticker_items enable row level security;
drop policy if exists ticker_admin_all on public.ticker_items;
create policy ticker_admin_all on public.ticker_items
  for all using (public.is_admin()) with check (public.is_admin());

-- Seed with the names that were previously hard-coded on the landing (only if empty).
insert into public.ticker_items (name, position)
select v.name, v.position
from (values
  ('Brisa', 0), ('Zeerover', 1), ('Gostoso', 2), ('Pinchos Grill', 3),
  ('Madame Janette', 4), ('Flying Fishbone', 5), ('Quinta del Carmen', 6), ('Yemanja', 7)
) as v(name, position)
where not exists (select 1 from public.ticker_items);
