import { test } from "node:test";
import assert from "node:assert/strict";
import { sanearDocumento, textoPlanoDe } from "./contenido.ts";
import {
  FORMATO_FECHA,
  MAX_NOMBRE_PLANTILLA,
  SEMILLA_PLANTILLAS,
  cuandoDe,
  formatear,
  fusionarEtiquetas,
  poblar,
  poblarDocumento,
  validarPlantilla,
} from "./plantillas.ts";

// Domingo 8 de noviembre de 2026, 14:05 (hora local)
const CUANDO = new Date(2026, 10, 8, 14, 5, 9);

test("poblar: {{date}} y {{time}} con el formato predeterminado", () => {
  assert.equal(poblar("{{date}} - {{time}}:", CUANDO), "8/11/2026 - 14:05:");
  assert.equal(poblar("sin variables", CUANDO), "sin variables");
});

test("poblar: formato propio, en español", () => {
  assert.equal(poblar("{{date:yyyy-MM-dd}}", CUANDO), "2026-11-08");
  assert.equal(poblar("{{time:HH:mm:ss}}", CUANDO), "14:05:09");
  assert.equal(poblar("{{date:EEEE d 'de' MMMM}}", CUANDO), "domingo 8 de noviembre");
  assert.equal(poblar("{{time:h:mm a}}", CUANDO).startsWith("2:05"), true);
});

test("poblar: variables desconocidas intactas y formato que no se puede aplicar vuelve al predeterminado", () => {
  assert.equal(poblar("{{nombre}} {{date}}", CUANDO), "{{nombre}} 8/11/2026");
  assert.equal(poblar("{{date:YYYY-DD}}", CUANDO), "8/11/2026");
  assert.equal(poblar("{{time:}}", CUANDO), "{{time:}}"); // sin formato real no es una variable con formato
  assert.equal(formatear(CUANDO, "   ", FORMATO_FECHA), "8/11/2026");
});

test("poblar: varias variables en el mismo texto", () => {
  assert.equal(poblar("{{date}} {{date:dd/MM}} {{time}}", CUANDO), "8/11/2026 08/11 14:05");
});

test("poblarDocumento reemplaza dentro del texto y no toca el original", () => {
  const doc = sanearDocumento({
    type: "doc",
    content: [
      { type: "paragraph", content: [{ type: "text", text: "Hoy es " }, { type: "text", text: "{{date}}", marks: [{ type: "bold" }] }] },
      { type: "paragraph", content: [{ type: "text", text: "a las {{time}}" }] },
    ],
  });
  const r = poblarDocumento(doc, CUANDO);
  assert.equal(textoPlanoDe(r), "Hoy es 8/11/2026\na las 14:05");
  assert.equal(textoPlanoDe(doc), "Hoy es {{date}}\na las {{time}}");
  assert.deepEqual(r.content?.[0].content?.[1].marks, [{ type: "bold" }]);
});

test("cuandoDe arma la fecha y hora local de la entrada", () => {
  const d = cuandoDe("2026-03-09", 7 * 60 + 30);
  assert.equal(poblar("{{date:yyyy-MM-dd}} {{time}}", d), "2026-03-09 07:30");
  assert.equal(poblar("{{time}}", cuandoDe("2026-03-09", 0)), "00:00");
  assert.equal(poblar("{{time}}", cuandoDe("2026-03-09", 1439)), "23:59");
});

test("validarPlantilla: normaliza el nombre y deriva el texto", () => {
  const p = validarPlantilla({
    nombre: "  Mi   plantilla ",
    contenido: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Hola {{date}}" }] }] },
  });
  assert.equal(p.nombre, "Mi plantilla");
  assert.equal(p.texto, "Hola {{date}}");
  assert.ok(!("etiquetas" in p) && !("predeterminada" in p));
});

test("validarPlantilla: contenido vacío o ausente es válido; etiquetas y predeterminada solo si vienen", () => {
  const vacia = validarPlantilla({ nombre: "Vacía" });
  assert.equal(vacia.texto, "");
  assert.equal(vacia.contenido.type, "doc");
  const p = validarPlantilla({ nombre: "A", contenido: null, etiquetas: [3, 1, 3], predeterminada: true });
  assert.deepEqual(p.etiquetas, [3, 1]);
  assert.equal(p.predeterminada, true);
  assert.deepEqual(validarPlantilla({ nombre: "A", etiquetas: [] }).etiquetas, []);
});

test("validarPlantilla rechaza lo inválido", () => {
  const malos: Record<string, unknown>[] = [
    {},
    { nombre: "   " },
    { nombre: "x".repeat(MAX_NOMBRE_PLANTILLA + 1) },
    { nombre: 3 },
    { nombre: "A", etiquetas: "1" },
    { nombre: "A", etiquetas: [0] },
    { nombre: "A", etiquetas: ["1"] },
    { nombre: "A", etiquetas: Array.from({ length: 51 }, (_, i) => i + 1) },
    { nombre: "A", predeterminada: "si" },
    { nombre: "A", contenido: { type: "script" } },
    { nombre: "A", contenido: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "x", marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }] }] }] } },
  ];
  for (const m of malos) assert.throws(() => validarPlantilla(m), Error, JSON.stringify(m).slice(0, 80));
});

test("las 3 plantillas de ejemplo son válidas y llevan el texto de Daily You", () => {
  assert.deepEqual(SEMILLA_PLANTILLAS.map((s) => s.nombre), ["Fecha y hora", "Resumen del día", "Reflexión"]);
  for (const s of SEMILLA_PLANTILLAS) assert.doesNotThrow(() => validarPlantilla({ nombre: s.nombre, contenido: s.contenido }), s.nombre);
  assert.equal(textoPlanoDe(SEMILLA_PLANTILLAS[0].contenido), "{{date}} - {{time}}:");
  assert.equal(textoPlanoDe(SEMILLA_PLANTILLAS[1].contenido), "Resumen\n\nCita\n");
  assert.match(textoPlanoDe(SEMILLA_PLANTILLAS[2].contenido), /¿Qué te gustó hoy\?[\s\S]*¿Por qué estás agradecido\/a\?[\s\S]*¿Qué estás esperando\?/);
  assert.equal(poblar(textoPlanoDe(SEMILLA_PLANTILLAS[0].contenido), CUANDO), "8/11/2026 - 14:05:");
});

const ETIQUETAS = [
  { id: 1, nombre: "Misa", tipo: "etiqueta" as const, grupoId: null },
  { id: 2, nombre: "Feliz", tipo: "etiqueta" as const, grupoId: 10 },
  { id: 3, nombre: "Triste", tipo: "etiqueta" as const, grupoId: 10 },
  { id: 4, nombre: "Energía", tipo: "contador" as const, grupoId: null },
  { id: 5, nombre: "Familia", tipo: "etiqueta" as const, grupoId: 11 },
  { id: 6, nombre: "Amigos", tipo: "etiqueta" as const, grupoId: 11 },
];
const GRUPOS = [
  { id: 10, nombre: "Sentimientos", seleccionUnica: true },
  { id: 11, nombre: "Personas", seleccionUnica: false },
];

test("fusionarEtiquetas suma las de la plantilla sin repetir ni pisar", () => {
  const r = fusionarEtiquetas([{ id: 1, valor: null }], [1, 5, 6], ETIQUETAS, GRUPOS);
  assert.deepEqual(r.map((x) => x.id), [1, 5, 6]);
});

test("fusionarEtiquetas omite contadores, inexistentes y respeta la selección única", () => {
  assert.deepEqual(fusionarEtiquetas([], [4, 99, 1], ETIQUETAS, GRUPOS).map((x) => x.id), [1]);
  // el grupo de selección única ya tiene una: no se agrega la de la plantilla
  assert.deepEqual(fusionarEtiquetas([{ id: 3, valor: null }], [2], ETIQUETAS, GRUPOS).map((x) => x.id), [3]);
  // la plantilla trae dos del mismo grupo de selección única: entra la primera
  assert.deepEqual(fusionarEtiquetas([], [2, 3], ETIQUETAS, GRUPOS).map((x) => x.id), [2]);
});

test("fusionarEtiquetas conserva el valor de las ya puestas y no modifica la lista original", () => {
  const original = [{ id: 4, valor: "7" }];
  const r = fusionarEtiquetas(original, [1], ETIQUETAS, GRUPOS);
  assert.deepEqual(r, [{ id: 4, valor: "7" }, { id: 1, valor: null }]);
  assert.equal(original.length, 1);
});
