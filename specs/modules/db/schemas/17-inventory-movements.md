# `inventory_movements`

Cada movimiento individual de inventario. Es el **log de mutación de stock** (1 fila por producto modificado).

> Cuando se crea un batch con 5 productos, también se crean 5 filas aquí — una por producto.

> Cuando se hace una venta con 3 productos, también se crean 3 filas con `movement_type='venta'`.

## Esquema

| Columna | Tipo | Constraints | Descripción |
|---|---|---|---|
| `id` | `UUID` | `PK` | — |
| `product_id` | `UUID` | `FK → products.id` `(ON DELETE RESTRICT)` | Producto. |
| `movement_type` | `TEXT` | `NOT NULL` | Uno de: `entrada`, `salida`, `ajuste`, `venta`. |
| `quantity` | `INTEGER` | `NOT NULL` | Cantidad (siempre positivo; el sentido lo da `movement_type`). |
| `note` | `TEXT` | NULL | Nota opcional. |
| `batch_id` | `UUID` | `FK → inventory_batches.id` `(ON DELETE SET NULL)` | Link al batch si vino de un batch (NULL para movimientos o ventas individuales). |
| `user_id` | `UUID` | `FK → users.id` `(ON DELETE RESTRICT)` | Quién lo hizo. |
| `store_id` | `UUID` | `FK → stores.id` `(ON DELETE SET NULL)` | Tienda. |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT CURRENT_TIMESTAMP` | — |

## Índices

- `INDEX(product_id)`.
- `INDEX(movement_type)`.
- `INDEX(created_at)`.
- `INDEX(batch_id)`.
- `INDEX(store_id)`.

## `movement_type`

| Valor | Origen típico |
|---|---|
| `entrada` | `POST /inventory` con `movement_type='entrada'` o `POST /inventory/batches` con tipo `entrada`. |
| `salida` | `POST /inventory` con `movement_type='salida'` o batch `salida`. |
| `ajuste` | `POST /inventory` con `movement_type='ajuste'`. |
| `venta` | `POST /sales` — por cada producto vendido. |

## NO soft-delete

Inmutable (trazabilidad de stock).
