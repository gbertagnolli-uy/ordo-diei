---
lane: 298
titulo: Diario fase 4 — asistente de IA del diario personal (port de moodiary_assistant)
plane: "#31"
estado: integrada
rama: task/lane-298-diario-asistente
agente: claude
actualizado: 2026-11-08
---

# Lane 298 — Asistente del diario (moodiary_assistant)

Cuarta lane de la fase 4 del plan aprobado por Gabriel el 2026-11-08. Regla: se porta, no se «inspira» (memoria `clonar-es-portar-funciones`). El asistente de moodiary es el paquete más grande (≈16 000 líneas de Dart con pruebas); se parte en dos lanes: **298** (chat, proveedores, herramientas del diario, aprobaciones, sesiones, notas) y **299** (memoria a largo plazo + compactación de contexto).

## Fuentes leídas (2026-11-08)
- **moodiary** `2c552dd`, `packages/feature/moodiary_assistant`: `data/{assistant,assistant_defs,assistant_tools,impl/rig_assistant,model_resolver,llm_provider_repository}.dart`, `application/{tool_approval,diary_citation,chat_items,context_compaction_controller,session_title_controller,llm_provider_preset_controller}.dart`, modelos `moodiary_models/{assistant_provider_type,assistant_tool_call,chat_session,memory_entry}.dart`. La capa de presentación (`assistant_page` 2890 líneas, `chat_list`, `model_picker_sheet`, páginas de proveedor, memoria, notas) se revisó **por estructura** (clases, funciones, textos), no línea por línea: se rehace con los componentes de esta app. Lo dejo asentado para que Gabriel lo sepa.
- El motor de LLM de moodiary es un puente en Rust (`fast_core/rig`) que habla con los proveedores desde el teléfono. No hay equivalente web: se escribe un adaptador propio de los dos protocolos que usa la mayoría (Anthropic Messages y OpenAI chat-completions).

## Qué se porta (moodiary → esta app)
| moodiary | Esta app |
|---|---|
| `rigChatStream` (bucle de agente en Rust, `maxTurns` 12) | Bucle de agente **en el navegador** (`maxTurns` 12); el servidor es un proxy de streaming sin estado |
| `AssistantProviderType` openai-completions / anthropic-messages | Igual. `openai-responses` no se porta (ver fuera de alcance) |
| `AssistantToolRegistry` (searchDiaries, getDiary, diaryOverview, create/update/deleteDiary, list/create/update/deleteCategory) | `POST /api/diario/asistente/herramienta` con las mismas herramientas, mismas descripciones y esquemas (adaptados: ids numéricos, ánimo 1–5, categorías con padre), solo del **diario personal** de quien pregunta |
| `assistantToolTier` + `assistantToolNeedsConfirmation` + modos `confirm` / `auto` / `full` | Igual, portado tal cual en `asistente-herramientas.ts` con pruebas |
| `ToolApprovalGate` + `tool_approval_card` + `tool_approval_preview` | Tarjeta de aprobación en el chat; vence a los 5 min (= rechazo); «detener» rechaza lo pendiente |
| `buildStableSystemPrompt` + `buildTurnContext` | Mismas capas (identidad, reglas, política de recuperación, persona, notas del usuario, catálogo de herramientas) adaptadas a Ordo Diei |
| `[tools already run]` (`recordOf`) | Igual: se antepone al turno siguiente del asistente para no repetir búsquedas |
| `diary_citation` (`[diary:id]`, chips de citas) | Citas por entrada con chips «leída / creada / editada / borrada»; tocar abre la entrada |
| `session_title_controller` + `buildTitleSystemPrompt` + `normalizeSessionTitle` | Título automático de la sesión con el mismo prompt y la misma normalización |
| Sesiones (`ChatSession`) y lista agrupada (hoy / últimos / antes) | Lista de sesiones local, con las mismas agrupaciones |
| `assistant_notes_page` (notas ≤ 2000) | Notas para el asistente (máx. 2000 caracteres) |
| `permission_mode_sheet` | Selector de modo de permisos |
| Aviso inicial (`_DisclaimerGate`) | Aviso de privacidad que hay que aceptar antes del primer uso |
| Proveedores (`assistant_provider_*`) con presets | Proveedores guardados en el navegador, con presets estáticos (Anthropic, OpenAI, DeepSeek, Gemini, OpenRouter, Groq, Mistral, xAI, Moonshot) y proveedor propio por URL |

## Decisiones
- **D1 · Traer tu propia clave (BYOK)**: la clave de API de cada proveedor la pone el usuario; vive **solo en el `localStorage` del navegador** (como el almacenamiento seguro del teléfono en moodiary) y viaja en el cuerpo de cada pedido al proxy por HTTPS. El servidor no la guarda ni la registra. Riesgo asumido: un XSS en la app podría leerla (la app no renderiza HTML ajeno: el markdown de las respuestas va sin HTML crudo).
- **D2 · Solo el diario personal**: el asistente nunca lee ni escribe el diario familiar (hay otras personas, incluidos menores). Las herramientas ignoran cualquier `tipo` y usan siempre `personal` del actor de la sesión. Cada herramienta se ejecuta en el servidor con `actorDeSesion()`; el modelo no puede pedir datos de otro usuario.
- **D3 · Consentimiento explícito**: antes de usar el asistente se muestra qué sale del dispositivo (el texto de las entradas que el modelo lee con las herramientas, hacia el proveedor elegido por la persona) y hay que aceptar. Se guarda por dispositivo.
- **D4 · Historial solo local**: sesiones y mensajes se guardan en el `localStorage` del navegador, por usuario; no hay tablas nuevas ni se sube historial al servidor. Sin cambios de base de datos.
- **D5 · Proxy sin estado y con guardas**: `POST /api/diario/asistente/turno` exige sesión; recibe `{protocolo, baseUrl, apiKey, modelo, sistema, mensajes, herramientas, maxTokens}`, traduce al protocolo del proveedor y devuelve NDJSON normalizado (`texto`, `herramienta`, `uso`, `fin`, `error`). Guardas: solo `https`, sin credenciales en la URL, sin IP privada / loopback / link-local (resuelve DNS antes de conectar), sin redirecciones, tope de tamaño del cuerpo y de `maxTokens`, cancelación con la conexión del cliente.
- **D6 · Herramientas con ids numéricos**: moodiary usa uuid; acá los ids son enteros. Las líneas de resultado llevan `id=N` y las citas se extraen con `(?<![A-Za-z])id=(\d+)`.
- **D7 · Borrar una entrada es permanente** en esta app (no hay papelera). En moodiary `deleteDiary` manda a la papelera y es nivel «escritura»; acá `deleteDiary` es nivel **destructivo** (pide confirmación también en modo `auto`) y la descripción de la herramienta dice que es permanente.
- **D8 · Ánimo**: 1–5 (muy mal … muy bien) con los nombres de la escala del usuario (`nombreDeNivel`); el esquema de las herramientas usa `animo` entero 1–5 en vez de las cinco palabras de moodiary.
- **D9 · Categorías jerárquicas**: `listCategories` muestra el padre; `createCategory` / `updateCategory` aceptan `padreId`. `deleteCategory` respeta las reglas del catálogo (sin entradas ni subcategorías).
- **D10 · Markdown → documento**: el modelo escribe Markdown; el **navegador** lo convierte al documento del editor con el mismo conversor de la importación (lane 292, `markdown-a-doc.ts`, el propio editor sin pantalla) y manda `doc` junto a cada elemento de `createDiary` / `updateDiary`; el servidor lo vuelve a sanear con `validarEntrada`. Si no hay documento, la entrada queda en texto plano. El editor se carga con `import()` solo cuando hace falta.
- **D11 · Prompt**: se mantiene en inglés como en moodiary (los modelos responden en el idioma de la persona) con la instrucción explícita de responder en el idioma del usuario; se cambian las referencias (Moodiary → Ordo Diei, papelera, escala).

## Fuera de esta lane, con motivo (a decidir por Gabriel)
- **Memoria a largo plazo** (`recallMemory`, `rememberFact`, `forgetFact`, lista de memorias, interruptor) y **compactación de contexto**: van en la **lane 299**.
- **`runJavascript`** (sandbox QuickJS): no se porta; ejecutar código generado por un modelo en el navegador de la familia es superficie de ataque y las cuentas las puede hacer el modelo o las herramientas de resumen.
- **Búsqueda semántica** (`EmbedIndexService`, vectores locales): no hay índice de vectores en esta app; `searchDiaries` usa la búsqueda por palabras ya portada en la lane 285 (modo `mode` fijo en palabras).
- **Imágenes en el chat** (adjuntar foto, `attachment`): no se porta en esta lane.
- **Razonamiento / niveles de «pensamiento»** (`effort` / `budget_tokens`, «pensando…», `thoughtFor`): depende de cada modelo y del catálogo remoto de moodiary; no se porta.
- **Protocolo `openai-responses`**: solo `openai-completions` y `anthropic-messages` (cubren todos los proveedores de los presets).
- **Catálogo remoto de modelos** (`LlmPresetRepository`, `model_picker_sheet` con capacidades): presets estáticos y modelo escrito a mano (más listado de modelos del proveedor si lo ofrece).
- **Avisos de cambio de modelo** (`AssistantModelSwitchNotice`), **compositor a pantalla completa**, **botón regenerar / continuar**: se porta lo esencial (regenerar y continuar sí; avisos de cambio y pantalla completa, no).
- **Etiquetas, lugares, clima, fotos** como herramientas: moodiary no los tiene en el asistente; no se agregan.
- **«Preguntar al asistente por esta entrada»** (moodiary `citeDiary` desde el detalle de una entrada): el módulo de citas está portado y probado (`citarEntrada`, `separarCita`), pero no hay todavía un botón en las tarjetas de entrada; el chat sí muestra y abre las citas de lo que el asistente leyó, creó, editó o borró.
- **Un solo asistente por pestaña con una conversación a la vez**: no se puede escribir en otra conversación mientras una responde (moodiary tampoco lo permite).
- **Proxy abierto a hosts públicos**: cualquier persona con sesión puede usar `/api/diario/asistente/turno` para mandar un JSON de chat a un host https público; no hay límite de uso por persona (solo autenticación, tope de tamaño y de tiempo). Si hace falta, se agrega un límite por usuario.
- **Sin prueba de pantalla ni contra un proveedor real**: no se levantan servidores ni se usan claves; la traducción de protocolos y el streaming están probados con respuestas simuladas.

## Arquitectura
- Puro (con pruebas): `src/lib/diario/asistente/{protocolos,herramientas,formato,prompt,citas,titulo,sesiones,proveedores,pedido,agente}.ts` (el bucle del agente `agente.ts` recibe el modelo, las herramientas y la aprobación como dependencias).
- Servidor: `src/lib/diario/asistente/servidor-herramientas.ts` (ejecuta las herramientas) y `servidor-proxy.ts` (guardas + fetch + traducción de streaming); rutas `/api/diario/asistente/{turno,herramienta,modelos}`.
- Interfaz: `src/components/diario/asistente/*` (`AsistenteDiario`, `useAsistente`, `cliente`, `BurbujaChat`, `MarkdownChat`, `TarjetaAprobacion`, `ProveedoresAsistente`, `AjustesAsistente`, `ListaSesiones`) y el botón «Asistente» en `DiarioVista` (solo en el diario personal, cargado con `next/dynamic`).

## Archivos en alcance
`src/lib/diario/asistente/*` · `src/app/api/diario/asistente/*` · `src/components/diario/asistente/*` · `src/components/diario/DiarioVista.tsx` · `vendor/moodiary/*` · `THIRD_PARTY_NOTICES.md`

## Microtareas
- [x] M1 · Leer las fuentes (datos y aplicación completas; presentación por estructura).
- [x] M2 · Copiar fuentes a `vendor/moodiary`, ampliar `ORIGEN.md` y `THIRD_PARTY_NOTICES.md`.
- [x] M3 · Puro: protocolos (conversión + SSE), herramientas (niveles, permisos, esquemas), prompt, citas, título, markdown → documento, almacén de sesiones. Con pruebas.
- [x] M4 · Servidor: ejecución de herramientas, proxy de streaming con guardas, rutas.
- [x] M5 · Interfaz: chat con bucle de agente, proveedores, aprobaciones, sesiones, notas, aviso, botón en el diario.
- [x] M6 · Gates, PR, integración y limpieza (PR #104, dev = 7e8e36b).
- [ ] M7 · Prueba de pantalla con una clave real: Gabriel (AGENTS.md regla 10).

## Gates
`npx tsc --noEmit` · `npm test` · `npx eslint src/lib/diario src/app/api/diario src/components/diario src/app/dashboard/diario`

## Bitácora
- 2026-11-08 · claude · INICIO 298 (lectura de fuentes y decisiones; la lane se crea desde `dev` = `eab13db`).
- 2026-11-08 · claude · Hecho: módulos puros con 63 pruebas nuevas (protocolos y streaming de Anthropic / OpenAI, herramientas y permisos, formato de resultados, prompt, citas, título, sesiones, proveedores y guardas de URL, validación del pedido, bucle del agente), servidor (`servidor-herramientas`, `servidor-proxy` con IP validada al conectar, rutas `turno` / `herramienta` / `modelos`), interfaz del chat y botón en el diario. Sin cambios de base de datos. Gates: tsc 0 · eslint 0 · npm test 1273 (1234 ok, 39 saltadas, 0 fallas).
