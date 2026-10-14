import { test } from "node:test";
import assert from "node:assert/strict";
import { limpiarLatin, parsearLibro, textoLatin } from "./vulgata.ts";

const PS = `22:1 Psalmus David. [Dominus regit me, et nihil mihi deerit :/
22:2 in loco pascuæ, ibi me collocavit./ Super aquam refectionis educavit me ;/
3:1 Psalmus David, cum fugeret a facie Absalom filii sui.
3:2 [Domine, quid multiplicati sunt qui tribulant me ?]`;

test("limpiarLatin: ligadura œ, corchetes, cortes de línea y espacios tipográficos", () => {
  assert.equal(limpiarLatin("propter p\u009cnitentiam ;/ et <Sponsa>M\u009cror"), "propter pœnitentiam; et Mœror");
  assert.equal(limpiarLatin("[Quid est homo ?/ aut filius ?]\\"), "Quid est homo? aut filius?");
});

test("salmo: el título del versículo 1 se quita; si el 1 es solo título no hay cita", () => {
  const libro = parsearLibro(PS);
  assert.equal(textoLatin(libro, 22, 1, 2), "Dominus regit me, et nihil mihi deerit: in loco pascuæ, ibi me collocavit. Super aquam refectionis educavit me;");
  assert.equal(textoLatin(libro, 3, 2, 2), "Domine, quid multiplicati sunt qui tribulant me?");
  assert.ok(textoLatin(libro, 3, 1, 1)?.startsWith("Psalmus David, cum fugeret"));
});

test("textoLatin: falta un versículo → null", () => {
  assert.equal(textoLatin(parsearLibro(PS), 22, 1, 5), null);
  assert.equal(textoLatin(parsearLibro(PS), 99, 1, 1), null);
});
