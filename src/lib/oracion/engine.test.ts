// node --test src/lib/oracion/engine.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { addDays, format, parseISO } from "date-fns";
import { ESCALERAS, calcularPlan, misteriosDelDia, reproducir, type Marca } from "./engine.ts";

const INICIO = "2026-01-05"; // lunes
const dia = (n: number) => format(addDays(parseISO(INICIO), n), "yyyy-MM-dd");

/** Historial a partir de un patrón: H = hecho, J = justificado, . = falta */
function marcas(patron: string) {
  const m = new Map<string, Marca>();
  [...patron].forEach((c, i) => {
    if (c === "H") m.set(dia(i), "hecho");
    if (c === "J") m.set(dia(i), "justificado");
  });
  return m;
}
/** Estado tras `patron`, con hoy = día siguiente pendiente */
const rosario = (patron: string) => reproducir("rosario", INICIO, dia(patron.length), marcas(patron));

test("escalera del Rosario: 15 pasos, 3 → 6 → 10 + misterio por cada uno", () => {
  const t = ESCALERAS.rosario.map((p) => p.titulo);
  assert.equal(t.length, 15);
  assert.deepEqual(t.slice(0, 4), ["3 avemarías", "6 avemarías", "1 misterio", "1 misterio + 3 avemarías"]);
  assert.equal(t[14], "Rosario completo: 5 misterios");
  assert.deepEqual(ESCALERAS.rosario.slice(0, 3).map((p) => p.diasParaSubir), [7, 7, 14]);
});

test("7 días seguidos con 3 avemarías suben a 6; 7 más, a 10 + misterio", () => {
  assert.equal(rosario("HHHHHH").paso, 0);
  const s = rosario("HHHHHHH");
  assert.equal(s.paso, 1);
  assert.equal(s.seguidos, 0);
  assert.equal(rosario("H".repeat(14)).paso, 2);
});

test("el misterio completo pide 14 días antes de empezar el segundo", () => {
  assert.equal(rosario("H".repeat(14 + 13)).paso, 2);
  assert.equal(rosario("H".repeat(14 + 14)).paso, 3);
});

test("un día perdido reinicia solo la cuenta al próximo paso, nunca el nivel ni la constancia", () => {
  const antes = rosario("H".repeat(10));
  const s = rosario("H".repeat(10) + ".");
  assert.equal(s.paso, 1);
  assert.equal(s.seguidos, 0);
  assert.ok(s.constancia > 0 && s.constancia < antes.constancia);
});

test("un día justificado no corta los días seguidos ni baja la constancia", () => {
  const s = rosario("HHHJHHHH");
  assert.equal(s.paso, 1); // 7 rezados, el justificado en el medio no cortó
  const a = rosario("HHH");
  const b = rosario("HHHJ");
  assert.equal(a.constancia, b.constancia);
});

test("recaída: 4 faltas en 7 días bajan un paso, sin culpa, y se celebra el regreso", () => {
  const s = rosario("H".repeat(14) + "....");
  assert.equal(s.paso, 1); // de 10 a 6 avemarías
  assert.equal(s.etapa, "retomando");
  assert.equal(s.recaidaEl, dia(17));

  const hoy = dia(19);
  const m = marcas("H".repeat(14) + "....H");
  m.set(hoy, "hecho");
  const r = reproducir("rosario", INICIO, hoy, m);
  assert.equal(r.etapa, "retomando");

  const regreso = marcas("H".repeat(14) + "....");
  regreso.set(dia(18), "hecho");
  const primero = reproducir("rosario", INICIO, dia(18), regreso);
  assert.deepEqual(primero.eventos, ["regreso"]);

  assert.equal(rosario("H".repeat(14) + "....HHH").etapa, "construccion");
});

test("la recaída no baja en cascada: la ventana se reinicia", () => {
  assert.equal(rosario("H".repeat(14) + ".....").paso, 1);
});

test("etapas: inicio → construcción → consolidación → hábito firme", () => {
  assert.equal(rosario("HHH").etapa, "inicio");
  assert.equal(rosario("HHHHHHH").etapa, "construccion");
  const noche = (n: number) => reproducir("completorium", INICIO, dia(n), marcas("H".repeat(n))).etapa;
  assert.equal(noche(17), "construccion");
  assert.equal(noche(18), "consolidacion");
  assert.equal(noche(32), "firme");
});

test("hoy sin registrar queda pendiente; hoy registrado trae sus eventos", () => {
  const m = marcas("HHHHHH");
  assert.equal(reproducir("rosario", INICIO, dia(6), m).hoy, null);
  m.set(dia(6), "hecho");
  const s = reproducir("rosario", INICIO, dia(6), m);
  assert.equal(s.hoy, "hecho");
  assert.deepEqual(s.eventos, ["ascenso"]);
});

test("Rosario completo tras 14 días con los 5 misterios", () => {
  const dias = 5 * (7 + 7 + 14);
  const s = rosario("H".repeat(dias));
  assert.equal(s.paso, 14);
  assert.equal(s.completo, true);
});

test("cada usuario avanza a su ritmo", () => {
  const constante = rosario("H".repeat(21));
  const irregular = rosario("HHHHH.HHHHH.HHHHH.HHH");
  assert.equal(constante.paso, 2);
  assert.equal(irregular.paso, 0);
});

test("misterios tradicionales del día", () => {
  assert.equal(misteriosDelDia("2026-01-05").serie, "Gozosos"); // lunes
  assert.equal(misteriosDelDia("2026-01-06").serie, "Dolorosos"); // martes
  assert.equal(misteriosDelDia("2026-01-08").serie, "Gozosos"); // jueves
  assert.equal(misteriosDelDia("2026-01-10").serie, "Gloriosos"); // sábado
  assert.equal(misteriosDelDia("2026-01-11").serie, "Gloriosos"); // domingo
});

test("plan: la mañana se habilita al consolidar la noche, o antes si un padre la adelanta", () => {
  const registros = Array.from({ length: 17 }, (_, i) => ({ habito: "completorium" as const, fecha: dia(i), marca: "hecho" as const }));
  const bloqueado = calcularPlan({ inicio: INICIO, matutinumDesde: null, hoy: dia(17), registros });
  assert.ok(bloqueado.matutinumBloqueado);
  assert.deepEqual(bloqueado.habitos.map((h) => h.habito), ["completorium", "rosario"]);

  const habilitado = calcularPlan({ inicio: INICIO, matutinumDesde: null, hoy: dia(18), registros: [...registros, { habito: "completorium", fecha: dia(17), marca: "hecho" }] });
  assert.equal(habilitado.matutinumBloqueado, null);
  assert.deepEqual(habilitado.habitos.map((h) => h.habito), ["matutinum", "completorium", "rosario"]);

  const adelantado = calcularPlan({ inicio: INICIO, matutinumDesde: dia(2), hoy: dia(3), registros: [] });
  assert.equal(adelantado.habitos[0].habito, "matutinum");
});

test("plan: días de Completorium previos al inicio cuentan (la familia ya rezaba)", () => {
  const previos = [-4, -3, -2, -1].map((n) => ({ habito: "completorium" as const, fecha: dia(n), marca: "hecho" as const }));
  const plan = calcularPlan({ inicio: INICIO, matutinumDesde: null, hoy: INICIO, registros: previos });
  const noche = plan.habitos.find((h) => h.habito === "completorium")!;
  assert.equal(noche.desde, dia(-4));
  assert.equal(noche.seguidos, 4);
  assert.equal(plan.habitos.find((h) => h.habito === "rosario")!.desde, INICIO);
});
