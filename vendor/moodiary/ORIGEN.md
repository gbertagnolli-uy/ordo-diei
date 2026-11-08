# Origen de vendor/moodiary

- Repositorio: https://github.com/ZhuJHua/moodiary
- Commit: `2c552ddd7939a054122380397fb914cf000824b0`. Copiado el 2026-11-08 (lane 283, editor del diario).
- Licencia: AGPL-3.0 (`LICENSE`). Revisión legal pendiente de Gabriel (D-BP2).
- Carpeta copiada, sin `node_modules`, `dist` ni `pnpm-lock.yaml`, y sin cambios:
  - `packages/feature_base/moodiary_editor/editor` -> `vendor/moodiary/editor` (editor web React 19 + TypeScript + Tiptap 3, ~5.650 líneas).
- Se portó a `src/components/diario/editor/` lo que sirve a una web: núcleo del editor (`core/editor`), vistas de nodos (`ui/nodes`), estilos. Se descartó el puente con Flutter (`core/bridge`, `main.tsx`, `EditorShell`, `EditorMetaHeader`). Quedan para otras lanes: nodos de audio, video y adjuntos (fase 3) y enlaces entre entradas `DiaryLink` (fase 2).
- `vendor/` está excluido de `tsconfig.json`, de eslint y de `npm test`. Lo portado a `src/` lleva la cabecera `// Portado de vendor/moodiary/<ruta> (ZhuJHua/moodiary@2c552dd)`.
