# Nuevas features — planificación (2026-10-13)

Pedido del usuario (textual): *«Empecemos la planificación de estas nuevas features: Marketplace (Para canjear alguna de las monedas de la app por premios fisicos reales) · Homeschooling (Complejo, es casi una app nueva extra) · Sonidos UI para recompensas y acciones en la APP · Meal planner · Temporizadores Visuales · Idle State: Marco de Fotos Dinamico en pantalla principal donde aparecen las fotos de los usuarios para iniciar sesion · Kiosk Mode / App Pinning · Musica de fondo. Anota todo esto en el vault en carpetas separadas.»*

Investigación de mercado pegada por el usuario, guardada sin cambios en [`ref/`](ref/):
- [`ref/investigacion-1-centros-de-comando.md`](ref/investigacion-1-centros-de-comando.md)
- [`ref/investigacion-2-software-puro.md`](ref/investigacion-2-software-puro.md)

| Carpeta | Prioridad según la investigación | Tamaño estimado | Depende de |
|---|---|---|---|
| [`kiosk-mode/`](kiosk-mode/SPEC.md) | **Pospuesto a la APP** (D6) | — | — |
| [`sonidos-ui/`](sonidos-ui/SPEC.md) | Must-Have (sonidos de recompensa) | S–M | — (base de audio) |
| [`idle-marco-fotos/`](idle-marco-fotos/SPEC.md) | **Pedido firme**: reposo v2 con **Unsplash + frases** (Vulgata/Torres Amat, Catecismo de San Pío X) + título litúrgico del día (ronda 9; Google Fotos descartado) | M | inactividad (N4), liturgia (L2) para el título |
| [`liturgia/`](liturgia/SPEC.md) | **Pedido firme**: motor Divinum Officium (1570/1888/1906) → Calendarium, Breviarium, Missale, Proprium, Ordinarium, Psalterium, Rosarium | XL (L1–L9) | Perl fuera de línea (generador) |
| [`sesion-inactividad-borradores/`](sesion-inactividad-borradores/SPEC.md) | **Pedido firme**: 15 s login / 60 s sesión + borradores | M–L | — |
| [`temporizadores-visuales/`](temporizadores-visuales/SPEC.md) | Should-Have | S–M | sonidos (aviso) |
| [`marketplace/`](marketplace/SPEC.md) | Should-Have | M | economía y flujo de `Recompensa` existentes |
| [`meal-planner/`](meal-planner/SPEC.md) | Could-Have (e-commerce) | M | — |
| [`musica-fondo/`](musica-fondo/SPEC.md) | Won't-Have como reproductor propio | S–M | motor de audio de sonidos |
| [`homeschooling/`](homeschooling/SPEC.md) (lanes H1..H6: [`LANES_HOMESCHOOLING.md`](lanes/LANES_HOMESCHOOLING.md)) | Could-Have («océano azul») | XL (varias lanes) | hábitos/libros, evidencia |

Orden sugerido (a confirmar): 1) sonidos + base de audio → 2) kiosk/PWA → 3) idle con marco de fotos → 4) temporizadores → 5) marketplace → 6) música → 7) meal planner → 8) homeschooling por fases.

Hallazgos transversales de la investigación que no son una carpeta propia pero conviene no perder: **offline-first** para marcar tareas, **notificaciones locales programadas**, **Battery Health Mode** (apagar/atenuar de madrugada), rachas y tarjetas por perfil (ya existen en parte). Quedaron fuera de lo pedido: sincronización de calendarios, pizarra de notas, domótica, intercomunicador, RPG con pérdida de HP.

**Ronda 2 (2026-10-13):** decisiones del usuario en [`DECISIONES.md`](DECISIONES.md); plan de lanes en [`lanes/LANES.md`](lanes/LANES.md); prompt común en [`lanes/PROMPT_GENERAL_AGY.md`](lanes/PROMPT_GENERAL_AGY.md). Cada carpeta tiene un `SPEC.md` listo para implementar (el `README.md` queda como contexto de la ronda 1).

Cada carpeta tiene (ronda 1): pedido textual, lo que dice la investigación, lo que ya existe en el repo, propuesta y **preguntas abiertas** para decidir antes de crear lanes.

**Ronda 9 (2026-10-14, lane 122):** reposo v2 con Unsplash y frases, y nueva carpeta [`liturgia/`](liturgia/README.md) (motor Divinum Officium). Pedido textual y decisiones D34–D53 en [`DECISIONES.md`](DECISIONES.md) §10; lanes R1–R3 y L1–L9 en [`lanes/LANES.md`](lanes/LANES.md).
