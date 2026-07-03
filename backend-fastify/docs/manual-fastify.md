# Fastify Manual — Manual Paso a Paso

### Backend en TypeScript con Fastify 5, Prisma 6 y PostgreSQL desde cero

Este manual te guía en la construcción de un backend completo de sistema POS (Punto de Venta): autenticación (registro, login, JWT, verificación de email, recuperación de contraseña, manejo de sesiones), gestión de productos, inventario, ventas, servicios, proveedores, usuarios y configuración del negocio.

Contiene el **100% del código fuente** del proyecto, explicado línea por línea, para que puedas reproducir cada archivo por tu cuenta.

---

## Índice

1. [`package.json` — Dependencias](#1-packagejson--dependencias)
2. [`tsconfig.json` — Configuración TypeScript](#2-tsconfigjson--configuración-typescript)
3. [`tsup.config.ts` — Build](#3-tsupconfigts--build)
4. [`pnpm-workspace.yaml`](#4-pnpm-workspaceyaml)
5. [Estructura de directorios](#5-estructura-de-directorios)
6. [Archivo `.env`](#6-archivo-env)
7. [`src/config/env.ts` — Validación de entorno](#7-srcconfigenvts)
8. [`src/config/prisma.ts` — Cliente Prisma](#8-srcconfigprismats)
9. [`src/config/redis.ts` — Cliente Redis](#9-srcconfigredists)
10. [`src/infrastructure/logger.ts`](#10-srcinfrastructureloggerts)
11. [`src/core/errors/AppError.ts` — Sistema de errores](#11-srccoreerrorsapperrorts)
12. [`src/core/utils/crypto.utils.ts`](#12-srccoreutilscryptoutilsts)
13. [`src/core/utils/token.utils.ts`](#13-srccoreutilstokenutilsts)
14. [`src/core/utils/cookie.utils.ts`](#14-srccoreutilscookieutilsts)
15. [`src/core/utils/auth.utils.ts`](#15-srccoreutilsauthutilsts)
16. [`src/core/guard/auth.guard.ts`](#16-srccoreguardsauthguardts)
17. [`src/types/auth.d.ts`](#17-srctypesauthdts)
18. [`src/app.ts` — Fábrica de la aplicación](#18-srcappts)
19. [`src/server.ts` — Punto de entrada](#19-srcserverts)
20. [`src/presentation/routes.ts`](#20-srcpresentationroutests)
21. [`src/presentation/swagger-schema.ts`](#21-srcpresentationswagger-schemats)
22. [Schema Prisma](#22-schema-prisma)
23. [Módulo `auth`](#23-módulo-auth)
24. [Módulo `users`](#24-módulo-users)
25. [Módulo `products`](#25-módulo-products)
26. [Módulo `services`](#26-módulo-services)
27. [Módulo `sales`](#27-módulo-sales)
28. [Módulo `inventory`](#28-módulo-inventory)
29. [Módulo `batch-inventory`](#29-módulo-batch-inventory)
30. [Módulo `suppliers`](#30-módulo-suppliers)
31. [Módulo `settings`](#31-módulo-settings)
32. [`src/scripts/seed.ts` — Seed](#32-srcscriptsseedts)

---

## 1. `package.json` — Dependencias

```json
{
  "name": "pos-system-backend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "prisma generate && tsup",
    "start": "tsx src/server.ts",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:studio": "prisma studio",
    "migrate:deploy": "prisma migrate deploy",
    "seed": "tsx src/scripts/seed.ts"
  },
  "dependencies": {
    "@fastify/compress": "^8.0.0",
    "@fastify/cookie": "^11.0.0",
    "@fastify/cors": "^10.0.0",
    "@fastify/helmet": "^12.0.0",
    "@fastify/jwt": "^9.0.0",
    "@fastify/rate-limit": "^10.0.0",
    "@fastify/swagger": "^9.7.0",
    "@fastify/swagger-ui": "^6.0.0",
    "@prisma/client": "^6.0.0",
    "bcrypt": "^5.1.0",
    "dotenv": "^16.4.0",
    "fastify": "^5.0.0",
    "ioredis": "^5.4.0",
    "jsonwebtoken": "^9.0.0",
    "pino": "^9.0.0",
    "zod": "^3.23.0",
    "zod-to-json-schema": "^3.25.2"
  },
  "devDependencies": {
    "@types/bcrypt": "^5.0.0",
    "@types/jsonwebtoken": "^9.0.0",
    "@types/node": "^22.0.0",
    "pino-pretty": "^11.0.0",
    "prisma": "^6.0.0",
    "tsup": "^8.0.0",
    "tsx": "^4.0.0",
    "typescript": "^5.5.0"
  }
}
```

**`"type": "module"`** — Habilita ES modules nativos (`import`/`export` en lugar de `require`).

**Scripts:**
- `"dev": "tsx watch src/server.ts"` — Inicia servidor con recarga automática. `tsx` ejecuta TypeScript directamente. `watch` reinicia al detectar cambios.
- `"build": "prisma generate && tsup"` — Primero genera el cliente Prisma, luego empaqueta con tsup.
- `"start": "tsx src/server.ts"` — Inicia en producción (sin watch).
- `"seed": "tsx src/scripts/seed.ts"` — Puebla la BD con datos de prueba.

**Dependencias principales:**
- `fastify` ^5.0.0 — Framework web rápido para Node.js.
- `@fastify/compress` — Compresión HTTP (gzip/brotli).
- `@fastify/cookie` — Manejo de cookies.
- `@fastify/cors` — CORS.
- `@fastify/helmet` — Seguridad (headers HTTP).
- `@fastify/rate-limit` — Rate limiting.
- `@fastify/swagger` / `@fastify/swagger-ui` — Documentación OpenAPI.
- `@prisma/client` — ORM Prisma.
- `bcrypt` — Hashing de contraseñas.
- `dotenv` — Variables de entorno.
- `ioredis` — Cliente Redis.
- `jsonwebtoken` — JWT (firmar y verificar).
- `pino` — Logger rápido.
- `zod` — Validación de schemas.
- `zod-to-json-schema` — Zod → JSON Schema para Swagger.

**DevDependencies:**
- `@types/bcrypt`, `@types/jsonwebtoken`, `@types/node` — Tipos TypeScript.
- `pino-pretty` — Formato legible para logs en desarrollo.
- `prisma` — CLI de Prisma (migraciones, generate, studio).
- `tsup` — Bundler basado en esbuild.
- `tsx` — Ejecutor TypeScript.
- `typescript` — Compilador TS.

---

## 2. `tsconfig.json` — Configuración TypeScript

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ESNext"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**`target: "ESNext"`** — Compila a la última versión de ECMAScript. Node.js 20+ soporta ESNext.

**`module: "ESNext"`** — Usa módulos ES nativos. Combinado con `"type": "module"` en package.json.

**`moduleResolution: "bundler"`** — Resolución de módulos estilo bundler (esbuild, webpack). Permite imports sin extensión `.js`.

**`strict: true`** — Activa todas las verificaciones estrictas: `noImplicitAny`, `strictNullChecks`, `strictFunctionTypes`, etc.

**`paths: { "@/*": ["./src/*"] }`** — Alias de import. `import { env } from "@/config/env"` resuelve a `./src/config/env`.

**`declaration: true`** — Genera archivos `.d.ts`.

**`sourceMap: true`** — Source maps para debugging.

---

## 3. `tsup.config.ts` — Build

```typescript
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/server.ts"],
  outDir: "dist",
  clean: true,
  format: "esm",
  sourcemap: true,
  cjsInterop: true,
  esbuildOptions(options) {
    options.alias = {
      "@": "./src",
    };
  },
});
```

**`entry: ["src/server.ts"]`** — Archivo de entrada del bundle.

**`format: "esm"`** — Genera ES module.

**`cjsInterop: true`** — Permite importar módulos CommonJS (bcrypt, jsonwebtoken) desde ES modules.

**`esbuildOptions.alias`** — Configura el alias `@/` para que funcione en el bundle final.

---

## 4. `pnpm-workspace.yaml`

```yaml
packages:
  - "."

onlyBuiltDependencies:
  - "@prisma/client"
  - "@prisma/engines"
  - bcrypt
  - esbuild
  - prisma
```

Solo permite que esas dependencias ejecuten scripts de postinstalación (build nativo). Medida de seguridad de pnpm.

---

## 5. Estructura de directorios

```
backend-fastify/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── src/
│   ├── app.ts
│   ├── server.ts
│   ├── types/
│   │   └── auth.d.ts
│   ├── config/
│   │   ├── env.ts
│   │   ├── prisma.ts
│   │   └── redis.ts
│   ├── infrastructure/
│   │   └── logger.ts
│   ├── core/
│   │   ├── errors/
│   │   │   └── AppError.ts
│   │   ├── guard/
│   │   │   └── auth.guard.ts
│   │   └── utils/
│   │       ├── auth.utils.ts
│   │       ├── cookie.utils.ts
│   │       ├── crypto.utils.ts
│   │       └── token.utils.ts
│   ├── presentation/
│   │   ├── routes.ts
│   │   └── swagger-schema.ts
│   ├── scripts/
│   │   └── seed.ts
│   └── modules/
│       ├── auth/
│       │   ├── domain/ (auth.interface, auth.entities, auth.types)
│       │   ├── application/ (auth.service.ts)
│       │   ├── presentation/ (auth.controller, auth.routes, auth.dto)
│       │   └── infrastructure/ (auth.prisma.repository, mappers/)
│       ├── users/
│       │   ├── domain/ (users.interface, users.entities, users.types)
│       │   ├── application/ (users.service.ts)
│       │   ├── presentation/ (users.controller, users.routes, users.dto)
│       │   └── infrastructure/ (users.prisma.repository.ts)
│       ├── products/
│       │   ├── domain/ (products.interface, products.entities, products.types)
│       │   ├── application/ (products.service.ts)
│       │   ├── presentation/ (products.controller, products.routes, products.dto, categories.controller, categories.routes)
│       │   └── infrastructure/ (products.prisma.repository.ts)
│       ├── sales/
│       │   ├── domain/ (sales.interface, sales.entities, sales.types)
│       │   ├── application/ (sales.service.ts)
│       │   ├── presentation/ (sales.controller, sales.routes, sales.dto)
│       │   └── infrastructure/ (sales.prisma.repository, mappers/)
│       ├── services/
│       │   ├── domain/ (services.interface, services.entities, services.types)
│       │   ├── application/ (services.service.ts)
│       │   ├── presentation/ (services.controller, services.routes, services.dto)
│       │   └── infrastructure/ (services.prisma.repository.ts)
│       ├── inventory/
│       │   ├── domain/ (inventory.interface, inventory.entities, inventory.types)
│       │   ├── application/ (inventory.service.ts)
│       │   ├── presentation/ (inventory.controller, inventory.routes, inventory.dto)
│       │   └── infrastructure/ (inventory.prisma.repository.ts)
│       ├── batch-inventory/
│       │   ├── domain/ (batch-inventory.interface, batch-inventory.entities, batch-inventory.types)
│       │   ├── application/ (batch-inventory.service.ts)
│       │   ├── presentation/ (batch-inventory.controller, batch-inventory.routes, batch-inventory.dto)
│       │   └── infrastructure/ (batch-inventory.prisma.repository.ts)
│       ├── suppliers/
│       │   ├── domain/ (suppliers.interface, suppliers.entities, suppliers.types)
│       │   ├── application/ (suppliers.service.ts)
│       │   ├── presentation/ (suppliers.controller, suppliers.routes, suppliers.dto)
│       │   └── infrastructure/ (suppliers.prisma.repository.ts)
│       └── settings/
│           ├── domain/ (settings.interface, settings.entities, settings.types)
│           ├── application/ (settings.service.ts)
│           ├── presentation/ (settings.controller, settings.routes, settings.dto)
│           └── infrastructure/ (settings.prisma.repository.ts)
```

Cada feature (auth, users, products, etc.) es un módulo independiente con 4 capas:
- **domain/**: Interfaces del repositorio, entidades, tipos de respuesta. NO sabe de HTTP ni Prisma.
- **application/**: Servicios con lógica de negocio. Usa las interfaces del dominio.
- **presentation/**: Handlers HTTP (Fastify), DTOs (Zod), rutas.
- **infrastructure/**: Implementaciones Prisma de los repositorios, mappers.

---

## 6. Archivo `.env`

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/mi_negocio?schema=public
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_URL=redis://localhost:6379
JWT_SECRET=min-clave-secreta-super-segura-de-al-menos-32-caracteres
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=min-clave-refresh-super-segura-de-al-menos-32-caracteres
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173,http://localhost:1420
NODE_ENV=development
HOST=0.0.0.0
PORT=3000
```

---

## 7. `src/config/env.ts`

```typescript
import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default("0.0.0.0"),
  DATABASE_URL: z.string(),
  REDIS_HOST: z.string().default("127.0.0.1"),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error("Invalid environment variables", _env.error.format());
  process.exit(1);
}

export const env = _env.data;
```

**Línea 1-2:** Importa Zod (validación de schemas) y dotenv (carga .env).

**Línea 4:** `dotenv.config()` — Carga las variables del archivo `.env` en `process.env`.

**Línea 6-18:** `envSchema` — Schema Zod que define y valida todas las variables de entorno:
- `z.enum(["development", "production", "test"])` — Solo permite esos 3 valores.
- `z.coerce.number()` — Convierte strings a números (ej: `"3000"` → `3000`).
- `z.string().min(32)` — Requiere mínimo 32 caracteres para las claves JWT.
- `.default("development")` — Valores por defecto si no están definidos.

**Línea 20:** `envSchema.safeParse(process.env)` — Valida `process.env` contra el schema. `safeParse` no lanza excepción, devuelve `{ success, data, error }`.

**Línea 22-24:** Si la validación falla, imprime el error y termina el proceso con código 1 (fast fail).

**Línea 26:** `export const env = _env.data` — Exporta el objeto tipado. En toda la app se usa `env.PORT`, `env.JWT_SECRET`, etc., con tipos inferidos.

---

## 8. `src/config/prisma.ts`

```typescript
import { PrismaClient } from '@prisma/client';
import { env } from './env.js';

export const prisma = new PrismaClient({
  log: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasourceUrl: env.DATABASE_URL,
});
```

**Línea 1:** Importa `PrismaClient` del paquete generado por Prisma.

**Línea 2:** Importa `env` para acceder a las variables de entorno validadas.

**Línea 4-7:** Crea una instancia singleton de `PrismaClient`:
- `log`: En desarrollo, registra todas las queries SQL, errores y warnings. En producción, solo errores.
- `datasourceUrl`: URL de conexión a PostgreSQL. Sobrescribe la variable de entorno del schema Prisma.

Al exportar `prisma` una vez, toda la app comparte la misma instancia con su pool de conexiones.

---

## 9. `src/config/redis.ts`

```typescript
import Redis from "ioredis"
import { env } from "./env"

let redisClient: Redis | null = null

export const getRedisClient = () => {
  if (redisClient) return redisClient

  try {
    redisClient = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      connectionName: "pos-system",
      retryStrategy: (times) => {
        if (times > 5) {
          console.error("Redis max retries reached")
          return null
        }
        return Math.min(times * 200, 2000)
      },
    })

    redisClient.connect().then(() => {
      console.log("Redis connected successfully")
    }).catch((error) => {
      console.error("Redis connection failed:", error)
    })

    let hasLoggedRedisError = false

    redisClient.on("ready", () => {
      hasLoggedRedisError = false
      console.log("Redis ready")
    })

    redisClient.on("error", (error) => {
      if (!hasLoggedRedisError) {
        console.error("Redis connection error:", error)
        hasLoggedRedisError = true
      }
    })

    redisClient.on("reconnecting", () => {
      console.warn("Redis reconnecting...")
    })

    redisClient.on("close", () => {
      console.warn("Redis connection closed")
    })

    return redisClient
  } catch (error) {
    console.error("Redis unavailable, continuing without cache")
    return null
  }
}

export const closeRedis = async () => {
  if (redisClient) {
    await redisClient.quit()
    console.log("Redis disconnected")
  }
}

export const redis = getRedisClient()
```

**Línea 1-2:** Importa `Redis` de `ioredis` (cliente Redis con soporte async/await) y `env`.

**Línea 4:** `let redisClient: Redis | null = null` — Variable para mantener la instancia singleton.

**Línea 6-44:** `getRedisClient()` — Función que crea o devuelve el cliente Redis:
- **Línea 7:** Si ya existe, lo devuelve (singleton).
- **Línea 9-39:** Intenta crear el cliente Redis dentro de un try-catch.
- **Línea 10-17:** `new Redis(env.REDIS_URL, { ... })` — Configura:
  - `maxRetriesPerRequest: 3` — Reintenta 3 veces por operación.
  - `lazyConnect: true` — No conecta automáticamente, usamos `.connect()` manual.
  - `connectionName: "pos-system"` — Nombre visible en Redis.
  - `retryStrategy`: Reintenta conexión con backoff exponencial (200ms, 400ms, 800ms...). Después de 5 intentos, devuelve `null` (detiene reintentos).
- **Línea 19-22:** `redisClient.connect()` — Conecta al servidor Redis.
- **Línea 24:** `hasLoggedRedisError` — Flag para evitar spam de logs de error.
- **Línea 26-35:** Eventos de Redis:
  - `ready`: Conexión establecida.
  - `error`: Solo muestra el primer error (evita spam).
  - `reconnecting`: Redis reconectando.
  - `close`: Conexión cerrada.
- **Línea 37:** `return redisClient`.
- **Línea 40-42:** catch — Si Redis no está disponible, loggea el error y devuelve `null` (la app funciona sin Redis).

**Línea 47-51:** `closeRedis()` — Cierra la conexión Redis gracefulmente.

**Línea 53:** `export const redis = getRedisClient()` — Exporta la instancia para uso directo.

---

## 10. `src/infrastructure/logger.ts`

```typescript
import pino from "pino";

export const logger = pino({
  transport: process.env.NODE_ENV === "development" ? {
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "SYS:standard",
      ignore: "pid,hostname",
    },
  } : undefined,
});
```

**Línea 1:** Importa `pino`, el logger rápido para Node.js.

**Línea 3-10:** Crea el logger:
- En desarrollo (`NODE_ENV === "development"`), usa `pino-pretty` como transport para logs con colores.
- `colorize: true` — Colores en terminal.
- `translateTime: "SYS:standard"` — Fechas legibles.
- `ignore: "pid,hostname"` — Oculta PID y hostname.
- En producción, no hay transport (logs en JSON plano para ingestion).

Nota: Aunque se exporta `logger`, la app principal usa el logger nativo de Fastify (`app.log`).

---

## 11. `src/core/errors/AppError.ts`

```typescript
export class AppError extends Error {
  public readonly statusCode: number
  public readonly code: string
  public readonly isOperational: boolean

  constructor(message: string, statusCode: number, code: string) {
    super(message)
    this.statusCode = statusCode
    this.code = code
    this.isOperational = true

    Object.setPrototypeOf(this, new.target.prototype)
    Error.captureStackTrace(this)
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad Request') {
    super(message, 400, 'BAD_REQUEST')
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED')
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403, 'FORBIDDEN')
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Not Found') {
    super(message, 404, 'NOT_FOUND')
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict') {
    super(message, 409, 'CONFLICT')
  }
}

export class UnprocessableEntityError extends AppError {
  constructor(message = 'Unprocessable Entity') {
    super(message, 422, 'UNPROCESSABLE_ENTITY')
  }
}

export class InternalServerError extends AppError {
  constructor(message = 'Internal Server Error') {
    super(message, 500, 'INTERNAL_SERVER_ERROR')
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message = 'Too Many Requests') {
    super(message, 429, 'TOO_MANY_REQUESTS')
  }
}
```

**`AppError` (línea 1-16):** Clase base de errores. Extiende `Error` nativo:
- `statusCode: number` — Código HTTP (400, 401, 404, 500...).
- `code: string` — Código legible (`BAD_REQUEST`, `NOT_FOUND`...).
- `isOperational: boolean` — Distingue errores esperados de bugs.
- `Object.setPrototypeOf(this, new.target.prototype)` — Fija la cadena de prototipos correctamente al extender `Error`.
- `Error.captureStackTrace(this)` — Captura el stack trace.

**Clases hijas (línea 18-73):** Cada una representa un código HTTP:
- `BadRequestError` → 400 (datos inválidos). Constructor con mensaje por defecto `'Bad Request'`.
- `UnauthorizedError` → 401 (no autenticado). Mensaje: `'Unauthorized'`.
- `ForbiddenError` → 403 (sin permisos). Mensaje: `'Forbidden'`.
- `NotFoundError` → 404 (no encontrado). Mensaje: `'Not Found'`.
- `ConflictError` → 409 (conflicto, ej: email duplicado). Mensaje: `'Conflict'`.
- `UnprocessableEntityError` → 422 (error de validación). Mensaje: `'Unprocessable Entity'`.
- `InternalServerError` → 500 (error interno). Mensaje: `'Internal Server Error'`.
- `TooManyRequestsError` → 429 (rate limit). Mensaje: `'Too Many Requests'`.

---

## 12. `src/core/utils/crypto.utils.ts`

```typescript
import bcrypt from "bcrypt"

export const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, 10)
}

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash)
}

export function generateVerificationCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let code = ""
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}
```

**Línea 1:** Importa `bcrypt` para hashing de contraseñas.

**Línea 3-5:** `hashPassword(password)` — Hashea la contraseña con bcrypt. El número `10` es el costo (número de iteraciones = 2^10). Retorna el hash en formato `$2b$10$...`.

**Línea 7-9:** `comparePassword(password, hash)` — Compara una contraseña plana con un hash. bcrypt extrae el salt del hash automáticamente.

**Línea 11-17:** `generateVerificationCode()` — Genera un código de 6 caracteres:
- `chars` = letras mayúsculas + dígitos (sin vocales para evitar palabras ofensivas).
- Bucle de 6 iteraciones: elige un carácter aleatorio de `chars`.
- Retorna el código de 6 caracteres.

---

## 13. `src/core/utils/token.utils.ts`

```typescript
import { env } from "@/config/env"
import type { Role } from "@/types/auth"
import type { FastifyRequest } from "fastify"
import type { SignOptions } from "jsonwebtoken"
import jwt from "jsonwebtoken"

interface TokenPayload {
  userId: string
  email: string
  role: Role
}

export const generateTokens = (userId: string, email: string, role: Role) => {
  const accessTokenOptions: SignOptions = {
    expiresIn: 900  // 15 minutos en segundos
  }

  const refreshTokenOptions: SignOptions = {
    expiresIn: 604000  // 7 días en segundos
  }

  const accessToken = jwt.sign(
    { userId, email, role } as TokenPayload,
    env.JWT_SECRET,
    accessTokenOptions
  )

  const refreshToken = jwt.sign(
    { userId },
    env.JWT_REFRESH_SECRET,
    refreshTokenOptions
  )

  return { accessToken, refreshToken }
}

export const verifyToken = (token: string, secret: string) => {
  return jwt.verify(token, secret)
}

export function getRefreshToken(request: FastifyRequest): string {
  const cookieToken = request.cookies.refreshToken
  const body = request.body as Record<string, unknown> | undefined
  const bodyToken = typeof body?.refreshToken === "string" ? body.refreshToken : undefined
  return cookieToken || bodyToken || ""
}
```

**Línea 1-5:** Importaciones:
- `env` — Variables de entorno.
- `Role` — Tipo `"admin" | "cajero"`.
- `FastifyRequest` — Tipo de request de Fastify.
- `SignOptions` — Tipo para opciones de JWT.
- `jwt` — Biblioteca jsonwebtoken.

**Línea 7-10:** `TokenPayload` — Interface que define los claims del access token: `userId`, `email`, `role`.

**Línea 12-30:** `generateTokens(userId, email, role)` — Genera el par de tokens:
- **Línea 13-15:** `accessTokenOptions.expiresIn = 900` — Access token expira en 15 minutos (900 segundos).
- **Línea 17-19:** `refreshTokenOptions.expiresIn = 604000` — Refresh token expira en ~7 días (604000 segundos).
- **Línea 21-24:** `jwt.sign({ userId, email, role }, JWT_SECRET, accessTokenOptions)` — Firma el access token con la clave secreta de acceso.
- **Línea 26-29:** `jwt.sign({ userId }, JWT_REFRESH_SECRET, refreshTokenOptions)` — Firma el refresh token con CLAVE DIFERENTE (JWT_REFRESH_SECRET). Solo incluye `userId`.
- **Línea 31:** Retorna `{ accessToken, refreshToken }`.

**Línea 33-35:** `verifyToken(token, secret)` — Verifica un token JWT. Devuelve el payload decodificado o lanza error si es inválido/expirado.

**Línea 37-42:** `getRefreshToken(request)` — Obtiene el refresh token de dos fuentes:
- **Línea 38:** Primero busca en la cookie `refreshToken`.
- **Línea 39-40:** Si no hay cookie, busca en el body como `refreshToken`.
- **Línea 41:** Retorna el token encontrado o string vacío.

---

## 14. `src/core/utils/cookie.utils.ts`

```typescript
import type { FastifyReply } from "fastify"

export const setAuthCookies = (
  reply: FastifyReply,
  accessToken: string,
  refreshToken: string,
  isProduction: boolean
) => {
  const sameSite = isProduction ? 'strict' : 'lax'

  reply.setCookie('accessToken', accessToken, {
    path: '/',
    httpOnly: true,
    secure: isProduction,
    sameSite,
    maxAge: 900
  })
  reply.setCookie('refreshToken', refreshToken, {
    path: '/',
    httpOnly: true,
    secure: isProduction,
    sameSite,
    maxAge: 604800
  })
}

export const clearAuthCookies = async (reply: FastifyReply) => {
  reply.clearCookie('accessToken', { path: '/' })
  reply.clearCookie('refreshToken', { path: '/' })
}
```

**Línea 1:** Importa `FastifyReply` para tipar el parámetro `reply`.

**Línea 3-23:** `setAuthCookies(reply, accessToken, refreshToken, isProduction)` — Establece las cookies de autenticación:
- **Línea 7:** `sameSite` — En producción `'strict'` (no permite cross-site), en desarrollo `'lax'` (permite navegación básica).
- **Línea 9-14:** Cookie `accessToken`:
  - `path: '/'` — Disponible en todas las rutas.
  - `httpOnly: true` — No accesible desde JavaScript (protección XSS).
  - `secure: isProduction` — Solo HTTPS en producción.
  - `sameSite` — Previene CSRF.
  - `maxAge: 900` — 15 minutos.
- **Línea 15-21:** Cookie `refreshToken`:
  - Mismas propiedades de seguridad.
  - `maxAge: 604800` — 7 días.

**Línea 25-28:** `clearAuthCookies(reply)` — Elimina ambas cookies:
- `reply.clearCookie('accessToken', { path: '/' })` — Borra la cookie accessToken.
- `reply.clearCookie('refreshToken', { path: '/' })` — Borra la cookie refreshToken.

---

## 15. `src/core/utils/auth.utils.ts`

```typescript
import type { FastifyReply, FastifyRequest } from "fastify"
import type { Role } from "@/types/auth"
import { clearAuthCookies } from "./cookie.utils"
import { env } from "@/config/env"
import jwt, { type JwtPayload } from "jsonwebtoken"

export const getUserIdFromCookies = (request: FastifyRequest): { userId: string | null; role: Role | null } => {
  const token = request.cookies.accessToken || request.cookies.refreshToken
  if (!token) return { userId: null, role: null }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload & { userId?: string; role?: Role }
    return { userId: decoded.userId ?? null, role: decoded.role ?? null }
  } catch {
    try {
      const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload & { userId?: string }
      return { userId: decoded.userId ?? null, role: null }
    } catch {
      return { userId: null, role: null }
    }
  }
}

export const getUserIdFromBearerToken = (
  request: FastifyRequest
): { userId: string | null; role: Role | null } => {
  const authHeader = request.headers.authorization
  if (!authHeader) return { userId: null, role: null }

  const parts = authHeader.split(" ")
  if (parts.length !== 2 || parts[0] !== "Bearer") return { userId: null, role: null }

  const token = parts[1]

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload & { userId?: string; role?: Role }
    return { userId: decoded.userId ?? null, role: decoded.role ?? null }
  } catch {
    return { userId: null, role: null }
  }
}

export const resolveCurrentUserId = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<string | null> => {
  try {
    if (request.userId) return request.userId

    const fromCookies = getUserIdFromCookies(request)
    if (fromCookies.userId) return fromCookies.userId

    const fromBearer = getUserIdFromBearerToken(request)
    return fromBearer.userId
  } catch {
    await clearAuthCookies(reply)
    return null
  }
}
```

**Línea 1-5:** Importaciones.

**Línea 7-21:** `getUserIdFromCookies(request)` — Extrae userId de las cookies:
- **Línea 8:** Toma el token de `accessToken` o `refreshToken`.
- **Línea 9:** Si no hay token, retorna `{ userId: null, role: null }`.
- **Línea 11-13:** Intenta verificar con `JWT_SECRET` (access token). Si funciona, extrae `userId` y `role`.
- **Línea 14-18:** Si falla (catch), intenta con `JWT_REFRESH_SECRET` (refresh token). Solo extrae `userId`.
- **Línea 19:** Si ambos fallan, retorna null.

**Línea 23-36:** `getUserIdFromBearerToken(request)` — Extrae userId del header `Authorization: Bearer <token>`:
- **Línea 26:** Si no hay header, retorna null.
- **Línea 28-29:** Parsea el header: espera `"Bearer <token>"`.
- **Línea 31-35:** Verifica con `JWT_SECRET` y extrae userId/role.

**Línea 38-49:** `resolveCurrentUserId(request, reply)` — Función unificada:
- **Línea 42:** Si `request.userId` ya está seteado (por authGuard), lo retorna directamente.
- **Línea 44-45:** Intenta desde cookies.
- **Línea 47-48:** Intenta desde Bearer token.
- **Línea 49-51:** En caso de error, limpia cookies inválidas y retorna null.

---

## 16. `src/core/guard/auth.guard.ts`

```typescript
import type { FastifyReply, FastifyRequest } from "fastify"
import type { Role } from "@/types/auth"
import { UnauthorizedError, ForbiddenError } from "@/core/errors/AppError"
import { getUserIdFromCookies, getUserIdFromBearerToken } from "../utils/auth.utils"

declare module "fastify" {
  interface FastifyRequest {
    userId?: string
    userRole?: Role
  }
}

export const authGuard = async (
  request: FastifyRequest,
  _reply: FastifyReply
) => {
  const fromCookies = getUserIdFromCookies(request)
  const fromBearer = getUserIdFromBearerToken(request)

  const { userId, role } = fromCookies.userId ? fromCookies : fromBearer

  if (!userId) {
    throw new UnauthorizedError("Authentication required")
  }

  request.userId = userId
  request.userRole = role ?? undefined
}

export const adminGuard = async (
  request: FastifyRequest,
  _reply: FastifyReply
) => {
  if (request.userRole !== "admin") {
    throw new ForbiddenError("Admin access required")
  }
}
```

**Línea 1-4:** Importaciones.

**Línea 6-10:** `declare module "fastify"` — Esto es **module augmentation**: extiende el tipo `FastifyRequest` para agregar las propiedades `userId` y `userRole`. Sin esto, TypeScript marcaría error al hacer `request.userId = userId`.

**Línea 12-26:** `authGuard` — Middleware de autenticación:
- **Línea 15-16:** Intenta extraer userId de cookies y Bearer token.
- **Línea 18:** Prioriza cookies sobre Bearer (porque las cookies tienen refresh token como fallback).
- **Línea 20-22:** Si no hay userId, lanza `UnauthorizedError`.
- **Línea 24-25:** Guarda userId y role en la request para que los handlers los usen.

**Línea 28-33:** `adminGuard` — Middleware de verificación de rol:
- **Línea 30:** Si `request.userRole` no es `"admin"`, lanza `ForbiddenError`.

**Uso en rutas:**
```typescript
fastify.get("/users", {
  preHandler: [authGuard, adminGuard], // Primero auth, luego admin
}, handler)
```

---

## 17. `src/types/auth.d.ts`

```typescript
import type { account, session, user, verification } from "@prisma/client"

export type Role = "admin" | "cajero"

export interface User extends user {
  id: string
  name: string
  email: string
  email_verified: boolean
  phone?: string
  image?: string
  role: Role
  created_at: Date
  updated_at: Date
  deleted_at?: Date
}

export interface Account extends account {
  id: string
  account_id: string
  provider_id: string
  user_id?: string
  access_token?: string
  refresh_token?: string
  id_token?: string
  access_token_expires_at?: Date
  refresh_token_expires_at?: Date
  scope?: string
  password?: string
  created_at: Date
  updated_at: Date
}

export interface Session extends session {
  id: string
  expires_at: Date
  token: string
  ip_address?: string
  user_agent?: string
  user_id: string
  created_at: Date
  updated_at: Date
}

export interface Verification extends verification {
  id: string
  identifier: string
  value: string
  expires_at: Date
  created_at: Date
  updated_at: Date
}
```

**Línea 1:** Importa los tipos generados por Prisma (`user`, `account`, `session`, `verification`).

**Línea 3:** `type Role = "admin" | "cajero"` — Tipo unión usado en toda la app para tipar roles.

**Línea 5-13:** `User extends user` — Extiende el tipo de Prisma para hacer ciertos campos opcionales donde Prisma los marca como `string | null`. Esto es útil en las capas de dominio donde preferimos `undefined` sobre `null`.

**Línea 15-29:** `Account extends account` — Igual para la tabla account. Hace opcionales campos como `access_token`, `refresh_token`, `password`.

**Línea 31-40:** `Session extends session` — Para la tabla session.

**Línea 42-49:** `Verification extends verification` — Para la tabla verification.

---

## 18. `src/app.ts`

```typescript
import Fastify from "fastify"
import helmet from "@fastify/helmet"
import cors from "@fastify/cors"
import compress from "@fastify/compress"
import cookie from "@fastify/cookie"
import rateLimit from "@fastify/rate-limit"
import swagger from "@fastify/swagger"
import swaggerUi from "@fastify/swagger-ui"
import { ZodError } from "zod"
import { AppError } from "./core/errors/AppError"
import { env } from "./config/env"
import { getRedisClient } from "./config/redis"
import { routes } from "./presentation/routes"

export const buildApp = async () => {
  const app = Fastify({
    logger: env.NODE_ENV === 'development'
      ? {
        level: 'debug',
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        },
      }
      : {
        level: 'info',
      },
  })

  getRedisClient()

  await app.register(helmet)

  await app.register(cors, {
    origin: process.env.CORS_ORIGIN?.split(",") ?? ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:1420", "http://192.168.0.9:1420", 'http://tauri.localhost'],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"]
  })

  await app.register(compress)

  await app.register(rateLimit, {
    max: 100,
    timeWindow: "1 minute"
  })

  await app.register(cookie)

  // ─── Swagger / OpenAPI ───
  await app.register(swagger, {
    openapi: {
      info: {
        title: "POS System API",
        description: "API REST para sistema de punto de venta (POS). Gestión de productos, inventario, ventas, servicios, usuarios y reportes.",
        version: "1.0.0",
      },
      servers: [
        { url: `http://localhost:${env.PORT}/api/v1`, description: "Servidor de desarrollo" },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
            description: "Token JWT de acceso (accessToken)",
          },
          cookieAuth: {
            type: "apiKey",
            in: "cookie",
            name: "accessToken",
            description: "Cookie httpOnly con el accessToken JWT",
          },
        },
      },
      tags: [
        { name: "Auth", description: "Autenticación, registro, verificación de email, recuperación de contraseña" },
        { name: "Products", description: "Gestión de productos (CRUD, búsqueda por código de barra)" },
        { name: "Categories", description: "Categorías de productos" },
        { name: "Services", description: "Servicios compuestos por productos" },
        { name: "Sales", description: "Ventas con productos y servicios, reportes" },
        { name: "Inventory", description: "Movimientos de inventario individuales" },
        { name: "Inventory Batches", description: "Lotes de inventario (entradas/salidas/ajustes masivos)" },
        { name: "Suppliers", description: "Proveedores" },
        { name: "Settings", description: "Configuración del negocio" },
        { name: "Users", description: "Gestión de usuarios del sistema" },
        { name: "Health", description: "Health check del servidor" },
      ],
    },
  })

  await app.register(swaggerUi, {
    routePrefix: "/docs",
    uiConfig: {
      docExpansion: "list",
      deepLinking: true,
    },
  })

  // ─── Global error handler ───
  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof ZodError) {
      const first = error.errors[0]
      return reply.status(400).send({
        message: first?.message ?? "Datos inválidos"
      })
    }

    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        message: error.message
      })
    }

    // Unknown errors — log and return generic message
    app.log.error(error)
    return reply.status(500).send({
      message: "Error interno del servidor"
    })
  })

  app.register(routes, { prefix: '/api/v1' });

  app.get("/health", {
    schema: { tags: ["Health"] },
  }, async () => {
    return { status: "ok", timestamp: new Date().toISOString() }
  })

  return app
}
```

**Línea 1-13:** Importaciones de Fastify, plugins, Zod, errores y rutas.

**Línea 15:** `export const buildApp = async () => {` — Fábrica asíncrona que construye la aplicación.

**Línea 16-28:** `Fastify({ logger: ... })` — Crea la instancia de Fastify:
- En desarrollo: logger con nivel `debug`, transport `pino-pretty` con colores.
- En producción: solo `level: 'info'`, logs en JSON plano.

**Línea 30:** `getRedisClient()` — Inicializa Redis (no bloquea si no está disponible).

**Línea 32:** `await app.register(helmet)` — Plugin de seguridad. Agrega headers HTTP protectores (X-Content-Type-Options, X-Frame-Options, etc.).

**Línea 34-39:** `await app.register(cors, { ... })` — Configura CORS:
- `origin`: Orígenes permitidos (desde variable de entorno o defaults para Tauri).
- `credentials: true` — Permite cookies cross-origin.
- `methods`: Métodos HTTP permitidos.

**Línea 41:** `await app.register(compress)` — Compresión de respuestas (gzip/brotli).

**Línea 43-46:** `await app.register(rateLimit, { max: 100, timeWindow: "1 minute" })` — Rate limiting: máximo 100 requests por minuto por IP.

**Línea 48:** `await app.register(cookie)` — Plugin para parsear cookies. Agrega `request.cookies` y `reply.setCookie()`.

**Línea 51-97:** `await app.register(swagger, { openapi: { ... } })` — Configura Swagger/OpenAPI:
- `info.title`, `info.description`, `info.version`: Metadatos de la API.
- `servers`: URL base del servidor.
- `components.securitySchemes`: Define dos esquemas de seguridad:
  - `bearerAuth`: Token JWT en header `Authorization: Bearer`.
  - `cookieAuth`: Token JWT en cookie `accessToken`.
- `tags`: Agrupa los endpoints por categoría (Auth, Products, Sales, etc.).

**Línea 99-104:** `await app.register(swaggerUi, { routePrefix: "/docs" })` — Sirve la UI de Swagger en `/docs`.

**Línea 107-121:** `app.setErrorHandler(...)` — **Global error handler**: Captura todos los errores no manejados:
- **Línea 108-112:** Si el error es `ZodError` (validación), devuelve 400 con el mensaje del primer error.
- **Línea 114-117:** Si el error es `AppError`, devuelve el statusCode y message del error.
- **Línea 120-122:** Para errores desconocidos, loggea el error completo y devuelve 500 genérico.

**Línea 124:** `app.register(routes, { prefix: '/api/v1' })` — Registra todas las rutas bajo el prefijo `/api/v1`.

**Línea 126-129:** `app.get("/health", ...)` — Endpoint de health check, accesible en `/health`.

**Línea 131:** `return app` — Devuelve la app configurada.

---

## 19. `src/server.ts`

```typescript
import { buildApp } from "./app"
import { env } from "./config/env"
import { closeRedis } from "./config/redis"
import { prisma } from "./config/prisma"

const startServer = async () => {
  try {
    const app = await buildApp()

    await app.listen({ port: env.PORT, host: env.HOST })

    console.log(`Server listening on http://${env.HOST}:${env.PORT}`)

    const gracefulShutdown = async (signal: string) => {
      console.log(`Received ${signal}, shutting down gracefully...`)
      await app.close()
      await prisma.$disconnect()
      await closeRedis()
      process.exit(0)
    }

    process.on("SIGINT", () => gracefulShutdown("SIGINT"))
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"))
  } catch (error) {
    console.error("Failed to start server:", error)
    process.exit(1)
  }
}

startServer()
```

**Línea 1-4:** Importaciones.

**Línea 6:** `const startServer = async () => {` — Función principal asíncrona.

**Línea 8:** `const app = await buildApp()` — Construye la aplicación Fastify.

**Línea 10:** `await app.listen({ port: env.PORT, host: env.HOST })` — Inicia el servidor HTTP.

**Línea 12:** `console.log(...)` — Imprime la URL del servidor.

**Línea 14-19:** `gracefulShutdown(signal)` — Función de apagado graceful:
- **Línea 15:** `await app.close()` — Cierra Fastify (deja de aceptar requests, espera las activas).
- **Línea 16:** `await prisma.$disconnect()` — Cierra el pool de conexiones Prisma.
- **Línea 17:** `await closeRedis()` — Cierra Redis.
- **Línea 18:** `process.exit(0)` — Sale con código 0 (éxito).

**Línea 21-22:** Registra los handlers para SIGINT (Ctrl+C) y SIGTERM (Docker/Kubernetes).

**Línea 23-25:** catch — Si algo falla al iniciar, imprime el error y sale con código 1.

**Línea 29:** `startServer()` — Llama a la función principal.

---

## 20. `src/presentation/routes.ts`

```typescript
import { authRoutes } from "@/modules/auth/presentation/auth.routes";
import { productsRoutes } from "@/modules/products/presentation/products.routes";
import { categoriesRoutes } from "@/modules/products/presentation/categories.routes";
import { salesRoutes } from "@/modules/sales/presentation/sales.routes";
import { inventoryRoutes } from "@/modules/inventory/presentation/inventory.routes";
import { batchInventoryRoutes } from "@/modules/batch-inventory/presentation/batch-inventory.routes";
import { suppliersRoutes } from "@/modules/suppliers/presentation/suppliers.routes";
import { servicesRoutes } from "@/modules/services/presentation/services.routes";
import { settingsRoutes } from "@/modules/settings/presentation/settings.routes";
import { usersRoutes } from "@/modules/users/presentation/users.routes";
import { type FastifyInstance, type FastifyPluginOptions } from "fastify";

export const routes = async (fastify: FastifyInstance, _opts: FastifyPluginOptions) => {
  fastify.register(authRoutes, { prefix: "/auth" })
  fastify.register(productsRoutes, { prefix: "/products" })
  fastify.register(categoriesRoutes, { prefix: "/categories" })
  fastify.register(servicesRoutes, { prefix: "/services" })
  fastify.register(salesRoutes, { prefix: "/sales" })
  fastify.register(inventoryRoutes, { prefix: "/inventory" })
  fastify.register(batchInventoryRoutes, { prefix: "/inventory/batches" })
  fastify.register(suppliersRoutes, { prefix: "/suppliers" })
  fastify.register(settingsRoutes, { prefix: "/settings" })
  fastify.register(usersRoutes, { prefix: "/users" })
}
```

**Línea 1-10:** Importa las rutas de cada módulo.

**Línea 11:** Importa tipos de Fastify (`FastifyInstance`, `FastifyPluginOptions`).

**Línea 13-23:** `routes(fastify, _opts)` — Plugin raíz que registra cada submódulo bajo su prefijo:
- `fastify.register(authRoutes, { prefix: "/auth" })` — Las rutas de auth quedan en `/api/v1/auth/*`.
- `fastify.register(productsRoutes, { prefix: "/products" })` — `/api/v1/products/*`.
- `fastify.register(categoriesRoutes, { prefix: "/categories" })` — `/api/v1/categories/*`.
- Y así para cada módulo.

Cada `fastify.register()` es un plugin de Fastify: la función `authRoutes` recibe la instancia de Fastify y registra sus rutas internas.

---

## 21. `src/presentation/swagger-schema.ts`

```typescript
import { zodToJsonSchema } from "zod-to-json-schema"
import type { ZodTypeAny } from "zod"

function resolveRef(root: Record<string, unknown>, ref: string): Record<string, unknown> | null {
  if (!ref.startsWith("#/")) return null
  const parts = ref.slice(2).split("/")
  let current: unknown = root
  for (const part of parts) {
    if (current && typeof current === "object" && part in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[part]
    } else {
      return null
    }
  }
  return current as Record<string, unknown>
}

function sanitizeSchema(node: unknown): void {
  if (!node || typeof node !== "object") return

  const obj = node as Record<string, unknown>

  // ── exclusiveMinimum / exclusiveMaximum booleanos → numéricos ──
  if (obj.exclusiveMinimum === true && typeof obj.minimum === "number") {
    obj.exclusiveMinimum = obj.minimum
  } else if (obj.exclusiveMinimum === true) {
    obj.exclusiveMinimum = 0
  }

  if (obj.exclusiveMaximum === true && typeof obj.maximum === "number") {
    obj.exclusiveMaximum = obj.maximum
  } else if (obj.exclusiveMaximum === true) {
    obj.exclusiveMaximum = 0
  }

  // ── nullable sin type → inválido para Ajv ──
  const propagateNullable = (arr: unknown[]) => {
    for (const alt of arr) {
      if (alt && typeof alt === "object") {
        (alt as Record<string, unknown>).nullable = true
      }
    }
  }

  if (obj.nullable === true && !obj.type) {
    if (Array.isArray(obj.anyOf)) propagateNullable(obj.anyOf)
    else if (Array.isArray(obj.oneOf)) propagateNullable(obj.oneOf)
    delete obj.nullable
  }

  // ── Recursión ──
  if (obj.properties && typeof obj.properties === "object") {
    for (const val of Object.values(obj.properties as Record<string, unknown>)) {
      sanitizeSchema(val)
    }
  }
  if (obj.items && typeof obj.items === "object") {
    sanitizeSchema(obj.items)
  }
  ;["oneOf", "anyOf", "allOf"].forEach((key) => {
    const arr = obj[key]
    if (Array.isArray(arr)) arr.forEach(sanitizeSchema)
  })
}

export function toJsonSchema(schema: ZodTypeAny) {
  const jsonSchema = zodToJsonSchema(schema, { target: "openApi3" }) as Record<string, unknown>

  // Extraer el schema raíz siguiendo la $ref (si existe)
  const root = jsonSchema.$ref && typeof jsonSchema.$ref === "string"
    ? resolveRef(jsonSchema, jsonSchema.$ref) ?? jsonSchema
    : jsonSchema

  // Sanitizar para compatibilidad con Ajv
  sanitizeSchema(root)

  // Forzar additionalProperties: false en objetos raíz
  if (root.type === "object") {
    root.additionalProperties = false
  }

  return root
}
```

**Línea 1-2:** Importa `zodToJsonSchema` (conversor Zod → JSON Schema) y `ZodTypeAny`.

**Línea 4-15:** `resolveRef(root, ref)` — Sigue referencias `$ref` dentro del schema JSON:
- Si `ref` no empieza con `#/`, retorna null.
- Divide la ref en partes (ej: `"#/definitions/User"` → `["definitions", "User"]`).
- Navega el objeto siguiendo las partes.
- Retorna el nodo encontrado o null.

**Línea 17-55:** `sanitizeSchema(node)` — Corrige incompatibilidades entre zod-to-json-schema y Ajv (validador de Fastify):
- **Línea 21-27:** Convierte `exclusiveMinimum/exclusiveMaximum: true` (booleano inválido en JSON Schema) a su valor numérico correspondiente.
- **Línea 33-39:** Si `nullable: true` no tiene `type` (porque usa anyOf/oneOf), propaga la propiedad `nullable` a los sub-schemas y elimina la propiedad raíz.
- **Línea 42-53:** Recursión: sanitiza `properties`, `items`, `oneOf`, `anyOf`, `allOf`.

**Línea 57-68:** `toJsonSchema(schema)` — Función principal:
- **Línea 58:** Convierte Zod → JSON Schema con target OpenAPI 3.
- **Línea 61-63:** Si el schema tiene `$ref`, sigue la referencia para obtener el schema raíz.
- **Línea 66:** Sanitiza para compatibilidad con Ajv.
- **Línea 68-70:** Fuerza `additionalProperties: false` en objetos raíz (seguridad).
- **Línea 72:** Retorna el schema listo para usar en Fastify.

Uso en rutas:
```typescript
schema: { body: toJsonSchema(CreateProductDtoSchema) }
```

---

## 22. Schema Prisma

Archivo: `prisma/schema.prisma`

```prisma
generator client {
    provider = "prisma-client-js"
}

datasource db {
    provider = "postgresql"
    url      = env("DATABASE_URL")
}

enum ROLE {
  admin
  cajero
}

enum UNIT_TYPE {
  unidad
  paquete
  caja
  bolsa
  botella
  lata
  sobre
  barra
  rollo
  galon
  ristra
}

model user {
  id             String    @id @default(uuid())
  name           String
  email          String    @unique
  email_verified Boolean   @default(false)
  phone          String?
  image          String?
  role           ROLE      @default(cajero)

  created_at     DateTime  @default(now()) @db.Timestamptz
  updated_at     DateTime  @updatedAt @db.Timestamptz
  deleted_at     DateTime? @db.Timestamptz

  @@index([email])
  @@index([role])
  @@map("users")
}

model session {
  id          String   @id @default(uuid())
  expires_at  DateTime @db.Timestamptz
  token       String
  ip_address  String?
  user_agent  String?
  user_id     String

  created_at  DateTime @default(now()) @db.Timestamptz
  updated_at  DateTime @updatedAt @db.Timestamptz

  user        user @relation(fields: [user_id], references: [id])

  @@index([user_id])
  @@map("session")
}

model account {
  id                        String    @id @default(uuid())
  account_id                String
  provider_id               String
  user_id                   String?

  access_token              String?
  refresh_token             String?
  id_token                  String?

  access_token_expires_at   DateTime? @db.Timestamptz
  refresh_token_expires_at  DateTime? @db.Timestamptz

  scope                     String?
  password                  String?

  created_at                DateTime  @default(now()) @db.Timestamptz
  updated_at                DateTime  @updatedAt @db.Timestamptz

  user                      user? @relation(fields: [user_id], references: [id])

  @@index([user_id])
  @@map("account")
}

model verification {
  id          String   @id @default(uuid())
  identifier  String
  value       String
  expires_at  DateTime @db.Timestamptz

  created_at  DateTime @default(now()) @db.Timestamptz
  updated_at  DateTime @updatedAt @db.Timestamptz

  @@map("verification")
}

model category {
  id          String    @id @default(uuid())
  name        String    @unique
  description String?

  created_at  DateTime  @default(now()) @db.Timestamptz
  updated_at  DateTime  @updatedAt @db.Timestamptz
  deleted_at  DateTime? @db.Timestamptz

  products    product[]

  @@index([name])
  @@index([deleted_at])
  @@map("categories")
}

model supplier {
  id           String    @id @default(uuid())
  name         String
  contact_name String?   @map("contact_name")
  email        String?
  phone        String?
  address      String?
  notes        String?
  is_active    Boolean   @default(true) @map("is_active")

  created_at   DateTime  @default(now()) @db.Timestamptz
  updated_at   DateTime  @updatedAt @db.Timestamptz
  deleted_at   DateTime? @db.Timestamptz

  @@index([name])
  @@index([is_active])
  @@map("suppliers")
}

model product {
  id                  String    @id @default(uuid())
  barcode             String?
  name                String
  unit_type           UNIT_TYPE?
  unit_quantity       Int?
  category_id         String?
  supplier_id         String?
  price               Decimal   @db.Decimal(10, 2)
  cost                Decimal   @default(0) @db.Decimal(10, 2)
  tax_rate            Decimal   @default(0) @db.Decimal(10, 2)
  stock               Int       @default(0)
  low_stock_threshold Int       @default(5)
  active              Boolean   @default(true)

  created_at          DateTime  @default(now()) @db.Timestamptz
  updated_at          DateTime  @updatedAt @db.Timestamptz
  deleted_at          DateTime? @db.Timestamptz

  category            category? @relation(fields: [category_id], references: [id])
  supplier            supplier? @relation(fields: [supplier_id], references: [id])
  sale_items          sale_item[]
  inventory_movements inventory_movement[]
  inventory_batch_items inventory_batch_item[]
  service_products    service_product[]
  sale_service_products sale_service_product[]

  @@index([barcode])
  @@index([name])
  @@index([category_id])
  @@index([supplier_id])
  @@index([active])
  @@map("products")
}

model service {
  id          String    @id @default(uuid())
  name        String
  description String?
  base_price  Decimal   @db.Decimal(10, 2)
  is_active   Boolean   @default(true) @map("is_active")

  created_at  DateTime  @default(now()) @db.Timestamptz
  updated_at  DateTime  @updatedAt @db.Timestamptz
  deleted_at  DateTime? @db.Timestamptz

  service_products  service_product[]
  sale_services     sale_service[]

  @@index([name])
  @@index([is_active])
  @@map("services")
}

model service_product {
  id          String  @id @default(uuid())
  service_id  String
  product_id  String
  quantity    Int     @default(1)

  service service @relation(fields: [service_id], references: [id], onDelete: Cascade)
  product product @relation(fields: [product_id], references: [id])

  @@index([service_id])
  @@index([product_id])
  @@map("service_products")
}

model sale {
  id              String    @id @default(uuid())
  subtotal        Decimal   @db.Decimal(10, 2)
  tax_total       Decimal   @default(0) @db.Decimal(10, 2)
  discount        Decimal   @default(0) @db.Decimal(10, 2)
  total           Decimal   @db.Decimal(10, 2)
  payment_method  String
  amount_received Decimal?  @db.Decimal(10, 2)
  change_given    Decimal?  @db.Decimal(10, 2)
  user_id         String
  created_at      DateTime  @default(now()) @db.Timestamptz
  updated_at      DateTime  @updatedAt @db.Timestamptz

  user            user      @relation(fields: [user_id], references: [id])
  items           sale_item[]
  service_items   sale_service[]

  @@index([created_at])
  @@index([user_id])
  @@map("sales")
}

model sale_service {
  id           String   @id @default(uuid())
  sale_id      String
  service_id   String
  service_name String
  base_price   Decimal   @db.Decimal(10, 2)
  line_total   Decimal   @db.Decimal(10, 2)
  created_at   DateTime @default(now()) @db.Timestamptz

  sale         sale     @relation(fields: [sale_id], references: [id])
  service      service  @relation(fields: [service_id], references: [id])
  products     sale_service_product[]

  @@index([sale_id])
  @@index([service_id])
  @@map("sale_services")
}

model sale_service_product {
  id           String   @id @default(uuid())
  sale_service_id String
  product_id   String
  product_name String
  quantity     Int
  unit_price   Decimal   @db.Decimal(10, 2)
  line_total   Decimal   @db.Decimal(10, 2)
  affects_price Boolean  @default(false)
  created_at   DateTime @default(now()) @db.Timestamptz

  sale_service sale_service @relation(fields: [sale_service_id], references: [id], onDelete: Cascade)
  product      product      @relation(fields: [product_id], references: [id])

  @@index([sale_service_id])
  @@index([product_id])
  @@map("sale_service_products")
}

model sale_item {
  id           String   @id @default(uuid())
  sale_id      String
  product_id   String
  product_name String
  quantity     Int
  unit_price   Decimal   @db.Decimal(10, 2)
  tax_rate     Decimal   @default(0) @db.Decimal(10, 2)
  line_total   Decimal   @db.Decimal(10, 2)
  created_at   DateTime @default(now()) @db.Timestamptz
  updated_at   DateTime @updatedAt @db.Timestamptz

  sale         sale     @relation(fields: [sale_id], references: [id])
  product      product  @relation(fields: [product_id], references: [id])

  @@index([sale_id])
  @@index([product_id])
  @@map("sale_items")
}

model inventory_batch {
  id            String   @id @default(uuid())
  movement_type String
  supplier_id   String?
  notes         String?
  user_id       String
  created_at    DateTime @default(now()) @db.Timestamptz

  supplier      supplier?     @relation(fields: [supplier_id], references: [id])
  user          user          @relation(fields: [user_id], references: [id])
  items         inventory_batch_item[]
  movements     inventory_movement[]

  @@index([movement_type])
  @@index([supplier_id])
  @@index([created_at])
  @@map("inventory_batches")
}

model inventory_batch_item {
  id         String   @id @default(uuid())
  batch_id   String
  product_id String
  quantity   Int
  unit_cost  Decimal? @db.Decimal(10, 2)
  notes      String?
  created_at DateTime @default(now()) @db.Timestamptz

  batch   inventory_batch @relation(fields: [batch_id], references: [id], onDelete: Cascade)
  product product         @relation(fields: [product_id], references: [id])

  @@index([batch_id])
  @@index([product_id])
  @@map("inventory_batch_items")
}

model inventory_movement {
  id            String   @id @default(uuid())
  product_id    String
  movement_type String
  quantity      Int
  note          String?
  batch_id      String?
  user_id       String
  created_at    DateTime @default(now()) @db.Timestamptz

  product product           @relation(fields: [product_id], references: [id])
  user    user              @relation(fields: [user_id], references: [id])
  batch   inventory_batch?  @relation(fields: [batch_id], references: [id])

  @@index([product_id])
  @@index([movement_type])
  @@index([batch_id])
  @@index([created_at])
  @@map("inventory_movements")
}

model settings {
  id                  Int      @id @default(autoincrement())
  name                String   @default("Mi Negocio")
  address             String?
  phone               String?
  tax_rate            Decimal  @default(16) @db.Decimal(10, 2)
  low_stock_threshold Int      @default(5)
  ticket_footer       String?
  updated_at          DateTime @updatedAt @db.Timestamptz

  @@map("settings")
}
```

---

## 23. Módulo `auth` — Autenticación

### 23.1 `domain/auth.types.ts` — Tipos de payload y respuesta

```typescript
import type { Role } from "@/types/auth"

export interface IRegisterPayload {
  name: string
  email: string
  password: string
  role?: Role
}

export interface ILoginPayload {
  email: string
  password: string
}

export interface IVerifyEmailPayload {
  identifier: string
  code: string
}

export interface IForgotPasswordPayload {
  email: string
}

export interface IResetPasswordPayload {
  email: string
  code: string
  newPassword: string
}

export interface IUserResponse {
  id: string
  name: string
  email: string
  email_verified: boolean
  role: Role
  phone?: string
  image?: string
  created_at: Date
  updated_at: Date
}

export interface IAuthResponse {
  message: string
  user: IUserResponse
  accessToken: string
  refreshToken: string
}

export interface IRefreshResponse {
  message: string
  user: IUserResponse
  accessToken: string
  refreshToken: string
}

export interface IVerificationResponse {
  message: string
  expiresAt: Date
}

export interface ILogoutResponse {
  message: string
}

export interface ISessionResponse {
  id: string
  expires_at: Date
  ip_address?: string
  user_agent?: string
  created_at: Date
  updated_at: Date
}

export interface IUserSessionsResponse {
  sessions: ISessionResponse[]
}

export interface IVerifyEmailResponse {
  message: string
  accessToken: string
  refreshToken: string
}

export interface IForgotPasswordResponse {
  message: string
  expires_at: Date
}

export interface IResetPasswordResponse {
  message: string
}
```

Define todas las interfaces de payload y respuesta del módulo auth. Cada interfaz tipa estrictamente los datos que entran y salen.

### 23.2 `domain/auth.entities.ts` — Entidades de dominio

```typescript
import type { Role } from "@/types/auth"

export interface IUserEntity {
  id: string
  name: string
  email: string
  email_verified: boolean
  phone?: string
  image?: string
  role: Role
  created_at: Date
  updated_at: Date
  deleted_at?: Date
}

export interface IAccountEntity {
  id: string
  account_id: string
  provider_id: string
  user_id?: string
  access_token?: string
  refresh_token?: string
  id_token?: string
  access_token_expires_at?: Date
  refresh_token_expires_at?: Date
  scope?: string
  password?: string
  created_at: Date
  updated_at: Date
}

export interface ISessionEntity {
  id: string
  expires_at: Date
  token: string
  ip_address?: string
  user_agent?: string
  user_id: string
  created_at: Date
  updated_at: Date
}

export interface IVerificationEntity {
  id: string
  identifier: string
  value: string
  expires_at: Date
  created_at: Date
  updated_at: Date
}

export type CreateUserData = Pick<IUserEntity, "name" | "email" | "role"> & {
  phone?: string
  image?: string
  email_verified?: boolean
}

export type UpdateUserData = Partial<Pick<IUserEntity, "name" | "phone" | "image" | "role" | "email_verified">>

export type CreateAccountData = Pick<IAccountEntity, "account_id" | "provider_id"> & {
  user_id?: string
  access_token?: string
  refresh_token?: string
  id_token?: string
  access_token_expires_at?: Date
  refresh_token_expires_at?: Date
  scope?: string
  password?: string
}

export type CreateSessionData = {
  userId: string
  token: string
  expiresAt: Date
  ipAddress?: string
  userAgent?: string
}

export type CreateVerificationData = {
  identifier: string
  value: string
  expiresAt: Date
}
```

### 23.3 `domain/auth.interface.ts` — Contratos de repositorio

```typescript
import type {
  IUserEntity, IAccountEntity, ISessionEntity, IVerificationEntity,
  CreateUserData, UpdateUserData, CreateAccountData, CreateSessionData, CreateVerificationData
} from "./auth.entities"

export interface IUserRepository {
  findByEmail(email: string): Promise<IUserEntity | null>
  findById(id: string): Promise<IUserEntity | null>
  create(data: CreateUserData): Promise<IUserEntity>
  update(id: string, data: UpdateUserData): Promise<IUserEntity>
  softDelete(id: string): Promise<void>
}

export interface IAccountRepository {
  findByProviderAndAccountId(providerId: string, accountId: string): Promise<IAccountEntity | null>
  findByUserId(userId: string): Promise<IAccountEntity[]>
  findCredentialsAccountByEmail(email: string): Promise<IAccountEntity | null>
  create(data: CreateAccountData): Promise<IAccountEntity>
  update(id: string, data: Partial<CreateAccountData>): Promise<IAccountEntity>
  delete(id: string): Promise<void>
  deleteByUserId(userId: string): Promise<void>
}

export interface ISessionRepository {
  create(data: CreateSessionData): Promise<ISessionEntity>
  findByToken(token: string): Promise<ISessionEntity | null>
  findByUserId(userId: string): Promise<ISessionEntity[]>
  delete(token: string): Promise<void>
  deleteByUserId(userId: string): Promise<void>
  deleteExpiredSessions(): Promise<number>
}

export interface IVerificationRepository {
  create(data: CreateVerificationData): Promise<IVerificationEntity>
  findByIdentifier(identifier: string): Promise<IVerificationEntity | null>
  findByIdentifierAndValue(identifier: string, value: string): Promise<IVerificationEntity | null>
  delete(id: string): Promise<void>
  deleteByIdentifier(identifier: string): Promise<void>
  deleteExpired(): Promise<number>
}

export interface IAuthRepository {
  user: IUserRepository
  account: IAccountRepository
  session: ISessionRepository
  verification: IVerificationRepository
}
```

### 23.4 `application/auth.service.ts` — Servicio COMPLETO

```typescript
import { ConflictError, NotFoundError, UnauthorizedError } from "@/core/errors/AppError"
import { comparePassword, hashPassword, generateVerificationCode } from "@/core/utils/crypto.utils"
import { generateTokens, verifyToken } from "@/core/utils/token.utils"
import type { IAuthRepository } from "../domain/auth.interface"
import type {
  IAuthResponse, IRefreshResponse, IVerificationResponse, ILogoutResponse,
  IUserResponse, IUserSessionsResponse, ISessionResponse,
  IVerifyEmailResponse, IForgotPasswordResponse, IResetPasswordResponse,
  ILoginPayload, IVerifyEmailPayload, IForgotPasswordPayload, IResetPasswordPayload, IRegisterPayload
} from "../domain/auth.types"
import type { Role } from "@/types/auth"
import { env } from "@/config/env"
import type { IUserEntity } from "../domain/auth.entities"

const ACCESS_TOKEN_EXPIRY = 15 * 60 * 1000  // 15 min en ms
const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60 * 1000  // 7 días en ms
const VERIFICATION_CODE_EXPIRY = 15 * 60 * 1000  // 15 min en ms
const SESSION_EXPIRY = 7 * 24 * 60 * 60 * 1000  // 7 días en ms

function mapUserToResponse(user: IUserEntity): IUserResponse {
  return {
    id: user.id, name: user.name, email: user.email,
    email_verified: user.email_verified, role: user.role as Role,
    phone: user.phone, image: user.image,
    created_at: user.created_at, updated_at: user.updated_at
  }
}

export const createAuthService = (repository: IAuthRepository) => ({

  register: async (data: IRegisterPayload): Promise<IAuthResponse> => {
    const { name, email, password, role = "cajero" } = data
    const existingUser = await repository.user.findByEmail(email)
    if (existingUser) throw new ConflictError("Email already registered")

    const hashedPassword = await hashPassword(password)
    const user = await repository.user.create({ name, email, role, email_verified: false })
    await repository.account.create({ account_id: user.id, provider_id: "credentials", user_id: user.id, password: hashedPassword })

    const verificationCode = generateVerificationCode()
    await repository.verification.create({ identifier: email, value: verificationCode, expiresAt: new Date(Date.now() + VERIFICATION_CODE_EXPIRY) })
    console.log(`Verification code for ${email}: ${verificationCode}`)

    const { accessToken, refreshToken } = generateTokens(user.id, user.email, user.role as Role)
    await repository.session.create({ userId: user.id, token: refreshToken, expiresAt: new Date(Date.now() + SESSION_EXPIRY) })

    return { message: "User created successfully. Please verify your email.", user: mapUserToResponse(user), accessToken, refreshToken }
  },

  login: async (data: ILoginPayload): Promise<IAuthResponse> => {
    const { email, password } = data
    const account = await repository.account.findCredentialsAccountByEmail(email)
    if (!account || !account.password) throw new UnauthorizedError("Invalid credentials")

    const isValidPassword = await comparePassword(password, account.password)
    if (!isValidPassword) throw new UnauthorizedError("Invalid credentials")

    const user = await repository.user.findById(account.user_id!)
    if (!user) throw new UnauthorizedError("User not found")
    if (user.deleted_at) throw new UnauthorizedError("Account has been deactivated")

    const { accessToken, refreshToken } = generateTokens(user.id, user.email, user.role as Role)
    await repository.session.create({ userId: user.id, token: refreshToken, expiresAt: new Date(Date.now() + SESSION_EXPIRY) })

    return { message: "Login successfully", user: mapUserToResponse(user), accessToken, refreshToken }
  },

  logout: async (refreshToken: string): Promise<ILogoutResponse> => {
    await repository.session.delete(refreshToken)
    return { message: "Logged out successfully" }
  },

  refresh: async (refreshToken: string): Promise<IRefreshResponse> => {
    let payload: { userId: string }
    try {
      payload = verifyToken(refreshToken, env.JWT_REFRESH_SECRET) as { userId: string }
    } catch {
      throw new UnauthorizedError("Invalid or expired refresh token")
    }

    const session = await repository.session.findByToken(refreshToken)
    if (!session) throw new UnauthorizedError("Invalid refresh token")
    if (session.expires_at < new Date()) {
      await repository.session.delete(refreshToken)
      throw new UnauthorizedError("Session expired")
    }

    const user = await repository.user.findById(payload.userId)
    if (!user) throw new UnauthorizedError("User not found")

    await repository.session.delete(refreshToken)
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user.id, user.email, user.role as Role)
    await repository.session.create({ userId: user.id, token: newRefreshToken, expiresAt: new Date(Date.now() + SESSION_EXPIRY) })

    return { message: "Token refreshed successfully", user: mapUserToResponse(user), accessToken, refreshToken: newRefreshToken }
  },

  verifyEmail: async (data: IVerifyEmailPayload): Promise<IVerifyEmailResponse> => {
    const { identifier, code } = data
    const verification = await repository.verification.findByIdentifierAndValue(identifier, code)
    if (!verification) throw new UnauthorizedError("Invalid verification code")
    if (verification.expires_at < new Date()) {
      await repository.verification.deleteByIdentifier(identifier)
      throw new UnauthorizedError("Verification code expired")
    }

    const user = await repository.user.findByEmail(identifier)
    if (!user) throw new NotFoundError("User not found")

    await repository.user.update(user.id, { email_verified: true })
    await repository.verification.deleteByIdentifier(identifier)

    const { accessToken, refreshToken } = generateTokens(user.id, user.email, user.role as Role)
    await repository.session.create({ userId: user.id, token: refreshToken, expiresAt: new Date(Date.now() + SESSION_EXPIRY) })

    return { message: "Email verified successfully", accessToken, refreshToken }
  },

  forgotPassword: async (data: IForgotPasswordPayload): Promise<IForgotPasswordResponse> => {
    const { email } = data
    const user = await repository.user.findByEmail(email)
    if (!user) {
      return { message: "If the email exists, a reset code has been sent", expires_at: new Date(Date.now() + VERIFICATION_CODE_EXPIRY) }
    }

    const resetCode = generateVerificationCode()
    await repository.verification.create({ identifier: `reset:${email}`, value: resetCode, expiresAt: new Date(Date.now() + VERIFICATION_CODE_EXPIRY) })
    console.log(`Password reset code for ${email}: ${resetCode}`)

    return { message: "If the email exists, a reset code has been sent", expires_at: new Date(Date.now() + VERIFICATION_CODE_EXPIRY) }
  },

  resetPassword: async (data: IResetPasswordPayload): Promise<IResetPasswordResponse> => {
    const { email, code, newPassword } = data
    const verification = await repository.verification.findByIdentifierAndValue(`reset:${email}`, code)
    if (!verification) throw new UnauthorizedError("Invalid reset code")
    if (verification.expires_at < new Date()) {
      await repository.verification.deleteByIdentifier(`reset:${email}`)
      throw new UnauthorizedError("Reset code expired")
    }

    const user = await repository.user.findByEmail(email)
    if (!user) throw new NotFoundError("User not found")

    const account = await repository.account.findCredentialsAccountByEmail(email)
    if (!account) throw new NotFoundError("Account not found")

    const hashedPassword = await hashPassword(newPassword)
    await repository.account.update(account.id, { password: hashedPassword })
    await repository.session.deleteByUserId(user.id)
    await repository.verification.deleteByIdentifier(`reset:${email}`)

    return { message: "Password reset successfully. Please login with your new password." }
  },

  getUserSessions: async (userId: string): Promise<IUserSessionsResponse> => {
    const sessions = await repository.session.findByUserId(userId)
    const validSessions: ISessionResponse[] = sessions
      .filter(s => s.expires_at > new Date())
      .map(s => ({ id: s.id, expires_at: s.expires_at, ip_address: s.ip_address, user_agent: s.user_agent, created_at: s.created_at, updated_at: s.updated_at }))
    return { sessions: validSessions }
  },

  revokeSession: async (userId: string, sessionId: string): Promise<ILogoutResponse> => {
    const sessions = await repository.session.findByUserId(userId)
    const session = sessions.find(s => s.id === sessionId)
    if (!session) throw new NotFoundError("Session not found")
    await repository.session.delete(session.token)
    return { message: "Session revoked successfully" }
  },

  resendVerification: async (email: string): Promise<IVerificationResponse> => {
    const user = await repository.user.findByEmail(email)
    if (!user) {
      return { message: "If the email exists, a new verification code has been sent", expiresAt: new Date(Date.now() + VERIFICATION_CODE_EXPIRY) }
    }
    if (user.email_verified) throw new ConflictError("Email already verified")

    await repository.verification.deleteByIdentifier(email)
    const verificationCode = generateVerificationCode()
    await repository.verification.create({ identifier: email, value: verificationCode, expiresAt: new Date(Date.now() + VERIFICATION_CODE_EXPIRY) })
    console.log(`Verification code for ${email}: ${verificationCode}`)

    return { message: "New verification code sent", expiresAt: new Date(Date.now() + VERIFICATION_CODE_EXPIRY) }
  }
})

### 23.5 `presentation/auth.controller.ts` — Handlers HTTP COMPLETO

```typescript
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify"
import { createAuthService } from "../application/auth.service"
import { AuthRepository } from "../infrastructure/auth.prisma.repository"
import {
  LoginPayloadDtoSchema,
  RegisterPayloadDtoSchema,
  VerifyEmailDtoSchema,
  ForgotPasswordDtoSchema,
  ResetPasswordDtoSchema,
  ResendVerificationDtoSchema,
  RevokeSessionDtoSchema
} from "./auth.dto"
import { env } from "@/config/env"
import { clearAuthCookies, setAuthCookies } from "@/core/utils/cookie.utils"
import { ConflictError, UnauthorizedError } from "@/core/errors/AppError"
import { resolveCurrentUserId } from "@/core/utils/auth.utils"

const authService = createAuthService(AuthRepository)

function getRefreshToken(request: FastifyRequest): string {
  const cookieToken = request.cookies.refreshToken
  const body = request.body as Record<string, unknown> | undefined
  const bodyToken = typeof body?.refreshToken === "string" ? body.refreshToken : undefined
  return cookieToken || bodyToken || ""
}

export const authController = {
  register: async (request: FastifyRequest, reply: FastifyReply) => {
    const data = RegisterPayloadDtoSchema.parse(request.body)
    const result = await authService.register(data)
    if (!request.userId) {
      setAuthCookies(reply, result.accessToken, result.refreshToken, env.NODE_ENV === "production")
    }
    return reply.status(201).send({
      message: result.message,
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken
    })
  },

  login: async (request: FastifyRequest, reply: FastifyReply) => {
    const data = LoginPayloadDtoSchema.parse(request.body)
    const currentUserId = await resolveCurrentUserId(request, reply)
    const result = await authService.login(data)
    if (currentUserId && currentUserId === result.user.id) {
      throw new ConflictError("Already logged in with this user. Please logout first.")
    }
    if (currentUserId && currentUserId !== result.user.id) {
      await clearAuthCookies(reply)
    }
    setAuthCookies(reply, result.accessToken, result.refreshToken, env.NODE_ENV === "production")
    return reply.status(200).send({
      message: result.message,
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken
    })
  },

  logout: async (request: FastifyRequest, reply: FastifyReply) => {
    const refreshToken = getRefreshToken(request)
    if (!refreshToken) throw new UnauthorizedError("Refresh token required")
    const result = await authService.logout(refreshToken)
    clearAuthCookies(reply)
    return reply.status(200).send(result)
  },

  refresh: async (request: FastifyRequest, reply: FastifyReply) => {
    const refreshToken = getRefreshToken(request)
    if (!refreshToken) throw new UnauthorizedError("Refresh token required")
    const result = await authService.refresh(refreshToken)
    setAuthCookies(reply, result.accessToken, result.refreshToken, env.NODE_ENV === "production")
    return reply.status(200).send({
      message: result.message,
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken
    })
  },

  verifyEmail: async (request: FastifyRequest, reply: FastifyReply) => {
    const data = VerifyEmailDtoSchema.parse(request.body)
    const result = await authService.verifyEmail(data)
    setAuthCookies(reply, result.accessToken, result.refreshToken, env.NODE_ENV === "production")
    return reply.status(200).send({ message: result.message })
  },

  resendVerification: async (request: FastifyRequest, reply: FastifyReply) => {
    const data = ResendVerificationDtoSchema.parse(request.body)
    const result = await authService.resendVerification(data.email)
    return reply.status(200).send({ message: result.message })
  },

  forgotPassword: async (request: FastifyRequest, reply: FastifyReply) => {
    const currentUserId = await resolveCurrentUserId(request, reply)
    if (currentUserId) throw new ConflictError("Please logout before requesting password reset")
    const data = ForgotPasswordDtoSchema.parse(request.body)
    const result = await authService.forgotPassword(data)
    return reply.status(200).send(result)
  },

  resetPassword: async (request: FastifyRequest, reply: FastifyReply) => {
    const currentUserId = await resolveCurrentUserId(request, reply)
    if (currentUserId) throw new ConflictError("Please logout before resetting password")
    const data = ResetPasswordDtoSchema.parse(request.body)
    const result = await authService.resetPassword(data)
    clearAuthCookies(reply)
    return reply.status(200).send(result)
  },

  getUserSessions: async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = await resolveCurrentUserId(request, reply)
    if (!userId) throw new UnauthorizedError("Authentication required")
    const result = await authService.getUserSessions(userId)
    return reply.status(200).send(result)
  },

  revokeSession: async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = await resolveCurrentUserId(request, reply)
    if (!userId) throw new UnauthorizedError("Authentication required")
    const params = request.params as { sessionId: string }
    const { sessionId } = RevokeSessionDtoSchema.parse(params)
    const result = await authService.revokeSession(userId, sessionId)
    return reply.status(200).send(result)
  }
}
```

### 23.6 `presentation/auth.routes.ts` — Definición de rutas

```typescript
import type { FastifyInstance, FastifyPluginOptions } from "fastify"
import { authController } from "./auth.controller"
import { authGuard, adminGuard } from "@/core/guard/auth.guard"
import { toJsonSchema } from "@/presentation/swagger-schema"
import {
  LoginPayloadDtoSchema,
  RegisterPayloadDtoSchema,
  RefreshTokenDtoSchema,
  VerifyEmailDtoSchema,
  ResendVerificationDtoSchema,
  ForgotPasswordDtoSchema,
  ResetPasswordDtoSchema,
} from "./auth.dto"

const TAGS = ["Auth"]

export const authRoutes = async (fastify: FastifyInstance, _opts: FastifyPluginOptions) => {
  // PUBLIC ROUTES (sin authGuard)
  fastify.post("/register", {
    schema: { tags: TAGS, body: toJsonSchema(RegisterPayloadDtoSchema) },
    preHandler: [authGuard, adminGuard],
  }, authController.register)

  fastify.post("/login", {
    schema: { tags: TAGS, body: toJsonSchema(LoginPayloadDtoSchema) },
  }, authController.login)

  fastify.post("/refresh", {
    schema: { tags: TAGS, body: toJsonSchema(RefreshTokenDtoSchema) },
  }, authController.refresh)

  fastify.post("/logout", {
    schema: { tags: TAGS, body: toJsonSchema(RefreshTokenDtoSchema) },
  }, authController.logout)

  fastify.post("/verify-email", {
    schema: { tags: TAGS, body: toJsonSchema(VerifyEmailDtoSchema) },
  }, authController.verifyEmail)

  fastify.post("/resend-verification", {
    schema: { tags: TAGS, body: toJsonSchema(ResendVerificationDtoSchema) },
  }, authController.resendVerification)

  fastify.post("/forgot-password", {
    schema: { tags: TAGS, body: toJsonSchema(ForgotPasswordDtoSchema) },
  }, authController.forgotPassword)

  fastify.post("/reset-password", {
    schema: { tags: TAGS, body: toJsonSchema(ResetPasswordDtoSchema) },
  }, authController.resetPassword)

  // PROTECTED ROUTES (requieren authGuard)
  fastify.get("/sessions", { schema: { tags: TAGS }, preHandler: authGuard }, authController.getUserSessions)

  fastify.delete("/sessions/:sessionId", { schema: { tags: TAGS }, preHandler: authGuard }, authController.revokeSession)
}
```

### 23.7 `presentation/auth.dto.ts` — Schemas Zod

```typescript
import { z } from "zod"

export const RegisterPayloadDtoSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["admin", "cajero"]).optional()
})

export const LoginPayloadDtoSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters")
})

export const VerifyEmailDtoSchema = z.object({
  identifier: z.string().email("Invalid email format"),
  code: z.string().min(6, "Verification code must be at least 6 characters")
})

export const ResendVerificationDtoSchema = z.object({
  email: z.string().email("Invalid email format")
})

export const ForgotPasswordDtoSchema = z.object({
  email: z.string().email("Invalid email format")
})

export const ResetPasswordDtoSchema = z.object({
  email: z.string().email("Invalid email format"),
  code: z.string().min(6, "Reset code must be at least 6 characters"),
  newPassword: z.string().min(8, "Password must be at least 8 characters")
})

export const RefreshTokenDtoSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required")
})

export const RevokeSessionDtoSchema = z.object({
  sessionId: z.string().uuid("Invalid session ID")
})

export type RegisterPayloadDto = z.infer<typeof RegisterPayloadDtoSchema>
export type LoginPayloadDto = z.infer<typeof LoginPayloadDtoSchema>
export type VerifyEmailDto = z.infer<typeof VerifyEmailDtoSchema>
export type ResendVerificationDto = z.infer<typeof ResendVerificationDtoSchema>
export type ForgotPasswordDto = z.infer<typeof ForgotPasswordDtoSchema>
export type ResetPasswordDto = z.infer<typeof ResetPasswordDtoSchema>
export type RefreshTokenDto = z.infer<typeof RefreshTokenDtoSchema>
export type RevokeSessionDto = z.infer<typeof RevokeSessionDtoSchema>
```

### 23.8 `infrastructure/auth.prisma.repository.ts` — Repositorio Prisma COMPLETO

```typescript
import { prisma } from "@/config/prisma"
import type { Role } from "@/types/auth"
import type {
  IAuthRepository, IUserRepository, IAccountRepository, ISessionRepository, IVerificationRepository
} from "../domain/auth.interface"
import type {
  IUserEntity, IAccountEntity, ISessionEntity, IVerificationEntity,
  CreateUserData, UpdateUserData, CreateAccountData, CreateSessionData, CreateVerificationData
} from "../domain/auth.entities"
import {
  mapPrismaUserToEntity, mapPrismaAccountToEntity,
  mapPrismaSessionToEntity, mapPrismaVerificationToEntity
} from "./mappers/auth.prisma.mappers"

const UserRepository: IUserRepository = {
  async findByEmail(email: string): Promise<IUserEntity | null> {
    const user = await prisma.user.findFirst({
      where: { email, deleted_at: null }
    })
    if (!user) return null
    return mapPrismaUserToEntity(user)
  },

  async findById(id: string): Promise<IUserEntity | null> {
    const user = await prisma.user.findFirst({
      where: { id, deleted_at: null }
    })
    if (!user) return null
    return mapPrismaUserToEntity(user)
  },

  async create(data: CreateUserData): Promise<IUserEntity> {
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        image: data.image,
        role: data.role || "cajero",
        email_verified: data.email_verified || false
      }
    })
    return mapPrismaUserToEntity(user)
  },

  async update(id: string, data: UpdateUserData): Promise<IUserEntity> {
    const user = await prisma.user.update({
      where: { id },
      data: data
    })
    return mapPrismaUserToEntity(user)
  },

  async softDelete(id: string): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: { deleted_at: new Date() }
    })
  }
}

const AccountRepository: IAccountRepository = {
  async findByProviderAndAccountId(providerId: string, accountId: string): Promise<IAccountEntity | null> {
    const account = await prisma.account.findFirst({
      where: { provider_id: providerId, account_id: accountId }
    })
    if (!account) return null
    return mapPrismaAccountToEntity(account)
  },

  async findByUserId(userId: string): Promise<IAccountEntity[]> {
    const accounts = await prisma.account.findMany({
      where: { user_id: userId }
    })
    return accounts.map(mapPrismaAccountToEntity)
  },

  async findCredentialsAccountByEmail(email: string): Promise<IAccountEntity | null> {
    const user = await prisma.user.findFirst({
      where: { email, deleted_at: null }
    })
    if (!user) return null
    const account = await prisma.account.findFirst({
      where: { user_id: user.id, provider_id: "credentials" }
    })
    if (!account) return null
    return mapPrismaAccountToEntity(account)
  },

  async create(data: CreateAccountData): Promise<IAccountEntity> {
    const account = await prisma.account.create({
      data: {
        account_id: data.account_id,
        provider_id: data.provider_id,
        user_id: data.user_id,
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        id_token: data.id_token,
        access_token_expires_at: data.access_token_expires_at,
        refresh_token_expires_at: data.refresh_token_expires_at,
        scope: data.scope,
        password: data.password
      }
    })
    return mapPrismaAccountToEntity(account)
  },

  async update(id: string, data: Partial<CreateAccountData>): Promise<IAccountEntity> {
    const account = await prisma.account.update({
      where: { id },
      data: data
    })
    return mapPrismaAccountToEntity(account)
  },

  async delete(id: string): Promise<void> {
    await prisma.account.delete({ where: { id } })
  },

  async deleteByUserId(userId: string): Promise<void> {
    await prisma.account.deleteMany({ where: { user_id: userId } })
  }
}

const SessionRepository: ISessionRepository = {
  async create(data: CreateSessionData): Promise<ISessionEntity> {
    const session = await prisma.session.create({
      data: {
        user_id: data.userId,
        token: data.token,
        expires_at: data.expiresAt,
        ip_address: data.ipAddress,
        user_agent: data.userAgent
      }
    })
    return mapPrismaSessionToEntity(session)
  },

  async findByToken(token: string): Promise<ISessionEntity | null> {
    const session = await prisma.session.findFirst({ where: { token } })
    if (!session) return null
    return mapPrismaSessionToEntity(session)
  },

  async findByUserId(userId: string): Promise<ISessionEntity[]> {
    const sessions = await prisma.session.findMany({ where: { user_id: userId } })
    return sessions.map(mapPrismaSessionToEntity)
  },

  async delete(token: string): Promise<void> {
    await prisma.session.deleteMany({ where: { token } })
  },

  async deleteByUserId(userId: string): Promise<void> {
    await prisma.session.deleteMany({ where: { user_id: userId } })
  },

  async deleteExpiredSessions(): Promise<number> {
    const result = await prisma.session.deleteMany({
      where: { expires_at: { lt: new Date() } }
    })
    return result.count
  }
}

const VerificationRepository: IVerificationRepository = {
  async create(data: CreateVerificationData): Promise<IVerificationEntity> {
    await prisma.verification.deleteMany({ where: { identifier: data.identifier } })
    const verification = await prisma.verification.create({
      data: {
        identifier: data.identifier,
        value: data.value,
        expires_at: data.expiresAt
      }
    })
    return mapPrismaVerificationToEntity(verification)
  },

  async findByIdentifier(identifier: string): Promise<IVerificationEntity | null> {
    const verification = await prisma.verification.findFirst({ where: { identifier } })
    if (!verification) return null
    return mapPrismaVerificationToEntity(verification)
  },

  async findByIdentifierAndValue(identifier: string, value: string): Promise<IVerificationEntity | null> {
    const verification = await prisma.verification.findFirst({ where: { identifier, value } })
    if (!verification) return null
    return mapPrismaVerificationToEntity(verification)
  },

  async delete(id: string): Promise<void> {
    await prisma.verification.delete({ where: { id } })
  },

  async deleteByIdentifier(identifier: string): Promise<void> {
    await prisma.verification.deleteMany({ where: { identifier } })
  },

  async deleteExpired(): Promise<number> {
    const result = await prisma.verification.deleteMany({
      where: { expires_at: { lt: new Date() } }
    })
    return result.count
  }
}

export const AuthRepository: IAuthRepository = {
  user: UserRepository,
  account: AccountRepository,
  session: SessionRepository,
  verification: VerificationRepository
}
```

### 23.9 `infrastructure/mappers/auth.prisma.mappers.ts`

```typescript
import type { Role } from "@/types/auth"
import type { IAccountEntity, ISessionEntity, IUserEntity, IVerificationEntity } from "../../domain/auth.entities"
import type { account, session, user, verification } from "@prisma/client"

export function mapPrismaUserToEntity(user: user): IUserEntity {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    email_verified: user.email_verified,
    phone: user.phone || undefined,
    image: user.image || undefined,
    role: user.role as Role,
    created_at: user.created_at,
    updated_at: user.updated_at,
    deleted_at: user.deleted_at || undefined
  }
}

export function mapPrismaAccountToEntity(account: account): IAccountEntity {
  return {
    id: account.id,
    account_id: account.account_id,
    provider_id: account.provider_id,
    user_id: account.user_id || undefined,
    access_token: account.access_token || undefined,
    refresh_token: account.refresh_token || undefined,
    id_token: account.id_token || undefined,
    access_token_expires_at: account.access_token_expires_at || undefined,
    refresh_token_expires_at: account.refresh_token_expires_at || undefined,
    scope: account.scope || undefined,
    password: account.password || undefined,
    created_at: account.created_at,
    updated_at: account.updated_at
  }
}

export function mapPrismaSessionToEntity(session: session): ISessionEntity {
  return {
    id: session.id,
    expires_at: session.expires_at,
    token: session.token,
    ip_address: session.ip_address || undefined,
    user_agent: session.user_agent || undefined,
    user_id: session.user_id,
    created_at: session.created_at,
    updated_at: session.updated_at
  }
}

export function mapPrismaVerificationToEntity(verification: verification): IVerificationEntity {
  return {
    id: verification.id,
    identifier: verification.identifier,
    value: verification.value,
    expires_at: verification.expires_at,
    created_at: verification.created_at,
    updated_at: verification.updated_at
  }
}
```

---

## 24. Módulo `users` — Gestión de usuarios

### 24.1 `domain/users.types.ts`

```typescript
import type { Role } from "@/types/auth"

export interface IUserResponse {
  id: string
  name: string
  email: string
  email_verified: boolean
  role: Role
  phone?: string
  image?: string
  created_at: Date
  updated_at: Date
}

export interface IUserListResponse {
  users: IUserResponse[]
  total: number
  page: number
  limit: number
}
```

### 24.2 `domain/users.entities.ts`

```typescript
import type { ROLE } from "@prisma/client"

export interface IUserEntity {
  id: string
  name: string
  email: string
  email_verified: boolean
  role: ROLE
  phone?: string | null
  image?: string | null
  created_at: Date
  updated_at: Date
  deleted_at?: Date | null
}

export interface CreateUserData {
  name: string
  email: string
  password: string
  role?: ROLE
  phone?: string
}

export interface UpdateUserData {
  name?: string
  email?: string
  role?: ROLE
  phone?: string
}
```

### 24.3 `domain/users.interface.ts`

```typescript
import type { CreateUserData, UpdateUserData, IUserEntity } from "./users.entities"

export interface IUserRepository {
  findAll(params?: { page?: number; limit?: number; search?: string }): Promise<{ users: IUserEntity[]; total: number; page: number; limit: number }>
  findById(id: string): Promise<IUserEntity | null>
  findByEmail(email: string): Promise<IUserEntity | null>
  create(data: CreateUserData): Promise<IUserEntity>
  update(id: string, data: UpdateUserData): Promise<IUserEntity>
  softDelete(id: string): Promise<void>
  updatePassword(id: string, hashedPassword: string): Promise<void>
}
```

### 24.4 `application/users.service.ts`

```typescript
import { NotFoundError, ConflictError } from "@/core/errors/AppError"
import { hashPassword } from "@/core/utils/crypto.utils"
import type { IUserRepository } from "../domain/users.interface"
import type { IUserResponse, IUserListResponse } from "../domain/users.types"
import type { CreateUserData, UpdateUserData } from "../domain/users.entities"
import type { IUserEntity } from "../domain/users.entities"

function mapUserToResponse(user: IUserEntity): IUserResponse {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    email_verified: user.email_verified,
    role: user.role,
    phone: user.phone || undefined,
    image: user.image || undefined,
    created_at: user.created_at instanceof Date ? user.created_at : new Date(user.created_at),
    updated_at: user.updated_at instanceof Date ? user.updated_at : new Date(user.updated_at),
  }
}

export const createUserService = (repository: IUserRepository) => ({
  list: async (params?: { search?: string; page?: number; limit?: number }): Promise<IUserListResponse> => {
    const result = await repository.findAll(params)
    return {
      users: result.users.map(mapUserToResponse),
      total: result.total,
      page: result.page,
      limit: result.limit,
    }
  },

  getById: async (id: string): Promise<IUserResponse> => {
    const user = await repository.findById(id)
    if (!user) throw new NotFoundError("User not found")
    return mapUserToResponse(user)
  },

  create: async (data: CreateUserData): Promise<IUserResponse> => {
    const existing = await repository.findByEmail(data.email)
    if (existing) throw new ConflictError("A user with this email already exists")
    const hashed = await hashPassword(data.password)
    const user = await repository.create({ ...data, password: hashed })
    return mapUserToResponse(user)
  },

  update: async (id: string, data: UpdateUserData): Promise<IUserResponse> => {
    const existing = await repository.findById(id)
    if (!existing) throw new NotFoundError("User not found")
    if (data.email && data.email !== existing.email) {
      const duplicate = await repository.findByEmail(data.email)
      if (duplicate) throw new ConflictError("A user with this email already exists")
    }
    const user = await repository.update(id, data)
    return mapUserToResponse(user)
  },

  delete: async (id: string): Promise<void> => {
    const existing = await repository.findById(id)
    if (!existing) throw new NotFoundError("User not found")
    await repository.softDelete(id)
  },
})
```

### 24.5 `presentation/users.controller.ts`

```typescript
import type { FastifyReply, FastifyRequest } from "fastify"
import { createUserService } from "../application/users.service"
import { UserRepository } from "../infrastructure/users.prisma.repository"
import { CreateUserDtoSchema, UpdateUserDtoSchema, UserQuerySchema } from "./users.dto"

const userService = createUserService(UserRepository)

export const usersController = {
  list: async (request: FastifyRequest, reply: FastifyReply) => {
    const query = UserQuerySchema.parse(request.query)
    const result = await userService.list(query)
    return reply.status(200).send(result)
  },

  getById: async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string }
    const result = await userService.getById(id)
    return reply.status(200).send(result)
  },

  create: async (request: FastifyRequest, reply: FastifyReply) => {
    const data = CreateUserDtoSchema.parse(request.body)
    const result = await userService.create(data)
    return reply.status(201).send(result)
  },

  update: async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string }
    const data = UpdateUserDtoSchema.parse(request.body)
    const result = await userService.update(id, data)
    return reply.status(200).send(result)
  },

  delete: async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string }
    const currentUserId = request.userId
    if (id === currentUserId) {
      return reply.status(400).send({ message: "You cannot delete your own account" })
    }
    await userService.delete(id)
    return reply.status(200).send({ message: "User deleted successfully" })
  },
}
```

### 24.6 `presentation/users.routes.ts`

```typescript
import type { FastifyInstance, FastifyPluginOptions } from "fastify"
import { usersController } from "./users.controller"
import { authGuard, adminGuard } from "@/core/guard/auth.guard"
import { toJsonSchema } from "@/presentation/swagger-schema"
import { CreateUserDtoSchema, UpdateUserDtoSchema, UserQuerySchema } from "./users.dto"

const TAGS = ["Users"]

export const usersRoutes = async (fastify: FastifyInstance, _opts: FastifyPluginOptions) => {
  fastify.get("/", {
    schema: { tags: TAGS, querystring: toJsonSchema(UserQuerySchema) },
    preHandler: [authGuard, adminGuard],
  }, usersController.list)

  fastify.get("/:id", {
    schema: { tags: TAGS },
    preHandler: [authGuard, adminGuard],
  }, usersController.getById)

  fastify.post("/", {
    schema: { tags: TAGS, body: toJsonSchema(CreateUserDtoSchema) },
    preHandler: [authGuard, adminGuard],
  }, usersController.create)

  fastify.put("/:id", {
    schema: { tags: TAGS, body: toJsonSchema(UpdateUserDtoSchema) },
    preHandler: [authGuard, adminGuard],
  }, usersController.update)

  fastify.delete("/:id", {
    schema: { tags: TAGS },
    preHandler: [authGuard, adminGuard],
  }, usersController.delete)
}
```

### 24.7 `presentation/users.dto.ts`

```typescript
import { z } from "zod"

export const CreateUserDtoSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["admin", "cajero"]).optional(),
  phone: z.string().optional(),
})

export const UpdateUserDtoSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  role: z.enum(["admin", "cajero"]).optional(),
  phone: z.string().optional(),
})

export const UserQuerySchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(50),
})

export type CreateUserDto = z.infer<typeof CreateUserDtoSchema>
export type UpdateUserDto = z.infer<typeof UpdateUserDtoSchema>
```

### 24.8 `infrastructure/users.prisma.repository.ts`

```typescript
import { prisma } from "@/config/prisma"
import type { IUserRepository } from "../domain/users.interface"
import type { IUserEntity, CreateUserData, UpdateUserData } from "../domain/users.entities"
import { Prisma } from "@prisma/client"

const userSelect = {
  id: true, name: true, email: true, email_verified: true,
  role: true, phone: true, image: true,
  created_at: true, updated_at: true, deleted_at: true,
} as const

type UserRecord = Prisma.userGetPayload<{ select: typeof userSelect }>

function mapToEntity(user: UserRecord): IUserEntity {
  return {
    id: user.id, name: user.name, email: user.email,
    email_verified: user.email_verified, role: user.role,
    phone: user.phone ?? null, image: user.image ?? null,
    created_at: user.created_at, updated_at: user.updated_at,
    deleted_at: user.deleted_at ?? null,
  }
}

export const UserRepository: IUserRepository = {
  async findAll(params) {
    const where: Prisma.userWhereInput = { deleted_at: null }
    if (params?.search) {
      where.OR = [
        { name: { contains: params.search, mode: "insensitive" } },
        { email: { contains: params.search, mode: "insensitive" } },
      ]
    }
    const page = params?.page || 1
    const limit = params?.limit || 50
    const skip = (page - 1) * limit
    const [users, total] = await Promise.all([
      prisma.user.findMany({ where, select: userSelect, skip, take: limit, orderBy: { name: "asc" } }),
      prisma.user.count({ where }),
    ])
    return { users: users.map(mapToEntity), total, page, limit }
  },

  async findById(id: string) {
    const user = await prisma.user.findFirst({ where: { id, deleted_at: null }, select: userSelect })
    return user ? mapToEntity(user) : null
  },

  async findByEmail(email: string) {
    const user = await prisma.user.findFirst({ where: { email }, select: userSelect })
    return user ? mapToEntity(user) : null
  },

  async create(data: CreateUserData) {
    const { password, ...rest } = data
    const user = await prisma.user.create({
      data: { ...rest, email_verified: true },
      select: userSelect,
    })
    await prisma.account.create({
      data: { account_id: user.id, provider_id: "credentials", user_id: user.id, password },
    })
    return mapToEntity(user)
  },

  async update(id: string, data: UpdateUserData) {
    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.role !== undefined && { role: data.role }),
        ...(data.phone !== undefined && { phone: data.phone }),
      },
      select: userSelect,
    })
    return mapToEntity(user)
  },

  async softDelete(id: string) {
    await prisma.user.update({ where: { id }, data: { deleted_at: new Date() } })
  },

  async updatePassword(id: string, hashedPassword: string) {
    await prisma.account.updateMany({
      where: { user_id: id },
      data: { password: hashedPassword },
    })
  },
}
```

---

## 25. Módulo `products` — Productos y categorías

### 25.1 `domain/products.types.ts`

```typescript
export interface IProductCategory {
  id: string; name: string
}

export interface IProductResponse {
  id: string; barcode?: string; name: string; unit_type?: string; unit_quantity?: number
  category?: IProductCategory; supplier?: { id: string; name: string } | null
  price: number; cost: number; tax_rate: number; stock: number; low_stock_threshold: number
  active: boolean; created_at: string; updated_at: string
}

export interface IProductListResponse {
  products: IProductResponse[]; total: number; page: number; limit: number
}

export interface IProductQueryParams {
  search?: string; category_id?: string; active?: boolean; low_stock?: boolean; out_of_stock?: boolean
  page?: number; limit?: number
}
```

### 25.2 `domain/products.entities.ts`

```typescript
import type { Decimal } from "@prisma/client/runtime/library"

export interface IProductEntity {
  id: string; barcode?: string; name: string; unit_type?: string; unit_quantity?: number
  category_id?: string; category_name?: string; supplier_id?: string
  price: Decimal; cost: Decimal; tax_rate: Decimal
  stock: number; low_stock_threshold: number; active: boolean
  created_at: Date; updated_at: Date; deleted_at?: Date
}

export type CreateProductData = {
  barcode?: string; name: string; unit_type?: string; unit_quantity?: number
  category_id?: string; supplier_id?: string; price: number; cost?: number; tax_rate?: number
  stock?: number; low_stock_threshold?: number; active?: boolean
}

export type UpdateProductData = Partial<CreateProductData>
```

### 25.3 `domain/products.interface.ts`

```typescript
export interface IProductRepository {
  findAll(params?: { search?; category_id?; active?; lowStock?; outOfStock?; page?; limit? }): Promise<{ products: IProductEntity[]; total: number; page: number; limit: number }>
  findById(id: string): Promise<IProductEntity | null>
  findByBarcode(barcode: string): Promise<IProductEntity | null>
  create(data: CreateProductData): Promise<IProductEntity>
  update(id: string, data: UpdateProductData): Promise<IProductEntity>
  softDelete(id: string): Promise<void>
  updateStock(id: string, quantity: number): Promise<IProductEntity>
}
```

### 25.4 `application/products.service.ts`

```typescript
import { NotFoundError, ConflictError } from "@/core/errors/AppError"
import type { IProductRepository } from "../domain/products.interface"
import type { IProductResponse, IProductListResponse } from "../domain/products.types"
import type { CreateProductData, UpdateProductData, IProductEntity } from "../domain/products.entities"

interface RichProductEntity extends IProductEntity {
  category?: { id: string; name: string } | null
  supplier?: { id: string; name: string } | null
}

function mapProductToResponse(product: RichProductEntity): IProductResponse {
  return {
    id: product.id, barcode: product.barcode || undefined, name: product.name,
    unit_type: product.unit_type || undefined, unit_quantity: product.unit_quantity ?? undefined,
    category: product.category ? { id: product.category.id, name: product.category.name } : undefined,
    supplier: product.supplier ? { id: product.supplier.id, name: product.supplier.name } : undefined,
    price: Number(product.price), cost: Number(product.cost), tax_rate: Number(product.tax_rate),
    stock: product.stock, low_stock_threshold: product.low_stock_threshold,
    active: product.active,
    created_at: product.created_at instanceof Date ? product.created_at.toISOString() : product.created_at,
    updated_at: product.updated_at instanceof Date ? product.updated_at.toISOString() : product.updated_at,
  }
}

export const createProductService = (repository: IProductRepository) => ({
  list: async (params?) => {
    const result = await repository.findAll(params)
    return { products: result.products.map(mapProductToResponse), total: result.total, page: result.page, limit: result.limit }
  },

  getById: async (id: string) => {
    const product = await repository.findById(id)
    if (!product || product.deleted_at) throw new NotFoundError("Product not found")
    return mapProductToResponse(product)
  },

  getByBarcode: async (barcode: string) => {
    const product = await repository.findByBarcode(barcode)
    if (!product || product.deleted_at) return null
    return mapProductToResponse(product)
  },

  create: async (data: CreateProductData) => {
    if (data.barcode) {
      const existing = await repository.findByBarcode(data.barcode)
      if (existing) throw new ConflictError("A product with this barcode already exists")
    }
    const product = await repository.create(data)
    return mapProductToResponse(product)
  },

  update: async (id: string, data: UpdateProductData) => {
    const existing = await repository.findById(id)
    if (!existing || existing.deleted_at) throw new NotFoundError("Product not found")
    if (data.barcode && data.barcode !== existing.barcode) {
      const duplicate = await repository.findByBarcode(data.barcode)
      if (duplicate && duplicate.id !== id) throw new ConflictError("A product with this barcode already exists")
    }
    const product = await repository.update(id, data)
    return mapProductToResponse(product)
  },

  delete: async (id: string) => {
    const existing = await repository.findById(id)
    if (!existing || existing.deleted_at) throw new NotFoundError("Product not found")
    await repository.softDelete(id)
  }
})
```

### 25.5 `presentation/products.controller.ts`

```typescript
import type { FastifyReply, FastifyRequest } from "fastify"
import { createProductService } from "../application/products.service"
import { ProductRepository } from "../infrastructure/products.prisma.repository"
import type { UpdateProductData } from "../domain/products.entities"
import { CreateProductDtoSchema, UpdateProductDtoSchema, ProductQuerySchema } from "./products.dto"

const productService = createProductService(ProductRepository)

export const productsController = {
  list: async (request: FastifyRequest, reply: FastifyReply) => {
    const query = ProductQuerySchema.parse(request.query)
    const result = await productService.list({
      search: query.search, category_id: query.category_id, active: query.active,
      lowStock: query.low_stock, outOfStock: query.out_of_stock, page: query.page, limit: query.limit,
    })
    return reply.status(200).send(result)
  },

  getById: async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string }
    const result = await productService.getById(id)
    return reply.status(200).send(result)
  },

  getByBarcode: async (request: FastifyRequest, reply: FastifyReply) => {
    const { barcode } = request.params as { barcode: string }
    const result = await productService.getByBarcode(barcode)
    if (!result) return reply.status(404).send({ message: "Product not found" })
    return reply.status(200).send(result)
  },

  create: async (request: FastifyRequest, reply: FastifyReply) => {
    const data = CreateProductDtoSchema.parse(request.body)
    const result = await productService.create(data)
    return reply.status(201).send(result)
  },

  update: async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string }
    const data = UpdateProductDtoSchema.parse(request.body)
    const result = await productService.update(id, data as UpdateProductData)
    return reply.status(200).send(result)
  },

  delete: async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string }
    await productService.delete(id)
    return reply.status(200).send({ message: "Product deleted successfully" })
  },
}
```

### 25.6 `presentation/products.dto.ts`

```typescript
import { z } from "zod"

export const CreateProductDtoSchema = z.object({
  barcode: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  unit_type: z.enum(["unidad","paquete","caja","bolsa","botella","lata","sobre","barra","rollo","galon","ristra"]).optional(),
  unit_quantity: z.number().int().positive().optional(),
  category_id: z.string().uuid().optional(),
  supplier_id: z.string().uuid().optional(),
  price: z.number().positive("Price must be positive"),
  cost: z.number().min(0).optional(),
  tax_rate: z.number().min(0).max(100).optional(),
  stock: z.number().int().min(0).optional(),
  low_stock_threshold: z.number().int().min(0).optional(),
  active: z.boolean().optional(),
})

export const UpdateProductDtoSchema = z.object({
  barcode: z.string().optional(),
  name: z.string().min(1).optional(),
  unit_type: z.enum([...]).optional().nullable(),
  unit_quantity: z.number().int().positive().optional().nullable(),
  category_id: z.string().uuid().optional().nullable(),
  supplier_id: z.string().uuid().optional().nullable(),
  price: z.number().positive().optional(),
  cost: z.number().min(0).optional(),
  tax_rate: z.number().min(0).max(100).optional(),
  stock: z.number().int().min(0).optional(),
  low_stock_threshold: z.number().int().min(0).optional(),
  active: z.boolean().optional(),
})

export const ProductQuerySchema = z.object({
  search: z.string().optional(),
  category_id: z.string().optional(),
  active: z.coerce.boolean().optional(),
  low_stock: z.coerce.boolean().optional(),
  out_of_stock: z.coerce.boolean().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
})
```

### 25.7 `presentation/products.routes.ts`

```typescript
import type { FastifyInstance, FastifyPluginOptions } from "fastify"
import { productsController } from "./products.controller"
import { authGuard } from "@/core/guard/auth.guard"
import { toJsonSchema } from "@/presentation/swagger-schema"
import { CreateProductDtoSchema, UpdateProductDtoSchema, ProductQuerySchema } from "./products.dto"

const TAGS = ["Products"]

export const productsRoutes = async (fastify: FastifyInstance, _opts: FastifyPluginOptions) => {
  fastify.get("/", { schema: { tags: TAGS, querystring: toJsonSchema(ProductQuerySchema) }, preHandler: [authGuard] }, productsController.list)
  fastify.get("/barcode/:barcode", { schema: { tags: TAGS, params: { type: "object", properties: { barcode: { type: "string" } }, required: ["barcode"] } }, preHandler: [authGuard] }, productsController.getByBarcode)
  fastify.get("/:id", { schema: { tags: TAGS }, preHandler: [authGuard] }, productsController.getById)
  fastify.post("/", { schema: { tags: TAGS, body: toJsonSchema(CreateProductDtoSchema) }, preHandler: [authGuard] }, productsController.create)
  fastify.put("/:id", { schema: { tags: TAGS, body: toJsonSchema(UpdateProductDtoSchema) }, preHandler: [authGuard] }, productsController.update)
  fastify.delete("/:id", { schema: { tags: TAGS }, preHandler: [authGuard] }, productsController.delete)
}
```

### 25.8 `presentation/categories.controller.ts` y `categories.routes.ts`

```typescript
// categories.controller.ts
import type { FastifyReply, FastifyRequest } from "fastify"
import { prisma } from "@/config/prisma"

export const categoriesController = {
  list: async (_request: FastifyRequest, reply: FastifyReply) => {
    const categories = await prisma.category.findMany({
      where: { deleted_at: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true, description: true },
    })
    return reply.status(200).send(categories)
  },
}

// categories.routes.ts
import type { FastifyInstance, FastifyPluginOptions } from "fastify"
import { categoriesController } from "./categories.controller"

const TAGS = ["Categories"]

export const categoriesRoutes = async (fastify: FastifyInstance, _opts: FastifyPluginOptions) => {
  fastify.get("/", { schema: { tags: TAGS } }, categoriesController.list)
}
```

### 25.9 `infrastructure/products.prisma.repository.ts`

```typescript
import { prisma } from "@/config/prisma"
import type { IProductRepository } from "../domain/products.interface"
import type { IProductEntity, CreateProductData, UpdateProductData } from "../domain/products.entities"
import { Prisma, type UNIT_TYPE } from "@prisma/client"

const productSelect = {
  id: true, barcode: true, name: true, unit_type: true, unit_quantity: true,
  category_id: true, supplier_id: true, price: true, cost: true, tax_rate: true,
  stock: true, low_stock_threshold: true, active: true,
  created_at: true, updated_at: true, deleted_at: true,
  category: { select: { id: true, name: true } },
  supplier: { select: { id: true, name: true } },
}

type ProductRecord = Prisma.productGetPayload<{ select: typeof productSelect }>

function mapToEntity(product: ProductRecord): IProductEntity {
  return {
    id: product.id, barcode: product.barcode || undefined, name: product.name,
    unit_type: product.unit_type || undefined, unit_quantity: product.unit_quantity ?? undefined,
    category_id: product.category_id || undefined, category_name: product.category?.name || undefined,
    supplier_id: product.supplier_id || undefined,
    price: product.price, cost: product.cost, tax_rate: product.tax_rate,
    stock: product.stock, low_stock_threshold: product.low_stock_threshold,
    active: product.active, created_at: product.created_at, updated_at: product.updated_at,
    deleted_at: product.deleted_at || undefined,
  }
}

export const ProductRepository: IProductRepository = {
  async findAll(params) {
    const where: Prisma.productWhereInput = { deleted_at: null }
    if (params?.search) {
      where.OR = [
        { name: { contains: params.search, mode: "insensitive" } },
        { barcode: { contains: params.search, mode: "insensitive" } },
        { category: { name: { contains: params.search, mode: "insensitive" } } },
      ]
    }
    if (params?.category_id) where.category_id = params.category_id
    if (params?.active !== undefined) where.active = params.active
    if (params?.lowStock) where.stock = { lte: prisma.product.fields.low_stock_threshold }
    if (params?.outOfStock) where.stock = { lte: 0 }

    const page = params?.page || 1; const limit = params?.limit || 50; const skip = (page - 1) * limit
    const [products, total] = await Promise.all([
      prisma.product.findMany({ where, select: productSelect, skip, take: limit, orderBy: { name: "asc" } }),
      prisma.product.count({ where }),
    ])
    return { products: products.map(mapToEntity), total, page, limit }
  },

  async findById(id: string) {
    const product = await prisma.product.findFirst({ where: { id, deleted_at: null }, select: productSelect })
    return product ? mapToEntity(product) : null
  },

  async findByBarcode(barcode: string) {
    const product = await prisma.product.findFirst({ where: { barcode, deleted_at: null }, select: productSelect })
    return product ? mapToEntity(product) : null
  },

  async create(data: CreateProductData) {
    const product = await prisma.product.create({
      data: { barcode: data.barcode, name: data.name, unit_type: data.unit_type as UNIT_TYPE | null,
        unit_quantity: data.unit_quantity, category_id: data.category_id, supplier_id: data.supplier_id,
        price: data.price, cost: data.cost ?? 0, tax_rate: data.tax_rate ?? 0,
        stock: data.stock ?? 0, low_stock_threshold: data.low_stock_threshold ?? 5, active: data.active ?? true },
      select: productSelect,
    })
    return mapToEntity(product)
  },

  async update(id: string, data: UpdateProductData) {
    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(data.barcode !== undefined && { barcode: data.barcode }),
        ...(data.name !== undefined && { name: data.name }),
        ...(data.unit_type !== undefined && { unit_type: data.unit_type as UNIT_TYPE | null }),
        ...(data.unit_quantity !== undefined && { unit_quantity: data.unit_quantity }),
        ...(data.category_id !== undefined && { category_id: data.category_id }),
        ...(data.supplier_id !== undefined && { supplier_id: data.supplier_id }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.cost !== undefined && { cost: data.cost }),
        ...(data.tax_rate !== undefined && { tax_rate: data.tax_rate }),
        ...(data.stock !== undefined && { stock: data.stock }),
        ...(data.low_stock_threshold !== undefined && { low_stock_threshold: data.low_stock_threshold }),
        ...(data.active !== undefined && { active: data.active }),
      },
      select: productSelect,
    })
    return mapToEntity(product)
  },

  async softDelete(id: string) {
    await prisma.product.update({ where: { id }, data: { deleted_at: new Date() } })
  },

  async updateStock(id: string, quantity: number) {
    const product = await prisma.product.update({
      where: { id },
      data: { stock: { increment: quantity } },
      select: productSelect,
    })
    return mapToEntity(product)
  },
}
```

---

## 26. Módulo `services`

### 26.1 `domain/services.types.ts`, `domain/services.entities.ts`, `domain/services.interface.ts`

```typescript
// services.types.ts
export interface IServiceProductResponse { id: string; product_id: string; product_name: string; product_price: number; quantity: number }
export interface IServiceResponse { id: string; name: string; description?: string; base_price: number; is_active: boolean; products: IServiceProductResponse[]; created_at: string; updated_at: string }
export interface IServiceListResponse { services: IServiceResponse[]; total: number; page: number; limit: number }

// services.entities.ts
export interface IServiceEntity { id: string; name: string; description?: string; base_price: Decimal; is_active: boolean; created_at: Date; updated_at: Date; deleted_at?: Date; service_products?: IServiceProductEntity[] }
export interface IServiceProductEntity { id: string; service_id: string; product_id: string; quantity: number; product?: { id: string; name: string; price: Decimal } }
export type CreateServiceData = { name: string; description?: string; base_price: number; is_active?: boolean; products?: { product_id: string; quantity: number }[] }
export type UpdateServiceData = { name?: string; description?: string | null; base_price?: number; is_active?: boolean; products?: { product_id: string; quantity: number }[] }

// services.interface.ts
export interface IServiceRepository {
  findAll(params?): Promise<{ services: IServiceEntity[]; total: number; page: number; limit: number }>
  findById(id: string): Promise<IServiceEntity | null>
  create(data: CreateServiceData): Promise<IServiceEntity>
  update(id: string, data: UpdateServiceData): Promise<IServiceEntity>
  softDelete(id: string): Promise<void>
}
```

### 26.2 `application/services.service.ts`

```typescript
import { NotFoundError } from "@/core/errors/AppError"
import type { IServiceRepository } from "../domain/services.interface"
import type { IServiceResponse, IServiceListResponse } from "../domain/services.types"
import type { CreateServiceData, UpdateServiceData } from "../domain/services.entities"

function mapServiceToResponse(service: any): IServiceResponse {
  return {
    id: service.id, name: service.name, description: service.description || undefined,
    base_price: Number(service.base_price), is_active: service.is_active,
    products: (service.service_products || []).map((sp: any) => ({
      id: sp.id, product_id: sp.product_id,
      product_name: sp.product?.name || "Unknown",
      product_price: Number(sp.product?.price || 0), quantity: sp.quantity,
    })),
    created_at: service.created_at instanceof Date ? service.created_at.toISOString() : service.created_at,
    updated_at: service.updated_at instanceof Date ? service.updated_at.toISOString() : service.updated_at,
  }
}

export const createServiceService = (repository: IServiceRepository) => ({
  list: async (params?) => {
    const result = await repository.findAll(params)
    return { services: result.services.map(mapServiceToResponse), total: result.total, page: result.page, limit: result.limit }
  },
  getById: async (id: string) => {
    const service = await repository.findById(id)
    if (!service || service.deleted_at) throw new NotFoundError("Service not found")
    return mapServiceToResponse(service)
  },
  create: async (data: CreateServiceData) => {
    const service = await repository.create(data)
    return mapServiceToResponse(service)
  },
  update: async (id: string, data: UpdateServiceData) => {
    const existing = await repository.findById(id)
    if (!existing || existing.deleted_at) throw new NotFoundError("Service not found")
    const service = await repository.update(id, data)
    return mapServiceToResponse(service)
  },
  delete: async (id: string) => {
    const existing = await repository.findById(id)
    if (!existing || existing.deleted_at) throw new NotFoundError("Service not found")
    await repository.softDelete(id)
  },
})
```

### 26.3 `presentation/services.controller.ts`, `services.routes.ts`, `services.dto.ts` y `infrastructure/services.prisma.repository.ts`

```typescript
// services.controller.ts
import type { FastifyReply, FastifyRequest } from "fastify"
import { createServiceService } from "../application/services.service"
import { ServiceRepository } from "../infrastructure/services.prisma.repository"
import { CreateServiceDtoSchema, UpdateServiceDtoSchema, ServiceQuerySchema } from "./services.dto"

const serviceService = createServiceService(ServiceRepository)

export const servicesController = {
  list: async (request: FastifyRequest, reply: FastifyReply) => {
    const query = ServiceQuerySchema.parse(request.query)
    const result = await serviceService.list(query)
    return reply.status(200).send(result)
  },
  getById: async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string }
    const result = await serviceService.getById(id)
    return reply.status(200).send(result)
  },
  create: async (request: FastifyRequest, reply: FastifyReply) => {
    const data = CreateServiceDtoSchema.parse(request.body)
    const result = await serviceService.create(data)
    return reply.status(201).send(result)
  },
  update: async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string }
    const data = UpdateServiceDtoSchema.parse(request.body)
    const result = await serviceService.update(id, data)
    return reply.status(200).send(result)
  },
  delete: async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string }
    await serviceService.delete(id)
    return reply.status(200).send({ message: "Service deleted successfully" })
  },
}

// services.dto.ts
import { z } from "zod"
export const ServiceProductDtoSchema = z.object({ product_id: z.string().uuid(), quantity: z.number().int().positive() })
export const CreateServiceDtoSchema = z.object({ name: z.string().min(1), description: z.string().optional(), base_price: z.number().positive(), is_active: z.boolean().optional(), products: z.array(ServiceProductDtoSchema).optional() })
export const UpdateServiceDtoSchema = z.object({ name: z.string().min(1).optional(), description: z.string().optional().nullable(), base_price: z.number().positive().optional(), is_active: z.boolean().optional(), products: z.array(ServiceProductDtoSchema).optional() })
export const ServiceQuerySchema = z.object({ search: z.string().optional(), active: z.coerce.boolean().optional(), page: z.coerce.number().int().positive().optional(), limit: z.coerce.number().int().positive().max(100).optional() })
```

```typescript
// services.prisma.repository.ts (completo)
import { prisma } from "@/config/prisma"
import type { IServiceRepository } from "../domain/services.interface"
import type { IServiceEntity, CreateServiceData, UpdateServiceData } from "../domain/services.entities"
import { Prisma } from "@prisma/client"

const serviceSelect = {
  id: true, name: true, description: true, base_price: true, is_active: true,
  created_at: true, updated_at: true, deleted_at: true,
  service_products: {
    select: { id: true, product_id: true, quantity: true, product: { select: { id: true, name: true, price: true } } },
  },
}

type ServiceRecord = Prisma.serviceGetPayload<{ select: typeof serviceSelect }>

function mapToEntity(service: ServiceRecord): IServiceEntity {
  return {
    id: service.id, name: service.name, description: service.description || undefined,
    base_price: service.base_price, is_active: service.is_active,
    created_at: service.created_at, updated_at: service.updated_at, deleted_at: service.deleted_at || undefined,
    service_products: service.service_products?.map(sp => ({
      id: sp.id, service_id: service.id, product_id: sp.product_id, quantity: sp.quantity,
      product: sp.product ? { id: sp.product.id, name: sp.product.name, price: sp.product.price } : undefined,
    })),
  }
}

export const ServiceRepository: IServiceRepository = {
  async findAll(params) {
    const where: Prisma.serviceWhereInput = { deleted_at: null }
    if (params?.search) where.OR = [{ name: { contains: params.search, mode: "insensitive" } }]
    if (params?.active !== undefined) where.is_active = params.active
    const page = params?.page || 1; const limit = params?.limit || 50; const skip = (page - 1) * limit
    const [services, total] = await Promise.all([
      prisma.service.findMany({ where, select: serviceSelect, skip, take: limit, orderBy: { name: "asc" } }),
      prisma.service.count({ where }),
    ])
    return { services: services.map(mapToEntity), total, page, limit }
  },

  async findById(id: string) {
    const service = await prisma.service.findFirst({ where: { id, deleted_at: null }, select: serviceSelect })
    return service ? mapToEntity(service) : null
  },

  async create(data: CreateServiceData) {
    const service = await prisma.service.create({
      data: {
        name: data.name, description: data.description, base_price: data.base_price,
        is_active: data.is_active ?? true,
        ...(data.products && data.products.length > 0
          ? { service_products: { create: data.products.map(p => ({ product_id: p.product_id, quantity: p.quantity })) } }
          : {}),
      },
      select: serviceSelect,
    })
    return mapToEntity(service)
  },

  async update(id: string, data: UpdateServiceData) {
    if (data.products !== undefined) {
      await prisma.service_product.deleteMany({ where: { service_id: id } })
      if (data.products.length > 0) {
        await prisma.service_product.createMany({
          data: data.products.map(p => ({ service_id: id, product_id: p.product_id, quantity: p.quantity })),
        })
      }
    }
    const service = await prisma.service.update({
      where: { id },
      data: { ...(data.name !== undefined && { name: data.name }), ...(data.description !== undefined && { description: data.description }), ...(data.base_price !== undefined && { base_price: data.base_price }), ...(data.is_active !== undefined && { is_active: data.is_active }) },
      select: serviceSelect,
    })
    return mapToEntity(service)
  },

  async softDelete(id: string) {
    await prisma.service.update({ where: { id }, data: { deleted_at: new Date() } })
  },
}
```

## 27. Módulo `sales` — Ventas

### 27.1 `domain/sales.types.ts`

```typescript
export interface ISaleItemResponse {
  id: string; product_id: string; product_name: string; quantity: number
  unit_price: number; tax_rate: number; line_total: number
}

export interface ISaleServiceProductResponse {
  id: string; product_id: string; product_name: string; quantity: number
  unit_price: number; line_total: number; affects_price: boolean
}

export interface ISaleServiceResponse {
  id: string; service_id: string; service_name: string; base_price: number; line_total: number
  products: ISaleServiceProductResponse[]
}

export interface ISaleResponse {
  id: string; subtotal: number; tax_total: number; discount: number; total: number
  payment_method: string; amount_received?: number; change_given?: number
  user_id: string; created_at: string
  items?: ISaleItemResponse[]; service_items?: ISaleServiceResponse[]
}

export interface ISaleListResponse { sales: ISaleResponse[]; total: number; page: number; limit: number }

export interface ISaleReport {
  total_sales: number; total_revenue: number; total_tax: number; total_discount: number; average_ticket: number
  sales_by_payment_method: Record<string, number>
  top_products: { product_name: string; quantity: number; revenue: number }[]
}

export interface ISaleQueryParams { start_date?: string; end_date?: string; user_id?: string; payment_method?: string; page?: number; limit?: number }
export interface IRevenueTrendItem { date: string; revenue: number }
export type GroupBy = "day" | "week" | "month"
export interface IRevenueTrendQuery { start_date: string; end_date: string; group_by: GroupBy }
```

### 27.2 `domain/sales.entities.ts`

```typescript
import type { Decimal } from "@prisma/client/runtime/library"
export interface ISaleEntity { id: string; subtotal: Decimal; tax_total: Decimal; discount: Decimal; total: Decimal; payment_method: string; amount_received?: Decimal; change_given?: Decimal; user_id: string; created_at: Date; updated_at: Date; items?: ISaleItemEntity[]; service_items?: ISaleServiceEntity[] }
export interface ISaleItemEntity { id: string; sale_id: string; product_id: string; product_name: string; quantity: number; unit_price: Decimal; tax_rate: Decimal; line_total: Decimal; created_at: Date; updated_at: Date }
export type CreateSaleItemData = { product_id: string; product_name: string; quantity: number; unit_price: number; tax_rate: number; line_total: number }
export interface ISaleServiceEntity { id: string; sale_id: string; service_id: string; service_name: string; base_price: Decimal; line_total: Decimal; created_at: Date; products?: ISaleServiceProductEntity[] }
export interface ISaleServiceProductEntity { id: string; sale_service_id: string; product_id: string; product_name: string; quantity: number; unit_price: Decimal; line_total: Decimal; affects_price: boolean; created_at: Date }
export type CreateSaleServiceItemProductData = { product_id: string; product_name: string; quantity: number; unit_price: number; line_total: number; affects_price?: boolean }
export type CreateSaleServiceItemData = { service_id: string; service_name: string; base_price: number; line_total: number; products?: CreateSaleServiceItemProductData[] }
export type CreateSaleData = { subtotal: number; tax_total: number; discount: number; total: number; payment_method: string; amount_received?: number; change_given?: number; user_id: string; items: CreateSaleItemData[]; service_items?: CreateSaleServiceItemData[] }
```

### 27.3 `domain/sales.interface.ts`

```typescript
export interface ISaleRepository {
  create(data: CreateSaleData, serviceProductsToDeduct?: { product_id: string; quantity: number }[], customServiceProducts?: Map<string, CreateSaleServiceItemProductData[]>): Promise<ISaleEntity>
  findById(id: string): Promise<ISaleEntity | null>
  findAll(params?: { startDate?: Date; endDate?: Date; userId?: string; paymentMethod?: string; page?: number; limit?: number }): Promise<{ sales: ISaleEntity[]; total: number }>
  getReport(params?: { startDate?: Date; endDate?: Date }): Promise<{ totalSales: number; totalRevenue: number; totalTax: number; totalDiscount: number; averageTicket: number; salesByPaymentMethod: Record<string, number>; topProducts: { productName: string; quantity: number; revenue: number }[] }>
  getRevenueTrend(params: { startDate: Date; endDate: Date; groupBy: "day" | "week" | "month" }): Promise<{ date: string; revenue: number }[]>
}
```

### 27.4 `application/sales.service.ts`

```typescript
import { NotFoundError, BadRequestError } from "@/core/errors/AppError"
import { prisma } from "@/config/prisma"
import type { ISaleRepository } from "../domain/sales.interface"
import type { ISaleResponse, ISaleListResponse, ISaleReport, IRevenueTrendItem, IRevenueTrendQuery } from "../domain/sales.types"
import type { CreateSaleData } from "../domain/sales.entities"

function mapSaleToResponse(sale: any): ISaleResponse {
  return {
    id: sale.id, subtotal: Number(sale.subtotal), tax_total: Number(sale.tax_total),
    discount: Number(sale.discount), total: Number(sale.total),
    payment_method: sale.payment_method,
    amount_received: sale.amount_received ? Number(sale.amount_received) : undefined,
    change_given: sale.change_given ? Number(sale.change_given) : undefined,
    user_id: sale.user_id,
    created_at: sale.created_at instanceof Date ? sale.created_at.toISOString() : sale.created_at,
    items: sale.items?.map((item: any) => ({
      id: item.id, product_id: item.product_id, product_name: item.product_name,
      quantity: item.quantity, unit_price: Number(item.unit_price),
      tax_rate: Number(item.tax_rate), line_total: Number(item.line_total),
    })),
    service_items: sale.service_items?.map((si: any) => ({
      id: si.id, service_id: si.service_id, service_name: si.service_name,
      base_price: Number(si.base_price), line_total: Number(si.line_total),
      products: si.products?.map((sp: any) => ({
        id: sp.id, product_id: sp.product_id, product_name: sp.product_name,
        quantity: sp.quantity, unit_price: Number(sp.unit_price),
        line_total: Number(sp.line_total), affects_price: sp.affects_price ?? false,
      })) || [],
    })),
  }
}

export const createSaleService = (repository: ISaleRepository) => ({
  create: async (data: CreateSaleData): Promise<ISaleResponse> => {
    const productQtyMap = new Map<string, { name: string; price: number; quantity: number; stock: number }>()
    let serviceProductsToDeduct: { product_id: string; quantity: number }[] = []
    let customServiceProducts: Map<string, any[]> | undefined

    if (data.items && data.items.length > 0) {
      const productIds = data.items.map((i) => i.product_id)
      const dbProducts = await prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, name: true, price: true, stock: true } })
      const dbProductMap = new Map(dbProducts.map((p) => [p.id, p]))
      for (const item of data.items) {
        const dbProd = dbProductMap.get(item.product_id)
        if (!dbProd) throw new NotFoundError(`Product ${item.product_id} not found`)
        const existing = productQtyMap.get(item.product_id) || { name: dbProd.name, price: Number(dbProd.price), quantity: 0, stock: dbProd.stock }
        existing.quantity += item.quantity
        productQtyMap.set(item.product_id, existing)
      }
    }

    if (data.service_items && data.service_items.length > 0) {
      customServiceProducts = new Map()
      const itemsWithCustom = data.service_items.filter((si) => si.products && si.products.length > 0)
      const itemsWithoutCustom = data.service_items.filter((si) => !si.products || si.products.length === 0)

      if (itemsWithCustom.length > 0) {
        const ids = itemsWithCustom.flatMap((si) => si.products!.map((sp) => sp.product_id))
        const db = await prisma.product.findMany({ where: { id: { in: ids } }, select: { id: true, name: true, price: true, stock: true } })
        const dbMap = new Map(db.map((p) => [p.id, p]))
        for (const si of itemsWithCustom) {
          const sps: any[] = []
          for (const sp of si.products!) {
            const dbProd = dbMap.get(sp.product_id)
            if (!dbProd) throw new NotFoundError(`Product ${sp.product_id} not found`)
            const existing = productQtyMap.get(sp.product_id) || { name: dbProd.name, price: Number(dbProd.price), quantity: 0, stock: dbProd.stock }
            existing.quantity += sp.quantity; productQtyMap.set(sp.product_id, existing); sps.push(sp)
          }
          customServiceProducts.set(si.service_id, sps)
        }
      }

      if (itemsWithoutCustom.length > 0) {
        const sps = await prisma.service_product.findMany({
          where: { service_id: { in: itemsWithoutCustom.map((si) => si.service_id) } },
          include: { product: { select: { id: true, name: true, price: true, stock: true } } },
        })
        for (const sp of sps) {
          const existing = productQtyMap.get(sp.product_id) || { name: sp.product.name, price: Number(sp.product.price), quantity: 0, stock: sp.product.stock }
          existing.quantity += sp.quantity; productQtyMap.set(sp.product_id, existing)
        }
      }

      if (productQtyMap.size === 0) throw new BadRequestError("No products found for the selected services")
      serviceProductsToDeduct = Array.from(productQtyMap.entries()).map(([product_id, info]) => ({ product_id, quantity: info.quantity }))
    }

    if (productQtyMap.size > 0) {
      const insufficient: string[] = []
      for (const [, info] of productQtyMap) { if (info.stock < info.quantity) insufficient.push(`${info.name} (${info.stock}/${info.quantity})`) }
      if (insufficient.length > 0) throw new BadRequestError(`Insufficient stock: ${insufficient.join(", ")}`)
    }

    const sale = await repository.create(data, serviceProductsToDeduct, customServiceProducts)
    return mapSaleToResponse(sale)
  },

  getById: async (id: string) => {
    const sale = await repository.findById(id)
    if (!sale) throw new NotFoundError("Sale not found")
    return mapSaleToResponse(sale)
  },

  list: async (params?: any) => {
    const result = await repository.findAll({
      startDate: params?.start_date ? new Date(params.start_date) : undefined,
      endDate: params?.end_date ? new Date(params.end_date) : undefined,
      userId: params?.user_id, paymentMethod: params?.payment_method,
      page: params?.page, limit: params?.limit,
    })
    return { sales: result.sales.map(mapSaleToResponse), total: result.total, page: params?.page || 1, limit: params?.limit || 50 }
  },

  getReport: async (params?: any) => {
    const r = await repository.getReport({ startDate: params?.start_date ? new Date(params.start_date) : undefined, endDate: params?.end_date ? new Date(params.end_date) : undefined })
    return { total_sales: r.totalSales, total_revenue: r.totalRevenue, total_tax: r.totalTax, total_discount: r.totalDiscount, average_ticket: r.averageTicket, sales_by_payment_method: r.salesByPaymentMethod, top_products: r.topProducts.map(p => ({ product_name: p.productName, quantity: p.quantity, revenue: p.revenue })) }
  },

  getRevenueTrend: async (params: IRevenueTrendQuery) => {
    return await repository.getRevenueTrend({ startDate: new Date(params.start_date), endDate: new Date(params.end_date), groupBy: params.group_by })
  },
})
```

### 27.5 `infrastructure/sales.prisma.repository.ts`

```typescript
import { prisma } from "@/config/prisma"
import type { ISaleRepository } from "../domain/sales.interface"
import type { ISaleEntity, CreateSaleData, CreateSaleServiceItemProductData } from "../domain/sales.entities"
import { mapPrismaSaleToEntity } from "./mappers/sales.prisma.mappers"

const saleInclude = { items: true, service_items: { include: { product: { select: { id: true, name: true, price: true } } } } } as const

export const SaleRepository: ISaleRepository = {
  async create(data, serviceProductsToDeduct?, customServiceProducts?) {
    const sale = await prisma.$transaction(async (tx) => {
      const created = await tx.sale.create({
        data: {
          subtotal: data.subtotal, tax_total: data.tax_total, discount: data.discount,
          total: data.total, payment_method: data.payment_method,
          amount_received: data.amount_received, change_given: data.change_given, user_id: data.user_id,
          items: { create: data.items.map(i => ({ product_id: i.product_id, product_name: i.product_name, quantity: i.quantity, unit_price: i.unit_price, tax_rate: i.tax_rate, line_total: i.line_total })) },
          ...(data.service_items?.length ? { service_items: { create: data.service_items.map(si => ({ service_id: si.service_id, service_name: si.service_name, base_price: si.base_price, line_total: si.line_total, products: { create: [] } })) } } : {}),
        },
        include: { items: true, service_items: { include: { products: true } } },
      })

      if (data.service_items?.length && created.service_items) {
        const withoutCustom = data.service_items.filter(si => !si.products?.length)
        let autoLookup: any[] = []
        if (withoutCustom.length) {
          autoLookup = await tx.service_product.findMany({ where: { service_id: { in: withoutCustom.map(si => si.service_id) } }, include: { product: { select: { id: true, name: true, price: true } } } })
        }
        for (const ss of created.service_items) {
          const custom = customServiceProducts?.get(ss.service_id)
          if (custom?.length) {
            await tx.sale_service_product.createMany({ data: custom.map((sp: any) => ({ sale_service_id: ss.id, product_id: sp.product_id, product_name: sp.product_name, quantity: sp.quantity, unit_price: sp.unit_price, line_total: sp.line_total, affects_price: sp.affects_price ?? false })) })
          } else {
            const sps = autoLookup.filter(sp => sp.service_id === ss.service_id)
            if (sps.length) {
              await tx.sale_service_product.createMany({ data: sps.map(sp => ({ sale_service_id: ss.id, product_id: sp.product_id, product_name: sp.product.name, quantity: sp.quantity, unit_price: Number(sp.product.price), line_total: Number(sp.product.price) * sp.quantity })) })
            }
          }
        }
      }

      for (const item of data.items) {
        await tx.product.update({ where: { id: item.product_id }, data: { stock: { decrement: item.quantity } } })
        await tx.inventory_movement.create({ data: { product_id: item.product_id, movement_type: "venta", quantity: item.quantity, note: `Venta #${created.id.slice(0, 8)}`, user_id: data.user_id } })
      }
      if (serviceProductsToDeduct) {
        for (const sp of serviceProductsToDeduct) {
          await tx.product.update({ where: { id: sp.product_id }, data: { stock: { decrement: sp.quantity } } })
          await tx.inventory_movement.create({ data: { product_id: sp.product_id, movement_type: "venta", quantity: sp.quantity, note: `Servicio venta #${created.id.slice(0, 8)}`, user_id: data.user_id } })
        }
      }

      return await tx.sale.findUnique({ where: { id: created.id }, include: { items: true, service_items: { include: { products: true } } } })
    })
    return mapPrismaSaleToEntity(sale!)
  },

  async findById(id: string) {
    const sale = await prisma.sale.findUnique({ where: { id }, include: { items: true, service_items: { include: { products: true } } } })
    return sale ? mapPrismaSaleToEntity(sale) : null
  },

  async findAll(params) {
    const where: any = {}
    if (params?.startDate || params?.endDate) where.created_at = { ...(params.startDate && { gte: params.startDate }), ...(params.endDate && { lte: params.endDate }) }
    if (params?.userId) where.user_id = params.userId
    if (params?.paymentMethod) where.payment_method = params.paymentMethod
    const page = params?.page || 1; const limit = params?.limit || 50; const skip = (page - 1) * limit
    const [sales, total] = await Promise.all([
      prisma.sale.findMany({ where, include: { items: true, service_items: { include: { products: true } } }, skip, take: limit, orderBy: { created_at: "desc" } }),
      prisma.sale.count({ where }),
    ])
    return { sales: sales.map(mapPrismaSaleToEntity), total }
  },

  async getReport(params) {
    const where: any = {}
    if (params?.startDate || params?.endDate) where.created_at = { ...(params.startDate && { gte: params.startDate }), ...(params.endDate && { lte: params.endDate }) }
    const sales = await prisma.sale.findMany({ where, include: { items: true, service_items: { include: { products: true } } } })
    const totalSales = sales.length; const totalRevenue = sales.reduce((s, x) => s + Number(x.total), 0)
    const totalTax = sales.reduce((s, x) => s + Number(x.tax_total), 0)
    const totalDiscount = sales.reduce((s, x) => s + Number(x.discount), 0)
    const averageTicket = totalSales > 0 ? totalRevenue / totalSales : 0
    const byMethod: Record<string, number> = {}
    for (const s of sales) byMethod[s.payment_method] = (byMethod[s.payment_method] || 0) + Number(s.total)
    const pmap = new Map<string, { productName: string; quantity: number; revenue: number }>()
    for (const s of sales) {
      for (const i of s.items) { const e = pmap.get(i.product_id) || { productName: i.product_name, quantity: 0, revenue: 0 }; e.quantity += i.quantity; e.revenue += Number(i.line_total); pmap.set(i.product_id, e) }
      if (s.service_items) for (const si of s.service_items) if (si.products) for (const sp of si.products) { const e = pmap.get(sp.product_id) || { productName: sp.product_name, quantity: 0, revenue: 0 }; e.quantity += sp.quantity; e.revenue += Number(sp.line_total); pmap.set(sp.product_id, e) }
    }
    return { totalSales, totalRevenue, totalTax, totalDiscount, averageTicket, salesByPaymentMethod: byMethod, topProducts: Array.from(pmap.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 10) }
  },

  async getRevenueTrend(params) {
    const trunc = { day: "day", week: "week", month: "month" }[params.groupBy]
    const rows = await prisma.$queryRawUnsafe<Array<{ date: Date; revenue: number }>>(
      `SELECT DATE_TRUNC('${trunc}', created_at AT TIME ZONE 'UTC') as date, CAST(SUM(total) AS DECIMAL(10,2)) as revenue FROM sales WHERE created_at >= $1::timestamptz AND created_at <= $2::timestamptz GROUP BY DATE_TRUNC('${trunc}', created_at AT TIME ZONE 'UTC') ORDER BY date ASC`,
      params.startDate, params.endDate,
    )
    return rows.map(r => ({ date: r.date instanceof Date ? r.date.toISOString() : String(r.date), revenue: Number(r.revenue) }))
  },
}
```

### 27.6 `infrastructure/mappers/sales.prisma.mappers.ts`

```typescript
import type { ISaleEntity, ISaleItemEntity, ISaleServiceEntity, ISaleServiceProductEntity } from "../../domain/sales.entities"
import type { sale, sale_item, sale_service, sale_service_product } from "@prisma/client"

export function mapPrismaSaleToEntity(sale: any): ISaleEntity {
  return { id: sale.id, subtotal: sale.subtotal, tax_total: sale.tax_total, discount: sale.discount, total: sale.total, payment_method: sale.payment_method, amount_received: sale.amount_received || undefined, change_given: sale.change_given || undefined, user_id: sale.user_id, created_at: sale.created_at, updated_at: sale.updated_at, items: sale.items?.map(mapPrismaSaleItemToEntity), service_items: sale.service_items?.map(mapPrismaSaleServiceToEntity) }
}
export function mapPrismaSaleItemToEntity(item: sale_item): ISaleItemEntity {
  return { id: item.id, sale_id: item.sale_id, product_id: item.product_id, product_name: item.product_name, quantity: item.quantity, unit_price: item.unit_price, tax_rate: item.tax_rate, line_total: item.line_total, created_at: item.created_at, updated_at: item.updated_at }
}
export function mapPrismaSaleServiceToEntity(si: any): ISaleServiceEntity {
  return { id: si.id, sale_id: si.sale_id, service_id: si.service_id, service_name: si.service_name, base_price: si.base_price, line_total: si.line_total, created_at: si.created_at, products: si.products?.map(mapPrismaSaleServiceProductToEntity) }
}
export function mapPrismaSaleServiceProductToEntity(sp: sale_service_product): ISaleServiceProductEntity {
  return { id: sp.id, sale_service_id: sp.sale_service_id, product_id: sp.product_id, product_name: sp.product_name, quantity: sp.quantity, unit_price: sp.unit_price, line_total: sp.line_total, affects_price: sp.affects_price, created_at: sp.created_at }
}
```

### 27.7 `presentation/sales.controller.ts`

```typescript
import type { FastifyReply, FastifyRequest } from "fastify"
import { createSaleService } from "../application/sales.service"
import { SaleRepository } from "../infrastructure/sales.prisma.repository"
import { CreateSaleDtoSchema, SaleQuerySchema, ReportQuerySchema, RevenueTrendQuerySchema } from "./sales.dto"
import { UnauthorizedError } from "@/core/errors/AppError"

const saleService = createSaleService(SaleRepository)

export const salesController = {
  create: async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.userId; if (!userId) throw new UnauthorizedError("Authentication required")
    const data = CreateSaleDtoSchema.parse(request.body)
    const result = await saleService.create({ ...data, user_id: userId })
    return reply.status(201).send(result)
  },
  getById: async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string }
    const result = await saleService.getById(id)
    return reply.status(200).send(result)
  },
  list: async (request: FastifyRequest, reply: FastifyReply) => {
    const query = SaleQuerySchema.parse(request.query)
    const result = await saleService.list(query)
    return reply.status(200).send(result)
  },
  report: async (request: FastifyRequest, reply: FastifyReply) => {
    const query = ReportQuerySchema.parse(request.query)
    const result = await saleService.getReport(query)
    return reply.status(200).send(result)
  },
  revenueTrend: async (request: FastifyRequest, reply: FastifyReply) => {
    const query = RevenueTrendQuerySchema.parse(request.query)
    const result = await saleService.getRevenueTrend(query)
    return reply.status(200).send(result)
  },
}
```

### 27.8 `presentation/sales.routes.ts`

```typescript
import type { FastifyInstance, FastifyPluginOptions } from "fastify"
import { salesController } from "./sales.controller"
import { authGuard } from "@/core/guard/auth.guard"
import { toJsonSchema } from "@/presentation/swagger-schema"
import { CreateSaleDtoSchema, SaleQuerySchema, ReportQuerySchema, RevenueTrendQuerySchema } from "./sales.dto"

const TAGS = ["Sales"]
export const salesRoutes = async (fastify: FastifyInstance, _opts: FastifyPluginOptions) => {
  fastify.get("/report", { schema: { tags: TAGS, querystring: toJsonSchema(ReportQuerySchema) }, preHandler: [authGuard] }, salesController.report)
  fastify.get("/revenue-trend", { schema: { tags: TAGS, querystring: toJsonSchema(RevenueTrendQuerySchema) }, preHandler: [authGuard] }, salesController.revenueTrend)
  fastify.get("/:id", { schema: { tags: TAGS }, preHandler: [authGuard] }, salesController.getById)
  fastify.get("/", { schema: { tags: TAGS, querystring: toJsonSchema(SaleQuerySchema) }, preHandler: [authGuard] }, salesController.list)
  fastify.post("/", { schema: { tags: TAGS, body: toJsonSchema(CreateSaleDtoSchema) }, preHandler: [authGuard] }, salesController.create)
}
```

### 27.9 `presentation/sales.dto.ts`

```typescript
import { z } from "zod"
export const CreateSaleItemDtoSchema = z.object({ product_id: z.string().uuid(), product_name: z.string().min(1), quantity: z.number().int().positive(), unit_price: z.number().positive(), tax_rate: z.number().min(0), line_total: z.number().positive() })
export const CreateSaleServiceItemProductDtoSchema = z.object({ product_id: z.string().uuid(), product_name: z.string().min(1), quantity: z.number().int().positive(), unit_price: z.number().positive(), line_total: z.number().positive(), affects_price: z.boolean().optional() })
export const CreateSaleServiceItemDtoSchema = z.object({ service_id: z.string().uuid(), service_name: z.string().min(1), base_price: z.number().positive(), line_total: z.number().positive(), products: z.array(CreateSaleServiceItemProductDtoSchema).optional() })
export const CreateSaleDtoSchema = z.object({ subtotal: z.number().positive(), tax_total: z.number().min(0), discount: z.number().min(0), total: z.number().positive(), payment_method: z.enum(["efectivo", "tarjeta", "transferencia", "credito"]), amount_received: z.number().positive().optional(), change_given: z.number().min(0).optional(), items: z.array(CreateSaleItemDtoSchema).optional().default([]), service_items: z.array(CreateSaleServiceItemDtoSchema).optional().default([]) }).refine((data) => data.items.length > 0 || data.service_items!.length > 0, { message: "At least one item or service is required" })
export const SaleQuerySchema = z.object({ start_date: z.string().optional(), end_date: z.string().optional(), user_id: z.string().uuid().optional(), payment_method: z.enum(["efectivo", "tarjeta", "transferencia", "credito"]).optional(), page: z.coerce.number().int().positive().optional(), limit: z.coerce.number().int().positive().max(100).optional() })
export const ReportQuerySchema = z.object({ start_date: z.string().optional(), end_date: z.string().optional() })
export const RevenueTrendQuerySchema = z.object({ start_date: z.string(), end_date: z.string(), group_by: z.enum(["day", "week", "month"]) })
```

---

## 28. Módulo `inventory` — Movimientos individuales

### 28.1 `domain/inventory.types.ts`

```typescript
export interface IInventoryMovementResponse { id: string; product_id: string; product_name?: string; movement_type: string; quantity: number; note?: string; user_id: string; batch_id?: string; created_at: string }
export interface IInventoryMovementListResponse { movements: IInventoryMovementResponse[]; total: number; page: number; limit: number }
export interface IProductStockResponse { product_id: string; product_name: string; current_stock: number; low_stock_threshold: number; is_low_stock: boolean }
```

### 28.2 `domain/inventory.entities.ts`

```typescript
export interface IInventoryMovementEntity { id: string; product_id: string; product_name?: string; movement_type: string; quantity: number; note?: string; user_id: string; batch_id?: string; created_at: Date }
export type CreateMovementData = { product_id: string; movement_type: "entrada" | "salida" | "ajuste"; quantity: number; note?: string; batch_id?: string; user_id: string }
```

### 28.3 `domain/inventory.interface.ts`

```typescript
export interface IInventoryRepository { create(data: CreateMovementData): Promise<IInventoryMovementEntity>; findByProductId(productId: string, params?: { limit?: number }): Promise<IInventoryMovementEntity[]>; findAll(params?: { product_id?: string; movement_type?: string; page?: number; limit?: number }): Promise<{ movements: IInventoryMovementEntity[]; total: number; page: number; limit: number }> }
```

### 28.4 `application/inventory.service.ts`

```typescript
import { NotFoundError, BadRequestError } from "@/core/errors/AppError"
import type { IInventoryRepository } from "../domain/inventory.interface"
import type { IProductRepository } from "../../products/domain/products.interface"
import type { CreateMovementData } from "../domain/inventory.entities"

export const createInventoryService = (movementRepository: IInventoryRepository, productRepository: IProductRepository) => ({
  create: async (data: CreateMovementData) => {
    const product = await productRepository.findById(data.product_id)
    if (!product || product.deleted_at) throw new NotFoundError("Product not found")
    if (data.movement_type === "salida" && product.stock < data.quantity) throw new BadRequestError("Insufficient stock")
    const adj = data.movement_type === "entrada" ? data.quantity : data.movement_type === "salida" ? -data.quantity : data.quantity
    await productRepository.updateStock(data.product_id, adj)
    const m = await movementRepository.create(data)
    return { id: m.id, product_id: m.product_id, product_name: product.name, movement_type: m.movement_type, quantity: m.quantity, note: m.note || undefined, user_id: m.user_id, created_at: m.created_at instanceof Date ? m.created_at.toISOString() : m.created_at }
  },
  getByProduct: async (productId: string) => {
    const product = await productRepository.findById(productId)
    if (!product || product.deleted_at) throw new NotFoundError("Product not found")
    const movements = await movementRepository.findByProductId(productId)
    return { movements: movements.map(m => ({ ...m, product_name: product.name, created_at: m.created_at instanceof Date ? m.created_at.toISOString() : m.created_at })), total: movements.length, page: 1, limit: movements.length }
  },
  list: async (params?: any) => {
    const result = await movementRepository.findAll(params)
    return { movements: result.movements.map(m => ({ ...m, created_at: m.created_at instanceof Date ? m.created_at.toISOString() : m.created_at })), total: result.total, page: result.page, limit: result.limit }
  },
  getLowStockProducts: async (productRepo: IProductRepository) => {
    const { products } = await productRepo.findAll({ lowStock: true, limit: 200 })
    return products.map(p => ({ product_id: p.id, product_name: p.name, current_stock: p.stock, low_stock_threshold: p.low_stock_threshold, is_low_stock: p.stock <= p.low_stock_threshold }))
  },
})
```

### 28.5 `infrastructure/inventory.prisma.repository.ts`

```typescript
import { prisma } from "@/config/prisma"
import type { IInventoryRepository } from "../domain/inventory.interface"
import { Prisma } from "@prisma/client"

type M = Prisma.inventory_movementGetPayload<{ include: { product: { select: { name: true } } } }>
const toEntity = (m: M) => ({ id: m.id, product_id: m.product_id, product_name: m.product?.name || undefined, movement_type: m.movement_type, quantity: m.quantity, note: m.note || undefined, batch_id: m.batch_id || undefined, user_id: m.user_id, created_at: m.created_at })

export const InventoryRepository: IInventoryRepository = {
  async create(data) { const m = await prisma.inventory_movement.create({ data: { product_id: data.product_id, movement_type: data.movement_type, quantity: data.quantity, note: data.note, batch_id: data.batch_id, user_id: data.user_id }, include: { product: { select: { name: true } } } }); return toEntity(m) },
  async findByProductId(productId, params) { const ms = await prisma.inventory_movement.findMany({ where: { product_id: productId }, include: { product: { select: { name: true } } }, orderBy: { created_at: "desc" }, take: params?.limit || 50 }); return ms.map(toEntity) },
  async findAll(params) { const where: any = {}; if (params?.product_id) where.product_id = params.product_id; if (params?.movement_type) where.movement_type = params.movement_type; const page = params?.page || 1; const limit = params?.limit || 50; const skip = (page - 1) * limit; const [ms, total] = await Promise.all([prisma.inventory_movement.findMany({ where, include: { product: { select: { name: true } } }, skip, take: limit, orderBy: { created_at: "desc" } }), prisma.inventory_movement.count({ where })]); return { movements: ms.map(toEntity), total, page, limit } },
}
```

### 28.6 `presentation/inventory.controller.ts`, `inventory.routes.ts`, `inventory.dto.ts`

```typescript
// inventory.controller.ts
import type { FastifyReply, FastifyRequest } from "fastify"
import { createInventoryService } from "../application/inventory.service"
import { InventoryRepository } from "../infrastructure/inventory.prisma.repository"
import { ProductRepository } from "../../products/infrastructure/products.prisma.repository"
import { CreateMovementDtoSchema, MovementQuerySchema } from "./inventory.dto"
import { UnauthorizedError } from "@/core/errors/AppError"

const inventoryService = createInventoryService(InventoryRepository, ProductRepository)
export const inventoryController = {
  createMovement: async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.userId; if (!userId) throw new UnauthorizedError("Authentication required")
    const data = CreateMovementDtoSchema.parse(request.body)
    const result = await inventoryService.create({ ...data, user_id: userId })
    return reply.status(201).send(result)
  },
  getByProduct: async (request: FastifyRequest, reply: FastifyReply) => {
    const { productId } = request.params as { productId: string }
    const result = await inventoryService.getByProduct(productId)
    return reply.status(200).send(result)
  },
  list: async (request: FastifyRequest, reply: FastifyReply) => {
    const query = MovementQuerySchema.parse(request.query)
    const result = await inventoryService.list(query)
    return reply.status(200).send(result)
  },
  lowStock: async (_request: FastifyRequest, reply: FastifyReply) => {
    const result = await inventoryService.getLowStockProducts(ProductRepository)
    return reply.status(200).send({ products: result })
  },
}

// inventory.dto.ts
import { z } from "zod"
export const CreateMovementDtoSchema = z.object({ product_id: z.string().uuid(), movement_type: z.enum(["entrada", "salida", "ajuste"]), quantity: z.number().int(), note: z.string().optional(), batch_id: z.string().uuid().optional() })
export const MovementQuerySchema = z.object({ product_id: z.string().uuid().optional(), movement_type: z.enum(["entrada", "salida", "ajuste", "venta"]).optional(), page: z.coerce.number().int().positive().optional(), limit: z.coerce.number().int().positive().max(100).optional() })

// inventory.routes.ts
import { authGuard } from "@/core/guard/auth.guard"
import { toJsonSchema } from "@/presentation/swagger-schema"
const TAGS = ["Inventory"]
export const inventoryRoutes = async (fastify: any, _opts: any) => {
  fastify.get("/low-stock", { schema: { tags: TAGS }, preHandler: [authGuard] }, inventoryController.lowStock)
  fastify.get("/product/:productId", { schema: { tags: TAGS }, preHandler: [authGuard] }, inventoryController.getByProduct)
  fastify.get("/", { schema: { tags: TAGS, querystring: toJsonSchema(MovementQuerySchema) }, preHandler: [authGuard] }, inventoryController.list)
  fastify.post("/", { schema: { tags: TAGS, body: toJsonSchema(CreateMovementDtoSchema) }, preHandler: [authGuard] }, inventoryController.createMovement)
}
```

---

## 29. Módulo `batch-inventory` — Lotes

### 29.1 `domain/batch-inventory.types.ts`, `.entities.ts`, `.interface.ts`

```typescript
export interface IBatchItemResponse { id: string; product_id: string; product_name?: string; quantity: number; unit_cost?: number | null; notes?: string | null }
export interface IBatchResponse { id: string; movement_type: string; supplier_id?: string | null; supplier_name?: string; notes?: string | null; user_id: string; user_name?: string; items?: IBatchItemResponse[]; total_items: number; total_quantity: number; created_at: string }
export interface IBatchListResponse { batches: IBatchResponse[]; total: number; page: number; limit: number }

export interface IBatchItemEntity { id: string; batch_id: string; product_id: string; quantity: number; unit_cost?: number | null; notes?: string | null; created_at: Date }
export interface IBatchEntity { id: string; movement_type: string; supplier_id?: string | null; notes?: string | null; user_id: string; created_at: Date; items?: IBatchItemEntity[] }
export type CreateBatchItemData = { product_id: string; quantity: number; unit_cost?: number | null; notes?: string | null }
export type CreateBatchData = { movement_type: "entrada" | "salida" | "ajuste"; supplier_id?: string | null; notes?: string | null; user_id: string; items: CreateBatchItemData[] }

export interface IBatchInventoryRepository { create(data: CreateBatchData): Promise<IBatchEntity>; findById(id: string): Promise<IBatchEntity | null>; findAll(params?: { movement_type?: string; supplier_id?: string; page?: number; limit?: number }): Promise<{ batches: IBatchEntity[]; total: number; page: number; limit: number }> }
```

### 29.2 `application/batch-inventory.service.ts`

```typescript
import { prisma } from "@/config/prisma"
import { NotFoundError, BadRequestError } from "@/core/errors/AppError"
import type { IBatchInventoryRepository } from "../domain/batch-inventory.interface"
import type { IProductRepository } from "../../products/domain/products.interface"
import type { CreateBatchData } from "../domain/batch-inventory.entities"

const mapBatch = (batch: any) => {
  const items = (batch.items || []).map((i: any) => ({ id: i.id, product_id: i.product_id, product_name: i.product?.name, quantity: i.quantity, unit_cost: i.unit_cost ? Number(i.unit_cost) : null, notes: i.notes || null }))
  return { id: batch.id, movement_type: batch.movement_type, supplier_id: batch.supplier_id || null, supplier_name: batch.supplier?.name, notes: batch.notes || null, user_id: batch.user_id, user_name: batch.user?.name, items, total_items: items.length, total_quantity: items.reduce((s: number, i: any) => s + i.quantity, 0), created_at: batch.created_at instanceof Date ? batch.created_at.toISOString() : batch.created_at }
}

export const createBatchInventoryService = (repo: IBatchInventoryRepository, productRepo: IProductRepository) => ({
  create: async (data: CreateBatchData) => {
    const products = await Promise.all(data.items.map(i => productRepo.findById(i.product_id)))
    for (let i = 0; i < data.items.length; i++) { if (!products[i] || products[i]!.deleted_at) throw new NotFoundError(`Product ${data.items[i].product_id} not found`) }
    if (data.movement_type === "salida") { for (let i = 0; i < data.items.length; i++) { if (products[i]!.stock < data.items[i].quantity) throw new BadRequestError(`Insufficient stock for ${products[i]!.name}`) } }
    const batch = await prisma.$transaction(async (tx) => {
      const created = await tx.inventory_batch.create({ data: { movement_type: data.movement_type, supplier_id: data.supplier_id, notes: data.notes, user_id: data.user_id, items: { create: data.items.map(i => ({ product_id: i.product_id, quantity: i.quantity, unit_cost: i.unit_cost, notes: i.notes })) } }, include: { items: { include: { product: { select: { name: true } } } }, supplier: { select: { name: true } }, user: { select: { name: true } } } })
      for (const item of data.items) { const adj = data.movement_type === "entrada" ? item.quantity : data.movement_type === "salida" ? -item.quantity : item.quantity; await tx.product.update({ where: { id: item.product_id }, data: { stock: { increment: adj } } }); await tx.inventory_movement.create({ data: { product_id: item.product_id, movement_type: data.movement_type, quantity: item.quantity, note: data.notes, batch_id: created.id, user_id: data.user_id } }) }
      return created
    })
    return mapBatch(batch)
  },
  getById: async (id: string) => { const b = await prisma.inventory_batch.findUnique({ where: { id }, include: { items: { include: { product: { select: { name: true } } } }, supplier: { select: { name: true } }, user: { select: { name: true } } } }); if (!b) throw new NotFoundError("Batch not found"); return mapBatch(b) },
  list: async (params?: any) => { const where: any = {}; if (params?.movement_type) where.movement_type = params.movement_type; if (params?.supplier_id) where.supplier_id = params.supplier_id; const page = params?.page || 1; const limit = params?.limit || 50; const skip = (page - 1) * limit; const [batches, total] = await Promise.all([prisma.inventory_batch.findMany({ where, include: { items: { include: { product: { select: { name: true } } } }, supplier: { select: { name: true } }, user: { select: { name: true } } }, skip, take: limit, orderBy: { created_at: "desc" } }), prisma.inventory_batch.count({ where })]); return { batches: batches.map(mapBatch), total, page, limit } },
})
```

### 29.3 `presentation/batch-inventory.controller.ts`, `.routes.ts`, `.dto.ts`

```typescript
// controller
import type { FastifyReply, FastifyRequest } from "fastify"
import { createBatchInventoryService } from "../application/batch-inventory.service"
import { BatchInventoryRepository } from "../infrastructure/batch-inventory.prisma.repository"
import { ProductRepository } from "../../products/infrastructure/products.prisma.repository"
import { CreateBatchDtoSchema, BatchQuerySchema } from "./batch-inventory.dto"
import { UnauthorizedError } from "@/core/errors/AppError"

const batchInventoryService = createBatchInventoryService(BatchInventoryRepository, ProductRepository)
export const batchInventoryController = {
  create: async (request: FastifyRequest, reply: FastifyReply) => { const userId = request.userId; if (!userId) throw new UnauthorizedError("Authentication required"); const data = CreateBatchDtoSchema.parse(request.body); const result = await batchInventoryService.create({ ...data, user_id: userId }); return reply.status(201).send(result) },
  getById: async (request: FastifyRequest, reply: FastifyReply) => { const { id } = request.params as { id: string }; const result = await batchInventoryService.getById(id); return reply.status(200).send(result) },
  list: async (request: FastifyRequest, reply: FastifyReply) => { const query = BatchQuerySchema.parse(request.query); const result = await batchInventoryService.list(query); return reply.status(200).send(result) },
}

// dto
import { z } from "zod"
export const BatchItemSchema = z.object({ product_id: z.string().uuid(), quantity: z.number().int().positive(), unit_cost: z.number().min(0).optional().nullable(), notes: z.string().optional().nullable() })
export const CreateBatchDtoSchema = z.object({ movement_type: z.enum(["entrada", "salida", "ajuste"]), supplier_id: z.string().uuid().optional().nullable(), notes: z.string().optional().nullable(), items: z.array(BatchItemSchema).min(1) })
export const BatchQuerySchema = z.object({ movement_type: z.enum(["entrada", "salida", "ajuste"]).optional(), supplier_id: z.string().uuid().optional(), page: z.coerce.number().int().positive().optional(), limit: z.coerce.number().int().positive().max(100).optional() })

// routes
import { authGuard } from "@/core/guard/auth.guard"
import { toJsonSchema } from "@/presentation/swagger-schema"
const TAGS = ["Inventory Batches"]
export const batchInventoryRoutes = async (fastify: any, _opts: any) => {
  fastify.get("/", { schema: { tags: TAGS, querystring: toJsonSchema(BatchQuerySchema) }, preHandler: [authGuard] }, batchInventoryController.list)
  fastify.get("/:id", { schema: { tags: TAGS }, preHandler: [authGuard] }, batchInventoryController.getById)
  fastify.post("/", { schema: { tags: TAGS, body: toJsonSchema(CreateBatchDtoSchema) }, preHandler: [authGuard] }, batchInventoryController.create)
}
```

### 29.4 `infrastructure/batch-inventory.prisma.repository.ts`

```typescript
import { prisma } from "@/config/prisma"
import type { IBatchInventoryRepository } from "../domain/batch-inventory.interface"
import type { IBatchEntity, IBatchItemEntity, CreateBatchData, CreateBatchItemData } from "../domain/batch-inventory.entities"
import { Prisma } from "@prisma/client"

const bi = { product: { select: { name: true } } } as const
type BIR = Prisma.inventory_batch_itemGetPayload<{ include: typeof bi }>
type BR = Prisma.inventory_batchGetPayload<{ include: { items: { include: typeof bi }; supplier: { select: { name: true } }; user: { select: { name: true } } } }>

const mapItem = (i: BIR): IBatchItemEntity => ({ id: i.id, batch_id: i.batch_id, product_id: i.product_id, quantity: i.quantity, unit_cost: i.unit_cost ? Number(i.unit_cost) : null, notes: i.notes || null, created_at: i.created_at })
const mapEntity = (b: BR): IBatchEntity => ({ id: b.id, movement_type: b.movement_type, supplier_id: b.supplier_id || null, notes: b.notes || null, user_id: b.user_id, created_at: b.created_at, items: (b.items || []).map(mapItem) })

export const BatchInventoryRepository: IBatchInventoryRepository = {
  async create(data) { const b = await prisma.inventory_batch.create({ data: { movement_type: data.movement_type, supplier_id: data.supplier_id, notes: data.notes, user_id: data.user_id, items: { create: data.items.map((i: CreateBatchItemData) => ({ product_id: i.product_id, quantity: i.quantity, unit_cost: i.unit_cost, notes: i.notes })) } }, include: { items: { include: bi }, supplier: { select: { name: true } }, user: { select: { name: true } } } }); return mapEntity(b as any) },
  async findById(id) { const b = await prisma.inventory_batch.findUnique({ where: { id }, include: { items: { include: bi }, supplier: { select: { name: true } }, user: { select: { name: true } } } }); return b ? mapEntity(b) : null },
  async findAll(params) { const where: any = {}; if (params?.movement_type) where.movement_type = params.movement_type; if (params?.supplier_id) where.supplier_id = params.supplier_id; const page = params?.page || 1; const limit = params?.limit || 50; const skip = (page - 1) * limit; const [bs, total] = await Promise.all([prisma.inventory_batch.findMany({ where, include: { items: { include: bi }, supplier: { select: { name: true } }, user: { select: { name: true } } }, skip, take: limit, orderBy: { created_at: "desc" } }), prisma.inventory_batch.count({ where })]); return { batches: bs.map(mapEntity), total, page, limit } },
}
```

---

## 30. Módulo `suppliers` — Proveedores

```typescript
// domain/suppliers.types.ts
export interface ISupplierResponse { id: string; name: string; contact_name?: string; email?: string; phone?: string; address?: string; notes?: string; is_active: boolean; product_count?: number; created_at: string; updated_at: string }
export interface ISupplierListResponse { suppliers: ISupplierResponse[]; total: number; page: number; limit: number }

// domain/suppliers.entities.ts
export interface ISupplierEntity { id: string; name: string; contact_name?: string; email?: string; phone?: string; address?: string; notes?: string; is_active: boolean; created_at: Date; updated_at: Date; deleted_at?: Date }
export type CreateSupplierData = { name: string; contact_name?: string; email?: string; phone?: string; address?: string; notes?: string; is_active?: boolean }
export type UpdateSupplierData = Partial<CreateSupplierData>

// domain/suppliers.interface.ts
export interface ISupplierRepository {
  findAll(params?: { search?: string; is_active?: boolean; page?: number; limit?: number }): Promise<{ suppliers: ISupplierEntity[]; total: number; page: number; limit: number }>
  findById(id: string): Promise<ISupplierEntity | null>
  create(data: CreateSupplierData): Promise<ISupplierEntity>
  update(id: string, data: UpdateSupplierData): Promise<ISupplierEntity>
  softDelete(id: string): Promise<void>
}

// application/suppliers.service.ts
import { NotFoundError, BadRequestError } from "@/core/errors/AppError"
const mapToResponse = (s: any) => ({ id: s.id, name: s.name, contact_name: s.contact_name || undefined, email: s.email || undefined, phone: s.phone || undefined, address: s.address || undefined, notes: s.notes || undefined, is_active: s.is_active, product_count: s._count?.products ?? undefined, created_at: s.created_at instanceof Date ? s.created_at.toISOString() : s.created_at, updated_at: s.updated_at instanceof Date ? s.updated_at.toISOString() : s.updated_at })
export const createSupplierService = (repository: ISupplierRepository) => ({
  list: async (params?) => { const r = await repository.findAll(params); return { suppliers: r.suppliers.map(mapToResponse), total: r.total, page: r.page, limit: r.limit } },
  getById: async (id: string) => { const s = await repository.findById(id); if (!s || s.deleted_at) throw new NotFoundError("Supplier not found"); return mapToResponse(s) },
  create: async (data: CreateSupplierData) => { if (!data.name?.trim()) throw new BadRequestError("Name is required"); const s = await repository.create(data); return mapToResponse(s) },
  update: async (id: string, data: UpdateSupplierData) => { const existing = await repository.findById(id); if (!existing || existing.deleted_at) throw new NotFoundError("Supplier not found"); const s = await repository.update(id, data); return mapToResponse(s) },
  delete: async (id: string) => { const existing = await repository.findById(id); if (!existing || existing.deleted_at) throw new NotFoundError("Supplier not found"); await repository.softDelete(id) },
})

// infrastructure/suppliers.prisma.repository.ts
import { prisma } from "@/config/prisma"
import { Prisma } from "@prisma/client"
const sel = { id: true, name: true, contact_name: true, email: true, phone: true, address: true, notes: true, is_active: true, created_at: true, updated_at: true, deleted_at: true } as const
type R = Prisma.supplierGetPayload<{ select: typeof sel }>
const m = (s: R) => ({ id: s.id, name: s.name, contact_name: s.contact_name || undefined, email: s.email || undefined, phone: s.phone || undefined, address: s.address || undefined, notes: s.notes || undefined, is_active: s.is_active, created_at: s.created_at, updated_at: s.updated_at, deleted_at: s.deleted_at || undefined })
export const SupplierRepository: ISupplierRepository = {
  async findAll(params) { const where: Prisma.supplierWhereInput = { deleted_at: null }; if (params?.search) where.OR = [{ name: { contains: params.search, mode: "insensitive" } }, { contact_name: { contains: params.search, mode: "insensitive" } }, { email: { contains: params.search, mode: "insensitive" } }]; if (params?.is_active !== undefined) where.is_active = params.is_active; const page = params?.page || 1; const l = params?.limit || 50; const [ss, total] = await Promise.all([prisma.supplier.findMany({ where, select: sel, skip: (page - 1) * l, take: l, orderBy: { name: "asc" } }), prisma.supplier.count({ where })]); return { suppliers: ss.map(m), total, page, limit } },
  async findById(id) { const r = await prisma.supplier.findFirst({ where: { id, deleted_at: null }, select: { ...sel, _count: { select: { products: true } } } }); return r ? { ...m(r as any), _count: (r as any)._count } as any : null },
  async create(data) { const s = await prisma.supplier.create({ data: { name: data.name, contact_name: data.contact_name, email: data.email, phone: data.phone, address: data.address, notes: data.notes, is_active: data.is_active ?? true }, select: sel }); return m(s) },
  async update(id, data) { const s = await prisma.supplier.update({ where: { id }, data: { ...(data.name !== undefined && { name: data.name }), ...(data.contact_name !== undefined && { contact_name: data.contact_name }), ...(data.email !== undefined && { email: data.email }), ...(data.phone !== undefined && { phone: data.phone }), ...(data.address !== undefined && { address: data.address }), ...(data.notes !== undefined && { notes: data.notes }), ...(data.is_active !== undefined && { is_active: data.is_active }) }, select: sel }); return m(s) },
  async softDelete(id) { await prisma.supplier.update({ where: { id }, data: { deleted_at: new Date() } }) },
}
```

---

## 31. Módulo `settings` — Configuración del negocio

```typescript
// domain/settings.types.ts
export interface ISettingsResponse { name: string; address?: string; phone?: string; tax_rate: number; low_stock_threshold: number; ticket_footer?: string; updated_at: string }

// domain/settings.entities.ts
import type { Decimal } from "@prisma/client/runtime/library"
export interface ISettingsEntity { id: number; name: string; address?: string; phone?: string; tax_rate: Decimal; low_stock_threshold: number; ticket_footer?: string; updated_at: Date }
export type UpdateSettingsData = { name?: string; address?: string; phone?: string; tax_rate?: number; low_stock_threshold?: number; ticket_footer?: string }

// domain/settings.interface.ts
export interface ISettingsRepository { get(): Promise<ISettingsEntity | null>; upsert(data: UpdateSettingsData): Promise<ISettingsEntity> }

// application/settings.service.ts
const mapSettings = (s: any) => ({ name: s.name, address: s.address || undefined, phone: s.phone || undefined, tax_rate: Number(s.tax_rate), low_stock_threshold: s.low_stock_threshold, ticket_footer: s.ticket_footer || undefined, updated_at: s.updated_at instanceof Date ? s.updated_at.toISOString() : s.updated_at })
export const createSettingsService = (repository: ISettingsRepository) => ({
  get: async () => { const s = await repository.get(); return s ? mapSettings(s) : { name: "", tax_rate: 16, low_stock_threshold: 5, updated_at: new Date().toISOString() } },
  update: async (data: UpdateSettingsData) => { const s = await repository.upsert(data); return mapSettings(s) },
})

// infrastructure/settings.prisma.repository.ts
import { prisma } from "@/config/prisma"
import type { settings } from "@prisma/client"
const toEntity = (s: settings) => ({ id: s.id, name: s.name, address: s.address || undefined, phone: s.phone || undefined, tax_rate: s.tax_rate, low_stock_threshold: s.low_stock_threshold, ticket_footer: s.ticket_footer || undefined, updated_at: s.updated_at })
export const SettingsRepository: ISettingsRepository = {
  async get() { const s = await prisma.settings.findFirst(); return s ? toEntity(s) : null },
  async upsert(data) { const existing = await prisma.settings.findFirst(); if (existing) { const u = await prisma.settings.update({ where: { id: existing.id }, data: { ...(data.name !== undefined && { name: data.name }), ...(data.address !== undefined && { address: data.address }), ...(data.phone !== undefined && { phone: data.phone }), ...(data.tax_rate !== undefined && { tax_rate: data.tax_rate }), ...(data.low_stock_threshold !== undefined && { low_stock_threshold: data.low_stock_threshold }), ...(data.ticket_footer !== undefined && { ticket_footer: data.ticket_footer }) } }); return toEntity(u) }; const c = await prisma.settings.create({ data: { name: data.name ?? "Mi Negocio", address: data.address, phone: data.phone, tax_rate: data.tax_rate ?? 16, low_stock_threshold: data.low_stock_threshold ?? 5, ticket_footer: data.ticket_footer } }); return toEntity(c) },
}
```

---

## 32. `src/scripts/seed.ts` — Población de datos

```typescript
import { prisma } from "@/config/prisma.js";
import { hashPassword } from "@/core/utils/crypto.utils";

const categories = [
  { name: "Snacks y Chiverías", description: "Papas, churritos, cacahuates y botanas" },
  { name: "Galletas y Dulces", description: "Galletas, caramelos, chocolates y chicles" },
  { name: "Bebidas", description: "Gaseosas, jugos, aguas y energizantes" },
  { name: "Abarrotes", description: "Café, leche, aceite, sopas y salsas" },
  { name: "Lácteos y Fríos", description: "Leche, yogurt, crema y embutidos" },
  { name: "Higiene y Limpieza", description: "Papel higiénico, jabón, detergente y cuidado personal" },
];

const suppliers = [
  { name: "Diana Nicaragua", contact_name: "Ejecutivo de Ventas", email: "ventas@diana.com", phone: "0000-0000", address: "Managua, Nicaragua", notes: "Snacks, chiverías y productos Diana" },
  { name: "Coca-Cola FEMSA Nicaragua", contact_name: "Ejecutivo Comercial", email: "ventas@coca-cola.com", phone: "0000-0000", address: "Managua, Nicaragua", notes: "Bebidas Coca-Cola, Fanta, Sprite, Del Valle" },
  { name: "Pepsi Nicaragua", contact_name: "Ejecutivo Comercial", email: "ventas@pepsi.com", phone: "0000-0000", address: "Managua, Nicaragua", notes: "Pepsi, 7UP, Mirinda, AMP" },
  { name: "Nestlé Nicaragua", contact_name: "Ejecutivo Comercial", email: "ventas@nestle.com", phone: "0000-0000", address: "Managua, Nicaragua", notes: "Café, chocolates, lácteos y alimentos" },
  { name: "Cargill Nicaragua", contact_name: "Ejecutivo Comercial", email: "ventas@cargill.com", phone: "0000-0000", address: "Managua, Nicaragua", notes: "Tip Top, embutidos y productos alimenticios" },
  { name: "Grupo Lala Nicaragua", contact_name: "Ejecutivo Comercial", email: "ventas@lala.com", phone: "0000-0000", address: "Managua, Nicaragua", notes: "Lácteos y bebidas" },
  { name: "Distribuidora La Colonia", contact_name: "Ventas Mayoristas", email: "mayoreo@lacolonia.com", phone: "0000-0000", address: "Managua, Nicaragua", notes: "Abarrotes y productos de consumo masivo" },
  { name: "Mayoreo El Gallo Más Gallo", contact_name: "Ventas", email: "ventas@gallomasgallo.com", phone: "0000-0000", address: "Managua, Nicaragua", notes: "Distribución y abastecimiento" },
  { name: "Kimberly-Clark Nicaragua", contact_name: "Ejecutivo Comercial", email: "ventas@kimberly-clark.com", phone: "0000-0000", address: "Managua, Nicaragua", notes: "Papel higiénico, servilletas y productos de higiene" },
  { name: "Unilever Nicaragua", contact_name: "Ejecutivo Comercial", email: "ventas@unilever.com", phone: "0000-0000", address: "Managua, Nicaragua", notes: "Detergentes, jabones y productos de limpieza" },
];

const products = [
  { name: "Ranchitas Originales", unit_type: "ristra" as const, unit_quantity: 12, category_name: "Snacks y Chiverías", supplier_name: "Diana Nicaragua", cost: 55, price: 70, stock: 50, low_stock_threshold: 10, tax_rate: 0 },
  { name: "Coca-Cola 500ml PET", unit_type: "paquete" as const, unit_quantity: 12, category_name: "Bebidas", supplier_name: "Coca-Cola FEMSA Nicaragua", cost: 210, price: 240, stock: 24, low_stock_threshold: 6, tax_rate: 0 },
  { name: "Galletas Oreo", unit_type: "paquete" as const, unit_quantity: 12, category_name: "Galletas y Dulces", supplier_name: "Mayoreo El Gallo Más Gallo", cost: 90, price: 110, stock: 50, low_stock_threshold: 10, tax_rate: 0 },
  { name: "Nescafé Tradicional 200g", unit_type: "sobre" as const, category_name: "Abarrotes", supplier_name: "Nestlé Nicaragua", cost: 85, price: 105, stock: 30, low_stock_threshold: 6, tax_rate: 0 },
  { name: "Leche Lala 1L", unit_type: "botella" as const, category_name: "Lácteos y Fríos", supplier_name: "Grupo Lala Nicaragua", cost: 65, price: 80, stock: 30, low_stock_threshold: 6, tax_rate: 0 },
  { name: "Jabón de Baño Dove", unit_type: "barra" as const, category_name: "Higiene y Limpieza", supplier_name: "Unilever Nicaragua", cost: 38, price: 48, stock: 50, low_stock_threshold: 12, tax_rate: 0 },
];

const services = [
  { name: "Cambio de Aceite", description: "Cambio completo de aceite de motor", base_price: 50, products: [{ productName: "aceite", quantity: 4 }] },
];

const seed = async () => {
  console.log("🌱 Iniciando seeder...");

  // Clean tables
  await prisma.sale_service_product.deleteMany({});
  await prisma.sale_service.deleteMany({});
  await prisma.service_product.deleteMany({});
  await prisma.service.deleteMany({});
  await prisma.inventory_batch_item.deleteMany({});
  await prisma.inventory_batch.deleteMany({});
  await prisma.inventory_movement.deleteMany({});
  await prisma.sale_item.deleteMany({});
  await prisma.sale.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.account.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.verification.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.supplier.deleteMany({});

  const catMap: Record<string, string> = {};
  const supMap: Record<string, string> = {};

  for (const cat of categories) { const c = await prisma.category.create({ data: cat }); catMap[cat.name] = c.id }
  for (const sup of suppliers) { const s = await prisma.supplier.create({ data: sup }); supMap[sup.name] = s.id }
  for (const p of products) { await prisma.product.create({ data: { name: p.name, unit_type: p.unit_type, unit_quantity: p.unit_quantity, category_id: catMap[p.category_name], supplier_id: supMap[p.supplier_name], cost: p.cost, price: p.price, stock: p.stock, low_stock_threshold: p.low_stock_threshold, tax_rate: p.tax_rate, active: true } }) }
  for (const svc of services) { const s = await prisma.service.create({ data: { name: svc.name, description: svc.description, base_price: svc.base_price, is_active: true } }); for (const sp of svc.products) { const p = await prisma.product.findFirst({ where: { name: { contains: sp.productName, mode: "insensitive" }, deleted_at: null } }); if (p) await prisma.service_product.create({ data: { service_id: s.id, product_id: p.id, quantity: sp.quantity } }) } }

  const testUsers = [{ name: "Admin", email: "admin@smart-miscelanea.com", password: "admin123", role: "admin" as const }, { name: "Cajero", email: "cajero@smart-miscelanea.com", password: "cajero123", role: "cajero" as const }];
  for (const u of testUsers) { const user = await prisma.user.create({ data: { name: u.name, email: u.email, role: u.role, email_verified: true } }); const hp = await hashPassword(u.password); await prisma.account.create({ data: { account_id: user.id, provider_id: "credentials", user_id: user.id, password: hp } }) }

  console.log("🎉 Seeder completado!");
  for (const u of testUsers) console.log(`   ${u.email} / ${u.password} (${u.role})`);
};

seed().catch((e) => { console.error("❌", e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
```

---

## Tabla completa de Endpoints

Niveles de autenticación:
- **Pública** — No requiere autenticación
- **Auth** — Requiere sesión/JWT (vía `authGuard`)
- **Admin** — Requiere rol `admin` (vía `authGuard` + `adminGuard`)

### Módulo Auth (`/auth`)

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| `POST` | `/auth/register` | Registrar nuevo usuario | Admin |
| `POST` | `/auth/login` | Iniciar sesión | Pública |
| `POST` | `/auth/refresh` | Refrescar token de acceso | Pública |
| `POST` | `/auth/logout` | Cerrar sesión (revocar refresh token) | Pública |
| `POST` | `/auth/verify-email` | Verificar email con token | Pública |
| `POST` | `/auth/resend-verification` | Reenviar correo de verificación | Pública |
| `POST` | `/auth/forgot-password` | Solicitar restablecimiento de contraseña | Pública |
| `POST` | `/auth/reset-password` | Restablecer contraseña con token | Pública |
| `GET` | `/auth/sessions` | Obtener sesiones activas del usuario | Auth |
| `DELETE` | `/auth/sessions/:sessionId` | Revocar una sesión específica | Auth |

### Módulo Users (`/users`)

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| `GET` | `/users` | Listar usuarios (paginado, filtros) | Admin |
| `GET` | `/users/:id` | Obtener usuario por ID | Admin |
| `POST` | `/users` | Crear nuevo usuario | Admin |
| `PUT` | `/users/:id` | Actualizar usuario | Admin |
| `DELETE` | `/users/:id` | Eliminar usuario (soft delete) | Admin |

### Módulo Products (`/products`)

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| `GET` | `/products` | Listar productos (paginado, filtros) | Auth |
| `GET` | `/products/barcode/:barcode` | Buscar producto por código de barras | Auth |
| `GET` | `/products/:id` | Obtener producto por ID | Auth |
| `POST` | `/products` | Crear nuevo producto | Auth |
| `PUT` | `/products/:id` | Actualizar producto | Auth |
| `DELETE` | `/products/:id` | Eliminar producto (soft delete) | Auth |

### Módulo Categories (`/categories`)

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| `GET` | `/categories` | Listar categorías de productos | Pública |

### Módulo Services (`/services`)

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| `GET` | `/services` | Listar servicios (paginado, filtros) | Auth |
| `GET` | `/services/:id` | Obtener servicio por ID | Auth |
| `POST` | `/services` | Crear nuevo servicio | Auth |
| `PUT` | `/services/:id` | Actualizar servicio | Auth |
| `DELETE` | `/services/:id` | Eliminar servicio (soft delete) | Auth |

### Módulo Sales (`/sales`)

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| `GET` | `/sales/report` | Reporte de ventas (rango de fechas) | Auth |
| `GET` | `/sales/revenue-trend` | Tendencia de ingresos (agrupado) | Auth |
| `GET` | `/sales/:id` | Obtener venta por ID (con items) | Auth |
| `GET` | `/sales` | Listar ventas (paginado, filtros) | Auth |
| `POST` | `/sales` | Crear nueva venta (transacción atómica) | Auth |

### Módulo Inventory (`/inventory`)

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| `GET` | `/inventory/low-stock` | Productos con stock bajo (umbral) | Auth |
| `GET` | `/inventory/product/:productId` | Movimientos de un producto específico | Auth |
| `GET` | `/inventory` | Listar movimientos de inventario (paginado) | Auth |
| `POST` | `/inventory` | Crear movimiento de inventario | Auth |

### Módulo Batch Inventory (`/inventory/batches`)

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| `GET` | `/inventory/batches` | Listar lotes de inventario (paginado) | Auth |
| `GET` | `/inventory/batches/:id` | Obtener lote por ID (con productos) | Auth |
| `POST` | `/inventory/batches` | Crear lote (transacción atómica) | Auth |

### Módulo Suppliers (`/suppliers`)

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| `GET` | `/suppliers` | Listar proveedores (paginado, filtros) | Auth |
| `GET` | `/suppliers/:id` | Obtener proveedor por ID (con conteo) | Auth |
| `POST` | `/suppliers` | Crear nuevo proveedor | Auth |
| `PUT` | `/suppliers/:id` | Actualizar proveedor | Auth |
| `DELETE` | `/suppliers/:id` | Eliminar proveedor (soft delete) | Auth |

### Módulo Settings (`/settings`)

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| `GET` | `/settings` | Obtener configuración del negocio | Auth |
| `PUT` | `/settings` | Actualizar/crear configuración (upsert) | Auth |

### Resumen de endpoints

| Módulo | Prefix | # Endpoints | Públicos | Auth | Admin |
|--------|--------|-------------|----------|------|-------|
| Auth | `/auth` | 10 | 8 | 2 | 0 |
| Users | `/users` | 5 | 0 | 0 | 5 |
| Products | `/products` | 6 | 0 | 6 | 0 |
| Categories | `/categories` | 1 | 1 | 0 | 0 |
| Services | `/services` | 5 | 0 | 5 | 0 |
| Sales | `/sales` | 5 | 0 | 5 | 0 |
| Inventory | `/inventory` | 4 | 0 | 4 | 0 |
| Batches | `/inventory/batches` | 3 | 0 | 3 | 0 |
| Suppliers | `/suppliers` | 5 | 0 | 5 | 0 |
| Settings | `/settings` | 2 | 0 | 2 | 0 |
| **Total** | — | **46** | **9** | **32** | **5** |

