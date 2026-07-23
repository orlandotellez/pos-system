# Database Module

Esquema y configuración de la base de datos PostgreSQL del POS System.

## Estructura

```text
db/
├── README.md                          # Este archivo
├── setup.md                           # Setup local (Docker, sqlx migrate, .env)
├── full-schema.sql                    # DDL completo consolidado (referencia)
├── migrations/                        # Tracking real
│   └── (versionadas por sqlx migrate --source ./src/database/migrations)
│
├── enums/
│   ├── README.md                      # Índice de enums
│   ├── 01-role.md
│   └── 02-unit-type.md
│
├── schemas/
│   ├── README.md                      # Índice de tablas
│   ├── full-schema.md                 # Lista todas las tablas + sus specs (legacy)
│   ├── 01-stores.md
│   ├── 02-users.md
│   ├── 03-accounts.md
│   ├── 04-sessions.md
│   ├── 05-verifications.md
│   ├── 06-categories.md
│   ├── 07-suppliers.md
│   ├── 08-products.md
│   ├── 09-service-products.md
│   ├── 10-services.md
│   ├── 11-sales.md
│   ├── 12-sale-items.md
│   ├── 13-sale-services.md
│   ├── 14-sale-service-products.md
│   ├── 15-inventory-batches.md
│   ├── 16-inventory-batch-items.md
│   ├── 17-inventory-movements.md
│   └── 18-settings.md
│
└── use-cases/
    ├── README.md
    ├── 01-registro-de-tienda.md
    ├── 02-flujo-de-venta.md
    └── 03-movimientos-de-stock.md
```

## Stack

| Componente | Tecnología |
|---|---|
| Motor | PostgreSQL 16 |
| Schema migrado desde | Prisma 6 (`backend-fastify/prisma/schema.prisma`) |
| Migraciones Rust | sqlx migrate + `database/migrations/<timestamp>_*.sql` |
| Migración inicial | `20260629234600_full_schema.sql` (DDL del schema Prisma) |
| ORM (Fastify legacy) | Prisma Client |
| Query (Rust nuevo) | sqlx (`query!` y `query_as!`) |
| Multi-tenancy | `store_id UUID` en cada tabla de negocio + filtro en cada query |
| Decimal money | `DECIMAL(10,2)` — nunca `FLOAT` |
| Soft delete | `deleted_at TIMESTAMPTZ NULL` + filtros |
