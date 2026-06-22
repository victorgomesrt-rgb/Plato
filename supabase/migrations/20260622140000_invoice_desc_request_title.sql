-- Owner-facing billing + requests need a human line on each row.
-- invoices.description: the line item shown in the owner Billing table
--   (e.g. "Premium · monthly", "Setup · first capture & build").
-- change_requests.title: the bold one-line summary shown above the message
--   on the owner Requests cards. Both nullable; existing rows + the owner
--   request form (message-only) keep working.
alter table public.invoices add column if not exists description text;
alter table public.change_requests add column if not exists title text;
