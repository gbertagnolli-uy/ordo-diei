---
lane: 263
titulo: Botón «Iniciar» duplicado en la tarea
plane: "#20"
estado: integrada
rama: task/lane-263-boton-iniciar-duplicado
agente: claude (orquestador) + agy
actualizado: 2026-11-07
---

# Lane 263 — Botón «Iniciar» duplicado en la tarea

## Especificación
Plane #20: «Botón duplicado de iniciar cronómetro en tarea» (sin descripción).

Causa verificada en el código (`src/components/tasks/TaskDetailPanel.tsx`): con la tarea **sin iniciar** se ven dos botones que hacen lo mismo (`actions.togglePlay`):
- en la tarjeta del cronómetro (línea ~175): «Iniciar»;
- en el pie del panel (línea ~215): «Iniciar tarea».

Resultado esperado: sin iniciar, **un solo** botón de inicio (el del pie, «Iniciar tarea», que va junto a «Marcar realizada (80%)»). Una vez iniciada, la tarjeta del cronómetro sigue mostrando «Pausar» / «Reanudar» (en el pie no hay botón de pausa, así que ese se queda).

## Decisiones
- D1 · Se conserva el botón del pie porque es el que está al lado de la alternativa del 80 % y es donde se decide cómo hacer la tarea.

## Arquitectura
Un cambio de render condicional en un componente. Sin servidor ni base.

## Archivos en alcance
- `src/components/tasks/TaskDetailPanel.tsx` (modificar)

## Microtareas

### M1 · Mostrar el botón de la tarjeta solo con la tarea iniciada [agy]
- [x] hecha (agy, 2026-11-07; diff verificado por el orquestador)

Archivos: `src/components/tasks/TaskDetailPanel.tsx`
Precondición: `grep -c 'actions.isPlaying ? "Pausar" : actions.fueIniciada ? "Reanudar" : "Iniciar"' src/components/tasks/TaskDetailPanel.tsx` → `1`. Si no: DETENERSE.
Pasos:
1. Reemplazar este bloque exacto (aparece una vez):
```tsx
                  <Button variant={actions.isPlaying ? "secondary" : "default"} onClick={actions.togglePlay}>
                    {actions.isPlaying ? <Pause /> : <Play />}
                    {actions.isPlaying ? "Pausar" : actions.fueIniciada ? "Reanudar" : "Iniciar"}
                  </Button>
```
por:
```tsx
                  {actions.fueIniciada && (
                    <Button variant={actions.isPlaying ? "secondary" : "default"} onClick={actions.togglePlay}>
                      {actions.isPlaying ? <Pause /> : <Play />}
                      {actions.isPlaying ? "Pausar" : "Reanudar"}
                    </Button>
                  )}
```
2. No tocar nada más del archivo.
Verificación: `grep -c '"Iniciar"' src/components/tasks/TaskDetailPanel.tsx` → `0`; `grep -c 'Iniciar tarea' src/components/tasks/TaskDetailPanel.tsx` → `1`; gates.

### M2 · Verificación visual [orquestador]
- [x] hecha (base local)

Abrir una tarea sin iniciar (base local, ver LANE_262 M0): un solo botón de inicio. Iniciarla: la tarjeta muestra «Pausar»; pausarla: «Reanudar».

## Criterios de aceptación
- Tarea sin iniciar: un único botón «Iniciar tarea».
- Tarea iniciada: «Pausar» en la tarjeta; pausada: «Reanudar»; pie con «Finalizar (100% pts)».

## Gates
`npx tsc --noEmit` · `npm test` · `npx eslint src/components/tasks/TaskDetailPanel.tsx`

## Pendientes
- Lane 264 (cronómetro con modal) modifica el mismo archivo: va después de esta.

## Hallazgos
- eslint: el error `no-explicit-any` de la línea 47 de TaskDetailPanel.tsx ya existía en dev (no lo introduce esta lane).

## Bitácora
- 2026-11-06 · claude (orquestador) · RESERVA · creada desde Plane #20, causa verificada en el código
- 2026-11-07 · claude (orquestador) · INICIO · worktree ordo-diei-lanes/lane-263, M1 delegada a agy
- 2026-11-07 · claude (orquestador) · avance · M1 hecha por agy (sin desvíos); gates: tsc 0, npm test 573/0/51, eslint sin errores nuevos; commit en la rama. Falta M2 (visual, base local) y push/PR (OK de Gabriel)
- 2026-11-07 · claude (orquestador) · avance · M2 en base local (puerto 3163, Playwright): sin iniciar → [Iniciar tarea, Marcar realizada (80%)] (un solo inicio); iniciada → [Pausar, Finalizar (100% pts)]; pausada → [Reanudar, Finalizar]. Falta push/PR
- 2026-11-07 · claude (orquestador) · INTEGRADA · PR #68 a `dev` (merge commit); dev → main en PR #84 (lo integra Gabriel)
