# Global Instruction — POS System

Reglas transversales que toda IA (o humano) debe respetar al generar, modificar o auditar codigo en este repositorio.

> **Como usar este archivo**: compartido al inicio de cada sesion con la IA. Mantiene un tono consistente y evita sobreingenieria.

---

## Filosofia

1. **Simple > clever**. Si una feature se puede resolver con 30 lineas claras, no uses CQRS, microservicios ni MessageBus.
2. **Capitalizo lo existente**. Antes de crear un modulo nuevo, buscá uno similar. Reutiliza helpers, tipos, contratos.
3. **Clean Architecture por feature, no por carpeta global**. Cada feature tiene su `domain/`, `application/`, `infrastructure/`, `presentation/`. NO hay `services/`, `repositories/`, `controllers/` en raiz.
4. **Migrar 1:1 primero**. Durante la migracion Fastify → Rust, prioriza paridad exacta de comportamiento. Las mejoras llegan despues de validar paridad.

---

## Convenciones backend Rust (`backend-rust/`)

- **Framework**: Axum 0.8 + tower-http + tokio.
- **DB**: sqlx 0.8 + PostgreSQL 16. Queries con `query_as!` siempre que sea posible (compile-time check).
- **Validacion**: `validator` crate (`#[derive(Validate)]` en DTOs).
- **Errores**: devuelvan siempre `Result<T, AppError>`. El handler usa `?`; axum mapea con `IntoResponse`.
- **Formato de error**: `{ "message": "..." }` siempre (consistente con Fastify). NO enviar campos extra al cliente en errores.
- **Auth**: middleware via `axum::middleware::from_fn`. Aplicar en este orden:
  1. `require_auth_middleware` (lee JWT de cookie o Bearer)
  2. `admin_middleware` si la ruta es solo-admin
  3. `store_guard` si la ruta toca datos multi-tenant
  4. handler
- **JWT payload**: `{ user_id, email, role, store_id, store_name, exp }` (incluir `store_id` en el token, NO en cada query).
- **Estructura por feature** (replicar exactamente):
  ```
  features/<feature>/
  ├── domain/
  │   ├── contracts/        # trait XxxRepository
  │   ├── entities.rs       # structs FromRow
  │   ├── enums/            # opcional
  │   └── mod.rs
  ├── application/
  │   ├── service.rs        # logica pura (sin acceso a Axum)
  │   └── mod.rs
  ├── presentation/
  │   ├── dto/              # request/response con derive(Validate) y/o serde
  │   ├── handlers/         # funciones marcadas `async fn`, reciben State + payload
  │   ├── routes.rs         # Router::new() con middleware(fns)
  │   └── mod.rs
  └── infrastructure/
      ├── sqlx/             # impl de XxxRepository con queries
      ├── mapper.rs         # entity → response DTO conversion
      └── mod.rs
  ```
- **Naming**: snake_case en archivos Rust. snake_case en handlers (`create_user_handler`). Plurales solo en carpetas (`features`), no en modulos (`user`, no `users`, salvo que vivas en Routes).
- **Soft-delete**: columnas `deleted_at TIMESTAMPTZ NULL`. Filtrar `where deleted_at IS NULL` en cada `find_*`.

---

## Convenciones backend Fastify (`backend-fastify/`) — congelado

> 👉 Este backend esta **congelado**: no se agregan features nuevas. Solo bugfixes criticos. Toda feature nueva va a Rust.

- **Framework**: Fastify 5 + plugins oficiales (`@fastify/cookie`, `@fastify/cors`, `@fastify/jwt`, `@fastify/swagger`, `@fastify/rate-limit`).
- **DB**: Prisma 6 client.
- **Validacion**: Zod. Exportar `toJsonSchema(zodSchema)` para el OpenAPI.
- **Errores**: `{ "message": "..." }` shape.
- **Modulos** en `src/modules/<name>/{domain,application,presentation,infrastructure}`.
- **DTOs**: `CreateXxxDtoSchema`, `UpdateXxxDtoSchema`, `XxxQuerySchema`. Inferir tipos con `z.infer<typeof XxxDtoSchema>`.

---

## Convenciones frontend (`frontend/`)

- **Stack**: React 18 + Vite + TypeScript estricto.
- **Routing**: React Router 6. Todas las rutas bajo `/<feature>`.
- **Layouts**: un layout principal con sidebar de navegacion. Cada feature vive en `src/pages/<Name>.tsx` + `<Name>.module.css`.
- **Estado global**: usar **Zustand** solo para estado compartido (auth, store, pos cart). Estado local: `useState`/`useReducer`.
- **API**: modulo `src/api/<feature>.ts` con funciones tipadas. **`fetch` centralizado** en `src/api/client.ts`.
- **Errores**: `ApiError` de `client.ts` con `status` + `message`. Mostrar via `Toast` (componente global).
- **Auth**: `AuthContext` expone `{ user, store, login, logout, registerStore, refresh }`. Persistir tokens en cookies (httpOnly, gestionadas por backend).
- **Estilos**: CSS Modules con tokens en `:root` (CSS vars). Tema claro / oscuro via `ThemeContext`.
- **NO** Tailwind. NO styled-components. NO Emotion.
- **Formularios**: react-hook-form cuando hay >3 campos + zod resolver (`@hookform/resolvers/zod`).

---

## Convenciones de DB

- **UUID** para PKs (`@id @default(uuid())` en Prisma / `UUID` en Postgres).
- **Soft-delete**: `deleted_at TIMESTAMPTZ NULL`.
- **Timestamps**: `created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP`, `updated_at TIMESTAMPTZ NOT NULL` (+ trigger `on update`).
- **Decimales**: `DECIMAL(10, 2)` para moneda. NO `float`/`double`.
- **FKs**:
  - `users.store_id → stores.id` `ON DELETE SET NULL`
  - `account.user_id → users.id` `ON DELETE SET NULL`
  - productos `category_id` y `supplier_id` `ON DELETE SET NULL`
  - relaciones de venta/inventario `ON DELETE RESTRICT` (no perder trazabilidad)
- **Indices**: en todas las FKs + campos de busqueda frecuentes (`barcode`, `email`, `name`).
- **Migraciones**: archivos con timestamp `YYYYMMDDHHMMSS_nombre.sql`. NUNCA editar una migracion aplicada; crear una nueva.
- **Multi-tenant**: SIEMPRE filtrar por `store_id` en cada SELECT/UPDATE/DELETE de datos de negocio.

---

## Convenciones API generales

- Versionado: `/api/v1/...`.
- `Content-Type: application/json` salvo indicacion.
- Auth por cookie httpOnly; aceptar tambien `Authorization: Bearer ...` (mismo secret).
- Errores: `4xx` con `{ "message": "..." }`, `5xx` log + `{ "message": "Error interno" }` (no leakear stack).
- Paginacion: `?page=1&limit=20`. Respuesta `{ items: [...], total, page, limit, hasMore }`.
- Fechas: ISO-8601 strings en respuestas (`toISOString()`), `TIMESTAMPTZ` en DB.

---

## Como usar estos specs con IA

1. Antes de pedir un cambio, decile a la IA: *"Leé `specs/descripcion-proyecto.md` y `specs/modules/api/<feature>.md` para entender el contexto."*
2. Para features nuevas en Rust, compartir `specs/modules/backend/02-architecture.md` y el archivo de feature correspondiente.
3. Para cambios de DB, el archivo en `specs/modules/db/schemas/<tabla>.md` es la fuente de verdad; actualizar ambos lados si cambia.
4. Para migrar un feature del Fastify, leer `specs/00-migration-status.md` y abrir el spec de la feature.

---

## NO HACER

- ❌ No usar `unwrap()` ni `expect()` en codigo de produccion; siempre `?` con `AppError`.
- ❌ No escribir migraciones Prisma a mano: usar `prisma migrate dev`.
- ❌ No escribir SQL de schema en Rust a mano; usar `sqlx migrate add`.
- ❌ No devolver `Password` ni `refresh_token` al cliente en responses.
- ❌ No usar `enum` en Fastify/Zod sin documentarlo antes en `specs/modules/db/enums/`.
- ❌ No agregar features que no esten en los specs sin antes actualizar el spec correspondiente.
- ❌ No usar MediatR, ni buses, ni CQRS, ni DDD tactico (Aggregates, Value Objects), salvo que el spec lo indique.
- ❌ No commitear con secretos. `.env` siempre fuera del repo.
