import { test } from "node:test";
import assert from "node:assert/strict";
import { diasDelMes, leerDia, leerHora, leerIndice, leerKalendarium, leerLibro, leerMartirologio, leerMes, leerMisa } from "./lecturas.ts";
import { claveEsDeLibro, parsearAnioMes, parsearClave, parsearFecha, parsearHora, parsearTipoLibro, parsearVersion } from "./parametros.ts";
import { COLORES_LITURGICOS, infoColor } from "./colores.ts";
import type { FilaDia, FilaDocumento, RepoLiturgia } from "./repositorio.ts";
import type { Bloque, VersionLiturgica } from "./tipos.ts";

const dia = (fecha: string, version: VersionLiturgica = "1906"): FilaDia => ({
  version, fecha, titulo: `Día ${fecha}`, tituloEs: null, rango: "Duplex", lineas: [], color: "rojo", tiempo: "pentecostes", dominical: false,
});
const b = (la: string): Bloque => ({ la: [{ t: "texto", v: la }], es: null, esFalta: true });

function repoMemoria(opts: { dias?: FilaDia[]; docs?: FilaDocumento[]; bloques?: Record<string, Bloque> }): RepoLiturgia {
  const dias = opts.dias ?? [];
  const docs = opts.docs ?? [];
  return {
    async dia(v, f) { return dias.find((d) => d.version === v && d.fecha === f) ?? null; },
    async dias(v, desde, hasta) { return dias.filter((d) => d.version === v && d.fecha >= desde && d.fecha < hasta).sort((x, y) => x.fecha.localeCompare(y.fecha)); },
    async documento(v, t, c) { return docs.find((d) => d.version === v && d.tipo === t && d.clave === c) ?? null; },
    async indiceLibros(v, prefijos) {
      return docs.filter((d) => d.version === v && d.tipo === "libro" && prefijos.some((p) => d.clave.startsWith(p)))
        .sort((x, y) => x.clave.localeCompare(y.clave)).map((d) => ({ clave: d.clave, titulo: d.titulo as null, secciones: d.secciones }));
    },
    async bloques(hashes) {
      const m = new Map<string, Bloque>();
      for (const h of hashes) if (opts.bloques?.[h]) m.set(h, opts.bloques[h]);
      return m;
    },
  };
}

const laudes: FilaDocumento = {
  version: "1906", tipo: "hora", clave: "2026-10-14/Laudes", fecha: "2026-10-14",
  titulo: { titulo: "S. Callisti", rango: "Duplex", lineas: [], color: "rojo" },
  secciones: [{ clave: "incipit", tituloLa: "Incipit", tituloEs: "Comienzo", bloques: ["h1", "h-falta", "h2"] }],
};

test("leerDia: encuentra el día o responde no-generado", async () => {
  const repo = repoMemoria({ dias: [dia("2026-10-14")] });
  assert.deepEqual(await leerDia(repo, "1906", "2026-10-14"), { estado: "ok", datos: dia("2026-10-14") });
  assert.deepEqual(await leerDia(repo, "1906", "2026-10-15"), { estado: "no-generado" });
  assert.deepEqual(await leerDia(repo, "1888", "2026-10-14"), { estado: "no-generado" }); // otra versión
});

test("leerMes: solo los días del mes, ordenados; sin datos ⇒ no-generado", async () => {
  const repo = repoMemoria({ dias: [dia("2026-10-31"), dia("2026-10-01"), dia("2026-11-01"), dia("2026-09-30")] });
  const r = await leerMes(repo, "1906", 2026, 10);
  assert.equal(r.estado, "ok");
  if (r.estado === "ok") assert.deepEqual(r.datos.map((d) => d.fecha), ["2026-10-01", "2026-10-31"]);
  assert.deepEqual(await leerMes(repo, "1906", 2026, 12), { estado: "no-generado" });
});

test("diasDelMes: bisiesto y fin de año", () => {
  assert.equal(diasDelMes(2028, 2), 29);
  assert.equal(diasDelMes(2026, 2), 28);
  assert.equal(diasDelMes(2026, 12), 31);
});

test("leerMes diciembre incluye el 31 (límite exclusivo en enero del año siguiente)", async () => {
  const repo = repoMemoria({ dias: [dia("2026-12-31"), dia("2027-01-01")] });
  const r = await leerMes(repo, "1906", 2026, 12);
  assert.equal(r.estado === "ok" && r.datos.length, 1);
});

test("leerHora resuelve los hashes a bloques y omite los que faltan", async () => {
  const repo = repoMemoria({ docs: [laudes], bloques: { h1: b("Deus in adjutorium"), h2: b("Gloria Patri") } });
  const r = await leerHora(repo, "1906", "2026-10-14", "Laudes");
  assert.equal(r.estado, "ok");
  if (r.estado === "ok") {
    assert.equal(r.datos.titulo?.titulo, "S. Callisti");
    assert.equal(r.datos.secciones[0].bloques.length, 2); // h-falta no está en la base: se omite
    assert.deepEqual(r.datos.secciones[0].bloques[0].la, [{ t: "texto", v: "Deus in adjutorium" }]);
  }
  assert.deepEqual(await leerHora(repo, "1906", "2026-10-14", "Prima"), { estado: "no-generado" });
});

test("leerMisa y leerMartirologio usan sus claves (fecha completa / MM-DD)", async () => {
  const repo = repoMemoria({
    docs: [
      { ...laudes, tipo: "missa", clave: "2026-10-14" },
      { ...laudes, tipo: "martyrologium", clave: "10-14", fecha: null, titulo: null },
    ],
    bloques: { h1: b("x"), h2: b("y") },
  });
  assert.equal((await leerMisa(repo, "1906", "2026-10-14")).estado, "ok");
  assert.equal((await leerMartirologio(repo, "1906", "2027-10-14")).estado, "ok"); // otro año, mismo día
  assert.equal((await leerMartirologio(repo, "1906", "2026-10-15")).estado, "no-generado");
});

test("leerLibro rechaza claves de otro libro; leerIndice filtra por prefijo", async () => {
  const lib = (clave: string): FilaDocumento => ({ version: "1906", tipo: "libro", clave, fecha: null, titulo: null, secciones: [] });
  const repo = repoMemoria({ docs: [lib("Sancti/10-14"), lib("Missa/Sancti/10-14"), lib("Psalterium/92"), lib("Tempora/Pent21-3")] });
  assert.deepEqual(await leerLibro(repo, "1906", "psalterium", "Sancti/10-14"), { estado: "clave-invalida" });
  assert.equal((await leerLibro(repo, "1906", "proprium-sanctorum", "Sancti/10-14")).estado, "ok");
  const idx = await leerIndice(repo, "1906", "proprium-sanctorum");
  assert.equal(idx.estado === "ok" && idx.datos.map((e) => e.clave).join(","), "Missa/Sancti/10-14,Sancti/10-14");
  assert.equal(idx.estado === "ok" && idx.datos[0].titulo, "10-14"); // sin título ⇒ último tramo de la clave
  assert.deepEqual(await leerIndice(repo, "1906", "ordinarium"), { estado: "no-generado" });
});

test("leerKalendarium devuelve la lista guardada en `titulo`", async () => {
  const entradas = [{ fecha: "10-14", archivo: "Sancti/10-14", nombre: "S. Callisti", rango: 3 }];
  const repo = repoMemoria({ docs: [{ version: "1906", tipo: "kalendarium", clave: "1906", fecha: null, titulo: entradas, secciones: [] }] });
  assert.deepEqual(await leerKalendarium(repo, "1906"), { estado: "ok", datos: entradas });
  assert.deepEqual(await leerKalendarium(repo, "1570"), { estado: "no-generado" });
});

test("parsearFecha: formato y existencia", () => {
  assert.equal(parsearFecha("2026-10-14").ok, true);
  assert.equal(parsearFecha("2028-02-29").ok, true);
  assert.equal(parsearFecha("2026-02-29").ok, false);
  assert.equal(parsearFecha("2026-13-01").ok, false);
  assert.equal(parsearFecha("14/10/2026").ok, false);
  assert.equal(parsearFecha(null).ok, false);
});

test("parsearVersion: 1906 por defecto, valores válidos, resto error", () => {
  assert.deepEqual(parsearVersion(null), { ok: true, valor: "1906" });
  assert.deepEqual(parsearVersion("1570"), { ok: true, valor: "1570" });
  assert.equal(parsearVersion("1960").ok, false);
});

test("parsearAnioMes, parsearHora, parsearClave, parsearTipoLibro", () => {
  assert.deepEqual(parsearAnioMes("2026", "10"), { ok: true, valor: { anio: 2026, mes: 10 } });
  assert.equal(parsearAnioMes("2026", "13").ok, false);
  assert.equal(parsearAnioMes("abc", "1").ok, false);
  assert.equal(parsearHora("Laudes").ok, true);
  assert.equal(parsearHora("laudes").ok, false);
  assert.equal(parsearClave("Missa/Sancti/10-14").ok, true);
  assert.equal(parsearClave("../etc/passwd").ok, false);
  assert.equal(parsearClave("a;b").ok, false);
  assert.equal(parsearTipoLibro("psalterium").ok, true);
  assert.equal(parsearTipoLibro("otro").ok, false);
  assert.equal(claveEsDeLibro("ordinarium", "Missa/Ordo/Ordo"), true);
  assert.equal(claveEsDeLibro("ordinarium", "Missa/Sancti/10-14"), false);
});

test("colores: cinco colores y respaldo en blanco", () => {
  assert.equal(Object.keys(COLORES_LITURGICOS).length, 5);
  assert.equal(infoColor("rojo").hex, "#b91c1c");
  assert.equal(infoColor("morado").hex, "#6b21a8");
  assert.equal(infoColor("verde").hex, "#15803d");
  assert.equal(infoColor("raro").etiqueta, "Blanco");
  assert.equal(infoColor(null).etiqueta, "Blanco");
});
