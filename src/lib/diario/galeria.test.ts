import { test } from "node:test";
import assert from "node:assert/strict";
import { aParametros, FILTRO_VACIO, leerFiltro, filtrosActivos, hayBusqueda } from "./busqueda.ts";
import { docDesdeTexto, type NodoDoc } from "./contenido.ts";
import {
  FILTRO_GALERIA,
  OPCIONES_GALERIA,
  PAGINA_GALERIA,
  cuentaDeGaleria,
  esOpcionesGaleria,
  filtroDeGaleria,
  fotosDeEntrada,
  fotosDeTarjeta,
  mostrarSubir,
  tarjetaGrande,
} from "./galeria.ts";

const A = "/api/archivos/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const B = "/api/archivos/bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
const C = "/api/archivos/cccccccc-cccc-cccc-cccc-cccccccccccc";
const docConImagenes = (...srcs: string[]): NodoDoc => ({
  type: "doc",
  content: [{ type: "paragraph" }, ...srcs.map((src) => ({ type: "image", attrs: { src } }))],
});

test("fotos de la entrada: las adjuntas primero, luego las del texto, sin repetir", () => {
  assert.deepEqual(fotosDeEntrada({ fotos: [A], contenido: docConImagenes(B, A, C) }), [A, B, C]);
  assert.deepEqual(fotosDeEntrada({ fotos: [], contenido: null }), []);
  assert.deepEqual(fotosDeEntrada({ fotos: [], contenido: docDesdeTexto("hola") }), []);
});

test("las opciones se validan", () => {
  assert.ok(esOpcionesGaleria(OPCIONES_GALERIA));
  assert.ok(esOpcionesGaleria({ modo: "lista", mostrarFotos: false }));
  assert.ok(!esOpcionesGaleria({ modo: "otra", mostrarFotos: true }));
  assert.ok(!esOpcionesGaleria({ modo: "grilla" }));
  assert.ok(!esOpcionesGaleria(null));
  assert.ok(!esOpcionesGaleria("grilla"));
});

// Daily You gallery_page: tarjetas grandes en modo lista o con búsqueda
test("tarjeta grande en el modo lista o con un texto buscado", () => {
  assert.equal(tarjetaGrande(OPCIONES_GALERIA, ""), false);
  assert.equal(tarjetaGrande(OPCIONES_GALERIA, "  "), false);
  assert.equal(tarjetaGrande(OPCIONES_GALERIA, "playa"), true);
  assert.equal(tarjetaGrande({ modo: "lista", mostrarFotos: true }, ""), true);
});

test("el filtro de la galería pide fotos, desde el principio y con su página", () => {
  const f = filtroDeGaleria({ ...FILTRO_VACIO, consulta: "mar", desplazamiento: 96, limite: 7, orden: "animo", sentido: "asc" });
  assert.equal(f.soloFotos, true);
  assert.equal(f.desplazamiento, 0);
  assert.equal(f.limite, PAGINA_GALERIA);
  assert.equal(f.consulta, "mar");
  assert.equal(f.orden, "animo");
  assert.equal(f.sentido, "asc");
  assert.equal(FILTRO_GALERIA.soloFotos, true);
});

test("fotos=si viaja en los parámetros y vuelve igual", () => {
  const p = aParametros(FILTRO_GALERIA, "personal");
  assert.equal(p.get("fotos"), "si");
  assert.equal(p.get("limite"), String(PAGINA_GALERIA));
  const f = leerFiltro(p);
  assert.equal(f.soloFotos, true);
  assert.equal(f.limite, PAGINA_GALERIA);
  assert.equal(leerFiltro(new URLSearchParams("tipo=personal")).soloFotos, false);
  assert.equal(aParametros(FILTRO_VACIO, "personal").has("fotos"), false);
});

test("«solo fotos» no cuenta como filtro de la búsqueda común", () => {
  assert.equal(filtrosActivos({ ...FILTRO_VACIO, soloFotos: true }), 0);
  assert.equal(hayBusqueda({ ...FILTRO_VACIO, soloFotos: true }), false);
});

test("la tarjeta chica muestra la portada y cuántas fotos más hay", () => {
  assert.deepEqual(fotosDeTarjeta([A, B, C], false, true), { portada: A, miniaturas: [], restantes: 2 });
  assert.deepEqual(fotosDeTarjeta([A], false, true), { portada: A, miniaturas: [], restantes: 0 });
});

test("la tarjeta grande suma miniaturas (hasta tres) y cuenta el resto", () => {
  assert.deepEqual(fotosDeTarjeta([A, B, C], true, true), { portada: A, miniaturas: [B, C], restantes: 0 });
  const seis = ["1", "2", "3", "4", "5", "6"];
  assert.deepEqual(fotosDeTarjeta(seis, true, true), { portada: "1", miniaturas: ["2", "3", "4"], restantes: 2 });
});

test("sin mostrar fotos (o sin fotos) la tarjeta no lleva ninguna", () => {
  assert.deepEqual(fotosDeTarjeta([A, B], true, false), { portada: null, miniaturas: [], restantes: 0 });
  assert.deepEqual(fotosDeTarjeta([], false, true), { portada: null, miniaturas: [], restantes: 0 });
});

test("la cuenta de resultados", () => {
  assert.equal(cuentaDeGaleria(1), "1 entrada con fotos");
  assert.equal(cuentaDeGaleria(0), "0 entradas con fotos");
  assert.match(cuentaDeGaleria(1234), /^1.?234 entradas con fotos$/);
});

test("el botón de subir aparece pasados 500 px", () => {
  assert.equal(mostrarSubir(500), false);
  assert.equal(mostrarSubir(501), true);
  assert.equal(mostrarSubir(0), false);
});
