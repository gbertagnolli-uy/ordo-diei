# Origen de vendor/moodiary

- Repositorio: https://github.com/ZhuJHua/moodiary
- Commit: `2c552ddd7939a054122380397fb914cf000824b0`. Copiado el 2026-11-08 (lane 283, editor del diario).
- Licencia: AGPL-3.0 (`LICENSE`). Revisión legal pendiente de Gabriel (D-BP2).
- Carpeta copiada, sin `node_modules`, `dist` ni `pnpm-lock.yaml`, y sin cambios:
  - `packages/feature_base/moodiary_editor/editor` -> `vendor/moodiary/editor` (editor web React 19 + TypeScript + Tiptap 3, ~5.650 líneas).
- Se portó a `src/components/diario/editor/` lo que sirve a una web: núcleo del editor (`core/editor`), vistas de nodos (`ui/nodes`), estilos. Se descartó el puente con Flutter (`core/bridge`, `main.tsx`, `EditorShell`, `EditorMetaHeader`). Quedan para otras lanes: nodos de audio, video y adjuntos (fase 3) y enlaces entre entradas `DiaryLink` (fase 2).
- `vendor/` está excluido de `tsconfig.json`, de eslint y de `npm test`. Lo portado a `src/` lleva la cabecera `// Portado de vendor/moodiary/<ruta> (ZhuJHua/moodiary@2c552dd)`.

## Ampliación (lane 284, 2026-11-08)
- Se agrega, sin cambios, `packages/feature_base/moodiary_data/lib/src/category_repository.dart` (categorías jerárquicas con color; una por entrada; no se borra una categoría que tiene entradas) -> `vendor/moodiary/packages/feature_base/moodiary_data/lib/src/category_repository.dart`. Lo portado a `src/` lleva la cabecera `// Portado de vendor/moodiary/<ruta> (ZhuJHua/moodiary@2c552dd)`.

## Ampliación (lane 285, 2026-11-08)
- Se agregan, sin cambios: `packages/feature/moodiary_diary/lib/src/application/{search_controller,diary_filter}.dart`, `packages/feature/moodiary_diary/lib/src/presentation/search/{search_page,search_result_card}.dart`, `packages/feature_base/moodiary_models/lib/src/search.dart` y `packages/feature_base/moodiary_data/lib/src/diary_repository.dart` (búsqueda con resaltado y extracto, orden, página, historial).

## Ampliación (lane 287, 2026-11-08)
- Se agregan, sin cambios: `packages/feature_base/moodiary_data/lib/src/{mood_insights,mood_insights_controller,mood_insights_repository}.dart` y `packages/feature/moodiary_diary/lib/src/presentation/mood_insights/{mood_insights_page,mood_period_header,mood_period_picker,mood_patterns,mood_calendar}.dart` (resumen de ánimo por semana, mes y año). El calendario de ánimo (`mood_calendar`) se porta en la lane 288.

## Ampliación (lane 288, 2026-11-08)
- Se agregan, sin cambios: `packages/feature/moodiary_diary/lib/src/presentation/calendar/calendar_page.dart` (mes de seis filas y vista del año), `packages/foundation/mui/lib/src/components/common/heatmap.dart` (`MHeatmap`), `packages/feature_base/moodiary_data/lib/src/dashboard_controller.dart` y su `test/heatmap_level_test.dart` (niveles del mapa de calor) y `mobile/lib/app/me/me_page.dart` (tarjeta del mapa de calor).

## Ampliación (lane 289, 2026-11-08)
- Se agregan, sin cambios: `packages/feature/moodiary_diary/lib/src/application/{timeline_group,timeline_controller,diary_stamp}.dart`, `packages/feature/moodiary_diary/lib/src/presentation/widget/{timeline_view,timeline_tile}.dart` y `packages/feature/moodiary_diary/test/diary/{timeline_group_test,timeline_tile_test}.dart` (línea de tiempo por mes con eje, puntos de ánimo y cortes por días sin entradas).
