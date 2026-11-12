# Repos externos de referencia

Fuente única de los repos de terceros que se clonaron, copiaron o consultaron para Ordo Diei: de dónde vienen, a qué commit, con qué licencia, qué se tomó, dónde quedó en el código y dónde está el clon para volver a consultarlo. **Antes de clonar un repo nuevo o de volver a uno, mirá acá.** Al sumar uno, se agrega una fila (y un `ORIGEN.md` en el repo si se copia algo).

## Dónde están

- **Clones completos (con historial git):** `18_OrdoDiei/repos-externos/<repo>/`, fuera de git, junto a `vault/` y `verif-db/`. Se copiaron ahí el 2026-11-08 desde el scratchpad de la sesión `18058b32` (`%TEMP%\claude\6ad095a6c7965f81\18058b32-…\scratchpad\repos\`), que es temporal y puede desaparecer: **no usar esa ruta**.
- **Copias parciales dentro del repo:** `ordo-diei/vendor/<repo>/` (y `public/lector/foliate/`), cada una con su `ORIGEN.md` (qué carpetas se copiaron, licencia, cabecera de los archivos portados). Están excluidas de `tsc`, eslint y `npm test`.
- **Avisos legales:** `ordo-diei/THIRD_PARTY_NOTICES.md`.
- **Recuperar un clon si se perdió:** `git clone <URL> repos-externos/<repo> && git -C repos-externos/<repo> checkout <commit>` (commits completos abajo).
- Código portado: buscar `Portado de vendor/<repo>` en `src/` (`grep -rn "Portado de vendor/bookorbit" src`).

## Repos

| Repo | Commit | Licencia | Stack | Lanes | Qué se tomó | En el código | Clon completo |
|---|---|---|---|---|---|---|---|
| [msrbuilds/roost](https://github.com/msrbuilds/roost) | `492af4763d19d51ffe4ed3e11a95c3761245deca` (main, 2026-10-14) | ver `THIRD_PARTY_NOTICES.md` | Vite + React Router 7 + Express + Supabase | 114–118, 153 y Estudio | Base de Estudio/homeschooling: cursos, evidencia, actividades, progreso | `vendor/roost/` (copia literal completa) → `src/components/homeschooling/` y `src/lib/homeschooling/` (incl. `roost/` y `servidor/`) | `vendor/roost/` es el repo entero (sin `.git`) |
| [CogitoForge-AI/Open-Fliqlo](https://github.com/CogitoForge-AI/Open-Fliqlo) | `3586d62b1760380954888328698a983434f7d3a5` (main) | MIT (fuente Gluqlo: ISC) | Flutter | 154 | Reloj flip del modo enfoque, con cambios marcados `[Ordo Diei]` | `vendor/open-fliqlo/` → build web en `public/fliqlo/`, iframe en `src/components/rutina/RelojFlip.tsx` | `vendor/open-fliqlo/` es el repo entero (sin `.git`) |
| [bookorbit/bookorbit](https://github.com/bookorbit/bookorbit) | `6ad1445dab35757164ed3bf31e83caeb6ba24ad2` | **AGPL-3.0 + términos adicionales** («Powered by BookOrbit», versión modificada con fecha, código fuente si aplica la sección 13) | Vue 3 + NestJS + Drizzle | 270, 281, 280* (lector) | Modelo de biblioteca, estado de lectura, audiolibros, búsqueda; extractores de metadatos y portadas (281); motor foliate-js del lector (280*) | `vendor/bookorbit/` → `src/lib/biblioteca/` (incl. `metadatos.ts`), `public/lector/foliate/` | `repos-externos/bookorbit/` |
| [johnfactotum/foliate-js](https://github.com/johnfactotum/foliate-js) | sin clon propio: la versión es la que trae BookOrbit `6ad1445` en `client/public/assets/foliate/` | MIT (incluye fflate MIT y zip.js BSD-3-Clause) | JS (módulos ES) | 280* (PR #85) | Motor del lector de ePub a pantalla completa | `public/lector/foliate/` (+ `ORIGEN.md`), cargado desde `src/components/biblioteca/lector/useFoliate.ts` | dentro de `repos-externos/bookorbit/client/public/assets/foliate/` |
| [Oghamark/homebranch](https://github.com/Oghamark/homebranch) | monorepo `281a75ef94ef257d3a158cf58b83b303197a063e`; submódulo `homebranch-web` `5a5b55f96f5cc814debbc336951706ad26229966` | **AGPL-3.0** | React 19 + react-router + Chakra / NestJS | 270 (interfaz) | Pantallas de biblioteca, libro, lector, estantes, «Seguir leyendo» | `vendor/homebranch-web/` → `src/components/biblioteca/` | `repos-externos/homebranch/` (monorepo, con `homebranch-web/` incluido) |
| [devscalelabs/opencircle](https://github.com/devscalelabs/opencircle) | `5a8beada3147c6bd922c44f9cfe5b4a82f1a4056` | **AGPL-3.0** (`LICENSE.md`; el `package.json` dice ISC, vale `LICENSE.md`) | React 19 + TanStack / Hono + Prisma | 276 | Módulo social: posts, canales, reacciones, notificaciones, media | `vendor/opencircle/` → `src/lib/social/servidor/` (4 archivos) | `repos-externos/opencircle/` |
| [MayankJha0333/dovli](https://github.com/MayankJha0333/dovli) | `eb453e0225d906fa15e5b0a83d4db340b66c410f` (2026-10-27) | MIT | Next.js + BlockNote | 271 | Bloc de notas (core, sync, editor, ui, theme) | `vendor/dovli/` → `src/components/notas/` y `src/lib/notas/` | `repos-externos/dovli/` |
| [theachoem/storypad](https://github.com/theachoem/storypad) | `a76825e88740c935458beff404cbb95c889e4e2e` | GPL-3.0 | Flutter | 272 (consulta), **283–301 (port)** | 272: UX de calendario/lista. A portar: etiquetas y categorías con emoji, favoritas/fijadas, filtros de búsqueda | copiado a `vendor/storypad` (ver su `ORIGEN.md`); etiquetas, categorías y favoritas portadas en 283–285 | `repos-externos/storypad/` |
| [Demizo/Daily_You](https://github.com/Demizo/Daily_You) | `7cc237d1dcef24a27ca0f78ad449cc199b61bea3` | GPL-3.0 | Flutter | 272 (consulta), **283–301 (port)** | 272: escala de ánimo 1–5. A portar: etiquetas `label`/`tracker`, plantillas con variables, escala de ánimo configurable, autoguardado | copiado a `vendor/Daily_You` (ver su `ORIGEN.md`); etiquetas, búsqueda, plantillas y escala de ánimo portadas en 284–286 | `repos-externos/Daily_You/` |
| [ZhuJHua/moodiary](https://github.com/ZhuJHua/moodiary) | `2c552ddd7939a054122380397fb914cf000824b0` | AGPL-3.0 | Flutter + **editor web React 19/TS/Tiptap 3** (`packages/feature_base/moodiary_editor/editor`) | 272 (consulta), **283–301 (port)** | A portar: editor Tiptap (283), categorías jerárquicas y búsqueda (284–285). La 272 lo descartó por error | copiado a `vendor/moodiary` (ver su `ORIGEN.md`); editor Tiptap, categorías y búsqueda portados en 283–285 | `repos-externos/moodiary/` |

\* 280 del lector: el PR #85 usó el número 280 por error (choca con [[LANE_280_MARCO_GLOBAL_DASHBOARD]]); ver [[LANE_270_BIBLIOTECA_BOOKORBIT]].

## Pendientes

- **Revisión legal de las AGPL** (bookorbit, homebranch, opencircle): pendiente de Gabriel (D-BP2 en [[BACKLOG_PLANE]]).
- ~~Aviso de opencircle en `THIRD_PARTY_NOTICES.md`~~: agregado en [[LANE_282_AVISOS_OPENCIRCLE]] (PR #88, 2026-11-08).
- Roost no tiene clon con historial: si hace falta su historia, `git clone https://github.com/msrbuilds/roost` y `checkout 492af47`.

## Documentos relacionados
- Estudio/Roost: `vault/roost/` (guía para evaluar Roost, catálogo, comparativa, roadmap), [[LANE_114_ROOST_CLON]], [[LANE_115_PLAN_ROOST_HOMESCHOOLING]].
- Reloj flip: [[LANE_154_RELOJ_FLIP_ENFOQUE]].
- Biblioteca: [[LANE_270_BIBLIOTECA_BOOKORBIT]], [[LANE_281_BIBLIOTECA_METADATOS_PORTADAS]]. Notas: [[LANE_271_BLOC_NOTAS_DOVLI]]. Diario: [[LANE_272_DIARIO_PERSONAL_FAMILIAR]]. Social: [[LANE_276_SOCIAL_OPENCIRCLE]].
