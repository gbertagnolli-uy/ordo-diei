# Lane 126 — H2a: «Hoy aprendo», servidor (Tareas, progreso y guardia)

Pedido: "continua implementando hasta terminar" (meta del 2026-10-14). Primera mitad de H2 (spec `LANE_H2_HOY_APRENDO.md`, §Modelo y §Servidor).

## Hecho
- Esquema: `ProgresoLeccion` (`Homeschool_Progreso`) + relaciones inversas. SQL abajo, sin `DROP`.
- `dia.ts` (puro): `vencimientoLeccion` (18:00 − estimado, nunca antes de las 00:00), `tituloTarea`, `rangoTexto`, `estadoSincronizado`, `estaBloqueado`, `motivoLeccionBloqueada`, `motivoGuardia` (+ `dia.test.ts`, 8 tests).
- `servidor/tareas.ts`: `crearTareaDelDia` (sin carreras: create + `updateMany` condicionado a `tareaId: null`), `asegurarTareasDeHoy`, `alumnosConPlanActivo`.
- `servidor/progreso.ts`: `sincronizarDias`, `unidadesVistas`, `completarLeccion` (upsert idempotente, solo hoy o adelantable, exige la lección anterior), `desmarcarLeccion` (solo padre).
- `servidor/hoy.ts`: `leccionesDeHoy` (día de hoy + adelantable con navegación libre, lecciones con completada/bloqueada/motivo).
- `servidor/guardia.ts`: `motivoBloqueoTarea` → una llamada en `complete/route.ts` (400 con el motivo). Cron diario: bloque B2 que llama `asegurarTareasDeHoy` por alumno con plan activo.
- API: `GET /api/homeschooling/hoy`, `POST|DELETE /api/homeschooling/lecciones/[id]/completar`.
- Desvío: un día `hecha` vuelve a `pendiente` si el padre rechaza su Tarea (la spec solo definía pendiente→hecha), para que el niño pueda volver a completarla.

## Hallazgos
P-13 a P-16 en `HALLAZGOS_PENDIENTES.md`.

## SQL aplicado
```sql
-- CreateTable
CREATE TABLE "Homeschool_Progreso" (
    "id" SERIAL NOT NULL,
    "Alumno_ID" INTEGER NOT NULL,
    "Leccion_ID" INTEGER NOT NULL,
    "Recurso_ID" INTEGER NOT NULL,
    "Completada_En" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Homeschool_Progreso_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Homeschool_Progreso_Alumno_ID_Recurso_ID_idx" ON "Homeschool_Progreso"("Alumno_ID", "Recurso_ID");

-- CreateIndex
CREATE UNIQUE INDEX "Homeschool_Progreso_Alumno_ID_Leccion_ID_key" ON "Homeschool_Progreso"("Alumno_ID", "Leccion_ID");

-- AddForeignKey
ALTER TABLE "Homeschool_Progreso" ADD CONSTRAINT "Homeschool_Progreso_Alumno_ID_fkey" FOREIGN KEY ("Alumno_ID") REFERENCES "Usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Homeschool_Progreso" ADD CONSTRAINT "Homeschool_Progreso_Leccion_ID_fkey" FOREIGN KEY ("Leccion_ID") REFERENCES "Homeschool_Lecciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Homeschool_Progreso" ADD CONSTRAINT "Homeschool_Progreso_Recurso_ID_fkey" FOREIGN KEY ("Recurso_ID") REFERENCES "Homeschool_Recursos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

```
