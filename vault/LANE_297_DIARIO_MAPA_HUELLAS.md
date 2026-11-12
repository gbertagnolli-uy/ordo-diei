---
lane: 297
titulo: Diario fase 4 — mapa de huellas y editor de lugar con mapa (port de moodiary)
plane: "#31"
estado: integrada
rama: task/lane-297-diario-mapa-huellas
agente: claude
actualizado: 2026-11-08
---

# Lane 297 — Mapa de huellas y editor de lugar con mapa

Tercera lane de la fase 4 del plan aprobado por Gabriel el 2026-11-08 (extras de moodiary). Continúa la 296 (lugares y clima). Regla: se porta, no se «inspira» (memoria `clonar-es-portar-funciones`).

## Fuentes leídas completas (2026-11-08)
- **moodiary** `2c552dd`: `presentation/map/{map_page,map_page.g,map_tile_source,map_tiles}.dart`, `presentation/place/place_editor.dart` (el mapa del editor), `presentation/widget/diary_entry_tile.dart` (las entradas de la hoja del lugar), `moodiary_data/diary_repository.dart` (`placeFootprints`, `getDiariesAtPlace`) y su prueba, `place_controller.dart` (`placeFootprints` se refresca ante cambios).

## Qué se porta (mapa fuente → web)
| moodiary | Esta app |
|---|---|
| `MapPage` (tarjeta de mapa + lista de lugares ordenada por cantidad) | `MapaHuellas`: mapa de 280 px arriba, lista de lugares con entradas abajo, «Ampliar» a pantalla completa y «Ajustar a todos» |
| `footprintsProvider` / `placeFootprints()` | `GET /api/diario/lugares/huellas?tipo=` → `{ huellas: [{ lugarId, cantidad, primera, ultima }] }` (`groupBy` sobre `lugarId`) |
| `_FootprintPin` (14 px si es 1 entrada, 26 / 30 px con número, 38 px elegido, `99+`) | Mismo tamaño y número, color del ícono del lugar (lane 296) |
| `_PlaceSheet` + `getDiariesAtPlace` + `DiaryEntryTile` | Hoja del lugar: nombre, «N entradas · mes – mes» y las entradas del lugar (más nuevas primero); tocar una lleva al día |
| `_cardOverview` / `_fullOverview` / `CameraFit.coordinates` (padding 36 y zoom máx. 13) | `ajustarVista` (módulo puro con pruebas) con los mismos márgenes y tope |
| `_onPlaceTap`: acerca a zoom ≥ 14 y abre la hoja | Igual (animación de cámara 0,3 s) |
| `_cardMoved` + botón «ajustar» | Aparece cuando se movió el mapa a mano; vuelve a la vista de todos |
| `_Empty` | «Aún no hay lugares con entradas» |
| `MapAttribution` | «© OpenStreetMap contributors» con enlace a la licencia |
| `_onTileError` | Un aviso (una sola vez) si no cargan las baldosas |
| Mapa de `place_editor` (200 px, pin fijo al centro, otros lugares como círculos de 200 m con su insignia, botón «ubicación») | `MapaLugar` dentro de `EditorLugar`: se mueve el mapa y las coordenadas se actualizan; se mantienen los campos de latitud y longitud |

## Decisiones
- **D1 · Motor de mapa propio, sin dependencias**: `flutter_map` no tiene equivalente ya instalado y Leaflet / MapLibre suman cientos de KB y CSS propio. Con baldosas de OpenStreetMap alcanzan la proyección Web Mercator, un `<img>` por baldosa y los gestos de puntero; el módulo de matemática es puro y tiene pruebas (`src/lib/diario/mapa.ts`).
- **D2 · Solo OpenStreetMap**: Tianditu necesita clave y es de China. El selector de fuente de baldosas de moodiary (`showMapSourcePicker`) deja de tener sentido con una sola fuente y no se porta.
- **D3 · Baldosas desde `tile.openstreetmap.org` directo del navegador**: es lo que hace moodiary. Se respeta la política de uso (atribución visible, sin descarga masiva, una `<img>` por baldosa visible con caché del navegador). Si alguna vez hace falta más volumen, se cambia la plantilla de URL en un solo lugar (`PLANTILLA_BALDOSA`).
- **D4 · Zoom fraccional como `flutter_map`**: la baldosa se pide en el zoom entero más cercano y se escala por CSS; los gestos (rueda, pellizco, doble clic) cambian el zoom de forma continua alrededor del punto tocado.
- **D5 · Las huellas cuentan por ámbito** (personal = solo las del creador; familiar = toda la familia), igual que el resto de los lugares. `primera` / `ultima` salen de la fecha de la entrada (`Fecha`, día), no de la hora de creación.
- **D6 · Las entradas del lugar** se piden aparte (`GET /api/diario/lugares/[id]/entradas`), no se mandan todas con el mapa.

## Fuera de esta lane, con motivo (a decidir por Gabriel)
- **Tianditu (天地图) y su clave**: no se porta (D2).
- **Selector de fuente de mapa**: con una sola fuente no hace falta (D2).
- **Animaciones de moodiary** (expansión de la tarjeta con `Rect.lerp`, rebote de los pines): se hace una versión sobria con transiciones CSS y una animación de cámara con curva de desaceleración.
- **Rotación del mapa**: moodiary la desactiva; acá tampoco hay.
- **Centro inicial del editor sin posición**: moodiary arranca en el centro de China (35, 105); acá arranca en Uruguay (zoom 6) y un lugar nuevo busca la ubicación al abrirse, como moodiary.
- **Hoja del lugar**: sin el `MediaMarkedText` (marcas de medios en el texto) de moodiary; se muestra el texto plano de dos líneas. Tope de 1000 entradas por lugar.
- **Zoom con rueda / pellizco continuo**: la velocidad de la rueda (1 nivel cada 240 px de desplazamiento) es propia; `flutter_map` usa la suya.
- **Sin prueba automática de los gestos**: la matemática está probada (`mapa.test.ts`); los gestos y el dibujo los prueba Gabriel en pantalla.

## Arquitectura
- Reglas puras con pruebas: `src/lib/diario/mapa.ts` (proyección, baldosas visibles, ajustar a puntos, zoom alrededor de un punto, radio en píxeles, tamaño del pin, rango de fechas).
- Servidor: `huellasDeLugares` y `entradasDeLugar` en `servidor-lugares.ts`; rutas `/lugares/huellas` y `/lugares/[id]/entradas`.
- Interfaz: `components/diario/mapa/{MapaBase,MapaHuellas,MapaLugar,HojaDelLugar}.tsx`; `EditorLugar` usa `MapaLugar`; `DiarioVista` agrega el botón «Mapa de huellas».

## Archivos en alcance
`src/lib/diario/mapa.ts` (+ test) · `src/lib/diario/servidor-lugares.ts` · `src/app/api/diario/lugares/{huellas,[id]/entradas}/route.ts` · `src/components/diario/mapa/*` · `src/components/diario/lugares/EditorLugar.tsx` · `src/components/diario/DiarioVista.tsx` · `vendor/moodiary/*` · `THIRD_PARTY_NOTICES.md`

## Microtareas
- [x] M1 · Leer las fuentes completas.
- [x] M2 · Copiar fuentes a `vendor/moodiary`, ampliar `ORIGEN.md` y `THIRD_PARTY_NOTICES.md`.
- [x] M3 · Módulo puro `mapa.ts` + pruebas.
- [x] M4 · Servidor: huellas y entradas del lugar; rutas.
- [x] M5 · Interfaz: `MapaBase`, `MapaLugar` en el editor, `MapaHuellas` + hoja del lugar, botón en el diario.
- [x] M6 · Gates, PR, integración y limpieza (PR #103, dev = eab13db).
- [ ] M7 · Prueba de pantalla: Gabriel (AGENTS.md regla 10).

## Gates
`npx tsc --noEmit` · `npm test` · `npx eslint src/lib/diario src/app/api/diario src/components/diario src/app/dashboard/diario`

## Bitácora
- 2026-11-08 · claude · INICIO 297 (lectura de fuentes y decisiones; la lane se crea desde `dev` = `01a2e43`).
- 2026-11-08 · claude · Hecho: `mapa.ts` + 20 pruebas, `servidor-huellas.ts`, rutas `/lugares/huellas` y `/lugares/[id]/entradas`, `MapaBase` (gestos, baldosas OSM), `MapaLugar` en el editor de lugar, `MapaHuellas` + `HojaDelLugar`, botón «Mapa de huellas» en el diario. Sin cambios de base de datos. Gates: tsc 0 · eslint 0 · npm test 1210 (1159 ok, 51 saltadas, 0 fallas).
