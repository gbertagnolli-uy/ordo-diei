---
lane: 262
titulo: Reparar la vista de agenda del panel de tareas
plane: "#19"
estado: integrada
rama: task/lane-262-agenda-panel-tareas
agente: "claude (orquestador) + agy"
actualizado: 2026-11-07
---

# Lane 262 — Reparar la vista de agenda del panel de tareas

## Especificación
Plane #19: «Reparar vista de agenda en panel de tareas» (sin descripción, sin comentarios ni adjuntos en Plane).

«Agenda» es el panel derecho de `/dashboard` (`src/components/tasks/SchedulePanel.tsx`): calendario del mes con un punto en los días con tareas + lista de pendientes o del día elegido. Se abre/cierra con el botón «Agenda» del encabezado (`TaskWorkspace.tsx`) y en el teléfono es un `Sheet`.

Como Plane no dice qué está roto, **esta lane empieza por el diagnóstico** (M0) y queda `bloqueada` hasta tenerlo. No se delega nada a agy antes.

Defectos candidatos encontrados leyendo el código (a confirmar o descartar en M0):
1. **Alto**: el panel vive dentro del contenedor de alto fijo de `TaskWorkspace`; el calendario ocupa ~330 px y la lista (`ScrollArea flex-1 min-h-0`) queda con muy poco alto en pantallas bajas. La lane 261 cambia ese contenedor: hay que revisar el panel **después** de 261.
2. **Lista «Pendientes»** (sin día elegido): `tasks.filter(isActionable)` incluye las **plantillas** de tareas recurrentes y rotativas (las que no tienen `parentTaskId` ni `generadaPorCron`), que también están en `myTasks`: pueden aparecer duplicadas junto a su instancia de hoy y con la fecha de creación de la regla.
3. **Fecha mostrada** con día elegido: `formatDue(task, true, selectedDay)` para una plantilla recurrente.
4. **Celdas**: `[--cell-size:--spacing(9)]` dentro de un panel de `w-80` (320 px); verificar que no recorte el sábado/domingo ni la flecha del mes.
5. **Teléfono**: en el `Sheet` (`w-full sm:max-w-sm`) el calendario y la lista deben verse completos.

## Decisiones
- D1 · Diagnóstico antes de código: Plane no trae descripción (regla «evidence only»).
- D2 · Va después de 261 (mismo contenedor).
- D3 · (orquestador, 2026-11-07) D2 vale solo para el candidato 1 (alto), que depende del contenedor de `TaskWorkspace.tsx` que cambia la 261. Los candidatos 2 y 3 están dentro de `SchedulePanel.tsx`, que ninguna rama abierta toca: se corrigen ya.
- D4 · (orquestador) La 268 (abierta) modifica `taskUtils.ts`. Por D-BP5 esta lane **no** lo toca: las funciones nuevas van en un archivo nuevo `src/components/tasks/agendaUtils.ts` con su test. Unificar la condición repetida de `taskAppliesOnDay`/`dueDate` con `esPlantillaBase` queda para después de que la 268 entre a dev.
- D5 · (orquestador) Qué muestra la Agenda. «Pendientes» (sin día): solo tareas accionables que **no** son plantillas de recurrentes/rotativas (la plantilla no se hace; se hace su instancia del día). Día elegido: si ese día ya existe la instancia de una plantilla (`parentTaskId` = id de la plantilla), se muestra solo la instancia; si no existe (días futuros), se muestra la plantilla con la etiqueta **«Programada»** en lugar del estado guardado de la plantilla (que es el de la última vez, p. ej. «No realizada»).

## Archivos en alcance (confirmados en M0, D4)
- `src/components/tasks/agendaUtils.ts` (nuevo)
- `src/components/tasks/agendaUtils.test.ts` (nuevo)
- `src/components/tasks/SchedulePanel.tsx` (modificar)

## Microtareas

### M0 · Diagnóstico [orquestador]
- [x] hecha (2026-11-07, ver Hallazgos)
Con 261 ya integrada y la base local de verificación (ver `LANE_256` › Pendientes): usuario hijo con tareas únicas, recurrentes diarias y una rotativa. Capturas del panel en 1440×900, 1280×720 y en el Sheet a 390×844: (a) sin día elegido, (b) eligiendo hoy, (c) eligiendo un día con rotativa, (d) cambiando de mes. Anotar en `## Hallazgos` qué candidatos (1–5) se confirman, con captura, y si aparece algo más. **Preguntar a Gabriel** qué vio él si ninguno coincide.

### M1 · Funciones de la Agenda [agy]
- [x] hecha (`8867d95`, agy, idéntica al ensayo)
Precondición: `src/components/tasks/agendaUtils.ts` no existe.
Crear `src/components/tasks/agendaUtils.ts` con **exactamente** este contenido (D4, D5):
```ts
// Qué tareas muestra el panel Agenda (lane 262, Plane #19).
import { isActionable, statusInfo, taskAppliesOnDay } from "./taskUtils.ts";

/** Lo mínimo que estas funciones leen de una tarea. */
export type TareaAgenda = {
  id: number;
  tipoRecurrencia?: string | null;
  rotacionConfig?: unknown;
  parentTaskId?: number | null;
  generadaPorCron?: boolean | null;
};

/** Plantilla de una tarea recurrente o rotativa: la regla, no la tarea de un día concreto. */
export function esPlantillaBase(task: TareaAgenda): boolean {
  return (
    ((Boolean(task.tipoRecurrencia) && task.tipoRecurrencia !== "Unica") || Boolean(task.rotacionConfig)) &&
    !task.parentTaskId &&
    !task.generadaPorCron
  );
}

/**
 * Lista de la Agenda.
 * - Sin día: las tareas accionables, sin plantillas (se hace la instancia del día, no la regla).
 * - Con día: las que aplican ese día; si la instancia de una plantilla ya existe ese día, la plantilla se oculta.
 */
export function tareasDeAgenda<T extends TareaAgenda>(tasks: T[], dia: Date | undefined, userId?: number): T[] {
  if (!dia) return tasks.filter((t) => isActionable(t) && !esPlantillaBase(t));
  const delDia = tasks.filter((t) => taskAppliesOnDay(t, dia, userId));
  const conInstancia = new Set(delDia.filter((t) => t.parentTaskId).map((t) => Number(t.parentTaskId)));
  return delDia.filter((t) => !(esPlantillaBase(t) && conInstancia.has(Number(t.id))));
}

/** Estado que muestra la Agenda: una plantilla figura «Programada», no con el estado de su última vez. */
export function estadoEnAgenda(task: TareaAgenda): { label: string; color: string } {
  if (esPlantillaBase(task)) return { label: "Programada", color: "var(--on-surface-variant)" };
  return statusInfo(task);
}
```
Verificación: `npx tsc --noEmit`.

### M2 · Test de las funciones [agy]
- [x] hecha (`8867d95`, agy, idéntica al ensayo)
Precondición: `src/components/tasks/agendaUtils.test.ts` no existe.
Crear `src/components/tasks/agendaUtils.test.ts` con **exactamente** este contenido:
```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { esPlantillaBase, estadoEnAgenda, tareasDeAgenda } from "./agendaUtils.ts";

// Sábado 7 de noviembre de 2026, 10:00
const hoy = new Date(2026, 10, 7, 10, 0, 0);
const plantilla = {
  id: 22,
  titulo: "Rezar el Ángelus",
  asignadoId: 3,
  tipoRecurrencia: "Diaria",
  estado: "No_Realizada",
  fechaVencimiento: new Date(2026, 10, 2, 12, 0, 0),
  horaEjecucion: new Date(2026, 10, 2, 12, 0, 0),
};
const instancia = {
  id: 28,
  titulo: "Rezar el Ángelus",
  asignadoId: 3,
  tipoRecurrencia: "Unica",
  estado: "Pendiente",
  parentTaskId: 22,
  generadaPorCron: true,
  fechaVencimiento: new Date(2026, 10, 7, 12, 0, 0),
  horaEjecucion: new Date(2026, 10, 7, 12, 0, 0),
};
const unica = {
  id: 5,
  titulo: "Ordenar el cuarto",
  asignadoId: 3,
  tipoRecurrencia: "Unica",
  estado: "Pendiente",
  fechaVencimiento: new Date(2026, 10, 7, 18, 0, 0),
  horaEjecucion: new Date(2026, 10, 7, 18, 0, 0),
};
const tareas = [plantilla, instancia, unica];

test("esPlantillaBase distingue la regla de sus instancias", () => {
  assert.equal(esPlantillaBase(plantilla), true);
  assert.equal(esPlantillaBase(instancia), false);
  assert.equal(esPlantillaBase(unica), false);
  assert.equal(esPlantillaBase({ id: 9, tipoRecurrencia: "Unica", rotacionConfig: { modo: "x" } }), true);
});

test("Pendientes (sin día) no muestra plantillas", () => {
  const ids = tareasDeAgenda(tareas, undefined, 3).map((t) => t.id).sort((a, b) => a - b);
  assert.deepEqual(ids, [5, 28]);
});

test("el día con instancia muestra la instancia y oculta la plantilla", () => {
  const ids = tareasDeAgenda(tareas, hoy, 3).map((t) => t.id).sort((a, b) => a - b);
  assert.deepEqual(ids, [5, 28]);
});

test("un día futuro sin instancia muestra la plantilla «Programada»", () => {
  const dia10 = new Date(2026, 10, 10);
  const lista = tareasDeAgenda(tareas, dia10, 3);
  assert.deepEqual(lista.map((t) => t.id), [22]);
  assert.equal(estadoEnAgenda(lista[0]).label, "Programada");
  assert.equal(estadoEnAgenda(unica).label, "Pendiente");
});
```
Verificación: `node --test --disable-warning=MODULE_TYPELESS_PACKAGE_JSON src/components/tasks/agendaUtils.test.ts` → 4 pass, 0 fail.

### M3 · El panel usa las funciones [agy]
- [x] hecha (`8867d95`, agy, idéntica al ensayo)
Archivo: `src/components/tasks/SchedulePanel.tsx`. Tres reemplazos exactos; ninguna otra línea cambia.
1. La línea
```tsx
import { dueDate, formatDue, isActionable, sortTasks, statusInfo, taskAppliesOnDay } from "./taskUtils";
```
pasa a ser estas dos:
```tsx
import { formatDue, sortTasks, taskAppliesOnDay } from "./taskUtils";
import { estadoEnAgenda, tareasDeAgenda } from "./agendaUtils";
```
2. Las tres líneas
```tsx
  const list = selectedDay
    ? sortTasks(tasks.filter((t) => taskAppliesOnDay(t, selectedDay, currentUserId)), null)
    : sortTasks(tasks.filter(isActionable), null);
```
pasan a ser esta:
```tsx
  const list = sortTasks(tareasDeAgenda(tasks, selectedDay, currentUserId), null);
```
3. La línea `            const status = statusInfo(task);` pasa a ser `            const status = estadoEnAgenda(task);`
Verificación: `npx tsc --noEmit`; `npx eslint src/components/tasks/SchedulePanel.tsx` → solo los 2 `no-explicit-any` de las props que ya tiene dev.

### M4 · Prueba en navegador [orquestador]
- [x] hecha (orquestador: 1440/1280/390 sin duplicados, día 10 «Programada», sin errores de consola; tsc 0, tests 628/577/0/51, eslint solo los 2 `any` previos de dev)
`verif-db/i262diag.mjs <puerto> cap262` con Juan: en «Pendientes» y en el día de hoy «P273 Rezar el Ángelus» aparece una sola vez («Pendiente»); en el día 10 figura «Programada»; ningún candidato 4/5 reaparece; sin errores de consola en 1440, 1280 y 390.

## Criterios de aceptación
- «Pendientes» sin plantillas; día elegido sin plantilla duplicada de su instancia; plantilla de día futuro «Programada» (D5).
- Calendario y lista completos en 1440, 1280 (salvo el alto, candidato 1, después de la 261) y 390.
- tsc 0, `npm test` sin fallas, eslint sin errores nuevos.

## Gates
`npx tsc --noEmit` · `npm test` · `npx eslint <archivos tocados>`

## Pendientes
- Candidato 1 (alto de la lista) después de la 261.
- Unificar `esPlantillaBase` dentro de `taskUtils.ts` después de la 268 (D4).

## Hallazgos
- M0 (2026-11-07, base local, puerto 3162, Juan; `verif-db/i262diag.mjs`, capturas `verif-db/cap262/`):
  - Candidato 1 **confirmado**: alto de la lista 212 px en 1440×900 y **32 px** en 1280×720 (el calendario ocupa 393 px). Espera a la 261 (D2/D3).
  - Candidato 2 **confirmado**: «Pendientes» muestra «P273 Rezar el Ángelus · No realizada» (plantilla diaria) junto a «P273 Rezar el Ángelus · Pendiente» (su instancia de hoy), y «P273 Sacar la basura (rotativa) 9 nov · No realizada» (plantilla rotativa).
  - Candidato 3 **confirmado** (variante): al elegir hoy aparece el mismo duplicado; al elegir el 10 la plantilla figura «No realizada» para un día que todavía no llegó.
  - Candidato 4 **descartado**: 0 elementos fuera del panel; tabla 296/296 px.
  - Candidato 5 **descartado**: en el Sheet a 390×844 la lista tiene 386 px y la tabla 268/268 px.
  - Cambio de mes: «diciembre 2026», sin errores de consola en las tres medidas.

## Bitácora
- 2026-11-06 · claude (orquestador) · RESERVA · creada desde Plane #19; sin descripción en Plane → arranca con diagnóstico
- 2026-11-07 · claude (orquestador) · M0 hecho: confirma candidatos 1, 2 y 3; descarta 4 y 5. Decisiones D3–D5. Lane creada desde dev `ddd9692`.
- 2026-11-07 · claude (orquestador) + agy · M1–M3 por agy idénticas al ensayo, M4 OK. Commit `8867d95`. Queda: candidato 1 (alto) después de la 261; unificar `esPlantillaBase` en `taskUtils.ts` después de la 268; PR con OK de Gabriel.
- 2026-11-07 · claude (orquestador) · ENTREGA · PR #60 a dev (`scripts/abrir-pr.sh`: origin/dev incluido, tests + tsc verdes) con OK de Gabriel. Lo integra Gabriel; después `scripts/limpiar-lane.sh 262`.
- 2026-11-07 · claude (orquestador) · INTEGRADA · PR #60 a `dev` (merge commit); dev → main en PR #84 (lo integra Gabriel)
