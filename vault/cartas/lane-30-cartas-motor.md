# Lane 30 — Motor puro de cartas

- **Rama:** `task/lane-30-cartas-motor` · **Worktree:** `../ordo-diei-lanes/lane-30`
- **Parte de:** `dev` (sin lane previa)
- **Plan maestro (leer primero, entero):** `vault/CARTAS_CATOLICAS.md` — §1 y §1.1 pedido textual, §2.4 informe, §3 decisiones (D1–D18), §4 datos, §6 reglas. El informe completo está en `vault/cartas/ref/INFORME_SISTEMAS_CARTAS.md`.

## Al empezar
1. `git status` limpio y estás en `task/lane-30-cartas-motor`.
2. No hay rama anterior que mergear; confirmá que partís de `dev` actual.
3. Leer `AGENTS.md` y la guía relevante en `node_modules/next/dist/docs/` antes de usar cualquier API de Next 16.
4. Reglas fijas: UI solo con componentes prearmados (shadcn `radix-nova`, React Bits, MagicUI), sin duplicar elementos de UI ni cambiar comportamiento ajeno; reutilizar open source; **no copiar código de `ashishbarthwal/creator-gacha-card-game`** (sin licencia de reuso); textos en español rioplatense (rótulos en `src/lib/cartas/textos.ts`); nada de YouTube/Google/batallas/ataque/defensa.

## Objetivo
Toda la lógica de negocio de las cartas, **pura y testeada**, sin base de datos ni UI. Carpeta `src/lib/cartas/`.

## Entregables
1. `economia.ts` — única fuente de constantes (D1/D2/D4/D14/D15/D17): rarezas, pesos de banda, fragmentos requeridos, valor de fragmento, tope (`×3`), umbrales de grado (`1, 1.5, 2, 3`), sobres (Meditación 40 pts / 5 fragmentos / solo Común y Buena; Revelación 160 pts / 8 fragmentos / ≥4 de una carta Perfecta o Celestial), precio de fragmento elegido (puntos y Incienso) y tope diario, `BONO_FIESTA_TIENDA=1.5`.
2. `textos.ts` — rótulos de la interfaz (fragmento, grado I–IV, Incienso, sobres) en un solo lugar (D18).
3. `esquema.ts` — **zod** de carta (contrato vault §5; datasheet de 4 a 8 datos `{etiqueta, valor}`; **imágenes por grado**: la del grado I obligatoria y las de II–IV opcionales) y del formulario admin. Instalar `zod` si no está.
4. `sorteo.ts` — sorteo **en dos etapas** (banda por peso fijo, luego carta uniforme dentro de la banda), `rng` inyectable. Sobre de Meditación y de Revelación según D2. Sortea **cualquier carta activa** (D3). Reparte los fragmentos en 1–3 cartas. Idea de la referencia, **implementada desde cero**.
5. `fragmentos.ts` — `aplicarFragmentos(actual, requeridos, rareza, cantidad)`: suma hasta el tope `requeridos×3`, devuelve `{nuevo, desbloquea, gradoAntes, gradoDespues, excedente, incienso}` con `incienso = excedente × valor(rareza)` (D4/D15). `gradoDe(fragmentos, requeridos)` (0 = bloqueada, I–IV). `imagenDeGrado(carta, grado)` (D19): devuelve la imagen de ese grado o, si falta, la del grado anterior más alto cargado; bloqueada → la del grado I.
6. `revelado.ts` — **`contenidoVisible(carta, fragmentos)`** (D13): devuelve qué campos se ven y cuáles no, con `"???"`, el porcentaje al que se desbloquea cada uno y el datasheet progresivo (`N` datos: `p<25 %` → 0; `25 %≤p<100 %` → `clamp(ceil(N×(p−25 %)/75 %), 1, N−1)`; `p≥100 %` → `N`). **El resultado no contiene el texto oculto**: es el que usará la API.
7. `eventos.ts` — fechas en `APP_TZ` con `date-fns` + `@date-fns/tz`: `esFiestaHoy`, `regaloFiesta` = `ceil(req×0,5)` (D5), `esCumpleHoy` (29-feb → 28-feb en años no bisiestos), `regaloCumple` = lo que falta para el 100 % de cada carta del día (D6) y fallback "Sobre de Revelación gratis", `multiplicadorTienda(carta, hoy)` (D17).
8. Simulación de la economía (test o script) con 10–20 pts/día: días hasta la primera Común, Buena, Perfecta y Celestial, y hasta el grado IV de una Común. Resultado en el §8 del vault; si D1/D2 dan números absurdos (Celestial en > 1 año o < 1 mes), **proponer ajustes sin cambiarlos sola**.
9. Tests `node:test` (`npm test`): bandas con semilla, renormalización, Meditación sin Perfecta/Celestial, Revelación con garantía, tope y conversión a Incienso (sin arbitraje entre rarezas), grados en las fronteras 99/100/149/150/199/200/299/300 %, **revelación en las fronteras 0, 1, 24, 25, 49, 50, 99, 100 %** y que el texto oculto no aparece en la salida, fiesta, cumpleaños (29-feb, varias cartas, carta ya al 100 %), bono de tienda, fechas en `APP_TZ`.

## Fuera de esta lane
Prisma, API, UI, catálogo.

## Al terminar
- `npm test`, `npx tsc --noEmit`, `npx eslint <lo tocado>` y `npx next build` en verde (si algo falla, decilo: no lo escondas).
- Si hay UI: capturas en escritorio 1440, móvil 390 y modo oscuro, más clic real; sin errores de consola.
- Borrar datos de prueba que hayas creado en la base.
- Commit(s) en esta rama. Agregar una fila a la tabla §8 de `vault/CARTAS_CATOLICAS.md` (qué hiciste, qué verificaste, qué quedó pendiente); si al mergear la rama anterior hay conflicto en esa tabla, conservar ambas filas.
- **No hagas merge a `dev` ni PR.** Avisá con un resumen corto y pasá a la siguiente lane.
