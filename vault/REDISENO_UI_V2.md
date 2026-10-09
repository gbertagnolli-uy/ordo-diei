# Rediseño UI v2 — Reemplazo real del diseño

> Corrige el rediseño v1 ([[PLAN_REDISENO_UI]], lanes 1–4). En v1 los componentes se **agregaron encima** del diseño viejo en lugar de **reemplazarlo**. Esta v2 deja una sola UI: la nueva.

Fecha: 2026-10-09 · Rama base: `dev` · Sin PR a `main`.

---

## 1. Diagnóstico de v1 (qué quedó mal)

| Lane v1 | Problema |
|---|---|
| 1 · Floating Dock | El Dock se montó **solo** en `/dashboard`. El Header viejo perdió sus botones, y como `/dashboard/admin` y `/dashboard/premios` siguen usando solo el Header, **quedaron sin navegación**. Dock y Header **duplican** tema, ranking, ánimo y salir. `floating-dock.tsx` importa `Link` desde `next/navigation` (incorrecto). |
| 2 · Confetti | Al completar una tarea se dispara **dos veces**: `canvas-confetti` global (ModalManager) + el `<Confetti>` de MagicUI incrustado dentro del modal. Quedó `ConfettiDemo.tsx` sin uso y un re-export duplicado en `components/ui/confetti.tsx`. |
| 3 · App Shell 4 | No es el bloque de React Bits Pro (requiere licencia, nunca se instaló: no hay `components.json`). Es una imitación de 787 líneas **embebida dentro** de `MyTasksBoard`, que conserva su encabezado, barra de progreso, banner, secciones "En revisión"/"Completadas" y la vista vieja "Cuadrícula". Debajo siguen la tarjeta de ánimo, `UserCalendarTable` y la "Jerarquía Familiar". |
| 4 · Kanban 4 | Igual: imitación embebida como una pestaña más del mismo selector. |

## 2. Componentes de referencia

| Componente | Fuente | Cómo se usa en v2 |
|---|---|---|
| App Shell 4 — *Three columns with a context panel* | React Bits Pro (`@reactbits-pro/app-shell-4`) | **Sin licencia** → réplica fiel de la estructura del HTML del preview (ver §4). |
| Kanban 4 — *Board with a card detail side panel* | React Bits Pro (`@reactbits-pro/kanban-4`) | **Sin licencia ni HTML** → construido con el mismo lenguaje visual del App Shell 4. |
| Floating Dock | Aceternity (`@aceternity/floating-dock`) | Ya instalado en `src/components/ui/floating-dock.tsx`. Pasa a ser la **única** navegación global. |
| Confetti | MagicUI (`@/registry/magicui/confetti`) | Ya instalado. Pasa a ser el **único** mecanismo de confeti. |

Si más adelante se consigue la licencia de React Bits Pro: configurar el registry en `components.json` con la key en `.env` y cambiar la réplica por el bloque oficial; la API interna (`TaskShell`, `TaskDetailPanel`) queda igual.

## 3. Arquitectura objetivo

```
/dashboard/layout.tsx  (server: sesión + usuarios)
 ├── TopBar        marca · reloj · nivel/racha · avatar(ánimo)      ← reemplaza Header
 ├── MainDock      única navegación global (todas las páginas)       ← Aceternity
 ├── ModalManager  + <Confetti> global único                         ← MagicUI
 └── {children}
       /dashboard            → TaskShell (App Shell 4)
       │   ├── sidebar   vistas de tareas con contadores · historial · familia · usuario
       │   ├── main      header(breadcrumb, Lista|Tablero, panel) · filtros · tabla/tarjetas | Kanban
       │   └── context   Agenda (mini calendario + "Próximas")  ⇄  Detalle de tarea
       /dashboard/admin, premios, rules, tasks/new, users/new  → solo contenido
```

Se **eliminan**: `Header.tsx`, `MyTasksBoard.tsx` (grid + TaskCard), `AppShellTaskList.tsx`, `KanbanBoard.tsx`, `UserCalendarTable.tsx` (reemplazado por el panel Agenda), `ConfettiDemo.tsx`, `components/ui/confetti.tsx`.

La lógica de negocio de `TaskCard` (timer persistente, completar, no realizada, checklist) se extrae a un hook `useTaskActions` que usan la tabla, el kanban y el panel de detalle. Las rutas de API no cambian.

## 4. Mapeo App Shell 4 → Ordo Diei

| Preview (Northline) | Ordo Diei |
|---|---|
| Marca "N · Northline / City desk" | "OD · Ordo Diei / Familia" |
| Grupo *Editorial* (Story queue 16, Assignments 6…) | **Mis tareas**: Pendientes · En curso · En revisión · Completadas (con contadores) |
| Grupo *Desks* | **Hogar**: Historial · Jerarquía familiar |
| *Saved views* (Late stories 2) | **Atajos**: Vencen hoy · Atrasadas (con contadores) |
| Footer usuario "MO · Managing editor" | Avatar + nombre + "Nivel N · rol" |
| Header: menú móvil · breadcrumb · toggle panel | Igual + selector **Lista / Tablero** |
| Filtros segmentados + "New story" | Todas · Con puntos · Checklist + **Nueva tarea** (solo padres) |
| Tabla Story/Owner/Status/Publishes + lista `dl` en móvil | Tarea / Tiempo / Estado / Vence + Puntos; tarjetas en móvil |
| Panel *Schedule*: calendario del mes + "Up next" | Panel **Agenda**: calendario con puntos en días con vencimientos + "Próximas" |
| — | Al seleccionar una tarea el panel muestra su **detalle y acciones** |

## 5. Lanes y ramas

Secuenciales; cada una se mergea a `dev` al terminar (`--no-ff`) y la siguiente sale de `dev` actualizado.

- [x] **Lane 5 · `task/lane-5-app-chrome-dock`** — `dashboard/layout.tsx` compartido; `TopBar` reemplaza a `Header` sin duplicados; Dock en todas las páginas del dashboard; fix import de `floating-dock`; páginas sin Header/ModalManager propios.
- [x] **Lane 6 · `task/lane-6-confetti-unify`** — un solo `<Confetti manualstart>` global disparado por ref en éxito de tarea, subida de nivel y premio sorpresa; quitar llamadas directas a `canvas-confetti`, `ConfettiDemo` y el re-export.
- [x] **Lane 7 · `task/lane-7-app-shell-4`** — `TaskShell` (réplica App Shell 4) + `useTaskActions` + `TaskDetailPanel` + `SchedulePanel`; reemplaza `MyTasksBoard`, `AppShellTaskList`, `UserCalendarTable`, tarjeta de ánimo; historial y familia como vistas del shell.
- [x] **Lane 8 · `task/lane-8-kanban-4`** — vista Tablero dentro del shell con detalle en el panel lateral; elimina `KanbanBoard.tsx`.

## 6. Criterios de aceptación

1. No queda ningún componente de la UI vieja renderizado en paralelo con su reemplazo.
2. Todas las páginas de `/dashboard/*` tienen el Dock y el TopBar.
3. Reglas de negocio intactas: timer persistente, completar/no realizada, checklist, aprobación, puntos, rachas, happy hour, premios.
4. Modo claro/oscuro con los tokens de `globals.css` ("The Noble Manuscript").
5. Responsive: sidebar y panel colapsan en móvil (como el preview).
6. `tsc --noEmit` y `next build` sin errores; app verificada en el navegador.

## 7. Registro

| Lane | Commit merge | Notas |
|---|---|---|
| 5 | `fd760a3` | Layout compartido. También: NoticeBar dentro del flujo (tapaba contenido) y usuarios sin `PIN_Secreto`. |
| 6 | `d9333f6` | Además se eliminó un `LEVEL_UP` duplicado que abría dos modales. |
| 7 | `2240d82` | "Historial" sale del Dock (vive en la barra lateral). Las tareas Expirada/No_Realizada pasan a "No realizadas" (antes reaparecían como pendientes). El dashboard ya no envía `PIN_Secreto` al cliente. |
| 8 | `343b4c3` | Sin drag & drop: los cambios de estado pasan por timer/confirmación/aprobación, así que se hacen desde el panel de detalle. Fix: ícono activo del Dock invisible. |

### Pendiente / fuera de alcance
- Si se consigue licencia de React Bits Pro: instalar los bloques oficiales (§2).
- Las páginas internas (admin, premios, reglas, nueva tarea, nuevo miembro) tienen Dock y TopBar, pero su contenido conserva el diseño anterior.
- `dev.log` está versionado en git; conviene sacarlo del repo y agregarlo a `.gitignore`.
