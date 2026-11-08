import { test } from "node:test";
import assert from "node:assert/strict";
import {
  LATITUD_MAX,
  ZOOM_AJUSTE_MAX,
  ZOOM_MAX,
  ZOOM_MIN,
  acercarEn,
  ajustarVista,
  aPantalla,
  aPixelMundo,
  baldosasVisibles,
  baldosaUrl,
  curvaDesaceleracion,
  dePantalla,
  dePixelMundo,
  interpolarCamara,
  limitarCamara,
  mesAnio,
  metrosAPixeles,
  metrosPorPixel,
  moverPorPixeles,
  ordenarHuellas,
  rangoDeMeses,
  rellenoUniforme,
  tamanoMundo,
  tamanoPin,
  textoCantidad,
  textoPin,
} from "./mapa.ts";

const cerca = (a: number, b: number, tolerancia = 1e-6) => assert.ok(Math.abs(a - b) <= tolerancia, `${a} no está cerca de ${b} (±${tolerancia})`);

test("proyección: el origen cae en el centro del mundo y la ida y vuelta es exacta", () => {
  const o = aPixelMundo(0, 0, 0);
  cerca(o.x, 128);
  cerca(o.y, 128);
  const izq = aPixelMundo(0, -180, 3);
  cerca(izq.x, 0);
  cerca(aPixelMundo(0, 180, 3).x, tamanoMundo(3));
  for (const [lat, lon, z] of [[-34.9011, -56.1645, 14], [48.8566, 2.3522, 7], [-77.84, 166.67, 10], [35, 105, 3]] as const) {
    const p = aPixelMundo(lat, lon, z);
    const c = dePixelMundo(p.x, p.y, z);
    cerca(c.latitud, lat, 1e-7);
    cerca(c.longitud, lon, 1e-7);
  }
});

test("proyección: más allá del límite de Mercator se recorta", () => {
  assert.deepEqual(aPixelMundo(90, 0, 2), aPixelMundo(LATITUD_MAX, 0, 2));
  cerca(aPixelMundo(LATITUD_MAX, 0, 2).y, 0, 1e-3);
});

test("pantalla: el centro de la cámara cae en el medio del contenedor y la conversión es reversible", () => {
  const cam = { latitud: -34.9, longitud: -56.16, zoom: 12.5 };
  const t = { ancho: 400, alto: 300 };
  const c = aPantalla(cam, t, cam.latitud, cam.longitud);
  cerca(c.x, 200, 1e-6);
  cerca(c.y, 150, 1e-6);
  const p = dePantalla(cam, t, 70, 220);
  const vuelta = aPantalla(cam, t, p.latitud, p.longitud);
  cerca(vuelta.x, 70, 1e-6);
  cerca(vuelta.y, 220, 1e-6);
});

test("pantalla: un punto del otro lado de la línea de fecha aparece a la izquierda, no a lo lejos", () => {
  const cam = { latitud: 0, longitud: 179.9, zoom: 6 };
  const t = { ancho: 400, alto: 300 };
  const p = aPantalla(cam, t, 0, -179.9);
  assert.ok(p.x > 200 && p.x < 260, `x=${p.x}`);
});

test("baldosas: cubren el contenedor y las columnas se envuelven en el mundo", () => {
  const cam = { latitud: 0, longitud: 179.99, zoom: 3 };
  const t = { ancho: 600, alto: 400 };
  const bs = baldosasVisibles(cam, t);
  assert.ok(bs.length > 0);
  for (const b of bs) {
    assert.equal(b.z, 3);
    assert.ok(b.x >= 0 && b.x < 8, `x=${b.x}`);
    assert.ok(b.y >= 0 && b.y < 8, `y=${b.y}`);
    assert.equal(b.lado, 256);
  }
  const izq = Math.min(...bs.map((b) => b.izquierda));
  const der = Math.max(...bs.map((b) => b.izquierda + b.lado));
  const arr = Math.min(...bs.map((b) => b.arriba));
  const aba = Math.max(...bs.map((b) => b.arriba + b.lado));
  assert.ok(izq <= 0 && der >= 600 && arr <= 0 && aba >= 400);
  // Cruza el antimeridiano: están las columnas 7 y 0
  const cols = new Set(bs.map((b) => b.x));
  assert.ok(cols.has(7) && cols.has(0));
});

test("baldosas: con zoom fraccional se pide el zoom entero más cercano y se escala", () => {
  const bs = baldosasVisibles({ latitud: -34.9, longitud: -56.16, zoom: 12.6 }, { ancho: 300, alto: 300 });
  assert.ok(bs.every((b) => b.z === 13));
  cerca(bs[0].lado, 256 * 2 ** (12.6 - 13), 1e-9);
  const abajo = baldosasVisibles({ latitud: -34.9, longitud: -56.16, zoom: 12.4 }, { ancho: 300, alto: 300 });
  assert.ok(abajo.every((b) => b.z === 12));
});

test("baldosas: en los polos no se piden filas que no existen", () => {
  const bs = baldosasVisibles({ latitud: LATITUD_MAX, longitud: 0, zoom: 3 }, { ancho: 512, alto: 512 });
  assert.ok(bs.every((b) => b.y >= 0));
});

test("baldosaUrl: el formato de OpenStreetMap", () => {
  assert.equal(baldosaUrl(14, 6000, 8800), "https://tile.openstreetmap.org/14/6000/8800.png");
});

test("ajustarVista: sin puntos no hay vista; con uno se centra con el zoom máximo", () => {
  const t = { ancho: 400, alto: 280 };
  assert.equal(ajustarVista([], t, rellenoUniforme(36)), null);
  const c = ajustarVista([{ latitud: -34.9, longitud: -56.16 }], t, rellenoUniforme(36));
  assert.ok(c);
  cerca(c.latitud, -34.9, 1e-9);
  cerca(c.longitud, -56.16, 1e-9);
  assert.equal(c.zoom, ZOOM_AJUSTE_MAX);
});

test("ajustarVista: todos los puntos quedan dentro del contenedor, respetando el margen", () => {
  const t = { ancho: 400, alto: 280 };
  const relleno = rellenoUniforme(36);
  const puntos = [
    { latitud: -34.9, longitud: -56.16 },
    { latitud: -31.38, longitud: -57.96 },
    { latitud: -34.4, longitud: -54.9 },
  ];
  const c = ajustarVista(puntos, t, relleno);
  assert.ok(c);
  assert.ok(c.zoom < ZOOM_AJUSTE_MAX);
  for (const p of puntos) {
    const px = aPantalla(c, t, p.latitud, p.longitud);
    assert.ok(px.x >= relleno.izquierda - 0.5 && px.x <= t.ancho - relleno.derecha + 0.5, `x=${px.x}`);
    assert.ok(px.y >= relleno.arriba - 0.5 && px.y <= t.alto - relleno.abajo + 0.5, `y=${px.y}`);
  }
  // Ajustado: algún borde toca el margen
  const xs = puntos.map((p) => aPantalla(c, t, p.latitud, p.longitud).x);
  const ys = puntos.map((p) => aPantalla(c, t, p.latitud, p.longitud).y);
  const ajustado = Math.abs(Math.min(...xs) - 36) < 0.5 || Math.abs(Math.max(...xs) - (400 - 36)) < 0.5 || Math.abs(Math.min(...ys) - 36) < 0.5 || Math.abs(Math.max(...ys) - (280 - 36)) < 0.5;
  assert.ok(ajustado);
});

test("ajustarVista: puntos lejanos no bajan del zoom mínimo y un margen desparejo corre el centro", () => {
  const t = { ancho: 400, alto: 300 };
  const lejos = ajustarVista([{ latitud: -50, longitud: -170 }, { latitud: 60, longitud: 170 }], t, rellenoUniforme(10));
  assert.ok(lejos);
  assert.equal(lejos.zoom, ZOOM_MIN);
  const puntos = [{ latitud: -34.9, longitud: -56.16 }, { latitud: -34.8, longitud: -56.0 }];
  const arriba = ajustarVista(puntos, t, { arriba: 120, derecha: 20, abajo: 20, izquierda: 20 });
  assert.ok(arriba);
  const ys = puntos.map((p) => aPantalla(arriba, t, p.latitud, p.longitud).y);
  assert.ok(Math.min(...ys) >= 119.5, `min y=${Math.min(...ys)}`);
});

test("moverPorPixeles: arrastrar a la derecha lleva el centro al oeste y arrastrar a la izquierda, al este", () => {
  const cam = { latitud: -34.9, longitud: -56.16, zoom: 12 };
  assert.ok(moverPorPixeles(cam, 100, 0).longitud < cam.longitud);
  assert.ok(moverPorPixeles(cam, -100, 0).longitud > cam.longitud);
  assert.ok(moverPorPixeles(cam, 0, 100).latitud > cam.latitud);
  const igual = moverPorPixeles(cam, 0, 0);
  cerca(igual.latitud, cam.latitud, 1e-9);
  cerca(igual.longitud, cam.longitud, 1e-9);
  // Un punto bajo el dedo sigue bajo el dedo
  const t = { ancho: 400, alto: 300 };
  const antes = aPantalla(cam, t, -34.88, -56.14);
  const despues = aPantalla(moverPorPixeles(cam, 37, -21), t, -34.88, -56.14);
  cerca(despues.x, antes.x + 37, 1e-6);
  cerca(despues.y, antes.y - 21, 1e-6);
});

test("acercarEn: el punto bajo el cursor no se mueve", () => {
  const cam = { latitud: -34.9, longitud: -56.16, zoom: 11 };
  const t = { ancho: 500, alto: 320 };
  const bajo = dePantalla(cam, t, 130, 90);
  const nueva = acercarEn(cam, t, 130, 90, 13.4);
  cerca(nueva.zoom, 13.4);
  const p = aPantalla(nueva, t, bajo.latitud, bajo.longitud);
  cerca(p.x, 130, 1e-6);
  cerca(p.y, 90, 1e-6);
});

test("acercarEn y limitarCamara: el zoom se mantiene entre 3 y 18, y la longitud se envuelve", () => {
  const t = { ancho: 300, alto: 300 };
  assert.equal(acercarEn({ latitud: 0, longitud: 0, zoom: 17 }, t, 150, 150, 25).zoom, ZOOM_MAX);
  assert.equal(acercarEn({ latitud: 0, longitud: 0, zoom: 4 }, t, 150, 150, 0).zoom, ZOOM_MIN);
  cerca(limitarCamara({ latitud: 0, longitud: 190, zoom: 5 }).longitud, -170);
  cerca(limitarCamara({ latitud: 0, longitud: -190, zoom: 5 }).longitud, 170);
  cerca(limitarCamara({ latitud: 99, longitud: 0, zoom: 5 }).latitud, LATITUD_MAX);
});

test("metrosAPixeles: 200 m a zoom 16 en el ecuador son unos 84 px, y se achican al alejarse y hacia los polos", () => {
  cerca(metrosPorPixel(0, 16), 156543.03392 / 65536, 1e-3);
  const px = metrosAPixeles(200, 0, 16);
  assert.ok(px > 83 && px < 85, `px=${px}`);
  assert.ok(metrosAPixeles(200, 0, 15) < px);
  assert.ok(metrosAPixeles(200, 60, 16) > px);
});

test("pines: tamaño y número como en moodiary", () => {
  assert.equal(tamanoPin(1, false), 14);
  assert.equal(tamanoPin(1, true), 38);
  assert.equal(tamanoPin(2, false), 26);
  assert.equal(tamanoPin(9, false), 26);
  assert.equal(tamanoPin(10, false), 30);
  assert.equal(tamanoPin(400, true), 38);
  assert.equal(textoPin(1, false), "");
  assert.equal(textoPin(1, true), "1");
  assert.equal(textoPin(7, false), "7");
  assert.equal(textoPin(99, false), "99");
  assert.equal(textoPin(100, false), "99+");
});

test("textos: meses, rango y cantidad", () => {
  assert.equal(mesAnio("2025-03-17"), "mar 2025");
  assert.equal(mesAnio("2025-12-01"), "dic 2025");
  assert.equal(mesAnio("raro"), "raro");
  assert.equal(rangoDeMeses("2025-03-03", "2025-03-28"), "mar 2025");
  assert.equal(rangoDeMeses("2025-03-03", "2026-01-02"), "mar 2025 – ene 2026");
  assert.equal(textoCantidad(1), "1 entrada");
  assert.equal(textoCantidad(0), "0 entradas");
  assert.equal(textoCantidad(12), "12 entradas");
});

test("ordenarHuellas: más entradas primero; si empatan, la más reciente; después el id; no cambia la lista original", () => {
  const original = [
    { lugarId: 3, cantidad: 2, ultima: "2025-01-01" },
    { lugarId: 1, cantidad: 5, ultima: "2024-01-01" },
    { lugarId: 2, cantidad: 2, ultima: "2025-06-01" },
    { lugarId: 4, cantidad: 2, ultima: "2025-06-01" },
  ];
  assert.deepEqual(ordenarHuellas(original).map((h) => h.lugarId), [1, 2, 4, 3]);
  assert.deepEqual(original.map((h) => h.lugarId), [3, 1, 2, 4]);
});

test("interpolarCamara: extremos, punto medio y camino corto por la línea de fecha", () => {
  const a = { latitud: 0, longitud: 170, zoom: 4 };
  const b = { latitud: 10, longitud: -170, zoom: 8 };
  assert.deepEqual(interpolarCamara(a, b, 0), a);
  const fin = interpolarCamara(a, b, 1);
  cerca(fin.latitud, 10);
  cerca(fin.longitud, -170);
  const m = interpolarCamara(a, b, 0.5);
  cerca(m.zoom, 6);
  cerca(m.latitud, 5);
  cerca(Math.abs(m.longitud), 180, 1e-6);
});

test("curvaDesaceleracion: parte de 0, llega a 1, es creciente y arranca rápido (desacelera)", () => {
  assert.equal(curvaDesaceleracion(0), 0);
  assert.equal(curvaDesaceleracion(1), 1);
  assert.equal(curvaDesaceleracion(-1), 0);
  assert.equal(curvaDesaceleracion(2), 1);
  let anterior = 0;
  for (let i = 1; i <= 20; i++) {
    const v = curvaDesaceleracion(i / 20);
    assert.ok(v >= anterior, `no crece en ${i}`);
    anterior = v;
  }
  // A la cuarta parte del tiempo ya recorrió más de la mitad
  assert.ok(curvaDesaceleracion(0.25) > 0.5);
});
