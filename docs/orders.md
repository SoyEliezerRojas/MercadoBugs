# Historial y detalle de pedidos

## Alcance

La Fase 9 implementa la experiencia de consulta histórica para testers autenticados:

- `/#/orders` lista hasta 50 pedidos propios, del más reciente al más antiguo;
- `/#/orders/:id` muestra productos, importes, cupón, entrega y pago del pedido;
- el checkout navega al detalle recién creado e invalida el historial en caché;
- los pedidos son de solo lectura para testers.

No se añadió una migración. El esquema, las policies y los índices de las Fases 2, 4 y 8 ya
contenían el modelo necesario.

## Organización del frontend

La funcionalidad vive en `web/src/features/orders/`:

- `api/ordersApi.ts`: consultas Supabase y mapeo explícito de filas;
- `hooks/useOrders.ts`: integración con TanStack Query;
- `pages/OrdersPage.tsx`: historial, loading, error y estado vacío;
- `pages/OrderDetailPage.tsx`: detalle, not found y confirmación post-checkout;
- `components/`: tarjeta, badge, productos, entrega y resumen financiero;
- `utils/orderPresentation.ts`: fecha, ID corto, cantidad y etiquetas de dominio;
- `types.ts`: tipos del listado, detalle y snapshots.

Los formatos monetarios reutilizan `features/catalog/utils/formatCurrency.ts`; no existe un segundo
`Intl.NumberFormat` para dinero.

## Consultas

El listado ejecuta una consulta a `orders`, filtra además por `user_id`, ordena por
`created_at DESC`, limita a 50 filas y selecciona solo `quantity` de la relación `order_items` para
sumar unidades. No descarga detalles de envío ni snapshots completos.

El detalle filtra por `id` y `user_id`, usa `maybeSingle()` y selecciona los datos históricos del
pedido junto con:

- `product_name`;
- `unit_price`;
- `quantity`;
- `line_total`;
- `product_id` únicamente como referencia opcional.

No se consulta `products` para reconstruir nombre, precio o total. Un UUID inválido se trata como
not found sin enviarlo a PostgreSQL.

## TanStack Query

Las claves incluyen el usuario para impedir que una caché de sesión se reutilice entre cuentas:

```text
['orders', 'list', userId]
['orders', 'detail', userId, orderId]
```

Ambas consultas usan un `staleTime` de 60 segundos y no hacen polling. Al completar checkout se
invalida la raíz `['orders']`, además de carrito, catálogo y pricing. La navegación va directamente
a `/#/orders/:id` con un estado efímero para mostrar el banner de compra correcta. La ruta histórica
`/#/checkout/success/:orderId` redirige al mismo detalle y no duplica la pantalla.

## Ownership y RLS

`ProtectedRoute` exige sesión en React por experiencia de usuario. La frontera de seguridad real
permanece en PostgreSQL:

- `orders_select_own`: `auth.uid() = user_id`;
- `order_items_select_own`: el pedido padre debe pertenecer a `auth.uid()`;
- las policies administrativas existentes siguen separadas mediante `private.is_admin()`;
- `authenticated` solo posee `SELECT` sobre `orders` y `order_items`.

Conocer el UUID de otro pedido no permite leerlo: PostgREST devuelve cero filas y la interfaz muestra
`Pedido no encontrado`, igual que para un UUID inexistente. La UI no revela si un recurso ajeno
existe.

Un tester no puede insertar, actualizar o eliminar pedidos ni ítems. Esta fase no implementa
cancelación, cambios de dirección, cambios de estado ni acciones administrativas.

## Snapshots e importes

La fuente histórica es el pedido confirmado:

- nombres, precios unitarios y totales de línea proceden de `order_items`;
- subtotal, descuento, envío y total proceden de `orders`;
- `orders.coupon_code` es el cupón histórico y puede ser `null`;
- entrega y métodos de envío/pago proceden de `orders`.

La interfaz no recalcula pedidos con el precio actual de `products` ni con reglas actuales de
`coupons`. La prueba local creó un pedido, cambió después `products.name` y `products.price`, y
confirmó que el detalle continuaba mostrando ambos valores originales.

## Estados y presentación

Los estados se presentan mediante un mapper central:

- `pending` → `Pendiente`;
- `confirmed` → `Confirmado`;
- `cancelled` → `Cancelado`.

Fechas, IDs cortos, métodos de pago y métodos de envío también se centralizan. Las etiquetas escritas
acompañan siempre al color del badge. El listado y el detalle usan cards y definiciones semánticas,
se apilan en móvil y evitan tablas horizontales.

## Validación de referencia

La validación local cubre:

- usuario sin pedidos, loading y error con reintento;
- dos usuarios con aislamiento de listado y detalle;
- pedido más reciente primero y suma de cantidades `2 + 1 = 3`;
- pedido con `TECH20` y pedido con cupón `null`;
- coincidencia exacta de subtotal, descuento, envío y total guardados;
- persistencia del detalle después de refresh;
- snapshots de nombre y precio tras modificar el producto actual;
- bloqueo de `UPDATE/DELETE orders` y `INSERT/UPDATE/DELETE order_items`;
- navegación checkout → detalle e invalidación del listado ya cacheado;
- responsive sin overflow horizontal en 390 px;
- limpieza posterior de usuarios, pedidos y cambios temporales.

Todas las compras, direcciones y formas de pago siguen siendo ficticias.
