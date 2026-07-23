# Frontend Stack

Stack tecnologico del SPA del POS System.

## Runtime

| Dep | Version | Proposito |
|---|---|---|
| React | 18.x | UI library. |
| Vite | 5.x+ | Build tool / dev server. |
| TypeScript | 5.x | Static typing (strict). |

## UI

| Dep | Proposito |
|---|---|
| Radix UI (themes) | Tokens de diseno, componentes base (button, dialog, dropdown, toast, etc.). |
| CSS Modules | Estilos scoped. |
| `lucide-react` | Iconos SVG. |
| Toast / ErrorBoundary | Componentes globales (`src/components/common/ui/`). |
| ThemeContext | Light/dark toggle. |

## Routing & estado

| Dep | Proposito |
|---|---|
| React Router 6 | Routing cliente. |
| Zustand | Estado compartido minimo (pos cart en `src/store/posStore.ts`). |
| React Context | Auth, Theme, AppBootstrap. |

## Forms & validación

| Dep | Proposito |
|---|---|
| react-hook-form | Formularios con >3 campos. |
| `@hookform/resolvers/zod` | Validacion con Zod. |
| zod | Definición de schemas de validación. |

## API / data fetching

| Dep | Proposito |
|---|---|
| fetch nativo | HTTP client centralizado en `src/api/client.ts`. |
| Baile manual | No se usa TanStack Query. Cache simple con `simple-cache.ts` (TTL en memoria). |

## Desktop (Tauri opcional)

| Dep | Proposito |
|---|---|
| Tauri 2.x | Shell nativo desktop (`src-tauri/` con `tauri.conf.json`). |
| `@tauri-apps/api` | IPC, ventanas, etc. |

## Printer integration

| Dep | Proposito |
|---|---|
| Print API navegador/escape codes | El frontend usa `window.print()` o comandos ESC/POS para imprimir tickets (`src/lib/print-ticket.ts`, `pos-ticket.ts`). |

---

## Dual-target build

| Target | Comando | Output |
|---|---|---|
| Web dev | `pnpm dev` | `http://localhost:5173` (Vite) |
| Web prod | `pnpm build` | `dist/` |
| Tauri dev | `pnpm tauri:dev` | ventana nativa con HMR Vite embebido. |
| Tauri prod | `pnpm tauri:build` | binario desktop (.exe / .app / .deb) |

Mismo `index.html` + mismo JS bundle. Tauri solo agrega la window chrome.

---

## Variables de entorno (Vite)

| Var | Default | Proposito |
|---|---|---|
| `VITE_API_URL` | (de `config-api.json`) | Base URL del backend. |

> En arranque, `AppBootstrap` lee `config-api.json` (en `public/` o `frontend/`) y lo usa como default para `readApiUrl()`. El usuario puede sobrescribirlo desde login (`register-store` form).

---

## Scripts

```jsonc
// frontend/package.json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives",
    "format": "prettier --write .",
    "typecheck": "tsc -b --noEmit",
    "tauri:dev": "tauri dev",
    "tauri:build": "tauri build"
  }
}
```

---

## Filesystem layout (resumen)

```
frontend/
├── public/
├── src-tauri/                 # Tauri shell
│   ├── tauri.conf.json
│   ├── capabilities/default.json
│   └── src/{main.rs,lib.rs}
├── index.html
├── vite.config.ts
├── tsconfig.json              # strict + path alias @
├── components.json            # Radix theme config
├── config-api.json            # runtime override de VITE_API_URL
├── config-api.json.example    # plantilla
└── src/
    ├── main.tsx               # entrypoint (carga AppBootstrap)
    ├── App.tsx
    ├── App.module.css
    ├── index.css              # CSS vars (tokens)
    ├── routes/AppRoutes.tsx
    ├── context/
    │   ├── ThemeContext.tsx
    │   ├── AuthContext.tsx
    │   └── AppBootstrap.tsx   # carga config, etc.
    ├── pages/
    │   ├── Auth.tsx           # login + register-store
    │   ├── Pos.tsx            # pantalla principal de venta
    │   ├── Products.tsx
    │   ├── Sales.tsx
    │   ├── Inventory.tsx
    │   ├── Services.tsx
    │   ├── Suppliers.tsx
    │   ├── Users.tsx
    │   ├── Settings.tsx
    │   └── NotFound.tsx
    ├── api/
    │   ├── client.ts          # ApiError class + request() helper
    │   ├── auth.ts
    │   ├── products.ts
    │   ├── sales.ts
    │   ├── ...
    ├── store/
    │   └── posStore.ts        # Zustand: cart, total, etc.
    └── lib/
        ├── api-config.ts      # readApiUrl()
        ├── print-ticket.ts
        ├── pos-ticket.ts
        ├── format.ts          # money, date helpers
        ├── constants.ts
        └── simple-cache.ts    # in-memory TTL cache
```

---

## Path aliases

```jsonc
// tsconfig.app.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

Uso: `import { api } from "@/api/client"`.
