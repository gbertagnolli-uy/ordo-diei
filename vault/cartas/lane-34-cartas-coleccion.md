# Lane 34 — Colección, álbum y pantalla de carta

- **Rama:** `task/lane-34-cartas-coleccion` · **Worktree:** `../ordo-diei-lanes/lane-34`
- **Parte de:** lane 33 (`task/lane-33-cartas-catalogo`)
- **Plan maestro (leer primero, entero):** `vault/CARTAS_CATOLICAS.md` — §1 y §1.1 pedido textual, §2.4 informe, §3 decisiones (D1–D18), §4 datos, §6 reglas. El informe completo está en `vault/cartas/ref/INFORME_SISTEMAS_CARTAS.md`.

## Al empezar
1. `git status` limpio y estás en `task/lane-34-cartas-coleccion`.
2. `git merge task/lane-33-cartas-catalogo`.
3. Leer `AGENTS.md` y la guía relevante en `node_modules/next/dist/docs/` antes de usar cualquier API de Next 16.
4. Reglas fijas: UI solo con componentes prearmados (shadcn `radix-nova`, React Bits, MagicUI), sin duplicar elementos de UI ni cambiar comportamiento ajeno; reutilizar open source; **no copiar código de `ashishbarthwal/creator-gacha-card-game`** (sin licencia de reuso); textos en español rioplatense (rótulos en `src/lib/cartas/textos.ts`); nada de YouTube/Google/batallas/ataque/defensa.

## Objetivo
Los dashboards y la pantalla de cada carta con la **revelación progresiva** (D13) y los **grados** (D14).

## Entregables
1. `/dashboard/cartas` con shadcn `tabs`: **Mi colección** (desbloqueadas, con grado y contador; las que están en progreso aparecen en una fila aparte "En camino" con su %) y **Álbum** (todas; las no desbloqueadas en blanco y negro con candado y `n/requeridos`). Grillas con `CartaVista` modo `plana`/`bloqueada` (nunca `holo` por celda). Filtros por categoría, rareza y grado, buscador, contador "X de Y", `empty` que lleva a la tienda.
2. `/dashboard/cartas/[clave]`: `CartaVista` modo `holo` (bloqueada → B/N sin holo) y las secciones **Historia, Oración, Frase y Datasheet** con shadcn `card`/`table`, **mostrando exactamente lo que devuelve la API** (el cliente no decide qué se ve):
   - Siempre: nombre y fecha de celebración ("4 de octubre", "faltan N días").
   - Lo bloqueado se muestra como "???" con el rótulo de la sección y la pista "se revela al X %" (oración >0 %, frase 25 %, datasheet desde 25 % hasta 100 %, historia 100 %). Los datos del datasheet aún ocultos muestran su etiqueta con "???".
   - Barra de fragmentos (`progress`) con **hitos marcados en 25 %, 50 % y 100 %** y, ya desbloqueada, hitos de grados II/III/IV (150/200/300 %). Grado actual con su rótulo y qué falta para el siguiente.
   - Si hay Incienso ganado por excedente, avisarlo. Botón a la tienda. Anterior/siguiente dentro del filtro. 404 amable.
3. Entrada "Cartas" en `AppSidebar.tsx` (ícono lucide), sin duplicarla en el Dock.
4. Datos desde `/api/cartas` (lane 31); nada de lógica de negocio en el cliente.
5. Probar con usuarios de prueba cargando fragmentos para 0, 10, 30, 60 y 100 % y capturar cada estado. Responsive (1440 / 390), modo oscuro, `skeleton` de carga, sin saltos de layout.

## Fuera de esta lane
Tienda, apertura animada, admin, reclamos.

## Al terminar
- `npm test`, `npx tsc --noEmit`, `npx eslint <lo tocado>` y `npx next build` en verde (si algo falla, decilo: no lo escondas).
- Si hay UI: capturas en escritorio 1440, móvil 390 y modo oscuro, más clic real; sin errores de consola.
- Borrar datos de prueba que hayas creado en la base.
- Commit(s) en esta rama. Agregar una fila a la tabla §8 de `vault/CARTAS_CATOLICAS.md` (qué hiciste, qué verificaste, qué quedó pendiente); si al mergear la rama anterior hay conflicto en esa tabla, conservar ambas filas.
- **No hagas merge a `dev` ni PR.** Avisá con un resumen corto y pasá a la siguiente lane.
