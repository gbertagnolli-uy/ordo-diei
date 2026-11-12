# Lane 248 — Compañero flotante v2: menú contextual y escenas automáticas

Rama `task/lane-248-companero-menu-escenas` (worktree `ordo-diei-lanes/lane-248`), base `dev`. Continúa la [lane 247](LANE_247_COMPANERO_FLOTANTE.md).

## Decisiones del usuario
1. **Sin la pose «buenos días»** en la imagen flotante y en el botón del Dock (trae el cartel dibujado y fondo blanco).
2. **Cada imagen tiene al menos 4 mensajes** (por voz de compañero), para que no repita siempre lo mismo.
3. **Gestos nuevos:** tocar abre un **menú contextual** con «Cambiar de imagen» y «Abrir panel del compañero»; **dejar presionado** permite **hacer drag**. Se elimina la presión larga de 1 s (se solapaba con el drag) y no se usa doble click (cambiaba la imagen dos veces).
4. **La imagen y el mensaje cambian solos** según la pantalla, el momento del día o lo que pasa en la app.

## Diseño
- `src/lib/engagement/companeroEscena.ts` (puro, con tests): mensajes por voz × pose (≥ 4), mensajes por pantalla, por momento del día y por evento de la app; `elegirEscena` decide pose y frase (evento > pantalla > momento > pose), nunca devuelve `buenos-dias` ni una pose todavía no ganada, y evita repetir la frase anterior.
- Pantallas: se detecta con `usePathname`. Momento: hora local. Eventos del servidor (layout): nivel nuevo, cartas, premios, tareas atrasadas, hábitos pendientes, racha. Eventos en vivo: `modalStore` (`TASK_SUCCESS`, `LEVEL_UP`, `SURPRISE_AWARD`).
- `CompaneroFlotante`: toque → menú; sostener ~250 ms (o mover) → drag; cambia solo al navegar y cada ~50 s si no hay menú ni drag.

## Estado
Implementada con `tsc`, lint y 559 tests en verde (15 nuevos en `companeroEscena.test.ts`). La prueba visual la hace Gabriel.
