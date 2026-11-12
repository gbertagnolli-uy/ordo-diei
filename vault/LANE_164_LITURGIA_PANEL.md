# Lane 164 — Panel «Liturgia» e interfaz de sus páginas

## Pedido (textual)
Todo lo que es Liturgia debería estar unificado con un panel homónimo, es decir, llamado "Liturgia". Tanto en el sidebar (actualmente con Calendarium, Breviarium, Missale, Proprium de Tempore, Proprium Sanctorum, Ordinarium, Psalterium, Rosarium, y un enlace para cada uno) como en un nuevo panel dentro de liturgia que enlace cada página.

Además, las páginas de liturgia ninguna tiene bien hecha la interfaz: faltan la barra superior con breadcrumbs, el icono de sidebar para expandirlo y colapsarlo, y no tiene padding ni margin, está todo pegado a los bordes. Resolverlo sin pedir aprobación ni preguntas.

## Qué se hizo
- Sidebar: un solo enlace «Liturgia» → `/dashboard/liturgia` (como «Panel de administración»).
- `/dashboard/liturgia` ahora es el panel con una tarjeta por pantalla (`PanelLiturgia`). El Calendarium se movió a `/dashboard/liturgia/calendarium`; los enlaces viejos `/dashboard/liturgia?fecha=…` se reenvían ahí.
- `liturgia/layout.tsx`: `PageHeader` (SidebarTrigger + breadcrumb «Liturgia › Pantalla», vía `CabeceraPagina`) y `<main>` con `max-w-6xl px-4 py-6`.
- Lista de pantallas única en `components/liturgia/navegacion.ts` (antes `NAV_LITURGIA` en `AppSidebar`).
- `PageHeader` acepta `groupHref` para que el grupo del breadcrumb sea enlace.
