---
lane: 289
titulo: Diario fase 2 — recuerdos, «En este día» y línea de tiempo (port de Daily You, moodiary y storypad)
plane: "#31"
estado: integrada
rama: task/lane-289-diario-recuerdos-linea
agente: claude
actualizado: 2026-11-08
---

# Lane 289 — Recuerdos y línea de tiempo

Tercera lane de la fase 2 del plan aprobado por Gabriel el 2026-11-08 (ver [[LANE_283_DIARIO_FASE1_ESCRITURA_Y_ORGANIZACION]], [[LANE_287_DIARIO_ESTADISTICAS]] y [[LANE_288_DIARIO_CALENDARIO]]). Regla: se porta, no se «inspira» (memoria `clonar-es-portar-funciones`).

## Fuentes leídas completas (2026-11-08)
- **Daily You** `7cc237d`: `flashback_manager.dart`, `time_manager.dart`, `models/flashback.dart`, `widgets/flashback_card.dart`, `pages/{entry_timeline_page,home_page}.dart`, `pages/settings/flashback_settings.dart`.
- **moodiary** `2c552dd`: `application/{timeline_group,timeline_controller,diary_stamp}.dart`, `presentation/widget/{timeline_view,timeline_tile}.dart`, tests de grupo y tile.
- **storypad** `a76825e`: `views/throwback/{throwback_view,throwback_view_model,throwback_content}.dart`, `widgets/sp_throwback_tile.dart`, `views/home/home_view_model.dart`.

## Qué se porta (mapa fuente → web)
| Función | Fuente | En esta app |
|---|---|---|
| Recuerdos del día: «En este día» (mismo día de años anteriores), hace 6 meses, hace 1 mes, hace 1 semana | Daily You `FlashbackManager.getFlashbacks`, `TimeManager.datesExactMonthDiff` | `calcularRecuerdos`, `mesesExactos`, `mismoDiaDelAnio` |
| «Un buen día» y «Un día aleatorio» (se eligen una vez por día y no cambian; el aleatorio solo con más de 7 entradas) | Daily You `FlashbackManager` (`goodDay`, `randomDay`), `Settings` | `elegirDelDia`, `semillaDelDia`, `MIN_PARA_AZAR`; lo elegido se guarda en el navegador (`useRecuerdos`) |
| Opciones: mostrar recuerdos, excluir días malos, ocultar imágenes, cada grupo prendido o apagado | Daily You `flashback_settings.dart` | `OPCIONES_RECUERDOS`, `OpcionesDeRecuerdos` (por diario, en el navegador) |
| Tarjetas del carrusel con título, cantidad, hasta 4 portadas y adelanto del texto | Daily You `FlashbackCard`, `home_page` | `SeccionRecuerdos` |
| Entradas de un día y mes en todos los años, la más nueva primero, con «Hace N años» | storypad `ThrowbackViewModel.filter`, Daily You `isOnThisDayMatch` | `fechasDelDiaMes`, `enEsteDia` (servidor), `EnEsteDiaDialog` |
| «Respondé a tu yo del pasado»: escribir una entrada en ese día | storypad `ThrowbackContent` | `fechaDeRespuesta` + botón en `EnEsteDiaDialog` |
| Título de la retrospectiva («de hace 1 año», «de hace unos años», «de esta fecha») | storypad `SpThrowbackTile` | `tituloDeRetrospectiva` |
| Línea de tiempo por mes con cantidad de entradas, primer nodo de cada día, corte punteado al saltar un día, degradé entre colores de ánimo | moodiary `buildTimeline`, `TimelineView`, `TimelineTile` | `construirLinea`, `LineaDeTiempo`, `NodoLineaTiempo` |
| Orden ascendente o descendente | Daily You `timelineSortOrder` | `OrdenLinea` (`fecha-asc`, `fecha-desc`) |
| Orden por última edición | moodiary `DiarySort.lastModifiedDesc` | `OrdenLinea` `edicion` |
| Filtro por categoría (con sus hijas) | moodiary `TimelineController` (categoría) | `leerCategoria`, `paginaLinea` |
| Carga por páginas | moodiary `TimelineController` | `paginaLinea` (40 entradas, siempre el último día completo), «Cargar más» |

## Decisiones
- **R1 · Los recuerdos se calculan en el servidor** sobre la lista liviana (id, fecha, hora, ánimo; hasta 20.000 filas, igual que las estadísticas), y recién después se piden las entradas completas de los grupos elegidos. La privacidad del personal se aplica en cada consulta.
- **R2 · Qué entrada entra en qué grupo:** se recorren de la más vieja a la más nueva y cada una entra en el **primer** grupo que cumple (mismo día de otro año → 6 meses → 1 mes → 1 semana); si ninguno y fue un día estupendo (ánimo 4 o 5), queda para «Un buen día». Igual que Daily You.
- **R3 · Los azares no son los de Dart.** Daily You usa `Random()`; acá un generador con semilla del día (`mulberry32`), que además se guarda en el navegador para que no cambie cuando se guarda otra entrada. Misma idea, otra secuencia.
- **R4 · Orden fijo de los grupos:** En este día → 6 meses → 1 mes → 1 semana → buen día → aleatorio.
- **R5 · El tile de storypad se fusiona con la tarjeta «En este día».** storypad muestra una sola tarjeta de retrospectiva; acá la tarjeta «En este día» abre el diálogo con todas las entradas del día y mes, con el botón para responder. Además hay un botón «En este día» para cualquier día elegido del calendario.
- **R6 · Error de storypad:** `SpThrowbackTile` compara el año del primer recuerdo con el actual y siempre cae en «de esta fecha». Acá se aplica lo que quiso decir (`tituloDeRetrospectiva`).
- **R7 · «Última edición» no tiene cantidad por mes** (el mes es el de edición, no el de la entrada).
- **R8 · Responder escribe en el mismo día y mes del año actual**, solo si ya llegó esa fecha (si no, no se ofrece).
- **R9 · Las páginas de la línea nunca cortan un día por la mitad:** si la página 40 cae a mitad de un día, se completa el día y el cursor es la fecha.

## Fuera de esta lane, con motivo (a decidir por Gabriel)
- **Flashback con notificación diaria** (Daily You manda un aviso): no hay notificaciones del diario en la web.
- **Menú «En este día» al mantener pulsado un día** (Daily You): quedó como botón; en la web no hay pulsación larga confiable.
- **Línea de tiempo con gestos y animación de aparición** (moodiary): sin equivalente; la lista carga por páginas.

## Arquitectura
- Reglas puras con tests: `src/lib/diario/recuerdos.ts` (+ `.test.ts`, 23) y `src/lib/diario/linea.ts` (+ `.test.ts`, 13).
- Servidor: `src/lib/diario/servidor-linea.ts`, rutas `GET /api/diario/{linea,recuerdos,en-este-dia}`.
- UI: `src/components/diario/recuerdos/{useRecuerdos,SeccionRecuerdos,OpcionesRecuerdos,EnEsteDiaDialog}`, `src/components/diario/linea/{LineaDeTiempo,NodoLineaTiempo}`, `DiarioVista.tsx` (botones «Línea de tiempo», «En este día» y «Recuerdos»; sección de recuerdos arriba de «Fijadas»).
- Sin cambios de base.

## Archivos en alcance
`src/lib/diario/{recuerdos,linea,servidor-linea}*.ts` · `src/app/api/diario/{linea,recuerdos,en-este-dia}/**` · `src/components/diario/{recuerdos,linea}/**` · `src/components/diario/DiarioVista.tsx` · `vendor/{Daily_You,storypad,moodiary}/**` · `THIRD_PARTY_NOTICES.md`.

## Microtareas
- [x] M1 · Leer las fuentes completas.
- [x] M2 · Copiar fuentes a `vendor/` y ampliar `ORIGEN.md` y `THIRD_PARTY_NOTICES.md`.
- [x] M3 · Reglas puras + tests (36).
- [x] M4 · Servidor: línea de tiempo, recuerdos y «En este día».
- [x] M5 · Interfaz: carrusel, opciones, diálogo, línea de tiempo, integración en `DiarioVista`.
- [x] M6 · Gates, PR #95, integración y limpieza.
- [ ] M7 · Prueba de pantalla: Gabriel (AGENTS.md regla 10).

## Gates
`npx prisma validate` · `npx tsc --noEmit` · `npm test` · `npx eslint src/lib/diario src/app/api/diario src/components/diario src/app/dashboard/diario`

## Hallazgos
- La base no tiene entradas, así que recuerdos y línea de tiempo se ven recién con la prueba de pantalla de Gabriel.
- Gates al cierre del código: prisma validate ok, tsc ok, eslint ok, `npm test` 882 pass / 0 fail (51 saltados: los que escriben en la base real).

## Bitácora
- 2026-11-08 · claude · INICIO 289 · lane creada desde `dev` = `ac8e644`.
- 2026-11-08 · claude · código completo; gates verdes. Falta PR e integración.
- 2026-11-08 · claude · FIN 289 · commit dd3c4b8. Gates: prisma validate ok, tsc ok, eslint ok, npm test 882 pass / 0 fail. INTEGRADA · PR #95 mergeado con merge commit (cad00d7), lane limpiada. Falta M7: prueba de pantalla de Gabriel.
