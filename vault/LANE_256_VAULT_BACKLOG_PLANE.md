---
lane: 256
titulo: Vault global + backlog de Plane en lanes
plane: "-"
estado: integrada
rama: task/lane-256-vault-backlog-plane
agente: claude (orquestador)
actualizado: 2026-11-07
---

# Lane 256 — Vault global + backlog de Plane en lanes

## Especificación
Pedido de Gabriel (2026-11-06): leer el backlog de Plane (proyecto `evox/d43d72bc…`) con `PLANE_KEY`, crear una lane por ítem (menos «Ideas»), documentar todo en un **vault** donde cada agente registra al empezar y al terminar para que varios trabajen en paralelo, explicarlo en `AGENTS.md`, y preparar cada lane con especificación, arquitectura y microtareas delegables a agy sin margen de error.
Corrección de Gabriel: «el vault debe ser global sin importar la lane … por eso debe ir en la raíz» → D-BP6.

## Decisiones
- **D-FLUJO · Gabriel, 2026-11-07** (reemplaza «el agente no mergea su PR» y «prohibido PR a main»): «el merge a dev está permitido, a donde hay que hacer PR es a main, siempre sin sobreponer trabajo ni sobreescribir trabajo». Se aplica así: (1) cada lane se entrega con `scripts/abrir-pr.sh` (trae origin/dev, valida, PR a dev); (2) el agente integra ese PR en GitHub con merge commit (`gh pr merge N --merge`), nunca squash/rebase, nunca merge local a dev, push directo a dev ni push forzado; si hay conflicto se resuelve en la lane conservando ambos lados; (3) de `dev` a `main` se entrega por PR (`gh pr create --base main --head dev`), que integra Gabriel.
Ver `BACKLOG_PLANE.md` (D-BP1 a D-BP8).

## Qué se hizo
- **Vault global** `18_OrdoDiei/vault/` (fuera de git): copia de los 139 documentos del vault del repo + `README.md` (protocolo), `BACKLOG_PLANE.md`, `PROTOCOLO_AGY.md` (con «Receta de port»), `_PLANTILLA_LANE.md` y 22 `LANE_NN_*.md` (256–277).
- **Repo** (esta rama):
  - `AGENTS.md`: sección «Vault: dónde se documenta y cómo se registra (OBLIGATORIO)»; reglas 3 y 8 apuntan al vault global.
  - `scripts/nueva-lane.sh`: busca el vault global; permite empezar una lane con archivo `estado: reservada`.
  - `scripts/tablero.mjs` + `scripts/tablero.sh`: tablero de lanes del vault global (`--todas` incluye integradas).
  - `.gitignore`: `/vault/`. `vault/` sale del repo (243 archivos; historia en `git log -- vault/`).
  - `scripts/reposo/ref/{seleccion-citas,torres-amat-correcciones}.txt`: movidos desde el vault (los lee `scripts/reposo/generar-frases.ts`, actualizado).
- **Specs**: 263, 266, 267, 268, 269, 260, 275 (ola 1, exactas); 258, 261, 262, 264, 265, 273, 259, 257, 274 (exactas, con pasos de diagnóstico u OK de Gabriel donde corresponde); 271, 272, 270, 276 (datos/servidor exactos + receta de port); 277 nueva (bloqueada por decisión).
- **Repos de referencia** clonados (commits en `BACKLOG_PLANE.md`): opencircle, bookorbit, homebranch (+ web y api), dovli, Daily_You, storypad, moodiary.

## Archivos en alcance
`AGENTS.md` · `.gitignore` · `scripts/nueva-lane.sh` · `scripts/tablero.mjs` · `scripts/tablero.sh` · `scripts/reposo/generar-frases.ts` · `scripts/reposo/ref/*` · `vault/**` (borrado)

## Gates
`npx tsc --noEmit` · `npm test` · `bash -n scripts/nueva-lane.sh` · `bash scripts/tablero.sh`

## Pendientes (para Gabriel y el orquestador)
- **Base local de verificación**: LANE_198 describía un Postgres embebido en `dev/_verif` (puerto 55432) que ya no existe. Las pruebas visuales de 261, 262, 264, 273, 259, 274 y las `[orquestador]` de prueba lo necesitan (visitar `/dashboard` escribe datos de producción: `registrarIngreso`, `otorgarCofreDelDia`, `generarTareasRecurrentes`). Recrearlo antes de la ola 2.
- Decisiones de Gabriel: LANE_277 (D1–D4), 257 (lista de hábitos y virtudes, mínimo del resumen), 258 (ejemplos y fuente), 259 D1, 264 D1, 268 M6, 274 D1, 276 D1/D3, licencias (D-BP2).
- Los repos de referencia están en el scratchpad de la sesión (temporal): si se pierden, se vuelven a clonar con los commits de `BACKLOG_PLANE.md`; la fase 0 de cada lane grande los copia a `vendor/`.

## Hallazgos
- Verificación de cobertura (2026-11-07, API de Plane, 33 ítems, sin más páginas): los 21 ítems en estado Backlog son #5, #10, #11, #17–#27, #29–#35. Fuera de «Ideas» (#27), los 20 tienen lane: #5→257, #10→258, #11→259, #17→260, #18→261, #19→262, #20→263, #21→264, #22→265, #23→266, #24→267, #25→268, #26→269, #29→270, #30→271, #31→272, #32→273, #33→274, #34→275, #35→276. #14 y #15 están «In Progress» (no backlog) y el resto «Done». 277 (archivos grandes) y 278 (ola 3 del sidebar) son lanes de soporte creadas por el orquestador.
- `src/lib/cartas/server.ts` calcula el umbral del siguiente grado con `floor` y `gradoDe` con `ceil` (con requisito impar, p. ej. 5 y 7 fragmentos, muestra mal): lo corrige la 260.
- `PerfilResumen` + `/api/cartas` al ver el perfil de otro usuario muestra las cartas propias: anotado, sin lane todavía.
- `src/app/agenda/page.tsx` proyecta en el servidor con la hora del servidor (UTC en Vercel): anotado en LANE_273.
- La rutina se guardaba solo en `localStorage` y una variable en memoria del servidor: lo resuelve la 259.

## Bitácora
- 2026-11-06 · claude (orquestador) · INICIO · vault + AGENTS.md + specs de ola 1
- 2026-11-07 · claude (orquestador) · avance · vault movido a la raíz (D-BP6), specs 257–277 completas, LANE_277 nueva
- 2026-11-07 · claude (orquestador) · cobertura del backlog de Plane verificada por API: 20/20 ítems con lane (Ideas excluido).
- 2026-11-07 · claude (orquestador) · ENTREGA · PR #58 a dev (`scripts/abrir-pr.sh`: origin/dev incluido, tests + tsc verdes) con OK de Gabriel. Lo integra Gabriel; después `scripts/limpiar-lane.sh 256`.
- 2026-11-07 · claude (orquestador) · D-FLUJO registrada; AGENTS.md y README del vault se actualizan en esta misma lane.
- 2026-11-07 · claude (orquestador) · INTEGRADA · PR #58 a `dev` (merge commit); dev → main en PR #84 (lo integra Gabriel)
