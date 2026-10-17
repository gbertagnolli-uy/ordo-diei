// Acceso a datos de la liturgia. `RepoLiturgia` es la frontera con la base: las lecturas
// (`lecturas.ts`) dependen de la interfaz, no de Prisma, y se prueban con un repo en memoria.
import type {
  Bloque,
  ColorLiturgico,
  Documento,
  TipoDocumento,
  TiempoLiturgico,
  TituloDia,
  VersionLiturgica,
} from "./tipos.ts";

export type FilaDia = {
  version: VersionLiturgica;
  /** `YYYY-MM-DD`. */
  fecha: string;
  titulo: string;
  tituloEs: string | null;
  rango: string;
  lineas: string[];
  color: ColorLiturgico;
  tiempo: TiempoLiturgico;
  dominical: boolean;
};

export type FilaDocumento = {
  version: VersionLiturgica;
  tipo: TipoDocumento | "kalendarium";
  clave: string;
  fecha: string | null;
  /** `TituloDia` en horas/misas; en el `kalendarium` es la lista de `EntradaKalendario`. */
  titulo: unknown;
  secciones: Documento["secciones"];
};

export interface RepoLiturgia {
  dia(version: VersionLiturgica, fecha: string): Promise<FilaDia | null>;
  /** Días con `desde <= fecha < hasta`, ordenados por fecha. */
  dias(version: VersionLiturgica, desde: string, hastaExclusivo: string): Promise<FilaDia[]>;
  documento(version: VersionLiturgica, tipo: FilaDocumento["tipo"], clave: string): Promise<FilaDocumento | null>;
  /** Claves (y títulos) de los documentos "libro" cuyo `Clave` empieza con alguno de los prefijos. */
  indiceLibros(version: VersionLiturgica, prefijos: string[]): Promise<{ clave: string; titulo: TituloDia | null; secciones: Documento["secciones"] }[]>;
  bloques(hashes: string[]): Promise<Map<string, Bloque>>;
}

const aISO = (d: Date) => d.toISOString().slice(0, 10);
const aFechaDB = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

type DiaPrisma = {
  version: string; fecha: Date; titulo: string; tituloEs: string | null; rango: string;
  lineas: unknown; color: string; tiempo: string; dominical: boolean;
};

function filaDia(r: DiaPrisma): FilaDia {
  return {
    version: r.version as VersionLiturgica,
    fecha: aISO(r.fecha),
    titulo: r.titulo,
    tituloEs: r.tituloEs,
    rango: r.rango,
    lineas: Array.isArray(r.lineas) ? (r.lineas as string[]) : [],
    color: r.color as ColorLiturgico,
    tiempo: r.tiempo as TiempoLiturgico,
    dominical: r.dominical,
  };
}

/** Implementación real. Se importa Prisma a demanda para que los tests no abran conexiones. */
export async function repoPrisma(): Promise<RepoLiturgia> {
  const { default: prisma } = await import("../prisma.ts");
  const aFila = (r: {
    version: string; tipo: string; clave: string; fecha: Date | null; titulo: unknown; secciones: unknown;
  }): FilaDocumento => ({
    version: r.version as VersionLiturgica,
    tipo: r.tipo as FilaDocumento["tipo"],
    clave: r.clave,
    fecha: r.fecha ? aISO(r.fecha) : null,
    titulo: r.titulo ?? null,
    secciones: (r.secciones as Documento["secciones"]) ?? [],
  });
  return {
    async dia(version, fecha) {
      const r = await prisma.diaLiturgico.findUnique({ where: { version_fecha: { version, fecha: aFechaDB(fecha) } } });
      return r ? filaDia(r) : null;
    },
    async dias(version, desde, hastaExclusivo) {
      const rs = await prisma.diaLiturgico.findMany({
        where: { version, fecha: { gte: aFechaDB(desde), lt: aFechaDB(hastaExclusivo) } },
        orderBy: { fecha: "asc" },
      });
      return rs.map(filaDia);
    },
    async documento(version, tipo, clave) {
      const r = await prisma.documentoLiturgico.findUnique({ where: { version_tipo_clave: { version, tipo, clave } } });
      return r ? aFila(r) : null;
    },
    async indiceLibros(version, prefijos) {
      const rs = await prisma.documentoLiturgico.findMany({
        where: { version, tipo: "libro", OR: prefijos.map((p) => ({ clave: { startsWith: p } })) },
        select: { clave: true, titulo: true, secciones: true },
        orderBy: { clave: "asc" },
      });
      return rs.map((r) => ({
        clave: r.clave,
        titulo: (r.titulo as TituloDia | null) ?? null,
        secciones: (r.secciones as Documento["secciones"]) ?? [],
      }));
    },
    async bloques(hashes) {
      const mapa = new Map<string, Bloque>();
      const unicos = [...new Set(hashes)];
      // Lotes: una hora trae ~100–300 bloques; un libro grande, más. Evita parámetros de más.
      for (let i = 0; i < unicos.length; i += 500) {
        const rs = await prisma.bloqueLiturgico.findMany({ where: { hash: { in: unicos.slice(i, i + 500) } } });
        for (const r of rs) mapa.set(r.hash, r.datos as unknown as Bloque);
      }
      return mapa;
    },
  };
}
