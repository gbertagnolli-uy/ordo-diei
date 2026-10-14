# Lane 138 · N4 — Detector de inactividad (hook y pruebas)

**Rama** `task/lane-138-n4-inactividad` · **Fecha** 2026-10-14 · **Estado** integrada. Se hizo como prerrequisito de R3 (`PROMPT_REPOSO_LITURGIA.md` §3: «Requiere N4… si sigue sin estar, hacelo como lane propia»).

## Pedido
`LANES.md` N4 / `sesion-inactividad-borradores/SPEC.md` §2: `useInactividad`, `lib/actividad.ts`, `useMantenerActivo`, canal entre pestañas, reloj inyectable para tests. **Sin cambios visibles.**

## Qué se hizo
- `src/lib/actividad.ts` (núcleo puro, sin DOM): `crearMonitorInactividad` (umbral, aviso previo, estados `corriendo/avisado/suspendido/vencido/detenido`, `revisar()` al volver de una suspensión, `reiniciar()`), registro global de **exenciones** (`mantenerActivo(motivo)`), filtros de eventos (`esMovimientoReal` ≥ 4 px, limitador de 500 ms), constantes `EVENTOS_ACTIVIDAD`, y el canal entre pestañas (`BroadcastChannel("ordo-actividad")` + `localStorage.ultimaActividad` de respaldo; al vencer una pestaña avisa «cerrar» a las demás).
- `src/hooks/useInactividad.ts`: `useInactividad({umbralMs, avisoMs, alVencer, alAvisar, habilitado, entrePestanas})` → `{estado, reiniciar, restanteMs}` y `useMantenerActivo(motivo, activo)`.
- `src/lib/actividad.test.ts` (10 pruebas con reloj falso): vence a los 60 s (15 s en login) y una sola vez, la actividad reinicia, aviso a los 50 s que se cancela con actividad, exenciones (un video largo no cierra; al liberar la cuenta arranca de cero), `revisar` con temporizadores congelados, dos pestañas, filtros.

## Decisiones
- El monitor **no** cierra sesión ni muestra nada: eso es N6 (`GuardiaInactividad`) y R3.
- La exención es global (un registro por módulo) para que cualquier componente la use sin conocer al monitor.
- El umbral del puntero se mide contra el último movimiento **contado**, no contra el último evento (si no, un arrastre lento nunca contaría).

## Cómo verificar
`npm test` (`src/lib/actividad.test.ts`) · `npx tsc --noEmit`. No hay nada que ver en el navegador todavía.

## Pendientes
- **Sin verificar en navegador**: eventos reales, `BroadcastChannel` entre dos pestañas, `visibilitychange`/`pageshow` y el respaldo por `localStorage` (cubiertos solo con un bus y un reloj simulados).
- La sesión deslizante de 5 min del servidor (S3, `POST /api/auth/ping`) **no** está: es parte de N6.
