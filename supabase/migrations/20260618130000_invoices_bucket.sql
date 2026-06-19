-- Private bucket for generated invoice PDFs (architecture §9). Not public — accessed
-- only via the service role, which creates time-limited signed URLs for email/admin view.
insert into storage.buckets (id, name, public)
values ('invoices', 'invoices', false)
on conflict (id) do nothing;
