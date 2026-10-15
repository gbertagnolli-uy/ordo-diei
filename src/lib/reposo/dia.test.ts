import { test } from "node:test";
import assert from "node:assert/strict";
import { consultarDiaReposo, fechaHoyEnTz } from "./dia.ts";
import type { FilaDia, RepoLiturgia } from "../liturgia/repositorio.ts";

function repoMemoria(dias: FilaDia[] = []): RepoLiturgia {
  return {
    async dia(v, f) {
      return dias.find((d) => d.version === v && d.fecha === f) ?? null;
    },
    async dias(v, desde, hasta) {
      return dias.filter((d) => d.version === v && d.fecha >= desde && d.fecha < hasta);
    },
    async documento() {
      return null;
    },
    async indiceLibros() {
      return [];
    },
    async bloques() {
      return new Map();
    },
  };
}

test("fechaHoyEnTz devuelve formato YYYY-MM-DD", () => {
  const hoy = fechaHoyEnTz(new Date(1760460000000), "America/Montevideo");
  assert.match(hoy, /^\d{4}-\d{2}-\d{2}$/);
});

test("consultarDiaReposo devuelve null si no hay datos del día (SPEC §4.6)", async () => {
  const repo = repoMemoria([]);
  const res = await consultarDiaReposo(repo, "2026-10-14");
  assert.equal(res, null);
});

test("consultarDiaReposo mapea los campos litúrgicos de 1906 (SPEC §5.4, §8 criterio 8)", async () => {
  const diaFixture: FilaDia = {
    version: "1906",
    fecha: "2026-10-14",
    titulo: "S. Callisti Papæ et Martyris",
    tituloEs: "S. Calixto, Papa y Mártir",
    rango: "Duplex",
    lineas: ["Tempora: Feria Quarta infra Hebdomadam XX post Octavam Pentecostes II. Octobris"],
    color: "rojo",
    tiempo: "pentecostes",
    dominical: false,
  };

  const repo = repoMemoria([diaFixture]);
  const res = await consultarDiaReposo(repo, "2026-10-14");

  assert.ok(res);
  assert.equal(res.version, "1906");
  assert.equal(res.titulo, "S. Callisti Papæ et Martyris");
  assert.equal(res.rango, "Duplex");
  assert.deepEqual(res.lineas, [
    "Tempora: Feria Quarta infra Hebdomadam XX post Octavam Pentecostes II. Octobris",
  ]);
  assert.equal(res.color, "rojo");
  assert.equal(res.tiempo, "pentecostes");
});

test("consultarDiaReposo ignora datos de otras versiones distintas a 1906", async () => {
  const dia1888: FilaDia = {
    version: "1888",
    fecha: "2026-10-14",
    titulo: "San Callisto",
    tituloEs: null,
    rango: "Semiduplex",
    lineas: [],
    color: "rojo",
    tiempo: "pentecostes",
    dominical: false,
  };

  const repo = repoMemoria([dia1888]);
  const res = await consultarDiaReposo(repo, "2026-10-14");
  assert.equal(res, null);
});
