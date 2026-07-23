# API Conventions

Convenciones REST transversales para todos los endpoints del backend POS (Rust + Axum).

---

## Versionado y base URL

| Item | Valor |
|---|---|
| Prefijo global | `/api/v1` |
| Health check | `GET /health` (fuera de `/api/v1`) |
| Ejemplo base URL dev | `http://localhost:4001/api/v1` |

---

## HTTP Methods

| Method | Uso |
|---|---|
| `GET` | Lectura (idempotente). Sin body. |
| `POST` | Crear o ejecutar acción. Body JSON. |
| `PUT` | Reemplazo parcial de un recurso existente. Body JSON. |
| `DELETE` | Borrado (soft-delete en este proyecto salvo `auth/sessions`). |

---

## Autenticacion

### Soporte dual: cookie o Bearer

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
o
```http
Cookie: accessToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Seteo automatico de cookies (en login / register / refresh / verify-email)

| Cookie | Expira | httpOnly | Secure (prod) | SameSite (prod / dev) |
|---|---|---|---|---|
| `accessToken` | 15 min | sí | sí | `strict` / `lax` |
| `refreshToken` | 7 días | sí | sí | `strict` / `lax` |

`Path=/`. MaxAge en segundos.

### Limpiado (logout)

`Max-Age=0` en ambas cookies + elimina fila en `session` para invalidar el refresh token.

---

## JWT Payload (Fastify parity)

```json
{
  "user_id": "uuid",
  "email": "user@store.com",
  "role": "admin" | "cajero",
  "store_id": "uuid",
  "store_name": "Mi Tienda",
  "exp": 1234567890
}
```

> El access token **incluye** `store_id` y `store_name`. Asi el `store_guard` puede verificar el contexto sin tocar DB. ⚠️ El backend Rust actual NO esta incluyendo estos campos todavía — fix pendiente en `shared/security/jwt.rs`.

---

## Authorization (roles)

| Rol | Acceso |
|---|---|
| sin auth (public) | `register-store`, `login`, `refresh`, `logout`, `verify-email`, `resend-verification`, `forgot-password`, `reset-password`, `GET /categories` |
| autenticado (cualquiera) | resto de endpoints con `require_auth_middleware`. Se exige ademas `store_guard` para datos multi-tenant. |
| solo `admin` | `register` (crear users), CRUD `/users/*`, `PUT /settings`, gestion de proveedores + config global |

Orden de middlewares aplicados:

1. `require_auth_middleware` — extrae user del JWT, setea claims en extensions.
2. `admin_middleware` — si la ruta es solo-admin.
3. `store_guard` — si la ruta toca datos multi-tenant; verifica `claims.store_id`.

---

## Errores

Todos los errores devuelven JSON con la misma shape:

```json
{ "message": "Credenciales invalidas" }
```

### Mapeo `Http status + mensaje`

| Status | Usar para |
|---|---|
| 400 Bad Request | Datos invalidos (validacion, parse). |
| 401 Unauthorized | Sin token / token invalido / cuenta desactivada. |
| 403 Forbidden | Sin permisos (rol incorrecto) / sin store context. |
| 404 Not Found | Recurso no existe. |
| 409 Conflict | Recurso duplicado (email, barcode, store name). |
| 422 Unprocessable Entity | Validacion de negocio (e.g. stock insuficiente). |
| 429 Too Many Requests | Rate-limit excedido. (futuro) |
| 500 Internal Server Error | Bug. Log full stack, devolver mensaje generico al cliente. |

> **Mensajes genericos en flujos sensibles**: `forgot-password` siempre devuelve 202 aunque el email no exista. Asi se evita user-enumeration.

---

## Validación

### Sincrona (request shape)

Definida en DTOs con `validator`:

```rust
#[derive(Debug, Deserialize, Validate)]
pub struct CreateProductRequest {
    #[validate(length(min = 1, message = "Name is required"))]
    pub name: String,
    #[validate(range(min = 0.0))]
    pub price: f64,
    #[validate(email)]
    pub email: String,  // aplica solo a users/auth
}
```

Falla → `AppError::BadRequest` → 400 con `{ "message": "name: Name is required; email: invalid email" }` (join).

### Async / DB (unicidad, FKs)

Validada en el service ANTES de insert/update:

```rust
let existing = repo.find_by_email(email, store_id).await?;
if existing.is_some() {
    return Err(AppError::Conflict("A user with this email already exists".into()));
}
```

Falla → `AppError::Conflict` → 409.

---

## Paginacion

Todos los endpoints `GET` que devuelven listas siguen este shape:

```json
{
  "items": [ /* objetos */ ],
  "total": 137,
  "page": 1,
  "limit": 20,
  "hasMore": true
}
```

| Param | Default | Max |
|---|---|---|
| `page` (1-based) | `1` | — |
| `limit` | `20` (sales/inventory/services: 50) | `100` |

`hasMore = (page * limit) < total`.

Excepciones: `GET /sales/report`, `GET /sales/revenue-trend`, `GET /health`.

---

## Query params comunes (filters)

| Feature | Params |
|---|---|
| products | `search`, `category_id`, `active`, `low_stock`, `out_of_stock`, `page`, `limit` |
| sales | `start_date`, `end_date`, `user_id`, `payment_method`, `page`, `limit` |
| inventory | `product_id`, `movement_type`, `page`, `limit` |
| batch-inventory | `movement_type`, `supplier_id`, `page`, `limit` |
| suppliers | `search`, `is_active`, `page`, `limit` |
| users | `search`, `page`, `limit` |

Fechas en ISO-8601 (`YYYY-MM-DD` o full ISO con timezone).

---

## Multi-tenancy

Cada handler con datos de negocio:

1. Lee `claims.store_id` del JWT (via `Extension<Claims>`).
2. Filtra SIEMPRE todas las queries con `where store_id = $1`.
3. Si por algun motivo el JWT no tiene `store_id`, retorna 403 "Store context required".

> **No confiar** en `request.storeId` enviado por el cliente. Solo el del JWT firmado.

---

## Headers de respuesta standard

| Header | Valor | Quien |
|---|---|---|
| `Content-Type` | `application/json` | Automatico por Axum + serialización. |
| `Set-Cookie` | `accessToken=...; ...` | On login, register, refresh, verify. |
| `Cache-Control` | `no-store` | Endpoints con datos sensibles (sales). |

---

## Decoracion OpenAPI (futuro)

Cuando se integre `utoipa`, cada handler anotara:

```rust
#[utoipa::path(
    get,
    path = "/products",
    tag = "products",
    params(...),
    responses(
        (status = 200, body = ProductListResponse),
        (status = 401, body = ErrorResponse),
    ),
)]
async fn list_products(...) -> ...
```

Hasta que se implemente, los specs en `specs/modules/api/` son la fuente.

---

## Health endpoint (a agregar)

```rust
// routes/mod.rs o routes/health.rs
async fn health() -> Json<serde_json::Value> {
    Json(json!({
        "status": "ok",
        "timestamp": chrono::Utc::now().to_rfc3339(),
    }))
}

pub fn create_routes() -> Router<AppState> {
    Router::new()
        .route("/health", get(health))
        .nest("/api/v1", /* ... */)
}
```

---

## Status code por operacion

| Operación | Éxito |
|---|---|
| Create | 201 Created |
| Read (lista) | 200 OK |
| Read (uno) | 200 OK |
| Update | 200 OK |
| Soft-delete | 200 OK con `{ "message": "..." }` |
| Logout / session revoke | 200 OK |
| Verify email / reset password | 200 OK |
| Resend / forgot | 202 Accepted (async) |

---

## Mensajes de error — convenciones

| Lenguaje | Tono |
|---|---|
| Español | Profesional pero amigable ("Producto no encontrado", "Credenciales invalidas"). |
| Mayusculas | No se usen except para campos tecnicos ("ID", "UUID"). |
| Stack traces | NUNCA al cliente. Solo a logs. |

---

## Logger output

```
2026-07-23T12:34:56Z INFO  HTTP REQUEST method=POST path=/api/v1/auth/login status=200 duration_ms=12 user_id= - session_id= -
```

> El `TraceLayer` actual toma algunos campos automaticos (method, status, duration). El resto se obtendra con `tracing::instrument` en cada handler.

---

## Smoke test rápido (cURL)

```bash
# 1. Health
curl http://localhost:4001/health

# 2. Register store (público)
curl -X POST http://localhost:4001/api/v1/auth/register-store \
  -H 'Content-Type: application/json' \
  -d '{
    "store_name": "Mi Tienda",
    "admin_name": "Carlos",
    "admin_email": "carlos@mitienda.com",
    "admin_password": "MiPassword123"
  }' \
  -c cookies.txt

# 3. Login
curl -X POST http://localhost:4001/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "carlos@mitienda.com",
    "password": "MiPassword123"
  }' \
  -c cookies.txt

# 4. Productos (protegido)
curl http://localhost:4001/api/v1/products -b cookies.txt

# 5. Logout
curl -X POST http://localhost:4001/api/v1/auth/logout \
  -H 'Content-Type: application/json' \
  -b cookies.txt \
  -d '{"refreshToken":"..."}' || \
curl -X POST http://localhost:4001/api/v1/auth/logout -b cookies.txt
```
