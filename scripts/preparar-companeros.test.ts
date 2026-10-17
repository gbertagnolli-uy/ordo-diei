import test from "node:test";
import assert from "node:assert/strict";
import { destinoDe } from "./preparar-companeros.ts";

test("los nombres de origen van a su carpeta", () => {
  assert.deepEqual(destinoDe("monja-abrazo.png"), { ruta: "monja/abrazo.webp", ancho: 768, alto: 1024 });
  assert.equal(destinoDe("Sacerdote-Buenos-Dias.PNG")?.ruta, "sacerdote/buenos-dias.webp");
  assert.equal(destinoDe("fondo-jardin.jpg")?.ruta, "fondos/jardin.webp");
  assert.deepEqual(destinoDe("objeto-veladora.png"), { ruta: "objetos/veladora.webp", ancho: 512, alto: 512 });
});

test("lo que no está en el catálogo se rechaza", () => {
  assert.equal(destinoDe("dragon-abrazo.png"), null);
  assert.equal(destinoDe("monja-saltando.png"), null);
  assert.equal(destinoDe("fondo-playa.png"), null);
  assert.equal(destinoDe("objeto-capilla.png"), null);
  assert.equal(destinoDe("singuion.png"), null);
});
