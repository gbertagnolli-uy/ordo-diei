#!/usr/bin/env bash
# Descarga Divinum Officium (commit fijo) a vendor/divinum-officium/ con sparse checkout (~55 MB, SPIKE_MOTOR §3).
# Idempotente. NO baja Help ni otros idiomas. vendor/divinum-officium/ está en .gitignore.
# Para actualizar DO: cambiá DO_COMMIT, regenerá y revisá los dorados del parser (vault/nuevas-features/liturgia/SPEC.md §2).
set -euo pipefail

DO_COMMIT="${DO_COMMIT:-32be5f267276b12256e015b2423b01606be149f5}"
DO_REPO="https://github.com/DivinumOfficium/divinum-officium.git"
RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DESTINO="$RAIZ/vendor/divinum-officium"

mkdir -p "$RAIZ/vendor"
if [[ ! -d "$DESTINO/.git" ]]; then
  git clone --depth 1 --filter=blob:none --no-checkout "$DO_REPO" "$DESTINO"
fi
cd "$DESTINO"
git sparse-checkout init --no-cone >/dev/null
git sparse-checkout set \
  '/LICENSE' \
  '/web/cgi-bin/' \
  '/web/www/Tabulae/' \
  '/web/www/horas/Latin/' '/web/www/horas/Espanol/' '/web/www/horas/English/' '/web/www/horas/Ordinarium/' \
  '/web/www/missa/Latin/' '/web/www/missa/Espanol/' '/web/www/missa/English/' \
  '/web/www/horas/*.*' '/web/www/missa/*.*'
if [[ "$(git rev-parse HEAD 2>/dev/null || true)" != "$DO_COMMIT" ]]; then
  git fetch --depth 1 origin "$DO_COMMIT"
  git checkout --quiet "$DO_COMMIT"
fi
echo "✓ Divinum Officium en $DESTINO @ $(git rev-parse --short HEAD)"
