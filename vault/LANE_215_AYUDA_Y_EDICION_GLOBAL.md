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
| 215 | Base (`AyudaIcono`, `AdminItem`, `SwipeRow.collapse`) + ayuda en `AsistenteCurso` | en curso |
| 216 | Tareas, materias, cursos/lecciones: `AdminItem` en listas | pendiente |
| 217 | Hábitos y hábitos comunitarios | pendiente |
| 218 | Premios, tienda, cartas, vales | pendiente |
| 219 | Rutina y horarios | pendiente |
| 220 | Homeschooling restante (planes, días sin clase, períodos, materiales, lectura, memoria, muro, actividades) + ayuda en demás asistentes | pendiente |

Auditoría por lane: listar los creables, ver si ya hay PATCH/DELETE y UI; si falta el endpoint, agregarlo con chequeo de admin.
