#!/usr/bin/env bash
# Package Open Fliqlo Linux release as .deb, .rpm, and portable .zip.
#
# Usage:
#   ./packaging/linux/package.sh --bundle=PATH --version=VER [--out=DIR] [--artifact-base=NAME]
#
# Env:
#   BUNDLE, VERSION, OUT_DIR, ARTIFACT_BASE, NFPM_BIN
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
UUID="open-fliqlo-lockscreen@openfliqlo"
EXT_SRC="${ROOT}/platforms/gnome_shell_extension/${UUID}"
SCHEMA_XML="${EXT_SRC}/schemas/org.gnome.shell.extensions.open-fliqlo-lockscreen.gschema.xml"
EXT_ZIP_NAME="${UUID}.shell-extension.zip"

BUNDLE="${BUNDLE:-}"
VERSION="${VERSION:-}"
OUT_DIR="${OUT_DIR:-${ROOT}/dist}"
ARTIFACT_BASE="${ARTIFACT_BASE:-}"
NFPM_BIN="${NFPM_BIN:-nfpm}"

usage() {
  echo "Usage: $0 --bundle=PATH --version=VER [--out=DIR] [--artifact-base=NAME]" >&2
  exit 2
}

for arg in "$@"; do
  case "${arg}" in
    --bundle=*) BUNDLE="${arg#--bundle=}" ;;
    --version=*) VERSION="${arg#--version=}" ;;
    --out=*) OUT_DIR="${arg#--out=}" ;;
    --artifact-base=*) ARTIFACT_BASE="${arg#--artifact-base=}" ;;
    --help|-h) usage ;;
    -*)
      echo "Unknown option: ${arg}" >&2
      usage
      ;;
    *)
      echo "Unexpected argument: ${arg}" >&2
      usage
      ;;
  esac
done

if [[ -z "${BUNDLE}" || -z "${VERSION}" ]]; then
  usage
fi

if [[ ! -x "${BUNDLE}/fliqlo" ]]; then
  echo "Flutter Linux bundle not found or not executable: ${BUNDLE}/fliqlo" >&2
  exit 1
fi

for required in data lib; do
  if [[ ! -d "${BUNDLE}/${required}" ]]; then
    echo "Incomplete Flutter bundle (missing ${required}/): ${BUNDLE}" >&2
    exit 1
  fi
done

if [[ ! -d "${EXT_SRC}" ]]; then
  echo "Extension source not found: ${EXT_SRC}" >&2
  exit 1
fi

if [[ ! -f "${SCHEMA_XML}" ]]; then
  echo "Missing schema: ${SCHEMA_XML}" >&2
  exit 1
fi

if ! command -v "${NFPM_BIN}" >/dev/null 2>&1; then
  echo "nfpm not found (NFPM_BIN=${NFPM_BIN}). Install: https://nfpm.goreleaser.com/install/" >&2
  exit 1
fi

if ! command -v zip >/dev/null 2>&1; then
  echo "zip is required" >&2
  exit 1
fi

# Strip leading v for package version (v1.0.0 → 1.0.0).
PKG_VERSION="${VERSION#v}"
if [[ -z "${ARTIFACT_BASE}" ]]; then
  ARTIFACT_BASE="OpenFliqlo-linux-x64-${PKG_VERSION}"
fi

mkdir -p "${OUT_DIR}"
OUT_DIR="$(cd "${OUT_DIR}" && pwd)"
BUNDLE="$(cd "${BUNDLE}" && pwd)"

STAGE="$(mktemp -d)"
ZIP_STAGE="$(mktemp -d)"
NFPM_CFG="$(mktemp)"
cleanup() {
  rm -rf "${STAGE}" "${ZIP_STAGE}"
  rm -f "${NFPM_CFG}"
}
trap cleanup EXIT

# --- FHS tree for deb/rpm ---
# App under /usr/lib/open-fliqlo; extension payload under /usr/share/open-fliqlo/
# (postinstall copies into ~/.local/.../extensions/ as a User Extension).
LIB_DIR="${STAGE}/usr/lib/open-fliqlo"
EXT_PAYLOAD="${STAGE}/usr/share/open-fliqlo/gnome-extension"
APPS_DIR="${STAGE}/usr/share/applications"

mkdir -p "${LIB_DIR}" "${EXT_PAYLOAD}" "${APPS_DIR}"

if command -v rsync >/dev/null 2>&1; then
  rsync -a "${BUNDLE}/" "${LIB_DIR}/"
  rsync -a --exclude='.git' --exclude='app' "${EXT_SRC}/" "${EXT_PAYLOAD}/"
else
  cp -a "${BUNDLE}/." "${LIB_DIR}/"
  cp -a "${EXT_SRC}/." "${EXT_PAYLOAD}/"
  rm -rf "${EXT_PAYLOAD}/app"
fi
chmod +x "${LIB_DIR}/fliqlo"

install -Dm755 "${SCRIPT_DIR}/idle-launch-screensaver.sh" \
  "${LIB_DIR}/idle-launch-screensaver.sh"
install -Dm755 "${SCRIPT_DIR}/install-user-extension.sh" \
  "${LIB_DIR}/install-user-extension.sh"
install -Dm644 "${SCRIPT_DIR}/open-fliqlo.desktop" \
  "${APPS_DIR}/open-fliqlo.desktop"
install -Dm644 "${SCRIPT_DIR}/open-fliqlo-screensaver.desktop" \
  "${APPS_DIR}/open-fliqlo-screensaver.desktop"

if [[ -d "${EXT_PAYLOAD}/schemas" ]] && command -v glib-compile-schemas >/dev/null 2>&1; then
  glib-compile-schemas "${EXT_PAYLOAD}/schemas"
fi

# --- Generate nfpm config with concrete paths (nfpm env expansion is unreliable for paths) ---
sed \
  -e "s|\${VERSION}|${PKG_VERSION}|g" \
  -e "s|\${STAGE}|${STAGE}|g" \
  "${SCRIPT_DIR}/nfpm.yaml" > "${NFPM_CFG}"

(
  cd "${ROOT}"
  "${NFPM_BIN}" pkg --packager deb \
    --config "${NFPM_CFG}" \
    --target "${OUT_DIR}/open-fliqlo_${PKG_VERSION}_amd64.deb"
  "${NFPM_BIN}" pkg --packager rpm \
    --config "${NFPM_CFG}" \
    --target "${OUT_DIR}/open-fliqlo-${PKG_VERSION}-1.x86_64.rpm"
)

# --- Portable zip ---
PORTABLE="${ZIP_STAGE}/${ARTIFACT_BASE}"
mkdir -p "${PORTABLE}/gnome-extension"

if command -v rsync >/dev/null 2>&1; then
  rsync -a "${BUNDLE}/" "${PORTABLE}/"
else
  cp -a "${BUNDLE}/." "${PORTABLE}/"
fi
chmod +x "${PORTABLE}/fliqlo"

install -Dm755 "${SCRIPT_DIR}/idle-launch-screensaver.sh" \
  "${PORTABLE}/idle-launch-screensaver.sh"

# Portable desktops use PATH-relative Exec (not /usr/bin).
sed 's|^Exec=/usr/bin/fliqlo|Exec=fliqlo|' \
  "${SCRIPT_DIR}/open-fliqlo.desktop" > "${PORTABLE}/open-fliqlo.desktop"
sed 's|^Exec=/usr/bin/fliqlo|Exec=fliqlo|' \
  "${SCRIPT_DIR}/open-fliqlo-screensaver.desktop" \
  > "${PORTABLE}/open-fliqlo-screensaver.desktop"

"${ROOT}/platforms/gnome_shell_extension/pack.sh" \
  "${PORTABLE}/gnome-extension" --bundle="${BUNDLE}"
cp "${ROOT}/platforms/gnome_shell_extension/install.sh" \
  "${PORTABLE}/gnome-extension/"

printf '%s\n' \
  'Open Fliqlo (Linux)' \
  "Version: ${PKG_VERSION}" \
  '-------------------' \
  'Portable (this zip):' \
  '  Run:           ./fliqlo' \
  '  Screensaver:   ./fliqlo --screensaver' \
  '  Idle helper:   OPEN_FLIQLO_BIN=$PWD/fliqlo ./idle-launch-screensaver.sh' \
  '  Lock screen:   gnome-extensions install gnome-extension/'"${EXT_ZIP_NAME}" \
  '                 (then enable — Open Fliqlo is bundled in the zip)' \
  '' \
  'System packages (.deb / .rpm from the same release):' \
  '  sudo dpkg -i open-fliqlo_'"${PKG_VERSION}"'_amd64.deb' \
  '  sudo rpm -i open-fliqlo-'"${PKG_VERSION}"'-1.x86_64.rpm' \
  '  postinstall copies the extension into ~/.local/.../extensions/' \
  '  (User Extensions). Fallback: /usr/lib/open-fliqlo/install-user-extension.sh' \
  '  Then enable if needed: gnome-extensions enable '"${UUID}" \
  '' \
  'Docs: https://github.com/openfliqlo/open-fliqlo (docs/lockscreen-gnome.md)' \
  > "${PORTABLE}/README-linux.txt"

(
  cd "${ZIP_STAGE}"
  zip -r -q "${OUT_DIR}/${ARTIFACT_BASE}.zip" "${ARTIFACT_BASE}"
)

echo "Packaged into ${OUT_DIR}:"
ls -lh "${OUT_DIR}/open-fliqlo_${PKG_VERSION}_amd64.deb" \
  "${OUT_DIR}/open-fliqlo-${PKG_VERSION}-1.x86_64.rpm" \
  "${OUT_DIR}/${ARTIFACT_BASE}.zip"
