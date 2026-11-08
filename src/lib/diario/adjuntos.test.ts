import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CALIDADES_VOZ,
  CONFIRMAR_DESCARTE_SEG,
  ESCALA_DOBLE_TOQUE,
  ESCALA_MAXIMA,
  MAX_BYTES_ADJUNTO,
  VISTA_INICIAL,
  acercarEnFoco,
  ajustarAlVisor,
  arrastreMueveLaImagen,
  barrasDeOnda,
  bpsDe,
  clasificarAdjunto,
  elegirMimeDeGrabacion,
  escalaDeDobleToque,
  extensionDe,
  extensionDeArchivo,
  extensionDeGrabacion,
  factorDeRueda,
  formatearTamano,
  formatearTiempo,
  leerRango,
  limiteDeGrabacionSeg,
  limitarDesplazamiento,
  moverFoto,
  nombreDeNotaDeVoz,
  nombreSeguro,
  nombreSinExtension,
  pideConfirmarDescarte,
  puedeGuardarGrabacion,
  validarAdjunto,
} from "./adjuntos.ts";

test("extensionDe: minúsculas, sin punto, vacía si no hay", () => {
  assert.equal(extensionDe("Foto.JPG"), "jpg");
  assert.equal(extensionDe("sin-extension"), "");
  assert.equal(extensionDe(".oculto"), "");
  assert.equal(extensionDe("termina."), "");
  assert.equal(extensionDe("a.tar.gz"), "gz");
});

test("clasificarAdjunto: por tipo del navegador, con parámetros y alias", () => {
  assert.deepEqual(clasificarAdjunto("x", "audio/webm;codecs=opus"), { mime: "audio/webm", categoria: "audio" });
  assert.deepEqual(clasificarAdjunto("x", "audio/mp3"), { mime: "audio/mpeg", categoria: "audio" });
  assert.deepEqual(clasificarAdjunto("x", "audio/x-m4a"), { mime: "audio/mp4", categoria: "audio" });
  assert.deepEqual(clasificarAdjunto("x", "video/mp4"), { mime: "video/mp4", categoria: "video" });
  assert.deepEqual(clasificarAdjunto("x", "application/pdf"), { mime: "application/pdf", categoria: "documento" });
  assert.equal(clasificarAdjunto("x", "text/plain")?.mime, "text/plain; charset=utf-8");
});

test("clasificarAdjunto: sin tipo útil se mira la extensión", () => {
  assert.deepEqual(clasificarAdjunto("Libro.EPUB", ""), { mime: "application/epub+zip", categoria: "documento" });
  assert.deepEqual(clasificarAdjunto("nota.m4a", "application/octet-stream"), { mime: "audio/mp4", categoria: "audio" });
  assert.deepEqual(clasificarAdjunto("clip.mov", ""), { mime: "video/quicktime", categoria: "video" });
  assert.deepEqual(clasificarAdjunto("voz.ogg", ""), { mime: "audio/ogg", categoria: "audio" });
  // «.mp4» es ambiguo (audio o video): sin otro dato, video
  assert.deepEqual(clasificarAdjunto("x.mp4", "application/octet-stream"), { mime: "video/mp4", categoria: "video" });
});

test("clasificarAdjunto: nada que el navegador pueda ejecutar", () => {
  for (const [nombre, mime] of [
    ["a.html", "text/html"],
    ["a.svg", "image/svg+xml"],
    ["a.js", "text/javascript"],
    ["a.exe", "application/x-msdownload"],
    ["a.xml", "application/xml"],
    ["a", ""],
  ] as const) {
    assert.equal(clasificarAdjunto(nombre, mime), null, nombre);
  }
});

test("validarAdjunto: tipo, vacío y tope de 4 MB", () => {
  assert.equal(validarAdjunto("a.pdf", "application/pdf", 1000).ok, true);
  assert.equal(validarAdjunto("a.pdf", "application/pdf", MAX_BYTES_ADJUNTO).ok, true);
  const grande = validarAdjunto("a.pdf", "application/pdf", MAX_BYTES_ADJUNTO + 1);
  assert.equal(grande.ok, false);
  if (!grande.ok) assert.match(grande.error, /4,0 MB|4 MB/);
  assert.equal(validarAdjunto("a.pdf", "application/pdf", 0).ok, false);
  assert.equal(validarAdjunto("a.html", "text/html", 10).ok, false);
});

test("nombreSeguro: caracteres prohibidos, reservados y tope de bytes", () => {
  assert.equal(nombreSeguro("Informe: final?.pdf"), "Informe_ final_.pdf");
  assert.equal(nombreSeguro("C:\\carpeta\\doc.txt"), "doc.txt");
  assert.equal(nombreSeguro("../../etc/passwd"), "passwd");
  assert.equal(nombreSeguro("con.txt"), "_con.txt");
  assert.equal(nombreSeguro("LPT1"), "_LPT1");
  assert.equal(nombreSeguro(""), "archivo");
  assert.equal(nombreSeguro(null), "archivo");
  assert.equal(nombreSeguro("...", "x"), "x");
  assert.equal(nombreSeguro(" nombre .pdf"), "nombre.pdf");
  const largo = nombreSeguro(`${"a".repeat(300)}.${"b".repeat(40)}`);
  const [tallo, ext] = largo.split(".");
  assert.equal(tallo.length, 100);
  assert.equal(ext.length, 16);
  // cortar en bytes no parte un carácter de varios bytes
  const emojis = nombreSeguro(`${"🙂".repeat(50)}.txt`);
  assert.equal(new TextEncoder().encode(emojis.split(".")[0]).length, 100);
  assert.ok(!emojis.includes("\uFFFD"));
});

test("nombreSinExtension", () => {
  assert.equal(nombreSinExtension("Informe.pdf"), "Informe");
  assert.equal(nombreSinExtension("sin"), "sin");
  assert.equal(nombreSinExtension("a.b.c"), "a.b");
});

test("formatearTamano", () => {
  assert.equal(formatearTamano(0), "0 B");
  assert.equal(formatearTamano(512), "512 B");
  assert.equal(formatearTamano(1536), "1,5 KB");
  assert.equal(formatearTamano(12 * 1024 * 1024), "12 MB");
  assert.equal(formatearTamano(MAX_BYTES_ADJUNTO), "4,0 MB");
  assert.equal(formatearTamano(-1), "");
  assert.equal(formatearTamano(null), "");
  assert.equal(formatearTamano(NaN), "");
});

test("formatearTiempo", () => {
  assert.equal(formatearTiempo(0), "0:00");
  assert.equal(formatearTiempo(7.9), "0:07");
  assert.equal(formatearTiempo(725), "12:05");
  assert.equal(formatearTiempo(3723), "1:02:03");
  assert.equal(formatearTiempo(NaN), "0:00");
  assert.equal(formatearTiempo(-4), "0:00");
});

test("grabadora: calidades, límite y reglas de guardar / descartar", () => {
  assert.deepEqual(CALIDADES_VOZ.map((c) => c.bps), [64_000, 32_000, 16_000]);
  assert.equal(bpsDe("media"), 32_000);
  // a 32 kb/s caben unos 15 minutos con margen
  const limite = limiteDeGrabacionSeg(32_000);
  assert.ok(limite > 14 * 60 && limite < 16 * 60, String(limite));
  assert.ok((limite * 32_000) / 8 < MAX_BYTES_ADJUNTO);
  assert.ok(limiteDeGrabacionSeg(16_000) > limiteDeGrabacionSeg(64_000));
  assert.equal(puedeGuardarGrabacion(0.9), false);
  assert.equal(puedeGuardarGrabacion(1), true);
  assert.equal(pideConfirmarDescarte(CONFIRMAR_DESCARTE_SEG - 0.1), false);
  assert.equal(pideConfirmarDescarte(CONFIRMAR_DESCARTE_SEG), true);
});

test("elegirMimeDeGrabacion: el primero soportado, o vacío", () => {
  assert.equal(elegirMimeDeGrabacion(() => true), "audio/webm;codecs=opus");
  assert.equal(elegirMimeDeGrabacion((m) => m === "audio/mp4"), "audio/mp4");
  assert.equal(elegirMimeDeGrabacion(() => false), "");
  assert.equal(extensionDeGrabacion("audio/webm;codecs=opus"), "webm");
  assert.equal(extensionDeGrabacion("audio/mp4"), "m4a");
  assert.equal(extensionDeGrabacion("audio/ogg;codecs=opus"), "ogg");
});

test("nombreDeNotaDeVoz", () => {
  assert.equal(nombreDeNotaDeVoz("2026-11-08", 8 * 60 + 5), "Nota de voz 2026-11-08 08:05");
});

test("barrasDeOnda: determinista, afinada en los bordes, se mueve al grabar", () => {
  const a = barrasDeOnda(7, 40);
  const b = barrasDeOnda(7, 40);
  assert.deepEqual(a, b);
  assert.equal(a.length, 40);
  assert.ok(a.every((v) => v > 0 && v <= 1));
  assert.ok(a[0] < a[20] || a[0] < 0.5);
  assert.ok(a[0] < Math.max(...a));
  assert.notDeepEqual(barrasDeOnda(8, 40), a);
  const quieta = barrasDeOnda(7, 40, 0.3, 0);
  assert.deepEqual(quieta, a);
  const movida = barrasDeOnda(7, 40, 0.3, 1);
  assert.notDeepEqual(movida, a);
  assert.deepEqual(barrasDeOnda(7, 0), []);
  assert.equal(barrasDeOnda(7, 3).length, 3);
});

const visor = { w: 400, h: 300 };
const imagen = { w: 800, h: 300 };

test("ajustarAlVisor: sin deformar, nada para tamaños inválidos", () => {
  assert.deepEqual(ajustarAlVisor(imagen, visor), { w: 400, h: 150 });
  assert.deepEqual(ajustarAlVisor({ w: 300, h: 600 }, visor), { w: 150, h: 300 });
  assert.deepEqual(ajustarAlVisor({ w: 0, h: 10 }, visor), { w: 0, h: 0 });
});

test("limitarDesplazamiento: la imagen no se despega de los bordes", () => {
  const aj = ajustarAlVisor(imagen, visor); // 400 x 150
  // a 1× no hay nada que mover
  assert.deepEqual(limitarDesplazamiento(50, 50, 1, aj, visor), { x: 0, y: 0 });
  // a 3×: ancho 1200 → 400 de recorrido por lado; alto 450 → 75 por lado
  assert.deepEqual(limitarDesplazamiento(999, -999, 3, aj, visor), { x: 400, y: -75 });
  assert.deepEqual(limitarDesplazamiento(10, 10, 3, aj, visor), { x: 10, y: 10 });
});

test("acercarEnFoco: el punto bajo el foco queda quieto y la escala se limita", () => {
  const aj = ajustarAlVisor({ w: 400, h: 300 }, visor); // llena el visor
  const foco = { x: 300, y: 100 };
  const v = acercarEnFoco(VISTA_INICIAL, foco, 2, aj, visor);
  assert.equal(v.escala, 2);
  // punto de la imagen bajo el foco antes: (300-200, 100-150) = (100, -50) desde el centro
  // después: centro + desplazamiento + punto*escala = foco
  assert.equal(Math.round(200 + v.x + 100 * v.escala), 300);
  assert.equal(Math.round(150 + v.y + -50 * v.escala), 100);
  assert.equal(acercarEnFoco(VISTA_INICIAL, foco, 99, aj, visor).escala, ESCALA_MAXIMA);
  const atras = acercarEnFoco({ escala: 3, x: 100, y: 20 }, foco, 0.1, aj, visor);
  assert.deepEqual(atras, { escala: 1, x: 0, y: 0 });
});

test("escalaDeDobleToque y factorDeRueda", () => {
  assert.equal(escalaDeDobleToque(1), ESCALA_DOBLE_TOQUE);
  assert.equal(escalaDeDobleToque(2), 1);
  assert.equal(escalaDeDobleToque(5.5), 1);
  assert.ok(factorDeRueda(-100) > 1);
  assert.ok(factorDeRueda(100) < 1);
  assert.equal(factorDeRueda(0), 1);
  assert.ok(Math.abs(factorDeRueda(-200) - Math.E) < 1e-9);
});

test("arrastreMueveLaImagen: sin zoom suelta; con zoom, hasta el borde", () => {
  const aj = ajustarAlVisor({ w: 400, h: 300 }, visor);
  for (const d of ["izquierda", "derecha", "arriba", "abajo"] as const) assert.equal(arrastreMueveLaImagen(d, VISTA_INICIAL, aj, visor), false);
  // 2× centrada: sobra imagen para los dos lados
  const centrada = { escala: 2, x: 0, y: 0 };
  for (const d of ["izquierda", "derecha", "arriba", "abajo"] as const) assert.equal(arrastreMueveLaImagen(d, centrada, aj, visor), true);
  // pegada al borde derecho de la imagen (se vio todo lo de la derecha): ya no hay más hacia la izquierda
  const alFinal = { escala: 2, x: -200, y: 0 };
  assert.equal(arrastreMueveLaImagen("izquierda", alFinal, aj, visor), false);
  assert.equal(arrastreMueveLaImagen("derecha", alFinal, aj, visor), true);
});

test("moverFoto: sin dar la vuelta", () => {
  assert.equal(moverFoto(0, 4, -1), 0);
  assert.equal(moverFoto(0, 4, 1), 1);
  assert.equal(moverFoto(3, 4, 1), 3);
  assert.equal(moverFoto(0, 0, 1), 0);
});

test("leerRango: un rango, los últimos bytes, abierto, inválido o ninguno", () => {
  assert.equal(leerRango(null, 1000), null);
  assert.equal(leerRango("", 1000), null);
  assert.deepEqual(leerRango("bytes=0-99", 1000), { inicio: 0, fin: 99 });
  assert.deepEqual(leerRango("bytes=500-", 1000), { inicio: 500, fin: 999 });
  assert.deepEqual(leerRango("bytes=900-5000", 1000), { inicio: 900, fin: 999 });
  assert.deepEqual(leerRango("bytes=-100", 1000), { inicio: 900, fin: 999 });
  assert.deepEqual(leerRango("bytes=-5000", 1000), { inicio: 0, fin: 999 });
  assert.deepEqual(leerRango("Bytes = 0 - 0", 1000), { inicio: 0, fin: 0 });
  assert.equal(leerRango("bytes=1000-", 1000), "invalido");
  assert.equal(leerRango("bytes=50-10", 1000), "invalido");
  assert.equal(leerRango("bytes=-0", 1000), "invalido");
  assert.equal(leerRango("bytes=0-1", 0), "invalido");
  // varios rangos, unidades raras o basura: se manda todo
  assert.equal(leerRango("bytes=0-1,5-9", 1000), null);
  assert.equal(leerRango("items=0-1", 1000), null);
  assert.equal(leerRango("bytes=-", 1000), null);
  assert.equal(leerRango("bytes=a-b", 1000), null);
});

test("extensionDeArchivo: la extensión de cada tipo guardado", () => {
  assert.equal(extensionDeArchivo("audio/webm"), "weba");
  assert.equal(extensionDeArchivo("video/webm"), "webm");
  assert.equal(extensionDeArchivo("audio/mp4"), "m4a");
  assert.equal(extensionDeArchivo("audio/mpeg"), "mp3");
  assert.equal(extensionDeArchivo("video/mp4"), "mp4");
  assert.equal(extensionDeArchivo("video/quicktime"), "mov");
  assert.equal(extensionDeArchivo("application/pdf"), "pdf");
  assert.equal(extensionDeArchivo("text/plain; charset=utf-8"), "txt");
  assert.equal(extensionDeArchivo("application/vnd.openxmlformats-officedocument.wordprocessingml.document"), "docx");
  assert.equal(extensionDeArchivo("algo/raro"), "bin");
  // lo que se guarda vuelve a reconocerse
  for (const mime of ["audio/webm", "audio/ogg", "audio/mp4", "video/mp4", "application/pdf", "application/epub+zip", "text/markdown; charset=utf-8"]) {
    assert.equal(clasificarAdjunto(`x.${extensionDeArchivo(mime)}`, "")?.mime.split(";")[0], mime.split(";")[0], mime);
  }
});
