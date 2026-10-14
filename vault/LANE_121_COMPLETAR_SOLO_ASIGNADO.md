# Lane 121 — HS-SEG: solo el asignado (o un padre) completa una tarea

Pedido: "Continua con lo siguiente" → spec `vault/nuevas-features/homeschooling/LANE_HSEG_COMPLETAR_SOLO_ASIGNADO.md` (respuesta P5 del usuario, D30).

## Hecho
- `src/lib/tareas/permisos.ts`: `puedeCompletarTarea(sesion, tarea)` (asignado o `esPadre`; el id de sesión se compara con `Number(...)`), con `permisos.test.ts` (4 tests).
- `src/app/api/tasks/[id]/complete/route.ts`: 403 `"Solo quien tiene asignada la tarea (o un padre) puede completarla"` justo después de cargar la tarea y antes del chequeo de estado. Nada más cambió en la ruta.

## Verificado antes de codear
- Único llamado a `/complete`: `src/components/tasks/useTaskActions.ts:63`. Un Hijo/Hija solo ve sus propias tareas (`src/app/dashboard/page.tsx:22` filtra por `asignadoId` salvo admin), así que ninguna UI ofrece «completar» a un hermano; no hubo que ocultar botones.
- Mismo hueco en otras rutas de `src/app/api/tasks/[id]/` (no se tocaron; el usuario decide): `timer`, `checklist` y `not-done` no comprueban asignado ni rol. `reject` sí exige padre.

## No verificado
- Prueba manual con dos hijos (hermano → 403): no se hizo; la regla está cubierta por los tests de la función pura.
