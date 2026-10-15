#!/usr/bin/env bash
# Extrae el texto del PDF del Catecismo de San Pío X («Spanish Catechism of St. Pius X», Salve Maria Regina) a
# .cache/reposo/catecismo/catecismo-pdf.txt (en .gitignore). El PDF no va al repo.
# Uso: bash scripts/reposo/catecismo-pdf.sh "/ruta/Catecismo de San Pío X.pdf" && npm run reposo:frases -- --solo-catecismo
set -euo pipefail
[[ $# -eq 1 && -f "$1" ]] || { echo "Uso: $0 <catecismo.pdf>" >&2; exit 1; }
command -v pdftotext >/dev/null || { echo "Falta pdftotext (paquete poppler)" >&2; exit 1; }
RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
mkdir -p "$RAIZ/.cache/reposo/catecismo"
pdftotext -layout "$1" "$RAIZ/.cache/reposo/catecismo/catecismo-pdf.txt"
echo "✓ $RAIZ/.cache/reposo/catecismo/catecismo-pdf.txt"
