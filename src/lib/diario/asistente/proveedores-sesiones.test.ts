import { test } from "node:test";
import assert from "node:assert/strict";
import { PRESETS, direccionPrivada, opcionesDeModelo, presetDe, proveedorDePreset, proveedorValido, validarUrlBase } from "./proveedores.ts";
import {
  AJUSTES_INICIALES,
  agruparSesiones,
  ajustesValidos,
  claveAlmacen,
  grupoDe,
  paraGuardar,
  proveedoresValidos,
  sesionNueva,
  sesionValida,
  sesionesValidas,
  tituloVisible,
  turnoDeAsistente,
  turnoDeUsuario,
} from "./sesiones.ts";

test("direcciones privadas: loopback, redes locales, metadatos de la nube e IPv6 internas", () => {
  for (const ip of ["127.0.0.1", "10.1.2.3", "172.16.0.1", "172.31.255.255", "192.168.1.1", "169.254.169.254", "0.0.0.0", "100.64.0.1", "224.0.0.1", "::1", "::", "fe80::1", "fd12::1", "::ffff:127.0.0.1", "::ffff:7f00:1", "999.1.1.1", "cosa"]) {
    assert.equal(direccionPrivada(ip), true, ip);
  }
  for (const ip of ["8.8.8.8", "172.32.0.1", "172.15.0.1", "100.63.0.1", "2606:4700:4700::1111", "104.18.2.161"]) {
    assert.equal(direccionPrivada(ip), false, ip);
  }
});

test("URL base: solo https público, sin credenciales, puerto ni parámetros", () => {
  assert.equal(validarUrlBase(" https://api.example.com/v1/ ").base, "https://api.example.com/v1");
  assert.equal(validarUrlBase("https://api.example.com:443").base, "https://api.example.com");
  for (const mala of ["http://api.example.com", "ftp://x.com", "https://user:pw@x.com", "https://x.com:8443", "https://x.com/v1?k=1", "https://localhost", "https://intranet", "https://127.0.0.1", "https://[::1]", "https://169.254.169.254/latest", "https://foo.internal", "", "no es url", "https://x.com/#a"]) {
    assert.throws(() => validarUrlBase(mala), Error, mala);
  }
});

test("presets: todos pasan la validación y tienen modelos", () => {
  assert.ok(PRESETS.length >= 8);
  for (const p of PRESETS) {
    assert.equal(validarUrlBase(p.baseUrl).base, p.baseUrl, p.id);
    assert.ok(p.modelos.length > 0, p.id);
  }
  assert.equal(presetDe("anthropic")?.protocolo, "anthropic-messages");
  assert.equal(presetDe("nada"), undefined);
  const prov = proveedorDePreset(PRESETS[0]);
  assert.equal(prov.modelo, PRESETS[0].modelos[0]);
  assert.equal(opcionesDeModelo({ ...prov, modelo: "otro", modelos: ["a", "otro"] }).join(), "otro,a");
});

test("proveedor guardado: se limpia o se descarta", () => {
  const ok = proveedorValido({ id: "p1", nombre: " Mío ", presetId: "xx", protocolo: "raro", baseUrl: "https://api.example.com/v1/", modelo: "m", modelos: ["m", "n", "", "n"] });
  assert.deepEqual(ok, { id: "p1", nombre: "Mío", presetId: null, protocolo: "openai-completions", baseUrl: "https://api.example.com/v1", modelo: "m", modelos: ["m", "n"] });
  assert.equal(proveedorValido({ id: "p1", nombre: "x", baseUrl: "http://x.com" }), null);
  assert.equal(proveedorValido({ nombre: "x", baseUrl: "https://x.com" }), null);
  assert.equal(proveedorValido(null), null);
  const lista = proveedoresValidos([{ id: "a", nombre: "A", baseUrl: "https://a.com" }, { id: "a", nombre: "B", baseUrl: "https://b.com" }, 5]);
  assert.deepEqual(lista.map((p) => p.nombre), ["A"]);
  assert.deepEqual(proveedoresValidos("no"), []);
});

test("sesiones: se reconstruyen con límites y se descartan las rotas", () => {
  assert.equal(sesionValida({ titulo: "sin id" }), null);
  const s = sesionValida({
    id: "s1",
    titulo: "T",
    creadaEn: 1,
    actualizadaEn: 5,
    turnos: [{ id: "t1", deUsuario: true, texto: "hola" }, { texto: "sin id" }, { id: "t2", llamadas: [{ nombre: "getDiary", args: "{}", resultado: "x", hecha: true }, { nombre: "" }] }],
  });
  assert.equal(s?.turnos.length, 2);
  assert.equal(s?.turnos[0].deUsuario, true);
  assert.equal(s?.turnos[1].llamadas.length, 1);
  const varias = sesionesValidas([{ id: "a", actualizadaEn: 1 }, { id: "b", actualizadaEn: 9 }, null]);
  assert.deepEqual(varias.map((x) => x.id), ["b", "a"]);
  assert.deepEqual(sesionesValidas({}), []);
});

test("ajustes: valores por defecto y recorte de las notas", () => {
  assert.deepEqual(ajustesValidos(null), AJUSTES_INICIALES);
  const a = ajustesValidos({ modoPermiso: "full", notas: "n".repeat(3000), acepto: true, proveedorActivo: "p1" });
  assert.equal(a.modoPermiso, "full");
  assert.equal(a.notas.length, 2000);
  assert.equal(a.acepto, true);
  assert.equal(ajustesValidos({ modoPermiso: "x", acepto: "si" }).acepto, false);
});

test("al guardar se acortan los resultados de las herramientas", () => {
  const s = sesionNueva("p", "m", 10);
  const t = turnoDeAsistente("m", "p", 11);
  t.llamadas.push({ id: "1", nombre: "getDiary", args: "{}", resultado: "x".repeat(20_000), hecha: true });
  s.turnos.push(turnoDeUsuario("hola", 10), t);
  const g = paraGuardar([s]);
  assert.equal(g[0].turnos[1].llamadas[0].resultado.length, 6000);
  assert.equal(s.turnos[1].llamadas[0].resultado.length, 20_000);
});

test("lista de sesiones: hoy, últimos 7 días y antes (reloj local)", () => {
  const ahora = new Date(2026, 10, 8, 15, 0);
  const a = (d: number, h = 12) => new Date(2026, 10, d, h).getTime();
  assert.equal(grupoDe(a(8, 0), ahora), "hoy");
  assert.equal(grupoDe(a(7, 23), ahora), "ultimos");
  assert.equal(grupoDe(a(2), ahora), "ultimos");
  assert.equal(grupoDe(a(1), ahora), "antes");
  const s = (id: string, t: number) => ({ ...sesionNueva("p", "m", t), id });
  const grupos = agruparSesiones([s("viejo", a(1)), s("hoy", a(8)), s("ayer", a(7))], ahora);
  assert.deepEqual(grupos.map((g) => [g.grupo, g.sesiones.map((x) => x.id)]), [["hoy", ["hoy"]], ["ultimos", ["ayer"]], ["antes", ["viejo"]]]);
});

test("título visible: el de la sesión, o el comienzo de la primera pregunta", () => {
  const s = sesionNueva("p", "m");
  assert.equal(tituloVisible(s), "Chat nuevo");
  s.turnos.push(turnoDeUsuario("[diary:4]\n¿Qué escribí   acá?"));
  assert.equal(tituloVisible(s), "¿Qué escribí acá?");
  s.turnos[0].texto = "a".repeat(100);
  assert.equal(tituloVisible(s).length, 61);
  s.titulo = "Mi título";
  assert.equal(tituloVisible(s), "Mi título");
});

test("las claves del almacén son por usuario", () => {
  assert.notEqual(claveAlmacen(1, "sesiones"), claveAlmacen(2, "sesiones"));
  assert.notEqual(claveAlmacen(1, "sesiones"), claveAlmacen(1, "claves"));
});
