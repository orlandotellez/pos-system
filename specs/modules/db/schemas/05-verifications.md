# `verifications`

Códigos de un solo uso para verificación de email y reset de password.

## Esquema

| Columna | Tipo | Constraints | Descripción |
|---|---|---|---|
| `id` | `UUID` | `PK` | — |
| `identifier` | `TEXT` | `NOT NULL` | Email del usuario **o** prefijo (`reset:<email>` para reset). |
| `value` | `TEXT` | `NOT NULL` | Código de 6 caracteres (A-Z + 0-9). |
| `expires_at` | `TIMESTAMPTZ` | `NOT NULL` | Default 15 minutos desde creación. |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT CURRENT_TIMESTAMP` | — |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL` | Trigger. |

## Sin FK explícita a `users`

`identifier` es texto libre (email). Lookup se hace via `users.find_by_email(identifier)`.

## Reglas de uso

### Email verification

```sql
identifier = "user@store.com"
value      = "ABC123"
expires_at = created_at + 15 minutes
```

### Password reset (separación lógica)

```sql
identifier = "reset:user@store.com"
value      = "XYZ987"
expires_at = created_at + 15 minutes
```

> Este namespace (`reset:` prefix) evita colisiones con codigos de verificacion y permite busqueda independiente.

## Flujos

| Operación | Side effects |
|---|---|
| `register` | INSERT verification (ident=email, value=code). |
| `verify-email` | SELECT verification(where identifier=email AND value=code). Si exists & not expired: UPDATE user.email_verified=true; DELETE verification. |
| `resend-verification` | DELETE verification(identifier=email) + INSERT nueva. |
| `forgot-password` | Si user existe, INSERT identification="reset:<email>". |
| `reset-password` | SELECT verification("reset:<email>"). Si existe: UPDATE account.password; DELETE all sessions; DELETE verification. |

## Generación del código

```ts
// core/utils/crypto.utils.ts (Fastify) — portar a Rust helper
function generateVerificationCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
  return code;
}
```

> Equivalente Rust en `shared/helpers/generate.rs`. **Decidir**: incluir vocales? La versión Fastify las excluye (¿para evitar palabras inadvertidas?). Mantener mismo set.

## Cleanup

No hay job de limpieza. Las expiraciones se validan **on-read**. ⚠️ En el futuro: agregar un cron daily que `DELETE FROM verifications WHERE expires_at < now()`.
