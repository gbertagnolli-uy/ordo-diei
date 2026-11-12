# Lane 238 — Tareas compartidas rotativas y puntos por flujo Iniciar → Finalizar (100% vs 80%)

## Resumen
1. **Tareas compartidas con rotación de responsable**:
   - **Por frecuencia de variación**: permite elegir múltiples responsables (en orden configurable) y variar quién tiene asignada la tarea cada `N` **días**, **semanas** o **meses**.
   - **Por días de la semana para cada responsable**: permite asignar qué días de la semana (`L`, `M`, `X`, `J`, `V`, `S`, `D`) le corresponden a cada persona seleccionada.
   - **Asignación y visibilidad estricta**: la tarea se asigna únicamente al responsable correspondiente en el día correspondiente (`primeraAsignacionRotativa`, `generarTareasRecurrentes`), y el dashboard filtra con `esTareaVisibleParaUsuarioEnDia` para que **solo le aparezca a quien la tiene asignada en el día en que la tiene asignada**.
2. **Recompensa por ejecución con cronómetro (100%) vs solo marcar realizada (80%)**:
   - **Iniciar → Hacerla → Finalizar**: otorga el **100% de los puntos** (`porcentajeAplicado = 100`).
   - **Solo marcar como realizada (sin iniciar / fuera de horario)**: otorga el **80% de los puntos** (`porcentajeAplicado = 80`, `FACTOR_SOLO_REALIZADA = 0.8`).

## SQL aditivo para base de datos (sin `DROP`)
Para aplicar en producción si aún no se ejecutó:
```sql
ALTER TABLE "Tareas" ADD COLUMN IF NOT EXISTS "Rotacion_Config" JSONB;
```

## Archivos principales
- `prisma/schema.prisma`: campo `rotacionConfig Json? @map("Rotacion_Config")` en `Tarea`.
- `src/lib/rotacionTarea.ts` y `src/lib/rotacionTarea.test.ts`: motor puro de rotación por frecuencia (días/semanas/meses) y por días de la semana, resolución de primera fecha/responsable y filtro de visibilidad estricta.
- `src/lib/recompensaTarea.ts` y `src/lib/recompensaTarea.test.ts`: función `calcularPuntosCompletadoTarea` (100% iniciada y finalizada vs 80% solo marcada realizada / fuera de horario).
- `src/lib/generarRecurrentes.ts` y `src/lib/generarRecurrentes.test.ts`: rotación diaria de instancias y cierre de turnos vencidos.
- `src/app/api/tasks/route.ts`, `src/app/api/tasks/[id]/route.ts`, `src/app/api/tasks/[id]/complete/route.ts`: soporte de `rotacionConfig` y cálculo 100%/80%.
- `src/app/dashboard/page.tsx`: materialización al cargar el dashboard, filtro `esTareaVisibleParaUsuarioEnDia` y co-responsables de rotación.
- `src/components/dashboard/TaskForm.tsx`, `src/components/tasks/TaskDetailPanel.tsx`, `src/components/tasks/useTaskActions.ts`, `src/components/tasks/TaskTable.tsx`, `src/components/tasks/TaskBoard.tsx`, `src/components/dashboard/ModalManager.tsx`: interfaz de configuración de rotación y flujo Iniciar → Finalizar (100%) vs Marcar realizada (80%).
