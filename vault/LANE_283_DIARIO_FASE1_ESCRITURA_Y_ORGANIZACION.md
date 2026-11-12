---
lane: 283
titulo: Diario fase 1 — escritura y organización (port de storypad, Daily You y moodiary)
plane: "#31"
estado: integrada
rama: task/lane-283-diario-editor
agente: claude
actualizado: 2026-11-08
---

# Lane 283 — Diario fase 1: escritura y organización

Continuación de [[LANE_272_DIARIO_PERSONAL_FAMILIAR]]. Reservadas **283–286** (una lane por bloque, en serie porque todas tocan `src/components/diario/`, `src/lib/diario/` y `prisma/schema.prisma`).

## Especificación
Gabriel (2026-11-08): «Estos repos fueron solo consultados: storypad, Daily_You y moodiary. Sin embargo, se debía clonar, luego traducir el código o adaptar para que hicieran fit con la app y mantuvieran features. El resultado fue que los diarios son básicos y no tienen ni de cerca las funcionalidades de los repos mencionados.» Aprobó el plan de 4 fases («si») y arrancar por la **fase 1**.

Regla de la lane: se **porta la lógica y las funciones** de los repos a Next.js/Prisma (traducción Dart→TS, reutilización directa donde ya es TS), no se escribe una versión propia «inspirada». Lo que se deja afuera se lista con motivo y lo decide Gabriel (ver feedback en memoria `clonar-es-portar-funciones`). Licencias: D-BP2 (no frenan). Trazabilidad: D-BP3 (cabecera `// Portado de vendor/<repo>/<ruta> (<owner>/<repo>@<commit7>)`, `ORIGEN.md`, `THIRD_PARTY_NOTICES.md`).

## Inventario leído (2026-11-08, código fuente, no README)
Corrección de lo dicho antes: storypad no trae «45+ emociones» en el código sino **23 emojis sugeridos de sentimiento**, 30 de actividad y 8 de clima (el usuario agrega los suyos); y moodiary **sí** aporta: `packages/feature/moodiary_diary` tiene ~13.000 líneas y `packages/feature_base/moodiary_editor/editor` es una app **React 19 + TypeScript + Tiptap 3** (~5.650 líneas), portable casi directo.

| Fuente | Qué hay (archivos leídos) | Se porta en |
|---|---|---|
| **Daily You** `lib/models/{entry,tag,tag_category,template,mood,mood_scale_level,mood_scale_preset}.dart`, `database/*_dao.dart`, `providers/{tags,templates,entries,mood_scale}_provider.dart`, `template_renderer.dart`, `utils/search_matcher.dart`, `pages/{edit_entry_page,entry_view_page}.dart` | Etiquetas de 2 tipos (`label` y `tracker` con valor), categorías de etiquetas (ícono, color, orden), etiquetas por defecto (Favorito, Energía; Emociones: 6; Actividades: 6), plantillas con etiquetas y variables `{{date}}`/`{{time}}` con formato, plantilla por defecto, 3 plantillas de ejemplo, escala de ánimo configurable con 3 presets (emoji, íconos, colores) y etiqueta/ícono/color por nivel, búsqueda por texto, orden por fecha/ánimo/tracker, autoguardado (5 s + al ocultar), borrador, fecha **y hora** editables, borrar con confirmación | 284, 285, 286 |
| **storypad** `core/databases/models/{story,tag,tag_category}_db_model.dart`, `core/objects/search_filter_object.dart`, `views/search/search_view_model.dart` | `starred`, `pinned`, conteo de palabras/caracteres, sentimientos/actividad/clima/personas como **categorías de etiquetas con emoji** (sentimiento = una sola, actividad = varias), filtro de búsqueda (texto, años, mes, día, etiquetas, estrella, fijada, plantilla), conteo por etiqueta, filtro persistido | 284, 285 |
| **moodiary** `feature/moodiary_diary/lib/src/application/{diary_filter,search_controller}.dart`, `feature_base/moodiary_data/lib/src/{category_repository,diary_content,diary_derive}.dart`, `feature_base/moodiary_editor/editor/**` | **Editor Tiptap 3 en React** (negrita, listas, tareas, tablas, código con resaltado, resaltado, enlaces, imágenes/audio/video/adjuntos como nodos, **enlaces entre entradas** `DiaryLink`, buscar dentro del documento, reglas de entrada, párrafo final), categorías jerárquicas con color (`parent_id`), una categoría por entrada, búsqueda con categoría + rango (7 días / 30 días / año / personalizado) + orden (relevancia/fecha) + paginado de 30 + historial de 12 | 283, 285 |

No leído todavía (se lee al portar cada archivo, regla «lectura completa»): widgets de Daily You (`tag_picker_dialog`, `editor_action_bar`, `markdown_preview_controller`, `templates_page`, `tags_settings`), `edit_story_*` y `templates/*` de storypad, `category_manager_page`/`category_drawer`/`search_page` de moodiary, y los archivos del editor Tiptap salvo `kit.ts` (primeras 80 líneas).

## Decisiones (propuestas; las marcadas ⚑ esperan a Gabriel)
- ⚑ **D1 · Editor = el de moodiary (Tiptap 3 + React), no un textarea con Markdown.** Es el que más funciones trae (tareas, tablas, código, media, enlaces entre entradas, búsqueda en el texto) y ya es React/TS. Se saca todo lo que es puente con Flutter (`core/bridge/*`, `main.tsx`, `EditorShell` del WebView). Costo: segundo editor en la app (notas usa BlockNote, que también se apoya en ProseMirror/Tiptap). Alternativa más liviana: textarea + barra Markdown como Daily You con `react-markdown` (ya instalado).
- D2 · **Datos del texto:** `Diario_Entradas.contenido Json?` (documento Tiptap) + `texto` pasa a ser siempre el **texto plano derivado** (búsqueda, vista previa, exportar). Las entradas actuales (solo `texto`) siguen válidas: el editor las abre como párrafos. Sin migración de datos.
- D3 · **Etiquetas (Daily You + storypad):** `label` y `tracker` (con valor), con categoría, ícono/emoji, color y orden. Categorías por defecto: Sentimientos (23 emojis de storypad, una sola por entrada), Actividades (30, varias), Clima (8, una sola), Personas (texto). Etiquetas «Favorito» y «Energía» de Daily You. Alcance: las del **diario personal** son del autor; las del **familiar** son de la familia (las crea cualquiera, las edita su creador o un padre).
- ⚑ D4 · **Ánimo 1–5 se mantiene** (escala de Daily You) y se vuelve **configurable** (preset emoji/íconos/colores + etiqueta, ícono y color por nivel). Los sentimientos de storypad son etiquetas aparte: conviven con el ánimo.
- ⚑ D5 · **Categoría de la entrada (moodiary)**, jerárquica y con color, una por entrada, además de las etiquetas. Si Gabriel prefiere solo etiquetas, se descarta 285 M-categoría.
- D6 · **Favorita y fijada** (storypad `starred`/`pinned`): columnas booleanas; las fijadas van arriba de la lista del día.
- D7 · **Búsqueda (moodiary + storypad + Daily You):** texto (título + texto plano, sin distinguir mayúsculas), etiquetas, categoría, ánimo, favoritas, rango (7 días / 30 días / año / personalizado), orden relevancia/fecha, paginado de 30, historial de 12 búsquedas (navegador). Siempre filtrado por `autorId` en el personal (D1 de 272 sigue).
- D8 · **Plantillas (Daily You):** nombre, contenido, etiquetas, variables `{{date}}` y `{{time}}` con formato, plantilla por defecto, y 3 de ejemplo. Propuesta de ejemplo propia para la familia: «Examen de conciencia» (a confirmar por Gabriel; no se agrega sin su OK).
- ⚑ D9 · **Fecha y hora editables, sin tope de 30 días hacia atrás** (como Daily You; solo se bloquea el futuro) y **autoguardado** a los 5 s + al salir de la pestaña, con borrador. El tope de 30 días lo puso la spec 272, no Gabriel.
- D10 · **Se mantiene** todo lo de 272: privacidad del personal en el servidor, 4 fotos por `/api/upload`, varias entradas por día (tope 50).
- Fuera de esta fase, con motivo: audio/video y notas de voz (los pide fase 3 y dependen de la lane 277 fase B, archivos grandes); sync con Drive/WebDAV/S3, biometría, interfaz de tablet y compras Pro (no aplican a una web familiar); grafo, mapa, lugares, clima automático y asistente de moodiary (fase 4).

## Arquitectura
- **Base** (solo el orquestador, regla 7 de AGENTS.md y D-BP4; todo aditivo): en `Diario_Entradas` columnas `Contenido` (Json?), `Favorita`, `Fijada` (Boolean default false), `Categoria_ID` (Int?); tablas `Diario_Categorias`, `Diario_Etiqueta_Grupos`, `Diario_Etiquetas`, `Diario_Entrada_Etiquetas`, `Diario_Plantillas`, `Diario_Plantilla_Etiquetas`, `Diario_Escala_Animo`. El SQL exacto sale de `prisma migrate diff` al empezar cada lane; si trae `DROP`, no se aplica.
- Lógica pura y testeada en `src/lib/diario/` (reglas de etiquetas, plantillas y variables, filtro de búsqueda, derivar texto plano del documento), servidor en `src/lib/diario/servidor*.ts`, API en `src/app/api/diario/**`.
- Editor portado en `src/components/diario/editor/` (+ `vendor/moodiary/` con `ORIGEN.md`, excluido de tsc/eslint/test como los demás vendor). Dependencias nuevas a instalar: las `@tiptap/*` que usa `kit.ts` (3.32.0), `lowlight`, `marked`, `prosemirror-search`; se verifica contra las ya instaladas (`@blocknote/*` trae parte de Tiptap) para no duplicar versiones.

## Orden y archivos en alcance
| Lane | Bloque | Fuentes | Se entrega |
|---|---|---|---|
| **283** | Editor | moodiary `moodiary_editor/editor` | `EditorEntrada` usa el editor Tiptap; `contenido` + texto plano derivado; barra de formato; autoguardado; hora editable; sin tope de 30 días |
| **284** | Etiquetas y categorías | Daily You (`tag*`), storypad (`tag*`), moodiary (`category_*`) | etiquetas `label`/`tracker`, categorías por defecto, selector en el editor, administrador en ajustes, chips en la lista, categoría de la entrada |
| **285** | Búsqueda y marcas | moodiary `search_*`, storypad `search_*`, Daily You `search_matcher` | favoritas, fijadas, pantalla de búsqueda con filtros, orden, paginado, historial, conteo por etiqueta |
| **286** | Plantillas y escala de ánimo | Daily You `template_*`, `mood_scale_*` | plantillas con etiquetas y variables, plantilla por defecto, ánimo configurable |

Archivos en alcance de todo el bloque: `prisma/schema.prisma` · `src/lib/diario/**` · `src/app/api/diario/**` · `src/components/diario/**` · `src/app/dashboard/diario/**` · `vendor/moodiary/**` · `THIRD_PARTY_NOTICES.md` · `package.json`/lockfile (283). Ninguna otra lane abierta toca esos archivos (tablero vacío, `dev` = `origin/dev` = `e634b01` el 2026-11-08).

## Microtareas (283, bosquejo; el código exacto lo escribe el orquestador al empezar, D-BP8)
- [x] M1 · Copiar `editor/` de moodiary a `vendor/moodiary/` con `ORIGEN.md` (commit `2c552dd`) y aviso en `THIRD_PARTY_NOTICES.md`. [orquestador]
- [x] M2 · Leer completo `core/editor/*`, `ui/*` y `styles/*` del editor y listar qué se saca (puente Flutter, `qweather-icons`, `zustand` si solo sirve al puente) y qué se mantiene. [orquestador]
- [x] M3 · Esquema: `Contenido` en `Diario_Entradas`; SQL aditivo y aplicación en base. [orquestador]
- [x] M4 · Reglas puras + tests: derivar texto plano del documento Tiptap, validar contenido (tamaño, nodos permitidos), compatibilidad con entradas viejas. [agy]
- [x] M5 · Servidor y API: guardar/leer `contenido`, `texto` derivado, autoguardado idempotente, hora editable, sin tope de 30 días. [agy]
- [x] M6 · Port del editor a `src/components/diario/editor/` con cabecera de trazabilidad en cada archivo. [agy, receta de port]
- [x] M7 · `EditorEntrada` y `ListaDia` usan el editor y muestran el contenido (solo lectura). [agy]
- [ ] M8 · Prueba de pantalla: la hace **Gabriel** (AGENTS.md regla 10: no se levantan servidores).

## Criterios de aceptación
- Se puede escribir con formato (negrita, listas, tareas, tablas, código, enlaces) y se ve igual al leer.
- Las entradas escritas en 272 se abren y se guardan sin perder nada.
- El texto plano derivado coincide con el contenido (búsqueda de 285 lo usa).
- Privacidad del personal intacta (tests de 272 siguen en verde).

## Gates
`npx prisma validate` · `npx tsc --noEmit` · `npm test` · `npx eslint src/lib/diario src/app/api/diario src/components/diario src/app/dashboard/diario`

## Pendientes
- ⚑ Gabriel: D1 (editor Tiptap de moodiary vs textarea Markdown), D4 (ánimo configurable), D5 (categoría de moodiary además de etiquetas), D9 (hora editable, sin tope de 30 días, autoguardado).
- Fases 2 (vistas y estadísticas), 3 (adjuntos y datos), 4 (extras de moodiary) se reservan cuando termine la 286.

## Hallazgos
- 2026-11-08 (283): el editor se portó con estos desvíos, todos a decidir por Gabriel si quiere revertirlos: (a) se sacó el puente con Flutter (`post`, `scheduleChange`, resolución de media); (b) **audio, video y adjuntos** quedan para la fase 3 (dependen de la lane 277 fase B); (c) **enlaces entre entradas** (`DiaryLink`) quedan para la fase 2; (d) la **búsqueda dentro del documento** (`prosemirror-search`) no tiene interfaz todavía; (e) se quitaron las reglas de entrada de caracteres de ancho completo (teclados chinos).
- 2026-11-08 (283): al verificar en Node que el esquema del editor y el sanitizador del servidor coinciden, apareció que `code` excluye a las demás marcas en Tiptap; el servidor ahora descarta las otras marcas si hay `code` (test agregado). Ida y vuelta servidor→editor→servidor es idéntica con todos los nodos y marcas.
- 2026-11-08: la lane 272 describió moodiary como «no aporta nada distinto». Falso: ver inventario.
- El editor de moodiary es el único de los tres repos que ya es JavaScript/React: es el caso donde «clonar» es literal.

## Bitácora
- 2026-11-08 · claude · RESERVA · 283–286 reservadas a pedido de Gabriel («si» al plan de 4 fases); diseño escrito, sin tocar código ni crear ramas. Espera OK de Gabriel a las decisiones ⚑ antes de M1.
- 2026-11-08 · claude · INICIO 283 · las decisiones ⚑ no tuvieron respuesta explícita de Gabriel; se sigue con los valores propuestos bajo su directiva «continua hasta terminar» (editor Tiptap de moodiary, ánimo configurable, categoría de moodiary, hora editable sin tope, autoguardado). Rama `task/lane-283-diario-editor`.
- 2026-11-08 · claude · FIN 283 (código) · editor Tiptap portado; `Contenido` y `Hora` en base (aditivo, sin DROP); sanitizador en servidor; `EditorEntrada` con autoguardado; `ListaDia` muestra el contenido en solo lectura. Gates: `prisma validate` ok · `tsc` ok · `eslint` ok · `npm test` 777 tests, 738 ok, 0 fallan, 39 salteados. Falta la prueba de pantalla de Gabriel (M8).
- 2026-11-08 · claude · INTEGRADA · PR #89 (merge 7418277), worktree y rama limpiados.
