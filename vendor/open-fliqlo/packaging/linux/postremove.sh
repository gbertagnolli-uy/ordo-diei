#!/bin/sh
# Remove user-local GNOME extension installed by postinstall (SUDO_USER / PKEXEC).
set -e

UUID="open-fliqlo-lockscreen@openfliqlo"
OLD_SYSTEM="/usr/share/gnome-shell/extensions/${UUID}"

TARGET_USER="${SUDO_USER:-}"
if [ -z "${TARGET_USER}" ] && [ -n "${PKEXEC_UID:-}" ]; then
  TARGET_USER="$(getent passwd "${PKEXEC_UID}" | cut -d: -f1 || true)"
fi

if [ -d "${OLD_SYSTEM}" ]; then
  rm -rf "${OLD_SYSTEM}"
fi

if [ -z "${TARGET_USER}" ] || [ "${TARGET_USER}" = "root" ]; then
  exit 0
fi

TARGET_HOME="$(getent passwd "${TARGET_USER}" | cut -d: -f6 || true)"
if [ -z "${TARGET_HOME}" ]; then
  exit 0
fi

DEST="${TARGET_HOME}/.local/share/gnome-shell/extensions/${UUID}"
if [ -d "${DEST}" ]; then
  # Only remove if this looks like our package install (no bundled app/ — uses system binary).
  # Dev/portable installs that embed app/ are left alone.
  if [ ! -d "${DEST}/app" ]; then
    rm -rf "${DEST}"
    echo "Open Fliqlo: removed user extension ${DEST}"
  fi
fi
