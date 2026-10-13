# Nuevas features — planificación (2026-10-13)

Pedido del usuario (textual): *«Empecemos la planificación de estas nuevas features: Marketplace (Para canjear alguna de las monedas de la app por premios fisicos reales) · Homeschooling (Complejo, es casi una app nueva extra) · Sonidos UI para recompensas y acciones en la APP · Meal planner · Temporizadores Visuales · Idle State: Marco de Fotos Dinamico en pantalla principal donde aparecen las fotos de los usuarios para iniciar sesion · Kiosk Mode / App Pinning · Musica de fondo. Anota todo esto en el vault en carpetas separadas.»*

Investigación de mercado pegada por el usuario, guardada sin cambios en [`ref/`](ref/):
- [`ref/investigacion-1-centros-de-comando.md`](ref/investigacion-1-centros-de-comando.md)
- [`ref/investigacion-2-software-puro.md`](ref/investigacion-2-software-puro.md)

| Carpeta | Prioridad según la investigación | Tamaño estimado | Depende de |
|---|---|---|---|
| [`kiosk-mode/`](kiosk-mode/README.md) | Must-Have | M | — |
| [`sonidos-ui/`](sonidos-ui/README.md) | Must-Have (sonidos de recompensa) | S–M | — (base de audio) |
| [`idle-marco-fotos/`](idle-marco-fotos/README.md) | Should-Have | M | kiosk (wake lock), login por PIN existente |
| [`temporizadores-visuales/`](temporizadores-visuales/README.md) | Should-Have | S–M | sonidos (aviso) |
| [`marketplace/`](marketplace/README.md) | Should-Have | M | economía y flujo de `Recompensa` existentes |
| [`meal-planner/`](meal-planner/README.md) | Could-Have (e-commerce) | M | — |
| [`musica-fondo/`](musica-fondo/README.md) | Won't-Have como reproductor propio | S–M | motor de audio de sonidos |
| [`homeschooling/`](homeschooling/README.md) | Could-Have («océano azul») | XL (varias lanes) | hábitos/libros, evidencia |

Orden sugerido (a confirmar): 1) sonidos + base de audio → 2) kiosk/PWA → 3) idle con marco de fotos → 4) temporizadores → 5) marketplace → 6) música → 7) meal planner → 8) homeschooling por fases.

Hallazgos transversales de la investigación que no son una carpeta propia pero conviene no perder: **offline-first** para marcar tareas, **notificaciones locales programadas**, **Battery Health Mode** (apagar/atenuar de madrugada), rachas y tarjetas por perfil (ya existen en parte). Quedaron fuera de lo pedido: sincronización de calendarios, pizarra de notas, domótica, intercomunicador, RPG con pérdida de HP.

Cada carpeta tiene: pedido textual, lo que dice la investigación, lo que ya existe en el repo, propuesta y **preguntas abiertas** para decidir antes de crear lanes.
