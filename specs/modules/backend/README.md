# Backend Module

Documentacion del backend **POS System** — backend principal en Rust (Axum + sqlx + PostgreSQL).

## Contents

1. [01-stack](./01-stack.md) — Stack tecnologico y dependencias
2. [02-architecture](./02-architecture.md) — Estructura por feature, capas, errores
3. [03-api](./03-api.md) — Convenciones REST transversales

## Quick start

```bash
# Desde backend-rust/
cargo run                               # Inicia el server en puerto 4001
cargo run --bin seed                    # Puebla la DB con datos demo (cuando este completo)
sqlx migrate run                       # Aplica migraciones
```

Variables de entorno requeridas (ver `Cargo.toml` y `shared/config/`):

```
DATABASE_URL=postgres://postgres:postgres@localhost:5432/pos_system
JWT_SECRET=<32+ chars>
JWT_REFRESH_SECRET=<32+ chars>
HOST=0.0.0.0
PORT=4001
CORS_ORIGIN=http://localhost:5173,http://localhost:1420  # frontend dev + tauri
```

## Estado actual

Solo `auth` y `stores` (endpoint `/register-store`) estan implementados. El resto de features esta en src/`backend-fastify/` como referencia y se migran siguiendo `00-migration-status.md`.

## Como medir la cobertura

| Feature | Fastify (ref) | Rust (actual) |
|---|---|---|
| auth | ✅ | ✅ |
| stores | ✅ (en auth.routes) | ✅ |
| register-store | ✅ | ✅ |
| users | ✅ | ❌ |
| categories | ✅ | ❌ |
| products | ✅ | ❌ |
| services | ✅ | ❌ |
| sales | ✅ | ❌ |
| inventory | ✅ | ❌ |
| batch-inventory | ✅ | ❌ |
| suppliers | ✅ | ❌ |
| settings | ✅ | ❌ |
