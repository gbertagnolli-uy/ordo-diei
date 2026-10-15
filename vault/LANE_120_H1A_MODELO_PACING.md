# Lane 120 — H1a: modelo base y motor de pacing

Pedido: "Sí, seguí con H1a" → spec `vault/nuevas-features/homeschooling/LANE_H1A_MODELO_Y_PACING.md`.

## Hecho
- `prisma/schema.prisma`: enums `TipoRecurso`, `UnidadContenido`, `EstadoPlan`, `EstadoDiaLectivo`, `PlataformaVideo`; modelos `Materia`, `RecursoCurso`, `LeccionCurso`, `PlanCurso`, `DiaLectivo`, `DiaNoLectivo` (tablas `Homeschool_*`) y relaciones inversas en `Usuario`, `Libro` y `Tarea`. Sin los campos `// H2…H5`.
- `src/lib/homeschooling/config.ts`, `pacing.ts` (`repartir`, puro), `recalculo.ts` (`planearRecalculo`, la decisión pura de `recalcular`), `servidor/planes.ts` (`crearPlan`, `vistaPrevia`, `marcarNoLectivo`, `recalcular`, `moverDia`, `omitirDia`; solo Padre/Madre).
- API `src/app/api/homeschooling/`: `POST planes`, `POST planes/vista-previa`, `POST no-lectivos`, `PATCH dias/[id]`.
- Tests: `pacing.test.ts` (16, incluye los 10 de la spec y `recalcular` puro). `servidor/planes.test.ts` (3, base real) **saltados salvo `PERMITIR_TESTS_DB=1`; no se corrieron** (AGENTS.md §6).

## Decisiones / desvíos de la spec
- `recalcular` se partió en una parte pura (`planearRecalculo`, testeada sin base) y la transacción de Prisma, que solo aplica el resultado.
- `moverDia` y `omitirDia` reciben `actorId` (permiso de padre) además del día: `moverDia({ actorId, diaId, fecha, hoy })`.
- Un día pasado `pendiente` cuya Tarea ya está completada (aún sin sincronizar) se conserva y pasa a `hecha`, en vez de `movida`.
- Si el plan empieza en el futuro, el recálculo reparte desde `inicio`, no desde hoy.
- `base` = máx. `unidadHasta` de los días conservados (regla 5). Si un día empezado deja unidades sin cubrir por debajo, `recalcular` lo informa en `huecos` (no pasa en el flujo normal porque `asegurarTareasDeHoy` recalcula antes de crear la Tarea de hoy).

## SQL aplicado (sin DROP, `migrate diff` posterior vacío)
```sql
-- CreateEnum
CREATE TYPE "TipoRecurso" AS ENUM ('libro', 'curso_videos', 'pdf', 'enlaces', 'libre');

-- CreateEnum
CREATE TYPE "UnidadContenido" AS ENUM ('pagina', 'capitulo', 'leccion', 'unidad');

-- CreateEnum
CREATE TYPE "EstadoPlan" AS ENUM ('activo', 'pausado', 'finalizado');

-- CreateEnum
CREATE TYPE "EstadoDiaLectivo" AS ENUM ('pendiente', 'hecha', 'movida', 'omitida');

-- CreateEnum
CREATE TYPE "PlataformaVideo" AS ENUM ('youtube', 'vimeo');

-- CreateTable
CREATE TABLE "Homeschool_Materias" (
    "id" SERIAL NOT NULL,
    "Nombre" TEXT NOT NULL,
    "Descripcion" TEXT,
    "Portada_URL" TEXT,
    "Icono" TEXT,
    "Color" TEXT,
    "Dificultad" "DificultadTarea" NOT NULL DEFAULT 'Media',
    "Orden" INTEGER NOT NULL DEFAULT 0,
    "Activa" BOOLEAN NOT NULL DEFAULT true,
    "Creador_ID" INTEGER NOT NULL,
    "Created_At" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Homeschool_Materias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Homeschool_Recursos" (
    "id" SERIAL NOT NULL,
    "Materia_ID" INTEGER NOT NULL,
    "Titulo" TEXT NOT NULL,
    "Descripcion" TEXT,
    "Portada_URL" TEXT,
    "Orden" INTEGER NOT NULL DEFAULT 0,
    "Creador_ID" INTEGER NOT NULL,
    "Tipo" "TipoRecurso" NOT NULL,
    "Unidad_Tipo" "UnidadContenido" NOT NULL,
    "Total_Unidades" INTEGER NOT NULL,
    "URL" TEXT,
    "Libro_ID" INTEGER,
    "Minutos_Por_Unidad" INTEGER NOT NULL DEFAULT 20,
    "Umbral_Aprobacion" INTEGER NOT NULL DEFAULT 70,
    "Navegacion_Libre" BOOLEAN NOT NULL DEFAULT false,
    "Created_At" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "Updated_At" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Homeschool_Recursos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Homeschool_Lecciones" (
    "id" SERIAL NOT NULL,
    "Recurso_ID" INTEGER NOT NULL,
    "Orden" INTEGER NOT NULL,
    "Titulo" TEXT NOT NULL,
    "Instrucciones" TEXT,
    "URL" TEXT,
    "Video_Plataforma" "PlataformaVideo",
    "Video_ID" TEXT,
    "Miniatura_URL" TEXT,
    "Creador_ID" INTEGER NOT NULL,
    "Created_At" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Homeschool_Lecciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Homeschool_Planes" (
    "id" SERIAL NOT NULL,
    "Recurso_ID" INTEGER NOT NULL,
    "Alumno_ID" INTEGER NOT NULL,
    "Inicio" DATE NOT NULL,
    "Fin" DATE NOT NULL,
    "Dias_Semana" INTEGER[],
    "Estado" "EstadoPlan" NOT NULL DEFAULT 'activo',
    "Created_At" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Homeschool_Planes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Homeschool_Dias_Lectivos" (
    "id" SERIAL NOT NULL,
    "Plan_ID" INTEGER NOT NULL,
    "Fecha" DATE NOT NULL,
    "Unidad_Desde" INTEGER NOT NULL,
    "Unidad_Hasta" INTEGER NOT NULL,
    "Estado" "EstadoDiaLectivo" NOT NULL DEFAULT 'pendiente',
    "Tarea_ID" INTEGER,
    "Created_At" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Homeschool_Dias_Lectivos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Homeschool_Dias_No_Lectivos" (
    "id" SERIAL NOT NULL,
    "Alumno_ID" INTEGER NOT NULL,
    "Fecha" DATE NOT NULL,
    "Motivo" TEXT NOT NULL,
    "Created_At" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Homeschool_Dias_No_Lectivos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Homeschool_Materias_Activa_Orden_idx" ON "Homeschool_Materias"("Activa", "Orden");

-- CreateIndex
CREATE INDEX "Homeschool_Recursos_Materia_ID_Orden_idx" ON "Homeschool_Recursos"("Materia_ID", "Orden");

-- CreateIndex
CREATE UNIQUE INDEX "Homeschool_Lecciones_Recurso_ID_Orden_key" ON "Homeschool_Lecciones"("Recurso_ID", "Orden");

-- CreateIndex
CREATE INDEX "Homeschool_Planes_Alumno_ID_Estado_idx" ON "Homeschool_Planes"("Alumno_ID", "Estado");

-- CreateIndex
CREATE UNIQUE INDEX "Homeschool_Planes_Recurso_ID_Alumno_ID_key" ON "Homeschool_Planes"("Recurso_ID", "Alumno_ID");

-- CreateIndex
CREATE UNIQUE INDEX "Homeschool_Dias_Lectivos_Tarea_ID_key" ON "Homeschool_Dias_Lectivos"("Tarea_ID");

-- CreateIndex
CREATE INDEX "Homeschool_Dias_Lectivos_Fecha_Estado_idx" ON "Homeschool_Dias_Lectivos"("Fecha", "Estado");

-- CreateIndex
CREATE UNIQUE INDEX "Homeschool_Dias_Lectivos_Plan_ID_Fecha_key" ON "Homeschool_Dias_Lectivos"("Plan_ID", "Fecha");

-- CreateIndex
CREATE UNIQUE INDEX "Homeschool_Dias_No_Lectivos_Alumno_ID_Fecha_key" ON "Homeschool_Dias_No_Lectivos"("Alumno_ID", "Fecha");

-- AddForeignKey
ALTER TABLE "Homeschool_Materias" ADD CONSTRAINT "Homeschool_Materias_Creador_ID_fkey" FOREIGN KEY ("Creador_ID") REFERENCES "Usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Homeschool_Recursos" ADD CONSTRAINT "Homeschool_Recursos_Materia_ID_fkey" FOREIGN KEY ("Materia_ID") REFERENCES "Homeschool_Materias"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Homeschool_Recursos" ADD CONSTRAINT "Homeschool_Recursos_Creador_ID_fkey" FOREIGN KEY ("Creador_ID") REFERENCES "Usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Homeschool_Recursos" ADD CONSTRAINT "Homeschool_Recursos_Libro_ID_fkey" FOREIGN KEY ("Libro_ID") REFERENCES "Libros"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Homeschool_Lecciones" ADD CONSTRAINT "Homeschool_Lecciones_Recurso_ID_fkey" FOREIGN KEY ("Recurso_ID") REFERENCES "Homeschool_Recursos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Homeschool_Lecciones" ADD CONSTRAINT "Homeschool_Lecciones_Creador_ID_fkey" FOREIGN KEY ("Creador_ID") REFERENCES "Usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Homeschool_Planes" ADD CONSTRAINT "Homeschool_Planes_Recurso_ID_fkey" FOREIGN KEY ("Recurso_ID") REFERENCES "Homeschool_Recursos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Homeschool_Planes" ADD CONSTRAINT "Homeschool_Planes_Alumno_ID_fkey" FOREIGN KEY ("Alumno_ID") REFERENCES "Usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Homeschool_Dias_Lectivos" ADD CONSTRAINT "Homeschool_Dias_Lectivos_Plan_ID_fkey" FOREIGN KEY ("Plan_ID") REFERENCES "Homeschool_Planes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Homeschool_Dias_Lectivos" ADD CONSTRAINT "Homeschool_Dias_Lectivos_Tarea_ID_fkey" FOREIGN KEY ("Tarea_ID") REFERENCES "Tareas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Homeschool_Dias_No_Lectivos" ADD CONSTRAINT "Homeschool_Dias_No_Lectivos_Alumno_ID_fkey" FOREIGN KEY ("Alumno_ID") REFERENCES "Usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

```
