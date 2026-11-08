import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ICONOS_LUGAR,
  MAX_NOMBRE_LUGAR,
  RADIO_COINCIDENCIA_M,
  aplicarOrden,
  claveDeNombre,
  colorDeIcono,
  colorSobre,
  conDistancia,
  distanciaMetros,
  esIconoLugar,
  falloDeGeolocalizacion,
  limpiarNombreLugar,
  lugarAFrontMatter,
  lugarCercano,
  lugarDeFrontMatter,
  nombreDeCoordenadas,
  nombreDeDireccion,
  redondearParaConsulta,
  textoDistancia,
  validarLatitud,
  validarLugar,
  validarLugarId,
  validarOrdenLugares,
} from "./lugares.ts";

// ── Distancia (place_repository_test.dart: «Haversine distance matches the known value ±1%») ──

test("Haversine: 0,01° de latitud son unos 1111 m, y el mismo punto es 0", () => {
  const d = distanciaMetros(30.0, 120.0, 30.01, 120.0);
  assert.ok(Math.abs(d - 1111) <= 11, `d = ${d}`);
  assert.equal(distanciaMetros(30.0, 120.0, 30.0, 120.0), 0);
});

test("Haversine: Montevideo – Buenos Aires ronda los 205 km", () => {
  const d = distanciaMetros(-34.9011, -56.1645, -34.6037, -58.3816);
  assert.ok(d > 200_000 && d < 210_000, `d = ${d}`);
});

test("Haversine es simétrica", () => {
  assert.ok(Math.abs(distanciaMetros(-34.9, -56.16, -34.6, -58.38) - distanciaMetros(-34.6, -58.38, -34.9, -56.16)) < 1e-6);
});

// ── Coincidencia (place_repository_test.dart: «就近匹配») ───────────────────

const LAT = 30.2841;
const LON = 120.1552;
const lugar = (id: number, nombre: string, latitud = LAT, longitud = LON) => ({ id, nombre, latitud, longitud });

test("lugarCercano: dentro del radio sí, fuera no", () => {
  const lugares = [lugar(1, "Oficina")];
  assert.equal(lugarCercano(lugares, LAT, LON)?.nombre, "Oficina");
  assert.equal(lugarCercano(lugares, LAT + 0.01, LON), null);
});

test("lugarCercano: si caben dos, el más cercano", () => {
  const lugares = [lugar(1, "Parque", LAT + 0.0008), lugar(2, "Oficina", LAT + 0.0001)];
  assert.equal(lugarCercano(lugares, LAT, LON)?.nombre, "Oficina");
});

test("lugarCercano: lista vacía = null, y el radio es de 200 m", () => {
  assert.equal(lugarCercano([], LAT, LON), null);
  assert.equal(RADIO_COINCIDENCIA_M, 200);
  const justo = [lugar(1, "A", LAT + 0.0017)]; // ≈ 189 m
  assert.ok(lugarCercano(justo, LAT, LON));
  const lejos = [lugar(1, "A", LAT + 0.0019)]; // ≈ 211 m
  assert.equal(lugarCercano(lejos, LAT, LON), null);
});

test("conDistancia ordena de cerca a lejos y sin punto deja el orden", () => {
  const lugares = [lugar(1, "Lejos", LAT + 0.05), lugar(2, "Cerca", LAT + 0.001), lugar(3, "Medio", LAT + 0.01)];
  assert.deepEqual(conDistancia(lugares, { latitud: LAT, longitud: LON }).map((l) => l.id), [2, 3, 1]);
  const sin = conDistancia(lugares, null);
  assert.deepEqual(sin.map((l) => l.id), [1, 2, 3]);
  assert.ok(sin.every((l) => l.metros === null));
});

// ── Orden (place_repository_test.dart: «applyPlaceOrder») ───────────────────

test("aplicarOrden: la lista primero, los demás por id al final", () => {
  const ls = [{ id: 1 }, { id: 2 }, { id: 3 }];
  assert.deepEqual(aplicarOrden(ls, [3, 1]).map((l) => l.id), [3, 1, 2]);
  assert.deepEqual(aplicarOrden(ls, []).map((l) => l.id), [1, 2, 3]);
  assert.deepEqual(aplicarOrden(ls, [99, 2]).map((l) => l.id), [2, 1, 3]);
});

// ── Textos ──────────────────────────────────────────────────────────────────

test("textoDistancia: metros bajo 1 km, kilómetros con coma desde ahí", () => {
  assert.equal(textoDistancia(0), "0 m");
  assert.equal(textoDistancia(349.6), "350 m");
  assert.equal(textoDistancia(999.4), "999 m");
  assert.equal(textoDistancia(1000), "1,0 km");
  assert.equal(textoDistancia(12_345), "12,3 km");
  assert.equal(textoDistancia(-1), "");
  assert.equal(textoDistancia(Number.NaN), "");
});

test("nombreDeCoordenadas usa 4 decimales", () => {
  assert.equal(nombreDeCoordenadas(-34.90112, -56.16459), "-34.9011, -56.1646");
});

test("redondearParaConsulta deja 2 decimales (≈ 1 km)", () => {
  assert.equal(redondearParaConsulta(-34.90112), -34.9);
  assert.equal(redondearParaConsulta(-56.16459), -56.16);
  assert.equal(redondearParaConsulta(30), 30);
});

test("claveDeNombre ignora tildes, mayúsculas y espacios repetidos", () => {
  assert.equal(claveDeNombre("  Parque  Rodó "), claveDeNombre("parque rodo"));
  assert.notEqual(claveDeNombre("Casa"), claveDeNombre("Casa 2"));
});

test("nombreDeDireccion: barrio y ciudad, o lo que haya", () => {
  assert.equal(nombreDeDireccion({ suburb: "Pocitos", city: "Montevideo" }), "Pocitos, Montevideo");
  assert.equal(nombreDeDireccion({ town: "Piriápolis" }), "Piriápolis");
  assert.equal(nombreDeDireccion({ neighbourhood: "Centro", village: "Centro" }), "Centro");
  assert.equal(nombreDeDireccion({ county: "Maldonado" }), "Maldonado");
  assert.equal(nombreDeDireccion({}), null);
  assert.equal(nombreDeDireccion(null), null);
  assert.equal(nombreDeDireccion("Montevideo"), null);
  assert.ok((nombreDeDireccion({ suburb: "x".repeat(200), city: "y" }) ?? "").length <= MAX_NOMBRE_LUGAR);
});

// ── Íconos y colores ────────────────────────────────────────────────────────

test("íconos: 8, en el orden de moodiary, y cada uno tiene color", () => {
  assert.deepEqual([...ICONOS_LUGAR], ["house", "building-2", "school", "coffee", "dumbbell", "trees", "hospital", "plane"]);
  for (const i of ICONOS_LUGAR) {
    assert.ok(esIconoLugar(i));
    assert.match(colorDeIcono(i) ?? "", /^#[0-9A-F]{6}$/);
  }
  assert.equal(esIconoLugar("map-pin"), false);
  assert.equal(colorDeIcono("map-pin"), null);
  assert.equal(colorDeIcono(null), null);
});

test("colorSobre: negro sobre colores claros, blanco sobre oscuros", () => {
  assert.equal(colorSobre("#FFEB3B"), "#000000");
  assert.equal(colorSobre("#FFA726"), "#ffffff"); // luminancia 0,49: el límite de moodiary es > 0,5
  assert.equal(colorSobre("#5C6BC0"), "#ffffff");
  assert.equal(colorSobre("#000000"), "#ffffff");
  assert.equal(colorSobre("#FFFFFF"), "#000000");
});

// ── Validación ──────────────────────────────────────────────────────────────

test("validarLugar: lo mínimo, con el nombre limpio", () => {
  const v = validarLugar({ nombre: "  Casa   de  la abuela ", latitud: -34.9011, longitud: -56.1645, icono: "house" });
  assert.deepEqual(v, { nombre: "Casa de la abuela", latitud: -34.9011, longitud: -56.1645, icono: "house" });
});

test("validarLugar: el ícono es opcional y las comas del nombre se conservan", () => {
  const v = validarLugar({ nombre: "Pocitos, Montevideo", latitud: "-34.9", longitud: "-56.1" });
  assert.equal(v.icono, null);
  assert.equal(v.nombre, "Pocitos, Montevideo");
  assert.equal(v.latitud, -34.9);
});

test("validarLugar: rechaza lo inválido", () => {
  const ok = { nombre: "A", latitud: 0, longitud: 0 };
  assert.throws(() => validarLugar({ ...ok, nombre: "   " }), /nombre/i);
  assert.throws(() => validarLugar({ ...ok, nombre: "x".repeat(MAX_NOMBRE_LUGAR + 1) }), /hasta/);
  assert.throws(() => validarLugar({ ...ok, latitud: 91 }), /latitud/i);
  assert.throws(() => validarLugar({ ...ok, longitud: -181 }), /longitud/i);
  assert.throws(() => validarLugar({ ...ok, latitud: "abc" }), /latitud/i);
  assert.throws(() => validarLugar({ ...ok, latitud: null }), /latitud/i);
  assert.throws(() => validarLugar({ ...ok, latitud: "" }), /latitud/i);
  assert.throws(() => validarLugar({ ...ok, icono: "castillo" }), /Ícono/);
  assert.throws(() => validarLugar({ ...ok, latitud: Number.POSITIVE_INFINITY }), /latitud/i);
});

test("validarLugar: los caracteres de control se vuelven espacios", () => {
  assert.equal(limpiarNombreLugar("a\u0000b\nc\td"), "a b c d");
  assert.equal(limpiarNombreLugar(5), "");
});

test("validarLatitud redondea a 6 decimales", () => {
  assert.equal(validarLatitud(-34.123456789), -34.123457);
});

test("validarLugarId: undefined no toca, null borra, entero positivo sí", () => {
  assert.equal(validarLugarId(undefined), undefined);
  assert.equal(validarLugarId(null), null);
  assert.equal(validarLugarId(7), 7);
  for (const malo of [0, -1, 1.5, "3", NaN, {}]) assert.throws(() => validarLugarId(malo), /Lugar/);
});

test("validarOrdenLugares: enteros positivos sin repetir", () => {
  assert.deepEqual(validarOrdenLugares([3, 1, 2]), [3, 1, 2]);
  assert.deepEqual(validarOrdenLugares([]), []);
  assert.throws(() => validarOrdenLugares([1, 1]), /Orden/);
  assert.throws(() => validarOrdenLugares([0]), /Orden/);
  assert.throws(() => validarOrdenLugares("1,2"), /Orden/);
  assert.throws(() => validarOrdenLugares(Array.from({ length: 301 }, (_, i) => i + 1)), /Orden/);
});

// ── Front matter (markdown_front_matter.dart `_position`) ───────────────────

test("front matter: ida y vuelta", () => {
  const l = { nombre: "Casa, Pocitos", latitud: -34.9011, longitud: -56.1645 };
  assert.deepEqual(lugarAFrontMatter(l), ["-34.9011", "-56.1645", "Casa, Pocitos"]);
  assert.deepEqual(lugarDeFrontMatter(lugarAFrontMatter(l)), l);
});

test("front matter: acepta números, mapas con lat/lng/lon y sin nombre", () => {
  assert.deepEqual(lugarDeFrontMatter([-34.9, -56.1]), { nombre: null, latitud: -34.9, longitud: -56.1 });
  assert.deepEqual(lugarDeFrontMatter({ lat: "-34.9", lng: "-56.1", name: "Casa" }), { nombre: "Casa", latitud: -34.9, longitud: -56.1 });
  assert.deepEqual(lugarDeFrontMatter({ latitude: 1, longitude: 2 }), { nombre: null, latitud: 1, longitud: 2 });
  assert.deepEqual(lugarDeFrontMatter({ latitude: 1, lon: 2, name: "  " }), { nombre: null, latitud: 1, longitud: 2 });
});

test("front matter: sin coordenadas o fuera de rango no hay lugar", () => {
  for (const malo of [null, undefined, "x", 5, [], ["a", "b"], [91, 0], [0, 181], [Number.NaN, 0], { lat: 1 }, { name: "x" }, ["", ""]]) {
    assert.equal(lugarDeFrontMatter(malo), null, JSON.stringify(malo));
  }
});

// ── Ubicación ───────────────────────────────────────────────────────────────

test("falloDeGeolocalizacion traduce los códigos del navegador", () => {
  assert.equal(falloDeGeolocalizacion(1), "permisoDenegado");
  assert.equal(falloDeGeolocalizacion(2), "servicioApagado");
  assert.equal(falloDeGeolocalizacion(3), "noDisponible");
  assert.equal(falloDeGeolocalizacion(0), "noDisponible");
});
