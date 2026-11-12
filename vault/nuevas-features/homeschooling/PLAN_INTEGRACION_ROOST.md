# Homeschooling sobre Roost — plan de integración (v3.1)

> Lane 115 (v3) · lane 117 (v3.1, 2026-10-14: respuestas del usuario y contradicciones resueltas) · Roost en `vendor/roost/` (commit `492af47`, ver `vendor/roost/ORIGEN.md`).
> **Este es el documento de entrada para implementar Homeschooling.** Cómo se comprueba que lo implementado cumple este plan: [`PLAN_VERIFICACION.md`](PLAN_VERIFICACION.md) (lane 119). Reemplaza el supuesto «Roost = solo referencia visual» y «extender `MissionCalendar`». Todos los documentos de esta carpeta ya están alineados con él (§9).
>
> **Convención de evidencia.** **[V]** = VERIFICADA: leí el código o ejecuté el comando citado. **[S]** = SUPUESTA: la lane que la use debe confirmarla antes de codear (cada una dice cómo y qué hacer si falla). Las rutas sin prefijo son de Ordo (`src/…`); las de Roost llevan `vendor/roost/`.

## Cómo usar este plan (para el agente que implementa)

1. Leer `AGENTS.md` (git, worktrees, `scripts/integrar.sh`, **prohibido `prisma db push`**) y la doc local de Next 16 (`node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md` y `15-route-handlers.md`).
2. Leer este plan §2–§4 y [`ARQUITECTURA_DETALLADA.md`](ARQUITECTURA_DETALLADA.md) (esquema Prisma definitivo, pacing, puente con Tareas).
3. Elegir la siguiente lane de §6 cuyas dependencias ya estén integradas en `dev` y seguir **su** `LANE_*.md` (entregables, origen → destino, tests, aceptación).
4. **Número de lane = el siguiente libre al crearla** (`git worktree list`, `git branch -a`, `ls vault/LANE_*`): otros agentes trabajan en paralelo y los números se ocupan rápido.
5. Antes de integrar: **autoverificación** según [`PLAN_VERIFICACION.md`](PLAN_VERIFICACION.md) (puertas §2, `verificacion/verificar_invariantes.sh <CODIGO>`, tu bloque de §5 y tus mutaciones de §7), con el resultado en tu registro.
6. Al terminar: registro `vault/LANE_NN_*.md`, `scripts/integrar.sh`, limpiar worktree y rama. Después, otra sesión hace la verificación independiente (momento B de `PLAN_VERIFICACION.md`).

---

## 0. Resumen ejecutivo

1. **Se porta Roost a Next (client components) y se reescribe solo la capa de datos** (opción a). El Express de Roost no aporta nada: no tiene ni una ruta de cursos, eventos o showcase [V `vendor/roost/server/src/index.ts:126-139`].
2. **No se escribe un adaptador Prisma del `DatabaseAdapter`**: ningún service ni componente lo llama [V]. Cada service se parte en dos con **la misma firma**: cliente (`fetch`) y servidor (Prisma). Los componentes portados solo cambian imports.
3. **Modelo:** `groups→Materia`, `modules→RecursoCurso`, `recordings→LeccionCurso`, `lesson_completions→ProgresoLeccion`, `events`+`event_attendees→ActividadOffline`+`ParticipanteActividad`, `showcases`+`showcase_images→EvidenciaAprendizaje`+`EvidenciaImagen`. `Usuario`, `Tarea` y `Archivo` se reutilizan. Contenido familiar, **plan por alumno**.
4. **Cada día lectivo es una `Tarea`** (Roost no premia lecciones [V]). Paga completo **hasta las 18:00** (decisión del usuario): la Tarea se crea con `horaEjecucion = 18:00 − tiempo estimado`, porque `complete` suma ese tiempo [V L49-55].
5. **Guardia en `complete`:** la Tarea de un día no se puede completar desde el tablero de Tareas sin haber hecho sus lecciones (una sola llamada agregada en la ruta, lane H2).
6. **Se revoca «extender `MissionCalendar`»**: se porta `CalendarView` de Roost (date-fns) con el arrastre de `react-big-calendar`; `MissionCalendar` no se toca.
7. **Estilos:** clases de Roost traducidas a tokens y `src/components/ui` con una tabla fija y un test de guarda.
8. **Se escribe desde cero solo lo que Roost no tiene:** pacing, días no lectivos, puente con `Tarea`, corrección de quizzes, armado de reportes. Repaso con **ts-fsrs**, checkpoints con **react-player**, gráficos con **recharts** (ya instalado).
9. **Dependencias nuevas:** `react-dropzone@14.3.8` (H3), `react-player@3.4.0` y `ts-fsrs@5.4.2` (H4).
10. **Lanes:** HS0, H1a y HS-SEG (en paralelo) → H1b → H2 → H3, H4, H5, H6 (en paralelo). Se recorta feed, mensajes, live room, leaderboard, votos, Stripe y auth de Roost.

---
## 1. Inventario de Roost

Tamaños medidos con `wc -l` [V]. Veredicto: **USAR** = se copia casi literal (cambian imports y clases); **PORTAR** = se copia y se adapta datos/router/auth/estilos; **DESCARTAR** = no entra (motivo).

### 1.1 LMS (`vendor/roost/src/components/groups/learn/`, 1.429 líneas)

| Archivo | Líneas | Qué hace | Depende de | Veredicto | Motivo / destino |
|---|---|---|---|---|---|
| `LearnGroupLayout.tsx` | 325 | Orquesta grilla → módulo → lección por `?module=&lesson=`; carga módulos y grabaciones; modales de alta | `react-router-dom` `useSearchParams`, `useAuth`, `services/module`, `CommentSection` | **PORTAR** | Esqueleto de la vista de materia (padre e hijo). Se quita `CommentSection` y `UploadAssetsModal`. Destino `src/components/homeschooling/cursos/MateriaLayout.tsx` (lane H1b; modo hijo en H2) |
| `LessonPlayer.tsx` | 152 | Iframe 16:9 YouTube/Vimeo (`getEmbedUrl` L30), anterior/siguiente, marcar/desmarcar (`handleToggleComplete` L39) | `services/module` | **PORTAR** | `VisorLeccion`. El «desmarcar» (L43) **se elimina para hijos** (sería premio repetible, AUDITORÍA A6). Dominio `youtube-nocookie.com`. Lane H2 |
| `LearnSidebar.tsx` | 175 | Lista de módulos con progreso y lecciones con check; cajón móvil | `ProgressBar` | **PORTAR** | `LeccionesDelDia` con candado (`Lock`) y gris para lo bloqueado. El cajón móvil se reemplaza por `Sheet` de `ui/`. Lane H2 |
| `ModuleGrid.tsx` | 87 | Grilla de módulos, estado vacío, «Add Module» si `canManage` | `ModuleCard` | **PORTAR** | `CursoGrid` (padre). Estado vacío con `Empty` de `ui/`. Lane H1b |
| `ModuleCard.tsx` | 60 | Tarjeta con miniatura, título, % | — | **PORTAR** | `CursoCard` (padre, H1b) y variante grande `TarjetaHoy` (hijo, H2) |
| `ModuleDetail.tsx` | 290 | Cabecera de módulo, pestañas grabaciones/assets, miniaturas YouTube/Vimeo, editar/borrar | `services/module` | **PORTAR** | `CursoDetalle`. Pestaña «assets» fuera (ver `UploadAssetsModal`). Lane H1b |
| `ManageModuleModal.tsx` | 242 | Alta/edición de módulo con portada (`uploadImage`) | `services/module`, `services/s3` | **PORTAR** | Campos del paso «Recurso» del asistente. `uploadImage` → `subirImagen` de Ordo (`src/lib/subirImagen.ts`, misma forma `{url}` [V]). Lane H1b |
| `CompactGroupHeader.tsx` | 59 | Cabecera compacta del grupo | `react-router-dom`, `hasPermission` | **PORTAR** | `MateriaHeader`. Lane H1b |
| `ProgressBar.tsx` | 30 | Barra de % | — | **DESCARTAR** | Ordo ya tiene `src/components/ui/progress.tsx` [V]; dos barras sería un duplicado (regla `ui-work-rules`) |

### 1.2 Grupos, video y adjuntos (`components/groups/`, resto)

| Archivo | Líneas | Qué hace | Veredicto | Motivo / destino |
|---|---|---|---|---|
| `AddRecordingModal.tsx` | 257 | Alta de grabación por URL; parsea YouTube (L54) y Vimeo (L64), vista previa | **PORTAR** | `LeccionForm` (H1b). Las regex se extraen a `src/lib/homeschooling/video.ts` (HS0). La de YouTube **no reconoce `/embed/` ni `watch?…&v=`** [V lectura de la regex L54]: se amplía y se testea |
| `VideoPlayerModal.tsx` | 91 | Modal con iframe | **DESCARTAR** | `VisorLeccion` ya cubre el caso |
| `CreateGroupModal.tsx` | 417 | Alta de grupo (nombre, descripción, privacidad, portada, modo) | **PORTAR (reducido)** | Solo nombre, descripción y portada (+ ícono, color y dificultad de Ordo) → `MateriaForm` (H1b). Privacidad/modo/plan pago son de comunidad |
| `UploadAssetsModal.tsx`, `GroupAssets.tsx` | 246 + 249 | Adjuntos S3 por módulo | **DESCARTAR (v1)** | `Archivo` solo acepta imágenes [V `src/lib/archivos.ts:18`]; los PDF van como enlace en la lección |
| `GroupMembers.tsx`, `GroupHeader.tsx`, `GroupTabs.tsx`, `GroupCard.tsx`, `GroupRecordings.tsx`, `RecordingCard.tsx`, `DefaultGroupLayout.tsx`, `SidebarGroupLayout.tsx`, `MarkdownPreviewModal.tsx`, `groupTabsConfig.ts` | ~1.400 | Comunidad: miembros, pestañas de feed, layouts de grupo | **DESCARTAR** | La «membresía» la da el plan por alumno; el resto es feed/comunidad |

### 1.3 Calendario y eventos

| Archivo | Líneas | Qué hace | Veredicto | Motivo / destino |
|---|---|---|---|---|
| `components/calendar/CalendarView.tsx` | 303 | `react-big-calendar` con `dateFnsLocalizer` (L13), vistas mes/semana/día/agenda, colores por estado, `<style>` oscuro con hex (L114) | **PORTAR** | `src/components/homeschooling/roost/CalendarView.tsx` (HS0): locale `es`, se quita el `<style>` y se usa la clase `mission-calendar` (tokens, `src/components/tasks/mission-calendar.css` [V]); se desacopla de `EventDetails/EventForm` (pasan a props) y se envuelve con `withDragAndDrop` [V existe `node_modules/react-big-calendar/lib/addons/dragAndDrop/withDragAndDrop.js`] |
| `pages/Calendar.tsx` | 218 | Página: carga eventos del mes, próximos, crear | **PORTAR** | `PlanCalendario` del padre (H1b). Se elimina el N+1 de L42-55 (§7.6) |
| `components/events/EventForm.tsx` | 275 | Título, descripción, inicio/fin `datetime-local`, lugar, virtual, grupo | **PORTAR** | `ActividadForm` (H5): sin virtual/meeting/grupo; con materia y alumnos |
| `EventCard.tsx`, `EventDetails.tsx` | 132 + 207 | Tarjeta y detalle con RSVP | **PORTAR** | `ActividadCard`, `ActividadDetalle` (H5), sin RSVP |
| `AttendeeList.tsx` | 160 | Lista de asistentes | **PORTAR** | `ParticipantesList`: qué hijos participaron (H5) |
| `RSVPButton.tsx` | 101 | going/maybe/not going | **DESCARTAR** | En familia no hay confirmación de asistencia |

### 1.4 Showcase → evidencia y portafolio

| Archivo | Líneas | Qué hace | Veredicto | Motivo / destino |
|---|---|---|---|---|
| `pages/ShowcaseSubmit.tsx` | 726 | Asistente de 3 pasos; `useDropzone` (L229, L237); borrador en `localStorage` (L33, L80-156) | **PORTAR (parcial)** | Solo el bloque de imágenes (dropzone + vista previa) y el borrador → `EnviarEvidencia` (H3). URL, tagline, categoría, stack y editor rico no aplican |
| `pages/admin/Showcases.tsx` | 459 | Moderación: contadores, filtro por estado, aprobar, rechazar con motivo, destacar/quitar | **PORTAR** | `RevisionEvidencias` (H3). Cada fila usa `SwipeRow` de Ordo (izq. aprueba) [V `src/components/SwipeRow.tsx`] |
| `pages/Showcase.tsx` | 425 | Galería con filtros y estados | **PORTAR** | `Portafolio` (H3) |
| `components/showcase/ShowcaseCard.tsx` | 140 | Tarjeta | **PORTAR** | `EvidenciaCard` (H3); `Link` de react-router → `next/link` |
| `ShowcaseFilters.tsx` | 198 | Filtros categoría/tags | **PORTAR** | Filtros alumno/materia/mes (H3). `ShowcaseFilterSidebar.tsx` (239) **DESCARTAR**: duplica a `ShowcaseFilters` |
| `ShowcaseReviews.tsx` | 444 | Reseñas; incluye `StarRating` (L22-64) | **PORTAR solo `StarRating`** | Estrellas del padre (HS0). Reseñas múltiples y respuesta del autor no aplican |
| `ShowcaseVoteButton.tsx`, `pages/ShowcaseDetail.tsx` | 113 + 606 | Votos y detalle público con `DOMPurify` | **DESCARTAR** | Sin votos ni HTML rico; el detalle es un `Sheet` con la `EvidenciaCard` |

### 1.5 Services (`vendor/roost/src/services/`, 28 archivos, 8.783 líneas)

| Service | Líneas | Funciones que se portan (mismo nombre y firma) | Veredicto |
|---|---|---|---|
| `module.ts` | 371 | `getModulesWithProgress`, `getModuleById`, `createModule`, `updateModule`, `deleteModule`, `reorderModules`, `getModuleRecordings`, `markLessonComplete`, `getAdjacentRecordings`, `getRecordingById`. `markLessonIncomplete` solo para padres. `getModuleAssets` y `getUserCompletionsForGroup` fuera | **PORTAR** (H1b/H2) |
| `group.ts` | 783 | `createRecording` (L699), `updateRecording`, `deleteRecording` (L736), `hasPermission` (L599, con roles mapeados) | **PORTAR parcial** (H1b) |
| `event.ts` | 403 | `getEventsInRange`, `createEvent`, `updateEvent`, `deleteEvent`, `getEventAttendees` | **PORTAR parcial** (H5) |
| `showcase.ts` | 921 | `createShowcase`, `getShowcaseById`, `getUserShowcases`, `addShowcaseImage`, `removeShowcaseImage`, `getShowcasesForModeration`, `approveShowcase`, `rejectShowcase`, `featureShowcase`, `unfeatureShowcase`, `getShowcaseStats` | **PORTAR parcial** (H3) |
| `s3.ts`, `asset.ts` | 190 + 131 | Subidas S3 | **DESCARTAR**: se usa `subirImagen` + `POST /api/upload` de Ordo [V] |
| `leaderboard.ts`, `post.ts`, `comment.ts`, `commentVote.ts`, `reaction.ts`, `message.ts`, `notification.ts`, `follow.ts`, `live-room.ts`, `live-chat.ts`, `search.ts`, `profile.ts`, `subscription.ts`, `activation.ts`, `feature-request.ts`, `admin.ts`, `backup.ts`, `supabase.ts`, `index.ts` y sus `*.test.ts` (vitest) | ~6.000 | Comunidad, pagos, admin de plataforma | **DESCARTAR** (§8) |

### 1.6 Capa de datos, auth y resto

| Módulo | Líneas | Veredicto | Motivo |
|---|---|---|---|
| `src/db/interfaces/database.ts` (`DatabaseAdapter`) | 241 | **DESCARTAR como interfaz** | Nadie la usa (§3). Sus tipos de `src/db/interfaces/types.ts` (460) se toman como base de los DTO |
| `src/db/adapters/mongodb/index.ts` | 2.948 | **USAR como fuente** de cuerpos Prisma: `mapModule` (L472), `mapRecording` (L486), `mapLessonCompletion` (L503), `mapEvent` (L311), `mapShowcase` (L363), `getModules`, `getLessonCompletions`, `completelesson` (upsert idempotente, L2528) | Es Prisma (sobre MongoDB [V `vendor/roost/prisma/schema.prisma:9-11`]); se traduce a los modelos Postgres de Ordo |
| `src/db/adapters/supabase/index.ts` | 1.855 | **DESCARTAR** | Duplica a los services |
| `src/auth/**`, `contexts/AuthContext.tsx` (379), `pages/auth/**` (1.907), `components/settings/**` | — | **DESCARTAR**, salvo un *shim* `useAuth()` | Ordo tiene su sesión (`src/lib/session.ts`, JWT `jose`) [V]; el shim expone `user.id` y el rol a los componentes portados |
| `contexts/ThemeContext.tsx`, `SiteSettingsContext.tsx`, `SidebarContext.tsx`, `layouts/**`, `navigation/**` | — | **DESCARTAR** | Ordo tiene `ThemeProvider`, `AppSidebar`, `MainDock` y el layout de `/dashboard` [V] |
| `components/admin/StatsCard.tsx` | 61 | **USAR** | KPI de reportes y de la bandeja de revisión (HS0) |
| `types/index.ts`, `types/showcase.ts` | 95 + 104 | **PORTAR** | Tipos `ModuleWithProgress`, `RecordingWithCompletion`, estados de showcase → `src/lib/homeschooling/roost/tipos.ts` con ids `number` |
| `types/database.ts` | 2.543 | **DESCARTAR** | Tipos generados de Supabase |
| `src/index.css` | 327 | **DESCARTAR** | `@layer base` pinta `body` y bordes globales (L9-31) y define `.btn/.card/.input` (L39-114): sería un segundo sistema de diseño |
| `server/` (Express) | 6.310 | **DESCARTAR** | §2 |
| `prisma/schema.prisma`, `schema.sql` | 908 + ~3.650 | **Referencia** | Se traducen solo las tablas de §4 |

---

## 2. Estrategia de integración

### 2.1 Alternativas

| Criterio | **(a) Portar componentes a Next + reescribir datos** | (b) Correr el Express de Roost y consumirlo | (c) Híbrido (UI portada + Supabase/RLS de Roost en una base aparte) |
|---|---|---|---|
| ¿Sirve el backend? | Ordo pone el backend (route handlers + Prisma) | **No**: el Express solo monta health, stripe, auth/2FA, notifications, backup, activations, upload, site-settings y live-room [V `server/src/index.ts:126-139`]. Cursos, eventos y showcase **no existen** en el servidor [V grep en `server/src/routes`] | Cursos vía `supabase-js` en el navegador, como Roost |
| Base de producción compartida | Solo SQL aditivo con `migrate diff` (AGENTS.md §6) | Habría que correr `schema.sql`: 149 políticas RLS [V `grep -c "CREATE POLICY"`], 67 funciones y triggers sobre `auth.users` [V L2578-2579] en la base de Ordo → **inaceptable** | Una segunda base o esquema: dos fuentes de verdad de usuarios (`profiles` UUID vs `Usuarios` Int) |
| Auth | La de Ordo (cookie JWT) | Supabase Auth o JWT propio de Roost: segundo login para los chicos | Igual que (b) |
| Router | App Router + *shim* de 30 líneas | React Router 7 en otra SPA (Vite) | Igual que (a) |
| Tailwind | Traducción de clases (tabla §2.3) | Tailwind 3 en otra app: dos looks | Igual que (a) |
| Premios / Tarea | Puente con `Tarea` en el mismo proceso | Llamadas cruzadas entre apps | Llamadas cruzadas |
| Código nuevo | Capa de datos fina + gaps | Integración entre apps + gaps | Sincronización de usuarios + gaps |

**Decisión: (a).** (b) no reutiliza nada útil y pone en riesgo la base de producción; (c) duplica usuarios y obliga a `supabase-js` en el navegador de una tablet de cocina con la clave pública expuesta.

### 2.2 Cómo se porta un archivo (receta común)

1. Copiar el archivo de `vendor/roost/` al destino de la tabla de su lane; primera línea `"use client";` y cabecera: `// Portado de vendor/roost/<ruta> (msrbuilds/roost@492af47). Cambios: <lista corta>.`
2. Imports: `@/services/<x>` → `@/lib/homeschooling/roost/services/<x>`; `@/contexts/AuthContext` → `@/components/homeschooling/roost/auth`; `react-router-dom` → `@/lib/homeschooling/roost/router`.
3. Estilos con la tabla §2.3. Primitivas propias de Roost (botones, modales con `createPortal` + Escape, inputs, spinners, `confirm()`/`alert()`) → `Button`, `Dialog`/`Sheet`, `Input`/`Label`, `Spinner`, `toast` (`src/lib/toast.ts` [V]).
4. Textos al español.
5. **No** se cambia la lógica de estado/navegación del componente salvo lo que la lane diga.
6. Un componente de `src/components/homeschooling/**` que **no** viene de Roost (p. ej. `CheckpointOverlay`) lleva la marca `// Propio de Ordo: <motivo>`; el test de guarda de HS0 exige una de las dos cabeceras.

### 2.3 Tailwind 3 → 4 y diseño

- Tailwind de Ordo: 4.2.2 [V]. Compilé con su motor las clases de Roost [V `scratchpad/tw.mjs`]: `flex-shrink-0`, `outline-none`, `overflow-ellipsis`, `ring`, `ring-offset-2` **siguen compilando**; `bg-surface-*` y `bg-primary-600` **no generan nada** (no hay paleta) y fallan en silencio. En Ordo hay 0 usos de `primary-NNN`/`surface-NNN` [V grep].
- Alternativa descartada: definir `--color-surface-*`/`--color-primary-50…950` en `@theme` para que las clases de Roost funcionen sin tocarlas. Pinta `bg-white dark:bg-surface-900` (blanco puro) sobre el crema de Ordo y deja pares `dark:` redundantes: choca con el tema y con `ui-work-rules`.
- **Tabla de traducción (obligatoria en todo archivo portado):**

| Roost (Tailwind 3) | Ordo (tokens / `ui/`) |
|---|---|
| `bg-white dark:bg-surface-900`, `.card` | `Card` o `bg-card` |
| `bg-surface-50/100 dark:bg-surface-800(/50)`, `hover:` idem | `bg-muted`, `hover:bg-muted` |
| `border-surface-100/200 dark:border-surface-700/800` | `border-border` (o `border`) |
| `text-surface-900 dark:text-surface-50/100` | `text-foreground` |
| `text-surface-400/500/600 dark:text-surface-400/500` | `text-muted-foreground` |
| `text-surface-300 dark:text-surface-600` (íconos inactivos) | `text-muted-foreground/60` |
| `bg-primary-600 text-white hover:bg-primary-700`, `.btn-primary` | `<Button>` |
| `.btn-secondary`, `.btn-ghost`, `.btn-danger` | `<Button variant="secondary" / "ghost" / "destructive">` |
| `bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300` (activo) | `bg-primary/10 text-primary` |
| `text-primary-600 dark:text-primary-400` | `text-primary` |
| `text-green-500/600`, `bg-green-50 … text-green-700` | `text-success`, `bg-success/10 text-success` |
| `text-red-600`, `bg-red-…` | `text-destructive` / `text-error` |
| `.input`, `.label` | `<Input>`, `<Label>` |
| Overlay `fixed inset-0 bg-black/50` + `createPortal` | `<Dialog>` / `<Sheet>` |
| `Loader2 animate-spin` | `<Spinner>` |
| Estados vacíos con borde punteado | `<Empty>` |

- Tokens que la tabla usa existen en `src/app/globals.css` [V]: `--muted`, `--muted-foreground`, `--border`, `--foreground`, `--success`, `--warning`, `--error`, `--destructive`, `--primary`, `--card`. Modo oscuro: Ordo usa `@custom-variant dark (&:where(.dark, .dark *))` [V L4], compatible con el `darkMode: 'class'` de Roost [V `tailwind.config.js:3`], pero con tokens no hace falta `dark:`.
- Íconos: Ordo tiene `lucide-react@1.7.0` y Roost `^0.460.0`; todos los íconos usados por los archivos a portar existen en 1.7.0 (`CheckCircle2`, `Edit2`, `Loader2`, `Lock`, `Star`, `Video`, …) [V `node -e`].
- Fuente Inter de Roost: no se importa (manda la de Ordo).

### 2.4 Router y auth

- **Router [V uso]:** Roost usa `useSearchParams` (tupla lectura/escritura), `useNavigate`, `useParams`, `Link to=`. Ordo es App Router con `params` asíncronos en páginas servidor (Next 16; ver `node_modules/next/dist/docs/01-app/01-getting-started/03-layouts-and-pages.md`). Se escribe **un** *shim* `src/lib/homeschooling/roost/router.ts`: `useSearchParams()` devuelve `[params, setParams]` sobre `next/navigation` (`useSearchParams` + `router.replace`), `useNavigate()` → `router.push`, `Link` que acepta `to`. Las páginas (`page.tsx`) son servidor; los componentes portados, cliente.
- **Auth:** el *shim* `src/components/homeschooling/roost/auth.tsx` exporta `useAuth()` con `{ user: { id }, profile: { rolFamiliar }, isAuthenticated }`, alimentado por la `page.tsx` servidor desde `getSession()` [V `src/lib/session.ts:35`]. Los componentes solo usan `user.id` y el rol [V `LearnGroupLayout.tsx`, `ModuleDetail.tsx`, `ManageModuleModal.tsx`].
- **Roles:** `group.user_role` de Roost (`admin`/`moderator`/`member`) se calcula, no se guarda: Padre/Madre → `admin`; Hijo/Hija → `member`. `hasPermission` (`services/group.ts:599`) se porta con esa tabla.

---

## 3. Capa de datos

### 3.1 Hallazgo que decide

- `DatabaseAdapter` declara ~114 métodos [V `grep` en `src/db/interfaces/database.ts`] pero **nadie llama `db()` ni `getDatabase()` fuera de `src/db/`** [V]. Los 27 services importan `supabase` directo [V], y 19 componentes/páginas también [V].
- Los nombres no coinciden: la interfaz tiene `getModules`, `completelesson`; los componentes llaman `getModulesWithProgress`, `markLessonComplete` [V].

### 3.2 Alternativas

| | Adaptador Prisma de `DatabaseAdapter` | Editar los services para que llamen Prisma | **Partir cada service: misma firma en cliente, cuerpo Prisma en servidor** | Server Functions (`'use server'`) con la misma firma |
|---|---|---|---|---|
| ¿Los componentes quedan intactos? | **No**: los componentes no usan el adaptador; igual habría que reescribir los services | No es posible: Prisma no corre en el navegador | **Sí**, solo cambia el import | Sí |
| Código nuevo | ~114 métodos (la mayoría de comunidad) + reescribir services igual | — | Un `fetch` por función + la ruta + el cuerpo Prisma | Solo el cuerpo |
| Lecturas en paralelo | — | — | Sí | **No**: Next despacha Server Functions de a una [V `docs/01-app/01-getting-started/07-mutating-data.md:206`], y `LearnGroupLayout` lanza N lecturas con `Promise.all` (L79) |
| Patrón en Ordo | — | — | Igual que la Tienda: rutas finas + `conSesion` [V `src/lib/tienda/http.ts`] | 0 usos de `'use server'` en `src/` [V] |

**Decisión:** partir cada service.

```
src/lib/homeschooling/roost/services/module.ts   ← cliente: mismas funciones y tipos que vendor/roost/src/services/module.ts; cuerpo = fetch
src/app/api/homeschooling/...                   ← route handlers finos con conSesion + zod
src/lib/homeschooling/servidor/cursos.ts        ← Prisma; cuerpos traducidos del adaptador mongodb y de las queries supabase
src/lib/homeschooling/roost/dto.ts              ← mapModule/mapRecording/... (portados de mongodb/index.ts L311-503): Prisma camelCase → DTO snake_case de Roost
```

Reglas:
- El DTO conserva los nombres de Roost (`display_order`, `video_platform`, `is_completed`, `progress_percentage`) para no tocar los componentes; los ids pasan a `number`.
- **Los `userId` que llegan del cliente se ignoran** si quien llama es Hijo/Hija (se usa la sesión); si es Padre/Madre, se validan con `usuariosObjetivo` [V `src/lib/habitos/permisos.ts:9`].
- **Las políticas RLS de Roost se reescriben como chequeos** dentro de `servidor/*` (no hay RLS en Ordo): ver lecturas de `schema.sql:3058-3071` (recordings), `2978-3028` (events), `3148-3160` (showcases) [V].
- Errores: los services de Roost hacen `throw`; el cliente lanza `Error(json.error)` para no cambiar el `try/catch` de los componentes.

---

## 4. Modelo de datos

Convención de Ordo: modelo en español, columnas `@map("Snake_Case")`, tablas `@@map("Homeschool_*")` (ARQ §3). **Solo SQL aditivo** con `npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script`; si aparece `DROP`, no se aplica (AGENTS.md §6). **Nunca `db push`.**

### 4.1 Tablas de Roost que se traducen

| Roost (schema.sql) | Ordo | Campos que se conservan → nombre Ordo | Se agrega | Se descarta | Lane |
|---|---|---|---|---|---|
| `groups` | `Materia` (familiar) | `name→nombre`, `description→descripcion`, `cover_url→portadaUrl`, `created_by→creadorId` | `icono` (Lucide), `color` (token), `dificultad` (`DificultadTarea`, se copia a la Tarea), `orden`, `activa` | `slug`, `avatar_url`, `is_private`, `is_premium`, `layout_mode` | H1a |
| `modules` | `RecursoCurso` | `title→titulo`, `description→descripcion`, `thumbnail_url→portadaUrl`, `display_order→orden`, `created_by→creadorId` | `materiaId`, `tipo`, `unidadTipo`, `totalUnidades`, `url`, `libroId?`, `minutosPorUnidad`, `umbralAprobacion`, `navegacionLibre` (ARQ §3) | `group_id` (pasa a `materiaId`) | H1a |
| `recordings` | `LeccionCurso` | `title→titulo`, `description→instrucciones`, `video_url→url` (**opcional**: hay lecciones de texto/PDF), `video_platform→videoPlataforma`, `video_id→videoId`, `thumbnail_url→miniaturaUrl`, `display_order→orden`, `published_by→creadorId` | `recursoId` (obligatorio), `@@unique([recursoId, orden])` | `group_id` | H1a |
| `lesson_completions` | `ProgresoLeccion` | `user_id→alumnoId`, `recording_id→leccionId`, `module_id→recursoId`, `completed_at→completadaEn`, `UNIQUE(user_id, recording_id)` | — (la fila **es** la completitud, como en Roost; las notas van en `IntentoQuiz`) | — | H2 |
| `events` | `ActividadOffline` | `title→titulo`, `description→descripcion`, `start_time→inicio`, `end_time→fin`, `location→lugar`, `created_by→creadorId`, `CHECK (end_time > start_time)` | `materiaId` | `is_virtual`, `meeting_url`, `group_id` | H5 |
| `event_attendees` | `ParticipanteActividad` | `event_id→actividadId`, `user_id→alumnoId`, `UNIQUE(event_id, user_id)` | — | `status` (RSVP) | H5 |
| `showcases` | `EvidenciaAprendizaje` | `title→titulo`, `description→nota` (texto plano), `author_id→alumnoId`, `status→estado` (`pending/approved/rejected` → `pendiente/aprobada/ajustar`), `moderation_notes→comentarioPadre`, `moderated_by→revisadaPorId`, `moderated_at→revisadaEn`, `is_featured→destacada`, `featured_at→destacadaEn` | `diaLectivoId?`, `estrellas` (1-5, de `showcase_reviews.rating`; **no dan monedas**) | tagline, url, category, tech_stack, votos, reseñas, launch_date | H3 |
| `showcase_images` | `EvidenciaImagen` | `image_url→archivoUrl` (`/api/archivos/<uuid>`), `display_order→orden`, `caption→pie` | `evidenciaId` | — | H3 |

Tablas nuevas sin equivalente en Roost (esquema Prisma completo en ARQ §3): `PlanCurso` (**+ `alumnoId`**, `@@unique([recursoId, alumnoId])`), `DiaLectivo`, `DiaNoLectivo`, `PreguntaLeccion`, `IntentoQuiz` (reemplaza los contadores `mejorNota/intentos/fallosSeguidos` de ARQ, como pedía la AUDITORÍA B6), `TarjetaRepaso` (estado de ts-fsrs), `MetaHoras` (alumno, materia, horas; sale de `Materia.metaHoras`), `PreferenciaAlumno`, `HistoriaSocial`.

### 4.2 Lo que **no** se traduce y se reemplaza por lo existente

| Roost | Ordo existente | Evidencia |
|---|---|---|
| `profiles` (UUID ligado a `auth.users`) | `Usuario` (Int, `rolFamiliar`) | [V `prisma/schema.prisma` modelo `Usuario`] |
| `assets`, S3 | `Archivo` + `POST /api/upload` (sharp → WebP, 4 MB) | [V `src/app/api/upload/route.ts`, `src/lib/archivos.ts`] |
| `point_activities`, `leaderboard_entries`, `award_points()` | `Tarea` → `/complete` + `/approve` (puntos, estrellas, racha) | [V `src/app/api/tasks/[id]/complete/route.ts`, `approve/route.ts`] |
| `group_members` | El plan por alumno define quién ve qué | — |
| `notifications` | Contadores del layout de `/dashboard` | [V `src/app/dashboard/layout.tsx:27-36`] |

### 4.3 Día lectivo = `Tarea` (HD1), «a tiempo» hasta las 18:00

- **Roost no cambia la decisión.** No da puntos por completar lecciones: los `award_points` de `schema.sql` cuelgan de posts, comentarios, reacciones y aprobación de showcases (triggers L2611-2628), ninguno de `lesson_completions` [V]. El mecanismo de Ordo ya maneja racha, aprobación y tope de una vez (`complete` rechaza si la tarea ya está `Completada`, `Aprobada` o `Esperando_Aprobacion` [V L30]).
- **Cómo se logra «a tiempo hasta las 18:00» sin tocar el cálculo de puntos.** En `complete`, `fechaVencimientoReal = horaEjecucion + tiempoEjecucionEstimadoSeg` (L49-55) y paga completo si `now <= fechaVencimientoReal` (L77) [V]. Por eso la Tarea se crea con `horaEjecucion = 18:00 (APP_TZ) − tiempo estimado` (función pura `vencimientoLeccion`, ARQ §5.2). Resultado: completo hasta las 18:00; 50 % hasta las 22:00 (`fechaLimite`, L57-73, hora del servidor); después 0, y el cron la pasa a `No_Realizada` [V `cron/daily/route.ts`, «EXPIRAR TAREAS»]. Con solo `fechaVencimiento` (como decía la v2) se pagaba siempre como tardía [V `tasks/route.ts:51` + `complete` L77].
- **Atrasos:** una lección no hecha no bloquea las siguientes: al abrir «Hoy aprendo» o en el cron, `asegurarTareasDeHoy` recalcula el plan y reparte esas unidades desde hoy sin mover la fecha de fin (ARQ §4 regla 5, §5.1).
- **Guardia:** la Tarea de un día también aparece en el tablero de Tareas [V `useTaskActions.ts:63` llama a `complete` para cualquier tarea]. H2 agrega una sola llamada en `complete` (`motivoBloqueoTarea`) que la rechaza si faltan lecciones del día o si el día fue reprogramado (ARQ §5.5). Las demás Tareas no cambian.
- Lo que el niño gana: puntos (al aprobar), estrellas y racha. **No gana XP de hábitos**: `approve` no toca `experienciaHabitos` [V `approve/route.ts:38-52`].

## 5. Lo que Roost no tiene (y con qué se cubre)

| Necesidad | ¿En Roost? | Librería madura | Decisión |
|---|---|---|---|
| Reparto de unidades entre días lectivos (pacing) y recálculo | No [V: no hay fechas en `modules`/`recordings`] | No existe una lib de «repartir N unidades en días hábiles»; `date-fns@4.4.0` ya instalado da `eachDayOfInterval`, `getISODay`, `parseISO` [V package.json] | **Se escribe** `repartir()` puro (ARQ §4, con sus 10 tests) sobre date-fns. ~80 líneas |
| Días no lectivos / feriados | No | `date-holidays@3.37.0` (ISC + datos CC-BY-3.0) [V npm] tiene feriados por país [S: cobertura de Uruguay] | v1: **carga manual** (HD4). Botón «Importar feriados» con `date-holidays` solo si el usuario lo pide (P4) |
| Arrastrar días en el calendario | No | `withDragAndDrop` del propio `react-big-calendar@1.19.4` [V] | **Usar** el addon; `onEventDrop` → `moverDia` |
| Quizzes con corrección en servidor | No [V grep `quiz|poll|question` sin resultados de dominio] | SurveyJS es demasiado para 3-5 preguntas de opción múltiple; la corrección son aciertos/total | **Se escribe** `calcularNota()` y la ruta que nunca envía `correcta`. UI con `radio-group` de shadcn (se agrega con el CLI de shadcn, ya instalado [V `shadcn@^4.21.4`]) |
| Checkpoints en video | No (iframe plano) | `react-player@3.4.0` (MIT; peer React ^19 [V npm]) unifica YouTube y Vimeo con eventos de tiempo [S: nombres exactos de eventos y soporte de `youtube-nocookie` en v3; verificar en su README] | **Usar** react-player en `VisorLeccion` (lane H4); la lógica de disparo (`t >= segundo` y no respondido) es pura y testeada |
| Repaso espaciado | No | `ts-fsrs@5.4.2` (MIT, node ≥ 20 [V npm]; algoritmo FSRS de Anki) | **Usar** ts-fsrs en lugar de los intervalos fijos de HD8 (D-11). Acierto = `Good`, fallo = `Again` |
| Horas y reportes | No (el `StatsCard` de admin sí) | `recharts@3.8.0` + `ui/chart.tsx` ya en Ordo [V]; PDF = `window.print()` con `@media print` | **Usar** `StatsCard` + gráficos de `ui/chart`; se escribe solo `resumenHoras()` (agregación) |
| Subida con cámara | Sí (`react-dropzone` en ShowcaseSubmit) | `react-dropzone@14.3.8` (versión del lockfile de Roost [V]; peer `react >= 16.8` [V]) | **Usar**; `capture="environment"` se pasa por `getInputProps` [S] y la compresión es la de Ordo (`browser-image-compression` en `subirImagen`) |
| Borrador de evidencia | Sí (`localStorage`, ShowcaseSubmit L80-156) | — | **Portar** tal cual; si existe el sistema de borradores N5, se cambia el almacenamiento |
| Neurodivergencia (H6) | No | — | Sin cambios respecto de `LANE_H6` |

---

## 6. Plan por lanes

Las lanes se nombran por **código**; el número se asigna al crearlas (el siguiente libre). El 2026-10-14 la 116 ya la tomó otro agente mientras se escribía este plan.

```
HS0 base Roost ──────────┐
H1a modelo + pacing ─────┼─► H1b padre: materias, cursos, plan ─► H2 hoy aprendo ─┬─► H3 evidencia (Showcase)
HS-SEG completar asignado┘                    (H2 exige HS-SEG integrada)          ├─► H4 quizzes + repaso
                                                                                     ├─► H5 horas (Events) + reportes
                                                                                     └─► H6 neurodivergencia
```

| Código | Spec | Depende de | Tamaño | Toca `schema.prisma` | Deps nuevas |
|---|---|---|---|---|---|
| **HS0** | [`LANE_HS0_BASE_ROOST.md`](LANE_HS0_BASE_ROOST.md) | — | M | No | — |
| **H1a** | [`LANE_H1A_MODELO_Y_PACING.md`](LANE_H1A_MODELO_Y_PACING.md) | — | M | Sí | — |
| **HS-SEG** | [`LANE_HSEG_COMPLETAR_SOLO_ASIGNADO.md`](LANE_HSEG_COMPLETAR_SOLO_ASIGNADO.md) | — | S | No | — |
| **H1b** | [`LANE_H1B_ALTA_Y_PLAN_PADRE.md`](LANE_H1B_ALTA_Y_PLAN_PADRE.md) | HS0, H1a | L | No | — |
| **H2** | [`LANE_H2_HOY_APRENDO.md`](LANE_H2_HOY_APRENDO.md) | H1b, HS-SEG | L | Sí | — |
| **H3** | [`LANE_H3_EVIDENCIA_Y_PORTAFOLIO.md`](LANE_H3_EVIDENCIA_Y_PORTAFOLIO.md) | H2 | M | Sí | `react-dropzone@14.3.8` |
| **H4** | [`LANE_H4_QUIZZES_Y_REPASO.md`](LANE_H4_QUIZZES_Y_REPASO.md) | H2 | L | Sí | `react-player@3.4.0`, `ts-fsrs@5.4.2` |
| **H5** | [`LANE_H5_HORAS_Y_REPORTES.md`](LANE_H5_HORAS_Y_REPORTES.md) | H2 (usa H3 si existe) | M | Sí | — |
| **H6** | [`LANE_H6_NEURODIVERGENCIA.md`](LANE_H6_NEURODIVERGENCIA.md) | H2 | M | Sí | — |

**Protocolo común:** `git worktree add -b task/lane-NN-<desc> ../ordo-diei-lanes/lane-NN dev` → `npm install` → `git merge dev` antes de tocar `schema.prisma` → `npx prisma validate` → SQL con `migrate diff`, revisado (sin `DROP`) → `npm test` + `npx tsc --noEmit` + `npx eslint <archivos nuevos>` → autoverificación (`PLAN_VERIFICACION.md`, momento A) → registro `vault/LANE_NN_*.md` con el pedido textual y el SQL aplicado → `scripts/integrar.sh` → `git worktree remove` + `git branch -d`. Las lanes que tocan `schema.prisma` se integran **de a una**. `vendor/roost/` no se edita. Tests con base real solo con `PERMITIR_TESTS_DB=1`.

## 7. Riesgos y conflictos

1. **Base de producción.** Solo SQL aditivo generado con `migrate diff`. Nunca correr `vendor/roost/schema.sql` ni `vendor/roost/prisma` (es MongoDB [V]). Las lanes H1a, H2, H3, H4, H5 y H6 tocan `schema.prisma`: integrar **de a una** y hacer `git merge dev` antes de generar el SQL.
2. **Dependencias.**

| Paquete | Versión | Choque | Evidencia |
|---|---|---|---|
| `react-dropzone` | 14.3.8 exacta (la última es 20.1.3) | peer `react >= 16.8` acepta 19.2.4 | [V `npm view`, lockfile de Roost] |
| `react-player` | 3.4.0 | peer React/ReactDOM `^19` | [V `npm view`] |
| `ts-fsrs` | 5.4.2 | `node >= 20`; local v26.8.1 | [V `npm view`, `node --version`] |
| `react-big-calendar`, `date-fns`, `lucide-react`, `recharts` | ya instalados (1.19.4, 4.4.0, 1.7.0, 3.8.0) | — | [V `package.json`] |

3. **Duplicación.** Dos localizadores de calendario (`momentLocalizer` en `MissionCalendar` [V L4-11], `dateFnsLocalizer` en el portado): las dos libs ya están; se acepta y se unifica en otra lane si el usuario quiere. Barra de progreso, subida de imágenes y toasts: se usan los de Ordo (no se portan los de Roost).
4. **CSS.** Importar `vendor/roost/src/index.css` pisaría `body` y los bordes globales (`@layer base`, L9-31) → prohibido. Clases sin traducir **fallan en silencio** (§2.3) → test de guarda (HS0).
5. **Seguridad / roles.**
   - Roost protege con RLS y `auth.uid()`; al pasar a Prisma esa protección desaparece. Cada función de `servidor/*` debe repetir los chequeos de §3.2. Un Hijo nunca recibe datos de otro alumno.
   - Roost deja que cada usuario **desmarque** su lección (política «Users can unmark lessons», `schema.sql:3456` [V]); en Ordo eso solo lo hace un padre.
   - `POST /api/tasks/[id]/complete` no verifica que quien completa sea el asignado [V L11-30]. **Resuelto por la lane HS-SEG** (el usuario aprobó el cambio para todas las tareas), que se integra antes de H2.
   - La Tarea de un día se podía completar desde el tablero sin hacer las lecciones: **guardia** en `complete` (ARQ §5.5, H2).
   - Fotos: `GET /api/archivos/<uuid>` es público a propósito [V `src/app/api/archivos/[clave]/route.ts:6-8`]; HD6 lo acepta para uso doméstico.
6. **Rendimiento.** Roost hace N+1: `LearnGroupLayout` pide las grabaciones de cada módulo por separado (L79-83) y `pages/Calendar.tsx` hace 2 consultas por evento (L42-55) [V]. Con `fetch` → ruta → Supabase serían N viajes. En la ruta de servidor se devuelve todo en una consulta (`include`) y el cliente mantiene la firma. Las fotos viven en Postgres (`Archivo.datos`): medir tamaño por mes (AUDITORÍA E3).
7. **Fechas.** `complete` mezcla hora local del servidor (`setHours(22)`, L57-73) y UTC (`getUTCHours`, L75) [V]. Con `horaEjecucion` calculada en `APP_TZ` el corte de las 18:00 es exacto en cualquier servidor; el de las 22:00 (50 %) usa la hora del servidor, que se asume Montevideo por ser uso en casa [S] (si no, cambia solo ese corte; no hay error).
8. **Next 16.** Páginas con `params` asíncronos; leer los docs locales antes de codear (AGENTS.md).

---

## 8. Lo que se recorta de Roost a propósito

| Se recorta | Por qué |
|---|---|
| Feed, posts, comentarios, reacciones, menciones, editor rico (`feed/`, 3.708 líneas; `react-quill-new`, `dompurify`) | Ordo no es red social; las instrucciones de la lección son texto plano |
| Comentarios en lecciones (`CommentSection` en `LessonPlayer`) | Idem; el diálogo padre-hijo es el comentario de revisión |
| Mensajes directos, notificaciones, presencia, búsqueda global | Familia en una tablet compartida; Ordo tiene sus contadores |
| Live room / clases en vivo | Fuera de alcance (HD12) |
| Leaderboard y `point_activities` | Ordo tiene su economía y su ranking (`LeaderboardModal`); dos rankings serían un duplicado |
| Votos, reseñas múltiples y showcases públicos | Portafolio privado de la familia |
| Stripe, suscripciones, activaciones, «Pro» | Uso doméstico, sin pagos (D23) |
| Auth, registro, 2FA, cambio de contraseña, baneos | Ordo tiene login por PIN |
| Admin de plataforma (usuarios, categorías, anuncios, backups, site settings) | Ordo tiene su panel de administración |
| Adjuntos S3 por módulo (`UploadAssetsModal`, `GroupAssets`) | `Archivo` solo admite imágenes; PDF por enlace en v1 |
| Servidor Express, Docker, Dokploy, instalador | No se despliega Roost |

---

## 9. Contradicciones encontradas y cómo quedaron resueltas

X1–X19 resueltas en la lane 117 y X20–X21 en la lane 119 (2026-10-14), al escribir el plan de verificación. «Dónde» = documento corregido.

| # | Contradicción | Evidencia | Resolución aplicada |
|---|---|---|---|
| X1 | `SPEC`, `ARQUITECTURA` §7, `MAPEO`, `LANES_HOMESCHOOLING`: Roost «solo referencia visual», «no se copian archivos» | Revocado por el usuario (D26) | Los cuatro documentos reescritos para portar código |
| X2 | `MAPEO`, `AUDITORIA`: Roost en `/home/x7/Downloads/dev/roost` | Está en `vendor/roost/` [V `ORIGEN.md`] | `MAPEO` reescrito; nota en `AUDITORIA` |
| X3 | `ARQUITECTURA` HD6 y `LANE_H3`: subir con `POST /api/archivos` | No existe; la subida es `POST /api/upload` [V] | ARQ HD8 y H3 usan `subirImagen` → `/api/upload` |
| X4 | `ARQUITECTURA` HD1: «puntos, XP, racha» | `approve` no toca `experienciaHabitos` [V L38-52] | ARQ HD1: puntos, estrellas y racha |
| X5 | `ARQUITECTURA` §5: Tarea con `fechaVencimiento = hoy` | Se pagaba siempre como tardía [V] | `horaEjecucion = 18:00 − estimado` (§4.3, ARQ §5.2, H2) |
| X6 | `ARQUITECTURA` §6 y `LANE_H1B`: «`MissionCalendar` extendido» con arrastre | `momentLocalizer`, sin arrastre [V] | `CalendarView` portado + `withDragAndDrop` (HS0, H1b) |
| X7 | `MAPEO`: no agregar `react-dropzone` | Lo usa el código que se porta | Se agrega 14.3.8 en H3 |
| X8 | `AUDITORIA` E1 (evidencias con sesión) vs `ARQUITECTURA` HD6 (URL pública) | D19 hacía mandar la auditoría | URL pública **aceptada** (uso doméstico): ARQ HD8, nota en `AUDITORIA` E1 y en `DECISIONES` D31 |
| X9 | `vendor/roost/CLAUDE.md`: services «migrando a `db()`» | Ningún service usa `db()` [V] | No se edita `vendor/`; el plan §3 lo documenta |
| X10 | `ARQUITECTURA` HD8: repaso con intervalos fijos | Regla «reusar open source» | ts-fsrs (ARQ HD10, H4) |
| X11 | `ARQUITECTURA` §5: Tarea «`Vencida`» deja el día pendiente | El cron marca `No_Realizada`, no `Vencida` [V `cron/daily/route.ts`] | ARQ §5.3 lista todos los estados; los atrasos se reprograman (ARQ §5.1) |
| X12 | `ARQUITECTURA` §5: «el día N exige el N−1 hecho» | Un día perdido bloqueaba todo el curso | ARQ §5.4: hoy siempre disponible; los atrasos se reparten desde hoy |
| X13 | La Tarea de un día se puede completar desde el tablero de Tareas sin hacer las lecciones | `useTaskActions.ts:63` llama a `complete` para cualquier tarea [V] | Guardia `motivoBloqueoTarea` en `complete` (ARQ §5.5, H2) |
| X14 | `LANE_H1B`: enlace «Estudio» en `AppSidebar` **y** `MainDock` | Regla de no duplicar (`ui-work-rules`) | Solo `AppSidebar` (ARQ HD16) |
| X15 | `LANE_H2`: «mostrar el confeti ya usado» con `canvas-confetti` directo | El confeti sale de `ModalManager` al abrir `TASK_SUCCESS` [V L48] | H2 abre `TASK_SUCCESS`; H6 lo condiciona en modo relajado |
| X16 | `LANE_H1B`: «Omitir» sin definir | Sin regla | ARQ §4 regla 7 |
| X17 | `@@unique([recursoId, orden])` vs `reorderModules` de Roost (actualiza de a una fila) | Chocaría al intercambiar | Reordenar en dos fases dentro de una transacción (H1b) |
| X18 | Plan v3: lanes numeradas 116–123 | La 116 la tomó otro agente [V `git branch -a`] | Lanes por código; número al crearlas (§6) |
| X19 | `ARQUITECTURA` §3 (v2): `enum X { a b c }` en una línea | Prisma no lo acepta: `prisma validate` daba 35 errores [V] | Enums en varias líneas. El esquema de ARQ §3 **completo** y el **subconjunto de H1a** validan contra el `schema.prisma` actual de `dev` (`prisma validate` 7.6.0 en una copia temporal, sin tocar la base) [V] |
| X20 | `LANE_H6`: condicionar el confeti solo en `ModalManager.tsx:48` (`TASK_SUCCESS`) vs su aceptación «con modo relajado no hay confeti» | `celebrate` (L30-32) también lo disparan `LEVEL_UP` y `SURPRISE_AWARD` (L49-50) y `CelebrateContext` (L343) [V] | La condición va dentro de `celebrate`; L48-50 no se tocan (`LANE_H6`) |
| X21 | `LANE_H4`: «aparece el [checkpoint] más cercano sin responder» | Ambiguo: si el niño salta de 0 a 95 s con checkpoints en 30 y 90, «más cercano» puede ser 90 y se saltea el de 30 | El **primero** sin responder con `segundoVideo ≤ t` (`LANE_H4`; vectores en `PLAN_VERIFICACION.md` §6.7) |

## 10. Registro de decisiones

| # | Decisión | Alternativas | Razón | Cómo revertir |
|---|---|---|---|---|
| D-1 | Portar componentes a Next y reescribir solo datos (opción a) | (b) Express aparte; (c) híbrido con Supabase/RLS | El Express no tiene cursos/eventos/showcase; (b)/(c) exigen correr `schema.sql` o duplicar usuarios | Correr Roost aparte en el futuro, sincronizando usuarios |
| D-2 | Partir cada service (cliente `fetch` + servidor Prisma) con la misma firma | Adaptador del `DatabaseAdapter`; Server Functions | El adaptador no lo usa nadie; las Server Functions serializan lecturas y no se usan en Ordo | Cambiar el cuerpo del cliente por `'use server'`; los componentes no cambian |
| D-3 | DTO con nombres de Roost (snake_case) e ids numéricos | Renombrar en todos los componentes | Menos cambios en los archivos portados | Búsqueda/reemplazo en `roost/` |
| D-4 | Contenido familiar y plan por alumno | `Materia.alumnoId` (ARQ v2) | Modelo de Roost; un curso sirve a varios hijos | Agregar `alumnoId` a `Materia` |
| D-5 | Día lectivo = `Tarea` con `horaEjecucion = 18:00 − estimado` | Premios propios de lecciones | Roost no premia lecciones; Ordo ya resuelve aprobación, racha y tope | Quitar la creación de Tareas; el avance sigue en `DiaLectivo` |
| D-6 | Traducir clases a tokens/`ui/` + test de guarda | Puente `@theme` con la paleta de Roost | Coherencia visual y `ui-work-rules` | Agregar la paleta y relajar el test |
| D-7 | Portar `CalendarView` + `withDragAndDrop`; `MissionCalendar` intacto | Extender `MissionCalendar` | Restricción del usuario; no cambiar Tareas | Reemplazar por `MissionCalendar` con las mismas props |
| D-8 | `react-dropzone@14.3.8` exacta | `<input type=file>`; v20 | Es el código de Roost | `<input>` en un archivo |
| D-9 | `LeccionCurso` en H1a | En H2 (v2) | El padre carga lecciones en H1b | Mover el modelo a H2 |
| D-10 | `ProgresoLeccion` = `lesson_completions` + `IntentoQuiz` aparte | Contadores mutables (v2) | Copia de Roost; historial de intentos (AUDITORÍA B6) | Agregar columnas |
| D-11 | Repaso con ts-fsrs | Intervalos fijos (v2) | Regla «reusar open source» | Reemplazar `servidor/repaso.ts` |
| D-12 | Checkpoints con `react-player` | IFrame API a mano | Una API para YouTube y Vimeo | Volver al iframe |
| D-13 | Evidencia = Showcase sin votos/reseñas; estrellas sin monedas | Tabla propia | Moderación, destacado e imágenes ya existen | — |
| D-14 | Horas fuera de pantalla = Events + participantes | Un solo alumno por actividad | Una salida suma horas a varios hijos | Limitar a un participante |
| D-15 | Feriados a mano | `date-holidays` | Respuesta P4 del usuario | Botón de importación |
| D-16 | «A tiempo» hasta las 18:00 (`HORA_LIMITE_LECCION`) | 20:00 (recomendación inicial) | Respuesta P3 del usuario | Cambiar la constante en `config.ts` |
| D-17 | Atrasos se reprograman solos; hoy nunca está bloqueado | Bloqueo estricto día a día (v2) | Evita que un día perdido trabe el curso | Volver a exigir el día anterior en `estaBloqueado` |
| D-18 | Guardia en `complete` para Tareas de días lectivos | Ocultarlas del tablero | No cambia la UI existente; protege por API | Quitar la llamada |
| D-19 | Lane HS-SEG: solo el asignado o un padre completa | Dejarlo como está | Respuesta P5 del usuario | Quitar el chequeo |
| D-20 | Lanes por código, número al crearlas | Números reservados | Ya hubo choques entre agentes | — |

## 11. Respuestas del usuario (2026-10-14)

| # | Pregunta | Respuesta |
|---|---|---|
| P1 | ¿Cursos compartidos entre hermanos? | **Sí**: contenido familiar, un plan por hijo (D-4) |
| P2 | ¿Un hermano ve las evidencias de otro? | **No**: solo las suyas; los padres ven todo (ARQ HD15) |
| P3 | ¿Hasta qué hora cuenta «a tiempo»? | **18:00** (D-16) |
| P4 | ¿Feriados automáticos o a mano? | **A mano** (D-15) |
| P5 | ¿Lane para que `complete` exija al asignado? | **Sí**: HS-SEG, antes de H2 (D-19) |
