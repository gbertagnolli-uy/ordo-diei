# Origen de vendor/dovli

- Repositorio: https://github.com/MayankJha0333/dovli
- Commit: `eb453e0225d906fa15e5b0a83d4db340b66c410f` (fecha del commit: 2026-10-27). Copiado el 2026-11-07 (lane 271).
- Licencia: MIT (`LICENSE`, Copyright (c) 2026 Mayank Jha).
- Carpetas copiadas, sin `node_modules` y sin cambios:
  - `packages/core`, `packages/sync`, `packages/editor`, `packages/ui`, `packages/theme`
  - `apps/web/src/lib`, `apps/web/src/features`, `apps/web/src/app/api/sync`
  - `apps/web/src/components/TopBar.tsx` (agregado el 2026-11-07, M0b: lo usan `PageView` y `TrashView`)
- `vendor/` está excluido de `tsconfig.json`, de eslint y de `npm test`. Lo portado a `src/` lleva la cabecera `// Portado de vendor/dovli/<ruta> (MayankJha0333/dovli@eb453e0)`.
