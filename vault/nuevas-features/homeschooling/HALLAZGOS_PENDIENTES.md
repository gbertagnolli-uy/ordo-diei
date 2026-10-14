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
| P-8 | 124 (H1b-2) | La interfaz de H1b solo está verificada con `tsc`, `eslint` y `next build` (compila y las 4 páginas figuran en las rutas). **No se vio renderizada**: sin capturas de escritorio/móvil, sin probar el arrastre del calendario ni el asistente a mano. | — | Recorrer `/dashboard/homeschooling` en el navegador (padre y un hijo) al final y corregir lo visual. |
| P-9 | 124 (H1b-2) | El asistente crea un plan por alumno de a uno (`POST planes` en bucle): si el segundo falla (p. ej. 409 porque ya tenía el curso), el primero queda guardado. | Se avisa con un toast del error. | Endpoint que cree varios planes en una transacción. |
| P-10 | 124 (H1b-2) | Los hijos ven "Próximamente" en `/dashboard/homeschooling` hasta H2. `materias/[id]` ya les funciona si tienen un plan (modo hijo, sin marcar lecciones). | Implementado así. | — |
| P-11 | 124 (H1b-2) | Faltan, sobre lo que pedía la spec: archivar una materia desde la UI (existe `editarMateria({activa:false})` pero ningún botón), reordenar cursos/lecciones arrastrando (existen las rutas `PUT`), y editar un plan ya creado (solo se mueve/omite día a día). | No se implementó. | Decidir si hacen falta. |
| P-12 | 124 (H1b-2) | `next build` falló una vez por importar `esPadre` de `habitos/permisos.ts` desde un módulo del navegador (arrastra `pg`). Corregido y cubierto por un test de guarda; el mismo patrón puede repetirse en otras lanes. | Test de guarda en `roost/guarda.test.ts`. | — |

## Resueltos
_(ninguno todavía)_
