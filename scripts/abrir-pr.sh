#!/usr/bin/env bash
# Entrega una lane: trae origin/dev, valida, publica la rama y abre el Pull Request a dev. Ver AGENTS.md.
# Uso (desde el worktree de la lane, con todo commiteado):  scripts/abrir-pr.sh [-t "titulo"] [-b archivo-cuerpo.md]
#
# Garantías:
#  - La rama ya contiene TODO origin/dev antes de publicar: los conflictos se resuelven en la lane, nunca en dev.
#  - Se valida (tests + tsc) el resultado combinado, no solo tu cambio.
#  - Lo único que se pushea es tu rama task/...; nunca dev. No mergea el PR, no fuerza, no toca la base de datos.
set -euo pipefail

die() { echo "✗ $*" >&2; exit 1; }

TITULO=""
CUERPO=""
while getopts "t:b:" opt; do
  case $opt in
    t) TITULO=$OPTARG ;;
    b) CUERPO=$OPTARG ;;
    *) die "Uso: scripts/abrir-pr.sh [-t titulo] [-b archivo-cuerpo.md]" ;;
  esac
done

command -v gh >/dev/null 2>&1 || die "Falta la CLI de GitHub (gh). Instalala y corré 'gh auth login'."

LANE_DIR=$(git rev-parse --show-toplevel)
RAMA=$(git -C "$LANE_DIR" rev-parse --abbrev-ref HEAD)
COMMON=$(git -C "$LANE_DIR" rev-parse --path-format=absolute --git-common-dir)
MAIN_DIR=$(dirname "$COMMON")

[[ "$RAMA" == task/* ]] || die "Corré esto desde el worktree de una rama task/... (estás en '$RAMA')."
[[ "$LANE_DIR" != "$MAIN_DIR" ]] || die "No abras PRs desde el directorio principal."
[[ -z "$(git -C "$LANE_DIR" status --porcelain)" ]] || die "La lane tiene cambios sin commitear. Commiteá primero."
git -C "$LANE_DIR" fetch origin --prune
[[ "$(git -C "$LANE_DIR" rev-list --count origin/dev..HEAD)" -gt 0 ]] || die "La rama no tiene commits propios respecto de origin/dev: no hay nada para entregar."

# --- 1. traer origin/dev a la lane (los conflictos se resuelven acá) --------
echo "→ Trayendo origin/dev a $RAMA"
if ! git -C "$LANE_DIR" merge origin/dev -m "Merge origin/dev into $RAMA"; then
  git -C "$LANE_DIR" merge --abort || true
  die "Conflictos con origin/dev. Resolvelos en la lane (git merge origin/dev), conservando el trabajo de ambos lados, y reintentá."
fi
git -C "$LANE_DIR" merge-base --is-ancestor origin/dev HEAD || die "La rama no contiene origin/dev; no se puede entregar."

# --- 2. validar el resultado combinado --------------------------------------
echo "→ Validando (tests + tsc) con origin/dev incluido"
(cd "$LANE_DIR" && npm test --silent && npx tsc --noEmit) \
  || die "La validación falló con origin/dev incluido. Arreglalo en la lane y reintentá."

# --- 3. publicar SOLO la rama de la lane ------------------------------------
echo "→ Publicando $RAMA"
git -C "$LANE_DIR" push -u origin "$RAMA"

# --- 4. abrir (o reutilizar) el PR a dev ------------------------------------
if URL=$(gh pr view "$RAMA" --json url,state --jq 'select(.state=="OPEN") | .url' 2>/dev/null) && [[ -n "$URL" ]]; then
  echo "✓ El PR ya estaba abierto y quedó actualizado con la rama: $URL"
  exit 0
fi

[[ -n "$TITULO" ]] || TITULO=$(git -C "$LANE_DIR" log -1 --no-merges --pretty=%s origin/dev..HEAD)
if [[ -z "$CUERPO" ]]; then
  CUERPO=$(mktemp)
  {
    echo "## Qué incluye"
    git -C "$LANE_DIR" log --no-merges --pretty='- %s' origin/dev..HEAD
    echo
    echo "## Cómo integrarlo"
    echo "Base \`dev\`. Integrar con **Create a merge commit** (no squash, no rebase). Ver AGENTS.md."
  } > "$CUERPO"
fi

gh pr create --base dev --head "$RAMA" --title "$TITULO" --body-file "$CUERPO"
echo "✓ PR abierto contra dev. No lo mergees vos: lo integra el usuario. Después: scripts/limpiar-lane.sh <NN> (desde ordo-diei/)."
