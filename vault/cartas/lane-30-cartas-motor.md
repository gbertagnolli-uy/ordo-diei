# Lane 30 — Motor puro de cartas

- **Rama:** `task/lane-30-cartas-motor` · **Worktree:** `../ordo-diei-lanes/lane-30`
- **Parte de:** `dev` (sin lane previa)
- **Plan maestro (leer primero, entero):** `vault/CARTAS_CATOLICAS.md` — §1 pedido textual, §3 decisiones, §4 datos, §6 reglas.

## Al empezar
1. `git status` limpio y estás en `task/lane-30-cartas-motor`.
2. No hay rama anterior que mergear; confirmá que partís de `dev` actual.
3. Leer `AGENTS.md` y la guía relevante en `node_modules/next/dist/docs/` antes de usar cualquier API de Next 16.
4. Reglas fijas: UI solo con componentes prearmados (shadcn `radix-nova`, React Bits, MagicUI), sin duplicar elementos de UI ni cambiar comportamiento ajeno; reutilizar open source; **no copiar código de `ashishbarthwal/creator-gacha-card-game`** (sin licencia de reuso); textos en español rioplatense; nada de YouTube/Google/batallas/ataque/defensa.

## Objetivo
Toda la lógica de negocio de las cartas, **pura y testeada**, sin base de datos ni UI. Carpeta `src/lib/cartas/`.

## Entregables
1. `economia.ts` — única fuente de constantes (vault §3 D1/D2): rarezas, pesos de banda, fragmentos requeridos, precio por fragmento, tamaños y precios de sobres, tope diario por carta, `OCULTAR_TEXTO_BLOQUEADA=false`.
2. `esquema.ts` — esquemas **zod** de carta (contrato del vault §5) y de formulario admin. Instalar `zod` si no está.
3. `sorteo.ts` — sorteo **en dos etapas** (primero banda por peso fijo, luego carta uniforme dentro de la banda), con `rng` inyectable (semilla determinista en tests). Solo sortea cartas **no desbloqueadas** y renormaliza entre bandas con pendientes (D3). Sobre normal y sobre devoto (garantiza ≥ Buena). Reparte N fragmentos en 1–3 cartas. Idea tomada de la referencia, **implementada desde cero**.
4. `fragmentos.ts` — aplicar fragmentos a una carta: nunca otorga más de lo que falta, devuelve si desbloquea (D4).
5. `eventos.ts` — fechas en `APP_TZ` con `date-fns` + `@date-fns/tz`: `esFiestaHoy(celebracion, hoy)`, `regaloFiesta(carta, progreso)` = `ceil(req×0,5)` limitado a lo que falta (D5), `esCumpleHoy(fechaNacimiento, hoy)` con 29-feb → 28-feb en años no bisiestos, `regaloCumple(cartasDelDia, progreso)` = todo lo que falta (D6), y el fallback "sobre devoto gratis" cuando no hay cartas ese día.
6. `simulacion.test.ts` o script — simula la economía con 10–20 pts/día y reporta días hasta la primera Común, Buena, Perfecta y Celestial. Dejar el resultado en el §8 del vault y, si los números de D1/D2 dan resultados absurdos (p. ej. una Celestial en > 1 año o < 1 mes), **proponer ajustes en el vault sin cambiarlos solo**.
7. Tests `node:test` (`npm test`): distribución de bandas con semilla, sin repetidas, renormalización, tope de fragmentos, fiesta (50 %, carta ya desbloqueada, parcial), cumpleaños (incluye 29-feb y varias cartas el mismo día), fechas en `APP_TZ`.

## Fuera de esta lane
Prisma, API, UI, catálogo.

## Al terminar
- `npm test`, `npx tsc --noEmit`, `npx eslint <lo tocado>` y `npx next build` en verde (si algo falla, decilo: no lo escondas).
- Si hay UI: capturas en escritorio 1440, móvil 390 y modo oscuro, más clic real; sin errores de consola.
- Borrar datos de prueba que hayas creado en la base.
- Commit(s) en esta rama. Agregar una fila a la tabla §8 de `vault/CARTAS_CATOLICAS.md` (qué hiciste, qué verificaste, qué quedó pendiente).
- **No hagas merge a `dev` ni PR.** Avisá con un resumen corto y pasá a la siguiente lane.
