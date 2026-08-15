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
    E'  request_started_at timestamptz := statement_timestamp();\n',
    ''
  );

  if patched_source = function_source then
    raise exception 'Unable to remove obsolete checkout request timestamp';
  end if;

  execute patched_source;
end;
$$;
