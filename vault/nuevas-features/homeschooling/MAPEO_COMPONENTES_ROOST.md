# Roost como referencia visual → Ordo Diei

> Repo local: `/home/x7/Downloads/dev/roost` (Vite + React Router 7 + Tailwind 3 + Supabase en el navegador). Uso autorizado por el usuario. **No se copian archivos tal cual**: se reescriben con `src/components/ui`, los tokens del tema y Prisma. Busque cada pieza por nombre de función, no por número de línea.

| Pieza en Roost | Qué aporta | Qué hace Ordo en su lugar | Lane |
|---|---|---|---|
| `groups/learn/LessonPlayer.tsx` (152 líneas) | Contenedor 16:9, `getEmbedUrl` (YouTube/Vimeo), botón completar, anterior/siguiente | `VisorLeccion` (`Sheet`) con embed `youtube-nocookie`; completar = `POST /api/tasks/[id]/complete` (no `markLessonComplete`) | H2 |
| `groups/learn/LearnSidebar.tsx` (175) | Lista numerada con checks | Lista de lecciones del día con candado (`Lock`) en escala de grises, igual que cartas/Tienda | H2 |
| `groups/learn/ProgressBar.tsx` (30) | `completadas/total` | `Progress` de `ui/` con color de la materia | H2 |
| `calendar/CalendarView.tsx` (303) | Vistas mes/semana/día/agenda, selección de eventos y slots | **No se copia**: se extiende `components/tasks/MissionCalendar.tsx` (ya usa `react-big-calendar`) | H1b |
| `pages/ShowcaseSubmit.tsx` (726) | Subida con vista previa, borrador en `localStorage` | `<input capture>` + `POST /api/archivos`; borrador por el sistema N5 si existe. Sin `react-dropzone` | H3 |
| `showcase/ShowcaseCard.tsx` (140) | Tarjeta de portafolio | `EvidenciaCard` con `Card`/`Badge` | H3 |
| `pages/admin/Showcases.tsx` | Moderación | `SwipeRow` (izq. aprueba, der. rechaza) | H3 |
| `services/module.ts` (371) | Consultas Supabase del cliente | Funciones de `lib/homeschooling/servidor/*` con Prisma | todas |

Dependencias a **no** agregar: `react-dropzone`, `@supabase/supabase-js`, `react-router-dom`.
