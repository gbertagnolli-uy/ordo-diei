// node --test src/lib/habitos/engine.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { addDays, format, parseISO } from "date-fns";
import {
  CATALOGO,
  DIAS_LUN_VIE,
  DIAS_TODOS,
  misteriosDelDia,
  pasosDe,
  type ClaveSistema,
  type Marca,
} from "./catalogo.ts";
import {
  reproducir,
} from "./engine.ts";
import { calcularRecompensa } from "./server.ts";
import { puedeEditarHabito } from "./permisos.ts";

const INICIO = "2026-01-05"; // lunes
const dia = (n: number) => format(addDays(parseISO(INICIO), n), "yyyy-MM-dd");

/** Historial a partir de un patrón: H = hecho, J = justificado, N = no, . = falta, L = libre */
function marcas(patron: string) {
  const m = new Map<string, Marca>();
  [...patron].forEach((c, i) => {
    if (c === "H") m.set(dia(i), "hecho");
    if (c === "J") m.set(dia(i), "justificado");
    if (c === "N") m.set(dia(i), "no");
  });
  return m;
}

const pasosRosario = CATALOGO.rosario.pasos;

const rosario = (patron: string) =>
  reproducir({
    pasos: pasosRosario,
    desde: INICIO,
    hoy: dia(patron.length),
    marcas: marcas(patron),
  });

test("escalera del Rosario: 15 pasos, 3 → 6 → 10 + misterio por cada uno", () => {
  const t = pasosRosario.map((p) => p.titulo);
  assert.equal(t.length, 15);
  assert.deepEqual(t.slice(0, 4), ["3 avemarías", "6 avemarías", "1 misterio", "1 misterio + 3 avemarías"]);
  assert.equal(t[14], "Rosario completo: 5 misterios");
  assert.deepEqual(pasosRosario.slice(0, 3).map((p) => p.diasParaSubir), [7, 7, 14]);
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
  assert.equal(s.paso, 1);
  const a = rosario("HHH");
  const b = rosario("HHHJ");
  assert.equal(a.constancia, b.constancia);
});

test("recaída: 4 faltas en 7 días bajan un paso, sin culpa, y se celebra el regreso", () => {
  const s = rosario("H".repeat(14) + "....");
  assert.equal(s.paso, 1);
  assert.equal(s.etapa, "retomando");
  assert.equal(s.recaidaEl, dia(17));

  const hoy = dia(19);
  const m = marcas("H".repeat(14) + "....H");
  m.set(hoy, "hecho");
  const r = reproducir({
    pasos: pasosRosario,
    desde: INICIO,
    hoy,
    marcas: m,
  });
  assert.equal(r.etapa, "retomando");

  const regreso = marcas("H".repeat(14) + "....");
  regreso.set(dia(18), "hecho");
  const primero = reproducir({
    pasos: pasosRosario,
    desde: INICIO,
    hoy: dia(18),
    marcas: regreso,
  });
  assert.deepEqual(primero.eventos, ["regreso"]);

  assert.equal(rosario("H".repeat(14) + "....HHH").etapa, "construccion");
});

test("la recaída no baja en cascada: la ventana se reinicia", () => {
  assert.equal(rosario("H".repeat(14) + ".....").paso, 1);
});

test("etapas: inicio → construcción → consolidación → hábito firme", () => {
  assert.equal(rosario("HHH").etapa, "inicio");
  assert.equal(rosario("HHHHHHH").etapa, "construccion");
  const completorium = (n: number) =>
    reproducir({
      pasos: CATALOGO.completorium.pasos,
      desde: INICIO,
      hoy: dia(n),
      marcas: marcas("H".repeat(n)),
    }).etapa;
  assert.equal(completorium(17), "construccion");
  assert.equal(completorium(18), "consolidacion");
  assert.equal(completorium(32), "firme");
});

test("hoy sin registrar queda pendiente; hoy registrado trae sus eventos", () => {
  const m = marcas("HHHHHH");
  assert.equal(
    reproducir({ pasos: pasosRosario, desde: INICIO, hoy: dia(6), marcas: m }).hoy,
    null
  );
  m.set(dia(6), "hecho");
  const s = reproducir({ pasos: pasosRosario, desde: INICIO, hoy: dia(6), marcas: m });
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
  assert.equal(misteriosDelDia("2026-01-05").serie, "Gozosos");
  assert.equal(misteriosDelDia("2026-01-06").serie, "Dolorosos");
  assert.equal(misteriosDelDia("2026-01-08").serie, "Gozosos");
  assert.equal(misteriosDelDia("2026-01-10").serie, "Gloriosos");
  assert.equal(misteriosDelDia("2026-01-11").serie, "Gloriosos");
});

test("días libres: no cortan la racha ni bajan la constancia", () => {
  // Lunes a viernes programados (DIAS_LUN_VIE = 62)
  // INICIO es 2026-01-05 (lunes). Días 0..4 = Lun..Vie (hecho), días 5 y 6 = Sáb y Dom (no programados = libres)
  // Día 7 = Lunes siguiente (hecho). Total 6 días hechos + 2 libres.
  const m = new Map<string, Marca>();
  // Lun a Vie hechos
  for (let i = 0; i < 5; i++) m.set(dia(i), "hecho");
  // Sab y Dom sin registro (libres)
  // Lun y Mar hechos (días 7 y 8)
  m.set(dia(7), "hecho");
  m.set(dia(8), "hecho");

  const s = reproducir({
    pasos: pasosRosario,
    desde: INICIO,
    hoy: dia(9),
    marcas: m,
    dias: DIAS_LUN_VIE,
  });

  // Los 5 días previos + los 2 posteriores completan 7 días seguidos cumplidos -> paso 1
  assert.equal(s.paso, 1);
  assert.equal(s.seguidos, 0);

  // Constancia: comparar 5 días hechos seguidos vs 5 días hechos + 2 días libres
  const mSolo5 = new Map<string, Marca>();
  for (let i = 0; i < 5; i++) mSolo5.set(dia(i), "hecho");

  const solo5 = reproducir({
    pasos: pasosRosario,
    desde: INICIO,
    hoy: dia(5),
    marcas: mSolo5,
    dias: DIAS_TODOS,
  });
  const tras2Libres = reproducir({
    pasos: pasosRosario,
    desde: INICIO,
    hoy: dia(7),
    marcas: mSolo5,
    dias: DIAS_LUN_VIE,
  });
  // La constancia debe mantenerse idéntica tras los 2 días libres
  assert.equal(tras2Libres.constancia, solo5.constancia);
  assert.equal(tras2Libres.seguidos, 5);
});

test("'no' equivale a 'falta' para la recaída", () => {
  // 14 días hechos y luego 4 'no' (N)
  const s = rosario("H".repeat(14) + "NNNN");
  assert.equal(s.paso, 1); // Bajó de paso 2 a paso 1
  assert.equal(s.etapa, "retomando");
  assert.equal(s.recaidaEl, dia(17));
});

test("un hábito de un solo paso nunca sube de paso", () => {
  const unPaso = CATALOGO.matutinum.pasos; // [{ titulo: ..., diasParaSubir: null, misterios: 0 }]
  assert.equal(unPaso.length, 1);
  assert.equal(unPaso[0].diasParaSubir, null);

  const res = reproducir({
    pasos: unPaso,
    desde: INICIO,
    hoy: dia(50),
    marcas: marcas("H".repeat(50)),
  });
  assert.equal(res.paso, 0);
  assert.equal(res.completo, false);
  assert.equal(res.etapa, "firme");
});

test("pasosDe para un hábito de usuario con y sin mínimo", () => {
  const conMinimo = pasosDe({
    clave: null,
    nombre: "Hacer ejercicio",
    minimo: "5 flexiones",
  });
  assert.deepEqual(conMinimo, [
    { titulo: "5 flexiones", diasParaSubir: 14, misterios: 0 },
    { titulo: "Hacer ejercicio", diasParaSubir: null, misterios: 0 },
  ]);

  const sinMinimo = pasosDe({
    clave: null,
    nombre: "Meditar",
    minimo: null,
  });
  assert.deepEqual(sinMinimo, [
    { titulo: "Meditar", diasParaSubir: null, misterios: 0 },
  ]);

  const minimoVacio = pasosDe({
    clave: null,
    nombre: "Caminar",
    minimo: "   ",
  });
  assert.deepEqual(sinMinimo, [
    { titulo: "Meditar", diasParaSubir: null, misterios: 0 },
  ]);
  assert.deepEqual(minimoVacio, [
    { titulo: "Caminar", diasParaSubir: null, misterios: 0 },
  ]);
});

test("las 9 claves con escaleras válidas, y la escalera de la lectura espiritual", () => {
  const claves: ClaveSistema[] = [
    "matutinum",
    "angelus",
    "rosario",
    "lectura",
    "completorium",
    "cama",
    "aseo",
    "bano",
    "ropero",
  ];

  for (const c of claves) {
    const def = CATALOGO[c];
    assert.ok(def, `Falta hábito ${c}`);
    assert.equal(def.clave, c);
    assert.ok(def.pasos.length >= 1, `Escalera vacía para ${c}`);
    assert.ok(def.nombre.length > 0);
    assert.ok(def.ancla.length > 0);
    assert.ok(def.identidad.length > 0);
  }

  // Escalera de lectura espiritual: 1 párrafo (7) → 5 minutos (7) → 15 minutos (14)
  const lectura = CATALOGO.lectura.pasos;
  assert.equal(lectura.length, 3);
  assert.deepEqual(lectura.map((p) => p.titulo), ["1 párrafo", "5 minutos", "15 minutos"]);
  assert.deepEqual(lectura.map((p) => p.diasParaSubir), [7, 7, 14]);
});

test("calcularRecompensa: oración sin puntos, orden con puntos, reversión al deshacer y al cambiar de hecho a no", () => {
  // 1. Oración hecha: 10 XP, 0 puntos
  const oracion = calcularRecompensa(null, "hecho", [], "oracion");
  assert.equal(oracion.nuevoPuntos, 0);
  assert.equal(oracion.nuevoXp, 10);
  assert.equal(oracion.deltaPuntos, 0);
  assert.equal(oracion.deltaXp, 10);

  // 1b. Oración con ascenso: +25 XP = 35 XP
  const oracionAscenso = calcularRecompensa(null, "hecho", ["ascenso"], "oracion");
  assert.equal(oracionAscenso.nuevoXp, 35);
  assert.equal(oracionAscenso.nuevoPuntos, 0);

  // 1c. Oración completa: +100 XP = 110 XP
  const oracionCompleto = calcularRecompensa(null, "hecho", ["completo"], "oracion");
  assert.equal(oracionCompleto.nuevoXp, 110);
  assert.equal(oracionCompleto.nuevoPuntos, 0);

  // 2. Orden hecha: 10 XP, 5 puntos
  const orden = calcularRecompensa(null, "hecho", [], "orden");
  assert.equal(orden.nuevoPuntos, 5);
  assert.equal(orden.nuevoXp, 10);
  assert.equal(orden.deltaPuntos, 5);
  assert.equal(orden.deltaXp, 10);

  // 3. Cuidado hecho: 10 XP, 5 puntos
  const cuidado = calcularRecompensa(null, "hecho", [], "cuidado");
  assert.equal(cuidado.nuevoPuntos, 5);
  assert.equal(cuidado.nuevoXp, 10);

  // 4. Reversión al deshacer (de hecho a null)
  const deshacer = calcularRecompensa({ puntos: 5, xp: 10 }, null, [], "orden");
  assert.equal(deshacer.nuevoPuntos, 0);
  assert.equal(deshacer.nuevoXp, 0);
  assert.equal(deshacer.deltaPuntos, -5);
  assert.equal(deshacer.deltaXp, -10);

  // 5. Reversión al cambiar de hecho a no
  const cambiarANo = calcularRecompensa({ puntos: 5, xp: 10 }, "no", [], "orden");
  assert.equal(cambiarANo.nuevoPuntos, 0);
  assert.equal(cambiarANo.nuevoXp, 0);
  assert.equal(cambiarANo.deltaPuntos, -5);
  assert.equal(cambiarANo.deltaXp, -10);

  // 6. De no a hecho: suma
  const deNoAHecho = calcularRecompensa({ puntos: 0, xp: 0 }, "hecho", [], "orden");
  assert.equal(deNoAHecho.nuevoPuntos, 5);
  assert.equal(deNoAHecho.nuevoXp, 10);
  assert.equal(deNoAHecho.deltaPuntos, 5);
  assert.equal(deNoAHecho.deltaXp, 10);
});

test("puedeEditarHabito: creador sí, otro no, sistema nadie", () => {
  // Creador propio
  assert.equal(puedeEditarHabito({ creadorId: 3 }, 3), true);
  // Otro usuario
  assert.equal(puedeEditarHabito({ creadorId: 3 }, 4), false);
  // Sistema (creadorId = null)
  assert.equal(puedeEditarHabito({ creadorId: null }, 1), false);
  assert.equal(puedeEditarHabito({ creadorId: null }, 2), false);
});
