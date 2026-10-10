# Lane 33 — Catálogo inicial de cartas

- **Rama:** `task/lane-33-cartas-catalogo` · **Worktree:** `../ordo-diei-lanes/lane-33`
- **Parte de:** lane 32 (`task/lane-32-holocard`)
- **Plan maestro (leer primero, entero):** `vault/CARTAS_CATOLICAS.md` — §1 y §1.1 pedido textual, §2.4 informe, §3 decisiones (D1–D18), §4 datos, §6 reglas. El informe completo está en `vault/cartas/ref/INFORME_SISTEMAS_CARTAS.md`.

## Al empezar
1. `git status` limpio y estás en `task/lane-33-cartas-catalogo`.
2. `git merge task/lane-32-holocard`.
3. Leer `AGENTS.md` y la guía relevante en `node_modules/next/dist/docs/` antes de usar cualquier API de Next 16.
4. Reglas fijas: UI solo con componentes prearmados (shadcn `radix-nova`, React Bits, MagicUI), sin duplicar elementos de UI ni cambiar comportamiento ajeno; reutilizar open source; **no copiar código de `ashishbarthwal/creator-gacha-card-game`** (sin licencia de reuso); textos en español rioplatense (rótulos en `src/lib/cartas/textos.ts`); nada de YouTube/Google/batallas/ataque/defensa.

## Objetivo
El contenido: ~60 cartas católicas tradicionales, correctas y con arte libre. **Es la lane donde más importa no inventar datos.**

## Entregables
1. JSON en `src/lib/cartas/catalogo/` (contrato vault §5) por categoría: `misterios.json` (20: gozosos, luminosos, dolorosos, gloriosos; sin fecha), `angeles.json` (~9), `santos.json` (~25: María, José, Juan Bautista, Francisco de Asís, Teresita, Juan Pablo II, Pío de Pietrelcina, Don Bosco, Carlos Acutis, Nicolás de Bari…), `temas.json` (~6: Eucaristía, Sagrado Corazón…). Quitar `_demo.json`.
2. Cada carta: **historia** de 2–3 párrafos fiel a la tradición (se revela al 100 %), **oración real** de la Iglesia o del propio santo con `fuente` (se revela primero, a más de 0 %: debe ser corta y rezable), **frase** auténtica con autor, y un **datasheet de 4 a 8 datos en orden de revelación**: primero los más generales (virtud principal, año de nacimiento) y al final los más específicos (patronazgo, símbolo, lugar, obras). La fecha de celebración va en `celebracion`, **no** en el datasheet. Español rioplatense, tono solemne y claro para chicos y grandes.
3. **Fechas litúrgicas verificadas** con **`romcal`** (MIT, `npm i -D romcal`): `scripts/validar-catalogo.ts` valida el JSON con el zod de la lane 30 (incluye N de datasheet 4–8) y compara `celebracion` con el Calendario Romano general en español; lo que no coincida se corrige o queda `null` con nota. Fiestas móviles → `null` en v1.
4. Rarezas por el criterio de vault D10 (Celestial reservada a María, José, los tres arcángeles, Eucaristía/Sagrado Corazón…), ≈ 60/28/10/2 % de la cantidad de cartas. Dejar la lista en el §8 para revisión del usuario.
5. **Arte**: solo dominio público o licencia libre (Wikimedia Commons). `.webp` ≤ 200 KB, retrato, mismo recorte, en `public/cartas/<clave>.webp`. `src/lib/cartas/catalogo/CREDITOS.md` con título, autor, URL y licencia de **cada** imagen. `imagenAlternativa` es opcional: ponerla solo en las pocas cartas Celestiales con una segunda obra libre disponible.
6. Cargar el catálogo con el seed (lane 31) y verificar que `/api/cartas` lo devuelve completo y que la vista de la lane 32 renderiza las cartas.

## Fuera de esta lane
UI definitiva, tienda, admin.

## Al terminar
- `npm test`, `npx tsc --noEmit`, `npx eslint <lo tocado>` y `npx next build` en verde (si algo falla, decilo: no lo escondas).
- Si hay UI: capturas en escritorio 1440, móvil 390 y modo oscuro, más clic real; sin errores de consola.
- Borrar datos de prueba que hayas creado en la base.
- Commit(s) en esta rama. Agregar una fila a la tabla §8 de `vault/CARTAS_CATOLICAS.md` (qué hiciste, qué verificaste, qué quedó pendiente); si al mergear la rama anterior hay conflicto en esa tabla, conservar ambas filas.
- **No hagas merge a `dev` ni PR.** Avisá con un resumen corto y pasá a la siguiente lane.
