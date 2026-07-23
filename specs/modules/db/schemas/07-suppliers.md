# `suppliers`

Proveedores de una tienda.

## Esquema

| Columna | Tipo | Constraints | Descripción |
|---|---|---|---|
| `id` | `UUID` | `PK` | — |
| `name` | `TEXT` | `NOT NULL` | Nombre comercial. |
| `contact_name` | `TEXT` | NULL | Nombre del contacto primario. |
| `email` | `TEXT` | NULL | Email del contacto. |
| `phone` | `TEXT` | NULL | Teléfono. |
| `address` | `TEXT` | NULL | Dirección. |
| `notes` | `TEXT` | NULL | Notas libres (e.g. "Pago a 30 días"). |
| `is_active` | `BOOLEAN` | `NOT NULL DEFAULT true` | Activo/Inactivo (no se usa para soft-delete). |
| `store_id` | `UUID` | `FK → stores.id` `(ON DELETE SET NULL)` | Tienda. |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT CURRENT_TIMESTAMP` | — |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL` | Trigger. |
| `deleted_at` | `TIMESTAMPTZ` | NULL | Soft-delete. |

## Índices

- `INDEX(name)` — búsquedas case-insensitive.
- `INDEX(is_active)`.
- `INDEX(store_id)`.

## Relaciones

| Tabla | Tipo | FK |
|---|---|---|
| `products` | 1:N | `products.supplier_id → suppliers.id` `(ON DELETE SET NULL)`. |
| `inventory_batches` | 1:N | `inventory_batches.supplier_id → suppliers.id` `(ON DELETE SET NULL)`. |

## Recurso count

`GET /suppliers/:id` devuelve `product_count` (cómo muchos productos vínculos). Calculado via LEFT JOIN con COUNT.
