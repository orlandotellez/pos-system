# `sessions`

Sesiones activas del usuario = refresh tokens persistidos en DB. La rotación real significa: cada `refresh` crea nueva fila y borra la anterior.

## Esquema

| Columna | Tipo | Constraints | Descripción |
|---|---|---|---|
| `id` | `UUID` | `PK` | — |
| `expires_at` | `TIMESTAMPTZ` | `NOT NULL` | Cuándo expira (7 días desde creación). |
| `token` | `TEXT` | `NOT NULL` | Refresh token (string JWT-like o hash del JWT). |
| `ip_address` | `TEXT` | NULL | IP cuando se emitió la sesión. |
| `user_agent` | `TEXT` | NULL | UA del navegador/cliente. |
| `user_id` | `UUID` | `FK → users.id` `(ON DELETE RESTRICT)` | Usuario dueño. |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT CURRENT_TIMESTAMP` | — |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL` | Trigger. |

## Índices

- `INDEX(user_id)` — listar sesiones del user (usado en `GET /auth/sessions`).

## Flujo

| Operación | Side effect |
|---|---|
| `login` | INSERT session. |
| `refresh` | DELETE session anterior, INSERT nueva. |
| `logout` | DELETE session actual. |
| `reset-password` | DELETE todas las sessions del user. |
| `revoke-session` (DELETE `/auth/sessions/:id`) | DELETE session específica. |

> ⚠️ **Token storage**: el campo `token` actualmente guarda el refresh token en **cleartext** (Fastify hace `await prisma.session.create({ token: refreshToken })`). Mejor práctica: almacenar `sha256(token)`. ⚠️ **Decisión pendiente** durante port.

## Expiración

- Default: 7 días.
- Validación en cada operación: `expires_at > now()`. Si no, DELETE + 401.

## Hard-delete vs soft-delete

Sesiones son **siempre hard-delete** (no preservamos sesiones canceladas — son contenido sensible).
