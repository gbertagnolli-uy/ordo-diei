import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ORDEN_CANONICO_CARTAS, ordenarCartas, pesoCarta } from "./orden.ts";

test("Orden canónico y litúrgico de cartas (Lane 43)", async (t) => {
  await t.test("Los misterios luminosos no están presentes en el catálogo ni en el orden canónico", () => {
    const luminosos = [
      "misterio-bautismo-jesus",
      "misterio-bodas-cana",
      "misterio-anuncio-reino",
      "misterio-transfiguracion",
      "misterio-institucion-eucaristia",
    ];

    for (const lum of luminosos) {
      assert.equal(
        ORDEN_CANONICO_CARTAS.includes(lum),
        false,
        `El misterio luminoso ${lum} no debe estar en el orden canónico`
      );
    }

    const rutaMisterios = path.join(process.cwd(), "src", "lib", "cartas", "catalogo", "misterios.json");
    const misterios = JSON.parse(fs.readFileSync(rutaMisterios, "utf-8"));
    assert.equal(misterios.length, 15, "Deben haber exactamente 15 misterios tradicionales");

    for (const lum of luminosos) {
      assert.equal(
        misterios.some((m: { clave: string }) => m.clave === lum),
        false,
        `El catálogo no debe contener el misterio ${lum}`
      );
    }
  });

  await t.test("Carlos Acutis y santos nombrados después de Pío XII no aparecen", () => {
    const santosPostPioXII = [
      "san-carlos-acutis",
      "carlos-acutis",
      "santa-faustina-kowalska",
      "divina-misericordia",
      "san-juan-pablo-ii",
      "san-padre-pio",
      "san-josemaria-escriva",
      "santa-teresa-de-calcuta",
    ];

    for (const clave of santosPostPioXII) {
      assert.equal(
        ORDEN_CANONICO_CARTAS.includes(clave),
        false,
        `La clave post-Pío XII ${clave} no debe existir en el orden canónico`
      );
    }

    const dirCatalogo = path.join(process.cwd(), "src", "lib", "cartas", "catalogo");
    const archivos = fs.readdirSync(dirCatalogo).filter((f) => f.endsWith(".json"));
    for (const arch of archivos) {
      const items = JSON.parse(fs.readFileSync(path.join(dirCatalogo, arch), "utf-8"));
      for (const item of items) {
        for (const prohibido of santosPostPioXII) {
          assert.notEqual(
            item.clave,
            prohibido,
            `El archivo ${arch} contiene la clave no permitida: ${prohibido}`
          );
        }
      }
    }
  });

  await t.test("Dios y Nuestro Señor van al principio de la colección", () => {
    const cartasDios = [
      "sagrada-eucaristia",
      "sagrado-corazon-de-jesus",
      "santa-cruz",
    ];

    for (const c of cartasDios) {
      const idx = ORDEN_CANONICO_CARTAS.indexOf(c);
      assert.ok(idx >= 0 && idx < 4, `${c} debe estar entre las primeras posiciones`);
    }
  });

  await t.test("Después de Dios le sigue la Santísima Virgen María y sus fiestas de San Pío V", () => {
    const idxEucaristia = ORDEN_CANONICO_CARTAS.indexOf("sagrada-eucaristia");
    const idxSagradoCorazon = ORDEN_CANONICO_CARTAS.indexOf("sagrado-corazon-de-jesus");
    const idxSantaCruz = ORDEN_CANONICO_CARTAS.indexOf("santa-cruz");
    const idxMaria = ORDEN_CANONICO_CARTAS.indexOf("santa-maria-madre-de-dios");
    const idxJose = ORDEN_CANONICO_CARTAS.indexOf("san-jose");

    assert.ok(idxEucaristia < idxMaria, "Dios (Eucaristía) precede a la Virgen María");
    assert.ok(idxSagradoCorazon < idxMaria, "Dios (Sagrado Corazón) precede a la Virgen María");
    assert.ok(idxSantaCruz < idxMaria, "Dios (Santa Cruz) precede a la Virgen María");

    // Fiestas marianas de la liturgia de San Pío V (Missale Romanum 1570)
    const fiestasMarianasPioV = [
      "fiesta-purificacion-de-maria",
      "fiesta-anunciacion-de-maria",
      "fiesta-visitacion-de-maria",
      "fiesta-santa-maria-de-las-nieves",
      "fiesta-asuncion-de-maria",
      "fiesta-natividad-de-maria",
      "fiesta-dolores-de-maria",
      "santo-rosario",
      "fiesta-presentacion-de-maria",
      "fiesta-inmaculada-concepcion",
    ];

    for (const fiesta of fiestasMarianasPioV) {
      const idxFiesta = ORDEN_CANONICO_CARTAS.indexOf(fiesta);
      assert.ok(
        idxFiesta > idxSantaCruz,
        `La fiesta mariana ${fiesta} debe ir después de Dios`
      );
      assert.ok(
        idxFiesta < idxJose,
        `La fiesta mariana ${fiesta} debe ir antes de San José y los santos`
      );
    }

    // En el catálogo de temas todas las fiestas marianas de San Pío V existen
    const rutaTemas = path.join(process.cwd(), "src", "lib", "cartas", "catalogo", "temas.json");
    const temas = JSON.parse(fs.readFileSync(rutaTemas, "utf-8"));
    for (const fiesta of fiestasMarianasPioV) {
      assert.ok(
        temas.some((t: { clave: string }) => t.clave === fiesta),
        `La fiesta mariana ${fiesta} debe estar en temas.json`
      );
    }

    // Entre todos los santos, María es la primera
    const rutaSantos = path.join(process.cwd(), "src", "lib", "cartas", "catalogo", "santos.json");
    const santos = JSON.parse(fs.readFileSync(rutaSantos, "utf-8"));
    assert.equal(santos[0].clave, "santa-maria-madre-de-dios", "María debe ser la primera de los santos");
  });

  await t.test("Los primeros santos que aparecen son los más importantes (Letaniae Sanctorum)", () => {
    const ordenEsperadoInicio = [
      "santa-maria-madre-de-dios",
      "san-jose",
      "san-juan-bautista",
      "san-pedro-apostol",
      "san-pablo-apostol",
    ];

    for (let i = 0; i < ordenEsperadoInicio.length - 1; i++) {
      const a = ordenEsperadoInicio[i];
      const b = ordenEsperadoInicio[i + 1];
      assert.ok(
        pesoCarta(a) < pesoCarta(b),
        `${a} debe preceder a ${b} en importancia litúrgica`
      );
    }

    const rutaSantos = path.join(process.cwd(), "src", "lib", "cartas", "catalogo", "santos.json");
    const santos = JSON.parse(fs.readFileSync(rutaSantos, "utf-8"));

    assert.equal(santos[0].clave, "santa-maria-madre-de-dios");
    assert.equal(santos[1].clave, "san-jose");
    assert.equal(santos[2].clave, "san-juan-bautista");
    assert.equal(santos[3].clave, "san-pedro-apostol");
    assert.equal(santos[4].clave, "san-pablo-apostol");
  });

  await t.test("ordenarCartas ordena correctamente un listado desordenado", () => {
    const desordenadas = [
      { clave: "misterio-anunciacion" },
      { clave: "san-pedro-apostol" },
      { clave: "santa-maria-madre-de-dios" },
      { clave: "sagrado-corazon-de-jesus" },
      { clave: "san-jose" },
    ];

    const ordenadas = ordenarCartas(desordenadas);
    assert.deepEqual(
      ordenadas.map((c) => c.clave),
      [
        "sagrado-corazon-de-jesus",
        "santa-maria-madre-de-dios",
        "san-jose",
        "san-pedro-apostol",
        "misterio-anunciacion",
      ]
    );
  });
});
