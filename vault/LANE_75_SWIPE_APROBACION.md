# Lane 75 — Swipe para aprobar/rechazar tareas

Pedido (textual): "A la pantalla de aprobacion de tareas quiero agregar un efecto. Al deslizar el item hacia la izquierda, que se apruebe la tarea mostrando el color verde, al deslizar hacia la derecha denegar con color rojo. En ambos casos se debe hacer full swipe para que se ejecute accion. [...] No tiene swipe hacia la izquierda, por lo que debes imitarlo del swipe de la derecha. [...] No quiero eliminar los botones actuales, solo quiero agregar el gesto en ambas direcciones"
Referencia: componente `SwipeRow` (motion + hugeicons) pegado por el usuario, de una sola dirección y con cajón de acciones.

- `src/components/SwipeRow.tsx`: versión bidireccional y solo full-swipe (sin cajón). Props `left`/`right` (label, icono, color, onCommit). Mantiene resistencia elástica, umbral `commitAt`, flick por velocidad, vibración al armarse, colapso de altura y `prefers-reduced-motion`.
- `ParentReviewPanel.tsx`: cada fila va envuelta en `SwipeRow`; izquierda = Aprobar (`--success`), derecha = Rechazar (`--destructive`). Los botones siguen igual y usan el mismo `handleAction`.

- Lane 76: en escritorio el arrastre nativo de la imagen (avatar) y la selección de texto cancelaban el gesto con mouse; se agregó `onDragStart` preventDefault, `pointer-events-none` en imágenes, `select-none` mientras se arrastra y cursor grab.
