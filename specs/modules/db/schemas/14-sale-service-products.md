# `sale_service_products`

Productos consumidos por un `sale_service` específico dentro de una venta. Captura qué stock se descontó.

## Esquema

| Columna | Tipo | Constraints | Descripción |
|---|---|---|---|
| `id` | `UUID` | `PK` | — |
| `sale_service_id` | `UUID` | `FK → sale_services.id` `(ON DELETE CASCADE)` | Service vendido. |
| `product_id` | `UUID` | `FK → products.id` `(ON DELETE RESTRICT)` | Producto consumido. |
| `product_name` | `TEXT` | `NOT NULL` | Snapshot del nombre. |
| `quantity` | `INTEGER` | `NOT NULL` | Cantidad consumida del producto. |
| `unit_price` | `NUMERIC(10,2)` | `NOT NULL` | Snapshot del precio del producto. |
| `line_total` | `NUMERIC(10,2)` | `NOT NULL` | `quantity × unit_price`. |
| `affects_price` | `BOOLEAN` | `NOT NULL DEFAULT false` | Si `true`, el precio del producto custom afecta el `sale_service.line_total`. |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT CURRENT_TIMESTAMP` | — |

## Índices

- `INDEX(sale_service_id)`.
- `INDEX(product_id)`.

## Snapshot

`product_name` y `unit_price` son snapshots para preservar el precio histórico.

## `affects_price`

Caso 1: usuario selecciona un producto custom y dice "no añada al precio" → `affects_price=false`.

Caso 2: `affects_price=true` → el `sale_service.line_total` se ajusta al costo real de los productos custom.

> Ver lógica detallada en [API sales](../../api/10-sales.md#post-apiv1sales--endpoint-principal).

## NO soft-delete

Inmutable.
