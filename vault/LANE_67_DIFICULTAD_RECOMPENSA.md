# Lane 67 — Dificultad y recompensa proporcional

Pedido (textual): "Quiero poder elegir diferentes tipos de tareas según su nivel de dificultad. Quiero que las recompensas estén definidas según la dificultad y el tiempo estimado. Si la tarea requiere poco tiempo de ejecución o es de dificultad fácil, debe dar menos recompensa que una tarea ardua, que requiere tiempo y esfuerzo para completar. Por ejemplo bañarse es simple comparado con hacer las oraciones de la mañana. Hacer el almuerzo es simple comparado con rezar el rosario completo. Si bien las oraciones creo que no dan recompensa, se entiende que hay cosas más difíciles que otras o que requieren más tiempo. Quiero diseñar un algoritmo para que basado en el tiempo requerido y el nivel de dificultad seteado por el creador de la tarea, defina una recompensa proporcional"

## Algoritmo (`src/lib/recompensaTarea.ts`)
`puntosBase = clamp(round(4 · √minutos · multiplicador), 5, 150)`

| Dificultad | Multiplicador | Ejemplo |
|---|---|---|
| Fácil | ×1 | Bañarse |
| Media (default) | ×1,5 | Preparar el almuerzo |
| Difícil | ×2,25 | Oraciones de la mañana |
| Ardua | ×3 | Rosario completo |

Por qué raíz cuadrada: el tiempo rinde con retornos decrecientes (4× tiempo = 2× puntos), así que inflar el tiempo estimado no es un atajo; la dificultad pesa más que el reloj. Cada escalón de dificultad ≈ +50 %.

| min | Fácil | Media | Difícil | Ardua |
|---|---|---|---|---|
| 5 | 9 | 13 | 20 | 27 |
| 15 | 15 | 23 | 35 | 46 |
| 30 | 22 | 33 | 49 | 66 |
| 60 | 31 | 46 | 70 | 93 |

Calibrado con el ritmo real (~20 pts por tarea). Antes: `max(10, minutos)`. Los bonos (racha, checklist, horario) y la regla de retraso (50 %) no cambian.

## Cambios
- `Tarea.dificultad` (enum `DificultadTarea`, default `Media`; las tareas viejas quedan en Media). SQL aplicado solo-aditivo (`CREATE TYPE` + `ADD COLUMN`).
- Selector en `TaskForm` con vista previa de los puntos; POST/PUT de tareas, copias al editar y el generador de recurrentes propagan la dificultad.
- `complete/route.ts` usa `puntosBase`. Tests en `recompensaTarea.test.ts`.

## Pendiente
Las constantes (4, multiplicadores, tope 150) están en el código; si se quieren editar desde la UI hay que moverlas a `ReglaHogar`.

## Lane 68 — Selector con SloshGauge
Pedido: "EL selector de dificultad deberia ser con este componente: npx shadcn@latest add @react-bits/SloshGauge-TS-TW" (uso: `<SloshGauge value onChange interactive showValue liquidColor glassColor width height radius ticks viscosity tilt splash unit ariaLabel />`).
Componente instalado en `src/components/SloshGauge.tsx`. En `TaskForm` el gauge tiene 4 tramos (`ticks={4}`): Fácil 25, Media 50, Difícil 75, Ardua 100; al arrastrar se ajusta al tramo y el color cambia por nivel. Al lado, la lista de niveles con ejemplo.

## Lane 71 — Colores del gauge según tema
Pedido: "Ahora cambiale los colores para que coincida con el tema dark y light."
El vidrio usa `var(--muted)` con `ring-border`; el líquido recorre una rampa de 8 pasos verde → ámbar → rojo con las paletas de success/warning/destructive de cada tema (claro: #2D6A2E→#8B2500; oscuro: #6AAF6A→#D46040), elegida con `useThemeStore().darkMode`.
