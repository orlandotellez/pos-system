# `categories`

Categorías de producto. Lista corta per tienda (~10–30).

## Esquema

| Columna | Tipo | Constraints | Descripción |
|---|---|---|---|
| `id` | `UUID` | `PK` | — |
| `name` | `TEXT` | `NOT NULL` | Nombre (e.g. "Bebidas"). |
| `description` | `TEXT` | NULL | Descripción opcional. |
| `store_id` | `UUID` | `FK → stores.id` `(ON DELETE SET NULL)` | Tienda. |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT CURRENT_TIMESTAMP` | — |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL` | Trigger. |
| `deleted_at` | `TIMESTAMPTZ` | NULL | Soft-delete. |

## Índices

- `UNIQUE(store_id, name)` — no se permiten duplicados dentro de la tienda.
- `INDEX(name)` — open queries.
- `INDEX(deleted_at)` — acelerar filtros `WHERE deleted_at IS NULL`.
- `INDEX(store_id)`.

## Relaciones

| Tabla | Tipo | FK |
|---|---|---|
| `products` | 1:N | `products.category_id → categories.id` `(ON DELETE SET NULL)`. |

## Creación

Hoy **sin endpoint CRUD**. Las categorías se crean via seed o SQL directo. **Decidir** durante port: agregar `POST /categories` (admin-only) o mantener esta decisión.

## Listado público

`GET /categories` (sin auth filter actualmente en Fastify. **Precaución en port — ver [`02-categories.md`](../../api/04-categories.md)**).

## Soft-delete

Categorías con `deleted_at IS NOT NULL` no aparecen en el listado. ⚠️ Productos pre-existentes con `category_id` que apunte a un deleted_at: siguen mostrando el nombre (vía JOIN). Para limpiar: `UPDATE products SET category_id=NULL WHERE category_id=...` antes de soft-delete.
