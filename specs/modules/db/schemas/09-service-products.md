# `service_products`

Join table: qué productos componen un `service` (template del combo).

## Esquema

| Columna | Tipo | Constraints | Descripción |
|---|---|---|---|
| `id` | `UUID` | `PK` | — |
| `service_id` | `UUID` | `FK → services.id` `(ON DELETE CASCADE)` | Service al que pertenece. |
| `product_id` | `UUID` | `FK → products.id` `(ON DELETE RESTRICT)` | Producto. |
| `quantity` | `INTEGER` | `NOT NULL DEFAULT 1` | Cuantos productos consume el service. |

## Índices

- `INDEX(service_id)`.
- `INDEX(product_id)`.

## Uso

Cuando se crea una venta con un service_item sin productos custom, el motor:

1. JOIN `service_products` para resolver qué productos faltan.
2. Descuenta stock de esos productos.

> Ver [API sales](../../api/10-sales.md) y [use-case 02](../use-cases/02-flujo-de-venta.md).

## Cascade

`ON DELETE CASCADE` en `service_id`: borrar un service borra sus products asociados. ✅ Tema de auditoría resuelto a nivel schema.

`ON DELETE RESTRICT` en `product_id`: no se puede borrar un product que esté en un combo activo. Forzar el borrado via soft-delete (preserva trazabilidad).
