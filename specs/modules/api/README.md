# API Module

Documentación de la API REST del **POS System** organizada por feature. Cada archivo cubre un dominio funcional con: tabla de endpoints, detalle de cada endpoint (auth, request, response, validaciones, errores).

## Base URL

```
http://localhost:4001/api/v1
```

## Convenciones transversales

- **Auth**: `Sí` requiere cookie `accessToken` válida (15 min) o `Authorization: Bearer <token>`. `No` es público.
- **Content-Type**: `application/json` (no hay uploads).
- **Errores**: shape `{ "message": "..." }`. Ver `backend/03-api.md` para mapeo de status codes.
- **Versionado**: prefijo `/api/v1` obligatorio.
- **Roles**: `[RequireAdmin]` para endpoints solo-admin; `[StoreGuard]` para datos multi-tenant.

## Índice de features

| # | Feature | Descripción |
|---|---|---|
| [01-auth.md](./01-auth.md) | Autenticación | Login, refresh, logout, verificación de email, reset de password, sesiones. |
| [02-stores.md](./02-stores.md) | Multi-tenant | `register-store` + futuro list/update de la tienda (admin only). |
| [03-users.md](./03-users.md) | Usuarios (admin) | CRUD usuarios dentro de la tienda. |
| [04-categories.md](./04-categories.md) | Categorías (público) | Lista de categorías (una sola ruta, sin auth). |
| [05-products.md](./05-products.md) | Productos | CRUD productos, búsqueda por barcode, low-stock. |
| [06-services.md](./06-services.md) | Servicios compuestos | CRUD services con products[] anidados. |
| [07-inventory.md](./07-inventory.md) | Inventario individual | Movimientos entrada/salida/ajuste. |
| [08-batch-inventory.md](./08-batch-inventory.md) | Lotes de inventario | Movimientos masivos (una sola transacción). |
| [09-suppliers.md](./09-suppliers.md) | Proveedores | CRUD proveedores con product_count. |
| [10-sales.md](./10-sales.md) | Ventas (POS) | Venta completa, lista, reporte, revenue trend. |
| [11-settings.md](./11-settings.md) | Settings | Config del negocio + impresora. |

## Multi-tenancy

Todos los endpoints con datos de negocio filtran por `store_id` derivado del JWT. La capa `store_guard` rechaza requests sin ese contexto.

## Formato de errors

| HTTP | Forma |
|---|---|
| 400 | `{ "message": "validation error" }` (Zod / validator) |
| 401 | `{ "message": "Authentication required" }` o "Invalid credentials". |
| 403 | `{ "message": "Admin access required" }` o "Store context required". |
| 404 | `{ "message": "Product not found" }`. |
| 409 | `{ "message": "A product with this barcode already exists" }`. |
| 422 | `{ "message": "Insufficient stock for ..." }`. |
| 500 | `{ "message": "Internal server error" }`. |

## Paginación

```json
{
  "items": [/* ... */],
  "total": 137,
  "page": 1,
  "limit": 20,
  "hasMore": true
}
```

- `page` parte en `1`.
- `limit` default `20` (en sales/inventory/services: `50`).
- `total` siempre poblado.
- `hasMore = (page * limit) < total`.

Excepciones: `GET /sales/report`, `GET /sales/revenue-trend`, `GET /health`.

## Smoke test rápido

```bash
# 1. Health
curl http://localhost:4001/health

# 2. Register-store (público)
curl -X POST http://localhost:4001/api/v1/auth/register-store \
  -H 'Content-Type: application/json' \
  -d '{
    "store_name": "Mi Tienda",
    "admin_name": "Carlos",
    "admin_email": "carlos@mitienda.com",
    "admin_password": "MiPassword123"
  }' -c cookies.txt

# 3. Login
curl -X POST http://localhost:4001/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"carlos@mitienda.com","password":"MiPassword123"}' \
  -c cookies.txt

# 4. Productos
curl http://localhost:4001/api/v1/products?page=1&limit=20 -b cookies.txt

# 5. Logout
curl -X POST http://localhost:4001/api/v1/auth/logout -b cookies.txt
```
