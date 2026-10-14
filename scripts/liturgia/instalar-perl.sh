#!/usr/bin/env bash
# Instala las dependencias Perl de DO en .cache/do-perl5/ (sin tocar el sistema).
# No hacen falta Plack/Starman (servidor web) ni Date::Calc (nada en web/cgi-bin lo usa): SPIKE_MOTOR §4.
# Imprime el PERL5LIB a usar (scripts/liturgia/do.ts lo arma solo).
set -euo pipefail

CPANM_VERSION="${CPANM_VERSION:-1.7047}"
RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
CACHE="$RAIZ/.cache"
mkdir -p "$CACHE"
if [[ ! -f "$CACHE/cpanm" ]]; then
  curl -fsSL "https://raw.githubusercontent.com/miyagawa/cpanminus/$CPANM_VERSION/cpanm" -o "$CACHE/cpanm"
fi
PERL_CPANM_HOME="$CACHE/cpanm-home" perl "$CACHE/cpanm" -n -q -L "$CACHE/do-perl5" \
  CGI CGI::Session Date::Format URI URL::Encode Algorithm::Diff
echo "export PERL5LIB=$CACHE/do-perl5/lib/perl5"
