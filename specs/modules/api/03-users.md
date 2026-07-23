# 03 · Users — Gestión de usuarios

> ❌ **Pendiente en Rust** (módulo `features/users/` vacío).
> ✅ Implementado en Fastify como referencia (`backend-fastify/src/modules/users/`).

CRUD de usuarios dentro de una tienda. Solo accesible por `admin`. La tienda es la del usuario autenticado (`claims.store_id`).

## Tabla de endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/users` | Admin | Lista usuarios del store actual. |
| GET | `/users/:id` | Admin | Detalle de un usuario. |
| POST | `/users` | Admin | Crea un usuario (cajero por defecto). |
| PUT | `/users/:id` | Admin | Edita name / email / role / phone. |
| DELETE | `/users/:id` | Admin | Soft-delete. |

---

## GET `/api/v1/users`

- **Auth**: Sí + Admin + StoreGuard.
- **Query params**:
  - `search` (opcional) — busca en `name` / `email`.
  - `page` (default 1), `limit` (default 50, max 100).

### Response 200

```json
{
  "users": [
    {
      "id": "uuid",
      "name": "Cajero Juan",
      "email": "juan@mitienda.com",
      "email_verified": true,
      "role": "cajero",
      "phone": "+52 555 0002",
      "image": null,
      "created_at": "...",
      "updated_at": "..."
    }
  ],
  "total": 4,
  "page": 1,
  "limit": 50,
  "hasMore": false
}
```

---

## GET `/api/v1/users/:id`

- **Auth**: Sí + Admin + StoreGuard.

### Response 200 (shape `IUserResponse`)

```json
{
  "id": "uuid",
  "name": "Cajero Juan",
  "email": "juan@mitienda.com",
  "email_verified": true,
  "role": "cajero",
  "phone": "+52 555 0002",
  "image": null,
  "created_at": "...",
  "updated_at": "..."
}
```

### Errores

- `404` — usuario no existe en esta tienda.

---

## POST `/api/v1/users`

- **Auth**: Sí + Admin + StoreGuard.
- Crear cajero (u otro admin).

### Request body

```json
{
  "name": "Cajero Juan",
  "email": "juan@mitienda.com",
  "password": "password123",
  "role": "cajero",
  "phone": "+52 555 0002"
}
```

### Validaciones (Zod Fastify parity)

| Campo | Reglas |
|---|---|
| `name` | min 2 chars. |
| `email` | RFC válido. UNIQUE en la tienda. |
| `password` | min 8 chars. |
| `role` | enum: `admin`, `cajero`. |
| `phone` | opcional, max 30 chars. |

### Response 201

```json
{ "id": "uuid", "name": "Cajero Juan", "email": "...", "role": "cajero", ... }
```

### Errores comunes

- `400 Validación fallida`.
- `409 Conflict` — email ya registrado en esta tienda.

---

## PUT `/api/v1/users/:id`

- **Auth**: Sí + Admin + StoreGuard.

Body parcial:

```json
{
  "name": "Juan Pérez",
  "email": "juan.perez@mitienda.com",
  "role": "admin",
  "phone": "+52 555 0003"
}
```

### Validaciones

- `email`: si cambia, validar unicidad.
- No permite cambiar `password` via este endpoint — usar `forgot-password` / `reset-password`.

### Errores comunes

- `400`, `404`, `409` (email duplicado).

---

## DELETE `/api/v1/users/:id`

- **Auth**: Sí + Admin + StoreGuard.
- **Soft-delete**: setea `users.deleted_at = now()`.

### Response 200

```json
{ "message": "User deleted successfully" }
```

### Errores

- `404`.
- `400` si intenta borrarse a sí mismo (Fastify no lo bloquea, pero el `auth.guards` lo prohíbe porque el se dejo logueado).

---

## Detalle de implementación

- **Repository**: `SqlxUserRepository::new(state.db.clone())` — reusa `features/auth/infrastructure/sqlx/user_respository.rs` (ya existe para auth; decision: compartir o duplicar).
- **Hashing**: `password.rs::hash_password` (bcrypt).
- **DTOs**: `presentation/dto/{request,response}.rs`.

### `users.controller.ts` ↔ `users.handler.rs`

| Fastify | Rust |
|---|---|
| `request.userId` | `Extension(Claims).user_id` |
| `request.storeId` | `claims.store_id` |
| `verifyToken + bcrypt` | `password::verify` |
| `await prisma.user.findUnique` | `repo.find_by_id(...)` (sqlx) |

---

## Checklist de migración

| Tarea | Estado | Archivo destino |
|---|---|---|
| `domain/entities.rs` (User con photo?, image?) | ❌ | `features/users/domain/entities.rs` |
| `domain/contracts/user_repository.rs` (trait) | ❌ | mover/extender el de auth |
| `application/user_service.rs` | ❌ | list, get, create (hash), update, delete |
| `presentation/dto/{request,response}.rs` | ❌ | con derive(Validate) |
| `presentation/handlers/user_handler.rs` | ❌ | una funcion por endpoint |
| `presentation/routes.rs` | ❌ | Router con `admin_middleware` |
| `infrastructure/sqlx/user_repository.rs` | ❌ | queries |
| Registrarse en `features/mod.rs` + `routes/mod.rs` | ❌ | `nest("/api/v1/users", ...)` |
