# Lane H1b — Alta de cursos y «Plan» del padre

> Lista para implementar. Depende de **H1a**. Tamaño **M**. Referencia visual: Roost `CalendarView`, pero **se extiende `src/components/tasks/MissionCalendar.tsx`** (ya usa `react-big-calendar`).

## Objetivo
Que el padre cree cursos y vea/ajuste el plan por alumno.

## Entregables
1. Ruta `/dashboard/homeschooling` (`page.tsx` servidor): si el usuario activo es Padre/Madre → `PlanPadre`; si es Hijo/Hija → (provisional) mensaje «Próximamente» hasta H2. Enlace «Estudio» en `AppSidebar` y `MainDock` (icono `GraduationCap`), visibles para todos.
2. `PlanPadre`: pestañas con avatares de alumnos; lista de materias con barra de progreso (`Progress`, `hechas/total`); botón **«Añadir curso»**.
3. **Asistente «Nuevo curso»** (`Dialog`/`Sheet` de 4 pasos con el patrón de `Stepper`): ① materia (existente o nueva: nombre, icono Lucide, color de tema, dificultad); ② recurso (título, tipo, unidad, cantidad, minutos por unidad, enlace opcional); ③ fechas y días de la semana (por defecto lun–vie, inicio hoy, fin 30/11 o el último día del año escolar elegido); ④ **vista previa** del reparto (`vistaPrevia`) con aviso de sobrecarga y sus 3 opciones → «Guardar».
4. **Calendario del plan:** `MissionCalendar` con eventos de `DiaLectivo` (color de la materia) y días no lectivos rayados en gris con «No lectivo: motivo». Arrastrar un evento llama a `moverDia`. Clic en un evento → `Sheet` con unidades, estado y botones *Omitir*/*Mover*.
5. **«Hoy no hay clase»:** botón con `Dialog` de confirmación (alumno o toda la familia, motivo) y **vista previa del cambio** antes de aplicar (`vistaPrevia` post-recálculo). Llama `marcarNoLectivo`.
6. Feriados: pantalla simple «Días sin clase» (lista + alta manual de fecha/motivo).
7. Al recalcular, eliminar las Tareas ligadas a días borrados **solo si siguen en `Pendiente`** (nunca tocar Tareas ya iniciadas/completadas).

## Reglas de UI (memoria `ui-work-rules`)
Solo componentes de `src/components/ui`; sin duplicar; no cambiar el comportamiento de lo existente; tokens del tema (nada de hex sueltos). Probar en móvil y escritorio.

## Aceptación
1. Crear «Historia, 300 páginas, 2026-03-02→2026-11-30, lun–vie» muestra la vista previa y guarda 300 unidades exactas.
2. «Hoy no hay clase» muestra el antes/después y mantiene la fecha de fin.
3. Arrastrar un día solo cambia ese día.
4. `npm test`, `tsc` y `eslint` de los archivos nuevos en verde; capturas de escritorio y móvil.
