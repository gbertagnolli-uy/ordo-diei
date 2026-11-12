---
lane: 268
titulo: Tareas rechazadas vuelven como pendientes
plane: "#25"
estado: integrada
rama: task/lane-268-rechazadas-vuelven-pendientes
agente: claude (orquestador) + agy
actualizado: 2026-11-07
---

# Lane 268 — Las tareas rechazadas vuelven al usuario como pendientes

## Especificación
Plane #25: «Las tareas rechazadas deben ser restituidas al usuario, volver como tareas pendientes» (sin descripción).

Comportamiento actual (verificado en el código):
- `POST /api/tasks/[id]/reject` (`src/app/api/tasks/[id]/reject/route.ts`) deja la tarea en estado **`Rechazada`**, borra puntos y foto, pero **no** reinicia el cronómetro (`timerStartedAt`, `tiempoAcumuladoTimer`) ni el vencimiento.
- `Rechazada` no es un estado de trabajo para varias partes de la app:
  - la agenda (`src/components/agenda/agendaUtils.ts`) cuenta como pendientes solo `Pendiente` y `Vencida`;
  - en «Por hacer» (`TaskWorkspace.tsx`), una tarea rotativa rechazada solo aparece si le toca **hoy**;
  - como el cronómetro quedó con tiempo acumulado, la tarea vuelve «iniciada» y se puede finalizar al 100 % sin rehacerla;
  - si ya venció, queda en un limbo (el cron diario solo cierra `Pendiente`/`En_progreso`).

Esperado: al rechazar, la tarea vuelve al hijo **como una pendiente más**: estado `Pendiente`, cronómetro en cero, sin foto ni puntos, con la etiqueta «Rehacer» para que sepa por qué volvió, y con un vencimiento que le dé tiempo real de rehacerla.

## Decisiones
- D1 · Estado al rechazar: `Pendiente` (pedido literal). El historial registra dos pasos: `Esperando_Aprobacion → Rechazada` y `Rechazada → Pendiente`, así el rechazo queda auditado.
- D2 · Marca «Rehacer»: `retroalimentacionAlgoritmo = "Rechazada: rehacer"` (campo existente, sin cambio de esquema). `statusInfo` la muestra como «Rehacer».
- D3 · Vencimiento: si a la tarea le quedan menos de 2 horas (o ya venció), el nuevo vencimiento es **ahora + 24 h** y se borra `horaEjecucion` (si no, el cron diario la daría por no realizada esa misma noche). Si le quedan 2 horas o más, no se toca.
- D4 · El cronómetro se reinicia (`timerStartedAt = null`, `tiempoAcumuladoTimer = 0`): para el 100 % de puntos hay que volver a iniciarla.
- D5 · Las tareas que hoy ya están en `Rechazada` se pasan a `Pendiente` con un script de datos que corre **el orquestador** con el OK de Gabriel (M6). Nada de esto se hace desde las lanes.

## Arquitectura
- `src/lib/tareas/rechazo.ts` (nuevo, puro): constante `MARCA_RECHAZO` y `datosAlRechazar(tarea, ahora)` que arma el `data` del update.
- `src/lib/tareas/rechazo.test.ts` (nuevo).
- `reject/route.ts`: usa `datosAlRechazar`, estado final `Pendiente`, dos entradas de historial.
- `src/components/tasks/taskUtils.ts` (`statusInfo`): «Rehacer» si tiene la marca.
- `src/components/tasks/TaskBoard.tsx`: el cambio optimista al arrastrar de «En revisión» a «Por hacer» pasa a `Pendiente`.

## Archivos en alcance
- `src/lib/tareas/rechazo.ts` (crear)
- `src/lib/tareas/rechazo.test.ts` (crear)
- `src/app/api/tasks/[id]/reject/route.ts` (modificar)
- `src/components/tasks/taskUtils.ts` (modificar)
- `src/components/tasks/TaskBoard.tsx` (modificar)
- `scripts/rechazadas-a-pendientes.ts` (crear; lo corre solo el orquestador)

## Microtareas

### M1 · Lógica pura del rechazo [agy]
- [x] hecha

Archivos: `src/lib/tareas/rechazo.ts` (crear con este contenido exacto)
```ts
// Qué le pasa a una tarea cuando un padre la rechaza (lane 268, Plane #25): vuelve al hijo como pendiente,
// con el cronómetro en cero, sin foto ni puntos y con tiempo real para rehacerla.

/** Marca en `retroalimentacionAlgoritmo` para mostrar «Rehacer» */
export const MARCA_RECHAZO = "Rechazada: rehacer";

/** Margen mínimo para rehacer la tarea antes de que venza */
const MARGEN_MS = 2 * 60 * 60 * 1000;
const UN_DIA_MS = 24 * 60 * 60 * 1000;

export interface TareaARechazar {
  fechaVencimiento: Date | null;
  horaEjecucion: Date | null;
}

export function datosAlRechazar(tarea: TareaARechazar, ahora: Date) {
  const vence = tarea.horaEjecucion ?? tarea.fechaVencimiento;
  const sinTiempo = vence !== null && vence.getTime() - ahora.getTime() < MARGEN_MS;
  return {
    estado: "Pendiente" as const,
    puntosGenerados: 0,
    fechaCompletado: null,
    // Se pide una foto nueva si vuelve a completarse
    fotoPruebaUrl: null,
    fotoPruebaSubidaEn: null,
    // Para el 100 % de los puntos hay que volver a iniciarla
    timerStartedAt: null,
    tiempoAcumuladoTimer: 0,
    retroalimentacionAlgoritmo: MARCA_RECHAZO,
    ...(sinTiempo ? { fechaVencimiento: new Date(ahora.getTime() + UN_DIA_MS), horaEjecucion: null } : {}),
  };
}
```

### M2 · Tests [agy]
- [x] hecha

Archivos: `src/lib/tareas/rechazo.test.ts` (crear con este contenido exacto)
```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { datosAlRechazar, MARCA_RECHAZO } from "./rechazo.ts";

const ahora = new Date(2026, 10, 6, 15, 0, 0);
const horas = (h: number) => new Date(ahora.getTime() + h * 3600_000);

test("vuelve como pendiente, con el cronómetro en cero y la marca Rehacer", () => {
  const d = datosAlRechazar({ fechaVencimiento: horas(5), horaEjecucion: null }, ahora);
  assert.equal(d.estado, "Pendiente");
  assert.equal(d.timerStartedAt, null);
  assert.equal(d.tiempoAcumuladoTimer, 0);
  assert.equal(d.puntosGenerados, 0);
  assert.equal(d.fotoPruebaUrl, null);
  assert.equal(d.retroalimentacionAlgoritmo, MARCA_RECHAZO);
});

test("con 2 horas o más de margen no cambia el vencimiento", () => {
  const d = datosAlRechazar({ fechaVencimiento: horas(2), horaEjecucion: null }, ahora);
  assert.equal("fechaVencimiento" in d, false);
  assert.equal("horaEjecucion" in d, false);
});

test("vencida o con menos de 2 horas: vence en 24 horas y se borra la hora", () => {
  for (const vence of [horas(-30), horas(1)]) {
    const d = datosAlRechazar({ fechaVencimiento: null, horaEjecucion: vence }, ahora);
    assert.deepEqual(d.fechaVencimiento, horas(24));
    assert.equal(d.horaEjecucion, null);
  }
});

test("sin fecha no inventa un vencimiento", () => {
  const d = datosAlRechazar({ fechaVencimiento: null, horaEjecucion: null }, ahora);
  assert.equal("fechaVencimiento" in d, false);
});
```
Verificación: `node --test --disable-warning=MODULE_TYPELESS_PACKAGE_JSON src/lib/tareas/rechazo.test.ts` → 4 ok.

### M3 · El endpoint de rechazo devuelve la tarea como pendiente [agy]
- [x] hecha

Archivos: `src/app/api/tasks/[id]/reject/route.ts`
Precondición: `grep -c 'estado: "Rechazada",' "src/app/api/tasks/[id]/reject/route.ts"` → `1`.
Pasos:
1. Debajo de `import { limpiarFotoPruebaHuerfana } from "@/lib/tareas/fotoPruebaServidor";` agregar: `import { datosAlRechazar } from "@/lib/tareas/rechazo";`
2. Reemplazar:
```ts
      prisma.tarea.update({
        where: { id: taskId, estado: "Esperando_Aprobacion" },
        data: { 
          estado: "Rechazada",
          puntosGenerados: 0,
          fechaCompletado: null,
          // Se pide una foto nueva si vuelve a completarse
          fotoPruebaUrl: null,
          fotoPruebaSubidaEn: null,
        }
      }),
```
por:
```ts
      // Vuelve al hijo como pendiente (lane 268): cronómetro en cero, marca «Rehacer» y tiempo para rehacerla
      prisma.tarea.update({
        where: { id: taskId, estado: "Esperando_Aprobacion" },
        data: datosAlRechazar(task, new Date()),
      }),
```
3. Reemplazar:
```ts
      registrarAccion(prisma, { tareaId: taskId, actorId: user.id, estadoAnterior: "Esperando_Aprobacion", estadoNuevo: "Rechazada" })
    ]);
```
por:
```ts
      registrarAccion(prisma, { tareaId: taskId, actorId: user.id, estadoAnterior: "Esperando_Aprobacion", estadoNuevo: "Rechazada" }),
      registrarAccion(prisma, { tareaId: taskId, actorId: user.id, estadoAnterior: "Rechazada", estadoNuevo: "Pendiente" }),
    ]);
```
4. Reemplazar `mensaje: "Tarea rechazada. El usuario deberá re-hacerla."` por `mensaje: "Tarea rechazada: volvió a sus pendientes para rehacerla."`.
5. Reemplazar el comentario `// Recalcular porcentaje de éxito (bajará porque ahora hay una rechazada)` por `// Recalcular porcentaje de éxito (la tarea volvió a pendiente)`.
Verificación: `grep -c 'datosAlRechazar' "src/app/api/tasks/[id]/reject/route.ts"` → `2`; `npx tsc --noEmit`.

### M4 · Etiqueta «Rehacer» [agy]
- [x] hecha

Archivos: `src/components/tasks/taskUtils.ts`
Precondición: `grep -c 'if (g === "todo" && task.estado === "Rechazada") return { label: "Rehacer", color: "var(--error)" };' src/components/tasks/taskUtils.ts` → `1`.
Pasos:
1. Reemplazar:
```ts
  if (g === "todo" && isLate(task)) return { label: "Atrasada", color: "var(--error)" };
  if (g === "todo" && task.estado === "Rechazada") return { label: "Rehacer", color: "var(--error)" };
```
por:
```ts
  // Rechazada por un padre: volvió como pendiente con la marca de lib/tareas/rechazo.ts (lane 268)
  if (g === "todo" && (task.estado === "Rechazada" || task.retroalimentacionAlgoritmo === "Rechazada: rehacer")) {
    return { label: "Rehacer", color: "var(--error)" };
  }
  if (g === "todo" && isLate(task)) return { label: "Atrasada", color: "var(--error)" };
```
Verificación: `npm test` (incluye `taskUtils.test.ts`).

### M5 · Tablero: el arrastre optimista coincide con el servidor [agy]
- [x] hecha

Archivos: `src/components/tasks/TaskBoard.tsx`
Precondición: `grep -c 'case "todo": return { estado: task.estado === "Esperando_Aprobacion" ? "Rechazada" : "Pausada", timerStartedAt: null };' src/components/tasks/TaskBoard.tsx` → `1`.
Pasos:
1. Reemplazar esa línea exacta por:
```ts
    case "todo": return task.estado === "Esperando_Aprobacion"
      ? { estado: "Pendiente", timerStartedAt: null, tiempoAcumuladoTimer: 0, retroalimentacionAlgoritmo: "Rechazada: rehacer" }
      : { estado: "Pausada", timerStartedAt: null };
```
Si `npx tsc --noEmit` marca error de tipos en esa función (el tipo de retorno no admite las claves nuevas): DETENERSE y reportar el error textual.
Verificación: gates.

### M6 · Tareas que ya están en `Rechazada` [orquestador, requiere OK de Gabriel]
- [ ] hecha

1. Contar: `SELECT COUNT(*) FROM "Tareas" WHERE "Estado" = 'Rechazada';` (solo lectura).
2. Con el OK de Gabriel, crear `scripts/rechazadas-a-pendientes.ts` que, por cada tarea `Rechazada`, aplique `datosAlRechazar(tarea, new Date())` y registre `Rechazada → Pendiente` en el historial con `actorId` = el padre que la rechazó (último `HistorialAccion` con `estadoNuevo = Rechazada`). Correrlo una vez y anotar el resultado en `## Hallazgos`.

### M7 · Prueba manual [orquestador]
- [x] hecha (base local)
Base local: un hijo completa una tarea con cronómetro; el padre la rechaza; el hijo la ve en «Por hacer», «Para hoy» y en la agenda como «Rehacer», con el cronómetro en 00:00 y solo «Iniciar tarea» / «Marcar realizada (80%)». Repetir con una tarea vencida: queda vencible en 24 h.

## Criterios de aceptación
- Tras rechazar, `estado = Pendiente`, `tiempoAcumuladoTimer = 0`, `retroalimentacionAlgoritmo = "Rechazada: rehacer"`.
- El historial tiene las dos transiciones.
- La tarea aparece como pendiente en dashboard y agenda con la etiqueta «Rehacer».

## Gates
`npx tsc --noEmit` · `npm test` · `npx eslint src/lib/tareas/rechazo.ts src/lib/tareas/rechazo.test.ts "src/app/api/tasks/[id]/reject/route.ts" src/components/tasks/taskUtils.ts src/components/tasks/TaskBoard.tsx`

## Pendientes
- M6 espera el OK de Gabriel (escribe en producción).

## Hallazgos
- M7 (2026-11-07, base local, puerto 3168): padre rechaza la tarea 17 → `Pendiente`, marca `Rechazada: rehacer`, cronómetro 0, puntos 0, `Locked_Points` del hijo 10 → 0, historial `Esperando_Aprobacion→Rechazada` y `Rechazada→Pendiente`. El hijo la ve en «Para hoy» con etiqueta «Rehacer»; detalle con el contador entero (20:00 = estimado, sin tiempo consumido), «Iniciar tarea», «Marcar realizada (80%)» y «No realizada» (este último ya existía en `dev` para toda pendiente). Tarea vencida rechazada → vence a +24 h exactas y `Hora_Ejecucion` null.
- M6: la consulta de la spec dice `"Estado"`, pero la columna se llama `estado` (sin `@map`).
- M6 paso 1 (2026-11-07, solo lectura): **12** tareas en `Rechazada` en producción (esquema `family_tasker`). Esperan el OK de Gabriel para el paso 2.
- M6 (2026-11-07): `scripts/rechazadas-a-pendientes.ts` en `dev` (PR #83), dry-run por defecto. Dry-run contra producción: 12 tareas, las 12 con actor de rechazo (padre 1 o 2); con D3 todas pasarían a vencer +24 h (son instancias viejas: p. ej. Clara tiene 4 «Leer una lección del Catecismo»). **Sin ejecutar**: espera el OK de Gabriel. Comando: `npx tsx --env-file=.env.local scripts/rechazadas-a-pendientes.ts --aplicar`.

## Bitácora
- 2026-11-06 · claude (orquestador) · RESERVA · creada desde Plane #25, comportamiento actual verificado en el código
- 2026-11-07 · claude (orquestador) · INICIO · worktree creado, microtareas [agy] delegadas
- 2026-11-07 · claude (orquestador) · avance · M1–M5 hechas por agy, cada línea verificada contra la spec; gates: tsc 0 · eslint sin errores nuevos (22 preexistentes en TaskBoard/taskUtils) · npm test 577/0/51; commit 280e98e. Falta M6 (OK de Gabriel), M7 (prueba manual) y push/PR
- 2026-11-07 · claude (orquestador) · avance · M7 verificada en base local (ver Hallazgos). Falta M6 (OK de Gabriel) y push/PR
- 2026-11-07 · claude (orquestador) · INTEGRADA · PR #74, #83 a `dev` (merge commit); dev → main en PR #84 (lo integra Gabriel)
