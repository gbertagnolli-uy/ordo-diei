---
lane: 290
titulo: Diario fase 2 — enlaces entre entradas y búsqueda dentro del documento (port de moodiary)
plane: "#31"
estado: integrada
rama: task/lane-290-diario-enlaces-busqueda
agente: claude
actualizado: 2026-11-08
---

# Lane 290 — Enlaces entre entradas y búsqueda en el documento

Cierra la fase 2 del plan aprobado por Gabriel el 2026-11-08 y salda dos desvíos de la lane 283 (c: `DiaryLink`; d: `prosemirror-search` sin interfaz). Regla: se porta, no se «inspira» (memoria `clonar-es-portar-funciones`).

## Fuentes leídas completas (2026-11-08)
- **moodiary** `2c552dd`: `editor/src/core/editor/nodes/diary-link.ts`, `diary-link.test.ts`, `search.ts`, `commands.ts` (`insertDiaryLink`, `search*`, `replace*`), `normalize.ts`/`plain-text.ts` (nodo `diaryLink`), `ui/{DiaryLinkSuggestion,EditorLinksPanel,link-intercept}.tsx/ts`, y de `diary_repository.dart` las funciones `_applyLinks`, `getBacklinks`, `getForwardLinks`, `hasAnyLink`.

## Qué se porta (mapa fuente → web)
| Función | Fuente | En esta app |
|---|---|---|
| Escribir `[[` (o `【【`, `「「`) abre una lista de entradas para enlazar; flechas, Enter, Esc; al elegir se inserta el nodo | `DiaryLink` (Mention + Suggestion), `DiaryLinkSuggestion` | `core/nodes/diary-link.ts`, `ui/SugerenciaEnlace.tsx`; los candidatos salen de `GET /api/diario/enlaces?tipo=&q=` (en moodiary los pedía a Flutter) |
| Botón «Enlazar entrada» de la barra (inserta `[[`) | `insertDiaryLink` | `BarraFormato` |
| Tocar un enlace en una entrada abre esa entrada | `link-intercept.ts` (`linkTap`) | click en el nodo → el calendario salta al día de la entrada (`ContextoEnlaces`) |
| Tabla de enlaces origen→destino, reescrita al guardar | `_applyLinks`, `DiaryLinks` | modelo `DiarioEnlace`; `aplicarEnlaces` dentro de la transacción de crear y editar |
| Panel de enlaces: salientes y entrantes (backlinks) con título y fecha | `EditorLinksPanel`, `getBacklinks`, `getForwardLinks` | `PanelEnlaces` en la tarjeta de la entrada (botón con la cantidad cuando hay enlaces) |
| Texto plano del enlace = su rótulo (se busca y se ve en listas) | `plain-text.ts` | `textoPlanoDe` |
| Buscar dentro del documento: siguiente, anterior, mayúsculas, reemplazar y reemplazar todo, con «n de total» | `search.ts` (`prosemirror-search`), `commands.ts` | `core/search.ts`, `ui/BarraBusqueda.tsx`; botón en la barra y Ctrl+F |

## Decisiones
- **L1 · Los enlaces guardan el id numérico de la entrada** (moodiary usa un UUID). En el documento: `{ type: "diaryLink", attrs: { id: "123", label: "…" } }`. El servidor lo sanea (id solo dígitos, rótulo ≤ 200).
- **L2 · Solo se enlaza dentro del mismo diario.** Una entrada personal solo ve candidatas propias; la familiar, las de la familia. Un enlace a una entrada que no está disponible en ese diario se deja en el texto, pero no entra en la tabla y al tocarlo avisa «La entrada no existe o no está disponible».
- **L3 · Tabla `DiarioEnlace`** (origen, destino), clave compuesta, borrado en cascada de los dos lados. Se reescribe entera al guardar la entrada (como `_applyLinks`). Sin enlaces a sí misma. Cambio de base **solo aditivo** (`CREATE TABLE`), aplicado con `prisma db execute` según AGENTS.md regla 7.
- **L4 · Tocar un enlace solo navega en modo lectura.** En el editor el toque coloca el cursor (moodiary navega siempre; acá se evita perder lo que se está escribiendo).
- **L5 · Esquema Markdown propio** `diario://entrada/<id>` en lugar de `moodiary://diary/<id>` (solo se usa al copiar y pegar Markdown).
- **L6 · La barra de búsqueda es de React** (en moodiary es de Flutter, que habla con el editor por el puente). Las órdenes son las mismas: `search`, `searchNext`, `searchPrev`, `replace`, `replaceAll`, `clearSearch`.
- **L7 · El grafo de enlaces** (`buildLinkGraph`, botón del panel en moodiary) queda para la fase 4 (extras de moodiary).

## Fuera de esta lane, con motivo (a decidir por Gabriel)
- **Grafo de enlaces entre entradas** → fase 4.
- **Enlaces a entradas del otro diario** (personal ↔ familiar): no se permiten por privacidad.

## Arquitectura
- Reglas puras con tests: `src/lib/diario/enlaces.ts` (+ `.test.ts`), nodo `diaryLink` en `contenido.ts`.
- Servidor: `src/lib/diario/servidor-enlaces.ts`, rutas `GET /api/diario/enlaces` y `GET /api/diario/enlaces/[id]`; `crearEntrada`/`editarEntrada` llaman a `aplicarEnlaces`.
- Base: modelo `DiarioEnlace` (+ SQL en la bitácora).
- UI: `editor/core/nodes/diary-link.ts`, `editor/core/search.ts`, `editor/ui/{SugerenciaEnlace,BarraBusqueda}.tsx`, `enlaces/{ContextoEnlaces,PanelEnlaces}.tsx`, `ListaDia.tsx`, `DiarioVista.tsx`.
- Dependencias nuevas: `@tiptap/extension-mention` y `@tiptap/suggestion` 3.33.0 (MIT).

## Archivos en alcance
`prisma/schema.prisma` · `src/lib/diario/{contenido,enlaces,servidor,servidor-enlaces}*.ts` · `src/app/api/diario/enlaces/**` · `src/components/diario/{editor,enlaces}/**` · `src/components/diario/{ListaDia,DiarioVista,EditorEntrada}.tsx` · `vendor/moodiary/**` · `THIRD_PARTY_NOTICES.md` · `package.json`, `package-lock.json`.

## Microtareas
- [x] M1 · Leer las fuentes completas.
- [x] M2 · Ampliar `ORIGEN.md` y `THIRD_PARTY_NOTICES.md`.
- [x] M3 · Reglas puras + tests.
- [x] M4 · Base: modelo y SQL aditivo.
- [x] M5 · Servidor: guardar enlaces, candidatos, panel.
- [x] M6 · Interfaz: nodo, sugerencias, búsqueda en el documento, panel.
- [x] M7 · Gates, PR, integración y limpieza.
- [ ] M8 · Prueba de pantalla: Gabriel (AGENTS.md regla 10).

## Gates
`npx prisma validate` · `npx tsc --noEmit` · `npm test` · `npx eslint src/lib/diario src/app/api/diario src/components/diario src/app/dashboard/diario`

## Bitácora
- 2026-11-08 · claude · INICIO 290 · lane creada desde `dev` = `cad00d7`.
- 2026-11-08 · claude · FIN 290 · commit 12c1be8. Gates: prisma validate ok, tsc ok, eslint ok, npm test 902 pass / 0 fail. Base: CREATE TABLE Diario_Enlaces aplicado con prisma db execute (sin DROP). INTEGRADA · PR #96 (merge commit), lane limpiada. Falta M8: prueba de pantalla de Gabriel.
