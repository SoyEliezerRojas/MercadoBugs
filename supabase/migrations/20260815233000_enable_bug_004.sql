create or replace function private.checkout_percentage_basis(cart_id uuid, subtotal numeric)
returns numeric
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when (
      select count(*)
      from public.cart_items
      where cart_items.cart_id = checkout_percentage_basis.cart_id
    ) >= 2
    then coalesce(
      (
        select (products.price * cart_items.quantity)::numeric(12, 2)
        from public.cart_items
        join public.products on products.id = cart_items.product_id
        where cart_items.cart_id = checkout_percentage_basis.cart_id
        order by cart_items.created_at asc, cart_items.id asc
        limit 1
      ),
      subtotal
    )
    else subtotal
  end;
$$;

revoke all on function private.checkout_percentage_basis(uuid, numeric)
from public, anon, authenticated;

do $$
begin
  update public.bug_definitions
  set status = 'enabled'
  where code = 'BUG-004'
    and status = 'planned';

  if not found then
    raise exception 'BUG-004 must exist with status planned';
  end if;
end;
$$;
