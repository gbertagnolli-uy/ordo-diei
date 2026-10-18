# Lane 243: Racha de la app en el perfil, premio diario por ingresar (+5 XP y +5 puntos) y modal automático de bienvenida con el compañero

Rama `task/lane-243-racha-app-bienvenida-diaria` · worktree `../ordo-diei-lanes/lane-243` · base `dev`.

## 1. Pedido del usuario (textual)

> Revisá si se está mostrando RachaApp, porque me parece que solo aparece la racha de tareas.
> Está bueno que se premie con 5 XP y 5 puntos cada primera vez en el día que ingrese el usuario.
> Ese modal de premio debería ser automático al entrar, una sola vez por día.
> Debe registrarse en el perfil del usuario.
>
> El usuario debe ingresar a la app, su compañero lo saluda y lo felicita por haber vuelto y enseguida se le muestran los premios por haber ingresado.

## 2. Diagnóstico previo

1. **Dónde se mostraba `RachaApp`:**
   - En `PerfilResumen.tsx` (`/dashboard/perfil` y modal `USER_STATS`), `NavUser.tsx`, `LeaderboardModal.tsx` y `FamilyTree.tsx` únicamente se mostraba `usuario.streakDays` (la racha de tareas completadas).
   - `RachaApp` (`rachaDe`) solo aparecía como un badge secundario en `CompaneroCard.tsx` y `CompaneroView.tsx` cuando `racha > 1` (en el día 1 ni siquiera se veía) y en «Tu parte de hoy» de los padres. No estaba registrada ni visible en el perfil del usuario.
2. **Ingreso diario (`registrarIngreso`):**
   - Creaba la fila en `ActividadDia` y evaluaba hitos (3, 7, 14, 30… días), pero no otorgaba recompensa diaria por el ingreso de cada día ni mostraba un modal de bienvenida.

## 3. Diseño e implementación

1. **Premio diario por primer ingreso (`src/lib/engagement/servidor.ts`):**
   - `PUNTOS_INGRESO_DIARIO = 5` y `XP_INGRESO_DIARIO = 5`.
   - En `registrarIngreso(usuarioId, ahora)`, cuando se inserta por primera vez la fila de `ActividadDia` del día (`usuarioId_fecha`), se acreditan atómicamente `+5` en `availablePoints` y `+5` en `experienciaHabitos` (sumando exactamente +5 puntos disponibles y +5 XP en `xpTotal`).
   - Se expone `bienvenidaDeHoy(usuarioId, ahora)` y `marcarBienvenidaVista(usuarioId, ahora)` usando la clave `"bienvenida_vista"` dentro del arreglo JSON `ActividadDia.misiones` (sin requerir cambios destructivos ni migración de esquema, y 100 % compatible con `parteDeHoy`).
2. **Modal automático de Bienvenida Diaria (`ModalManager.tsx`, `DashboardLayout`, `POST /api/companero`):**
   - Al entrar al dashboard, si el ingreso de hoy aún no tiene `"bienvenida_vista"`, el layout pasa los datos de `bienvenidaHoy` al `ModalManager`.
   - Se abre automáticamente una sola vez por día (`DAILY_WELCOME`), respaldado por `localStorage` (`bienvenida_vista_${usuarioId}_${fecha}`) y confirmando `{ accion: "bienvenida" }` en `POST /api/companero`.
   - En el modal: primero aparece **el compañero** del usuario en pose de bienvenida/felicitación saludándolo por su nombre y felicitándolo por haber vuelto hoy (con su badge de `Racha en la app`), y **enseguida** se revelan los premios por haber ingresado hoy (**+5 XP** y **+5 Puntos**, más el aviso si desbloqueó un cofre de hito de racha).
3. **Registro y visualización de `RachaApp` en el Perfil y la UI (`PerfilResumen.tsx`, `PerfilView.tsx`, `/dashboard/perfil/page.tsx`, `NavUser.tsx`, `CompaneroCard.tsx`, `CompaneroView.tsx`):**
   - En `PerfilResumen.tsx` se distingue claramente **Racha de tareas** (`streakDays`) y **Racha en la app** (`RachaApp.dias`), y se incorpora el bloque de registro de **Presencia y racha en la app** (racha actual en la app, días totales ingresados, estado del premio diario de hoy `+5 XP / +5 pts`, disponibilidad del comodín semanal y próximo hito).
   - Se incluye `rachaApp` y `diasIngreso` tanto en `/dashboard/perfil` como en los usuarios cargados en `DashboardLayout` (para el modal `USER_STATS` y `NavUser`), y se habilita un endpoint/datos en `/api/companero` o `PerfilResumen` para que siempre esté disponible.
   - En `CompaneroCard.tsx` y `CompaneroView.tsx` el badge de racha en la app se muestra desde el día 1 (`racha >= 1`).
