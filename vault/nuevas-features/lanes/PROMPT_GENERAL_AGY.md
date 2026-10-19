# Prompt general para agentes (agy/Claude) — nuevas features

Trabajás en `ordo-diei`. Antes de tocar nada:
1. Leé `AGENTS.md` (reglas de git, worktrees, base de datos) y respetalo al pie de la letra: worktree propio desde `dev`, **nunca `prisma db push`**, entregar solo por Pull Request a `dev` con `scripts/abrir-pr.sh` (empezar con `scripts/nueva-lane.sh`, que sincroniza `dev` primero; nunca merge local ni push a `dev`).
2. Leé `vault/nuevas-features/DECISIONES.md` y el `SPEC.md` de tu feature; son la fuente de verdad. Si algo del SPEC choca con el código real, **no improvises**: anotalo en el vault y avisá.
3. Next.js de esta versión tiene cambios: leé `node_modules/next/dist/docs/` antes de escribir código.
4. UI: solo componentes prebuilt, sin duplicados, sin cambiar comportamientos existentes.
5. Cerrá con: tests, `tsc`, registro en `vault/nuevas-features/lanes/`, integración, limpieza del worktree.
La lane concreta se define en `LANES.md` (código N#/H#).
