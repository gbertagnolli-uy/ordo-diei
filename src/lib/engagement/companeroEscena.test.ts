import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { PERSONAJES, POSES, posesDesbloqueadas, type Voz } from "./companero.ts";
import {
  contextoDePantalla,
  elegirEscena,
  EVENTOS_APP,
  fraseDePose,
  MENSAJES_EVENTO,
  MENSAJES_MOMENTO,
  MENSAJES_PANTALLA,
  MENSAJES_POSE,
  momentoDelDia,
  poseFlotante,
  POSES_FLOTANTES,
  posesVisibles,
  siguientePose,
  type Contexto,
} from "./companeroEscena.ts";

const VOCES: Voz[] = ["monja", "sacerdote", "hombre", "mujer", "nino", "nina"];

// Un azar determinista que recorre valores distintos
const secuencia = (...valores: number[]) => {
  let i = 0;
  return () => valores[i++ % valores.length];
};

describe("compañero flotante: mensajes", () => {
  test("cada voz tiene al menos 4 mensajes distintos por cada imagen", () => {
    for (const voz of VOCES) {
      for (const pose of POSES_FLOTANTES) {
        const frases = MENSAJES_POSE[voz][pose];
        assert.ok(new Set(frases).size >= 4, `${voz}/${pose} tiene ${new Set(frases).size}`);
      }
    }
  });

  test("las voces de los héroes existen en la tabla de mensajes", () => {
    for (const p of PERSONAJES) assert.ok(MENSAJES_POSE[p.voz], `${p.clave}: ${p.voz}`);
  });

  test("pantallas, momentos y eventos tienen al menos 4 mensajes y sólo poses visibles", () => {
    const entradas = [...Object.values(MENSAJES_PANTALLA), ...Object.values(MENSAJES_MOMENTO), ...Object.values(MENSAJES_EVENTO)];
    for (const e of entradas) {
      assert.ok(new Set(e.frases).size >= 4);
      assert.ok(e.poses.length > 0 && e.poses.every((p) => (POSES_FLOTANTES as readonly string[]).includes(p)));
    }
    assert.deepEqual(Object.keys(MENSAJES_EVENTO).sort(), [...EVENTOS_APP].sort());
  });

  test("ningún mensaje deja llaves sin reemplazar al elegirlo", () => {
    for (const voz of VOCES) {
      for (const pose of POSES_FLOTANTES) assert.ok(!fraseDePose(voz, pose, "Gabriel Pérez").includes("{"));
    }
    assert.ok(fraseDePose("mujer", "neutral", "Gabriel Pérez", null, () => 0).includes("Gabriel"));
    assert.ok(!fraseDePose("mujer", "neutral", "Gabriel Pérez", null, () => 0).includes("Pérez"));
  });
});

describe("compañero flotante: poses", () => {
  test("«buenos días» no se ve flotando y pasa a la neutral", () => {
    assert.ok(!(POSES_FLOTANTES as readonly string[]).includes("buenos-dias"));
    assert.equal(poseFlotante("buenos-dias"), "neutral");
    assert.equal(poseFlotante("abrazo"), "abrazo");
    assert.deepEqual(posesVisibles(posesDesbloqueadas(1)), ["neutral", "abrazo", "felicitando"]);
    assert.deepEqual(posesVisibles(posesDesbloqueadas(3)), [...POSES_FLOTANTES]);
    assert.deepEqual(posesVisibles([]), ["neutral"]);
  });

  test("cambiar de imagen recorre las visibles y vuelve al principio", () => {
    const v = posesVisibles(posesDesbloqueadas(3));
    let p = v[0];
    const vistas = [p];
    for (let i = 0; i < v.length; i++) {
      p = siguientePose(p, v);
      vistas.push(p);
    }
    assert.deepEqual(vistas, [...v, v[0]]);
    assert.equal(siguientePose("neutral", []), "neutral");
  });
});

describe("compañero flotante: pantalla y momento", () => {
  test("detecta la pantalla por la ruta", () => {
    const casos: [string | null, Contexto][] = [
      ["/dashboard", "tareas"],
      ["/dashboard/", "tareas"],
      ["/dashboard/oracion", "oracion"],
      ["/dashboard/liturgia/rosarium/rezar", "liturgia"],
      ["/dashboard/cartas/admin", "cartas"],
      ["/dashboard/tienda", "tienda"],
      ["/dashboard/mis-premios", "premios"],
      ["/dashboard/companero", "companero"],
      ["/dashboard/homeschooling/cursos", "homeschooling"],
      ["/dashboard/rutina", "rutina"],
      ["/dashboard/horarios", "rutina"],
      ["/dashboard/habitos", "habitos"],
      ["/dashboard/perfil", "perfil"],
      ["/dashboard/rules", "reglas"],
      ["/dashboard/admin/tienda", "familia"],
      ["/dashboard/otra-cosa", "general"],
      [null, "general"],
    ];
    for (const [ruta, esperado] of casos) assert.equal(contextoDePantalla(ruta), esperado, String(ruta));
  });

  test("momento del día", () => {
    assert.equal(momentoDelDia(5), "manana");
    assert.equal(momentoDelDia(11), "manana");
    assert.equal(momentoDelDia(12), "tarde");
    assert.equal(momentoDelDia(18), "tarde");
    assert.equal(momentoDelDia(19), "noche");
    assert.equal(momentoDelDia(3), "noche");
  });
});

describe("compañero flotante: elegirEscena", () => {
  const base = { voz: "mujer" as Voz, nombre: "Gabriel", contexto: "oracion" as Contexto, hora: 10, desbloqueadas: posesDesbloqueadas(3) };

  test("lo que acaba de pasar manda sobre todo", () => {
    const e = elegirEscena({ ...base, eventoPuntual: "tarea-hecha", azar: () => 0.99 });
    assert.equal(e.origen, "evento");
    assert.equal(e.pose, "felicitando");
    assert.ok(MENSAJES_EVENTO["tarea-hecha"].frases.some((f) => f.replace("{n}", "Gabriel") === e.frase));
  });

  test("al abrir la app, lo más importante pendiente gana", () => {
    const e = elegirEscena({ ...base, inicial: true, eventos: ["habitos", "nivel", "racha"], azar: () => 0.5 });
    assert.equal(e.origen, "evento");
    assert.ok(MENSAJES_EVENTO.nivel.frases.some((f) => f.replace("{n}", "Gabriel") === e.frase));
  });

  test("al abrir la app sin eventos, habla de la pantalla", () => {
    const e = elegirEscena({ ...base, inicial: true, eventos: [], azar: () => 0.5 });
    assert.equal(e.origen, "pantalla");
    assert.equal(e.pose, "reflexion");
  });

  test("según el azar elige pantalla, momento o pose", () => {
    assert.equal(elegirEscena({ ...base, azar: () => 0.5 }).origen, "pantalla");
    assert.equal(elegirEscena({ ...base, azar: () => 0.8 }).origen, "momento");
    assert.equal(elegirEscena({ ...base, azar: () => 0.95 }).origen, "pose");
    // En una pantalla sin tema propio nunca habla «de la pantalla»
    assert.notEqual(elegirEscena({ ...base, contexto: "general", azar: () => 0.5 }).origen, "pantalla");
  });

  test("nunca muestra «buenos días» ni una pose que todavía no ganó", () => {
    for (const nivel of [1, 2, 3]) {
      const visibles = posesVisibles(posesDesbloqueadas(nivel));
      for (const contexto of Object.keys(MENSAJES_PANTALLA) as Contexto[]) {
        for (const ev of EVENTOS_APP) {
          for (let i = 0; i < 20; i++) {
            const e = elegirEscena({ ...base, contexto, desbloqueadas: posesDesbloqueadas(nivel), eventos: [ev], hora: i, azar: secuencia(i / 20, 0.31, 0.77, 0.12) });
            assert.ok(visibles.includes(e.pose), `nivel ${nivel} ${contexto} ${ev}: ${e.pose}`);
          }
        }
      }
    }
    assert.ok(POSES.some((p) => p.clave === "buenos-dias"));
  });

  test("no repite la frase anterior", () => {
    const uno = elegirEscena({ ...base, azar: () => 0 });
    for (let i = 0; i < 30; i++) {
      const dos = elegirEscena({ ...base, anterior: { pose: uno.pose, frase: uno.frase }, azar: secuencia(0, i / 30) });
      assert.notEqual(dos.frase, uno.frase);
    }
  });

  test("fraseDePose evita la anterior", () => {
    const primera = fraseDePose("nina", "abrazo", "Ana", null, () => 0);
    for (let i = 0; i < 10; i++) assert.notEqual(fraseDePose("nina", "abrazo", "Ana", primera, () => i / 10), primera);
  });
});
