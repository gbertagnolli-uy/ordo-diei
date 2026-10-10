# Prompt general para agy — Cartas católicas

Copiar y pegar tal cual a agy.

---

Vas a implementar la feature de **cartas católicas coleccionables** de Ordo Diei, en 8 lanes (30 a 37). Cada lane tiene su propia rama y su propio worktree, y **trabajás de a una, en orden, de corrido**.

**Antes de tocar nada, leé completo `vault/CARTAS_CATOLICAS.md`** (cada worktree tiene su propia copia del vault; ya está actualizada con la ampliación del 2026-10-10: revelación progresiva por % de fragmentos, grados de veneración, Granos de Incienso, sobres de Meditación y Revelación). Ahí está el pedido textual del usuario (§1 y §1.1; el informe de referencia completo está en `vault/cartas/ref/INFORME_SISTEMAS_CARTAS.md`), las decisiones de diseño, el modelo de datos y las reglas. Si algo del prompt de una lane contradice ese documento, gana el documento y me avisás.

## Las lanes, en este orden

| Lane | Rama | Worktree |
|---|---|---|
| 30 | `task/lane-30-cartas-motor` | `../ordo-diei-lanes/lane-30` |
| 31 | `task/lane-31-cartas-datos` | `../ordo-diei-lanes/lane-31` |
| 32 | `task/lane-32-holocard` | `../ordo-diei-lanes/lane-32` |
| 33 | `task/lane-33-cartas-catalogo` | `../ordo-diei-lanes/lane-33` |
| 34 | `task/lane-34-cartas-coleccion` | `../ordo-diei-lanes/lane-34` |
| 35 | `task/lane-35-cartas-tienda` | `../ordo-diei-lanes/lane-35` |
| 36 | `task/lane-36-cartas-admin` | `../ordo-diei-lanes/lane-36` |
| 37 | `task/lane-37-cartas-eventos` | `../ordo-diei-lanes/lane-37` |

## Cómo trabajar cada lane

1. Entrá al worktree de la lane y leé **`AGY_PROMPT.md`** (está en la raíz del worktree; es la copia de `vault/cartas/lane-NN-*.md`). Ese es tu encargo: objetivo, entregables, qué queda fuera y cómo cerrar.
2. Las lanes son una **cadena**: la primera acción de cada lane (menos la 30) es `git merge <rama de la lane anterior>`, como dice su prompt. No te saltees ese paso: sin eso no tenés el código previo.
3. Hacé solo lo que dice el prompt de esa lane. No adelantes trabajo de la siguiente ni cambies comportamiento ajeno.
4. Al terminar, cumplí la sección "Al terminar" de su prompt: `npm test`, `npx tsc --noEmit`, `npx eslint` sobre lo tocado, `npx next build`, capturas y clic real si hay UI, datos de prueba borrados, commit en la rama, fila en el §8 del vault. Si algo falla o quedó pendiente, **decilo claro**, no lo maquilles.
5. Recién entonces pasá a la siguiente lane.

## Reglas que valen en todas

- **No hagas merge a `dev`, no hagas PR a `main`, no borres ramas ni worktrees.** El merge y la limpieza los hace el orquestador.
- Next.js 16 tiene cambios incompatibles con lo que conocés: leé `AGENTS.md` y `node_modules/next/dist/docs/` antes de usar una API de Next.
- UI **solo con componentes prearmados** (shadcn `radix-nova`, React Bits, MagicUI, Aceternity). No inventes componentes, no dupliques elementos de UI y no cambies funciones que no son de tu lane. Si el CLI de shadcn agrega imports desde `"cn"`, corregilos a `@/lib/utils` y desinstalá el paquete `cn`.
- **Reutilizá open source** (HoloCard de React Bits, romcal, zod, framer-motion, date-fns, `next/og`…) y programá solo lo que no existe.
- **Seguridad del contenido:** el servidor nunca envía historia, oración, frase ni datos del datasheet que el usuario todavía no desbloqueó (decisión D13); el cliente solo muestra lo que recibe.
- **No copies código de `ashishbarthwal/creator-gacha-card-game`**: no tiene licencia de reuso. Solo se usa la idea del sorteo por bandas, implementada desde cero.
- Nada de YouTube, Google, batallas, ataque ni defensa.
- Solo la lane 31 toca `prisma/schema.prisma`. **No usar `prisma db push`** (prohibido, ver regla 6 de `AGENTS.md`): generar el SQL con `prisma migrate diff`, aplicarlo con `prisma db execute` solo si no tiene `DROP`. Reiniciá `next dev` después de `prisma generate`. La base es la real (Supabase, schema `family_tasker`): usá datos de prueba y borralos.
- Textos de la app en español rioplatense. Estética solemne y católica tradicional, no "videojuego".

## Cuando termines las 8

Dejame un resumen por lane: qué entregaste, qué verificaste (comandos y resultados reales), qué quedó pendiente y cualquier decisión que hayas tenido que tomar. Si alguna lane se trabó, avisame en ese momento en vez de seguir con las siguientes.
