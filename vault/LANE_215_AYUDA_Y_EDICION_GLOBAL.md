# Lane 215 — Ayuda en cada paso + editar/eliminar global por swipe

## 1. Pedido textual del usuario (2026-10-16)

> Necesito que agregues iconos de ayuda en cada paso, está muy dificil entender los flujos. Además todo lo que se cree (tareas, cursos, materias, habitos, habitos comunitarios, premios, rutina y horarios, etc.) sea editable y eliminable por los administradores.
>
> Para eso se debe replicar el componente de aprobar/eliminar tareas haciendo swipe, pero para editar/eliminar un item.
>
> debe ser global, para cualquier item creable, debe ser también editable o eliminable.

Contexto previo (lane 214): al asignar un curso el asistente se reiniciaba solo; corregido (efecto de reinicio solo dependía de `open`).

## 2. Diseño

- `src/components/AyudaIcono.tsx`: icono «?» con Popover (shadcn) que explica el paso. Se usa en títulos de pasos, diálogos y secciones.
- `src/components/AdminItem.tsx`: envoltorio global. Reutiliza `SwipeRow` (el de aprobar/rechazar tareas): izquierda = Eliminar, derecha = Editar, más menú «⋯» equivalente (accesible sin gestos, igual que los botones de ParentReviewPanel). Solo actúa si `enabled` (admin: rolFamiliar Padre/Madre). Eliminar pide confirmación en un Dialog; Editar no colapsa la fila (`SwipeSide.collapse = false`).
- `SwipeRow`: nuevo campo opcional `collapse` (default `true`, comportamiento anterior intacto); con `false` la fila vuelve a su sitio y se llama `onCommit`.
- Sin cambios de comportamiento en lo existente: se agrega editar/eliminar solo donde falta, reutilizando los formularios y endpoints actuales.

## 3. Lanes

| Lane | Contenido | Estado |
|---|---|---|
| 214 | Fix: el asistente de curso se reiniciaba (efecto dependía de `materias={[group]}`) | integrada |
| 215 | Base (`AyudaIcono`, `AdminItem`, `SwipeRow.collapse`) + ayuda en `AsistenteCurso` + fix DELETE de tareas con historial (FK `Historial_Acciones`) + AdminItem en productos de la tienda | integrada |
| 216 | `AdminItem` en materias (panel), cursos (grilla) y lecciones (sidebar). `AdminItem` gana `confirmar` y `forma="tarjeta"`. Tareas: la vista admin es tabla/calendario/kanban con drag; ya editan (clic) y eliminan (botón); swipe diferido, ver decisión abajo | integrada al terminar |
| 217 | Hábitos y hábitos comunitarios | pendiente |
| 218 | Premios, tienda, cartas, vales | pendiente |
| 219 | Rutina y horarios | pendiente |
| 220 | Homeschooling restante (planes, días sin clase, períodos, materiales, lectura, memoria, muro, actividades) + ayuda en demás asistentes | pendiente |

Auditoría por lane: listar los creables, ver si ya hay PATCH/DELETE y UI; si falta el endpoint, agregarlo con chequeo de admin.

## 4. Decisiones y notas

- Tareas admin (`AdminTasksClient`, `TaskBoard`): tabla, calendario y kanban con drag-and-drop; el swipe choca con el drag y una tabla no se desliza. Ya tienen editar (clic en la fila) y eliminar (botón). Pendiente decidir con el usuario si se pasan a lista de tarjetas.
- Premios (`PremiosClient`) también es una tabla con botones editar/eliminar: mismo caso.
- Las lecciones del sidebar solo se editan desde la lista si son del curso abierto (el formulario usa el curso activo); eliminar funciona en cualquiera.
