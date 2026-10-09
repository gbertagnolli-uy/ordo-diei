# Rediseño UI v3 — Componentes prearmados, cero duplicados, mismo comportamiento

> Sigue a [[REDISENO_UI_V2]]. Pedido (2026-10-09): **solo UI**, nivel profesional; todo con componentes prearmados (shadcn/ui, React Bits, Aceternity, MagicUI…); **ningún elemento duplicado**; **no cambiar funciones**: todo debe comportarse como en el original (`96e851b`).

Rama base: `dev` · Sin PR a `main`.

---

## 1. Elementos duplicados en v2

| Elemento | Dónde aparece | Queda en |
|---|---|---|
| Marca "OD · Ordo Diei" | TopBar + cabecera de la barra lateral | Barra lateral |
| Usuario (avatar, nivel) | TopBar + pie de la barra lateral | Pie de la barra lateral (menú de usuario) |
| Estado de ánimo | Avatar del TopBar + botón del Dock | Menú de usuario |
| Nueva tarea | Dock + botón en la barra de filtros | Dock |
| Inicio | Dock + secciones de la barra lateral | Barra lateral |
| Barra de progreso | TopBar (nivel) + barra lateral (diario) | Ambas son métricas distintas → las dos van al menú de usuario, una sola vez |

Resultado: se elimina el TopBar. La **barra lateral (shadcn Sidebar)** pasa al layout y está en todas las páginas de `/dashboard`; el **Dock (Aceternity)** queda solo con páginas y acciones globales.

## 2. Funciones que v2 alteró y se restauran

Referencia: `git show 96e851b:src/components/dashboard/MyTasksBoard.tsx` y `UserCalendarTable.tsx`.

| # | Original | v2 | v3 |
|---|---|---|---|
| 1 | Pendiente = todo estado ≠ Completada/Aprobada/Esperando_Aprobacion (incluye Vencida, Expirada, No_Realizada, Rechazada), con acciones | Expirada/No_Realizada archivadas sin acciones | Como el original. "En curso" se mantiene solo como filtro visual de pendientes con timer |
| 2 | Orden: con hora primero (asc), luego con fecha (asc), luego sin fecha | Orden por fecha combinada | Como el original |
| 3 | Urgente si vence en < 2 h o ya venció (borde de alerta) | Solo "Atrasada" si venció | Como el original (badge "Urgente") |
| 4 | Progreso diario siempre visible (100 % si no hay tareas) | Oculto si no hay tareas | Como el original |
| 5 | Saludo según la hora | Eliminado | Restaurado en la cabecera |
| 6 | Hijos: "Mi Agenda de Misiones" (react-big-calendar mes/semana/agenda + tabla) | Eliminada | Restaurada como vista "Calendario", solo para hijos |
| 7 | Reloj con segundos | Sin segundos | Con segundos |
| 8 | Confirmación "¿No la hiciste?" con imagen `cross-animate.svg` | Sin imagen | Con imagen |

Se mantienen (no son cambios de función): el confeti único y la eliminación del modal LEVEL_UP duplicado, y no enviar `PIN_Secreto` al cliente.

## 3. Componentes

| Uso | Componente |
|---|---|
| Layout, navegación y menú de usuario | shadcn `sidebar` (patrón sidebar-07: colapsable a íconos), `dropdown-menu`, `avatar`, `progress`, `breadcrumb`, `separator`, `tooltip` |
| Lista de tareas | shadcn `table`, `badge`, `toggle-group`, `button`, `empty` |
| Panel de contexto | shadcn `calendar` (react-day-picker), `scroll-area`, `card`; en móvil `sheet` |
| Tablero | shadcn `card`, `badge`, `avatar`, `scroll-area` |
| Calendario de hijos | `react-big-calendar` (ya instalado, el del original) con estilos del tema |
| Modales | `Modal` reimplementado sobre shadcn `dialog`, misma API (`isOpen/onClose/title/width`) |
| Navegación global | Aceternity Floating Dock (ya instalado) |
| Celebración | MagicUI Confetti (ya instalado) |

Tipografía: UI en sans (Geist) y títulos en Newsreader, con la paleta "The Noble Manuscript" mapeada a los tokens de shadcn (`--background`, `--primary`, `--sidebar-*`…), en modo claro y oscuro.

## 4. Lanes

- [x] **Lane 9 · `task/lane-9-behavior-parity`** — restaurar §2 sobre el código actual.
- [x] **Lane 10 · `task/lane-10-shadcn-foundation`** — `shadcn init`, tokens del tema, fuentes, componentes de §3, `Modal` sobre `dialog`.
- [x] **Lane 11 · `task/lane-11-sidebar-layout`** — `AppSidebar` en el layout (marca, secciones con contadores, menú de usuario); se elimina el TopBar; Dock sin duplicados.
- [x] **Lane 12 · `task/lane-12-shell-shadcn`** — lista, panel, tablero y calendario de hijos con shadcn.
- [ ] **Lane 13 · `task/lane-13-login`** — pantalla de ingreso (selector de usuario, teclado de PIN, primer uso) con shadcn.
- [ ] **Lane 14 · `task/lane-14-views-modals`** — Historial, Jerarquía familiar, Ranking, ánimo, checklist y popups del ModalManager.
- [ ] **Lane 15 · `task/lane-15-admin`** — Agenda master (revisión de padres) y Premios.
- [ ] **Lane 16 · `task/lane-16-forms`** — formularios de nueva tarea, nuevo miembro y reglas con shadcn `field`/`input`/`select`/`switch`/`textarea`.

## 5. Criterios de aceptación

1. Ningún elemento de §1 aparece dos veces.
2. Cada fila de §2 se comporta como el original.
3. Ningún componente de UI hecho a mano donde exista uno prearmado.
4. Claro y oscuro, escritorio y móvil, sin errores de consola; `tsc` y `next build` pasan.

## 6. Registro

| Lane | Merge | Notas |
|---|---|---|
| 9 | `30ef122` | |
| 10 | `40f5e11` | El CLI pisó `--primary/--secondary` con grises e importó `cn` desde un paquete npm: corregido. |
| 11 | `5406e85` | |
| 12 | `902559c` | |
| 13 | | |
| 14 | | |
| 15 | | |
| 16 | | |
