# `users`

Usuarios del sistema. Cada usuario pertenece a una tienda. Roles: `admin` o `cajero` (ver enum [`role`](../enums/01-role.md)).

## Esquema

| Columna | Tipo | Constraints | Descripción |
|---|---|---|---|
| `id` | `UUID` | `PK` | — |
| `name` | `TEXT` | `NOT NULL` | Nombre completo. |
| `email` | `TEXT` | `NOT NULL` | Email único dentro de la tienda. |
| `email_verified` | `BOOLEAN` | `NOT NULL DEFAULT false` | Confirmación de email. |
| `phone` | `TEXT` | NULL | Teléfono (opcional). |
| `image` | `TEXT` | NULL | Avatar (futuro, hoy NULL). |
| `role` | `role` | `NOT NULL DEFAULT 'cajero'` | Enum: `admin` / `cajero`. |
| `store_id` | `UUID` | `FK → stores.id` `(ON DELETE SET NULL)` | Tienda a la que pertenece. |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT CURRENT_TIMESTAMP` | — |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL` | Trigger. |
| `deleted_at` | `TIMESTAMPTZ` | NULL | Soft-delete. |

## Índices

- `UNIQUE(store_id, email)` — previene duplicados dentro de la tienda.
- `INDEX(email)` — para login lookup.
- `INDEX(role)`.
- `INDEX(store_id)`.

## Relaciones

| Tabla | Tipo | FK / Referencia |
|---|---|---|
| `accounts` | 1:N | `accounts.user_id → users.id` |
| `sessions` | 1:N | `sessions.user_id → users.id` |
| `sales` | 1:N | `sales.user_id → users.id` |
| `inventory_movements` | 1:N | `inventory_movements.user_id → users.id` |
| `inventory_batches` | 1:N | `inventory_batches.user_id → users.id` |

## Reglas de negocio

- `register-store` (público) crea UN user con `role='admin'` y `email_verified=true`.
- `register` (admin-only) crea user con `role=cajero` o `admin` y `email_verified=false`.
- `login` rechaza si `deleted_at IS NOT NULL`.
- Soft-delete pone `deleted_at=now()`.

## Multi-tenancy

Todos los datos de la tabla `stores` se filtran por la tienda actual. **No** se hace query cross-store (un user no ve users de otra tienda ni siquiera admin→admin).
