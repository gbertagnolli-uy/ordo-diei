import { test } from "node:test";
import assert from "node:assert/strict";
import { compararNatural, filtrarLibros, formatoDe, ordenarPistas, porcentajeValido, siguienteEstado, validarLibro } from "./reglas.ts";

test("formatoDe: por extensión y, si no, por MIME", () => {
  assert.equal(formatoDe("El Principito.EPUB"), "epub");
  assert.equal(formatoDe("capitulo 1.mp3"), "mp3");
  assert.equal(formatoDe("sin-extension", "application/pdf"), "pdf");
  assert.equal(formatoDe("libro", "audio/mp4; codecs=mp4a"), "m4a");
  assert.equal(formatoDe("Novela.mobi"), "mobi");
  assert.equal(formatoDe("Novela.azw"), "azw");
  assert.equal(formatoDe("Novela.azw3"), "azw3");
  assert.equal(formatoDe("Comic.cbz"), "cbz");
  assert.equal(formatoDe("Comic.cbr"), "cbr");
  assert.equal(formatoDe("Libro.fb2"), "fb2");
  assert.equal(formatoDe("foto.jpg", "image/jpeg"), null);
});

test("siguienteEstado: 0 sin empezar, 5 leyendo, 98 leído; un leído no vuelve a leyendo", () => {
  assert.equal(siguienteEstado("sin_empezar", 0), "sin_empezar");
  assert.equal(siguienteEstado("sin_empezar", 5), "leyendo");
  assert.equal(siguienteEstado("leyendo", 98), "leido");
  assert.equal(siguienteEstado("leido", 10), "leido");
  assert.equal(siguienteEstado("leyendo", 10, "leido"), "leido");
  assert.equal(siguienteEstado("leido", 10, "leyendo"), "leyendo");
});

test("ordenarPistas: por orden y después orden natural («Cap 2» antes que «Cap 10»)", () => {
  const p = (titulo: string, orden = 0) => ({ titulo, orden, url: `/api/archivos/${titulo}` });
  assert.deepEqual(ordenarPistas([p("Cap 10"), p("Cap 2"), p("Cap 1")]).map((x) => x.titulo), ["Cap 1", "Cap 2", "Cap 10"]);
  assert.deepEqual(ordenarPistas([p("B", 0), p("A", 1)]).map((x) => x.titulo), ["B", "A"]);
  assert.ok(compararNatural("pista 9", "pista 10") < 0);
});

test("filtrarLibros: busca sin tildes por título y autor, y filtra por tipo, estado y estante", () => {
  const libros = [
    { titulo: "Cien años de soledad", autor: "Gabriel García Márquez", esAudiolibro: false, estado: "leyendo" as const, estanteIds: [1] },
    { titulo: "El túnel", autor: "Ernesto Sábato", esAudiolibro: true, estado: "sin_empezar" as const, estanteIds: [] },
    { titulo: "Platero y yo", autor: "Juan Ramón Jiménez", esAudiolibro: false, estado: "leido" as const, estanteIds: [1, 2] },
  ];
  assert.deepEqual(filtrarLibros(libros, { texto: "garcia marquez" }).map((l) => l.titulo), ["Cien años de soledad"]);
  assert.deepEqual(filtrarLibros(libros, { texto: "TUNEL" }).map((l) => l.titulo), ["El túnel"]);
  assert.deepEqual(filtrarLibros(libros, { tipo: "audiolibros" }).map((l) => l.titulo), ["El túnel"]);
  assert.deepEqual(filtrarLibros(libros, { estado: "leido" }).map((l) => l.titulo), ["Platero y yo"]);
  assert.deepEqual(filtrarLibros(libros, { estanteId: 2 }).map((l) => l.titulo), ["Platero y yo"]);
  assert.equal(filtrarLibros(libros, {}).length, 3);
});

test("validarLibro: título obligatorio, archivos propios, sin mezclar audio y texto", () => {
  const epub = { url: "/api/archivos/abc", formato: "epub" };
  const v = validarLibro({ titulo: "  Martín Fierro ", archivos: [epub], estanteIds: [3, 3] }, { conArchivos: true });
  assert.equal(v.titulo, "Martín Fierro");
  assert.equal(v.esAudiolibro, false);
  assert.deepEqual(v.estanteIds, [3]);
  assert.throws(() => validarLibro({ archivos: [epub] }, { conArchivos: true }), /Falta el título/);
  assert.throws(() => validarLibro({ titulo: "X", archivos: [] }, { conArchivos: true }), /Falta el archivo/);
  assert.throws(() => validarLibro({ titulo: "X", archivos: [{ url: "https://otro.sitio/x.epub", formato: "epub" }] }, { conArchivos: true }), /Archivo inválido/);
  assert.throws(
    () => validarLibro({ titulo: "X", archivos: [epub, { url: "/api/archivos/p1", formato: "mp3" }] }, { conArchivos: true }),
    /mezclar audio y texto/,
  );
  const audio = validarLibro(
    { titulo: "X", archivos: [{ url: "/api/archivos/p1", formato: "mp3", titulo: "Cap 1" }, { url: "/api/archivos/p2", formato: "mp3" }] },
    { conArchivos: true },
  );
  assert.equal(audio.esAudiolibro, true);
  assert.deepEqual(audio.archivos?.map((a) => a.orden), [0, 1]);
  assert.equal(validarLibro({ titulo: "X" }, { conArchivos: false }).archivos, null);
  // Así devuelve la URL /api/upload
  const subido = { url: "/api/archivos/62bdae37-1f1d-4745-9e68-d6098470dc72?tipo=pdf&nombre=libro%201.pdf", formato: "pdf" };
  assert.equal(validarLibro({ titulo: "X", archivos: [subido] }, { conArchivos: true }).archivos?.[0].url, subido.url);
});

test("porcentajeValido: lo lleva a 0–100 y rechaza lo que no es número", () => {
  assert.equal(porcentajeValido(150), 100);
  assert.equal(porcentajeValido(-3), 0);
  assert.equal(porcentajeValido("42.5"), 42.5);
  assert.throws(() => porcentajeValido("hola"), /Porcentaje inválido/);
});
