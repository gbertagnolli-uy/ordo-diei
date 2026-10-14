#!/usr/bin/env bash
# Baja las fuentes de las frases del reposo (SPEC reposo §6.2) a .cache/reposo/ (en .gitignore). Idempotente.
#  - Vulgata Clementina: proyecto Clementine Text Project (VulSearch), copia BibleGet-I-O/Clementine-Vulgate (src/utf8, texto sin acentos).
#  - Catecismo Mayor de San Pío X (texto de 1905): OCR de la edición de 1973 de Internet Archive (limpio, numerado y acentuado).
#  - Torres Amat (edición ilustrada de 1883-84, tomos AI156–AI159 de Internet Archive): OCR limpio, versículos numerados.
set -euo pipefail
RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
D="$RAIZ/.cache/reposo"
mkdir -p "$D/vulgata" "$D/catecismo"

if [[ ! -f "$D/vulgata/Ps.lat" ]]; then
  curl -fsS "https://api.github.com/repos/BibleGet-I-O/Clementine-Vulgate/contents/src/utf8" \
    | grep -o '"download_url": *"[^"]*"' | sed 's/.*"\(https[^"]*\)"/\1/' \
    | while read -r url; do curl -fsS -o "$D/vulgata/$(basename "$url")" "$url"; done
fi

if [[ ! -f "$D/catecismo/catecismo-1973.txt" ]]; then
  curl -fsSL -o "$D/catecismo/catecismo-1973.txt" \
    "https://archive.org/download/CatecismoMayorSanPioX1905EdicinDe1973152PPginas/Catecismo%20Mayor%20San%20Pio%20X%20(1905)%20(Edici%C3%B3n%20de%201973)%20(152%20p%C3%A1ginas)_djvu.txt"
fi

# Torres Amat, «nueva edición ilustrada por Gustavo Doré» (Montaner y Simón, 1883-84), 4 tomos
mkdir -p "$D/torres-amat"
for id in AI156 AI157 AI158 AI159; do
  [[ -f "$D/torres-amat/$id.txt" ]] || curl -fsSL -o "$D/torres-amat/$id.txt" "https://archive.org/download/$id/${id}_djvu.txt"
done
echo "✓ Fuentes en $D"
