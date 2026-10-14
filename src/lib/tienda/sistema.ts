// Productos del sistema (SPEC §3, S4): los sobres y los fragmentos de cartas. El precio y las reglas salen
// de `lib/cartas/economia.ts` (una sola fuente de verdad); la tabla solo guarda orden, visibilidad,
// requisitos extra y el historial de compras.
import { SOBRES, TIPOS_SOBRE, precioFragmentoEnPuntos, type TipoSobre } from "../cartas/economia.ts";
import type { OpcionPrecio } from "./monedas.ts";
import type { Requisito } from "./requisitos.ts";

export const CLAVE_FRAGMENTOS = "fragmentos:cartas";

export const claveSobre = (t: TipoSobre) => `sobre:${t}`;

export function sobreDeClave(clave: string | null | undefined): TipoSobre | null {
  const t = clave?.startsWith("sobre:") ? clave.slice(6) : null;
  return t && (TIPOS_SOBRE as string[]).includes(t) ? (t as TipoSobre) : null;
}

/** Forma de pago de un sobre: sus puntos y, si tiene, sus estrellas */
export function precioSobre(t: TipoSobre): OpcionPrecio {
  const c = SOBRES[t];
  return {
    costos: [
      { moneda: "puntos", monto: c.costoPuntos },
      ...(c.costoEstrellas > 0 ? [{ moneda: "estrellas" as const, monto: c.costoEstrellas }] : []),
    ],
  };
}

/** Requisito de XP que impone el sobre (además de los que sume la administración) */
export const requisitosSobre = (t: TipoSobre): Requisito[] => (SOBRES[t].xpMinimo > 0 ? [{ tipo: "xp", min: SOBRES[t].xpMinimo }] : []);

export interface DefinicionSistema {
  sistemaClave: string;
  tipo: "sobre" | "fragmentos";
  titulo: string;
  descripcion: string;
  orden: number;
}

export const PRODUCTOS_SISTEMA: DefinicionSistema[] = [
  ...TIPOS_SOBRE.map((t, i) => ({
    sistemaClave: claveSobre(t),
    tipo: "sobre" as const,
    titulo: SOBRES[t].nombre,
    descripcion: `${SOBRES[t].fragmentosTotal} fragmentos de cartas al azar.`,
    orden: i,
  })),
  {
    sistemaClave: CLAVE_FRAGMENTOS,
    tipo: "fragmentos",
    titulo: "Fragmentos de una carta",
    descripcion: "Elegí una carta y comprá justo los fragmentos que te faltan.",
    orden: 10,
  },
];

/** Precio de referencia de la tarjeta de fragmentos: «desde» el más barato */
export const precioDesdeFragmentos = (): OpcionPrecio => ({ costos: [{ moneda: "puntos", monto: precioFragmentoEnPuntos("Comun") }] });
