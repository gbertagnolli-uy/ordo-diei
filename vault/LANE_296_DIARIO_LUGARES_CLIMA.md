---
lane: 296
titulo: Diario fase 4 — lugares y clima de la entrada (port de moodiary)
plane: "#31"
estado: integrada
rama: task/lane-296-diario-lugares-clima
agente: claude
actualizado: 2026-11-08
---

# Lane 296 — Lugares y clima de la entrada

Segunda lane de la fase 4 del plan aprobado por Gabriel el 2026-11-08 (extras de moodiary). El mapa de huellas y el editor de lugar con mapa van aparte, en la **lane 297**. Regla: se porta, no se «inspira» (memoria `clonar-es-portar-funciones`).

## Fuentes leídas completas (2026-11-08)
- **moodiary** `2c552dd`: `moodiary_data/place_repository.dart` (+ test), `place_controller.dart`, `db/base_tables.drift`, `db/diary_tables.drift`, `moodiary_models/{place,diary_meta,manual_weather}.dart`, `moodiary_editor/data/{geo_repository,weather_repository,qweather_config}.dart`, `application/edit_controller.dart` (`changePlace`, `changeWeather`, `fetchPosition`, `fetchWeather`, `locate`), `moodiary_platform/location_service.dart`, `editor/src/ui/meta/{EditorMetaHeader.tsx,icons.ts}`, `core/state/meta.ts`, `presentation/place/{place_editor,place_manager_page}.dart`, `detail/diary_page.dart` (relleno automático, selector), `widget/{feed_tile,timeline_tile}.dart` (cómo se muestran), `moodiary_export` (`markdown_writer`, `markdown_importer._resolvePlace`, `export_doc`), `mui/qweather_icon.dart`, `diary_meta_references_test.dart`.

## Qué se porta (mapa fuente → web)
| Función | Fuente | En esta app |
|---|---|---|
| Lugares frecuentes: nombre, coordenadas, ícono (8 + pin por defecto), orden propio | `Place`, `places` | tabla `Diario_Lugares` + `lugares.ts` (reglas) + `servidor-lugares.ts` |
| La entrada guarda un lugar; no se borra un lugar con entradas | `Diaries.placeId`, `deleteAPlace` | `Diario_Entradas.Lugar_ID` (Restrict) |
| Distancia (Haversine, R = 6 371 008,8 m) y «lugar más cercano» en 200 m | `distanceMeters`, `PlaceMatching.matchAt`, `Place.matchRadius` | `distanciaMetros`, `lugarCercano` |
| Nombre por coordenadas `lat, lon` con 4 decimales cuando no hay nombre | `Place.coordinateName` | `nombreDeCoordenadas` |
| Orden de los lugares (lo guarda el usuario; los que faltan, por id al final) | `applyPlaceOrder`, `placeOrder` | columna `Orden` + `aplicarOrden` |
| Clima manual: 16 opciones con código QWeather | `ManualWeather` | `CLIMAS_MANUALES` (mismos códigos) |
| Clima de la entrada: código, temperatura, texto; `displayText` y `compactText` | `DiaryWeather` | `Clima` + `textoClima` / `textoClimaCompacto` |
| Clima automático por coordenadas (ubicación redondeada a 2 decimales) | `WeatherRepository`, `qweatherLocation` | `GET /api/diario/clima` (ver C2) |
| Lugar automático: ubicación → nombre → lugar existente o nuevo (id por nombre) | `GeoRepository.getGeo`, `fetchPosition` | `GET /api/diario/lugares/nombre` (ver C3) + `usarUbicacion` |
| Relleno automático al abrir una entrada nueva (lugar cercano / API / clima), sin pisar lo que el usuario tocó | `_maybeAutoFill`, `_placeTouched`, `_weatherTouched` | `useRellenoAutomatico` en el editor |
| Selector de clima y de lugar con «usar mi ubicación», «lugar nuevo», «administrar», «quitar»; lugares con distancia | `EditorMetaHeader.tsx` | `SelectorClima.tsx`, `SelectorLugar.tsx` en `EditorEntrada` |
| Administrar lugares: lista con búsqueda, cantidad de entradas, editar, borrar, reordenar | `place_manager_page.dart` | `lugares/AdministrarLugares.tsx` |
| Editor de lugar: nombre, ícono, ubicación actual (el mapa va en la 297) | `place_editor.dart` | `lugares/EditorLugar.tsx` |
| Cómo se muestran en la lista, la línea de tiempo y la entrada: ícono + temperatura, pin + nombre | `feed_tile`, `timeline_tile` | `MarcasEntrada.tsx`, `ListaDia`, `NodoLineaTiempo`, tarjetas |
| Exportar Markdown con `weather: [icono, temp, texto]` y `position: [lat, lon, nombre]` | `markdown_writer.dart` | `exportar.ts` |
| Importar: lugar por nombre, luego por cercanía (200 m), si no se crea | `_resolvePlace` | `servidor-importar.ts` |

## Decisiones
- **C1 · Catálogo por ámbito**, como etiquetas y categorías (lane 284): personal = del creador; familiar = de toda la familia, lo edita quien lo creó o un padre (`puedeEditarCatalogo`). moodiary no distingue porque es de un solo usuario.
- **C2 · Clima automático con Open-Meteo**, no con QWeather. QWeather exige una clave y un host por usuario y está pensado para China; Open-Meteo no pide clave, cubre Uruguay y devuelve el código WMO, que se traduce a los códigos de moodiary (tabla `WMO_A_CODIGO`). La consulta la hace el servidor (no se expone nada al navegador) con la ubicación **redondeada a 2 decimales** (≈ 1 km, igual que `qweatherLocation`).
- **C3 · Nombre del lugar por coordenadas con Nominatim (OpenStreetMap)**, no con la API de QWeather. Lo hace el servidor, con User-Agent propio, una consulta por vez y coordenadas a 4 decimales. Si falla, el lugar se llama `lat, lon` (como `coordinateName`). El nombre se arma con barrio y ciudad.
- **C4 · Los códigos del clima se guardan tal cual los usa moodiary** (`100`, `305`…), con el texto y la temperatura. Así se importan y exportan sin traducir, y un código desconocido (importado) se muestra con su texto y un ícono de nube.
- **C5 · Íconos de clima con lucide**, no con la fuente `qweather-icons` (sin licencia revisada y +7 000 glifos). Las 16 opciones manuales y los grupos de códigos de QWeather (sol, nubes, lluvia, tormenta, nieve, niebla, viento, calor, frío) tienen ícono; el resto, nube.
- **C6 · Ubicación con `navigator.geolocation`**: «precisa» (alta precisión, 20 s) en el editor de lugar y en «usar mi ubicación»; «reciente» (hasta 10 min, como `_freshEnough`) en el relleno automático. Los errores se traducen igual que `LocationFailure`: permiso denegado, servicio apagado, no disponible.
- **C7 · Relleno automático**: las tres opciones de moodiary (`autoNearestPlace`, `autoPosition`, `autoWeather`, apagadas por defecto) se guardan en el navegador (`localStorage`, por dispositivo), no en la base. No pisa un lugar o clima que el usuario ya eligió o quitó en esa entrada, y solo corre al abrir una entrada nueva.
- **C8 · Entrada**: `Lugar_ID` con `ON DELETE RESTRICT` (como `categoriaId`); el clima son tres columnas (`Clima_Codigo`, `Clima_Temp` en °C, `Clima_Texto`). Validación en el servidor: el lugar tiene que ser del ámbito de la entrada.
- **C9 · Cambio de base solo aditivo**: tabla nueva + columnas nuevas, sin `DROP`. Se genera con `prisma migrate diff … --script`, se revisa y se aplica con `db execute` (nunca `db push`).
- **C10 · Sin buscador por lugar ni por clima**: moodiary tampoco lo tiene (el lugar se recorre desde el mapa, lane 297).
- **C11 · «Usar mi ubicación» prueba primero el lugar a 200 m** y después el nombre (moodiary `fetchPosition` solo busca por nombre). Así no se crea un lugar duplicado al escribir otra vez desde la misma casa aunque Nominatim devuelva otro nombre.
- **C12 · El CSV (formato Daily You) no se amplía** con clima ni lugar, para no romper su compatibilidad. Clima y lugar viajan en el Markdown (`weather` / `position` como moodiary) y en el JSON propio.
- **C13 · Relleno automático solo con el permiso de ubicación ya concedido**: una entrada nueva no abre por sí sola el aviso del navegador. La primera vez se da el permiso con «Usar mi ubicación».
- **C14 · Los lugares del catálogo sin entradas no se exportan ni se importan** (solo los lugares de las entradas, con su nombre y coordenadas).

## Fuera de esta lane, con motivo (a decidir por Gabriel)
- **QWeather** (clave + host por usuario) y **天地图 (Tianditu)**: son servicios de China con clave propia; se reemplazan por Open-Meteo y Nominatim / OpenStreetMap (C2, C3).
- **Fuente de íconos `qweather-icons`**: se reemplaza por lucide (C5).
- **Arrastrar para reordenar con presión larga** (`ReorderableDelayedDragStartListener`) y **vibración** al soltar: se usan botones subir/bajar, como en la lane 284.
- **Preferencias de relleno automático en la base** (por usuario, entre dispositivos): quedan por dispositivo (C7).
- **Texto del clima en español**: la traducción de los textos de QWeather (`Soleado`, `Lluvia débil`…) es propia; moodiary los trae en su idioma de interfaz.
- **Servicios de terceros**: Open-Meteo y Nominatim reciben coordenadas redondeadas (2 y 4 decimales); no se envía ningún dato de la entrada.
- **Mapa para elegir la posición y mapa de huellas**: lane 297 (acá la posición se escribe en coordenadas o se toma de la ubicación).

## Arquitectura
- Reglas puras con tests: `src/lib/diario/{lugares,clima}.ts` (+ `.test.ts`).
- Servidor: `src/lib/diario/servidor-lugares.ts` (CRUD, orden, usos), `servidor-clima.ts` (Open-Meteo, Nominatim con tope de tiempo), cambios en `servidor.ts`, `servidor-importar.ts`, `servidor-exportar.ts`.
- Rutas: `/api/diario/lugares` (+ `[id]`, `orden`, `nombre`), `/api/diario/clima`.
- UI: `src/components/diario/lugares/*`, `SelectorClima.tsx`, `SelectorLugar.tsx`, cambios en `EditorEntrada.tsx`, `MarcasEntrada.tsx`, `ListaDia.tsx`, `linea/NodoLineaTiempo.tsx`, `DiarioVista.tsx`.
- Sin dependencias nuevas.

## Archivos en alcance
`prisma/schema.prisma` · `src/lib/diario/{lugares,clima,servidor-lugares,servidor-clima,reglas,servidor,servidor-importar,servidor-exportar,exportar,api}*.ts` · `src/lib/diario/importar/markdown.ts` · `src/app/api/diario/{lugares,clima}/**` · `src/components/diario/{lugares/**,SelectorClima.tsx,SelectorLugar.tsx,EditorEntrada.tsx,MarcasEntrada.tsx,ListaDia.tsx,DiarioVista.tsx,linea/NodoLineaTiempo.tsx}` · `vendor/moodiary/**` · `THIRD_PARTY_NOTICES.md`.

## Microtareas
- [x] M1 · Leer las fuentes completas.
- [x] M2 · Copiar fuentes a `vendor/moodiary`, ampliar `ORIGEN.md` y `THIRD_PARTY_NOTICES.md`.
- [x] M3 · Esquema (SQL aditivo con `migrate diff`) y reglas puras + tests (lugares, clima).
- [x] M4 · Servidor: lugares, clima, nombre por coordenadas; entrada guarda lugar y clima; importar y exportar.
- [x] M5 · Interfaz: selectores, administrar lugares, editor de lugar, relleno automático, marcas en lista / línea / entrada.
- [x] M6 · Gates, PR, integración y limpieza (PR #102, dev = 01a2e43).
- [ ] M7 · Prueba de pantalla: Gabriel (AGENTS.md regla 10).

## Gates
`npx tsc --noEmit` · `npm test` · `npx eslint src/lib/diario src/app/api/diario src/components/diario src/app/dashboard/diario` · `npx prisma validate`

## Bitácora
- 2026-11-08 · claude · INICIO 296 (lectura de fuentes y decisiones; la lane se crea desde `dev` = `91ecf64`).
- 2026-11-08 · claude · Hecho: tabla `Diario_Lugares` y columnas `Lugar_ID`/`Clima_*` (SQL aditivo aplicado), reglas puras (lugares, clima) con pruebas, servidor y rutas (/lugares, /lugares/[id], /lugares/orden, /lugares/ubicacion, /clima), entrada con lugar y clima, importar/exportar (Markdown, JSON), interfaz (selector de lugar y de clima, administrar y editar lugares, relleno automático, marcas en lista, línea de tiempo y búsqueda). Gates: tsc 0 · eslint 0 · npm test 1190 (1151 ok, 39 saltadas, 0 fallas) · prisma validate ok.
