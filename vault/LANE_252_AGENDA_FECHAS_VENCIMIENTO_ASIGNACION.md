# Lane 252 — Agenda y calendario: proyección por fechas reales de vencimiento y asignación

## Contexto y requerimiento
En `/dashboard` (y en particular en el panel lateral de "Agenda" y en las vistas de agenda/calendario), las tareas recurrentes y rotativas seguían apareciendo según su fecha estática de creación en lugar de su fecha real de vencimiento o turno de asignación. Esto causaba:
- Que los días marcados con puntito en el calendario mensual de la Agenda estuvieran fijados en la fecha en que se creó la regla originalmente.
- Que al hacer clic en el día en que la tarea efectivamente vence o le toca al usuario, la lista estuviera vacía ("Nada vence este día").
- Que al hacer clic en el día de creación histórica de la tarea, aparecieran tareas activas con fechas pasadas como si vencieran ese día.
- Que en el motor de proyección de calendario (`proyeccionCalendario.ts`), las plantillas base se incluyeran en el Paso 1 en su fecha de creación espuria además de sus proyecciones futuras.
- Que `esTareaVisibleParaUsuarioEnDia` descartara tareas rotativas en días activos comparando contra `tarea.fechaVencimiento` (fecha de creación) en vez de evaluar `ocurreRotacionEn` y `responsablesEnDia`.

## Cambios realizados
1. **Omitir plantillas base en el Paso 1 de `proyeccionCalendario.ts`**:
   - Se discriminan las plantillas base recurrentes o rotativas (`(esRecurrente || esRotativa) && !t.parentTaskId && !t.generadaPorCron`) para que no se proyecten erróneamente en el Paso 1 con su fecha estática de creación.
   - En el Paso 2 se proyectan de forma limpia y exacta para cada día del rango en que efectivamente ocurren y con los responsables asignados para cada fecha.
2. **Visibilidad dinámica para plantillas rotativas en `rotacionTarea.ts`**:
   - `esTareaVisibleParaUsuarioEnDia` ahora comprueba si la tarea es una plantilla rotativa activa. Si lo es, evalúa `ocurreRotacionEn` y `responsablesEnDia` para la fecha consultada sin atarse ni descartarse por el `fechaVencimiento` estático de creación.
   - Si la tarea no tiene `tipoRecurrencia` explícito (o es `Unica`/`Diaria`), `ocurreRotacionEn` en modo frecuencia calcula correctamente el intervalo desde el inicio.
3. **Cálculo de fechas efectivas y aplicabilidad por día en `taskUtils.ts`**:
   - Se añadió `taskAppliesOnDay(task, day, userId)` para determinar con precisión si una tarea (única, recurrente o rotativa) aplica y está asignada en una fecha específica a un usuario.
   - `dueDate(task, fromDate)` ahora calcula la fecha de vencimiento/asignación real más próxima para plantillas recurrentes y rotativas a partir de `fromDate` (hoy por defecto) en lugar de retornar la fecha de creación.
   - `formatDue(task, withTime, onDay)` permite formatear la fecha respecto al día seleccionado en la agenda o su próximo vencimiento real.
   - `sortTasks` ordena las tareas por su fecha real próxima.
   - `isDueToday(task, userId)` utiliza `taskAppliesOnDay` para evaluar si la tarea vence o está asignada hoy.
4. **Proyección dinámica de días y tareas en `SchedulePanel.tsx`**:
   - `dueDays` proyecta para el mes visible (calculando desde -30 hasta +60 días) los días en los que efectivamente hay tareas que aplican al usuario.
   - Se agregó `month` y `onMonthChange` al componente `Calendar` para recalcular dinámicamente al cambiar de mes.
   - Al seleccionar un día (`selectedDay`), filtra las tareas con `taskAppliesOnDay(t, selectedDay, currentUserId)` y formatea con `formatDue(task, true, selectedDay)`.
   - Cuando no hay día seleccionado, lista las tareas pendientes con su próximo vencimiento real.
5. **Ajuste en `TaskWorkspace.tsx` y `dashboard/page.tsx`**:
   - `TaskWorkspace` recibe `currentUserId` y lo propaga a `SchedulePanel` y a los filtros de tareas para "todo" y "today".
   - `myTasks` en `page.tsx` no trunca las tareas futuras en el servidor para que el panel de Agenda y el Calendario puedan proyectarlas en sus fechas reales.
6. **Tests y validación**:
   - Tests añadidos en `proyeccionCalendario.test.ts` para verificar que las plantillas base no generen eventos espurios en su fecha de creación.
   - Tests añadidos en `rotacionTarea.test.ts` para validar visibilidad dinámica de plantillas rotativas.
   - Nuevo archivo de tests `taskUtils.test.ts` para validar `dueDate`, `formatDue`, `isDueToday`, `taskAppliesOnDay` y `sortTasks`.
   - Toda la suite (611 tests) y `tsc --noEmit` pasando al 100%.

## Base de datos
No requiere cambios en el esquema de Postgres ni en Prisma.

## Archivos modificados
- `src/lib/proyeccionCalendario.ts`
- `src/lib/proyeccionCalendario.test.ts`
- `src/lib/rotacionTarea.ts`
- `src/lib/rotacionTarea.test.ts`
- `src/components/tasks/taskUtils.ts`
- `src/components/tasks/taskUtils.test.ts` (NUEVO)
- `src/components/tasks/SchedulePanel.tsx`
- `src/components/tasks/TaskWorkspace.tsx`
- `src/app/dashboard/page.tsx`
- `vault/LANE_252_AGENDA_FECHAS_VENCIMIENTO_ASIGNACION.md` (NUEVO)
