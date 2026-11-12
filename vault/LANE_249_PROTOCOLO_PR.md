# Lane 249 — Protocolo de trabajo: lanes + Pull Request a `dev` + `dev` sincronizado antes de empezar

Rama `task/lane-249-protocolo-pr` (worktree `ordo-diei-lanes/lane-249`), base `dev`.

## Decisiones del usuario
1. **Siempre se trabaja en rama/lane** (rama `task/...` + worktree propio). Nunca en `dev` ni en `main`.
2. **A `dev` se entrega por Pull Request. No se mergea en local ni se hace push a `dev`**, porque trabajan varios agentes a la vez y en paralelo.
3. **Antes de empezar cualquier worktree se sincroniza `dev`, local y `origin`**: si `origin/dev` tiene un PR nuevo, se actualiza el local; si el local tiene trabajo sin publicar, se publica primero por PR. Cada trabajo arranca con lo que hizo antes cualquier otro agente.
4. Todo esto queda documentado para que todo agente trabaje así.
5. Se abre un PR a `dev` con **todo lo que había en `dev` local sin publicar** (14 commits, lanes 242 a 248), no solo el trabajo de un agente.

## Qué cambia
| Antes | Ahora |
| :--- | :--- |
| Merge local a `dev` con `scripts/integrar.sh` | PR con base `dev` (`scripts/abrir-pr.sh`), lo integra el usuario en GitHub con «Create a merge commit» |
| `dev` local podía quedar adelantado de `origin/dev` | `ordo-diei/` es un espejo de `origin/dev`; solo avanza con `merge --ff-only origin/dev` |
| Se creaba el worktree con `git worktree add` sin mirar `origin` | `scripts/nueva-lane.sh` hace `fetch`, actualiza `dev`, frena si hay commits locales sin publicar y recién crea la lane |
| Limpieza manual | `scripts/limpiar-lane.sh NN` verifica que la rama ya está en `origin/dev` antes de borrar |

## Archivos
- `AGENTS.md` (fuente única, reescrito), `PROTOCOLO_GIT.md`, `GUIA_GIT_RAPIDA.md` (secciones 1 y 5).
- `scripts/nueva-lane.sh`, `scripts/abrir-pr.sh`, `scripts/limpiar-lane.sh` (nuevos); `scripts/integrar.sh` queda como aviso de obsoleto (sale con error).
- `.gitattributes` (`*.sh` con LF también en Windows).
- `vault/nuevas-features/lanes/PROMPT_GENERAL_AGY.md` y `LANES.md`: referencias al flujo nuevo. Los documentos de lanes anteriores que citan `integrar.sh` son históricos y no se tocan.

## Trabajo local heredado
Los 14 commits de `dev` local sin publicar viajan en esta misma rama (nace de `dev`); al integrarse el PR con «Create a merge commit», `origin/dev` los contiene y el local se actualiza con `--ff-only`.

## Estado
PR abierto contra `dev`, a la espera de que el usuario lo integre.
