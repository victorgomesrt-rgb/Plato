-- Reminder throttle. The invoice-reminders cron re-emailed every sent+overdue invoice on
-- every run (daily, forever) with no record of what was sent. Track it so we remind at
-- most every 3 days and cap total reminders.
alter table public.invoices
  add column if not exists last_reminded_at timestamptz,
  add column if not exists reminder_count int not null default 0;
