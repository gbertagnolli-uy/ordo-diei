// Tests unitarios del motor puro de cartas católicas (Lane 30)

import test from "node:test";
import assert from "node:assert/strict";
import {
  CONFIG_RAREZAS,
  precioFragmentoEnPuntos,
  precioFragmentoEnIncienso,
  BONO_FIESTA_TIENDA,
} from "./economia.ts";
import {
  esquemaCartaCatalogo,
  esquemaCartaAdmin,
  generarClaveSlug,
} from "./esquema.ts";
import {
  elegirBanda,
  sortearCarta,
  sortearSobreMeditacion,
  sortearSobreRevelacion,
  type CartaSorteable,
} from "./sorteo.ts";
import {
  gradoDe,
  aplicarFragmentos,
  imagenDeGrado,
} from "./fragmentos.ts";
import {
  contenidoVisible,
  contarDatosVisiblesDatasheet,
  type CartaCompletaEntrada,
} from "./revelado.ts";
import {
  esAnioBisiesto,
  esFiestaHoy,
  regaloFiesta,
  esCumpleHoy,
  regaloCumple,
  multiplicadorTienda,
} from "./eventos.ts";
import { ejecutarSimulacionCompleta } from "./simulacion.ts";

// Pool de cartas mock para pruebas de sorteo
const POOL_PRUEBA: CartaSorteable[] = [
  { id: 1, clave: "san-jose", rareza: "Celestial", activa: true },
  { id: 2, clave: "arcangel-miguel", rareza: "Celestial", activa: true },
  { id: 3, clave: "san-juan-pablo-ii", rareza: "Perfecta", activa: true },
  { id: 4, clave: "santa-teresita", rareza: "Perfecta", activa: true },
  { id: 5, clave: "san-francisco-de-asis", rareza: "Buena", activa: true },
  { id: 6, clave: "san-antonio-de-padua", rareza: "Buena", activa: true },
  { id: 7, clave: "misterio-anunciacion", rareza: "Comun", activa: true },
  { id: 8, clave: "misterio-visitacion", rareza: "Comun", activa: true },
];

test("Economía: valores base y sin arbitraje de Incienso", () => {
  // D1: Común=1, Buena=2, Perfecta=4, Celestial=10
  assert.equal(CONFIG_RAREZAS.Comun.valorFragmento, 1);
  assert.equal(CONFIG_RAREZAS.Buena.valorFragmento, 2);
  assert.equal(CONFIG_RAREZAS.Perfecta.valorFragmento, 4);
  assert.equal(CONFIG_RAREZAS.Celestial.valorFragmento, 10);

  // Precios en puntos = valor × 4
  assert.equal(precioFragmentoEnPuntos("Comun"), 4);
  assert.equal(precioFragmentoEnPuntos("Buena"), 8);
  assert.equal(precioFragmentoEnPuntos("Perfecta"), 16);
  assert.equal(precioFragmentoEnPuntos("Celestial"), 40);

  // Precios en Incienso = valor directo (sin arbitraje entre rarezas)
  assert.equal(precioFragmentoEnIncienso("Comun"), 1);
  assert.equal(precioFragmentoEnIncienso("Buena"), 2);
  assert.equal(precioFragmentoEnIncienso("Perfecta"), 4);
  assert.equal(precioFragmentoEnIncienso("Celestial"), 10);
});

test("Sorteo: elegirBanda con RNG determinista respeta los pesos", () => {
  const pesos = { Comun: 60, Buena: 28, Perfecta: 10, Celestial: 2 };
  // Total = 100
  // Roll < 60 -> Comun
  assert.equal(elegirBanda(pesos, () => 0.1), "Comun");
  assert.equal(elegirBanda(pesos, () => 0.59), "Comun");
  // 60 <= Roll < 88 -> Buena
  assert.equal(elegirBanda(pesos, () => 0.60), "Buena");
  assert.equal(elegirBanda(pesos, () => 0.87), "Buena");
  // 88 <= Roll < 98 -> Perfecta
  assert.equal(elegirBanda(pesos, () => 0.88), "Perfecta");
  assert.equal(elegirBanda(pesos, () => 0.97), "Perfecta");
  // 98 <= Roll < 100 -> Celestial
  assert.equal(elegirBanda(pesos, () => 0.98), "Celestial");
  assert.equal(elegirBanda(pesos, () => 0.999), "Celestial");
});

test("Sorteo: renormalización cuando solo hay un subconjunto de bandas", () => {
  // Solo Común (60) y Buena (28). Total = 88
  const resultado = sortearCarta(POOL_PRUEBA, ["Comun", "Buena"], () => 0.8);
  assert.ok(resultado.rareza === "Comun" || resultado.rareza === "Buena");
  assert.notEqual(resultado.rareza, "Perfecta");
  assert.notEqual(resultado.rareza, "Celestial");
});

test("Sorteo: Sobre de Meditación nunca contiene cartas Perfecta ni Celestial", () => {
  // Ejecutar 50 simulaciones con semillas variadas
  let step = 0;
  const rngPseudo = () => {
    step = (step + 17) % 100;
    return step / 100;
  };

  for (let i = 0; i < 50; i++) {
    const res = sortearSobreMeditacion(POOL_PRUEBA, rngPseudo);
    assert.equal(res.fragmentosTotal, 5);
    assert.equal(res.costoPuntos, 40);
    assert.ok(res.items.length >= 1 && res.items.length <= 3);
    const suma = res.items.reduce((acc, it) => acc + it.cantidad, 0);
    assert.equal(suma, 5);

    for (const item of res.items) {
      assert.ok(
        item.rareza === "Comun" || item.rareza === "Buena",
        `Meditación otorgó rareza prohibida: ${item.rareza}`
      );
    }
  }
});

test("Sorteo: Sobre de Revelación garantiza al menos 4 fragmentos de Perfecta o Celestial", () => {
  let step = 0;
  const rngPseudo = () => {
    step = (step + 13) % 100;
    return step / 100;
  };

  for (let i = 0; i < 50; i++) {
    const res = sortearSobreRevelacion(POOL_PRUEBA, rngPseudo);
    assert.equal(res.fragmentosTotal, 8);
    assert.equal(res.costoPuntos, 160);
    assert.ok(res.items.length >= 1 && res.items.length <= 3);
    const suma = res.items.reduce((acc, it) => acc + it.cantidad, 0);
    assert.equal(suma, 8);

    // Debe existir al menos un item de Perfecta o Celestial con >= 4 fragmentos
    const garantizado = res.items.some(
      (it) => (it.rareza === "Perfecta" || it.rareza === "Celestial") && it.cantidad >= 4
    );
    assert.ok(
      garantizado,
      "Sobre de Revelación no cumplió la garantía de al menos 4 fragmentos de Perfecta o Celestial"
    );
  }
});

test("Fragmentos: gradosDe en fronteras 99, 100, 149, 150, 199, 200, 299, 300 %", () => {
  const req = 100;
  assert.equal(gradoDe(0, req), 0);
  assert.equal(gradoDe(99, req), 0);
  assert.equal(gradoDe(100, req), 1);
  assert.equal(gradoDe(149, req), 1);
  assert.equal(gradoDe(150, req), 2);
  assert.equal(gradoDe(199, req), 2);
  assert.equal(gradoDe(200, req), 3);
  assert.equal(gradoDe(299, req), 3);
  assert.equal(gradoDe(300, req), 4);
  assert.equal(gradoDe(350, req), 4); // por encima del tope sigue siendo grado 4
});

test("Fragmentos: aplicarFragmentos con tope y conversión de excedente a Incienso", () => {
  const req = 10; // Tope = 30
  // 1. Suma normal sin desbloquear
  const r1 = aplicarFragmentos(0, req, "Comun", 5);
  assert.equal(r1.nuevo, 5);
  assert.equal(r1.desbloquea, false);
  assert.equal(r1.gradoAntes, 0);
  assert.equal(r1.gradoDespues, 0);
  assert.equal(r1.excedente, 0);
  assert.equal(r1.incienso, 0);

  // 2. Desbloqueo exacto a 100%
  const r2 = aplicarFragmentos(5, req, "Comun", 5);
  assert.equal(r2.nuevo, 10);
  assert.equal(r2.desbloquea, true);
  assert.equal(r2.gradoAntes, 0);
  assert.equal(r2.gradoDespues, 1);
  assert.equal(r2.excedente, 0);

  // 3. Subida a Grado II (15 frags = 150%)
  const r3 = aplicarFragmentos(10, req, "Comun", 5);
  assert.equal(r3.nuevo, 15);
  assert.equal(r3.desbloquea, false);
  assert.equal(r3.gradoAntes, 1);
  assert.equal(r3.gradoDespues, 2);

  // 4. LLegada al tope (30 frags) y desborde de 10 frags en carta Celestial (valor 10)
  const r4 = aplicarFragmentos(28, req, "Celestial", 12);
  // Total recibido: 28 + 12 = 40. Tope = 30. Excedente = 10.
  // Incienso = 10 frags × 10 (valor Celestial) = 100 Incienso
  assert.equal(r4.nuevo, 30);
  assert.equal(r4.excedente, 10);
  assert.equal(r4.incienso, 100);
  assert.equal(r4.gradoDespues, 4);
});

test("Fragmentos: imagenDeGrado con fallback al grado anterior cargado", () => {
  const cartaConTodas = {
    imagenUrl: "/cartas/san-jose/1.webp",
    imagenGrado2Url: "/cartas/san-jose/2.webp",
    imagenGrado3Url: "/cartas/san-jose/3.webp",
    imagenGrado4Url: "/cartas/san-jose/4.webp",
  };
  assert.equal(imagenDeGrado(cartaConTodas, 0), "/cartas/san-jose/1.webp");
  assert.equal(imagenDeGrado(cartaConTodas, 1), "/cartas/san-jose/1.webp");
  assert.equal(imagenDeGrado(cartaConTodas, 2), "/cartas/san-jose/2.webp");
  assert.equal(imagenDeGrado(cartaConTodas, 3), "/cartas/san-jose/3.webp");
  assert.equal(imagenDeGrado(cartaConTodas, 4), "/cartas/san-jose/4.webp");

  // Carta con solo imagen Grado I y III
  const cartaParcial = {
    imagenUrl: "/cartas/san-antonio/1.webp",
    imagenGrado3Url: "/cartas/san-antonio/3.webp",
  };
  assert.equal(imagenDeGrado(cartaParcial, 2), "/cartas/san-antonio/1.webp"); // fallback al grado 1
  assert.equal(imagenDeGrado(cartaParcial, 3), "/cartas/san-antonio/3.webp");
  assert.equal(imagenDeGrado(cartaParcial, 4), "/cartas/san-antonio/3.webp"); // fallback al grado 3
});

// Carta de prueba para revelación progresiva
const CARTA_MOCK: CartaCompletaEntrada = {
  clave: "san-francisco-de-asis",
  nombre: "San Francisco de Asís",
  subtitulo: "El Poverello",
  categoria: "Santo",
  rareza: "Buena",
  celebracion: "10-04",
  historia: "TEXTO_SECRETO_HISTORIA: Francisco nació en Asís en 1181 y fundó la orden franciscana.",
  oracion: "TEXTO_SECRETO_ORACION: Señor, hazme un instrumento de tu paz.",
  frase: "TEXTO_SECRETO_FRASE: Comienza haciendo lo que es necesario, después lo que es posible...",
  fraseAutor: "San Francisco de Asís",
  datasheet: [
    { etiqueta: "Nacimiento", valor: "VALOR_SECRETO_1: 1181, Asís, Italia" },
    { etiqueta: "Fallecimiento", valor: "VALOR_SECRETO_2: 3 de octubre de 1226" },
    { etiqueta: "Principal virtud", valor: "VALOR_SECRETO_3: Pobreza evangélica" },
    { etiqueta: "Patronazgo", valor: "VALOR_SECRETO_4: Ecología, animales y la paz" },
  ],
  fragmentosRequeridos: 100,
  imagenUrl: "/cartas/san-francisco-de-asis/1.webp",
};

test("Revelado D13: fronteras 0, 1, 24, 25, 49, 50, 99, 100 % y seguridad del texto oculto", () => {
  // 1. Frontera 0 %: solo nombre y celebración
  const v0 = contenidoVisible(CARTA_MOCK, 0);
  assert.equal(v0.nombre, "San Francisco de Asís");
  assert.equal(v0.celebracion, "10-04");
  assert.equal(v0.oracion.visible, false);
  assert.equal(v0.oracion.valor, "???");
  assert.equal(v0.frase.visible, false);
  assert.equal(v0.frase.valor, "???");
  assert.equal(v0.historia.visible, false);
  assert.equal(v0.historia.valor, "???");
  assert.equal(v0.datasheet.every((d) => !d.visible && d.valor === "???"), true);

  // SEGURIDAD: Ningún texto secreto debe estar presente en el objeto serializado
  const str0 = JSON.stringify(v0);
  assert.ok(!str0.includes("TEXTO_SECRETO_HISTORIA"));
  assert.ok(!str0.includes("TEXTO_SECRETO_ORACION"));
  assert.ok(!str0.includes("TEXTO_SECRETO_FRASE"));
  assert.ok(!str0.includes("VALOR_SECRETO_1"));

  // 2. Frontera 1 % (0 < p < 25 %): oración desbloqueada, el resto oculto
  const v1 = contenidoVisible(CARTA_MOCK, 1);
  assert.equal(v1.oracion.visible, true);
  assert.ok(v1.oracion.valor.includes("instrumento de tu paz"));
  assert.equal(v1.frase.visible, false);
  assert.equal(v1.historia.visible, false);
  assert.equal(v1.datasheet.every((d) => !d.visible), true);
  const str1 = JSON.stringify(v1);
  assert.ok(!str1.includes("TEXTO_SECRETO_HISTORIA"));
  assert.ok(!str1.includes("TEXTO_SECRETO_FRASE"));

  // 3. Frontera 24 %: todavía sin frase ni datasheet
  const v24 = contenidoVisible(CARTA_MOCK, 24);
  assert.equal(v24.oracion.visible, true);
  assert.equal(v24.frase.visible, false);
  assert.equal(v24.datasheet.every((d) => !d.visible), true);

  // 4. Frontera 25 %: frase desbloqueada y al menos 1 dato del datasheet (algunos, pero no todos)
  const v25 = contenidoVisible(CARTA_MOCK, 25);
  assert.equal(v25.frase.visible, true);
  assert.ok(v25.frase.valor.includes("Comienza haciendo lo que es necesario"));
  assert.equal(v25.frase.autor, "San Francisco de Asís");
  assert.equal(v25.historia.visible, false);

  const visibles25 = v25.datasheet.filter((d) => d.visible);
  assert.ok(visibles25.length >= 1 && visibles25.length < v25.datasheet.length);
  assert.equal(v25.datasheet[0].visible, true);
  assert.ok(v25.datasheet[0].valor.includes("1181"));
  assert.equal(v25.datasheet[3].visible, false);
  assert.equal(v25.datasheet[3].valor, "???");

  // 5. Frontera 49 % y 50 %: progresión del datasheet
  const v49 = contenidoVisible(CARTA_MOCK, 49);
  const v50 = contenidoVisible(CARTA_MOCK, 50);
  assert.equal(v49.historia.visible, false);
  assert.equal(v50.historia.visible, false);
  assert.ok(v50.datasheet.filter((d) => d.visible).length >= 2);

  // 6. Frontera 99 %: historia sigue bloqueada
  const v99 = contenidoVisible(CARTA_MOCK, 99);
  assert.equal(v99.desbloqueada, false);
  assert.equal(v99.historia.visible, false);
  assert.equal(v99.historia.valor, "???");
  assert.ok(!JSON.stringify(v99).includes("TEXTO_SECRETO_HISTORIA"));

  // 7. Frontera 100 %: TODO desbloqueado
  const v100 = contenidoVisible(CARTA_MOCK, 100);
  assert.equal(v100.desbloqueada, true);
  assert.equal(v100.historia.visible, true);
  assert.ok(v100.historia.valor.includes("orden franciscana"));
  assert.equal(v100.datasheet.every((d) => d.visible), true);
  assert.equal(v100.datasheet.every((d) => !d.valor.includes("???")), true);
});

test("Datasheet clamp formula (D13)", () => {
  const N = 4;
  // p < 25 % -> 0
  assert.equal(contarDatosVisiblesDatasheet(0, N), 0);
  assert.equal(contarDatosVisiblesDatasheet(0.24, N), 0);
  // 25 % <= p < 100 % -> clamp(ceil(N * (p - 0.25) / 0.75), 1, N - 1)
  assert.equal(contarDatosVisiblesDatasheet(0.25, N), 1);
  assert.equal(contarDatosVisiblesDatasheet(0.50, N), 2);
  assert.equal(contarDatosVisiblesDatasheet(0.75, N), 3);
  assert.equal(contarDatosVisiblesDatasheet(0.99, N), 3);
  // p >= 100 % -> N
  assert.equal(contarDatosVisiblesDatasheet(1.0, N), 4);
});

test("Eventos: fiesta litúrgica y bono de tienda (D5, D17)", () => {
  // 4 de octubre
  const fechaFiesta = new Date("2026-10-04T12:00:00Z");
  const otraFecha = new Date("2026-10-05T12:00:00Z");

  assert.equal(esFiestaHoy("10-04", fechaFiesta, "America/Montevideo"), true);
  assert.equal(esFiestaHoy("10-04", otraFecha, "America/Montevideo"), false);
  assert.equal(esFiestaHoy(null, fechaFiesta), false);

  // Regalo fiesta: ceil(req * 0.5)
  assert.equal(regaloFiesta(10), 5);
  assert.equal(regaloFiesta(25), 13);
  assert.equal(regaloFiesta(60), 30);
  assert.equal(regaloFiesta(150), 75);

  // Bono tienda: 1.5 en el día de fiesta
  assert.equal(multiplicadorTienda("10-04", fechaFiesta, "America/Montevideo"), BONO_FIESTA_TIENDA);
  assert.equal(multiplicadorTienda("10-04", otraFecha, "America/Montevideo"), 1.0);
});

test("Eventos: cumpleaños con regla 29-feb en año bisiesto y no bisiesto (D6)", () => {
  // 2024 es bisiesto
  assert.equal(esAnioBisiesto(2024), true);
  assert.equal(esAnioBisiesto(2026), false);

  // Usuario nacido el 29 de febrero
  const cumple29Feb = "2000-02-29";

  // En 2024 (bisiesto): se celebra el 29 de febrero
  const feb29_2024 = new Date("2024-02-29T12:00:00Z");
  const feb28_2024 = new Date("2024-02-28T12:00:00Z");
  assert.equal(esCumpleHoy(cumple29Feb, feb29_2024, "America/Montevideo"), true);
  assert.equal(esCumpleHoy(cumple29Feb, feb28_2024, "America/Montevideo"), false);

  // En 2026 (no bisiesto): se celebra el 28 de febrero
  const feb28_2026 = new Date("2026-02-28T12:00:00Z");
  const feb27_2026 = new Date("2026-02-27T12:00:00Z");
  assert.equal(esCumpleHoy(cumple29Feb, feb28_2026, "America/Montevideo"), true);
  assert.equal(esCumpleHoy(cumple29Feb, feb27_2026, "America/Montevideo"), false);

  // Regalo cumple: lo que falta para el 100%
  assert.equal(regaloCumple(60, 20), 40);
  assert.equal(regaloCumple(60, 60), 0); // Ya al 100%
  assert.equal(regaloCumple(60, 80), 0); // Ya superior al 100%
});

test("Zod: validación de catálogo y admin", () => {
  const cartaValida = {
    clave: "san-francisco-de-asis",
    nombre: "San Francisco de Asís",
    categoria: "Santo",
    rareza: "Buena",
    celebracion: "10-04",
    historia: "Historia extensa de Francisco de Asís con suficiente longitud.",
    oracion: "Señor, hazme un instrumento de tu paz.",
    frase: "Comienza haciendo lo que es necesario.",
    datasheet: [
      { etiqueta: "Nacimiento", valor: "1181" },
      { etiqueta: "Muerte", valor: "1226" },
      { etiqueta: "Virtud", valor: "Pobreza" },
      { etiqueta: "Patrono", valor: "Ecología" },
    ],
    imagenes: {
      1: "/cartas/san-francisco-de-asis/1.webp",
    },
  };

  const parsed = esquemaCartaCatalogo.safeParse(cartaValida);
  assert.equal(parsed.success, true);

  // Admin form con autocompletado de fragmentosRequeridos
  const adminData = {
    nombre: "San Francisco de Asís",
    categoria: "Santo",
    rareza: "Buena",
    historia: "Historia extensa de Francisco de Asís.",
    oracion: "Señor, hazme un instrumento de tu paz.",
    frase: "Comienza haciendo lo que es necesario.",
    datasheet: cartaValida.datasheet,
    imagenUrl: "/cartas/san-francisco-de-asis/1.webp",
  };
  const adminParsed = esquemaCartaAdmin.parse(adminData);
  assert.equal(adminParsed.fragmentosRequeridos, 25); // Por defecto el de rareza Buena
  assert.equal(adminParsed.activa, true);

  // Generador de clave slug
  assert.equal(generarClaveSlug("San Francisco de Asís"), "san-francisco-de-asis");
  assert.equal(generarClaveSlug("Virgen de Luján"), "virgen-de-lujan");
});

test("Simulación económica para 10, 15 y 20 pts/día", () => {
  const resultados = ejecutarSimulacionCompleta();
  assert.equal(resultados.length, 3);

  // Para 15 pts/día:
  const r15 = resultados[1];
  assert.equal(r15.ritmoPtsPorDia, 15);
  // Primera Común directa: 40 pts / 15 = 2.7 días
  assert.equal(r15.diasPrimeraComunDirecta, 2.7);
  // Primera Buena directa: 200 pts / 15 = 13.3 días
  assert.equal(r15.diasPrimeraBuenaDirecta, 13.3);
  // Grado IV Común directa: 120 pts / 15 = 8 días
  assert.equal(r15.diasGradoIVComunDirecta, 8);
  // Primera Celestial directa: 6000 pts / 15 = 400 días
  assert.equal(r15.diasPrimeraCelestialDirecta, 400);

  // Comprobar que todos los valores son numéricos válidos
  for (const r of resultados) {
    assert.ok(r.diasPrimeraComunDirecta > 0);
    assert.ok(r.diasPrimeraCelestialDirecta > r.diasPrimeraComunDirecta);
  }
});
