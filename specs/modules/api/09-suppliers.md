# 09 · Suppliers — Proveedores

> ❌ **Pendiente en Rust**.
> ✅ Fastify en `backend-fastify/src/modules/suppliers/`.

CRUD de proveedores. Cada tienda tiene sus propios proveedores. Soft-delete preserva trazabilidad.

## Tabla de endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/suppliers` | Sí | Lista con filtros. |
| GET | `/suppliers/:id` | Sí | Detalle + `product_count` (cuántos productos vinculados). |
| POST | `/suppliers` | Sí | Crea proveedor. |
| PUT | `/suppliers/:id` | Sí | Actualización parcial. |
| DELETE | `/suppliers/:id` | Sí | Soft-delete. |

---

## GET `/api/v1/suppliers`

- **Auth**: Sí + StoreGuard.

### Query params

| Param | Default | Notas |
|---|---|---|
| `search` | — | busca en `name` y `contact_name`. |
| `is_active` | — | bool. |
| `page` | 1 | — |
| `limit` | 20 | max 100. |

### Response 200

```json
{
  "suppliers": [
    {
      "id": "uuid",
      "name": "Coca-Cola FEMSA",
      "contact_name": "Juan Pérez",
      "email": "ventas@coca-femsa.com",
      "phone": "+52 555 0010",
      "address": "Av. Industriales 100",
      "notes": "Pago a 30 días",
      "is_active": true,
      "product_count": 12,
      "created_at": "...",
      "updated_at": "..."
    }
  ],
  "total": 8,
  "page": 1,
  "limit": 20,
  "hasMore": false
}
```

---

## GET `/api/v1/suppliers/:id`

Shape `ISupplierResponse` (arriba) — incluye `product_count`. 404 si no existe.

---

## POST `/api/v1/suppliers`

### Request body

```json
{
  "name": "Coca-Cola FEMSA",
  "contact_name": "Juan Pérez",
  "email": "ventas@coca-femsa.com",
  "phone": "+52 555 0010",
  "address": "Av. Industriales 100",
  "notes": "Pago a 30 días",
  "is_active": true
}
```

### Validaciones

- `name`: required. **No UNIQUE** (pueden existir 2 "Distribuidora X" en la misma tienda).
- resto: opcional.

### Errores comunes

- `400 Validación fallida`.
- ⚠️ Hoy no hay `409` por unicidad.

---

## PUT `/api/v1/suppliers/:id`

Body parcial (cualquier campo). 404 si no existe. No valida duplicados.

---

## DELETE `/api/v1/suppliers/:id`

Soft-delete: `deleted_at = now()`.

### Response 200

```json
{ "message": "Supplier deleted successfully" }
```

> ⚠️ Los productos con `supplier_id` FK **no** se borran; quedan con `supplier_id` apuntando a un supplier soft-deleted (no se rompe la FK, pero el JOIN filtra con `WHERE deleted_at IS NULL` o listados excluyen).

---

## Multi-tenancy

Filtro `WHERE store_id = $1`.

---

## Implementación

```rust
// Repository
pub trait SupplierRepository {
    async fn find_all(&self, store_id: Uuid, params: ListSuppliersParams) -> Result<SuppliersList, AppError>;
    async fn find_by_id(&self, store_id: Uuid, id: Uuid) -> Result<Option<Supplier>, AppError>;
    async fn create(&self, store_id: Uuid, data: CreateSupplierData) -> Result<Supplier, AppError>;
    async fn update(&self, store_id: Uuid, id: Uuid, data: UpdateSupplierData) -> Result<Supplier, AppError>;
    async fn soft_delete(&self, store_id: Uuid, id: Uuid) -> Result<(), AppError>;
}
```

`product_count` se computa con join:

```sql
SELECT s.*, COUNT(p.id) AS product_count
FROM suppliers s
LEFT JOIN products p ON p.supplier_id = s.id AND p.deleted_at IS NULL
WHERE s.deleted_at IS NULL AND s.store_id = $1
GROUP BY s.id
```

---

## Checklist de migración

| Tarea | Archivo destino |
|---|---|
| `features/suppliers/domain/entities.rs` | `Supplier`. |
| `domain/contracts/supplier_repository.rs` | Trait. |
| `application/supplier_service.rs` | list/get/create/update/delete. |
| `presentation/dto/{request,response}.rs` | Shape Fastify parity. |
| `infrastructure/sqlx/supplier_repository.rs` | Con `COUNT(product_count)` via LEFT JOIN. |
| `nest("/api/v1/suppliers", ...)`. |
