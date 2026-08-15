# Catálogo oficial de bugs conocidos

## Estado de FASE 10

FASE 10 registra los cinco defectos intencionales que formarán el laboratorio, pero no activa
ninguno. El e-commerce continúa siendo el baseline correcto y cualquier desviación adicional debe
tratarse como un defecto accidental.

La fuente operativa es `public.bug_definitions`, creada y poblada por la migración
`20260815220000_create_bug_definitions.sql`. Los cinco registros tienen `status = planned`.
`docs/bugs.md` es la referencia de desarrollo y administración; la UI de tester no la enlaza.

## Estados

- `planned`: definido, todavía no implementado;
- `enabled`: comportamiento defectuoso activo en el laboratorio;
- `disabled`: implementación existente pero desactivada.

FASE 11 será la única responsable de implementar los comportamientos y cambiar cada estado a
`enabled`. No se utiliza aleatoriedad ni activación por usuario.

## BUG-001 — Cupón vencido aceptado

- Categoría: `business_rule` — Regla de negocio.
- Severidad: `medium` — Media.
- Estado: `planned`.

Precondiciones:

- existe `OLD20`, activo pero expirado en 2024;
- el usuario tiene un carrito válido con productos.

Pasos:

1. Iniciar sesión.
2. Agregar uno o más productos al carrito.
3. Introducir `OLD20`.
4. Pulsar Aplicar.

Baseline correcto: el servidor comprueba `expires_at`, rechaza el cupón con `coupon_expired` y no
aplica descuento.

Comportamiento futuro: `OLD20` será aceptado y aplicará descuento aunque esté vencido.

Implementación: pendiente para FASE 11.

## BUG-002 — Compra superior al stock disponible

- Categoría: `inventory` — Inventario.
- Severidad: `critical` — Crítica.
- Estado: `planned`.

Precondiciones:

- la cantidad del carrito supera el stock actual;
- caso de referencia: stock 2, cantidad solicitada 3;
- puede producirse después de una reducción concurrente del inventario.

Pasos:

1. Agregar un producto al carrito.
2. Reducir el stock por debajo de la cantidad del carrito.
3. Completar el checkout.
4. Confirmar la compra.

Baseline correcto: `perform_checkout` bloquea y vuelve a leer productos, devuelve
`insufficient_stock`, revierte la transacción, no crea un pedido y nunca deja stock negativo.

Comportamiento futuro: se creará un pedido cuya cantidad es superior al stock disponible. La
representación concreta deberá conservar el constraint general `products.stock >= 0`; no se
debilitará la integridad global solo para fabricar el escenario.

Implementación: pendiente para FASE 11.

## BUG-003 — Doble confirmación genera dos pedidos

- Categoría: `concurrency` — Concurrencia.
- Severidad: `high` — Alta.
- Estado: `planned`.

Precondición: usuario en checkout con un carrito válido.

Pasos:

1. Completar el checkout.
2. Ejecutar dos confirmaciones rápidamente o repetir el mismo request.
3. Consultar Mis pedidos.

Baseline correcto: `checkout_request_id UUID NOT NULL UNIQUE`, el lock del carrito y la respuesta
idempotente garantizan un solo pedido y el mismo ID para el retry.

Comportamiento futuro: dos confirmaciones equivalentes generarán dos pedidos para la misma compra.

Implementación: pendiente para FASE 11.

## BUG-004 — Descuento calculado incorrectamente

- Categoría: `calculation` — Cálculo.
- Severidad: `high` — Alta.
- Estado: `planned`.

Condición exacta:

- el carrito contiene al menos dos productos diferentes;
- se aplica un cupón porcentual;
- para el comportamiento futuro, la primera línea se determina por `cart_items.created_at ASC` y
  después por `id ASC`, evitando cualquier aleatoriedad.

Caso de referencia:

```text
Producto A: 100 × 1 = 100
Producto B:  50 × 1 =  50
Subtotal:               150
Cupón:                   20%
```

Baseline correcto: `ROUND(150 × 20 / 100, 2) = 30`.

Comportamiento futuro: el porcentaje se aplicará solo a la primera línea; en el caso de referencia,
`ROUND(100 × 20 / 100, 2) = 20`.

Implementación: pendiente para FASE 11.

## BUG-005 — Filtro de categoría y precio combinado incorrectamente

- Categoría: `filtering` — Filtros.
- Severidad: `medium` — Media.
- Estado: `planned`.

Condición exacta: categoría, precio mínimo y precio máximo existen simultáneamente.

Pasos:

1. Abrir el catálogo.
2. Seleccionar Audio.
3. Definir mínimo 50.
4. Definir máximo 200.
5. Aplicar los filtros.

Baseline correcto:

```text
category = Audio
AND price >= 50
AND price <= 200
```

Con el seed de referencia devuelve cuatro productos Audio y ninguno fuera del rango.

Comportamiento futuro:

```text
category = Audio
AND price >= 50
```

El límite máximo será ignorado únicamente cuando los tres filtros estén presentes, permitiendo
productos Audio superiores a 200.

Implementación: pendiente para FASE 11.

## Seguridad del catálogo

`bug_definitions` contiene respuestas del laboratorio:

- `anon`: ningún privilegio;
- tester autenticado: tiene el privilegio SQL `SELECT`, pero RLS devuelve cero filas;
- admin autenticado: `SELECT` mediante `private.is_admin()`;
- navegador: nadie tiene `INSERT`, `UPDATE` o `DELETE`, incluido admin.

`/#/admin/bugs` y `/#/admin/bugs/:code` usan además `AdminRoute` para UX. La seguridad no depende de
React, del menú ni del code splitting.

## Riesgo del repositorio público

El repositorio actual es público. Por tanto, una persona puede leer este documento, las migraciones
y la futura implementación aunque la Data API esté correctamente protegida. Opciones:

1. convertir el repositorio en privado para una evaluación real;
2. mantenerlo público solo como demo o material de desarrollo;
3. separar más adelante frontend público y lógica/configuración privada.

FASE 10 no cambia automáticamente la visibilidad del repositorio.

## Baseline verificado antes y después de FASE 10

| Bug | Resultado correcto conservado |
| --- | --- |
| BUG-001 | `OLD20` devuelve `coupon_expired` |
| BUG-002 | stock 2/cantidad 3 devuelve `insufficient_stock` y crea 0 pedidos |
| BUG-003 | el mismo `checkout_request_id` produce 1 pedido y el mismo ID |
| BUG-004 | 100 + 50 con 20% produce subtotal 150 y descuento 30 |
| BUG-005 | Audio + 50–200 devuelve 4 resultados, todos dentro del rango |

Los usuarios, pedidos, cupones y cambios de productos temporales se eliminan después de cada prueba.
