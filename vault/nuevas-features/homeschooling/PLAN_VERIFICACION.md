# Homeschooling — plan de verificación de la implementación

> Lane 119 (2026-10-14). Acompaña a [`PLAN_INTEGRACION_ROOST.md`](PLAN_INTEGRACION_ROOST.md) v3.1, [`ARQUITECTURA_DETALLADA.md`](ARQUITECTURA_DETALLADA.md) y los `LANE_*.md` de esta carpeta.
> **Qué verifica:** el código, las funcionalidades (por código, tests y vectores de referencia) y el cumplimiento del plan (decisiones, contradicciones resueltas, portado de Roost).
> **Qué NO verifica:** smoke tests, pruebas en navegador, capturas, nada visual: eso lo hace el usuario. §10 lista qué criterios de aceptación quedan para él y qué parte de cada uno ya cubre esta verificación.
> **Herramienta:** [`verificacion/verificar_invariantes.sh`](verificacion/verificar_invariantes.sh) (solo lectura). Probado el 2026-10-14 en tres situaciones:
> - sobre `dev`: 0 FALLA;
> - sobre un clon con ~30 violaciones sembradas (vendor editado, clases de Roost, `use server`, saldos tocados, orden de `complete`, 20:00, `getDay`, `.only`, `^14.3.8`, firmas de services distintas…): las detectó todas;
> - sobre código correcto: 0 falsas alarmas.
>
> Además, el mismo día se corrió sobre el código real de HS0 (lane 118) y H1a (lane 120) ya integrados en `dev`: **0 FALLA, 0 MIRAR**. Esa corrida destapó tres falsos positivos del propio script, ya corregidos: cabeceras de varias líneas, un comentario que menciona `Date.now()` y el orden de atributos de Prisma. **Esto no es la verificación B de esas lanes:** faltan las puertas, los vectores, las mutaciones y la lectura de §5. Quedan pendientes.

## Cómo usar

| Momento | Quién | Qué corre | Dónde queda |
|---|---|---|---|
| **A. Autoverificación**, antes de `scripts/integrar.sh` | El agente que implementa la lane | §2 + script con su código + su bloque de §5 + sus mutaciones de §7 | Sección «Verificación» de su `vault/LANE_NN_*.md` |
| **B. Verificación independiente**, después de integrar cada lane | Otro agente u otra sesión (**nunca** quien escribió la lane) | Lo mismo que A, sobre `dev`, + script **sin argumento** (revisa también las lanes anteriores) | `verificacion/VERIF_<CODIGO>_<AAAA-MM-DD>.md` |
| **C. Auditoría final**, con las 9 lanes en `dev` | Igual que B | Todo + §8 (matrices del plan) + `next build` + `VERIF_FINAL=1` | `verificacion/AUDITORIA_FINAL_<AAAA-MM-DD>.md` |

**Reglas del verificador**
1. **Worktree propio, sin rama:**
   ```bash
   git worktree add --detach ../ordo-diei-lanes/verif-hs-<fecha> dev
   cd ../ordo-diei-lanes/verif-hs-<fecha>
   npm install
   ```
   Nunca se trabaja en `ordo-diei/`. Al terminar: `git worktree remove ../ordo-diei-lanes/verif-hs-<fecha>`.
2. **No arregla nada, informa.** Cada NO CUMPLE se corrige en una lane nueva `task/lane-NN-hs-fix-<tema>` (el script la reconoce como `FIX`).
3. **No toca la base.** Nada de `db push`, `db execute` ni `migrate`. Solo `prisma validate` y `migrate diff`, que son de lectura.
   - Los tests con base real (`PERMITIR_TESTS_DB=1`) **no** se activan sin pedido del usuario (AGENTS.md §6).
   - Lo que dependa de ellos queda «NO VERIFICABLE AQUÍ» (§9).
4. **Mutaciones (§7):** solo en ese worktree. Se deshacen con `git restore <archivo>` y al final `git status` queda limpio.
5. **Variable `HS`:** los comandos de este documento la usan para las cuatro carpetas de Homeschooling:
   ```bash
   HS="src/lib/homeschooling src/components/homeschooling src/app/api/homeschooling src/app/dashboard/homeschooling"
   ```
6. **El informe se integra como cualquier cambio:** en una lane de docs (`task/lane-NN-hs-verif-<codigo>`) con `scripts/integrar.sh`.

---

## 1. Métodos y veredictos

| Código | Método | Qué cuenta como evidencia |
|---|---|---|
| **[T]** | Test automatizado | El caso **está escrito** en el test (se busca por nombre o por sus datos) **y** pasa. Que la suite esté en verde no alcanza. |
| **[V]** | Vector de referencia | El verificador llama a la función pura con la entrada fija de §6 y compara con el valor esperado, calculado aparte del código de la lane. |
| **[G]** | Guarda mecánica | Salida del script (§4) o del comando citado. |
| **[D]** | Diff acotado | `git diff` de la lane: solo cambia lo que la spec permite. |
| **[E]** | Esquema / SQL | `prisma validate`, comparación con ARQ §3.1, filtro del SQL aplicado. |
| **[L]** | Lectura con checklist | Se lee el código y se marca cada punto de la checklist con su `archivo:línea`. |
| **[M]** | Mutación | Se rompe la regla a propósito y algún test tiene que fallar. |

**Veredictos**
- **CUMPLE**.
- **NO CUMPLE**, con severidad **Bloqueante**, **Mayor** o **Menor**.
- **DESVÍO REGISTRADO:** la lane cambió algo del plan y lo explica en su registro. Se acepta si no rompe un D-N, un HD-N ni una regla de AGENTS.md; si los rompe, es NO CUMPLE.
- **NO VERIFICABLE AQUÍ:** necesita base real o navegador (§9, §10).

**Severidad**
- **Bloqueante:** se corrige con una lane fix antes de integrar cualquier otra lane de Homeschooling.
  - `vendor/roost/` editado.
  - SQL con `DROP` o que altera tablas existentes.
  - Homeschooling lee o escribe saldos.
  - La API manda la respuesta correcta de un quiz antes de que el chico responda.
  - Un hijo lee o modifica datos de otro.
  - Cambió el cálculo de puntos de `complete`.
  - Cambió el comportamiento de Tareas que no son de Homeschooling, o `MissionCalendar`.
- **Mayor:** se corrige antes de empezar las lanes que dependen de esta.
  - Una regla de negocio del plan incumplida (18:00, pacing, candados, guardia, permisos).
  - Falta un entregable o un test obligatorio.
  - Una mutación que no rompe ningún test.
- **Menor:** se junta en una lane fix.
  - Cabecera de origen incompleta, texto en inglés.
  - Ruta con otro nombre pero registrada.
  - Firma de service con otro nombre de parámetro.

---

## 2. Puertas comunes (toda lane, en A y en B)

| # | Puerta | Comando | Esperado |
|---|---|---|---|
| G1 | Árbol limpio | `git status --porcelain` | vacío |
| G2 | Tests | `npm test 2>&1 \| tail -15` | `fail 0`. Los `skipped` son **solo** los de `PERMITIR_TESTS_DB` (sus nombres van al informe) |
| G2b | Tests sin depender de la zona horaria del servidor (desde H1a) | `for z in UTC Asia/Tokyo America/Montevideo; do TZ=$z node --test --disable-warning=MODULE_TYPELESS_PACKAGE_JSON "src/lib/homeschooling/**/*.test.ts" "src/lib/tareas/**/*.test.ts" \| grep -E '^ℹ (tests\|pass\|fail)'; done` | `fail 0` y `tests` > 0 en las tres (con 0 tests no prueba nada). El corte de las 18:00 tiene que salir de `APP_TZ`, no del reloj del servidor (plan §7.7) |
| G3 | Tipos | `npx tsc --noEmit` | sin salida |
| G4 | Lint de lo nuevo | `git diff --name-only --diff-filter=AM $BASE HEAD -- 'src/**/*.ts' 'src/**/*.tsx' \| xargs -r npx eslint` | sin errores |
| G5 | Invariantes | `bash vault/nuevas-features/homeschooling/verificacion/verificar_invariantes.sh <CODIGO>` (en A) o sin argumento (en B y C) | `0 FALLA`; cada `MIRAR` resuelto con §4.2 |
| G6 | Esquema válido (lanes con esquema) | `npx prisma validate` | «The schema … is valid» |
| G7 | SQL aplicado (lanes con esquema) | Filtro de §3.2 sobre el SQL copiado del registro | vacío |
| G8 | Base al día (B y C) | `VERIF_BASE=1 bash …/verificar_invariantes.sh` | «la base ya tiene todo lo de Homeschooling…» en OK |
| G9 | Registro de la lane | `vault/LANE_NN_*.md` | Pedido textual, SQL aplicado, cómo se resolvió cada [S] de su spec (§8.7), desvíos con motivo, salida de G2–G5 |
| G10 | Solo en C: compila producción | `npx next build` | Termina sin errores. Encuentra lo que `tsc` no ve, como un componente cliente que arrastra Prisma o `next/headers`. Si falla solo por variables de entorno, se anota y no se fuerza |

**Cómo se calcula `$BASE`**
- En A: `BASE=$(git merge-base dev HEAD)`.
- En B: `M=$(git log --first-parent --merges --format=%h -1 --grep='lane-NN')` y `BASE=$M^1`, con `HEAD` reemplazado por `$M`. La rama ya contenía `dev` al integrarse, así que `git diff $M^1 $M` es exactamente lo que trajo la lane.

---

## 3. Alcance de archivos

### 3.1 Qué puede tocar cada lane fuera de las carpetas de Homeschooling

- **Libres para toda lane:** `src/lib/homeschooling/**`, `src/components/homeschooling/**`, `src/app/api/homeschooling/**`, `src/app/dashboard/homeschooling/**` y `vault/**`.
- **Ninguna lane los toca:** `vendor/**` y los **protegidos** (lista en el script):
  - `MissionCalendar.tsx`, `mission-calendar.css`, `useTaskActions.ts`, `approve/route.ts`;
  - `session.ts`, `tienda/http.ts`, `habitos/permisos.ts`, `habitos/server.ts`;
  - `subirImagen.ts`, `archivos.ts`, `upload/route.ts`, `archivos/[clave]/route.ts`;
  - `SwipeRow.tsx`, `Stepper.tsx`.

| Lane | Archivo existente o nuevo fuera de esas carpetas | Único cambio permitido |
|---|---|---|
| HS0 | `THIRD_PARTY_NOTICES.md` (nuevo) | Atribución a msrbuilds/roost, commit `492af47` |
| H1a | `prisma/schema.prisma` | **Solo agrega**: enums y modelos de H1a y las relaciones inversas de ARQ §3.2 en `Usuario`, `Libro` y `Tarea` |
| HS-SEG | `src/lib/tareas/permisos.ts` y su test (nuevos); `complete/route.ts` | En `complete`: un import y un `if` con 403, entre el 404 y el chequeo de estado. Ocultar un botón en `src/components/**` solo si el registro dice cuál y por qué |
| H1b | `src/components/app/AppSidebar.tsx` | Un ítem «Estudio» (`GraduationCap`) |
| H2 | `schema.prisma`; `complete/route.ts`; `cron/daily/route.ts` | `ProgresoLeccion` y sus inversas. En `complete`: un import y un `if` con 400 **después** del chequeo de estado. En el cron: un bloque nuevo **después** de «B) GENERAR TAREAS PARA HOY» (L54) |
| H3 | `schema.prisma`; `package.json` y el lock | Modelos de H3; `"react-dropzone": "14.3.8"` exacta |
| H4 | `schema.prisma`; `package.json` y el lock; `src/components/ui/radio-group.tsx` (nuevo, del CLI de shadcn) | Modelos de H4; `"react-player": "3.4.0"` y `"ts-fsrs": "5.4.2"` exactas |
| H5 | `schema.prisma`; `AppSidebar.tsx`, `MainDock.tsx`, `src/app/dashboard/layout.tsx` y las barras del layout; `globals.css` | Modelos de H5. En los componentes: **solo** la clase `print:hidden`. En `globals.css`: solo **agregar** el bloque `@media print` |
| H6 | `schema.prisma`; `ModalManager.tsx`; `globals.css`; `src/app/layout.tsx` (si el atributo se pone ahí) | Modelos de H6. En `ModalManager`: **solo** la condición dentro de `celebrate` (L30-32) y el check estático (X20). En `globals.css`: solo **agregar** el bloque `[data-relajado]` |

El script marca FALLA si un archivo queda fuera de esta tabla y si `schema.prisma`, `complete`, el cron o `globals.css` tienen líneas borradas (`git diff -w`). Lo que permite con condiciones lo marca MIRAR. Para revisar el **contenido** de lo permitido:

```bash
git diff $BASE HEAD -- ':(literal)src/app/api/tasks/[id]/complete/route.ts'   # solo las líneas de la tabla
git diff $BASE HEAD -- src/app/api/cron/daily/route.ts                         # un bloque, después de L54
git diff -U0 $BASE HEAD -- src/components/dashboard/MainDock.tsx src/components/app/AppSidebar.tsx src/app/dashboard/layout.tsx
#   H5: cada par -/+ difiere solo en «print:hidden»
git diff -U0 $BASE HEAD -- src/components/dashboard/ModalManager.tsx          # H6: solo dentro de celebrate + el check estático
```

### 3.2 SQL aplicado

```bash
grep -E '^(CREATE|ALTER|DROP|DELETE|UPDATE|TRUNCATE|INSERT)' /tmp/cambio.sql \
  | grep -vE '^(CREATE TYPE "|CREATE TABLE "Homeschool_|CREATE (UNIQUE )?INDEX "[^"]+" ON "Homeschool_|ALTER TABLE "Homeschool_[A-Za-z_]+" ADD CONSTRAINT)'
```

Esperado: **vacío**.
- `ALTER TABLE` sobre una tabla que no es `Homeschool_*` es **Bloqueante**: las relaciones inversas no agregan columnas (ARQ §3).
- Un `DROP` también es **Bloqueante** (AGENTS.md §6).
- Las 17 tablas válidas son las de ARQ §3.1, todas `Homeschool_*`:
  - `Homeschool_Materias`, `Homeschool_Recursos`, `Homeschool_Lecciones`, `Homeschool_Planes`;
  - `Homeschool_Dias_Lectivos`, `Homeschool_Dias_No_Lectivos`, `Homeschool_Progreso`;
  - `Homeschool_Evidencias`, `Homeschool_Evidencia_Imagenes`;
  - `Homeschool_Preguntas`, `Homeschool_Intentos_Quiz`, `Homeschool_Repasos`;
  - `Homeschool_Actividades`, `Homeschool_Participantes`, `Homeschool_Metas_Horas`;
  - `Homeschool_Preferencias`, `Homeschool_Historias`.

---

## 4. Invariantes automáticas (`verificacion/verificar_invariantes.sh`)

### 4.1 Qué comprueba

| Sección | Comprueba | Regla del plan |
|---|---|---|
| **A. Alcance** | Archivos fuera de §3.1; protegidos; `vendor/`; archivos donde solo se agrega; dependencias con versión exacta; árbol limpio. En `dev` repite el control por cada merge de Homeschooling desde `4d30904`, deduciendo el código de lane del nombre de la rama | AGENTS.md; specs de lane |
| **B. Roost y portado** | `vendor/roost` igual a `81b58d7`; cabecera `Portado de vendor/roost/…` o `// Propio de Ordo` en componentes, `roost/*` y `video.ts`; servidor traducido de Roost con cabecera; cada origen citado existe, lleva `492af47` y no es un archivo DESCARTADO (plan §1); no se usan piezas descartadas; sin `react-router`, Supabase ni imports de `vendor/`; sin `surface-N`, `primary-NNN`, `dark:`, `.btn/.card/.input/.label`; sin `confirm()`, `alert()` ni `createPortal`; `localStorage` solo en `EnviarEvidencia` | Pedido del usuario; plan §2.2–2.3; D-6 |
| **C. Datos y rutas** | Sin `'use server'`; services cliente sin Prisma; ningún `'use client'` importa `servidor/`, Prisma ni la sesión; toda ruta con `conSesion` y `params` como `Promise`; tabla de rutas × métodos × `soloPadres` | D-2; plan §3; Next 16 |
| **D. Premios y Tareas** | Homeschooling no toca `availablePoints`, `lockedPoints` ni `experienciaHabitos`; `streakDays`/`stars` solo en lectura; sin `award_points` ni leaderboard; solo `servidor/hoy.ts` crea Tareas; borrados de Tareas para revisar; `complete` conserva L49-55, L77 y la rama `Unica` 22:00; `puedeCompletarTarea` y `motivoBloqueoTarea` una vez cada una, en orden 404 → 403 → estado → guardia → cálculo, con 403 y 400; el cron llama `asegurarTareasDeHoy` una vez | HD1, HD2, D-5, D-18, D-19 |
| **E. Reglas puntuales** | `config.ts` (18:00, 70, máximos por día); `pacing.ts` puro (sin reloj, sin `getDay`, sin Prisma); `video.ts` con `youtube-nocookie`; `hoy.ts` usa `HORA_LIMITE_LECCION` y `updateMany`; `preguntasParaAlumno` sin `correcta`; tests sin `.only`, `.todo` ni `skip` ajenos a la base, con imports relativos; «Estudio» solo en `AppSidebar`; dependencias exactas y sin `react-router`/Supabase | D-16, HD14, HD9, HD16, D-8 |
| **F. Esquema** | Cada enum y modelo de `schema.prisma` igual al de ARQ §3.1 (sin comentarios ni espacios); con `VERIF_BASE=1`, la base no tiene pendiente nada `Homeschool_*` (`migrate diff`, solo lectura) | ARQ §3 |
| **G. Cobertura del portado** | 39 pares origen → destino (plan §1 y specs): el destino existe y su cabecera cita ese origen. Si falta, sale N/A; con `VERIF_FINAL=1`, FALLA | Pedido del usuario: «nada de cero que Roost ya tenga» |
| **H. Firmas de services** | Con el parser de TypeScript: cada función de `roost/services/{module,group,showcase,event}.ts` tiene el mismo nombre y los mismos parámetros que en Roost. Solo se aceptan opcionales agregados al final (p. ej. `estrellas` en `approveShowcase`) | D-2 |

### 4.2 Cómo se resuelve cada MIRAR

| MIRAR | CUMPLE si… | Si no |
|---|---|---|
| Archivo con permiso condicionado (HS-SEG, H5, FIX) | Está en §3.1 y el diff hace solo lo que dice ahí | Mayor |
| `package.json` con otras dependencias | Nunca: el plan solo admite las tres | Mayor (o desvío aprobado por el usuario) |
| `streakDays` o `stars` en `servidor/` o en rutas | Aparecen solo en `select` o en lecturas, nunca en `data:` | Bloqueante |
| Borrado de Tareas | Cada borrado filtra `estado: "Pendiente"` en el `where`, o lo comprueba antes en la misma transacción (ARQ §4 reglas 5–7) | Bloqueante: borraría Tareas empezadas o con puntos |
| `youtube.com/embed` | El registro de H4 dice que react-player 3.4.0 no admite `youtube-nocookie` | Menor |
| `correcta` en `preguntasParaAlumno` | Aparece solo como `omit: { correcta: true }` o `select: { correcta: false }` | Bloqueante |
| Modelo distinto de ARQ §3.1 | En B: solo faltan relaciones marcadas `// H…` de lanes todavía no integradas. En C: ninguna diferencia | Mayor |
| Merge sin código de lane | El registro de la lane dice cuál es; se revisa como FIX | Menor |

---

## 5. Verificación por lane: requisito → evidencia

Cada fila se marca en el informe con su veredicto y su evidencia (`archivo:línea`, salida del comando o nombre del test). Las filas con «(DB)» quedan NO VERIFICABLE AQUÍ salvo autorización del usuario (§9).

### HS0 — Base de Roost

| ID | Requisito (fuente) | Método | Evidencia esperada |
|---|---|---|---|
| HS0-01 | Tipos en `roost/tipos.ts` con ids `number`, solo campos del esquema; `SHOWCASE_STATUS_INFO` con `pendiente/aprobada/ajustar` en español (spec 1) | [G][L] | `grep -nE "id\??: string" src/lib/homeschooling/roost/tipos.ts` vacío; cada campo existe en ARQ §3.1 o es un derivado de Roost (`is_completed`, `progress_percentage`, `recording_count`, `completed_count`) |
| HS0-02 | Shim de router (spec 2) | [L] | `useSearchParams()` → `[params, setParams]`; `setParams` usa `router.replace(…, { scroll: false })`; `useNavigate` → `router.push`; `useParams` reexportado; `Link` acepta `to` y usa `next/link` |
| HS0-03 | Shim de auth (spec 3) | [L][G] | `AuthProvider` recibe `{ id, nombre, rolFamiliar }`; `useAuth()` → `{ user: { id }, profile: { id, display_name, rolFamiliar }, isAuthenticated: true, esPadre }`; el archivo es `"use client"` y no importa `session` (script C) |
| HS0-04 | `video.ts`: 8 formatos, id de 11 caracteres, `urlEmbed`, miniaturas (spec 4) | [T][V] | Vectores §6.6 |
| HS0-05 | `CalendarView` portado (spec 5) | [G][L] | En `src/components/homeschooling/roost/CalendarView.tsx`: `grep -c "<style"` = 0; `grep -nE "#[0-9a-fA-F]{3,8}\b"` vacío; aparecen `dateFnsLocalizer`, `weekStartsOn: 1`, `withDragAndDrop`, `dragAndDrop/styles.css`, `mission-calendar`, `"Lección"` y `"No hay clases programadas."`; no importa `EventDetails`, `EventForm` ni `services`; props: `events`, `eventPropGetter`, `onSelectEvent`, `onSelectSlot`, `onEventDrop`, `draggableAccessor`, `views`, `messages` |
| HS0-06 | `StarRating` (spec 6) | [G] | `text-warning`, `focus-visible`, un `aria-label` por estrella |
| HS0-07 | `StatsCard` sobre `Card` de `ui/` (spec 7) | [G] | `import … from "@/components/ui/card"` |
| HS0-08 | Test de guarda (spec 8) | [L][M] | Busca `react-router-dom`, `@supabase/`, `services/supabase`, `surface-\d`, `primary-\d{2,3}`, `dark:` y la cabecera; M1–M4 de §7 lo rompen |
| HS0-09 | `THIRD_PARTY_NOTICES.md` (spec 9) | [G] | Contiene `msrbuilds/roost` y `492af47` |
| HS0-10 | Sin cambios en `prisma/`, `package.json` ni `MissionCalendar` | [G] | Script A |
| HS0-11 | Tests de la spec | [T] | `video.test.ts`: los 8 formatos, basura → `null`, id de 10 y de 12 → `null`, `urlEmbed` con `youtube-nocookie.com` |

### H1a — Modelo y pacing

| ID | Requisito | Método | Evidencia esperada |
|---|---|---|---|
| H1a-01 | Enums y modelos de H1a iguales a ARQ §3.1, sin los campos `// H2…H5`; inversas de ARQ §3.2 | [E] | Script F (las diferencias son solo relaciones `// H…`); G6 |
| H1a-02 | SQL aditivo y registrado | [E] | G7 vacío; el registro tiene el SQL |
| H1a-03 | `config.ts` | [G] | Script E |
| H1a-04 | `repartir()` con los tipos de ARQ §4 (incluido `unidadesBase`), puro | [G][V][L] | Script E; vectores §6.2; los tipos `EntradaPacing`/`SalidaPacing` coinciden con ARQ §4 campo por campo |
| H1a-05 | `crearPlan`: solo padres; materializa con `unidadesBase = 0`; excluye los `DiaNoLectivo` **de ese alumno**; 409 si ya hay plan para el recurso y el alumno | [L] + (DB) test 11 | `archivo:línea` de cada punto |
| H1a-06 | `vistaPrevia` no escribe | [L] | Ni `create`, ni `update`, ni `delete` en su cuerpo ni en lo que llama |
| H1a-07 | `marcarNoLectivo`: `upsert` por `(alumnoId, fecha)`, una fila por alumno, y `recalcular` de sus planes activos | [L] | — |
| H1a-08 | `recalcular` (ARQ §4 regla 5) | [L] + (DB) test 12 | Checklist R1–R6 (abajo) |
| H1a-09 | `moverDia` (regla 6) | [L] | Rechaza si el día no está `pendiente` o su Tarea no está `Pendiente`; la fecha nueva es lectiva, está libre y queda **estrictamente** entre el día anterior y el siguiente del plan; borra la Tarea `Pendiente`; no recalcula. *Si la validación es pura, pedir su test (Menor si falta)* |
| H1a-10 | `omitirDia` (regla 7) | [L] | `estado = omitida`; borra la Tarea solo si está `Pendiente`; no toca saldos |
| H1a-11 | `hoy` llega siempre como parámetro | [G] | `grep -nE "hoyEnFamilia\|new Date\(\)\|Date\.now" src/lib/homeschooling/servidor/planes.ts` vacío; la ruta pasa `hoyEnFamilia()` |
| H1a-12 | Rutas `POST planes`, `POST planes/vista-previa`, `POST no-lectivos`, `PATCH dias/[id]` (`mover` \| `omitir`), con `soloPadres` y zod | [G][L] | Tabla de rutas del script C; cada cuerpo pasa por un esquema zod (`.parse`); `PATCH` usa una unión discriminada por `accion` |
| H1a-13 | Tests 1–10 con sus datos; 11–12 con `skip` sin la base | [T] | Cada caso localizado por nombre o por datos |

Checklist de `recalcular` (ARQ §4 regla 5):
- **R1.** Conservados = días `hecha` u `omitida`, más los días con `fecha ≥ hoy` cuya Tarea existe y **no** está `Pendiente`.
- **R2.** `unidadesBase` = máximo `unidadHasta` de los conservados.
- **R3.** Días con `fecha < hoy` en `pendiente` → `movida`; su Tarea no se borra.
- **R4.** Se borran los días `pendiente` no conservados con `fecha ≥ hoy`, y sus Tareas solo si siguen `Pendiente`.
- **R5.** `repartir` desde `hoy` hasta `plan.fin`, con `noLectivos` = días no lectivos del alumno ∪ fechas de los conservados.
- **R6.** `plan.fin` no cambia.
- Todo en **una transacción**.

### HS-SEG — Solo el asignado o un padre completa

| ID | Requisito | Método | Evidencia esperada |
|---|---|---|---|
| SEG-01 | `puedeCompletarTarea(sesion, tarea)` pura en `src/lib/tareas/permisos.ts`; usa `esPadre` | [L][V] | Vectores §6.5 |
| SEG-02 | En `complete`: 403 con el mensaje de la spec, después del 404 y antes del chequeo de estado | [G][D] | Script D (orden y 403); el diff muestra solo el import y el `if` |
| SEG-03 | Nada más cambia en `complete` | [D] | Diff de G4/§3.1 |
| SEG-04 | El registro lista los llamados a `/complete` (hoy `useTaskActions.ts:63`) y qué UI ofrecía «completar» a un hermano | [L] | Lista en el registro; si ocultó un botón, el diff hace solo eso |
| SEG-05 | `timer`, `checklist`, `not-done` y `reject` sin cambios; sus huecos anotados | [D][L] | `git diff --stat $BASE HEAD -- 'src/app/api/tasks/'` muestra solo `complete`; el registro dice qué tienen esas rutas |
| SEG-06 | Tests de la spec | [T] | Asignado, Padre, Madre, hermano (Hijo/Hija), `"5"` contra `5` |

### H1b — El padre arma materias, cursos y plan

| ID | Requisito | Método | Evidencia esperada |
|---|---|---|---|
| H1b-01 | `roost/services/module.ts` y `group.ts` con los nombres y parámetros de Roost | [G] | Script H |
| H1b-02 | El cliente lanza `new Error(json.error)` si la respuesta no es `ok` | [L] | Cada función del service |
| H1b-03 | `dto.ts`: `mapModule`, `mapRecording` y `mapLessonCompletion` con claves de Roost e ids `number`; `progress_percentage` = unidades de días `hecha`/`omitida` del alumno pedido ÷ `totalUnidades` | [T][L] | Test de `dto.ts` |
| H1b-04 | Una sola consulta para la vista de materia | [G][L] | Existe `GET materias/[id]/cursos` con `include`; `MateriaLayout` usa `getModulesWithRecordings`; `grep -n "getModuleRecordings" src/components/homeschooling/cursos/MateriaLayout.tsx` no está dentro de un `map`/`for`/`Promise.all` |
| H1b-05 | Reordenar en dos fases dentro de una transacción (X17) | [L][T] | Primero `orden = -orden`, después `1..N`, todo en `$transaction`; test 1↔3 |
| H1b-06 | Agregar o borrar lecciones mantiene `orden` sin huecos, actualiza `totalUnidades` y recalcula los planes activos; 409 si la lección está cubierta por un día `hecha`/`omitida` (regla 8) | [T][L] | Tests de la spec |
| H1b-07 | Escribir exige `soloPadres`; un Hijo solo lee materias y cursos con un plan suyo | [G][L][T] | Tabla de rutas; `where` con `planes: { some: { alumnoId: s.id } }` o equivalente; test de permisos |
| H1b-08 | UI portada según la tabla de la spec | [G][L] | Script G (cabeceras). Además: `MateriaForm` sin `slug`, `is_private`, `is_premium` ni `layout_mode`; ni `CommentSection` ni `UploadAssetsModal`; `Empty` y `Progress` de `ui/`; `LeccionForm` usa `parsearEnlaceVideo`/`urlEmbed` y la URL es opcional; `PlanCalendario` usa el `CalendarView` portado y `grep -rn MissionCalendar src/components/homeschooling src/app/dashboard/homeschooling` sale vacío |
| H1b-09 | Arrastre restringido | [L] | `draggableAccessor` = día `pendiente` sin Tarea o con Tarea `Pendiente`; `onEventDrop` → `PATCH dias/[id]` con `accion: "mover"` |
| H1b-10 | Asistente con el `Stepper` de Ordo, 4 pasos, vista previa antes de guardar, aviso de sobrecarga con 3 opciones | [L] | `import … from "@/components/Stepper"`; `vistaPrevia` antes de `crearPlan`; muestra `aviso.opciones` |
| H1b-11 | «Hoy no hay clase» con antes/después y `POST no-lectivos`; página de días sin clase | [L] | Llama a `vistaPrevia` dos veces o con y sin el día |
| H1b-12 | Páginas servidor con `params: Promise`, envueltas en `AuthProvider`; Hijo → «Próximamente» hasta H2 | [L][G] | Cada `page.tsx` hace `await params` y no tiene `"use client"` |
| H1b-13 | «Estudio» solo en `AppSidebar` (HD16) | [G] | Script E |
| H1b-14 | Tests de la spec; `guarda.test.ts` sigue verde | [T] | — |

### H2 — Hoy aprendo

| ID | Requisito | Método | Evidencia esperada |
|---|---|---|---|
| H2-01 | `ProgresoLeccion` y sus inversas | [E] | Script F |
| H2-02 | `vencimientoLeccion` pura: `TZDate` de `@date-fns/tz`, `APP_TZ`, nunca antes de las 00:00 | [V][T] | Vectores §6.1; G2b en verde |
| H2-03 | `asegurarTareasDeHoy` (ARQ §5.1 y §5.2) | [L] + (DB) | Checklist T1–T12 (abajo) |
| H2-04 | Cron: un bloque después de «B) GENERAR…», nada más | [G][D] | Script D; diff solo con líneas agregadas |
| H2-05 | `leccionesDeHoy` | [L] | Devuelve materia (ícono, color), recurso, rango en texto, `tareaId`, estado sincronizado, lecciones con `is_completed`, `bloqueada` y motivo |
| H2-06 | `sincronizarDia` | [V][T] | Tabla §6.3, **los 10 estados** |
| H2-07 | `estaBloqueado` | [V][T] | Tabla §6.4 |
| H2-08 | `completarLeccion`: portado de `markLessonComplete` con el *upsert* de `completelesson` | [L][T] | El alumno sale de la sesión si es hijo; la lección es de un día de hoy (o adelantable) **de ese alumno**; no está bloqueada; `upsert` por `(alumnoId, leccionId)`; devuelve `{ ultimaDelDia, tareaId }`; con H4, exige quiz aprobado |
| H2-09 | `markLessonIncomplete` solo para padres; no cambia la Tarea | [L] | `soloPadres` en su ruta; no toca `tarea` |
| H2-10 | Guardia `motivoBloqueoTarea` (ARQ §5.5) y una llamada en `complete` | [V][T][G] | Tabla §6.5; script D; para Tareas comunes, un solo `findUnique` por `tareaId` y `null` |
| H2-11 | Rutas `GET hoy` y `POST lecciones/[id]/completar`; **sin** endpoint de premios | [G] | Tabla de rutas; script D (saldos) |
| H2-12 | `VisorLeccion` sin «desmarcar», con `urlEmbed`, un solo «Terminé» | [G][L] | `grep -rn "markLessonIncomplete" src/components/homeschooling/hoy` vacío |
| H2-13 | `TarjetaHoy` ≥ 96 px de alto y objetivos ≥ 44 px; bloqueada con `Lock` y texto | [L] | Clases `min-h-24` o más y `min-h-11`/`h-11`/`size-11` o más en los botones |
| H2-14 | «Terminé» final → `POST /api/tasks/[id]/complete` con `elapsedSeconds` → `openModal("TASK_SUCCESS", data)`; sin confeti propio (X15) | [G][L] | `grep -rn "canvas-confetti\|registry/magicui/confetti" src/components/homeschooling` vacío; `openModal("TASK_SUCCESS"` presente |
| H2-15 | `page.tsx`: un Hijo ve «Hoy aprendo» y el servidor llama `asegurarTareasDeHoy` antes de renderizar | [L] | — |
| H2-16 | Padre: interruptor «Navegación libre» por curso y progreso por hijo | [L] | — |
| H2-17 | Tests de la spec | [T] | — |

Checklist de `asegurarTareasDeHoy` y de la Tarea que crea (ARQ §5.1–5.2):
- **T1.** Primero `recalcular` cada plan activo con un día `pendiente` de fecha `< hoy`.
- **T2.** Crea la Tarea **solo** para días de hoy en `pendiente` sin `tareaId`.
- **T3.** Asigna sin carreras: `create` + `diaLectivo.updateMany({ where: { id, tareaId: null } })`; si actualizó 0 filas, borra la Tarea recién creada.
- **T4.** `titulo` según ARQ §5.2.
- **T5.** `asignadoId` = alumno del plan.
- **T6.** `creadorId` = `RecursoCurso.creadorId`.
- **T7.** `tiempoEjecucionEstimadoSeg` = `(hasta − desde + 1) · minutosPorUnidad · 60`.
- **T8.** `dificultad` = `Materia.dificultad`.
- **T9.** `generaPuntosYRecompensa: true` y `tipoRecurrencia: "Unica"`. Con otra recurrencia cambia el período de gracia de `complete`, L60-71.
- **T10.** `fechaVencimiento` = inicio del día en `APP_TZ`.
- **T11.** `horaEjecucion` = `vencimientoLeccion(hoy, HORA_LIMITE_LECCION, estimado)`.
- **T12.** Es idempotente: una segunda llamada no crea nada.

### H3 — Evidencia y portafolio

| ID | Requisito | Método | Evidencia esperada |
|---|---|---|---|
| H3-01 | Modelos de H3 | [E] | Script F |
| H3-02 | `roost/services/showcase.ts` con las 11 funciones | [G] | Script H (`approveShowcase` puede agregar `estrellas?` al final) |
| H3-03 | `mapShowcase` y estados `pending↔pendiente`, `approved↔aprobada`, `rejected↔ajustar`; `featured` = `destacada` | [T][L] | Test de `dto.ts` |
| H3-04 | Aprobar acepta estrellas 1–5; pedir ajuste exige comentario; aprobar o destacar **no** cambia saldos | [T][G] | zod con `min(1).max(5)` y comentario requerido; script D (saldos) |
| H3-05 | Fotos con `subirImagen` → `/api/upload`; URL validada con `claveDeUrl` | [G][L] | `grep -rn "subirImagen" src/components/homeschooling/evidencia` presente; `claveDeUrl` en `servidor/evidencia.ts` |
| H3-06 | `limpiarArchivo(url)` borra el `Archivo` solo si ninguna otra `EvidenciaImagen` lo usa | [T][L] | — |
| H3-07 | HD15: el Hijo crea y ve **solo** las suyas; solo los padres listan pendientes, aprueban, piden ajuste y destacan | [T][L] | Matriz §6.9 |
| H3-08 | Rutas de la spec | [G] | Tabla de rutas |
| H3-09 | `EnviarEvidencia` con `useDropzone`, sin URL, tagline, categoría, stack ni editor rico; borrador en `localStorage` | [G][L] | `import { useDropzone } from "react-dropzone"`; script B (`localStorage`) |
| H3-10 | Cámara: `capture="environment"` por `getInputProps`, o el `<input capture>` de respaldo si el registro dice que no se reenvía | [L] | Uno de los dos; el registro dice cuál y por qué |
| H3-11 | `RevisionEvidencias`: `StatsCard`, filtro por estado, `StarRating`, comentario obligatorio para ajuste, `SwipeRow` con **izquierda = aprobar** y **derecha = pedir ajuste**, más botones equivalentes | [L] | Los *handlers* de `SwipeRow` se leen y comparan con su uso en `ParentReviewPanel` |
| H3-12 | `Portafolio` con filtros alumno, materia y mes; «Destacar» solo para padres | [L] | — |
| H3-13 | `react-dropzone` `14.3.8` exacta | [G] | Script E |

### H4 — Quizzes, checkpoints y repaso

| ID | Requisito | Método | Evidencia esperada |
|---|---|---|---|
| H4-01 | Modelos de H4 | [E] | Script F |
| H4-02 | `preguntasParaAlumno` devuelve solo `id`, `orden`, `segundoVideo`, `enunciado`, `opciones` | [T][G] | Test de forma (`Object.keys` exactas); script E; la ruta `GET preguntas` no agrega campos |
| H4-03 | `responderCheckpoint` → `{ correcta, explicacion? }` | [L] | — |
| H4-04 | `calcularNota` pura | [V][T] | §6.7 |
| H4-05 | `calificarFinal` crea `IntentoQuiz`, con `aprobado = nota >= umbralAprobacion`; si aprueba, llama `completarLeccion`; las explicaciones van **recién** en esta respuesta | [L][T] | — |
| H4-06 | `fallosSeguidos` = intentos no aprobados desde el último aprobado; con ≥ 2, `crearTarjeta` y aviso al padre | [T] | — |
| H4-07 | ts-fsrs envuelto en `servidor/repaso.ts`, con `Good` para acierto y `Again` para fallo; resuelta tras 3 aciertos seguidos con intervalo ≥ 30 días | [G][T] | `grep -rln "from ['\"]ts-fsrs" src` → solo `servidor/repaso.ts`; test: el acierto aleja `proximo` y el fallo lo acerca |
| H4-08 | `repasosDeHoy`: `proximo` ≤ fin del día en `APP_TZ`, no resueltas, máximo 3 | [L][T] | — |
| H4-09 | `completarLeccion` exige quiz aprobado si la lección tiene preguntas finales | [L] | — |
| H4-10 | Rutas de la spec; `PUT preguntas` solo para padres | [G] | Tabla de rutas |
| H4-11 | `VisorLeccion` con `react-player`; `proximoCheckpoint` pura con `>=` y la regla X21 | [V][T][G] | §6.7; la comparación de tiempo usa `>=` (M18 lo prueba) |
| H4-12 | `CheckpointOverlay` (acierto → «Continuar»; fallo → explicación y «Volver 30 s»); `QuizFinal` con `radio-group` de `ui/` | [L] | `import … from "@/components/ui/radio-group"` |
| H4-13 | Bloque «Repaso de hoy» antes de las lecciones | [L] | — |
| H4-14 | `react-player` `3.4.0` y `ts-fsrs` `5.4.2` exactas | [G] | Script E |

### H5 — Horas y reportes

| ID | Requisito | Método | Evidencia esperada |
|---|---|---|---|
| H5-01 | Modelos de H5 | [E] | Script F |
| H5-02 | `roost/services/event.ts` con las 5 funciones de la spec | [G] | Script H |
| H5-03 | `mapEvent`; zod con `fin > inicio`; solo los padres escriben | [T][G] | `.refine` (o equivalente) sobre `fin > inicio`; `soloPadres` en las escrituras |
| H5-04 | `sumarHoras` pura | [V][T] | §6.8 |
| H5-05 | `resumenHoras`: una consulta por tipo, con `include` | [L] | Ninguna consulta dentro de un bucle |
| H5-06 | `MetaHoras` con `PUT metas` solo para padres | [G] | Tabla de rutas |
| H5-07 | UI portada (`ActividadForm`, `ActividadCard`, `ActividadDetalle`, `ParticipantesList`) sin RSVP, sin virtual y sin URL de reunión | [G][L] | Script G; `grep -rniE "rsvp\|meeting_url\|is_virtual" src/components/homeschooling/horas` vacío |
| H5-08 | Reporte: `StatsCard`, `ui/chart`, `window.print()`; evidencias destacadas si H3 está integrada | [L] | — |
| H5-09 | `@media print` agregado y `print:hidden` como único cambio en `AppSidebar`, `MainDock` y las barras del layout | [D] | §3.1 |
| H5-10 | Actividades también en `PlanCalendario` | [L] | — |

### H6 — Neurodivergencia

| ID | Requisito | Método | Evidencia esperada |
|---|---|---|---|
| H6-01 | Modelos de H6 | [E] | Script F |
| H6-02 | Modo relajado: atributo `data-relajado` en `<html>` y bloque de variables CSS **derivado de los tokens** existentes, sin animaciones decorativas | [G][L] | El bloque `[data-relajado]` de `globals.css` no tiene hex (`grep -nE "#[0-9a-fA-F]{3,8}"`) y usa `var(--…)`/`oklch(from var(--…) …)` |
| H6-03 | Sin confeti en modo relajado; para los demás, igual que hoy (X20) | [D][L] | El diff de `ModalManager` toca solo `celebrate` (L30-32) y agrega el check estático; L48-50 sin cambios |
| H6-04 | No crea sonidos; silencia solo si existen N2/N3 | [G] | No hay archivos de audio nuevos (`git diff --name-only $BASE HEAD \| grep -E '\.(mp3\|ogg\|wav)$'` vacío) |
| H6-05 | Primero/Después | [L] | — |
| H6-06 | Historias sociales: CRUD de padres, de 3 a 5 pasos normalizados, íconos Lucide, 3 plantillas | [T][L] | Test de normalización |
| H6-07 | Función pura que decide la vista (normal, primero-después, relajado) | [T] | — |
| H6-08 | Nada que pida permisos del sistema ni APIs no soportadas (D6) | [G] | `grep -rnE "getBattery\|wakeLock\|requestPermission\|getUserMedia\|kiosk" $HS` vacío |

---

## 6. Vectores de referencia

Calculados **fuera** del código de las lanes, con una implementación de referencia de ARQ §4 regla 3 y los datos de zona horaria de Node 26 (`America/Montevideo` = UTC−3 todo el año, sin horario de verano). El verificador los compara con la función real; un vector que la función no reproduce es NO CUMPLE, aunque los tests de la lane pasen.

Cómo llamar a una función pura desde el worktree. Node 26 quita los tipos solo, y los módulos de Homeschooling usan imports relativos para que `node --test` los cargue:

```bash
node --input-type=module -e '
import { repartir } from "./src/lib/homeschooling/pacing.ts";
const r = repartir({ totalUnidades: 300, unidadesBase: 0, desde: "2026-03-02", hasta: "2026-11-30",
                     diasSemana: [1,2,3,4,5], noLectivos: [], unidadTipo: "pagina" });
console.log(r.dias.length, r.dias[0], r.dias.at(-1), r.aviso);'
```

### 6.1 «A tiempo» hasta las 18:00 (HD2, D-5, D-16)

| # | Entrada | Esperado |
|---|---|---|
| V1 | `vencimientoLeccion("2026-10-14", "18:00", 1800)` | `2026-10-14T20:30:00.000Z` (17:30 en Montevideo) |
| V2 | V1 + 1800 s, como hace `complete` en L49-51 | `2026-10-14T21:00:00.000Z` = 18:00: el límite «a tiempo» |
| V3 | Completar el 2026-10-14 a las `13:00Z` (10:00 local) | `esATiempo = true` (L77) |
| V4 | Completar a las `21:01Z` (18:01 local) | `esATiempo = false`; paga 50 % si `now <= fechaLimite`, que es las 22:00 **del servidor** (L71) |
| V5 | `vencimientoLeccion("2026-10-14", "18:00", 72000)` (20 h) | `2026-10-14T03:00:00.000Z` (00:00 local, por el tope). Caso límite aceptado: ese día el «a tiempo» llega hasta las 20:00 |
| V6 | `vencimientoLeccion("2026-10-14", "18:00", 0)` | `2026-10-14T21:00:00.000Z` (con estimado 0, `complete` usa `horaEjecucion` tal cual) |
| V7 | `fechaVencimiento` de la Tarea del 2026-10-14 | `2026-10-14T03:00:00.000Z` |
| V8 | V1–V7 con `TZ=UTC` y con `TZ=Asia/Tokyo` | Idénticos (G2b) |

**Supuesto [S] que la verificación de código no cierra:** el 50 % termina a las 22:00 de la zona **del servidor** (`setHours`, L71). En un servidor en UTC terminaría a las 19:00 de Montevideo. El informe anota la zona con la que corre el despliegue, si se conoce; no es un error de las lanes.

### 6.2 Pacing (`repartir`, ARQ §4)

| # | Entrada | Esperado |
|---|---|---|
| P1 | 300 páginas, `2026-03-02` → `2026-11-30`, lun–vie, sin días no lectivos | 196 días disponibles y 196 creados; primero `2026-03-02` [1–1]; último `2026-11-30` [299–300]; cada día con 1 o 2; suma 300; sin `aviso` |
| P2 | 10 unidades, `2026-10-12` → `2026-10-14`, lun–vie | `10-12` [1–3], `10-13` [4–6], `10-14` [7–10] |
| P3 | 3 unidades, `2026-10-01` → `2026-10-14`, lun–vie (10 días disponibles) | Solo 3 días: `10-06` [1], `10-09` [2], `10-14` [3]. Ningún día con 0 |
| P4 | 100 unidades, `unidadesBase` 40, `2026-10-12` → `2026-10-23`, lun–vie, no lectivo `2026-10-16` | 9 días; primero `10-12` [41–46]; último `10-23` [94–100]; `10-16` ausente; suma 60 |
| P5 | 100 lecciones, `2026-10-12` → `2026-10-16`, lun–vie | `aviso.tipo = "sobrecarga"` (promedio 20 > 4) con 3 `opciones` |
| P6 | 5 unidades, `2026-10-17` → `2026-10-18` (sáb–dom), lun–vie | `aviso.tipo = "sin_dias"`, `dias = []` |
| P7 | 2 unidades, `2026-10-12` → `2026-10-25`, `diasSemana: [7]` | `10-18` [1] y `10-25` [2]: solo domingos |
| P8 | P1 dos veces | Salidas idénticas (`JSON.stringify`) |
| P9 | `totalUnidades` 50, `unidadesBase` 50 | `dias = []`, sin `aviso` |

### 6.3 `sincronizarDia` (ARQ §5.3) — los 10 valores de `EstadoTarea` de `prisma/schema.prisma`

| Estado de la Tarea | Día `pendiente` pasa a |
|---|---|
| `Completada`, `Esperando_Aprobacion`, `Aprobada` | `hecha` |
| `Pendiente`, `En_progreso`, `Pausada`, `Rechazada`, `Vencida`, `Expirada`, `No_Realizada` | sigue `pendiente` |
| Cualquiera, con el día en `movida` u `omitida` | no cambia |
| Tarea borrada (`tareaId = null`) | sigue `pendiente`; se recrea solo si el día es hoy |

### 6.4 `estaBloqueado` (ARQ §5.4)

| Caso | Esperado |
|---|---|
| Día de hoy con días anteriores pendientes o movidos | libre |
| Día futuro, sin `navegacionLibre` | bloqueado |
| Día futuro, con `navegacionLibre`, anterior `hecha` | libre |
| Día futuro, con `navegacionLibre`, anterior `omitida` | libre |
| Día futuro, con `navegacionLibre`, anterior `pendiente` | bloqueado |
| Lección k sin `ProgresoLeccion` de la k−1 del mismo día | bloqueada |
| Primera lección del día | libre (si el día lo está) |

### 6.5 Guardia y permiso de `complete`

| `motivoBloqueoTarea` (ARQ §5.5) | Esperado |
|---|---|
| Tarea sin `DiaLectivo` | `null` (un solo `findUnique`) |
| Día `movida` u `omitida` | texto → 400 |
| Recurso con lecciones, falta un `ProgresoLeccion` del rango | texto → 400 |
| Todas las lecciones del rango hechas | `null` |
| Recurso sin lecciones (libro o PDF), día `pendiente` | `null` |

| `puedeCompletarTarea` | Esperado |
|---|---|
| `{ id: 5, rolFamiliar: "Hijo" }` con asignado 5 | `true` |
| `{ id: 1, rolFamiliar: "Padre" }` y `{ id: 2, rolFamiliar: "Madre" }` con asignado 5 | `true` |
| `{ id: 6, rolFamiliar: "Hijo" }` / `"Hija"` con asignado 5 | `false` |
| `{ id: "5" }` (string) con asignado 5 | `true` |
| Sin `rolFamiliar`, id distinto | `false` |

Orden en `complete` (lo comprueba el script): 401 → 404 → **403 permiso** → 400 estado → **400 guardia** → checklist → cálculo de puntos.

### 6.6 `video.ts`

| Entrada | Esperado |
|---|---|
| `https://youtu.be/dQw4w9WgXcQ` | `{ plataforma: "youtube", videoId: "dQw4w9WgXcQ" }` |
| `https://www.youtube.com/watch?v=dQw4w9WgXcQ` | ídem |
| `https://www.youtube.com/watch?feature=share&v=dQw4w9WgXcQ` | ídem |
| `https://www.youtube.com/embed/dQw4w9WgXcQ` | ídem |
| `https://www.youtube.com/shorts/dQw4w9WgXcQ` | ídem |
| `https://m.youtube.com/watch?v=dQw4w9WgXcQ` | ídem |
| `https://vimeo.com/76979871` | `{ plataforma: "vimeo", videoId: "76979871" }` |
| `https://player.vimeo.com/video/76979871` | ídem |
| `https://youtu.be/dQw4w9WgXc` (10) y `https://youtu.be/dQw4w9WgXcQQ` (12) | `null` (el id termina en fin de texto o en `?`, `&`, `#`, `/`) |
| `https://example.com/x`, `""`, `"no es url"` | `null` |
| `urlEmbed("youtube", "dQw4w9WgXcQ")` | `https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0` |
| `urlEmbed("vimeo", "76979871")` | `https://player.vimeo.com/video/76979871` |
| Miniaturas | `https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg` y `https://vumbnail.com/76979871.jpg` |

### 6.7 Quizzes y checkpoints

| Función | Entrada | Esperado |
|---|---|---|
| `calcularNota` | 0 de 3 · 7 de 10 · 2 de 3 · 3 de 3 · sin preguntas | 0 · 70 (aprueba con umbral 70: `>=`) · 67 · 100 · 100 |
| `proximoCheckpoint` (X21) | checkpoints `[30, 90, 150]`, respondidos `{}`, `t = 29` | ninguno |
| | ídem, `t = 30` | 30 (`>=`, no `===`) |
| | respondidos `{}`, `t = 95` (adelantó) | 30: el **primero** sin responder con `segundoVideo ≤ t` |
| | respondidos `{30}`, `t = 200` | 90 |
| | respondidos `{30, 90, 150}`, `t = 200` | ninguno |
| ts-fsrs (API) | `node --input-type=module -e 'import * as f from "ts-fsrs"; console.log(typeof f.createEmptyCard, typeof f.fsrs, f.Rating.Again, f.Rating.Good)'` | `function function 1 3` [V 2026-10-14 con ts-fsrs 5.4.2 en un directorio aparte] |
| ts-fsrs (comportamiento) | `createEmptyCard(t0)` con `t0 = 2026-10-14T12:00:00Z`, `fsrs()` con parámetros por defecto, `next(card, t0, rating).card.due` | `Good` → `2026-10-14T12:10:00.000Z`; `Again` → `2026-10-14T12:01:00.000Z` [V]. Si `servidor/repaso.ts` cambia los parámetros, vale solo la relación «`Good` más lejos que `Again`» |

### 6.8 `sumarHoras` (H5)

| Caso | Esperado |
|---|---|
| Una actividad de 90 min con 2 hijos en Ciencias | 90 min en Ciencias **para cada uno** |
| Una actividad con 3 participantes | suma a los 3 |
| Día `hecha` con `tiempoRealEjecucionSeg = 1500` | 25 min |
| Día `hecha` con `tiempoRealEjecucionSeg` 0 o `null`, 3 unidades × 20 min | 60 min |
| Días `pendiente`, `movida` u `omitida` | no suman horas |
| Actividad fuera del período pedido | no suma |

### 6.9 Matriz de permisos (HD15; plan §3.2 «los `userId` del cliente se ignoran si llama un hijo»)

| Operación | Padre/Madre | Hijo, sobre lo suyo | Hijo, sobre lo de un hermano |
|---|---|---|---|
| Crear, editar o borrar materia, recurso, lección o plan; días no lectivos; mover u omitir días | sí | 403 | 403 |
| Leer materias y cursos | todos | solo con un plan suyo | no los ve si no tiene plan |
| `GET hoy`, completar lección | — | sí | 403/404 (aunque mande el `userId` del hermano) |
| Completar la Tarea del día (`complete`) | sí | sí | 403 (HS-SEG) |
| Desmarcar lección | sí | 403 | 403 |
| Crear evidencia, ver las propias | ve todas | sí | no las ve (HD15) |
| Aprobar, pedir ajuste, destacar | sí | 403 | 403 |
| Editar preguntas | sí | 403 | 403 |
| Ver preguntas | — | sin `correcta` ni `explicacion` | 403/404 |
| Actividades y metas (escribir) | sí | 403 | 403 |
| Modo relajado | sí | sí (el propio) | 403 |
| Historias sociales (escribir) | sí | 403 | 403 |

Cómo se verifica:
- **[T]** si el chequeo es una función pura (preferible, como `esPadre` y `usuariosObjetivo`).
- **[L]** en cada función de `servidor/*`: el `where` usa `s.id` de la sesión cuando quien llama es hijo.
- **(DB)** para la prueba de punta a punta.

---

## 7. Mutaciones: prueban que los tests vigilan las reglas

Procedimiento, en el worktree de verificación:
1. Aplicar el cambio.
2. Correr `npm test 2>&1 | grep -E '^ℹ (pass|fail)'`; **debe aparecer `fail` ≥ 1**.
3. Deshacer con `git restore <archivo>`.
4. Si ningún test falla, es **NO CUMPLE Mayor**: la regla no tiene test.

| # | Lane | Archivo | Cambio temporal | Test que debe fallar |
|---|---|---|---|---|
| M1 | HS0 | `video.ts` | `youtube-nocookie.com` → `youtube.com` | `video.test.ts` (urlEmbed) |
| M2 | HS0 | `video.ts` | aceptar ids de 10 a 12 caracteres | `video.test.ts` (10 y 12) |
| M3 | HS0 | un componente de `src/components/homeschooling/roost/` | agregar `className="dark:bg-surface-900"` | `guarda.test.ts` |
| M4 | HS0 | ídem | borrar la línea `// Portado de …` | `guarda.test.ts` |
| M5 | H1a | `pacing.ts` | `getISODay` → `getDay` | test 7 (solo domingos) |
| M6 | H1a | `pacing.ts` | crear también los días con 0 unidades | test 8 |
| M7 | H1a | `pacing.ts` | ignorar `noLectivos` | test 3 |
| M8 | H1a | `pacing.ts` | ignorar `unidadesBase` | test 4 |
| M9 | HS-SEG | `tareas/permisos.ts` | `return true` | hermano → no |
| M10 | HS-SEG | `tareas/permisos.ts` | comparar sin `Number(…)` | `"5"` contra `5` |
| M11 | H1b | `roost/dto.ts` | `display_order` → `orden` en la salida | test de `dto.ts` |
| M12 | H2 | `servidor/hoy.ts` | no restar `estimadoSeg` en `vencimientoLeccion` | V1 |
| M13 | H2 | `servidor/hoy.ts` | armar la hora con `new Date(a, m, d, 18)` (hora del servidor) | V1 con `TZ=UTC` (G2b) |
| M14 | H2 | `servidor/progreso.ts` | bloquear hoy si el anterior está pendiente (regla v2) | «hoy siempre libre» |
| M15 | H2 | `servidor/progreso.ts` | contar `Rechazada` como `hecha` | tabla §6.3 |
| M16 | H2 | `servidor/guardia.ts` | `return null` siempre | «faltan lecciones → texto» |
| M17 | H4 | `servidor/quiz.ts` | incluir `correcta` en `preguntasParaAlumno` | test de forma |
| M18 | H4 | `proximoCheckpoint` | `>=` → `===` | salto de tiempo |
| M19 | H4 | `calcularNota` | sin preguntas → 0 | «sin preguntas → 100» |
| M20 | H4 | `servidor/repaso.ts` | invertir `Good` y `Again` | «el acierto aleja `proximo`» |
| M21 | H5 | `servidor/horas.ts` | contar días `pendiente` | «pendiente no cuenta» |
| M22 | H5 | `servidor/horas.ts` | sumar solo al primer participante | «3 participantes» |
| M23 | H6 | normalización de pasos | aceptar 6 pasos | «3 a 5 pasos» |

---

## 8. Cumplimiento del plan (auditoría final; en B, las filas de la lane)

### 8.1 Decisiones D-1…D-20 (plan §10)

| D | Cómo se verifica | Evidencia |
|---|---|---|
| D-1 Portar a Next | [G] | Nada de `vendor/roost/server` ni de otro servidor; sin `@supabase/supabase-js` (script E) |
| D-2 Services partidos con la misma firma | [G] | Scripts C y H |
| D-3 DTO snake_case, ids `number` | [T][G] | HS0-01, H1b-03 |
| D-4 Contenido familiar, plan por alumno | [E] | `Materia`, `RecursoCurso` y `LeccionCurso` sin `alumnoId`; `PlanCurso` con `@@unique([recursoId, alumnoId])` (script F) |
| D-5 Día = Tarea con `horaEjecucion = 18:00 − estimado` | [V][L] | §6.1, checklist T1–T12 |
| D-6 Clases traducidas + test de guarda | [G][M] | Script B, M3–M4 |
| D-7 `CalendarView` + `withDragAndDrop`; `MissionCalendar` intacto | [G] | HS0-05, protegidos (script A) |
| D-8 `react-dropzone@14.3.8` | [G] | Script E |
| D-9 `LeccionCurso` en H1a | [D] | El diff del merge de H1a contiene `model LeccionCurso` |
| D-10 `ProgresoLeccion` + `IntentoQuiz` aparte | [E][G] | Script F; `grep -nE "mejorNota\|fallosSeguidos" prisma/schema.prisma` vacío |
| D-11 ts-fsrs | [G][T] | H4-07; sin intervalos fijos en `servidor/repaso.ts` |
| D-12 react-player | [G] | `VisorLeccion` importa `react-player` |
| D-13 Evidencia sin votos ni reseñas; estrellas sin monedas | [E][G] | Sin columnas de votos; script D (saldos) |
| D-14 Actividades con participantes | [E][V] | `ParticipanteActividad`; §6.8 |
| D-15 Feriados a mano | [G] | `grep -rn "date-holidays" src package.json` vacío |
| D-16 18:00 en `config.ts` | [G][V] | Script E; §6.1 |
| D-17 Atrasos reprogramados; hoy nunca bloqueado | [V][L] | §6.4; R1–R6 |
| D-18 Guardia en `complete` | [G][V] | Script D; §6.5 |
| D-19 HS-SEG | [G][V] | Script D; §6.5 |
| D-20 Lanes por código | [L] | Ramas y registros con su código (script A los reconoce) |

### 8.2 Decisiones de arquitectura HD1…HD16

| HD | Cómo se verifica |
|---|---|
| HD1 | Script D: sin saldos ni endpoint de premios; `DiaLectivo.tareaId` en el esquema |
| HD2 | §6.1 y G2b |
| HD3 | §6.3 |
| HD4 | [L]: el avance (`progress_percentage`, reportes) sale de `DiaLectivo`; `ProgresoLeccion` solo para recursos con lecciones |
| HD5 | = D-4 |
| HD6 | [L]: `DiaNoLectivo` con una fila por alumno (`@@unique([alumnoId, fecha])`) |
| HD7 | `grep -rniE "carnegie\|\bgpa\b\|jurisdic" $HS` vacío |
| HD8 | H3-05; ningún `accept` de audio en `src/components/homeschooling` |
| HD9 | H4-02, §6.7 |
| HD10 | = D-11 |
| HD11 | `grep -rniE "\bcartas?\b" src/lib/homeschooling src/app/api/homeschooling` vacío, salvo comentarios |
| HD12 | [L]: ninguna lane H importa módulos de N2/N13/N4 que no existan (tsc) ni los espera |
| HD13 | `grep -rniE "xapi\|\blti\b\|openai\|anthropic\|tesseract\|MediaRecorder" $HS` vacío |
| HD14 | Script E (pacing puro); `grep -rn "APP_TZ *=" src/lib/homeschooling` vacío (se reutiliza el de `habitos/server.ts`); fechas `YYYY-MM-DD` en las firmas de `servidor/*` |
| HD15 | §6.9, H3-07 |
| HD16 | Script E |

### 8.3 Contradicciones resueltas X1…X21 (plan §9): que no vuelvan

| X | Control de regresión |
|---|---|
| X1 | Script G: hay archivos portados, no «solo referencia visual» |
| X2 | `grep -rn "Downloads/dev/roost" src` vacío |
| X3 | Las fotos van por `subirImagen` (H3-05), sin `POST /api/archivos` |
| X4 | Script D (`experienciaHabitos`) |
| X5 | Checklist T11 |
| X6 | H1b-08 (sin `MissionCalendar` en Homeschooling) |
| X7 | H3-09 |
| X8 | Se acepta la URL pública: solo se comprueba `claveDeUrl` (H3-05) |
| X9 | `grep -rnE "getDatabase\|\bdb\(\)" src/lib/homeschooling` vacío |
| X10 | H4-07 |
| X11 | §6.3 incluye `No_Realizada` |
| X12 | §6.4 «hoy siempre libre»; M14 |
| X13 | §6.5; M16 |
| X14 | Script E (`Estudio`) |
| X15 | H2-14 |
| X16 | H1a-10 |
| X17 | H1b-05 |
| X18 | Script A (códigos de lane) |
| X19 | G6 |
| X20 | H6-03 |
| X21 | §6.7 (`proximoCheckpoint`) |

### 8.4 Respuestas del usuario P1…P5

| P | Verificación |
|---|---|
| P1 Cursos compartidos | D-4 |
| P2 Solo sus evidencias | HD15 |
| P3 18:00 | §6.1 |
| P4 Feriados a mano | D-15 |
| P5 HS-SEG | SEG-01…06; script D |

### 8.5 Portado de Roost

Script G (39 pares). En C se corre con `VERIF_FINAL=1`: todo destino tiene que existir y citar su origen.

Además, a mano y por muestreo (3 archivos por lane), se compara cada portado con su origen:

```bash
diff <(sed 's/[[:space:]]\+/ /g' vendor/roost/src/components/groups/learn/ModuleCard.tsx) \
     <(sed 's/[[:space:]]\+/ /g' src/components/homeschooling/cursos/CursoCard.tsx)
```

Las diferencias tienen que ser solo:
- imports;
- clases traducidas con la tabla del plan §2.3;
- textos en español;
- lo que la cabecera lista en «Cambios».

La lógica de estado y navegación no cambia (plan §2.2 punto 5). Si el diff muestra lógica reescrita sin motivo en la cabecera, es Menor; si además cambia el comportamiento, es Mayor.

### 8.6 Lo recortado no entró (plan §8)

```bash
grep -rniE "react-quill|dompurify|leaderboard|live-?room|RSVP|showcase_votes|meeting_url" $HS
```

Esperado: vacío. Además, en `package.json` no aparecen `react-quill-new`, `dompurify` ni `@stripe/*` traídos por una lane de Homeschooling.

### 8.7 Supuestos [S]: cada uno resuelto en el registro de su lane

| [S] | Lane | Cómo se cierra por código | Si no se cerró |
|---|---|---|---|
| Zona horaria del servidor (corte del 50 %, 22:00) | H2 | No se cierra por código: el informe anota la zona del despliegue, si se conoce | Se anota; no es falla de la lane |
| react-dropzone reenvía `capture` | H3 | Leer en `node_modules/react-dropzone` que `getInputProps` propaga los props extra al `<input>`; el registro dice qué se usó | Debe estar el `<input capture>` de respaldo |
| Evento de tiempo y `youtube-nocookie` en react-player 3.4.0 | H4 | Leer los tipos de `node_modules/react-player` (prop de tiempo) | Desvío registrado (Menor) |
| Nombres de la API de ts-fsrs 5.4.2 | H4 | Comando de §6.7: ya confirmado en la lane 119 (`createEmptyCard`, `fsrs`, `Rating`, `next(card, ahora, rating).card`) | Mayor |
| Feriados de Uruguay en `date-holidays` | — | No aplica (D-15) | — |

---

## 9. NO VERIFICABLE AQUÍ (necesita base real)

Por AGENTS.md §6, los tests que escriben en la base de producción solo corren con `PERMITIR_TESTS_DB=1` y solo si el usuario lo pide. Sin eso, estos requisitos quedan verificados **solo por lectura** ([L]) y el informe los marca así:

| Requisito | Test que lo cubriría | Lo que sí se verifica sin base |
|---|---|---|
| H1a-05: dos alumnos, mismo recurso, planes independientes | H1a test 11 | Checklist H1a-05; `@@unique([recursoId, alumnoId])` |
| H1a-08: `recalcular` | H1a test 12 | R1–R6 |
| H2-03: `asegurarTareasDeHoy` sin carreras, `creadorId`, reprogramación | Tests de H2 con base | T1–T12; `updateMany` (script E) |
| §6.9: permisos de punta a punta | Tests de permisos con base | Funciones puras y `where` con la sesión |
| H3-04: aprobar o destacar no toca saldos | Test de H3 con base | Script D: ningún archivo de Homeschooling nombra esos campos |

Si el usuario autoriza una corrida, se hace en el worktree de verificación con `PERMITIR_TESTS_DB=1 npm test`. Antes se confirma que cada test de base limpia lo que crea (como `src/lib/cartas/admin.test.ts`), y en el informe se anota fecha y resultado.

## 10. Lo que queda para el usuario (navegador)

| Lane | Criterio de aceptación | Lo que ya cubrió esta verificación |
|---|---|---|
| HS0 | 3: `CalendarView` en claro y oscuro con los colores del tema | Sin `<style>` ni hex, clase `mission-calendar` (HS0-05) |
| HS-SEG | 2: prueba con dos hijos | 403 y orden en `complete`; tests y vectores §6.5 |
| H1b | 1–4 y capturas: asistente, miniaturas, «Hoy no hay clase», arrastre | Vectores de pacing (P1 = criterio 1), `vistaPrevia`, `moverDia` entre vecinos, `draggableAccessor` |
| H2 | 1 y 6: lo que ve el niño; capturas | 2–5 por código: guardia (§6.5), 18:00 (§6.1), tope de `complete` (L30), permisos |
| H3 | 1–2: foto desde la tablet; sentido del deslizamiento | `capture` o su respaldo (H3-10); *handlers* de `SwipeRow` (H3-11); permisos (H3-07) |
| H4 | 1: el video se pausa en el segundo configurado | `proximoCheckpoint` (§6.7); la API no envía `correcta` (H4-02) |
| H5 | 2: imprime sin la interfaz | `print:hidden` y `@media print` (H5-09) |
| H6 | 1–3: aspecto sereno, Primero/Después, historias | Confeti condicionado (H6-03), bloque sin hex (H6-02), funciones puras (H6-06/07) |

---

## 11. Informe de verificación (plantilla)

Archivo: `vault/nuevas-features/homeschooling/verificacion/VERIF_<CODIGO>_<AAAA-MM-DD>.md`, o `AUDITORIA_FINAL_<AAAA-MM-DD>.md`.

```markdown
# Verificación <CODIGO> — <fecha>

- Lane verificada: <rama> (merge <hash> en dev) · Verificador: <agente/sesión> · Commit de dev: <hash>
- Momento: A | B | C · Worktree: ../ordo-diei-lanes/verif-hs-<fecha> (eliminado al terminar: sí/no)

## Resultado
CUMPLE | CUMPLE CON OBSERVACIONES | NO CUMPLE — <una línea>

## Puertas (§2)
| G | Resultado | Salida relevante |

## Script de invariantes
<pegar el bloque «Resultado: N FALLA, M MIRAR» y cada FALLA/MIRAR con su resolución (§4.2)>

## Requisitos de la lane (§5)
| ID | Veredicto | Evidencia (archivo:línea, test, comando) |

## Vectores (§6) y mutaciones (§7)
| Vector/Mutación | Esperado | Obtenido | Veredicto |

## Hallazgos
| # | Severidad | Requisito | Qué pasa | Dónde | Lane fix propuesta |

## No verificable aquí / para el usuario
<lista de §9 y §10 que aplican a esta lane>
```

## 12. Cuándo se da por cumplido el plan

1. Las 9 lanes están integradas y cada una tiene su informe B **sin** Bloqueantes ni Mayores abiertos.
2. La auditoría C da `0 FALLA` con `VERIF_FINAL=1 VERIF_BASE=1`, `next build` en verde y G2b en verde.
3. Las matrices §8.1–8.7 están completas: cada fila CUMPLE o DESVÍO REGISTRADO.
4. Lo de §9 está verificado por lectura o con una corrida autorizada, y lo de §10 se le entregó al usuario como lista de pruebas.
