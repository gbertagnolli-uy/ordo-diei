---
lane: 295
titulo: Diario fase 4 — grafo de enlaces entre entradas (port de moodiary)
plane: "#31"
estado: integrada
rama: task/lane-295-diario-grafo-enlaces
agente: claude
actualizado: 2026-11-08
---

# Lane 295 — Grafo de enlaces

Abre la fase 4 del plan aprobado por Gabriel el 2026-11-08 (extras de moodiary) y salda el desvío L7 de la lane 290. Regla: se porta, no se «inspira» (memoria `clonar-es-portar-funciones`).

## Fuentes leídas completas (2026-11-08)
- **moodiary** `2c552dd`: `presentation/graph/{diary_graph_page,diary_ego_graph_page,graph_canvas,graph_scene,graph_style,graph_info_card}.dart`, `graph_canvas_test.dart`, `moodiary_models/diary_graph.dart`, `diary_repository.dart` (`buildLinkGraph`, `buildEgoGraph`, `_graphPreview`, `_visibleRowsByIds`), `diary.drift` (`visibleLinkEdges`, `outEdgesOf`, `inEdgesOf`), el test «双链与图谱», y el motor de fuerzas `fast_core/rust/src/graph/layout.rs` con su puente (`api/graph_layout.rs`, `lib/graph.dart`).

## Qué se porta (mapa fuente → web)
| Función | Fuente | En esta app |
|---|---|---|
| Grafo de todo el diario: solo entradas con algún enlace, enlaces con sentido (origen→destino), se descartan los colgantes | `buildLinkGraph`, `visibleLinkEdges` | `construirGrafoGeneral` (`lib/diario/grafo.ts`) + `grafoGeneral` (servidor) |
| Grafo local de una entrada: entrantes y salientes hasta 1–3 saltos, tope 300 nodos, centro siempre en el índice 0, se podan las islas que quedan sin camino visible | `buildEgoGraph`, `outEdgesOf`, `inEdgesOf` | `siguienteNivel` + `ensamblarGrafoLocal` + `grafoLocal` |
| Vista previa de 24 caracteres del cuerpo | `_graphPreview` | `vistaPrevia` |
| Escena: adyacencia sin repetidos, grados, radio por grado (percentil 95 con tope 4–24), radio del centro, orden de etiquetas (centro, grado, índice) | `GraphScene.build`, `_buildCsr`, `_undirected` | `construirEscena` (`lib/diario/grafo-escena.ts`) |
| Rótulo: título (10) o cuerpo (5) cortados por caracteres visibles, o `MM-DD` | `graphNodeLabel` | `rotuloDeNodo` (con `Intl.Segmenter`, no parte emojis) |
| Filtros: categoría y período (todo / 30 días / este año / 365 días); se quitan los nodos que quedan aislados | `filterGraph`, `_TimeFilter` | `filtrarGrafo`, `rangoDePeriodo` |
| Colores: por categoría, por fecha (más nuevo = más intenso) o sin color | `_resolveColors`, `GraphColorMode` | `valorDeColor` + `paleta.ts` |
| Siembra por capas (BFS) para empezar cerca del resultado | `seedByBfs` | `sembrarPorCapas` |
| Disposición radial del grafo local: salientes a la derecha, entrantes a la izquierda, mutuos arriba, 2.º salto en el anillo exterior | `layoutEgoRadial`, `egoDirectionsOf` | `disposicionRadial`, `direccionesDesdeCentro` |
| Motor de fuerzas: repulsión Barnes–Hut, resortes, gravedad, colisiones en rejilla, enfriamiento, normalización de escala, nodos fijos | `layout.rs` | `lib/diario/grafo-layout.ts` (generador que entrega cuadros; corre en el hilo principal repartido en cuadros de animación) |
| Parámetros por densidad (dispersa / normal / densa) | `GraphTuning` | `ajustes` en `grafo-escena.ts` |
| Lienzo: arrastrar, pellizcar, rueda, inercia, «encajar», doble fondo de puntos, aristas con flecha, nodo elegido con anillo, atenuado del resto, etiquetas sin solaparse (máx. 140) que aparecen al asentarse | `graph_canvas.dart` | `grafo/GrafoCanvas.tsx` (Canvas 2D) |
| Tarjeta del nodo: título, fecha, cantidad de enlaces salientes/entrantes, abrir, centrar | `GraphInfoCard` | `grafo/TarjetaNodo.tsx` |
| Pantalla del grafo con filtros, hoja «Vista», contador y estado vacío | `diary_graph_page.dart` | `grafo/GrafoEnlaces.tsx`, `grafo/OpcionesGrafo.tsx` |
| Pantalla del grafo local con pila de centros, leyenda y volver | `diary_ego_graph_page.dart` | `grafo/GrafoLocal.tsx` |
| Entradas: el botón del panel de enlaces abre el grafo local; el grafo general se abre desde la pantalla del diario | panel + `DiaryGraphRoute` | `PanelEnlaces` (botón «Ver grafo»), `DiarioVista` (botón «Grafo de enlaces») |

## Decisiones
- **G1 · El grafo sale del servidor ya armado**, con la privacidad de siempre: el personal solo ve entradas propias, el familiar las de la familia (`visibles`, como en lane 290). Un enlace cuyo extremo no es visible se descarta.
- **G2 · Tope de 5.000 enlaces** en el grafo general (moodiary no tiene tope, pero acá cada nodo viaja por la red y se dibuja en Canvas 2D). Si se llega, la respuesta trae `truncado: true` y la pantalla lo avisa. Los más recientes primero.
- **G3 · El texto de la vista previa** se corta en el servidor a 24 caracteres; no viaja el cuerpo de la entrada.
- **G4 · El lienzo es Canvas 2D** (moodiary usa `drawVertices`/`drawRawPoints` de Flutter). Mismo diseño: radios, flechas, atenuado, etiquetas con rejilla de ocupación.
- **G5 · El motor de fuerzas es TypeScript** (moodiary lo hace en Rust por FFI). Mismo algoritmo y mismos parámetros. En vez de un hilo aparte, un generador entrega un cuadro cada N iteraciones y la pantalla lo consume uno por cuadro de animación (≈ 110 cuadros, 600 iteraciones; 900 si hay más de 1.500 nodos).
- **G6 · Colores con las variables del tema** (`--primary`, `--chart-*`); las categorías usan su color o uno derivado del id (como `categoryColorOf`). La paleta se recalcula si cambia el tema claro/oscuro.
- **G7 · El selector de saltos (1, 2, 3) del grafo local es un agregado** de esta app: moodiary acepta `depth` pero la pantalla no lo ofrece (usa 1).
- **G8 · Sin cambios de base**: el grafo lee `Diario_Enlaces` (lane 290).

## Fuera de esta lane, con motivo (a decidir por Gabriel)
- **Grafo entre los dos diarios** (personal ↔ familiar): no se permite por privacidad (ya decidido en L2).
- **Fijar y arrastrar nodos** con el dedo: moodiary tampoco lo tiene (`pinnedCount` solo fija el centro del grafo local).
- **Háptico** al elegir un nodo (`HapticFeedback.selectionClick`): no hay equivalente web fiable.
- **Actualización en vivo** al guardar una entrada con la pantalla abierta (moodiary escucha `diaryEvents`): el grafo se vuelve a pedir al guardar una entrada o al abrir la pantalla.

## Arquitectura
- Reglas puras con tests: `src/lib/diario/{grafo,grafo-escena,grafo-layout}.ts` (+ `.test.ts`).
- Servidor: `src/lib/diario/servidor-grafo.ts`, rutas `GET /api/diario/grafo` y `GET /api/diario/grafo/[id]`.
- UI: `src/components/diario/grafo/{GrafoCanvas,GrafoEnlaces,GrafoLocal,TarjetaNodo,OpcionesGrafo}.tsx`, `paleta.ts`, `useColores.ts`; cambios en `enlaces/{ContextoEnlaces,PanelEnlaces}.tsx`, `ListaDia.tsx`, `DiarioVista.tsx`.
- Sin dependencias nuevas.

## Archivos en alcance
`src/lib/diario/{grafo,grafo-escena,grafo-layout,servidor-grafo}*.ts` · `src/app/api/diario/grafo/**` · `src/components/diario/grafo/**` · `src/components/diario/enlaces/{ContextoEnlaces,PanelEnlaces}.tsx` · `src/components/diario/{DiarioVista,ListaDia}.tsx` · `vendor/moodiary/**` · `THIRD_PARTY_NOTICES.md`.

## Microtareas
- [x] M1 · Leer las fuentes completas.
- [x] M2 · Copiar fuentes a `vendor/moodiary`, ampliar `ORIGEN.md` y `THIRD_PARTY_NOTICES.md`.
- [x] M3 · Reglas puras + tests (grafo, escena, motor de fuerzas).
- [x] M4 · Servidor: grafo general y local, rutas.
- [x] M5 · Interfaz: lienzo, pantallas, tarjeta, opciones, enganche en el panel de enlaces y en el diario.
- [x] M6 · Gates, PR, integración y limpieza.
- [ ] M7 · Prueba de pantalla: Gabriel (AGENTS.md regla 10) — abrir el grafo con entradas enlazadas, arrastrar, pellizcar, elegir un nodo, filtrar, centrar una entrada.

## Gates
`npx tsc --noEmit` · `npm test` · `npx eslint src/lib/diario src/app/api/diario src/components/diario src/app/dashboard/diario`

## Detalles que se decidieron al implementar
- El lienzo es un motor sin React (`grafo/lienzo.ts`) que maneja `GrafoCanvas.tsx`; el cuadro de posiciones viaja por un `MarcoGrafo` (equivale a `GraphFrame`).
- Las flechas se dibujan con un ancho mínimo de 0,6 px en pantalla (en Flutter las líneas de 0,8 unidades se ven finísimas al alejar; en la web casi desaparecían).
- Los colores por categoría usan el color elegido o uno derivado del id, **sin armonizar con el color principal** (`harmonizeWith` de Material no tiene equivalente directo).
- Accesibilidad que moodiary no tiene: el lienzo recibe foco con Tab, las flechas del teclado recorren las entradas (en el orden de las etiquetas) y Escape suelta la selección.
- Con la repulsión aproximada (theta 0,9) algún enlace de una cadena larga queda más estirado que con la exacta; es el error normal de Barnes–Hut, verificado contra la suma exacta (error medio 2 %). La prueba de moodiary exige menos de 4 largos de resorte; acá se exige eso con repulsión exacta y menos de 6 con la aproximada.

## Hallazgos
- La prueba de pantalla no se puede automatizar sin servidor (regla 10): los gestos, el dibujo y la animación del grafo local quedan para Gabriel (M7). Las cuentas (armado del grafo, filtros, escena, siembra, disposición radial, motor de fuerzas, colores) sí tienen pruebas: 60 nuevas.
- El motor de fuerzas en el hilo principal reparte el trabajo en ≈110 cuadros; con más de 1.500 nodos puede notarse. El tope de 5.000 enlaces del grafo general lo acota.

## Bitácora
- 2026-11-08 · claude · INICIO 295 · lane creada desde `dev` = `00da975`.
- 2026-11-08 · claude · FIN 295 · PR #101 integrado con merge commit (91ecf64, commit dada1f7), worktree y rama limpiados. Gates: tsc ok, eslint ok, npm test 1143 / 1092 ok / 0 fallan (60 nuevas; las omitidas piden DATABASE_URL). Sin cambios de base. Queda M7 (prueba de pantalla, Gabriel).
