create table private.checkout_transitions (
  cart_id uuid primary key references public.carts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  converted_at timestamptz not null
);

revoke all on table private.checkout_transitions from public, anon, authenticated;

do $$
declare
  function_source text;
  patched_source text;
begin
  function_source := pg_get_functiondef(
    'public.perform_checkout(uuid,text,text,text,text,text,text)'::regprocedure
  );

  patched_source := replace(
    function_source,
    E'  validation_time timestamptz;\nbegin',
    E'  validation_time timestamptz;\n  request_started_at timestamptz := statement_timestamp();\nbegin'
  );

  if patched_source = function_source then
    raise exception 'Unable to add checkout request start timestamp';
  end if;
  function_source := patched_source;

  patched_source := replace(
    function_source,
    E'    raise exception using errcode = ''P0001'', message = ''cart_not_found'';\n  end if;\n\n  perform cart_items.id',
    E'    select carts.*\n    into active_cart\n    from public.carts\n    join private.checkout_transitions\n      on checkout_transitions.cart_id = carts.id\n    where carts.user_id = current_user_id\n      and carts.status = ''converted''\n      and checkout_transitions.user_id = current_user_id\n      and checkout_transitions.converted_at >= request_started_at\n    order by checkout_transitions.converted_at desc\n    limit 1;\n\n    if not found then\n      raise exception using errcode = ''P0001'', message = ''cart_not_found'';\n    end if;\n  end if;\n\n  perform cart_items.id'
  );

  if patched_source = function_source then
    raise exception 'Unable to add concurrent cart recovery';
  end if;
  function_source := patched_source;

  patched_source := replace(
    function_source,
    E'    and status = ''active'';\n\n  if not found',
    E'    and status = ''active'';\n\n  insert into private.checkout_transitions (cart_id, user_id, converted_at)\n  select active_cart.id, current_user_id, clock_timestamp()\n  from public.carts\n  where carts.id = active_cart.id\n    and carts.user_id = current_user_id\n    and carts.status = ''converted''\n  on conflict (cart_id) do nothing;\n\n  if not found'
  );

  if patched_source = function_source then
    raise exception 'Unable to persist checkout transition timestamp';
  end if;

  execute patched_source;
end;
$$;
