# Lane 197 — C9: «Configurar el año»

Catálogo C9 (asistente de configuración del año de Homeschool Planet / Homeschooler.app «en 5 minutos»), con el criterio católico: las fiestas de primera clase.

- Botón **«Configurar el año»** en el Plan: elegir para qué hijos; **vacaciones** (atajo «Vacaciones de invierno» con dos semanas de julio, o rangos propios; se marcan los días de lunes a viernes); y las **fiestas de primera clase que caen entre semana** (del año litúrgico de la casa) con casillas para marcarlas como sin clase.
- `configurarAnio` (en `servidor/planes.ts`): todo en una transacción — crea los días sin clase de cada hijo (sin repetir) y **reparte de nuevo cada plan activo una sola vez**. `lib/homeschooling/anioEscolar.ts` (puro, 3 tests) expande los rangos y valida.
- Ruta `POST /api/homeschooling/anio` (solo padres). Los trimestres del boletín ya se crean desde «Períodos» (lane 182).
- Tests: validaciones y permisos contra la base (solo lectura); el efecto sobre los planes con base no se corrió (`PERMITIR_TESTS_DB=1`).
