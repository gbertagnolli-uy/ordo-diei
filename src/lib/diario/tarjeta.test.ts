import { test } from "node:test";
import assert from "node:assert/strict";
import { docDesdeTexto, type NodoDoc } from "./contenido.ts";
import {
  ANCHO_TARJETA,
  MARGEN_X,
  MAX_ALTO_PX,
  OPCIONES_TARJETA,
  colorConOpacidad,
  disenarTarjeta,
  escalaDeTarjeta,
  esOpcionesTarjeta,
  fechaDeTarjeta,
  horaDeTarjeta,
  imagenesDeTarjeta,
  lineasDe,
  type Comando,
  type DatosTarjeta,
  type Dimensiones,
  type Fuente,
  type Medidor,
} from "./tarjeta.ts";

/** Cada letra mide la mitad de su tamaño (16 px → 8 px): determinista y sin navegador. */
const medir: Medidor = (t, f: Fuente) => [...t].length * f.tam * 0.5;
const sinImagenes: Dimensiones = () => null;
const IMG = "/api/archivos/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

const entrada = (c: Partial<DatosTarjeta> = {}): DatosTarjeta => ({
  fecha: "2026-11-08",
  hora: 8 * 60 + 5,
  titulo: null,
  animo: null,
  categoria: null,
  etiquetas: [],
  contenido: null,
  texto: "Hola",
  fotos: [],
  ...c,
});

const doc = (...content: NodoDoc[]): NodoDoc => ({ type: "doc", content });
const p = (...content: NodoDoc[]): NodoDoc => ({ type: "paragraph", content });
const t = (text: string, ...marks: string[]): NodoDoc => ({ type: "text", text, ...(marks.length ? { marks: marks.map((type) => ({ type })) } : {}) });
const textos = (cs: Comando[]) => cs.filter((c): c is Extract<Comando, { t: "texto" }> => c.t === "texto");
const de = (cs: Comando[], tipo: Comando["t"]) => cs.filter((c) => c.t === tipo);
const diseno = (d: DatosTarjeta, o = { oscuro: false, marcaDeAgua: false }, dims: Dimensiones = sinImagenes) => disenarTarjeta(d, o, medir, dims);

test("fecha de la tarjeta: día y mes, día de la semana y año", () => {
  assert.deepEqual(fechaDeTarjeta("2026-11-08"), { diaMes: "8 de noviembre", semana: "domingo", anio: "2026" });
  assert.equal(fechaDeTarjeta("2024-02-29").semana, "jueves");
  assert.equal(horaDeTarjeta(8 * 60 + 5), "08:05");
  assert.equal(horaDeTarjeta(0), "00:00");
});

test("el color con opacidad", () => {
  assert.equal(colorConOpacidad("#ff8000", 0.16), "rgba(255,128,0,0.16)");
  assert.equal(colorConOpacidad("var(--primary)", 0.16), "rgba(128,128,128,0.16)");
});

test("las opciones de la tarjeta se validan", () => {
  assert.ok(esOpcionesTarjeta(OPCIONES_TARJETA));
  assert.ok(!esOpcionesTarjeta({ ...OPCIONES_TARJETA, escala: 4 }));
  assert.ok(!esOpcionesTarjeta({ ...OPCIONES_TARJETA, escala: 1.5 }));
  assert.ok(!esOpcionesTarjeta({ oscuro: true }));
  assert.ok(!esOpcionesTarjeta(null));
});

// ── Corte de líneas ──────────────────────────────────────────────────────────

const trozo = (texto: string) => ({ texto, fuente: { tam: 16, negrita: false, cursiva: false, mono: false }, color: "#000", subrayado: false, tachado: false, fondo: null });

test("el texto se corta por palabras en el ancho disponible", () => {
  // 8 px por letra, 80 px = 10 letras
  const lineas = lineasDe([trozo("hola mundo cruel")], 80, medir);
  assert.deepEqual(lineas.map((l) => l.map((c) => c.texto).join("")), ["hola mundo", "cruel"]);
});

test("un salto de línea fuerza otra línea y se descartan los espacios del borde", () => {
  const lineas = lineasDe([trozo("uno  \n  dos")], 800, medir);
  assert.deepEqual(lineas.map((l) => l.map((c) => c.texto).join("")), ["uno", "dos"]);
});

test("una palabra más larga que la línea se parte por letras", () => {
  const lineas = lineasDe([trozo("abcdefghijklmnop")], 64, medir); // 8 letras por línea
  assert.deepEqual(lineas.map((l) => l.map((c) => c.texto).join("")), ["abcdefgh", "ijklmnop"]);
});

test("los trozos con otro estilo siguen en la misma línea, uno a continuación del otro", () => {
  const negrita = { ...trozo("fuerte"), fuente: { tam: 16, negrita: true, cursiva: false, mono: false } };
  const [linea] = lineasDe([trozo("un "), negrita, trozo(" texto")], 800, medir);
  assert.deepEqual(linea.map((c) => c.texto), ["un ", "fuerte", " texto"]);
  assert.equal(linea[1].x, 24);
});

// ── Tarjeta ──────────────────────────────────────────────────────────────────

test("la cabecera lleva la fecha grande, el día de la semana con la hora y el cuerpo", () => {
  const d = diseno(entrada());
  const ts = textos(d.comandos);
  assert.equal(ts[0].texto, "8 de noviembre");
  assert.equal(ts[0].fuente.tam, 20);
  assert.equal(ts[0].x, MARGEN_X);
  assert.equal(ts[1].texto, "domingo, 2026 · 08:05");
  assert.equal(ts[2].texto, "Hola");
  assert.equal(d.ancho, ANCHO_TARJETA);
  assert.ok(d.alto > 28 + 20, "tiene que tener alto");
  assert.equal(d.truncada, false);
});

test("el título va en grande y el ánimo, la categoría y las etiquetas en la cabecera", () => {
  const d = diseno(
    entrada({
      titulo: "Un día lindo",
      animo: { nombre: "Muy bien", color: "#22aa44" },
      categoria: { nombre: "Fe", color: null },
      etiquetas: ["misa", "familia"],
    }),
  );
  const ts = textos(d.comandos);
  assert.ok(ts.some((x) => x.texto === "Muy bien" && x.fuente.negrita));
  assert.ok(ts.some((x) => x.texto === "Fe"));
  assert.ok(ts.some((x) => x.texto.startsWith("#misa")));
  assert.ok(ts.some((x) => x.texto === "#familia"));
  const titulo = ts.find((x) => x.texto === "Un día lindo");
  assert.ok(titulo && titulo.fuente.tam === 22 && titulo.fuente.negrita);
  // el chip de ánimo es una píldora con el color al 16 %
  const chip = d.comandos.find((c) => c.t === "rect" && c.color === "rgba(34,170,68,0.16)");
  assert.ok(chip && chip.t === "rect" && chip.radio === 11);
});

test("una categoría muy larga se acorta con «…»", () => {
  const d = diseno(entrada({ categoria: { nombre: "Una categoría con un nombre larguísimo de verdad", color: "#112233" } }));
  const cat = textos(d.comandos).find((x) => x.texto.endsWith("…"));
  assert.ok(cat);
  assert.ok(medir(cat.texto, cat.fuente) <= (ANCHO_TARJETA - MARGEN_X * 2) * 0.5 + 8);
});

test("sin contenido el texto plano se dibuja un párrafo por línea", () => {
  const d = diseno(entrada({ texto: "primera\nsegunda" }));
  const ts = textos(d.comandos).map((x) => x.texto);
  assert.ok(ts.includes("primera") && ts.includes("segunda"));
  const [a, b] = ["primera", "segunda"].map((s) => textos(d.comandos).find((x) => x.texto === s)!.y);
  assert.ok(b > a);
});

test("los títulos del cuerpo escalan y van en negrita", () => {
  const d = diseno(entrada({ contenido: doc({ type: "heading", attrs: { level: 1 }, content: [t("Grande")] }, { type: "heading", attrs: { level: 4 }, content: [t("Chico")] }) }));
  const g = textos(d.comandos).find((x) => x.texto === "Grande")!;
  const c = textos(d.comandos).find((x) => x.texto === "Chico")!;
  assert.equal(g.fuente.tam, 16 * 1.7);
  assert.equal(c.fuente.tam, 16 * 1.1);
  assert.ok(g.fuente.negrita && c.fuente.negrita);
  assert.ok(c.y - g.y >= 22, "separación de 22 antes de un título");
});

test("las marcas: negrita, cursiva, tachado, subrayado, enlace y resaltado", () => {
  const d = diseno(entrada({ contenido: doc(p(t("a", "bold"), t("b", "italic"), t("c", "strike"), t("d", "underline"), t("e", "link"), t("f", "highlight"), t("g", "code"))) }));
  const ts = textos(d.comandos);
  const por = (s: string) => ts.find((x) => x.texto === s)!;
  // los trozos pegados con el mismo estilo se juntan, pero acá cada uno cambia de estilo
  assert.ok(por("a").fuente.negrita);
  assert.ok(por("b").fuente.cursiva);
  assert.ok(por("g").fuente.mono && por("g").fuente.tam < 16);
  assert.equal(por("e").color, "#502300");
  assert.ok(de(d.comandos, "linea").length >= 3, "tachado + subrayado + enlace");
  assert.ok(d.comandos.some((c) => c.t === "rect" && c.color === "#F6E3A1"), "resaltado");
  assert.ok(d.comandos.some((c) => c.t === "rect" && c.color === "#F1EBE0"), "fondo del código");
});

test("un enlace a otra entrada se ve con su rótulo, en el color de acento y subrayado", () => {
  const d = diseno(entrada({ contenido: doc(p({ type: "diaryLink", attrs: { id: "5", label: "Aquel día" } })) }));
  const x = textos(d.comandos).find((c) => c.texto === "Aquel día");
  assert.ok(x);
  assert.equal(x.color, "#502300");
  assert.ok(de(d.comandos, "linea").length >= 1);
});

test("las listas tienen viñeta, número o casilla y sangran el contenido", () => {
  const item = (s: string, checked?: boolean): NodoDoc => ({ type: checked === undefined ? "listItem" : "taskItem", ...(checked === undefined ? {} : { attrs: { checked } }), content: [p(t(s))] });
  const viñetas = diseno(entrada({ contenido: doc({ type: "bulletList", content: [item("uno"), item("dos")] }) }));
  assert.equal(de(viñetas.comandos, "circulo").length, 2);
  assert.equal(textos(viñetas.comandos).find((x) => x.texto === "uno")!.x, MARGEN_X + 24);

  const numeros = diseno(entrada({ contenido: doc({ type: "orderedList", attrs: { start: 3 }, content: [item("a"), item("b")] }) }));
  assert.ok(textos(numeros.comandos).some((x) => x.texto === "3."));
  assert.ok(textos(numeros.comandos).some((x) => x.texto === "4."));

  const tareas = diseno(entrada({ contenido: doc({ type: "taskList", content: [item("hecha", true), item("falta", false)] }) }));
  assert.equal(de(tareas.comandos, "poli").length, 1, "una tilde, solo en la hecha");
  assert.equal(de(tareas.comandos, "circulo").length, 0);
});

test("la cita lleva una barra a la izquierda del alto del contenido y el texto apagado", () => {
  const d = diseno(entrada({ contenido: doc({ type: "blockquote", content: [p(t("Dicho sabio"))] }) }));
  const barra = d.comandos.find((c) => c.t === "rect" && c.w === 3);
  assert.ok(barra && barra.t === "rect");
  assert.equal(barra.x, MARGEN_X);
  const x = textos(d.comandos).find((c) => c.texto === "Dicho sabio")!;
  assert.equal(x.x, MARGEN_X + 16);
  assert.equal(x.color, "#6B5D50");
  assert.ok(barra.h >= 27);
});

test("el código va sobre un fondo, con el idioma y una línea por renglón", () => {
  const d = diseno(entrada({ contenido: doc({ type: "codeBlock", attrs: { language: "ts" }, content: [t("const a = 1;\n  return a;")] }) }));
  const fondo = d.comandos.find((c) => c.t === "rect" && c.color === "#F1EBE0" && c.radio === 8);
  assert.ok(fondo && fondo.t === "rect");
  const ts = textos(d.comandos);
  assert.ok(ts.some((x) => x.texto === "ts"));
  const l1 = ts.find((x) => x.texto === "const a = 1;")!;
  const l2 = ts.find((x) => x.texto === "  return a;")!;
  assert.ok(l1.fuente.mono && l2.y > l1.y, "se conserva la sangría y cada renglón va aparte");
  assert.ok(l1.y > fondo.y && l2.y < fondo.y + fondo.h);
});

test("las reglas: sólida, rayas, doble, ondulada y con texto", () => {
  const con = (variant: string, label?: string) => diseno(entrada({ contenido: doc({ type: "horizontalRule", attrs: { variant, label: label ?? null } }) })).comandos;
  assert.equal(de(con("solid"), "linea").length, 1);
  assert.deepEqual((de(con("dashed"), "linea")[0] as Extract<Comando, { t: "linea" }>).trazo, [6, 4]);
  assert.equal(de(con("double"), "linea").length, 2);
  assert.equal(de(con("wavy"), "poli").length, 1);
  const rotulo = con("text", "Fin");
  assert.equal(de(rotulo, "linea").length, 2);
  assert.ok(textos(rotulo).some((x) => x.texto === "Fin"));
});

test("una imagen con sus medidas conserva la proporción y respeta el ancho %", () => {
  const dims = (src: string) => (src === IMG ? { w: 800, h: 400 } : null);
  const completa = diseno(entrada({ contenido: doc({ type: "image", attrs: { src: IMG, widthPercent: null } }) }), undefined, dims);
  const i = completa.comandos.find((c) => c.t === "imagen") as Extract<Comando, { t: "imagen" }>;
  assert.equal(i.w, ANCHO_TARJETA - MARGEN_X * 2);
  assert.equal(i.h, i.w / 2);
  const mitad = diseno(entrada({ contenido: doc({ type: "image", attrs: { src: IMG, widthPercent: 50 } }) }), undefined, dims);
  const m = mitad.comandos.find((c) => c.t === "imagen") as Extract<Comando, { t: "imagen" }>;
  assert.equal(m.w, i.w / 2);
  assert.equal(m.x, MARGEN_X + i.w / 4, "centrada");
});

test("una imagen que no se pudo cargar deja una caja con el aviso", () => {
  const d = diseno(entrada({ contenido: doc({ type: "image", attrs: { src: IMG } }) }));
  assert.equal(de(d.comandos, "imagen").length, 0);
  assert.ok(textos(d.comandos).some((x) => x.texto === "Imagen no disponible"));
});

test("las fotos que no están en el texto van al final; las del texto no se repiten", () => {
  const otra = "/api/archivos/bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
  const datos = entrada({ contenido: doc(p(t("texto")), { type: "image", attrs: { src: IMG } }), fotos: [IMG, otra] });
  assert.deepEqual(imagenesDeTarjeta(datos), [IMG, otra]);
  const d = diseno(datos, undefined, () => ({ w: 100, h: 100 }));
  const imgs = d.comandos.filter((c): c is Extract<Comando, { t: "imagen" }> => c.t === "imagen");
  assert.deepEqual(imgs.map((x) => x.src), [IMG, otra]);
  assert.ok(imgs[1].y > imgs[0].y);
});

test("la tabla pone un borde, fondo en el encabezado y el texto en cada columna", () => {
  const celda = (tipo: string, s: string): NodoDoc => ({ type: tipo, content: [p(t(s))] });
  const d = diseno(
    entrada({
      contenido: doc({
        type: "table",
        content: [
          { type: "tableRow", content: [celda("tableHeader", "A"), celda("tableHeader", "B")] },
          { type: "tableRow", content: [celda("tableCell", "1"), celda("tableCell", "2")] },
        ],
      }),
    }),
  );
  const ts = textos(d.comandos);
  const a = ts.find((x) => x.texto === "A")!;
  const b = ts.find((x) => x.texto === "B")!;
  assert.ok(b.x > a.x + 100, "dos columnas");
  assert.ok(d.comandos.some((c) => c.t === "rect" && c.color === "#F1EBE0" && c.w === ANCHO_TARJETA - MARGEN_X * 2), "fondo del encabezado");
  assert.equal(de(d.comandos, "linea").length, 3 + 3, "tres líneas horizontales y tres verticales");
});

test("la marca de agua suma el pie, y el oscuro cambia los colores", () => {
  const sin = diseno(entrada());
  const con = diseno(entrada(), { oscuro: true, marcaDeAgua: true });
  assert.ok(con.alto > sin.alto);
  assert.ok(textos(con.comandos).some((x) => x.texto === "Ordo Diei"));
  assert.ok(!textos(sin.comandos).some((x) => x.texto === "Ordo Diei"));
  assert.equal(textos(con.comandos)[0].color, "#F1EBE0");
  assert.equal(textos(sin.comandos)[0].color, "#2B2118");
});

test("un cuerpo larguísimo se corta con «…» y avisa", () => {
  const muchas = Array.from({ length: 2000 }, (_, i) => p(t(`Párrafo número ${i} con algo de texto para ocupar lugar en la tarjeta`)));
  const d = diseno(entrada({ contenido: doc(...muchas) }));
  assert.equal(d.truncada, true);
  assert.ok(textos(d.comandos).some((x) => x.texto === "…"));
  assert.ok(d.alto < 17_000);
});

test("las líneas no se pasan del ancho disponible", () => {
  const largo = "palabra ".repeat(80);
  const d = diseno(entrada({ contenido: doc(p(t(largo))) }));
  for (const x of textos(d.comandos).filter((c) => c.fuente.tam === 16)) {
    assert.ok(x.x + medir(x.texto, x.fuente) <= ANCHO_TARJETA - MARGEN_X + 0.001, `${x.texto} se pasa`);
  }
});

test("un documento hecho de texto plano coincide con el de una entrada con contenido", () => {
  const a = diseno(entrada({ texto: "uno\ndos" }));
  const b = diseno(entrada({ contenido: docDesdeTexto("uno\ndos") }));
  assert.deepEqual(a.comandos, b.comandos);
});

test("la escala baja cuando el lienzo no entra en el navegador", () => {
  assert.equal(escalaDeTarjeta(1000, 360, 3), 3);
  assert.equal(escalaDeTarjeta(1000, 360, 9), 3);
  assert.equal(escalaDeTarjeta(1000, 360, 0), 1);
  assert.equal(escalaDeTarjeta(6000, 360, 3), 2, "6000 × 3 = 18000 > 16000");
  assert.equal(escalaDeTarjeta(MAX_ALTO_PX, 360, 3), 1);
  assert.equal(escalaDeTarjeta(40000, 360, 3), 1);
  // superficie: 360×3 por 5000×3 = 16,2 millones > 16 millones → escala 2
  assert.equal(escalaDeTarjeta(5000, 360, 3), 2);
});
