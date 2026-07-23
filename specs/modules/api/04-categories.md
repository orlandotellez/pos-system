# 04 · Categories — Categorías (público)

> ❌ **Pendiente en Rust** (módulo `features/categories/` no existe como tal; está anidado en `features/products/` en Fastify).
> ✅ Fastify lo expone como `GET /categories` sin auth (público, lectura simple).

Lista de categorías de productos. **No hay CRUD**: las categorías se crean via seed o SQL directo en la migración inicial; el frontend las usa solo para filtros en el formulario de productos.

> ⚠️ **Decisión de scope**: si en el futuro hace falta CRUD (`POST /categories`, etc.), se dividirá el spec. Hoy, mantener simple.

## Tabla de endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/categories` | No | Lista categorías de la tienda del usuario actual. |

---

## GET `/api/v1/categories`

- **Auth**: **No** (público).
- **Descripción**: única ruta. Todas las categorías (sin soft-delete) del store actual.

### Query params

_Ninguno_.

### Response 200

```json
{
  "categories": [
    {
      "id": "uuid",
      "name": "Bebidas",
      "description": "Refrescos, jugos y aguas",
      "created_at": "...",
      "updated_at": "..."
    },
    {
      "id": "uuid",
      "name": "Botanas",
      "description": null
    }
  ],
  "total": 8
}
```

> **No hay paginación**: se esperan pocas categorías por tienda (~20). Si crece mas, se agrega `page`/`limit`.

---

## Errores comunes

- `500` errores internos. Sin 400/403 en este endpoint.

---

## Multi-tenancy

- Sin auth: el endpoint **no** filtra por store. ¿Cómo diferenciamos categorías entre tiendas?
- **Decisión actual (Fastify)**: si bien el endpoint es público, internamente filtra por el `storeId` que viene del **request** (sesión o query). Verificar: ¿el cookie auth entra si está disponible? ¿O se requiere autenticación client-side y se sirve solo por store?

> ⚠️ Chequear `backend-fastify/src/modules/products/presentation/categories.routes.ts`: hoy no hay `preHandler`. **Decisión a tomar** en el port a Rust: o `RequireAuth` light (lee cookies pero sin admin guard) y filtra por store, o público con un query param tenant.

> 🆘 **Cambio recomendado en Rust**: agregar `require_auth_middleware` (no admin) para tener `claims.store_id` y poder filtrar correctamente. Mantener el nombre del endpoint `/categories` e igual semántica.

---

## Detalle de implementación

### `infrastructure/sqlx/category_repository.rs`

```rust
pub async fn find_all(store_id: Uuid) -> Result<Vec<Category>, AppError> {
    sqlx::query_as!(
        Category,
        r#"
        SELECT id, name, description, created_at, updated_at
        FROM categories
        WHERE deleted_at IS NULL AND store_id = $1
        ORDER BY name ASC
        "#,
        store_id
    )
    .fetch_all(&self.pool)
    .await
    .map_err(AppError::from)
}
```

### Handler mínimo

```rust
async fn list_categories(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,  // RequireAuth applied
) -> Result<Json<CategoryListResponse>, AppError> {
    let repo = SqlxCategoryRepository::new(state.db.clone());
    let categories = repo.find_all(claims.store_id).await?;
    Ok(Json(CategoryListResponse {
        categories: categories.into_iter().map(CategoryResponse::from).collect(),
        total: /* size */,
    }))
}
```

---

## Checklist de migración

| Tarea | Estado |
|---|---|
| `features/categories/` con estructura estandar | ❌ |
| `GET /api/v1/categories` con `require_auth_middleware` y filtros por store | ❌ |
| Test multi-store: user A solo ve categorias de su tienda | ❌ |
| Chequear `coupling` con productos (FK products.category_id) | OK — entidad ya existe en DB |
