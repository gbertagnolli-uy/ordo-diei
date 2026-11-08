import { test } from "node:test";
import assert from "node:assert/strict";
import { textoPlanoDe, type NodoDoc } from "./contenido.ts";
import {
  agregarADocumento,
  diaValido,
  docDeCompartido,
  hayCompartido,
  leerCompartido,
  markdownParaCompartir,
  nombreDeCompartido,
  vistaPreviaCompartida,
} from "./compartido.ts";
import { MAX_TEXTO, MAX_TITULO } from "./reglas.ts";

const IMG = "/api/archivos/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const base = { fecha: "2026-11-08", hora: 8 * 60 + 5, titulo: null, texto: "Hola", contenido: null, animo: null, categoria: null, etiquetas: [] as string[] };
const params = (o: Record<string, string>) => new URLSearchParams(o);

test("el Markdown para compartir lleva título, una línea de datos y el cuerpo", () => {
  const md = markdownParaCompartir({ ...base, titulo: "Un día", animo: "Muy bien", categoria: "Fe", etiquetas: ["misa", "familia"], texto: "Fuimos a misa." });
  assert.equal(md, "# Un día\n\n*2026-11-08 08:05 · Muy bien · Fe · #misa · #familia*\n\nFuimos a misa.\n");
});

test("sin título ni datos extra queda la línea de fecha y el texto", () => {
  assert.equal(markdownParaCompartir(base), "*2026-11-08 08:05*\n\nHola\n");
});

test("el Markdown del documento conserva el formato y no lleva imágenes", () => {
  const contenido: NodoDoc = {
    type: "doc",
    content: [
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Título" }] },
      { type: "paragraph", content: [{ type: "text", text: "negrita", marks: [{ type: "bold" }] }] },
      { type: "image", attrs: { src: IMG } },
      { type: "bulletList", content: [{ type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "uno" }] }] }] },
    ],
  };
  const md = markdownParaCompartir({ ...base, contenido });
  assert.match(md, /## Título/);
  assert.match(md, /\*\*negrita\*\*/);
  assert.match(md, /- uno/);
  assert.ok(!md.includes(IMG) && !md.includes("!["));
});

test("el nombre del archivo", () => {
  assert.equal(nombreDeCompartido("2026-11-08", 8 * 60 + 5, "png"), "diario-2026-11-08-0805.png");
  assert.equal(nombreDeCompartido("2026-01-02", 23 * 60 + 59, "md"), "diario-2026-01-02-2359.md");
});

// ── Lo que llega desde otra app ──────────────────────────────────────────────

test("se lee el título y el texto compartidos", () => {
  assert.deepEqual(leerCompartido(params({ title: "  Una   nota ", text: "Hola\r\nmundo" })), { titulo: "Una nota", texto: "Hola\nmundo" });
});

test("el enlace aparte se agrega al final, y si ya está en el texto no se repite", () => {
  assert.equal(leerCompartido(params({ text: "Mirá esto", url: "https://ejemplo.com/a" })).texto, "Mirá esto\nhttps://ejemplo.com/a");
  assert.equal(leerCompartido(params({ text: "Mirá https://ejemplo.com/a", url: "https://ejemplo.com/a" })).texto, "Mirá https://ejemplo.com/a");
  assert.equal(leerCompartido(params({ url: "https://ejemplo.com/a" })).texto, "https://ejemplo.com/a");
});

test("lo compartido se acota al largo que admite una entrada", () => {
  const c = leerCompartido(params({ title: "t".repeat(500), text: "x".repeat(MAX_TEXTO + 5000) }));
  assert.equal(c.titulo?.length, MAX_TITULO);
  assert.ok(c.texto.length <= MAX_TEXTO);
});

test("sin parámetros no hay nada compartido", () => {
  const c = leerCompartido(params({}));
  assert.deepEqual(c, { titulo: null, texto: "" });
  assert.equal(hayCompartido(c), false);
  assert.equal(hayCompartido({ titulo: "algo", texto: "" }), true);
});

test("los enlaces del texto compartido quedan activos, sin el signo de cierre", () => {
  const doc = docDeCompartido("Mirá https://ejemplo.com/a, está bueno.\n\nFin");
  assert.equal(doc.content?.length, 3);
  const [uno, vacio, tres] = doc.content!;
  assert.deepEqual(
    uno.content?.map((n) => n.text),
    ["Mirá ", "https://ejemplo.com/a", ", está bueno."],
  );
  assert.deepEqual(uno.content?.[1].marks, [{ type: "link", attrs: { href: "https://ejemplo.com/a" } }]);
  assert.equal(vacio.content, undefined);
  assert.equal(tres.content?.[0].text, "Fin");
  assert.equal(textoPlanoDe(doc), "Mirá https://ejemplo.com/a, está bueno.\n\nFin");
});

test("agregar a una entrada que ya existe suma párrafos al final", () => {
  const conFormato = agregarADocumento({ contenido: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "antes" }] }] }, texto: "antes" }, "nuevo");
  assert.equal(textoPlanoDe(conFormato), "antes\nnuevo");
  const plana = agregarADocumento({ contenido: null, texto: "uno\ndos" }, "tres");
  assert.equal(textoPlanoDe(plana), "uno\ndos\ntres");
});

test("el día tiene que existir, ser de 2000 en adelante y no haber pasado de hoy", () => {
  assert.equal(diaValido("2026-11-08", "2026-11-08"), true);
  assert.equal(diaValido("2026-11-09", "2026-11-08"), false);
  assert.equal(diaValido("1999-12-31", "2026-11-08"), false);
  assert.equal(diaValido("2026-02-30", "2026-11-08"), false);
  assert.equal(diaValido("hoy", "2026-11-08"), false);
  assert.equal(diaValido("2000-01-01", "2026-11-08"), true);
});

test("la vista previa corta las líneas de más", () => {
  assert.equal(vistaPreviaCompartida({ titulo: null, texto: "a\nb\nc" }, 6), "a\nb\nc");
  assert.equal(vistaPreviaCompartida({ titulo: null, texto: "a\nb\nc\nd" }, 2), "a\nb\n…");
});
