# Lane H4 — Preguntas, checkpoints de video y repaso espaciado

> Lista para implementar. Depende de **H2**. Tamaño **L**. Roost no tiene nada de esto (se escribe). Corrección **siempre en el servidor** (HD9). Sin cartas (HD11).
> Número: el siguiente libre al crearla. Rama sugerida `task/lane-NN-hs-quizzes`. **Dependencias nuevas:** `react-player@3.4.0`, `ts-fsrs@5.4.2`. Agregar `radio-group` con el CLI de shadcn (`npx shadcn add radio-group`).

## Objetivo
Verificar la comprensión (quiz final y pausas con pregunta en el video) y reforzar lo difícil con repasos.

## Modelo (esta lane agrega)
`PreguntaLeccion`, `IntentoQuiz`, `TarjetaRepaso` y sus relaciones inversas (ARQ §3.2).

## Servidor (`servidor/quiz.ts`, `servidor/repaso.ts`)
- `preguntasParaAlumno(leccionId, tipo: "checkpoint" | "final")` → **solo** `id`, `orden`, `segundoVideo`, `enunciado`, `opciones` (nunca `correcta` ni `explicacion`).
- `responderCheckpoint({ alumnoId, preguntaId, elegida })` → `{ correcta: boolean, explicacion? }`.
- `calcularNota(preguntas, respuestas)` — **pura**: aciertos/total·100 redondeado; sin preguntas → 100.
- `calificarFinal({ alumnoId, leccionId, respuestas })` → crea `IntentoQuiz` (`aprobado = nota >= RecursoCurso.umbralAprobacion`); si aprueba → `completarLeccion` (H2), que crea el `ProgresoLeccion`. Devuelve nota, aprobado y, recién ahora, las explicaciones.
- `fallosSeguidos(alumnoId, leccionId)` = cantidad de `IntentoQuiz` no aprobados desde el último aprobado. Con `≥ 2` (o a pedido del padre) → `crearTarjeta(alumnoId, leccionId)`.
- Repaso con **ts-fsrs**: `createEmptyCard()` al crear; al responder, `fsrs().next(tarjeta, ahora, acierto ? Rating.Good : Rating.Again)` y guardar la `card` resultante en `TarjetaRepaso.tarjeta` y su `due` en `proximo`. Tras 3 aciertos seguidos con intervalo ≥ 30 días → `resuelta = true`. **Nombres de la API confirmados con ts-fsrs 5.4.2** (lane 119, en un directorio aparte): `createEmptyCard(fecha)`, `fsrs()`, `Rating.Again = 1`, `Rating.Good = 3`, `next(card, ahora, rating)` devuelve `{ card, log }` con `card.due`; envolverlos en `servidor/repaso.ts` para que el resto no dependa de la librería.
- `repasosDeHoy(alumnoId, hoy)`: `proximo` ≤ fin del día en `APP_TZ`, no resueltas, máx. 3.
- Editor del padre: crear/editar preguntas de una lección (2–4 opciones, índice correcto, explicación, segundo de video opcional).
- `completarLeccion` (H2): si la lección tiene preguntas finales, exige un `IntentoQuiz` aprobado.
- API: `GET /api/homeschooling/lecciones/[id]/preguntas?tipo=`, `POST …/checkpoint`, `POST …/calificar`, `GET /api/homeschooling/repasos/hoy`, `POST /api/homeschooling/repasos/[id]`, `PUT /api/homeschooling/lecciones/[id]/preguntas` (padres).

## UI
- `VisorLeccion` (H2) cambia el iframe por **`react-player`** (YouTube y Vimeo con la misma API) para leer el tiempo y pausar. Un checkpoint se dispara con `tiempoActual >= segundoVideo` si no se respondió (**`>=`, nunca `===`**); si el niño adelanta, aparece **el primero sin responder** (el de menor `segundoVideo` entre los que cumplen `segundoVideo ≤ t`), así no se saltea ninguno; al responderlo, aparece el siguiente pendiente (X21; vectores en `PLAN_VERIFICACION.md` §6.7). La lógica de disparo es una función pura (`proximoCheckpoint(t, checkpoints, respondidos)`). **Verificar en el README de react-player 3.4.0** el nombre del evento de tiempo y si permite `youtube-nocookie`; si no lo permite, usar `youtube.com` (aceptado: uso doméstico).
- `CheckpointOverlay` (botones grandes): acierto → «Continuar»; fallo → explicación y «Volver 30 s».
- `QuizFinal` (3–5 preguntas, `radio-group`): resultado y, si no aprueba, «Repasemos» con vuelta al video.
- Aviso al padre cuando `fallosSeguidos ≥ 2` («Leo: 50 % en Fracciones — requiere repaso»).
- En «Hoy aprendo»: bloque «Repaso de hoy» (máx. 3 mini-preguntas) antes de las lecciones.
- *Es una guía pedagógica, no una barrera: la barrera real es la nota del servidor.*

## Tests
`calcularNota` (0, 70 exacto, 100, sin preguntas); `preguntasParaAlumno` no incluye `correcta` ni `explicacion` (test de forma); `proximoCheckpoint` con salto de tiempo; `fallosSeguidos`; repaso: acierto aleja `proximo`, fallo lo acerca.

## Aceptación
1. El video se pausa en el segundo configurado y no sigue sin responder.
2. La API jamás envía la respuesta correcta antes de responder.
3. Con nota ≥ umbral se completa la lección; con menos queda bloqueada la siguiente y la Tarea del día no se puede completar (guardia de H2).
4. Dos fallos seguidos crean una tarjeta de repaso y avisan al padre.
