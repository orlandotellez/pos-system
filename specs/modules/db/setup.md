# Local Setup — PostgreSQL del POS System

Guía de configuración local de la base de datos del POS, para desarrollo y testing.

> **Stack**: PostgreSQL 16 + sqlx 0.8 + Docker (opcional).

---

## Prerrequisitos

| Herramienta | Versión | Propósito |
|---|---|---|
| PostgreSQL | 16+ | Base de datos. |
| sqlx-cli | 0.8+ | CLI para migraciones Rust. |
| Docker / Docker Compose | 24+ / v2+ | (Opcional) Levantar Postgres en contenedor. |
| psql | 16+ | (Opcional) Consultas manuales. |

---

## 1. Levantar PostgreSQL con Docker

Desde la raíz del monorepo:

```bash
docker compose up postgres -d
# o:
docker compose -f infra/compose.yml up -d postgres

docker compose ps
docker compose logs postgres
```

Variables de entorno mínimas sugeridas:

| Variable | Valor |
|---|---|
| `POSTGRES_USER` | `postgres` |
| `POSTGRES_PASSWORD` | `postgres` |
| `POSTGRES_DB` | `pos_system` |
| Puerto host | `5432` |

`docker-compose.yml` mínimo:

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: pos_system
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d pos_system"]
      interval: 5s
      timeout: 5s
      retries: 5
volumes:
  pgdata:
```

---

## 2. Variables de entorno

Copiar plantilla:

```bash
cp backend-rust/.env.example backend-rust/.env   # si existe; sino crear
```

Editar `backend-rust/.env`:

```env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/pos_system
JWT_SECRET=<generar con: openssl rand -hex 32>
JWT_REFRESH_SECRET=<openssl rand -hex 32>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
HOST=0.0.0.0
PORT=4001
CORS_ORIGIN=http://localhost:5173,http://localhost:1420,http://tauri.localhost
```

---

## 3. Instalar sqlx-cli

```bash
cargo install sqlx-cli --features postgres,rustls
```

---

## 4. Crear DB y aplicar migraciones

Si la DB no existe todavía:

```bash
createdb -U postgres pos_system      # o: docker exec -it postgres createdb ...
```

Aplicar migraciones:

```bash
cd backend-rust
sqlx migrate run                     # pre-requisito: DATABASE_URL
```

> Esta acción ejecuta el archivo `src/database/migrations/20260629234600_full_schema.sql` que crea todas las tablas, enums, índices y FKs del sistema.

Verificar:

```bash
sqlx migrate info
```

> Si sqlx cli no se quiere usar, se puede aplicar el SQL `directo`:

```bash
psql -U postgres -d pos_system -f src/database/migrations/20260629234600_full_schema.sql
```

---

## 5. Conexión desde backend

`shared/config/env.rs` (a crear en port, hoy `env` es leído directo en `main.rs`) carga `DATABASE_URL` y arma el pool sqlx.

```rust
// database/connection.rs (referencia)
use sqlx::{postgres::PgPoolOptions, PgPool};
use std::time::Duration;

pub async fn create_pool() -> Result<PgPool, sqlx::Error> {
    PgPoolOptions::new()
        .max_connections(20)
        .acquire_timeout(Duration::from_secs(5))
        .connect(&std::env::var("DATABASE_URL").unwrap())
        .await
}
```

---

## 6. Verificar conexión

```bash
psql -U postgres -d pos_system -c '\dt'
```

Deberías ver:

```
              List of relations
 Schema |       Name        | Type  |  Owner
--------+-------------------+-------+----------
 public | accounts          | table | postgres
 public | categories        | table | postgres
 public | inventory_batches | table | postgres
 public | ...
```

Enums (`\dT+`):

```
                          List of data types
 Schema |    Name     |                 Description
--------+-------------+---------------------------------------------
 public | role        | admin, cajero
 public | UNIT_TYPE   | unidad, paquete, caja, bolsa, ...
```

---

## 7. Seed data

Pendiente. Hoy `scripts/seed.rs` está vacío. Para poblar a mano:

```bash
# Crear 1 tienda + 1 admin via API
curl -X POST http://localhost:4001/api/v1/auth/register-store \
  -H 'Content-Type: application/json' \
  -d '{
    "store_name": "Mi Tienda Demo",
    "admin_email": "admin@demo.com",
    "admin_password": "DemoPassword123",
    "admin_name": "Admin Demo"
  }'

# Crear categorías sample via SQL directo
psql -U postgres -d pos_system <<EOF
INSERT INTO categories (id, name, store_id)
SELECT gen_random_uuid(), 'Bebidas', id FROM stores WHERE name = 'Mi Tienda Demo';
EOF
```

---

## 8. Comandos útiles

```bash
# Resetear DB completa (cuidado: borra todo)
sqlx database drop -y
sqlx database create
sqlx migrate run

# Ver SQL aplicado (inverso ideompotent)
sqlx migrate revert                # revierte la última migración

# Generar nueva migración (autogenera SQL diff vs DB)
sqlx migrate add -r <nombre_descriptivo>
# edita el archivo generado en src/database/migrations/

# Force compile-time check (sin warnings)
DATABASE_URL=... cargo sqlx prepare --workspace
```

---

## 9. Troubleshooting

### Error: `role "postgres" does not exist`

Postgres corre, pero bajo otro usuario/role. Ajustar `DATABASE_URL`.

### Error: `database "pos_system" does not exist`

Crear antes de aplicar migraciones (`createdb pos_system`).

### Error: `relation "storess" does not exist`

Si la migración aplicada tiene errores, revisar los logs de `cargo run` y reaplicar manualmente el `20260629234600_full_schema.sql`.

### Error: `column "store_id" does not allow null`

Ocurre en tablas **anteriores a la migración multi-tenant**. Hoy la migración ya incluye `store_id NOT NULL` en FKs, pero si conecta a una DB vieja: aplicar `manual/migration_multi_tenant.sql` o recrear.

### sqlx: `query!` falla en compile-time

```bash
DATABASE_URL=postgres://... cargo sqlx prepare
```

Crea `sqlx-data.json` con snapshots para offline compilation.

---

## 10. Backups y restore

```bash
# Backup
pg_dump -U postgres -d pos_system -Fc -f pos.dump

# Restore
pg_restore -U postgres -d pos_system_restored -Fc pos.dump
```

> Son automated dumps en prod via cron. Para dev, `docker volume rm pgdata` y regenerar es suficiente.
