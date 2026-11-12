# Lane 193 — K3 y D8: portafolio imprimible y aprobación en lote

- **Portafolio para imprimir** (`/portafolio/imprimir`, solo padres; botón en el Portafolio, respeta el hijo y la materia que se miran): portada con el alumno, el rango («del 1 de marzo al 31 de mayo de 2026») y la cantidad, y cada trabajo **aprobado** con su foto, fecha, materia, estrellas y comentario, dos por fila en A4. Rango de fechas editable en pantalla. `lib/homeschooling/portafolioImpreso.ts` (puro, 2 tests). Sin valor legal: es el registro de la casa.
- **Aprobar en lote** (Revisión → Pendientes): «Aprobar las N» (las que se ven con la búsqueda aplicada) con confirmación; sin estrellas ni nota. Para valorar una, se aprueba de a una.
