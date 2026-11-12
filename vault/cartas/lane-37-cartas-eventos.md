# Lane 37 — Fiesta del día, cumpleaños y cierre

- **Rama:** `task/lane-37-cartas-eventos` · **Worktree:** `../ordo-diei-lanes/lane-37`
- **Parte de:** lane 36 (`task/lane-36-cartas-admin`)
- **Plan maestro (leer primero, entero):** `vault/CARTAS_CATOLICAS.md` — §1 y §1.1 pedido textual, §2.4 informe, §3 decisiones (D1–D18), §4 datos, §6 reglas. El informe completo está en `vault/cartas/ref/INFORME_SISTEMAS_CARTAS.md`.

## Al empezar
1. `git status` limpio y estás en `task/lane-37-cartas-eventos`.
2. `git merge task/lane-36-cartas-admin`.
3. Leer `AGENTS.md` y la guía relevante en `node_modules/next/dist/docs/` antes de usar cualquier API de Next 16.
4. Reglas fijas: UI solo con componentes prearmados (shadcn `radix-nova`, React Bits, MagicUI), sin duplicar elementos de UI ni cambiar comportamiento ajeno; reutilizar open source; **no copiar código de `ashishbarthwal/creator-gacha-card-game`** (sin licencia de reuso); textos en español rioplatense (rótulos en `src/lib/cartas/textos.ts`); nada de YouTube/Google/batallas/ataque/defensa.

## Objetivo
Los eventos temporales del pedido (vault §1 puntos 10 y 11; D5, D6, D17) y el cierre del proyecto.

## Entregables
1. **Aviso de fiesta del día**: si hay cartas cuya `celebracion` es hoy (en `APP_TZ`), un aviso (shadcn `alert`/`card`, en el inicio del dashboard y en `/dashboard/cartas`, un solo lugar por vista) con la carta, "Hoy se celebra …" y el botón **Reclamar** el 50 % (`ceil(req×0,5)`). Una vez por usuario, carta y año; sirve aunque ya la tenga (suma a grados o se convierte en Incienso, D4/D15). Varias cartas el mismo día → una por carta.
2. **Cumpleaños**: el día de `fechaNacimiento` (29-feb → 28-feb en años no bisiestos) aviso festivo con **Reclamar mi regalo**: todo lo que falta para el 100 % de las cartas de ese día ⇒ se desbloquean con la animación de la lane 35. Si no hay carta ese día o ya las tiene al 100 %, el regalo es un **Sobre de Revelación gratis** (D6, a confirmar; constante fácil de cambiar). Una vez por año.
3. Indicador mínimo de eventos pendientes (por ejemplo un punto en "Cartas" en la barra lateral), sin crear otra navegación.
4. **Logros** en `src/lib/logros.ts` (D12): "Primera carta", "Coleccionista de 10", "Primera Celestial", "Primera carta Gloriosa" (grado IV), reutilizando su estructura y `logros.test.ts`.
5. **Pruebas** con tests puros y verificación real (inyectar "hoy"): 50 % y cumpleaños **una sola vez**, segundo reclamo falla, 29-feb, carta ya al 100 % y carta en el tope. Borrar datos de prueba.
6. **Cierre**: actualizar el §8 del vault con todas las lanes, notas de uso (sembrar el catálogo, agregar cartas, calibrar la economía) y confirmar con `grep -ri` que no queda YouTube, Google, batallas, ataque o defensa.

## Al terminar
- `npm test`, `npx tsc --noEmit`, `npx eslint <lo tocado>` y `npx next build` en verde (si algo falla, decilo: no lo escondas).
- Si hay UI: capturas en escritorio 1440, móvil 390 y modo oscuro, más clic real; sin errores de consola.
- Borrar datos de prueba que hayas creado en la base.
- Commit(s) en esta rama. Agregar una fila a la tabla §8 de `vault/CARTAS_CATOLICAS.md` (qué hiciste, qué verificaste, qué quedó pendiente); si al mergear la rama anterior hay conflicto en esa tabla, conservar ambas filas.
- **No hagas merge a `dev` ni PR.** Avisá con un resumen corto y pasá a la siguiente lane.
