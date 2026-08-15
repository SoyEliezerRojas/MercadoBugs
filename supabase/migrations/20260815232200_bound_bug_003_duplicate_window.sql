alter table private.checkout_transitions
add column duplicate_claimed boolean not null default false;

create or replace function private.checkout_accepts_cart_transition(cart_id uuid, user_id uuid)
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  transition_claimed boolean := false;
begin
  update private.checkout_transitions
  set duplicate_claimed = true
  where checkout_transitions.cart_id = checkout_accepts_cart_transition.cart_id
    and checkout_transitions.user_id = checkout_accepts_cart_transition.user_id
    and not checkout_transitions.duplicate_claimed
    and checkout_transitions.converted_at >= clock_timestamp() - interval '2 seconds'
  returning true into transition_claimed;

  return coalesce(transition_claimed, false);
end;
$$;

revoke all on function private.checkout_accepts_cart_transition(uuid, uuid)
from public, anon, authenticated;

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
    E'      and checkout_transitions.user_id = current_user_id\n      and checkout_transitions.converted_at >= request_started_at',
    E'      and checkout_transitions.user_id = current_user_id\n      and not checkout_transitions.duplicate_claimed\n      and checkout_transitions.converted_at >= clock_timestamp() - interval ''2 seconds'''
  );

  if patched_source = function_source then
    raise exception 'Unable to bound concurrent checkout recovery';
  end if;

  execute patched_source;
end;
$$;
