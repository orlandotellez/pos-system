# `sale_services`

Services vendidos dentro de un `sale`. Cada venta puede contener varios services, cada uno tiene su `line_total` y un snapshot de `service_name` y `base_price`.

## Esquema

| Columna | Tipo | Constraints | Descripción |
|---|---|---|---|
| `id` | `UUID` | `PK` | — |
| `sale_id` | `UUID` | `FK → sales.id` `(ON DELETE RESTRICT)` | Venta padre. |
| `service_id` | `UUID` | `FK → services.id` `(ON DELETE RESTRICT)` | Service vendido. |
| `service_name` | `TEXT` | `NOT NULL` | Snapshot del nombre. |
| `base_price` | `NUMERIC(10,2)` | `NOT NULL` | Snapshot del base_price al momento de venta. |
| `line_total` | `NUMERIC(10,2)` | `NOT NULL` | Precio total de la linea. |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT CURRENT_TIMESTAMP` | — |

## Índices

- `INDEX(sale_id)`.
- `INDEX(service_id)`.

## Hija: `sale_service_products`

Cada `sale_service` puede tener productos custom-selected o auto-fulfilled via `service_products`. Ver [`sale_service_products`](./14-sale-service-products.md).

## Snapshots

`service_name` y `base_price` son snapshots. Si se cambia el precio del service después, las ventas previas mantienen los valores originales.

## Line total

`line_total` puede diferir de `base_price` si los productos custom afectan el precio (`affects_price=true`). Más detalles en [API sales](../../api/10-sales.md).

## NO soft-delete

`ON DELETE RESTRICT` preserva que la venta sigue mostrando qué service se vendió incluso después de soft-delete del service.
