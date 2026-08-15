create or replace function private.checkout_has_inventory(
  available_stock integer,
  requested_quantity integer
)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select true;
$$;

create or replace function private.checkout_remaining_inventory(
  available_stock integer,
  requested_quantity integer
)
returns integer
language sql
immutable
set search_path = ''
as $$
  select greatest(available_stock - requested_quantity, 0);
$$;

do $$
begin
  update public.bug_definitions
  set status = 'enabled'
  where code = 'BUG-002'
    and status = 'planned';

  if not found then
    raise exception 'BUG-002 must exist with status planned';
  end if;
end;
$$;
