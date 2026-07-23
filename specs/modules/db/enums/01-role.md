# `role`

Roles de usuario en el sistema (multi-tenant).

> Definido en SQL (postgres ENUM type) y referenciado por `users.role`.

```sql
CREATE TYPE role AS ENUM ('admin', 'cajero');
```

| Valor | Descripción |
|---|---|
| `admin` | Puede crear otros usuarios, modificar configuracion global, ver/editar productos y ventas. |
| `cajero` | Opera el POS (registra ventas, movimientos de inventario manuales, lee productos). No puede crear usuarios. |

## Tablas que lo usan

- [`users`](../schemas/02-users.md) — columna `role role NOT NULL DEFAULT 'cajero'`.
- [`verification`](../schemas/05-verifications.md) — **NO** lo usa directamente pero la verificacion es al `user.email`.

## Reglas

- Default del column es `cajero`. Solo `register-store` crea un `admin` initial.
- `register` (admin-only) puede crear admins o cajeros.
- `user_controller` permite cambiar role via `PUT /users/:id`.
