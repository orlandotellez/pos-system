# `accounts`

Cuenta de credenciales de un `user`. Contiene el hash de password y metadata de proveedor (futuro OAuth-ready).

## Esquema

| Columna | Tipo | Constraints | Descripción |
|---|---|---|---|
| `id` | `UUID` | `PK` | — |
| `account_id` | `TEXT` | `NOT NULL` | Identificador externo (e.g. user id local). |
| `provider_id` | `TEXT` | `NOT NULL` | Proveedor: `credentials` (hoy) / OAuth futuro. |
| `user_id` | `UUID` | `FK → users.id` `(ON DELETE SET NULL)` | Usuario vinculado. |
| `access_token` | `TEXT` | NULL | (futuro OAuth). |
| `refresh_token` | `TEXT` | NULL | (futuro OAuth). |
| `id_token` | `TEXT` | NULL | (futuro OAuth). |
| `access_token_expires_at` | `TIMESTAMPTZ` | NULL | — |
| `refresh_token_expires_at` | `TIMESTAMPTZ` | NULL | — |
| `scope` | `TEXT` | NULL | — |
| `password` | `TEXT` | NULL | Hash bcrypt (cost 10). |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT CURRENT_TIMESTAMP` | — |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL` | Trigger. |

## Índices

- `INDEX(user_id)` — lookup por user.

## Patrón

Compatible con el patrón de **Better-Auth / Auth.js** (cada proveedor tiene una fila `account`):

| provider_id | descripción |
|---|---|
| `credentials` | Local: login email + password (único soportado hoy). |
| `google` / `github` | (futuro) OAuth. |

## Reglas de negocio

- `register` crea 1 fila `account` con `provider_id='credentials'` y `password=bcrypt(input)`.
- `login` carga `account` por `email` (via JOIN con `users.email`), verifica bcrypt.
- `reset-password` actualiza `account.password` (necesita DELETE de sessions asociado).
- `ON DELETE SET NULL`: si el user se hard-deleted (no usamos esto), accounts sobreviven sin user.

## Hashing

- bcrypt cost 10. Hashes con `$2b$10$...` prefix.
- NUNCA devolver este campo al cliente.
