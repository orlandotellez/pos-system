# 2. Flujo de venta (POS) — ⚠️ Feature más crítica

**Descripción**: El cajero registra una venta con productos regulares y/o services. El sistema valida stock, descuenta productos (de items + de services), persiste todo en una transacción.

**Actores**: Cajero autenticado, Sistema

**Tablas**: `sales`, `sale_items`, `sale_services`, `sale_service_products`, `products`, `inventory_movements`, `users`, `stores`

**Endpoint**: `POST /api/v1/sales`

## Diagrama

```mermaid
sequenceDiagram
    actor C as Cajero
    participant F as POS (Pos.tsx)
    participant B as Backend (Rust)
    participant DB as PostgreSQL (en TX)
    participant P as ProductRepository
    participant SM as SalesService

    C->>F: Selecciona productos + método pago
    C->>F: Confirma venta
    F->>B: POST /api/v1/sales {items, service_items, payment_method}

    B->>SM: sales_service.create(data, store_id, user_id)
    activate SM
    SM->>DB: BEGIN TRANSACTION
    SM->>P: SELECT products para todos los product_ids (regulares + custom + service products)

    Note over SM,DB: Construye validation_map combinando:<br/>  - items regulares<br/>  - service items con productos custom<br/>  - service items sin productos (auto-lookup en service_products)

    loop Por cada producto en validation_map
        SM->>DB: SELECT current stock
        alt stock < quantity
            SM-->>B: InsufficientStock(product_name)
            B-->>F: 422 {message: "Insufficient stock for: X"}
        end
    end

    SM->>DB: INSERT INTO sales (totals, payment_method, user_id, store_id) RETURNING id
    SM->>DB: INSERT INTO sale_items[] (cada item regular con snapshot product_name)
    SM->>DB: INSERT INTO sale_services[] (cada service con snapshot service_name, base_price)
    SM->>DB: INSERT INTO sale_service_products[] (custom + auto-fulfilled)

    Note over SM,DB: ⚠️ Deduplicación crítica:<br/>Si un mismo product_id aparece en items regulares Y dentro de un service_item,<br/>ya está sumado UNA vez en validation_map;<br/>el descuento se aplica una sola vez.

    loop Por cada producto a descontar
        SM->>DB: UPDATE products SET stock = stock - quantity
        SM->>DB: INSERT INTO inventory_movements (movement_type='venta', quantity, batch_id=NULL)
    end

    SM->>DB: COMMIT TRANSACTION

    deactivate SM
    SM-->>B: SaleResponse (con items + service_items completos)
    B-->>F: 201 Created
    F->>C: Muestra ticket + limpia cart + imprime (opcional)
```

## ⚠️ Reglas críticas

### 1. Deduplicación de stock

```
Caso: cliente compra "Combo Familiar" (1 x Pan) + 1 Coca-Cola individual.

Combinado: Pan x 1 + Coca-Cola x 1.

Si NO dedupe: descontar Pan x 1 (service) + Coca x 1 (service) + Coca x 1 (regular) = Coca x 2. ❌ Incorrecto.

Con dedupe (validation_map sumando cantidades por product_id): Coca aparece UNA sola vez en validation_map, descuenta x 2 (suma correcta).
```

### 2. Service items con productos custom

Caso: usuario overridea un combo y dice "este combo, pero con Coca-Cola" en vez de la original.

```json
{
  "service_id": "uuid",
  "service_name": "Combo Familiar",
  "base_price": 95.0,
  "line_total": 95.0,
  "products": [
    { "product_id": "uuid_coca", "quantity": 1, "affects_price": false }
  ]
}
```

El service NO descuenta el producto original (no resuelve `service_products`); descuenta solo el custom.

### 3. Service items sin productos custom (auto)

```
Si service_items[i].products == null <=> fall-back a service_products.
Si service_items[i].products == [] (empty) <=> mismo que null.
```

### 4. Transacción única

Todo dentro de `tx`:

- INSERT `sales`.
- INSERT `sale_items`, `sale_services`, `sale_service_products`.
- UPDATE `products.stock`.
- INSERT `inventory_movements`.

Si cualquier UPDATE de stock falla por concurrencia, ROLLBACK y la venta no se crea.

## Orden de queries (pseudocódigo)

```rust
// 1. SELECT products para todos los product_ids
query_as!(Product, r#"
    SELECT id, name, stock FROM products
    WHERE id = ANY($1) AND store_id = $2 AND deleted_at IS NULL
"#);

// 2. SELECT service_products para service_items sin custom
query_as!(ServiceProduct, r#"
    SELECT sp.*, p.stock FROM service_products sp
    JOIN products p ON sp.product_id = p.id
    WHERE sp.service_id = ANY($1)
"#);

// 3. Construir validation_map
let mut validation: HashMap<Uuid, (String, i32 /*required*/, i32 /*stock*/)> = HashMap::new();
// sumar items regulares
for item in &data.items { validation.entry(product_id).or_insert((name, 0, stock)).1 += quantity; }
// sumar products custom
for sp in custom_products { validation.entry(product_id).or_insert((name, 0, stock)).1 += quantity; }
// sumar auto-resolved service products
for sp in auto_products { validation.entry(product_id).or_insert((name, 0, stock)).1 += quantity; }

// 4. Validar stock
for (_, (name, required, stock)) in &validation {
    if required > stock { return Err(AppError::BadRequest(...)); }
}

// 5. INSERT sale + items + service items + service products
// 6. UPDATE products.stock -= required
// 7. INSERT inventory_movements
// 8. COMMIT
```

## Errores

| Error | Causa |
|---|---|
| `404 Not Found` | Algún `product_id` no existe o está soft-deleted. |
| `422 Insufficient stock` | Stock insuficiente para algún producto. La respuesta es útil para UI: el frontend resalta el producto en el cart. |
| `500` | DB error en tx. ROLLBACK automático. |

## Multi-tenancy

- Toda query: `WHERE store_id = $claims.store_id`.
- El `user_id` (cajero) va en el INSERT de sales.

## Tests sugeridos (críticos)

1. Venta simple: 1 producto, 1 unit. Verificar `sale_items.line_total`, `products.stock` decrementado, `inventory_movements` insertado con `movement_type='venta'`.
2. Venta con stock insuficiente: recibir `422`, verificar que NO se creó la venta.
3. Venta con service: Combo Familiar (2 products via service_products). Verificar descuento dual de stock.
4. Venta mixta: 1 regular + 1 service. Verificar 1 movement por cada producto único.
5. **Concurrencia**: 2 requests simultáneos sobre el mismo product con stock=1. Solo uno gana (con `SELECT FOR UPDATE` o con retry). ⚠️ **Verificar concurrencia**.
