# Lane 65 — Tareas multi-usuario y sin duplicados

## Pedido (textual)
"Ahora ayudame a quitar tareas duplicadas. Y tambien a que si hay una tarea como la de bañarse asignada a Juan, que es aplicable a otras personas, quiero que la tarea pueda seleccionar varias personas y no tener que crear varias tareas. Esa de bañarse asignada a Juan, vas a ver que ya tiene checklist, esa es la que deberia ser multi-usuario. En realidad toda tarea debe tener potencial de ser multi-usuario."

## Diagnóstico
- El modelo ya es una fila de `Tarea` por persona unidas por `grupoTareaId`; solo se podía elegir varias personas al **crear**. Al editar había un select único.
- Duplicados: el cron generaba un clon por **cada** fila vieja que seguía marcada como recurrente (la deduplicación miraba `parentTaskId`), así que Bañarse salía 3 veces por persona. Además los clones perdían `grupoTareaId` y el checklist.
- `PUT /api/tasks/[id]` ignoraba los ítems del checklist.

## Cambios
- `PUT /api/tasks/[id]` acepta `asignadoIds`: agrega personas (copia abierta con el mismo checklist y grupo) y quita personas (borra sus filas abiertas, su historial queda suelto). También guarda `checklistItems`, conservando lo ya tildado.
- `TaskForm`: el selector múltiple de personas sirve para crear y editar; el edit manda asignados y checklist.
- Cron (`api/cron/daily` y `scripts/run-cron.ts`): no genera si ya hay una fila de hoy para la misma persona + título; el clon hereda `grupoTareaId` y checklist.
- `scripts/limpiar-tareas-duplicadas.ts`: dry-run por defecto, `--aplicar` borra duplicadas Pendientes intactas. Aplicado: 8 filas de Bañarse (#239-#247).

## Pendiente / ojo
- La recurrencia del cron sigue siendo "una fila cabeza pasa a Unica al generar": la serie muere cuando se agotan las plantillas viejas. No se tocó.
- Clones de "Limpieza semanal" de hoy (#245, #248-#250) quedaron sin ítems de checklist (bug anterior del cron).
- En los datos, "Bañarse" no tiene checklist; si se quiere, se agrega editándola ahora que el edit lo guarda.
