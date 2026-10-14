# Lane 130 — H4b: interfaz de checkpoints, quiz final, repaso y editor de preguntas

Pedido: "continua implementando hasta terminar" (meta del 2026-10-14). Segunda mitad de H4 (`LANE_H4_QUIZZES_Y_REPASO.md`, §UI).

## Hecho
- Dependencia nueva: `react-player@3.4.0` (exacta) y `ui/radio-group` (CLI de shadcn, con el import corregido; ver P-29).
- `hoy/ReproductorLeccion` (react-player; pausa en el checkpoint con `proximoCheckpoint`), `hoy/CheckpointOverlay` (acierto → «Continuar»; fallo → explicación y «Volver 30 s»), `hoy/QuizFinal` (radio-group; «Repasemos»), `hoy/RepasoDeHoy` (hasta 3 mini-preguntas antes de las lecciones).
- `VisorLeccion`: usa el reproductor; si la lección tiene quiz, «Terminé» pasa a «Hacer el quiz» y al aprobar sigue el flujo de H2 (próxima lección o completar la Tarea del día). `hoy.ts` informa `quiz` y `checkpoints` por lección.
- Padre: `cursos/EditorPreguntas` (botón en la vista de lección) y aviso de repaso en `PanelHomeschooling` («Leo: 50 % en Fracciones — requiere repaso»).

## Verificación
`tsc`, `eslint`, `npm test` y `next build` en verde. Sin prueba en navegador (P-8, P-28). Hallazgos P-28 a P-31 en `HALLAZGOS_PENDIENTES.md`.
