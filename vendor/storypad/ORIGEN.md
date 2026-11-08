# Origen de vendor/storypad

- Repositorio: https://github.com/theachoem/storypad
- Commit: `a76825e88740c935458beff404cbb95c889e4e2e`. Copiado el 2026-11-08 (lane 284, categorías de etiquetas con emoji).
- Licencia: GPL-3.0 (`LICENSE`). Revisión legal pendiente de Gabriel (D-BP2).
- Copia parcial, sin cambios: `lib/core/databases/models/{tag_db_model,tag_category_db_model}.dart` y `lib/providers/tags_provider.dart`. Las fuentes de búsqueda y de marcas se copian en la lane 285.
- Lo portado a `src/` lleva la cabecera `// Portado de vendor/storypad/<ruta> (theachoem/storypad@a76825e)`.

## Ampliación (lane 285, 2026-11-08)
- Se agregan, sin cambios, las fuentes de búsqueda y filtros: `lib/core/objects/search_filter_object.dart`, `lib/core/storages/search_filter_storage.dart`, `lib/views/search/{search_view,search_view_model,search_content}.dart` y `lib/views/search/filter/{search_filter_view,search_filter_view_model,search_filter_content}.dart`.

## Ampliación (lane 287, 2026-11-08)
- Se agregan, sin cambios, las fuentes de estadísticas: `lib/core/objects/stats/{stats_range,story_stats_object}.dart`, `lib/core/objects/month_recap_stats_object.dart`, `lib/core/services/stories/{story_stats_service,monthly_story_stats_service}.dart` y `lib/views/stats/{stats_view,stats_view_model,stats_content,stats_section}.dart` con `local_widgets/{stats_emoji_grid,stats_label_list,stats_metric_chip,stats_trend}.dart`.

## Ampliación (lane 288, 2026-11-08)
- Se agregan, sin cambios, las fuentes del calendario de ánimo y de la lista de años: `lib/views/calendar/mood/{mood_calendar_view,mood_calendar_view_model,mood_calendar_content}.dart` y `lib/views/home/years/{home_years_view_model,home_years_content}.dart`.
