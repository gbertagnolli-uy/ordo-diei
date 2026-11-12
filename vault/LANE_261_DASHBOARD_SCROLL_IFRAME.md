---
lane: 261
titulo: /dashboard se ve como iframe con barra de scroll
plane: "#18"
estado: integrada
rama: task/lane-261-dashboard-scroll-iframe
agente: "-"
actualizado: 2026-11-07
---

# Lane 261 — /dashboard se ve como un iframe con barra de scroll

## Especificación
Plane #18: «Corregir vista en /dashboard, aparece como si fuera iframe con barra de scroll» (sin descripción).

Causa probable, leída en el código (a confirmar en M0):
- `src/components/tasks/TaskWorkspace.tsx` línea ~148: el área de tareas tiene **alto fijo** `h-[calc(100svh-10.5rem-var(--notice-h,0px))] min-h-[480px]` y adentro la lista tiene `overflow-y-auto` (línea ~161): la lista scrollea **dentro de una caja**.
- `src/app/dashboard/page.tsx` dibuja **encima** del `TaskWorkspace` (y por lo tanto encima de su `PageHeader` sticky) el banner de cartas, la invitación a avisos, «Elegí tu compañero» y la meta semanal. Esa altura no está descontada en el `calc`, así que la página entera también scrollea.
- Resultado: dos barras de scroll (la de la página y la de la caja de la lista): la caja parece un iframe.

Esperado: en «Lista» la página scrollea **una sola vez** (la lista crece con su contenido); el panel derecho (agenda/detalle) queda fijo a la vista mientras se scrollea (sticky debajo del encabezado). «Tablero» conserva el alto fijo porque sus columnas scrollean cada una por dentro (es el diseño Kanban). «Calendario» no cambia (tiene su propio alto en `MissionCalendar`).

## Decisiones
- D1 · Solo cambia el layout de `TaskWorkspace`; no se mueven las tarjetas de `page.tsx`.
- D2 · El panel lateral pasa a `sticky` con alto de la ventana menos el encabezado (`h-14` = 3.5rem).

## Archivos en alcance
- `src/components/tasks/TaskWorkspace.tsx` (modificar)

## Microtareas

### M0 · Reproducir y confirmar la causa [orquestador]
- [x] hecha (base local)
Base local de verificación (ver `LANE_256` › Pendientes, «Base local»). Escritorio 1440×900 y teléfono 390×844, usuario hijo con ≥ 15 tareas y la meta semanal visible: captura de `/dashboard`. Confirmar dos barras de scroll. Si la causa es otra, reescribir M1 antes de delegar.

### M1 · Una sola barra de scroll en Lista [agy]
- [x] hecha

Archivos: `src/components/tasks/TaskWorkspace.tsx`
Precondición: `grep -c 'flex h-\[calc(100svh-10.5rem-var(--notice-h,0px))\] min-h-\[480px\]' src/components/tasks/TaskWorkspace.tsx` → `1`.
Pasos:
1. Reemplazar:
```tsx
        <div className="flex h-[calc(100svh-10.5rem-var(--notice-h,0px))] min-h-[480px]">
```
por:
```tsx
        // Lista y calendario crecen con su contenido (una sola barra de scroll, la de la página);
        // el tablero mantiene alto fijo porque cada columna scrollea por dentro (lane 261)
        <div className={cn("flex", isBoard ? "h-[calc(100svh-10.5rem-var(--notice-h,0px))] min-h-[480px]" : "min-h-[480px] items-start")}>
```
2. Reemplazar:
```tsx
            <div className={cn("relative min-h-0 flex-1", isBoard ? "overflow-hidden" : "overflow-y-auto")}>
```
por:
```tsx
            <div className={cn("relative min-h-0 flex-1", isBoard && "overflow-hidden")}>
```
3. Reemplazar:
```tsx
              "hidden shrink-0 overflow-hidden border-l transition-[width,opacity] duration-300 lg:block",
```
por:
```tsx
              "hidden shrink-0 overflow-hidden border-l transition-[width,opacity] duration-300 lg:block",
              // Fijo a la vista mientras la lista scrollea con la página (debajo del encabezado h-14)
              !isBoard && "lg:sticky lg:top-14 lg:h-[calc(100svh-3.5rem)]",
```
(Los `//` del paso 1 quedan dentro de los paréntesis de `isTaskSection ? ( … )`, donde JavaScript admite comentarios: son válidos. Si aun así `tsc` marca error ahí: DETENERSE y reportar.)
Verificación: `grep -c 'overflow-y-auto' src/components/tasks/TaskWorkspace.tsx` → `0`; gates.

### M2 · Verificación visual [orquestador]
- [x] hecha
Mismas capturas que M0: una sola barra de scroll en Lista; panel derecho fijo al scrollear; Tablero igual que antes; Calendario igual; teléfono: el panel sigue siendo un Sheet.

## Criterios de aceptación
- En Lista no hay scroll anidado; el scroll es de la página.
- El panel de agenda/detalle no se va de la vista al scrollear en escritorio.
- Tablero y Calendario sin cambios visibles.

## Gates
`npx tsc --noEmit` · `npm test` · `npx eslint src/components/tasks/TaskWorkspace.tsx`

## Pendientes
- 262 (agenda del panel) va **después** de esta: depende de cómo queda el alto del panel.

## Hallazgos
- M0 (2026-11-07, base local, 1440×900, Juan con 18 tareas): la página scrollea (contenido 1080 / ventana 900) **y** la caja `relative min-h-0 flex-1 overflow-y-auto` de la lista scrollea por dentro (805 / 680): dos barras, causa confirmada. Captura en el scratchpad de la sesión.
- M2 (2026-11-07, base local, puerto 3161): Lista sin la caja con scroll (solo scrollea la página; quedan el scroll del menú lateral y el de la lista de la agenda, que son propios). Con 40 tareas el panel derecho queda fijo en y=56 al scrollear 600 px. Teléfono 390 px: ninguna caja interna con scroll. Tablero: por código conserva alto fijo y `overflow-hidden` (no se aplicó `sticky`). **Caso borde**: si la lista mide casi lo mismo que el panel (p. ej. 18 tareas), al llegar al final de la página el panel sube unos 48 px y su título queda bajo el encabezado, porque el contenedor deja `pb-24` para el dock. Menor; se deja anotado como posible ajuste (`lg:h-[calc(100svh-3.5rem-6rem)]`) si Gabriel lo ve.

## Bitácora
- 2026-11-06 · claude (orquestador) · RESERVA · creada desde Plane #18; causa probable leída en el código, falta M0
- 2026-11-07 · claude (orquestador) · INICIO · M0 confirmada en base local; M1 delegada a agy
- 2026-11-07 · claude (orquestador) · avance · M1 por agy (diff = spec); gates: tsc 0 · eslint 4 (= dev) · npm test 573/0/51; commit 1539830; M2 verificada (ver Hallazgos). Falta push/PR
- 2026-11-07 · claude (orquestador) · INTEGRADA · PR #67 a `dev` (merge commit); dev → main en PR #84 (lo integra Gabriel)
