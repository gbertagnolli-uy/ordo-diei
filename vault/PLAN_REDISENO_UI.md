# Plan de Rediseño de Interfaz — Ordo Diei

Este documento define la hoja de ruta integral para modernizar y potenciar la interfaz de usuario de Ordo Diei, implementando componentes de **React Bits Pro**, **Aceternity UI** y **MagicUI**.

---

## 🎯 Objetivos Principales

1. **Floating Dock (Aceternity UI):** Reemplazar la barra de navegación superior clásica por un Dock flotante estilo macOS animado con Framer Motion, con acceso rápido a las funciones nucleares del sistema.
2. **Confetti en Completado (MagicUI / Canvas-Confetti):** Implementar el componente de celebración visual interactivo que se dispare cuando los miembros de la familia completan tareas o reclaman logros.
3. **App Shell 4 (React Bits Pro):** Estructurar la vista de tareas en formato de 3 columnas (Navegación/Filtros, Lista central de tareas, y Panel contextual de detalle).
4. **Kanban 4 (React Bits Pro):** Añadir una vista de tablero Kanban con columnas por estado y panel lateral de detalle de tarjeta, permitiendo alternar fluidamente entre vista Lista y vista Tablero.

---

## 🛣️ Estructura de Lanes y Ramas de Trabajo

El desarrollo se ejecutará de forma secuencial y modular, mergeando cada lane a la rama `dev` al completarse:

```
main (producción actual)
  └── dev (base de desarrollo activo)
        ├── task/lane-1-floating-dock (Merged a dev)
        ├── task/lane-2-confetti-completion (Merged a dev)
        ├── task/lane-3-app-shell (Merged a dev)
        └── task/lane-4-kanban (Merged a dev)
```

---

### Lane 1: Menú Principal con Floating Dock (`task/lane-1-floating-dock`)
- **Propósito:** Reemplazar el menú tradicional del header por un Dock flotante minimalista en la parte inferior/central.
- **Componente:** `FloatingDock` (`@/components/ui/floating-dock.tsx`).
- **Características:**
  - Animación suave de magnificación con `framer-motion` (`useMotionValue`, `useTransform`, `useSpring`).
  - Tooltips contextuales para cada ítem.
  - Acciones: Inicio / Dashboard, Nueva Tarea, Historial, Ranking de Líderes, Premios, Reglas del Hogar, Avanzar Día (Simular Cron), Toggle Modo Oscuro/Claro, Perfil/Salir.
  - Versión responsive móvil colapsable.
  - Integración armónica con el tema "The Noble Manuscript" (`globals.css`).

### Lane 2: Celebración con Confetti (`task/lane-2-confetti-completion`)
- **Propósito:** Recompensar el esfuerzo y la gamificación familiar con una animación de confeti al completar tareas.
- **Componente:** `Confetti` (`@/registry/magicui/confetti.tsx` y `@/components/ui/confetti.tsx`).
- **Características:**
  - Control imperativo con `ConfettiRef.fire()`.
  - Disparo reactivo en el evento de éxito de la API `/api/tasks/[id]/complete`.
  - Efecto visual alegre optimizado en canvas, respetando el rendimiento del navegador.

### Lane 3: App Shell 4 para Lista de Tareas (`task/lane-3-app-shell`)
- **Propósito:** Modernizar la lista de tareas en un diseño de 3 columnas con panel contextual.
- **Componente:** `AppShell4` (`@/components/dashboard/AppShellTaskList.tsx`).
- **Columnas:**
  - **Columna 1 (Filtros & Navegación):** Todas, Pendientes, En Progreso, En Revisión, Completadas, Búsqueda rápida y etiquetas.
  - **Columna 2 (Lista Central):** Feed de tareas con badges de puntos, tiempo estimado, avatar del asignado y estado.
  - **Columna 3 (Context Panel):** Panel lateral extensible que muestra la ficha detallada de la tarea seleccionada (descripción, checklist interactivo, timer persistente, botones de acción).

### Lane 4: Kanban 4 con Panel Lateral de Detalles (`task/lane-4-kanban`)
- **Propósito:** Ofrecer una visión ágil y táctil del flujo de tareas del hogar.
- **Componente:** `Kanban4` (`@/components/dashboard/KanbanBoard.tsx`).
- **Características:**
  - 4 Columnas de estado: ⏳ Pendientes, ⚡ En Progreso, 🔍 En Revisión, ✅ Completadas.
  - Tarjetas con diseño "Folio", indicador de urgencia, puntos e indicador de checklist.
  - Side panel de detalle sincronizado con las acciones de la tarjeta.
  - Selector de vista unificado en el Dashboard: Switch entre **Vista Lista (App Shell 4)** y **Vista Tablero (Kanban 4)**.

---

## 🔍 Criterios de Aceptación y Verificación

1. Compatibilidad total con Next.js 16 (Turbopack) y React 19.
2. Soporte íntegro de Modo Claro y Modo Oscuro (variables de color de `globals.css`).
3. Mantenimiento estricto de todas las reglas de negocio existentes (seguridad, validación de PIN, timer acumulado, asignación de puntos y streaks).
4. Verificación de compilación limpia sin errores de TypeScript.
