# Lane 128 — H3: evidencia con foto y portafolio (portado del Showcase de Roost)

Pedido: "continua implementando hasta terminar" (meta del 2026-10-14). Spec `LANE_H3_EVIDENCIA_Y_PORTAFOLIO.md`.

## Hecho
- Esquema: `EstadoEvidencia`, `EvidenciaAprendizaje` (`Homeschool_Evidencias`), `EvidenciaImagen` (`Homeschool_Evidencia_Imagenes`, con un índice extra en `Archivo_URL` para `limpiarArchivo`) + relaciones inversas. SQL abajo, sin `DROP`.
- Dependencia nueva: `react-dropzone@14.3.8` (exacta).
- `servidor/evidencia.ts`: crear, listar con filtros (estado, alumno, materia, mes, destacadas), obtener, estadísticas, acciones (aprobar con estrellas 1-5, pedir ajuste con comentario obligatorio, destacar/quitar, reenviar), agregar/quitar imagen, borrar; `limpiarArchivo` y `validarUrlImagen` (`claveDeUrl`). **No toca ningún saldo** (hay un test que lee el módulo y comprueba que no menciona puntos, estrellas ni experiencia).
- `roost/dto.ts` `mapShowcase` (de `mapShowcase` del adaptador mongodb), `roost/services/showcase.ts` con los nombres de Roost.
- API `/api/homeschooling/evidencias` (POST, GET), `/estadisticas`, `/[id]` (GET, PATCH, DELETE), `/[id]/imagenes` (POST, DELETE).
- UI portada: `evidencia/EnviarEvidencia` (dropzone + borrador + botón Cámara), `revision/RevisionEvidencias` (StatsCard, SwipeRow: izquierda aprueba, derecha pide ajuste; botones equivalentes), `portafolio/{Portafolio,EvidenciaCard,FiltrosPortafolio}`. Cámara en `VisorLeccion`; enlaces en `PanelHomeschooling` (Revisión con contador, Portafolio) y `HoyAprendo`.
- Páginas `/dashboard/homeschooling/revision` (padres) y `/portafolio` (el hijo solo recibe lo suyo).

## Pendiente
Tests con base real saltados sin `PERMITIR_TESTS_DB=1` (P-4). Hallazgos P-19 a P-23 en `HALLAZGOS_PENDIENTES.md`.

## SQL aplicado
```sql
-- CreateEnum
CREATE TYPE "EstadoEvidencia" AS ENUM ('pendiente', 'aprobada', 'ajustar');

-- CreateTable
CREATE TABLE "Homeschool_Evidencias" (
    "id" SERIAL NOT NULL,
    "Alumno_ID" INTEGER NOT NULL,
    "Dia_Lectivo_ID" INTEGER,
    "Titulo" TEXT,
    "Nota" TEXT,
    "Estado" "EstadoEvidencia" NOT NULL DEFAULT 'pendiente',
    "Comentario_Padre" TEXT,
    "Revisada_Por_ID" INTEGER,
    "Revisada_En" TIMESTAMP(3),
    "Estrellas" INTEGER,
    "Destacada" BOOLEAN NOT NULL DEFAULT false,
    "Destacada_En" TIMESTAMP(3),
    "Created_At" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Homeschool_Evidencias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Homeschool_Evidencia_Imagenes" (
    "id" SERIAL NOT NULL,
    "Evidencia_ID" INTEGER NOT NULL,
    "Archivo_URL" TEXT NOT NULL,
    "Orden" INTEGER NOT NULL DEFAULT 0,
    "Pie" TEXT,
    "Created_At" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Homeschool_Evidencia_Imagenes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Homeschool_Evidencias_Alumno_ID_Estado_idx" ON "Homeschool_Evidencias"("Alumno_ID", "Estado");

-- CreateIndex
CREATE INDEX "Homeschool_Evidencia_Imagenes_Archivo_URL_idx" ON "Homeschool_Evidencia_Imagenes"("Archivo_URL");

-- AddForeignKey
ALTER TABLE "Homeschool_Evidencias" ADD CONSTRAINT "Homeschool_Evidencias_Alumno_ID_fkey" FOREIGN KEY ("Alumno_ID") REFERENCES "Usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Homeschool_Evidencias" ADD CONSTRAINT "Homeschool_Evidencias_Revisada_Por_ID_fkey" FOREIGN KEY ("Revisada_Por_ID") REFERENCES "Usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Homeschool_Evidencias" ADD CONSTRAINT "Homeschool_Evidencias_Dia_Lectivo_ID_fkey" FOREIGN KEY ("Dia_Lectivo_ID") REFERENCES "Homeschool_Dias_Lectivos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Homeschool_Evidencia_Imagenes" ADD CONSTRAINT "Homeschool_Evidencia_Imagenes_Evidencia_ID_fkey" FOREIGN KEY ("Evidencia_ID") REFERENCES "Homeschool_Evidencias"("id") ON DELETE CASCADE ON UPDATE CASCADE;

```
