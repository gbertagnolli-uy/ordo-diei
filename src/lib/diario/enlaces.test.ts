import { test } from "node:test";
import assert from "node:assert/strict";
import { sanearDocumento, textoPlanoDe, type NodoDoc } from "./contenido.ts";
import { MAX_ENLACES_POR_ENTRADA, idsDeEnlaces, rotuloDeEntrada } from "./enlaces.ts";

const enlace = (id: unknown, label: unknown = "Otra"): NodoDoc => ({ type: "diaryLink", attrs: { id, label } });
const doc = (...inline: NodoDoc[]): NodoDoc => ({ type: "doc", content: [{ type: "paragraph", content: inline }] });
const texto = (text: string): NodoDoc => ({ type: "text", text });

test("el saneador deja pasar un enlace y solo con sus atributos", () => {
  const limpio = sanearDocumento(doc(enlace("12", "Mi viaje")));
  assert.deepEqual(limpio.content![0].content![0], { type: "diaryLink", attrs: { id: "12", label: "Mi viaje" } });
});

test("el saneador acepta el id como número y lo pasa a texto", () => {
  assert.equal(sanearDocumento(doc(enlace(7))).content![0].content![0].attrs!.id, "7");
});

test("el saneador descarta atributos de más y rótulos larguísimos", () => {
  const n = sanearDocumento(doc({ type: "diaryLink", attrs: { id: "3", label: "x".repeat(201), mentionSuggestionChar: "[[", onclick: "x()" } })).content![0].content![0];
  assert.deepEqual(n.attrs, { id: "3", label: "" });
});

test("el saneador rechaza ids que no son una entrada", () => {
  for (const id of ["0", "012", "abc", "1; DROP", "", "1234567890123", null, undefined, -4, 1.5, {}]) {
    assert.throws(() => sanearDocumento(doc(enlace(id))), /Enlace a entrada inválido/, String(id));
  }
});

test("textoPlanoDe: el enlace aporta su rótulo en una sola línea", () => {
  assert.equal(textoPlanoDe(doc(texto("Ver "), enlace("5", "Mi  \n viaje"), texto(" luego"))), "Ver Mi viaje luego");
  assert.equal(textoPlanoDe(doc(enlace("5", ""))), "");
});

test("idsDeEnlaces: sin repetir, en orden y sin la propia entrada", () => {
  const d = {
    type: "doc",
    content: [
      { type: "paragraph", content: [enlace("4"), texto(" y "), enlace("2"), enlace("4")] },
      { type: "bulletList", content: [{ type: "listItem", content: [{ type: "paragraph", content: [enlace("9"), enlace("3")] }] }] },
    ],
  } satisfies NodoDoc;
  assert.deepEqual(idsDeEnlaces(d), [4, 2, 9, 3]);
  assert.deepEqual(idsDeEnlaces(d, 2), [4, 9, 3]);
});

test("idsDeEnlaces: ignora ids rotos y respeta el tope", () => {
  assert.deepEqual(idsDeEnlaces(doc(enlace("x"), enlace("0"), enlace("-1"), enlace("6"))), [6]);
  const muchos = doc(...Array.from({ length: MAX_ENLACES_POR_ENTRADA + 20 }, (_, i) => enlace(String(i + 1))));
  assert.equal(idsDeEnlaces(muchos).length, MAX_ENLACES_POR_ENTRADA);
});

test("rotuloDeEntrada: título, primera línea o aviso", () => {
  assert.equal(rotuloDeEntrada("  Un   viaje ", "texto"), "Un viaje");
  assert.equal(rotuloDeEntrada(null, "\n\n  Primera línea  \nSegunda"), "Primera línea");
  assert.equal(rotuloDeEntrada("", ""), "Entrada sin texto");
  const largo = rotuloDeEntrada("a".repeat(60), "");
  assert.equal(largo.length, 41);
  assert.ok(largo.endsWith("…"));
});
