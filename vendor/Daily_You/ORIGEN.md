# Origen de vendor/Daily_You

- Repositorio: https://github.com/Demizo/Daily_You
- Commit: `7cc237d1dcef24a27ca0f78ad449cc199b61bea3`. Copiado el 2026-11-08 (lane 284, etiquetas del diario).
- Licencia: GPL-3.0 (`LICENSE.txt`) con términos adicionales (`ADDITIONAL_TERMS.md`: no usar el nombre «Daily You», marcar las versiones modificadas). Revisión legal pendiente de Gabriel (D-BP2).
- Copia parcial, sin cambios: solo los archivos de etiquetas, categorías de etiquetas, selector y ajustes de etiquetas (`lib/models/tag*.dart`, `lib/providers/tags_provider.dart`, `lib/database/{entry_tag,tag,tag_category}_dao.dart`, `lib/widgets/{tag_picker_dialog,edit_tag,edit_category,tag_chip,tracker_value_dialog,tag_grouped_chip_list,entry_tag_chips,tag_attachment_source,icon_picker_dialog,color_picker_dialog}.dart`, `lib/pages/settings/tags_settings.dart`, `lib/utils/{tag_visuals,tag_name_sanitizer}.dart`). Las demás fuentes se copian en las lanes 285 y 286 cuando se portan.
- Lo portado a `src/` lleva la cabecera `// Portado de vendor/Daily_You/<ruta> (Demizo/Daily_You@7cc237d)`.
- `vendor/` está excluido de `tsconfig.json`, de eslint y de `npm test`.

## Ampliación (lane 285, 2026-11-08)
- Se agregan, sin cambios, las fuentes de búsqueda y orden: `lib/utils/{search_matcher,search_highlight,search_text_window}.dart`, `lib/providers/entries_provider.dart`, `lib/pages/entries_list_page.dart`.

## Ampliación (lane 286, 2026-11-08)
- Se agregan, sin cambios, las fuentes de plantillas y de la escala de ánimo: `lib/models/{template,mood,mood_scale_level,mood_scale_preset}.dart`, `lib/database/{template_dao,template_tag_dao,mood_scale_dao}.dart`, `lib/providers/{templates,mood_scale}_provider.dart`, `lib/template_renderer.dart`, `lib/utils/{mood_scale_visuals,text_editing}.dart`, `lib/widgets/{edit_template,template_select,template_select_popup,edit_mood_scale,mood_scale_setting,mood_scale_glyph,entry_mood_picker,mood_icon}.dart`, `lib/pages/settings/templates_page.dart`, `lib/pages/edit_entry_page.dart` y `lib/l10n/intl_es.arb` (textos de las plantillas de ejemplo).

## Ampliación (lane 287, 2026-11-08)
- Se agregan, sin cambios, las fuentes de estadísticas: `lib/stats/{entry_stats,stats_range,streaks}.dart`, `lib/models/stats_subject.dart`, `lib/utils/{bucket_combiner,chart_y_range,chart_axis}.dart`, `lib/pages/statistics_page.dart` y `lib/widgets/{stat_range_selector,stats_overview_card,distribution_chart,label_summary_card,mood_summary_chart,value_by_day_chart,value_over_time_chart}.dart`.

## Ampliación (lane 288, 2026-11-08)
- Se agregan, sin cambios, las fuentes del calendario: `lib/widgets/{vertical_calendar,entry_day_cell,year_month_picker,calendar_view_options_dialog}.dart` y `lib/utils/year_month_range.dart` (celda con portada, ánimo, contador y etiqueta; opciones del calendario; selector de año y mes).

## Ampliación (lane 289, 2026-11-08)
- Se agregan, sin cambios, las fuentes de recuerdos y línea de tiempo: `lib/{flashback_manager,time_manager}.dart`, `lib/models/flashback.dart`, `lib/widgets/flashback_card.dart`, `lib/pages/{entry_timeline_page,home_page}.dart` y `lib/pages/settings/flashback_settings.dart` (recuerdos «En este día», hace 6 meses, 1 mes y 1 semana, un buen día y un día aleatorio; línea de tiempo con orden ascendente o descendente).

## Ampliación (lane 291, 2026-11-08)
- Se agregan, sin cambios, las fuentes de exportación: `lib/utils/exports/{export_snapshot,export_json,export_csv,export_markdown,export_format,export_naming,export_registry,export_runner,export_attachment_picker}.dart` y `lib/pages/settings/backup_restore_settings.dart` (JSON v2, CSV con una columna por contador, Markdown con front matter, nombres por día).

## Ampliación (lane 292, 2026-11-08)
- Se agregan, sin cambios, las fuentes de importación: `lib/utils/imports/{import_json,import_bundle,import_writer,import_runner,import_registry,import_daylio,import_diarium,import_diaro,import_daybook,import_mybrain,import_oneshot,import_pixels,import_attachments,import_format,import_source,import_text,import_time}.dart` (JSON de Daily You versión 2 y el formato viejo, Daylio, Daybook, Diaro, MyBrain, OneShot, Pixels; Diarium queda sin portar, ver `LANE_292`).

## Ampliación (lane 293, 2026-11-08)
- Se agregan, sin cambios: `lib/pages/{gallery_page,share_page}.dart` (galería de entradas con fotos, con búsqueda, filtro por etiquetas, orden y tarjetas grandes o chicas; recibir texto de otra app y elegir el día).
