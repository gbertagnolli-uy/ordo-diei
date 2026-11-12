---
lane: 300
titulo: Diario fase 4 — animaciones y transiciones (port de moodiary)
plane: "#31"
estado: integrada
rama: task/lane-300-diario-animaciones
agente: claude (arquitecto) + agy (implementación)
actualizado: 2026-11-08
---

# Lane 300 — Animaciones del diario (moodiary)

Última lane de la fase 4 del plan aprobado por Gabriel el 2026-11-08. Regla: se porta, no se «inspira» (memoria `clonar-es-portar-funciones`). Desde esta lane rige la regla global **Claude especifica, agy ejecuta** (Gabriel, 2026-11-08): el spec cerrado está en el scratchpad (`SPEC_300_ANIMACIONES.md`) y la implementación la hace agy. Gabriel no quiere pruebas automáticas nuevas.

## Fuentes leídas (2026-11-08)
`mui/lib/src/themes/page_transitions.dart` (transición de página «fade forwards» con parallax y velo), `mui/.../basic/{select_mark,loading,ink_well}.dart`, `mui/.../common/chip_bar.dart`, `moodiary_diary/.../calendar/calendar_page.dart` (`animateToPage` 400 ms `emphasizedDecelerate`, `AnimatedSize`), `.../widget/diary_tile_frame.dart` (150 ms), `.../search/search_page.dart` (`AnimatedSwitcher` 150 ms, chip 150 ms), `moodiary_assistant/.../assistant_notice.dart` (expandir 220 ms `easeOutCubic`), `detail/diary_page.dart` (índice con `AnimatedContainer` 180 ms). Las animaciones del grafo (lane 295) y del mapa (lane 297) ya se portaron en sus lanes.

## Qué se porta (moodiary → esta app)
| moodiary | Esta app |
|---|---|
| Transición de página «fade forwards» entre pantallas (`MuiPageTransitionsBuilder`) | Las pantallas completas del diario (grafo, estadísticas, asistente, mapa, galería, línea de tiempo, año, buscador) entran con un deslizamiento corto desde la derecha + aparición; al volver a la pantalla principal entra desde la izquierda. CSS puro (`@keyframes` en `globals.css`), 300 ms con la curva `emphasizedDecelerate` de Material (`cubic-bezier(0.05, 0.7, 0.1, 1)`). |
| Calendario: `animateToPage` 400 ms `emphasizedDecelerate` | La grilla de días del calendario se desliza hacia el lado del cambio (mes siguiente = entra desde la derecha; anterior = desde la izquierda), 300 ms. La dirección se deriva de la comparación entre el mes anterior y el actual (también al elegir mes, «Hoy» o desde la vista anual). |
| Chips (`chip_bar`, search chip: `AnimatedContainer` 150–200 ms `easeOut`) | Las pastillas del filtro por etiqueta cambian de color con `transition-colors duration-200 ease-out`. |
| `assistant_notice` expandir 220 ms `easeOutCubic` | El detalle del aviso de compactación del asistente (lane 299) se despliega y pliega animado (alto 0 → auto con `grid-template-rows`, 220 ms). |
| Reduce motion | Todas las animaciones nuevas se apagan con `prefers-reduced-motion: reduce`. |

## Decisiones
- **D1 · CSS puro, sin librerías ni JavaScript de animación**: `@keyframes` + clases en `globals.css`; sin dependencias nuevas. Las pantallas se reconocen porque React las monta de cero al cambiar de rama, lo que dispara la animación sin estado extra.
- **D2 · Distancias y tiempos de la web, no de Flutter**: moodiary mueve la página entera (25 %) durante 800 ms; en pantallas de escritorio eso marea. Se usa un desplazamiento de 1.5 rem y 300 ms con la misma curva. Es una adaptación declarada, no el valor de origen.
- **D3 · La pantalla principal también anima al cargar** (ya que es la misma clase que usa al «volver»); es un fundido de 300 ms y no molesta. No se agrega estado para distinguir la primera carga.
- **D4 · Accesibilidad**: `prefers-reduced-motion: reduce` apaga las animaciones; el contenido plegado del aviso de compactación queda `inert` para que no reciba foco.

## Fuera de esta lane, con motivo (a decidir por Gabriel)
- **Ondas de toque (`ink_well`) y gesto de volver predictivo (`back_gesture`)**: son del motor de Flutter y del sistema operativo; en la web ya está el efecto de `:hover`/`:active` del navegador.
- **`AnimatedSize` del calendario**: en esta app el calendario tiene seis filas fijas, la altura no cambia.
- **Marca de selección animada (`select_mark`) y marco de tarjeta seleccionada (`diary_tile_frame`)**: el diario no tiene selección múltiple de entradas.
- **Índice de títulos de la entrada (`diary_page`, 180 ms)**: la vista de entrada no tiene índice de títulos.
- **`AnimatedSwitcher` de resultados de búsqueda**: el buscador ya atenúa los resultados mientras busca (`opacity-60 transition-opacity`).
- **`MSyncing` (ícono de sincronización girando), cargador de la barra de almacenamiento, widgets de transferencia por LAN, reordenable de ajustes, `marquee`, pantalla de bloqueo con teclado numérico**: no existen en esta app.
- **Prueba de pantalla de Gabriel**: no se levantó ningún servidor (AGENTS.md regla 10).

## Archivos en alcance
Modificar: `src/app/globals.css`, `src/components/diario/DiarioVista.tsx`, `src/components/diario/CalendarioAnimo.tsx`, `src/components/diario/calendario/FiltroEtiquetasCalendario.tsx`, `src/components/diario/asistente/AvisoCompactacion.tsx`. Sin cambios en la base de datos. Sin pruebas nuevas.

## Microtareas
- [x] M1 · Vault (este documento) y spec cerrado para agy.
- [x] M2 · agy implementa el spec; X7 revisa el diff completo. (El proceso de agy fue detenido por el sistema por poca memoria antes de imprimir su reporte; los 5 archivos ya estaban editados, X7 leyó el diff entero y coincide línea por línea con el spec. No se relanzó agy.)
- [x] M3 · (PR #106, dev = baac659) · Gates (`tsc`, `eslint`), commit con paths explícitos, PR (`abrir-pr.sh`), integración, `limpiar-lane.sh 300`, BACKLOG_PLANE («Próxima lane libre: 301») y REPOS_EXTERNOS («283–300»).

## Gates
`npx tsc --noEmit` · `npx eslint src/lib/diario src/app/api/diario src/components/diario src/app/dashboard/diario`. Sin servidores.

## Bitácora
- 2026-11-08 · claude · INICIO 300 (lectura de fuentes y alcance; la lane se crea desde `dev` = `f0d1ad5`).
- 2026-11-08 · claude · FIN 300: CSS de transiciones y cinco archivos de interfaz por agy con spec cerrado; diff revisado completo por X7. Gates: tsc 0 · eslint 0 · suite existente 1273 (1234 ok, 39 saltadas, 0 fallas, corrida por `abrir-pr.sh`). Sin cambios de base de datos, sin pruebas nuevas. PR #106 integrado, lane limpiada. Falta la prueba de pantalla de Gabriel.
