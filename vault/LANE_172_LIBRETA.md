# Lane 172 — K1: corrección con nota y libreta de calificaciones

Catálogo D2, D3 (y parte de D4). Pedido: «facilitar la correción de trabajo teniendo en cuenta que al menos uno de los padres estará presente».

- **Tabla** `Homeschool_Calificaciones` (`Calificacion`, enum `TipoCalificacion`): nota 0–100 de un día lectivo (una por día, se puede cambiar) o suelta (examen, proyecto, lectura, oral, tarea). Esquema aditivo.
- `lib/homeschooling/calificaciones.ts` (puro, con tests): letra (90/80/70/60), promedio con un decimal, tono, `armarLibreta` y `promedioGeneral`.
- `servidor/calificaciones.ts` + rutas `/api/homeschooling/notas`, `/notas/[id]`, `/dias/[id]/nota`, `/alumnos/[id]/libreta`. Solo padres: la libreta no la ve el hijo en la v1 (la devolución es en persona).
- **Pantallas**: pestaña «Libreta» (padres) con promedio general, una tarjeta por materia con su promedio y letra, notas editables/borrables, alta de notas sueltas, selector de hijo e impresión. «Calificar este día» en el calendario del plan para los días hechos (`CalificarDia`: toques de 100/90/80/70/60/50 o número, comentario).
- Pendiente (K2): períodos de calificación y boletín imprimible; (K1b) nota desde la revisión de evidencias y revisión en lote; (C2/B6) clave de respuestas solo para padres.
- Tests: `calificaciones.test.ts` (lib 5; servidor 2 de permisos/validación; 1 con base, no corrido: `PERMITIR_TESTS_DB=1`).
