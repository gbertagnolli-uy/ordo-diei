import { test } from "node:test";
import assert from "node:assert/strict";
import { esEmoji, haceCuanto, limpiarComentario, MAX_COMENTARIO } from "./comentarios.ts";

test("limpiarComentario: recorta, junta saltos y rechaza vacío o excesivo", () => {
  assert.equal(limpiarComentario("  Muy bien  "), "Muy bien");
  assert.equal(limpiarComentario("uno\n\n\n\ndos"), "uno\n\ndos");
  assert.equal(limpiarComentario("uno   \r\ndos"), "uno\ndos");
  for (const x of ["", "   ", "\n", null, undefined, 5]) assert.equal(limpiarComentario(x), null, String(x));
  assert.equal(limpiarComentario("a".repeat(MAX_COMENTARIO)), "a".repeat(MAX_COMENTARIO));
  assert.equal(limpiarComentario("a".repeat(MAX_COMENTARIO + 1)), null);
});

test("esEmoji: solo 👍 ❤️ 🙏", () => {
  for (const e of ["👍", "❤️", "🙏"]) assert.equal(esEmoji(e), true);
  for (const e of ["😂", "", "like", null]) assert.equal(esEmoji(e), false);
});

test("haceCuanto", () => {
  const ahora = Date.parse("2026-10-16T12:00:00Z");
  const hace = (seg: number) => haceCuanto(new Date(ahora - seg * 1000).toISOString(), ahora);
  assert.deepEqual([hace(10), hace(300), hace(7200), hace(100000), hace(3 * 86400)], ["recién", "hace 5 min", "hace 2 h", "ayer", "hace 3 días"]);
});
