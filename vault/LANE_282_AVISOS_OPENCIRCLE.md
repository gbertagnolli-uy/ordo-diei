---
lane: 282
titulo: Aviso de terceros de opencircle en THIRD_PARTY_NOTICES.md
plane: "-"
estado: integrada
rama: task/lane-282-avisos-opencircle
agente: claude (X7)
actualizado: 2026-11-08
---

# Lane 282 — Aviso de terceros de opencircle

## Especificación
Al armar [[REPOS_EXTERNOS]] (2026-11-08) apareció que `src/lib/social/servidor/` tiene 4 archivos portados de devscalelabs/opencircle (AGPL-3.0) y `THIRD_PARTY_NOTICES.md` no tiene su sección. `vendor/opencircle/ORIGEN.md` lo había dejado para cuando la 271 estuviera en `origin/dev` (D8 de [[LANE_276_SOCIAL_OPENCIRCLE]]); ya lo está. Gabriel aprobó abrir esta lane.

Fuera de alcance: la revisión legal de las AGPL (D-BP2, la decide Gabriel) y las dependencias de D2 de la 276.

## Archivos en alcance
- `THIRD_PARTY_NOTICES.md` (modificar: sección opencircle)
- `vendor/opencircle/ORIGEN.md` (modificar: quitar el «se agrega cuando…»)

## Criterios de aceptación
- La sección sigue el formato de las demás (licencia, copia en `vendor/`, commit, cabecera de los portados, AGPL pendiente de revisión).
- Sin cambios de código.

## Gates
`npm test` · `npx tsc --noEmit` (vía `abrir-pr.sh`). Sin servidores (AGENTS.md regla 10).

## Pendientes

## Hallazgos
- De las dependencias D2 de la 276 solo están en `package.json` `remark-gfm` y `@hugeicons/react`; el resto no está instalado (no verifiqué por qué). No se tocó.

## Bitácora
- 2026-11-08 · claude (X7) · INICIO · worktree `ordo-diei-lanes/lane-282` desde dev `6b5b86f`
- 2026-11-08 · claude (X7) · FIN · sección opencircle en `THIRD_PARTY_NOTICES.md` + `ORIGEN.md` al día (`22d4315`). PR #88: 716 pass / 0 fail, tsc 0, Vercel OK; integrado (`e634b01`, merge commit). `limpiar-lane.sh 282` OK.
