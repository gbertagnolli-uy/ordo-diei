# Lane 33 — Catálogo inicial de cartas

- **Rama:** `task/lane-33-cartas-catalogo` · **Worktree:** `../ordo-diei-lanes/lane-33`
- **Parte de:** lane 32 (`task/lane-32-holocard`)
- **Plan maestro (leer primero, entero):** `vault/CARTAS_CATOLICAS.md` — §1 pedido textual, §3 decisiones, §4 datos, §6 reglas.

## Al empezar
1. `git status` limpio y estás en `task/lane-33-cartas-catalogo`.
2. `git merge task/lane-32-holocard`.
3. Leer `AGENTS.md` y la guía relevante en `node_modules/next/dist/docs/` antes de usar cualquier API de Next 16.
4. Reglas fijas: UI solo con componentes prearmados (shadcn `radix-nova`, React Bits, MagicUI), sin duplicar elementos de UI ni cambiar comportamiento ajeno; reutilizar open source; **no copiar código de `ashishbarthwal/creator-gacha-card-game`** (sin licencia de reuso); textos en español rioplatense; nada de YouTube/Google/batallas/ataque/defensa.

## Objetivo
El contenido: ~60 cartas católicas tradicionales, correctas y con arte libre. **Es la lane donde más importa no inventar datos.**

## Entregables
1. JSON en `src/lib/cartas/catalogo/` (contrato en vault §5), por categoría: `misterios.json` (20: gozosos, luminosos, dolorosos, gloriosos; sin fecha), `angeles.json` (~9), `santos.json` (~25: María, José, Juan Bautista, Francisco de Asís, Teresita, Juan Pablo II, Pío de Pietrelcina, Don Bosco, Carlos Acutis, Nicolás de Bari, Miguel/Gabriel/Rafael si no van en ángeles…), `temas.json` (~6: Eucaristía, Sagrado Corazón, etc.). Quitar `_demo.json`.
2. Cada carta: historia de 2–3 párrafos fieles a la tradición, **oración real** (de la Iglesia o del propio santo, citando la fuente en `datos.fuente`), frase auténtica con autor, virtud principal, fechas, datos del datasheet (patronazgo, símbolo, lugar…). Español rioplatense neutro, tono solemne y claro para chicos y grandes.
3. **Fechas litúrgicas verificadas** con **`romcal`** (MIT, `npm i -D romcal`): script `scripts/validar-catalogo.ts` que valida el JSON con el zod de la lane 30 y compara `celebracion` contra el Calendario Romano general en español; lo que no coincida se corrige o queda `null` con una nota en `datos`. Las fiestas móviles (Pascua, Pentecostés…) quedan `null` en v1. Si romcal no incluye al santo (devoción local), verificar contra fuente oficial y anotarla.
4. Rarezas con el criterio de vault §3 D10 (Celestial reservada para María, José, los tres arcángeles, Eucaristía/Sagrado Corazón…); pesos finales ≈ 60 % Comunes, 28 % Buenas, 10 % Perfectas, 2 % Celestiales **de la cantidad de cartas**, aproximados. Dejar la lista en el §8 para revisión del usuario.
5. **Arte**: solo dominio público o licencia libre (Wikimedia Commons, p. ej.). Convertir a `.webp` (≤ 200 KB, proporción retrato, mismo recorte) en `public/cartas/<clave>.webp`. `src/lib/cartas/catalogo/CREDITOS.md` con título, autor, URL y licencia **de cada imagen**. Si no hay arte libre para una carta, usar un arte genérico de su categoría y dejarlo marcado.
6. Cargar el catálogo con el seed de la lane 31 y verificar que `/api/cartas` lo devuelve completo y que la vista de la lane 32 renderiza las cartas.

## Fuera de esta lane
UI definitiva, tienda, admin.

## Al terminar
- `npm test`, `npx tsc --noEmit`, `npx eslint <lo tocado>` y `npx next build` en verde (si algo falla, decilo: no lo escondas).
- Si hay UI: capturas en escritorio 1440, móvil 390 y modo oscuro, más clic real; sin errores de consola.
- Borrar datos de prueba que hayas creado en la base.
- Commit(s) en esta rama. Agregar una fila a la tabla §8 de `vault/CARTAS_CATOLICAS.md` (qué hiciste, qué verificaste, qué quedó pendiente).
- **No hagas merge a `dev` ni PR.** Avisá con un resumen corto y pasá a la siguiente lane.
