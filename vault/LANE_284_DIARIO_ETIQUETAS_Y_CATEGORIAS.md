---
lane: 284
titulo: Diario fase 1 — etiquetas y categorías (port de Daily You, storypad y moodiary)
plane: "#31"
estado: integrada
rama: task/lane-284-diario-etiquetas
agente: claude
actualizado: 2026-11-08
---

# Lane 284 — Etiquetas y categorías del diario

Segunda lane de [[LANE_283_DIARIO_FASE1_ESCRITURA_Y_ORGANIZACION]] (diseño general, decisiones D1–D10, inventario). Regla: se porta, no se «inspira» (memoria `clonar-es-portar-funciones`). Fuentes copiadas a `vendor/` con `ORIGEN.md` (D-BP3).

## Fuentes leídas completas (2026-11-08)
- **Daily You** `7cc237d`: `models/{tag,tag_category,tag_icon_type}.dart`, `providers/tags_provider.dart`, `database/entry_tag_dao.dart`, `widgets/{tag_picker_dialog,edit_tag,edit_category,tag_chip,tracker_value_dialog,tag_grouped_chip_list,entry_tag_chips,tag_attachment_source,icon_picker_dialog,color_picker_dialog}.dart`, `pages/settings/tags_settings.dart`, `utils/{tag_visuals,tag_name_sanitizer}.dart`.
- **storypad** `a76825e`: `tag_db_model.dart`, `tag_category_db_model.dart` (sentimiento/clima = una sola; actividad/personas = varias; 23/30/8 emojis sugeridos), `providers/tags_provider.dart` (primeras 150 líneas).
- **moodiary** `2c552dd`: `category_repository.dart` (categorías jerárquicas con color; no se borra una con entradas).

## Qué se porta (mapa fuente → web)
| Función | Fuente | En esta app |
|---|---|---|
| Etiqueta `label` y `tracker` (con valor numérico) | Daily You `Tag`, `EntryTag`, `TrackerValueDialog` | `DiarioEtiqueta.tipo` (`etiqueta`/`contador`), `DiarioEntradaEtiqueta.valor`; diálogo de valor con los 10 valores más usados |
| Categorías de etiquetas con ícono, color y orden | Daily You `TagCategory`, `EditCategory` | `DiarioGrupoEtiquetas` |
| Selección única (sentimiento, clima) o múltiple (actividad, personas) | storypad `multiSelect` | `DiarioGrupoEtiquetas.seleccionUnica`; el servidor rechaza dos etiquetas de un grupo de selección única |
| Ícono = emoji tipeado o ícono del catálogo; color = paleta de 18 o libre | Daily You `IconPickerDialog`, `ColorPickerDialog` | `SelectorIcono` (catálogo de íconos lucide + emoji libre), `SelectorColor` (paleta + color libre) |
| Nombre de etiqueta sin `\ / " ' \` # [ ] { } , :` y con espacios colapsados | Daily You `sanitizeTagName` | `limpiarNombre` |
| Buscar etiquetas por nombre o por categoría y agrupar por categoría | Daily You `buildSections` | `armarSecciones` |
| Selector: etiquetas puestas arriba, búsqueda, «crear desde la búsqueda», orden manual/por uso | Daily You `TagPickerDialog` (modo attach) | `SelectorEtiquetas` |
| Administrar: categorías plegables, conteo de entradas por etiqueta, editar, borrar con aviso, reordenar, mover de categoría | Daily You `TagsSettings`, `EditTag` | `AdministrarDiario` |
| Borrar una categoría borra sus etiquetas y las saca de las entradas; borrar una etiqueta la saca de las entradas | Daily You `removeCategoryAndTags`, `remove` | transacción en el servidor |
| Etiquetas por defecto: Energía (tracker), Emociones, Actividades | Daily You `createDefaultTags` | siembra única por ámbito (`DiarioSembrado`) |
| Sentimientos (23), Actividades (30), Clima (8), Personas (texto) | storypad `suggest*` | siembra única; los 23 + «Agradecido» de Daily You |
| Categoría de la entrada, jerárquica, con color, una por entrada; no se borra con entradas | moodiary `CategoryRepository` | `DiarioCategoria`, `DiarioEntrada.categoriaId` |

## Decisiones
- **E1 · Ámbito.** Personal = etiquetas y categorías propias de quien escribe (nadie más las ve). Familiar = compartidas por toda la familia: las crea cualquiera; las edita o borra su creador o un padre (las sembradas, solo un padre). Se hace cumplir en el servidor.
- **E2 · Siembra única por ámbito** (Daily You las crea una sola vez al primer arranque): tabla `DiarioSembrado(ámbito, dueño, clave)` con índice único; si alguien borra todo, no se vuelven a crear.
- **E3 · «Favorito» de Daily You no se siembra como etiqueta**: la lane 285 agrega la marca de favorita nativa (storypad `starred`), que la reemplaza. Se siembra «Energía» (tracker). Desvío a confirmar por Gabriel.
- **E4 · Nombres en español para los emojis** de storypad (que guarda el título «Emoji» y no tiene nombre): puestos por mí, a revisar por Gabriel.
- **E5 · Reordenar con botones subir/bajar**, no arrastrando (hay `@dnd-kit/core` pero no `sortable`; los botones sirven con teclado y táctil). Se puede cambiar a arrastrar si Gabriel lo prefiere.
- **E6 · Categoría de la entrada, hasta 3 niveles** (moodiary no limita la profundidad; se limita para que el selector sea usable).
- **E7 · Íconos del catálogo = lucide** (~70 elegidos), no los Material de Daily You (otra familia de íconos); el emoji libre se mantiene.
- **E8 · Ordenar es una preferencia de presentación**: en el familiar cualquiera que ve las etiquetas puede reordenarlas; editar o borrar sigue siendo del creador o un padre.
- Fuera de esta lane, con motivo: importar/exportar etiquetas y plantillas (`share_tags_dialog`, `templates_tags_transfer`) → fase 3 (datos); filtros de búsqueda por etiqueta y «sin etiquetas» → lane 285; etiquetas en plantillas → lane 286; ver `entry_stats` por tracker → fase 2.

## Archivos en alcance
`prisma/schema.prisma` · `src/lib/diario/**` · `src/app/api/diario/**` · `src/components/diario/**` · `vendor/Daily_You/**` · `vendor/storypad/**` · `vendor/moodiary/**` · `THIRD_PARTY_NOTICES.md`.

## Microtareas
- [x] M1 · Copiar fuentes leídas a `vendor/` con `ORIGEN.md` y avisos.
- [x] M2 · Esquema aditivo (`migrate diff`, sin DROP) y aplicarlo.
- [x] M3 · Reglas puras + tests (`etiquetas.ts`).
- [x] M4 · Servidor: catálogo, CRUD, siembra, validar etiquetas y categoría al guardar la entrada.
- [x] M5 · API `/api/diario/catalogo/**`.
- [x] M6 · Interfaz: chips, selector, ícono, color, administrador, categoría.
- [x] M7 · Integrar en `EditorEntrada`, `ListaDia`, `DiarioVista`.
- [ ] M8 · Prueba de pantalla: Gabriel (AGENTS.md regla 10).

## Gates
`npx prisma validate` · `npx tsc --noEmit` · `npm test` · `npx eslint src/lib/diario src/app/api/diario src/components/diario src/app/dashboard/diario`

## Hallazgos
- Daily You guarda un `value` de texto por etiqueta puesta y solo valida que sea número en el diálogo; acá además lo valida el servidor.
- La base ya traía todo lo de `dev`: `migrate diff` dio solo CREATE/ADD COLUMN (sin DROP) y quedó vacío después de aplicarlo.
- Verificado sin servidor: reglas puras (12 tests), `tsc`, `eslint`, `prisma validate`. **No se probó contra la base real** (escribiría en producción); la primera vez que se abra el diario se siembra el catálogo del usuario.
- Para la prueba de pantalla de Gabriel: abrir «Etiquetas y categorías» (se siembran las predeterminadas), crear una etiqueta y un contador, ponerlas en una entrada, elegir dos sentimientos (debe reemplazar), crear una categoría de entrada con madre, borrar una etiqueta puesta y ver que sale de la entrada.

## Bitácora
- 2026-11-08 · claude · INICIO 284 · lane creada con `nueva-lane.sh` desde `dev` = `7418277`. Tablero sin otras lanes del diario.
- 2026-11-08 · claude · FIN 284 (código) · gates: prisma validate ok · tsc ok · eslint ok · npm test 789 tests, 750 ok, 0 fallan, 39 salteados. Commit 0ffbfd4. Falta la prueba de pantalla de Gabriel (M8).
- 2026-11-08 · claude · INTEGRADA · PR #90, worktree y rama limpiados.
