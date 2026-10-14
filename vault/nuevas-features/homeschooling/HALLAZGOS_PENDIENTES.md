# Homeschooling — hallazgos y decisiones pendientes (documento común de todas las lanes)

> Pedido del usuario (2026-10-14): "Documenta esas cosas en un mismo markdown, en común para todas las lanes. Déjalo para después y continúa implementando hasta terminar. Cuando finalicemos, tomaremos decisiones en base a lo que hayas detectado."
> **Cada lane agrega acá, sin resolver por su cuenta, lo que detecta y que necesita una decisión del usuario.** Se decide todo al terminar la implementación. Formato: id, lane, qué se vio, evidencia, qué se hizo mientras tanto, opciones.

## Abiertos

| Id | Lane | Hallazgo | Hecho mientras tanto | Opciones |
|---|---|---|---|---|
| P-1 | 121 (HS-SEG) | `timer`, `checklist` y `not-done` de `src/app/api/tasks/[id]/` no comprueban que quien llama sea el asignado ni un padre (`reject` sí exige padre). | Sin cambios (la spec los deja para decidir). | a) misma regla `puedeCompletarTarea` en las tres; b) solo en `timer`/`checklist`; c) dejar como está. |
| P-2 | 121 (HS-SEG) | Prueba manual con dos hijos (hermano → 403) sin hacer; solo hay tests de la función pura. | — | Probar en el navegador al final. |
| P-3 | 118 (HS0) | `CalendarView` portado solo está verificado con `tsc`/`eslint`; no se vio renderizado en claro/oscuro. | — | Verificar al armar `PlanCalendario` (H1b-2). |
| P-4 | 120 (H1a) | Tests con base real (`planes.test.ts`, `cursos.test.ts`) saltados: `AGENTS.md` prohíbe `PERMITIR_TESTS_DB=1` sin orden del usuario; el código Prisma de `planes.ts`/`cursos.ts` solo está verificado con `tsc` y los tests puros. | — | Correrlos una vez con `PERMITIR_TESTS_DB=1` (crean y borran filas `__test_hs_*`). |
| P-5 | 120 (H1a) | `recalcular` toma como base el máximo `unidadHasta` de los días conservados (regla 5 de la spec). Si un día empezado deja unidades sin cubrir por debajo, esas unidades no se reprograman; `recalcular` lo informa en `huecos` pero nadie lo muestra. | `huecos` se devuelve; en el flujo normal no ocurre (`asegurarTareasDeHoy` recalcula antes de crear la Tarea de hoy). | a) dejarlo; b) alertar al padre si `huecos > 0`; c) rediseñar `repartir` para rangos no contiguos. |
| P-6 | 123 (H1b-1) | Borrar una lección se bloquea (409) si algún día `hecha`/`omitida` cubre una unidad ≥ a su número, no solo la suya (más estricto que la spec): borrar una anterior correría la numeración de lo ya cumplido. Reordenar lecciones también bloquea mover las ya cumplidas. | Implementado así. | Aflojar solo a "la lección propia". |
| P-7 | 123 (H1b-1) | `crearRecurso` de tipos `curso_videos`/`enlaces` arranca con `totalUnidades = 0` y se completa al cargar lecciones; un plan no se puede crear hasta tener lecciones (`crearPlan` falla con "No hay días lectivos"). | Implementado así. | Mensaje más claro en la UI. |

## Resueltos
_(ninguno todavía)_
