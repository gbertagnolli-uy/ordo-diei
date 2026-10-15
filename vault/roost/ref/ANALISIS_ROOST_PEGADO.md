# Análisis exhaustivo de Roost — texto pegado por el usuario (verbatim)

> Pegado por el usuario el 2026-10-15 como referencia permanente. **No se edita**: las correcciones contra el repo clonado están en [`../GUIA_EVALUAR_ROOST.md`](../GUIA_EVALUAR_ROOST.md) §7. Ojo: el texto menciona rutas `/home/z/my-project/repos/roost/` y el cierre habla de "los otros 4 repos"; son del análisis original (otra herramienta), no de este proyecto.

---

Excelente. El repo ya está clonado. Es **masivo**: 47 rutas, 115+ componentes, 28 servicios, 16+ rutas backend, 40 tablas. Voy a dispatchar 4 agentes en paralelo para analizar diferentes capas a fondo y luego sintetizo todo.
# Roost — Análisis exhaustivo (repo clonado y analizado a fondo)

Repo: `github.com/msrbuilds/roost` (clonado en `/home/z/my-project/repos/roost/`)
Versión analizada: `0.0.2` — Licencia MIT

---

## 1. Qué es Roost (en una línea)

**Plataforma de comunidad self-hosted open-source, alternativa a Skool/Circle.so**, que tú despliegas en tu propia infra. Combina feed social tipo Reddit, classrooms tipo Skool con módulos y lecciones, DMs en tiempo real, showcase tipo Product Hunt, calendario de eventos con RSVP, gamificación con puntos y leaderboard, live room con YouTube embed, y panel de admin completo con white-labeling dinámico.

---

## 2. Stack tecnológico completo

### Frontend
| Tecnología | Versión | Uso |
|---|---|---|
| React | `^19.2.4` | UI (React 19, última major) |
| React Router DOM | `^7.0.2` | Routing (v7) |
| Vite | `^6.0.3` | Bundler |
| TypeScript | `~5.6.2` | Tipado estricto |
| Tailwind CSS | `^3.4.15` | Estilos (con `darkMode: 'class'`) |
| @supabase/supabase-js | `^2.47.0` | Cliente Supabase (auth + DB + realtime + storage) |
| @aws-sdk/client-s3 + s3-request-presigner | `^3.893.0` | Subidas directas S3 vía presigned URLs |
| react-quill-new | `^3.8.3` | Editor WYSIWYG (fork compatible con React 19) |
| react-big-calendar | `^1.19.4` | Calendario mensual/semanal/diario |
| react-dropzone | `^14.3.8` | Drag & drop de archivos |
| react-intersection-observer | `^10.0.2` | Infinite scroll |
| emoji-picker-react | `^4.18.0` | Selector de emojis |
| date-fns | `^4.1.0` | Manipulación de fechas |
| dompurify | `^3.3.1` | Sanitización HTML anti-XSS |
| lucide-react | `^0.460.0` | Iconografía |
| lodash | `^4.17.23` | Utilidades (debounce) |

### Backend (carpeta `server/`)
| Tecnología | Versión | Uso |
|---|---|---|
| Node.js | 20 (Alpine) | Runtime |
| Express | `^4.21.0` | HTTP framework |
| TypeScript | `^5.6.2` | Tipado |
| tsx | `^4.19.2` | Dev server con watch |
| helmet | `^8.0.0` | Security headers |
| cors | `^2.8.5` | CORS |
| express-rate-limit | `^7.5.0` | Rate limiting (fallback en memoria) |
| multer | `^2.1.1` | Uploads multipart (branding) |
| @supabase/supabase-js | `^2.47.0` | Cliente admin Supabase |
| stripe | `^20.4.1` | Pagos y suscripciones |
| redis | `^5.10.0` | Caché distribuida y rate limiting |
| @aws-sdk/client-s3 + s3-request-presigner | `^3.700.0` | S3 / Object Storage |
| nodemailer | `^7.0.11` | SMTP emails |
| zod | `^3.24.1` | Validación de schemas |
| bcryptjs / jsonwebtoken / @prisma/client | dinámico | Solo cuando `DB_PROVIDER=mongodb` |
| pg_dump (postgresql17-client) | — | Backups de DB desde Docker |

### Base de datos (dual, patrón adapter)
- **Supabase Cloud** (default, recomendado)
- **Supabase Self-hosted** (full control)
- **MongoDB + Prisma** (no external deps, sin realtime)

### Storage
- **AWS S3** / S3-compatible (MinIO, Cloudflare R2, Backblaze B2)
- Bucket público para uploads + bucket privado para backups

### Pagos
- **Stripe** (suscripciones recurrentes, Customer Portal, webhooks)

### Testing
- **Vitest** (cobertura 70% obligatoria en lines/functions/branches/statements)
- **@testing-library/react** para componentes
- **Playwright** para E2E (chromium)

### Deployment
- **Docker** multi-stage (Alpine, ~150MB, non-root user)
- **Dokploy** templates incluidos
- **Vercel / Netlify** (frontend) + backend separado
- **VPS** con Traefik + Let's Encrypt SSL
- **Install script interactivo** (`install.sh`)

---

## 3. Arquitectura del código

### 3.1 Patrón Adapter (Hexagonal) — dual DB

```
src/db/
├── interfaces/
│   ├── database.ts  ← interfaz DatabaseAdapter (~100 métodos en 22 dominios)
│   └── types.ts     ← entidades, enums, DbResult, DbListResult
├── adapters/
│   ├── supabase/index.ts  ← SupabaseAdapter (1.855 líneas)
│   └── mongodb/index.ts   ← MongoDBAdapter (2.948 líneas, Prisma)
├── config.ts  ← lee VITE_DB_PROVIDER
└── index.ts   ← factory con import dinámico + singleton
```

- `VITE_DB_PROVIDER` puede ser `supabase-cloud` | `supabase-selfhosted` | `mongodb`.
- **Realtime**: nativo en Supabase (`postgres_changes`). En MongoDB es **no-op** (TODO: Change Streams + Socket.IO).
- **Access control**: en Supabase usa RLS + funciones SQL `has_premium_access()`, `can_access_group()`. En MongoDB se replica en application code.

### 3.2 Patrón Adapter de Auth

```
src/auth/
├── interfaces/auth.ts  ← AuthAdapter (getSession, signUp, signIn, signOut, resetPassword, updatePassword, updateUser, admin*)
├── adapters/
│   ├── supabase/index.ts  ← wraps supabase.auth.*
│   └── local/index.ts     ← JWT + API REST al backend Express (mongo)
└── index.ts  ← factory
```

### 3.3 Entry point del frontend

```tsx
<ThemeProvider>
  <SiteSettingsProvider>  ← branding dinámico ANTES que el resto
    <AuthProvider>
      <App />  ← rutas con lazy loading
    </AuthProvider>
  </SiteSettingsProvider>
</ThemeProvider>
```

### 3.4 Backend — Express server

Monta 12 routers sobre `/api/*`:
- `/api/health`
- `/api/auth` (password reset)
- `/api/2fa` (TOTP)
- `/api/stripe` (admin)
- `/api/webhooks/stripe`
- `/api/upload` (S3 presign)
- `/api/notifications` (batch emails)
- `/api/backup` (pg_dump + S3)
- `/api/activations` (admin/mod)
- `/api/site-settings` (superadmin)
- `/api/live-room` (admin/premium)
- `/api/email-preview` (solo dev)

---

## 4. Features completas (TODAS, en detalle)

### 4.1 Comunidad / Feed social

- **Posts con rich text** (React Quill: headers, bold, italic, underline, strike, listas, link, clean). Sanitización con DOMPurify al pegar y al renderizar.
- **Título opcional** + contenido (1–10.000 chars).
- **Categorías** con color, icono (emoji o nombre), slug auto-generado. Pueden ser globales o por grupo.
- **Posts pineados** (solo admin), con carousel en home/group feed.
- **6 reacciones emoji**: like (👍 azul), love (❤️ rojo), fire (🔥 naranja), clap (👏 amarillo), think (🧠 púrpura), haha (😂 verde). Optimistic UI con rollback.
- **Picker de reacciones**: hover desktop, long-press 500ms con `navigator.vibrate(50)` en mobile.
- **Comentarios anidados** hasta profundidad 3, con threading visual (border-l-2 + indent).
- **Votación de comentarios** (Reddit-style upvote/downvote) con score visible.
- **Menciones @username** con dropdown de búsqueda (debounce 300ms, keyboard nav), render como link a profile, trigger DB que crea notificación `mention`.
- **Carga media** de contenido largo (160px) con "See more/less" y gradiente fade.
- **MediaGallery** con grid responsive (1/2/3/2x3 cols) + lightbox full-screen (navegación keyboard + thumbnails).
- **Embeds automáticos** de YouTube y Vimeo al detectar URLs en el texto.
- **Categorías filtrables** + sort (newest/popular/trending) + toggle "Admin Posts" (ámbar con shield).
- **Realtime** vía Supabase channels: nuevos posts se acumulan en banner "Show N new posts" (Twitter-style) en vez de auto-prepend.
- **Virtualización** del feed (`OffscreenPostCard` con IntersectionObserver `rootMargin: 400px`) — desmonta PostCards fuera del viewport.
- **Caché module-level** con TTL 5 min en `PostFeed` para persistir datos entre navegaciones SPA.
- **Modos de feed**: `home` (siguiendo), `explore` (toda la comunidad), `group` (filtrado por grupo).

### 4.2 Classrooms (Grupos / Aulas)

- **Roles**: `admin`, `moderator`, `member` (con `GroupRole` enum).
- **Privacidad**: `is_private` (solo miembros ven contenido), `is_premium` (requiere suscripción).
- **3 layout modes** seleccionables:
  1. `default` — feed + tabs estándar (DefaultGroupLayout).
  2. `sidebar` — feed con sidebar de info (SidebarGroupLayout).
  3. `learn` — vista de curso con módulos y lecciones (LearnGroupLayout).
- **Permisos granulares** vía `hasPermission(userRole, action)`: `edit_settings`, `manage_members`, `manage_content`, `manage_recordings`, `manage_assets`, `manage_modules`.
- **Miembros**: promocionar/degradar (member ↔ moderator ↔ admin), remover, lista paginada con búsqueda.
- **Grabaciones (recordings)**: subidas a YouTube/Vimeo, con `video_platform`, `video_id`, `thumbnail_url`, `display_order`.
- **Assets del grupo**: PDFs, docs, imágenes, ZIPs hasta 100MB, vinculados a módulo opcional.
- **Anuncios scoped** al grupo (`scope='group'`).
- **Leaderboard específico del grupo**: ruta `/classrooms/:slug/leaderboard`.
- **Eventos específicos del grupo** con `group_id`.

### 4.3 Learn Mode (modo aula tipo Skool)

- **Módulos** = unidades temáticas con thumbnail, título, descripción, display_order.
- **Lecciones** = recordings dentro de módulos, con video YouTube/Vimeo embebido.
- **Progreso tracking**: tabla `lesson_completions` (user_id, recording_id, module_id, completed_at).
- **ProgressBar** con porcentaje `X% · Y/Z lessons` por módulo.
- **Sidebar colapsable** con módulos expandibles, lecciones con check verde (completadas) o círculo (pendientes).
- **Mobile**: FAB button (bottom-left) para abrir/cerrar sidebar + overlay backdrop.
- **LessonPlayer**: video iframe responsive + título + descripción + botones Previous / Mark Complete / Next.
- **Navegación secuencial** vía `getAdjacentRecordings(recordingId, moduleId)`.
- **Comentarios por lección** (targetType='recording' en CommentSection).
- **Gestión admin**: crear/editar/eliminar módulos (ManageModuleModal), añadir/editar/eliminar recordings (AddRecordingModal), subir/eliminar assets (UploadAssetsModal).

### 4.4 Mensajería DM (Direct Messages)

- **1-a-1 únicamente** (sin group chats).
- **Premium required** (gated por `requirePremium` en la ruta).
- **Realtime bidireccional**: canales Supabase para INSERT/UPDATE en `messages` con filtros `sender_id` y `recipient_id`.
- **Read receipts**: `is_read` + `read_at` marcados al cargar la conversación si `document.hasFocus()`.
- **Attachments**: imágenes (clickeables, abren lightbox) y archivos (link de descarga). Subida a S3 con registro en `assets.message_id`.
- **Textarea auto-resize** (max 120px), counter de caracteres desde 4500 con warning a 5000.
- **Send**: Ctrl/Cmd+Enter.
- **Multi-tab sync**: canal escucha INSERTs del propio user_id para sincronizar entre pestañas.
- **Optimistic send** con `crypto.randomUUID()` + replace con mensaje real.
- **Auto-scroll inteligente** al último mensaje (preserva scroll position al cargar más históricos).
- **ConversationList**: lista con avatar + OnlineIndicator absoluto + ProBadge + último mensaje truncado (50 chars) + badge de no leídos ("9+" si >9).
- **UserSearchInput** con debounce 300ms, mínimo 2 chars.
- **Online status**: `usePresence` hook con heartbeat cada 60s, threshold de 2 min para considerar online. Listeners en `visibilitychange` y `beforeunload`.

### 4.5 Calendario y Eventos

- **Vistas**: month, week, day, agenda (`react-big-calendar`).
- **RSVP** con 3 estados: `going` (verde), `maybe` (amarillo), `not_going` (rojo). Cada botón muestra count.
- **Color coding** del calendario según RSVP del usuario:
  - Default: púrpura `#9333ea`
  - Pasado: gris `#9ca3af` con opacity 0.6
  - Going: verde `#10b981`
  - Maybe: ámbar `#f59e0b`
- **Eventos virtuales o presenciales** (toggle). Si virtual: `meeting_url` con botón "Join Meeting". Si presencial: `location`.
- **Eventos community-wide** (`group_id` nullable) o **scoped a grupo**.
- **EventDetails modal** con: Date & Time, Location/Meeting, Hosted by, About, Your Response, Attendees expandible (tabs All/Going/Maybe/Can't Go).
- **Creación/edición** vía `EventForm` con start/end datetime-local.
- **Realtime**: `subscribeToEventChanges` y `subscribeToEventRSVPs` en Supabase channels.
- **AttendeeList** con avatar + nombre + @username + OnlineIndicator + status badge.
- **Gamificación**: +15 pts (`event_attended`) cuando RSVP='going'.

### 4.6 Showcase Gallery (tipo Product Hunt)

- **Productos/proyectos** con: título (3-255 chars), tagline (10-150), descripción rich text (50-10.000), URL, thumbnail, categoría, tech_stack (array), tags (N:N), galería de imágenes.
- **9 categorías** predefinidas + flexibles.
- **Tags** con color y slug únicos. Seed inicial: Open Source, AI/ML, No-Code, Developer Tool, Productivity, Design, Marketing, Finance, Education, Social.
- **Estados**: `pending → approved → featured` o `rejected`. Moderación admin con `moderation_notes`.
- **Votación** (ProductHunt-style): botón vertical con ChevronUp + count. Variantes sm/md/lg (la `lg` es horizontal naranja o púrpura si ya votado).
- **Reviews** con StarRating (1-5 estrellas interactivas con hover), contenido (10-2000 chars), maker_reply (blockquote con border-l-2 primary).
- **Restricciones**: no puedes review tu propio proyecto, no puedes doble review.
- **Featured** (destacados por admin) con badge púrpura top-left.
- **Stats cacheadas**: `vote_count`, `review_count`, `average_rating` (denormalizadas por triggers SQL).
- **Filtros**: search (debounce 300ms), sort (newest/votes/rating/featured), category pills, tag multi-select.
- **ShowcaseFilterSidebar** colapsable (desktop) o overlay (mobile) con active filter count badge.
- **Draft en localStorage** (`showcase_submit_draft`) con auto-save y "Restore draft" al volver.
- **Lightbox** con navegación keyboard (flechas) + thumbnail strip.
- **Submit wizard multi-paso**: RichTextEditor + drag&drop imágenes + tech stack chips + tags.
- **Gamificación**: +10 pts (`showcase_approved`) cuando pasa de pending a approved/featured.

### 4.7 Leaderboard y Gamificación

- **Sistema de puntos** con 8 tipos de acción:
  - `post_created`: +10
  - `comment_created`: +5
  - `reaction_given`: +1
  - `reaction_received`: +2
  - `event_attended`: +15
  - `profile_completed`: +20
  - `daily_login`: +X
  - `showcase_approved`: +10
  - `manual_adjustment`: ±N (admin)
- **Periodos**: 7 días, 30 días, 365 días, all-time (período fijo `2000-01-01` a `2099-12-31`).
- **Scope**: global o por grupo.
- **Ranking dinámico** calculado server-side vía `leaderboard_entries`.
- **Medallas emoji** para top 3: 🥇 🥈 🥉.
- **UserRankBadge** circular con color por rango:
  - Rank 1: Gold gradient `from-yellow-400 to-yellow-600` + Trophy icon
  - Rank 2-3: Silver gradient `from-gray-300 to-gray-500`
  - Rank 4-10: Bronze gradient `from-orange-400 to-orange-600`
  - Rank 11-50: Blue gradient `from-blue-500 to-blue-700`
  - Rank 51+: Default gray
- **LeaderboardTable** con paginación 50 items + infinite scroll + highlight de usuario actual (`bg-purple-50` + badge "You").
- **LeaderboardCard** widget compacto para sidebar (top N, period selector).
- **PointActivityFeed** con infinite scroll (15 items) y mapeo de iconos por action_type.
- **Realtime**: `subscribeToLeaderboardChanges` refresca tabla completa.
- **"How to Earn Points"** guía visible en la página.

### 4.8 Live Room (streaming)

- **Streaming vía YouTube embed** (no hay servidor de streaming propio, no hay WebRTC).
- **Estados de sesión**: `idle` (creada) → `live` (en vivo, setea `started_at`) → `ended` (finalizada, setea `ended_at`).
- **Visibilidad**: `unlisted` o `private`.
- **Premium required** para ver y chatear (RLS en `live_session_messages` exige premium o admin/mod).
- **RSVP** con cutoff de 1 hora antes del `scheduled_at`.
- **LiveRoomChat** con realtime Supabase channel `live-chat-${sessionId}` (INSERT/DELETE):
  - Auto-scroll inteligente basado en posición de scroll del user.
  - Optimistic send con `temp-${Date.now()}` id.
  - Delete propio mensaje o admin (botón trash en hover).
  - Max 500 chars, Enter envía (Shift+Enter newline).
  - Avatares pequeños (w-6 h-6) con fallback inicial.
- **Polling con backoff exponencial** (30s → 5min) en `useLiveStatus` para detectar sesiones live.
- **Cache module-level** compartida entre componentes en LiveRoom.
- **TopNav badge "LIVE NOW"** animado (`animate-pulse` + `animate-ping`) cuando hay sesión activa, linkea a `/live`.
- **Recordings** = sesiones `ended` (hasta 50) accesibles post-evento.
- **Upcoming** = sesiones `idle` con `scheduled_at` futuro.

### 4.9 Feature Requests / Roadmap

- **3 tipos**: `feature_request` (Lightbulb), `bug_report` (Bug), `improvement` (Sparkles).
- **6 estados**: `under_review` (default), `planned`, `in_progress`, `released`, `declined`, `duplicate`. Las 4 primeras son Kanban columns.
- **Voting** (mismo patrón optimistic que Showcase): botón vertical izquierda con ChevronUp + count.
- **Pinned** (admin) con indicador estrella amarilla top-right.
- **Comentarios anidados** (max depth 2) con avatar + role badge + tiempo + "(edited)".
- **Admin Controls** en FeatureRequestDetail (solo `isPlatformAdmin || isPlatformModerator`):
  - Cambio de status con 6 botones.
  - Pin/Unpin.
  - **Official Response** (textarea + Save) que se muestra en bloque destacado `bg-primary-50 border-primary-200`.
- **SubmitRequestModal** con type selector (3 columnas), title (5-255), description RichTextEditor (min 20), drag&drop screenshots.
- **Vistas**:
  - `/roadmap` — FeatureRequests con carousel "Pinned & In Progress" + tabs por estado.
  - `/roadmap/all` — FeatureRequestList con sync de `?status=` en URL.
  - `/roadmap/:id` — FeatureRequestDetail con assets adjuntos + thread de comentarios.

### 4.10 Activations (canje de productos premium)

- **Catálogo admin** de productos activables: plugins WordPress, temas, servicios personalizados. Con `monthly_limit`, `license_key`, `file_url`, `instructions`.
- **Solicitudes de usuarios premium** con: `website_url`, `wp_username`, **`wp_password` (en claro en DB ⚠️)**, `notes`.
- **Estados**: `pending → in_progress → completed | rejected`.
- **Límite mensual** con contador en `activation_usage` (UNIQUE user_id+product_id+month_year).
- **RLS bloquea INSERT directo** — solo se puede vía RPC `request_activation()` que valida monthly_limit y no duplicar.
- **Notificaciones** automáticas al cambiar estado con título/mensaje según estado.
- **Email** al usuario con template específico por estado (pending ⏳, in_progress ⚙️, completed ✅, rejected ❌).
- **Stats admin** cacheadas 10 min: total productos, total requests, pendientes, en progreso, completadas este mes, rechazadas este mes.
- **Permisos**: único endpoint que admite rol `moderator` además de admin/superadmin (equipo de soporte de primer nivel).

### 4.11 Sistema de notificaciones

- **Tipos soportados**: `new_comment`, `comment_reply`, `new_reaction`, `new_message`, `mention`, `group_invite`, `new_follower`, `event_reminder`, default. Cada uno con icono y color específico.
- **In-app**: inserts en `notifications` desde triggers SQL (notify_on_comment, notify_on_reaction, notify_on_mention, notify_on_follow, notify_on_message).
- **Email batch**:cola con `email_pending=true`. Cron externo llama `POST /api/notifications/process-emails` con `x-api-key`, procesa lotes de 50, marca `email_sent_at` vía RPC.
- **NotificationCenter** dropdown en TopNav con badge de no leídos.
- **Realtime** vía canal `user-notifications-${user.id}` escuchando `*` en `notifications`.
- **Preferencias** por usuario (10 booleanos): `notify_{comments,replies,mentions,messages,reactions}` y `email_{comments,replies,mentions,messages,announcements}`. Defaults todos TRUE.
- **Cleanup** automático: función `cleanup_old_notifications()` borra >30 días y leídas.
- **Monitoreo admin**: `GET /api/notifications/status` (pendientes + enviadas en 24h).

### 4.12 Sistema de administración completo

11 páginas admin con sidebar oscuro propio:

1. **Dashboard** (`/admin`) — 4 StatsCards principales (members, posts, comments, upcoming events) + 3 secundarias (active groups, announcements, banned) + actividad 7 días (barras horizontales) + top 5 contributors con emojis 🥇🥈🥉 + growth chart 30 días.
2. **Users** (`/admin/users`) — tabla paginada con búsqueda + filtro role. Acciones: Ban/Unban (modal con duraciones 1h/1d/7d/30d/permanent + razón), Make/Remove Premium, Change Role (solo superadmin puede asignar roles). Usuario actual excluido de acciones.
3. **Content** (`/admin/content`) — moderación de posts y comments. Tabs Posts/Comments con búsqueda y paginación. Delete con confirm. **Visible para moderadores**.
4. **Categories** (`/admin/categories`) — CRUD con nombre (auto-slug), color (8 presets + picker), icono (emoji o nombre), display_order.
5. **Announcements** (`/admin/announcements`) — CRUD con title, content, type (info/success/warning/error), scope (global/group), fechas start/end, is_dismissible. Toggle active/inactive. Badges "Group", "Inactive", "Expired".
6. **Subscriptions** (`/admin/subscriptions`) — dashboard Stripe: 4 stats cards + lista webhooks recientes con etiquetas (Checkout, New Sub, Updated, Cancelled, Payment OK, Payment Failed) + botón "Cleanup Expired".
7. **Showcases** (`/admin/showcases`) — moderación con 6 stat cards + tabs (Pending/Approved/Featured/Rejected/All) + acciones approve/reject (modal con razón)/feature/unfeature. **Visible para moderadores**.
8. **Activations** (`/admin/activations`) — CRUD de productos + procesamiento de requests con cambio de estado. **Visible para moderadores**.
9. **Live Room** (`/admin/live-room`) — gestión de sesiones (crear, iniciar/detener stream, editar URL inline, expandir RSVPs).
10. **Backups** (`/admin/backups`) — 3 stat cards + trigger manual + tabla de historial con download.
11. **Site Settings** (`/admin/site-settings`) — 5 cards:
    - **Site Identity**: nombre, tagline, descripción.
    - **Logos**: upload logo claro/oscuro/favicon (PNG/JPG/SVG/WebP/ICO, max 2MB).
    - **Brand Color**: 10 presets + color picker + input hex + preview en vivo. **Aplica el color a TODA la app instantáneamente** vía CSS variables HSL generadas en runtime.
    - **Support**: email y URL.
    - **Feature Modules**: 4 selects (Live Room, Activations, Roadmap, Showcase) con opciones Everyone/Premium Only/Disabled.

### 4.13 Sistema de auth y seguridad

- **Registro/login** con Supabase Auth (JWT gestionado por SDK).
- **Confirmación de email** requerida (página pared `/confirm-email` con resend).
- **Validación de username** en tiempo real (regex `^[a-zA-Z0-9_-]{3,30}$`, debounce 500ms).
- **Password strength** calculado localmente (score 0-4: longitud, mayúsculas, dígitos, símbolos).
- **Reset password** con tokens propios (32 bytes, hash SHA-256, expiración 1h). Confirmación de email como side-effect.
- **Cambio de password** (logueado) con verificación de contraseña actual.
- **2FA TOTP** RFC 6238 (sin librerías externas):
  - Setup en 2 pasos: `/api/2fa/setup` genera secreto base32 + URI `otpauth://totp/...`, luego `/api/2fa/verify` valida código y habilita.
  - 8 backup codes en formato `XXXX-XXXX` (hash SHA-256, marca used_at al consumirse).
  - Login con 2FA: `/api/2fa/check-required` decide si hace falta; si sí, pide código (6 dígitos o backup code).
  - Ventana ±1 periodo (tolera drift de reloj ±30s).
  - QR code vía API externa `api.qrserver.com`.
  - Setup wizard 5 pasos (Intro → Scan → Verify → Backup → Complete), no se puede cerrar en step `backup`.
- **Bans** con duraciones (1h, 1d, 7d, 30d, permanent) + razón. Página pared `/banned` con countdown.
- **Protección de columnas sensibles** vía trigger SQL: `role` (solo superadmin), `is_banned/ban_*` (solo admin), `membership_type` (nunca modificable directo, solo vía Stripe webhook), `two_factor_*` (solo vía flow de verificación).
- **Roles jerárquicos**: `user < moderator < admin < superadmin`. Solo superadmin puede cambiar roles y editar site settings.
- **Guards enrutados**:
  - `ProtectedRoute`: auth → email confirmed → banned → premium.
  - `AdminRoute`: auth → isPlatformModerator.

### 4.14 Sistema de pagos Stripe

- **Suscripción recurrente** (no one-time) con `STRIPE_PRICE_ID`.
- **Flujo Checkout**: `POST /api/stripe/create-checkout-session` → URL Stripe Checkout → redirect a `/?payment=success` o `/upgrade`.
- **Customer Portal**: `POST /api/stripe/create-portal-session` → gestión/cancelación por parte del user.
- **Webhook** con verificación de firma + idempotencia por `stripe_event_id` + log en `stripe_webhook_logs`.
- **Estados mapeados**: active/trialing → `active`; past_due → `failed_payment`; canceled/unpaid → `cancelled`; incomplete → `expired`.
- **Grace period**: `isActive=true` si status=`active` **O** status=`cancelled` con `current_period_end` futuro.
- **Cleanup admin**: marca subs canceladas vencidas como `expired`, baja a `free` si no hay otras activas, notifica.
- **Features premium gated**:
  - Mensajería DM
  - Calendario y eventos
  - Live Room
  - Activations
  - Grupos premium
  - Búsqueda de posts premium
- **isPremium** automático para admin/mod (no necesitan pagar).

### 4.15 Backups

- **Pipeline**: `pg_dump` (flags `--no-owner --no-acl --clean --if-exists`) → gzip nivel 9 → upload S3 bucket privado → limpieza local → retención últimos 30 backups.
- **Triggers**: manual (`POST /api/backup/trigger` con admin) o automatizado (`POST /api/backup/automated` con `x-backup-token` timing-safe).
- **Conexión dual**: self-hosted Supabase (`SUPABASE_DB_HOST`) o Cloud (`SUPABASE_POOLER_HOST`, extrae project ref de `SUPABASE_URL`).
- **Timeout 5 min**, buffer 50 MB, password vía `PGPASSWORD` env.
- **Descarga**: presigned URL 15 min con `Content-Disposition: attachment`.

### 4.16 White-labeling dinámico

- **`SiteSettingsContext`** carga settings desde `site_settings` table y complementa `APP_CONFIG` (env vars).
- **`applyPrimaryColor(hex)`**: genera 11 tonos HSL (50–950) a partir de un hex y los setea como CSS variables `--color-primary-*` en `document.documentElement`.
- **Tailwind config referencia esas variables** → al cambiar el color desde el admin, **toda la app se recolorea instantáneamente sin rebuild**.
- **Logo + favicon dinámicos**: upload a S3, actualiza `<link rel="icon">` y `<img>` del branding en runtime.
- **Feature flags runtime**: `feature_live_room`, `feature_activations`, `feature_roadmap`, `feature_showcase` con valores `disabled | all | premium_only`.
- **PWA manifest dinámico** generado desde settings con `Cache-Control: public, max-age=3600`.

### 4.17 Sistema de búsqueda global

- **Debounce 300ms**, mínimo 2 chars.
- **3 categorías en paralelo**:
  - **Members**: `display_name` o `username` ilike.
  - **Posts**: `title` o `content` ilike, con JOIN author/category/group, filtro premium (excluye grupos premium si user no es premium).
  - **Classrooms**: `name` o `description` ilike, solo públicos.
- **Resultados categorizados** con headers uppercase.
- **Click outside** cierra dropdown, ESC cierra y blur.
- **Auto-clear** tras click en resultado.
- **Navegación**: profile/{username}, post/{id}, classrooms/{slug} o /upgrade si premium locked.
- **Limitación**: no busca en comments, messages, showcases, feature_requests, events. Tampoco usa la función SQL `search_posts` con tsvector que existe en el schema (usa ilike directo, posible ineficiencia en datasets grandes).

### 4.18 Soporte RTL

- **`src/lib/rtl.ts`** detecta caracteres en rangos Unicode RTL (Arabic `U+0600–06FF`, Arabic Supplement, Presentation Forms-A/B).
- **`.rtl-text`** class aplica direction: rtl, text-align: right, font-family `Noto Nastaliq Urdu`, line-height 2.2.
- Se aplica por componente (PostCard título/contenido, CommentItem contenido) para respetar urdu/árabe/persa.
- No es i18n completo, pero permite contenido multilingüe sin romper layout.

### 4.19 Performance y optimizaciones

- **Code-splitting agresivo**: 7 vendor chunks manuales (react, supabase, aws, ui, calendar, editor, emoji) + lazy loading de TODAS las páginas.
- **Memoización defensiva**: `TopNav` envuelto en `memo()`, `AuthContext` memoiza value y callbacks con `useCallback`, `banInfo` memoizado con `useMemo`. `PostCard` y `CommentItem` con comparador custom.
- **Cache module-level** en `PostFeed` (TTL 5 min) y `useLiveStatus` (compartida entre componentes).
- **Optimistic UI** generalizado: reacciones, votos, follows, send de mensajes, comments, RSVP. Con rollback en error.
- **Infinite scroll** consistente con `IntersectionObserver` o `react-intersection-observer`.
- **Cache SWR-like** en servicios con `cached()` / `cacheInvalidate()`.
- **Caché Redis distribuida** en backend: subscription status (15 min), dashboard stats (5 min), activation stats (10 min), user profile (30 min).
- **Rate limiting distribuido** con fallback en memoria: API 300/15min, webhooks 50/1min, admin 30/1min, auth 10/15min.

### 4.20 Internacionalización y branding

- App en **inglés** por defecto.
- **Branding configurable** vía env vars (`VITE_APP_NAME`, `VITE_APP_TAGLINE`, `VITE_APP_DESCRIPTION`, `VITE_APP_URL`, `VITE_API_URL`, `VITE_SUPPORT_EMAIL`, `VITE_SUPPORT_URL`) + override en runtime desde `site_settings`.
- **Document title** dinámico: `${site_name} - Community Platform`.

### 4.21 Guía visual de onboarding

- **`/guide`** con datos estáticos y screenshots embebidas desde `/guide-screenshots/*.png` (login, home-feed, classrooms, members, leaderboard, messages, calendar, profile, settings, guide).
- Secciones: Getting Started, Home Feed, Classrooms, Messages, Calendar, Leaderboard, Settings, Notifications, Profile, Posting.
- Cada sección con pasos (título, descripción, tips) y modal de zoom para imágenes.

---

## 5. Pantallas y rutas (47 rutas, 3 layouts)

### 5.1 Públicas (sin auth)

| Ruta | Página | Layout |
|---|---|---|
| `/login` | Login (con 2FA multi-step) | AuthLayout split-screen premium |
| `/signup` | Signup (validación username + password strength) | AuthLayout split-screen premium |
| `/forgot-password` | ForgotPassword | AuthLayout centered con blobs |
| `/reset-password` | ResetPassword (valida token) | AuthLayout centered con blobs |
| `/confirm-email` | ConfirmEmail (página pared) | Ninguno |
| `/banned` | Banned (con countdown) | Ninguno |
| `/subscription-required` | SubscriptionRequired (4 escenarios) | Ninguno |
| `/upgrade` | Upgrade (CTA Stripe) | Ninguno |

### 5.2 Autenticadas estándar (MainLayout)

| Ruta | Página | Funcionalidad clave |
|---|---|---|
| `/` | Home | Feed + sidebar derecha (about, top contributors, members widget, leaderboard card, announcement banner, LIVE banner) |
| `/explore` | Explore | Feed comunidad sin filtro follows |
| `/classrooms` | Groups | Tabs Discover/My Classrooms + búsqueda + infinite scroll (12/página) + Create (solo admin) |
| `/classrooms/:slug` | GroupDetail | 3 sub-layouts según `group.layout_mode` |
| `/classrooms/:slug/settings` | GroupSettings | Cambiar layout, privacidad, premium, editar, borrar (con confirmación escrita) |
| `/post/:postId` | PostDetail | Post + thread comentarios + sidebar derecha |
| `/members` | Members | Directorio con búsqueda + filtro online/all + sort + infinite scroll (20/página) |
| `/profile` | Profile | Perfil propio con tabs Posts/Activity/Followers/Following |
| `/profile/:username` | Profile | Perfil público por username |
| `/settings` | Settings | 4 tabs: Profile, Account (2FA), Subscription, Notifications |
| `/guide` | Guide | Onboarding visual |
| `/showcase` | Showcase | Galería con featured + grid + filtros + sidebar "My Submissions" |
| `/showcase/submit` | ShowcaseSubmit | Wizard multi-paso con draft en localStorage |
| `/showcase/:id` | ShowcaseDetail | Detalle con galería + reviews + vote + share/edit |
| `/leaderboard` | Leaderboard | Ranking global con period selector + "Your Rank" card + tabla + guía de puntos |
| `/classrooms/:slug/leaderboard` | Leaderboard | Ranking scoped al grupo |
| `/roadmap` | FeatureRequests | Carousel "Pinned & In Progress" + tabs por estado + search + filtros |
| `/roadmap/all` | FeatureRequestList | Lista completa filtrable con sync URL |
| `/roadmap/:id` | FeatureRequestDetail | Detalle con assets + comentarios + admin controls |

### 5.3 Premium (requirePremium)

| Ruta | Página |
|---|---|
| `/messages` | Messages (split: lista + chat) |
| `/messages/:userId` | Messages (con conversación precargada) |
| `/calendar` | Calendar (month/week/day/agenda + sidebar próximos eventos) |
| `/live` | LiveRoom (YouTube embed + chat + recordings + upcoming + RSVP) |
| `/activations` | Activations (productos disponibles + mis solicitudes) |

### 5.4 Admin (AdminLayout, guard AdminRoute)

| Ruta | Página | Mod access |
|---|---|---|
| `/admin` | Dashboard | ❌ (mod redirect a `/admin/content`) |
| `/admin/users` | Users | ❌ |
| `/admin/content` | Content | ✅ |
| `/admin/categories` | Categories | ❌ |
| `/admin/announcements` | Announcements | ❌ |
| `/admin/subscriptions` | Subscriptions | ❌ |
| `/admin/showcases` | Showcases | ✅ |
| `/admin/activations` | Activations | ✅ |
| `/admin/live-room` | LiveRoom | ❌ |
| `/admin/backups` | Backups | ❌ |
| `/admin/site-settings` | SiteSettings | ❌ |

---

## 6. UX/UI — Sistema de diseño

### 6.1 Tokens de Tailwind

- **`primary`**: paleta branding base con CSS variables `var(--color-primary-*)` → recolor dinámico.
- **`surface`**: grises neutros (50 `#fafafa` a 950 `#0a0a0a`).
- **`accent`**: fire `#f97316`, love `#ef4444`, clap `#eab308`, think `#8b5cf6` (reacciones).
- **Status**: success `#22c55e`, warning `#f59e0b`, error `#ef4444`, info `#3b82f6`.
- **Fuentes**: `Inter` (sans), `JetBrains Mono`/`Fira Code` (mono).
- **Sombras diferenciadas** light/dark: `soft`, `card`, `elevated`.
- **Animaciones custom**: `fade-in`, `slide-up`, `slide-down`, `scale-in`, `pulse-soft`, `slide-in-right`.

### 6.2 Regla de oro UI: "No box-shadows en cards, solo borders"

Aplicada consistentemente. La clase `.card` define `shadow-card` muy sutil (1px border + sombra 1px), pero en la mayoría de componentes de feed y contenido se fuerza `shadow-none`:
- `PostCard`: `card p-6 shadow-none hover:shadow-elevated`
- `ShowcaseCard`: `card p-4 shadow-none hover:shadow-elevated`
- `FeatureRequestCard`: `card p-3 shadow-none hover:shadow-sm`
- `CommunityMembersWidget`: `card … shadow-none`

La elevación `shadow-elevated` aparece solo en hover de cards clave y en modales/overlays.

### 6.3 Dark mode robusto

- `darkMode: 'class'` en Tailwind.
- `ThemeContext` con 3 modos: `'light' | 'dark' | 'system'`. Persiste en `localStorage['theme-preference']`.
- Escucha `prefers-color-scheme: dark` para modo `system`.
- `toggleTheme()` inteligente: si está en `system`, salta al opuesto del SO.
- **Overrides embebidos** para librerías externas:
  - Quill Editor (`.dark .ql-*` con bordes `#404040`, fondos `#262626`/`#171717`).
  - react-big-calendar (`.dark .calendar-container .rbc-*` con paleta `#171717`/`#262626`/`#404040`/`#9333ea`).

### 6.4 Patrones de Modal (consistente en 15+ modales)

1. **Render via `createPortal(…, document.body)`** — evita stacking context issues.
2. **Backdrop overlay** con `bg-black/50 dark:bg-black/70 backdrop-blur-sm`.
3. **ESC para cerrar** — listener global `keydown`.
4. **Bloqueo de scroll** con `document.body.style.overflow = 'hidden'` restaurado en cleanup.
5. **Header con título + botón X** (`<X className="w-5 h-5" />`).
6. **Footer con Cancel / Submit** separados por `border-t`.
7. **Estados de loading** con `<Loader2 className="animate-spin" />` + `disabled:opacity-50`.
8. **Estados de error** en `bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400`.
9. **Animación** `animate-fade-in` (modal) o `animate-scale-in` (dropdowns).
10. **Diálogos de confirmación** usan `window.confirm()` (PostFeed, CommentItem, GroupMembers, etc.).

### 6.5 Loading / Empty / Error states

- **Skeletons**: `PostFeed` (3 cards), `MembersGrid` (8), `LeaderboardTable` (10 filas), `LeaderboardCard` (5 filas), `GroupMembers` (3), `CommunityMembersWidget` (3), `PointActivityFeed` (5), `ConversationList` (spinner).
- **Spinner**: `<Loader2 className="w-8 h-8 text-primary-600 animate-spin" />` centrado.
- **Empty states**: patrón con icono grande + heading + subheading + CTA opcional:
  - `PostFeed`: "Your feed is empty" + CTA "Explore Posts"
  - `GroupRecordings`: "No recordings yet" + CTA condicional
  - `ConversationList`: "No conversations yet" + CTA "New Message"
  - `EmptyChatState`: icono MessageSquare circular + "Select a conversation"
  - `NotificationCenter`: "No notifications yet"
  - `LeaderboardTable`: Trophy 64px + "No Data Yet"

### 6.6 Accesibilidad

- **Focus visible** global: `outline-none ring-2 ring-primary-500 ring-offset-2`.
- **`aria-label`** en: MediaGallery lightbox, VideoPlayerModal, LiveRoomChat delete.
- **`title`** atributos en iconos-botones (SideNav, TopNav, etc.).
- **Keyboard nav**: ESC modales, flechas MediaGallery, Enter MentionDropdown y GlobalSearch, Ctrl/Cmd+Enter en CommentForm y MessageInput.
- **Scroll lock** en modales y lightboxes.
- **`scroll-smooth`** global.
- **`autoFocus`** en campos críticos (CommentForm reply, MentionDropdown tras click).

### 6.7 Componentes comunes reutilizables

- **`ProBadge`** dorado con corona (`Crown`), gradient `from-amber-400 to-yellow-500`, texto "PRO". Variantes xs/sm/md + modo `absolute`.
- **`RoleBadge`**: admin/superadmin (rojo `from-red-500 to-rose-600` + ShieldCheck) y moderator (azul `from-blue-500 to-indigo-600` + Shield).
- **`OnlineIndicator`** (punto verde/gris con sizes sm/md/lg + label opcional).
- **`SubscriptionBadge`** con 4 estados (Active, Grace Period, Expired/Cancelled/Failed Payment/Refunded) + modo `showDetails`.
- **`ProgressBar`** (sm h-1.5 / md h-2.5, color primary-600 o green-500 al 100%, label opcional tabular-nums).

### 6.8 Layouts

- **`MainLayout`**: `<SidebarProvider>` + `<SideNav>` (desktop lg:flex, fixed left) + `<TopNav>` (fixed top) + `<main>` con `padding-left` dinámico 16/64. Ejecuta `usePresence()` al montar.
- **`AdminLayout`**: sidebar oscuro propio (`bg-gray-900 dark:bg-surface-900`), no usa TopNav ni SideNav. Cabecera con Shield icon y label "Admin Panel" o "Mod Panel". Filtrado de nav items por rol (mods ven solo Content, Activations, Showcases).
- **`AuthLayout`**: split-screen premium en `/login` y `/signup` (panel izquierdo con gradientes ámbar/naranja + branding + card "Go Premium" + lista de beneficios; panel derecho con form centrado). Layout centered con blobs blur para `/forgot-password` y `/reset-password`.

### 6.9 Navegación

- **`SideNav`** (desktop, fixed, colapsable): 12 items con feature gating dinámico, premium lock con Crown ámbar, sección Admin separada (solo admin/mod), footer con avatar + display_name + @username + Settings + LogOut. Persiste `isCollapsed` en `localStorage['sidebar-collapsed']`.
- **`TopNav`** (fixed top, mobile + desktop): logo mobile, GlobalSearch desktop, button search mobile, Messages link con NotificationBadge o Crown lock, Notifications con NotificationCenter dropdown + badge, **LIVE NOW badge** rojo pulsante, dark mode toggle (Sun/Moon), profile dropdown (avatar + ProBadge + links Profile/Settings/Guide/Admin/Sign out), hamburger mobile con 9 nav tabs. Realtime unread counts vía canal `unread-counts-${user.id}`. Memoizado con `memo()`.

---

## 7. Modelos de datos (43 tablas SQL)

### 7.1 Tablas principales

| Categoría | Tablas |
|---|---|
| **Auth/Profiles** | `profiles` (con username, role, membership, ban, 2FA, online status), `password_reset_tokens`, `two_factor_backup_codes` |
| **Social** | `posts`, `comments` (con `parent_comment_id` para threading, `post_id` o `recording_id` nullable), `reactions` (polimórfica con `reactable_type`), `comment_votes` (up/down), `follows`, `assets` (polimórfica con `asset_type`) |
| **Groups/Learn** | `groups` (con `layout_mode`, `is_private`, `is_premium`), `group_members` (con `group_role`), `categories`, `modules`, `recordings` (con `video_platform`, `video_id`), `lesson_completions`, `group_assets` |
| **Messaging** | `messages` (con `is_read`, `read_at`, CHECK sender != recipient) |
| **Notifications** | `notifications` (con `email_pending`, `email_sent_at`), `notification_preferences` (10 booleanos), `announcement_dismissals` |
| **Events** | `events` (con `is_virtual`, `meeting_url`, `group_id` nullable), `event_attendees` (con `rsvp_status`) |
| **Showcase** | `showcases` (con `tech_stack TEXT[]`, `vote_count`, `review_count`, `average_rating`), `showcase_images`, `showcase_tags`, `showcase_tag_relations`, `showcase_reviews` (con `maker_reply`) |
| **Feature Requests** | `feature_requests` (con `admin_response`, `is_pinned`, `vote_count`, `comment_count`), `feature_request_comments` |
| **Live Room** | `live_sessions` (con `status`, `visibility`, `started_at`, `ended_at`), `live_session_rsvps`, `live_session_messages` |
| **Gamification** | `leaderboard_entries` (UNIQUE con COALESCE para NULL group_id), `point_activities` |
| **Announcements** | `announcements` (con `type`, `scope`, `is_dismissible`, `starts_at`, `expires_at`) |
| **Activations** | `activation_products` (con `monthly_limit`, `license_key`, `file_url`), `activation_requests` (con `wp_username`, `wp_password` ⚠️), `activation_usage` |
| **Stripe** | `stripe_customers`, `stripe_subscriptions`, `stripe_webhook_logs` |
| **Site** | `site_settings` (key-value) |

### 7.2 Funciones SQL y triggers destacados

- **30+ funciones** SQL SECURITY DEFINER (RLS helpers, leaderboard, activations, search, admin stats).
- **20+ triggers**: `updated_at`, auth→profile, group→admin auto-insert, `award_points_for_post` (+10), `award_points_for_comment` (+5), `award_points_for_reaction` (+1/+2), `award_showcase_approval_points` (+10), `trigger_event_attendance_points` (+15), `notify_on_comment`, `notify_on_reaction`, `notify_on_mention`, `notify_on_follow`, `notify_on_message`, `update_showcase_vote_count`, `update_showcase_review_stats`, `update_feature_request_vote_count`, `update_feature_request_comment_count`, `protect_profile_sensitive_columns`, `setup_first_admin` (auto-destructiva).
- **80+ políticas RLS** que cubren todas las tablas.
- **Realtime publication** en `supabase_realtime` para `live_sessions`.

---

## 8. API HTTP completa (50+ endpoints)

### Health
- `GET /api/health` → status + servicios (supabase, redis con latencia).

### Auth y 2FA
- `POST /api/auth/request-reset` → genera token + email
- `POST /api/auth/validate-token` → valida sin consumir
- `POST /api/auth/reset-password` → cambia password + confirma email
- `POST /api/auth/verify-password` → verifica contraseña actual
- `POST /api/auth/change-password` → cambia password
- `POST /api/2fa/check-required` → decide si hace falta 2FA en login
- `POST /api/2fa/verify-login` / `verify-login-backup`
- `GET /api/2fa/status`
- `POST /api/2fa/setup` / `verify` / `disable` / `validate` / `backup` / `regenerate-backup`

### Stripe
- `GET /api/stripe/subscription-status` (Bearer)
- `POST /api/stripe/create-checkout-session` (Bearer)
- `POST /api/stripe/create-portal-session` (Bearer)
- `GET /api/stripe/stats` (admin)
- `POST /api/stripe/cleanup` (admin)
- `POST /api/webhooks/stripe` (verifica firma + idempotencia)

### Upload (S3)
- `POST /api/upload/presign` → URL firmada 5 min
- `POST /api/upload/delete` → con ownership check

### Notifications
- `POST /api/notifications/process-emails` (x-api-key, batch 50)
- `GET /api/notifications/status` (admin)

### Backup
- `POST /api/backup/trigger` (admin)
- `POST /api/backup/automated` (x-backup-token timing-safe)
- `GET /api/backup/list` (admin)
- `GET /api/backup/download/:filename` (admin, presigned 15 min)

### Live Room
- `POST/PUT/DELETE/GET /api/live-room/sessions` (admin)
- `GET /api/live-room/sessions/:id/rsvp-list` (admin)
- `GET /api/live-room/status` / `recordings` / `upcoming` (premium/admin)
- `POST/DELETE/GET /api/live-room/sessions/:id/rsvp` (premium/admin)

### Email Preview (solo dev)
- `GET /api/email-preview/welcome` / `password-reset` / `subscription-cancelled` / `subscription-reactivated`

### Site Settings
- `GET /api/site-settings/manifest.webmanifest` (público, PWA dinámico)
- `GET /api/site-settings` (público)
- `PUT /api/site-settings` (superadmin)
- `POST /api/site-settings/upload` (superadmin, logo/logo_dark/favicon)

### Activations
- `POST /api/activations/:id/status` (admin/mod/superadmin)
- `GET /api/activations/stats` (admin/mod/superadmin)

---

## 9. Observaciones técnicas críticas

### Fortalezas
1. **Stack bleeding-edge**: React 19 + React Router 7 + Vite 6 + Tailwind 3 + Supabase + Stripe.
2. **Abstracción dual DB** bien diseñada (aunque infrautilizada en servicios).
3. **White-labeling dinámico** sin rebuild (CSS variables HSL generadas en runtime).
4. **Seguridad robusta**: 2FA TOTP nativo, RLS en todas las tablas, ownership checks, timing-safe comparisons, idempotencia en webhooks, escape HTML en emails, sanitización DOMPurify en todo HTML.
5. **Performance**: code-splitting agresivo, lazy loading universal, memoización, cache module-level, optimistic updates, infinite scroll, virtualización del feed.
6. **Realtime extenso**: feed, comments, messages, notifications, live chat, leaderboard, event changes, RSVPs, presence.
7. **Production-grade**: Docker multi-stage non-root, healthcheck, rate limiting distribuido con fallback, observability (Redis healthcheck con latencia).

### Deudas técnicas y limitaciones
1. **`routes/auth.ts` MongoDB no montado** — código muerto.
2. **`cacheDeletePattern` usa `KEYS`** — puede bloquear Redis en producción con muchas claves (debería usar `SCAN`).
3. **Rate limiter admin fail-open** — en error deja pasar (aceptable para disponibilidad pero vector de abuso si Redis falla).
4. **Live Room sin WebSocket propio** — solo YouTube embed + chat Supabase.
5. **`activation_requests.wp_password` en claro** — riesgo de seguridad alto.
6. **`searchGroups` tiene N+1 queries** — count separado por grupo.
7. **Búsqueda frontend usa `ilike`** en vez de la función SQL `search_posts` con tsvector que existe en el schema.
8. **Adapter abstracto infrautilizado** — servicios importan directamente `./supabase` concreto.
9. **Realtime solo funciona con Supabase** — MongoDB adapter devuelve no-op.
10. **Inconsistencia `gray-*` vs `surface-*`** en algunos componentes (LeaderboardTable, EventCard, StatsCard, BanUserModal).
11. **Typing indicators no implementados** en DMs.
12. **Algunos componentes usan `window.confirm()`** en vez de modales custom.
13. **Errores de fetch silenciados** en GroupRecordings, GroupAssets, ModuleDetail, CalendarView (solo `console.error`).
14. **No hay tests E2E completos** (solo `auth.spec.ts` y `posts.spec.ts`).
15. **Site settings no modelado en Prisma** (solo SQL).

---

## 10. Conclusión

Roost es una plataforma de comunidad **production-ready, modular, bien tipada y modernísima**, con una amplitud de features comparable a Skool/Circle.so comerciales. Es probablemente **el proyecto más completo y ambicioso de los 5 LMS que te interesa comparar**: combina feed social rico (reactions, comments, mentions, voting, threading), classrooms con Learn Mode tipo Skool, DMs en tiempo real, showcase tipo Product Hunt, calendario con RSVP, gamificación con leaderboard, live room, feature requests/roadmap, activations de productos, panel admin completo con white-labeling dinámico, y soporte dual DB (Supabase/MongoDB).

**Próximos pasos sugeridos**:
1. ¿Quieres que haga el mismo análisis a fondo de los otros 4 repos (opencircle, lms-front, chamilo-lms, courselit) para que tengas un cuadro comparativo?
2. ¿Quieres que genere un documento PDF/Word con este informe para que lo puedas compartir?
3. ¿Quieres que pruebe levantar Roost en local con Docker para validar lo que dice el README?
