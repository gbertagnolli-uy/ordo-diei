# Lane 175 — L1: lista y registro de lectura

Catálogo E2, E3. Pedido: «lectura real, lápiz y cuaderno». Los libros son de papel; la app solo lleva la cuenta.

- **Tablas** (aditivas): `Homeschool_Lecturas` (`LecturaLibro`, estado por_leer/leyendo/leido) y `Homeschool_Sesiones_Lectura`. (El hábito «Leer un libro» y su tabla `Libros` son otra cosa —premios—; no se tocan.)
- Pestaña «Lectura» (hijo y padres): Leyendo / Por leer / Leídos con avance (%), «Registrar lectura» (llegué a la página N + minutos), «Lo terminé» (1–5 estrellas y **narración**: lo que contó con sus palabras, anotado), editar y quitar. Resumen: leídos este año, páginas de la semana, racha de lectura.
- Un hijo lleva su propia lista; un padre la de todos y puede **asignar** un libro (queda marcado «lo eligieron mamá o papá»).
- `lib/homeschooling/lectura.ts` (puro: porcentaje, racha, resumen, páginas nuevas) con 4 tests; servidor `servidor/lectura.ts`; rutas `/api/homeschooling/lectura`, `/lectura/[id]`, `/registrar`, `/terminar`, `/alumnos/[id]/lectura`.
- Pendiente: lectura asignada dentro del plan (libro del curso → registro), lista de lectura imprimible, vínculo con el premio de libro.
