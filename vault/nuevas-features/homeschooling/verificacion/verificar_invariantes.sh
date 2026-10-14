#!/usr/bin/env bash
# Invariantes de Homeschooling — ver PLAN_VERIFICACION.md §4 (misma carpeta padre).
# SOLO LECTURA: no modifica archivos, no instala nada y no toca la base
# (salvo VERIF_BASE=1, que corre un `prisma migrate diff` de solo lectura).
#
# Uso, desde la raíz de un worktree:
#   En la rama de una lane (autoverificación antes de integrar):
#     bash vault/nuevas-features/homeschooling/verificacion/verificar_invariantes.sh <CODIGO>
#     CODIGO = HS0 | H1a | HS-SEG | H1b | H2 | H3 | H4 | H5 | H6 | FIX
#   En un worktree de dev (verificación independiente o auditoría final):
#     bash vault/nuevas-features/homeschooling/verificacion/verificar_invariantes.sh
# Sale con 1 si hay alguna FALLA. Las líneas MIRAR se revisan a mano (PLAN_VERIFICACION.md §4).
set -u
shopt -s lastpipe   # los `| vacio` corren en este shell y cuentan las fallas
cd "$(git rev-parse --show-toplevel)" || exit 2

VENDOR_BASE=81b58d7   # commit que agregó vendor/roost sin cambios (lane 114)
PLAN_BASE=4d30904     # dev al cerrar el plan v3.1 (lane 117)
L=src/lib/homeschooling
C=src/components/homeschooling
A=src/app/api/homeschooling
P=src/app/dashboard/homeschooling
COMPLETE='src/app/api/tasks/[id]/complete/route.ts'
CRON=src/app/api/cron/daily/route.ts
ARQ=vault/nuevas-features/homeschooling/ARQUITECTURA_DETALLADA.md
PROTEGIDOS=(
  src/components/tasks/MissionCalendar.tsx src/components/tasks/mission-calendar.css
  src/components/tasks/useTaskActions.ts 'src/app/api/tasks/[id]/approve/route.ts'
  src/lib/session.ts src/lib/tienda/http.ts src/lib/habitos/permisos.ts src/lib/habitos/server.ts
  src/lib/subirImagen.ts src/lib/archivos.ts src/app/api/upload/route.ts 'src/app/api/archivos/[clave]/route.ts'
  src/components/SwipeRow.tsx src/components/Stepper.tsx
)

fallas=0; mirar_n=0
ok()      { printf '  OK     %s\n' "$*"; }
falla()   { printf '  FALLA  %s\n' "$*"; fallas=$((fallas + 1)); }
mirar()   { printf '  MIRAR  %s\n' "$*"; mirar_n=$((mirar_n + 1)); }
na()      { printf '  N/A    %s\n' "$*"; }
sangria() { sed 's/^/           /' | head -n "${1:-20}"; }
seccion() { printf '\n%s\n' "$*"; }
# stdin = coincidencias; vacío → OK, si no → FALLA (o MIRAR con $2=mirar) y las muestra
vacio() {
  local s; s=$(cat)
  if [ -z "$s" ]; then ok "$1"
  elif [ "${2:-}" = mirar ]; then mirar "$1"; printf '%s\n' "$s" | sangria
  else falla "$1"; printf '%s\n' "$s" | sangria; fi
}
fuentes() { find $L $C $A $P -type f \( -name '*.ts' -o -name '*.tsx' \) ! -name '*.test.ts' 2>/dev/null | sort; }
tests_hs() { find $L $C $A $P src/lib/tareas -type f -name '*.test.ts' 2>/dev/null | sort; }
buscar()  { fuentes | xargs -r grep -HnE "$@" 2>/dev/null; }
sin_comentarios() { grep -vE '^[^:]+:[0-9]+:[[:space:]]*(//|\*|/\*)'; }
existe()  { [ -e "$1" ]; }
linea()   { grep -nF -- "$1" "$2" 2>/dev/null | head -1 | cut -d: -f1; }
# Cabecera de origen completa: el bloque de comentarios // que empieza en «Portado de» (puede ocupar varias líneas)
cabecera() { awk '/Portado de/ {p=1} p && /^[[:space:]]*\/\// {printf "%s ", $0; next} p {exit}' "$1"; }

# ---------------------------------------------------------------- A. Alcance
permitidos() {
  case "$1" in
    HS0)    echo "THIRD_PARTY_NOTICES.md" ;;
    H1a)    echo "prisma/schema.prisma" ;;
    HS-SEG) echo "$COMPLETE" ;;
    H1b)    echo "src/components/app/AppSidebar.tsx" ;;
    H2)     echo "prisma/schema.prisma $COMPLETE $CRON" ;;
    H3)     echo "prisma/schema.prisma package.json package-lock.json" ;;
    H4)     echo "prisma/schema.prisma package.json package-lock.json src/components/ui/radio-group.tsx" ;;
    H5)     echo "prisma/schema.prisma src/components/app/AppSidebar.tsx src/components/dashboard/MainDock.tsx src/app/dashboard/layout.tsx src/app/globals.css" ;;
    H6)     echo "prisma/schema.prisma src/components/dashboard/ModalManager.tsx src/app/globals.css src/app/layout.tsx" ;;
    *)      echo "" ;;
  esac
}
codigo_de() { # nombre de rama (o asunto del merge) → código de lane
  case "$1" in
    *hs-fix*) echo FIX ;;
    *hs0*) echo HS0 ;;
    *completar-solo-asignado*|*hs-seg*) echo HS-SEG ;;
    *hs-modelo*|*h1a*) echo H1a ;;
    *hs-plan-padre*|*h1b*) echo H1b ;;
    *hs-hoy*|*-h2-*) echo H2 ;;
    *hs-evidencia*|*-h3-*) echo H3 ;;
    *hs-quizzes*|*-h4-*) echo H4 ;;
    *hs-horas*|*-h5-*) echo H5 ;;
    *hs-neuro*|*-h6-*) echo H6 ;;
    *-hs-*|*homeschool*) echo DOCS ;;
    *) echo "" ;;
  esac
}
revisar_rango() { # $1 código, $2 base, $3 tope
  local cod=$1 base=$2 tope=$3 f p perm
  perm=" $(permitidos "$cod") "
  while IFS= read -r f; do
    for p in "${PROTEGIDOS[@]}"; do
      [ "$f" = "$p" ] && { falla "$cod tocó $f (protegido: ninguna lane de Homeschooling lo cambia)"; continue 2; }
    done
    case "$f" in
      vault/*|$L/*|$C/*|$A/*|$P/*) continue ;;
      src/lib/tareas/*) [ "$cod" = HS-SEG ] || [ "$cod" = FIX ] || falla "$cod tocó $f (es de HS-SEG)"; continue ;;
      vendor/*) falla "$cod tocó $f (vendor/ no se edita)"; continue ;;
    esac
    if [[ "$perm" == *" $f "* ]]; then ok "$cod: $f (permitido; ver cómo en §3)"
    elif [ "$cod" = FIX ] \
      || { [ "$cod" = HS-SEG ] && [[ $f == src/components/* ]]; } \
      || { [ "$cod" = H5 ] && [[ $f == src/components/* || $f == src/app/dashboard/* ]]; }; then
      mirar "$cod: $f (válido solo si el registro de la lane lo explica)"
    else falla "$cod: $f fuera del alcance de la lane (§3)"; fi
  done < <(git diff --name-only "$base" "$tope")
  # Archivos existentes donde solo se permite AGREGAR líneas
  for f in prisma/schema.prisma "$COMPLETE" "$CRON" src/app/globals.css; do
    git diff --quiet "$base" "$tope" -- ":(literal)$f" && continue
    git diff -w "$base" "$tope" -- ":(literal)$f" | grep -E '^-[^-]' | vacio "$cod: $f solo agrega líneas (git diff -w sin líneas '-')"
  done
  # Dependencias: solo las de la lane, con versión exacta
  if ! git diff --quiet "$base" "$tope" -- package.json; then
    git diff "$base" "$tope" -- package.json | grep -E '^\+[[:space:]]+"' | grep -vE '"(react-dropzone|react-player|ts-fsrs)": "[0-9]+\.[0-9]+\.[0-9]+"' \
      | vacio "$cod: package.json solo agrega react-dropzone/react-player/ts-fsrs con versión exacta" mirar
  fi
}

rama=$(git symbolic-ref --short -q HEAD || true)
if [[ $rama == task/* ]]; then
  cod=${1:-$(codigo_de "$rama")}
  [ -z "$cod" ] && { echo "Indicá el código de la lane: HS0 H1a HS-SEG H1b H2 H3 H4 H5 H6 FIX"; exit 2; }
  base=$(git merge-base dev HEAD)
  seccion "A. Alcance de la lane $cod ($rama, ${base:0:7}..HEAD)"
  revisar_rango "$cod" "$base" HEAD
  [ -n "$(git status --porcelain)" ] && falla "hay cambios sin commitear" || ok "árbol limpio"
else
  seccion "A. Alcance de cada merge de Homeschooling en $(git rev-parse --short HEAD) desde $PLAN_BASE"
  n=0
  while read -r m subj; do
    cod=$(codigo_de "$subj")
    if [ -z "$cod" ]; then
      [ -n "$(git diff --name-only "$m^1" "$m" -- $L $C $A $P)" ] || continue
      mirar "$m «$subj» toca Homeschooling y la rama no tiene código de lane reconocible"; cod=FIX
    fi
    n=$((n + 1)); echo "  · $m $subj → $cod"
    revisar_rango "$cod" "$m^1" "$m"
  done < <(git log --first-parent --merges --format='%h %s' "$PLAN_BASE..HEAD")
  [ "$n" -eq 0 ] && na "todavía no hay merges de Homeschooling después del plan"
fi

# ---------------------------------------------------------------- B. Roost y portado
seccion "B. Roost y archivos portados"
if git diff --quiet "$VENDOR_BASE" HEAD -- vendor/roost && [ -z "$(git status --porcelain -- vendor/roost)" ]; then
  ok "vendor/roost idéntico al commit $VENDOR_BASE"
else
  falla "vendor/roost cambió"; git diff --stat "$VENDOR_BASE" HEAD -- vendor/roost | sangria
fi

{ find $C -name '*.tsx' 2>/dev/null; find $L/roost -name '*.ts' ! -name '*.test.ts' 2>/dev/null; ls $L/video.ts 2>/dev/null; } | sort -u |
  while IFS= read -r f; do head -n 5 "$f" | grep -qE 'Portado de vendor/roost/|// Propio de Ordo' || echo "$f"; done |
  vacio "cabecera «Portado de vendor/roost/…» o «// Propio de Ordo» en componentes, roost/* y video.ts"

for f in $L/roost/dto.ts $L/servidor/cursos.ts $L/servidor/progreso.ts $L/servidor/evidencia.ts $L/servidor/actividades.ts; do
  existe "$f" || continue
  head -n 5 "$f" | grep -q 'Portado de vendor/roost/' || echo "$f"
done | vacio "servidor traducido de Roost cita su origen (adaptador mongodb / services)"

DESCARTADOS='ProgressBar|VideoPlayerModal|UploadAssetsModal|GroupAssets|RSVPButton|ShowcaseVoteButton|ShowcaseDetail|ShowcaseFilterSidebar|services/s3|services/asset|services/supabase|src/index\.css|adapters/supabase|CommentSection|ThemeContext|SidebarContext'
fuentes | xargs -r grep -l 'Portado de' 2>/dev/null | while IFS= read -r f; do
  h=$(cabecera "$f")
  grep -q '492af47' <<<"$h" || echo "$f: cabecera sin el commit 492af47"
  for p in $(grep -oE 'vendor/roost/[A-Za-z0-9_./-]*[A-Za-z0-9]' <<<"$h" | sort -u); do
    [ -f "$p" ] || echo "$f: cita $p, que no existe"
    grep -qE "$DESCARTADOS" <<<"$p" && echo "$f: cita $p, DESCARTADO en el plan §1"
  done
done | vacio "cada origen citado existe, lleva el commit 492af47 y no es un archivo descartado"

buscar '\b(CommentSection|RSVPButton|UploadAssetsModal|ShowcaseVoteButton|ProgressBar|VideoPlayerModal|LeaderboardModal)\b' | sin_comentarios |
  vacio "no se usan piezas descartadas de Roost"
buscar "(from|import\()[[:space:]]*['\"](react-router|react-router-dom|@supabase/|[^'\"]*services/supabase|[^'\"]*vendor/)" |
  vacio "sin imports de react-router, Supabase ni vendor/"
buscar '(surface-[0-9]|primary-[0-9]{2,3}([^0-9]|$)|(^|[^A-Za-z-])dark:)' | sin_comentarios |
  vacio "sin clases de Roost sin traducir (surface-N, primary-NNN, dark:)"
buscar "className" | grep -E "[\"'\` ](btn(-[a-z]+)?|card|input|label)[\"'\` ]" |
  vacio "sin clases utilitarias de Roost (.btn, .card, .input, .label)"
buscar "(^|[^.A-Za-z_])(confirm|alert)\(|window\.(confirm|alert)\(|createPortal" | sin_comentarios |
  vacio "sin confirm()/alert()/createPortal (van Dialog, Sheet y toast)"
buscar 'localStorage' | grep -v 'evidencia/EnviarEvidencia.tsx' |
  vacio "localStorage solo en el borrador de EnviarEvidencia (H3)"

# ---------------------------------------------------------------- C. Capa de datos y rutas
seccion "C. Capa de datos y rutas"
buscar "^[[:space:]]*['\"]use server['\"]" | vacio "sin Server Functions ('use server', D-2)"
find $L/roost/services -name '*.ts' ! -name '*.test.ts' 2>/dev/null | xargs -r grep -HnE "prisma|/servidor/|next/headers" |
  vacio "services cliente sin Prisma, servidor/ ni next/headers"
fuentes | while IFS= read -r f; do
  head -n 3 "$f" | grep -qE "^['\"]use client['\"]" || continue
  grep -nE "^import .*from ['\"][^'\"]*(/servidor/|/prisma(\.ts)?['\"]|@prisma/client|next/headers|/session(\.ts)?['\"])" "$f" | grep -vE '^[0-9]+:import type ' | sed "s|^|$f:|"
done | vacio "ningún archivo 'use client' importa servidor/, Prisma ni la sesión"
rutas=$(find $A -name route.ts 2>/dev/null | sort)
if [ -z "$rutas" ]; then na "todavía no hay rutas en $A"
else
  for r in $rutas; do
    grep -q conSesion "$r" || echo "$r: sin conSesion"
    case "$r" in *\[*) grep -qE 'Promise<' "$r" || echo "$r: params no tipado como Promise (Next 16)";; esac
  done | vacio "toda ruta usa conSesion y los params dinámicos son Promise"
  echo "  Rutas (comparar con §5: método y soloPadres):"
  for r in $rutas; do
    met=$(grep -oE 'export (async )?(function|const) (GET|POST|PUT|PATCH|DELETE)' "$r" | awk '{print $NF}' | tr '\n' ' ')
    sp=$(grep -q soloPadres "$r" && echo soloPadres || echo '-')
    printf '           %-48s %-22s %s\n' "${r#$A/}" "$met" "$sp"
  done
fi

# ---------------------------------------------------------------- D. Premios y Tareas
seccion "D. Premios, Tareas y rutas existentes"
find $L/servidor $A -type f ! -name '*.test.ts' 2>/dev/null | xargs -r grep -HnE '\b(availablePoints|lockedPoints|experienciaHabitos)\b' |
  vacio "Homeschooling no lee ni escribe saldos (los premios salen de complete/approve)"
find $L/servidor $A -type f ! -name '*.test.ts' 2>/dev/null | xargs -r grep -HnE '\b(streakDays|stars)\b' |
  vacio "streakDays/stars solo en lectura (H2 muestra la racha)" mirar
buscar -i 'award_points|point_activities|leaderboard' | vacio "sin puntos de Roost (award_points, leaderboard)"
buscar '\.tarea\.(create|createMany|upsert)\(' | grep -v "$L/servidor/hoy.ts" | vacio "solo servidor/hoy.ts crea Tareas"
s=$(buscar '\.tarea\.(delete|deleteMany)\(')
if [ -z "$s" ]; then na "nadie borra Tareas todavía"
else
  n=$(grep -c . <<<"$s")
  grep -v 'estado: "Pendiente"' <<<"$s" | vacio "borrados de Tareas ($n): todos filtran estado: \"Pendiente\" en la misma línea (ARQ §4 reglas 5-7)" mirar
fi

if grep -qF 'task.tiempoEjecucionEstimadoSeg * 1000' "$COMPLETE" \
  && grep -qF 'const esATiempo = fechaVencimientoReal ? now <= new Date(fechaVencimientoReal) : true;' "$COMPLETE" \
  && grep -qF '// Unica: misma fecha 22:00' "$COMPLETE"; then
  ok "complete conserva el cálculo del que depende la regla de las 18:00 (L49-55, L77, rama Unica 22:00)"
else falla "cambió el cálculo de complete: la regla de las 18:00 (ARQ §5.2) ya no se cumple"; fi
n_seg=$(grep -c 'puedeCompletarTarea(' "$COMPLETE"); n_gua=$(grep -c 'motivoBloqueoTarea(' "$COMPLETE")
[ "$n_seg" -le 1 ] && [ "$n_gua" -le 1 ] && ok "complete: puedeCompletarTarea ×$n_seg, motivoBloqueoTarea ×$n_gua (máximo 1 cada una)" \
  || falla "complete: llamadas repetidas (puedeCompletarTarea ×$n_seg, motivoBloqueoTarea ×$n_gua)"
existe src/lib/tareas/permisos.ts && [ "$n_seg" -eq 0 ] && falla "HS-SEG: existe permisos.ts pero complete no lo llama"
existe $L/servidor/guardia.ts && [ "$n_gua" -eq 0 ] && falla "H2: existe guardia.ts pero complete no la llama"
l_404=$(linea 'Tarea no encontrada' "$COMPLETE"); l_seg=$(linea 'puedeCompletarTarea(' "$COMPLETE")
l_est=$(linea 'task.estado === "Completada"' "$COMPLETE"); l_gua=$(linea 'motivoBloqueoTarea(' "$COMPLETE")
l_calc=$(linea 'let fechaVencimientoReal' "$COMPLETE")
orden_ok=1
[ -n "$l_seg" ] && { [ "$l_seg" -gt "$l_404" ] && [ "$l_seg" -lt "$l_est" ] || orden_ok=0; }
[ -n "$l_gua" ] && { [ "$l_gua" -gt "$l_est" ] && [ "$l_gua" -lt "$l_calc" ] || orden_ok=0; }
[ "$orden_ok" -eq 1 ] && ok "complete: orden 404 → permiso (403) → estado (400) → guardia (400) → cálculo" \
  || falla "complete: orden incorrecto (404 L$l_404, permiso L$l_seg, estado L$l_est, guardia L$l_gua, cálculo L$l_calc)"
[ -n "$l_seg" ] && { sed -n "${l_seg},$((l_seg + 4))p" "$COMPLETE" | grep -q '403' && ok "complete: el permiso responde 403" || falla "complete: el permiso no responde 403"; }
[ -n "$l_gua" ] && { sed -n "${l_gua},$((l_gua + 4))p" "$COMPLETE" | grep -q '400' && ok "complete: la guardia responde 400" || falla "complete: la guardia no responde 400"; }
n_cron=$(grep -c 'asegurarTareasDeHoy(' "$CRON")
if existe $L/servidor/hoy.ts; then [ "$n_cron" -eq 1 ] && ok "cron llama asegurarTareasDeHoy una vez" || falla "cron: asegurarTareasDeHoy ×$n_cron (debe ser 1)"
else [ "$n_cron" -eq 0 ] && na "H2 no integrada (cron sin cambios)" || falla "cron llama asegurarTareasDeHoy sin servidor/hoy.ts"; fi

# ---------------------------------------------------------------- E. Reglas puntuales
seccion "E. Reglas puntuales"
if existe $L/config.ts; then
  { grep -qE "HORA_LIMITE_LECCION[^=]*=[[:space:]]*['\"]18:00['\"]" $L/config.ts || echo "HORA_LIMITE_LECCION ≠ \"18:00\""
    grep -qE "UMBRAL_APROBACION[^=]*=[[:space:]]*70\b" $L/config.ts || echo "UMBRAL_APROBACION ≠ 70"
    tr -d ' \n' < $L/config.ts | grep -qE 'leccion:4,pagina:30,capitulo:1,unidad:3' || echo "MAX_POR_DIA ≠ { leccion: 4, pagina: 30, capitulo: 1, unidad: 3 }"
  } | vacio "config.ts: 18:00, umbral 70 y máximos por día del plan"
else na "config.ts (H1a)"; fi
existe $L/pacing.ts && { grep -HnE 'Date\.now|new Date\([[:space:]]*\)|\bgetDay\(|prisma|Math\.random' $L/pacing.ts | sin_comentarios | vacio "pacing.ts puro (sin reloj, sin getDay, sin Prisma)"; } || na "pacing.ts (H1a)"
if existe $L/video.ts; then
  grep -q 'youtube-nocookie.com/embed' $L/video.ts && ok "video.ts embebe con youtube-nocookie.com" || falla "video.ts no usa youtube-nocookie.com"
else na "video.ts (HS0)"; fi
buscar 'youtube\.com/embed' | grep -v 'nocookie' | sin_comentarios | vacio "embeds con youtube.com solo si el registro de H4 lo justifica (react-player)" mirar
existe $L/servidor/hoy.ts && { grep -q 'HORA_LIMITE_LECCION' $L/servidor/hoy.ts && grep -q 'updateMany' $L/servidor/hoy.ts && ok "hoy.ts usa HORA_LIMITE_LECCION y la asignación sin carreras (updateMany)" || falla "hoy.ts sin HORA_LIMITE_LECCION o sin updateMany (ARQ §5.1-5.2)"; }
existe $L/servidor/quiz.ts && { grep -nE -A12 'function preguntasParaAlumno' $L/servidor/quiz.ts | grep -E 'correcta|explicacion' | vacio "preguntasParaAlumno no menciona correcta/explicacion (si usa omit, confirmar a mano)" mirar; }
if [ -n "$(tests_hs)" ]; then
  tests_hs | xargs -r grep -HnE '\.only\(|\.todo\(|only:[[:space:]]*true|todo:[[:space:]]*true' | vacio "tests sin .only ni .todo"
  tests_hs | xargs -r grep -HnE 'skip' | grep -vE 'PERMITIR_TESTS_DB|sinBase' | vacio "los únicos skip son los de PERMITIR_TESTS_DB"
  tests_hs | xargs -r grep -HnE "from ['\"]@/" | vacio "tests con imports relativos (node --test no resuelve @/)"
else na "todavía no hay tests de Homeschooling"; fi
n_sb=$(grep -c 'Estudio' src/components/app/AppSidebar.tsx); n_md=$(grep -c 'Estudio' src/components/dashboard/MainDock.tsx)
[ "$n_md" -eq 0 ] && [ "$n_sb" -le 1 ] && ok "«Estudio» solo en AppSidebar (×$n_sb) y no en MainDock (HD16)" || falla "«Estudio»: AppSidebar ×$n_sb, MainDock ×$n_md"
existe $P/page.tsx && [ "$n_sb" -eq 0 ] && falla "existe /dashboard/homeschooling pero falta el enlace «Estudio» en AppSidebar"
node -e '
  const p = require("./package.json"); const d = { ...p.dependencies, ...p.devDependencies };
  const exactas = { "react-dropzone": "14.3.8", "react-player": "3.4.0", "ts-fsrs": "5.4.2" };
  for (const [k, v] of Object.entries(exactas)) if (d[k] && d[k] !== v) console.log(`${k}: ${d[k]} (debe ser ${v} exacta)`);
  for (const k of ["react-router-dom", "react-router", "@supabase/supabase-js"]) if (d[k]) console.log(`${k}: prohibida (plan §2)`);
' | vacio "dependencias: versiones exactas y sin react-router/supabase"

# ---------------------------------------------------------------- F. Esquema
seccion "F. Esquema contra ARQ §3.1"
modelo() { # bloque normalizado: sin comentarios ni espacios extra, atributos de cada campo ordenados
  awk -v m="$2" '$0 ~ "^(model|enum) " m " *[{]" {p=1} p {print} p && /^}/ {exit}' "$1" | node -e '
    const attr = /@[\w.]+(\((?:[^()]|\([^()]*\))*\))?/g;
    for (let l of require("fs").readFileSync(0, "utf8").split("\n")) {
      l = l.replace(/\/\/.*$/, "").trim().replace(/\s+/g, " ");
      if (!l) continue;
      if (/^(model|enum) |^}|^@@/.test(l)) { console.log(l); continue; }
      const attrs = l.match(attr) || [];
      const base = l.replace(attr, "").trim().replace(/\s+/g, " ");
      console.log([base, ...attrs.sort()].join(" "));
    }'; }
for m in TipoRecurso UnidadContenido EstadoPlan EstadoDiaLectivo PlataformaVideo EstadoEvidencia \
         Materia RecursoCurso LeccionCurso PlanCurso DiaLectivo DiaNoLectivo ProgresoLeccion \
         EvidenciaAprendizaje EvidenciaImagen PreguntaLeccion IntentoQuiz TarjetaRepaso \
         ActividadOffline ParticipanteActividad MetaHoras PreferenciaAlumno HistoriaSocial; do
  grep -qE "^(model|enum) $m " prisma/schema.prisma || { na "$m (todavía no está en schema.prisma)"; continue; }
  d=$(diff <(modelo "$ARQ" "$m") <(modelo prisma/schema.prisma "$m"))
  if [ -z "$d" ]; then ok "$m igual a ARQ §3.1"; continue; fi
  # Diferencias esperadas: relaciones de ARQ hacia modelos que todavía no existen (lanes no integradas)
  inesperadas=$(grep -E '^[<>] ' <<<"$d" | while IFS= read -r l; do
    if [[ $l == '< '* ]]; then
      tipo=$(awk '{print $3}' <<<"$l" | tr -d '[]?')
      grep -qE "^model $tipo " "$ARQ" && ! grep -qE "^model $tipo " prisma/schema.prisma && continue
    fi
    echo "$l"
  done)
  if [ -z "$inesperadas" ]; then ok "$m igual a ARQ §3.1, salvo relaciones a modelos de lanes no integradas"
  elif [ "${VERIF_FINAL:-0}" = 1 ]; then falla "$m difiere de ARQ §3.1"; printf '%s\n' "$inesperadas" | sangria
  else mirar "$m difiere de ARQ §3.1"; printf '%s\n' "$inesperadas" | sangria; fi
done
if [ "${VERIF_BASE:-0}" = 1 ]; then
  sql=$(npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script 2>&1)
  grep -E 'Homeschool_|"(TipoRecurso|UnidadContenido|EstadoPlan|EstadoDiaLectivo|PlataformaVideo|EstadoEvidencia)"' <<<"$sql" |
    vacio "la base ya tiene todo lo de Homeschooling que declara schema.prisma (migrate diff, solo lectura)"
else na "estado de la base (correr con VERIF_BASE=1; solo lectura)"; fi

# ---------------------------------------------------------------- G. Cobertura del portado (plan §1)
seccion "G. Cobertura del portado: origen → destino (plan §1 y specs de lane)"
pendientes=0
while IFS='|' read -r lane origen destino; do
  [ -z "$lane" ] && continue
  if [ "$destino" = '*' ]; then  # el plan no fija el nombre del destino
    destino=$(grep -rlF "Portado de $origen" src 2>/dev/null | head -1)
    [ -z "$destino" ] && destino='(ningún archivo lo cita)'
  fi
  if [ ! -f "$destino" ]; then
    pendientes=$((pendientes + 1))
    if [ "${VERIF_FINAL:-0}" = 1 ]; then falla "$lane: falta $destino (de $origen)"; else na "$lane: $destino todavía no existe"; fi
  elif cabecera "$destino" | grep -qF "$origen"; then ok "$lane: $destino ← $origen"
  else falla "$lane: $destino no cita a $origen en su cabecera"; fi
done <<'EOF'
HS0|vendor/roost/src/types/index.ts|src/lib/homeschooling/roost/tipos.ts
HS0|vendor/roost/src/db/interfaces/types.ts|src/lib/homeschooling/roost/tipos.ts
HS0|vendor/roost/src/types/showcase.ts|src/lib/homeschooling/roost/tipos.ts
HS0|vendor/roost/src/contexts/AuthContext.tsx|src/components/homeschooling/roost/auth.tsx
HS0|vendor/roost/src/components/groups/learn/LessonPlayer.tsx|src/lib/homeschooling/video.ts
HS0|vendor/roost/src/components/groups/AddRecordingModal.tsx|src/lib/homeschooling/video.ts
HS0|vendor/roost/src/components/calendar/CalendarView.tsx|src/components/homeschooling/roost/CalendarView.tsx
HS0|vendor/roost/src/components/showcase/ShowcaseReviews.tsx|src/components/homeschooling/roost/StarRating.tsx
HS0|vendor/roost/src/components/admin/StatsCard.tsx|src/components/homeschooling/roost/StatsCard.tsx
H1b|vendor/roost/src/services/module.ts|src/lib/homeschooling/roost/services/module.ts
H1b|vendor/roost/src/services/group.ts|src/lib/homeschooling/roost/services/group.ts
H1b|vendor/roost/src/db/adapters/mongodb/index.ts|src/lib/homeschooling/roost/dto.ts
H1b|vendor/roost/src/db/adapters/mongodb/index.ts|src/lib/homeschooling/servidor/cursos.ts
H1b|vendor/roost/src/components/groups/CreateGroupModal.tsx|src/components/homeschooling/cursos/MateriaForm.tsx
H1b|vendor/roost/src/components/groups/learn/LearnGroupLayout.tsx|src/components/homeschooling/cursos/MateriaLayout.tsx
H1b|vendor/roost/src/components/groups/learn/CompactGroupHeader.tsx|src/components/homeschooling/cursos/MateriaHeader.tsx
H1b|vendor/roost/src/components/groups/learn/ModuleGrid.tsx|src/components/homeschooling/cursos/CursoGrid.tsx
H1b|vendor/roost/src/components/groups/learn/ModuleCard.tsx|src/components/homeschooling/cursos/CursoCard.tsx
H1b|vendor/roost/src/components/groups/learn/ModuleDetail.tsx|src/components/homeschooling/cursos/CursoDetalle.tsx
H1b|vendor/roost/src/components/groups/learn/ManageModuleModal.tsx|*
H1b|vendor/roost/src/components/groups/AddRecordingModal.tsx|src/components/homeschooling/cursos/LeccionForm.tsx
H1b|vendor/roost/src/pages/Calendar.tsx|src/components/homeschooling/plan/PlanCalendario.tsx
H2|vendor/roost/src/components/groups/learn/ModuleCard.tsx|src/components/homeschooling/hoy/TarjetaHoy.tsx
H2|vendor/roost/src/components/groups/learn/LessonPlayer.tsx|src/components/homeschooling/hoy/VisorLeccion.tsx
H2|vendor/roost/src/components/groups/learn/LearnSidebar.tsx|src/components/homeschooling/hoy/LeccionesDelDia.tsx
H2|vendor/roost/src/db/adapters/mongodb/index.ts|src/lib/homeschooling/servidor/progreso.ts
H3|vendor/roost/src/services/showcase.ts|src/lib/homeschooling/roost/services/showcase.ts
H3|vendor/roost/src/db/adapters/mongodb/index.ts|src/lib/homeschooling/servidor/evidencia.ts
H3|vendor/roost/src/pages/ShowcaseSubmit.tsx|src/components/homeschooling/evidencia/EnviarEvidencia.tsx
H3|vendor/roost/src/pages/admin/Showcases.tsx|src/components/homeschooling/revision/RevisionEvidencias.tsx
H3|vendor/roost/src/pages/Showcase.tsx|src/components/homeschooling/portafolio/Portafolio.tsx
H3|vendor/roost/src/components/showcase/ShowcaseCard.tsx|src/components/homeschooling/portafolio/EvidenciaCard.tsx
H3|vendor/roost/src/components/showcase/ShowcaseFilters.tsx|src/components/homeschooling/portafolio/FiltrosPortafolio.tsx
H5|vendor/roost/src/services/event.ts|src/lib/homeschooling/roost/services/event.ts
H5|vendor/roost/src/db/adapters/mongodb/index.ts|src/lib/homeschooling/servidor/actividades.ts
H5|vendor/roost/src/components/events/EventForm.tsx|src/components/homeschooling/horas/ActividadForm.tsx
H5|vendor/roost/src/components/events/EventCard.tsx|src/components/homeschooling/horas/ActividadCard.tsx
H5|vendor/roost/src/components/events/EventDetails.tsx|src/components/homeschooling/horas/ActividadDetalle.tsx
H5|vendor/roost/src/components/events/AttendeeList.tsx|src/components/homeschooling/horas/ParticipantesList.tsx
EOF
[ "$pendientes" -gt 0 ] && [ "${VERIF_FINAL:-0}" != 1 ] && echo "  ($pendientes destinos pendientes: en la auditoría final correr con VERIF_FINAL=1)"

# ---------------------------------------------------------------- H. Firmas de los services (D-2)
seccion "H. Services cliente: mismos nombres y parámetros que Roost (plan §3.2)"
firmas() { # nombre(parámetros) de cada función exportada, con el parser de TypeScript del proyecto
  node -e '
    const ts = require("typescript"), fs = require("fs");
    const sf = ts.createSourceFile("f.ts", fs.readFileSync(process.argv[1], "utf8"), ts.ScriptTarget.Latest, true);
    const exportado = (n) => (ts.getCombinedModifierFlags(n) & ts.ModifierFlags.Export) !== 0;
    const params = (f) => f.parameters.map((p) => p.name.getText(sf) + (p.questionToken || p.initializer ? "?" : "")).join(", ");
    for (const s of sf.statements) {
      if (ts.isFunctionDeclaration(s) && s.name && exportado(s)) console.log(`${s.name.text}(${params(s)})`);
      if (ts.isVariableStatement(s) && exportado(s))
        for (const d of s.declarationList.declarations)
          if (d.initializer && (ts.isArrowFunction(d.initializer) || ts.isFunctionExpression(d.initializer)))
            console.log(`${d.name.getText(sf)}(${params(d.initializer)})`);
    }' "$1"; }
while IFS='|' read -r servicio funciones; do
  dest=$L/roost/services/$servicio
  [ -f "$dest" ] || { na "services/$servicio todavía no existe"; continue; }
  for fn in $funciones; do
    a=$(firmas "vendor/roost/src/services/$servicio" | grep -E "^$fn\(")
    b=$(firmas "$dest" | grep -E "^$fn\(")
    if [ -z "$b" ]; then
      case "$fn" in markLessonComplete|markLessonIncomplete) existe $L/servidor/progreso.ts || { na "$fn (H2)"; continue; } ;; esac
      falla "services/$servicio: falta $fn"
    elif [ "$a" = "$b" ]; then ok "services/$servicio: $b"
    elif [[ "$b" == "${a%)}, "* ]] && ! grep -qE ', [A-Za-z_]+(,|\))' <<<"${b#"${a%)}"}"; then
      ok "services/$servicio: $b (agrega solo parámetros opcionales al final, p. ej. estrellas en H3)"
    else falla "services/$servicio: firma distinta — Roost $a / Ordo $b"; fi
  done
done <<'EOF'
module.ts|getModulesWithProgress getModuleById createModule updateModule deleteModule reorderModules getModuleRecordings getAdjacentRecordings getRecordingById markLessonComplete markLessonIncomplete
group.ts|hasPermission createRecording updateRecording deleteRecording
showcase.ts|createShowcase getShowcaseById getUserShowcases addShowcaseImage removeShowcaseImage getShowcasesForModeration approveShowcase rejectShowcase featureShowcase unfeatureShowcase getShowcaseStats
event.ts|getEventsInRange createEvent updateEvent deleteEvent getEventAttendees
EOF

# ---------------------------------------------------------------- Resumen
printf '\nResultado: %d FALLA, %d MIRAR\n' "$fallas" "$mirar_n"
[ "$fallas" -eq 0 ]
