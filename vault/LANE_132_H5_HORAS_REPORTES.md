# Lane 132 — H5: horas, actividades y reportes (portado de Events de Roost)

Pedido: "continua implementando hasta terminar" (meta del 2026-10-14). Spec `LANE_H5_HORAS_Y_REPORTES.md`.

## Hecho
- Esquema: `ActividadOffline` (`Homeschool_Actividades`), `ParticipanteActividad` (`Homeschool_Participantes`), `MetaHoras` (`Homeschool_Metas_Horas`) + relaciones inversas. SQL abajo, sin `DROP`. Sin dependencias nuevas.
- `horas.ts` (puro): `sumarHoras` (lecciones `hecha` por tiempo real o unidades × minutos; actividades por participante; recorte por período; `movida` no cuenta), `formatoDuracion`, `periodoDe`. `horas.test.ts`: 8 tests (los casos de PLAN_VERIFICACION §6.8).
- `servidor/actividades.ts` (crear/editar/borrar solo padres, `fin > inicio`), `servidor/horas.ts` (`resumenHoras` con una consulta por tipo, `fijarMeta`), `roost/dto.ts` `mapEvent`, `roost/services/event.ts` con las 5 funciones de Roost.
- API: `GET|POST /api/homeschooling/actividades`, `GET|PATCH|DELETE …/actividades/[id]`, `GET …/reportes/resumen`, `PUT …/metas`.
- UI portada: `horas/ActividadForm`, `ActividadCard`, `ActividadDetalle`, `ParticipantesList` (sin RSVP, virtual ni URL de reunión); `horas/Horas`; `reportes/Reporte` (StatsCard, gráfico con `ui/chart`, metas con barra, cursos, anexo de evidencias destacadas de H3, `window.print()`).
- Páginas `/dashboard/homeschooling/horas` y `/reportes`; enlaces en el panel del padre y en «Hoy aprendo». Las actividades también aparecen en `PlanCalendario`.
- Impresión: bloque `@media print` en `globals.css` (A4, 2 cm, sin sidebar/avisos, saltos de página) y `print:hidden` en el dock (`MainDock`).

## Hallazgos
P-32 a P-36 en `HALLAZGOS_PENDIENTES.md` (incluye el incidente con el worktree de la lane 131).

## SQL aplicado
```sql
-- CreateTable
CREATE TABLE "Homeschool_Actividades" (
    "id" SERIAL NOT NULL,
    "Materia_ID" INTEGER NOT NULL,
    "Titulo" TEXT NOT NULL,
    "Descripcion" TEXT,
    "Inicio" TIMESTAMP(3) NOT NULL,
    "Fin" TIMESTAMP(3) NOT NULL,
    "Lugar" TEXT,
    "Creador_ID" INTEGER NOT NULL,
    "Created_At" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "Updated_At" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Homeschool_Actividades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Homeschool_Participantes" (
    "id" SERIAL NOT NULL,
    "Actividad_ID" INTEGER NOT NULL,
    "Alumno_ID" INTEGER NOT NULL,
    "Created_At" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Homeschool_Participantes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Homeschool_Metas_Horas" (
    "id" SERIAL NOT NULL,
    "Alumno_ID" INTEGER NOT NULL,
    "Materia_ID" INTEGER NOT NULL,
    "Horas" INTEGER NOT NULL,

    CONSTRAINT "Homeschool_Metas_Horas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Homeschool_Actividades_Inicio_idx" ON "Homeschool_Actividades"("Inicio");

-- CreateIndex
CREATE UNIQUE INDEX "Homeschool_Participantes_Actividad_ID_Alumno_ID_key" ON "Homeschool_Participantes"("Actividad_ID", "Alumno_ID");

-- CreateIndex
CREATE UNIQUE INDEX "Homeschool_Metas_Horas_Alumno_ID_Materia_ID_key" ON "Homeschool_Metas_Horas"("Alumno_ID", "Materia_ID");

-- AddForeignKey
ALTER TABLE "Homeschool_Actividades" ADD CONSTRAINT "Homeschool_Actividades_Materia_ID_fkey" FOREIGN KEY ("Materia_ID") REFERENCES "Homeschool_Materias"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Homeschool_Actividades" ADD CONSTRAINT "Homeschool_Actividades_Creador_ID_fkey" FOREIGN KEY ("Creador_ID") REFERENCES "Usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Homeschool_Participantes" ADD CONSTRAINT "Homeschool_Participantes_Actividad_ID_fkey" FOREIGN KEY ("Actividad_ID") REFERENCES "Homeschool_Actividades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Homeschool_Participantes" ADD CONSTRAINT "Homeschool_Participantes_Alumno_ID_fkey" FOREIGN KEY ("Alumno_ID") REFERENCES "Usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Homeschool_Metas_Horas" ADD CONSTRAINT "Homeschool_Metas_Horas_Alumno_ID_fkey" FOREIGN KEY ("Alumno_ID") REFERENCES "Usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Homeschool_Metas_Horas" ADD CONSTRAINT "Homeschool_Metas_Horas_Materia_ID_fkey" FOREIGN KEY ("Materia_ID") REFERENCES "Homeschool_Materias"("id") ON DELETE CASCADE ON UPDATE CASCADE;

```
