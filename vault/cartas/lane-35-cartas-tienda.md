# Lane 35 — Tienda y animación de apertura

- **Rama:** `task/lane-35-cartas-tienda` · **Worktree:** `../ordo-diei-lanes/lane-35`
- **Parte de:** lane 34 (`task/lane-34-cartas-coleccion`)
- **Plan maestro (leer primero, entero):** `vault/CARTAS_CATOLICAS.md` — §1 pedido textual, §3 decisiones, §4 datos, §6 reglas.

## Al empezar
1. `git status` limpio y estás en `task/lane-35-cartas-tienda`.
2. `git merge task/lane-34-cartas-coleccion`.
3. Leer `AGENTS.md` y la guía relevante en `node_modules/next/dist/docs/` antes de usar cualquier API de Next 16.
4. Reglas fijas: UI solo con componentes prearmados (shadcn `radix-nova`, React Bits, MagicUI), sin duplicar elementos de UI ni cambiar comportamiento ajeno; reutilizar open source; **no copiar código de `ashishbarthwal/creator-gacha-card-game`** (sin licencia de reuso); textos en español rioplatense; nada de YouTube/Google/batallas/ataque/defensa.

## Objetivo
Comprar fragmentos con puntos y la animación de carta desbloqueada.

## Entregables
1. Pestaña o página **Tienda** dentro de `/dashboard/cartas` (agregar `tabs` si hace falta, sin duplicar navegación): muestra los puntos disponibles, **Sobre de fragmentos**, **Sobre devoto** y **Fragmentos de una carta elegida** (selector de carta + cantidad, tope diario visible) según vault §3 D2. Precios desde `economia.ts`. Botones deshabilitados con motivo ("te faltan 12 puntos", "Colección completa"). Confirmación antes de gastar.
2. Compra por `POST /api/cartas/comprar` (lane 31). **El servidor ya resolvió el resultado antes de animar**; la animación solo lo muestra y cerrarla no pierde nada. Evitar doble clic (deshabilitar mientras envía) y refrescar los puntos del usuario en la barra lateral.
3. **Modal de apertura** (shadcn `dialog`, accesible: `aria-live`, foco atrapado, Esc) con `framer-motion` en 3 etapas: (1) *anticipación*: el sobre tiembla y brilla con el color de la mejor rareza del sobre; (2) *revelación*: cada carta aparece con `CartaVista` modo `holo`, escala y partículas; (3) *confirmación*: resumen con fragmentos ganados, barra de progreso por carta y botones "Abrir otro" / "Ver mi colección". Si una carta **se desbloquea**, pantalla especial "¡Nueva carta desbloqueada!" con el confeti de MagicUI (reutilizar el confeti único existente). Botón "Saltar". Respeta `prefers-reduced-motion`. Tono solemne (halos, oro, serif), no videojuego.
4. Estado del modal con el store que ya exista (Zustand) o `useState`; sin duplicar el confeti ni el `ModalManager`: si encaja, registrar el modal ahí.
5. Verificar con clic real: comprar con puntos insuficientes, comprar, desbloquear una carta, y que los puntos de la barra lateral bajan una sola vez.

## Fuera de esta lane
Admin, fiesta y cumpleaños.

## Al terminar
- `npm test`, `npx tsc --noEmit`, `npx eslint <lo tocado>` y `npx next build` en verde (si algo falla, decilo: no lo escondas).
- Si hay UI: capturas en escritorio 1440, móvil 390 y modo oscuro, más clic real; sin errores de consola.
- Borrar datos de prueba que hayas creado en la base.
- Commit(s) en esta rama. Agregar una fila a la tabla §8 de `vault/CARTAS_CATOLICAS.md` (qué hiciste, qué verificaste, qué quedó pendiente).
- **No hagas merge a `dev` ni PR.** Avisá con un resumen corto y pasá a la siguiente lane.
