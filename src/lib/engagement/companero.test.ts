import test from "node:test";
import assert from "node:assert/strict";
import {
  CLAVES_PERSONAJE, marcoDeNivel, mensajeDeRegreso, poseDelMomento, posesDesbloqueadas, proximaPose, proximaRanura, ranurasDeObjetos, relacionDe, situacionDe, validarNombre, POSES,
} from "./companero.ts";
import { ACCESORIOS, cambiarEquipado, clavesDeRegalo, EQUIPADOS_INICIALES, leerEquipados, motivoNoCompra, tieneAccesorio, accesorioDe } from "./accesorios.ts";
import { FRASES, fraseDe } from "./companeroFrases.ts";

test("hay 6 personajes y cada uno tiene todas las frases", () => {
  assert.deepEqual([...CLAVES_PERSONAJE].sort(), ["hombre", "monja", "mujer", "nina", "nino", "sacerdote"]);
  for (const p of CLAVES_PERSONAJE) {
    for (const tipo of ["manana", "tarde", "noche", "regreso", "festejo", "carta", "toque"] as const) {
      assert.ok(FRASES[p][tipo].filter(Boolean).length >= 2, `${p}/${tipo}`);
    }
  }
});

test("las frases usan el primer nombre y no dejan marcas sin reemplazar", () => {
  for (const p of CLAVES_PERSONAJE) {
    for (const tipo of Object.keys(FRASES[p]) as (keyof (typeof FRASES)["monja"])[]) {
      for (let i = 0; i < 3; i++) assert.doesNotMatch(fraseDe(p, tipo, "Ana María", i), /\{n\}/);
    }
  }
  assert.match(fraseDe("nino", "regreso", "Ana María", 0), /Ana/);
  assert.doesNotMatch(fraseDe("nino", "regreso", "Ana María", 0), /María/);
  assert.match(fraseDe("nino", "regreso", "  ", 0), /amigo/);
});

test("situación y pose del momento: prioridad festejo > regreso > cartas > hora", () => {
  const base = { hora: 9, diasSinEntrar: 0 };
  assert.equal(situacionDe(base), "manana");
  assert.equal(situacionDe({ hora: 15, diasSinEntrar: 1 }), "tarde");
  assert.equal(situacionDe({ hora: 21, diasSinEntrar: null }), "noche");
  assert.equal(situacionDe({ hora: 3, diasSinEntrar: 0 }), "noche");
  assert.equal(situacionDe({ ...base, diasSinEntrar: 2 }), "regreso");
  assert.equal(situacionDe({ ...base, diasSinEntrar: 1, cartasNuevas: true }), "carta");
  assert.equal(situacionDe({ ...base, diasSinEntrar: 5, cartasNuevas: true, festejo: true }), "festejo");
  assert.equal(poseDelMomento({ ...base, diasSinEntrar: 3 }, 1), "abrazo");
  assert.equal(poseDelMomento(base, 1), "buenos-dias");
  assert.equal(poseDelMomento({ ...base, festejo: true }, 1), "felicitando");
});

test("las poses que se ganan con el nivel caen en la neutral hasta desbloquearse", () => {
  assert.equal(poseDelMomento({ hora: 21, diasSinEntrar: 0 }, 1), "neutral");
  assert.equal(poseDelMomento({ hora: 21, diasSinEntrar: 0 }, 3), "reflexion");
  assert.equal(poseDelMomento({ hora: 9, diasSinEntrar: 0, cartasNuevas: true }, 1), "neutral");
  assert.equal(poseDelMomento({ hora: 9, diasSinEntrar: 0, cartasNuevas: true }, 2), "ensenando");
  assert.deepEqual(posesDesbloqueadas(1), ["neutral", "buenos-dias", "abrazo", "felicitando"]);
  assert.equal(posesDesbloqueadas(99).length, POSES.length);
  assert.deepEqual(proximaPose(1), { pose: "ensenando", nombre: "Enseñando", nivel: 2 });
  assert.equal(proximaPose(3), null);
});

test("la relación crece con los días juntos y nunca baja", () => {
  assert.equal(relacionDe(0).titulo, "Recién presentados");
  assert.deepEqual(relacionDe(3).proximo, { titulo: "Amigos", faltan: 4 });
  assert.equal(relacionDe(7).titulo, "Amigos");
  assert.equal(relacionDe(30).titulo, "Compañeros de camino");
  assert.equal(relacionDe(400).titulo, "Amigos del alma");
  assert.equal(relacionDe(400).proximo, null);
});

test("espacios de objetos y marcos suben con el nivel", () => {
  assert.deepEqual([1, 3, 4, 7, 8, 30].map(ranurasDeObjetos), [1, 1, 2, 2, 3, 3]);
  assert.deepEqual([1, 4, 8, 20].map(proximaRanura), [4, 8, null, null]);
  assert.deepEqual([1, 4, 5, 10, 15, 20, 99].map(marcoDeNivel), [0, 0, 1, 2, 3, 4, 4]);
});

test("bienvenida cálida: solo tras faltar y sin contar días", () => {
  assert.equal(mensajeDeRegreso("Luz", 1), null);
  assert.equal(mensajeDeRegreso("Luz", null), null);
  const m = mensajeDeRegreso("Luz", 9) ?? "";
  assert.match(m, /Luz/);
  assert.doesNotMatch(m, /\d/);
});

test("nombre: se limpia y se valida", () => {
  assert.equal(validarNombre("  Luz   María "), "Luz María");
  assert.throws(() => validarNombre("   "), /Escribí un nombre/);
  assert.throws(() => validarNombre("x".repeat(21)), /20/);
  assert.throws(() => validarNombre(null), /Escribí un nombre/);
});

test("catálogo: claves únicas, regalos iniciales y niveles que alcanzan", () => {
  const claves = ACCESORIOS.map((a) => a.clave);
  assert.equal(new Set(claves).size, claves.length);
  assert.deepEqual(clavesDeRegalo().sort(), ["capilla", "veladora"]);
  assert.equal(ACCESORIOS.filter((a) => a.tipo === "fondo").length, 4);
  assert.equal(ACCESORIOS.filter((a) => a.tipo === "objeto").length, 6);
  assert.ok(tieneAccesorio("capilla", []));
  assert.ok(!tieneAccesorio("jardin", []));
  assert.ok(tieneAccesorio("jardin", ["jardin"]));
});

test("equipar: lo que no es suyo se descarta y los espacios respetan el nivel", () => {
  // Datos corruptos o accesorios ajenos vuelven al estado inicial
  assert.deepEqual(leerEquipados({ fondo: "noche", objetos: ["rosario", "veladora", "veladora", "x"] }, [], 1), { fondo: "capilla", objetos: ["veladora"] });
  assert.deepEqual(leerEquipados(null, [], 1), EQUIPADOS_INICIALES);
  // Con el accesorio comprado sí, pero no más objetos que espacios
  const comprados = ["maceta", "libros"];
  assert.deepEqual(leerEquipados({ fondo: "capilla", objetos: ["veladora", "maceta", "libros"] }, comprados, 4).objetos, ["veladora", "maceta"]);

  // Nivel 2 = 1 espacio: la veladora ocupa el lugar
  assert.throws(() => cambiarEquipado(EQUIPADOS_INICIALES, "maceta", true, comprados, 2), /más lugar/);
  const e = cambiarEquipado(EQUIPADOS_INICIALES, "maceta", true, comprados, 4);
  assert.deepEqual(e.objetos, ["veladora", "maceta"]);
  assert.deepEqual(cambiarEquipado(e, "veladora", false, comprados, 4).objetos, ["maceta"]);
  // No se puede ponerse lo que no se tiene ni dejar la escena sin fondo
  assert.throws(() => cambiarEquipado(EQUIPADOS_INICIALES, "banderin", true, comprados, 9), /Todavía no/);
  assert.throws(() => cambiarEquipado(EQUIPADOS_INICIALES, "capilla", false, comprados, 9), /otro escenario/);
  assert.equal(cambiarEquipado(EQUIPADOS_INICIALES, "jardin", true, ["jardin"], 2).fondo, "jardin");
});

test("comprar: motivo por el que todavía no se puede", () => {
  const jardin = accesorioDe("jardin")!;
  const rosario = accesorioDe("rosario")!;
  const rico = { puntos: 999, estrellas: 9, incienso: 9 };
  assert.equal(motivoNoCompra(jardin, [], 1, rico), "nivel");
  assert.equal(motivoNoCompra(jardin, [], 2, { ...rico, puntos: 49 }), "saldo");
  assert.equal(motivoNoCompra(jardin, [], 2, rico), null);
  assert.equal(motivoNoCompra(jardin, ["jardin"], 2, rico), "ya-lo-tenes");
  assert.equal(motivoNoCompra(rosario, [], 6, { ...rico, incienso: 2 }), "saldo");
  assert.equal(motivoNoCompra(rosario, [], 6, rico), null);
});
