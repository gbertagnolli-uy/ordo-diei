import { test } from "node:test";
import assert from "node:assert/strict";
import {
  agrupacionEfectiva,
  agrupacionesDisponibles,
  calcularBins,
  calcularRachas,
  conteoPorDiaSemana,
  contarPalabras,
  cobertura,
  cubetas,
  diasEntre,
  diasEstupendos,
  diasTranscurridos,
  diferencia,
  estadisticasDelPeriodo,
  etiquetaDeBin,
  filasEnRango,
  indiceCubeta,
  limitesDePeriodo,
  mejorDia,
  moverPeriodo,
  nivelDePromedio,
  promedioPorDiaSemana,
  promediosMensuales,
  promediosPorDiaSemana,
  rangoDinamico,
  rangoYContador,
  resumenAnimo,
  serieAgrupada,
  sumarMeses,
  totalesAnimo,
  valoresContador,
  ventanaAnterior,
  ventanaDe,
  ventanaSiguiente,
  type FilaEstadistica,
} from "./estadisticas.ts";

let siguiente = 1;
const fila = (fecha: string, extra: Partial<FilaEstadistica> = {}): FilaEstadistica => ({ id: siguiente++, fecha, hora: null, animo: null, palabras: 0, fotos: 0, categoriaId: null, etiquetas: [], ...extra });

test("contarPalabras separa por espacios y no cuenta vacíos", () => {
  assert.equal(contarPalabras(""), 0);
  assert.equal(contarPalabras("   "), 0);
  assert.equal(contarPalabras("hoy fue   un buen día\ny llovió"), 7);
});

test("sumarMeses acota al último día del mes y cruza el año", () => {
  assert.equal(sumarMeses("2026-03-31", -1), "2026-02-28");
  assert.equal(sumarMeses("2028-03-31", -1), "2028-02-29");
  assert.equal(sumarMeses("2026-01-15", -1), "2025-12-15");
  assert.equal(sumarMeses("2026-11-08", 6), "2027-05-08");
  assert.equal(diasEntre("2026-02-28", "2026-03-01"), 1);
});

test("calcularRachas: racha viva si la última entrada es de hoy o ayer", () => {
  const filas = ["2026-11-08", "2026-11-07", "2026-11-06", "2026-11-03", "2026-11-02"].map((f) => fila(f));
  assert.deepEqual(calcularRachas(filas, "2026-11-08"), { actual: 3, mayor: 3, diasDesdeDiaMalo: null });
  assert.equal(calcularRachas(filas, "2026-11-09").actual, 3); // la última fue ayer
  assert.equal(calcularRachas(filas, "2026-11-10").actual, 0); // hace dos días: se cortó
  assert.equal(calcularRachas(filas, "2026-11-10").mayor, 3);
});

test("calcularRachas: varias entradas el mismo día cuentan una vez y mide desde el último día malo", () => {
  const filas = [fila("2026-11-08", { animo: 4 }), fila("2026-11-08", { animo: 5 }), fila("2026-11-07", { animo: 2 }), fila("2026-11-06", { animo: 1 }), fila("2026-11-05")];
  const r = calcularRachas(filas, "2026-11-08");
  assert.equal(r.actual, 4);
  assert.equal(r.mayor, 4);
  assert.equal(r.diasDesdeDiaMalo, 1);
  assert.deepEqual(calcularRachas([], "2026-11-08"), { actual: 0, mayor: 0, diasDesdeDiaMalo: null });
});

test("calcularRachas: la más larga puede ser anterior a la actual", () => {
  const dias = ["2026-10-01", "2026-10-02", "2026-10-03", "2026-10-04", "2026-11-07", "2026-11-08"];
  const r = calcularRachas(dias.map((d) => fila(d)), "2026-11-08");
  assert.equal(r.actual, 2);
  assert.equal(r.mayor, 4);
});

test("filasEnRango: móvil desde hoy y 'todo' devuelve todas", () => {
  const filas = [fila("2026-11-08"), fila("2026-10-08"), fila("2026-10-07"), fila("2026-06-01"), fila("2025-01-01")];
  assert.equal(filasEnRango(filas, "seis", "2026-11-08").some((f) => f.fecha === "2026-04-30"), false);
  assert.equal(filasEnRango(filas, "mes", "2026-11-08").length, 2);
  assert.equal(filasEnRango(filas, "seis", "2026-11-08").length, 4);
  assert.equal(filasEnRango(filas, "anio", "2026-11-08").length, 4);
  assert.equal(filasEnRango(filas, "todo", "2026-11-08").length, 5);
});

test("totalesAnimo y diasEstupendos", () => {
  const filas = [fila("2026-11-01", { animo: 5 }), fila("2026-11-01", { animo: 4 }), fila("2026-11-02", { animo: 4 }), fila("2026-11-03", { animo: 1 }), fila("2026-11-04")];
  assert.deepEqual(totalesAnimo(filas), { 1: 1, 2: 0, 3: 0, 4: 2, 5: 1 });
  assert.equal(diasEstupendos(filas), 2);
});

test("promedioPorDiaSemana usa lunes primero y el valor de vacío", () => {
  // 2026-11-02 es lunes
  const filas = [fila("2026-11-02", { animo: 4 }), fila("2026-11-09", { animo: 2 }), fila("2026-11-08", { animo: 5 })];
  const p = promedioPorDiaSemana(filas, (f) => f.animo, 1);
  assert.equal(p[0], 3);
  assert.equal(p[6], 5);
  assert.equal(p[3], 1);
  assert.deepEqual(conteoPorDiaSemana(filas, (f) => f.animo !== null && f.animo >= 4), [1, 0, 0, 0, 0, 0, 1]);
});

test("valoresContador lee números con coma o punto y salta lo que no lo es", () => {
  const filas = [
    fila("2026-11-01", { etiquetas: [{ id: 7, valor: "8" }] }),
    fila("2026-11-02", { etiquetas: [{ id: 7, valor: "7,5" }] }),
    fila("2026-11-03", { etiquetas: [{ id: 7, valor: "mucho" }] }),
    fila("2026-11-04", { etiquetas: [{ id: 9, valor: "3" }] }),
    fila("2026-11-05", { etiquetas: [{ id: 7, valor: null }] }),
  ];
  const m = valoresContador(filas, 7);
  assert.deepEqual([...m.values()], [8, 7.5]);
  assert.deepEqual(rangoYContador([8, 7.5]), { min: 0, max: 8 });
  assert.deepEqual(rangoYContador([-3, 4]), { min: -3, max: 4 });
  assert.deepEqual(rangoYContador([]), { min: 0, max: 10 });
  assert.deepEqual(rangoDinamico([0, 0]), { min: 0, max: 1 });
  assert.deepEqual(rangoDinamico([2, 6]), { min: 0, max: 6 });
});

test("cobertura de una etiqueta", () => {
  const filas = [fila("2026-11-01", { etiquetas: [{ id: 3, valor: null }] }), fila("2026-11-02"), fila("2026-11-03"), fila("2026-11-04", { etiquetas: [{ id: 3, valor: null }] })];
  assert.deepEqual(cobertura(filas, 3), { presentes: 2, ausentes: 2, total: 4, porcentaje: 50 });
  assert.equal(cobertura([], 3).porcentaje, 0);
  assert.equal(cobertura(filas.slice(0, 3), 3).porcentaje, 33.3);
});

test("agrupaciones disponibles y efectiva según los días de la serie", () => {
  assert.deepEqual(agrupacionesDisponibles(20), ["dia", "semana"]);
  assert.deepEqual(agrupacionesDisponibles(200), ["semana", "mes"]);
  assert.deepEqual(agrupacionesDisponibles(1000), ["mes", "anio"]);
  assert.equal(agrupacionEfectiva(20, null), "semana");
  assert.equal(agrupacionEfectiva(500, null), "mes");
  assert.equal(agrupacionEfectiva(20, "dia"), "dia");
  assert.equal(agrupacionEfectiva(200, "dia"), "semana"); // día no sirve: la más fina que sirve
  assert.equal(agrupacionEfectiva(1000, "semana"), "mes");
});

test("cubetas e indiceCubeta", () => {
  assert.deepEqual(cubetas("2026-11-01", "2026-11-03", "dia"), ["2026-11-01", "2026-11-02", "2026-11-03"]);
  assert.deepEqual(cubetas("2026-11-01", "2026-11-20", "semana"), ["2026-11-01", "2026-11-08", "2026-11-15"]);
  assert.deepEqual(cubetas("2026-10-20", "2026-12-02", "mes"), ["2026-10-01", "2026-11-01", "2026-12-01"]);
  assert.deepEqual(cubetas("2025-06-01", "2026-11-01", "anio"), ["2025-01-01", "2026-01-01"]);
  const c = cubetas("2026-11-01", "2026-11-20", "semana");
  assert.equal(indiceCubeta(c, "2026-11-01"), 0);
  assert.equal(indiceCubeta(c, "2026-11-14"), 1);
  assert.equal(indiceCubeta(c, "2026-11-20"), 2);
  assert.equal(indiceCubeta(c, "2026-10-31"), -1);
});

test("serieAgrupada promedia o suma por cubeta y deja nulos donde no hay datos", () => {
  const puntos = [
    { fecha: "2026-11-01", valor: 2 },
    { fecha: "2026-11-03", valor: 4 },
    { fecha: "2026-11-17", valor: 5 },
  ];
  const media = serieAgrupada(puntos, "semana", "2026-11-20", "promedio");
  assert.deepEqual(media, [
    { fecha: "2026-11-01", valor: 3 },
    { fecha: "2026-11-08", valor: null },
    { fecha: "2026-11-15", valor: 5 },
  ]);
  assert.equal(serieAgrupada(puntos, "semana", "2026-11-20", "suma")[0].valor, 6);
  assert.deepEqual(serieAgrupada([], "dia", "2026-11-20", "suma"), []);
});

test("calcularBins: valores sueltos si son pocos, bins enteros si son muchos", () => {
  const pocos = calcularBins([1, 2, 2, 3]);
  assert.deepEqual(pocos.map((b) => [b.etiqueta, b.n]), [["1", 1], ["2", 2], ["3", 1]]);
  const muchos = Array.from({ length: 30 }, (_, i) => i + 1);
  const bins = calcularBins(muchos);
  assert.equal(bins.length, 6);
  assert.equal(bins.reduce((s, b) => s + b.n, 0), 30);
  assert.equal(etiquetaDeBin(bins[0], true), "1 – 5");
  assert.deepEqual(calcularBins([]), []);
  const decimales = calcularBins(Array.from({ length: 20 }, (_, i) => i * 0.5 + 0.1));
  assert.equal(decimales.reduce((s, b) => s + b.n, 0), 20);
});

test("ventanas de mes y año, anterior/siguiente y días transcurridos", () => {
  const nov = ventanaDe("mes", "2026-11-15");
  assert.deepEqual([nov.inicio, nov.fin, nov.dias], ["2026-11-01", "2026-11-30", 30]);
  assert.equal(ventanaAnterior(nov).inicio, "2026-10-01");
  assert.equal(ventanaSiguiente(ventanaDe("mes", "2026-12-01")).inicio, "2027-01-01");
  const anio = ventanaDe("anio", "2028-05-05");
  assert.deepEqual([anio.inicio, anio.fin, anio.dias], ["2028-01-01", "2028-12-31", 366]);
  assert.equal(ventanaAnterior(anio).inicio, "2027-01-01");
  assert.equal(diasTranscurridos(nov, "2026-11-08"), 8);
  assert.equal(diasTranscurridos(nov, "2026-12-08"), 30);
});

test("estadisticasDelPeriodo: totales, rankings por grupo y entradas por mes", () => {
  const filas = [
    fila("2026-11-02", { palabras: 10, fotos: 1, categoriaId: 5, etiquetas: [{ id: 1, valor: null }, { id: 3, valor: null }] }),
    fila("2026-11-02", { palabras: 5, etiquetas: [{ id: 1, valor: null }] }),
    fila("2026-11-05", { palabras: 20, fotos: 2, categoriaId: 5, etiquetas: [{ id: 2, valor: null }, { id: 3, valor: "4" }] }),
    fila("2026-10-30", { palabras: 99, etiquetas: [{ id: 1, valor: null }] }),
    fila("2026-11-06", { etiquetas: [{ id: 99, valor: null }] }), // etiqueta que ya no existe
  ];
  const catalogo = [
    { id: 1, grupoId: 10 },
    { id: 2, grupoId: 10 },
    { id: 3, grupoId: null },
  ];
  const e = estadisticasDelPeriodo(filas, ventanaDe("mes", "2026-11-01"), "2026-11-08", catalogo);
  assert.equal(e.entradas, 4);
  assert.equal(e.diasActivos, 3);
  assert.equal(e.diasTotales, 8);
  assert.equal(e.palabras, 35);
  assert.equal(e.fotos, 3);
  assert.deepEqual(e.rankings, [
    { grupoId: 10, items: [{ id: 1, n: 2 }, { id: 2, n: 1 }] },
    { grupoId: null, items: [{ id: 3, n: 2 }] },
  ]);
  assert.deepEqual(e.categorias, [{ id: 5, n: 2 }]);
  assert.equal(e.conteoDiario["2026-11-02"], 2);
  assert.equal(e.porMes[10], 4);
  assert.equal(e.porMes[9], 0);
});

test("limitesDePeriodo: la semana va de lunes a domingo", () => {
  assert.deepEqual(limitesDePeriodo("2026-11-08", "semana"), { inicio: "2026-11-02", fin: "2026-11-09" }); // domingo
  assert.deepEqual(limitesDePeriodo("2026-11-02", "semana"), { inicio: "2026-11-02", fin: "2026-11-09" }); // lunes
  assert.deepEqual(limitesDePeriodo("2026-11-15", "mes"), { inicio: "2026-11-01", fin: "2026-12-01" });
  assert.deepEqual(limitesDePeriodo("2026-11-15", "anio"), { inicio: "2026-01-01", fin: "2027-01-01" });
  assert.equal(moverPeriodo("2026-11-08", "semana", -1), "2026-10-26");
  assert.equal(moverPeriodo("2026-01-20", "mes", -1), "2025-12-01");
  assert.equal(moverPeriodo("2026-06-06", "anio", 1), "2027-01-01");
});

test("resumenAnimo: promedio de promedios diarios, días registrados y mayor racha buena", () => {
  const filas = [
    fila("2026-11-01", { animo: 4 }),
    fila("2026-11-01", { animo: 5 }), // día = 4,5 → nivel 5
    fila("2026-11-02", { animo: 4 }),
    fila("2026-11-03", { animo: 2 }),
    fila("2026-11-04", { animo: 5 }),
    fila("2026-11-05" ), // sin ánimo: no cuenta como día registrado
  ];
  const r = resumenAnimo(filas);
  assert.equal(r.entradas, 6);
  assert.equal(r.diasRegistrados, 4);
  assert.equal(r.promedio, (4.5 + 4 + 2 + 5) / 4);
  assert.equal(r.mayorRachaBuena, 2);
  assert.deepEqual(r.distribucion, { 1: 0, 2: 1, 3: 0, 4: 2, 5: 2 });
  assert.equal(resumenAnimo([]).promedio, null);
});

test("diferencia, nivelDePromedio y mejorDia", () => {
  const a = resumenAnimo([fila("2026-11-01", { animo: 4 })]);
  const b = resumenAnimo([fila("2026-10-01", { animo: 3 })]);
  assert.equal(diferencia(a, b), 1);
  assert.equal(diferencia(a, resumenAnimo([])), null);
  assert.equal(nivelDePromedio(null), null);
  assert.equal(nivelDePromedio(4.5), 5);
  assert.equal(nivelDePromedio(0.2), 1);
  assert.equal(nivelDePromedio(7), 5);
  const dias = resumenAnimo([fila("2026-11-01", { animo: 5 }), fila("2026-11-03", { animo: 5 }), fila("2026-11-02", { animo: 3 })]).dias;
  assert.equal(mejorDia(dias), "2026-11-03");
  assert.equal(mejorDia({}), null);
});

test("promediosPorDiaSemana y promediosMensuales", () => {
  const filas = [fila("2026-11-02", { animo: 4 }), fila("2026-11-09", { animo: 2 }), fila("2026-11-09", { animo: 4 }), fila("2026-10-31", { animo: 5 }), fila("2026-12-02")];
  const p = promediosPorDiaSemana(filas, "2026-11-01", "2026-12-01");
  assert.equal(p[0], 3.5); // lunes: 4 y el día 9 (promedio 3)
  assert.equal(p[5], null); // el sábado 31/10 queda fuera del período
  const m = promediosMensuales(filas);
  assert.equal(m["2026-11"], 3.5);
  assert.equal(m["2026-10"], 5);
  assert.equal(m["2026-12"], null);
});
