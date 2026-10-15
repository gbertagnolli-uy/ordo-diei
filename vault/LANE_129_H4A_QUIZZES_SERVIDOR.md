# Lane 129 — H4a: preguntas, quizzes y repaso espaciado (servidor)

Pedido: "continua implementando hasta terminar" (meta del 2026-10-14). Primera mitad de H4 (`LANE_H4_QUIZZES_Y_REPASO.md`).

## Hecho
- Esquema: `PreguntaLeccion`, `IntentoQuiz`, `TarjetaRepaso` (+ relaciones inversas). SQL abajo, sin `DROP`. Dependencia nueva: `ts-fsrs@5.4.2` (exacta); solo `servidor/repaso.ts` la importa.
- `quiz.ts` (puro): `calcularNota`, `proximoCheckpoint` (`>=` y el primero sin responder, regla X21), `fallosSeguidosDe`, `validarPreguntas`.
- `servidor/quiz.ts`: `preguntasParaAlumno` (sin `correcta` ni `explicacion`), `preguntasCompletas` y `guardarPreguntas` (padres), `responderCheckpoint`, `calificarFinal` (intento, completa la lección si aprueba), `fallosSeguidos`, `crearTarjeta` (con ≥ 2 fallos), `avisosParaPadre`.
- `servidor/repaso.ts` (ts-fsrs: acierto = `Good`, fallo = `Again`, resuelta tras 3 aciertos seguidos con intervalo ≥ 30 días) y `servidor/repasos.ts` (`repasosDeHoy`, máx. 3; `responderRepaso`).
- `completarLeccion` (H2) ahora exige un intento aprobado si la lección tiene preguntas finales.
- API: `GET|PUT lecciones/[id]/preguntas`, `POST …/checkpoint`, `POST …/calificar`, `GET repasos/hoy`, `POST repasos/[id]`, `GET avisos`.
- Tests: `quiz.test.ts` (lógica pura y ts-fsrs: 7), `servidor/quiz.test.ts` (forma de las respuestas y permisos sin base: 4; con base real: 2 saltados).

## Pendiente
Interfaz (H4b): `react-player`, `CheckpointOverlay`, `QuizFinal`, editor del padre, «Repaso de hoy», aviso. Hallazgos P-24 a P-27 en `HALLAZGOS_PENDIENTES.md`.

## SQL aplicado
```sql
-- CreateTable
CREATE TABLE "Homeschool_Preguntas" (
    "id" SERIAL NOT NULL,
    "Leccion_ID" INTEGER NOT NULL,
    "Orden" INTEGER NOT NULL,
    "Segundo_Video" INTEGER,
    "Enunciado" TEXT NOT NULL,
    "Opciones" JSONB NOT NULL,
    "Correcta" INTEGER NOT NULL,
    "Explicacion" TEXT,

    CONSTRAINT "Homeschool_Preguntas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Homeschool_Intentos_Quiz" (
    "id" SERIAL NOT NULL,
    "Alumno_ID" INTEGER NOT NULL,
    "Leccion_ID" INTEGER NOT NULL,
    "Nota" INTEGER NOT NULL,
    "Aprobado" BOOLEAN NOT NULL,
    "Respuestas" JSONB NOT NULL,
    "Created_At" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Homeschool_Intentos_Quiz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Homeschool_Repasos" (
    "id" SERIAL NOT NULL,
    "Alumno_ID" INTEGER NOT NULL,
    "Leccion_ID" INTEGER NOT NULL,
    "Tarjeta" JSONB NOT NULL,
    "Proximo" TIMESTAMP(3) NOT NULL,
    "Resuelta" BOOLEAN NOT NULL DEFAULT false,
    "Created_At" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Homeschool_Repasos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Homeschool_Preguntas_Leccion_ID_Orden_key" ON "Homeschool_Preguntas"("Leccion_ID", "Orden");

-- CreateIndex
CREATE INDEX "Homeschool_Intentos_Quiz_Alumno_ID_Leccion_ID_Created_At_idx" ON "Homeschool_Intentos_Quiz"("Alumno_ID", "Leccion_ID", "Created_At");

-- CreateIndex
CREATE INDEX "Homeschool_Repasos_Alumno_ID_Proximo_Resuelta_idx" ON "Homeschool_Repasos"("Alumno_ID", "Proximo", "Resuelta");

-- CreateIndex
CREATE UNIQUE INDEX "Homeschool_Repasos_Alumno_ID_Leccion_ID_key" ON "Homeschool_Repasos"("Alumno_ID", "Leccion_ID");

-- AddForeignKey
ALTER TABLE "Homeschool_Preguntas" ADD CONSTRAINT "Homeschool_Preguntas_Leccion_ID_fkey" FOREIGN KEY ("Leccion_ID") REFERENCES "Homeschool_Lecciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Homeschool_Intentos_Quiz" ADD CONSTRAINT "Homeschool_Intentos_Quiz_Alumno_ID_fkey" FOREIGN KEY ("Alumno_ID") REFERENCES "Usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Homeschool_Intentos_Quiz" ADD CONSTRAINT "Homeschool_Intentos_Quiz_Leccion_ID_fkey" FOREIGN KEY ("Leccion_ID") REFERENCES "Homeschool_Lecciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Homeschool_Repasos" ADD CONSTRAINT "Homeschool_Repasos_Alumno_ID_fkey" FOREIGN KEY ("Alumno_ID") REFERENCES "Usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Homeschool_Repasos" ADD CONSTRAINT "Homeschool_Repasos_Leccion_ID_fkey" FOREIGN KEY ("Leccion_ID") REFERENCES "Homeschool_Lecciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

```
