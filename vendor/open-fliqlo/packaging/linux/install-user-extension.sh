#!/usr/bin/env bash
# Install Open Fliqlo lock-screen extension into the current user's
# ~/.local/share/gnome-shell/extensions/ (uses /usr/lib/open-fliqlo/fliqlo).
set -euo pipefail

UUID="open-fliqlo-lockscreen@openfliqlo"
SRC="/usr/share/open-fliqlo/gnome-extension"
DEST="${HOME}/.local/share/gnome-shell/extensions/${UUID}"

if [[ ! -d "${SRC}" ]]; then
  echo "Extension payload missing: ${SRC}" >&2
  echo "Is the open-fliqlo package installed?" >&2
  exit 1
fi

mkdir -p "${DEST}"
cp -a "${SRC}/." "${DEST}/"
rm -rf "${DEST}/app"

if command -v glib-compile-schemas >/dev/null 2>&1; then
  glib-compile-schemas "${DEST}/schemas"
fi

if command -v gnome-extensions >/dev/null 2>&1; then
  gnome-extensions enable "${UUID}" 2>/dev/null || true
fi

echo "Installed to ${DEST}"
echo "  binary: /usr/lib/open-fliqlo/fliqlo"
echo "Enable (if needed): gnome-extensions enable ${UUID}"
echo "First install this session: log out and back in, then Super+L"
