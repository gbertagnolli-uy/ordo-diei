# Lane 32 — HoloCard y vista de carta

- **Rama:** `task/lane-32-holocard` · **Worktree:** `../ordo-diei-lanes/lane-32`
- **Parte de:** lane 31 (`task/lane-31-cartas-datos`)
- **Plan maestro (leer primero, entero):** `vault/CARTAS_CATOLICAS.md` — §1 pedido textual, §3 decisiones, §4 datos, §6 reglas.

## Al empezar
1. `git status` limpio y estás en `task/lane-32-holocard`.
2. `git merge task/lane-31-cartas-datos`.
3. Leer `AGENTS.md` y la guía relevante en `node_modules/next/dist/docs/` antes de usar cualquier API de Next 16.
4. Reglas fijas: UI solo con componentes prearmados (shadcn `radix-nova`, React Bits, MagicUI), sin duplicar elementos de UI ni cambiar comportamiento ajeno; reutilizar open source; **no copiar código de `ashishbarthwal/creator-gacha-card-game`** (sin licencia de reuso); textos en español rioplatense; nada de YouTube/Google/batallas/ataque/defensa.

## Objetivo
El componente visual de la carta. Es el que el usuario pidió explícitamente: **HoloCard de React Bits** (efecto holográfico).

## Entregables
1. **Instalar HoloCard con el CLI de shadcn**, no a mano: `npx shadcn@latest add https://reactbits.dev/r/HoloCard-TS-CSS.json` (variante TypeScript + CSS; el proyecto es TS. La variante JS+CSS que pidió el usuario está idéntica en `vault/cartas/ref/HoloCard-JS-CSS.registry.json` como referencia). Los props están en el vault §1. No modificar el shader. Si el CLI agrega imports desde `"cn"`, corregirlos a `@/lib/utils` y desinstalar el paquete `cn`. Verificar que compila bajo Next 16 (`'use client'`, sin SSR de WebGL) y que cae a la imagen sin WebGL2.
2. `src/components/cartas/CartaVista.tsx` — **un solo componente de carta** con tres modos:
   - `holo`: `HoloCard` con preset por rareza (vault §3 D1): Común sin holo (`intensity=0`), Buena `glitter` suave, Perfecta `gold`, Celestial `cosmos` (probar `swirl`). Solo para detalle, apertura y vista previa del admin.
   - `plana`: imagen con inclinación CSS liviana, para **grillas** (D8: WebGL permite ~16 contextos, no instanciar HoloCard por celda).
   - `bloqueada`: la plana en blanco y negro (`grayscale` + opacidad) con candado y barra de fragmentos `n/requeridos` (shadcn `progress`).
3. `GET /api/cartas/[clave]/imagen` (o ruta de imagen de Next) que compone con **`next/og` (`ImageResponse`)** el arte + marco de rareza + nombre en un PNG con la proporción 63:88, con caché. Mismo origen para evitar CORS. `frame` de HoloCard debe coincidir con el ancho del marco. Marcos ornamentales sobrios por rareza (halo/oro/celeste), tipografía serif (Newsreader, ya en el tema), estética católica tradicional, **nada "videojuego"**.
4. Página de prueba temporal `/dashboard/cartas/_vista` (borrarla al terminar, o dejarla solo en desarrollo) con las 4 rarezas en los 3 modos usando las cartas de `_demo.json`.
5. Accesibilidad: `alt` real, foco visible, `prefers-reduced-motion` respetado.

## Fuera de esta lane
Páginas definitivas, tienda, admin.

## Al terminar
- `npm test`, `npx tsc --noEmit`, `npx eslint <lo tocado>` y `npx next build` en verde (si algo falla, decilo: no lo escondas).
- Si hay UI: capturas en escritorio 1440, móvil 390 y modo oscuro, más clic real; sin errores de consola.
- Borrar datos de prueba que hayas creado en la base.
- Commit(s) en esta rama. Agregar una fila a la tabla §8 de `vault/CARTAS_CATOLICAS.md` (qué hiciste, qué verificaste, qué quedó pendiente).
- **No hagas merge a `dev` ni PR.** Avisá con un resumen corto y pasá a la siguiente lane.
