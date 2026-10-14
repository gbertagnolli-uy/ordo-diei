// Implementación Prisma de RepoReposo (la lógica vive en unsplash.ts y se prueba con un repo en memoria).
import prisma from "@/lib/prisma";
import { CONFIG_POR_DEFECTO } from "./unsplash";
import type { ConfigReposo, FotoPool, Orientacion, RepoReposo } from "./unsplash";

const aConfig = (r: {
  segundosLogin: number; segundosSesion: number; unsplashTema: string; unsplashConsulta: string | null;
  tamPool: number; mostrarRefCatecismo: boolean; ultimaSincronia: Date | null;
}): ConfigReposo => ({
  segundosLogin: r.segundosLogin,
  segundosSesion: r.segundosSesion,
  unsplashTema: r.unsplashTema,
  unsplashConsulta: r.unsplashConsulta,
  tamPool: r.tamPool,
  mostrarRefCatecismo: r.mostrarRefCatecismo,
  ultimaSincronia: r.ultimaSincronia,
});

export const repoReposo: RepoReposo = {
  async config() {
    const fila = await prisma.configReposo.upsert({ where: { id: 1 }, create: { id: 1 }, update: {} });
    return aConfig(fila);
  },
  async guardarConfig(cambios) {
    const fila = await prisma.configReposo.upsert({ where: { id: 1 }, create: { id: 1, ...cambios }, update: cambios });
    return aConfig(fila);
  },
  async idsExistentes() {
    const filas = await prisma.fotoUnsplash.findMany({ select: { id: true } });
    return new Set(filas.map((f) => f.id));
  },
  async crearFotos(fotos: FotoPool[]) {
    await prisma.fotoUnsplash.createMany({ data: fotos, skipDuplicates: true });
  },
  async pendientesDeAviso() {
    const filas = await prisma.fotoUnsplash.findMany({
      where: { descargaAvisada: false, oculta: false },
      select: { id: true },
      orderBy: { createdAt: "asc" },
    });
    return filas.map((f) => f.id);
  },
  async marcarAvisada(id) {
    await prisma.fotoUnsplash.update({ where: { id }, data: { descargaAvisada: true } });
  },
  async activasPorAntiguedad() {
    return prisma.fotoUnsplash.findMany({
      where: { activa: true, oculta: false },
      select: { id: true },
      orderBy: { createdAt: "asc" },
    });
  },
  async desactivar(ids) {
    await prisma.fotoUnsplash.updateMany({ where: { id: { in: ids } }, data: { activa: false } });
  },
};

export const configPorDefecto = CONFIG_POR_DEFECTO;

/** Fotos visibles en el reposo (activas y no ocultas), opcionalmente de una orientación. */
export async function fotosVisibles(orientacion?: Orientacion) {
  return prisma.fotoUnsplash.findMany({
    where: { activa: true, oculta: false, ...(orientacion ? { orientacion } : {}) },
    orderBy: { createdAt: "desc" },
  });
}

export async function estadoPool() {
  const [activas, ocultas, total, sinAvisar] = await Promise.all([
    prisma.fotoUnsplash.count({ where: { activa: true, oculta: false } }),
    prisma.fotoUnsplash.count({ where: { oculta: true } }),
    prisma.fotoUnsplash.count(),
    prisma.fotoUnsplash.count({ where: { descargaAvisada: false, oculta: false } }),
  ]);
  return { activas, ocultas, total, sinAvisar };
}

export async function listarPool() {
  return prisma.fotoUnsplash.findMany({ orderBy: [{ oculta: "asc" }, { createdAt: "desc" }] });
}

export async function ocultarFoto(id: string, oculta: boolean) {
  // Oculta ⇒ sale del reposo y no vuelve a entrar; mostrar la reactiva
  return prisma.fotoUnsplash.update({ where: { id }, data: { oculta, activa: !oculta } });
}
