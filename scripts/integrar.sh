#!/usr/bin/env bash
# Integra una rama de lane a dev de forma segura. Ver AGENTS.md ("Integrar a dev").
# Uso (desde el worktree de la lane):  scripts/integrar.sh
#
# Garantías:
#  - Un solo integrador a la vez (lock en el .git común): no importa el orden de las lanes.
#  - La rama ya contiene TODO dev antes de mergear, así que el merge a dev no puede
#    pisar ni revertir trabajo ajeno. Los conflictos se resuelven en la lane, nunca en dev.
#  - Si dev se movió mientras se validaba, se aborta y se repite (nunca se mergea a ciegas).
#  - No pushea, no fuerza, no toca la base de datos.
set -euo pipefail

die() { echo "✗ $*" >&2; exit 1; }

LANE_DIR=$(git rev-parse --show-toplevel)
RAMA=$(git -C "$LANE_DIR" rev-parse --abbrev-ref HEAD)
COMMON=$(git -C "$LANE_DIR" rev-parse --path-format=absolute --git-common-dir)
MAIN_DIR=$(dirname "$COMMON")
LOCK="$COMMON/integrar.lock"

[[ "$RAMA" == task/* ]] || die "Corré esto desde el worktree de una rama task/... (estás en '$RAMA')."
[[ "$LANE_DIR" != "$MAIN_DIR" ]] || die "No integres desde el directorio principal."
[[ -z "$(git -C "$LANE_DIR" status --porcelain)" ]] || die "La lane tiene cambios sin commitear. Commiteá primero."
[[ "$(git -C "$MAIN_DIR" rev-parse --abbrev-ref HEAD)" == "dev" ]] || die "El directorio principal no está en dev."
[[ -z "$(git -C "$MAIN_DIR" status --porcelain)" ]] || die "El directorio principal tiene cambios sin commitear (¿otro agente trabajando?). Esperá y reintentá."

# --- lock: un integrador a la vez -------------------------------------------
if ! mkdir "$LOCK" 2>/dev/null; then
  dueño=$(cat "$LOCK/info" 2>/dev/null || echo "desconocido")
  pid=$(cut -d' ' -f1 <<<"$dueño")
  if [[ "$pid" =~ ^[0-9]+$ ]] && ! kill -0 "$pid" 2>/dev/null; then
    echo "Lock huérfano ($dueño): el proceso ya no existe, lo libero."
    rm -rf "$LOCK"; mkdir "$LOCK"
  else
    die "Otro agente está integrando ($dueño). Esperá unos minutos y reintentá."
  fi
fi
trap 'rm -rf "$LOCK"' EXIT
echo "$$ $RAMA $(date -Is)" > "$LOCK/info"

# --- 1. traer dev a la lane (los conflictos se resuelven acá) ---------------
echo "→ Trayendo dev a $RAMA"
if ! git -C "$LANE_DIR" merge dev -m "Merge dev into $RAMA"; then
  git -C "$LANE_DIR" merge --abort || true
  die "Conflictos con dev. Resolvelos en la lane (git merge dev), conservando el trabajo de ambos lados, y reintentá."
fi
BASE_DEV=$(git -C "$MAIN_DIR" rev-parse dev)
git -C "$LANE_DIR" merge-base --is-ancestor dev HEAD || die "La rama no contiene dev; no se puede integrar."

# --- 2. validar el resultado combinado --------------------------------------
echo "→ Validando (tests + tsc) en la lane"
(cd "$LANE_DIR" && npm test --silent && npx tsc --noEmit) \
  || die "La validación falló con dev incluido. Arreglalo en la lane y reintentá."

# --- 3. dev no se pudo mover mientras tanto ---------------------------------
[[ "$(git -C "$MAIN_DIR" rev-parse dev)" == "$BASE_DEV" ]] \
  || die "dev avanzó durante la validación. Reintentá (se vuelve a traer dev y validar)."
[[ -z "$(git -C "$MAIN_DIR" status --porcelain)" ]] || die "El directorio principal se ensució durante la validación. Esperá y reintentá."

# --- 4. merge a dev: sólo posible porque dev es ancestro de la rama ---------
echo "→ Mergeando a dev"
git -C "$MAIN_DIR" merge --no-ff "$RAMA" -m "Merge branch '$RAMA' into dev"
# Verificación: el árbol de dev debe ser exactamente el de la rama (nada perdido).
[[ "$(git -C "$MAIN_DIR" rev-parse 'dev^{tree}')" == "$(git -C "$LANE_DIR" rev-parse 'HEAD^{tree}')" ]] \
  || die "¡El árbol de dev difiere de la rama tras el merge! No sigas; avisá al usuario."

echo "✓ $RAMA integrada a dev."
echo "  Falta: registrar en vault/ y limpiar:  git worktree remove $LANE_DIR && git branch -d $RAMA"
