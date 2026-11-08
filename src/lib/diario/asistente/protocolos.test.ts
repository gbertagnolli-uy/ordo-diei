import { test } from "node:test";
import assert from "node:assert/strict";
import { LectorSse, construirPeticion, crearAnalizador, cabecerasDeModelos, direccionDeModelos, modelosDe, type EventoIA, type MensajeIA, type PedidoTurno } from "./protocolos.ts";

const herramienta = { nombre: "searchDiaries", descripcion: "Busca", esquema: { type: "object", properties: {} } };
const conversacion: MensajeIA[] = [
  { rol: "usuario", texto: "¿Qué hice el lunes?" },
  { rol: "asistente", texto: "Miro.", llamadas: [{ id: "t1", nombre: "searchDiaries", args: '{"startDate":"2026-11-02"}' }, { id: "t2", nombre: "diaryOverview", args: "" }] },
  { rol: "resultado", id: "t1", nombre: "searchDiaries", texto: "1 matches:\nid=4" },
  { rol: "resultado", id: "t2", nombre: "diaryOverview", texto: "Total entries=9" },
  { rol: "usuario", texto: "Gracias" },
];
const pedido = (p: Partial<PedidoTurno>): PedidoTurno => ({
  protocolo: "openai-completions",
  baseUrl: "https://api.example.com/v1/",
  apiKey: "sk-prueba",
  modelo: "m1",
  sistema: "SISTEMA",
  mensajes: conversacion,
  herramientas: [herramienta],
  maxTokens: 4096,
  ...p,
});

test("OpenAI: ruta, cabeceras, mensajes y herramientas", () => {
  const r = construirPeticion(pedido({}));
  assert.equal(r.url, "https://api.example.com/v1/chat/completions");
  assert.equal(r.headers.authorization, "Bearer sk-prueba");
  const b = r.body as Record<string, unknown>;
  assert.equal(b.stream, true);
  assert.equal(b.max_tokens, 4096);
  assert.equal(b.max_completion_tokens, undefined);
  const m = b.messages as Record<string, unknown>[];
  assert.deepEqual(m.map((x) => x.role), ["system", "user", "assistant", "tool", "tool", "user"]);
  assert.equal(m[0].content, "SISTEMA");
  const a = m[2] as { content: string; tool_calls: { id: string; function: { name: string; arguments: string } }[] };
  assert.equal(a.content, "Miro.");
  assert.deepEqual(a.tool_calls.map((t) => [t.id, t.function.name, t.function.arguments]), [["t1", "searchDiaries", '{"startDate":"2026-11-02"}'], ["t2", "diaryOverview", "{}"]]);
  assert.equal((m[3] as { tool_call_id: string }).tool_call_id, "t1");
  assert.deepEqual((b.tools as { type: string; function: { name: string } }[]).map((t) => [t.type, t.function.name]), [["function", "searchDiaries"]]);
});

test("OpenAI oficial usa max_completion_tokens", () => {
  const b = construirPeticion(pedido({ baseUrl: "https://api.openai.com/v1" })).body;
  assert.equal(b.max_completion_tokens, 4096);
  assert.equal(b.max_tokens, undefined);
});

test("sin herramientas no se manda el campo tools", () => {
  assert.equal("tools" in construirPeticion(pedido({ herramientas: [] })).body, false);
  assert.equal("tools" in construirPeticion(pedido({ herramientas: [], protocolo: "anthropic-messages" })).body, false);
});

test("Anthropic: ruta, cabeceras y resultados agrupados en un solo mensaje de usuario", () => {
  const r = construirPeticion(pedido({ protocolo: "anthropic-messages", baseUrl: "https://api.anthropic.com" }));
  assert.equal(r.url, "https://api.anthropic.com/v1/messages");
  assert.equal(r.headers["x-api-key"], "sk-prueba");
  assert.equal(r.headers["anthropic-version"], "2023-06-01");
  const b = r.body as { system: string; max_tokens: number; messages: { role: string; content: unknown }[]; tools: { name: string; input_schema: unknown }[] };
  assert.equal(b.system, "SISTEMA");
  assert.equal(b.max_tokens, 4096);
  assert.deepEqual(b.messages.map((x) => x.role), ["user", "assistant", "user", "user"]);
  assert.deepEqual(b.messages[1].content, [
    { type: "text", text: "Miro." },
    { type: "tool_use", id: "t1", name: "searchDiaries", input: { startDate: "2026-11-02" } },
    { type: "tool_use", id: "t2", name: "diaryOverview", input: {} },
  ]);
  assert.deepEqual(b.messages[2].content, [
    { type: "tool_result", tool_use_id: "t1", content: "1 matches:\nid=4" },
    { type: "tool_result", tool_use_id: "t2", content: "Total entries=9" },
  ]);
  assert.equal(b.messages[3].content, "Gracias");
  assert.deepEqual(b.tools[0].input_schema, herramienta.esquema);
});

test("Anthropic: un mensaje del asistente vacío no genera bloques vacíos", () => {
  const b = construirPeticion(pedido({ protocolo: "anthropic-messages", mensajes: [{ rol: "usuario", texto: "hola" }, { rol: "asistente", texto: "  ", llamadas: [] }, { rol: "usuario", texto: "?" }] })).body as { messages: unknown[] };
  assert.equal(b.messages.length, 2);
});

test("modelos: ruta, cabeceras y lectura de la respuesta", () => {
  assert.equal(direccionDeModelos("openai-completions", "https://x.com/v1/"), "https://x.com/v1/models");
  assert.equal(direccionDeModelos("anthropic-messages", "https://api.anthropic.com"), "https://api.anthropic.com/v1/models?limit=100");
  assert.deepEqual(cabecerasDeModelos("openai-completions", "k"), { authorization: "Bearer k" });
  assert.equal(cabecerasDeModelos("anthropic-messages", "k")["x-api-key"], "k");
  assert.deepEqual(modelosDe({ data: [{ id: "b" }, { id: "a" }, { id: "a" }, { nombre: "x" }, null] }), ["a", "b"]);
  assert.deepEqual(modelosDe({}), []);
  assert.deepEqual(modelosDe(null), []);
});

test("LectorSse: eventos partidos en trozos, CRLF y comentarios", () => {
  const l = new LectorSse();
  assert.deepEqual(l.alimentar("event: a\ndata: {\"x\""), []);
  assert.deepEqual(l.alimentar(":1}\n\nda"), [{ evento: "a", datos: '{"x":1}' }]);
  assert.deepEqual(l.alimentar("ta: uno\r\ndata: dos\r\n\r\n: latido\n\n"), [{ evento: "message", datos: "uno\ndos" }]);
  assert.deepEqual(l.alimentar("data: [DONE]"), []);
  assert.deepEqual(l.terminar(), [{ evento: "message", datos: "[DONE]" }]);
  assert.deepEqual(l.terminar(), []);
});

function correr(protocolo: "openai-completions" | "anthropic-messages", flujo: string): EventoIA[] {
  const lector = new LectorSse();
  const an = crearAnalizador(protocolo);
  const salida: EventoIA[] = [];
  for (const e of [...lector.alimentar(flujo), ...lector.terminar()]) salida.push(...an.evento(e));
  salida.push(...an.cierre());
  return salida;
}

test("OpenAI: texto, llamadas repartidas en trozos, uso y fin", () => {
  const sse = [
    { choices: [{ delta: { role: "assistant", content: "Hola " } }] },
    { choices: [{ delta: { content: "mundo" } }] },
    { choices: [{ delta: { tool_calls: [{ index: 0, id: "c1", function: { name: "searchDiaries", arguments: '{"que' } }] } }] },
    { choices: [{ delta: { tool_calls: [{ index: 0, function: { arguments: 'ry":"a"}' } }, { index: 1, id: "c2", function: { name: "diaryOverview", arguments: "" } }] } }] },
    { choices: [{ delta: {}, finish_reason: "tool_calls" }] },
    { choices: [], usage: { prompt_tokens: 100, completion_tokens: 20, prompt_tokens_details: { cached_tokens: 64 } } },
  ]
    .map((o) => `data: ${JSON.stringify(o)}\n\n`)
    .join("")
    .concat("data: [DONE]\n\n");
  assert.deepEqual(correr("openai-completions", sse), [
    { t: "texto", d: "Hola " },
    { t: "texto", d: "mundo" },
    { t: "llamada", id: "c1", nombre: "searchDiaries", args: '{"query":"a"}' },
    { t: "llamada", id: "c2", nombre: "diaryOverview", args: "{}" },
    { t: "uso", entrada: 100, salida: 20, cache: 64 },
    { t: "fin", motivo: "herramientas" },
  ]);
});

test("OpenAI: sin [DONE] el cierre igual termina, y 'length' es longitud", () => {
  const sse = `data: ${JSON.stringify({ choices: [{ delta: { content: "x" }, finish_reason: "length" }] })}\n\n`;
  assert.deepEqual(correr("openai-completions", sse), [
    { t: "texto", d: "x" },
    { t: "uso", entrada: 0, salida: 0, cache: 0 },
    { t: "fin", motivo: "longitud" },
  ]);
});

test("OpenAI: un error del proveedor corta el stream", () => {
  const evs = correr("openai-completions", `data: ${JSON.stringify({ error: { message: "clave inválida" } })}\n\n`);
  assert.deepEqual(evs, [{ t: "error", mensaje: "clave inválida" }]);
});

test("Anthropic: texto, herramienta con JSON por partes, uso y motivo", () => {
  const ev = (nombre: string, o: object) => `event: ${nombre}\ndata: ${JSON.stringify({ type: nombre, ...o })}\n\n`;
  const sse =
    ev("message_start", { message: { usage: { input_tokens: 10, cache_read_input_tokens: 5, cache_creation_input_tokens: 2, output_tokens: 1 } } }) +
    ev("content_block_start", { index: 0, content_block: { type: "text", text: "" } }) +
    ev("content_block_delta", { index: 0, delta: { type: "text_delta", text: "Veo" } }) +
    ev("content_block_stop", { index: 0 }) +
    ev("content_block_start", { index: 1, content_block: { type: "tool_use", id: "tu1", name: "getDiary" } }) +
    ev("content_block_delta", { index: 1, delta: { type: "input_json_delta", partial_json: '{"ids"' } }) +
    ev("content_block_delta", { index: 1, delta: { type: "input_json_delta", partial_json: ":[4]}" } }) +
    ev("content_block_stop", { index: 1 }) +
    ev("message_delta", { delta: { stop_reason: "tool_use" }, usage: { output_tokens: 33 } }) +
    ev("message_stop", {});
  assert.deepEqual(correr("anthropic-messages", sse), [
    { t: "texto", d: "Veo" },
    { t: "llamada", id: "tu1", nombre: "getDiary", args: '{"ids":[4]}' },
    { t: "uso", entrada: 17, salida: 33, cache: 5 },
    { t: "fin", motivo: "herramientas" },
  ]);
});

test("Anthropic: herramienta sin parámetros y error del proveedor", () => {
  const ev = (nombre: string, o: object) => `event: ${nombre}\ndata: ${JSON.stringify({ type: nombre, ...o })}\n\n`;
  const sin = ev("content_block_start", { index: 0, content_block: { type: "tool_use", id: "t", name: "diaryOverview" } }) + ev("content_block_stop", { index: 0 }) + ev("message_delta", { delta: { stop_reason: "end_turn" } }) + ev("message_stop", {});
  assert.deepEqual(correr("anthropic-messages", sin)[0], { t: "llamada", id: "t", nombre: "diaryOverview", args: "{}" });
  assert.deepEqual(correr("anthropic-messages", ev("error", { error: { type: "overloaded_error", message: "Sobrecargado" } })), [{ t: "error", mensaje: "Sobrecargado" }]);
  assert.deepEqual(correr("anthropic-messages", "data: no es json\n\n").at(-1), { t: "fin", motivo: "otro" });
});
