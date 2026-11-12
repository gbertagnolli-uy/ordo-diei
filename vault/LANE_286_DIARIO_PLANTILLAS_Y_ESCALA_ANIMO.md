---
lane: 286
titulo: Diario fase 1 — plantillas y escala de ánimo configurable (port de Daily You)
plane: "#31"
estado: integrada
rama: task/lane-286-diario-plantillas-escala
agente: claude
actualizado: 2026-11-08
---

# Lane 286 — Plantillas y escala de ánimo

Cuarta y última lane de la fase 1 de [[LANE_283_DIARIO_FASE1_ESCRITURA_Y_ORGANIZACION]]. Regla: se porta, no se «inspira» (memoria `clonar-es-portar-funciones`). Fuentes copiadas a `vendor/` con `ORIGEN.md` (D-BP3).

## Fuentes leídas completas (2026-11-08)
- **Daily You** `7cc237d`: `models/{template,mood,mood_scale_level,mood_scale_preset}.dart`, `database/{template_dao,template_tag_dao,mood_scale_dao}.dart`, `providers/{templates,mood_scale}_provider.dart`, `template_renderer.dart`, `utils/{mood_scale_visuals,text_editing}.dart`, `widgets/{edit_template,template_select,template_select_popup,edit_mood_scale,mood_scale_setting,mood_scale_glyph,entry_mood_picker,mood_icon}.dart`, `pages/settings/templates_page.dart`, `pages/edit_entry_page.dart` (plantilla por defecto y etiquetas de plantilla), `l10n/intl_es.arb` (claves `template*`).

## Qué se porta (mapa fuente → web)
| Función | Fuente | En esta app |
|---|---|---|
| Plantilla con nombre y texto | `Template`, `TemplateDao` | `DiarioPlantilla` (`Contenido` Tiptap + `Texto` plano derivado) |
| Etiquetas de la plantilla (se ponen al usarla) | `TemplateTag`, `TemplateTagDao`, `_applyInsertedTemplateTags` | `DiarioPlantillaEtiqueta`; `fusionarEtiquetas` |
| Variables `{{date}}`, `{{time}}` con formato `{{date:yyyy-MM-dd}}`; las desconocidas quedan igual; formato inválido → formato predeterminado | `TemplateRenderer.populate` | `poblar` / `poblarDocumento` (`plantillas.ts`) |
| Insertar plantilla: vacío → reemplaza; con cursor → inserta ahí; sin cursor → agrega al final | `insertTemplateText` | `EditorTexto` con `insertarContenido` |
| Plantilla predeterminada: abre cada entrada nueva con su texto y sus etiquetas; una sola | `getDefaultTemplate`, `Settings.defaultTemplate` | `Predeterminada` (una por ámbito/persona) |
| Siembra de 3 plantillas: Fecha y hora, Resumen del día, Reflexión | `createDefaultTemplates` | siembra única por ámbito (`DiarioSembrado`, clave `plantillas`) |
| Selector de plantillas al escribir («Agregar una plantilla», «Administrar plantillas») | `TemplateSelect`, `showTemplateSelectPopup` | `SelectorPlantilla` |
| Administrar: lista, estrella de predeterminada, editar, borrar con confirmación, botones fecha / hora / etiquetas | `TemplateSettings`, `EditTemplate` | `AdministrarPlantillas`, `EditorPlantilla` |
| Escala de ánimo de 5 niveles: etiqueta, ícono (emoji o catálogo) y color por nivel | `MoodScaleLevel`, `MoodScaleDao`, `MoodScaleProvider` | `DiarioEscalaAnimo`, `escala.ts` |
| 3 presets: emoji, íconos, colores | `MoodScalePreset` | `PRESETS_ESCALA` |
| Editar la escala (presets arriba, 5 filas de mayor a menor, nombre opcional con el predeterminado de ayuda) | `EditMoodScale` | `EditarEscalaAnimo` |
| La escala se usa en el selector, la lista, el calendario, el resumen y los filtros | `EntryMoodPicker`, `MoodIcon`, `MoodScaleGlyph` | contexto `EscalaAnimo` + `GlifoAnimo` |

## Decisiones
- **P1 · Ámbito.** Personal = plantillas y escala propias. Familiar = compartidas: las plantillas las crea cualquiera y las edita o borra su creador o un padre (las sembradas, solo un padre); la escala familiar y la plantilla predeterminada familiar las cambia solo un padre.
- **P2 · Sin filas = predeterminada.** La escala sin configurar es la de hoy (😣 🙁 😐 🙂 😄, nombres Muy mal … Muy bien, colores de los tokens `destructive`, `warning`, `muted`, `primary`, `success`); al guardar se escriben los 5 niveles, y «Restablecer» borra las filas. Los presets de Daily You (emoji 😔😕😐🙂☺️, íconos, colores) son opciones del editor.
- **P3 · Variables con la fecha y hora de la entrada**, no la del instante de insertar (Daily You usa `DateTime.now()`): una entrada de ayer con «Fecha y hora» dice ayer. Para una entrada de hoy es lo mismo. **Desvío a confirmar por Gabriel.**
- **P4 · La plantilla predeterminada sí reemplaza las variables al abrir una entrada nueva.** En Daily You (`_initEntry`) el texto de la predeterminada se copia sin reemplazar `{{date}}`, lo que parece un descuido; acá se renderiza igual que al insertar. **Desvío a confirmar.**
- **P5 · El cuerpo de la plantilla es un documento Tiptap**, no Markdown: las 3 de ejemplo se arman con títulos, listas y cita.
- **P6 · Plantillas sin contadores.** Un contador necesita un valor numérico en cada entrada; la plantilla no tiene valor para darle, así que solo admite etiquetas comunes (el servidor lo hace cumplir).
- **P7 · Plantilla con etiquetas de selección única** (sentimiento, clima): al usarla no pisa lo que ya eligió la persona; si el grupo ya tiene una, se omite la de la plantilla.
- **P8 · Formatos de fecha con la sintaxis de date-fns** (`yyyy-MM-dd`, `HH:mm`, `EEEE d 'de' MMMM`), que es la misma de Unicode que usa Dart `DateFormat` salvo detalles; un formato que no se puede aplicar vuelve al predeterminado, como en Daily You. Predeterminados: fecha `d/M/yyyy`, hora `HH:mm`.
- Fuera de esta lane, con motivo: importar/exportar plantillas (`share_templates_dialog`, `templates_tags_transfer`) → fase 3 (datos); gráfico del resumen de ánimo (`mood_summary_chart`) → fase 2; animación del selector (`MorphingBurst`, `PunchScale`) → fase 4 (extras).

## Arquitectura
- Esquema (aditivo): `Diario_Plantillas`, `Diario_Plantilla_Etiquetas`, `Diario_Escala_Animo`.
- Reglas puras con tests: `src/lib/diario/plantillas.ts`, `src/lib/diario/escala.ts`.
- Servidor: `servidor-plantillas.ts`, `servidor-escala.ts`. API: `/api/diario/plantillas`, `/api/diario/plantillas/[id]`, `/api/diario/escala`.
- UI: `usePlantillas`, `useEscalaAnimo` + contexto, `GlifoAnimo`, `SelectorPlantilla`, `AdministrarPlantillas`, `EditorPlantilla`, `EditarEscalaAnimo`; el editor de texto expone `insertarContenido`.

## Archivos en alcance
`prisma/schema.prisma` · `src/lib/diario/**` · `src/app/api/diario/**` · `src/components/diario/**` · `vendor/Daily_You/**` · `THIRD_PARTY_NOTICES.md`.

## Microtareas
- [x] M1 · Leer las fuentes completas.
- [x] M2 · Copiar fuentes a `vendor/` con `ORIGEN.md` y avisos.
- [x] M3 · Esquema aditivo (`migrate diff`, sin DROP) y aplicarlo.
- [x] M4 · Reglas puras + tests (`escala.ts`, `plantillas.ts`).
- [x] M5 · Servidor + API (escala, plantillas, siembra).
- [x] M6 · Interfaz: escala (contexto, glifo, editor) y plantillas (selector, administrar, editor, predeterminada).
- [x] M7 · Gates, PR, integración y limpieza.
- [ ] M8 · Prueba de pantalla: Gabriel (AGENTS.md regla 10).

## Gates
`npx prisma validate` · `npx tsc --noEmit` · `npm test` · `npx eslint src/lib/diario src/app/api/diario src/components/diario src/app/dashboard/diario`

## Hallazgos
- La base no tiene entradas de diario ni filas de escala/plantillas de prueba: el comportamiento con datos reales (siembra de las 3 plantillas, escala guardada, plantilla predeterminada al abrir) queda para la prueba de pantalla de Gabriel. No se tocó la base más que para aplicar el SQL aditivo del esquema.
- La plantilla sin tocar no cuenta como entrada: si se abre con la predeterminada y no se escribe nada distinto, no se guarda (igual que una entrada vacía).
- En el editor de plantilla, el selector de etiquetas muestra solo etiquetas comunes (P6); si se crea desde ahí un contador, no aparece en la lista.
- **A decidir por Gabriel:** P3 (variables con fecha/hora de la entrada) y P4 (la predeterminada renderiza variables al abrir).

## Bitácora
- 2026-11-08 · claude · INICIO 286 · lane creada con `nueva-lane.sh` desde `dev` = `88c1ff3`. Tablero sin otras lanes del diario.
- 2026-11-08 · claude · FIN 286 · commit 8e2da53. Gates: prisma validate ok, tsc ok, eslint ok, npm test 799 pass / 0 fail / 39 skip. Pendiente: PR, integración y prueba de pantalla de Gabriel.
- 2026-11-08 · claude · INTEGRADA · PR #92 mergeado con merge commit (7d5e61f), lane limpiada. Falta M8: prueba de pantalla de Gabriel.
