# Lane 134 — H6: neurodivergencia (modo relajado, Primero/Después, historias sociales)

Pedido: "continua implementando hasta terminar" (meta del 2026-10-14). Spec `LANE_H6_NEURODIVERGENCIA.md`.

## Hecho
- Esquema: `PreferenciaAlumno` (`Homeschool_Preferencias`) y `HistoriaSocial` (`Homeschool_Historias`, con `mostrarEl` y `vistaEn` extra, ver P-38) + relación inversa. **SQL filtrado** abajo (P-37). Sin dependencias nuevas.
- `neuro.ts` (puro): `decidirVista`, `normalizarPasos`, `errorDePasos` (3–5 pasos), 3 plantillas («Hoy no hay clase», «Vamos al médico», «Vienen visitas»); `neuro.test.ts` (4).
- `servidor/neuro.ts`: preferencias (el padre cambia todo; el alumno solo su modo relajado), CRUD de historias (padres), `mostrarHoy` (copia por alumno), `historiasPendientes`, `marcarVista`. API `/api/homeschooling/preferencias` y `/historias` (+ `/mostrar`, `/vista`).
- Modo relajado: `ModoRelajado` pone `data-relajado` en `<html>` (desde `dashboard/layout.tsx`); bloque `[data-relajado]` en `globals.css` **sin hex** (filtro de saturación/contraste + animaciones cortadas); en `ModalManager` solo cambió `celebrate` (sin confeti) y se agregó un check estático en `TASK_SUCCESS`. Los demás usuarios no cambian.
- UI: `neuro/PrimeroDespues`, `HistoriaCard`, `VisorHistoria` (un paso por pantalla), `EditorHistoria`, `PanelNeuro` (página `/dashboard/homeschooling/neurodivergencia`), «Modo calmo» en `HoyAprendo`.
- `guarda.test.ts`: Homeschooling no usa APIs que piden permisos del sistema ni menciona kiosco (D6).
- No se crearon sonidos ni archivos de audio.

## Hallazgos
P-37 a P-41 en `HALLAZGOS_PENDIENTES.md`.

## SQL aplicado (solo las sentencias de H6; sin `DROP`)
```sql
-- CreateTable
CREATE TABLE "Homeschool_Preferencias" (
    "Alumno_ID" INTEGER NOT NULL,
    "Modo_Relajado" BOOLEAN NOT NULL DEFAULT false,
    "Primero_Despues" BOOLEAN NOT NULL DEFAULT false,
    "Recompensa_Despues" TEXT,

    CONSTRAINT "Homeschool_Preferencias_pkey" PRIMARY KEY ("Alumno_ID")
);

-- CreateTable
CREATE TABLE "Homeschool_Historias" (
    "id" SERIAL NOT NULL,
    "Alumno_ID" INTEGER,
    "Titulo" TEXT NOT NULL,
    "Pasos" JSONB NOT NULL,
    "Mostrar_El" DATE,
    "Vista_En" TIMESTAMP(3),
    "Created_At" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Homeschool_Historias_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Homeschool_Historias_Alumno_ID_Mostrar_El_idx" ON "Homeschool_Historias"("Alumno_ID", "Mostrar_El");

-- AddForeignKey
ALTER TABLE "Homeschool_Preferencias" ADD CONSTRAINT "Homeschool_Preferencias_Alumno_ID_fkey" FOREIGN KEY ("Alumno_ID") REFERENCES "Usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```
