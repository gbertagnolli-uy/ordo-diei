# Lane 35 — Tienda y animación de apertura

- **Rama:** `task/lane-35-cartas-tienda` · **Worktree:** `../ordo-diei-lanes/lane-35`
- **Parte de:** lane 34 (`task/lane-34-cartas-coleccion`)
- **Plan maestro (leer primero, entero):** `vault/CARTAS_CATOLICAS.md` — §1 y §1.1 pedido textual, §2.4 informe, §3 decisiones (D1–D18), §4 datos, §6 reglas. El informe completo está en `vault/cartas/ref/INFORME_SISTEMAS_CARTAS.md`.

## Al empezar
1. `git status` limpio y estás en `task/lane-35-cartas-tienda`.
2. `git merge task/lane-34-cartas-coleccion`.
3. Leer `AGENTS.md` y la guía relevante en `node_modules/next/dist/docs/` antes de usar cualquier API de Next 16.
4. Reglas fijas: UI solo con componentes prearmados (shadcn `radix-nova`, React Bits, MagicUI), sin duplicar elementos de UI ni cambiar comportamiento ajeno; reutilizar open source; **no copiar código de `ashishbarthwal/creator-gacha-card-game`** (sin licencia de reuso); textos en español rioplatense (rótulos en `src/lib/cartas/textos.ts`); nada de YouTube/Google/batallas/ataque/defensa.

## Objetivo
Comprar fragmentos con puntos o Incienso y la animación de apertura, desbloqueo y subida de grado.

## Entregables
1. Pestaña **Tienda** dentro de `/dashboard/cartas`: puntos disponibles e **Incienso**, **Sobre de Meditación**, **Sobre de Revelación** y **Fragmentos de una carta elegida** (selector + cantidad, pago en puntos o en Incienso, tope diario visible), según D2. Precios desde `economia.ts`. Botones deshabilitados con motivo ("te faltan 12 puntos"). Confirmación antes de gastar. Si hoy es la fiesta de alguna carta, mostrar "Hoy ×1,5 en fragmentos de San …" en esa carta (D17).
2. Compra por `POST /api/cartas/comprar`. **El servidor ya resolvió el resultado antes de animar**; cerrar la animación no pierde nada. Deshabilitar mientras envía y refrescar los puntos de la barra lateral.
3. **Modal de apertura** (shadcn `dialog`, accesible: `aria-live`, foco atrapado, Esc) con `framer-motion` en 3 etapas: (1) *anticipación*: el sobre tiembla y brilla con el color de la mejor rareza; (2) *revelación*: cada carta con `CartaVista` modo `holo`, escala y partículas, mostrando los **fragmentos ganados y la barra con el nuevo %**; (3) *confirmación*: resumen y botones "Abrir otro" / "Ver mi colección". Eventos especiales dentro del mismo modal, con el confeti de MagicUI (reutilizar el confeti único): **"¡Nueva carta desbloqueada!"** (100 %), **"Subió a grado II/III/IV"** (con una transición de la imagen anterior a la **nueva imagen del grado**, p. ej. fundido con destello; D19) y **"Ganaste N de Incienso"** por excedente. Botón "Saltar". Respeta `prefers-reduced-motion`. Tono solemne (halos, oro, serif), no videojuego.
4. Estado del modal con el store que ya exista (Zustand) o `useState`; si encaja, registrarlo en `ModalManager`. Sin duplicar confeti.
5. Verificar con clic real: puntos insuficientes, compra con puntos, compra con Incienso, desbloqueo, subida de grado y que los puntos bajan una sola vez.

## Fuera de esta lane
Admin, fiesta y cumpleaños.

## Al terminar
- `npm test`, `npx tsc --noEmit`, `npx eslint <lo tocado>` y `npx next build` en verde (si algo falla, decilo: no lo escondas).
- Si hay UI: capturas en escritorio 1440, móvil 390 y modo oscuro, más clic real; sin errores de consola.
- Borrar datos de prueba que hayas creado en la base.
- Commit(s) en esta rama. Agregar una fila a la tabla §8 de `vault/CARTAS_CATOLICAS.md` (qué hiciste, qué verificaste, qué quedó pendiente); si al mergear la rama anterior hay conflicto en esa tabla, conservar ambas filas.
- **No hagas merge a `dev` ni PR.** Avisá con un resumen corto y pasá a la siguiente lane.
