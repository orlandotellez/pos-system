# Frontend Architecture

Estructura y patrones del codigo React del POS System.

---

## Filosofia

1. **Pages son smart**: cada page maneja su estado y fetch.
2. **API layer hace 1 cosa**: HTTP tipado. NO maneja UI ni estado.
3. **Context solo para cosas verdaderamente globales**: auth, theme, config. El resto: `useState` o Zustand.
4. **Errores siempre visibles**: Toast arriba + inline en forms.
5. **Componentes dumb reusables** en `components/common/`. Sin fetch.

---

## Bootstrapping

### `main.tsx`

```tsx
<StrictMode>
  <AppBootstrap>
    <BrowserRouter>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <ErrorBoundary>
              <AppRoutes />
            </ErrorBoundary>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </BrowserRouter>
  </AppBootstrap>
</StrictMode>
```

- `AppBootstrap` (lo mas externo) carga `config-api.json` desde `public/`, valida que el backend sea alcanzable, expone `{ apiUrl, setApiUrl }`.
- `BrowserRouter` envuelve las rutas.
- `ThemeProvider` aplica light/dark.
- `ToastProvider` expone toast global via hook `useToast()`.
- `AuthProvider` carga el usuario actual si hay cookies, expone `{ user, store, login, logout, refresh, registerStore }`.
- `ErrorBoundary` captura crashes de React y muestra fallback.

---

## Routing

```tsx
// src/routes/AppRoutes.tsx
<Routes>
  <Route path="/" element={<Navigate to="/pos" replace />} />
  <Route path="/auth" element={<Auth />} />

  <Route element={<RequireAuth><AppShell /></RequireAuth>}>
    <Route path="/pos" element={<Pos />} />
    <Route path="/products" element={<Products />} />
    <Route path="/sales" element={<Sales />} />
    <Route path="/inventory" element={<Inventory />} />
    <Route path="/services" element={<Services />} />
    <Route path="/suppliers" element={<Suppliers />} />
    <Route path="/users" element={<RequireAdmin><Users /></RequireAdmin>} />
    <Route path="/settings" element={<Settings />} />
  </Route>

  <Route path="*" element={<NotFound />} />
</Routes>
```

- `<RequireAuth>` redirige a `/auth` si no hay usuario.
- `<RequireAdmin>` redirige a `/pos` si `user.role !== "admin"`.

---

## State management

### Local: `useState` / `useReducer`

- Filtros, paginacion, modal open/close, form state.
- Cada page maneja lo suyo.

### Compartido minimo: Zustand

`src/store/posStore.ts` para el cart del POS:

```ts
interface PosState {
  items: SaleItemDraft[];
  subtotal: number;
  tax: number;
  total: number;
  discount: number;
  paymentMethod: "efectivo" | "tarjeta" | "transferencia" | "credito";
  amountReceived: number;
  addItem, removeItem, clear, setDiscount, ...
}
```

Persistencia: NO (cart se pierde al refresh; el cajero lo re-arma o lo abandona).

### Global via Context

- `AuthContext`: `{ user, store, login, logout, refresh, registerStore }`. NO persiste user datos en localStorage; solo lee cookies via API bootstrap.
- `ThemeContext`: `{ theme, toggle }`. Persist en localStorage.
- `ToastContext`: `{ pushToast }`.

---

## API client

### Estructura

```
src/api/
├── client.ts                  # fetch wrapper + ApiError class + readApiUrl()
├── auth.ts                    # funciones: login, logout, refresh, register, ...
├── products.ts                # CRUD productos
├── categories.ts
├── sales.ts
├── inventory.ts
├── services.ts                # ⚠️ feature 'services' (no shared services)
├── suppliers.ts
├── users.ts
├── settings.ts
└── index.ts                   # re-exports
```

### `client.ts` shape

```ts
export class ApiError extends Error {
  status: number;
  // error + message vienen en body JSON; extraer en cliente-side
}

export async function request<T>(
  method: "GET" | "POST" | "PUT" | "DELETE",
  path: string,
  body?: unknown,
  params?: Record<string, string | number | boolean | undefined>,
): Promise<T>
```

- Agrega `credentials: "include"` (cookies cross-origin con `Access-Control-Allow-Credentials`).
- Parsea JSON response.
- Si `!res.ok`, construye `ApiError(status, messageBody.message || res.statusText)`.
- Acepta `Authorization: Bearer` como alternativa (e.g. para builds mobile o test E2E).

### `api/products.ts` shape

```ts
export interface Product { id, barcode, name, unit_type, ..., category, supplier }

export interface CreateProductPayload {
  name: string;
  barcode?: string;
  // ...
  category_id?: string | null;
  supplier_id?: string | null;
}

export const productsApi = {
  list: (params?: ListParams) => request<Product[]>("GET", "/products", undefined, params),
  getById: (id: string) => request<Product>("GET", `/products/${id}`),
  getByBarcode: (barcode: string) => request<Product>("GET", `/products/barcode/${barcode}`),
  create: (data: CreateProductPayload) => request<Product>("POST", "/products", data),
  update: (id: string, data: UpdateProductPayload) => request<Product>("PUT", `/products/${id}`, data),
  delete: (id: string) => request<{ message: string }>("DELETE", `/products/${id}`),
};
```

---

## Error handling

### Network / 5xx

- `request()` lanza `ApiError`.
- Paginas envuelven fetch en `try`/`catch`.
- En catch: `toast.error(error.message)`. Para errores conocidos (e.g. 401), `auth.logout()`.

### 401 (no auth)

- Auth context detecta el 401 en cualquier request y automaticamente:
  - Intenta `/auth/refresh` con cookie.
  - Si refresh OK, replay original.
  - Si refresh falla, `logout()` + redirect a `/auth`.
- Implementado como interceptor en `client.ts`.

### 403 (forbidden / store context)

- Si el backend responde 403 con mensaje "Store context required", AuthContext hace **forced re-login**:
  - limpia cookies via API.
  - redirige a `/auth`.
- Caso comun: usuario cambio de `store_id` (multi-cuenta) y la cookie actual tiene store viejo.

### 422 (validation)

- Mostrar `error.message` en toast o en el campo si matchea.

### Empty / not found

- Paginas manejan `result === null` o `result.items.length === 0` con empty state.

---

## Cache en cliente

`src/lib/simple-cache.ts` — cache TTL en memoria para datos frecuentes:

```ts
const cache = new SimpleCache<string, unknown>({ ttlMs: 60_000 });
// o por clave: productsList:store_xyz:page_1 = ...
```

Usado para:

- `GET /categories` (cambian poco, duracion larga).
- `GET /products` paginated cache por `store_id + page + filters`.
- `GET /settings` del store actual.

INVALIDATE en:

- Create/update/delete del recurso cacheado.
- Change store.

---

## Bootstrap config (`config-api.json`)

Archivo JSON estatico en `frontend/config-api.json` (no en `src/`). Lo lee `AppBootstrap` al inicio.

```json
{
  "apiUrl": "http://localhost:4001/api/v1",
  "timeoutMs": 15000
}
```

> El `apiUrl` puede ser sobreescrito por el usuario desde la pantalla de login (campo opcional). Se persiste en `localStorage[pos.apiUrl]` y gana sobre el JSON.

---

## Patrones por feature

### POS page (`src/pages/Pos.tsx`)

1. Section de busqueda de productos (input + list scannable por barcode USB).
2. Grid de productos frecuentes (click = add al cart; tecla rapida configurable).
3. Cart (lista de items + subtotal/tax/total en vivo).
4. Selector de metodo de pago (efectivo / tarjeta / transferencia / credito).
5. Si efectivo: input "monto recibido" -> calcula cambio.
6. Confirmar: `POST /sales`. Muestra ticket, lo imprime.
7. Al OK: limpia cart.

### Products page (`src/pages/Products.tsx`)

1. Default: lista con filtros (search, category_id, active, low_stock).
2. Sort por columnas.
3. Boton "Nuevo producto" abre modal con form (react-hook-form + zod).
4. Click fila: edita.
5. Icon trash: soft-delete con confirm.
6. **CRUD a `category_id` y `supplier_id`**: pasar `null` (string vacia antes de submit) para desenlazar.

### Sales page (`src/pages/Sales.tsx`)

1. Lista de ventas con filtros (fecha, usuario, metodo de pago).
2. Click fila: detalle (modal o sub-ruta).
3. Vista admin: grafico revenue trend + report.
4. Imprimir recibo (re-imprimir si hace falta).

### Inventory page (`src/pages/Inventory.tsx`)

1. Lista de movimientos.
2. Form para crear nuevo movimiento (`entrada | salida | ajuste`).
3. Tab aparte: stock bajo (`low-stock`).
4. Boton "Crear batch" abre wizard de inventario por lote.

### Users page (`src/pages/Users.tsx`)

1. Solo accesible por admin.
2. Lista de usuarios de la tienda actual.
3. Crear cajero (rol fijo, sin toggle en form).
4. Editar nombre / phone / rol (no password).
5. Soft-delete.

---

## Carpeta `components/common/`

- `ui/Button.tsx`, `Input.tsx`, `Modal.tsx`, `Toast.tsx`, `ErrorBoundary.tsx`, `Table.tsx`, `Pagination.tsx`, `Badge.tsx`, `Card.tsx`, ...
- `layout/AppShell.tsx` (header + sidebar + main).
- `auth/RequireAuth.tsx`, `RequireAdmin.tsx`.

---

## Convenciones

| Concepto | Convención |
|---|---|
| Component file | `PascalCase.tsx`. |
| Funcion en page | `camelCase`. |
| Hook custom | `use<Thing>`. |
| CSS module | `PascalCase.module.css`. |
| Estilo inline | solo para valores dinamicos (e.g. `style={{ width: pct + "%" }}`). |
| Tipo | `interface` (preferido) o `type` para unions. |
| Props | inmutable, readonly; pero aqui React usa `Readonly<Props>` solo cuando hace falta. |

---

## Estado actual (a mejorar)

| Area | Estado | Notas |
|---|---|---|
| AppBootstrap | ✅ Recien agregado | Persist `apiUrl` en localStorage. |
| Multi-store frontend | ⚠️ | El AuthContext guarda store, pero logica de switch no esta pulida. |
| Printer integration | ⚠️ | Funciones helper en `lib/` pero el flujo de impresion depende del navegador. |
| Tests del frontend | ❌ | No hay tests aun. |
| Tipado estricto | ✅ | `tsc --noEmit` OK. |
