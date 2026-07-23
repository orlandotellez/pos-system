# `inventory_batch_items`

Items de un `inventory_batch` (1 fila por producto dentro del batch).

## Esquema

| Columna | Tipo | Constraints | Descripción |
|---|---|---|---|
| `id` | `UUID` | `PK` | — |
| `batch_id` | `UUID` | `FK → inventory_batches.id` `(ON DELETE CASCADE)` | Batch padre. |
| `product_id` | `UUID` | `FK → products.id` `(ON DELETE RESTRICT)` | Producto. |
| `quantity` | `INTEGER` | `NOT NULL` | Cantidad (signo depende de `inventory_batches.movement_type`). |
| `unit_cost` | `NUMERIC(10,2)` | NULL | Costo unitario al recibir del proveedor (útil para `entrada`). |
| `notes` | `TEXT` | NULL | Notas opcionales (e.g. unidad dañada en una caja de 12). |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT CURRENT_TIMESTAMP` | — |

## Índices

- `INDEX(batch_id)`.
- `INDEX(product_id)`.

## `quantity` sign

- Si el batch es `entrada`: `quantity` positivo (suma stock).
- Si es `salida`: `quantity` positivo, pero el service lo aplica como `-quantity` al stock.
- Si es `ajuste`: `quantity` positivo, el service lo aplica como `+quantity` (delta).

> ⚠️ **Decision**: Fastify trata `ajuste` como delta. Si se quiere `ajuste` como **set** (fija el stock al valor), cambiar la semántica.

## Cascade al delete

`ON DELETE CASCADE` en `batch_id` — si el batch se borra, los items van con él (no debería pasar en prod, pero es defensivo).

`ON DELETE RESTRICT` en `product_id` — no permite borrar un product si está en un batch activo.
