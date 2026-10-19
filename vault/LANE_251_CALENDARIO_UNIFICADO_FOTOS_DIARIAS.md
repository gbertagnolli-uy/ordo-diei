# Lane 251 — Calendario de tareas unificado por tarea y avatar dinámico según asignación diaria

## Contexto y requerimiento
En `/dashboard/admin/tareas` (y componentes de calendario compartidos), cuando una tarea tiene varios responsables (ya sea por rotación, grupo o co-asignación simultánea), la vista de calendario proyectaba un cuadro/evento independiente por cada usuario en lugar de un único cuadro para la tarea. Además, se requería que cada cuadro muestre fotos chiquitas de los usuarios y que en el día específico en que solo un usuario la tiene asignada, se muestre únicamente su foto, mientras que en los días con otros co-responsables se visualicen exclusivamente las fotos de los asignados en esos días.

## Cambios realizados
1. **Unificación temporal en el motor de calendario (`src/lib/proyeccionCalendario.ts`)**:
   - Agrupación de instancias concretas que ocurren en la misma fecha (por `grupoTareaId`, `parentTaskId` o identificador de tarea base) para generar exactamente **un cuadro por tarea por día**.
   - En tareas rotativas (`rotacionConfig`), para cada día proyectado se evalúa `responsablesEnDia`: si solo hay 1 responsable ese día, el cuadro contiene únicamente ese usuario en `resource.asignados`. Si hay múltiples responsables en ese día, el cuadro contiene a los co-responsables de esa fecha específica.
   - En tareas de grupo / co-asignadas (`grupoTareaId`), se agrupan en una sola ocurrencia proyectada por fecha con todos los co-responsables.
   - Actualización de los filtros de calendario (`usuarioId` / `personaId` y `tipoTarea: "grupal"`): el filtro por usuario comprueba la asignación específica del día evaluando `asignadosIds` y `asignados`, visualizando la tarea solo en los días donde el usuario filtrado está asignado.
2. **Visualización compacta de fotos en `CustomEvent` (`AdminTasksClient.tsx` y `MissionCalendar.tsx`)**:
   - Si la tarea en ese día tiene 1 solo usuario asignado, muestra únicamente su foto chiquita (16x16 px) con su nombre.
   - Si la tarea en ese día tiene varios co-responsables asignados, muestra un grupo superpuesto de fotos chiquitas de los usuarios asignados ese día (hasta 3 con badge numérico adicional si son más) y los nombres correspondientes.
3. **Preservación de co-responsables al seleccionar tarea en el calendario (`AdminTasksClient.tsx`, `MissionCalendar.tsx`, `TaskForm.tsx`)**:
   - `onSelectEvent` vincula los IDs y perfiles de co-responsables para abrir el modal de edición de tarea con todos los asignados preseleccionados.
   - `TaskForm.tsx` inicializa `selectedUserIds` reconociendo también `task._assignees` y `task.asignados`.
4. **Pruebas unitarias (`src/lib/proyeccionCalendario.test.ts`)**:
   - Verificación de que una tarea rotativa con días individuales y días compartidos genera exactamente 1 cuadro por día, con la foto exclusiva del usuario en su día y las fotos conjuntas en el día compartido.
   - Verificación de unificación de filas concretas con `grupoTareaId` en un único cuadro.
   - Verificación de filtros por usuario y por tipo de tarea grupal.

## Base de datos
No requiere migraciones ni cambios en el esquema de Postgres.

## Archivos modificados
- `src/lib/proyeccionCalendario.ts`
- `src/lib/proyeccionCalendario.test.ts`
- `src/app/dashboard/admin/tareas/AdminTasksClient.tsx`
- `src/components/tasks/MissionCalendar.tsx`
- `src/components/dashboard/TaskForm.tsx`
- `vault/LANE_251_CALENDARIO_UNIFICADO_FOTOS_DIARIAS.md` (NUEVO)
