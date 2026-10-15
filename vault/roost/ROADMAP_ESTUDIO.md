# Estudio — hoja de ruta de implementación

> Lane 165. Catálogo y criterio: [`CATALOGO_FEATURES_ESTUDIO.md`](CATALOGO_FEATURES_ESTUDIO.md). Bloqueos: [`../nuevas-features/homeschooling/BLOQUEOS.md`](../nuevas-features/homeschooling/BLOQUEOS.md).
> Cada flujo (M1, P1…) es una lane real: **el número se asigna al crearla** (el siguiente libre; otros agentes ocupan números). Se trabaja en worktree propio, se integra con `scripts/integrar.sh` y **no se limpia el worktree ni la rama** (pedido del usuario, 2026-10-16). Al terminar cada una: `vault/LANE_NNN_*.md` y tildar acá.

| Orden | Flujo | Entrega | Depende de | Estado |
|---|---|---|---|---|
| 1 | **M1** Material del día | Modelo `MaterialEstudio` (texto, markdown, enlace; detecta tipo), alta con «Pegá lo que tengas», adjunto a lección o a día | — | HECHO · lane 166 |
| 2 | **M2** Visor por tipo | Visor de markdown, PDF, Docs/Drive, video, ePub y web dentro del visor del día | M1 | HECHO · lane 167 |
| 3 | **P1** Imprimir tarea | Botón «Imprimir» del hijo, vista de impresión, límite (2 por defecto) en servidor, registro, extra del padre | M1 | HECHO · lane 168 (+ hoja del día, P3, lane 178) |
| 4 | **M3** Carga masiva y plantillas | Pegar N enlaces → N lecciones, duplicar curso, exportar/importar JSON, autoguardado | M1 | HECHO · lane 170 (falta autoguardado en «Agregar material») |
| 5 | **S1** Barra superior y buscador | Cabecera con sidebar, migas, atrás/adelante, buscador y ⌘K en Estudio | — | HECHO · lane 169 (falta buscador propio en listas largas) |
| 6 | **V1** Visor y «Hoy» world-class | Modo foco, teclado, reanudar, siguiente paso claro | M2 | pendiente |
| 7 | **R1** Reprogramar en 1 clic | Arrastrar lo atrasado a los próximos días, con exclusiones | — | HECHO · lane 171 («Ponerse al día»; falta «compromisos fijos») |
| 8 | **K1** Corrección con nota | Nota y comentario del padre, revisión en lote, libreta por hijo y materia | — | HECHO · lane 172 (falta nota desde Revisión, revisión en lote, clave de respuestas) |
| 9 | **K2** Boletín y períodos | Períodos, boletín imprimible, asistencia y horas imprimibles | K1 | pendiente |
| 10 | **Q1** Comentarios y reacciones | Entre integrantes de la familia, en lección, material y evidencia | — | HECHO · lane 174 (falta en el visor de material) |
| 11 | **Q2/Q3** Muro, avisos y notificaciones | Logros familiares, avisos de los padres, centro de notificaciones | Q1 | PARCIAL · Q3 (avisos y campana) hecho en lane 174; falta Q2 (muro) |
| 12 | **R2/R3/R4** Calendario y multi-hijo | Colores, arrastrar, plan para varios hijos, asistente del año, `.ics` | — | PARCIAL · R4 (`.ics`) hecho en lane 179; faltan R2 y R3 |
| 13 | **L1/L2/L3** Lectura y vida católica | Registro y lista de lectura, memorización, biblioteca de planes católicos, año litúrgico | M3 | HECHO · L1 lane 175, L2 lane 176, L3 lane 177 (falta el año litúrgico en el calendario del plan) |
| 14 | **B5/D10/K3** Checklist semanal, resumen semanal y portafolio imprimible | | P1, K1 | PARCIAL · B5 (hoja semanal) hecho en lane 173; faltan D10 y K3 |
| 15 | **V2/V3** Quiz, vacíos, accesibilidad | | V1 | pendiente |

Reglas de las lanes (de `AGENTS.md` y del pedido):
- Next 16: leer la doc local (`node_modules/next/dist/docs/`) antes de codear. Componentes de `src/components/ui/`; no duplicar. Prohibido `prisma db push`: SQL aditivo con `migrate diff` + `db execute` solo si no tiene `DROP`.
- Cambio de esquema solo aditivo. Si el SQL no se puede aplicar, se documenta en `BLOQUEOS.md` y la lane sigue con lo que no necesita la tabla.
- Cada pantalla de Estudio lleva la cabecera común (`CabeceraEstudio`: sidebar, migas, navegación y buscador cuando la página lo pide).
- Pantalla mínima: lo que se pueda resolver con una hoja impresa y un cuaderno se resuelve así.


_Actualizado en la lane 180 (2026-10-16). Lanes de código entregadas: 166 a 179 (ver `vault/LANE_NNN_*.md`)._
