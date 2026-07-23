# Frontend Module

SPA del POS System con React + Vite + TypeScript, dual-target (web + Tauri desktop).

## Contents

1. [1-stack](./1-stack.md) — Stack tecnologico, dual-target, build, deps principales
2. [2-design](./2-design.md) — Sistema de diseno, tokens, tema claro/oscuro, componentes
3. [3-architecture](./3-architecture.md) — Estructura de carpetas, contextos, API client, cache
4. [4-screens](./4-screens.md) — Inventario de pantallas con sus features
5. [5-quality](./5-quality.md) — Lint, format, typecheck, accesibilidad, testing

## Quick start

```bash
# Desde frontend/
pnpm install
pnpm dev                  # http://localhost:5173 (Vite web)
pnpm tauri:dev            # desktop (Tauri shell)
pnpm build                # build produccion web
pnpm tauri:build          # build produccion desktop
```

## Dual target

- **Web (browser)**: standard Vite SPA. Default `pnpm dev`.
- **Desktop (Tauri 2)**: native shell wrapping the same SPA. Configured via `src-tauri/`.

Both targets **comparten** el mismo codigo React. La API base URL se elige segun el env:

| Target | Default API |
|---|---|
| Web dev | `http://localhost:4001/api/v1` (configurable) |
| Tauri dev | `http://localhost:4001/api/v1` (configurable via `frontend/config-api.json`) |
| Web/Tauri prod | configurada en build |

> El archivo `frontend/config-api.json` (creado al bootstrap desde `config-api.json.example`) almacena la URL del backend. Es modificable por el usuario desde la pantalla de login ("Register Store").
