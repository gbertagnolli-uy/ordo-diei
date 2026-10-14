import { test } from "node:test";
import assert from "node:assert/strict";
import { misteriosDelDia, GRUPOS_INFO } from "./rosario.ts";

test("misteriosDelDia: asignación por días de semana fijos (§10.8)", () => {
  // 2026-10-12 = Lunes -> Gaudiosa
  assert.equal(misteriosDelDia("2026-10-12").grupo, "gaudiosa");
  assert.equal(misteriosDelDia("2026-10-12").motivo, "lunes");

  // 2026-10-13 = Martes -> Dolorosa
  assert.equal(misteriosDelDia("2026-10-13").grupo, "dolorosa");
  assert.equal(misteriosDelDia("2026-10-13").motivo, "martes");

  // 2026-10-14 = Miércoles -> Gloriosa
  assert.equal(misteriosDelDia("2026-10-14").grupo, "gloriosa");
  assert.equal(misteriosDelDia("2026-10-14").motivo, "miércoles");

  // 2026-10-15 = Jueves -> Gaudiosa
  assert.equal(misteriosDelDia("2026-10-15").grupo, "gaudiosa");
  assert.equal(misteriosDelDia("2026-10-15").motivo, "jueves");

  // 2026-10-16 = Viernes -> Dolorosa
  assert.equal(misteriosDelDia("2026-10-16").grupo, "dolorosa");
  assert.equal(misteriosDelDia("2026-10-16").motivo, "viernes");

  // 2026-10-17 = Sábado -> Gloriosa
  assert.equal(misteriosDelDia("2026-10-17").grupo, "gloriosa");
  assert.equal(misteriosDelDia("2026-10-17").motivo, "sábado");
});

test("misteriosDelDia: regla dominical tradicional según el tiempo litúrgico (§10.8)", () => {
  // 2026-10-18 = Domingo
  // Adviento -> Gozosos
  assert.equal(misteriosDelDia("2026-10-18", "adviento").grupo, "gaudiosa");
  // Navidad -> Gozosos
  assert.equal(misteriosDelDia("2026-10-18", "navidad").grupo, "gaudiosa");
  // Epifanía -> Gozosos
  assert.equal(misteriosDelDia("2026-10-18", "epifania").grupo, "gaudiosa");

  // Septuagésima -> Dolorosos
  assert.equal(misteriosDelDia("2026-10-18", "septuagesima").grupo, "dolorosa");
  // Cuaresma -> Dolorosos
  assert.equal(misteriosDelDia("2026-10-18", "cuaresma").grupo, "dolorosa");
  // Pasión -> Dolorosos
  assert.equal(misteriosDelDia("2026-10-18", "pasion").grupo, "dolorosa");

  // Pascua -> Gloriosos
  assert.equal(misteriosDelDia("2026-10-18", "pascua").grupo, "gloriosa");
  // Pentecostés -> Gloriosos
  assert.equal(misteriosDelDia("2026-10-18", "pentecostes").grupo, "gloriosa");
});

test("cada grupo contiene exactamente 5 misterios con número romano, fruto y cita bíblica", () => {
  for (const grupo of ["gaudiosa", "dolorosa", "gloriosa"] as const) {
    const info = GRUPOS_INFO[grupo];
    assert.equal(info.misterios.length, 5);
    for (let i = 0; i < 5; i++) {
      const m = info.misterios[i];
      assert.equal(m.numero, i + 1);
      assert.ok(["I", "II", "III", "IV", "V"].includes(m.numeroRomano));
      assert.ok(m.latino.length > 5);
      assert.ok(m.castellano.length > 5);
      assert.ok(m.fruto.length > 3);
      assert.ok(m.cita.length > 2);
    }
  }
});
