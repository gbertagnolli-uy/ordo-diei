#!/bin/sh
# Install GNOME lock-screen extension into the installing user's
# ~/.local/share/gnome-shell/extensions/ (User Extensions), and point it at
# the shared /usr/lib/open-fliqlo binary.
set -e

UUID="open-fliqlo-lockscreen@openfliqlo"
SRC="/usr/share/open-fliqlo/gnome-extension"
OLD_SYSTEM="/usr/share/gnome-shell/extensions/${UUID}"

# Prefer the user who invoked sudo/pkexec; fall back to nothing (print hint).
TARGET_USER="${SUDO_USER:-}"
if [ -z "${TARGET_USER}" ] && [ -n "${PKEXEC_UID:-}" ]; then
  TARGET_USER="$(getent passwd "${PKEXEC_UID}" | cut -d: -f1 || true)"
fi

# Drop leftover system install from older packages.
if [ -d "${OLD_SYSTEM}" ]; then
  rm -rf "${OLD_SYSTEM}"
fi

if [ -z "${TARGET_USER}" ] || [ "${TARGET_USER}" = "root" ]; then
  echo "Open Fliqlo: install the lock-screen extension for your user with:"
  echo "  /usr/lib/open-fliqlo/install-user-extension.sh"
  exit 0
fi

TARGET_HOME="$(getent passwd "${TARGET_USER}" | cut -d: -f6 || true)"
if [ -z "${TARGET_HOME}" ] || [ ! -d "${TARGET_HOME}" ]; then
  echo "Open Fliqlo: could not resolve home for ${TARGET_USER}; run:"
  echo "  /usr/lib/open-fliqlo/install-user-extension.sh"
  exit 0
fi

DEST="${TARGET_HOME}/.local/share/gnome-shell/extensions/${UUID}"
mkdir -p "${DEST}"
# Copy as the target user so ownership is correct.
if command -v runuser >/dev/null 2>&1; then
  runuser -u "${TARGET_USER}" -- mkdir -p "${DEST}"
  runuser -u "${TARGET_USER}" -- cp -a "${SRC}/." "${DEST}/"
  if command -v glib-compile-schemas >/dev/null 2>&1; then
    runuser -u "${TARGET_USER}" -- glib-compile-schemas "${DEST}/schemas" || true
  fi
else
  cp -a "${SRC}/." "${DEST}/"
  chown -R "${TARGET_USER}:${TARGET_USER}" "${DEST}"
  if command -v glib-compile-schemas >/dev/null 2>&1; then
    glib-compile-schemas "${DEST}/schemas" || true
  fi
fi

# Best-effort enable (needs the user's session bus when available).
TARGET_UID="$(id -u "${TARGET_USER}" 2>/dev/null || true)"
BUS="/run/user/${TARGET_UID}/bus"
ENABLE_CMD="gnome-extensions enable ${UUID}"
if [ -n "${TARGET_UID}" ] && [ -S "${BUS}" ] && command -v gnome-extensions >/dev/null 2>&1; then
  if command -v runuser >/dev/null 2>&1; then
    runuser -u "${TARGET_USER}" -- env "DBUS_SESSION_BUS_ADDRESS=unix:path=${BUS}" \
      sh -c "${ENABLE_CMD}" 2>/dev/null || true
  else
    su - "${TARGET_USER}" -c "DBUS_SESSION_BUS_ADDRESS=unix:path=${BUS} ${ENABLE_CMD}" 2>/dev/null || true
  fi
fi

echo "Open Fliqlo: GNOME lock-screen extension installed for ${TARGET_USER}"
echo "  ${DEST}"
echo "  (uses /usr/lib/open-fliqlo/fliqlo — no bundled app/ copy)"
echo "If it is not listed yet: log out/in, then: gnome-extensions enable ${UUID}"
echo "Lock with Super+L to test."
