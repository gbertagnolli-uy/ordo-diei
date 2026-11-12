# Lane 179 — R4: el plan en el calendario del teléfono

Catálogo C10 (Google Calendar / Apple Calendar). Pensado para quien está en el hogar: el plan de cada hijo aparece en el calendario que ya usa, sin abrir la app.

- `lib/homeschooling/ics.ts` (puro, 4 tests): iCalendar RFC 5545 — CRLF, plegado a 75 octetos sin partir caracteres, escapes, eventos de día completo y con hora.
- `GET /api/homeschooling/calendario/[alumnoId]/[token].ics`: público pero **firmado**: el token es HMAC-SHA256 del id con `SESSION_SECRET`, comparado en tiempo constante; respuesta 404 igual si falla la firma o el alumno no existe. Incluye clases (curso, páginas/lecciones, minutos), actividades fuera de pantalla y días sin clase, de 14 días atrás a 180 adelante.
- Botón «Calendario del teléfono» en el plan: muestra el enlace, «Copiar» y los pasos para Google y Apple.
- Límite conocido: no hay rotación individual del enlace (cambiar `SESSION_SECRET` invalida todos); quien tiene el enlace ve los títulos de las clases de ese hijo.
