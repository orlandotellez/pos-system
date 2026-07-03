# Guía completa de Prisma 6

## Índice

1. [¿Qué es Prisma?](#qué-es-prisma)
2. [Instalación inicial (desde 0)](#instalación-inicial-desde-0)
3. [Flujo de trabajo típico](#flujo-de-trabajo-típico)
4. [Comandos esenciales de Prisma](#comandos-esenciales-de-prisma)
5. [El error común: "Cannot read properties of undefined"](#el-error-común-cannot-read-properties-of-undefined)
6. [CRUD básico con Prisma](#crud-básico-con-prisma)
7. [Relaciones entre modelos](#relaciones-entre-modelos)
8. [Casos especiales](#casos-especiales)
9. [Troubleshooting común](#troubleshooting-común)
10. [Buenas prácticas](#buenas-prácticas)
11. [Estructura de archivos](#estructura-de-archivos)
12. [Resumen del flujo de desarrollo](#resumen-del-flujo-de-desarrollo)

---

## ¿Qué es Prisma?

Prisma es un **ORM (Object-Relational Mapper)** que te permite trabajar con bases de datos de forma тип safe y con una sintaxis más limpia que SQL puro. En lugar de escribir consultas SQL, trabajas con objetos JavaScript/TypeScript.

---

## Instalación inicial (desde 0)

### Resetear las migraciones: 

```bash
pnpm prisma migrate reset
```

### 1. Instalar las dependencias

```bash
pnpm add prisma @prisma/client
pnpm add -D prisma
```

### 2. Inicializar Prisma

```bash
pnpm prisma init
```

Esto crea:
- `prisma/schema.prisma` - Donde defines tu modelo de datos
- `.env` - Donde configuras la conexión a la DB

### 3. Configurar el schema (`prisma/schema.prisma`)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// Aquí defines tus modelos/tablas
model User {
  id    String @id @default(uuid())
  email String @unique
  name  String?
}
```

### 4. Configurar el .env

```env
DATABASE_URL="postgresql://usuario:password@localhost:5432/mibase?schema=public"
```

### 5. Generar el cliente de Prisma

```bash
pnpm prisma generate
```

Esto genera el código que te permite hacer queries a la DB desde tu app.

### 6. Usar Prisma en tu código

```typescript
// prisma.ts (instancia única)
import { PrismaClient } from "@prisma/client";

export const dbPrisma = new PrismaClient();

// Usar en tu código
const users = await dbPrisma.user.findMany();
```

---

## Flujo de trabajo típico

### Paso 1: Definir o modificar el modelo

Editás `prisma/schema.prisma` agregando/modificando modelos.

```prisma
model Book {
  id        String   @id @default(uuid())
  title     String
  author    String?
  pages     Int
  createdAt DateTime @default(now())
}
```

### Paso 2: Sincronizar con la base de datos

Acá hay DOS comandos principales, y es donde siempre me confundo:

#### Opción A: `prisma db push` (rápido, para desarrollo)

```bash
pnpm prisma db push
```

- Sincroniza el schema de Prisma con la DB
- **NO crea migraciones** (no guarda historial)
- Es ideal para desarrollo rápido o prototipos
- Puede advertencia sobre pérdida de datos

#### Opción B: `prisma migrate dev` (para producción)

```bash
pnpm prisma migrate dev --name nombre_de_la_migracion
```

- Crea un archivo de migración en `prisma/migrations/`
- Guarda historial de cambios
- **Sí preserve data** (más seguro)
- Ideal para equipos y producción

### Paso 3: Regenerar el cliente

Después de cada cambio en el schema:

```bash
pnpm prisma generate
```

Esto actualiza el código TypeScript que usás en tu app.

---

## Comandos esenciales de Prisma

| Comando | Para qué sirve |
|---------|----------------|
| `pnpm prisma init` | Inicializar Prisma desde cero |
| `pnpm prisma generate` | Generar el cliente (NECESARIO después de cambios) |
| `pnpm prisma db push` | Sincronizar schema con DB (sin migraciones) |
| `pnpm prisma migrate dev` | Crear y aplicar migración (con historial) |
| `pnpm prisma migrate deploy` | Aplicar migraciones en producción |
| `pnpm prisma studio` | UI visual para explorar la DB |
| `pnpm prisma db execute` | Ejecutar SQL directamente |
| `pnpm prisma format` | Formatear el schema.prisma |
| `pnpm prisma migrate reset` | Eliminar las migraciones y empezar desde 0|

---

## El error común: "Cannot read properties of undefined"

Este error ocurre cuando:
1. **El servidor está corriendo con el cliente viejo** - Solución: reiniciar el servidor
2. **No ejecutaste `pnpm prisma generate`** - El cliente no tiene el modelo
3. **El modelo no está en el schema.prisma** - No existe la tabla定义
4. **El schema no está sincronizado con la DB** - Falta `db push` o `migrate`

### Cómo diagnosticarlo:

```bash
# 1. Verificar que el schema tiene el modelo
cat prisma/schema.prisma | grep -A5 "model NombreDelModelo"

# 2. Verificar que el cliente lo tiene
grep "NombreDelModelo" node_modules/.prisma/client/index.d.ts

# 3. Regenerar cliente
pnpm prisma generate

# 4. Verificar que se generó correctamente
grep "NombreDelModelo" node_modules/.prisma/client/index.d.ts
```

---

## CRUD básico con Prisma

### Create (INSERT)

```typescript
// Crear un registro
const book = await dbPrisma.book.create({
  data: {
    title: "Cien años de soledad",
    author: "Gabriel García Márquez",
    pages: 417,
  },
});
```

### Read (SELECT)

```typescript
// Obtener todos
const books = await dbPrisma.book.findMany();

// Obtener uno por ID
const book = await dbPrisma.book.findUnique({
  where: { id: "uuid-del-libro" },
});

// Filtrar
const garciaBooks = await dbPrisma.book.findMany({
  where: { author: { contains: "García" } },
});
```

### Update (UPDATE)

```typescript
const updatedBook = await dbPrisma.book.update({
  where: { id: "uuid-del-libro" },
  data: {
    title: "Nuevo título",
  },
});
```

### Delete (DELETE)

```typescript
await dbPrisma.book.delete({
  where: { id: "uuid-del-libro" },
});
```

---

## Relaciones entre modelos

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String?
  posts     Post[]   // Relación uno a muchos
}

model Post {
  id        String   @id @default(uuid())
  title     String
  content   String?
  authorId  String   // Foreign key
  author    User     @relation(fields: [authorId], references: [id]) // Relación
}
```

### Queries con relaciones:

```typescript
// Obtener usuario con sus posts
const userWithPosts = await dbPrisma.user.findUnique({
  where: { id: "uuid" },
  include: {
    posts: true,
  },
});
```

---

## Casos especiales

### Crear tabla sin migraciones (para desarrollo rápido)

```bash
pnpm prisma db execute --stdin <<< "CREATE TABLE IF NOT EXISTS \"MiTabla\" (id TEXT PRIMARY KEY);"
```

### Agregar columna sin migraciones

```bash
pnpm prisma db execute --stdin <<< "ALTER TABLE \"Book\" ADD COLUMN IF NOT EXISTS \"nuevaColumna\" TEXT;"
```

### Ver la DB visualmente

```bash
pnpm prisma studio
```

Esto abre una UI en `http://localhost:5555` para ver y editar datos.

---

## Troubleshooting común

### "Drift detected" (la DB no coincide con las migraciones)

Esto pasa cuando la DB se modificó manualmente o con `db push` pero las migraciones no están actualizadas.

**Solución:**
```bash
# Opción 1: Resetear la DB (pierdes datos)
pnpm prisma migrate reset

# Opción 2: Aceptar el estado actual y crear una migración
pnpm prisma migrate dev --name sync_current_state
```

### "Table does not exist"

1. Verificar que el modelo está en `schema.prisma`
2. Ejecutar `pnpm prisma db push` o `migrate`
3. Ejecutar `pnpm prisma generate`

### El servidor no reconoce el nuevo modelo

**Reiniciar el servidor** - El cliente se carga al inicio, no se actualiza en caliente.

---

## Buenas prácticas

1. **Siempre ejecutar `prisma generate`** después de cambiar el schema
2. **Reiniciar el servidor** después de generate
3. **Usar migraciones** (`migrate dev`) en vez de `db push` para proyectos en equipo
4. **No editar las migraciones a mano** - crear nuevas en su lugar
5. **Hacer backup** antes de migraciones destructivas

---

## Estructura de archivos

```
proyecto/
├── prisma/
│   ├── schema.prisma        ← Tus modelos
│   └── migrations/          ← Historial de cambios
│       └── 20240101_init/
│           └── migration.sql
├── node_modules/
│   └── .prisma/             ← Cliente generado (NO editar)
└── src/
    └── tu-codigo.ts
```

---

## Resumen del flujo de desarrollo

```
1. Editás schema.prisma
2. Ejecutás pnpm prisma generate
3. Ejecutás pnpm prisma db push (dev) o migrate (prod)
4. Reiniciás el servidor
5. Usás dbPrisma.modelo.metodo() en tu código
```

¡Con esto ya sabés lo básico de Prisma para trabajar! 🚀
