# Kiosk Mode / App Pinning — Estado: POSPUESTO

Decisión D6 (2026-10-13): *«Modo Kiosko lo dejamos para cuando hagamos la APP.»*

## Qué queda hecho como preparación (sin esfuerzo extra)
- La pantalla de reposo + cierre por inactividad (`../idle-marco-fotos/SPEC.md`, `../sesion-inactividad-borradores/SPEC.md`) ya cubren el comportamiento de «pantalla de pared» sin bloquear el dispositivo.
- Tiempos configurables en `ConfigReposo` (15 s / 60 s) para adaptarlos a una tablet fija.

## Para la APP (cuando llegue el momento)
Contenido del README (§2–§5) sigue vigente: contenedor nativo (Android *screen pinning* / iOS *Guided Access* o TWA/Capacitor), `Wake Lock`, modo offline con cola de acciones, notificaciones locales y *Battery Health Mode* (apagado nocturno, burn-in).
Requisitos que la web de hoy debe **no romper**: acciones idempotentes (para colas offline), reposo sin dependencias del navegador de escritorio, rutas `/` y `/dashboard` sin supuestos de ventana.
