---
lane: 291
titulo: Diario fase 3 — exportar el diario (Markdown, CSV y JSON; port de Daily You y moodiary)
plane: "#31"
estado: integrada
rama: task/lane-291-diario-exportar
agente: claude
actualizado: 2026-11-08
---

# Lane 291 — Exportar el diario

Primera lane de la fase 3 («adjuntos y datos») del plan aprobado por Gabriel el 2026-11-08. La fase 3 se parte en: **291 exportar**, **292 importar** (JSON propio, CSV de Daily You, Markdown, Daylio), **293 galería y compartir**, **294 adjuntos y notas de voz hasta 4 MB** (video y archivos grandes siguen esperando la lane 277 fase B). Regla: se porta, no se «inspira» (memoria `clonar-es-portar-funciones`).

## Fuentes leídas completas (2026-11-08)
- **Daily You** `7cc237d`: `utils/exports/{export_snapshot,export_json,export_csv,export_markdown,export_format,export_naming,export_registry,export_runner}.dart`.
- **moodiary** `2c552dd`: `moodiary_export/lib/src/data/{markdown_writer,tiptap_to_ir,export_scope,export_doc,export_options}.dart` y sus tests.

## Qué se porta (mapa fuente → web)
| Función | Fuente | En esta app |
|---|---|---|
| Tres formatos: Markdown, CSV y JSON | Daily You `ExportRegistry` | `FORMATOS_EXPORT`, `GET /api/diario/exportar?formato=` |
| Nombres por día: `AAAA-MM-DD`, `AAAA-MM-DD_2` si hay más de una entrada | Daily You `nameExportEntries` | `nombrarEntradas` |
| JSON completo: escala de ánimo, categorías, etiquetas (definiciones) y entradas con sus etiquetas, valores y fotos | Daily You `export_json.dart` (v2) | `documentoJson` (formato `ordo-diei-diario`, versión 1) |
| CSV con BOM: fecha, modificada, ánimo, nombre del ánimo, texto, etiquetas, adjuntos y una columna `tracker:<contador>` por contador | Daily You `export_csv.dart` | `csvDeEntradas` (+ título y categoría) |
| Markdown: una nota por entrada con front matter (fecha, ánimo, etiquetas, contadores), imágenes en `fotos/` | Daily You `export_markdown.dart`, moodiary `MarkdownWriter` | `notaMarkdown`, `markdownDeDoc` |
| Del documento Tiptap al Markdown: títulos, listas (y tareas), citas, código con valla de largo adecuado, tablas GFM, regla, imágenes, enlaces, `==resaltado==`, `<u>`, enlace a otra entrada `[[rótulo]]`, escapes | moodiary `TiptapToIr` + `MarkdownWriter` | `markdownDeDoc` |
| Alcance: todo, rango de fechas o una categoría (con hijas / sin categoría) | moodiary `ExportScope` | parámetros `desde`, `hasta`, `categoria` |
| Con o sin fotos; con fotos es un ZIP con la carpeta `fotos/` | Daily You `export_attachment_picker`, `export_runner` | parámetro `fotos`, ZIP con `fflate` |
| Unir todo en un solo Markdown | moodiary `ExportCommon.merge` | parámetro `unir` |

## Decisiones
- **X1 · Se exporta del lado del servidor** y se descarga como archivo (no hay disco local ni carpeta que elegir). Un solo archivo si no hay fotos (`.json`, `.csv`, `.md`); un `.zip` si hay fotos o si el Markdown va una nota por archivo.
- **X2 · Privacidad:** el diario personal exporta solo las entradas de quien lo pide; el familiar exporta las de toda la familia, con el nombre del autor.
- **X3 · Tope:** hasta 20.000 entradas y 150 MB de fotos por exportación. Si se pasa, el servidor avisa que reduzca el rango o exporte sin fotos (el límite de la función en Vercel).
- **X4 · El JSON propio es el formato de respaldo** (lo lee la lane 292): lleva el documento Tiptap completo (`contenido`), no solo el texto.
- **X5 · Fechas en la zona de la familia** (las mismas que ve Gabriel), con la hora de la entrada.
- **X6 · Se agregan** título, categoría (camino completo), favorita, fijada y autor, que Daily You no tiene.

## Fuera de esta lane, con motivo (a decidir por Gabriel)
- **DOCX, PDF e imagen** (moodiary `ExportFormat.docx/pdf/image`, `image_composer`): requieren motores de maquetación y fuentes; la imagen para compartir va en la lane 293.
- **Respaldo automático programado, cifrado de respaldos y nube** (Daily You `auto_backup_schedule`, `backup_encryption`; moodiary `moodiary_sync`; storypad backup en Drive): la base ya es el respaldo y está en Supabase; no aplica a una web.
- **Exportar solo entradas elegidas a mano** (`PickedScope`): se exporta por rango o categoría.
- **Audio y video** en la exportación: no existen en el diario todavía (lane 294 / 277 fase B).

## Arquitectura
- Reglas puras con tests: `src/lib/diario/exportar.ts`.
- Servidor: `src/lib/diario/servidor-exportar.ts`, ruta `GET /api/diario/exportar`.
- UI: `src/components/diario/exportar/ExportarDiario.tsx` (botón «Exportar» en `DiarioVista`).
- Dependencia nueva: `fflate` 0.8.3 (MIT; ya estaba como dependencia indirecta).
- Sin cambios de base.

## Archivos en alcance
`src/lib/diario/{exportar,servidor-exportar}*.ts` · `src/app/api/diario/exportar/**` · `src/components/diario/exportar/**` · `src/components/diario/DiarioVista.tsx` · `vendor/{Daily_You,moodiary}/**` · `THIRD_PARTY_NOTICES.md` · `package.json`, `package-lock.json`.

## Microtareas
- [x] M1 · Leer las fuentes completas.
- [x] M2 · Copiar fuentes a `vendor/`.
- [x] M3 · Ampliar `ORIGEN.md` y `THIRD_PARTY_NOTICES.md`.
- [x] M4 · Reglas puras + tests (19).
- [x] M5 · Servidor y ruta.
- [x] M6 · Interfaz.
- [x] M7 · Gates, PR #97, integración y limpieza.
- [ ] M8 · Prueba de pantalla: Gabriel (AGENTS.md regla 10).

## Gates
`npx prisma validate` · `npx tsc --noEmit` · `npm test` · `npx eslint src/lib/diario src/app/api/diario src/components/diario src/app/dashboard/diario`

## Bitácora
- 2026-11-08 · claude · INICIO 291 · lane creada desde `dev` = `5c99b3f`.
- 2026-11-08 · claude · código completo; gates: prisma validate (sin cambios de base), tsc ok, eslint ok, npm test 921 pass / 0 fail.

## Hallazgos (cierre)
- **Respuesta en streaming:** una respuesta común de una función en Vercel no pasa de 4,5 MB; la ruta devuelve el archivo en trozos de 256 KB para que un ZIP con fotos (hasta 150 MB) no choque con ese límite. No se pudo probar en producción (sin servidores): queda para la prueba de pantalla de Gabriel con un diario que tenga fotos.
- **Se agrega a Daily You:** neutralización de fórmulas en el CSV (`=`, `+`, `-`, `@` al inicio de una celda se prefijan con `'`) para que la planilla no ejecute texto del diario.
- `opcionesDeCategoria` de `LineaDeTiempo.tsx` pasó a exportarse para reutilizarla en el diálogo (archivo fuera del alcance original, cambio de una palabra).
- 2026-11-08 · claude · FIN 291 · commit 2f54886. INTEGRADA · PR #97 (merge commit 2373d13), lane limpiada. Falta M8: prueba de pantalla de Gabriel.
