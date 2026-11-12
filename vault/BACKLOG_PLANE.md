# Backlog de Plane → lanes

Fuente: proyecto Plane `evox / d43d72bc-cabb-48d7-a473-51a46ad07935`, estado **Backlog**, leído por API el 2026-11-06 (21 ítems; «Ideas» (#27) queda fuera por pedido de Gabriel → 20 lanes).
Re-verificado por API el 2026-11-07 (orquestador): 33 ítems en el proyecto, 21 en Backlog, los mismos números (#5, #10, #11, #17–#27, #29–#35); sin ítems nuevos.
Lo mantiene **el orquestador** (no lo editan los agentes de cada lane: ellos registran en su propio `LANE_NN_*.md`, ver `vault/README.md`).

## Decisiones generales (Gabriel, 2026-11-06)

- **D-BP1 · Una lane por ítem del Backlog** (salvo «Ideas»). Número reservado 257–276; la 256 es la de planificación (este vault + AGENTS.md).
- **D-BP2 · Licencias: no frenan el trabajo.** «No te preocupes por las licencias, eso lo veo yo mismo después. Cloná lo que sea necesario, sin importar la licencia.» → Se clona y se migra código de OpenCircle (AGPL-3.0), BookOrbit (AGPL-3.0 + términos adicionales), Daily You (GPL-3.0), StoryPad (GPL-3.0) y dovli (MIT). La revisión legal queda **pendiente de Gabriel** (no la hace ningún agente).
- **D-BP3 · Trazabilidad del código migrado** (precedente: Roost, `THIRD_PARTY_NOTICES.md`): cada repo se copia tal cual en `vendor/<repo>/` con `ORIGEN.md` (URL + commit); cada archivo portado a `src/` lleva la cabecera `// Portado de vendor/<repo>/<ruta> (<owner>/<repo>@<commit7>)`; se suma su entrada en `THIRD_PARTY_NOTICES.md`.
- **D-BP4 · La base la toca solo el orquestador.** Los agentes (agy incluido) editan `prisma/schema.prisma` si su microtarea lo dice, pero **nunca** corren `prisma db push`, `migrate`, `db execute` ni escriben datos de producción. El SQL lo genera y aplica el orquestador según AGENTS.md regla 7.
- **D-BP5 · Lanes con archivos en común se serializan** (ver «Olas»). Nunca dos lanes abiertas a la vez tocando el mismo archivo.
- **D-BP6 · Vault global, fuera de git** (Gabriel: «el vault debe ser global sin importar la lane, porque los worktrees se limpian después y la idea es que el vault sea la fuente única de conocimiento sobre el proyecto, por eso debe ir en la raíz»). Vive en `18_OrdoDiei/vault/`, al lado del repo y de los worktrees; se escribe directo, no se commitea. Se eligió la raíz del proyecto y no `ordo-diei/vault/` porque AGENTS.md regla 1 exige que el directorio principal sea un espejo limpio de `origin/dev` (`nueva-lane.sh` aborta si tiene cambios). La lane 256 saca `vault/` del repo (`.gitignore`) y mueve a `scripts/reposo/ref/` los dos insumos que leía `generar-frases.ts`. La historia anterior del vault queda en git (`git log -- vault/`).
- **D-BP7 · Lane 277 de infraestructura (orquestador, 2026-11-07).** Hoy los archivos se guardan dentro de Postgres con tope de 4 MB (`src/lib/archivos.ts`; Vercel corta en 4,5 MB). Libros, audiolibros (270) y videos (276) no entran. Se agrega la lane 277 «Archivos grandes» (subida directa a almacenamiento de objetos con URLs firmadas). **Bloqueada hasta que Gabriel decida** proveedor (propuesta: Supabase Storage), clave de servicio, topes y costo (ver `LANE_277_ARCHIVOS_GRANDES.md`).
- **D-BP8 · Specs (orquestador, 2026-11-07).** Las lanes chicas y medianas tienen todas sus microtareas con código exacto. Las de migración (270, 271, 276) y la interfaz del diario (272 M6) tienen exactas las fases de datos, reglas, servidor y API; el front se porta archivo por archivo con la «Receta de port» (`PROTOCOLO_AGY.md`), cuyas tablas de imports y textos escribe el orquestador al empezar esa fase (dependen de las dependencias instaladas y de la fase anterior).

## Mapa

| Lane | Plane | Título | Tipo | Ola | Serializa con |
|---|---|---|---|---|---|
| 257 | #5 | Hábitos: más hábitos, virtudes y prueba de realización | feature | 2 | schema (D-BP4) |
| 258 | #10 | Corregir traducción al español de Liturgia | bug/datos | 1 | — |
| 259 | #11 | Panel para editar la rutina | feature | 2 | PanelAdmin (274), schema |
| 260 | #17 | Carta consagrada: progreso al próximo grado | mejora | 1 | — |
| 261 | #18 | /dashboard se ve como iframe con scroll | bug | 2 | TaskWorkspace (262, 264, 273) |
| 262 | #19 | Reparar la vista de agenda del panel de tareas | bug | 2 | TaskWorkspace/SchedulePanel (261) |
| 263 | #20 | Botón «Iniciar» duplicado en la tarea | bug | 1 | TaskDetailPanel (264) |
| 264 | #21 | Cronómetro: modal y ventana flotante | feature | 2 | 263, 261/262 (TaskWorkspace), layout |
| 265 | #22 | Checklists globales en tareas compartidas | feature | 2 | schema |
| 266 | #23 | Confirmar la compra de accesorios del compañero | mejora | 1 | — |
| 267 | #24 | Al abrir la app, ir a /dashboard?s=today | mejora | 1 | — |
| 268 | #25 | Tareas rechazadas vuelven como pendientes | bug | 1 | — |
| 269 | #26 | Atajos arriba de todo en el sidebar | mejora | 1 | AppSidebar (270–276 enlaces) |
| 270 | #29 | Biblioteca (BookOrbit) | feature grande | 3 | schema, AppSidebar, 277 (audiolibros) |
| 271 | #30 | Bloc de notas (dovli) | feature grande | 3 | schema, AppSidebar |
| 272 | #31 | Diario personal y familiar | feature grande | 3 | schema, AppSidebar |
| 273 | #32 | Imprimir la agenda semanal | feature | 2 | TaskWorkspace (261) |
| 274 | #33 | Premio grupal por alcanzar meta | feature | 3 | PanelAdmin (259), schema, AppSidebar |
| 275 | #34 | Pantalla de logros | feature | 1 | NavUser |
| 276 | #35 | Módulo Social (OpenCircle) | feature grande | 3 | schema, AppSidebar, 277 (videos) |
| 277 | — | Archivos grandes (infraestructura) | infra | 3 (antes de 270/276) | schema; **bloqueada: decisión de Gabriel** |
| 280 | — | Marco global de `/dashboard` (barra + padding en el layout); AGENTS.md regla 10 | mejora | fuera de olas | layout, PageHeader, CabeceraEstudio |
| 280* | — | Lector de ePub a pantalla completa con foliate-js (PR #85; *número repetido, sin archivo propio: ver LANE_280/LANE_270) | feature | fuera de olas | LectorLibro, LectorEpub |
| 281 | #29 | Biblioteca: metadatos y miniatura de portada al subir libros | feature | fuera de olas | SubirLibro, lib/biblioteca |
| 282 | — | Aviso de terceros de opencircle en `THIRD_PARTY_NOTICES.md` | docs/licencias | fuera de olas | — |

## Olas (orden de ejecución)

- **Ola 1** (sin archivos en común, en paralelo): 263, 266, 267, 268, 269, 260, 275, 258 (fase de auditoría).
- **Ola 2**: 261 → 262 (mismo archivo, en serie); 264 cuando entren 263 y 262; 273 cuando entre 261; 265; 259; 257.
- **Ola 3**: 274, 271, 272, 277 → 270, 276. Cada una agrega un enlace al sidebar: esa microtarea va **al final** de la lane, cuando la anterior que tocó `AppSidebar.tsx` ya está en `origin/dev`.

## Estado (2026-11-08, orquestador)
- **Integradas a `dev`** (PR + merge commit, D-FLUJO): las 20 lanes del backlog + 277 (fase A) + 278 (sidebar ola 3) + 279 (fix `limpiar-lane.sh`) + 281 (#86) + 280 marco global (#87) + lector foliate (#85) + 282 aviso opencircle (#88). `dev` = `e634b01` (2026-11-08). Worktrees y ramas limpiados. **dev → main: PR #84**, lo integra Gabriel.
- **Producción**: esquema al día con `dev` (SQL aditivo de `migrate diff`, 0 DROP; diff posterior vacío). `Objetos_Almacen` (277) no está porque la fase B sigue bloqueada.
- **Esperan a Gabriel**: 268 M6 (correr el script de datos, 12 tareas), 257 parte C, 258 M8, 277 fase B (D1–D4), 259 D1, 264 D1. Detalle en cada `LANE_*.md`.
- **Diario fase 1 (reclamo de Gabriel 2026-11-08):** lanes **283–286** reservadas, ver [[LANE_283_DIARIO_FASE1_ESCRITURA_Y_ORGANIZACION]]. Serializan entre sí y con cualquier lane que toque `src/*/diario`. **Estado 2026-11-08: las cuatro integradas en `dev` (PR #89 a #92); falta la prueba de pantalla de Gabriel. Siguen fase 2 (vistas y estadísticas), fase 3 (adjuntos y datos) y fase 4 (extras de moodiary), sin pedir todavía.**
- **Fase 2 (vistas y estadísticas):** 287 estadísticas e 288 calendario/año/mapa de calor integradas (PR #93, #94, falta la prueba de pantalla); 289 línea de tiempo y recuerdos integrada (PR #95, falta la prueba de pantalla); 290 enlaces entre entradas y búsqueda en el documento integrada (PR #96). Fase 2 completa. **Fase 3 (adjuntos y datos):** 291 exportar (Markdown, CSV, JSON) integrada (PR #97, falta la prueba de pantalla); 292 importar integrada (PR #98, falta la prueba de pantalla); 293 galería y compartir integrada (PR #99, falta la prueba de pantalla); 294 adjuntos, notas de voz y visor de fotos integrada (PR #100, falta la prueba de pantalla). Fase 3 completa. **Fase 4 (extras de moodiary):** 295 grafo de enlaces integrada (PR #101, falta la prueba de pantalla); 296 lugares y clima de la entrada integrada (PR #102, falta la prueba de pantalla); 297 mapa de huellas y editor de lugar con mapa integrada (PR #103, falta la prueba de pantalla); 298 asistente de IA (chat, herramientas, permisos, proveedores con clave propia) integrada (PR #104, falta la prueba de pantalla con una clave real); 299 memoria y compactación del asistente (local en el navegador; PR #105, falta la prueba de pantalla); 300 animaciones y transiciones (PR #106, falta la prueba de pantalla). Fase 4 completa.
- **Próxima lane libre: 302.** Ramas remotas viejas `dev-*` borradas el 2026-11-08 (SHA en LANE_280).

## Esquema de base: cambios pedidos por lane (los aplica el orquestador)

| Lane | Cambio | Tipo |
|---|---|---|
| 257 | `ALTER TYPE "CategoriaHabito" ADD VALUE 'virtud'` | aditivo |
| 259 | tabla `Rutina_Familiar` | aditivo |
| 265 | columnas `Completado_Por_ID`, `Completado_En` en `Checklist_Items` | aditivo |
| 270 | enum `EstadoBiblioteca` (D9 de la lane: `EstadoLectura` ya existía); tablas `Biblioteca_Libros`, `Biblioteca_Archivos`, `Biblioteca_Estantes`, `Biblioteca_Estantes_Libros`, `Biblioteca_Estados` | aditivo |
| 271 | tablas `Notas_Espacios`, `Notas_Paginas` | aditivo |
| 272 | enum `TipoDiario`; tablas `Diario_Entradas`, `Diario_Fotos` | aditivo |
| 274 | tabla `Premios_Grupales` | aditivo |
| 276 | enums `SocialTipoCanal`, `SocialTipoNotificacion`; tablas `Social_Canales`, `Social_Canal_Miembros`, `Social_Posts`, `Social_Medios`, `Social_Reacciones`, `Social_Notificaciones` | aditivo |
| 277 | tabla `Objetos_Almacen` | aditivo |

## Repos externos de referencia
Movido a [[REPOS_EXTERNOS]] (2026-11-08): commits, licencias, qué se tomó, dónde quedó en el código y clones completos en `18_OrdoDiei/repos-externos/`.
