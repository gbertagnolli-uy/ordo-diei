# Lane 250 — Corrección de asignación de fechas en tareas rotativas/recurrentes, proyección de calendario con filtros y soporte de múltiples responsables por día (tareas en grupo)

## Resumen
1. **Asignación en fechas correctas para tareas rotativas y recurrentes**:
   - Corrección de la creación y edición de tareas en `src/app/api/tasks/route.ts` y `src/app/api/tasks/[id]/route.ts`: se eliminó el fallback que fijaba `fechaVencimiento` al día de creación o al día siguiente. Ahora se calcula la primera ocurrencia real según la regla recurrente con `calcularPrimerVencimientoRecurrente` (`src/lib/recurrenceUtils.ts`).
   - Cierre de turnos no completados pasados con `No_Realizada` en `generarRecurrentes.ts` para que un turno vencido previo no detenga la generación indefinida de los siguientes ciclos.
2. **Reparación integral de vistas de calendario**:
   - Motor puro de proyección temporal de calendario (`src/lib/proyeccionCalendario.ts`) que expande todas las tareas recurrentes y rotativas a lo largo de cualquier franja de calendario sobre sus fechas programadas reales, deduplicando contra instancias ya persistidas en la base de datos.
   - Cada tarea en el calendario se proyecta para el usuario en el día específico en que la tiene asignada, visualizando su nombre, avatar e iconos indicadores de rotación o recurrencia. Al hacer clic en una ocurrencia proyectada, se abre el modal de edición sobre la tarea base.
   - Implementación de los 5 filtros en las vistas de calendario (`AdminTasksClient.tsx` y `MissionCalendar.tsx`):
     - Por usuario (`usuarioId` / `personaId`)
     - Por dificultad (`dificultad`)
     - Por tipo de tarea (`rotativa`, `grupal`, `individual`)
     - Por recurrencia (`recurrente`, `unica`)
     - Por recompensas (`con_recompensa`, `sin_recompensa`)
   - Habilitación de la vista de calendario en `TaskWorkspace.tsx` también para padres y administradores, vinculando la lista de miembros de la familia.
3. **Múltiples responsables por día en selección de día de la semana (tareas en grupo)**:
   - En `TaskForm.tsx`: se eliminó la restricción exclusiva que desmarcaba un día de la semana para otros usuarios cuando uno lo seleccionaba, permitiendo asignar a dos o más responsables para el mismo día de la semana.
   - En `rotacionTarea.ts`: soporte para múltiples responsables por día (`responsablesEnDia`), creación de misiones grupales con `grupoTareaId` en `generarRecurrentes.ts` y en `/api/tasks/route.ts` cuando el día programado tiene asignados múltiples usuarios.
   - En `esTareaVisibleParaUsuarioEnDia`: todos los co-responsables del día ven la tarea activa en su dashboard y calendario.

## Base de datos
No requiere migraciones ni cambios en el esquema de Postgres. Utiliza los campos existentes `rotacionConfig Json?` y `grupoTareaId`.

## Archivos modificados y agregados
- `src/lib/proyeccionCalendario.ts` (NUEVO): motor de proyección temporal de eventos en calendario y filtros.
- `src/lib/proyeccionCalendario.test.ts` (NUEVO): suite de pruebas unitarias de proyección y filtros.
- `src/lib/rotacionTarea.ts` y `src/lib/rotacionTarea.test.ts`: soporte de múltiples responsables por día (`responsablesEnDia`), grupos y pruebas.
- `src/lib/recurrenceUtils.ts` y `src/lib/recurrenceUtils.test.ts`: función `calcularPrimerVencimientoRecurrente` y pruebas.
- `src/lib/generarRecurrentes.ts` y `src/lib/generarRecurrentes.test.ts`: generación de tareas grupales cuando hay múltiples asignados en el mismo día y desatasco de turnos pasados.
- `src/app/api/tasks/route.ts` y `src/app/api/tasks/[id]/route.ts`: cálculo de primer vencimiento y creación en grupo para días con co-responsables.
- `src/components/dashboard/TaskForm.tsx`: soporte UI de selección no-exclusiva de días de la semana entre usuarios.
- `src/app/dashboard/admin/tareas/filtrosTareas.ts`: filtros por `tipoTarea` y `recompensa` para sincronizar tabla y calendario.
- `src/app/dashboard/admin/tareas/AdminTasksClient.tsx`: integración de proyección de calendario, visualización por usuario asignado y barra de filtros ampliada.
- `src/components/tasks/MissionCalendar.tsx`: proyección temporal, barra de 5 filtros y selector de tareas.
- `src/components/tasks/TaskWorkspace.tsx`: habilitación de vista calendario para administradores y pase de usuarios de la familia.
