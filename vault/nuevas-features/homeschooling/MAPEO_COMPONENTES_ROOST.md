# Roost → Ordo Diei: qué se porta y adónde

> 2026-10-14 (v3.1). Roost está clonado sin modificar en `vendor/roost/` (commit `492af47`). Se **porta** su código a `src/` (no es solo referencia visual). Inventario completo con tamaños y motivos: [`PLAN_INTEGRACION_ROOST.md`](PLAN_INTEGRACION_ROOST.md) §1. Cada archivo portado lleva `// Portado de vendor/roost/<ruta> (msrbuilds/roost@492af47). Cambios: …`.

| Roost (`vendor/roost/src/…`) | Ordo (`src/…`) | Lane |
|---|---|---|
| `types/index.ts`, `db/interfaces/types.ts`, `types/showcase.ts` | `lib/homeschooling/roost/tipos.ts` | HS0 |
| `contexts/AuthContext.tsx` (solo `user`/`profile`) | `components/homeschooling/roost/auth.tsx` | HS0 |
| `react-router-dom` (uso) | `lib/homeschooling/roost/router.ts` (shim) | HS0 |
| `groups/learn/LessonPlayer.tsx` `getEmbedUrl`, `groups/AddRecordingModal.tsx` regex, `feed/VideoEmbed.tsx` | `lib/homeschooling/video.ts` | HS0 |
| `calendar/CalendarView.tsx` | `components/homeschooling/roost/CalendarView.tsx` (+ `withDragAndDrop`) | HS0 |
| `showcase/ShowcaseReviews.tsx` (`StarRating`) | `components/homeschooling/roost/StarRating.tsx` | HS0 |
| `admin/StatsCard.tsx` | `components/homeschooling/roost/StatsCard.tsx` | HS0 |
| `services/module.ts`, `services/group.ts` (grabaciones, `hasPermission`) | `lib/homeschooling/roost/services/{module,group}.ts` + `servidor/cursos.ts` | H1b |
| `db/adapters/mongodb/index.ts` (`mapModule`, `mapRecording`, `mapLessonCompletion`, `mapEvent`, `mapShowcase`, `completelesson`) | `lib/homeschooling/roost/dto.ts` y cuerpos de `servidor/*` | H1b, H2, H3, H5 |
| `groups/CreateGroupModal.tsx` (reducido) | `components/homeschooling/cursos/MateriaForm.tsx` | H1b |
| `groups/learn/LearnGroupLayout.tsx` | `cursos/MateriaLayout.tsx` | H1b (padre), H2 (hijo) |
| `groups/learn/CompactGroupHeader.tsx` | `cursos/MateriaHeader.tsx` | H1b |
| `groups/learn/ModuleGrid.tsx`, `ModuleCard.tsx` | `cursos/CursoGrid.tsx`, `CursoCard.tsx`; `hoy/TarjetaHoy.tsx` | H1b, H2 |
| `groups/learn/ModuleDetail.tsx` | `cursos/CursoDetalle.tsx` | H1b |
| `groups/learn/ManageModuleModal.tsx` | paso «Recurso» del asistente | H1b |
| `groups/AddRecordingModal.tsx` | `cursos/LeccionForm.tsx` | H1b |
| `pages/Calendar.tsx` | `plan/PlanCalendario.tsx` | H1b |
| `groups/learn/LessonPlayer.tsx` | `hoy/VisorLeccion.tsx` (sin desmarcar, sin comentarios) | H2 |
| `groups/learn/LearnSidebar.tsx` | `hoy/LeccionesDelDia.tsx` | H2 |
| `services/showcase.ts` | `lib/homeschooling/roost/services/showcase.ts` + `servidor/evidencia.ts` | H3 |
| `pages/ShowcaseSubmit.tsx` (dropzone + borrador) | `evidencia/EnviarEvidencia.tsx` | H3 |
| `pages/admin/Showcases.tsx` | `revision/RevisionEvidencias.tsx` (+ `SwipeRow` de Ordo) | H3 |
| `pages/Showcase.tsx`, `showcase/ShowcaseCard.tsx`, `ShowcaseFilters.tsx` | `portafolio/{Portafolio,EvidenciaCard,FiltrosPortafolio}.tsx` | H3 |
| `services/event.ts` | `lib/homeschooling/roost/services/event.ts` + `servidor/actividades.ts` | H5 |
| `events/EventForm.tsx`, `EventCard.tsx`, `EventDetails.tsx`, `AttendeeList.tsx` | `horas/{ActividadForm,ActividadCard,ActividadDetalle,ParticipantesList}.tsx` | H5 |

**No se portan** (motivo en el plan §1 y §8): `ProgressBar` (Ordo tiene `ui/progress`), `VideoPlayerModal`, `UploadAssetsModal`/`GroupAssets`, `RSVPButton`, `ShowcaseFilterSidebar`, `ShowcaseVoteButton`, `ShowcaseDetail`, `index.css`, el adaptador Supabase, `src/auth`, el servidor Express, y todo feed/mensajes/live room/leaderboard/Stripe/admin de comunidad.

**Dependencias:** se agregan `react-dropzone@14.3.8` (H3), `react-player@3.4.0` y `ts-fsrs@5.4.2` (H4). **No** se agregan `@supabase/supabase-js`, `react-router-dom`, `react-quill-new`, `dompurify`, `@aws-sdk/*`.
