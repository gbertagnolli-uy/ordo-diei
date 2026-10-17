# Lane 182 — K2: períodos y boletín imprimible

Catálogo D4, D5, D6 (boletín, períodos, asistencia y horas). «Sin necesidad de compliance legal»: es el informe de la casa, no un documento oficial.

- **Tablas** (aditivas): `Homeschool_Periodos` y `Homeschool_Boletines` (solo el comentario del padre; todo lo demás se calcula).
- «Períodos»: crear los **tres trimestres** del año (marzo–diciembre) con un clic, agregar uno propio (semestre, bimestre) o borrar.
- **Boletín** (`/boletin`, desde la Libreta): por hijo y período — promedio y letra por materia con sus comentarios, días y horas de estudio por materia (días con clase hecha × minutos por unidad), **asistencia** (días con clase hecha sobre los que ya pasaron), actividades fuera de pantalla, lectura (páginas y libros terminados), lo que aprendió de memoria, comentario de papá y mamá y firmas. Imprime en A4 en blanco y negro.
- `lib/homeschooling/boletin.ts` (puro, 4 tests) + `servidor/boletin.ts`; rutas `/api/homeschooling/periodos`, `/periodos/[id]`, `/periodos/[id]/boletin/[alumnoId]`.
- Pendiente: reporte de horas por materia a lo largo del año (ya existe `reportes/`), exportar a PDF sin diálogo de impresión.
