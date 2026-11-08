import { test } from "node:test";
import assert from "node:assert/strict";
import { citaEntradas, citarEntrada, citaParaElModelo, citasDe, separarCita, tipoDeCita } from "./citas.ts";
import { contextoDelTurno, ensamblar, mensajeParaTitular, promptDeSistema } from "./prompt.ts";
import { mensajeDeTitulo, normalizarTitulo } from "./titulo.ts";

const llamada = (nombre: string, resultado: string, hecha = true) => ({ id: nombre, nombre, args: "{}", resultado, hecha });

test("citas: una por entrada, con el tipo más fuerte", () => {
  const cs = citasDe([
    llamada("searchDiaries", "3 matches:\nid=10 【2026-01-02】A mood=Bien categoryId=4\nid=11 【2026-01-03】B\n"),
    llamada("updateDiary", "Updated \"A\" (id=10)."),
    llamada("deleteDiary", "Deleted entry (id=12)."),
    llamada("listCategories", "id=99 name=X"),
  ]);
  assert.deepEqual(cs, [
    { id: 10, tipo: "editada" },
    { id: 11, tipo: "leida" },
    { id: 12, tipo: "borrada" },
  ]);
});

test("citas: ignora categoryId, líneas fallidas y llamadas sin terminar", () => {
  assert.deepEqual(citasDe([llamada("getDiary", "Failed: none of those ids match a diary (id=5)."), llamada("searchDiaries", "x categoryId=7 parentId=8", true), llamada("createDiary", "Created id=3", false)]), []);
  assert.equal(citaEntradas(llamada("createDiary", "Created \"A\" (2026-01-01), id=3.")), true);
  assert.equal(citaEntradas(llamada("listCategories", "id=3 name=A")), false);
  assert.equal(citaEntradas(llamada("getDiary", "Not found: 4", true)), false);
  assert.equal(tipoDeCita("createDiary"), "creada");
  assert.equal(tipoDeCita("diaryOverview"), undefined);
});

test("cita adjunta a la pregunta: se separa y se traduce para el modelo", () => {
  const t = citarEntrada("¿Qué dije acá?", 42);
  assert.equal(t, "[diary:42]\n¿Qué dije acá?");
  assert.deepEqual(separarCita(t), { id: 42, texto: "¿Qué dije acá?" });
  assert.deepEqual(separarCita("hola"), { id: null, texto: "hola" });
  assert.deepEqual(separarCita("[diary:abc]\nx"), { id: null, texto: "[diary:abc]\nx" });
  assert.deepEqual(separarCita("[diary:5"), { id: null, texto: "[diary:5" });
  assert.match(citaParaElModelo(t), /^The user is asking about the diary entry with id=42\. Read it with getDiary before answering\.\n\n¿Qué dije acá\?$/);
  assert.equal(citaParaElModelo("hola"), "hola");
});

test("prompt: capas ordenadas, notas dentro del marco y política según la memoria", () => {
  const p = promptDeSistema({ herramientas: true, memoria: false, notas: "  Tratame de vos.  ", confirmaEscrituras: true });
  const i = (s: string) => p.indexOf(s);
  assert.ok(i("built-in assistant") < i("Ground rules") && i("Ground rules") < i("Memory and retrieval policy") && i("Memory and retrieval policy") < i("warm, grounded companion"));
  assert.ok(i("warm, grounded companion") < i("Tratame de vos.") && i("Tratame de vos.") < i("Tool guidelines"));
  assert.match(p, /may pause until the user confirms/);
  assert.match(p, /Long-term memory is turned off/);
  assert.doesNotMatch(p, /\{tools\}/);
  const libre = promptDeSistema({ herramientas: true, memoria: true });
  assert.match(libre, /Every tool runs immediately/);
  assert.match(libre, /recallMemory/);
  assert.doesNotMatch(libre, /The user wrote these notes/);
  const sinHerramientas = promptDeSistema({ herramientas: false, memoria: false });
  assert.doesNotMatch(sinHerramientas, /Tool guidelines|Memory and retrieval/);
  assert.equal(ensamblar([{ nombre: "a", orden: 2, texto: "B" }, { nombre: "b", orden: 1, texto: "A" }, { nombre: "c", orden: 0, texto: "  " }]), "A\n\nB");
});

test("las notas del usuario se recortan al máximo", () => {
  const p = promptDeSistema({ herramientas: false, memoria: false, notas: "x".repeat(5000) });
  assert.ok(p.includes("x".repeat(2000)) && !p.includes("x".repeat(2001)));
});

test("contexto del turno con hora local", () => {
  assert.equal(contextoDelTurno(new Date(2026, 10, 8, 9, 5)), "(Context for this turn — not part of the user's message.)\nCurrent local time: 2026-11-08 09:05.");
  assert.match(contextoDelTurno(new Date(2026, 0, 1, 0, 0), 3), /Saved facts: 3\./);
});

test("título: primera línea con texto, sin controles ni <think>, y con tope de bytes", () => {
  assert.equal(normalizarTitulo("<think>pienso\nmucho</think>\n\n  Viaje   a  Salto ​\nsegunda"), "Viaje a Salto");
  assert.equal(normalizarTitulo("\n\n"), "");
  assert.equal(normalizarTitulo("ñ".repeat(100), 10), "ñññññ");
  assert.equal(normalizarTitulo("Hola\u0007 mundo"), "Hola mundo");
});

test("título: se manda el primer mensaje como JSON y no se titula lo vacío o enorme", () => {
  assert.equal(mensajeDeTitulo("   "), null);
  assert.equal(mensajeDeTitulo("a".repeat(5000)), null);
  assert.equal(mensajeDeTitulo('dijo "hola"'), mensajeParaTitular('dijo "hola"'));
  assert.match(mensajeDeTitulo("hola") ?? "", /JSON array of user messages:\n\["hola"\]$/);
});

test("rótulo de una cita: fecha y título según la herramienta que la nombró", async () => {
  const { rotuloDeCita } = await import("./citas.ts");
  const l = (nombre: string, resultado: string) => ({ id: nombre, nombre, args: "{}", resultado, hecha: true });
  assert.equal(rotuloDeCita(7, [l("searchDiaries", "2 matches:\nid=7 【2026-11-02】Playa mood=Bien (4) categoryId=3\nhola\n\nid=8 【2026-11-03】 mood=not recorded")]), "2026-11-02 · Playa");
  assert.equal(rotuloDeCita(8, [l("searchDiaries", "id=8 【2026-11-03】Untitled mood=not recorded")]), "2026-11-03 · Untitled");
  assert.equal(rotuloDeCita(9, [l("getDiary", "id=9\ndate=2026-10-01\ntitle=Cumple\nmood=Bien (4)\nbody:\nx")]), "2026-10-01 · Cumple");
  assert.equal(rotuloDeCita(10, [l("createDiary", 'Created "Nueva" (2026-11-08), id=10.')]), "2026-11-08 · Nueva");
  assert.equal(rotuloDeCita(11, [l("deleteDiary", 'Deleted "Vieja" (id=11). It is gone for good.')]), "Vieja");
  assert.equal(rotuloDeCita(99, [l("searchDiaries", "id=7 【2026-11-02】A mood=x")]), "Entrada 99");
});
