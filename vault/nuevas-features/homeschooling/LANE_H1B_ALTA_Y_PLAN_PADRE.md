# Lane H1b — El padre arma materias, cursos y plan (portado de Roost)

> Lista para implementar. Depende de **HS0** y **H1a**. Tamaño **L**. Leer antes: [`PLAN_INTEGRACION_ROOST.md`](PLAN_INTEGRACION_ROOST.md) §2–§3 y [`ARQUITECTURA_DETALLADA.md`](ARQUITECTURA_DETALLADA.md) §4, §6.
> Número: el siguiente libre al crearla. Rama sugerida `task/lane-NN-hs-plan-padre`.

## Objetivo
Que el padre cree materias, cursos (recursos) y lecciones, asigne un plan a cada hijo y lo vea/ajuste en un calendario.

## Datos (services partidos, misma firma que Roost)
1. Cliente `src/lib/homeschooling/roost/services/module.ts` con las funciones de `vendor/roost/src/services/module.ts`: `getModulesWithProgress(groupId, userId)`, `getModuleById`, `createModule`, `updateModule`, `deleteModule`, `reorderModules`, `getModuleRecordings(moduleId, userId?)`, `getAdjacentRecordings`, `getRecordingById`. Mismos nombres, parámetros y tipos de retorno (de `roost/tipos.ts`); el cuerpo hace `fetch` y, si la respuesta no es `ok`, lanza `new Error(json.error)`.
2. Cliente `src/lib/homeschooling/roost/services/group.ts`: `hasPermission` (de `services/group.ts:599`, con `admin` = Padre/Madre y `member` = Hijo/Hija), `createRecording`, `updateRecording`, `deleteRecording` (de L699-750).
3. Servidor `src/lib/homeschooling/servidor/cursos.ts` (Prisma) + `src/lib/homeschooling/roost/dto.ts`: traducir `mapModule`, `mapRecording`, `mapLessonCompletion` de `vendor/roost/src/db/adapters/mongodb/index.ts:472-515` a los modelos de ARQ §3 (DTO con nombres de Roost: `display_order`, `video_platform`, `is_completed`, `progress_percentage`; ids `number`). `progress_percentage` de un recurso = unidades de días `hecha`/`omitida` del plan del alumno pedido ÷ `totalUnidades` (para el padre, el alumno elegido en las pestañas).
4. **Una sola consulta** para la vista de materia: `GET /api/homeschooling/materias/[id]/cursos?alumnoId=&incluir=lecciones` devuelve recursos con sus lecciones; el cliente arma con eso lo que Roost pedía en N llamadas (`LearnGroupLayout.tsx:79-83`). Se agrega `getModulesWithRecordings(groupId, userId)` al shim y `MateriaLayout` la usa en lugar del bucle.
5. `reorderModules` y el orden de lecciones: en una transacción, primero `orden = -orden` y después `1..N` (por el `@@unique([recursoId, orden])`). Agregar/borrar lecciones mantiene `orden` sin huecos y aplica ARQ §4 regla 8 (actualiza `totalUnidades` y recalcula los planes activos; 409 si la lección está cubierta por un día hecho/omitido).
6. Rutas en `src/app/api/homeschooling/{materias,cursos,lecciones}/…` con `conSesion`; escribir requiere `soloPadres: true`. Un Hijo solo lee materias/cursos que tengan un plan suyo.

## UI (origen → destino)
| Roost | Ordo | Cambios |
|---|---|---|
| `components/groups/CreateGroupModal.tsx` | `components/homeschooling/cursos/MateriaForm.tsx` | Solo nombre, descripción, portada (`subirImagen`), ícono Lucide, color de tema y dificultad. Sin slug, privacidad, premium ni layout. `Dialog` de `ui/` |
| `groups/learn/LearnGroupLayout.tsx` | `cursos/MateriaLayout.tsx` | Modo padre; usa `getModulesWithRecordings`; sin `CommentSection` ni `UploadAssetsModal`; `confirm()`/`alert()` → `Dialog`/`toast` |
| `groups/learn/CompactGroupHeader.tsx` | `cursos/MateriaHeader.tsx` | Pestañas con avatares de alumnos (elige de quién se ve el progreso) |
| `groups/learn/ModuleGrid.tsx` + `ModuleCard.tsx` | `cursos/CursoGrid.tsx` + `CursoCard.tsx` | Estado vacío con `Empty`; progreso con `Progress` de `ui/` (no se porta `ProgressBar`) |
| `groups/learn/ModuleDetail.tsx` | `cursos/CursoDetalle.tsx` | Sin pestaña de assets; muestra el plan de cada hijo (fechas, avance) y el botón «Asignar a…» |
| `groups/learn/ManageModuleModal.tsx` | paso «Recurso» del asistente | Campos de Roost + `tipo`, `unidadTipo`, `totalUnidades` (bloqueado = cantidad de lecciones si es curso de video/enlaces), `minutosPorUnidad`, `url`, `navegacionLibre`. `uploadImage` → `subirImagen` |
| `groups/AddRecordingModal.tsx` | `cursos/LeccionForm.tsx` | Parseo con `parsearEnlaceVideo` (HS0); vista previa con `urlEmbed`; URL opcional (lección de texto/PDF por enlace) |
| `pages/Calendar.tsx` + `CalendarView` (HS0) | `plan/PlanCalendario.tsx` | Eventos = `DiaLectivo` del alumno (color de la materia; `movida`/`omitida` atenuados), días no lectivos rayados; arrastrar → `PATCH dias/[id]` mover (solo `draggableAccessor` = pendiente sin Tarea iniciada); clic → `Sheet` con unidades, estado y *Omitir*/*Mover* |

- **Asistente «Nuevo curso»** con el `Stepper` de Ordo (`src/components/Stepper.tsx`): ① materia (elegir o `MateriaForm`) ② recurso (campos de arriba; si es curso de video, después de guardar se cargan lecciones con `LeccionForm`) ③ alumnos, fechas y días (lun–vie por defecto; inicio hoy) ④ vista previa por alumno (`vistaPrevia`) con aviso de sobrecarga y sus 3 opciones → «Guardar» (`crearPlan` por alumno).
- **«Hoy no hay clase»**: `Dialog` (alumno o toda la familia, motivo) con **antes/después** de `vistaPrevia` → `POST no-lectivos`.
- **Días sin clase** (`/dashboard/homeschooling/dias-sin-clase`): lista + alta manual (fecha, motivo, alumnos).
- **Páginas** (servidor, `params` como `Promise`): `src/app/dashboard/homeschooling/page.tsx` (Padre/Madre → lista de materias con `MateriaLayout`; Hijo/Hija → «Próximamente» hasta H2), `materias/[id]/page.tsx` (con `?module=&lesson=` como Roost), `plan/page.tsx`, `dias-sin-clase/page.tsx`. Cada página envuelve con el `AuthProvider` de HS0.
- **Navegación:** enlace «Estudio» (`GraduationCap`) en `src/components/app/AppSidebar.tsx`, visible para todos. **No** se agrega al `MainDock` (regla de no duplicar).

## Tests
- Permisos de `servidor/cursos.ts`: un Hijo no crea/edita/borra; solo lee materias con plan suyo.
- `dto.ts`: forma Roost (`display_order`, `is_completed`, `progress_percentage`).
- Reordenar lecciones 1↔3 sin violar el `@@unique`; borrar una lección cubierta por día hecho → 409.
- `hasPermission` con los roles mapeados.
- `guarda.test.ts` de HS0 sigue verde.

## Aceptación
1. Crear «Historia, 300 páginas, 2026-03-02→2026-11-30, lun–vie» para un hijo muestra la vista previa y guarda 300 unidades exactas.
2. Un curso de video con 10 lecciones cargadas por URL de YouTube/Vimeo muestra miniaturas y se asigna a dos hijos con planes distintos.
3. «Hoy no hay clase» muestra el antes/después y mantiene la fecha de fin.
4. Arrastrar un día solo cambia ese día y no permite pasarlo por encima del siguiente.
5. `MissionCalendar` y `/dashboard/tasks` sin cambios. `npm test`, `tsc`, eslint en verde; capturas de escritorio y móvil.
