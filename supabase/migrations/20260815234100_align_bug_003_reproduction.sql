do $$
begin
  update public.bug_definitions
  set
    preconditions = 'El usuario está en checkout con un carrito válido y ejecuta dos confirmaciones rápidas desde la misma pantalla.',
    reproduction_steps = E'1. Completar los datos del checkout.\n2. Hacer doble clic rápido en Confirmar compra.\n3. Abrir Mis pedidos y comparar IDs, timestamps y checkout_request_id.'
  where code = 'BUG-003'
    and status = 'enabled';

  if not found then
    raise exception 'BUG-003 must exist with status enabled';
  end if;
end;
$$;
