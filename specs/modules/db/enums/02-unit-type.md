# `UNIT_TYPE`

Tipo de unidad de presentación de un producto. Útil para el POS al mostrar en el ticket ("$precio por unidad" vs "$precio por paquete × 6 unidades = $X por pack").

> Definido en SQL como Postgres ENUM:

```sql
CREATE TYPE "UNIT_TYPE" AS ENUM (
  'unidad',
  'paquete',
  'caja',
  'bolsa',
  'botella',
  'lata',
  'sobre',
  'barra',
  'rollo',
  'galon',
  'ristra'
);
```

| Valor | Default | Uso típico |
|---|---|---|
| `unidad` | unidad simple. |
| `paquete` | conjunto de varias unidades (ej. galletas en paquete de 6). Suele tener `unit_quantity>1`. |
| `caja` | agrupación más grande. |
| `bolsa` | productos en bolsa (ej. papas, dulces). |
| `botella` | bebidas. |
| `lata` | bebidas enlatadas. |
| `sobre` | sobres pequeños (ej. salsa, ketchup). |
| `barra` | barras (ej. pan, granola). |
| `rollo` | rollos (papel, film). |
| `galon` | líquidos por galón. |
| `ristra` | productos en ristra (ajos, morrones). |

## Tablas que lo usan

- [`products`](../schemas/08-products.md) — columna `unit_type "UNIT_TYPE"` (NULL permitido).

## Nullable

`products.unit_type` es **nullable**. Productos sin unit_type definido (NULL) se manejan como "unidad base" a nivel UI.

## Validación

El DTO de Fastify (`CreateProductDtoSchema`) y el equivalente Rust aceptan los mismos 11 valores via enum.
