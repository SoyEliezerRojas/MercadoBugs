# Catálogo oficial de bugs conocidos

## Estado de FASE 11

FASE 11 activa secuencialmente los cinco defectos intencionales del laboratorio. Cada activación
está versionada en una migración independiente y se valida antes de continuar con la siguiente.
Cualquier desviación distinta de las condiciones documentadas debe tratarse como un defecto
accidental.

La fuente operativa es `public.bug_definitions`, creada y poblada por la migración
`20260815220000_create_bug_definitions.sql`; las migraciones de FASE 11 actualizan cada estado.
`docs/bugs.md` es la referencia de desarrollo y administración; la UI de tester no la enlaza.

## Estados

- `planned`: definido, todavía no implementado;
- `enabled`: comportamiento defectuoso activo en el laboratorio;
- `disabled`: implementación existente pero desactivada.

No se utiliza aleatoriedad ni activación por usuario.

## BUG-001 — Cupón vencido aceptado

- Categoría: `business_rule` — Regla de negocio.
- Severidad: `medium` — Media.
- Estado: `enabled`.
- Componente afectado: resumen de cupón del carrito y checkout.
- Backend afectado: `public.manage_cart_coupon` y `public.perform_checkout`.

Precondiciones:

- existe `OLD20`, activo pero expirado en 2024;
- el usuario tiene un carrito válido con productos.

Pasos:

1. Iniciar sesión.
2. Agregar uno o más productos al carrito.
3. Introducir `OLD20`.
4. Pulsar Aplicar.

Resultado esperado original: el servidor comprueba `expires_at`, rechaza el cupón con
`coupon_expired` y no aplica descuento.

Resultado actual: `OLD20` es aceptado, aparece en el resumen y `perform_checkout` guarda el código y
el descuento en el pedido aunque `expires_at` esté en el pasado.

Condición exacta: cualquier cupón que supere el resto de las validaciones se considera utilizable
aunque su `expires_at` ya haya pasado. `active`, `starts_at`, `minimum_purchase`, `discount_type` y
`discount_value` conservan sus reglas.

Efecto conocido: un cupón histórico activo puede utilizarse indefinidamente. No cambia permisos ni
permite consultar la tabla de cupones desde una sesión tester.

Regresiones verificadas:

- `BIENVENIDO10` y `TECH20` continúan calculando su porcentaje;
- cupón inexistente, inactivo, futuro y sin compra mínima se rechazan;
- checkout conserva `OLD20` y el mismo descuento mostrado previamente;
- stock insuficiente, idempotencia y filtros conservan el baseline previo a sus activaciones.

Implementación versionada: `20260815230000_enable_bug_001.sql`.

## BUG-002 — Compra superior al stock disponible

- Categoría: `inventory` — Inventario.
- Severidad: `critical` — Crítica.
- Estado: `enabled`.
- Componente afectado: confirmación de checkout ante cambios concurrentes de inventario.
- Backend afectado: helpers privados usados por `public.perform_checkout`.

Precondiciones:

- la cantidad del carrito supera el stock actual;
- caso de referencia: stock 2, cantidad solicitada 3;
- puede producirse después de una reducción concurrente del inventario.

Pasos:

1. Agregar un producto al carrito.
2. Reducir el stock por debajo de la cantidad del carrito.
3. Completar el checkout.
4. Confirmar la compra.

Resultado esperado original: `perform_checkout` bloquea y vuelve a leer productos, devuelve
`insufficient_stock`, revierte la transacción, no crea un pedido y nunca deja stock negativo.

Resultado actual: el checkout crea el pedido con la cantidad guardada en el carrito aunque supere el
stock leído al confirmar. El inventario resultante usa `GREATEST(stock - quantity, 0)`.

Condición exacta: la cantidad continúa en el carrito después de que otra compra reduzca el stock por
debajo de ella. Ejemplo validado: stock inicial 3, carrito A con 3, compra B de 1, checkout A de 3 y
stock final 0.

Efecto conocido: `order_items.quantity` puede superar el stock disponible inmediatamente antes de
la confirmación. El stock nunca es negativo y no se eliminó `products_stock_non_negative`.

Regresiones verificadas:

- una compra dentro del stock resta la cantidad exacta;
- un fallo posterior de checkout revierte pedido e inventario de forma atómica;
- los snapshots de `order_items` y los cupones continúan funcionando;
- no se modificaron grants, policies ni RLS.

Implementación versionada: `20260815231000_enable_bug_002.sql`.

## BUG-003 — Doble confirmación genera dos pedidos

- Categoría: `concurrency` — Concurrencia.
- Severidad: `high` — Alta.
- Estado: `enabled`.
- Componente afectado: botón Confirmar compra y transición del carrito durante checkout.
- Backend afectado: `public.perform_checkout`, `private.checkout_transitions` y su claim privado.

Precondición: usuario en checkout con un carrito válido.

Pasos:

1. Completar el checkout.
2. Hacer doble clic rápido en Confirmar compra desde la misma pantalla.
3. Consultar Mis pedidos.

Resultado esperado original: `checkout_request_id UUID NOT NULL UNIQUE`, el lock del carrito y la respuesta
idempotente garantizan un solo pedido y el mismo ID para el retry.

Resultado actual: dos confirmaciones rápidas generan dos pedidos con IDs y
`checkout_request_id` diferentes para las mismas líneas del carrito.

Condición exacta: la página genera un UUID por submit y no deshabilita el botón por el primer request.
La segunda confirmación puede reclamar una única transición durante los dos segundos posteriores a
la conversión inicial. La marca se consume atómicamente; no existe reapertura indefinida.

Efectos conocidos:

- ambos pedidos descuentan inventario; con BUG-002 activo el stock queda limitado a cero;
- cualquiera de las dos respuestas puede ser la que finalmente abra el detalle;
- una tercera request con ID nuevo se rechaza y no crea otro pedido.

Regresiones verificadas:

- un submit normal crea un pedido;
- repetir exactamente el mismo `checkout_request_id` devuelve el pedido original;
- una request posterior con ID diferente devuelve `cart_not_found`;
- recargar o leer el detalle no crea pedidos;
- doble clic real en la UI produjo dos pedidos, sin errores de página ni assets 404.

Implementación versionada: `20260815232000_enable_bug_003.sql`,
`20260815232100_refine_bug_003_concurrency_window.sql`,
`20260815232200_bound_bug_003_duplicate_window.sql` y
`20260815232300_cleanup_bug_003_checkout_function.sql`. La migración
`20260815234100_align_bug_003_reproduction.sql` alinea los pasos administrativos con el doble submit.

## BUG-004 — Descuento calculado incorrectamente

- Categoría: `calculation` — Cálculo.
- Severidad: `high` — Alta.
- Estado: `enabled`.
- Componente afectado: resúmenes de carrito/checkout y valores persistidos del pedido.
- Backend afectado: `private.checkout_percentage_basis`, consumido por ambas RPC de precios.

Condición exacta:

- el carrito contiene al menos dos productos diferentes;
- se aplica un cupón porcentual;
- la primera línea se determina por `cart_items.created_at ASC` y
  después por `id ASC`, evitando cualquier aleatoriedad.

Caso de referencia:

```text
Producto A: 100 × 1 = 100
Producto B:  50 × 1 =  50
Subtotal:               150
Cupón:                   20%
```

Resultado esperado original: `ROUND(150 × 20 / 100, 2) = 30`.

Resultado actual: el porcentaje se aplica solo a la primera línea; en el caso de referencia,
`ROUND(100 × 20 / 100, 2) = 20`.

Condición exacta: dos o más `cart_items` diferentes y cupón `percentage`. La línea base es la menor
por `created_at ASC, id ASC`. Una sola línea y cupones `fixed` conservan el subtotal normal.

Efecto conocido: el descuento mostrado y cobrado es menor cuando las líneas posteriores aportan
subtotal. El pedido guarda esos valores, por lo que detalle e historial no los recalculan.

Regresiones verificadas:

- una línea de 100 con 20% produce descuento 20;
- dos líneas 100 + 50 con 20% producen subtotal 150, descuento 20 y total 135 con envío estándar;
- el pedido persiste exactamente 150/20/135;
- dos líneas con cupón fijo conservan descuento 5;
- inventario, atomicidad y snapshots de pedido permanecen operativos.

Implementación versionada: `20260815233000_enable_bug_004.sql`.

## BUG-005 — Filtro de categoría y precio combinado incorrectamente

- Categoría: `filtering` — Filtros.
- Severidad: `medium` — Media.
- Estado: `enabled`.
- Componente afectado: listado de productos con filtros persistidos en la URL.
- Backend afectado: ninguno; la desviación está centralizada en `catalogApi.getProducts`.

Condición exacta: categoría, precio mínimo y precio máximo existen simultáneamente.

Pasos:

1. Abrir el catálogo.
2. Seleccionar Audio.
3. Definir mínimo 50.
4. Definir máximo 200.
5. Aplicar los filtros.

Resultado esperado original:

```text
category = Audio
AND price >= 50
AND price <= 200
```

Con el seed de referencia devuelve cuatro productos Audio y ninguno fuera del rango.

Resultado actual:

```text
category = Audio
AND price >= 50
```

El límite máximo se ignora únicamente cuando los tres filtros están presentes, permitiendo
productos Audio superiores a 200. La URL y el campo Máximo conservan el valor seleccionado.

Efecto conocido: el resumen de resultados puede contradecir visualmente el máximo elegido. Búsqueda,
orden y los otros predicados continúan aplicándose.

Regresiones verificadas:

- categoría sola: 6 resultados Audio;
- mínimo solo: 18; máximo solo: 22; mínimo + máximo sin categoría: 18;
- Audio + mínimo: 6; Audio + máximo: 4;
- Audio + 50 + 200: 6 en lugar de 4 e incluye productos sobre 200;
- búsqueda + rango sin categoría conserva el máximo;
- búsqueda dentro de la combinación defectuosa continúa filtrando por nombre;
- URL y control visual conservan `max=200`.

Implementación versionada: `20260815234000_enable_bug_005.sql` y
`web/src/features/catalog/api/catalogApi.ts`.

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

FASE 11 no cambia automáticamente la visibilidad del repositorio.

## Baseline inicial verificado antes de FASE 11

| Bug | Resultado correcto conservado |
| --- | --- |
| BUG-001 | `OLD20` devuelve `coupon_expired` |
| BUG-002 | stock 2/cantidad 3 devuelve `insufficient_stock` y crea 0 pedidos |
| BUG-003 | el mismo `checkout_request_id` produce 1 pedido y el mismo ID |
| BUG-004 | 100 + 50 con 20% produce subtotal 150 y descuento 30 |
| BUG-005 | Audio + 50–200 devuelve 4 resultados, todos dentro del rango |

Los usuarios, pedidos, cupones y cambios de productos temporales se eliminan después de cada prueba.

## Matriz final de FASE 11

| Bug | Trigger exacto | Resultado activo | Límites conservados |
| --- | --- | --- | --- |
| BUG-001 | aplicar `OLD20` | aceptado y persistido con 20% | las otras validaciones de cupón siguen activas |
| BUG-002 | stock baja de 3 a 2 con cantidad 3 en carrito | pedido de 3 y stock final 0 | constraint no negativo, compra normal y rollback |
| BUG-003 | dos submits con UUID distintos dentro de la ventana de 2 segundos | exactamente 2 pedidos | mismo UUID idempotente; tercer intento y retry tardío bloqueados |
| BUG-004 | 2+ líneas y cupón porcentual | porcentaje sobre primera línea | una línea y cupón fijo calculan correctamente |
| BUG-005 | category + min + max | `max` no se envía a PostgREST | todas las otras combinaciones aplican sus filtros |

Estado final verificado:

```text
BUG-001 enabled
BUG-002 enabled
BUG-003 enabled
BUG-004 enabled
BUG-005 enabled
```

La regresión global confirmó registro, login/logout, catálogo, carrito, checkout normal, pedidos y
administración. Reportes continúa siendo un placeholder de FASE 12.

## Source maps

`web/vite.config.ts` declara `build.sourcemap = false`. El build de producción no publica archivos
`.map`; el servidor de desarrollo conserva las herramientas habituales de Vite. Esto reduce la
inspección casual del bundle, pero no se considera una frontera de seguridad.
