# Carrito persistente

## Alcance

La Fase 7 implementa un carrito persistente para usuarios autenticados. Permite agregar, incrementar,
disminuir, eliminar y vaciar productos; muestra subtotales por línea, subtotal general y cantidad
total de unidades. No implementa cupones, checkout, pedidos, pagos ni defectos intencionales.

## Arquitectura

```text
components / CartPage
        |
        v
TanStack Query hooks y mutations
        |
        v
cartApi repository
        |
        v
Supabase Data API
        |
        v
PostgreSQL + constraints + RLS
```

El módulo `web/src/features/cart/` separa:

- `types.ts`: contratos de carrito, ítem, producto y totales;
- `api/cartApi.ts`: lectura y operaciones persistentes;
- `hooks/useCart.ts`: query keys, query y mutations;
- `components/`: botón de agregado, indicador del navbar, fila, resumen y confirmación;
- `pages/CartPage.tsx`: composición de `/cart`;
- `utils/cartTotals.ts`: cálculo centralizado de unidades y subtotales.

Las claves de TanStack Query incluyen el UUID del usuario:

```text
['cart', 'active', userId]
```

Esto mantiene separadas las cachés de distintas sesiones. Todas las mutations invalidan la clave del
usuario antes de finalizar, actualizando conjuntamente página, resumen y navbar.

## Modelo existente

No fue necesaria una migración. PostgreSQL ya contiene:

- `carts_one_active_per_user_idx`: índice UNIQUE parcial por `user_id` cuando `status = 'active'`;
- `cart_items_cart_product_unique`: una fila por carrito y producto;
- `cart_items_quantity_positive`: `quantity > 0`;
- claves foráneas con cascada de carrito a ítems y restricción de borrado de productos referenciados;
- índices para las claves de consulta y triggers de `updated_at`.

La fila `carts` se crea de forma lazy. Consultar el contador o visitar `/cart` ejecuta solamente una
lectura. El primer “Agregar al carrito” busca el carrito activo y, si no existe, lo crea. Vaciar el
carrito elimina sus `cart_items`, pero conserva la fila activa.

## Agregar y concurrencia

Antes de agregar, el repositorio vuelve a consultar el producto activo y su stock. Si el producto ya
está presente, incrementa la fila existente. La operación usa:

1. el UNIQUE de carrito activo;
2. el UNIQUE `(cart_id, product_id)`;
3. actualización condicionada por la cantidad previamente leída;
4. reintentos acotados cuando otra operación gana la carrera.

De esta manera, dos acciones cercanas no crean filas duplicadas ni sobrescriben silenciosamente un
incremento. Los botones permanecen deshabilitados mientras su mutation está pendiente.

## Stock

La UI deshabilita agregar cuando `stock = 0` y deshabilita `+` al alcanzar el máximo. El repositorio
vuelve a validar el stock antes de agregar o aumentar, y nunca acepta cantidades no enteras o menores
que uno. Si el stock cambió y una línea queda temporalmente por encima, se permite disminuirla para
que el usuario pueda corregirla.

Esta validación protege el comportamiento normal del carrito, pero no reserva inventario. En la Fase
8, checkout debe volver a comprobar stock y cantidades en servidor dentro de la operación que crea el
pedido. El stock puede cambiar entre agregar y comprar; el carrito no es la autoridad final de
inventario.

## Seguridad

RLS permanece activa y no se usa `service_role` desde React:

- un usuario solamente consulta y modifica su carrito;
- las policies de `cart_items` comprueban la propiedad mediante `carts.user_id = auth.uid()`;
- un visitante no autenticado es enviado a login sin crear datos;
- después del login, `location.state.from` lo devuelve a la ruta desde la que intentó agregar.

El producto no se agrega automáticamente después del login; el usuario confirma la acción de nuevo.

## Comportamiento correcto

- Un producto nuevo comienza con cantidad 1.
- Agregar el mismo producto incrementa la única fila existente.
- `−` se deshabilita en cantidad 1; eliminar requiere el botón separado.
- Ningún incremento supera el stock mostrado o el stock vuelto a consultar.
- Eliminar y vaciar recalculan inmediatamente contador y subtotales.
- El carrito sobrevive refresh y nuevas sesiones porque sus filas pertenecen al usuario en Supabase.
- Cupones, checkout y errores intencionales continúan fuera de alcance.

