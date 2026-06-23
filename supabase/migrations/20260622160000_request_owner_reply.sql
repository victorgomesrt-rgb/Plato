-- Let owners answer/approve a change request from their dashboard.
-- owner_reply: the owner's response text; replied_at: when they sent it.
-- On reply the request moves back to the Plato team (status -> in_progress).
alter table public.change_requests add column if not exists owner_reply text;
alter table public.change_requests add column if not exists replied_at timestamptz;
