# Catálogo

## Alcance

La Fase 6 implementa la Home, el catálogo y el detalle de producto. Los datos provienen de
Supabase; no hay productos ni categorías de negocio codificados en React. Esta fase no incluye
carrito, checkout, paginación ni defectos intencionales.

Con los 40 productos actuales se devuelve el conjunto completo que coincide con los filtros. Si el
volumen crece, la API puede incorporar paginación sin cambiar la separación entre UI, hooks y
repositorio.

## Arquitectura

```text
pages/components
      |
      v
TanStack Query hooks
      |
      v
catalogApi repository
      |
      v
Supabase Data API / PostgREST
      |
      v
PostgreSQL + RLS
```

El módulo vive en `web/src/features/catalog/`:

- `types.ts`: contratos `Product`, `Category`, `ProductFilters` y `SortOption`.
- `api/catalogApi.ts`: consultas, filtros, orden y mapeo de filas.
- `hooks/`: query keys, hooks de TanStack Query y debounce.
- `components/`: filtros, tarjetas, imágenes con fallback y estados visuales.
- `pages/`: listado y detalle.
- `utils/`: parámetros del catálogo y formato monetario.

Las páginas no construyen consultas de Supabase. TanStack Query usa claves derivadas del catálogo y
de todos los filtros aplicados, conserva temporalmente los resultados previos durante una nueva
consulta y evita refetches innecesarios.

## Consultas

Productos y detalle seleccionan solamente:

```text
id, category_id, name, slug, description, price, stock, image_url, created_at,
category: categories(id, name, slug)
```

La relación usa un `inner join`. Todas las lecturas públicas agregan `products.active = true` y
`category.active = true`, además de las restricciones RLS ya existentes. Esto evita que un producto
o categoría inactivos aparezcan incluso si la sesión pertenece a un administrador. Un detalle
inactivo o inexistente se presenta como producto no encontrado.

La Home consulta categorías activas y selecciona ocho productos activos con stock, ordenados de
forma estable por nombre. No existe todavía una columna `featured`.

## Filtros y orden

El catálogo filtra en PostgREST para que la arquitectura pueda crecer sin descargar primero todo el
inventario. Cada condición se encadena sobre la misma consulta, por lo que la semántica es AND:

```text
name ILIKE search
AND category.slug = category
AND price >= min
AND price <= max
```

La búsqueda es case-insensitive y se limita al nombre. Se eliminan los caracteres `%` y `_` antes
de consultar para que la entrada se trate como texto y no como comodines SQL. Un debounce de 300 ms
evita una petición por tecla.

El rango admite extremos vacíos. Rechaza valores no numéricos, negativos y rangos donde el mínimo
supera al máximo. Las opciones de orden son:

- predeterminado y nombre A-Z: `name ASC`;
- precio menor a mayor: `price ASC`;
- precio mayor a menor: `price DESC`.

## Parámetros de URL

`HashRouter` mantiene los filtros después del fragmento, por ejemplo:

```text
#/products?search=headset&category=gaming&min=50&max=200&sort=price-asc
```

Los parámetros admitidos son `search`, `category`, `min`, `max` y `sort`. Los valores vacíos y el
orden predeterminado no se guardan. “Limpiar todo” elimina los parámetros y restaura el catálogo
completo. La búsqueda actualiza la URL con `replace` mientras se escribe; los cambios discretos de
categoría, precio y orden permanecen en el historial.

## Baseline correcto previo a BUG-005

BUG-005 no está implementado. El comportamiento de referencia es:

```text
category = Audio
min = 50
max = 200

category = Audio AND price >= 50 AND price <= 200
```

La búsqueda, cuando existe, agrega otra condición AND. Nunca se combinan categoría y precio con OR.
En el seed actual, `search=headset`, `category=gaming`, `min=50` y `max=200` devuelve únicamente
`Headset BattleTone`.

## Casos manuales de referencia

Con Supabase local y el seed actual:

1. `/products` muestra 40 productos activos.
2. `search=mouse` devuelve `Mouse Vertex Pro`.
3. `category=audio` devuelve solamente los seis productos de Audio.
4. `min=50&max=200` devuelve 18 productos, todos dentro del rango.
5. Audio + 50–200 devuelve cuatro productos de Audio dentro del rango.
6. Headset + Gaming + 50–200 devuelve solamente `Headset BattleTone`.
7. El orden ascendente del rango 50–200 comienza en 54,90 y termina en 199,00.
8. Limpiar filtros vuelve a 40 resultados y elimina los parámetros.
9. El seed contiene cuatro productos activos sin stock y sus tarjetas muestran “Sin stock”.
10. `/products/id-inexistente` muestra un estado controlado y permite volver al catálogo.

