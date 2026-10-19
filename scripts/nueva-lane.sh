#!/usr/bin/env bash
# Empieza una lane: sincroniza dev (local y origin) y crea la rama + el worktree. Ver AGENTS.md.
# Uso (desde cualquier lugar del repo):  scripts/nueva-lane.sh NN descripcion-corta
#
# Garantías:
#  - Todo trabajo arranca con lo que hicieron antes los demás agentes: dev local == origin/dev.
#  - Si origin/dev tiene commits nuevos, el dev local se actualiza (solo fast-forward).
#  - Si el dev local tiene commits sin publicar, no se empieza: primero se publican por PR.
#  - No pushea, no fuerza, no toca la base de datos.
set -euo pipefail

die() { echo "✗ $*" >&2; exit 1; }

[[ $# -eq 2 ]] || die "Uso: scripts/nueva-lane.sh NN descripcion-corta   (ej: scripts/nueva-lane.sh 250 menu-compañero)"
NN=$1
SLUG=$2
[[ "$NN" =~ ^[0-9]+$ ]] || die "NN tiene que ser el número de lane (solo dígitos)."
[[ "$SLUG" =~ ^[a-z0-9]+(-[a-z0-9]+)*$ ]] || die "La descripción va en minúsculas, sin tildes ni espacios, separada con guiones (ej: menu-companero)."

COMMON=$(git rev-parse --path-format=absolute --git-common-dir)
MAIN_DIR=$(dirname "$COMMON")
RAMA="task/lane-$NN-$SLUG"
LANE_DIR="$(cd "$MAIN_DIR/.." && pwd)/ordo-diei-lanes/lane-$NN"

[[ "$(git -C "$MAIN_DIR" rev-parse --abbrev-ref HEAD)" == "dev" ]] || die "El directorio principal tiene que estar en dev."
[[ -z "$(git -C "$MAIN_DIR" status --porcelain)" ]] || die "El directorio principal tiene cambios sin commitear (¿otro agente trabajando?). Esperá y reintentá."

# --- 1. sincronizar dev: local == origin ------------------------------------
echo "→ Trayendo origin"
git -C "$MAIN_DIR" fetch origin --prune
git -C "$MAIN_DIR" rev-parse --verify -q origin/dev >/dev/null || die "No existe origin/dev."

ADELANTE=$(git -C "$MAIN_DIR" rev-list --count origin/dev..dev)
ATRAS=$(git -C "$MAIN_DIR" rev-list --count dev..origin/dev)

if [[ "$ADELANTE" -gt 0 && "$ATRAS" -gt 0 ]]; then
  die "dev local y origin/dev divergieron ($ADELANTE commits locales sin publicar, $ATRAS en origin que no tenés). No los mezcles a mano: avisá al usuario."
elif [[ "$ADELANTE" -gt 0 ]]; then
  die "El dev local tiene $ADELANTE commit(s) que no están en origin/dev (trabajo sin publicar). No empieces otra tarea sin publicarlo: abrí un PR con ese trabajo (ver AGENTS.md, «Trabajo local sin publicar») y esperá a que se integre."
elif [[ "$ATRAS" -gt 0 ]]; then
  echo "→ Actualizando dev local con $ATRAS commit(s) nuevo(s) de origin/dev"
  CAMBIOS=$(git -C "$MAIN_DIR" diff --name-only dev origin/dev)
  git -C "$MAIN_DIR" merge --ff-only origin/dev
  if grep -qE '^prisma/schema\.prisma$|^package-lock\.json$' <<<"$CAMBIOS"; then
    echo "  Ojo: cambió prisma/schema.prisma o package-lock.json. Corré 'npx prisma generate' y 'npm install' en la lane."
  fi
else
  echo "→ dev local y origin/dev ya coinciden ($(git -C "$MAIN_DIR" rev-parse --short dev))"
fi

# --- 2. el número y el nombre de lane no pueden estar usados ----------------
if git -C "$MAIN_DIR" for-each-ref --format='%(refname:short)' "refs/heads/task/lane-$NN-*" "refs/remotes/origin/task/lane-$NN-*" | grep -q .; then
  die "Ya existe una rama para la lane $NN. Elegí el siguiente número libre."
fi
if compgen -G "$MAIN_DIR/vault/LANE_${NN}_*" >/dev/null; then
  die "Ya existe vault/LANE_${NN}_*. Elegí el siguiente número libre."
fi
if command -v gh >/dev/null 2>&1; then
  if gh pr list --base dev --state open --json headRefName --jq '.[].headRefName' 2>/dev/null | grep -q "^task/lane-$NN-"; then
    die "Hay un PR abierto de la lane $NN. Elegí el siguiente número libre."
  fi
fi
[[ ! -e "$LANE_DIR" ]] || die "Ya existe $LANE_DIR."

# --- 3. crear la lane --------------------------------------------------------
git -C "$MAIN_DIR" worktree add -b "$RAMA" "$LANE_DIR" dev
echo "✓ Lane lista: $RAMA"
echo "  cd \"$LANE_DIR\" && npm install"
