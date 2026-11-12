# Lane HS-SEG — Solo el asignado (o un padre) completa una tarea

> Lista para implementar. Sin dependencias; **debe integrarse antes de H2**. Tamaño **S**. Pedida por el usuario (DECISIONES D30, pregunta P5 del plan).
> Número: el siguiente libre al crearla. Rama sugerida `task/lane-NN-completar-solo-asignado`.

## Problema (verificado)
`POST /api/tasks/[id]/complete` exige sesión pero **no** comprueba que quien completa sea el asignado (`src/app/api/tasks/[id]/complete/route.ts:11-30`). Cualquier miembro con sesión puede completar la tarea de otro y dejarle puntos bloqueados. Con Homeschooling, un hermano podría completar la lección del otro.

## Cambio
1. Función pura `puedeCompletarTarea(sesion: { id: number; rolFamiliar?: string }, tarea: { asignadoId: number }): boolean` en `src/lib/tareas/permisos.ts` (crear la carpeta): `true` si `sesion.id === tarea.asignadoId` o `esPadre(sesion.rolFamiliar)` (importar `esPadre` de `src/lib/habitos/permisos.ts`).
2. En `complete/route.ts`, justo después de cargar la tarea (L19-28) y antes del chequeo de estado: si no puede → `403 { error: "Solo quien tiene asignada la tarea (o un padre) puede completarla" }`. `session.user.id` se compara con `Number(...)`.
3. **Nada más cambia** en la ruta (puntos, racha, estados, respuesta).

## Antes de codear (obligatorio)
- Buscar todos los llamados a `/complete` (hoy: `src/components/tasks/useTaskActions.ts:63`) y las pantallas que los muestran (`TaskBoard`, vistas de padres). Confirmar que ninguna UI ofrece «completar» a un hermano; si alguna lo hace, ocultar el botón con la misma regla (sin cambiar nada más) y anotarlo en el registro de la lane.
- Revisar `timer`, `checklist`, `not-done` y `reject` de `src/app/api/tasks/[id]/`: **no se cambian** en esta lane; anotar en el registro si tienen el mismo hueco para que el usuario decida.

## Tests (`node:test`)
`src/lib/tareas/permisos.test.ts`: asignado → sí; Padre y Madre → sí; hermano (Hijo/Hija) → no; id como string `"5"` vs número `5` → sí.

## Aceptación
1. `npm test`, `tsc` y eslint en verde.
2. Prueba manual con dos hijos: el hermano recibe 403; el asignado y un padre completan como siempre.
