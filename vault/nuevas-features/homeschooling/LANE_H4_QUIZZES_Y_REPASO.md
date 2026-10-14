# Lane H4 — Preguntas, checkpoints de video y repaso espaciado

> Lista para implementar. Depende de **H2**. Tamaño **L**. Sin cartas en v1 (HD9). Corrección **siempre en el servidor** (HD7).

## Objetivo
Verificar la comprensión (quiz al final de la lección y pausas con pregunta en el video) y reforzar lo difícil con repasos.

## Modelo (esta lane agrega)
`PreguntaLeccion`, `RepasoLeccion` y sus relaciones (`LeccionCurso.preguntas/repasos`, `Usuario.repasos`).

## Servidor (`servidor/quiz.ts`, `servidor/repaso.ts`)
- `preguntasParaAlumno(leccionId, tipo: "checkpoint" | "final")` → devuelve **solo** `enunciado` y `opciones` (nunca `correcta` ni `explicacion`).
- `responder({ alumnoId, preguntaId, elegida })` → `{ correcta: boolean, explicacion? }` (checkpoint, respuesta a respuesta).
- `calificarFinal({ alumnoId, leccionId, respuestas })` → nota = aciertos/total·100. Si `nota ≥ RecursoCurso.umbralAprobacion` → `ProgresoLeccion.completada = true`, `mejorNota = max`, `fallosSeguidos = 0`; si no, `fallosSeguidos += 1`, `intentos += 1`. Función pura `calcularNota` con test.
- `fallosSeguidos ≥ 2` (o activación manual del padre) → `programarRepaso(alumnoId, leccionId)` crea `RepasoLeccion` con `paso 0` y `proximo = hoy + 1`.
- `repasosDeHoy(alumnoId)`: los vencidos y no resueltos (máx. 3 por día). `resolverRepaso(id, acerto)`: si acierta, avanza `paso` en `[1,3,7,14,30]` y fija `proximo`; si falla, vuelve a `paso 0`; al pasar el último paso → `resuelto = true`. Función pura `siguientePaso` con test.
- Editor del padre: crear/editar preguntas de una lección (opciones 2–4, índice correcto, explicación, segundo de video opcional).
- API: `GET /api/homeschooling/lecciones/[id]/preguntas`, `POST …/responder`, `POST …/calificar`, `GET /api/homeschooling/repasos/hoy`, `POST /api/homeschooling/repasos/[id]`.

## UI
- `ReproductorYouTube` con la **YouTube IFrame API** (cargar `https://www.youtube.com/iframe_api` una sola vez, `host: youtube-nocookie.com`). Sondeo cada 500 ms de `getCurrentTime()`; un checkpoint se dispara con `tiempoActual >= segundoVideo` si aún no se respondió (**comparar con `>=`, no con `===`**). Se pausa el video y se muestra `CheckpointOverlay` con botones grandes. Acierto → «Continuar»; fallo → explicación y «Volver 30 s». Si el niño adelanta pasando checkpoints, el overlay aparece igual para el más cercano sin responder. *Esto es una guía pedagógica, no una barrera: la barrera real es la nota del servidor.*
- `QuizFinal` (3–5 preguntas) al terminar la lección; muestra resultado y, si no aprueba, «Repasemos» con vuelta al video.
- **Aviso al padre** cuando `fallosSeguidos ≥ 2`: contador en el panel («Leo: 50 % en Fracciones — requiere repaso»).
- En «Hoy aprendo»: bloque «Repaso de hoy» (máx. 3 mini-preguntas) antes de la lección.

## Pruebas
`calcularNota` (0, 70 exacto, 100, sin preguntas), `siguientePaso` (aciertos/fallos/fin), que `preguntasParaAlumno` no incluya `correcta` (test de forma), y disparo de checkpoint con salto de tiempo (lógica pura extraída del reproductor).

## Aceptación
1. El video se pausa en el segundo configurado y no continúa sin responder.
2. La API jamás envía la respuesta correcta antes de responder.
3. Con ≥ 70 % se completa la lección; con menos queda bloqueada la siguiente.
4. Dos fallos seguidos crean un repaso y avisan al padre.
