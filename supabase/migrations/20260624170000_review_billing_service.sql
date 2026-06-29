-- Phase 3: add the Review Card add-on to the editable billing catalog (price is
-- admin-editable in Billing -> Manage services). Inserted only if not already present.
insert into public.billing_services (name, description, unit_price, unit, sort_order)
select 'Review card', 'Review card · monthly', 25, 'month', 25
where not exists (select 1 from public.billing_services where name = 'Review card');
