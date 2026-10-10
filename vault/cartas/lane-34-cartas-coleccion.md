# Lane 34 — Colección, álbum y pantalla de carta

- **Rama:** `task/lane-34-cartas-coleccion` · **Worktree:** `../ordo-diei-lanes/lane-34`
- **Parte de:** lane 33 (`task/lane-33-cartas-catalogo`)
- **Plan maestro (leer primero, entero):** `vault/CARTAS_CATOLICAS.md` — §1 pedido textual, §3 decisiones, §4 datos, §6 reglas.

## Al empezar
1. `git status` limpio y estás en `task/lane-34-cartas-coleccion`.
2. `git merge task/lane-33-cartas-catalogo`.
3. Leer `AGENTS.md` y la guía relevante en `node_modules/next/dist/docs/` antes de usar cualquier API de Next 16.
4. Reglas fijas: UI solo con componentes prearmados (shadcn `radix-nova`, React Bits, MagicUI), sin duplicar elementos de UI ni cambiar comportamiento ajeno; reutilizar open source; **no copiar código de `ashishbarthwal/creator-gacha-card-game`** (sin licencia de reuso); textos en español rioplatense; nada de YouTube/Google/batallas/ataque/defensa.

## Objetivo
Los dashboards y la pantalla de cada carta.

## Entregables
1. Ruta `/dashboard/cartas` con shadcn `tabs`: **Mi colección** (solo desbloqueadas, con contador de fragmentos para las que están en progreso) y **Álbum** (todas; las no desbloqueadas en blanco y negro con candado y `n/requeridos`). Grillas con `CartaVista` modo `plana`/`bloqueada` (nunca `holo` por celda). Filtros por categoría y rareza (`toggle-group` / `native-select`), buscador, contador "X de Y", estado vacío con shadcn `empty` que lleva a la tienda.
2. Pantalla `/dashboard/cartas/[clave]`: `CartaVista` modo `holo` (bloqueada → versión B/N sin holo) y, al lado o debajo, **historia, oración o rezo, frase con autor y datasheet** (celebración en formato legible "4 de octubre", año de nacimiento y de muerte, virtud, patronazgo, etc.) con shadcn `card`/`table`. Barra de fragmentos, próxima fiesta ("faltan N días"), botón a la tienda. Respeta `OCULTAR_TEXTO_BLOQUEADA` (vault D7). Navegación anterior/siguiente dentro del filtro. 404 amable si la clave no existe.
3. Entrada "Cartas" en `AppSidebar.tsx` (ícono lucide), sin duplicarla en el Dock ni en otro lugar.
4. Datos desde `/api/cartas` (lane 31); nada de lógica de negocio en el cliente.
5. Responsive (1440 / 390), modo oscuro, carga con `skeleton`, sin saltos de layout.

## Fuera de esta lane
Tienda, apertura animada, admin, reclamos.

## Al terminar
- `npm test`, `npx tsc --noEmit`, `npx eslint <lo tocado>` y `npx next build` en verde (si algo falla, decilo: no lo escondas).
- Si hay UI: capturas en escritorio 1440, móvil 390 y modo oscuro, más clic real; sin errores de consola.
- Borrar datos de prueba que hayas creado en la base.
- Commit(s) en esta rama. Agregar una fila a la tabla §8 de `vault/CARTAS_CATOLICAS.md` (qué hiciste, qué verificaste, qué quedó pendiente).
- **No hagas merge a `dev` ni PR.** Avisá con un resumen corto y pasá a la siguiente lane.
