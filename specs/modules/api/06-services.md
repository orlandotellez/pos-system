# 06 · Services — Servicios compuestos

> ❌ **Pendiente en Rust**.
> ✅ Fastify en `backend-fastify/src/modules/services/`.

CRUD de servicios que combinan varios productos (e.g. "Combo Familiar" = 2 Coca 600ml + 1 Sabritas + 1 Pan). Cada servicio tiene un `base_price` y una lista `products[]` con cantidades.

## ⚠️ Naming consideration en Rust

En Rust el módulo `services` técnicamente puede existir, pero el nombre es ambiguo (puede confundirse con "services de infraestructura" o "service objects"). Opciones:

| Opción | Pro | Contra |
|---|---|---|
| `features/services/` | Mantiene path parity `/api/v1/services`. | Nombre genérico, colisión conceptual. |
| `features/composite_services/` (propuesto inicialmente) | Describe el dominio. | Verboso. |
| **`features/bundles/`** | Claro en dominio POS (product bundle = combo). | Cambia el path `/services` → `/bundles` (decisión de port). |
| `features/kits/` | Corto. | Menos común en español. |
| `features/service_offers/` | Describe que es lo que se ofrece al cliente. | Verboso. |

> 📌 **Recommended**: `bundles` por semántica de dominio + mantener path `/api/v1/services` para Fastify parity (el módulo Rust es interno; solo el URL prefix importa al cliente). **Ajustar decision durante port**.

## Tabla de endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/services` | Sí | Lista paginada con filtros. |
| GET | `/services/:id` | Sí | Detalle (incluye `products[]` con cantidad). |
| POST | `/services` | Sí | Crea servicio + vincula productos. |
| PUT | `/services/:id` | Sí | Actualiza name, precio, products[]. |
| DELETE | `/services/:id` | Sí | Soft-delete. |

---

## GET `/api/v1/services`

- **Auth**: Sí + StoreGuard.

### Query params

| Param | Default | Notas |
|---|---|---|
| `search` | — | Busca en `name`. |
| `active` | — | Filtra `is_active=true/false`. |
| `page` | 1 | — |
| `limit` | 20 | max 100. |

### Response 200

```json
{
  "services": [
    {
      "id": "uuid",
      "name": "Combo Familiar",
      "description": "Coca 600ml x2 + Sabritas x1 + Pan dulce x1",
      "base_price": 95.0,
      "is_active": true,
      "products": [
        { "id": "uuid", "product_id": "uuid", "product_name": "Coca-Cola 600ml", "product_price": 25.0, "quantity": 2 },
        { "id": "uuid", "product_id": "uuid", "product_name": "Sabritas Original", "product_price": 22.0, "quantity": 1 }
      ],
      "created_at": "...",
      "updated_at": "..."
    }
  ],
  "total": 12,
  "page": 1,
  "limit": 20,
  "hasMore": false
}
```

---

## GET `/api/v1/services/:id`

Shape `IServiceResponse` (arriba).

---

## POST `/api/v1/services`

### Request body

```json
{
  "name": "Combo Familiar",
  "description": "...",
  "base_price": 95.0,
  "is_active": true,
  "products": [
    { "product_id": "uuid", "quantity": 2 },
    { "product_id": "uuid", "quantity": 1 }
  ]
}
```

### Validaciones

- `name`: min 1 char.
- `base_price`: positivo.
- `products[]`: cero o más items.
- Cada `product_id`: debe existir en la tienda actual.

### Side effects

- INSERT service.
- INSERT n filas en `service_products` (cascade FK).

### Errores comunes

- `400 Validación`.
- `404` si algun `product_id` no existe en esta tienda.

---

## PUT `/api/v1/services/:id`

Body parcial:

```json
{
  "name": "Combo Familiar Premium",
  "base_price": 110.0,
  "products": [
    { "product_id": "uuid", "quantity": 3 }
  ]
}
```

### Side effects

- UPDATE service.
- Si `products[]` viene: DELETE + INSERT en `service_products`. ⚠️ **Decidir**: eliminar todos los anteriores y volver a setear, o solo actualizar incrementalmente. Fastify hoy hace reemplazo total.

---

## DELETE `/api/v1/services/:id`

- Soft-delete (`deleted_at = now()`).
- Las FK en `service_products` quedan (cascade on delete? ó SET NULL?). **Hoy**: sin cascade, queda la fila hija apuntando a un service eliminado. Decisión: hard-delete children o dejar la FK historical.

### Response 200

```json
{ "message": "Service deleted successfully" }
```

---

## Modelo de DB

```sql
services (
  id BIGINT PK,
  name TEXT NOT NULL,
  description TEXT,
  base_price DECIMAL(10,2),
  is_active BOOLEAN DEFAULT true,
  store_id UUID,
  created_at, updated_at, deleted_at
)

service_products (
  id BIGINT PK,
  service_id UUID FK -> services.id ON DELETE CASCADE,
  product_id UUID FK -> products.id ON DELETE RESTRICT,
  quantity INTEGER DEFAULT 1
)
```

---

## Checklist de migración

| Tarea | Archivo destino |
|---|---|
| `features/composite_services/domain/entities.rs` | Service + ServiceProduct. |
| `domain/contracts/service_repository.rs` | Trait con `find_all_with_products`. |
| `application/service_service.rs` | (Renombrar para evitar confusion: `composite_service_service.rs`?). |
| `presentation/dto/{request,response}.rs` | ServiceProducts embebido. |
| `presentation/handlers/composite_service_handler.rs` | 5 handlers. |
| `infrastructure/sqlx/service_repository.rs` | Join con `service_products` + `products`. |
| Registrar `nest("/api/v1/services", ...)`. | OK — el nombre del path puede seguir siendo `/services`. |
