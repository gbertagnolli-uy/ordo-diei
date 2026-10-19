import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CITAS_APTAS,
  CATECISMO_APTO,
  calcularDuracionFraseMs,
  calcularEscalaFrase,
  esCitaApta,
  esPreguntaApta,
  barajar,
  barajarSinRepetirUltima,
  elegirFotoSinRepetirUltimas,
  avanzarSecuencia,
  estadoInicialSecuencia,
  type CitaBiblica,
  type PreguntaCatecismo,
  type ItemFrase,
} from "./frases.ts";

test("hay suficientes citas y preguntas aptas en los mazos precargados", () => {
  assert.ok(CITAS_APTAS.length >= 365, `Citas aptas: ${CITAS_APTAS.length}`);
  assert.ok(CATECISMO_APTO.length >= 300, `Preguntas aptas: ${CATECISMO_APTO.length}`);
});

test("filtros de paridad y longitud máxima (SPEC §4.3)", () => {
  const citaBuena: CitaBiblica = {
    id: "Ps-1-1",
    libro: "Ps",
    capitulo: 1,
    desde: 1,
    hasta: 1,
    la: "Beatus vir qui non abiit in consilio impiorum.",
    es: "Bienaventurado el varón que no anduvo en consejo de malos.",
    ref: "Salmo 1, 1",
  };
  assert.equal(esCitaApta(citaBuena), true);

  const citaSinEspanol: CitaBiblica = { ...citaBuena, es: "" };
  assert.equal(esCitaApta(citaSinEspanol), false);

  const citaLatinLargo: CitaBiblica = { ...citaBuena, la: "a".repeat(221) };
  assert.equal(esCitaApta(citaLatinLargo), false);

  const citaEspLargo: CitaBiblica = { ...citaBuena, es: "a".repeat(301) };
  assert.equal(esCitaApta(citaEspLargo), false);

  const pregBuena: PreguntaCatecismo = {
    n: 1,
    parte: "P",
    capitulo: "C",
    pregunta: "¿Sois cristiano?",
    respuesta: "Sí, señor; soy cristiano por la gracia de Dios.",
  };
  assert.equal(esPreguntaApta(pregBuena), true);

  const pregVacia: PreguntaCatecismo = { ...pregBuena, pregunta: "" };
  assert.equal(esPreguntaApta(pregVacia), false);

  const pregLarga: PreguntaCatecismo = { ...pregBuena, pregunta: "a".repeat(141) };
  assert.equal(esPreguntaApta(pregLarga), false);

  const respLarga: PreguntaCatecismo = { ...pregBuena, respuesta: "a".repeat(361) };
  assert.equal(esPreguntaApta(respLarga), false);
});

test("cálculo de duración de frase con clamp(12s, 8s + 55ms*chars, 32s) (SPEC §4.4)", () => {
  const corta: ItemFrase = {
    tipo: "biblia",
    datos: {
      id: "1",
      libro: "Ps",
      capitulo: 1,
      desde: 1,
      hasta: 1,
      la: "Dominus regit me.", // 17
      es: "El Señor me pastorea.", // 21 -> total 38 chars
      ref: "Salmo 22, 1",
    },
  };
  // 8000 + 55 * 38 = 10090 -> clamp a 12000
  assert.equal(calcularDuracionFraseMs(corta), 12000);

  const media: ItemFrase = {
    tipo: "catecismo",
    datos: {
      n: 10,
      parte: "",
      capitulo: "",
      pregunta: "A".repeat(100),
      respuesta: "B".repeat(100), // total 200 chars
    },
  };
  // 8000 + 55 * 200 = 19000
  assert.equal(calcularDuracionFraseMs(media), 19000);

  const muyLarga: ItemFrase = {
    tipo: "biblia",
    datos: {
      id: "2",
      libro: "Ps",
      capitulo: 1,
      desde: 1,
      hasta: 2,
      la: "A".repeat(220),
      es: "B".repeat(300), // total 520 chars
      ref: "Salmo 1, 1",
    },
  };
  // 8000 + 55 * 520 = 36600 -> clamp a 32000
  assert.equal(calcularDuracionFraseMs(muyLarga), 32000);
});

test("barajar produce una permutación de todos los elementos", () => {
  const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const barajado = barajar(items);
  assert.equal(barajado.length, items.length);
  assert.deepEqual(new Set(barajado), new Set(items));
});

test("barajarSinRepetirUltima evita colocar el mismo elemento al principio", () => {
  const items = [{ id: "A" }, { id: "B" }, { id: "C" }, { id: "D" }];
  // Forzamos un rng que daría a "A" al inicio
  for (let i = 0; i < 50; i++) {
    const res = barajarSinRepetirUltima(items, "A");
    assert.notEqual(res[0].id, "A");
  }
});

test("alternancia estricta Biblia ↔ Catecismo en la secuencia (D38)", () => {
  const citasTest: CitaBiblica[] = [
    { id: "C1", libro: "Ps", capitulo: 1, desde: 1, hasta: 1, la: "la1", es: "es1", ref: "ref1" },
    { id: "C2", libro: "Ps", capitulo: 2, desde: 1, hasta: 1, la: "la2", es: "es2", ref: "ref2" },
    { id: "C3", libro: "Ps", capitulo: 3, desde: 1, hasta: 1, la: "la3", es: "es3", ref: "ref3" },
  ];
  const catecismoTest: PreguntaCatecismo[] = [
    { n: 1, parte: "P", capitulo: "C", pregunta: "p1", respuesta: "r1" },
    { n: 2, parte: "P", capitulo: "C", pregunta: "p2", respuesta: "r2" },
  ];

  let estado = estadoInicialSecuencia();
  const tiposVistos: ("biblia" | "catecismo")[] = [];

  for (let i = 0; i < 20; i++) {
    const { item, siguienteEstado } = avanzarSecuencia(estado, citasTest, catecismoTest);
    tiposVistos.push(item.tipo);
    estado = siguienteEstado;
  }

  // Comprobar alternancia B, C, B, C, B, C...
  for (let i = 0; i < tiposVistos.length; i++) {
    const esperado = i % 2 === 0 ? "biblia" : "catecismo";
    assert.equal(tiposVistos[i], esperado, `Paso ${i} falló alternancia`);
  }
});

test("la bolsa barajada no repite citas antes de agotar el mazo", () => {
  const citasTest: CitaBiblica[] = [
    { id: "C1", libro: "Ps", capitulo: 1, desde: 1, hasta: 1, la: "la1", es: "es1", ref: "ref1" },
    { id: "C2", libro: "Ps", capitulo: 2, desde: 1, hasta: 1, la: "la2", es: "es2", ref: "ref2" },
    { id: "C3", libro: "Ps", capitulo: 3, desde: 1, hasta: 1, la: "la3", es: "es3", ref: "ref3" },
    { id: "C4", libro: "Ps", capitulo: 4, desde: 1, hasta: 1, la: "la4", es: "es4", ref: "ref4" },
  ];
  const catecismoTest: PreguntaCatecismo[] = [
    { n: 1, parte: "P", capitulo: "C", pregunta: "p1", respuesta: "r1" },
  ];

  let estado = estadoInicialSecuencia();
  const primerMazoCitas: string[] = [];

  // Tomamos 4 citas (8 pasos alternados)
  for (let i = 0; i < 4; i++) {
    const paso1 = avanzarSecuencia(estado, citasTest, catecismoTest);
    assert.equal(paso1.item.tipo, "biblia");
    primerMazoCitas.push(paso1.item.datos.id);
    // paso 2 es catecismo
    const paso2 = avanzarSecuencia(paso1.siguienteEstado, citasTest, catecismoTest);
    estado = paso2.siguienteEstado;
  }

  // Las 4 citas deben ser únicas y contener a C1, C2, C3, C4
  assert.equal(new Set(primerMazoCitas).size, 4);
  assert.deepEqual(new Set(primerMazoCitas), new Set(["C1", "C2", "C3", "C4"]));

  // El siguiente paso de biblia inicia un segundo ciclo
  const paso5 = avanzarSecuencia(estado, citasTest, catecismoTest);
  assert.equal(paso5.item.tipo, "biblia");
  // La primera cita del segundo mazo no puede ser igual a la última del primer mazo
  const ultimaDelPrimerMazo = primerMazoCitas[primerMazoCitas.length - 1];
  assert.notEqual(paso5.item.datos.id, ultimaDelPrimerMazo);
});

test("selección de foto: nunca repite las últimas 12 cuando el pool tiene > 12 (D39)", () => {
  // Pool de 20 fotos
  const pool = Array.from({ length: 20 }, (_, i) => ({ id: `foto-${i + 1}` }));
  let ultimas: string[] = [];

  for (let i = 0; i < 50; i++) {
    const res = elegirFotoSinRepetirUltimas(pool, ultimas);
    assert.ok(res);
    assert.ok(!ultimas.slice(-12).includes(res.foto.id), `Foto ${res.foto.id} repetida en últimas 12 (${ultimas.join(",")})`);
    ultimas = res.ultimasActualizadas;
    assert.ok(ultimas.length <= 12);
  }
});

test("selección de foto con pool pequeño (<= 12 fotos) evita la inmediata anterior", () => {
  const pool = [{ id: "f1" }, { id: "f2" }, { id: "f3" }];
  let ultimas: string[] = [];

  for (let i = 0; i < 20; i++) {
    const res = elegirFotoSinRepetirUltimas(pool, ultimas);
    assert.ok(res);
    if (ultimas.length > 0) {
      assert.notEqual(res.foto.id, ultimas[ultimas.length - 1]);
    }
    ultimas = res.ultimasActualizadas;
  }
});

test("calcularEscalaFrase mantiene 1.0 en textos cortos y reduce hasta 0.68 en textos largos", () => {
  const corta: ItemFrase = {
    tipo: "biblia",
    datos: {
      id: "1",
      libro: "Ps",
      capitulo: 1,
      desde: 1,
      hasta: 1,
      la: "Dominus regit me.",
      es: "El Señor me pastorea.",
      ref: "Salmo 22, 1",
    },
  };
  assert.equal(calcularEscalaFrase(corta), 1);

  const media: ItemFrase = {
    tipo: "catecismo",
    datos: {
      n: 10,
      parte: "",
      capitulo: "",
      pregunta: "A".repeat(90),
      respuesta: "B".repeat(200),
    },
  };
  const escalaMedia = calcularEscalaFrase(media);
  assert.ok(escalaMedia < 1 && escalaMedia > 0.68, `Escala media inesperada: ${escalaMedia}`);

  const larga: ItemFrase = {
    tipo: "biblia",
    datos: {
      id: "2",
      libro: "Ps",
      capitulo: 1,
      desde: 1,
      hasta: 2,
      la: "A".repeat(220),
      es: "B".repeat(300),
      ref: "Salmo 1, 1-2",
    },
  };
  assert.equal(calcularEscalaFrase(larga), 0.68);
});

