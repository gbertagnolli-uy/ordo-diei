import { test } from "node:test";
import assert from "node:assert/strict";
import { misteriosDelDia, GRUPOS_INFO, DEVOCIONARIO_ROSARIO, FUENTE_LECTURAS } from "./rosario.ts";

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

  // Septuagésima no es Cuaresma -> Gloriosos
  assert.equal(misteriosDelDia("2026-10-18", "septuagesima").grupo, "gloriosa");
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

test("cada misterio trae sus lecturas en latín de la Vulgata, sin restos del epub", () => {
  assert.match(FUENTE_LECTURAS, /Vulgata Clementina/);
  for (const grupo of ["gaudiosa", "dolorosa", "gloriosa"] as const) {
    for (const m of GRUPOS_INFO[grupo].misterios) {
      assert.ok(m.lecturas.length >= 1, `${grupo} ${m.numero}`);
      assert.equal(m.cita, m.lecturas.map((l) => l.ref).join("; "));
      for (const l of m.lecturas) {
        assert.ok(l.la.length > 30, l.ref);
        assert.ok(!/[<>&]|\s[;:?!,.]/.test(l.la), `${l.ref}: restos del epub`);
      }
    }
  }
  // pasajes conocidos de la Vulgata
  const anunciacion = GRUPOS_INFO.gaudiosa.misterios[0].lecturas[0].la;
  assert.match(anunciacion, /^In mense autem sexto, missus est angelus Gabriel/);
  assert.match(anunciacion, /Ecce ancilla Domini: fiat mihi secundum verbum tuum\./);
  assert.match(GRUPOS_INFO.gloriosa.misterios[3].lecturas.at(-1)!.la, /^Surge, Domine, in requiem tuam/);
});

test("DEVOCIONARIO_ROSARIO: contiene oraciones tradicionales con fuentes (§10.8)", () => {
  const { oraciones, litaniaeLauretanae } = DEVOCIONARIO_ROSARIO;

  const clavesEsperadas = [
    "signumCrucis",
    "credo",
    "paterNoster",
    "aveMaria",
    "gloriaPatri",
    "fatima",
    "salveRegina",
    "oremusFinal",
  ];

  for (const c of clavesEsperadas) {
    const o = oraciones[c];
    assert.ok(o, `Falta la oración ${c}`);
    assert.ok(o.tituloLa.length > 0);
    assert.ok(o.tituloEs.length > 0);
    assert.ok(o.textoLa.length > 10);
    assert.ok(o.textoEs.length > 10);
    assert.ok(o.fuente.length > 5, `Falta la fuente de ${c}`);
  }

  // Fátima con etiqueta «desde 1917»
  assert.equal(oraciones.fatima.etiqueta, "desde 1917");

  // Salve Regina con versículo y respuesta
  assert.ok(oraciones.salveRegina.versiculoLa?.includes("Ora pro nobis"));
  assert.ok(oraciones.salveRegina.versiculoEs?.includes("Ruega por nosotros"));

  // Letanías Lauretanas con invocaciones bilingües
  assert.ok(litaniaeLauretanae.invocaciones.length >= 50);
  for (const inv of litaniaeLauretanae.invocaciones) {
    assert.ok(inv.la.length > 0);
    assert.ok(inv.es.length > 0);
  }
});
