# `inventory_batches`

Cabecera de un batch de inventario: una operación **masiva** que afecta varios productos a la vez (e.g. compra de proveedor con 5 SKUs distintos).

Asocia múltiples `inventory_batch_items` (uno por producto) y múltiples `inventory_movements` (los movimientos reales resultantes).

## Esquema

| Columna | Tipo | Constraints | Descripción |
|---|---|---|---|
| `id` | `UUID` | `PK` | — |
| `movement_type` | `TEXT` | `NOT NULL` | `entrada \| salida \| ajuste`. |
| `supplier_id` | `UUID` | `FK → suppliers.id` `(ON DELETE SET NULL)` | Proveedor (si aplica, usualmente para `entrada`). |
| `notes` | `TEXT` | NULL | Notas opcionales (e.g. factura #1234). |
| `user_id` | `UUID` | `FK → users.id` `(ON DELETE RESTRICT)` | Cajero que ejecutó. |
| `store_id` | `UUID` | `FK → stores.id` `(ON DELETE SET NULL)` | Tienda. |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT CURRENT_TIMESTAMP` | — |

## Índices

- `INDEX(movement_type)`.
- `INDEX(supplier_id)`.
- `INDEX(created_at)`.
- `INDEX(store_id)`.

## Relaciones (hijas)

- `inventory_batch_items` 1:N — items del batch.
- `inventory_movements` 1:N — movimientos resultantes (cada producto genera un movement con `batch_id` link).

## Cascade al delete?

`ON DELETE RESTRICT` en `user_id` — no se puede borrar el user sin borrar sus batches (preservar auditoría).

> ⚠️ Fastify **no** implementa DELETE de batch. Solo `POST` y `GET`. Borrar manualmente con SQL directo si hace falta. **Decidir** durante port.

## Side effects de POST

Transacción:

1. INSERT `inventory_batches`.
2. INSERT n `inventory_batch_items`.
3. Para cada item:
   - UPDATE `products.stock = stock ± item.quantity`.
   - INSERT `inventory_movements` con `batch_id` linkeado.

Si cualquier paso falla: ROLLBACK completo.
