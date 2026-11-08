import { test } from "node:test";
import assert from "node:assert/strict";
import {
  FILTRO_VACIO,
  MAX_HISTORIAL,
  PAGINA,
  agregarHistorial,
  aParametros,
  coincide,
  descendientes,
  extracto,
  filtrosActivos,
  hayBusqueda,
  leerFiltro,
  leerHistorial,
  normalizar,
  ordenarHallazgos,
  presetDe,
  prepararConsulta,
  puntuar,
  quitarHistorial,
  rangoDePreset,
  rangosCoincidencia,
  resaltar,
  segmentar,
  sumarDias,
  type Hallazgo,
} from "./busqueda.ts";

const params = (o: Record<string, string>) => new URLSearchParams(o);

test("normalizar saca mayúsculas y tildes (ñ y ç también)", () => {
  assert.equal(normalizar("Canción de CUNA, Año Nuevo, Façade"), "cancion de cuna, ano nuevo, facade");
});

test("prepararConsulta: términos únicos, sin tildes y con la frase entera", () => {
  const q = prepararConsulta("  Misa   del DOMINGO misa ");
  assert.deepEqual(q.terminos, ["misa", "del", "domingo"]);
  assert.equal(q.frase, "misa del domingo misa");
  assert.deepEqual(prepararConsulta("   ").terminos, []);
  assert.equal(prepararConsulta("a b c d e f g h i j").terminos.length, 8);
});

test("coincide: todos los términos, sin importar tildes ni mayúsculas, en título o cuerpo", () => {
  const q = prepararConsulta("misa domingo");
  assert.equal(coincide("Fin de semana", "Fuimos a MISA el Domingo", q), true);
  assert.equal(coincide("Misa", "Hoy fue domingo", q), true);
  assert.equal(coincide(null, "Solo la misa", q), false);
  assert.equal(coincide("x", "cancion", prepararConsulta("canción")), true);
  assert.equal(coincide(null, "lo que sea", prepararConsulta("")), true);
});

test("puntuar: el título pesa más que el cuerpo y la frase entera suma", () => {
  const q = prepararConsulta("paseo");
  assert.ok(puntuar("Paseo", "nada", q) > puntuar("nada", "paseo", q));
  assert.ok(puntuar(null, "paseo paseo", q) > puntuar(null, "paseo", q));
  const dos = prepararConsulta("paseo parque");
  assert.ok(puntuar(null, "el paseo parque", dos) > puntuar(null, "el parque y luego un paseo", dos));
  assert.equal(puntuar(null, "nada", q), 0);
});

test("rangosCoincidencia: vuelve a las posiciones del texto original aunque tenga tildes", () => {
  const texto = "Canción de cuna";
  assert.deepEqual(rangosCoincidencia(texto, ["cancion"]), [{ inicio: 0, fin: 7 }]);
  assert.deepEqual(rangosCoincidencia("ñandú y NANDU", ["nandu"]), [
    { inicio: 0, fin: 5 },
    { inicio: 8, fin: 13 },
  ]);
  assert.deepEqual(rangosCoincidencia("abc", []), []);
});

test("rangosCoincidencia une los que se pisan o se tocan", () => {
  assert.deepEqual(rangosCoincidencia("abcdef", ["abc", "cde"]), [{ inicio: 0, fin: 5 }]);
  assert.deepEqual(rangosCoincidencia("abcdef", ["abc", "def"]), [{ inicio: 0, fin: 6 }]);
});

test("segmentar y resaltar cubren todo el texto sin perder nada", () => {
  const segs = resaltar("Hoy fue un día lindo, un DIA para recordar", ["dia"]);
  assert.equal(segs.map((s) => s.texto).join(""), "Hoy fue un día lindo, un DIA para recordar");
  assert.deepEqual(
    segs.filter((s) => s.coincide).map((s) => s.texto),
    ["día", "DIA"],
  );
  assert.deepEqual(resaltar("", ["a"]), []);
  assert.deepEqual(segmentar("abc", []), [{ texto: "abc", coincide: false }]);
});

test("extracto: texto corto entero; largo, centrado en la primera coincidencia con «…» donde se corta", () => {
  assert.deepEqual(extracto("Un texto corto con paseo", ["paseo"]).map((s) => s.texto).join(""), "Un texto corto con paseo");
  const largo = Array.from({ length: 80 }, (_, i) => (i === 50 ? "paseo" : `p${i}`)).join(" ");
  const segs = extracto(largo, ["paseo"]);
  const plano = segs.map((s) => s.texto).join("");
  assert.ok(plano.startsWith("…") && plano.endsWith("…"));
  assert.ok(segs.some((s) => s.coincide && s.texto === "paseo"));
  assert.ok(plano.replace(/…/g, "").trim().split(/\s+/).length <= 24);
});

test("extracto: sin coincidencia en el cuerpo (el hallazgo estaba en el título) muestra el principio", () => {
  const largo = Array.from({ length: 60 }, (_, i) => `w${i}`).join(" ");
  const plano = extracto(largo, ["zzz"]).map((s) => s.texto).join("");
  assert.ok(plano.startsWith("w0 ") && plano.endsWith("…"));
  assert.deepEqual(extracto("   ", ["a"]), []);
});

const h = (id: number, o: Partial<Hallazgo> = {}): Hallazgo => ({ id, fecha: "2026-01-01", hora: 600, animo: null, valor: null, puntaje: 0, ...o });

test("ordenarHallazgos: relevancia por puntaje y, a igual puntaje, la más nueva", () => {
  const r = ordenarHallazgos([h(1, { puntaje: 2 }), h(2, { puntaje: 5 }), h(3, { puntaje: 5, fecha: "2026-02-01" })], "relevancia", "desc");
  assert.deepEqual(r.map((x) => x.id), [3, 2, 1]);
});

test("ordenarHallazgos: fecha descendente y ascendente (día, hora, id)", () => {
  const l = [h(1, { fecha: "2026-01-02", hora: 100 }), h(2, { fecha: "2026-01-02", hora: 900 }), h(3, { fecha: "2026-01-01" })];
  assert.deepEqual(ordenarHallazgos(l, "fecha", "desc").map((x) => x.id), [2, 1, 3]);
  assert.deepEqual(ordenarHallazgos(l, "fecha", "asc").map((x) => x.id), [3, 1, 2]);
});

test("ordenarHallazgos: por ánimo y por contador dejan al final las que no tienen dato, en cualquier sentido", () => {
  const l = [h(1, { animo: 2 }), h(2), h(3, { animo: 5 }), h(4, { animo: 2, fecha: "2026-03-01" })];
  assert.deepEqual(ordenarHallazgos(l, "animo", "desc").map((x) => x.id), [3, 4, 1, 2]);
  assert.deepEqual(ordenarHallazgos(l, "animo", "asc").map((x) => x.id), [4, 1, 3, 2]);
  const c = [h(1, { valor: 3 }), h(2), h(3, { valor: 10 })];
  assert.deepEqual(ordenarHallazgos(c, "contador", "desc").map((x) => x.id), [3, 1, 2]);
  assert.deepEqual(ordenarHallazgos(c, "contador", "asc").map((x) => x.id), [1, 3, 2]);
});

test("ordenarHallazgos no modifica la lista original", () => {
  const l = [h(1, { fecha: "2026-01-01" }), h(2, { fecha: "2026-02-01" })];
  ordenarHallazgos(l, "fecha", "desc");
  assert.deepEqual(l.map((x) => x.id), [1, 2]);
});

test("sumarDias y rangoDePreset", () => {
  assert.equal(sumarDias("2026-03-01", -1), "2026-02-28");
  assert.equal(sumarDias("2026-12-31", 1), "2027-01-01");
  assert.deepEqual(rangoDePreset("todo", "2026-11-08"), { desde: null, hasta: null });
  assert.deepEqual(rangoDePreset("7dias", "2026-11-08"), { desde: "2026-11-01", hasta: null });
  assert.deepEqual(rangoDePreset("30dias", "2026-11-08"), { desde: "2026-10-09", hasta: null });
  assert.deepEqual(rangoDePreset("anio", "2026-11-08"), { desde: "2026-01-01", hasta: null });
  assert.deepEqual(rangoDePreset("rango", "2026-11-08", "2026-05-01", "2026-05-31"), { desde: "2026-05-01", hasta: "2026-05-31" });
});

test("presetDe reconoce los presets y deja el resto como rango", () => {
  assert.equal(presetDe(null, null, "2026-11-08"), "todo");
  assert.equal(presetDe("2026-11-01", null, "2026-11-08"), "7dias");
  assert.equal(presetDe("2026-01-01", null, "2026-11-08"), "anio");
  assert.equal(presetDe("2026-05-01", "2026-05-31", "2026-11-08"), "rango");
});

test("descendientes: la categoría y todo lo que cuelga de ella", () => {
  const cats = [
    { id: 1, padreId: null },
    { id: 2, padreId: 1 },
    { id: 3, padreId: 2 },
    { id: 4, padreId: null },
  ];
  assert.deepEqual(descendientes(1, cats).sort(), [1, 2, 3]);
  assert.deepEqual(descendientes(2, cats).sort(), [2, 3]);
  assert.deepEqual(descendientes(4, cats), [4]);
  assert.deepEqual(descendientes(99, cats), [99]);
});

test("leerFiltro: lo mínimo da los valores predeterminados", () => {
  const f = leerFiltro(params({}));
  assert.deepEqual(f, FILTRO_VACIO);
  assert.equal(f.limite, PAGINA);
});

test("leerFiltro: con texto el orden predeterminado es relevancia; sin texto, fecha", () => {
  assert.equal(leerFiltro(params({ q: "  paseo   familia " })).consulta, "paseo familia");
  assert.equal(leerFiltro(params({ q: "paseo" })).orden, "relevancia");
  assert.equal(leerFiltro(params({ orden: "relevancia" })).orden, "fecha");
  assert.equal(leerFiltro(params({ orden: "contador" })).orden, "fecha");
  assert.equal(leerFiltro(params({ orden: "contador", contador: "7" })).contadorId, 7);
});

test("leerFiltro: lee listas, marcas, fechas y paginado", () => {
  const f = leerFiltro(
    params({
      etiquetas: "3,1,3",
      etiquetaModo: "todas",
      categoria: "5",
      animos: "1,5",
      favorita: "si",
      fijada: "no",
      desde: "2026-01-01",
      hasta: "2026-06-30",
      anios: "2025,2026",
      orden: "animo",
      sentido: "asc",
      desplazamiento: "30",
      limite: "10",
    }),
  );
  assert.deepEqual(f.etiquetas, [3, 1]);
  assert.equal(f.etiquetaModo, "todas");
  assert.equal(f.categoriaId, 5);
  assert.deepEqual(f.animos, [1, 5]);
  assert.equal(f.favorita, true);
  assert.equal(f.fijada, false);
  assert.equal(f.desde, "2026-01-01");
  assert.deepEqual(f.anios, [2025, 2026]);
  assert.equal(f.sentido, "asc");
  assert.equal(f.desplazamiento, 30);
  assert.equal(f.limite, 10);
});

test("leerFiltro rechaza lo inválido", () => {
  const malos: Record<string, string>[] = [
    { etiquetas: "1,a" },
    { etiquetas: "0" },
    { etiquetaModo: "algunas" },
    { categoria: "x" },
    { categoria: "2", sinCategoria: "1" },
    { animos: "6" },
    { animos: "0" },
    { favorita: "talvez" },
    { desde: "2026-13-01" },
    { desde: "ayer" },
    { desde: "2026-05-02", hasta: "2026-05-01" },
    { desde: "1999-01-01" },
    { orden: "azar" },
    { sentido: "arriba" },
    { limite: "0" },
    { limite: "101" },
    { desplazamiento: "-1" },
    { q: "x".repeat(201) },
    { anios: "1999" },
    { etiquetas: Array.from({ length: 51 }, (_, i) => i + 1).join(",") },
  ];
  for (const m of malos) assert.throws(() => leerFiltro(params(m)), Error, JSON.stringify(m));
});

test("aParametros y leerFiltro son inversas", () => {
  const f = {
    ...FILTRO_VACIO,
    consulta: "misa",
    etiquetas: [2, 9],
    etiquetaModo: "todas" as const,
    categoriaId: 4,
    animos: [4, 5],
    favorita: true,
    fijada: false,
    desde: "2026-01-01",
    hasta: "2026-02-01",
    anios: [2026],
    orden: "contador" as const,
    sentido: "asc" as const,
    contadorId: 3,
    desplazamiento: 60,
  };
  assert.deepEqual(leerFiltro(aParametros(f, "personal")), f);
  assert.equal(aParametros(FILTRO_VACIO, "familiar").get("tipo"), "familiar");
  assert.equal(aParametros(FILTRO_VACIO, "familiar").get("q"), null);
});

test("filtrosActivos y hayBusqueda", () => {
  assert.equal(filtrosActivos(FILTRO_VACIO), 0);
  assert.equal(hayBusqueda(FILTRO_VACIO), false);
  assert.equal(hayBusqueda({ ...FILTRO_VACIO, consulta: " hola " }), true);
  assert.equal(filtrosActivos({ ...FILTRO_VACIO, etiquetas: [1, 2], favorita: true, desde: "2026-01-01", orden: "animo" }), 3);
  assert.equal(filtrosActivos({ ...FILTRO_VACIO, etiquetaModo: "ninguna" }), 1);
  assert.equal(hayBusqueda({ ...FILTRO_VACIO, fijada: true }), true);
});

test("historial: la última arriba, sin repetir, hasta 12, quitar una", () => {
  let l: string[] = [];
  for (let i = 0; i < 15; i++) l = agregarHistorial(l, `b${i}`);
  assert.equal(l.length, MAX_HISTORIAL);
  assert.equal(l[0], "b14");
  l = agregarHistorial(l, "  b10 ");
  assert.equal(l[0], "b10");
  assert.equal(l.filter((x) => x === "b10").length, 1);
  assert.deepEqual(agregarHistorial(["a"], "   "), ["a"]);
  assert.deepEqual(quitarHistorial(["a", "b"], "a"), ["b"]);
});

test("leerHistorial descarta lo que no sirve", () => {
  assert.deepEqual(leerHistorial(null), []);
  assert.deepEqual(leerHistorial("hola"), []);
  assert.deepEqual(leerHistorial(["a", 3, "", "a", "  ", "b"]), ["a", "b"]);
  assert.equal(leerHistorial(Array.from({ length: 30 }, (_, i) => `q${i}`)).length, MAX_HISTORIAL);
});
