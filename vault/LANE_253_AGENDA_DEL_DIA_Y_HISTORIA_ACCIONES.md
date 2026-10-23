# Lane 253 — Agenda del Día en Login y Panel de Historial de Acciones con Reversión

## Contexto y requerimiento
Se implementaron dos nuevas funcionalidades solicitadas:
1. **Pantalla de Tareas / Agenda del Día desde Login**:
   - Modificación de la pantalla de login (`AuthPageClient.tsx` y `UserSelector.tsx`): se retiró el texto introductorio ("OD", "Ordo Diei", frase en latín, "¿Quién eres?"), dejando únicamente los avatares de los miembros de la familia con sus badges de podio y accesibilidad (`sr-only`, `title`, `aria-label`).
   - Se incorporó en el login el botón **"Agenda del Día"**, que conduce directamente a una pantalla estilo dashboard (`/agenda` y `/agenda-del-dia`).
   - El dashboard de Agenda del Día es altamente visual y práctico, accesible tanto sin autenticación previa (modo kiosco familiar) como desde la barra de navegación del dashboard.
   - En vez de colocar nombres de texto, cada tarea muestra el **avatar** de la persona (o personas en caso de tareas grupales o rotativas con co-responsables) responsable en ese día concreto.
   - Incluye tarjetas de resumen (total, pendientes, en curso, en revisión, completadas y porcentaje de avance), selector rápido de miembros por avatar para filtrar la agenda individual o ver a toda la familia, alternancia entre vista por miembros (columnas) y lista unificada, y modal interactivo de detalle de tarea.

2. **Panel de Historial de Acciones y Reversión en Administración**:
   - Nuevo panel ubicado en el panel de administración (`/dashboard/admin`), al final de la página (abajo de todo).
   - Log unificado cronológico de:
     - Tareas aprobadas.
     - Hábitos aprobados (registros marcados como hecho).
     - Premios entregados.
     - Compras en la tienda completadas.
   - Posibilidad de **revertir las acciones** con confirmación modal y control estricto de permisos (solo padres):
     - *Tareas*: descuenta los puntos y estrellas ganados, resta la tarea completada, restaura los puntos a bloqueados (`lockedPoints`), regresa la tarea a `Esperando_Aprobacion` y recalcula el porcentaje de completitud.
     - *Hábitos*: marca el registro como no aprobado (`aprobado = false`), descuenta los puntos y XP acreditados y actualiza libros si corresponde.
     - *Premios*: regresa el estado a `Pendiente` y descuenta las estrellas otorgadas.
     - *Compras*: ejecuta cancelación y reembolso seguro (devolución de puntos/estrellas, restauración de stock y cancelación de recompensas no usadas).

## Cambios realizados
- `src/components/auth/UserSelector.tsx`: Se removió el texto del nombre debajo del avatar, manteniendo accesibilidad (`sr-only`, `title`, `aria-label`) para mostrar únicamente los avatares.
- `src/components/auth/AuthPageClient.tsx`: Se retiraron los encabezados y párrafos de texto del selector, dejando los avatares y agregando el botón prominente "Agenda del Día".
- `src/components/agenda/agendaUtils.ts`: Utilidades puras de cálculo de estadísticas, filtrado por usuario/estado/búsqueda y agrupación por miembro para la agenda.
- `src/components/agenda/agendaUtils.test.ts`: Pruebas unitarias para estadísticas, filtros y agrupación de tareas.
- `src/components/agenda/AgendaDashboardClient.tsx`: Componente cliente visual e interactivo de la Agenda del Día con avatares de responsables en cada tarjeta de tarea.
- `src/app/agenda/page.tsx` y `src/app/agenda-del-dia/page.tsx`: Páginas server-rendered con proyección dinámica de tareas del día (`proyectarEventosCalendario`) y usuarios.
- `src/components/app/AppSidebar.tsx`: Acceso directo a "Agenda del Día" desde la barra lateral de la aplicación.
- `src/lib/admin/historiaAcciones.ts`: Funciones de backend para recopilar el log unificado de acciones y ejecutar las reversiones de tareas, hábitos, premios y compras dentro de transacciones.
- `src/lib/admin/historiaAcciones.test.ts`: Pruebas unitarias de tipos, permisos de reversión y formato de acciones.
- `src/app/api/admin/historia-acciones/route.ts`: Endpoints `GET` y `POST` protegidos para administradores.
- `src/components/admin/PanelHistoriaAcciones.tsx`: Componente del panel con filtros por tipo y usuario, búsqueda, tarjetas con detalles/puntos/actores, modal de confirmación y feedback por toasts.
- `src/components/admin/PanelAdmin.tsx`: Inclusión del componente `PanelHistoriaAcciones` abajo de todo en el panel de administración.

## Base de datos
No requiere migraciones ni cambios en el esquema de Postgres.

## Validación
- Pruebas unitarias ejecutadas: 618 tests (567 pasados, 0 fallados, 51 omitidos que requieren DB real).
- Verificación de tipos: `npx tsc --noEmit` completado sin errores.
- Compilación de producción: `npm run build` exitoso con generación de las rutas `/agenda`, `/agenda-del-dia` y `/api/admin/historia-acciones`.
