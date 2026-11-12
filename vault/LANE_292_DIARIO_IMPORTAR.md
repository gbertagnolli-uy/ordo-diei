---
lane: 292
titulo: Diario fase 3 — importar (JSON propio, Daily You, Markdown, Daylio, Daybook, Diaro, MyBrain, OneShot, Pixels)
plane: "#31"
estado: integrada
rama: task/lane-292-diario-importar
agente: claude
actualizado: 2026-11-08
---

# Lane 292 — Importar al diario

Segunda lane de la fase 3 («adjuntos y datos») del plan aprobado por Gabriel el 2026-11-08, continuación de [[LANE_291_DIARIO_EXPORTAR]]. Regla: se porta, no se «inspira» (memoria `clonar-es-portar-funciones`).

## Fuentes leídas completas (2026-11-08)
- **Daily You** `7cc237d`: `utils/imports/{import_json,import_bundle,import_writer,import_runner,import_registry,import_daylio,import_diarium,import_diaro,import_daybook,import_mybrain,import_oneshot,import_pixels,import_attachments,import_format,import_source,import_text,import_time}.dart`, `models/mood.dart`.
- **moodiary** `2c552dd`: `moodiary_export/lib/src/data/import/{markdown_importer,markdown_front_matter,import_source,import_media_stage}.dart` y sus pruebas.

## Qué se porta (mapa fuente → web)
| Función | Fuente | En esta app |
|---|---|---|
| JSON de Daily You (versión 2 y el formato viejo, una lista) | `import_json.dart` | `leerDailyYouJson` |
| Daylio (`backup.daylio` en base64 dentro de un ZIP), con grupos, etiquetas y fotos | `import_daylio.dart` | `leerDaylio` |
| Daybook (`entries.csv` + imágenes en un ZIP) | `import_daybook.dart` | `leerDaybook` |
| Diaro (`DiaroBackup.xml` + `media/photo` en un ZIP) | `import_diaro.dart` | `leerDiaro` |
| MyBrain, OneShot y Pixels (JSON) | `import_mybrain/oneshot/pixels.dart` | `leerMyBrain`, `leerOneShot`, `leerPixels` |
| Markdown con front matter (un `.md` o un ZIP con varios y sus imágenes): título, fecha, ánimo, categoría y etiquetas | `markdown_importer.dart`, `markdown_front_matter.dart`, `import_media_stage.dart` | `leerMarkdown` |
| HTML de las notas a Markdown (Daylio, Diarium) | paquete `html2md` | `htmlAMarkdown` |
| Título y texto: `# título` + cuerpo | `import_text.dart` | `tituloYTexto` |
| Puntaje de otras apps a ánimo 1–5 (también invertido) | `Mood.fromRating`, `Mood.fromLegacy` | `animoDePuntaje`, `animoLegado` |
| Escritura: categorías y etiquetas por nombre sin repetir, **no repetir una entrada que ya está (misma fecha y hora de creación)**, adjuntos | `import_writer.dart` | `servidor-importar.ts` |
| Un JSON propio (`ordo-diei-diario`, lane 291) vuelve entero: documento Tiptap, categorías, etiquetas, contadores, favoritas, fijadas, fotos | — (formato de la lane 291) | `leerJsonPropio` |

## Decisiones
- **I1 · Se lee en el navegador y se sube por lotes.** El ZIP se abre en el navegador (`fflate`), los parsers corren ahí y al servidor van lotes de hasta 25 entradas en JSON; cada foto sube por `/api/upload` (la misma de las fotos de la entrada, ≤ 4 MB). Así no hay un límite de 4,5 MB de cuerpo (Vercel) ni un ZIP entero en memoria del servidor.
- **I2 · El Markdown de los otros formatos se convierte a documento Tiptap en el navegador** con el mismo editor (`editor.markdown.parse`), y el servidor lo sanea igual que cualquier entrada.
- **I3 · Sin duplicar:** una entrada del mismo diario y del mismo autor con la misma fecha y hora de creación se cuenta como «ya estaba» y no se escribe (igual que Daily You, que compara `timeCreate`). Re-importar el mismo archivo no duplica.
- **I4 · Privacidad:** se importa siempre al diario desde el que se abre el diálogo y a nombre de quien lo hace (personal: solo suyo; familiar: lo ve la familia).
- **I5 · Fechas:** las que traen zona horaria (UTC) se pasan a la zona de la familia; las que no, se toman como hora de pared. No se importan días que todavía no llegaron ni anteriores a 2000-01-01 (reglas de siempre) y se avisa cuántas se saltearon.
- **I6 · Daily You «categorías de etiquetas» = grupos de etiquetas de esta app.** Las categorías de las entradas (jerárquicas) solo vienen del JSON propio y de `category:` del Markdown.
- **I7 · Íconos:** de Daily You se conserva el emoji; un ícono de Material (`materialIcon`) no existe en esta app y la etiqueta queda sin ícono. Colores ARGB de Dart pasan a `#rrggbb`.
- **I8 · Enlaces entre entradas (`diaryLink`) de un JSON propio se convierten en texto `[[rótulo]]`:** los ids de otro diario no valen en éste.
- **I10 · El título va en su campo.** Daily You pone el título como `# título` dentro del texto porque no tiene campo de título; acá las apps con título (Daylio, Diaro, Daybook, MyBrain, Markdown) lo llevan a `titulo`.
- **I11 · Una entrada con fecha pero sin hora** (Markdown, Pixels, Daybook sin hora) se escribe al mediodía; moodiary usa la fecha de modificación del archivo o «ahora», que en la web no existen.
- **I12 · El JSON de la lane 291 pasó a llaves en inglés** (`tagGroups`, `categories {name,path,color}`, `tags {name,type,group…}`, `moodScale {mood,label…}`) como el de Daily You, y las imágenes del documento apuntan al ZIP (`fotos/…`) para que el respaldo se pueda restaurar en otro entorno. La versión sigue en 1: nadie lo había usado todavía.
- **I9 · Tope:** 20.000 entradas y 300 MB por archivo; las fotos de más de 4 MB se saltean con aviso.

## Fuera de esta lane, con motivo (a decidir por Gabriel)
- **Diarium** (`import_diarium.dart`): el archivo es una base SQLite; leerla en el navegador necesita un motor SQLite (sql.js, ~1 MB de WebAssembly). Se puede sumar si Gabriel tiene un respaldo de Diarium.
- **Videos y audios de los respaldos**: el diario todavía no los guarda (lane 294 / 277 fase B).
- **Íconos de Material de Daily You** (I7) y la **escala de ánimo** de los respaldos (no se pisa la configurada).
- **Importar CSV**: Daily You tampoco lo importa; el CSV de la lane 291 es para planillas. El respaldo para volver es el JSON.
- **Importar plantillas**: ni Daily You ni la lane 291 las exportan.
- **Importación en segundo plano o cancelable con reintento** de moodiary (`runMediaExclusive`, `onProgress`): acá hay barra de progreso y botón «Cancelar», sin reanudar.

## Arquitectura
- Reglas puras con tests en `src/lib/diario/importar/`: `tipos.ts`, `comun.ts` (título, ánimo, tiempos, rutas, CSV, XML mínimo), `html.ts`, `json.ts` (propio + Daily You + MyBrain + OneShot + Pixels), `markdown.ts`, `apps.ts` (Daylio, Daybook, Diaro), `detectar.ts`.
- Servidor: `src/lib/diario/servidor-importar.ts`, ruta `POST /api/diario/importar`.
- UI: `src/components/diario/importar/{ImportarDiario.tsx,markdown-a-doc.ts}` (botón «Importar» en `DiarioVista`).
- Sin cambios de base. Sin dependencias nuevas (`fflate` ya está).

## Archivos en alcance
`src/lib/diario/importar/**` · `src/lib/diario/servidor-importar.ts` · `src/app/api/diario/importar/**` · `src/components/diario/importar/**` · `src/components/diario/DiarioVista.tsx` · `vendor/{Daily_You,moodiary}/**` · `THIRD_PARTY_NOTICES.md`.

## Microtareas
- [x] M1 · Leer las fuentes completas.
- [x] M2 · Copiar fuentes a `vendor/`.
- [x] M3 · Reglas puras + tests (36 nuevos).
- [x] M4 · Servidor y ruta.
- [x] M5 · Interfaz.
- [x] M6 · `ORIGEN.md` y `THIRD_PARTY_NOTICES.md`.
- [x] M7 · Gates, PR #98, integración y limpieza.
- [ ] M8 · Prueba de pantalla: Gabriel (AGENTS.md regla 10).

## Gates
`npx prisma validate` · `npx tsc --noEmit` · `npm test` · `npx eslint src/lib/diario src/app/api/diario src/components/diario src/app/dashboard/diario`

## Hallazgos
- La conversión Markdown→documento usa el editor del diario sin pantalla (`editor.markdown.parse`): no se puede probar con `npm test` (necesita el navegador); queda para la prueba de pantalla de Gabriel con un `.md` y un Daylio.
- Los parsers de Daylio, Daybook y Diaro se probaron con respaldos armados a mano según el código de Daily You, no con respaldos reales de esas apps.
- Gates: prisma validate (sin cambios de base), tsc ok, eslint ok, `npm test` 957 pass / 0 fail.

## Bitácora
- 2026-11-08 · claude · INICIO 292 · lane creada desde `dev` = `2373d13`.
- 2026-11-08 · claude · FIN 292 · commit 2713e71. INTEGRADA · PR #98 (merge commit), lane limpiada. Falta M8: prueba de pantalla de Gabriel.
