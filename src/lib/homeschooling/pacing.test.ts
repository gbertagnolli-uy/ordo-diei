import { test } from "node:test";
import assert from "node:assert/strict";
import { repartir, type EntradaPacing } from "./pacing.ts";
import { planearRecalculo, type DiaPlan } from "./recalculo.ts";

const LUN_VIE = [1, 2, 3, 4, 5];
const base = (o: Partial<EntradaPacing> = {}): EntradaPacing => ({
  totalUnidades: 100,
  unidadesBase: 0,
  desde: "2026-03-02", // lunes
  hasta: "2026-03-27",
  diasSemana: LUN_VIE,
  noLectivos: [],
  unidadTipo: "leccion",
  ...o,
});
const suma = (r: ReturnType<typeof repartir>) => r.dias.reduce((s, d) => s + (d.unidadHasta - d.unidadDesde + 1), 0);

test("100 unidades en 100 días: una por día", () => {
  const r = repartir(base({ desde: "2026-01-01", hasta: "2026-12-31", diasSemana: [1, 2, 3, 4, 5, 6, 7], totalUnidades: 365 }));
  const c = repartir(base({ desde: "2026-01-01", hasta: "2026-04-10", diasSemana: [1, 2, 3, 4, 5, 6, 7], totalUnidades: 100 }));
  assert.equal(c.diasDisponibles, 100);
  assert.ok(c.dias.every((d) => d.unidadDesde === d.unidadHasta));
  assert.equal(suma(c), 100);
  assert.equal(suma(r), 365);
});

test("10 unidades en 3 días: suma 10 y diferencia ≤ 1", () => {
  const r = repartir(base({ totalUnidades: 10, desde: "2026-03-02", hasta: "2026-03-04" }));
  const cant = r.dias.map((d) => d.unidadHasta - d.unidadDesde + 1);
  assert.equal(cant.length, 3);
  assert.equal(suma(r), 10);
  assert.ok(Math.max(...cant) - Math.min(...cant) <= 1);
});

test("un día no lectivo no recibe unidades y la suma se mantiene", () => {
  const r = repartir(base({ totalUnidades: 20, noLectivos: ["2026-03-10"] }));
  assert.ok(!r.dias.some((d) => d.fecha === "2026-03-10"));
  assert.equal(suma(r), 20);
});

test("unidadesBase 40 de 100 con un no lectivo a mitad: reparte 41..100 sin pasar de hasta", () => {
  const r = repartir(base({ unidadesBase: 40, noLectivos: ["2026-03-13"] }));
  assert.equal(r.dias[0].unidadDesde, 41);
  assert.equal(r.dias.at(-1)!.unidadHasta, 100);
  assert.equal(suma(r), 60);
  assert.ok(r.dias.every((d) => d.fecha <= "2026-03-27" && d.fecha !== "2026-03-13"));
});

test("más unidades que el máximo por día: aviso de sobrecarga con 3 opciones", () => {
  const r = repartir(base({ totalUnidades: 200 }));
  assert.equal(r.aviso?.tipo, "sobrecarga");
  assert.equal(r.aviso?.opciones.length, 3);
  assert.match(r.aviso!.opciones[0], /^extender hasta \d{4}-\d{2}-\d{2}$/);
  assert.ok(r.aviso!.promedio! > 4);
});

test("sin días disponibles: aviso sin_dias", () => {
  const r = repartir(base({ desde: "2026-03-07", hasta: "2026-03-08" })); // sábado y domingo
  assert.equal(r.aviso?.tipo, "sin_dias");
  assert.deepEqual(r.dias, []);
  assert.equal(r.pendientes, 100);
});

test("días ISO: lun–vie nunca cae en fin de semana; [7] solo domingos", () => {
  const sem = repartir(base({ totalUnidades: 30, desde: "2026-03-02", hasta: "2026-04-30" }));
  assert.ok(sem.dias.every((d) => ![0, 6].includes(new Date(`${d.fecha}T12:00:00Z`).getUTCDay())));
  const dom = repartir(base({ totalUnidades: 5, diasSemana: [7], desde: "2026-03-02", hasta: "2026-04-30" }));
  assert.ok(dom.dias.length > 0 && dom.dias.every((d) => new Date(`${d.fecha}T12:00:00Z`).getUTCDay() === 0));
});

test("3 unidades en 10 días: 3 días de 1 unidad, ninguno vacío", () => {
  const r = repartir(base({ totalUnidades: 3, desde: "2026-03-02", hasta: "2026-03-13" }));
  assert.equal(r.diasDisponibles, 10);
  assert.equal(r.dias.length, 3);
  assert.ok(r.dias.every((d) => d.unidadDesde === d.unidadHasta));
});

test("300 páginas, 2026-03-02 → 2026-11-30, lun–vie: suma exacta, de 1 a 300", () => {
  const r = repartir(base({ totalUnidades: 300, unidadTipo: "pagina", desde: "2026-03-02", hasta: "2026-11-30" }));
  assert.equal(suma(r), 300);
  assert.equal(r.dias[0].unidadDesde, 1);
  assert.equal(r.dias.at(-1)!.unidadHasta, 300);
  for (let i = 1; i < r.dias.length; i++) assert.equal(r.dias[i].unidadDesde, r.dias[i - 1].unidadHasta + 1);
});

test("determinismo: misma entrada, misma salida", () => {
  const e = base({ totalUnidades: 77, noLectivos: ["2026-03-05"] });
  assert.deepEqual(repartir(e), repartir({ ...e, noLectivos: [...e.noLectivos] }));
});

test("ya cubierto todo: sin días y sin aviso", () => {
  const r = repartir(base({ totalUnidades: 10, unidadesBase: 10 }));
  assert.deepEqual(r.dias, []);
  assert.equal(r.aviso, undefined);
});

// --- recalcular (decisión pura) ---
const dia = (id: number, fecha: string, d: number, h: number, estado: DiaPlan["estado"], tareaEstado: string | null = null): DiaPlan => ({
  id, fecha, unidadDesde: d, unidadHasta: h, estado, tareaEstado,
});
const entradaRec = (dias: DiaPlan[]) => ({
  dias, hoy: "2026-03-10", inicio: "2026-03-02", fin: "2026-03-27", diasSemana: LUN_VIE,
  totalUnidades: 20, unidadTipo: "leccion" as const, noLectivosAlumno: [] as string[],
});

test("recalcular: día pasado pendiente → movida; sus unidades reaparecen desde hoy; fin no cambia", () => {
  const r = planearRecalculo(entradaRec([
    dia(1, "2026-03-02", 1, 2, "hecha"),
    dia(2, "2026-03-03", 3, 4, "pendiente"),
    dia(3, "2026-03-10", 5, 6, "pendiente"),
  ]));
  assert.deepEqual(r.mover, [2]);
  assert.deepEqual(r.borrar, [3]);
  assert.equal(r.base, 2);
  assert.equal(r.pacing.dias[0].fecha, "2026-03-10");
  assert.equal(r.pacing.dias[0].unidadDesde, 3);
  assert.equal(r.pacing.dias.at(-1)!.unidadHasta, 20);
  assert.ok(r.pacing.dias.every((d) => d.fecha <= "2026-03-27"));
});

test("recalcular: el día de hoy con Tarea En_progreso se conserva y su fecha no se reutiliza", () => {
  const r = planearRecalculo(entradaRec([
    dia(1, "2026-03-10", 1, 2, "pendiente", "En_progreso"),
    dia(2, "2026-03-11", 3, 4, "pendiente", "Pendiente"),
  ]));
  assert.deepEqual(r.conservar, [1]);
  assert.deepEqual(r.borrar, [2]);
  assert.equal(r.base, 2);
  assert.ok(!r.pacing.dias.some((d) => d.fecha === "2026-03-10"));
  assert.equal(r.pacing.dias[0].unidadDesde, 3);
  assert.equal(r.huecos, 0);
});

test("recalcular: tarea ya completada (sin sincronizar) se conserva como hecha aunque sea de ayer", () => {
  const r = planearRecalculo(entradaRec([dia(1, "2026-03-09", 1, 2, "pendiente", "Esperando_Aprobacion")]));
  assert.deepEqual(r.marcarHechas, [1]);
  assert.deepEqual(r.mover, []);
  assert.equal(r.base, 2);
});

test("recalcular: un día no lectivo nuevo se respeta y la suma se mantiene", () => {
  const e = entradaRec([dia(1, "2026-03-10", 1, 2, "pendiente")]);
  const r = planearRecalculo({ ...e, noLectivosAlumno: ["2026-03-12"] });
  assert.ok(!r.pacing.dias.some((d) => d.fecha === "2026-03-12"));
  assert.equal(r.pacing.dias.reduce((s, d) => s + d.unidadHasta - d.unidadDesde + 1, 0), 20);
});

test("recalcular: plan con inicio futuro reparte desde el inicio, no desde hoy", () => {
  const r = planearRecalculo({ ...entradaRec([]), inicio: "2026-03-16" });
  assert.equal(r.pacing.dias[0].fecha, "2026-03-16");
});
