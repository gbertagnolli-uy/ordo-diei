---
lane: 285
titulo: Diario fase 1 — búsqueda, filtros y marcas favorita/fijada (port de Daily You, storypad y moodiary)
plane: "#31"
estado: integrada
rama: task/lane-285-diario-busqueda
agente: claude
actualizado: 2026-11-08
---

# Lane 285 — Búsqueda y marcas del diario

Tercera lane de [[LANE_283_DIARIO_FASE1_ESCRITURA_Y_ORGANIZACION]] (diseño general, decisiones D1–D10). Regla: se porta, no se «inspira» (memoria `clonar-es-portar-funciones`). Fuentes copiadas a `vendor/` con `ORIGEN.md` (D-BP3).

## Fuentes leídas completas (2026-11-08)
- **Daily You** `7cc237d`: `utils/{search_matcher,search_highlight,search_text_window}.dart`, `providers/entries_provider.dart` (búsqueda, orden por fecha/ánimo/contador, sentido), `pages/entries_list_page.dart`.
- **storypad** `a76825e`: `core/objects/search_filter_object.dart`, `core/storages/search_filter_storage.dart`, `views/search/{search_view,search_view_model,search_content}.dart`, `views/search/filter/{search_filter_view,search_filter_view_model,search_filter_content}.dart` (años con conteo, etiquetas por categoría con conteo, favorita/fijada tri-estado).
- **moodiary** `2c552dd`: `application/{search_controller,diary_filter}.dart`, `presentation/search/{search_page,search_result_card}.dart`, `moodiary_models/src/search.dart`, `moodiary_data/src/diary_repository.dart` (búsqueda: términos en AND, resaltado del título, extracto de 24 palabras con «…», orden relevancia/más nuevas/más viejas, página de 30, total y milisegundos, historial de 12).

## Qué se porta (mapa fuente → web)
| Función | Fuente | En esta app |
|---|---|---|
| Texto sin mayúsculas ni tildes, coincidencia por subcadena | Daily You `textMatchesQuery` | `normalizar` / `coincide` (`busqueda.ts`) |
| Varios términos, todos tienen que estar | moodiary `_matchExpression` (AND) | `terminos` + `coincide` |
| Resaltar coincidencias | Daily You `findMatches`/`highlightSpan`; moodiary `splitSearchHighlight` | `resaltar` → segmentos `{texto, coincide}` (sin HTML) |
| Extracto alrededor de la primera coincidencia | Daily You `searchTextWindow`; moodiary `snippet` de 24 palabras | `extracto` |
| Orden relevancia (título pesa 1,5; cuerpo 1,0), más nuevas, más viejas | moodiary `SearchSort`, `bm25(weights [1.5, 1.0])` | `puntuar`, `ordenarHallazgos` |
| Orden por fecha, ánimo o valor de un contador, ascendente/descendente | Daily You `OrderBy`, `SortOrder`, `trackerSortTagId` | `orden` + `sentido` |
| Filtro por etiqueta (alguna / todas / sin etiquetas) con conteo | storypad `tagIds` + chips con `storiesCount`; Daily You picker de filtro | `etiquetaModo`, conteo por etiqueta en el resultado |
| Filtro por categoría de entrada (con sus hijas) y «sin categoría» | moodiary `DiaryFilter` | `categoriaId` + `descendientes`, `sinCategoria` |
| Filtro por ánimo | Daily You (orden/ánimo) | `animos` |
| Favorita y fijada, tri-estado en el filtro | storypad `starred`, `pinned` | columnas `Favorita`, `Fijada`; `favorita`/`fijada` = `si`/`no`/vacío |
| Fijadas arriba de la lista | storypad `pinnedStories` | sección «Fijadas» y orden del día |
| Rango de fechas: todo / 7 días / 30 días / este año / personalizado; años con conteo | moodiary `DateRangePreset`; storypad `years` | `rangoDePreset`, chips de años |
| Total, tiempo de búsqueda, «ver más» de 30 en 30, descartar respuestas viejas | moodiary `DiarySearchState` | `PAGINA = 30`, número de pedido en el cliente |
| Historial de 12 búsquedas (agregar, quitar una, vaciar) | moodiary `recordHistory/removeHistory/clearHistory` | `agregarHistorial`; se guarda en el navegador (`localStorage`) |
| Espera de 400 ms al escribir | moodiary `search_page` | `useEffect` con `setTimeout` |

## Decisiones
- **B1 · Coincidencia en el servidor, sobre texto sin tildes.** Postgres de Supabase no trae `unaccent` activado; en vez de cambiar la base, el servidor filtra con SQL todo menos el texto (autor, fechas, etiquetas, categoría, ánimo, marcas), trae título y texto de esas candidatas y compara en JS con `normalizar`. Tope de 5.000 candidatas (el más reciente primero); si se pasa, la respuesta lo avisa (`truncado`) y la pantalla lo muestra. Se puede cambiar a una columna normalizada si el diario crece.
- **B2 · Privacidad.** Personal: toda consulta lleva `autorId = quien pide`. Familiar: lo ve toda la familia (igual que el listado del mes).
- **B3 · Marcas.** `Favorita` y `Fijada` son de la entrada. Las cambia su autor (también en el familiar); no hay marcas por lector. Se pueden cambiar desde la tarjeta sin abrir el editor (`PATCH /api/diario/[id]/marcas`) y también guardando la entrada.
- **B4 · Filtros sin texto.** Como storypad y Daily You, se puede filtrar sin escribir nada; moodiary exige texto. Gana lo que permite más.
- **B5 · Navegación.** Un resultado lleva al día de la entrada en el diario; el editor se abre desde ahí o con el lápiz de la tarjeta de resultado.
- **B6 · El historial se guarda en el navegador** (por usuario y ámbito), no en la base: moodiary lo guarda en el dispositivo.
- **B7 · «Favorito» de Daily You** (etiqueta sembrada en Daily You) queda reemplazado por esta marca nativa (E3 de la lane 284).
- Fuera de esta lane, con motivo: búsqueda en medios/galería, filtro por plantilla y por adjuntos de storypad → fase 3 (adjuntos); búsqueda dentro del documento abierto (Tiptap) → fase 2; guardar filtros con nombre (`search_filter_storage` de storypad guarda el último filtro) → se guarda el último filtro en el navegador.

## Arquitectura
- Esquema (aditivo): `Diario_Entradas.Favorita Boolean default false`, `Fijada Boolean default false`, índice `(Tipo, Fijada)`.
- `src/lib/diario/busqueda.ts` (reglas puras + tests): `normalizar`, `terminos`, `coincide`, `puntuar`, `resaltar`, `extracto`, `rangoDePreset`, `leerFiltro` (valida los parámetros), `descendientes`, `ordenarHallazgos`, `agregarHistorial`.
- `src/lib/diario/servidor-busqueda.ts`: `buscarEntradas(actor, filtro)`, `cambiarMarcas(actor, id, marcas)`.
- API: `GET /api/diario/buscar`, `PATCH /api/diario/[id]/marcas`.
- UI: `BuscadorDiario` (campo con espera, historial, filtros, resultados, «ver más»), `FiltrosBusqueda`, `MarcasEntrada` (estrella y chincheta); `ListaDia`/`DiarioVista`/`EditorEntrada` integran las marcas y la sección «Fijadas».

## Archivos en alcance
`prisma/schema.prisma` · `src/lib/diario/**` · `src/app/api/diario/**` · `src/components/diario/**` · `vendor/Daily_You/**` · `vendor/storypad/**` · `vendor/moodiary/**` · `THIRD_PARTY_NOTICES.md`.

## Microtareas
- [x] M1 · Leer las fuentes completas.
- [x] M2 · Copiar fuentes leídas a `vendor/` con `ORIGEN.md` y avisos.
- [x] M3 · Esquema aditivo (`migrate diff`, sin DROP) y aplicarlo.
- [x] M4 · Reglas puras + tests (`busqueda.ts`).
- [x] M5 · Servidor + API (`buscar`, `marcas`), marcas en `EntradaVista` y en guardar.
- [x] M6 · Interfaz: buscador, filtros, resultados, marcas, «Fijadas».
- [x] M7 · Gates, PR, integración y limpieza.
- [ ] M8 · Prueba de pantalla: Gabriel (AGENTS.md regla 10).

## Gates
`npx prisma validate` · `npx tsc --noEmit` · `npm test` · `npx eslint src/lib/diario src/app/api/diario src/components/diario src/app/dashboard/diario`

## Hallazgos
- `migrate diff` dio solo ADD COLUMN (`Favorita`, `Fijada`) y CREATE INDEX; sin DROP. Quedó vacío después de aplicarlo.
- Verificado sin servidor: reglas puras (24 tests de búsqueda + 2 de marcas), `tsc`, `eslint`, `prisma validate`, `npm test` (816 tests, 777 ok, 0 fallan, 39 salteados). Prueba de solo lectura de las 24 combinaciones de filtros contra la base real (familiar y personal): todas corren sin error, pero devuelven 0 porque **el diario todavía no tiene entradas**; la coincidencia con datos reales queda cubierta solo por los tests puros.
- Cuando Gabriel pruebe: escribir 3–4 entradas con tildes («canción», «Día»), buscar sin tildes y en mayúsculas, comprobar el resaltado, el extracto de entradas largas, el orden por ánimo y por contador, el filtro «Sin etiquetas», categoría con hijas, estrella/chincheta desde la tarjeta, el editor y los resultados, «Fijadas» arriba y que al guardar una edición desde la búsqueda se refresquen los resultados.
- Desvíos a confirmar por Gabriel: B1 (comparación en el servidor sobre las 5.000 más recientes, sin `unaccent`); B3 (las marcas las cambia solo quien escribió la entrada, también en el familiar); B4 (se puede filtrar sin escribir texto, moodiary exige texto).

## Bitácora
- 2026-11-08 · claude · INICIO 285 · lane creada con `nueva-lane.sh` desde `dev` = `4c388af`. Tablero sin otras lanes del diario.
- 2026-11-08 · claude · FIN 285 (código) · gates: prisma validate ok · tsc ok · eslint ok · npm test 816 tests, 777 ok, 0 fallan, 39 salteados. Commit 00707fd. Falta la prueba de pantalla de Gabriel (M8).
- 2026-11-08 · claude · INTEGRADA · PR #91 (merge 88c1ff3), worktree y rama limpiados.
