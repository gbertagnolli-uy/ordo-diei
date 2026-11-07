# Origen de vendor/opencircle

- Repositorio: https://github.com/devscalelabs/opencircle
- Commit: `5a8beada3147c6bd922c44f9cfe5b4a82f1a4056`. Copiado el 2026-11-07 (lane 276).
- Licencia: AGPL-3.0 (`LICENSE.md`, Copyright (C) 2024-2025 Devscalelabs). El `package.json` raíz dice «ISC», pero el README y `LICENSE.md` dicen AGPL v3; vale `LICENSE.md`. La revisión legal está pendiente de Gabriel (vault `BACKLOG_PLANE.md`, D-BP2).
- Archivos copiados sin cambios (sin `node_modules` ni `dist`):
  - `LICENSE.md`, `apps/api_v2/prisma/schema.prisma`
  - `apps/platform/src/{features,components,contexts,utils}`, `apps/platform/src/routes/_socialLayout.tsx` y `apps/platform/src/routes/_socialLayout/`
  - `packages/ui`, `packages/core`
  - `apps/api_v2/src/modules/{posts,channels,channel-members,reactions,notifications,media}`
- Lo portado a `src/` lleva la cabecera `// Portado de vendor/opencircle/<ruta> (devscalelabs/opencircle@5a8beada)`.
- `THIRD_PARTY_NOTICES.md` y las dependencias de D2 se agregan cuando la lane 271 (que también toca esos archivos) esté en `origin/dev` (D8 de `vault/LANE_276_SOCIAL_OPENCIRCLE.md`).
