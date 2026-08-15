create or replace function private.checkout_accepts_cart_transition(cart_id uuid, user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.carts
    where carts.id = cart_id
      and carts.user_id = user_id
      and carts.status = 'converted'
  );
$$;

revoke all on function private.checkout_accepts_cart_transition(uuid, uuid)
from public, anon, authenticated;

do $$
begin
  update public.bug_definitions
  set status = 'enabled'
  where code = 'BUG-003'
    and status = 'planned';

  if not found then
    raise exception 'BUG-003 must exist with status planned';
  end if;
end;
$$;
