# Lane HS0 — Base de Roost (sin base de datos, sin pantallas)

> Lista para implementar. Sin dependencias. Tamaño **M**. Leer antes: [`PLAN_INTEGRACION_ROOST.md`](PLAN_INTEGRACION_ROOST.md) §2–§3.
> Número: el siguiente libre al crearla (`git worktree list`, `git branch -a`, `ls vault/LANE_*`). Rama sugerida `task/lane-NN-hs0-base-roost`.

## Objetivo
Dejar la capa de compatibilidad y las piezas de Roost que no necesitan datos, para que las lanes siguientes solo porten.

## Reglas
- `vendor/roost/` no se edita. Cada archivo portado empieza con `"use client";` (si es componente) y la cabecera `// Portado de vendor/roost/<ruta> (msrbuilds/roost@492af47). Cambios: <lista corta>.`
- Clases: tabla del plan §2.3. Nada de `surface-*`, `primary-NNN`, `dark:`, `.btn`, `.card`.
- Sin dependencias nuevas. Sin cambios en `prisma/`. `src/components/tasks/MissionCalendar.tsx` no se toca.

## Entregables (origen → destino)
1. **Tipos** — `vendor/roost/src/types/index.ts` (`ModuleWithProgress`, `RecordingWithCompletion`), `vendor/roost/src/db/interfaces/types.ts` (`Module`, `Recording`, `LessonCompletion`, `Event`, `EventAttendee`, `Showcase`, `ShowcaseImage`) y `vendor/roost/src/types/showcase.ts` (`SHOWCASE_STATUS_INFO`, con estados `pendiente/aprobada/ajustar` y textos en español) → `src/lib/homeschooling/roost/tipos.ts`. Ids `number`; solo los campos que existen en el esquema de ARQ §3 (los demás se borran del tipo).
2. **Shim de router** → `src/lib/homeschooling/roost/router.ts`: `useSearchParams()` que devuelve `[params, setParams]` (lee con `useSearchParams` de `next/navigation` y escribe con `router.replace(pathname + "?" + …, { scroll: false })`), `useNavigate()` (→ `router.push`), `useParams()` (re-export de `next/navigation`), `Link` que acepta `to` y renderiza `next/link`.
3. **Shim de auth** (adaptado de `vendor/roost/src/contexts/AuthContext.tsx`) → `src/components/homeschooling/roost/auth.tsx`: `AuthProvider` que recibe `{ id, nombre, rolFamiliar }` desde la `page.tsx` servidor (que llama `getSession()`), y `useAuth()` → `{ user: { id }, profile: { id, display_name, rolFamiliar }, isAuthenticated: true, esPadre }`.
4. **Video** — `vendor/roost/src/components/groups/learn/LessonPlayer.tsx:30` (`getEmbedUrl`), `vendor/roost/src/components/groups/AddRecordingModal.tsx:54-69` y `vendor/roost/src/components/feed/VideoEmbed.tsx` → `src/lib/homeschooling/video.ts`:
   - `parsearEnlaceVideo(url) → { plataforma: "youtube" | "vimeo", videoId, miniaturaUrl } | null`. La regex de Roost no reconoce `/embed/` ni `watch?…&v=`: ampliarla a `youtu.be/ID`, `youtube.com/watch?v=ID`, `watch?…&v=ID`, `/embed/ID`, `/shorts/ID`, `m.youtube.com`, `vimeo.com/ID`, `player.vimeo.com/video/ID`. Id de YouTube: exactamente 11 caracteres `[A-Za-z0-9_-]`.
   - `urlEmbed(plataforma, id)` → `https://www.youtube-nocookie.com/embed/<id>?rel=0` o `https://player.vimeo.com/video/<id>`.
   - Miniatura: `https://img.youtube.com/vi/<id>/mqdefault.jpg` (como `ModuleDetail.tsx`); Vimeo: `https://vumbnail.com/<id>.jpg` (como `AddRecordingModal.tsx`).
5. **Calendario** — `vendor/roost/src/components/calendar/CalendarView.tsx` → `src/components/homeschooling/roost/CalendarView.tsx`:
   - `dateFnsLocalizer` con `format, parse, startOfWeek, getDay` y `locales: { es }` de `date-fns/locale` (`culture="es"`; semana desde el lunes: `startOfWeek: (d) => startOfWeek(d, { weekStartsOn: 1 })`).
   - Envolver con `withDragAndDrop` (`react-big-calendar/lib/addons/dragAndDrop`) e importar su `styles.css`.
   - Quitar el `<style>` con hex (L114-260) y usar la clase `mission-calendar` (importar `src/components/tasks/mission-calendar.css`).
   - Desacoplar de `EventDetails`, `EventForm` y `services`: props `events`, `eventPropGetter`, `onSelectEvent`, `onSelectSlot`, `onEventDrop`, `draggableAccessor`, `views` (por defecto `["month","week","agenda"]`), y `messages` en español (copiar los de `MissionCalendar.tsx` L56-69, con `event: "Lección"` y `noEventsInRange: "No hay clases programadas."`).
6. **Estrellas** — `vendor/roost/src/components/showcase/ShowcaseReviews.tsx:22-64` (`StarRating`) → `src/components/homeschooling/roost/StarRating.tsx` (color `text-warning`, foco visible, `aria-label` por estrella).
7. **KPI** — `vendor/roost/src/components/admin/StatsCard.tsx` → `src/components/homeschooling/roost/StatsCard.tsx` (sobre `Card` de `ui/`).
8. **Test de guarda** `src/lib/homeschooling/roost/guarda.test.ts` (`node:test`, sin dependencias): recorre `src/lib/homeschooling/**` y `src/components/homeschooling/**` y falla si encuentra `react-router-dom`, `@supabase/`, `services/supabase`, `/surface-\d/`, `/primary-\d{2,3}/`, `dark:` o un `.tsx` de `src/components/homeschooling/**` que no tenga «Portado de vendor/roost/» y tampoco la marca `// Propio de Ordo` (para lo que no viene de Roost).
9. **Atribución** — `THIRD_PARTY_NOTICES.md` en la raíz: Roost (msrbuilds/roost), commit `492af47`, uso con permiso del usuario (DECISIONES D23).

## Tests
- `src/lib/homeschooling/video.test.ts`: los 8 formatos de enlace, basura (`null`), id de 10 o 12 caracteres (`null`), `urlEmbed` usa `youtube-nocookie.com`.
- `guarda.test.ts` (debe pasar con lo de esta lane).

## Aceptación
1. `npm test`, `npx tsc --noEmit` y `npx eslint` de los archivos nuevos en verde.
2. Ningún cambio en `prisma/`, `package.json` ni `MissionCalendar.tsx`.
3. `CalendarView` renderiza en una página de prueba local (no se commitea) en claro y oscuro con los colores del tema.
