do $$
begin
  update public.bug_definitions
  set status = 'enabled'
  where code = 'BUG-005'
    and status = 'planned';

  if not found then
    raise exception 'BUG-005 must exist with status planned';
  end if;
end;
$$;
