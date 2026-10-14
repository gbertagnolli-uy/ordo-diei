// Documentos que DO no exporta como archivo de libro y se arman con lo ya cargado (revisión de la lane lane-147):
//   · Missa/Ordo/Ordo        → las partes fijas (no propias) de la Misa de un domingo de referencia (DO escribe el
//                              Ordo con «# Sección» y condicionales que `setupstring` no resuelve; la Misa completa sí).
//   · Psalterium/{Benedictus,Magnificat,NuncDimittis} → el cántico de Laudes, Vísperas y Completas del mismo domingo.
//   · Kalendarium con `rangoTexto`: el rango numérico de Tabulae/Kalendaria es el de 1570 (no refleja 1906); el rango
//                              real está en la sección `rank` del archivo Sancti de cada día.
// Escribe SOLO en Documentos_Liturgicos (upsert). Uso: node scripts/liturgia/derivados.ts [--version 1906,1888,1570] [--ensayo]
import prisma from "../../src/lib/prisma.ts";
import { VERSIONES, type VersionLiturgica } from "../../src/lib/liturgia/tipos.ts";

export const FECHA_REFERENCIA = "2026-10-18"; // domingo con Gloria y Credo

type Sec = { clave: string; tituloLa: string; tituloEs: string | null; bloques: string[]; propio?: boolean };

const CANTICOS: { clave: string; hora: string; seccion: string; la: string; es: string }[] = [
  { clave: "Psalterium/Benedictus", hora: "Laudes", seccion: "canticum-benedictus", la: "Canticum Zachariæ: Benedictus", es: "Cántico de Zacarías (Benedictus)" },
  { clave: "Psalterium/Magnificat", hora: "Vespera", seccion: "canticum-magnificat", la: "Canticum B. Mariæ Virginis: Magnificat", es: "Cántico de la Virgen María (Magnificat)" },
  { clave: "Psalterium/NuncDimittis", hora: "Completorium", seccion: "canticum-nunc-dimittis", la: "Canticum Simeonis: Nunc dimittis", es: "Cántico de Simeón (Nunc dimittis)" },
];

/** «S. Callisti Papæ et Martyris · Duplex · vide C2b» → «Duplex». */
export function rangoDeSeccionRank(textoLatin: string): string | null {
  const partes = textoLatin.split(" · ").map((p) => p.trim());
  const r = partes[1];
  return r && /simplex|duplex|semiduplex|commemoratio|classis|vigilia|feria|dominica|octava/i.test(r) ? r : null;
}

async function main() {
  const ensayo = process.argv.includes("--ensayo");
  const i = process.argv.indexOf("--version");
  const versiones = (i >= 0 ? process.argv[i + 1].split(",") : [...VERSIONES]) as VersionLiturgica[];
  for (const version of versiones) {
    const doc = (tipo: string, clave: string) =>
      prisma.documentoLiturgico.findUnique({ where: { version_tipo_clave: { version, tipo, clave } } });
    const guardar = async (tipo: string, clave: string, secciones: Sec[], titulo: unknown = null) => {
      if (ensayo) return;
      await prisma.documentoLiturgico.upsert({
        where: { version_tipo_clave: { version, tipo, clave } },
        create: { version, tipo, clave, titulo: titulo as never, secciones: secciones as never },
        update: { titulo: titulo as never, secciones: secciones as never },
      });
    };

    const misa = await doc("missa", FECHA_REFERENCIA);
    if (!misa) throw new Error(`Falta la Misa ${version} ${FECHA_REFERENCIA}`);
    const fijas = (misa.secciones as Sec[]).filter((s) => !s.propio);
    await guardar("libro", "Missa/Ordo/Ordo", fijas);
    console.log(`${version} · Missa/Ordo/Ordo: ${fijas.length} secciones (${fijas.map((s) => s.clave).join(" ")})`);

    for (const c of CANTICOS) {
      const hora = await doc("hora", `${FECHA_REFERENCIA}/${c.hora}`);
      const sec = (hora?.secciones as Sec[] | undefined)?.find((s) => s.clave === c.seccion);
      if (!sec) throw new Error(`Falta ${c.seccion} en ${c.hora} ${version}`);
      await guardar("libro", c.clave, [{ ...sec, clave: "canticum", tituloLa: c.la, tituloEs: c.es }]);
      console.log(`${version} · ${c.clave}: ${sec.bloques.length} bloques`);
    }

    // Kalendarium con el rango real
    const kal = await doc("kalendarium", version);
    const entradas = (kal?.titulo ?? []) as { archivo: string; rango: number; rangoTexto?: string }[];
    const sancti = await prisma.documentoLiturgico.findMany({
      where: { version, tipo: "libro", clave: { startsWith: "Sancti/" } },
      select: { clave: true, secciones: true },
    });
    const porClave = new Map(sancti.map((d) => [d.clave, d.secciones as Sec[]]));
    const hashes = new Set<string>();
    const rankDe = new Map<string, string>();
    for (const [clave, secs] of porClave) {
      const r = secs.find((s) => s.clave === "rank");
      if (r?.bloques[0]) {
        hashes.add(r.bloques[0]);
        rankDe.set(clave, r.bloques[0]);
      }
    }
    const bloques = await prisma.bloqueLiturgico.findMany({ where: { hash: { in: [...hashes] } } });
    const textoDe = new Map(bloques.map((b) => [b.hash, ((b.datos as { la: { v?: string }[] }).la[0]?.v ?? "") as string]));
    let con = 0;
    for (const e of entradas) {
      const h = rankDe.get(e.archivo);
      const t = h ? rangoDeSeccionRank(textoDe.get(h) ?? "") : null;
      if (t) {
        e.rangoTexto = t;
        con++;
      }
    }
    if (kal && !ensayo) await guardar("kalendarium", version, [], entradas);
    console.log(`${version} · Kalendarium: ${con}/${entradas.length} con rango real`);
  }
  await prisma.$disconnect();
}

if (process.argv[1]?.endsWith("liturgia/derivados.ts")) main().catch((e) => { console.error(e); process.exit(1); });
