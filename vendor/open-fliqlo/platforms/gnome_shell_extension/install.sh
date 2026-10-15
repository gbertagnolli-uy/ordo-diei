#!/usr/bin/env bash
# Install Open Fliqlo Lock Screen into ~/.local/share/gnome-shell/extensions/
# Copies the Flutter Linux release bundle under app/ (self-contained).
#
# Env:
#   FLIQLO_BUNDLE  Override path to apps/open_fliqlo/build/linux/.../bundle
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
UUID="open-fliqlo-lockscreen@openfliqlo"
SRC="${SCRIPT_DIR}/${UUID}"
DEST="${HOME}/.local/share/gnome-shell/extensions/${UUID}"
DEFAULT_BUNDLE="${ROOT}/apps/open_fliqlo/build/linux/x64/release/bundle"
BUNDLE="${FLIQLO_BUNDLE:-${DEFAULT_BUNDLE}}"

if [[ ! -d "${SRC}" ]]; then
  echo "Extension source not found: ${SRC}" >&2
  exit 1
fi

if [[ ! -x "${BUNDLE}/fliqlo" ]]; then
  echo "Flutter Linux bundle not found: ${BUNDLE}/fliqlo" >&2
  echo "Build first: (cd apps/open_fliqlo && flutter build linux --release)" >&2
  exit 1
fi

if ! command -v glib-compile-schemas >/dev/null 2>&1; then
  echo "glib-compile-schemas is required (package glib2-devel / libglib2.0-dev)" >&2
  exit 1
fi

mkdir -p "${DEST}"
if command -v rsync >/dev/null 2>&1; then
  rsync -a --delete \
    --exclude='.git' \
    --exclude='app' \
    "${SRC}/" "${DEST}/"
  mkdir -p "${DEST}/app"
  rsync -a --delete "${BUNDLE}/" "${DEST}/app/"
else
  rm -rf "${DEST}"
  mkdir -p "${DEST}"
  cp -a "${SRC}/." "${DEST}/"
  rm -rf "${DEST}/app"
  mkdir -p "${DEST}/app"
  cp -a "${BUNDLE}/." "${DEST}/app/"
fi
chmod +x "${DEST}/app/fliqlo"

glib-compile-schemas "${DEST}/schemas"

if command -v restorecon >/dev/null 2>&1; then
  restorecon -Rv "${DEST}" >/dev/null || true
fi

echo "Installed to ${DEST}"
echo "  bundled app: ${DEST}/app/fliqlo"
echo
echo "1. Turn the extension ON in Extension Manager (or):"
echo "     gnome-extensions enable ${UUID}"
echo "2. If this is the first install this session: log out and back in."
echo "3. Lock with Super+L to test."
echo
echo "Prefs: gnome-extensions prefs ${UUID}"
