# `stores`

Tabla de tiendas. **Unidad multi-tenant**. Cada usuario, producto, venta, inventario, settings pertenece a una tienda.

## Esquema

| Columna | Tipo | Constraints | Descripción |
|---|---|---|---|
| `id` | `UUID` | `PK`, `DEFAULT uuid_generate_v4()` (o `gen_random_uuid()` con `pgcrypto`) | Identificador único. |
| `name` | `TEXT` | `NOT NULL`, `UNIQUE` | Nombre del comercio. |
| `address` | `TEXT` | NULL | Dirección física. |
| `phone` | `TEXT` | NULL | Teléfono de contacto. |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT CURRENT_TIMESTAMP` | — |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL` | (gestionado vía trigger o app-level). |

## Índices

- `UNIQUE(stores.name)` — previene 2 tiendas con el mismo nombre.
- `INDEX(stores.name)` — además del UNIQUE para queries case-insensitive (Fastify query SQL).

## Relaciones

| Tabla | Tipo | FK |
|---|---|---|
| `users` | 1:N | `users.store_id → stores.id` |
| `products` | 1:N | `products.store_id → stores.id` |
| `categories` | 1:N | `categories.store_id → stores.id` |
| `suppliers` | 1:N | `suppliers.store_id → stores.id` |
| `services` | 1:N | `services.store_id → stores.id` |
| `sales` | 1:N | `sales.store_id → stores.id` |
| `inventory_movements` | 1:N | `inventory_movements.store_id → stores.id` |
| `inventory_batches` | 1:N | `inventory_batches.store_id → stores.id` |
| `settings` | 1:1 | `settings.store_id → stores.id` (UNIQUE) |

## Notas

- `name` UNIQUE fue decisión de negocio en Fastify. **Decidir** si esto sigue siendo válido para Rust.
- Soft-delete NO soportado. Una tienda no se elimina (preserva historial de FKs). Si se discontinua: contactar soporte.
