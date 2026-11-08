import { test } from "node:test";
import assert from "node:assert/strict";
import { MAX_MENSAJES_PEDIDO, validarPedido } from "./pedido.ts";

const base = () => ({
  protocolo: "anthropic-messages",
  baseUrl: "https://api.anthropic.com/",
  apiKey: " sk-ant-prueba ",
  modelo: "claude-sonnet-5-5",
  sistema: "S",
  mensajes: [{ rol: "usuario", texto: "hola" }],
  herramientas: true,
  maxTokens: 999_999,
});

test("un pedido válido se limpia y trae las herramientas del servidor", () => {
  const p = validarPedido(base());
  assert.equal(p.baseUrl, "https://api.anthropic.com");
  assert.equal(p.apiKey, "sk-ant-prueba");
  assert.equal(p.maxTokens, 8192);
  assert.equal(p.protocolo, "anthropic-messages");
  assert.equal(p.herramientas.length, 10);
  assert.equal(validarPedido({ ...base(), herramientas: false }).herramientas.length, 0);
  assert.equal(validarPedido({ ...base(), maxTokens: 1 }).maxTokens, 16);
  assert.equal(validarPedido({ ...base(), maxTokens: undefined }).maxTokens, 8192);
});

test("el cliente no puede meter sus propias herramientas ni apuntar a redes internas", () => {
  assert.equal(validarPedido({ ...base(), herramientas: [{ nombre: "x" }] }).herramientas.length, 0);
  for (const baseUrl of ["http://api.anthropic.com", "https://127.0.0.1", "https://169.254.169.254", "https://localhost/v1", "https://u:p@x.com", ""]) {
    assert.throws(() => validarPedido({ ...base(), baseUrl }), Error, baseUrl);
  }
});

test("clave, modelo y mensajes inválidos", () => {
  assert.throws(() => validarPedido({ ...base(), apiKey: "" }));
  assert.throws(() => validarPedido({ ...base(), apiKey: "a\nb" }));
  assert.throws(() => validarPedido({ ...base(), apiKey: "k".repeat(401) }));
  assert.throws(() => validarPedido({ ...base(), modelo: "  " }));
  assert.throws(() => validarPedido({ ...base(), mensajes: [] }));
  assert.throws(() => validarPedido({ ...base(), mensajes: "x" }));
  assert.throws(() => validarPedido({ ...base(), mensajes: [{ rol: "asistente", texto: "x", llamadas: [] }] }), /empezar/);
  assert.throws(() => validarPedido({ ...base(), mensajes: [{ rol: "usuario", texto: "x" }, { rol: "sistema", texto: "x" }] }));
  assert.throws(() => validarPedido({ ...base(), mensajes: Array.from({ length: MAX_MENSAJES_PEDIDO + 1 }, () => ({ rol: "usuario", texto: "x" })) }));
  assert.throws(() => validarPedido({ ...base(), mensajes: [{ rol: "usuario", texto: "x".repeat(120_001) }] }));
  assert.throws(() => validarPedido(null));
});

test("llamadas a herramientas: solo las que existen", () => {
  const ok = validarPedido({
    ...base(),
    mensajes: [
      { rol: "usuario", texto: "x" },
      { rol: "asistente", texto: "", llamadas: [{ id: "a", nombre: "getDiary", args: '{"ids":[1]}' }] },
      { rol: "resultado", id: "a", nombre: "getDiary", texto: "id=1" },
    ],
  });
  assert.equal(ok.mensajes.length, 3);
  assert.throws(() => validarPedido({ ...base(), mensajes: [{ rol: "usuario", texto: "x" }, { rol: "asistente", texto: "", llamadas: [{ id: "a", nombre: "runJavascript", args: "{}" }] }] }), /desconocida/);
});
