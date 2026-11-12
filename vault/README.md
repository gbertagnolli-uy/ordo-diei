# Vault de Ordo Diei

**Ubicación única:** `C:\Users\evoxu\Downloads\Agencia\Dev\18_OrdoDiei\vault\` — en la raíz del proyecto, al lado de `ordo-diei/` (el repo) y `ordo-diei-lanes/` (los worktrees).
- desde `ordo-diei/`: `../vault/`
- desde un worktree `ordo-diei-lanes/lane-NN/`: `../../vault/`

Es la **fuente única de conocimiento** del proyecto para todos los agentes (Claude, agy, dsh, opencode…) y para Gabriel: proceso de trabajo, pendientes, decisiones e información. **No está en git** (decisión de Gabriel, 2026-11-06): no viaja en las ramas ni se borra al limpiar un worktree; se escribe directo acá y lo ven todos al instante. Cuando un documento o código dice `vault/<algo>`, se refiere a esta carpeta.

## Qué hay

| Archivo / carpeta | Qué es | Quién lo edita |
|---|---|---|
| `README.md` | Este protocolo | Orquestador |
| `BACKLOG_PLANE.md` | Mapa Plane → lanes, olas, decisiones generales | Orquestador |
| `PROTOCOLO_AGY.md` | Cómo se delegan microtareas a agy y cómo se verifican | Orquestador |
| `REPOS_EXTERNOS.md` | **Repos de terceros** usados o consultados: commit, licencia, qué se tomó, dónde quedó en el código. Clones completos en `18_OrdoDiei/repos-externos/` (fuera de git). Mirarlo antes de clonar o volver a consultar un repo | Quien suma o usa un repo |
| `_PLANTILLA_LANE.md` | Plantilla de una lane | Orquestador |
| `LANE_NN_TEMA.md` | **Una por lane**: especificación, arquitectura, microtareas, bitácora, pendientes, hallazgos | El agente que trabaja la lane |
| `TEMA.md` (ej. `HABITOS_Y_NIVELES.md`) | Documentos vivos de un tema (reglas de negocio, decisiones) | La lane que cambia ese tema |
| `cartas/`, `nuevas-features/`… | Material de un tema | La lane del tema |

Regla de oro: **un tema, un documento**. Antes de crear un archivo nuevo, buscá el que ya cubre el tema (`ls`, `grep -ril <tema> .`) y actualizalo.

## Protocolo de registro (obligatorio, para trabajar en paralelo sin pisarse)

Cada lane tiene **su propio** `LANE_NN_*.md`. Nadie escribe en el archivo de otra lane: así varios agentes escriben a la vez sin pisarse. El estado de una lane vive en el *frontmatter* de su archivo:

```yaml
---
lane: 263
titulo: Botón «Iniciar» duplicado en la tarea
plane: "#20"
estado: reservada        # reservada | en-curso | bloqueada | en-revision | integrada
rama: task/lane-263-boton-iniciar-duplicado
agente: "-"              # quién la tiene ahora: claude, agy, dsh…
actualizado: 2026-11-06
---
```

### Al EMPEZAR (antes de tocar cualquier archivo del repo)

1. `bash scripts/tablero.sh` (desde el repo o un worktree): muestra todas las lanes del vault con su estado y agente. Si otra lane `en-curso` toca tus mismos archivos (sección «Archivos en alcance»), **no empieces**: avisá al orquestador.
2. Si la lane no existe todavía: número libre (mirá el tablero, `git branch -a --list '*task/lane-*'` y `gh pr list --base dev`) y copiá `_PLANTILLA_LANE.md` a `LANE_NN_TEMA.md`.
3. Creá rama y worktree: `bash scripts/nueva-lane.sh NN slug` (acepta números cuyo `LANE_NN_*.md` está en `estado: reservada`).
4. En **tu** `LANE_NN_*.md` del vault: `estado: en-curso`, `agente: <vos>`, `actualizado: <hoy>`, y al final de `## Bitácora`:
   `- 2026-11-06 14:30 · agy · INICIO · M1–M3`

### Mientras trabajás

- Tildá `[x]` cada microtarea terminada; anotá en `## Hallazgos` lo que descubras y en `## Pendientes` lo que quede abierto (con el porqué).
- Si algo de la especificación no cierra, **no lo inventes**: `estado: bloqueada`, explicalo en `## Pendientes` y avisá.

### Al TERMINAR (o al cortar, aunque no esté completo)

1. En `## Bitácora`: `- 2026-11-06 17:10 · agy · FIN · M1–M3 hechas; gates verdes (npm test, tsc)`.
2. `estado: en-revision` (PR abierto, con el link en la bitácora) o `bloqueada` (con el motivo).
3. Si cambiaste reglas de un tema, actualizá su documento vivo.
4. Cuando el PR se integra y se limpia la lane (`scripts/limpiar-lane.sh NN`): `estado: integrada` y línea `INTEGRADA · PR #N`.
   - `limpiar-lane.sh` quita los junctions del worktree antes de borrarlo (lane 279). Nunca borres un worktree a mano con `rm -rf`/`Remove-Item -Recurse` sin quitar antes sus junctions (`node_modules`, `.next/dev/node_modules/*`): se sigue el enlace y se vacía el `node_modules` del principal (pasó el 2026-11-07).

**Flujo de integración (D-FLUJO, Gabriel 2026-11-07):** la lane se entrega con `scripts/abrir-pr.sh` (PR a `dev`) y el agente lo integra con `gh pr merge N --merge` (merge commit, sin force ni rebase); `dev` → `main` va por PR que integra Gabriel. Detalle en `LANE_256` › Decisiones y en AGENTS.md regla 5.

No hace falta commitear nada del vault: no está en git. El PR describe el cambio de código; el vault guarda el conocimiento.

## Servidores: nunca sin permiso (decisión de Gabriel, 2026-11-07)
**Ningún agente levanta servidores sin permiso explícito de Gabriel**: ni `next dev`, ni `next start`, ni `next build`, ni la base local (`verif-db/iniciar.mjs`), ni navegadores de prueba (Playwright). Consumen toda la RAM de la máquina. **Las pruebas visuales las hace Gabriel.** Los gates del agente son `npm test`, `tsc --noEmit` y `eslint`. Registrado en AGENTS.md (regla 10).

## Base local de verificación (solo con permiso de Gabriel, ver arriba)
Postgres embebido fuera de git en `18_OrdoDiei/verif-db/` (puerto 55432, familia de prueba con PIN `1234`). Instrucciones en `verif-db/README.md`. **Nunca** se prueba visitando `/dashboard` contra Supabase: escribe datos de producción.

## Ver el estado de todas las lanes

```bash
bash scripts/tablero.sh          # lanes no integradas
bash scripts/tablero.sh --todas  # también las integradas
```
