# 07 · Inventory — Movimientos individuales

> ❌ **Pendiente en Rust**.
> ✅ Fastify en `backend-fastify/src/modules/inventory/`.

Movimientos individuales de inventario (un producto a la vez). Cada movimiento ajusta automáticamente `products.stock` en la misma transacción lógica.

Tipos: `entrada` (suma stock), `salida` (resta, valida stock suficiente), `ajuste` (set explícito).

## Tabla de endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/inventory` | Sí | Lista movimientos con filtros. |
| GET | `/inventory/product/:id` | Sí | Historial completo de un producto. |
| GET | `/inventory/low-stock` | Sí | Productos bajo umbral. |
| POST | `/inventory` | Sí | Crea un movimiento (ajusta stock). |

---

## GET `/api/v1/inventory`

- **Auth**: Sí + StoreGuard.

### Query params

| Param | Default | Notas |
|---|---|---|
| `product_id` | — | Filtra por producto. |
| `movement_type` | — | `entrada \| salida \| ajuste`. |
| `page` | 1 | — |
| `limit` | 20 | max 100. |

### Response 200

```json
{
  "movements": [
    {
      "id": "uuid",
      "product_id": "uuid",
      "product_name": "Coca-Cola 600ml",
      "movement_type": "entrada",
      "quantity": 50,
      "note": "Reabastecimiento proveedor",
      "user_id": "uuid",
      "created_at": "..."
    }
  ],
  "total": 312,
  "page": 1,
  "limit": 20,
  "hasMore": true
}
```

---

## GET `/api/v1/inventory/product/:productId`

- **Auth**: Sí + StoreGuard.

### Response 200

Shape `{ movements: [...], total: <count>, page: 1, limit: <count> }` con **toda** la historia del producto (no paginado, pero listado completo).

### Errores

- `404` si el producto no existe en esta tienda.

---

## GET `/api/v1/inventory/low-stock`

- **Auth**: Sí + StoreGuard.
- **Descripción**: lista todos los productos donde `stock <= low_stock_threshold` y `active = true`.

### Response 200

```json
[
  {
    "product_id": "uuid",
    "product_name": "Coca-Cola 600ml",
    "current_stock": 5,
    "low_stock_threshold": 10,
    "is_low_stock": true
  }
]
```

---

## POST `/api/v1/inventory`

- **Auth**: Sí + StoreGuard.

### Request body

```json
{
  "product_id": "uuid",
  "movement_type": "entrada",
  "quantity": 50,
  "note": "Reabastecimiento proveedor"
}
```

### Validaciones

| Campo | Reglas |
|---|---|
| `product_id` | existe en tienda actual, no soft-deleted. |
| `movement_type` | enum: `entrada \| salida \| ajuste`. |
| `quantity` | entero positivo. |
| `note` | opcional. |

### Side effects (transaccionales)

1. SELECT product (si no existe → 404).
2. Si `salida`: validar `stock >= quantity`. Si no → 422 `Insufficient stock`.
3. UPDATE `products.stock`:
   - `entrada`: `stock = stock + quantity`.
   - `salida`: `stock = stock - quantity`.
   - `ajuste`: `stock = quantity` (asume que quantity es el valor absoluto nuevo; pero **Fastify store-side** lo trata como delta también — **decisión de port**: fix).
4. INSERT `inventory_movements` (con `user_id` del JWT y `store_id`).

> ⚠️ **Discrepancia Fastify ↔ Rust-a-definir**: el handler Fastify trata `ajuste` como delta positivo. La intención semántica debería ser "set". **Decidir** durante migración y documentar el cambio.

### Errores comunes

- `400`, `404`, `422`.

---

## Multi-tenancy

Todas las queries filtradas por `store_id`.

---

## Implementación

### Repository contract

```rust
pub trait InventoryRepository {
    async fn find_all(&self, store_id: Uuid, params: ListMovementsParams) -> Result<MovementsList, AppError>;
    async fn find_by_product_id(&self, store_id: Uuid, product_id: Uuid) -> Result<Vec<Movement>, AppError>;
    async fn create(&self, store_id: Uuid, user_id: Uuid, data: CreateMovementData) -> Result<Movement, AppError>;
}
```

> También necesita `ProductRepository::update_stock(...)`. Si las features están compartidas, expones el trait desde products.

### Decisión: transacción

- Fastify hace la operación en una transacción Prisma (`prisma.$transaction([update_product, create_movement])`).
- Rust debe replicar con `state.db.begin().await?` + tx + commit.

```rust
let mut tx = state.db.begin().await?;
sqlx::query!("UPDATE products SET stock = $1, updated_at = NOW() WHERE id = $2 AND store_id = $3", new_stock, product_id, store_id)
    .execute(&mut *tx).await?;
sqlx::query_as!(Movement, "INSERT INTO inventory_movements ... RETURNING *", ...)
    .fetch_one(&mut *tx).await?;
tx.commit().await?;
```

---

## Checklist de migración

| Tarea | Archivo destino |
|---|---|
| `features/inventory/domain/entities.rs` | `InventoryMovement`, `CreateMovementData`. |
| `domain/contracts/inventory_repository.rs` | Trait. |
| `application/inventory_service.rs` | create + getByProductId + list + get_low_stock_products. |
| `presentation/dto/{request,response}.rs` | CreateMovementRequest. |
| `presentation/handlers/inventory_handler.rs` | 4 handlers. |
| `infrastructure/sqlx/inventory_repository.rs` | Sqlx con tx. |
| Reutilizar `ProductRepository::update_stock` desde products (mejor trait compartido o duplicar). |
| `nest("/api/v1/inventory", ...)`. |
