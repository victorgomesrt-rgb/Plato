-- Plato seed — demo tenant for development and sales demos (architecture.md §22)
-- platodigital.io/hungparadise, a full placeholder menu. Re-runnable: clears itself first.
-- No auth user / owner membership here — those are created by the admin provisioning flow.
-- This tenant is published + active so the public page renders during local dev.

begin;

delete from public.tenants where slug = 'hungparadise';

-- Tenant
insert into public.tenants (
  id, slug, name, description, accent_color,
  base_currency, fx_rate, dual_currency,
  address, lat, lng, phone, whatsapp,
  hours, links, template, default_locale, locales,
  plan, status, published_at
) values (
  '00000000-0000-0000-0000-0000000000a1',
  'hungparadise',
  'Hung Paradise',
  'Beachfront Caribbean kitchen in Palm Beach. Fresh catch, island classics, sunset cocktails.',
  '#FB6A1A',
  'USD', 1.80, true,
  'J.E. Irausquin Blvd 230, Palm Beach, Aruba', 12.5740, -70.0450,
  '+297 586 0000', '+2975860000',
  '{"mon":["11:00","23:00"],"tue":["11:00","23:00"],"wed":["11:00","23:00"],"thu":["11:00","23:00"],"fri":["11:00","00:00"],"sat":["11:00","00:00"],"sun":["11:00","23:00"]}'::jsonb,
  '[
    {"type":"directions","enabled":true},
    {"type":"call","enabled":true},
    {"type":"whatsapp","enabled":true},
    {"type":"reserve","url":"https://example.com/reserve","enabled":true},
    {"type":"instagram","url":"https://instagram.com/hungparadise","enabled":true},
    {"type":"wifi","enabled":true,"label":"Wifi"}
  ]'::jsonb,
  'grid', 'en', array['en','es'],
  'premium', 'active', now()
);

-- Categories
insert into public.menu_categories (id, tenant_id, name, name_i18n, sort_order) values
  ('00000000-0000-0000-0000-0000000000c1','00000000-0000-0000-0000-0000000000a1','Starters', '{"es":"Entradas"}'::jsonb, 1),
  ('00000000-0000-0000-0000-0000000000c2','00000000-0000-0000-0000-0000000000a1','Mains',    '{"es":"Platos Fuertes"}'::jsonb, 2),
  ('00000000-0000-0000-0000-0000000000c3','00000000-0000-0000-0000-0000000000a1','Drinks',   '{"es":"Bebidas"}'::jsonb, 3),
  ('00000000-0000-0000-0000-0000000000c4','00000000-0000-0000-0000-0000000000a1','Desserts', '{"es":"Postres"}'::jsonb, 4);

-- Items
insert into public.menu_items
  (tenant_id, category_id, name, name_i18n, description, description_i18n, price, price_text, tags, is_featured, featured_rank, sort_order)
values
  -- Starters
  ('00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000c1','Pan Bati',
    '{"es":"Pan Bati"}'::jsonb,
    'Warm island cornbread, lightly sweet, served with herb butter.',
    '{"es":"Pan de maíz isleño, ligeramente dulce, con mantequilla de hierbas."}'::jsonb,
    7.00, null, array['popular'], false, null, 1),
  ('00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000c1','Keshi Yena',
    '{"es":"Keshi Yena"}'::jsonb,
    'Aruban classic: spiced chicken baked in melted Gouda.',
    '{"es":"Clásico arubano: pollo especiado horneado en queso Gouda."}'::jsonb,
    12.50, null, array['popular','new'], true, 1, 2),
  ('00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000c1','Pastechi',
    '{"es":"Pastechi"}'::jsonb,
    'Golden fried pastries filled with cheese or spiced beef.',
    '{"es":"Empanadas fritas doradas rellenas de queso o carne especiada."}'::jsonb,
    9.00, null, array[]::text[], false, null, 3),

  -- Mains
  ('00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000c2','Catch of the Day',
    '{"es":"Pesca del Día"}'::jsonb,
    'Local fresh fish, grilled, with funchi and creole sauce.',
    '{"es":"Pescado fresco local, a la parrilla, con funchi y salsa criolla."}'::jsonb,
    null, 'Market price', array['popular'], true, 2, 1),
  ('00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000c2','Caribbean Ribs',
    '{"es":"Costillas Caribeñas"}'::jsonb,
    'Slow-cooked ribs glazed in island BBQ, with plantain.',
    '{"es":"Costillas cocidas a fuego lento, glaseadas con BBQ isleño y plátano."}'::jsonb,
    26.00, null, array['popular'], true, 3, 2),
  ('00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000c2','Coconut Shrimp Curry',
    '{"es":"Curry de Camarón y Coco"}'::jsonb,
    'Gulf shrimp simmered in coconut curry, served with rice.',
    '{"es":"Camarones en curry de coco, servidos con arroz."}'::jsonb,
    24.00, null, array['spicy'], false, null, 3),
  ('00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000c2','Garden Bowl',
    '{"es":"Bowl del Huerto"}'::jsonb,
    'Roasted vegetables, quinoa, avocado, citrus dressing.',
    '{"es":"Vegetales asados, quinoa, aguacate, aderezo cítrico."}'::jsonb,
    18.00, null, array['vegan'], false, null, 4),

  -- Drinks
  ('00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000c3','Aruba Ariba',
    '{"es":"Aruba Ariba"}'::jsonb,
    'The island signature cocktail. Rum, vodka, tropical juices.',
    '{"es":"El cóctel insignia de la isla. Ron, vodka, jugos tropicales."}'::jsonb,
    12.00, null, array['popular'], true, 4, 1),
  ('00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000c3','Fresh Coconut',
    '{"es":"Coco Fresco"}'::jsonb,
    'Chilled young coconut, served whole.',
    '{"es":"Coco joven frío, servido entero."}'::jsonb,
    8.00, null, array[]::text[], false, null, 2),

  -- Desserts
  ('00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000c4','Bolo di Coco',
    '{"es":"Bolo di Coco"}'::jsonb,
    'Traditional Aruban coconut cake.',
    '{"es":"Pastel de coco arubano tradicional."}'::jsonb,
    9.00, null, array['popular'], false, null, 1),
  ('00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000c4','Mango Sorbet',
    '{"es":"Sorbete de Mango"}'::jsonb,
    'House-made mango sorbet, dairy free.',
    '{"es":"Sorbete de mango casero, sin lácteos."}'::jsonb,
    7.00, null, array['vegan'], false, null, 2);

commit;
