#!/usr/bin/env bash
# Tablero de lanes: estado de cada LANE_NN_*.md del vault global (../vault, raíz del proyecto). Ver AGENTS.md › Vault.
# Uso: bash scripts/tablero.sh [--todas]   (con --todas muestra también las integradas)
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
exec node scripts/tablero.mjs "$@"
