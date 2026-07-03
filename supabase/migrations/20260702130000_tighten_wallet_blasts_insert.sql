-- Tighten wallet_blasts INSERT: a member (via the anon client) could forge a row with
-- status='sent', a fake passbuddy_message_id, an invoice_id, or sent_at, polluting the
-- admin promo queue / billing. Members may only file a plain 'requested' row; admins are
-- unrestricted. (price is left free — approveBlast overwrites it to the fixed BLAST_PRICE.)
drop policy if exists wb_insert on public.wallet_blasts;
create policy wb_insert on public.wallet_blasts
  for insert with check (
    public.is_admin() or (
      public.is_member_of(tenant_id)
      and status = 'requested'
      and sent_at is null
      and invoice_id is null
      and passbuddy_message_id is null
    )
  );
