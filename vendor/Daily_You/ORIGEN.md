# Origen de vendor/Daily_You

- Repositorio: https://github.com/Demizo/Daily_You
- Commit: `7cc237d1dcef24a27ca0f78ad449cc199b61bea3`. Copiado el 2026-11-08 (lane 284, etiquetas del diario).
- Licencia: GPL-3.0 (`LICENSE.txt`) con términos adicionales (`ADDITIONAL_TERMS.md`: no usar el nombre «Daily You», marcar las versiones modificadas). Revisión legal pendiente de Gabriel (D-BP2).
- Copia parcial, sin cambios: solo los archivos de etiquetas, categorías de etiquetas, selector y ajustes de etiquetas (`lib/models/tag*.dart`, `lib/providers/tags_provider.dart`, `lib/database/{entry_tag,tag,tag_category}_dao.dart`, `lib/widgets/{tag_picker_dialog,edit_tag,edit_category,tag_chip,tracker_value_dialog,tag_grouped_chip_list,entry_tag_chips,tag_attachment_source,icon_picker_dialog,color_picker_dialog}.dart`, `lib/pages/settings/tags_settings.dart`, `lib/utils/{tag_visuals,tag_name_sanitizer}.dart`). Las demás fuentes se copian en las lanes 285 y 286 cuando se portan.
- Lo portado a `src/` lleva la cabecera `// Portado de vendor/Daily_You/<ruta> (Demizo/Daily_You@7cc237d)`.
- `vendor/` está excluido de `tsconfig.json`, de eslint y de `npm test`.
