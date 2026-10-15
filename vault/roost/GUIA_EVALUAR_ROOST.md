# Roost — guía para evaluar sus features, su código y su estado en Ordo Diei

> Lane 163 · 2026-10-15. **Leer esto antes de evaluar Roost** o de decidir si una feature "ya está implementada".
> Referencia completa pegada por el usuario (verbatim, no se edita): [`ref/ANALISIS_ROOST_PEGADO.md`](ref/ANALISIS_ROOST_PEGADO.md).
> Código fuente: `vendor/roost/` (clon literal de `github.com/msrbuilds/roost`, commit `492af47`, v0.0.2, MIT; ver `vendor/roost/ORIGEN.md`). **No se edita**: lo que se adapta se porta a `src/` con un comentario `// Portado de vendor/roost/<ruta> …`.

## 0. Pedido del usuario (textual)

> "Dentro de Estudio no veo ni de cerca todas las features de Roost (community feed, posts, comments, reactions, direct messaging, groups, events, calendar, gamificación, live rooms, etc.). No se aprovecharon las pantallas de roost, para adaptarlas, es como que se programó algunas pantallas pero no veo un Social LMS completo. Analizame el GAP entre lo que tenemos ahora y el potencial completo de Roost revisando el repo clonado."
>
> "Roost es más que eso, necesito que documentes esto para cada vez que haya que evaluar Roost, sus features, su codigo y si ya están implementadas todas las features:" (+ el análisis exhaustivo, guardado en `ref/`).

## 1. Qué es Roost

Plataforma de comunidad self-hosted (alternativa a Skool/Circle): feed social, classrooms con modo Learn, DM en tiempo real, showcase tipo Product Hunt, calendario con RSVP, leaderboard, live room (YouTube embed + chat), roadmap/feature requests, activations, admin completo con white-label, Stripe, 2FA, backups. **Roost es un Social LMS completo; Estudio hoy NO lo es** (es un LMS de homeschooling familiar que usa una parte menor de Roost: ver §3).

## 2. Mapa del código (`vendor/roost/`) — dónde mirar

| Capa | Ruta | Contenido |
|---|---|---|
| Páginas | `src/pages/` (23 + `admin/` 12 + `auth/` 8) | Home, Explore, Groups, GroupDetail, GroupSettings, PostDetail, Members, Profile, Settings, Calendar, Messages, LiveRoom, Leaderboard, Showcase*, FeatureRequest*, Activations, Guide, Upgrade |
| Componentes | `src/components/` (136 `.tsx` en `src/`) | `feed/` 13, `groups/` 16 + `groups/learn/` 10, `messages/` 8, `events/` 6, `calendar/`, `showcase/` 6, `leaderboard/` 5, `members/` 4, `notifications/` 3, `feature-requests/` 5, `admin/` 4, `live-room/`, `search/`, `settings/` 3, `navigation/` (SideNav, TopNav), `common/` (ProBadge, OnlineIndicator, SubscriptionBadge) |
| Servicios | `src/services/` (28) | post, comment, commentVote, reaction, follow, message, group, module, event, showcase, leaderboard, notification, live-room, live-chat, feature-request, activation, asset, admin, search, profile, subscription, s3, backup |
| Capa de datos | `src/db/` (interfaz de ~112 métodos + adaptadores Supabase y MongoDB) y `src/auth/` | Los servicios **no** usan el adaptador: llaman a Supabase directo (CLAUDE.md de Roost) |
| Hooks / layouts | `src/hooks/` (usePresence, useLiveStatus, useSubscription), `src/layouts/` (Main, Admin, Auth) | |
| Backend | `server/src/routes/` (13 archivos), `services/` (backup, cache, email, stripe, two-factor) | **Solo** auth/2FA, Stripe, upload S3, notificaciones por email, backup, live-room, site-settings, health. **No hay rutas de posts, comentarios, cursos, eventos ni showcase**: el cliente habla directo con Supabase |
| Esquema | `schema.sql` (3657 líneas: 42 tablas, 67 funciones, 34 triggers, 149 políticas RLS), `prisma/schema.prisma` (37 modelos) | La seguridad real vive en **RLS y triggers**: al portar a Prisma hay que reescribirla en código |
| Tests | `src/**/*.test.ts`, `e2e/` (solo `auth.spec.ts`, `posts.spec.ts`) | |

## 3. Matriz de features: Roost → estado en Ordo Diei

Estados: **PORTADO** (código de Roost adaptado en `src/`) · **PARCIAL** · **EQUIVALENTE** (Ordo tiene algo propio que cubre la necesidad) · **NO** (no existe en `src/`) · **DESCARTADO** (decisión escrita en `PLAN_INTEGRACION_ROOST.md` §8). Verificado contra `src/` el 2026-10-15.

| # | Feature de Roost (§ del análisis) | Archivos clave en `vendor/roost` | Estado en Ordo | Dónde / nota |
|---|---|---|---|---|
| 1 | Feed: posts con rich text, categorías, pin (4.1) | `components/feed/`, `services/post.ts` | NO · DESCARTADO | §8 plan: "Ordo no es red social" |
| 2 | Reacciones (6 emojis, picker long-press) | `PostCard`, `ReactorListModal`, `reaction.ts` | PARCIAL (lane 174) | 3 emojis sobre comentarios y evidencias; sin picker ni lista de reactores |
| 3 | Comentarios anidados, votos, menciones | `CommentSection/Item/Form`, `MentionDropdown`, `commentVote.ts` | PARCIAL (lane 174) | Comentarios planos con reacciones 👍❤️🙏 entre integrantes de la familia, en lección, material y evidencia (`comunidad/ComentariosEstudio`); sin anidado, votos ni menciones |
| 4 | Embeds YouTube/Vimeo | `feed/VideoEmbed.tsx`, `LessonPlayer.getEmbedUrl` | PORTADO (solo parseo) | `src/lib/homeschooling/video.ts` |
| 5 | Grupos/Classrooms: roles admin/mod/member, privado/premium, 3 layouts (4.2) | `groups/` (16) | PARCIAL | Solo "Materia" de la familia (`MateriaLayout/Header/Form`); sin roles de grupo, miembros, explorar ni layouts feed/sidebar |
| 6 | Miembros del grupo, promover/remover | `GroupMembers.tsx` | NO | |
| 7 | Assets del grupo (PDF, ZIP ≤100MB) | `GroupAssets`, `UploadAssetsModal` | NO · DESCARTADO | `Archivo` solo admite imágenes |
| 8 | Learn mode: módulos, lecciones, progreso, sidebar, player (4.3) | `groups/learn/` (10) | PORTADO | `components/homeschooling/cursos/` + `hoy/` (VisorLeccion, LeccionesDelDia); sin desmarcar ni comentarios |
| 9 | Quizzes, checkpoints, repaso | — (Roost no los tiene) | PROPIO de Ordo | ts-fsrs, `PreguntaLeccion`, `TarjetaRepaso` |
| 10 | DM 1-a-1 realtime, adjuntos, leído, presencia (4.4) | `components/messages/`, `message.ts`, `usePresence` | NO · DESCARTADO | |
| 11 | Calendario month/week/day/agenda, drag (4.5) | `calendar/CalendarView.tsx` | PORTADO | `roost/CalendarView.tsx` → `plan/PlanCalendario.tsx` |
| 12 | Eventos: form, card, detalle, asistentes | `events/` | PORTADO (sin RSVP ni enlace virtual; el plan y las actividades salen además por `.ics`, lane 179) | `horas/Actividad*`; `ParticipanteActividad` no tiene estado going/maybe/not_going |
| 13 | RSVP going/maybe/not_going (+15 pts) | `RSVPButton.tsx` | NO · DESCARTADO | |
| 14 | Showcase: submit, galería, filtros, reviews, estrellas (4.6) | `showcase/`, `pages/Showcase*` | PARCIAL | Evidencia/portafolio privado (`EvidenciaCard`, `EnviarEvidencia`, `StarRating`); sin votos, reseñas múltiples, tags ni público |
| 15 | Moderación de showcase (pending/approved/featured/rejected) | `pages/admin/Showcases.tsx` | PORTADO/ADAPTADO | `revision/RevisionEvidencias.tsx` con swipe |
| 16 | Leaderboard + puntos por acción + periodos + por grupo (4.7) | `leaderboard/`, `leaderboard.ts` | EQUIVALENTE | `LeaderboardModal` + `puntosAcumulados`, cartas, tienda. No hay puntos de Estudio por lección/foro, ni periodos, ni ranking por materia |
| 17 | Live room (YouTube + chat, RSVP, "LIVE NOW") (4.8) | `pages/LiveRoom.tsx`, `live-room/`, `live-chat.ts`, `useLiveStatus` | NO · DESCARTADO (HD12) | |
| 18 | Roadmap / feature requests con votos (4.9) | `feature-requests/` | NO | |
| 19 | Activations (canje de productos) (4.10) | `activations`, tablas `activation_*` | NO · DESCARTADO | Además guarda `wp_password` en claro |
| 20 | Notificaciones in-app + email + preferencias (4.11) | `notifications/`, `server/src/routes/notifications.ts` | PARCIAL (lane 174) | Campana de avisos en la barra de Estudio (`CampanaAvisos`, tabla `Homeschool_Avisos`): comentarios entre padres e hijos; sin correo, push ni preferencias |
| 21 | Admin: dashboard, usuarios, contenido, categorías, anuncios, subs, backups (4.12) | `pages/admin/` (12) | EQUIVALENTE | `dashboard/admin` y `users` propios; sin moderación de contenido ni anuncios |
| 22 | Anuncios globales/por grupo | `AnnouncementBanner`, `announcements` | NO | |
| 23 | Site settings / white-label / feature flags (4.16) | `SiteSettingsContext`, `lib/…` | NO | Ordo tiene su propio tema |
| 24 | Auth: registro, 2FA TOTP, bans, roles (4.13) | `pages/auth/`, `two-factor.ts` | DESCARTADO | Login por PIN + `RolFamiliar` |
| 25 | Stripe / premium (4.14) | `stripe-*.ts` | DESCARTADO (D23) | Uso doméstico |
| 26 | Backups pg_dump → S3 (4.15) | `server/src/services/backup.ts` | NO | Supabase gestiona backups |
| 27 | Búsqueda global (4.17) | `search/GlobalSearch.tsx`, `search.ts` | PARCIAL (lane 169) | Buscador de Estudio (⌘K): materias, cursos, lecciones, material, evidencias y actividades; el hijo solo en lo suyo |
| 28 | Perfil público, followers/following, directorio de miembros | `pages/Profile.tsx`, `members/`, `follow.ts` | NO / PARCIAL | `dashboard/perfil` y `users` propios; sin follows |
| 29 | RTL, guía de onboarding, dark mode (4.18, 4.21, 6.3) | `lib/rtl.ts`, `pages/Guide.tsx`, `ThemeContext` | PARCIAL | Ordo usa variantes `dark:` en sus componentes (no se portó `ThemeContext`); sin RTL ni guía |
| 30 | Sistema de diseño (6): tokens, modales, skeletons, ProgressBar, ProBadge, OnlineIndicator | `components/common/`, `tailwind.config.js` | EQUIVALENTE | Traducido a `components/ui/` (shadcn); según el plan HS0, un test de guarda detecta clases Roost sin traducir (no re-verificado en esta lane) |

**Resumen (actualizado en la lane 180, 2026-10-16):** de 30 filas, **PORTADO/ADAPTADO 5**, **PARCIAL 7** (filas 2, 3, 5, 14, 20, 27, 29), **EQUIVALENTE 3**, **PROPIO 1**, **NO/DESCARTADO 13**, **mixto NO/PARCIAL 1** (fila 28). La capa social de Roost quedó reducida, a propósito, a lo que sirve a **una** familia: comentarios, reacciones y avisos (lane 174). Lo que se construyó **más allá de Roost** para Estudio (material, impresión con tope, libreta, lectura, memoria católica, biblioteca, hoja semanal, `.ics`) está en [`CATALOGO_FEATURES_ESTUDIO.md`](CATALOGO_FEATURES_ESTUDIO.md). La capa social (filas 1–3, 6, 10, 13, 17, 18, 22, 27) es **cero**.

## 4. Cómo evaluar "¿ya está implementada la feature X de Roost?"

1. Buscar la feature en la matriz (§3) y en `ref/ANALISIS_ROOST_PEGADO.md` (§4.x). Si no está, listar `vendor/roost/src/components/` y `src/services/` antes de afirmar que Roost no la tiene.
2. Ubicar el origen: componente + servicio + tabla + trigger/RLS + ruta de servidor (§2). Una feature de Roost casi siempre es **las cinco cosas**; portar solo la pantalla deja la feature muerta.
3. Buscar el destino con `grep -rn "vendor/roost/<ruta>" src/` (cada archivo portado lo declara en su cabecera) y comprobar en `prisma/schema.prisma` el modelo equivalente.
4. Estado = el más bajo de: pantalla, datos (Prisma), servidor (permisos), tests. "Hay una pantalla" no es "implementada".
5. Comprobar el descarte: ¿figura en `PLAN_INTEGRACION_ROOST.md` §8 o `DECISIONES.md`? Si sí, es decisión, no olvido; para cambiarla hace falta una decisión nueva del usuario.
6. Actualizar §3 en la misma lane que cambie el estado.

## 5. Lo que cambia al portar (trampas ya conocidas)

- **Seguridad:** Roost se protege con RLS (`auth.uid()`) y triggers; con Prisma esa protección desaparece. Cada función de `servidor/*` debe repetir los chequeos. Un Hijo nunca ve datos de otro alumno.
- **Puntos, notificaciones y contadores** de Roost son **triggers SQL** (`award_points_*`, `notify_on_*`, `update_*_count`): hay que reimplementarlos en código o con triggers propios (sin `db push`; ver `AGENTS.md` §6).
- **Realtime** de Roost = `postgres_changes` de Supabase. Ordo no tiene realtime; DM, live chat, presencia y "N posts nuevos" necesitan SSE/Supabase Realtime.
- **Stack:** Vite + React Router + Tailwind 3 vs Next 16 + Tailwind 4: shim de router (`lib/homeschooling/roost/router.ts`), clases traducidas a tokens, componentes cliente.
- **N+1 conocidos** en Roost: `LearnGroupLayout`, `pages/Calendar.tsx`, `searchGroups`.
- **Fotos:** `GET /api/archivos/<uuid>` es público a propósito (uso doméstico). Un feed o portafolio compartido entre familias obliga a revisar eso.
- **Cualquier privacidad** (feed visible a quién, mensajes a quién) es decisión de producto, no se hereda de Roost.

## 6. Opciones de alcance (decisión pendiente del usuario)

| Fase | Contenido | Costo |
|---|---|---|
| A | Comentarios por lección (padre↔hijo), RSVP en Actividades, centro de notificaciones in-app, puntos/ranking de Estudio conectados a la economía de Ordo | Bajo-medio |
| B | Muro familiar: feed, comentarios, reacciones, DM dentro de la familia, directorio, anuncios | Medio-alto (modelos nuevos + realtime) |
| C | Multi-familia/cooperativa: grupos con roles, explorar, showcase compartido, moderación, admin de comunidad | Alto (cambia modelo y privacidad) |
| D | Live room, presencia, chat en vivo | Alto; el menos justificado |

La decisión "Estudio familiar (A+B) o comunidad entre familias (A–C)" **no está tomada**. Hasta entonces el estado oficial es el de §3.

## 7. Correcciones al análisis pegado (verificadas contra `vendor/roost/`)

| El análisis dice | El repo dice |
|---|---|
| 40 tablas / "43 tablas SQL" (varias veces) | `schema.sql` tiene **42** `CREATE TABLE`; `prisma/schema.prisma` tiene **37** modelos (CLAUDE.md de Roost dice 40) |
| "47 rutas" | `src/App.tsx` declara **43** `path=`; 47 es el número de CLAUDE.md de Roost |
| `DatabaseAdapter` "~100 métodos" | CLAUDE.md de Roost: **112** |
| "115+ componentes" | **136** `.tsx` en `src/` (incluye páginas y layouts) |
| "16+ rutas backend" / "12 routers" | `server/src/routes/` tiene **13** archivos (de los cuales `auth.ts` de MongoDB no se monta) |
| "11 páginas admin" | `src/pages/admin/` tiene **12** archivos (11 páginas + `index.ts`) |
| "80+ políticas RLS", "30+ funciones", "20+ triggers" | `schema.sql`: **149** `CREATE POLICY`, **67** funciones, **34** triggers |
| "Clonado en `/home/z/my-project/repos/roost/`" y "los otros 4 repos" | Ruta y contexto de otro entorno. Acá: `vendor/roost/`; OpenCircle fue descartado (AGPL) y no hay comparativa |

Todo lo demás del análisis (stack, features, rutas, deudas técnicas) coincide con lo visto en el repo y se toma como referencia. Los datos finos (colores, timings, límites) **no se re-verificaron uno a uno**: antes de portar una pieza, leer su archivo.

## 8. Documentos relacionados

- `vault/nuevas-features/homeschooling/PLAN_INTEGRACION_ROOST.md` (inventario con veredictos USAR/PORTAR/DESCARTAR; §8 = recortes)
- `vault/nuevas-features/homeschooling/MAPEO_COMPONENTES_ROOST.md` (tabla origen → destino)
- `vault/nuevas-features/homeschooling/SPEC.md`, `DECISIONES.md` (D16, D23, HD12)
- `vault/LANE_114_ROOST_CLON.md`, `LANE_118_HS0_BASE_ROOST.md`
