# Lane 37 — Fiesta del día, cumpleaños y cierre

- **Rama:** `task/lane-37-cartas-eventos` · **Worktree:** `../ordo-diei-lanes/lane-37`
- **Parte de:** lane 36 (`task/lane-36-cartas-admin`)
- **Plan maestro (leer primero, entero):** `vault/CARTAS_CATOLICAS.md` — §1 pedido textual, §3 decisiones, §4 datos, §6 reglas.

## Al empezar
1. `git status` limpio y estás en `task/lane-37-cartas-eventos`.
2. `git merge task/lane-36-cartas-admin`.
3. Leer `AGENTS.md` y la guía relevante en `node_modules/next/dist/docs/` antes de usar cualquier API de Next 16.
4. Reglas fijas: UI solo con componentes prearmados (shadcn `radix-nova`, React Bits, MagicUI), sin duplicar elementos de UI ni cambiar comportamiento ajeno; reutilizar open source; **no copiar código de `ashishbarthwal/creator-gacha-card-game`** (sin licencia de reuso); textos en español rioplatense; nada de YouTube/Google/batallas/ataque/defensa.

## Objetivo
Los eventos temporales del pedido (vault §1 puntos 10 y 11; §3 D5 y D6) y el cierre del proyecto.

## Entregables
1. **Aviso de fiesta del día**: al entrar a la app, si hay cartas cuya `celebracion` es hoy (en `APP_TZ`), mostrar un aviso con shadcn `alert` o `card` (en el inicio del dashboard y en `/dashboard/cartas`, un solo lugar por vista, sin duplicar) con la carta, "Hoy se celebra …" y el botón **Reclamar** el 50 % de fragmentos (`ceil(req×0,5)` limitado a lo que falta). Se reclama una vez por usuario, carta y año. Si ya está desbloqueada, el aviso lo dice y no ofrece reclamar. Varias cartas el mismo día → una por carta.
2. **Cumpleaños**: el día de `fechaNacimiento` (29-feb → 28-feb en años no bisiestos) aviso festivo con botón **Reclamar mi regalo**: todos los fragmentos que faltan de las cartas de ese día ⇒ se desbloquean con la animación de la lane 35 (carta especial). Si ese día no hay carta o ya las tiene todas, el regalo alternativo es un **sobre devoto gratis** (vault D6, pendiente de confirmar con el usuario, dejar la constante fácil de cambiar). Una vez por año.
3. Mostrar en el perfil/estado un indicador mínimo de eventos pendientes sin ruido (por ejemplo punto en la entrada "Cartas" de la barra lateral si hay algo por reclamar; sin crear otra navegación).
4. **Logros de cartas** en `src/lib/logros.ts` (D12): "Primera carta", "Coleccionista de 10", "Primera Celestial", reutilizando su estructura y `logros.test.ts`.
5. **Pruebas** con tests puros y verificación real: simular fechas con `eventos.ts` (inyectar "hoy") y verificar, con usuarios de prueba, que el 50 % y el regalo de cumpleaños se otorgan **una sola vez**, que un segundo reclamo falla, 29-feb, y carta ya desbloqueada. Borrar datos de prueba.
6. **Cierre**: actualizar `vault/CARTAS_CATOLICAS.md` §8 (todas las lanes), notas de uso (cómo sembrar el catálogo, cómo agregar cartas, cómo se calibra la economía) y confirmar que no queda ninguna referencia a YouTube, Google, batallas, ataque o defensa (`grep -ri`).

## Al terminar
- `npm test`, `npx tsc --noEmit`, `npx eslint <lo tocado>` y `npx next build` en verde (si algo falla, decilo: no lo escondas).
- Si hay UI: capturas en escritorio 1440, móvil 390 y modo oscuro, más clic real; sin errores de consola.
- Borrar datos de prueba que hayas creado en la base.
- Commit(s) en esta rama. Agregar una fila a la tabla §8 de `vault/CARTAS_CATOLICAS.md` (qué hiciste, qué verificaste, qué quedó pendiente).
- **No hagas merge a `dev` ni PR.** Avisá con un resumen corto y pasá a la siguiente lane.
