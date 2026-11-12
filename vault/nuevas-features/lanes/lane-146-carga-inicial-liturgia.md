# Lane 146 · Primera carga de la liturgia en la base

**Fecha** 2026-10-14 · Solo documentación (la carga se corrió con un script de una sola vez, fuera del repo).

Con el OK explícito del usuario se cargaron en las 4 tablas nuevas (`Dias_Liturgicos`, `Bloques_Liturgicos`, `Documentos_Liturgicos`, `Generaciones_Liturgicas`) los volcados de los ensayos de la lane 133: 10 956 días, 28 131 documentos, 31 979 bloques únicos, más una fila en `Generaciones_Liturgicas`. Upsert idempotente; se deshace con `TRUNCATE` de las 4 tablas. Verificación y pendientes: `PENDIENTES_REPOSO_LITURGIA.md` (sección «Carga inicial»).
