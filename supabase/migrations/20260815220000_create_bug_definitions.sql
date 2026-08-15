create table public.bug_definitions (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  name text not null,
  description text not null,
  preconditions text not null,
  reproduction_steps text not null,
  expected_result text not null,
  actual_result text not null,
  severity text not null,
  category text not null,
  status text not null default 'planned',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bug_definitions_code_unique unique (code),
  constraint bug_definitions_code_format check (code ~ '^BUG-[0-9]{3}$'),
  constraint bug_definitions_name_not_blank check (char_length(btrim(name)) > 0),
  constraint bug_definitions_description_not_blank check (char_length(btrim(description)) > 0),
  constraint bug_definitions_preconditions_not_blank check (char_length(btrim(preconditions)) > 0),
  constraint bug_definitions_reproduction_steps_not_blank check (char_length(btrim(reproduction_steps)) > 0),
  constraint bug_definitions_expected_result_not_blank check (char_length(btrim(expected_result)) > 0),
  constraint bug_definitions_actual_result_not_blank check (char_length(btrim(actual_result)) > 0),
  constraint bug_definitions_severity_valid check (severity in ('low', 'medium', 'high', 'critical')),
  constraint bug_definitions_category_valid check (
    category in ('business_rule', 'inventory', 'concurrency', 'calculation', 'filtering')
  ),
  constraint bug_definitions_status_valid check (status in ('planned', 'enabled', 'disabled'))
);

create trigger bug_definitions_set_updated_at
before update on public.bug_definitions
for each row execute function public.set_updated_at();

alter table public.bug_definitions enable row level security;

revoke all privileges on table public.bug_definitions from public, anon, authenticated;
grant select on table public.bug_definitions to authenticated;

create policy bug_definitions_select_admin
on public.bug_definitions
for select
to authenticated
using ((select private.is_admin()));

insert into public.bug_definitions (
  code,
  name,
  description,
  preconditions,
  reproduction_steps,
  expected_result,
  actual_result,
  severity,
  category,
  status
)
values
  (
    'BUG-001',
    'Cupón vencido aceptado',
    'La validación de cupones omite incorrectamente la fecha de expiración para OLD20.',
    E'Existe el cupón OLD20 configurado como expirado.\nEl usuario tiene un carrito válido con uno o más productos.',
    E'1. Iniciar sesión.\n2. Agregar uno o más productos al carrito.\n3. Introducir el código OLD20.\n4. Pulsar Aplicar.',
    'El sistema rechaza el cupón e informa que está expirado.',
    'El sistema acepta OLD20 y aplica su descuento aunque está expirado.',
    'medium',
    'business_rule',
    'planned'
  ),
  (
    'BUG-002',
    'Compra superior al stock disponible',
    'El checkout permite confirmar una cantidad superior al stock disponible después de un cambio concurrente.',
    E'Existe un producto cuya cantidad en el carrito supera el stock actual.\nEjemplo: stock disponible 2 y cantidad solicitada 3.',
    E'1. Agregar un producto al carrito.\n2. Reducir el stock disponible por debajo de la cantidad del carrito.\n3. Completar los datos de checkout.\n4. Confirmar la compra.',
    'El checkout se rechaza, no se crea un pedido y el stock conserva su integridad.',
    'El sistema crea un pedido con una cantidad superior al stock disponible, sin representar stock negativo.',
    'critical',
    'inventory',
    'planned'
  ),
  (
    'BUG-003',
    'Doble confirmación genera dos pedidos',
    'La protección idempotente falla y dos confirmaciones equivalentes convierten una sola compra en dos pedidos.',
    'El usuario está en checkout con un carrito válido y puede repetir rápidamente la confirmación o el mismo request.',
    E'1. Completar el checkout.\n2. Ejecutar dos confirmaciones muy rápidamente o repetir el mismo request.\n3. Abrir Mis pedidos.',
    'Existe un único pedido porque el checkout reconoce el retry mediante su identificador idempotente.',
    'Se generan dos pedidos para la misma compra.',
    'high',
    'concurrency',
    'planned'
  ),
  (
    'BUG-004',
    'Descuento calculado incorrectamente',
    'Un cupón porcentual se calcula sobre la primera línea del carrito y no sobre el subtotal completo.',
    E'El carrito tiene dos o más productos diferentes.\nSe aplica un cupón porcentual.\nLa primera línea se determina por cart_items.created_at ASC y luego id ASC.',
    E'1. Agregar Producto A por US$ 100 y luego Producto B por US$ 50.\n2. Aplicar un cupón de 20%.\n3. Consultar el resumen del carrito o confirmar checkout.',
    'Con subtotal US$ 150, el descuento es US$ 30 porque se calcula sobre el subtotal completo.',
    'El descuento es US$ 20 porque el 20% se aplica únicamente a la primera línea de US$ 100.',
    'high',
    'calculation',
    'planned'
  ),
  (
    'BUG-005',
    'Filtro de categoría y precio combinado incorrectamente',
    'La consulta ignora el precio máximo cuando categoría, mínimo y máximo se utilizan simultáneamente.',
    E'Hay una categoría seleccionada.\nTambién se definieron precio mínimo y precio máximo.',
    E'1. Abrir el catálogo.\n2. Seleccionar la categoría Audio.\n3. Definir precio mínimo 50.\n4. Definir precio máximo 200.\n5. Aplicar los filtros.',
    'La consulta aplica categoría = Audio AND precio >= 50 AND precio <= 200.',
    'La consulta aplica categoría = Audio AND precio >= 50, pero ignora precio <= 200 y muestra productos más caros.',
    'medium',
    'filtering',
    'planned'
  );

comment on table public.bug_definitions is
'Catálogo administrativo versionado de defectos intencionales del laboratorio MercadoBugs.';
