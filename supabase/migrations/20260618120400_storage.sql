-- Plato storage buckets + policies — see docs/architecture.md §7
-- Three public image buckets. Files are namespaced by tenant id as the first path
-- segment: "<tenant_id>/<filename>". Public read (menu images are meant to be public);
-- writes are restricted to members of that tenant. Originals/optimization handled in app code.

insert into storage.buckets (id, name, public)
values
  ('logos', 'logos', true),
  ('covers', 'covers', true),
  ('item-images', 'item-images', true)
on conflict (id) do nothing;

-- Public read on the three image buckets
create policy "plato_public_read_images" on storage.objects
  for select using (bucket_id in ('logos', 'covers', 'item-images'));

-- Members (or admin) may write under their own tenant folder
create policy "plato_member_insert_images" on storage.objects
  for insert with check (
    bucket_id in ('logos', 'covers', 'item-images')
    and (
      public.is_admin()
      or public.is_member_of(nullif((storage.foldername(name))[1], '')::uuid)
    )
  );

create policy "plato_member_update_images" on storage.objects
  for update using (
    bucket_id in ('logos', 'covers', 'item-images')
    and (
      public.is_admin()
      or public.is_member_of(nullif((storage.foldername(name))[1], '')::uuid)
    )
  );

create policy "plato_member_delete_images" on storage.objects
  for delete using (
    bucket_id in ('logos', 'covers', 'item-images')
    and (
      public.is_admin()
      or public.is_member_of(nullif((storage.foldername(name))[1], '')::uuid)
    )
  );
