---
lane: 287
titulo: Diario fase 2 — estadísticas (port de Daily You, storypad y moodiary)
plane: "#31"
estado: integrada
rama: task/lane-287-diario-estadisticas
agente: claude
actualizado: 2026-11-08
---

# Lane 287 — Estadísticas del diario

Primera lane de la fase 2 («vistas y estadísticas») del plan aprobado por Gabriel el 2026-11-08 (ver [[LANE_283_DIARIO_FASE1_ESCRITURA_Y_ORGANIZACION]]). Gabriel fijó el objetivo «continua hasta terminar»: se sigue con las fases 2, 3 y 4 sin pausas para preguntar. Regla: se porta, no se «inspira» (memoria `clonar-es-portar-funciones`). La fase 2 se parte en dos lanes: **287 estadísticas** y **288 vistas** (calendario de ánimo mensual/anual, línea de tiempo, «un día como hoy»).

## Fuentes leídas completas (2026-11-08)
- **Daily You** `7cc237d`: `stats/{entry_stats,stats_range,streaks}.dart`, `models/{stats_subject,mood}.dart`, `utils/{bucket_combiner,chart_y_range,chart_axis}.dart`, `pages/statistics_page.dart`, `widgets/{stat_range_selector,stats_overview_card,distribution_chart,label_summary_card,mood_summary_chart,value_by_day_chart,value_over_time_chart}.dart`, `l10n/intl_es.arb` (textos).
- **storypad** `a76825e`: `core/objects/stats/{stats_range,story_stats_object}.dart`, `core/services/stories/{story_stats_service,monthly_story_stats_service}.dart`, `views/stats/{stats_view,stats_view_model,stats_content,stats_section}.dart` y `local_widgets/*`.
- **moodiary** `2c552dd`: `moodiary_data/{mood_insights,mood_insights_controller,mood_insights_repository}.dart`, `presentation/mood_insights/{mood_insights_page,mood_period_header,mood_period_picker,mood_patterns,mood_calendar}.dart`.

## Qué se porta (mapa fuente → web)
| Función | Fuente | En esta app |
|---|---|---|
| Resumen: racha actual, más larga, días estupendos, días desde un día malo, registros, días, palabras | Daily You `streaks`, `entry_stats`, `StatsOverviewCard` | `calcularRachas`, `ResumenGeneral` |
| Rangos 1 mes / 6 meses / 1 año / todo, recordados | Daily You `StatsRange`, `StatsRangeSelector` | `filasEnRango`, selector (localStorage) |
| Sujeto de los gráficos: ánimo, etiqueta o contador | Daily You `StatsSubject` | `SujetoGraficos` |
| Ánimo a lo largo del tiempo, agrupado por día / semana / mes / año, con suavizado | Daily You `ValueOverTimeChart` | `serieAgrupada`, `GraficoEvolucion` |
| Resumen de ánimo (barras por nivel, el más común), por día de la semana | Daily You `MoodSummaryChart`, `ValueByDayChart` | `totalesAnimo`, `promedioPorDiaSemana` |
| Contador: evolución, distribución en bins, por día de la semana | Daily You `DistributionChart`, `trackerValuesByEntry` | `calcularBins`, `valoresContador` |
| Etiqueta común: cobertura (presente / ausente), evolución, por día de la semana | Daily You `LabelSummaryCard` | `cobertura` |
| Período mes / año con anterior y siguiente; días activos «X de Y» con los días transcurridos del período en curso | storypad `StatsRange`, `StoryStatsService` | `ventanaDe`, `estadisticasDelPeriodo` |
| Más usadas por grupo de etiquetas (sentimientos, actividades…), etiquetas sueltas y categorías, con «ver más» | storypad `StatsEmojiGrid`, `StatsLabelList` | `masUsadas`, `RankingEtiquetas` |
| Entradas por mes del año | storypad `StatsTrend` | `entradasPorMes` |
| Período semana / mes / año: promedio con su nivel y diferencia con el período anterior, días registrados, entradas, mejor día, mayor racha de días buenos | moodiary `summarizeMood`, `moodPeriodDelta` | `resumenAnimo`, `diferencia` |
| Distribución con porcentaje; patrón por día de la semana (barras sobre/bajo el 3); tendencia (diaria o mensual) | moodiary `MoodDistribution`, `MoodWeekdayPattern`, `_trend` | `distribucionAnimo`, `GraficoPatronSemana`, `GraficoTendencia` |
| Mostrar u ocultar secciones | storypad `StatsSection` filtro | selector de secciones (localStorage) |

## Decisiones
- **E1 · Los cálculos se hacen en el navegador** sobre una lista liviana de filas (`id, fecha, hora, ánimo, palabras, fotos, categoría, etiquetas`); el servidor solo la arma (tope 20.000 entradas, las más recientes) y no hay endpoint por rango. Cambiar de período o de sujeto no vuelve a pedir nada.
- **E2 · La semana empieza el lunes** (moodiary la empieza el domingo): es la convención de la app (`CalendarioAnimo`) y de Uruguay. **Desvío a confirmar.**
- **E3 · Restar meses** (`1 mes` a partir del 31) se acota al último día del mes de destino (Dart desborda al mes siguiente). Mejora menor.
- **E4 · El rango móvil incluye el día de inicio** (Daily You compara contra la medianoche del día, con lo que lo incluye casi siempre).
- **E5 · Los «sentimientos/actividades» de storypad son los grupos de etiquetas de la lane 284**: el ranking se arma por grupo, sin lista fija. Las etiquetas sin grupo van en «Etiquetas». Los contadores cuentan por presencia en los rankings.
- **E6 · Niveles de ánimo con la escala configurada** (lane 286): los gráficos muestran el glifo y el color del nivel configurado.
- **E7 · Fotos** = fotos adjuntas + imágenes dentro del documento. **Fuera de esta lane, con motivo:** videos, notas de voz, lugares y países (storypad) → no existen en el diario hasta la fase 3 / 4; compartir/exportar las estadísticas como imagen (`StatsShareFooter`) → fase 3 (datos).
- **E8 · Las estadísticas del diario familiar cuentan las entradas de toda la familia; las del personal, solo las propias** (misma regla de visibilidad que la búsqueda).

## Arquitectura
- Reglas puras con tests: `src/lib/diario/estadisticas.ts` (+ `.test.ts`).
- Servidor: `src/lib/diario/servidor-estadisticas.ts`, API `GET /api/diario/estadisticas?tipo=`.
- UI: `src/components/diario/estadisticas/*` (panel con pestañas Resumen / Gráficos, ranking, gráficos con recharts), botón «Estadísticas» en `DiarioVista`.
- Sin cambios de base.

## Archivos en alcance
`src/lib/diario/estadisticas*.ts` · `src/lib/diario/servidor-estadisticas.ts` · `src/app/api/diario/estadisticas/**` · `src/components/diario/estadisticas/**` · `src/components/diario/DiarioVista.tsx` · `vendor/{Daily_You,storypad,moodiary}/**` · `THIRD_PARTY_NOTICES.md`.

## Microtareas
- [x] M1 · Leer las fuentes completas.
- [x] M2 · Copiar fuentes a `vendor/` y ampliar los `ORIGEN.md`.
- [x] M3 · Reglas puras + tests.
- [x] M4 · Servidor + API.
- [x] M5 · Interfaz.
- [x] M6 · Gates, PR, integración y limpieza.
- [ ] M7 · Prueba de pantalla: Gabriel (AGENTS.md regla 10).

## Gates
`npx prisma validate` · `npx tsc --noEmit` · `npm test` · `npx eslint src/lib/diario src/app/api/diario src/components/diario src/app/dashboard/diario`

## Hallazgos
- La base no tiene entradas, así que los números reales (rachas, rankings, gráficos) se ven recién con la prueba de pantalla de Gabriel. El humo contra la base con `tsx` no corrió por el entorno de `tsx` (error de transformación del script); la consulta de `servidor-estadisticas.ts` se validó solo por tipos de Prisma.
- Los gráficos usan recharts (ya instalado) en lugar de fl_chart; el eje vertical del ánimo muestra los números 1 a 5 con una leyenda de glifos debajo (Daily You dibuja el ícono en el eje).
- El calendario de ánimo (mensual y mapa anual) de moodiary queda para la lane 288 (vistas).
- **A decidir por Gabriel:** E2 (la semana empieza el lunes), el límite de 20.000 entradas y que videos, voz y lugares quedan para fases 3 y 4.

## Bitácora
- 2026-11-08 · claude · INICIO 287 · lane creada con `nueva-lane.sh` desde `dev` = `7d5e61f`.
- 2026-11-08 · claude · FIN 287 · commit 6bf38d7. Gates: prisma validate (sin cambios de esquema), tsc ok, eslint ok, npm test 807 pass / 0 fail. Pendiente: PR, integración y prueba de pantalla.
- 2026-11-08 · claude · INTEGRADA · PR #93 mergeado con merge commit, lane limpiada. Falta M7: prueba de pantalla de Gabriel.
