import { test } from "node:test";
import assert from "node:assert/strict";
import { SEP_CUERPO } from "./torres-amat.ts";
import { parsearLibro } from "./vulgata.ts";
import { armarCitas, cerrarFrase, leerCorrecciones, modernizar, textoEspanol } from "./generar-frases.ts";
import { parsearSeleccion } from "./citas.ts";

test("modernizar: tildes de la edición, Christo y los guiones de aclaración", () => {
  assert.equal(modernizar("á los que ó fueron; é Israel; á tí"), "a los que o fueron; e Israel; a ti");
  assert.equal(modernizar("Jesu-Christo, mi Dios mió, dió"), "Jesucristo, mi Dios mío, dio");
  assert.equal(modernizar("Hé aquí al Señor — el que viene"), "He aquí al Señor el que viene");
  assert.equal(modernizar("el dia y la noche, tambien así"), "el día y la noche, también así");
  assert.equal(modernizar("mas que oro"), "mas que oro"); // «mas» es ambiguo: no se toca
});

test("cerrarFrase: un final «,» «;» «:» se cierra con punto", () => {
  assert.equal(cerrarFrase("no temeré mal:"), "no temeré mal.");
  assert.equal(cerrarFrase("¡Oh Señor!"), "¡Oh Señor!");
});

const CAP22 = new Map<number, string>([
  [1, `Salmo de David.${SEP_CUERPO}El Señor me pastorea, nada me faltará.`],
  [2, "Él me ha colocado en lugar de pastos:"],
  [3, "Convirtió á mi alma 12 ,"],
]);

test("textoEspanol: salmo con título aparte, notas y reemplazos de corrección", () => {
  assert.equal(textoEspanol(CAP22, 1, 2), "El Señor me pastorea, nada me faltará. Él me ha colocado en lugar de pastos.");
  assert.equal(textoEspanol(CAP22, 3, 3, [["alma", "ánima"]]), "Convirtió a mi ánima.");
  assert.throws(() => textoEspanol(CAP22, 3, 3, [["no está", "x"]]));
  assert.equal(textoEspanol(CAP22, 1, 5), null);
});

test("textoEspanol: un versículo cortado por un salto de página no se publica", () => {
  assert.equal(textoEspanol(new Map([[1, "Hirviendo está el pecho mío en sublimes pensamien-"]]), 1, 1), null);
});

test("correcciones: texto completo, reemplazos y omitir", () => {
  const c = leerCorrecciones("# c\nPs 1,1 == Texto nuevo\nPs 2,1-2 | a => b\nPs 2,1-2 | c => d\nPs 3,1 !! ilegible");
  assert.deepEqual(c.get("Ps 1,1"), { tipo: "texto", texto: "Texto nuevo" });
  assert.deepEqual(c.get("Ps 2,1-2"), { tipo: "reemplazos", pares: [["a", "b"], ["c", "d"]] });
  assert.deepEqual(c.get("Ps 3,1"), { tipo: "omitir", motivo: "ilegible" });
  assert.throws(() => leerCorrecciones("esto no es una corrección"));
});

test("armarCitas: arma la cita, respeta correcciones y explica lo que omite", () => {
  const vulgata = new Map([["Ps", parsearLibro("22:1 Psalmus David. [Dominus regit me, et nihil mihi deerit :/\n22:2 in loco pascuæ, ibi me collocavit./\n22:3 animam meam convertit./")]]);
  const ta = new Map([["Ps", new Map([[22, CAP22]])]]);
  const refs = parsearSeleccion("Ps 22,1-2\nPs 22,3\nPs 22,9\nPs 23,1");
  const { citas, omitidas } = armarCitas(refs, vulgata, ta, leerCorrecciones("Ps 22,3 !! prueba"));
  assert.equal(citas.length, 1);
  assert.equal(citas[0].id, "Ps-22-1-2");
  assert.equal(citas[0].ref, "Salmo 22, 1-2");
  assert.equal(citas[0].la, "Dominus regit me, et nihil mihi deerit: in loco pascuæ, ibi me collocavit.");
  assert.equal(citas[0].es, "El Señor me pastorea, nada me faltará. Él me ha colocado en lugar de pastos.");
  assert.deepEqual(omitidas.map((o) => o.ref), ["Ps 22,3", "Ps 22,9", "Ps 23,1"]);
});
