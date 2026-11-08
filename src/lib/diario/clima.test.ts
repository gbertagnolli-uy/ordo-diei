import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CLIMAS_MANUALES,
  MAX_TEXTO_CLIMA,
  climaAFrontMatter,
  climaDeFrontMatter,
  climaDeOpenMeteo,
  climaManual,
  codigoDeWmo,
  grupoDeClima,
  textoClima,
  textoClimaCompacto,
  textoDeCodigo,
  validarClima,
} from "./clima.ts";

test("hay 16 climas manuales, con los códigos de moodiary y en su orden", () => {
  assert.deepEqual(
    CLIMAS_MANUALES.map((c) => c.codigo),
    ["100", "101", "104", "300", "305", "306", "307", "310", "302", "400", "402", "404", "501", "502", "900", "901"],
  );
  assert.equal(new Set(CLIMAS_MANUALES.map((c) => c.texto)).size, 16);
});

test("climaManual: sin temperatura, y un código ajeno no existe", () => {
  assert.deepEqual(climaManual("305"), { codigo: "305", temp: null, texto: "Lluvia débil" });
  assert.equal(climaManual("999"), null);
  assert.equal(climaManual(""), null);
});

test("textoClima y textoClimaCompacto (moodiary displayText / compactText)", () => {
  assert.equal(textoClima({ texto: "Soleado", temp: 23 }), "Soleado 23°");
  assert.equal(textoClima({ texto: "Soleado", temp: null }), "Soleado");
  assert.equal(textoClimaCompacto({ texto: "Soleado", temp: 23 }), "23°");
  assert.equal(textoClimaCompacto({ texto: "Soleado", temp: null }), "Soleado");
  assert.equal(textoClima({ texto: "Frío", temp: -3 }), "Frío -3°");
  assert.equal(textoClima({ texto: "Calor", temp: 0 }), "Calor 0°");
});

test("grupoDeClima por rango de código", () => {
  const casos: [string, string][] = [
    ["100", "sol"], ["101", "parcial"], ["103", "parcial"], ["104", "nublado"], ["150", "luna"], ["152", "lunaNube"],
    ["300", "lluvia"], ["305", "lluvia"], ["313", "lluvia"], ["309", "llovizna"], ["302", "tormenta"], ["304", "tormenta"],
    ["400", "nieve"], ["404", "nieve"], ["499", "nieve"], ["501", "niebla"], ["515", "niebla"], ["900", "calor"], ["901", "frio"],
    ["999", "desconocido"], ["1001", "desconocido"], ["", "desconocido"], ["sol", "desconocido"],
  ];
  for (const [codigo, grupo] of casos) assert.equal(grupoDeClima(codigo), grupo, codigo);
  assert.equal(grupoDeClima(null), "desconocido");
  assert.equal(grupoDeClima(undefined), "desconocido");
});

test("validarClima: undefined no toca, null borra", () => {
  assert.equal(validarClima(undefined), undefined);
  assert.equal(validarClima(null), null);
});

test("validarClima: un código conocido completa el texto; la temperatura se redondea", () => {
  assert.deepEqual(validarClima({ codigo: "100" }), { codigo: "100", temp: null, texto: "Soleado" });
  assert.deepEqual(validarClima({ codigo: "100", temp: 23.6 }), { codigo: "100", temp: 24, texto: "Soleado" });
  assert.deepEqual(validarClima({ codigo: 305, temp: "18,4" }), { codigo: "305", temp: 18, texto: "Lluvia débil" });
  assert.deepEqual(validarClima({ codigo: "100", temp: "" }), { codigo: "100", temp: null, texto: "Soleado" });
});

test("validarClima: un código desconocido necesita su texto (lo que trae una importación)", () => {
  assert.deepEqual(validarClima({ codigo: "2301", texto: "  Aire   seco " }), { codigo: "2301", temp: null, texto: "Aire seco" });
  assert.throws(() => validarClima({ codigo: "2301" }), /texto/);
});

test("validarClima: rechaza lo inválido", () => {
  for (const malo of ["100", 5, [], { codigo: "" }, { codigo: "ab" }, { codigo: "12" }, { codigo: "12345" }, { codigo: "100", temp: "mucho" }, { codigo: "100", temp: 99 }, { codigo: "100", temp: -91 }]) {
    assert.throws(() => validarClima(malo), /Clima|Temperatura/, JSON.stringify(malo));
  }
  assert.throws(() => validarClima({ codigo: "2301", texto: "x".repeat(MAX_TEXTO_CLIMA + 1) }), /hasta/);
});

// ── Open-Meteo ──────────────────────────────────────────────────────────────

test("codigoDeWmo: de día y de noche", () => {
  assert.equal(codigoDeWmo(0, true), "100");
  assert.equal(codigoDeWmo(0, false), "150");
  assert.equal(codigoDeWmo(1, true), "102");
  assert.equal(codigoDeWmo(2, false), "153");
  assert.equal(codigoDeWmo(3, true), "104");
  assert.equal(codigoDeWmo(3, false), "104");
  assert.equal(codigoDeWmo(61, false), "305");
});

test("codigoDeWmo: cada código del estándar tiene respuesta y todas existen en la tabla de textos", () => {
  const wmo = [0, 1, 2, 3, 45, 48, 51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 71, 73, 75, 77, 80, 81, 82, 85, 86, 95, 96, 99];
  for (const w of wmo) {
    for (const dia of [true, false]) {
      const c = codigoDeWmo(w, dia);
      assert.ok(c, `WMO ${w}`);
      assert.ok(textoDeCodigo(c), `WMO ${w} → ${c} sin texto`);
    }
  }
  assert.equal(codigoDeWmo(4, true), null);
  assert.equal(codigoDeWmo(-1, true), null);
});

test("climaDeOpenMeteo: arma el clima con temperatura entera", () => {
  const r = climaDeOpenMeteo({ current: { temperature_2m: 21.7, weather_code: 63, is_day: 1 } });
  assert.deepEqual(r, { codigo: "306", temp: 22, texto: "Lluvia moderada" });
  assert.deepEqual(climaDeOpenMeteo({ current: { temperature_2m: 12.2, weather_code: 0, is_day: 0 } }), { codigo: "150", temp: 12, texto: "Despejado" });
});

test("climaDeOpenMeteo: sin temperatura válida queda sin ella; sin código no hay clima", () => {
  assert.deepEqual(climaDeOpenMeteo({ current: { weather_code: 3 } }), { codigo: "104", temp: null, texto: "Cubierto" });
  assert.deepEqual(climaDeOpenMeteo({ current: { temperature_2m: 500, weather_code: 3 } }), { codigo: "104", temp: null, texto: "Cubierto" });
  assert.equal(climaDeOpenMeteo({ current: { temperature_2m: 20 } }), null);
  assert.equal(climaDeOpenMeteo({ current: { weather_code: 7 } }), null);
  assert.equal(climaDeOpenMeteo({}), null);
  assert.equal(climaDeOpenMeteo(null), null);
  assert.equal(climaDeOpenMeteo("x"), null);
});

// ── Front matter ────────────────────────────────────────────────────────────

test("front matter: ida y vuelta", () => {
  const c = { codigo: "100", temp: 23, texto: "Soleado" };
  assert.deepEqual(climaAFrontMatter(c), ["100", "23", "Soleado"]);
  assert.deepEqual(climaAFrontMatter({ ...c, temp: null }), ["100", "", "Soleado"]);
  assert.deepEqual(climaDeFrontMatter(climaAFrontMatter(c)), c);
  assert.deepEqual(climaDeFrontMatter(climaAFrontMatter({ ...c, temp: null })), { ...c, temp: null });
});

test("front matter: acepta el mapa {icon, temp, text} y descarta lo que no entiende", () => {
  assert.deepEqual(climaDeFrontMatter({ icon: 305, temp: 18, text: "Lluvia" }), { codigo: "305", temp: 18, texto: "Lluvia" });
  assert.equal(climaDeFrontMatter({ icon: "sol", temp: 20 }), null);
  assert.equal(climaDeFrontMatter("100"), null);
  assert.equal(climaDeFrontMatter(null), null);
  assert.equal(climaDeFrontMatter([]), null);
});
