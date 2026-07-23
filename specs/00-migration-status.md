# Estado de migración: Fastify → Rust (Axum)

**Fecha de revisión**: 2026-07-23

Resumen ejecutivo de qué hay en `backend-rust` hoy vs todo lo que existe en `backend-fastify` (que estaba completo y operativo). Esta tabla es la **fuente de verdad** para planear los próximos pasos de la migración.

---

## Resumen de un vistazo

| Categoría | Fastify (referencia) | Rust (estado actual) | % |
|---|---|---|---|
| **Features backend** | 11 implementadas | 2 implementadas (auth, stores) | ~18% |
| **Endpoints HTTP** | ~47 | ~12 (todos en auth + /register-store) | ~25% |
| **Modelos de DB** | 17 | 17 (migración `full_schema.sql` ya cubre todo) | 100% |
| **DTOs / handlers** | 11 features | 1 feature completa (auth) + stores | ~18% |
| **CRUD productos/ventas/inventario** | Sí (operativo) | ❌ No | 0% |

> La **DB ya está migrada**: existe la migración `20260629234600_full_schema.sql` con todas las tablas, enums y FKs del schema Prisma original. La columna pendiente está casi exclusivamente en código Rust.

---

## Estado por feature

### ✅ Implementadas en Rust

| Feature | Estado | Archivos Rust | Cobertura |
|---|---|---|---|
| **stores** | Completa | `features/stores/{domain,application,presentation,infrastructure}/` | 100% — endpoint `POST /api/v1/auth/register-store` |
| **auth** | Completa | `features/auth/{domain,application,presentation,infrastructure}/` con 9 handlers (login, register, refresh, logout, verify-email, resend, forgot-password, reset-password, sessions) | 100% |

### ❌ Pendientes (falta implementar en Rust)

| Feature | Endpoints Fastify a replicar | Dificultad | Notas |
|---|---|---|---|
| **users** | 5 (LIST, GET, POST, PUT, DELETE) | Baja | Reutiliza `SqlxUserRepository` que ya existe en auth |
| **categories** | 1 (LIST público) | Baja | Sin auth, super simple |
| **products** | 5 (LIST, GET, barcode, POST, PUT, DELETE) | Media | Mayor: include category+supplier; barcode único; soft-delete |
| **services** | 5 (CRUD completo con products[]) | Media | Anidado: cada service tiene `service_products[]` |
| **sales** | 5 (LIST, GET, POST, /report, /revenue-trend) | **Alta** | Lógica transaccional con stock validation; consumo de servicios y productos; reportes agregados |
| **inventory** | 4 (LIST, /low-stock, /product/:id, POST) | Media | Trigger automático de update de stock |
| **batch-inventory** | 3 (LIST, GET, POST) | Media | Transacción: batch + items + movimientos + update stock en `tx` |
| **suppliers** | 5 (CRUD completo + `_count.products`) | Baja | incluye contador |
| **settings** | 2 (GET, PUT con upsert + config impresora) | Baja | Único: tabla `store_id UNIQUE` |

---

## Comparación de stack

| Concern | Fastify (referencia) | Rust (actual) | Acción |
|---|---|---|---|
| Web framework | Fastify 5 | Axum 0.8 ✅ | Bien |
| DB driver | Prisma 6 + postgres | sqlx 0.8 ✅ | Bien |
| ORM/query | Prisma cliente tipado | sqlx queries manuales + `query_as!` | OK pero requiere escribir SQL a mano |
| Validation | Zod 3 + `zod-to-json-schema` | `validator` crate (derive) | OK — el helper en `shared/validation/validator.rs` ya cubre el caso |
| Auth | `@fastify/jwt` + JWT_SECRET + refresh en cookie | `jsonwebtoken` crate + cookies + middleware custom ✅ | Bien |
| Hashing | `bcrypt` (cost 10) | `bcrypt` crate ✅ | Bien |
| Cookies | `@fastify/cookie` (httpOnly, SameSite) | `cookie` crate + `axum-extra::TypedHeader` ✅ | Bien |
| CORS | `@fastify/cors` | `tower-http::cors::CorsLayer` ✅ | Bien |
| Rate limit | `@fastify/rate-limit` (100/min) | ❌ **Falta** | Hay que agregar `tower-governor` o equivalente |
| Swagger/OpenAPI | `@fastify/swagger` + `@fastify/swagger-ui` en `/docs` | ❌ **Falta** | Recomendable: `utoipa` + `utoipa-swagger-ui` |
| Logging | `pino` + `pino-pretty` | `tracing` + `tracing-subscriber` ✅ | Bien |
| Redis | `ioredis` (cache, lazy connect) | `redis` 0.27 (en Cargo pero **no usado**) | Decidir: implementar cache o quitar |
| Compresión | `@fastify/compress` | ❌ **Falta** | Quizás no prioritario |
| Multipart | `@fastify/multipart` (si hay uploads) | ❌ No aplica | No hay uploads |
| Helmet/headers | `@fastify/helmet` | ❌ **Falta** (`tower-http::set_header` puede cubrir) | Bajo |
| Error format | `{ "message": "..." }` | `AppError → { "error", "message" }` | **Inconsistencia**: el `auth_guard` ya emite `{ "message": "..." }` para parear Fastify. Unificar. |

---

## Observaciones críticas sobre la implementación actual

1. **Inconsistencia en formato de error**: `AppError` usa `{ "error": "conflict", "message": "..." }`, pero `auth_guard::AppErrorJson` usa `{ "message": "..." }` para parear Fastify. **Decidir uno** y propagarlo en todos los handlers.

2. **`/health` falta en Rust**. Fastify lo expone. Agregar `GET /health`.

3. ⚠️ **[NEEDS VERIFICATION] `storeGuard` en Fastify puede no ser funcional**. El archivo `core/guard/store.guard.ts` lee `request.storeId`, pero `auth.guard.ts` solo setea `request.userId` y `request.userRole`. No hay código visible que setee `request.storeId`. Posibles causas: (a) middleware adicional que no leí; (b) Fastify **tiene el mismo bug** que el port Rust debe arreglar; (c) `storeGuard` está siendo llamado pero todas las requests "pasan" trivialmente. **Verificar**: leer el flujo completo antes de portar este middleware.

4. **Tokens en el body de `register-store`**: hoy se devuelven `access_token` + `refresh_token` en el body. **Fastify los manda por cookie httpOnly**. Decidir si se siguen devolviendo en el body, o si se migra a cookies para parear el comportamiento.

5. **No hay refresh token rotation / blacklist** en Rust. Fastify cada refresh **borra la sesión vieja** y crea una nueva (rotación). El comportamiento debe ser idéntico.

6. ⚠️ **[NEEDS VERIFICATION] JWT payload — ¿Fastify incluye `store_id` y `store_name`?** El manual-fastify (`token.utils.ts`) define `interface TokenPayload { userId, email, role }` y `generateTokens(userId, email, role)` con 3 parámetros. Pero `auth.service.ts` lo llama con **5 argumentos** (incluyendo `store.id, store.name`). Hay una contradicción visible entre `manual-fastify.md` y el código actual. **Verificar**: leer `token.utils.ts` actualizado antes de implementar el port. Si Fastify NO firma `store_id`/`store_name`, el `storeGuard` no puede depender del JWT y debe hacer lookup en DB por cada request.

7. **Redis está declarado en Cargo.toml pero no se usa**. Fastify lo usa opcionalmente para cache. Decidir qué hacer.

8. **No existen scripts**: en Fastify hay `scripts/seed.ts` y `scripts/migrate-multi-tenant.ts`. En Rust hay `scripts/seed.rs` pero está sin terminar.

---

## Próximos pasos recomendados (orden sugerido)

1. 🆘 **Unificar formato de error** entre `AppError` y middlewares → todo `{ "message": "..." }`.
2. 🆘 **[NEEDS VERIFICATION primero]** Confirmar si Fastify firma `store_id`/`store_name` (ver punto 6 arriba). Si NO firma: implementar el lookup en DB dentro de `store_guard` (alternativa más segura). Si firma: replicar la firma del JWT en `shared/security/jwt.rs::generate_tokens`.
3. 🆘 **Copiar contrato exacto del `auth.service.ts`** a los handlers Rust (refresh rotation, password reset flow).
4. 🛠️ **Migrar `users`** (más simple — solo CRUD + hashing).
5. 🛠️ **Migrar `categories`** (1 endpoint público, base para productos).
6. 🛠️ **Migrar `products`** (modelo más rico, base de ventas e inventario).
7. 🛠️ **Migrar `suppliers`**, `services`, `settings` en paralelo.
8. 🛠️ **Migrar `inventory` y `batch-inventory`**.
9. ⚠️ **Migrar `sales`** (la más crítica: lógica transaccional + reportes + revenue trend).
10. ⚙️ Agregar `tower-governor` (rate limit) y `utoipa` (OpenAPI) para parear features.
11. ✍️ Completar `scripts/seed.rs` (tomar como base `seed.ts`).

---

## Inventario de archivos necesarios por feature

Para cada feature nueva en Rust, replicar exactamente esta estructura:

```
features/<feature>/
├── domain/
│   ├── enums/
│   │   └── mod.rs              # si aplica
│   ├── contracts/
│   │   ├── <feature>_repository.rs   # trait
│   │   └── mod.rs
│   ├── entities.rs             # structs FromRow
│   └── mod.rs
├── application/
│   ├── <feature>_service.rs    # lógica de negocio
│   └── mod.rs
├── presentation/
│   ├── dto/
│   │   ├── request.rs          # structs con derive(Validate)
│   │   ├── response.rs         # structs de salida
│   │   └── mod.rs
│   ├── handlers/
│   │   ├── <feature>_handler.rs
│   │   └── mod.rs
│   ├── routes.rs               # Router con middleware
│   └── mod.rs
├── infrastructure/
│   ├── sqlx/
│   │   ├── <feature>_repository.rs   # impl SqlxFeatureRepository
│   │   └── mod.rs
│   ├── models/                 # row structs sqlx si hace falta
│   │   └── mod.rs
│   ├── mapper.rs               # entity → response
│   └── mod.rs
└── mod.rs
```

Y registrarla en `features/mod.rs` y en `routes/mod.rs` bajo `/api/v1/<feature>`.

---

## Pendientes transversales

- [ ] Estandarizar `{ "message": "..." }` como shape único de error en TODA la API.
- [ ] Decidir / implementar `store_guard` (multi-tenancy).
- [ ] Decidir / implementar rate limit + OpenAPI.
- [ ] Decidir uso de Redis (cache o remover del Cargo.toml).
- [ ] Crear `health` endpoint en Rust.
- [ ] Validar el orden de middlewares en cada feature: `require_auth → admin_middleware? → store_guard → handler`.
- [ ] Tests: Fastify no tiene tests; Rust debería tenerlos desde el inicio con `cargo test` + sqlx_test.
- [ ] Logs estructurados: hoy `tracing::info!` básico. Para prod, agregar contexto con `tracing::instrument` en cada handler.
