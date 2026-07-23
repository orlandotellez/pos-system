# Backend Architecture

Arquitectura del backend Rust (Axum) — Clean Architecture por feature, no por capa global.

---

## Principios

1. **Feature-folder**: cada caso de uso vive en `features/<feature>/` con sus 4 capas adentro.
2. **Domain en el centro**: las `entities.rs` y `contracts/*.rs` (traits) no conocen sqlx, axum ni chrono serialización.
3. **Inversion de dependencias**: `application` depende de `domain` (trait), `infrastructure` implementa `domain` (trait).
4. **Sin CQRS**: services con funciones, no comandos/queries separados.

---

## Estructura del proyecto

```
backend-rust/
├── Cargo.toml
├── src/
│   ├── main.rs                     # entry point: dotenv, logger, cors, router, listen
│   │
│   ├── database/
│   │   ├── mod.rs
│   │   ├── connection.rs           # create_pool() -> PgPool
│   │   └── migrations/             # sqlx migrate source
│   │       └── 20260629234600_full_schema.sql
│   │
│   ├── routes/
│   │   ├── mod.rs                  # create_routes() -> Router<AppState>
│   │   └── (futuro: routers por feature si hace falta)
│   │
│   ├── features/
│   │   ├── mod.rs                  # pub mod auth; pub mod users; ...
│   │   │
│   │   ├── auth/                   # ✅ IMPLEMENTADO
│   │   │   ├── mod.rs
│   │   │   ├── domain/
│   │   │   │   ├── mod.rs
│   │   │   │   ├── entities.rs     # User, Verification, ...
│   │   │   │   ├── enums/mod.rs    # Role (Admin, Cashier)
│   │   │   │   └── contracts/
│   │   │   │       ├── mod.rs
│   │   │   │       ├── user_repository.rs
│   │   │   │       ├── session_repository.rs
│   │   │   │       ├── verification_repository.rs
│   │   │   │       └── account_repository.rs
│   │   │   ├── application/
│   │   │   │   ├── mod.rs
│   │   │   │   ├── authentication_service.rs
│   │   │   │   └── registration_service.rs
│   │   │   ├── presentation/
│   │   │   │   ├── mod.rs
│   │   │   │   ├── routes.rs       # public_routes + admin + user_routes
│   │   │   │   ├── dto/
│   │   │   │   │   ├── mod.rs
│   │   │   │   │   ├── request.rs
│   │   │   │   │   └── response.rs
│   │   │   │   └── handlers/       # 9 handlers (login, register, refresh, ...)
│   │   │   │       ├── mod.rs
│   │   │   │       └── <handler>.rs
│   │   │   └── infrastructure/
│   │   │       ├── mod.rs
│   │   │       ├── mapper.rs
│   │   │       ├── sqlx/
│   │   │       │   ├── mod.rs
│   │   │       │   ├── user_respository.rs
│   │   │       │   ├── session_repository.rs
│   │   │       │   ├── verification_repository.rs
│   │   │       │   └── account_repository.rs
│   │   │       └── models/
│   │   │           ├── mod.rs
│   │   │           ├── credentials_account.rs
│   │   │           └── session.rs
│   │   │
│   │   ├── stores/                 # ✅ IMPLEMENTADO (anidado bajo auth en routes)
│   │   │   ├── mod.rs
│   │   │   ├── domain/
│   │   │   │   ├── mod.rs
│   │   │   │   ├── entities.rs
│   │   │   │   ├── enums/mod.rs
│   │   │   │   └── contracts/
│   │   │   ├── application/
│   │   │   │   ├── mod.rs
│   │   │   │   └── store_service.rs
│   │   │   ├── presentation/
│   │   │   │   ├── mod.rs
│   │   │   │   ├── routes.rs
│   │   │   │   ├── dto/
│   │   │   │   ├── handlers/
│   │   │   │   │   └── store_handler.rs
│   │   │   └── infrastructure/
│   │   │       ├── sqlx/
│   │   │       ├── models/store.rs
│   │   │       └── mod.rs
│   │   │
│   │   ├── users/                  # ❌ PENDIENTE (estructura a replicar)
│   │   ├── products/               # ❌ PENDIENTE
│   │   ├── categories/             # ❌ PENDIENTE (separar de products en Rust)
│   │   ├── services/               # ❌ PENDIENTE (servicios compuestos; ⚠️ conflicto de naming con `app.service`)
│   │   ├── sales/                  # ❌ PENDIENTE
│   │   ├── inventory/              # ❌ PENDIENTE
│   │   ├── batch_inventory/        # ❌ PENDIENTE (rust naming, vs Fastify `batch-inventory`)
│   │   ├── suppliers/              # ❌ PENDIENTE
│   │   └── settings/               # ❌ PENDIENTE
│   │
│   ├── shared/
│   │   ├── mod.rs
│   │   ├── config/
│   │   │   ├── mod.rs
│   │   │   ├── env.rs              # carga + valida vars (similar a env.ts Fastify)
│   │   │   ├── constants.rs
│   │   │   ├── logger.rs           # tracing_subscriber init
│   │   │   ├── cors.rs             # CorsLayer::default() config
│   │   │   └── shutdown.rs         # graceful shutdown
│   │   ├── security/
│   │   │   ├── mod.rs
│   │   │   ├── jwt.rs              # generate_tokens, verify_access_token
│   │   │   ├── password.rs         # hash, verify (bcrypt)
│   │   │   ├── cookies.rs          # set_auth_cookies, clear_auth_cookies, extract_access_token
│   │   │   └── auth_guard.rs       # require_auth_middleware, admin_middleware
│   │   ├── errors/
│   │   │   ├── mod.rs
│   │   │   └── app_error.rs        # enum AppError + IntoResponse
│   │   ├── validation/
│   │   │   ├── mod.rs
│   │   │   └── validator.rs        # helper ValidationErrors -> String conversion
│   │   ├── helpers/
│   │   │   ├── mod.rs
│   │   │   └── generate.rs         # codigos de verificacion (6 chars)
│   │   └── state/
│   │       ├── mod.rs
│   │       └── app_state.rs        # AppState { db: PgPool }
│   │
│   └── scripts/
│       └── seed.rs                 # CLI para seed (a completar)
│
└── docs/
    ├── estructura.md               # estructura objetivo (en espanol)
    ├── manual-axum.md              # manual paso a paso (a redactar a medida que se migra)
    └── sqlx.md                     # guia sqlx
```

---

## Capas en detalle

### `domain/`

- Cero dependencias externas (excepto `serde`, `uuid`, `chrono`, `sqlx::FromRow` para `entities`).
- Define las **entidades** del dominio (structs con campos exactos del DB).
- Define los **contratos** (traits): `pub trait UserRepository { async fn find_by_id(...) -> Result<Option<User>, AppError>; ... }`.
- Define **enums** de dominio.

### `application/`

- Solo depende de `domain` (traits, entities).
- Services son funciones puras o structs con funciones. Reciben `&AppState` + payload, devuelven `Result<Response, AppError>`.
- Sin dependencia de axum, http o serde_json.
- Coordina repositorios + reglas de negocio (validación, hashing, jwt).

### `presentation/`

- Depende de axum, validator, serde.
- **DTOs** (`request.rs`, `response.rs`): structs con `#[derive(Deserialize, Validate)]` o `#[derive(Serialize)]`.
- **Handlers**: funciones marcadas `async fn`. Reciben `State<AppState>`, `Json<Request>`, `Extension<Claims>`. Devuelven `Result<Json<Response>, AppError>`.
- **Routes**: `pub fn routes() -> Router<AppState>` que define `Router::new().route("/", get(handler)).route("/", post(handler)).route_layer(middleware::from_fn(...))`.

### `infrastructure/`

- Implementa los traits del dominio con queries sqlx reales.
- Define **models** si hace falta separarlos de `domain/entities` (e.g., model con campos opcionales para `FromRow`).
- **mapper.rs**: funciones `entity → response DTO` (manual, sin AutoMapper).
- Solo depende de sqlx.

---

## Dependency flow

```
Routes (presentation)
  → handlers (presentation)
    → services (application)
      → repository trait (domain)
        ← impl SqlxUserRepository (infrastructure)
          → PgPool (shared/state)
```

Inversión: `application::service` solo conoce el trait. `infrastructure::sqlx` implementa el trait concreto.

> Ejemplo en código (parcial):

```rust
// application/user_service.rs
use crate::{
    features::users::domain::{entities::User, contracts::user_repository::UserRepository, ...},
    shared::{errors::app_error::AppError, state::app_state::AppState},
};

pub struct UserService;

impl UserService {
    pub async fn list_users(state: &AppState, params: ListUsersParams) -> Result<Vec<UserResponse>, AppError> {
        let repo = SqlxUserRepository::new(state.db.clone());
        let users = repo.find_all(params.store_id, params.search, ...).await?;
        Ok(users.into_iter().map(UserResponse::from).collect())
    }
}
```

---

## AppError (errores)

```rust
#[derive(Debug)]
pub enum AppError {
    NotFound(String),
    BadRequest(String),
    InternalServerError(String),
    Unauthorized(String),
    Forbidden(String),
    Conflict(String),
}
```

Implementa `IntoResponse` y mapea a JSON:

```json
{ "message": "..." }
```

Conversiones automaticas (`From` impls):

| From | A | Uso |
|---|---|---|
| `sqlx::Error` | `AppError::InternalServerError` | Cualquier query fallida |
| `serde_json::Error` | `AppError::InternalServerError` | (raro) |
| `ValidationErrors` | `AppError::BadRequest` | DTOs con `#[derive(Validate)]` |
| `jsonwebtoken::errors::Error` | `AppError::InternalServerError` | JWT error |

> **⚠️ Inconsistencia actual**: `auth_guard.rs::AppErrorJson` usa `{ "message": "..." }` (bien), pero `AppError` central define `{ "error", "message" }` (mal para Fastify parity). Decidir y unificar — actualmente gana el `auth_guard` por estar mas cerca del handler.

---

## AppState

```rust
// shared/state/app_state.rs
use sqlx::PgPool;

#[derive(Clone)]
pub struct AppState {
    pub db: PgPool,
}
```

- Se inyecta a los handlers via `axum::extract::State<AppState>`.
- Solo contiene el pool de PostgreSQL. No Redis (aun si se agrega).
- Cloneable (PgPool es Arc-interno).

---

## Transaction handling

Para operaciones que tocan multiples tablas (ej. `register-store`, futuro `sales`):

```rust
let mut tx = state.db.begin().await?;
let store = SqlxStoreRepository::create(&mut tx, ...).await?;
let user = SqlxUserRepository::create(&mut tx, ...).await?;
SqlxAccountRepository::create(&mut tx, ...).await?;
tx.commit().await?;
```

> La **transacción** se pasa como `&mut Transaction` (sqlx) al repo, no como `&PgPool`. Esto evita que operaciones intermedias afecten el exterior antes del commit.

---

## Logging

- `tracing` crate. `tracing::info!`, `error!`, etc.
- `tracing-subscriber` con `env-filter` (lee `RUST_LOG`).
- `TraceLayer` en main.rs registra cada request (method, path, status, duracion).
- Para instruments automaticos: `#[tracing::instrument]` en handlers (futuro).

---

## Routing

```rust
// routes/mod.rs
use axum::Router;

use crate::{features, shared::state::app_state::AppState};

pub fn create_routes() -> Router<AppState> {
    Router::new()
        .nest("/api/v1/auth", features::auth::presentation::routes::routes())
        // .nest("/api/v1/users", features::users::presentation::routes::routes())
        // ...
}
```

> **Mover stores**: hoy `register-store` vive dentro de `auth.presentation.routes`. Es debatable si moverla a su propio `nest("/api/v1/stores", ...)` seria mejor. **Decidir** (sigue el spec Fastify = `/auth/register-store`).

---

## Tests (planeado)

- `#[cfg(test)] mod tests` en cada service + repo.
- `sqlx_test` para crear DB efimera por test? (overkill para MVP).
- Mas simple: una sola DB de test (`pos_system_test`), `setup()` con limpieza, integration tests con `axum::Router::oneshot()`.

---

## Convenciones de naming

| Concepto | Convención |
|---|---|
| Feature folder | `snake_case` (`batch_inventory`, `users`, `products`) |
| Rust module | `pub mod <feature>;` |
| Archivo | `snake_case` (`user_service.rs`, `create_user_handler`) |
| Funciones / variables | `snake_case` |
| Tipos / structs / enums | `PascalCase` (`UserResponse`, `AppError`) |
| Prestaciones de Errores | `AppError::NotFound(String)` |
| JWT claims | `snake_case` (`user_id`, `email`, `role`, `store_id`, `store_name`) |
| Query params en handlers | `snake_case` (`store_id`, `page`, `limit`) |
