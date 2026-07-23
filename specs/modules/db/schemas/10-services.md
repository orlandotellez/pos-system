# `services`

Servicios compuestos. Un service es un combo que agrupa productos con cantidades fijas (e.g. "Combo Familiar" = 2 Coca 600ml + 1 Sabritas + 1 Pan dulce). Tiene precio propio.

## Esquema

| Columna | Tipo | Constraints | Descripción |
|---|---|---|---|
| `id` | `UUID` | `PK` | — |
| `name` | `TEXT` | `NOT NULL` | Nombre del combo. |
| `description` | `TEXT` | NULL | Descripción opcional. |
| `base_price` | `NUMERIC(10,2)` | `NOT NULL` | Precio de venta del combo. |
| `is_active` | `BOOLEAN` | `NOT NULL DEFAULT true` (mapeado a column `is_active`) | Activo en POS. |
| `store_id` | `UUID` | `FK → stores.id` `(ON DELETE SET NULL)` | Tienda. |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT CURRENT_TIMESTAMP` | — |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL` | Trigger. |
| `deleted_at` | `TIMESTAMPTZ` | NULL | Soft-delete. |

> ⚠️ El field en Prisma se llama `is_active` pero el SQL DDL de Rust lo llama igual `is_active`. Fastify usa el nombre directo.

## Índices

- `INDEX(name)`.
- `INDEX(is_active)`.
- `INDEX(store_id)`.

## Relaciones

- `service_products` 1:N (composición).
- `sale_services` 1:N.

## Naming en Rust

⚠️ `services` colisiona con otros nombres comunes. Recomendado `features/composite_services/`. Ver [API services](../../api/06-services.md).
