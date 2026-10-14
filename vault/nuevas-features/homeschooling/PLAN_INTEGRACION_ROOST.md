# Homeschooling sobre Roost — plan de integración (v3)

> Lane 115 · 2026-10-14 · Roost en `vendor/roost/` (commit `492af47`, ver `vendor/roost/ORIGEN.md`).
> **Este documento reemplaza** el supuesto «Roost = solo referencia visual» y «extender `MissionCalendar`» de `SPEC.md`, `ARQUITECTURA_DETALLADA.md` (v2), `MAPEO_COMPONENTES_ROOST.md` y `../lanes/LANES_HOMESCHOOLING.md`. Lo que esos documentos dicen del **pacing, del puente con `Tarea` y de las reglas de negocio** sigue vigente salvo donde este plan lo cambie de forma explícita (registro §10).
>
> **Convención de evidencia.** **[V]** = VERIFICADA: leí el código o ejecuté el comando citado. **[S]** = SUPUESTA: no se pudo comprobar acá; la lane que la use debe confirmarla antes de codear. Las rutas sin prefijo son de Ordo (`src/…`); las de Roost llevan `vendor/roost/`.

---

## 0. Resumen ejecutivo

1. **Se porta Roost a Next (client components) y se reescribe solo la capa de datos** (opción a). El Express de Roost no aporta nada a Homeschooling: no tiene ni una ruta de cursos, eventos o showcase [V `vendor/roost/server/src/index.ts:126-139`]; esa lógica vive en el navegador contra Supabase + RLS.
2. **No se escribe un adaptador Prisma del `DatabaseAdapter`**: ningún service ni componente lo llama [V grep de `db()`/`getDatabase` fuera de `src/db/`]. En su lugar, cada service se parte en dos con **la misma firma**: cliente (`fetch`) y servidor (Prisma). Los componentes portados solo cambian imports.
3. **Modelo:** `groups→Materia`, `modules→RecursoCurso`, `recordings→LeccionCurso`, `lesson_completions→ProgresoLeccion`, `events`+`event_attendees→ActividadOffline`+`ParticipanteActividad`, `showcases`+`showcase_images→EvidenciaAprendizaje`+`EvidenciaImagen`. `Usuario`, `Tarea` y `Archivo` se reutilizan; el contenido es familiar y el **plan es por alumno** (como Roost: contenido compartido, avance por usuario).
4. **HD1 se mantiene**: Roost no da puntos por lecciones [V `vendor/roost/schema.sql`, no hay trigger sobre `lesson_completions`], así que cada día lectivo sigue siendo una `Tarea`. **Corrección obligatoria:** la Tarea debe llevar `horaEjecucion`; con solo `fechaVencimiento` la ruta `complete` la paga siempre como tardía (§4.3).
5. **Se revoca «extender `MissionCalendar`»**: se porta `CalendarView` de Roost (date-fns, como Ordo) y se le suma el addon de arrastre que ya trae `react-big-calendar`.
6. **Estilos:** las clases Tailwind 3 de Roost se traducen con una tabla fija a los tokens y a `src/components/ui`; **no** se importa `index.css` ni la paleta `surface-*`/`primary-NNN` de Roost. Un test de guarda lo hace cumplir.
7. **Lo único que se escribe desde cero** es lo que Roost no tiene: pacing, días no lectivos, puente con `Tarea`, corrección de quizzes y armado de reportes. Repaso espaciado con **ts-fsrs**, checkpoints con **react-player**, gráficos con **recharts** (ya instalado).
8. **Dependencias nuevas:** `react-dropzone@14.3.8`, `react-player@3.4.0`, `ts-fsrs@5.4.2`. **No** entran `@supabase/supabase-js`, `react-router-dom`, `react-quill-new`, `dompurify`, `@aws-sdk/*`.
9. **9 lanes:** 116 (base Roost) → 117 (H1a) → 118 (H1b) → 119 (H2) → 120–123 (H3, H4, H5, H6 en paralelo).
10. **Se recorta a propósito:** feed, mensajes, live room, leaderboard, votos y reseñas públicas de showcase, Stripe, auth/2FA, administración de comunidad, búsqueda global y notificaciones de Roost.

---

## 1. Inventario de Roost

Tamaños medidos con `wc -l` [V]. Veredicto: **USAR** = se copia casi literal (cambian imports y clases); **PORTAR** = se copia y se adapta datos/router/auth/estilos; **DESCARTAR** = no entra (motivo).

### 1.1 LMS (`vendor/roost/src/components/groups/learn/`, 1.429 líneas)

| Archivo | Líneas | Qué hace | Depende de | Veredicto | Motivo / destino |
|---|---|---|---|---|---|
| `LearnGroupLayout.tsx` | 325 | Orquesta grilla → módulo → lección por `?module=&lesson=`; carga módulos y grabaciones; modales de alta | `react-router-dom` `useSearchParams`, `useAuth`, `services/module`, `CommentSection` | **PORTAR** | Esqueleto de la vista de materia (padre e hijo). Se quita `CommentSection` y `UploadAssetsModal`. Destino `src/components/homeschooling/cursos/MateriaLayout.tsx` (lane 118; modo hijo en 119) |
| `LessonPlayer.tsx` | 152 | Iframe 16:9 YouTube/Vimeo (`getEmbedUrl` L30), anterior/siguiente, marcar/desmarcar (`handleToggleComplete` L39) | `services/module` | **PORTAR** | `VisorLeccion`. El «desmarcar» (L43) **se elimina para hijos** (sería premio repetible, AUDITORÍA A6). Dominio `youtube-nocookie.com`. Lane 119 |
| `LearnSidebar.tsx` | 175 | Lista de módulos con progreso y lecciones con check; cajón móvil | `ProgressBar` | **PORTAR** | `LeccionesDelDia` con candado (`Lock`) y gris para lo bloqueado. El cajón móvil se reemplaza por `Sheet` de `ui/`. Lane 119 |
| `ModuleGrid.tsx` | 87 | Grilla de módulos, estado vacío, «Add Module» si `canManage` | `ModuleCard` | **PORTAR** | `CursoGrid` (padre). Estado vacío con `Empty` de `ui/`. Lane 118 |
| `ModuleCard.tsx` | 60 | Tarjeta con miniatura, título, % | — | **PORTAR** | `CursoCard` (padre, 118) y variante grande `TarjetaHoy` (hijo, 119) |
| `ModuleDetail.tsx` | 290 | Cabecera de módulo, pestañas grabaciones/assets, miniaturas YouTube/Vimeo, editar/borrar | `services/module` | **PORTAR** | `CursoDetalle`. Pestaña «assets» fuera (ver `UploadAssetsModal`). Lane 118 |
| `ManageModuleModal.tsx` | 242 | Alta/edición de módulo con portada (`uploadImage`) | `services/module`, `services/s3` | **PORTAR** | Campos del paso «Recurso» del asistente. `uploadImage` → `subirImagen` de Ordo (`src/lib/subirImagen.ts`, misma forma `{url}` [V]). Lane 118 |
| `CompactGroupHeader.tsx` | 59 | Cabecera compacta del grupo | `react-router-dom`, `hasPermission` | **PORTAR** | `MateriaHeader`. Lane 118 |
| `ProgressBar.tsx` | 30 | Barra de % | — | **DESCARTAR** | Ordo ya tiene `src/components/ui/progress.tsx` [V]; dos barras sería un duplicado (regla `ui-work-rules`) |

### 1.2 Grupos, video y adjuntos (`components/groups/`, resto)

| Archivo | Líneas | Qué hace | Veredicto | Motivo / destino |
|---|---|---|---|---|
| `AddRecordingModal.tsx` | 257 | Alta de grabación por URL; parsea YouTube (L54) y Vimeo (L64), vista previa | **PORTAR** | `LeccionForm` (118). Las regex se extraen a `src/lib/homeschooling/video.ts` (116). La de YouTube **no reconoce `/embed/` ni `watch?…&v=`** [V lectura de la regex L54]: se amplía y se testea |
| `VideoPlayerModal.tsx` | 91 | Modal con iframe | **DESCARTAR** | `VisorLeccion` ya cubre el caso |
| `CreateGroupModal.tsx` | 417 | Alta de grupo (nombre, descripción, privacidad, portada, modo) | **PORTAR (reducido)** | Solo nombre, descripción y portada → `MateriaForm` (118). Privacidad/modo/plan pago son de comunidad |
| `UploadAssetsModal.tsx`, `GroupAssets.tsx` | 246 + 249 | Adjuntos S3 por módulo | **DESCARTAR (v1)** | `Archivo` solo acepta imágenes [V `src/lib/archivos.ts:18`]; los PDF van como enlace en la lección |
| `GroupMembers.tsx`, `GroupHeader.tsx`, `GroupTabs.tsx`, `GroupCard.tsx`, `GroupRecordings.tsx`, `RecordingCard.tsx`, `DefaultGroupLayout.tsx`, `SidebarGroupLayout.tsx`, `MarkdownPreviewModal.tsx`, `groupTabsConfig.ts` | ~1.400 | Comunidad: miembros, pestañas de feed, layouts de grupo | **DESCARTAR** | La «membresía» la da el plan por alumno; el resto es feed/comunidad |

### 1.3 Calendario y eventos

| Archivo | Líneas | Qué hace | Veredicto | Motivo / destino |
|---|---|---|---|---|
| `components/calendar/CalendarView.tsx` | 303 | `react-big-calendar` con `dateFnsLocalizer` (L13), vistas mes/semana/día/agenda, colores por estado, `<style>` oscuro con hex (L114) | **PORTAR** | `src/components/homeschooling/roost/CalendarView.tsx` (116): locale `es`, se quita el `<style>` y se usa la clase `mission-calendar` (tokens, `src/components/tasks/mission-calendar.css` [V]); se desacopla de `EventDetails/EventForm` (pasan a props) y se envuelve con `withDragAndDrop` [V existe `node_modules/react-big-calendar/lib/addons/dragAndDrop/withDragAndDrop.js`] |
| `pages/Calendar.tsx` | 218 | Página: carga eventos del mes, próximos, crear | **PORTAR** | `PlanCalendario` del padre (118). Se elimina el N+1 de L42-55 (§7.6) |
| `components/events/EventForm.tsx` | 275 | Título, descripción, inicio/fin `datetime-local`, lugar, virtual, grupo | **PORTAR** | `ActividadForm` (122): sin virtual/meeting/grupo; con materia y alumnos |
| `EventCard.tsx`, `EventDetails.tsx` | 132 + 207 | Tarjeta y detalle con RSVP | **PORTAR** | `ActividadCard`, `ActividadDetalle` (122), sin RSVP |
| `AttendeeList.tsx` | 160 | Lista de asistentes | **PORTAR** | `ParticipantesList`: qué hijos participaron (122) |
| `RSVPButton.tsx` | 101 | going/maybe/not going | **DESCARTAR** | En familia no hay confirmación de asistencia |

### 1.4 Showcase → evidencia y portafolio

| Archivo | Líneas | Qué hace | Veredicto | Motivo / destino |
|---|---|---|---|---|
| `pages/ShowcaseSubmit.tsx` | 726 | Asistente de 3 pasos; `useDropzone` (L229, L237); borrador en `localStorage` (L33, L80-156) | **PORTAR (parcial)** | Solo el bloque de imágenes (dropzone + vista previa) y el borrador → `EnviarEvidencia` (120). URL, tagline, categoría, stack y editor rico no aplican |
| `pages/admin/Showcases.tsx` | 459 | Moderación: contadores, filtro por estado, aprobar, rechazar con motivo, destacar/quitar | **PORTAR** | `RevisionEvidencias` (120). Cada fila usa `SwipeRow` de Ordo (izq. aprueba) [V `src/components/SwipeRow.tsx`] |
| `pages/Showcase.tsx` | 425 | Galería con filtros y estados | **PORTAR** | `Portafolio` (120) |
| `components/showcase/ShowcaseCard.tsx` | 140 | Tarjeta | **PORTAR** | `EvidenciaCard` (120); `Link` de react-router → `next/link` |
| `ShowcaseFilters.tsx` | 198 | Filtros categoría/tags | **PORTAR** | Filtros alumno/materia/mes (120). `ShowcaseFilterSidebar.tsx` (239) **DESCARTAR**: duplica a `ShowcaseFilters` |
| `ShowcaseReviews.tsx` | 444 | Reseñas; incluye `StarRating` (L22-64) | **PORTAR solo `StarRating`** | Estrellas del padre (116). Reseñas múltiples y respuesta del autor no aplican |
| `ShowcaseVoteButton.tsx`, `pages/ShowcaseDetail.tsx` | 113 + 606 | Votos y detalle público con `DOMPurify` | **DESCARTAR** | Sin votos ni HTML rico; el detalle es un `Sheet` con la `EvidenciaCard` |

### 1.5 Services (`vendor/roost/src/services/`, 28 archivos, 8.783 líneas)

| Service | Líneas | Funciones que se portan (mismo nombre y firma) | Veredicto |
|---|---|---|---|
| `module.ts` | 371 | `getModulesWithProgress`, `getModuleById`, `createModule`, `updateModule`, `deleteModule`, `reorderModules`, `getModuleRecordings`, `markLessonComplete`, `getAdjacentRecordings`, `getRecordingById`. `markLessonIncomplete` solo para padres. `getModuleAssets` y `getUserCompletionsForGroup` fuera | **PORTAR** (118/119) |
| `group.ts` | 783 | `createRecording` (L699), `updateRecording`, `deleteRecording` (L736), `hasPermission` (L599, con roles mapeados) | **PORTAR parcial** (118) |
| `event.ts` | 403 | `getEventsInRange`, `createEvent`, `updateEvent`, `deleteEvent`, `getEventAttendees` | **PORTAR parcial** (122) |
| `showcase.ts` | 921 | `createShowcase`, `getShowcaseById`, `getUserShowcases`, `addShowcaseImage`, `removeShowcaseImage`, `getShowcasesForModeration`, `approveShowcase`, `rejectShowcase`, `featureShowcase`, `unfeatureShowcase`, `getShowcaseStats` | **PORTAR parcial** (120) |
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
| `components/admin/StatsCard.tsx` | 61 | **USAR** | KPI de reportes y de la bandeja de revisión (116) |
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

Convención de Ordo: modelo en español, columnas `@map("Snake_Case")`, tablas `@@map("Homeschool_*")` (como ARQ v2). **Solo SQL aditivo** con `npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script`; si aparece `DROP`, no se aplica (AGENTS.md §6). **Nunca `db push`.**

### 4.1 Tablas de Roost que se traducen

| Roost (schema.sql) | Ordo | Campos que se conservan → nombre Ordo | Se agrega | Se descarta | Lane |
|---|---|---|---|---|---|
| `groups` | `Materia` (familiar) | `name→nombre`, `description→descripcion`, `cover_url→portadaUrl`, `created_by→creadorId` | `icono` (Lucide), `color` (token), `dificultad` (`DificultadTarea`, se copia a la Tarea), `orden`, `activa` | `slug`, `avatar_url`, `is_private`, `is_premium`, `layout_mode` | 117 |
| `modules` | `RecursoCurso` | `title→titulo`, `description→descripcion`, `thumbnail_url→portadaUrl`, `display_order→orden`, `created_by→creadorId` | `materiaId`, `tipo`, `unidadTipo`, `totalUnidades`, `url`, `libroId?`, `minutosPorUnidad`, `umbralAprobacion`, `navegacionLibre` (ARQ §3) | `group_id` (pasa a `materiaId`) | 117 |
| `recordings` | `LeccionCurso` | `title→titulo`, `description→instrucciones`, `video_url→url` (**opcional**: hay lecciones de texto/PDF), `video_platform→videoPlataforma`, `video_id→videoId`, `thumbnail_url→miniaturaUrl`, `display_order→orden`, `published_by→creadorId` | `recursoId` (obligatorio), `@@unique([recursoId, orden])` | `group_id` | 117 |
| `lesson_completions` | `ProgresoLeccion` | `user_id→alumnoId`, `recording_id→leccionId`, `module_id→recursoId`, `completed_at→completadaEn`, `UNIQUE(user_id, recording_id)` | — (la fila **es** la completitud, como en Roost; las notas van en `IntentoQuiz`) | — | 119 |
| `events` | `ActividadOffline` | `title→titulo`, `description→descripcion`, `start_time→inicio`, `end_time→fin`, `location→lugar`, `created_by→creadorId`, `CHECK (end_time > start_time)` | `materiaId` | `is_virtual`, `meeting_url`, `group_id` | 122 |
| `event_attendees` | `ParticipanteActividad` | `event_id→actividadId`, `user_id→alumnoId`, `UNIQUE(event_id, user_id)` | — | `status` (RSVP) | 122 |
| `showcases` | `EvidenciaAprendizaje` | `title→titulo`, `description→nota` (texto plano), `author_id→alumnoId`, `status→estado` (`pending/approved/rejected` → `pendiente/aprobada/ajustar`), `moderation_notes→comentarioPadre`, `moderated_by→revisadaPorId`, `moderated_at→revisadaEn`, `is_featured→destacada`, `featured_at→destacadaEn` | `diaLectivoId?`, `estrellas` (1-5, de `showcase_reviews.rating`; **no dan monedas**) | tagline, url, category, tech_stack, votos, reseñas, launch_date | 120 |
| `showcase_images` | `EvidenciaImagen` | `image_url→archivoUrl` (`/api/archivos/<uuid>`), `display_order→orden`, `caption→pie` | `evidenciaId` | — | 120 |

Tablas nuevas sin equivalente en Roost (de ARQ v2, con los cambios marcados): `PlanCurso` (**+ `alumnoId`**, `@@unique([recursoId, alumnoId])`), `DiaLectivo`, `DiaNoLectivo`, `PreguntaLeccion`, `IntentoQuiz` (reemplaza los contadores `mejorNota/intentos/fallosSeguidos` de ARQ, como pedía la AUDITORÍA B6), `TarjetaRepaso` (estado de ts-fsrs), `MetaHoras` (alumno, materia, horas; sale de `Materia.metaHoras`), `PreferenciaAlumno`, `HistoriaSocial`.

### 4.2 Lo que **no** se traduce y se reemplaza por lo existente

| Roost | Ordo existente | Evidencia |
|---|---|---|
| `profiles` (UUID ligado a `auth.users`) | `Usuario` (Int, `rolFamiliar`) | [V `prisma/schema.prisma` modelo `Usuario`] |
| `assets`, S3 | `Archivo` + `POST /api/upload` (sharp → WebP, 4 MB) | [V `src/app/api/upload/route.ts`, `src/lib/archivos.ts`] |
| `point_activities`, `leaderboard_entries`, `award_points()` | `Tarea` → `/complete` + `/approve` (puntos, estrellas, racha) | [V `src/app/api/tasks/[id]/complete/route.ts`, `approve/route.ts`] |
| `group_members` | El plan por alumno define quién ve qué | — |
| `notifications` | Contadores del layout de `/dashboard` | [V `src/app/dashboard/layout.tsx:27-36`] |

### 4.3 Día lectivo = `Tarea` (HD1): se mantiene, con una corrección

- **Roost no cambia la decisión.** No da puntos por completar lecciones: los `award_points` de `schema.sql` cuelgan de posts, comentarios, reacciones y aprobación de showcases (triggers L2611-2628), ninguno de `lesson_completions` [V]. No hay en Roost un mecanismo de premios aprovechable para lecciones, y el de Ordo ya maneja racha, aprobación y tope de una vez (`complete` rechaza si la tarea ya está `Completada`, `Aprobada` o `Esperando_Aprobacion` [V L30]).
- **Corrección (contradice ARQ §5, que pone `fechaVencimiento = hoy` y nada más):** en `complete`, `esATiempo = now <= fechaVencimientoReal`, y sin `horaEjecucion` `fechaVencimientoReal = fechaVencimiento` [V L49-54, L77]. `POST /api/tasks` guarda la fecha como **medianoche al inicio del día** (`new Date(fecha + "T00:00:00")`) [V `src/app/api/tasks/route.ts:51`], y `aFecha()` la daría a medianoche UTC [V `src/lib/habitos/server.ts:41`]. En los dos casos **una lección hecha a cualquier hora de ese día cuenta como tardía (50 %)** y, pasado `fechaLimite` (22:00 en la hora del servidor, L57-73), vale 0. **Regla para la lane 119:** la Tarea del día se crea con `horaEjecucion` = fecha del día + **hora límite de la familia** en `APP_TZ` (pregunta P3), `tiempoEjecucionEstimadoSeg` = unidades × minutos. No se modifica la ruta `complete`.
- Lo que el niño gana: puntos (al aprobar), estrellas y racha. **No gana XP de hábitos**: `approve` no toca `experienciaHabitos` [V `approve/route.ts:38-52`] (ARQ HD1 dice «XP»: es inexacto).

---

## 5. Lo que Roost no tiene (y con qué se cubre)

| Necesidad | ¿En Roost? | Librería madura | Decisión |
|---|---|---|---|
| Reparto de unidades entre días lectivos (pacing) y recálculo | No [V: no hay fechas en `modules`/`recordings`] | No existe una lib de «repartir N unidades en días hábiles»; `date-fns@4.4.0` ya instalado da `eachDayOfInterval`, `getISODay`, `parseISO` [V package.json] | **Se escribe** `repartir()` puro (ARQ §4, con sus 10 tests) sobre date-fns. ~80 líneas |
| Días no lectivos / feriados | No | `date-holidays@3.37.0` (ISC + datos CC-BY-3.0) [V npm] tiene feriados por país [S: cobertura de Uruguay] | v1: **carga manual** (HD4). Botón «Importar feriados» con `date-holidays` solo si el usuario lo pide (P4) |
| Arrastrar días en el calendario | No | `withDragAndDrop` del propio `react-big-calendar@1.19.4` [V] | **Usar** el addon; `onEventDrop` → `moverDia` |
| Quizzes con corrección en servidor | No [V grep `quiz|poll|question` sin resultados de dominio] | SurveyJS es demasiado para 3-5 preguntas de opción múltiple; la corrección son aciertos/total | **Se escribe** `calcularNota()` y la ruta que nunca envía `correcta`. UI con `radio-group` de shadcn (se agrega con el CLI de shadcn, ya instalado [V `shadcn@^4.21.4`]) |
| Checkpoints en video | No (iframe plano) | `react-player@3.4.0` (MIT; peer React ^19 [V npm]) unifica YouTube y Vimeo con eventos de tiempo [S: nombres exactos de eventos y soporte de `youtube-nocookie` en v3; verificar en su README] | **Usar** react-player en `VisorLeccion` (lane 121); la lógica de disparo (`t >= segundo` y no respondido) es pura y testeada |
| Repaso espaciado | No | `ts-fsrs@5.4.2` (MIT, node ≥ 20 [V npm]; algoritmo FSRS de Anki) | **Usar** ts-fsrs en lugar de los intervalos fijos de HD8 (D-11). Acierto = `Good`, fallo = `Again` |
| Horas y reportes | No (el `StatsCard` de admin sí) | `recharts@3.8.0` + `ui/chart.tsx` ya en Ordo [V]; PDF = `window.print()` con `@media print` | **Usar** `StatsCard` + gráficos de `ui/chart`; se escribe solo `resumenHoras()` (agregación) |
| Subida con cámara | Sí (`react-dropzone` en ShowcaseSubmit) | `react-dropzone@14.3.8` (versión del lockfile de Roost [V]; peer `react >= 16.8` [V]) | **Usar**; `capture="environment"` se pasa por `getInputProps` [S] y la compresión es la de Ordo (`browser-image-compression` en `subirImagen`) |
| Borrador de evidencia | Sí (`localStorage`, ShowcaseSubmit L80-156) | — | **Portar** tal cual; si existe el sistema de borradores N5, se cambia el almacenamiento |
| Neurodivergencia (H6) | No | — | Sin cambios respecto de `LANE_H6` |

---

## 6. Plan por lanes

Números libres verificados el 2026-10-14 con `git worktree list`, `git branch -a` y `git log --all` [V]: el último usado es 114; este documento es la **115**. **Antes de crear cada lane, volver a verificar**: si el número está tomado, usar el siguiente libre y anotarlo acá.

```
116 HS0 base Roost ─► 117 H1a modelo+pacing ─► 118 H1b padre: materias, cursos, plan ─► 119 H2 hoy aprendo
                                                                                       ├─► 120 H3 evidencia (showcase)
                                                                                       ├─► 121 H4 quizzes+repaso
                                                                                       ├─► 122 H5 horas (events)+reportes
                                                                                       └─► 123 H6 neurodivergencia
```

**Protocolo común (todas):** `git worktree add -b task/lane-NN-<desc> ../ordo-diei-lanes/lane-NN dev` → `npm install` → leer `AGENTS.md`, este documento §2-§4 y `node_modules/next/dist/docs/01-app/01-getting-started/{05-server-and-client-components,15-route-handlers}.md` → `git merge dev` antes de tocar `schema.prisma` → SQL aditivo revisado (sin `DROP`) → `npm test` + `npx tsc --noEmit` + `npx eslint <archivos nuevos>` → registrar `vault/LANE_NN_*.md` con el pedido textual → `scripts/integrar.sh` → `git worktree remove` + `git branch -d`. Ningún archivo de `vendor/roost/` se edita. Cada archivo portado lleva la cabecera de §2.2. Tests con base real solo con `PERMITIR_TESTS_DB=1`.

### Lane 116 — HS0: base de Roost (sin base de datos, sin pantallas)

- **Objetivo:** dejar la capa de compatibilidad y las piezas de Roost sin datos, para que las lanes siguientes solo porten.
- **Entregables (origen → destino):**
  - `vendor/roost/src/types/index.ts` + `src/db/interfaces/types.ts` (solo `Module`, `Recording`, `LessonCompletion`, `ModuleWithProgress`, `RecordingWithCompletion`, `Event`, `EventAttendee`, `Showcase`, `ShowcaseImage`) + `types/showcase.ts` (`SHOWCASE_STATUS_INFO`) → `src/lib/homeschooling/roost/tipos.ts` (ids `number`).
  - *Shim* de router → `src/lib/homeschooling/roost/router.ts` (§2.4).
  - *Shim* de auth → `src/components/homeschooling/roost/auth.tsx` (§2.4), adaptado de `contexts/AuthContext.tsx`.
  - `LessonPlayer.tsx:30` (`getEmbedUrl`) + `AddRecordingModal.tsx:54-69` + `feed/VideoEmbed.tsx` → `src/lib/homeschooling/video.ts`: `parsearEnlaceVideo(url)` → `{plataforma, videoId, miniaturaUrl} | null` y `urlEmbed()` con `youtube-nocookie.com`. Regex ampliada a `youtu.be/ID`, `watch?v=ID`, `watch?…&v=ID`, `/embed/ID`, `/shorts/ID`, `vimeo.com/ID`.
  - `components/calendar/CalendarView.tsx` → `src/components/homeschooling/roost/CalendarView.tsx`: `dateFnsLocalizer` con `es` de date-fns, `withDragAndDrop` + su CSS, clase `mission-calendar` (sin `<style>` propio), props `events`, `eventPropGetter`, `onSelectEvent`, `onSelectSlot`, `onEventDrop`, `messages` en español (los de `MissionCalendar.tsx` [V L56-69]).
  - `ShowcaseReviews.tsx:22-64` (`StarRating`) → `src/components/homeschooling/roost/StarRating.tsx`.
  - `components/admin/StatsCard.tsx` → `src/components/homeschooling/roost/StatsCard.tsx`.
  - Test de guarda `src/lib/homeschooling/roost/guarda.test.ts` (`node:test`): recorre `src/**/homeschooling/**` y falla si encuentra `react-router-dom`, `@supabase/`, `services/supabase`, clases `surface-\d`, `primary-\d{2,3}`, `dark:` o un `.tsx` portado sin la cabecera «Portado de vendor/roost/».
  - Cabecera de atribución en `THIRD_PARTY_NOTICES.md` (raíz): Roost, commit, permiso del usuario (D23).
- **Tests:** `video.test.ts` (los 6 formatos + basura + id de 11 caracteres), `guarda.test.ts`.
- **Aceptación:** `npm test`, `tsc`, eslint en verde; ningún cambio en `prisma/`; ninguna dependencia nueva; `MissionCalendar.tsx` intacto.
- **Depende de:** nada.

### Lane 117 — H1a: modelo y pacing (sin UI)

- **Entregables:** `LANE_H1A_MODELO_Y_PACING.md` vigente **con estos cambios**: modelos `Materia` (familiar, sin `alumnoId`), `RecursoCurso` (campos de `modules` §4.1), `LeccionCurso` (campos de `recordings`; adelantado desde H2 porque el padre carga lecciones en 118), `PlanCurso` (+`alumnoId`), `DiaLectivo`, `DiaNoLectivo`, enums; relaciones inversas en `Usuario`, `Tarea`, `Libro`. `config.ts`, `pacing.ts` (`repartir`) y `servidor/planes.ts` como dice H1a; `crearPlan` recibe `alumnoId` y crea `PlanCurso` por alumno.
- **Origen Roost:** ninguno de UI; los nombres de campos salen de `vendor/roost/schema.sql:892-930` y `:459-473`.
- **Tests:** los 10 de `pacing.test.ts` (H1a) + «dos alumnos, mismo recurso → dos planes independientes».
- **Aceptación:** H1a + SQL aplicado sin `DROP`, anotado en el vault.
- **Depende de:** nada (puede ir en paralelo con 116).

### Lane 118 — H1b: el padre arma materias, cursos y plan

- **Entregables (origen → destino):**
  - `services/module.ts` (funciones de §1.5 salvo `markLessonComplete`) y `services/group.ts:599-750` (`hasPermission`, `createRecording`, `updateRecording`, `deleteRecording`) → cliente `src/lib/homeschooling/roost/services/{module,group}.ts` + servidor `src/lib/homeschooling/servidor/cursos.ts` + `dto.ts` (desde `mongodb/index.ts:472-503`) + rutas `src/app/api/homeschooling/{materias,cursos,lecciones}/…` con `conSesion({ soloPadres: true })` para escribir.
  - `CreateGroupModal.tsx` (reducido) → `components/homeschooling/cursos/MateriaForm.tsx`.
  - `learn/LearnGroupLayout.tsx` → `cursos/MateriaLayout.tsx` (modo padre); `ModuleGrid` → `CursoGrid`; `ModuleCard` → `CursoCard`; `ModuleDetail` → `CursoDetalle`; `CompactGroupHeader` → `MateriaHeader`; `AddRecordingModal` → `LeccionForm` (usa `video.ts`).
  - Asistente «Nuevo curso»: `Stepper` de Ordo [V `src/components/Stepper.tsx`] con 4 pasos; el paso «Recurso» son los campos de `ManageModuleModal.tsx`; el paso «Vista previa» llama `vistaPrevia` (117).
  - `pages/Calendar.tsx` → `plan/PlanCalendario.tsx` con el `CalendarView` de 116: eventos = `DiaLectivo` (color de la materia), días no lectivos rayados, arrastrar → `moverDia`, clic → `Sheet` con *Omitir/Mover*; botón «Hoy no hay clase» (H1b §5).
  - Rutas: `src/app/dashboard/homeschooling/page.tsx` (servidor; bifurca por rol; para Hijo/Hija muestra «Próximamente» hasta 119), `…/materias/[id]/page.tsx` (con `?module=&lesson=` como Roost), `…/plan/page.tsx`, `…/dias-sin-clase/page.tsx`. Enlace «Estudio» (`GraduationCap` [V existe]) en `AppSidebar` y `MainDock`.
- **Tests:** permisos de `servidor/cursos.ts` (un Hijo no crea/edita/borra), `dto.ts` (forma Roost), `reorderModules` estable, `hasPermission` con roles mapeados.
- **Aceptación:** H1b §Aceptación + alta/edición/orden de lecciones de video con miniatura; `MissionCalendar` y `/dashboard/tasks` sin cambios; capturas móvil y escritorio.
- **Depende de:** 116, 117.

### Lane 119 — H2: «Hoy aprendo»

- **Entregables (origen → destino):**
  - Modelo `ProgresoLeccion` (§4.1).
  - `services/module.ts` `markLessonComplete` → `completarLeccion` en servidor con el *upsert* idempotente de `mongodb/index.ts:2528` + chequeo de bloqueo; `markLessonIncomplete` solo para padres.
  - `learn/LessonPlayer.tsx` → `hoy/VisorLeccion.tsx` (`Sheet` a pantalla completa): `urlEmbed` de 116; botón único «Terminé» (sin desmarcar); sin `commentSection`; en la última lección del día → `POST /api/tasks/[id]/complete` con `elapsedSeconds` y confeti existente (`canvas-confetti`).
  - `learn/LearnSidebar.tsx` → `hoy/LeccionesDelDia.tsx` (candado y gris en lo bloqueado; cajón móvil → `Sheet`).
  - `learn/ModuleCard.tsx` → `hoy/TarjetaHoy.tsx` (variante grande, ≥ 96 px, objetivo táctil ≥ 44 px).
  - `MateriaLayout` en modo hijo (vista «hoy» = grilla de `TarjetaHoy`).
  - `servidor/hoy.ts`: `asegurarTareasDeHoy` (ARQ §5) **con `horaEjecucion`** (§4.3) y llamado desde `src/app/api/cron/daily/route.ts` [V existe]; `leccionesDeHoy`; `servidor/progreso.ts` (`sincronizarDia`, `estaBloqueado`).
- **Tests:** `estaBloqueado`; `vencimientoLeccion(fecha, horaLimite, APP_TZ)` (pura) → una lección completada a las 10:00 de Montevideo es «a tiempo» según la fórmula de `complete` [V L77]; `asignadoId` y `creadorId` correctos; idempotencia de `asegurarTareasDeHoy` (con `PERMITIR_TESTS_DB=1`).
- **Aceptación:** H2 §Aceptación; un hijo no puede completar lecciones de otro alumno vía las rutas de homeschooling.
- **Depende de:** 118.

### Lane 120 — H3: evidencia y portafolio (desde Showcase)

- **Entregables (origen → destino):**
  - Modelos `EvidenciaAprendizaje`, `EvidenciaImagen`.
  - `services/showcase.ts` (funciones de §1.5) → cliente `roost/services/showcase.ts` + `servidor/evidencia.ts` (desde `mapShowcase`, `mongodb/index.ts:363`). **No** se porta `trg_showcase_approval_points`: aprobar no da puntos.
  - `pages/ShowcaseSubmit.tsx` (dropzone L229-260 + borrador L33, L80-156) → `evidencia/EnviarEvidencia.tsx` (`Sheet`), con `react-dropzone@14.3.8` y `subirImagen`; botón de cámara en `VisorLeccion` y `TarjetaHoy`.
  - `pages/admin/Showcases.tsx` → `revision/RevisionEvidencias.tsx`: contadores con `StatsCard`, filtro por estado, **aprobar** (con `StarRating` opcional), **pedir ajuste** (el modal de rechazo: estado L45, `handleReject` L94, modal L418; comentario obligatorio), destacar/quitar; cada fila con `SwipeRow` (izq. aprueba, der. pide ajuste).
  - `pages/Showcase.tsx` + `ShowcaseCard.tsx` + `ShowcaseFilters.tsx` → `portafolio/{Portafolio,EvidenciaCard,FiltrosPortafolio}.tsx`.
  - Borrado: si una `EvidenciaImagen` se borra y ninguna otra fila usa ese `Archivo`, se borra el `Archivo`.
- **Tests:** permisos (Hijo solo ve y crea lo suyo; no aprueba), `limpiarArchivo`, que `aprobar` no cambie ningún saldo del `Usuario`.
- **Aceptación:** H3 §Aceptación.
- **Depende de:** 119. **Dependencia nueva:** `react-dropzone@14.3.8` (exacta).

### Lane 121 — H4: preguntas, checkpoints y repaso

- **Entregables:** modelos `PreguntaLeccion`, `IntentoQuiz`, `TarjetaRepaso`; `servidor/quiz.ts` (H4, pero la nota y los fallos seguidos se derivan de `IntentoQuiz`); `servidor/repaso.ts` con ts-fsrs (crear tarjeta al 2.º fallo seguido o a pedido del padre; `repasosDeHoy` máx. 3); `VisorLeccion` cambia el iframe por `react-player` para leer el tiempo y pausar; `CheckpointOverlay`, `QuizFinal`, editor de preguntas del padre; `radio-group` de shadcn.
- **Origen Roost:** ninguno (no existe).
- **Tests:** `calcularNota` (0, 70 exacto, 100, sin preguntas), «la respuesta de `preguntasParaAlumno` no tiene `correcta` ni `explicacion`», disparo de checkpoint con salto de tiempo, ts-fsrs: acierto aleja la fecha, fallo la acerca.
- **Aceptación:** H4 §Aceptación.
- **Depende de:** 119. **Dependencias nuevas:** `react-player@3.4.0`, `ts-fsrs@5.4.2`.

### Lane 122 — H5: horas y reportes (desde Events)

- **Entregables (origen → destino):**
  - Modelos `ActividadOffline`, `ParticipanteActividad`, `MetaHoras`.
  - `services/event.ts` (funciones de §1.5) → cliente + `servidor/actividades.ts` (desde `mapEvent`, `mongodb/index.ts:311`).
  - `events/EventForm.tsx` → `horas/ActividadForm.tsx`; `EventCard` → `ActividadCard`; `EventDetails` → `ActividadDetalle`; `AttendeeList` → `ParticipantesList`. Las actividades también se ven en `PlanCalendario`.
  - `servidor/horas.ts`: `resumenHoras` (lecciones = `Tarea.tiempoRealEjecucionSeg` o estimado; actividades = `fin − inicio` por participante).
  - `reportes/page.tsx`: `StatsCard`, gráfico de `ui/chart` (recharts), evidencias destacadas (si 120 está integrada), `@media print` y botón `window.print()`.
- **Tests:** `resumenHoras` (solo lecciones, solo actividades, mezcla, recorte de período, varios participantes).
- **Aceptación:** H5 §Aceptación.
- **Depende de:** 119 (usa 120 si existe).

### Lane 123 — H6: neurodivergencia

Sin cambios respecto de `LANE_H6_NEURODIVERGENCIA.md`; Roost no tiene nada aplicable [V]. Depende de 119.

---

## 7. Riesgos y conflictos

1. **Base de producción.** Solo SQL aditivo generado con `migrate diff`. Nunca correr `vendor/roost/schema.sql` ni `vendor/roost/prisma` (es MongoDB [V]). Las lanes 117, 119, 120, 121, 122 y 123 tocan `schema.prisma`: integrar **de a una** y hacer `git merge dev` antes de generar el SQL.
2. **Dependencias.**

| Paquete | Versión | Choque | Evidencia |
|---|---|---|---|
| `react-dropzone` | 14.3.8 exacta (la última es 20.1.3) | peer `react >= 16.8` acepta 19.2.4 | [V `npm view`, lockfile de Roost] |
| `react-player` | 3.4.0 | peer React/ReactDOM `^19` | [V `npm view`] |
| `ts-fsrs` | 5.4.2 | `node >= 20`; local v26.8.1 | [V `npm view`, `node --version`] |
| `react-big-calendar`, `date-fns`, `lucide-react`, `recharts` | ya instalados (1.19.4, 4.4.0, 1.7.0, 3.8.0) | — | [V `package.json`] |

3. **Duplicación.** Dos localizadores de calendario (`momentLocalizer` en `MissionCalendar` [V L4-11], `dateFnsLocalizer` en el portado): las dos libs ya están; se acepta y se unifica en otra lane si el usuario quiere. Barra de progreso, subida de imágenes y toasts: se usan los de Ordo (no se portan los de Roost).
4. **CSS.** Importar `vendor/roost/src/index.css` pisaría `body` y los bordes globales (`@layer base`, L9-31) → prohibido. Clases sin traducir **fallan en silencio** (§2.3) → test de guarda (116).
5. **Seguridad / roles.**
   - Roost protege con RLS y `auth.uid()`; al pasar a Prisma esa protección desaparece. Cada función de `servidor/*` debe repetir los chequeos de §3.2. Un Hijo nunca recibe datos de otro alumno.
   - Roost deja que cada usuario **desmarque** su lección (política «Users can unmark lessons», `schema.sql:3456` [V]); en Ordo eso solo lo hace un padre.
   - **Existente, fuera de alcance:** `POST /api/tasks/[id]/complete` no verifica que quien completa sea el asignado [V L11-30]: un hermano podría completar la tarea-lección de otro. Recomiendo una lane aparte (cambia el comportamiento de todas las tareas, así que lo decide el usuario).
   - Fotos: `GET /api/archivos/<uuid>` es público a propósito [V `src/app/api/archivos/[clave]/route.ts:6-8`]; HD6 lo acepta para uso doméstico.
6. **Rendimiento.** Roost hace N+1: `LearnGroupLayout` pide las grabaciones de cada módulo por separado (L79-83) y `pages/Calendar.tsx` hace 2 consultas por evento (L42-55) [V]. Con `fetch` → ruta → Supabase serían N viajes. En la ruta de servidor se devuelve todo en una consulta (`include`) y el cliente mantiene la firma. Las fotos viven en Postgres (`Archivo.datos`): medir tamaño por mes (AUDITORÍA E3).
7. **Fechas.** `complete` mezcla hora local del servidor (`setHours(22)`, L57-73) y UTC (`getUTCHours`, L75) [V]. Con `horaEjecucion` fijada en `APP_TZ` (§4.3) la lección queda bien; se asume que el servidor corre en la casa con la zona de Montevideo [S].
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

## 9. Contradicciones encontradas

| # | Dónde | Qué dice | Qué hay en el código | Resolución |
|---|---|---|---|---|
| X1 | `SPEC.md`, `ARQUITECTURA_DETALLADA.md` §7, `MAPEO_COMPONENTES_ROOST.md`, `LANES_HOMESCHOOLING.md` | Roost es «solo referencia visual»; «no se copian archivos» | Revocado por el usuario | Este plan |
| X2 | `MAPEO_COMPONENTES_ROOST.md`, `AUDITORIA.md` | Roost está en `/home/x7/Downloads/dev/roost` | Está en `vendor/roost/` [V `ORIGEN.md`] | Usar `vendor/roost/` |
| X3 | `ARQUITECTURA_DETALLADA.md` HD6, `LANE_H3` | Subir fotos con `POST /api/archivos` | No existe; `api/archivos` solo tiene `GET [clave]`; la subida es `POST /api/upload` [V] | `POST /api/upload` vía `subirImagen` |
| X4 | `ARQUITECTURA_DETALLADA.md` HD1 | `/complete` + `/approve` dan «puntos, XP, racha» | Dan puntos, estrellas y racha; **no** XP (`experienciaHabitos`) [V `approve/route.ts:38-52`] | Corregido en §4.3 |
| X5 | `ARQUITECTURA_DETALLADA.md` §5 | La Tarea del día lleva `fechaVencimiento = hoy` | Así se paga siempre como tardía [V §4.3] | `horaEjecucion` obligatoria |
| X6 | `ARQUITECTURA_DETALLADA.md` §6, `LANE_H1B` | «`MissionCalendar` extendido» con arrastre | `MissionCalendar` usa `momentLocalizer` y no tiene arrastre [V] | Se porta `CalendarView` + `withDragAndDrop` |
| X7 | `MAPEO_COMPONENTES_ROOST.md` | No agregar `react-dropzone` | Lo usa el código de Roost que se porta | Se agrega 14.3.8 (D-8) |
| X8 | `AUDITORIA.md` E1 vs `ARQUITECTURA_DETALLADA.md` HD6 | E1: servir evidencias con sesión. HD6: URL pública aceptada | DECISIONES D19 dice que la auditoría manda sobre los `LANE_H*`, pero HD6 es posterior y responde a D23 (uso doméstico) | Se mantiene HD6; se puede revertir sin tocar el modelo |
| X9 | `vendor/roost/CLAUDE.md` | Services «migrando a `db()`», adaptadores «listos» | Ningún service usa `db()` [V] | §3 |
| X10 | `ARQUITECTURA_DETALLADA.md` HD8 | Repaso con intervalos fijos 1-3-7-14-30 | Hay librería madura (ts-fsrs) y la regla del usuario pide reutilizar | D-11 |

---

## 10. Registro de decisiones

| # | Decisión | Alternativas | Razón | Cómo revertir |
|---|---|---|---|---|
| D-1 | Portar componentes a Next y reescribir solo datos (opción a) | (b) Express aparte; (c) híbrido con Supabase/RLS | El Express no tiene cursos/eventos/showcase; (b)/(c) exigen correr `schema.sql` o duplicar usuarios | Ninguna lane bloquea correr Roost aparte en el futuro; habría que sincronizar usuarios |
| D-2 | Partir cada service (cliente `fetch` + servidor Prisma) con la misma firma | Adaptador del `DatabaseAdapter`; Server Functions | El adaptador no lo usa nadie; las Server Functions serializan lecturas y no se usan en Ordo | Cambiar el cuerpo del cliente por `'use server'` en el mismo archivo; los componentes no cambian |
| D-3 | DTO con nombres de Roost (snake_case) e ids numéricos | Renombrar en todos los componentes | Menos cambios en los archivos portados | Renombrar con búsqueda/reemplazo en `roost/` |
| D-4 | Contenido familiar (`Materia`, `RecursoCurso`, `LeccionCurso`) y plan por alumno | `Materia.alumnoId` (ARQ v2) | Es el modelo de Roost (contenido compartido, avance por usuario) y evita cargar dos veces un curso para hermanos | Agregar `alumnoId` a `Materia` y filtrar; los planes ya son por alumno |
| D-5 | Día lectivo = `Tarea` (HD1) con `horaEjecucion` en `APP_TZ` | Premios propios de lecciones; `lesson_completions` con puntos | Roost no premia lecciones; Ordo ya resuelve aprobación, racha y tope | Quitar la creación de Tareas en `asegurarTareasDeHoy`; el avance sigue en `DiaLectivo` |
| D-6 | Traducir clases a tokens/`ui/` con tabla fija + test de guarda | Puente `@theme` con la paleta de Roost | Coherencia visual y `ui-work-rules` | Agregar la paleta en `@theme` y relajar el test |
| D-7 | Portar `CalendarView` (date-fns) + `withDragAndDrop`; `MissionCalendar` no se toca | Extender `MissionCalendar` (moment) | Restricción del usuario + no cambiar comportamiento de Tareas | Reemplazar el portado por `MissionCalendar` con las mismas props |
| D-8 | `react-dropzone@14.3.8` exacta | `<input type=file>`; v20 | Es el código de Roost; la 14.3.8 es la que Roost probó | Cambiar `useDropzone` por `<input>` en un archivo |
| D-9 | `LeccionCurso` en H1a/117 (no en H2) | Como ARQ v2 | El padre carga lecciones con `AddRecordingModal` en 118 | Mover el modelo a 119 |
| D-10 | `ProgresoLeccion` = `lesson_completions` (la fila es la completitud) + `IntentoQuiz` aparte | Contadores mutables (ARQ v2) | Copia literal de Roost y historial de intentos (AUDITORÍA B6) | Agregar columnas a `ProgresoLeccion` |
| D-11 | Repaso con ts-fsrs | Intervalos fijos 1-3-7-14-30 (HD8) | Regla «reusar open source»; FSRS es el estándar de Anki | `TarjetaRepaso` guarda `due`; volver a intervalos fijos es reemplazar una función |
| D-12 | Checkpoints con `react-player` | YouTube IFrame API a mano (ARQ H4) | Una sola API para YouTube y Vimeo; no se escribe el cargador | Volver al iframe de Roost y a la IFrame API |
| D-13 | Evidencia = Showcase sin votos/reseñas; estrellas sin monedas | Tabla propia desde cero | Moderación, destacado e imágenes ya existen en Roost | — |
| D-14 | Horas fuera de pantalla = Events + attendees | `ActividadOffline` con un solo alumno (ARQ v2) | Una salida familiar suma horas a varios hijos con una carga | Restringir a un participante |
| D-15 | Feriados a mano en v1 | `date-holidays` | HD4 y P4 | Agregar botón de importación |

---

## 11. Preguntas abiertas (solo el usuario puede responderlas)

| # | Pregunta | Recomendación por defecto |
|---|---|---|
| P1 | ¿Los cursos se comparten entre hermanos (un curso, un plan por hijo) o cada hijo tiene sus materias propias? | **Compartidos** (D-4). |
| P2 | ¿Un hermano puede ver las evidencias aprobadas de otro (en Roost los showcases aprobados son públicos) o solo las suyas? | **Solo las suyas**; los padres ven todo. |
| P3 | ¿Hasta qué hora una lección del día cuenta «a tiempo» (puntos completos)? Después de esa hora paga 50 % y desde las 22:00, 0 (regla actual de Tareas). | **20:00**, configurable por familia. |
| P4 | ¿Querés importar los feriados de Uruguay automáticamente o cargarlos a mano? | **A mano** en v1; importación como mejora. |
| P5 | ¿Abrimos una lane para que `complete` exija que quien completa sea el asignado (o un padre)? Afecta a todas las tareas. | **Sí**, como lane aparte antes de 119. |
