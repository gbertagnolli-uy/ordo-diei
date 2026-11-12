---
lane: 299
titulo: Diario fase 4 — memoria a largo plazo y compactación de contexto del asistente
plane: "#31"
estado: integrada
rama: task/lane-299-diario-asistente-memoria
agente: claude
actualizado: 2026-11-08
---

# Lane 299 — Memoria y compactación del asistente

Quinta lane de la fase 4 (aprobada por Gabriel el 2026-11-08). Completa el asistente de la lane 298 con lo que esa lane dejó afuera a propósito: la **memoria entre conversaciones** y la **compactación del contexto** de moodiary. Regla: se porta, no se «inspira».

## Fuentes leídas (2026-11-08)
- **moodiary** `2c552dd`, `moodiary_assistant`: `data/memory_repository.dart` (normalización, duplicados, búsqueda por términos, `touch`, `clearAll`), `data/assistant_tools.dart` (`recallMemory`, `rememberFact`, `forgetFact`, `_recallMemory`, `_rememberOneFact`, `_forgetOneFact`, `recordOf` con `replayResult`, `_maxReplayChars` = 600), `data/assistant_defs.dart` (`memoryTools`, `buildCompactionSystemPrompt`, constantes de compactación, política de recuperación con y sin memoria, `buildTurnContext`), `application/context_compaction_controller.dart`, `presentation/memory_list_page.dart` (lista, búsqueda > 6, editar, borrar, borrar todo), `assistant_setting_page.dart` (interruptor de memoria), `assistant_page.dart` (`_maybeCompact`, `_compactNow`, `_compactionMessages`, `_syncCompactionNotice`, `_restoreFullHistory`, armado del historial con resumen), `_CompactionNoticeChip`, `tool_approval_preview.dart` (`_facts`), textos `assistant_en.i18n.json`.

## Qué se porta (moodiary → esta app)
| moodiary | Esta app |
|---|---|
| `MemoryEntry` + `MemoryRepository` (Drift, solo en el dispositivo: «nunca sale en una sincronización ni en una exportación») | `Hecho` + módulo puro `memoria.ts` con pruebas; guardado **solo en el navegador** (localStorage por persona) |
| `recallMemory` (lectura, `replayResult`), `rememberFact` (escritura, lote ≤ 20, revisar por id, duplicados), `forgetFact` (destructiva) | Mismas tres herramientas, mismas descripciones y mismos textos de resultado; **se ejecutan en el navegador** (no en el servidor) |
| `memoryTools` + `toolIdsWithoutMemory` + interruptor `assistantMemoryEnabled` (por defecto encendido) | `Ajustes.memoria` (por defecto encendido): apagada, el asistente no recibe las herramientas ni el contador y el prompt dice que la memoria está apagada |
| `MemoryListPage` (+ editar, borrar, borrar todo, búsqueda desde 7 hechos) | Pantalla «Lo que recuerda el asistente» |
| `recordOf` con `replayResult` (el resultado de `recallMemory` se repite en `[tools already run]`, tope 600 caracteres) | Igual |
| `buildTurnContext(factCount)` | `contextoDelTurno(ahora, cantidadDeHechos)` con la cantidad real de hechos |
| `ContextCompactionController` + `buildCompactionSystemPrompt` + constantes (disparo 0,75, cola 8, mínimo 8 mensajes, resumen ≤ 768 tokens, presupuesto 32 000, marca por id de mensaje) | Módulo puro `compactacion.ts` con pruebas + un turno sin herramientas al mismo proveedor; la sesión guarda `compactada { resumen, hastaId, en, tokens }` |
| Historial con `[Summary of earlier conversation]` + «Understood — I have the earlier context.» | Igual (se fusionan turnos seguidos del mismo rol) |
| Acción «Compactar ahora», avisos «nada que compactar» / «falló» / «compactado» | Botón en la cabecera del chat |
| `_CompactionNoticeChip` (aviso en el chat, hoja con el resumen, «Enviar de nuevo el historial completo») | Aviso en el chat justo después del último mensaje resumido, con el resumen desplegable y «Restaurar historial completo» |

## Decisiones
- **D1 · Memoria solo en el navegador** (coherente con D4 de la lane 298): los hechos que el asistente guarda sobre la persona viven en `localStorage` bajo `ordo-diei:asistente:v1:<usuario>:memoria`. No hay tabla en la base, no hay cambios de esquema y nada se sube al servidor salvo lo que el asistente decida usar en una conversación (viaja al proveedor de modelos como cualquier otro texto). moodiary hace lo mismo (la memoria queda en el dispositivo). Consecuencia: no se comparte entre dispositivos.
- **D2 · Las herramientas de memoria se ejecutan en el navegador.** El servidor sigue siendo un proxy sin estado para los turnos y ejecuta solo las herramientas del diario; `POST /api/diario/asistente/herramienta` rechaza las de memoria. El pedido de turno trae `memoria: true|false` y el servidor decide qué definiciones agrega (el cliente sigue sin poder mandar las suyas).
- **D3 · Niveles de permiso como moodiary**: `recallMemory` lectura, `rememberFact` escritura, `forgetFact` destructiva (se pide permiso también en modo «solo lo delicado»). La tarjeta de aprobación muestra el texto de los hechos que se van a olvidar.
- **D4 · Límites propios**: máximo 200 hechos y 500 caracteres por hecho (moodiary no pone tope; en el navegador hay que acotar el almacenamiento). Al llegar al tope, `rememberFact` falla con un mensaje claro para el modelo.
- **D5 · Búsqueda de hechos sin tildes**: moodiary parte los términos con `[^0-9a-z]+`, lo que rompe el español («ánimo» → «nimo»). Acá se normaliza (minúsculas, sin tildes) y se parte por letras y números Unicode; los caracteres CJK siguen contando como término suelto, como en moodiary.
- **D6 · Límite de contexto configurable**: moodiary toma `contextLimit` del catálogo de modelos de cada proveedor; ese catálogo remoto no se porta (lane 298). Se agrega el ajuste «Límite de contexto del modelo (tokens)», por defecto 32 000 como moodiary para modelos desconocidos, entre 4 000 y 2 000 000. La compactación se dispara cuando los tokens de entrada del último turno superan 75 % de ese límite.
- **D7 · Qué se resume**: lo mismo que ve el modelo en el historial (bloque `[tools already run]` + texto), no solo el texto como hace moodiary; así el resumen conserva «qué entradas se tocaron y qué se rechazó», que es lo que pide el prompt de compactación.
- **D8 · La compactación no borra nada**: el chat sigue mostrando todos los mensajes; solo cambia lo que se manda al modelo. «Restaurar historial completo» borra el resumen. Si una acción (responder de nuevo) deja la marca fuera de la conversación, el resumen se descarta.
- **D9 · Una compactación a la vez por conversación** y nunca mientras el asistente está contestando. Si falla (red, clave, respuesta vacía) no se toca la conversación; la acción manual avisa del fallo, la automática calla.
- **D10 · Los hechos se guardan solo por lo que la persona dice o pide** (política de moodiary en el prompt y en la descripción de `rememberFact`): nunca a partir del texto de una entrada ni del resultado de una herramienta; nada de salud, creencias ni datos legales o financieros. Es una instrucción al modelo, no una garantía: por eso `rememberFact` pide permiso en los modos «preguntar siempre» y la pantalla de memoria permite revisar y borrar todo.

## Fuera de esta lane, con motivo (a decidir por Gabriel)
- **Alta manual de hechos desde la pantalla de memoria**: moodiary tampoco la tiene (solo editar y borrar); los hechos entran por el chat.
- **Memoria compartida entre dispositivos**: exigiría guardarla en la base (tabla nueva por persona). Se dejó local por privacidad y por no tocar el esquema compartido; se puede hacer después si Gabriel lo quiere.
- **Catálogo remoto de modelos con su límite de contexto**: se reemplazó por el ajuste manual (D6).
- **Aviso de «cambio a un modelo con menos contexto»** (`modelSwitchSmallerContext`): sigue sin portarse junto con los demás avisos de cambio de modelo de la lane 298.
- **Prueba de pantalla y contra un proveedor real**: no se levantó ningún servidor (AGENTS.md regla 10) y no se escribieron pruebas automáticas nuevas (pedido de Gabriel); la memoria y la compactación no tienen cobertura propia, solo `tsc` y `eslint`. Queda para la prueba de pantalla de Gabriel.

## Arquitectura
- Puro (con pruebas): `src/lib/diario/asistente/{memoria,compactacion}.ts`; se amplían `herramientas.ts` (13 herramientas, `HERRAMIENTAS_MEMORIA`, `esHerramientaDelDiario`, resumen y repetición del resultado de `recallMemory`), `prompt.ts` (prompt de compactación), `agente.ts` (historial con resumen), `pedido.ts` (`memoria`), `sesiones.ts` (`compactada`, `Ajustes.memoria`, `Ajustes.contexto`, clave `memoria`).
- Navegador: `cliente.ts` (despacho local de memoria, `compactarConversacion`), `useAsistente.ts` (hechos, compactación automática y manual), `MemoriaAsistente.tsx` (pantalla), `AjustesAsistente.tsx` (interruptor, contexto), `AsistenteDiario.tsx` (botón, aviso de compactación), `TarjetaAprobacion.tsx` y `BurbujaChat.tsx` (herramientas de memoria).
- Servidor: `servidor-herramientas.ts` y la ruta `herramienta` rechazan las herramientas de memoria.

## Archivos en alcance
`src/lib/diario/asistente/**`, `src/components/diario/asistente/**`, `src/app/api/diario/asistente/herramienta/route.ts`, `vendor/moodiary/**` (nuevos fuentes copiados), `vendor/moodiary/ORIGEN.md`, `THIRD_PARTY_NOTICES.md`. Sin cambios en la base de datos.

## Microtareas
- [x] M1 · Vault (este documento) y fuentes copiadas a `vendor/moodiary` con trazabilidad.
- [x] M2 · Puro: `memoria.ts` (hechos, normalización, duplicados, búsqueda, tres operaciones en lote) + herramientas/definiciones/niveles/resumen. Sin pruebas nuevas (Gabriel, 2026-11-08: «no quiero pruebas, las hago yo»).
- [x] M3 · Puro: `compactacion.ts` (qué resumir, cuándo, mensajes del resumen, historial con resumen) + prompt. Sin pruebas nuevas.
- [x] M4 · Pedido y servidor: `memoria` en el pedido, rechazo de herramientas de memoria en el servidor, pruebas.
- [x] M5 · Interfaz (implementada por agy `gemini-3.8-flash-high` con el spec cerrado `SPEC_299_UI.md`; diff revisado completo y gates re-corridos por X7): hechos y compactación en `useAsistente`, `cliente`, pantalla de memoria, ajustes, aviso y botón de compactar, tarjetas de aprobación y fichas.
- [x] M6 · (PR #105, dev = f0d1ad5) · Gates (`tsc`, `eslint`, `npm test`), commit con paths explícitos, PR (`abrir-pr.sh`), integración (`gh pr merge N --merge`), `limpiar-lane.sh 299`, BACKLOG_PLANE («Próxima lane libre: 300») y REPOS_EXTERNOS («283–299»).

## Gates
`npx tsc --noEmit` · `npm test` · `npx eslint src/lib/diario src/app/api/diario src/components/diario src/app/dashboard/diario`. Sin servidores.

## Bitácora
- 2026-11-08 · claude · INICIO 299 (lectura de fuentes y decisiones; la lane se crea desde `dev` = `7e8e36b`).
- 2026-11-08 · claude · FIN 299: módulos puros `memoria.ts` y `compactacion.ts` + herramientas, pedido, sesiones, prompt y servidor (X7); interfaz por agy. Gates: tsc 0 · eslint 0 · suite existente 1273 (1234 ok, 39 saltadas, 0 fallas, corrida por `abrir-pr.sh`). Sin cambios de base de datos. PR #105 integrado, lane limpiada.
