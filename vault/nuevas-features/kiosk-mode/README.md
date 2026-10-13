# Kiosk Mode / App Pinning

> Estado: **planificación** (2026-10-13). Sin lanes creadas todavía.

## 1. Pedido del usuario (textual)

> Empecemos la planificación de estas nuevas features:
>
> Marketplace (Para canjear alguna de las monedas de la app por premios fisicos reales)
> Homeschooling (Complejo, es casi una app nueva extra)
> Sonidos UI para recompensas y acciones en la APP
> Meal planner
> Temporizadores Visuales
> Idle State: Marco de Fotos Dinamico en pantalla principal donde aparecen las fotos de los usuarios para iniciar sesion
> Kiosk Mode / App Pinning
> Musica de fondo
>
> Anota todo esto en el vault en carpetas separadas.
>
> (Más la investigación pegada: [`../ref/investigacion-1-centros-de-comando.md`](../ref/investigacion-1-centros-de-comando.md) y [`../ref/investigacion-2-software-puro.md`](../ref/investigacion-2-software-puro.md).)

Línea que corresponde a esta feature: **«Kiosk Mode / App Pinning»**

## 2. Qué dice la investigación

- **Kiosk Mode / App Pinning avanzado** — inv. 1 §1: bloqueo a nivel de SO para que la tablet solo muestre la app; los niños no salen al Home ni abren YouTube. «Table stakes» y **Must-Have (MVP)**. Benchmark: DAKboard, Mango Display (wrappers Android/iOS).
- **Versión software puro** — inv. 2 (Quick Win RICE, «Dual-Interface»): como no hay hardware propio, hacerlo con PWA/Fullscreen API, botones grandes, deshabilitar click derecho y selección de texto para simular app nativa.
- **Riesgos técnicos** — inv. 2: arquitectura **offline-first** (guardar el «Plan del Día» en almacenamiento local y sincronizar al volver la red; si un niño marca «hecho» sin internet no puede perder su recompensa) y **notificaciones locales programadas** aunque la app esté cerrada.
- **Battery Health Mode** — inv. 1: ver `../idle-marco-fotos/`.

## 3. Qué se puede y qué no desde la web (límite técnico a tener presente)

- Se puede: PWA instalable en modo `display: fullscreen`/`standalone`, Fullscreen API (requiere gesto), Screen Wake Lock API, bloquear zoom/selección/menú contextual/arrastre, orientación fija, reconexión y reinicio automático, service worker para offline.
- **No se puede** desde el navegador: impedir salir al launcher ni bloquear otras apps. Eso lo hace el SO: *Screen Pinning* de Android, *Guided Access* / *Autonomous Single App Mode* de iOS, o una app contenedora (TWA/wrapper tipo Fully Kiosk Browser). Documentar el paso a paso de «cómo fijar la app» para los padres y, si hace falta, recomendar un wrapper.

## 4. Alcance propuesto (a validar)

1. PWA: manifest, íconos, fullscreen, service worker y cache offline del plan del día.
2. Modo kiosko activable por el admin (con PIN de padre para salir): oculta navegación peligrosa, bloquea gestos, mantiene pantalla encendida, recarga ante error o por inactividad larga.
3. Cola de acciones offline (marcar hecho) con sincronización y sin duplicar recompensas.
4. Guía en la app: «Fijar la app en Android/iOS».
5. Auto-refresco de versión (la pared siempre debe estar al día tras un deploy).

## 5. Preguntas abiertas

1. ¿Qué dispositivo de pared se usará (Android, iPad, mini-PC con navegador)? Define el método de bloqueo.
2. ¿Aceptan un wrapper (Fully Kiosk) o se mantiene solo PWA?
3. ¿Cuánto offline se necesita (solo marcar hechos o también ver todo)?
4. ¿Salida del modo kiosko solo con PIN de padre?
