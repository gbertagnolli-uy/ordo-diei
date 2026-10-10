# Lane 31 — Datos y API de cartas

- **Rama:** `task/lane-31-cartas-datos` · **Worktree:** `../ordo-diei-lanes/lane-31`
- **Parte de:** lane 30 (`task/lane-30-cartas-motor`)
- **Plan maestro (leer primero, entero):** `vault/CARTAS_CATOLICAS.md` — §1 y §1.1 pedido textual, §2.4 informe, §3 decisiones (D1–D18), §4 datos, §6 reglas. El informe completo está en `vault/cartas/ref/INFORME_SISTEMAS_CARTAS.md`.

## Al empezar
1. `git status` limpio y estás en `task/lane-31-cartas-datos`.
2. `git merge task/lane-30-cartas-motor` (rama local; resolvé conflictos si los hay).
3. Leer `AGENTS.md` y la guía relevante en `node_modules/next/dist/docs/` antes de usar cualquier API de Next 16.
4. Reglas fijas: UI solo con componentes prearmados (shadcn `radix-nova`, React Bits, MagicUI), sin duplicar elementos de UI ni cambiar comportamiento ajeno; reutilizar open source; **no copiar código de `ashishbarthwal/creator-gacha-card-game`** (sin licencia de reuso); textos en español rioplatense (rótulos en `src/lib/cartas/textos.ts`); nada de YouTube/Google/batallas/ataque/defensa.

## Objetivo
Persistencia y endpoints. **Es la única lane que toca `prisma/schema.prisma`.**

## Entregables
1. Modelos y enums del vault §4 (`Carta`, `CartaUsuario`, `MovimientoFragmento`, `ReclamoCarta`, `Usuario.incienso`, relaciones inversas). `@@map` en español como `Habito*`. `npx prisma db push` **sin** `--accept-data-loss` y `npx prisma generate`; reiniciar `next dev`.
2. `src/lib/cartas/server.ts` (patrón de `src/lib/habitos/server.ts`): listar catálogo con progreso, detalle por `clave`, comprar (Meditación, Revelación, fragmentos de carta elegida con puntos o con Incienso), reclamar fiesta, reclamar cumpleaños, `eventosDeHoy(usuarioId)`. Los fragmentos se aplican siempre con `aplicarFragmentos` (tope, grados, conversión a Incienso). En compras, aplicar `multiplicadorTienda` (bono de fiesta).
3. **Contenido redactado en el servidor (D13)**: `GET /api/cartas` y `GET /api/cartas/[clave]` devuelven la salida de `contenidoVisible` según los fragmentos del usuario. **Nunca** incluyen historia, oración, frase ni datos del datasheet que el usuario aún no desbloqueó (ni en la lista ni en el detalle). El nombre y la fecha de celebración siempre van.
4. **Transacciones atómicas e idempotentes**: descuento de `availablePoints` o `incienso`, fragmentos, Incienso ganado y movimiento en una sola transacción; nada negativo; doble clic o dos pestañas no pueden cobrar ni reclamar dos veces (clave única de `ReclamoCarta`; centinela para `cartaId` nulo). Cada operación **devuelve el resultado resuelto** (qué cartas, cuántos fragmentos, si desbloqueó, si subió de grado, Incienso ganado) para que la UI solo lo muestre.
5. API (sesión con `getSession`, como `/api/habitos`): `GET /api/cartas`, `GET /api/cartas/[clave]`, `POST /api/cartas/comprar`, `POST /api/cartas/reclamar` (`tipo: fiesta|cumple`, `cartaId?`), `GET /api/cartas/eventos`. Cada usuario solo opera su colección. Errores en español.
6. `scripts/seed-cartas.ts`: carga idempotente desde `src/lib/cartas/catalogo/*.json` validando con el zod de la lane 30; no pisa cartas con `editadaManual=true`. Hasta la lane 33, crear **3 cartas de prueba** (una por rareza distinta, datasheet de ≥ 4 datos) en `catalogo/_demo.json`.
7. Verificación real contra `next dev` en un puerto libre con usuarios de prueba: compra con puntos insuficientes (rechaza), compra válida, **respuestas con contenido oculto en 0, 10, 30, 60 y 100 %** (comprobar que los textos bloqueados no viajan), desbloqueo, subida de grado, excedente → Incienso, compra con Incienso, fiesta reclamada dos veces (la segunda falla), cumpleaños, permisos entre usuarios. Borrar los datos de prueba.

## Fuera de esta lane
UI, HoloCard, catálogo final, admin.

## Al terminar
- `npm test`, `npx tsc --noEmit`, `npx eslint <lo tocado>` y `npx next build` en verde (si algo falla, decilo: no lo escondas).
- Si hay UI: capturas en escritorio 1440, móvil 390 y modo oscuro, más clic real; sin errores de consola.
- Borrar datos de prueba que hayas creado en la base.
- Commit(s) en esta rama. Agregar una fila a la tabla §8 de `vault/CARTAS_CATOLICAS.md` (qué hiciste, qué verificaste, qué quedó pendiente); si al mergear la rama anterior hay conflicto en esa tabla, conservar ambas filas.
- **No hagas merge a `dev` ni PR.** Avisá con un resumen corto y pasá a la siguiente lane.
