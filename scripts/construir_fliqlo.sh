#!/usr/bin/env bash
# Compila el clon de Open Fliqlo (vendor/open-fliqlo) a web y lo deja en public/fliqlo/.
# Hace falta el SDK de Flutter (FLUTTER=/ruta/a/flutter, por defecto el del PATH).
# La app lo embebe en un iframe: ver src/components/rutina/RelojFlip.tsx.
set -euo pipefail
RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FLUTTER="${FLUTTER:-flutter}"
APP="$RAIZ/vendor/open-fliqlo/apps/open_fliqlo"

cd "$APP"
"$FLUTTER" pub get
"$FLUTTER" build web --release --no-web-resources-cdn --pwa-strategy=none --no-wasm-dry-run --base-href /fliqlo/

rm -rf "$RAIZ/public/fliqlo"
cp -r "$APP/build/web" "$RAIZ/public/fliqlo"
rm -rf "$APP/build"
# Esta compilación usa solo CanvasKit (JS): se descartan las variantes skwasm/wimp/webparagraph (--wasm)
rm -rf "$RAIZ"/public/fliqlo/canvaskit/{skwasm*,wimp*,webparagraph}
echo "Listo: public/fliqlo/ ($(du -sh "$RAIZ/public/fliqlo" | cut -f1))"
