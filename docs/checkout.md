# Cupones, checkout y pedidos

## Alcance

La Fase 8 implementa el baseline correcto del flujo de compra simulado. El navegador puede aplicar
un cupón, completar el checkout y consultar una confirmación mínima, pero no puede decidir importes,
crear pedidos ni modificar stock directamente.

```text
React
  -> Edge Function + JWT
    -> RPC SECURITY DEFINER + auth.uid()
      -> una transacción PostgreSQL
        -> order + order_items + stock + cart converted
```

No existe pago real. La UI nunca solicita número de tarjeta, CVV, vencimiento ni datos bancarios.

## Componentes

### Edge Functions

- `validate-coupon` acepta `quote`, `apply` y `remove`. La cotización lee precios desde PostgreSQL,
  valida el cupón asociado y devuelve las opciones de envío server-side.
- `checkout` valida forma y longitud del payload, autentica el access token con `auth.getUser()` y
  llama a `perform_checkout` conservando el JWT del usuario.
- `_shared/` centraliza allowlist CORS, autenticación y traducción de errores.

Ambas funciones aceptan solamente `POST` y `OPTIONS`. Los orígenes permitidos son Vite/Preview en
`localhost` o `127.0.0.1` y `https://soyeliezerrojas.github.io`. CORS no sustituye la autenticación.

La función rechaza un `Origin` fuera de la allowlist con 403 antes de autenticar o consultar datos.
El proxy Kong del stack local normaliza el header de salida `Access-Control-Allow-Origin` a `*`
incluso cuando el worker envía el origen exacto; esto es comportamiento de infraestructura local,
no una wildcard configurada en el código. La protección efectiva sigue siendo JWT/RLS/RPC y la
allowlist del worker se prueba también con un origen no permitido. El header se vuelve a inspeccionar
tras el deploy Cloud.

### PostgreSQL

La migración `20260815210000_implement_atomic_checkout.sql` incorpora:

- `orders.checkout_request_id UUID NOT NULL UNIQUE`;
- un constraint para `shipping_method IN ('standard', 'express')`;
- límites de longitud para datos de envío;
- `private.checkout_shipping_cost(text)` como fuente única de US$ 5.00/US$ 12.00;
- `public.manage_cart_coupon(...)`;
- `public.perform_checkout(...)`.

Las RPC públicas son `SECURITY DEFINER` porque un tester no tiene, ni debe tener, permisos directos
para consultar cupones, insertar pedidos o actualizar productos. Su superficie queda acotada por:

- `search_path = ''` y referencias calificadas por esquema;
- `EXECUTE` revocado a `PUBLIC` y `anon`, concedido solamente a `authenticated`;
- identidad tomada exclusivamente de `auth.uid()`;
- ausencia de un parámetro `user_id`;
- comprobaciones explícitas de carrito activo y propietario.

No se utiliza `service_role` en React ni en las Edge Functions.

## Atomicidad y rollback

Una llamada a `perform_checkout` es una sola sentencia RPC y, por tanto, una sola transacción. La
función valida el estado completo antes de escribir y luego ejecuta:

1. inserción de `orders`;
2. inserción de snapshots en `order_items`;
3. descuento de `products.stock`;
4. cambio del carrito a `converted`.

Una excepción en cualquier punto revierte las cuatro operaciones. El baseline local de stock
insuficiente comprobó el mismo estado antes y después: `orders=0`, `order_items=0`, `stock=2` y
`cart.status=active`.

## Locks y concurrencia

La función bloquea:

1. el carrito activo del usuario con `FOR UPDATE`;
2. sus `cart_items`, ordenados por `product_id`;
3. los productos involucrados con `FOR UPDATE`, también ordenados por UUID;
4. el cupón asociado durante su validación final.

El orden estable reduce el riesgo de deadlocks. Un checkout concurrente espera el lock, vuelve a
observar el stock confirmado por la otra transacción y falla si ya no quedan unidades. En la prueba
simultánea con stock 1, una request devolvió 200/`confirmed`, la otra 409/`insufficient_stock`, quedó
un pedido y el stock terminó en 0.

## Idempotencia

React genera un `checkoutRequestId` UUID una vez por intento. PostgreSQL lo guarda en la constraint
UNIQUE de `orders`. Repetir una request ya confirmada para el mismo usuario devuelve el mismo pedido
con `idempotentReplay=true`; otro usuario no puede reutilizar ese UUID.

El lock del carrito ofrece una segunda defensa: dos identificadores diferentes tampoco pueden
convertir simultáneamente el mismo carrito activo. La UI además deshabilita `Confirmar compra` y
muestra `Procesando…` mientras la mutation está pendiente.

## Cupones y cálculos

React nunca descarga `coupons`. El código escrito se normaliza a mayúsculas y el servidor valida:

- existencia y `active`;
- `starts_at` y `expires_at` usando el reloj de PostgreSQL;
- `minimum_purchase` contra el subtotal actual del carrito;
- tipo `percentage` o `fixed`.

Un cupón válido se guarda en `carts.coupon_id`; refresh y una sesión posterior conservan la
selección. Una cotización retira automáticamente un cupón que dejó de ser válido. Checkout siempre
repite la validación bajo lock y rechaza la compra si el cupón expiró entre preview y confirmación.

Los importes definitivos usan `numeric(12,2)`:

```text
subtotal = SUM(products.price * cart_items.quantity)
discount percentage = ROUND(subtotal * value / 100, 2)
discount fixed = LEAST(value, subtotal)
total = subtotal - discount + shipping_cost
```

El descuento efectivo nunca supera el subtotal. Por eso un cupón fijo de 200 sobre US$ 18.90
produce descuento US$ 18.90 y total US$ 5.00 con envío estándar, nunca un total negativo.

`order_items` conserva `product_id`, `product_name`, `unit_price`, `quantity` y `line_total` leídos
del servidor. `orders.coupon_code` conserva el código como snapshot histórico.

## React y TanStack Query

`web/src/features/checkout/` separa tipos, repositorios, hooks, cupón, formulario, resumen y página
de éxito. TanStack Query usa mutations para aplicar/quitar cupón y confirmar compra. Al finalizar
solo invalida las claves de carrito, catálogo y pricing afectadas.

La UI calcula únicamente representaciones visuales. El preview procede de `validate-coupon`; la
respuesta de checkout reemplaza cualquier valor anterior como autoridad. La ruta `/checkout` está
protegida y un carrito vacío vuelve a `/cart`. `/checkout/success/:orderId` consulta solamente los
campos mínimos del pedido propio mediante la RLS existente; la Fase 9 sigue reservada para historial
y detalle completo.

## Desarrollo local

Docker Desktop debe estar en ejecución. Desde la raíz:

```powershell
npm run supabase:start
npm run supabase:reset
```

El stack iniciado sirve las funciones configuradas en:

```text
http://127.0.0.1:54321/functions/v1/validate-coupon
http://127.0.0.1:54321/functions/v1/checkout
```

Para ejecutar el servidor de funciones en primer plano y ver logs/hot reload:

```powershell
npx supabase functions serve
```

En otra terminal:

```powershell
cd web
npm run dev
```

## Baseline verificado

| Caso | Resultado local |
| --- | --- |
| `BIENVENIDO10` | 10% aplicado y persistente |
| `OLD20` | `coupon_expired` |
| Código inexistente | `coupon_not_found` |
| `TECH20` bajo US$ 500 | `coupon_minimum_purchase` |
| Quitar cupón | descuento vuelve a 0 |
| Carrito vacío | `cart_empty` |
| Producto inactivo | `product_unavailable` |
| Cantidad 3 con stock 2 | `insufficient_stock`, rollback completo |
| Shipping incompleto | `invalid_shipping_data` |
| Payment inválido | `invalid_payment_method` |
| Mismo request UUID dos veces | un pedido, mismo ID |
| 100 + 50, cupón 20%, standard | 150 - 30 + 5 = 125 |
| Cupón fijo mayor al subtotal | descuento limitado; total no negativo |
| Dos usuarios, stock 3, cantidades 2+2 | primero compra; segundo falla |
| Dos requests simultáneas, stock 1 | un pedido; stock final 0 |
| Insert directo en `orders` | bloqueado |
| Update directo de stock por tester | sin cambios |
| Select de `coupons` por tester | cero filas |

Los productos, cupones y usuarios temporales utilizados por las pruebas se eliminan al terminar; el
seed queda sin datos de prueba adicionales.

## Deploy

Después de reset, pruebas, lint y build:

```powershell
npx supabase db push --dry-run
npx supabase db push
npx supabase functions deploy validate-coupon --project-ref eaouxnecjovvypayixff
npx supabase functions deploy checkout --project-ref eaouxnecjovvypayixff
git push origin main
```

Finalmente se repiten en GitHub Pages los casos de cupón válido/expirado, checkout, refresh de la
confirmación y ausencia de 404 de assets.
