import { test } from "node:test";
import assert from "node:assert/strict";
import {
  SEMILLA_GRUPOS,
  SEMILLA_SUELTAS,
  alturaDe,
  aplanarArbol,
  armarSecciones,
  esColor,
  limpiarNombre,
  nombreEscribiendo,
  nivelDe,
  puedeEditarCatalogo,
  puedeVerCatalogo,
  validarCategoria,
  validarContraCatalogo,
  validarEtiqueta,
  validarGrupo,
  validarIcono,
  validarPadre,
  validarPuestas,
  validarValor,
  type CategoriaArbol,
  type EtiquetaDeCatalogo,
  type GrupoDeCatalogo,
} from "./etiquetas.ts";
import { ICONO_CLAVES } from "./iconos.ts";

test("limpiarNombre: saca los caracteres prohibidos y colapsa espacios", () => {
  assert.equal(limpiarNombre('  Con   "mamá" / papá, #1 [x]{y}:z  '), "Con mamá papá 1 xyz");
  assert.equal(limpiarNombre("a`b'c\\d"), "abcd");
  assert.equal(limpiarNombre(42), "");
});

test("nombreEscribiendo: deja escribir espacios pero no los repetidos, los del principio ni los prohibidos", () => {
  assert.equal(nombreEscribiendo("Muy "), "Muy ");
  assert.equal(nombreEscribiendo("Muy  bien"), "Muy bien");
  assert.equal(nombreEscribiendo(" hola"), "hola");
  assert.equal(nombreEscribiendo('a#b/"c'), "abc");
});

test("validarIcono: emoji de un solo carácter visible o clave del catálogo", () => {
  assert.deepEqual(validarIcono("🏋️", "emoji"), { icono: "🏋️", tipoIcono: "emoji" });
  assert.deepEqual(validarIcono(" 😊 ", undefined), { icono: "😊", tipoIcono: "emoji" });
  assert.deepEqual(validarIcono("smile", "icono"), { icono: "smile", tipoIcono: "icono" });
  assert.deepEqual(validarIcono(null, "icono"), { icono: null, tipoIcono: "emoji" });
  assert.throws(() => validarIcono("ab", "emoji"));
  assert.throws(() => validarIcono("no-existe", "icono"));
  assert.throws(() => validarIcono("😊😊", "emoji"));
});

test("esColor: #rrggbb", () => {
  assert.ok(esColor("#43a047"));
  assert.ok(!esColor("43a047"));
  assert.ok(!esColor("#fff"));
  assert.ok(!esColor("red"));
});

test("validarValor: número, con o sin decimales y signo", () => {
  assert.equal(validarValor(" 7 "), "7");
  assert.equal(validarValor("-2.5"), "-2.5");
  assert.equal(validarValor(".5"), ".5");
  assert.equal(validarValor(3), "3");
  for (const malo of ["", "abc", "1e3", "1,5", "--1", "1".repeat(21), null, undefined]) assert.throws(() => validarValor(malo), String(malo));
});

test("validarEtiqueta, validarGrupo y validarCategoria: normalizan y rechazan", () => {
  assert.deepEqual(validarEtiqueta({ nombre: " Rezar:  ", tipo: "etiqueta", icono: "🙏", tipoIcono: "emoji", color: "#AABBCC", grupoId: 3 }), {
    nombre: "Rezar",
    grupoId: 3,
    icono: "🙏",
    tipoIcono: "emoji",
    color: "#aabbcc",
    tipo: "etiqueta",
  });
  assert.throws(() => validarEtiqueta({ nombre: "", tipo: "etiqueta" }));
  assert.throws(() => validarEtiqueta({ nombre: "x", tipo: "otro" }));
  assert.throws(() => validarEtiqueta({ nombre: "x".repeat(41), tipo: "etiqueta" }));
  assert.throws(() => validarEtiqueta({ nombre: "x", tipo: "etiqueta", color: "rojo" }));
  assert.throws(() => validarEtiqueta({ nombre: "x", tipo: "etiqueta", grupoId: "3" }));
  assert.equal(validarGrupo({ nombre: "Clima", seleccionUnica: true }).seleccionUnica, true);
  assert.equal(validarGrupo({ nombre: "Clima" }).seleccionUnica, false);
  assert.deepEqual(validarCategoria({ nombre: "Misa", padreId: 2 }), { nombre: "Misa", padreId: 2, color: null });
});

test("permisos del catálogo: personal solo el creador, familiar el creador o un padre", () => {
  const yo = { id: 1, esPadre: false };
  const padre = { id: 2, esPadre: true };
  assert.ok(puedeVerCatalogo({ ambito: "personal", creadorId: 1 }, yo));
  assert.ok(!puedeVerCatalogo({ ambito: "personal", creadorId: 3 }, padre));
  assert.ok(puedeVerCatalogo({ ambito: "familiar", creadorId: 3 }, yo));
  assert.ok(puedeEditarCatalogo({ ambito: "personal", creadorId: 1 }, yo));
  assert.ok(!puedeEditarCatalogo({ ambito: "personal", creadorId: 1 }, padre));
  assert.ok(puedeEditarCatalogo({ ambito: "familiar", creadorId: 1 }, yo));
  assert.ok(!puedeEditarCatalogo({ ambito: "familiar", creadorId: 3 }, yo));
  assert.ok(puedeEditarCatalogo({ ambito: "familiar", creadorId: 3 }, padre));
  assert.ok(!puedeEditarCatalogo({ ambito: "familiar", creadorId: null }, yo));
  assert.ok(puedeEditarCatalogo({ ambito: "familiar", creadorId: null }, padre));
});

test("validarPuestas: forma, sin repetidas, undefined = no tocar", () => {
  assert.equal(validarPuestas(undefined), undefined);
  assert.deepEqual(validarPuestas([{ id: 1 }, { id: 2, valor: "5" }, { id: 1, valor: "9" }]), [
    { id: 1, valor: null },
    { id: 2, valor: "5" },
  ]);
  assert.throws(() => validarPuestas("x"));
  assert.throws(() => validarPuestas([{ id: "1" }]));
  assert.throws(() => validarPuestas([{ id: 0 }]));
  assert.throws(() => validarPuestas(Array.from({ length: 51 }, (_, i) => ({ id: i + 1 }))));
});

test("validarContraCatalogo: existen, contador con número, selección única", () => {
  const etiquetas = new Map<number, EtiquetaDeCatalogo>([
    [1, { id: 1, nombre: "Feliz", tipo: "etiqueta", grupoId: 10 }],
    [2, { id: 2, nombre: "Triste", tipo: "etiqueta", grupoId: 10 }],
    [3, { id: 3, nombre: "Correr", tipo: "etiqueta", grupoId: 11 }],
    [4, { id: 4, nombre: "Gimnasio", tipo: "etiqueta", grupoId: 11 }],
    [5, { id: 5, nombre: "Energía", tipo: "contador", grupoId: null }],
  ]);
  const grupos = new Map<number, GrupoDeCatalogo>([
    [10, { id: 10, nombre: "Sentimientos", seleccionUnica: true }],
    [11, { id: 11, nombre: "Actividades", seleccionUnica: false }],
  ]);
  assert.deepEqual(
    validarContraCatalogo(
      [
        { id: 1, valor: "no importa" },
        { id: 3, valor: null },
        { id: 4, valor: null },
        { id: 5, valor: "7" },
      ],
      etiquetas,
      grupos,
    ),
    [
      { id: 1, valor: null },
      { id: 3, valor: null },
      { id: 4, valor: null },
      { id: 5, valor: "7" },
    ],
  );
  assert.throws(() => validarContraCatalogo([{ id: 1, valor: null }, { id: 2, valor: null }], etiquetas, grupos), /una sola/);
  assert.throws(() => validarContraCatalogo([{ id: 99, valor: null }], etiquetas, grupos), /no existe/);
  assert.throws(() => validarContraCatalogo([{ id: 5, valor: null }], etiquetas, grupos), /número/);
  assert.throws(() => validarContraCatalogo([{ id: 5, valor: "abc" }], etiquetas, grupos), /número/);
});

test("armarSecciones: sueltas primero, categorías en orden, búsqueda por nombre o categoría sin acentos", () => {
  const grupos = [
    { id: 1, nombre: "Sentimientos" },
    { id: 2, nombre: "Actividades" },
  ];
  const etiquetas = [
    { id: 1, nombre: "Energía", grupoId: null },
    { id: 2, nombre: "Feliz", grupoId: 1 },
    { id: 3, nombre: "Correr", grupoId: 2 },
    { id: 4, nombre: "Triste", grupoId: 1 },
  ];
  const nombres = (s: ReturnType<typeof armarSecciones<(typeof etiquetas)[number], (typeof grupos)[number]>>) => s.map((x) => `${x.grupo?.nombre ?? "-"}:${x.etiquetas.map((e) => e.nombre).join(",")}`);
  assert.deepEqual(nombres(armarSecciones(grupos, etiquetas)), ["-:Energía", "Sentimientos:Feliz,Triste", "Actividades:Correr"]);
  assert.deepEqual(nombres(armarSecciones(grupos, etiquetas, "energia")), ["-:Energía"]);
  assert.deepEqual(nombres(armarSecciones(grupos, etiquetas, "sentim")), ["Sentimientos:Feliz,Triste"]);
  assert.deepEqual(nombres(armarSecciones(grupos, etiquetas, "zzz")), []);
  // respeta el orden recibido dentro de cada sección (orden por uso lo decide quien llama)
  assert.deepEqual(nombres(armarSecciones(grupos, [...etiquetas].reverse())), ["-:Energía", "Sentimientos:Triste,Feliz", "Actividades:Correr"]);
});

test("categorías de entrada: niveles, altura, padre válido y árbol aplanado", () => {
  const cats: CategoriaArbol[] = [
    { id: 1, padreId: null, nombre: "Fe" },
    { id: 2, padreId: 1, nombre: "Misa" },
    { id: 3, padreId: 2, nombre: "Domingo" },
    { id: 4, padreId: null, nombre: "Estudio" },
  ];
  const porId = new Map(cats.map((c) => [c.id, c]));
  assert.equal(nivelDe(1, porId), 1);
  assert.equal(nivelDe(3, porId), 3);
  assert.equal(alturaDe(1, cats), 2);
  assert.equal(alturaDe(4, cats), 0);
  validarPadre(null, 4, cats); // nueva dentro de «Estudio»: nivel 2
  validarPadre(4, 1, cats); // mover «Estudio» dentro de «Fe»: nivel 2
  assert.throws(() => validarPadre(null, 3, cats), /niveles/); // sería nivel 4
  assert.throws(() => validarPadre(1, 3, cats), /hijas/); // «Fe» dentro de su nieta
  assert.throws(() => validarPadre(2, 2, cats), /sí misma/);
  assert.throws(() => validarPadre(4, 99, cats), /no existe/);
  validarPadre(4, 2, cats); // «Estudio» (sin hijas) dentro de «Misa» (nivel 2): nivel 3, el máximo
  assert.throws(() => validarPadre(1, 4, cats), /niveles/); // «Fe» (con 2 niveles debajo) dentro de «Estudio»: llegaría a 4
  assert.deepEqual(
    aplanarArbol(cats).map((c) => `${c.nivel}${c.nombre}`),
    ["1Estudio", "1Fe", "2Misa", "3Domingo"],
  );
});

test("siembra: nombres limpios y sin repetir, íconos válidos, cantidades de las fuentes", () => {
  const grupo = (n: string) => SEMILLA_GRUPOS.find((g) => g.nombre === n)!;
  assert.equal(grupo("Sentimientos").etiquetas.length, 24); // storypad 23 + Agradecido (Daily You)
  assert.equal(grupo("Actividades").etiquetas.length, 33); // storypad 30 + 3 de Daily You
  assert.equal(grupo("Clima").etiquetas.length, 8);
  assert.equal(grupo("Personas").etiquetas.length, 0);
  assert.ok(grupo("Sentimientos").seleccionUnica && grupo("Clima").seleccionUnica);
  assert.ok(!grupo("Actividades").seleccionUnica && !grupo("Personas").seleccionUnica);
  assert.equal(SEMILLA_SUELTAS[0].tipo, "contador");
  for (const g of SEMILLA_GRUPOS) {
    assert.equal(g.tipoIcono, "icono");
    assert.ok(ICONO_CLAVES.includes(g.icono), g.nombre);
    const nombres = g.etiquetas.map((e) => e.nombre);
    assert.equal(new Set(nombres).size, nombres.length, `${g.nombre}: nombres repetidos`);
    for (const e of g.etiquetas) {
      assert.equal(limpiarNombre(e.nombre), e.nombre);
      assert.deepEqual(validarIcono(e.icono, e.tipoIcono).icono, e.icono, e.nombre);
    }
  }
  for (const e of SEMILLA_SUELTAS) assert.ok(ICONO_CLAVES.includes(e.icono) && esColor(e.color));
});
