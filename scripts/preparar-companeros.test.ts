import test from "node:test";
import assert from "node:assert/strict";
import { destinoDe } from "./preparar-companeros.ts";

test("los nombres de origen van a su carpeta", () => {
  assert.deepEqual(destinoDe("madre-isabel-abrazo.png"), { ruta: "madre-isabel/abrazo.webp", ancho: 768, alto: 1024 });
  assert.equal(destinoDe("Padre-Santiago-Buenos-Dias.PNG")?.ruta, "padre-santiago/buenos-dias.webp");
  assert.equal(destinoDe("fondo-jardin.jpg")?.ruta, "fondos/jardin.webp");
  assert.deepEqual(destinoDe("objeto-veladora.png"), { ruta: "objetos/veladora.webp", ancho: 512, alto: 512 });
});

test("los héroes con guiones en la clave y los objetos propios", () => {
  assert.equal(destinoDe("San-Miguel-Arcangel-felicitando.png")?.ruta, "san-miguel-arcangel/felicitando.webp");
  assert.equal(destinoDe("dom-pio-objeto.png")?.ruta, "dom-pio/objeto.webp");
  assert.equal(destinoDe("pedro-saltando.png"), null);
});

test("lo que no está en el catálogo se rechaza", () => {
  assert.equal(destinoDe("dragon-abrazo.png"), null);
  assert.equal(destinoDe("laura-saltando.png"), null);
  assert.equal(destinoDe("fondo-playa.png"), null);
  assert.equal(destinoDe("objeto-capilla.png"), null);
  assert.equal(destinoDe("singuion.png"), null);
});
