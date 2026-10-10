# Lane 31 — Datos y API de cartas

- **Rama:** `task/lane-31-cartas-datos` · **Worktree:** `../ordo-diei-lanes/lane-31`
- **Parte de:** lane 30 (`task/lane-30-cartas-motor`)
- **Plan maestro (leer primero, entero):** `vault/CARTAS_CATOLICAS.md` — §1 pedido textual, §3 decisiones, §4 datos, §6 reglas.

## Al empezar
1. `git status` limpio y estás en `task/lane-31-cartas-datos`.
2. `git merge task/lane-30-cartas-motor` (rama local; resolvé conflictos si los hay).
3. Leer `AGENTS.md` y la guía relevante en `node_modules/next/dist/docs/` antes de usar cualquier API de Next 16.
4. Reglas fijas: UI solo con componentes prearmados (shadcn `radix-nova`, React Bits, MagicUI), sin duplicar elementos de UI ni cambiar comportamiento ajeno; reutilizar open source; **no copiar código de `ashishbarthwal/creator-gacha-card-game`** (sin licencia de reuso); textos en español rioplatense; nada de YouTube/Google/batallas/ataque/defensa.

## Objetivo
Persistencia y endpoints. **Es la única lane que toca `prisma/schema.prisma`.**

## Entregables
1. Modelos y enums del vault §4 (`Carta`, `CartaUsuario`, `MovimientoFragmento`, `ReclamoCarta`, relaciones inversas en `Usuario`). `@@map` con nombres en español como los de `Habito*`. `npx prisma db push` **sin** `--accept-data-loss` (solo aditivo) y `npx prisma generate`. Reiniciar `next dev` después.
2. `src/lib/cartas/server.ts` (patrón de `src/lib/habitos/server.ts`): `hoyEnFamilia`, listar catálogo con progreso del usuario, detalle por `clave`, comprar (sobre normal, sobre devoto, fragmentos de carta elegida), reclamar fiesta, reclamar cumpleaños, `eventosDeHoy(usuarioId)`.
3. **Transacciones atómicas e idempotentes**: el descuento de `availablePoints`, el aumento de fragmentos y el movimiento van en una sola transacción; puntos nunca negativos; doble clic o dos pestañas no pueden cobrar ni reclamar dos veces (clave única de `ReclamoCarta`; ojo con `cartaId` nulo en Postgres → usar el centinela documentado en §4). Todo resultado (qué cartas, cuántos fragmentos, si desbloqueó) se **resuelve en el servidor y se devuelve** para que la UI solo lo muestre.
4. API (sesión con `getSession`, igual que `/api/habitos`): `GET /api/cartas`, `GET /api/cartas/[clave]`, `POST /api/cartas/comprar`, `POST /api/cartas/reclamar` (`tipo: fiesta|cumple`, `cartaId?`), `GET /api/cartas/eventos`. Cada usuario solo opera su colección. Errores en español.
5. `scripts/seed-cartas.ts` (o equivalente al de hábitos): carga idempotente desde `src/lib/cartas/catalogo/*.json` validando con el zod de la lane 30; no pisa cartas con `editadaManual=true`. Hasta que exista el catálogo (lane 33), crear **3 cartas de prueba** en un JSON aparte `catalogo/_demo.json` que la lane 33 reemplazará.
6. Tests de la capa de servicio con `node:test` donde se pueda sin DB y **verificación real de la API** contra `next dev` en un puerto libre (patrón de lanes 18/21) con usuarios de prueba: compra con puntos insuficientes (rechaza), compra válida, desbloqueo, fiesta reclamada dos veces (segunda falla), cumpleaños, permisos entre usuarios. Borrar los datos de prueba.

## Fuera de esta lane
UI, HoloCard, catálogo final, admin.

## Al terminar
- `npm test`, `npx tsc --noEmit`, `npx eslint <lo tocado>` y `npx next build` en verde (si algo falla, decilo: no lo escondas).
- Si hay UI: capturas en escritorio 1440, móvil 390 y modo oscuro, más clic real; sin errores de consola.
- Borrar datos de prueba que hayas creado en la base.
- Commit(s) en esta rama. Agregar una fila a la tabla §8 de `vault/CARTAS_CATOLICAS.md` (qué hiciste, qué verificaste, qué quedó pendiente).
- **No hagas merge a `dev` ni PR.** Avisá con un resumen corto y pasá a la siguiente lane.
