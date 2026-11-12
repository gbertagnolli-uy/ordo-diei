---
lane: 288
titulo: Diario fase 2 — calendario de ánimo, vista del año y mapa de calor (port de Daily You, moodiary y storypad)
plane: "#31"
estado: integrada
rama: task/lane-288-diario-vistas
agente: claude
actualizado: 2026-11-08
---

# Lane 288 — Calendario, año y mapa de calor

Segunda lane de la fase 2 («vistas y estadísticas») del plan aprobado por Gabriel el 2026-11-08 (ver [[LANE_283_DIARIO_FASE1_ESCRITURA_Y_ORGANIZACION]] y [[LANE_287_DIARIO_ESTADISTICAS]]). La parte de «vistas» se parte en dos lanes: **288 calendario** (mes, año, mapa de calor) y **289 línea de tiempo y recuerdos** («En este día», recuerdos de Daily You, throwback de storypad). Regla: se porta, no se «inspira» (memoria `clonar-es-portar-funciones`).

## Fuentes leídas completas (2026-11-08)
- **Daily You** `7cc237d`: `widgets/{vertical_calendar,entry_day_cell,year_month_picker,calendar_view_options_dialog}.dart`, `utils/year_month_range.dart`.
- **moodiary** `2c552dd`: `presentation/calendar/calendar_page.dart`, `mui/.../common/heatmap.dart`, `moodiary_data/.../dashboard_controller.dart` + `test/heatmap_level_test.dart`, `mobile/lib/app/me/me_page.dart`.
- **storypad** `a76825e`: `views/calendar/mood/{mood_calendar_view_model,mood_calendar_content,mood_calendar_view}.dart`, `views/home/years/{home_years_view_model,home_years_content}.dart`.

## Qué se porta (mapa fuente → web)
| Función | Fuente | En esta app |
|---|---|---|
| Celda del día con portada (foto) y el número encima, ánimo en la esquina, contador «99+» si hay varias entradas | Daily You `EntryDayCell` | `contenidoDeCelda`, `CalendarioAnimo` |
| Opciones del calendario: imágenes, ánimo, etiqueta o contador encima de cada día | Daily You `calendar_view_options_dialog`, `Settings.calendarTagOverlay` | `OpcionesCalendario`, `OpcionesDelCalendario` (recordadas en el navegador, por diario) |
| Selector de año y mes, límite al primer mes con entradas, mes con punto si tiene entradas | Daily You `year_month_picker`, `YearMonthRange` | `rangoDeMeses`, `acotarMes`, `SelectorMes` |
| Seis filas fijas, título con la cuenta de entradas del mes, «volver a hoy», franja de color de la categoría | moodiary `CalendarPage` | `celdasDelMes`, `CalendarioAnimo` |
| Al cambiar de mes se queda en el mismo número de día (o va al primer día con entradas) | moodiary `_pickDayIn` | `elegirDia` |
| Filtro por etiqueta sobre el calendario, con la cuenta de la elegida | storypad `MoodCalendarView` (`SpScrollableChoiceChips`) | `FiltroEtiquetasCalendario`, `filtrarPorEtiqueta` |
| Volver a tocar el día deja ver todo el mes | storypad (`selectedDay == date.day ? null : date.day`) | `seleccionado: null` + `ListaDia agrupar` |
| Vista del año: doce meses con su cuenta, días con entradas resaltados, hoy marcado; abrir el mes | moodiary `_YearGrid`, `_YearMonthCard` | `VistaAnual`, `cantidadPorMes` |
| Lista de años con la cantidad de entradas de cada uno | storypad `home/years` | `aniosConEntradas` |
| Mapa de calor (53 semanas o el año elegido), niveles por cuartiles de palabras, hoy y día elegido con borde, leyenda | moodiary `MHeatmap`, `heatmapLevelResolver`, `MePage` | `resolverNivelCalor`, `columnasCalor`, `marcasDeMeses`, `MapaCalor` |
| Mapa de calor por ánimo (cada día con el color de su ánimo, días vacíos con borde punteado) | moodiary `MHeatmap(colorOf, emptyCell: dashed)` | `MapaCalor modo="animo"` |
| Entradas del último año, de este mes y racha | moodiary `MePage` `_Header`, `DashboardStats` | `cantidadUltimoAnio`, `cantidadDelMes`, `calcularRachas` |

## Decisiones
- **C1 · Los datos del calendario salen de la lista del mes que ya se pedía** (`/api/diario?mes=`); la vista del año, el mapa de calor y el selector de mes usan la lista liviana de la lane 287 (`/api/diario/estadisticas`). Sin endpoints nuevos ni cambios de base.
- **C2 · La semana empieza el lunes** (igual que E2 de la lane 287).
- **C3 · Ánimo del día = el de la última entrada con ánimo** (el resumen del mes de siempre); portada = primera foto de la entrada más reciente que tenga alguna (Daily You); categoría y título = los de la primera entrada del día (moodiary).
- **C4 · Etiqueta superpuesta:** se muestra el valor de la **primera** entrada del día que la tiene. Daily You mira solo la entrada más reciente del día; con varias entradas eso esconde la etiqueta. **Desvío menor.**
- **C5 · Una etiqueta borrada que quedó guardada en las opciones o en el filtro se ignora** (Daily You la vuelve a «ninguna»).
- **C6 · Mapa de calor del año elegido** (1 de enero al 31 de diciembre, o hasta hoy en el año en curso). moodiary muestra siempre las últimas 53 semanas; acá se puede mirar cualquier año con entradas y alcanza igual para las últimas 53 semanas.
- **C7 · `acotarAnioMes` es como `YearMonthRange.clamp` de Daily You:** una fecha fuera del rango se lleva al año del borde y el mes se acota dentro de ese año.
- **C8 · Mapa de calor en modo ánimo:** el color es el del nivel del promedio redondeado del día; los días con entradas pero sin ánimo toman un gris.

## Fuera de esta lane, con motivo (a decidir por Gabriel)
- **Calendario vertical continuo** (Daily You `VerticalCalendar`: todos los meses en un solo scroll infinito, con columnas según el ancho). Es una forma de presentación; en la web quedó el mes con selector, flechas, «Hoy» y la vista del año. Si Gabriel quiere el scroll continuo, es una lane aparte (virtualización de meses).
- **Deslizar hacia arriba/abajo para pasar de mes a año** (moodiary) y **paginar con deslizar** (`PageView`): en la web se usan botones. Se puede sumar con gestos táctiles si se pide.
- **Texto del título de la entrada dentro de la celda** (moodiary `_TextCell`): las celdas de 22 rem son demasiado chicas; el título queda como tooltip del botón.
- **Menú «En este día» al mantener pulsado un día** (Daily You) → lane 289 (recuerdos).
- **Mini-calendario de moodiary en lo oscuro (`Skeleton`/`Bone`)**: sin equivalente; el estado «Cargando…» alcanza.

## Arquitectura
- Reglas puras con tests: `src/lib/diario/calendario.ts` (+ `.test.ts`, 39 tests).
- UI: `src/components/diario/CalendarioAnimo.tsx` (rehecho), `src/components/diario/calendario/{SelectorMes,SelectorMesDiario,OpcionesDelCalendario,FiltroEtiquetasCalendario,MapaCalor,VistaAnual}.tsx`, `ListaDia.tsx` (`agrupar`, `vacio`), `DiarioVista.tsx` (estado nuevo: día elegido nulo, filtro, opciones, año, selector).
- Sin cambios de base ni de API.

## Archivos en alcance
`src/lib/diario/calendario*.ts` · `src/components/diario/{CalendarioAnimo,DiarioVista,ListaDia}.tsx` · `src/components/diario/calendario/**` · `vendor/{Daily_You,storypad,moodiary}/**` · `THIRD_PARTY_NOTICES.md`.

## Microtareas
- [x] M1 · Leer las fuentes completas.
- [x] M2 · Copiar fuentes a `vendor/` y ampliar los `ORIGEN.md` y `THIRD_PARTY_NOTICES.md`.
- [x] M3 · Reglas puras + tests (39).
- [x] M4 · Interfaz: calendario, opciones, selector de mes, filtro por etiqueta, vista del año, mapa de calor.
- [x] M5 · Gates, PR #94, integración y limpieza.
- [ ] M6 · Prueba de pantalla: Gabriel (AGENTS.md regla 10).

## Gates
`npx prisma validate` · `npx tsc --noEmit` · `npm test` · `npx eslint src/lib/diario src/app/api/diario src/components/diario src/app/dashboard/diario`

## Hallazgos
- La base no tiene entradas, así que el aspecto real (portadas, ánimos, mapa de calor) se ve recién con la prueba de pantalla de Gabriel.
- Gates al cierre del código: prisma validate ok, tsc ok, eslint ok, `npm test` 846 pass / 0 fail (51 saltados: los que escriben en la base real).

## Bitácora
- 2026-11-08 · claude · INICIO 288 · lane creada con `nueva-lane.sh` desde `dev` = `44de494`.
- 2026-11-08 · claude · FIN 288 · commit 9cbb7ea. Gates: prisma validate ok, tsc ok, eslint ok, npm test 846 pass / 0 fail.
- 2026-11-08 · claude · INTEGRADA · PR #94 mergeado con merge commit (`ac8e644`), lane limpiada. Falta M6: prueba de pantalla de Gabriel.
