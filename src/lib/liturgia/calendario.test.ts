import { test } from "node:test";
import assert from "node:assert/strict";
import { adviento, aISO, diaDeSemana, fechaDeISO, pascua, sumarDias, tiempoLiturgico } from "./calendario.ts";

const t = (iso: string) => tiempoLiturgico(fechaDeISO(iso));

test("Pascua: fechas conocidas", () => {
  assert.equal(aISO(pascua(2024)), "2024-03-31");
  assert.equal(aISO(pascua(2025)), "2025-04-20");
  assert.equal(aISO(pascua(2026)), "2026-04-05");
  assert.equal(aISO(pascua(2027)), "2027-03-28");
  assert.equal(aISO(pascua(2035)), "2035-03-25");
});

test("Adviento empieza el domingo más cercano al 30-nov", () => {
  assert.equal(aISO(adviento(2026)), "2026-11-29");
  assert.equal(aISO(adviento(2027)), "2027-11-28");
  assert.equal(aISO(adviento(2029)), "2029-12-02");
  for (let y = 2026; y <= 2035; y++) assert.equal(diaDeSemana(adviento(y)), 0);
});

test("tiempos del año 2026 en los bordes", () => {
  assert.equal(t("2026-01-01"), "navidad");
  assert.equal(t("2026-01-05"), "navidad");
  assert.equal(t("2026-01-06"), "epifania");
  assert.equal(t("2026-01-31"), "epifania");
  assert.equal(t("2026-02-01"), "septuagesima"); // domingo de Septuagésima
  assert.equal(t("2026-02-17"), "septuagesima"); // martes antes de Ceniza
  assert.equal(t("2026-02-18"), "cuaresma"); // Miércoles de Ceniza
  assert.equal(t("2026-03-21"), "cuaresma");
  assert.equal(t("2026-03-22"), "pasion"); // domingo de Pasión
  assert.equal(t("2026-04-04"), "pasion"); // Sábado Santo
  assert.equal(t("2026-04-05"), "pascua");
  assert.equal(t("2026-05-23"), "pascua"); // sábado antes de Pentecostés
  assert.equal(t("2026-05-24"), "pentecostes");
  assert.equal(t("2026-10-14"), "pentecostes");
  assert.equal(t("2026-11-28"), "pentecostes");
  assert.equal(t("2026-11-29"), "adviento");
  assert.equal(t("2026-12-24"), "adviento");
  assert.equal(t("2026-12-25"), "navidad");
  assert.equal(t("2026-12-31"), "navidad");
});

test("sumarDias cruza meses y años", () => {
  assert.equal(aISO(sumarDias(fechaDeISO("2026-12-31"), 1)), "2027-01-01");
  assert.equal(aISO(sumarDias(fechaDeISO("2028-02-28"), 1)), "2028-02-29");
});

test("los tiempos de un año son monótonos y no se saltean (2026–2035)", () => {
  const orden = ["navidad", "epifania", "septuagesima", "cuaresma", "pasion", "pascua", "pentecostes", "adviento", "navidad"];
  for (let y = 2026; y <= 2035; y++) {
    let i = 0;
    let f = { y, m: 1, d: 1 };
    while (f.y === y) {
      const cur = tiempoLiturgico(f);
      while (orden[i] !== cur) {
        i++;
        assert.ok(i < orden.length, `${y}: ${aISO(f)} → ${cur} fuera de orden`);
      }
      f = sumarDias(f, 1);
    }
  }
});
