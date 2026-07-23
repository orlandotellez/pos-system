# 08 · Batch Inventory — Movimientos masivos

> ❌ **Pendiente en Rust**.
> ✅ Fastify en `backend-fastify/src/modules/batch-inventory/`.

Entradas o salidas de inventario **masivas** agrupadas bajo un mismo `inventory_batch`. Una transacción Prisma:

1. INSERT `inventory_batches`.
2. INSERT n `inventory_batch_items` (1 por producto).
3. INSERT n `inventory_movements` (1 por producto, con `batch_id` link).
4. UPDATE n `products.stock`.

Útil para: registrar compra a proveedor (entrada con muchos SKUs), devolución de mercadería, ajuste por conteo físico.

## Tabla de endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/inventory/batches` | Sí | Lista batches con filtros. |
| GET | `/inventory/batches/:id` | Sí | Detalle batch + items. |
| POST | `/inventory/batches` | Sí | Crea batch + items + movements + actualiza stock (todo en `tx`). |

---

## GET `/api/v1/inventory/batches`

- **Auth**: Sí + StoreGuard.

### Query params

| Param | Default | Notas |
|---|---|---|
| `movement_type` | — | `entrada \| salida \| ajuste`. |
| `supplier_id` | — | Filtra batches con proveedor. |
| `page` | 1 | — |
| `limit` | 50 | max 100. |

### Response 200

```json
{
  "batches": [
    {
      "id": "uuid",
      "movement_type": "entrada",
      "supplier_id": "uuid" | null,
      "supplier_name": "Coca-Cola FEMSA" | null,
      "notes": "Compra factura #1234",
      "user_id": "uuid",
      "user_name": "Carlos",
      "items": [
        { "id": "uuid", "product_id": "uuid", "product_name": "Coca-Cola 600ml", "quantity": 50, "unit_cost": 16.0, "notes": null }
      ],
      "total_items": 3,
      "total_quantity": 150,
      "created_at": "..."
    }
  ],
  "total": 24,
  "page": 1,
  "limit": 50,
  "hasMore": false
}
```

---

## GET `/api/v1/inventory/batches/:id`

- **Auth**: Sí + StoreGuard.

### Response 200

Shape `IBatchResponse` igual al item del array arriba.

### Errores

- `404`.

---

## POST `/api/v1/inventory/batches`

- **Auth**: Sí + StoreGuard.

### Request body

```json
{
  "movement_type": "entrada",
  "supplier_id": "uuid",
  "notes": "Compra factura #1234",
  "items": [
    { "product_id": "uuid", "quantity": 50, "unit_cost": 16.0, "notes": null },
    { "product_id": "uuid", "quantity": 100, "unit_cost": 10.0 }
  ]
}
```

### Validaciones

| Campo | Reglas |
|---|---|
| `movement_type` | enum: `entrada \| salida \| ajuste`. |
| `supplier_id` | opcional. |
| `items` | min 1 item. Cada `product_id` existe y no soft-deleted. |
| `quantity` por item | entero positivo. |
| `unit_cost` por item | opcional, ≥ 0. |

### Reglas de stock (entrada + ajuste no validan, salida sí)

- Si `movement_type === 'salida'`: validar `product.stock >= item.quantity` para cada item. Si falla → 422.
- Si `entrada` o `ajuste`: no validan; simplemente suman / suman.

### Side effects (todo en UNA transacción)

```rust
let mut tx = state.db.begin().await?;

// 1. INSERT inventory_batch
let batch = sqlx::query_as!(InventoryBatch, "INSERT INTO inventory_batches (...) RETURNING *", ...)
    .fetch_one(&mut *tx).await?;

// 2. INSERT inventory_batch_items
for item in &data.items {
    sqlx::query!("INSERT INTO inventory_batch_items (...) ", ...)
        .execute(&mut *tx).await?;
}

// 3. Para cada item: UPDATE products.stock + INSERT inventory_movement
for item in &data.items {
    let delta = match data.movement_type {
        MovementType::Entrada => item.quantity,
        MovementType::Salida => -item.quantity,
        MovementType::Ajuste => item.quantity,  // ⚠️ Fastify: delta, ajustar a set si se decide
    };
    sqlx::query!("UPDATE products SET stock = stock + $1 WHERE id = $2 ", delta, item.product_id)
        .execute(&mut *tx).await?;
    sqlx::query!("INSERT INTO inventory_movements (...) ", ...)
        .execute(&mut *tx).await?;
}

tx.commit().await?;
```

### Errores comunes

- `400 Validación`.
- `404` si un `product_id` o `supplier_id` no existe.
- `422 Insufficient stock` (si salida y stock insuficiente).

---

## Modelo de DB

```sql
inventory_batches (
  id, movement_type TEXT,
  supplier_id UUID NULL FK,
  notes TEXT,
  user_id UUID,
  store_id UUID,
  created_at TIMESTAMPTZ
)

inventory_batch_items (
  id, batch_id UUID FK ON DELETE CASCADE,
  product_id UUID FK,
  quantity INTEGER,
  unit_cost DECIMAL(10,2) NULL,
  notes TEXT NULL,
  created_at TIMESTAMPTZ
)

inventory_movements (
  id, product_id, movement_type, quantity, note, batch_id NULL,
  user_id, store_id,
  created_at TIMESTAMPTZ
)
```

---

## Multi-tenancy

Cada operación atómica verifica `product.store_id = user.store_id`. Si no coincide: 404.

---

## Detalle de implementación

### Service signature

```rust
pub trait BatchInventoryRepository {
    async fn find_by_id(&self, store_id: Uuid, id: Uuid) -> Result<Option<Batch>, AppError>;
    async fn find_all(&self, store_id: Uuid, params: ListBatchesParams) -> Result<BatchesList, AppError>;
}
```

> El `create` **no** está en el repository trait; vive en el **service** directamente porque requiere tx multi-query + cross-feature con `ProductRepository::update_stock`.

### Decisión

- **Fastify service** hace todo en un solo método. Replicar patrón en Rust.
- Cross-feature calls: el batch service llama a `ProductRepository.update_stock` por cada item. Decidir acoplamiento (inyectar ambos repos o exponer uno solo).

---

## Checklist de migración

| Tarea | Archivo destino |
|---|---|
| `features/batch_inventory/domain/entities.rs` | `InventoryBatch`, `InventoryBatchItem`. |
| `domain/contracts/batch_inventory_repository.rs` | Trait (solo read operations). |
| `application/batch_inventory_service.rs` | `create` con tx multi-query. |
| `presentation/dto/{request,response}.rs` | `BatchItemRequest`, `CreateBatchRequest`. |
| `presentation/handlers/batch_inventory_handler.rs` | 3 handlers. |
| `infrastructure/sqlx/batch_inventory_repository.rs` | List / getById con joins a products, suppliers, user. |
| `routes/mod.rs` agregar `nest("/api/v1/inventory/batches", ...)`. |
