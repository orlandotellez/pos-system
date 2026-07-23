# Backend Stack

Stack tecnologico del backend Rust (Axum) del POS System.

## Runtime

- **Rust** — edition 2024
- **Tokio** — async runtime (full features)

## Core

| Crate | Version | Proposito |
|---|---|---|
| `axum` | 0.8 | Framework HTTP. Macros para routing tipado. |
| `axum-extra` | 0.10 | `TypedHeader`, cookies typed. |
| `tower-http` | 0.6 | CORS layer (`CorsLayer`), tracing (`TraceLayer`). |
| `tokio` | 1 | Async runtime. |

## Persistencia

| Crate | Version | Proposito |
|---|---|---|
| `sqlx` | 0.8 | Postgres driver + compile-time query check. Features: `runtime-tokio-rustls`, `postgres`, `chrono`, `uuid`, `migrate`, `macros`. |

> **Decisión**: `sqlx` con `query_as!` evita un ORM; las queries SQL son directas y verificadas en compile-time. Trade-off: hay que escribir SQL a mano, pero se gana paridad 1:1 con Prisma.

## Auth

| Crate | Version | Proposito |
|---|---|---|
| `jsonwebtoken` | 10 | Firmar/verificar JWT (rust_crypto, no OpenSSL). |
| `bcrypt` | 0.15 | Hash de password. |
| `cookie` | 0.18 | Cookies httpOnly. |
| `time` | 0.3 | Tipos para `expires_at`. |

## Serialización / Validación

| Crate | Version | Proposito |
|---|---|---|
| `serde` | 1 | Serialize/deserialize derive. |
| `serde_json` | 1 | JSON. |
| `validator` | 0.19 | Validación derivable por struct (`#[derive(Validate)]`). |
| `uuid` | 1 | UUIDs (v4, v5). |
| `chrono` | 0.4 | Timestamps con serde. |
| `nonce_cell` | 1.19 | Lazy static-like init. |

## Logging / Observabilidad

| Crate | Version | Proposito |
|---|---|---|
| `tracing` | 0.1 | Structured logging. |
| `tracing-subscriber` | 0.3 | Env filter, formatting. |

## Cache (declarado, sin uso)

| Crate | Version | Proposito |
|---|---|---|
| `redis` | 0.27 | Cliente Redis async. |

> ⚠️ Redis está en `Cargo.toml` pero **no se usa actualmente**. Decidir si se implementa cache (e.g. cache de productos frecuentes, dashboard stats) o se elimina del stack.

## Utilidades

| Crate | Version | Proposito |
|---|---|---|
| `dotenvy` | 0.15 | Carga `.env` (fork mantenido de `dotenv`). |
| `home` | 0.5.11 | Path al home del usuario (para `.env` default). |
| `async-trait` | 0.1 | Para `trait` async en versiones estables. |

---

## Patrones clave

| Patron | Implementación |
|---|---|
| **Layer-based architecture** | `features/<feature>/{domain,application,presentation,infrastructure}/`. Cada feature aislada. |
| **Service Layer** (no MediatR) | `application/service.rs` con funciones puras. Devuelve `Result<T, AppError>`. |
| **Repository Pattern** | Trait en `domain/contracts/`, impl SQLx en `infrastructure/sqlx/`. |
| **DTO + Validation** | DTOs separados en `presentation/dto/{request,response}` con `#[derive(Validate)]`. |
| **Middleware-first auth** | `axum::middleware::from_fn` para `require_auth_middleware`, `admin_middleware`, `store_guard`. |
| **Error → Response** | `AppError` implementa `IntoResponse`. Shape JSON: `{ "message": "..." }`. |

---

## Ausencias notadas (vs Fastify)

| Feature | Estado | Acción sugerida |
|---|---|---|
| Rate limiting | ❌ | Agregar `tower-governor` (100/min). |
| OpenAPI / Swagger UI | ❌ | Agregar `utoipa` + `utoipa-swagger-ui` para `/docs`. |
| Helmet-style headers | Parcial (`TraceLayer`) | `tower-http::set_header` para `X-Frame-Options`, `X-Content-Type-Options`. |
| Compression (gzip) | ❌ | `tower-http::compression::CompressionLayer` si hace falta. |
| Health endpoint | ❌ | Crear handler trivial en `routes/mod.rs`. |
| Tests | ❌ | Decidir strategy: `cargo test` + `sqlx_test` o separado. |

---

## Decisiones arquitectonicas clave

1. **Multi-tenant en JWT**: el payload firmado incluye `store_id` y `store_name` (en Fastify ya los incluye).
2. **Refresh token en DB**: cada refresh crea una nueva fila en `session` y revoca la anterior (rotación real, no solo en token).
3. **Errores operacionales**: `AppError` enum con `NotFound | BadRequest | Unauthorized | Forbidden | Conflict | InternalServerError`. Distinguir bugs vs errores esperados via pattern matching.
4. **Transacciones para flujos criticos**: `register_store` y `sales` (pendiente) son las unicas que usan `tx.begin()`.
5. **Sin global state**: todo via `AppState { db: PgPool }` inyectado a handlers como state de Axum.

---

## Build y desarrollo

```bash
# Watch mode (requiere cargo-watch)
cargo watch -x run

# Con debug logs (env RUST_LOG=debug)
RUST_LOG=debug cargo run

# Tests
cargo test

# Linter
cargo clippy

# Format
cargo fmt
```

> El bin principal es `server` (`src/main.rs`). Existe un bin `seed` para tareas de semilla (`src/scripts/seed.rs`) — actualmente incompleto, ver `scripts/seed.ts` del backend-fastify.
