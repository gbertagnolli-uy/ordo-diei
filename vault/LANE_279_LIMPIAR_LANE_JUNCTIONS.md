---
lane: 279
titulo: limpiar-lane.sh no debe seguir los junctions del worktree
plane: "-"
estado: integrada
rama: task/lane-279-limpiar-lane-junctions
agente: claude (orquestador)
actualizado: 2026-11-07
---

# Lane 279 — limpiar-lane.sh no debe seguir los junctions del worktree

## Especificación
Incidente 2026-11-07: al cerrar las lanes 262, 264, 273 y 278 (las que usaban un junction `node_modules → ordo-diei/node_modules`), `git worktree remove` **siguió el junction y vació `ordo-diei/node_modules`** del directorio principal; después falló con «Directory not empty» y dejó las carpetas a medio borrar (worktree ya desregistrado). Además Turbopack crea sus propios junctions en `.next/dev/node_modules/<paquete>-<hash>` que apuntan al `node_modules` que usa la lane (o sea, también al principal si la lane usa junction).

No se perdió código: se quitaron los enlaces a mano (`rmdir` sin `/s`), se borraron los restos y se reinstaló el principal con `npm ci` + `npx prisma generate` (tsc 0, sharp ok, árbol limpio).

## Decisiones
- D1 · Antes de `git worktree remove`, `limpiar-lane.sh` quita **todo** reparse point (junction o symlink) dentro del worktree **como enlace**, sin descender en él, y verifica que no quede ninguno. Si queda alguno, aborta sin borrar.

## Arquitectura
Función `quitar_enlaces` en `scripts/limpiar-lane.sh`, vía PowerShell (solo si existe; en Linux/macOS `git worktree remove` no sigue symlinks). Recorrido propio que no entra en los reparse points (no se confía en `Get-ChildItem -Recurse`). `[IO.Directory]::Delete(ruta, $false)` sobre un junction borra solo el enlace.

## Archivos en alcance
- `scripts/limpiar-lane.sh` (modificar)

## Microtareas
### M1 · `quitar_enlaces` antes de `git worktree remove` [orquestador]
- [x] hecha (`024c6d3`; ensayo con testigo ok; `bash -n` ok)

## Criterios de aceptación
- Ensayo: worktree de prueba con un junction a una carpeta con un archivo testigo y un junction anidado en `.next/` → tras `quitar_enlaces` el testigo sigue, no quedan enlaces.
- `bash -n scripts/limpiar-lane.sh` sin errores.

## Gates
`bash -n scripts/limpiar-lane.sh` · ensayo con testigo · `abrir-pr.sh` (npm test + tsc)

## Pendientes

## Hallazgos

## Bitácora
- 2026-11-07 · claude (orquestador) · INICIO · tras el incidente de limpieza de 262/264/273/278
- 2026-11-07 · claude (orquestador) · INTEGRADA · PR #81 a `dev` (merge commit); dev → main en PR #84 (lo integra Gabriel)
