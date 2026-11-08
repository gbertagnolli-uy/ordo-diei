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

## Nota (lane 290, 2026-11-08)
- No se agregan archivos: los enlaces entre entradas (`editor/src/core/editor/nodes/diary-link.ts`, `ui/{DiaryLinkSuggestion,EditorLinksPanel,link-intercept}`), la búsqueda en el documento (`editor/src/core/editor/search.ts`) y las funciones de enlaces de `diary_repository.dart` ya estaban en esta copia.

## Ampliación (lane 291, 2026-11-08)
- Se agregan, sin cambios: `packages/feature/moodiary_export/lib/src/data/{export_doc,export_options,export_scope,export_service,markdown_writer,tiptap_to_ir}.dart`, `lib/src/presentation/{export_page,format_export_page,scope_picker_page}.dart` y sus pruebas (`test/`): del documento Tiptap al Markdown y alcance de la exportación (todo, categoría, rango de fechas).

## Ampliación (lane 292, 2026-11-08)
- Se agregan, sin cambios: `packages/feature/moodiary_export/lib/src/data/import/{markdown_importer,markdown_front_matter,import_source,import_media_stage}.dart`, `lib/src/presentation/markdown_import_page.dart` y `test/import/*.dart` (importar notas Markdown con front matter y sus imágenes).

## Ampliación (lane 293, 2026-11-08)
- Se agregan, sin cambios: `packages/feature/moodiary_export/lib/src/data/image_composer.dart` y `lib/src/presentation/{image_export_page,share_sheet}.dart`, `lib/src/presentation/image_card/{card,card_style,blocks}.dart` (compartir una entrada como imagen: tarjeta con fecha, ánimo, etiquetas y cuerpo con formato, claro u oscuro, marca de agua).

## Nota (lane 294, 2026-11-08)
- No se agregan archivos: los bloques de audio, video y adjunto del editor (`editor/src/core/editor/nodes/{attachment,media}.ts`, `core/editor/media.ts`, `ui/nodes/{AttachmentNodeView,AudioNodeView,VideoNodeView}.tsx`, `ui/hooks/use-media.ts`, `styles/_blocks.scss`) ya estaban en esta copia.

## Ampliación (lane 295, 2026-11-08)
- Se agregan, sin cambios: `packages/feature/moodiary_diary/lib/src/presentation/graph/{diary_graph_page,diary_ego_graph_page,graph_canvas,graph_scene,graph_style,graph_info_card}.dart` y `test/graph_canvas_test.dart`, `packages/feature_base/moodiary_models/lib/src/diary_graph.dart`, `packages/feature_base/moodiary_data/lib/src/db/diary.drift` (consultas del grafo) y `test/diary_repository_test.dart`, y el motor de fuerzas `packages/foundation/fast_core/rust/src/graph/layout.rs` con su puente (`rust/src/api/graph_layout.rs`, `lib/graph.dart`): grafo de enlaces entre entradas (general y local) con disposición por fuerzas. `diary_repository.dart` (`buildLinkGraph`, `buildEgoGraph`) ya estaba desde la lane 285.

## Ampliación (lane 296, 2026-11-08)
- Se agregan, sin cambios: `packages/feature_base/moodiary_data/lib/src/{place_repository,place_controller}.dart` y `test/place_repository_test.dart`, `db/{base_tables,diary_tables}.drift`, `packages/feature_base/moodiary_models/lib/src/{place,diary_meta,manual_weather}.dart`, `packages/feature_base/moodiary_editor/lib/src/data/{geo_repository,weather_repository,qweather_config}.dart` y `data/model/weather.dart`, `application/edit_controller.dart`, `editor/src/ui/meta/{EditorMetaHeader.tsx,icons.ts}` y `editor/src/core/state/meta.ts`, `packages/core/moodiary_platform/lib/src/location_service.dart`, `packages/feature/moodiary_diary/lib/src/presentation/place/{place_editor,place_manager_page}.dart`, `detail/diary_page.dart`, `widget/{feed_tile,timeline_tile}.dart` y `test/diary_meta_references_test.dart`, `packages/feature/moodiary_export/lib/src/data/{markdown_writer,export_doc}.dart` e `import/{markdown_importer,markdown_front_matter}.dart`, y `packages/foundation/mui/lib/src/components/common/qweather_icon.dart`: lugares frecuentes, clima manual y automático, lugar y clima de la entrada.

## Ampliación (lane 297, 2026-11-08)
- Se agregan, sin cambios: `packages/feature/moodiary_diary/lib/src/presentation/map/{map_page,map_page.g,map_tile_source,map_tiles}.dart` y `presentation/widget/diary_entry_tile.dart`. Se portan el mapa de huellas (pines con la cantidad de entradas, lista ordenada por cantidad, hoja del lugar con sus entradas, ajustar a todos, ampliar) y el mapa del editor de lugar (pin fijo al centro, los otros lugares como círculos de 200 m, botón de ubicación). Las fuentes de baldosas de Tianditu (天地图) no se portan: solo OpenStreetMap.

## Ampliación (lane 298, 2026-11-08)
- Se agregan, sin cambios, los archivos del asistente de IA (moodiary_assistant) que se portan o se consultan: `…/moodiary_assistant/lib/src/data/assistant.dart`, `…/moodiary_assistant/lib/src/data/assistant_defs.dart`, `…/moodiary_assistant/lib/src/data/assistant_tools.dart`, `…/moodiary_assistant/lib/src/data/impl/rig_assistant.dart`, `…/moodiary_assistant/lib/src/data/model_resolver.dart`, `…/moodiary_assistant/lib/src/data/llm_provider_repository.dart`, `…/moodiary_assistant/lib/src/application/tool_approval.dart`, `…/moodiary_assistant/lib/src/application/diary_citation.dart`, `…/moodiary_assistant/lib/src/application/chat_items.dart`, `…/moodiary_assistant/lib/src/application/session_title_controller.dart`, `…/moodiary_assistant/lib/src/application/context_compaction_controller.dart`, `…/moodiary_assistant/lib/src/presentation/assistant_notes_page.dart`, `…/moodiary_assistant/lib/src/presentation/permission_mode_sheet.dart`, `…/moodiary_assistant/lib/src/presentation/tool_approval_card.dart`, `…/moodiary_assistant/lib/src/presentation/tool_approval_preview.dart`, `…/moodiary_assistant/lib/src/presentation/diary_citations.dart`, `packages/feature_base/moodiary_models/lib/src/assistant_provider_type.dart`, `packages/feature_base/moodiary_models/lib/src/assistant_tool_call.dart`, `packages/feature_base/moodiary_models/lib/src/chat_session.dart`, `packages/feature_base/moodiary_models/lib/src/memory_entry.dart`, `packages/feature/moodiary_assistant/test/application/diary_citation_test.dart`, `packages/feature/moodiary_assistant/test/application/session_title_controller_test.dart`, `packages/feature/moodiary_assistant/test/application/tool_approval_test.dart`, `packages/feature/moodiary_assistant/test/data/tool_tier_test.dart`, `packages/feature/moodiary_assistant/test/data/prompt_sections_test.dart`. Se porta el bucle de agente, las herramientas del diario, los niveles de permiso, el prompt de sistema, las citas, el título de sesión y los modelos de sesión; el puente en Rust (`fast_core`) y la capa de presentación (≈4 000 líneas de Flutter) no se copian: se rehacen con componentes web.
