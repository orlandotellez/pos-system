# Schemas — POS System

Esquemas de tablas de la base de datos PostgreSQL del POS System.

Cada archivo documenta una tabla con su esquema, columnas, constraints, índices y relaciones.

Las tablas están numeradas por orden de creación (las tablas padre con el número más bajo):

## 1. Multi-tenant (01)

| # | Tabla | Archivo | Descripción |
|---|---|---|---|
| 01 | `stores` | [01-stores.md](./01-stores.md) | Tiendas (cada cliente del POS es un store). |

## 2. Auth (02–05)

| # | Tabla | Archivo | Descripción |
|---|---|---|---|
| 02 | `users` | [02-users.md](./02-users.md) | Usuarios (admin o cajero) dentro de una tienda. |
| 03 | `accounts` | [03-accounts.md](./03-accounts.md) | Cuentas de credenciales (provider=credentials) + password hash. |
| 04 | `sessions` | [04-sessions.md](./04-sessions.md) | Refresh tokens activos (rotación real al refresh). |
| 05 | `verifications` | [05-verifications.md](./05-verifications.md) | Códigos de verificación de email + reset de password. |

## 3. Catálogo (06–10)

| # | Tabla | Archivo | Descripción |
|---|---|---|---|
| 06 | `categories` | [06-categories.md](./06-categories.md) | Categorías de productos. |
| 07 | `suppliers` | [07-suppliers.md](./07-suppliers.md) | Proveedores. |
| 08 | `products` | [08-products.md](./08-products.md) | Productos. |
| 09 | `service_products` | [09-service-products.md](./09-service-products.md) | Join: qué productos componen un `service`. |
| 10 | `services` | [10-services.md](./10-services.md) | Servicios compuestos (combos). |

## 4. Ventas (11–14)

| # | Tabla | Archivo | Descripción |
|---|---|---|---|
| 11 | `sales` | [11-sales.md](./11-sales.md) | Cabecera de ventas (totales, payment). |
| 12 | `sale_items` | [12-sale-items.md](./12-sale-items.md) | Items regulares de la venta. |
| 13 | `sale_services` | [13-sale-services.md](./13-sale-services.md) | Services vendidos dentro de la venta. |
| 14 | `sale_service_products` | [14-sale-service-products.md](./14-sale-service-products.md) | Productos consumidos por los services vendidos. |

## 5. Inventario (15–17)

| # | Tabla | Archivo | Descripción |
|---|---|---|---|
| 15 | `inventory_batches` | [15-inventory-batches.md](./15-inventory-batches.md) | Cabecera de batch inventory (entrada/salida/ajuste masivo). |
| 16 | `inventory_batch_items` | [16-inventory-batch-items.md](./16-inventory-batch-items.md) | Items del batch. |
| 17 | `inventory_movements` | [17-inventory-movements.md](./17-inventory-movements.md) | Cada movimiento individual — UN row por producto modificado. |

## 6. Configuración (18)

| # | Tabla | Archivo | Descripción |
|---|---|---|---|
| 18 | `settings` | [18-settings.md](./18-settings.md) | Configuración del negocio + impresora POS. |

---

> **Vista completa**: [full-schema.md](./full-schema.md) lista todas las tablas en un solo lugar.
> **SQL completo**: [`backend-rust/src/database/migrations/20260629234600_full_schema.sql`](../../../backend-rust/src/database/migrations/20260629234600_full_schema.sql) contiene el DDL completo para PostgreSQL.
