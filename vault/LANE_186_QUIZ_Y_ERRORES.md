# Lane 186 — V2/V3: quiz paso a paso y errores de Estudio

Pedido: «El UX del consumo de … quizzes … debe ser world-class».

- **Quiz final** (`QuizFinal`) pasó de formulario largo a **una pregunta por vez**: contador y barra «n de N», opciones grandes (≥ 56 px) que se eligen con un toque o con las teclas **1–4 / a–d** (Enter avanza), «Anterior/Siguiente», una **pantalla de repaso** (cuál falta, cuál ya respondió, saltar a una) y «Entregar» solo con todas respondidas. El resultado muestra la nota, «n de N bien», un mensaje según el umbral y el detalle con la explicación de cada pregunta. La nota la sigue calculando el servidor (la API no cambió).
- `lib/homeschooling/quizFlujo.ts` (puro, 3 tests): primera sin responder, respondidas, teclas y mensaje de la nota.
- **V3 — errores**: `app/dashboard/homeschooling/error.tsx` (Next 16, `unstable_retry`): si una pantalla de Estudio falla, la cabecera y las pestañas quedan y aparece «No se pudo cargar esta pantalla» con «Volver a intentar». Los estados de carga ya los cubre `loading.tsx` del segmento (esqueleto).
- Pendiente: auditoría de accesibilidad de todas las pantallas (foco, contraste en modo oscuro, tamaños táctiles), animaciones de celebración al aprobar.
