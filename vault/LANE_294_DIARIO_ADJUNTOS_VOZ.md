---
lane: 294
titulo: Diario fase 3 — adjuntos, notas de voz y video corto (≤ 4 MB) + visor de fotos
plane: "#31"
estado: integrada
rama: task/lane-294-diario-adjuntos-voz
agente: claude
actualizado: 2026-11-08
---

# Lane 294 — Adjuntos y notas de voz

Cuarta y última lane de la fase 3 («adjuntos y datos») del plan aprobado por Gabriel el 2026-11-08, continuación de [[LANE_293_DIARIO_GALERIA_COMPARTIR]]. Regla: se porta, no se «inspira» (memoria `clonar-es-portar-funciones`). La lane 283 dejó el editor sin audio, video ni adjuntos «para la fase 3»; esta lane los pone.

## Fuentes leídas completas (2026-11-08)
- **moodiary** `2c552dd` (editor web): `editor/src/core/editor/nodes/{attachment,media}.ts`, `core/editor/media.ts`, `ui/nodes/{AttachmentNodeView,AudioNodeView,VideoNodeView}.tsx`, `ui/hooks/use-media.ts`, `styles/_blocks.scss` (audio, rango, adjunto), `commands.ts` (`insertAudio/insertVideo/insertAttachment`).
- **Daily You** `7cc237d`: `pages/audio_recorder_page.dart`, `utils/{attachment_mime,attachment_file_name}.dart`, `widgets/{attachment_type_presentation,file_size_row}.dart`.
- Daily You (visor y grabadora): `widgets/{zoomable_attachment_page_view,audio_waveform_decoration,attachment_type_presentation,file_size_row}.dart`. No se leyó `entry_attachment_actions`, `media_attachment_page` ni storypad `sp_voice_player`: su menú de agregar y su pantalla de adjuntos (lista aparte) no aplican porque los adjuntos son bloques del texto (A1).

## Qué se porta (mapa fuente → web)
| Función | Fuente | En esta app |
|---|---|---|
| Bloque **audio** en el texto: botón play/pausa, barra para adelantar, tiempo | `AudioNodeView`, `use-media`, `_blocks.scss` | `VistaAudio` + `useControlesMedia` |
| Bloque **video** (≤ 4 MB): marco con proporción 4:5 a 16:9, controles que se ocultan, volumen, pantalla completa | `VideoNodeView` | `VistaVideo` |
| Bloque **adjunto** (documento): ficha con extensión, nombre y tamaño; tocarlo lo abre/descarga | `AttachmentNodeView` | `VistaAdjunto` |
| Nodos Tiptap `audio`, `video`, `attachment` | `nodes/{media,attachment}.ts` | `core/nodes/{audio,video,adjunto}.ts` |
| **Grabadora** de notas de voz: grabar, pausar/seguir, descartar (pide confirmar pasados 3 s), guardar (mínimo 1 s), se pausa sola si la app pasa a segundo plano, calidad alta/media/baja, onda animada | `audio_recorder_page.dart` | `GrabadoraDeVoz` (MediaRecorder) |
| Tipos MIME por extensión; nombre de archivo limpio (sin caracteres prohibidos, nombres reservados, tope de bytes) | `attachment_mime.dart`, `attachment_file_name.dart` | `lib/diario/adjuntos.ts` |
| Tamaño de archivo legible y duración `m:ss` | `formatFileSize`, `formatTime`, `file_size_row` | `lib/diario/adjuntos.ts` |
| Subir audio, video y documentos desde el botón, pegando o arrastrando | `entry_attachment_actions` | `/api/upload?modo=diario` |
| **Visor** de fotos a pantalla completa: acercar con rueda o pellizco, mover, pasar a la anterior/siguiente de la entrada, descargar | `zoomable_attachment_page_view`, `media_attachment_page` | `VisorDeFotos` |

## Decisiones
- **A1 · Todo dentro del documento** (moodiary): audio, video y adjuntos son bloques del texto de la entrada, como la imagen; no hay una lista de adjuntos aparte (Daily You). Las 4 fotos adjuntas de la entrada siguen como están.
- **A2 · Tope 4 MB por archivo** (Vercel corta el cuerpo en 4,5 MB; los archivos se guardan en la tabla `Archivo`, como las fotos). Video y archivos grandes esperan a la lane 277 fase B (almacén de objetos, decisión D1 de Gabriel pendiente). Con la calidad predeterminada de la grabadora (32 kb/s) entran unos 16 minutos de voz; la grabadora corta sola antes de pasarse.
- **A3 · La URL sigue siendo `/api/archivos/<uuid>` sin parámetros** (el sanitizador del documento la exige): el tipo se guarda en la tabla (`Archivo.tipo`) y el nombre en `Archivo.nombreOrigen` y en el atributo `name` del bloque.
- **A4 · Solo tipos de una lista cerrada** (audio, video corto y documentos de oficina/lectura/texto); nada que el navegador pueda ejecutar (HTML, SVG, JS). Se agrega `X-Content-Type-Options: nosniff` a la ruta que sirve los archivos.
- **A5 · La ruta que sirve archivos admite `Range` (206)**: sin eso Safari/iOS no reproduce audio ni video y ningún navegador deja adelantar.
- **A6 · Quien tiene la URL (un UUID imposible de adivinar) puede abrir el archivo, sin sesión:** es la regla de siempre de `/api/archivos` (las fotos de perfil se ven en el ingreso). Queda anotado como hallazgo para Gabriel porque ahora hay voz y documentos.
- **A7 · Una entrada puede ser solo una nota de voz o solo un adjunto** (antes «Escribí algo» pedía texto o foto).
- **A8 · Exportar** (lane 291): los archivos van en `adjuntos/` del ZIP, enlazados desde el Markdown y desde el JSON. **Importar** (lane 292): el JSON propio y el Markdown los vuelven a subir. Daily You exporta/importa sus audios y videos como archivos sueltos: se importan como bloques al final de la entrada.
- **A9 · La tarjeta de imagen** (lane 293) muestra un recuadro con el nombre y el tamaño en lugar del reproductor (como moodiary `_placeholderBox`).

## Fuera de esta lane, con motivo (a decidir por Gabriel)
- **Video y archivos de más de 4 MB**: lane 277 fase B (proveedor de almacenamiento pendiente de Gabriel). Cuando se resuelva, el tope sale de una sola tabla (`adjuntos.ts`).
- **Calidad de compresión de video/imagen configurable** (`qualitySetting` de Daily You) y compresión del video: no hay compresión de video en el navegador sin una librería pesada.
- **Miniatura de video** (`video_thumbnail_cache`): el navegador muestra el primer cuadro con `preload="metadata"`.
- **Forma de onda real del audio** (`audio_waveform_decoration` solo adorna la grabadora con barras animadas con semilla; acá igual).
- **Transcripción de voz a texto**: ni Daily You ni moodiary web la traen.
- **Pantalla completa del video por el sistema** (`videoFullscreen` de moodiary pasa a Flutter): se usa la pantalla completa del navegador.

## Arquitectura
- Reglas puras con tests: `src/lib/diario/adjuntos.ts` (tipos, tope, nombres, formatos, grabadora, acercamiento del visor) + cambios en `contenido.ts` (saneado de los tres bloques, `archivosDe`, `tieneArchivo`, texto plano), `reglas.ts` (A7), `exportar.ts`, `importar/*`, `tarjeta.ts`.
- Servidor: `src/lib/archivos.ts` (`guardarAdjuntoDiario`), `src/app/api/upload/route.ts` (`modo=diario`), `src/app/api/archivos/[clave]/route.ts` (Range, nosniff), `servidor-exportar.ts`, `servidor-importar.ts`.
- Editor: `core/nodes/{audio,video,adjunto}.ts`, `core/kit.ts`, `core/commands.ts` (`insertAudio/insertVideo/insertAttachment`), `ui/{VistaAudio,VistaVideo,VistaAdjunto,GrabadoraDeVoz}.tsx`, `ui/BarraFormato.tsx`, `EditorTexto.tsx`, `subir.ts`, `editor.css`.
- Visor: `src/components/diario/visor/VisorDeFotos.tsx` en `ListaDia`, `TarjetaHallazgo`, galería y las imágenes del texto.
- Sin cambios de base. Sin dependencias nuevas.

## Archivos en alcance
`src/lib/diario/{adjuntos,contenido,reglas,exportar,tarjeta}.ts` + tests · `src/lib/diario/importar/**` · `src/lib/diario/{servidor-exportar,servidor-importar}.ts` · `src/lib/archivos.ts` · `src/app/api/{upload,archivos}/**` · `src/components/diario/editor/**` · `src/components/diario/{EditorEntrada,ListaDia}.tsx` · `src/components/diario/visor/**` · `src/components/diario/importar/**` · `vendor/{Daily_You,moodiary}/**` · `THIRD_PARTY_NOTICES.md`.

## Microtareas
- [x] M1 · Leer las fuentes (falta el visor: ver arriba).
- [x] M2 · Copiar fuentes a `vendor/`, `ORIGEN.md`, `THIRD_PARTY_NOTICES.md`.
- [x] M3 · Reglas puras + tests (`adjuntos.ts`, `contenido.ts`, `reglas.ts`).
- [x] M4 · Servidor: subida, Range, nosniff.
- [x] M5 · Editor: nodos, vistas, grabadora, botones.
- [x] M6 · Visor de fotos.
- [x] M7 · Exportar e importar (A8) y tarjeta (A9).
- [x] M8 · Gates, PR, integración y limpieza.
- [ ] M9 · Prueba de pantalla: Gabriel (AGENTS.md regla 10) — grabar una nota de voz, adjuntar un PDF y un audio, reproducir y adelantar en Safari y Chrome, exportar y volver a importar.

## Gates
`npx prisma validate` · `npx tsc --noEmit` · `npm test` · `npx eslint src/lib/diario src/app/api/diario src/app/api/upload src/app/api/archivos src/lib/archivos.ts src/components/diario src/app/dashboard/diario`

## Detalles que se decidieron al implementar
- **El audio exportado se llama `.weba`** (no `.webm`): un `.webm` es ambiguo (audio o video) y al volver a importar un Markdown se tomaría por video. El tipo MIME guardado sigue siendo `audio/webm`.
- **Markdown exportado:** cada audio, video o documento es un enlace solo en su línea (`[Nombre](adjuntos/2026-07-20_1_Nombre.pdf)`). Al importar, un documento admitido (no `.md`) se sube y vuelve a ser bloque (el enlace pasa por un marcador `https://ordo-diei.invalid/archivo/N` que el editor acepta y el documento reemplaza). Las otras notas del mismo ZIP y los tipos no admitidos quedan como su nombre.
- **JSON propio:** `content` apunta a `adjuntos/…` y trae `attachments`; al importar, los bloques conservan nombre, tipo y peso.
- **Daily You:** los adjuntos `audio` y `video` de su JSON se importan como bloques al final del texto (rango mayor primero); un tipo desconocido se avisa.
- **La exportación con fotos incluye los archivos** (mismo interruptor, mismo tope de 150 MB, mismo `.zip`).
- **Duración del audio grabado:** el webm de `MediaRecorder` no trae la duración; `useControlesMedia` salta al final una vez para que el navegador la calcule y vuelve al principio.
- **El servidor ya no guarda en memoria archivos de más de 1 MB** (`leerArchivo` los cacheaba sin tope; un audio de 4 MB por clave llenaba la instancia).
- **Visor de fotos:** se abre desde las 4 fotos de la entrada (`ListaDia`) y desde las imágenes del texto en solo lectura. Galería y línea de tiempo siguen abriendo la entrada (como Daily You).

## Hallazgos
- Gates: `prisma validate` ok (sin cambios de base), `tsc` ok, `eslint` ok, `npm test` 1083 pruebas / 1044 pasan / 0 fallan (39 omitidas por base). Pruebas nuevas: `adjuntos` 21, contenido 3, reglas 1, exportar 5, importar/lote 6+, tarjeta 2.
- La grabadora, los reproductores, la ficha de adjunto y el visor (gestos de pellizco, arrastre y rueda) no se pueden probar con `npm test`; las cuentas sí (tope, nombres, rangos, zoom, onda). Falta la prueba de pantalla de Gabriel (M9).
- `/api/archivos/<uuid>` sigue sin sesión (A6): una nota de voz o un documento del diario se abre con la URL exacta, sin ingresar. Hay que decidir si los archivos del diario deben pedir sesión (rompería las vistas previas de compartir y los respaldos viejos).
- La respuesta 206 (Range) y la subida `modo=diario` no se corrieron contra el servidor real (regla 10); `leerRango` está probado.
- Safari/iOS: `MediaRecorder` graba `audio/mp4`; no se probó. El tope de 4 MB se calcula con margen del 10 % sobre la tasa elegida.

## Bitácora
- 2026-11-08 · claude · INICIO 294 · lane creada desde `dev` = `417055e`.
- 2026-11-08 · claude · FIN 294 · PR #100 integrado con merge commit (00da975, commit fddb672), worktree y rama limpiados. Gates: prisma validate ok, tsc limpio, eslint limpio, npm test 1083 / 1044 ok / 0 fallan. Queda M9 (prueba de pantalla, Gabriel).
