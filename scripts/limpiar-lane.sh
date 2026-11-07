#!/usr/bin/env bash
# Cierra una lane cuyo PR ya se integró: actualiza dev local, quita el worktree y borra la rama. Ver AGENTS.md.
# Uso (desde ordo-diei/):  scripts/limpiar-lane.sh NN
#
# Garantías:
#  - No borra nada si la rama todavía no está en origin/dev (PR sin integrar).
#  - dev local solo avanza por fast-forward desde origin/dev. No pushea, no fuerza.
set -euo pipefail

die() { echo "✗ $*" >&2; exit 1; }

# Quita los junctions/symlinks del worktree COMO ENLACE, sin entrar en ellos.
# En Windows `git worktree remove` sigue los junctions y borra su destino: el 2026-11-07 vació
# ordo-diei/node_modules (lanes con junction node_modules, y Turbopack crea más en .next/). Ver vault LANE_279.
quitar_enlaces() {
  command -v powershell >/dev/null 2>&1 || return 0
  local win; win=$(cygpath -w "$1")
  powershell -NoProfile -Command "
    function Enlaces(\$p) { foreach (\$c in Get-ChildItem -LiteralPath \$p -Force -ErrorAction SilentlyContinue) {
      if (\$c.Attributes -band [IO.FileAttributes]::ReparsePoint) { \$c } elseif (\$c.PSIsContainer) { Enlaces \$c.FullName } } }
    foreach (\$e in @(Enlaces '$win')) {
      if (\$e.PSIsContainer) { [IO.Directory]::Delete(\$e.FullName, \$false) } else { [IO.File]::Delete(\$e.FullName) } }
    if (@(Enlaces '$win').Count -gt 0) { exit 1 }
  " || die "No pude quitar los enlaces de $1. No borro el worktree: revisalo."
}

[[ $# -eq 1 && "$1" =~ ^[0-9]+$ ]] || die "Uso: scripts/limpiar-lane.sh NN"
NN=$1

COMMON=$(git rev-parse --path-format=absolute --git-common-dir)
MAIN_DIR=$(dirname "$COMMON")
LANE_DIR="$(cd "$MAIN_DIR/.." && pwd)/ordo-diei-lanes/lane-$NN"

[[ "$(git -C "$MAIN_DIR" rev-parse --abbrev-ref HEAD)" == "dev" ]] || die "El directorio principal tiene que estar en dev."
[[ -z "$(git -C "$MAIN_DIR" status --porcelain)" ]] || die "El directorio principal tiene cambios sin commitear. Esperá y reintentá."

RAMAS=$(git -C "$MAIN_DIR" for-each-ref --format='%(refname:short)' "refs/heads/task/lane-$NN-*")
[[ -n "$RAMAS" ]] || die "No encuentro una rama local task/lane-$NN-*."
[[ $(wc -l <<<"$RAMAS") -eq 1 ]] || die "Hay más de una rama para la lane $NN: $RAMAS"
RAMA=$RAMAS

git -C "$MAIN_DIR" fetch origin --prune

# --- el PR tiene que estar integrado ----------------------------------------
git -C "$MAIN_DIR" merge-base --is-ancestor "$RAMA" origin/dev \
  || die "$RAMA todavía no está en origin/dev: el PR no se integró (o se integró con squash/rebase). No borro nada."

# --- dev local: solo fast-forward -------------------------------------------
if [[ "$(git -C "$MAIN_DIR" rev-list --count origin/dev..dev)" -gt 0 ]]; then
  die "El dev local tiene commits que no están en origin/dev. No lo toco: avisá al usuario."
fi
git -C "$MAIN_DIR" merge --ff-only origin/dev

# --- quitar worktree y rama -------------------------------------------------
if [[ -d "$LANE_DIR" ]]; then
  [[ -z "$(git -C "$LANE_DIR" status --porcelain)" ]] || die "El worktree $LANE_DIR tiene cambios sin commitear. No lo fuerzo: revisalo."
  quitar_enlaces "$LANE_DIR"
  git -C "$MAIN_DIR" worktree remove "$LANE_DIR"
fi
git -C "$MAIN_DIR" worktree prune
git -C "$MAIN_DIR" branch -d "$RAMA"
echo "✓ Lane $NN cerrada. dev local = origin/dev ($(git -C "$MAIN_DIR" rev-parse --short dev))."
