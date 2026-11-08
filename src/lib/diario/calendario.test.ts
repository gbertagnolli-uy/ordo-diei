import { test } from "node:test";
import assert from "node:assert/strict";
import {
  acotarAnioMes,
  acotarMes,
  aniosConEntradas,
  aniosDelRango,
  cantidadDelAnio,
  cantidadDelMes,
  cantidadEnRango,
  cantidadPorMes,
  cantidadUltimoAnio,
  celdasDelMes,
  columnasCalor,
  contenidoDeCelda,
  diasDelMes,
  diasEscritos,
  elegirDia,
  esMes,
  esOpcionesCalendario,
  fechasDelMes,
  filtrarPorEtiqueta,
  geometriaMes,
  lunesDe,
  marcasDeMeses,
  mesHabilitado,
  moverMes,
  OPCIONES_CALENDARIO,
  portadaDe,
  primeraFecha,
  rangoDeMeses,
  resolverNivelCalor,
  resumenDeDias,
  semanasEntre,
  textoContador,
  type DiaCalendario,
  type EntradaDeCalendario,
} from "./calendario.ts";
import type { FilaEstadistica } from "./estadisticas.ts";

let id = 1;
const entrada = (fecha: string, extra: Partial<EntradaDeCalendario> = {}): EntradaDeCalendario => ({
  id: id++,
  fecha,
  hora: 600,
  creadaEn: `${fecha}T10:00:00.000Z`,
  animo: null,
  titulo: null,
  texto: "hola",
  contenido: null,
  fotos: [],
  categoriaId: null,
  etiquetas: [],
  ...extra,
});
const fila = (fecha: string, extra: Partial<FilaEstadistica> = {}): FilaEstadistica => ({ id: id++, fecha, hora: 600, animo: null, palabras: 10, fotos: 0, categoriaId: null, etiquetas: [], ...extra });

// ── Meses ──
test("moverMes suma y resta meses cruzando el año", () => {
  assert.equal(moverMes("2026-11", 1), "2026-12");
  assert.equal(moverMes("2026-12", 1), "2027-01");
  assert.equal(moverMes("2026-01", -1), "2025-12");
  assert.equal(moverMes("2026-03", -14), "2025-01");
});

test("esMes valida el formato", () => {
  assert.equal(esMes("2026-02"), true);
  assert.equal(esMes("2026-13"), false);
  assert.equal(esMes("2026-2"), false);
  assert.equal(esMes(5), false);
});

test("diasDelMes y fechasDelMes respetan los bisiestos", () => {
  assert.equal(diasDelMes("2026-02"), 28);
  assert.equal(diasDelMes("2028-02"), 29);
  assert.equal(diasDelMes("2026-04"), 30);
  assert.deepEqual(fechasDelMes("2026-02").slice(-1), ["2026-02-28"]);
  assert.equal(fechasDelMes("2026-12").length, 31);
});

test("geometriaMes cuenta los huecos con la semana desde el lunes", () => {
  // 1 de noviembre de 2026 es domingo → seis huecos
  assert.deepEqual(geometriaMes("2026-11"), { huecos: 6, dias: 30 });
  // 1 de junio de 2026 es lunes → ninguno
  assert.deepEqual(geometriaMes("2026-06"), { huecos: 0, dias: 30 });
});

test("celdasDelMes siempre devuelve seis filas de siete", () => {
  for (const mes of ["2026-02", "2026-06", "2026-11", "2027-05", "2028-02"]) {
    const celdas = celdasDelMes(mes);
    assert.equal(celdas.length, 42, mes);
    assert.equal(celdas.filter((c) => c !== null).length, diasDelMes(mes), mes);
    assert.equal(celdas[geometriaMes(mes).huecos], `${mes}-01`);
  }
});

test("elegirDia conserva el número de día y lo acota al largo del mes", () => {
  assert.equal(elegirDia("2026-02", 31, "2026-11-08"), "2026-02-28");
  assert.equal(elegirDia("2026-05", 15, "2026-11-08"), "2026-05-15");
  assert.equal(elegirDia("2026-05", 0, "2026-11-08"), "2026-05-01");
});

test("elegirDia va al primer día con entradas si el mismo día está vacío", () => {
  const con = new Set(["2026-05-03", "2026-05-20"]);
  assert.equal(elegirDia("2026-05", 15, "2026-11-08", con), "2026-05-03");
  assert.equal(elegirDia("2026-05", 20, "2026-11-08", con), "2026-05-20");
  assert.equal(elegirDia("2026-05", 15, "2026-11-08", new Set()), "2026-05-15");
});

test("elegirDia nunca elige un día futuro", () => {
  assert.equal(elegirDia("2026-11", 30, "2026-11-08"), "2026-11-08");
  assert.equal(elegirDia("2026-12", 5, "2026-11-08"), "2026-12-01");
});

// ── Resumen de días ──
test("portadaDe toma la foto adjunta y, si no, la primera imagen del documento", () => {
  assert.equal(portadaDe({ fotos: ["/a"], contenido: null }), "/a");
  assert.equal(portadaDe({ fotos: [], contenido: null }), null);
  const doc = { type: "doc", content: [{ type: "paragraph" }, { type: "image", attrs: { src: "/img" } }] };
  assert.equal(portadaDe({ fotos: [], contenido: doc }), "/img");
  assert.equal(portadaDe({ fotos: ["/a"], contenido: doc }), "/a");
});

test("resumenDeDias cuenta las entradas y elige el último ánimo", () => {
  const dias = resumenDeDias([
    entrada("2026-11-02", { hora: 500, animo: 2, creadaEn: "2026-11-02T08:00:00.000Z" }),
    entrada("2026-11-02", { hora: 900, animo: 5, creadaEn: "2026-11-02T15:00:00.000Z" }),
    entrada("2026-11-02", { hora: 1000, animo: null, creadaEn: "2026-11-02T16:00:00.000Z" }),
    entrada("2026-11-03"),
  ]);
  assert.equal(dias["2026-11-02"].cantidad, 3);
  assert.equal(dias["2026-11-02"].animo, 5);
  assert.equal(dias["2026-11-03"].animo, null);
  assert.equal(dias["2026-11-04"], undefined);
});

test("resumenDeDias: portada de la entrada más reciente con foto, título y categoría de la primera del día", () => {
  const dias = resumenDeDias([
    entrada("2026-11-02", { hora: 500, titulo: "  Mañana ", categoriaId: 7, fotos: ["/vieja"] }),
    entrada("2026-11-02", { hora: 900, titulo: "Tarde", categoriaId: 8, fotos: ["/nueva", "/otra"] }),
    entrada("2026-11-02", { hora: 1000, titulo: "Noche" }),
  ]);
  const d = dias["2026-11-02"];
  assert.equal(d.portada, "/nueva");
  assert.equal(d.titulo, "Mañana");
  assert.equal(d.categoriaId, 7);
});

test("resumenDeDias: la etiqueta superpuesta sale de la primera entrada del día que la tiene", () => {
  const entradas = [
    entrada("2026-11-02", { hora: 500, etiquetas: [{ id: 3, valor: null }] }),
    entrada("2026-11-02", { hora: 900, etiquetas: [{ id: 4, valor: "12" }, { id: 3, valor: "8" }] }),
    entrada("2026-11-03", { etiquetas: [{ id: 4, valor: "1" }] }),
  ];
  const dias = resumenDeDias(entradas, 3);
  assert.deepEqual(dias["2026-11-02"].etiqueta, { valor: null });
  assert.equal(dias["2026-11-03"].etiqueta, null);
  assert.deepEqual(resumenDeDias(entradas, 4)["2026-11-02"].etiqueta, { valor: "12" });
  assert.equal(resumenDeDias(entradas)["2026-11-02"].etiqueta, null);
});

test("filtrarPorEtiqueta deja solo las entradas con esa etiqueta", () => {
  const lista = [{ etiquetas: [{ id: 1 }] }, { etiquetas: [{ id: 2 }] }, { etiquetas: [] }];
  assert.equal(filtrarPorEtiqueta(lista, 2).length, 1);
  assert.equal(filtrarPorEtiqueta(lista, null).length, 3);
  assert.equal(filtrarPorEtiqueta(lista, 9).length, 0);
});

test("textoContador topa en 99+", () => {
  assert.equal(textoContador(1), "1");
  assert.equal(textoContador(99), "99");
  assert.equal(textoContador(100), "99+");
});

// ── Opciones y celda ──
test("esOpcionesCalendario valida lo guardado", () => {
  assert.equal(esOpcionesCalendario(OPCIONES_CALENDARIO), true);
  assert.equal(esOpcionesCalendario({ imagenes: true, animo: false, etiqueta: 5 }), true);
  assert.equal(esOpcionesCalendario({ imagenes: true, animo: false, etiqueta: "5" }), false);
  assert.equal(esOpcionesCalendario({ imagenes: true }), false);
  assert.equal(esOpcionesCalendario(null), false);
});

const dia = (extra: Partial<DiaCalendario> = {}): DiaCalendario => ({ cantidad: 1, animo: 4, portada: "/p", categoriaId: null, titulo: "", etiqueta: null, ...extra });

test("contenidoDeCelda: con imágenes y ánimo, portada y el ánimo en la esquina", () => {
  assert.deepEqual(contenidoDeCelda(dia(), OPCIONES_CALENDARIO), { fondo: "portada", centro: "numero", esquinaAnimo: true, esquinaEtiqueta: false });
});

test("contenidoDeCelda: sin portada el fondo es de color y se ve el número", () => {
  assert.equal(contenidoDeCelda(dia({ portada: null }), OPCIONES_CALENDARIO).fondo, "color");
  assert.equal(contenidoDeCelda(dia({ portada: null }), OPCIONES_CALENDARIO).centro, "numero");
});

test("contenidoDeCelda: sin imágenes el ánimo pasa al centro y no queda en la esquina", () => {
  const c = contenidoDeCelda(dia(), { ...OPCIONES_CALENDARIO, imagenes: false });
  assert.equal(c.fondo, "color");
  assert.equal(c.centro, "animo");
  assert.equal(c.esquinaAnimo, false);
});

test("contenidoDeCelda: con varias entradas no hay ánimo en la esquina (va el contador)", () => {
  assert.equal(contenidoDeCelda(dia({ cantidad: 3 }), OPCIONES_CALENDARIO).esquinaAnimo, false);
});

test("contenidoDeCelda: la etiqueta va al centro solo sin imágenes ni ánimo; un contador queda también en la esquina", () => {
  const solo = { imagenes: false, animo: false, etiqueta: 3 };
  const conEtiqueta = dia({ etiqueta: { valor: "8" } });
  assert.deepEqual(contenidoDeCelda(conEtiqueta, solo, false), { fondo: "color", centro: "etiqueta", esquinaAnimo: false, esquinaEtiqueta: false });
  assert.equal(contenidoDeCelda(conEtiqueta, solo, true).esquinaEtiqueta, true);
  const conAnimo = contenidoDeCelda(conEtiqueta, { imagenes: false, animo: true, etiqueta: 3 });
  assert.equal(conAnimo.centro, "animo");
  assert.equal(conAnimo.esquinaEtiqueta, true);
  assert.equal(contenidoDeCelda(dia(), solo).esquinaEtiqueta, false);
});

// ── Selector de mes ──
test("rangoDeMeses va del mes de la primera entrada al de hoy", () => {
  assert.deepEqual(rangoDeMeses("2024-03-15", "2026-11-08"), { primero: { anio: 2024, mes: 3 }, ultimo: { anio: 2026, mes: 11 } });
  assert.deepEqual(rangoDeMeses(null, "2026-11-08"), { primero: { anio: 2026, mes: 11 }, ultimo: { anio: 2026, mes: 11 } });
  assert.deepEqual(rangoDeMeses("2027-01-01", "2026-11-08").primero, { anio: 2026, mes: 11 });
});

test("mesHabilitado y acotarMes respetan los bordes del rango", () => {
  const r = rangoDeMeses("2024-03-15", "2026-11-08");
  assert.equal(mesHabilitado(r, 2024, 2), false);
  assert.equal(mesHabilitado(r, 2024, 3), true);
  assert.equal(mesHabilitado(r, 2026, 11), true);
  assert.equal(mesHabilitado(r, 2026, 12), false);
  assert.equal(acotarMes(r, 2024, 1), 3);
  assert.equal(acotarMes(r, 2026, 12), 11);
  assert.equal(acotarMes(r, 2025, 7), 7);
});

test("acotarAnioMes lleva una fecha fuera de rango al borde", () => {
  const r = rangoDeMeses("2024-03-15", "2026-11-08");
  assert.deepEqual(acotarAnioMes(r, "2020-01"), { anio: 2024, mes: 3 });
  // Como Daily You `clamp`: se acota el año y después el mes dentro de ese año
  assert.deepEqual(acotarAnioMes(r, "2030-05"), { anio: 2026, mes: 5 });
  assert.deepEqual(acotarAnioMes(r, "2030-12"), { anio: 2026, mes: 11 });
  assert.deepEqual(acotarAnioMes(r, "2025-06"), { anio: 2025, mes: 6 });
});

test("aniosDelRango lista del más nuevo al más viejo", () => {
  assert.deepEqual(aniosDelRango(rangoDeMeses("2024-03-15", "2026-11-08")), [2026, 2025, 2024]);
});

// ── Días con escritura ──
test("resolverNivelCalor (moodiary heatmap_level_test): pocos días → por cantidad", () => {
  const nivel = resolverNivelCalor([10, 20, 30]);
  assert.equal(nivel(1, 10), 2);
  assert.equal(nivel(2, 20), 3);
  assert.equal(nivel(5, 30), 4);
});

test("resolverNivelCalor: sin distribución de palabras vuelve a la cantidad", () => {
  const nivel = resolverNivelCalor(Array(30).fill(42));
  assert.equal(nivel(1, 42), 2);
  assert.equal(nivel(3, 42), 4);
});

test("resolverNivelCalor: con distribución usa los cuatro niveles, sin bajar al subir las palabras", () => {
  const palabras = Array.from({ length: 40 }, (_, i) => (i + 1) * 50);
  const nivel = resolverNivelCalor(palabras);
  assert.deepEqual(new Set(palabras.map((w) => nivel(1, w))), new Set([1, 2, 3, 4]));
  let ultimo = 0;
  for (const w of palabras) {
    const n = nivel(1, w);
    assert.ok(n >= ultimo);
    ultimo = n;
  }
});

test("resolverNivelCalor: la cantidad de entradas no cambia el nivel cuando hay distribución", () => {
  const palabras = Array.from({ length: 40 }, (_, i) => (i + 1) * 50);
  const nivel = resolverNivelCalor(palabras);
  assert.equal(nivel(3, 50), nivel(1, 50));
});

test("diasEscritos agrupa por día, suma palabras y promedia el ánimo", () => {
  const dias = diasEscritos([fila("2026-11-02", { palabras: 10, animo: 2 }), fila("2026-11-02", { palabras: 30, animo: 4 }), fila("2026-11-03", { palabras: 5 })]);
  assert.equal(dias.size, 2);
  assert.deepEqual({ ...dias.get("2026-11-02")!, nivel: 0 }, { cantidad: 2, palabras: 40, nivel: 0, animo: 3 });
  assert.equal(dias.get("2026-11-03")!.animo, null);
  assert.equal(dias.get("2026-11-02")!.nivel, 3); // pocos días: por cantidad (2 → 3)
  assert.equal(dias.get("2026-11-03")!.nivel, 2);
});

test("cantidad por rango, mes, año y últimos 365 días", () => {
  const dias = diasEscritos([fila("2026-11-02"), fila("2026-11-02"), fila("2026-10-31"), fila("2026-03-01"), fila("2025-11-09"), fila("2025-11-08")]);
  assert.equal(cantidadEnRango(dias, "2026-10-31", "2026-11-02"), 3);
  assert.equal(cantidadDelMes(dias, "2026-11"), 2);
  assert.equal(cantidadDelMes(dias, "2026-10"), 1);
  assert.equal(cantidadDelAnio(dias, 2026), 4);
  assert.equal(cantidadDelAnio(dias, 2025), 2);
  // hoy 2026-11-08 menos 364 días = 2025-11-09 (incluido); el 8 de noviembre de 2025 ya queda afuera
  assert.equal(cantidadUltimoAnio(dias, "2026-11-08"), 5);
  assert.equal(cantidadUltimoAnio(dias, "2026-11-09"), 4);
  assert.equal(cantidadUltimoAnio(dias, "2026-11-07"), 6);
});

test("cantidadPorMes reparte el año en doce", () => {
  const dias = diasEscritos([fila("2026-01-05"), fila("2026-01-06"), fila("2026-12-31"), fila("2025-01-01")]);
  const meses = cantidadPorMes(dias, 2026);
  assert.equal(meses.length, 12);
  assert.equal(meses[0], 2);
  assert.equal(meses[11], 1);
  assert.equal(meses.reduce((s, n) => s + n, 0), 3);
});

test("aniosConEntradas: del más nuevo al más viejo y, vacío, el año de hoy con cero", () => {
  const dias = diasEscritos([fila("2024-05-01"), fila("2026-01-01"), fila("2026-02-01"), fila("2024-06-01")]);
  assert.deepEqual(aniosConEntradas(dias, "2026-11-08"), [
    { anio: 2026, cantidad: 2 },
    { anio: 2024, cantidad: 2 },
  ]);
  assert.deepEqual(aniosConEntradas(new Map(), "2026-11-08"), [{ anio: 2026, cantidad: 0 }]);
});

test("primeraFecha devuelve la más antigua o null", () => {
  assert.equal(primeraFecha([{ fecha: "2026-03-01" }, { fecha: "2024-07-04" }, { fecha: "2025-01-01" }]), "2024-07-04");
  assert.equal(primeraFecha([]), null);
});

// ── Mapa de calor ──
test("lunesDe lleva cualquier día al lunes de su semana", () => {
  assert.equal(lunesDe("2026-11-08"), "2026-11-02"); // domingo
  assert.equal(lunesDe("2026-11-02"), "2026-11-02"); // lunes
  assert.equal(lunesDe("2026-11-04"), "2026-11-02");
});

test("columnasCalor: 53 semanas que terminan en la de `fin`, con blancos después de `fin`", () => {
  const cols = columnasCalor("2026-11-04"); // miércoles
  assert.equal(cols.length, 53);
  const ultima = cols[52];
  assert.equal(ultima.inicio, "2026-11-02");
  assert.deepEqual(ultima.dias, ["2026-11-02", "2026-11-03", "2026-11-04", null, null, null, null]);
  assert.equal(cols[0].inicio, lunesDe("2025-11-05"));
  for (const c of cols.slice(0, 52)) assert.equal(c.dias.filter((d) => d === null).length, 0);
});

test("columnasCalor: con `inicio`, los días anteriores quedan en blanco", () => {
  const cols = columnasCalor("2026-01-14", 3, "2026-01-01"); // jueves 1 de enero
  assert.equal(cols[0].inicio, "2025-12-29");
  assert.deepEqual(cols[0].dias, [null, null, null, "2026-01-01", "2026-01-02", "2026-01-03", "2026-01-04"]);
});

test("semanasEntre cuenta las columnas necesarias", () => {
  assert.equal(semanasEntre("2026-01-01", "2026-12-31"), 53);
  assert.equal(semanasEntre("2026-11-02", "2026-11-08"), 1);
  assert.equal(semanasEntre("2026-11-08", "2026-11-09"), 2);
});

test("marcasDeMeses: un nombre por mes, sin las últimas dos columnas", () => {
  const cols = columnasCalor("2026-11-04");
  const marcas = marcasDeMeses(cols);
  const meses = marcas.map((m) => m.mes);
  assert.equal(new Set(meses).size, meses.length);
  assert.ok(marcas.every((m) => m.columna <= 50));
  assert.equal(marcas[0].columna, 0);
});

test("marcasDeMeses con `inicio` marca la primera columna", () => {
  const cols = columnasCalor("2026-03-10", 11, "2026-01-01");
  const marcas = marcasDeMeses(cols, "2026-01-01");
  assert.deepEqual(marcas[0], { columna: 0, mes: "2026-01" });
  assert.ok(marcas.some((m) => m.mes === "2026-02"));
});
