# Lane 32 — HoloCard y vista de carta

- **Rama:** `task/lane-32-holocard` · **Worktree:** `../ordo-diei-lanes/lane-32`
- **Parte de:** lane 31 (`task/lane-31-cartas-datos`)
- **Plan maestro (leer primero, entero):** `vault/CARTAS_CATOLICAS.md` — §1 y §1.1 pedido textual, §2.4 informe, §3 decisiones (D1–D18), §4 datos, §6 reglas. El informe completo está en `vault/cartas/ref/INFORME_SISTEMAS_CARTAS.md`.

## Al empezar
1. `git status` limpio y estás en `task/lane-32-holocard`.
2. `git merge task/lane-31-cartas-datos`.
3. Leer `AGENTS.md` y la guía relevante en `node_modules/next/dist/docs/` antes de usar cualquier API de Next 16.
4. Reglas fijas: UI solo con componentes prearmados (shadcn `radix-nova`, React Bits, MagicUI), sin duplicar elementos de UI ni cambiar comportamiento ajeno; reutilizar open source; **no copiar código de `ashishbarthwal/creator-gacha-card-game`** (sin licencia de reuso); textos en español rioplatense (rótulos en `src/lib/cartas/textos.ts`); nada de YouTube/Google/batallas/ataque/defensa.

## Objetivo
El componente visual de la carta: **HoloCard de React Bits** (efecto holográfico), pedido explícitamente por el usuario.

## Entregables
1. **Instalar HoloCard con el CLI de shadcn**, no a mano: `npx shadcn@latest add https://reactbits.dev/r/HoloCard-TS-CSS.json` (TypeScript + CSS; el usuario pidió JS+CSS, idéntico, en `vault/cartas/ref/HoloCard-JS-CSS.registry.json`). Props en el vault §1. No modificar el shader. Si el CLI agrega imports desde `"cn"`, corregirlos a `@/lib/utils` y desinstalar `cn`. Verificar que compila con Next 16 (`'use client'`, sin SSR de WebGL) y que sin WebGL2 cae a la imagen.
2. `src/components/cartas/CartaVista.tsx` — **un solo componente de carta** con tres modos y un prop `grado` (0–4):
   - `holo`: `HoloCard` con preset por rareza (D1): Común sin holo (`intensity=0`), Buena `glitter` suave, Perfecta `gold`, Celestial `cosmos` (probar `swirl`). La **intensidad sube con el grado** (D14: III más intensa) y en grado III+ usa el **arte alternativo** si existe. Grado IV: halo animado (CSS/framer-motion) alrededor de la carta y título "Gloriosa". Solo para detalle, apertura y vista previa del admin.
   - `plana`: imagen con inclinación CSS liviana para **grillas** (D8), con sello de grado (II: marco dorado; IV: halo) y número romano.
   - `bloqueada`: la plana en blanco y negro con candado y barra de fragmentos `n/requeridos` (shadcn `progress`).
3. `GET /api/cartas/[clave]/imagen` con **`next/og`** (`ImageResponse`) que compone arte + marco de rareza (y de grado II+) + nombre en un PNG 63:88, con caché; mismo origen. `frame` de HoloCard coincide con el ancho del marco. Marcos ornamentales sobrios (halo, oro, celeste), tipografía serif (Newsreader), estética católica tradicional, **nada "videojuego"**. La imagen **no revela nada oculto**: en carta bloqueada solo muestra arte en B/N y nombre.
4. Página de prueba temporal `/dashboard/cartas/_vista` (borrar al terminar) con 4 rarezas × 3 modos × grados 0–4 usando `_demo.json`.
5. Accesibilidad: `alt` real, foco visible, `prefers-reduced-motion` respetado.

## Fuera de esta lane
Páginas definitivas, tienda, admin.

## Al terminar
- `npm test`, `npx tsc --noEmit`, `npx eslint <lo tocado>` y `npx next build` en verde (si algo falla, decilo: no lo escondas).
- Si hay UI: capturas en escritorio 1440, móvil 390 y modo oscuro, más clic real; sin errores de consola.
- Borrar datos de prueba que hayas creado en la base.
- Commit(s) en esta rama. Agregar una fila a la tabla §8 de `vault/CARTAS_CATOLICAS.md` (qué hiciste, qué verificaste, qué quedó pendiente); si al mergear la rama anterior hay conflicto en esa tabla, conservar ambas filas.
- **No hagas merge a `dev` ni PR.** Avisá con un resumen corto y pasá a la siguiente lane.
