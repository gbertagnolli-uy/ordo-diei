// Propio de Ordo (lane 188, E7): las fiestas y domingos del año litúrgico para marcar en el calendario del plan. Lee la tabla de
// días litúrgicos (rito de 1906, el de la casa); si todavía no hay datos para esas fechas, devuelve una lista vacía.
import prisma from "../../prisma.ts";
import { aClave, aFecha } from "../../habitos/server.ts";
import { aFestividades, type Festividad } from "../festividades.ts";
import { sumarDias } from "../semana.ts";

export async function festividadesAlrededor(hoy: string, diasAtras = 120, diasAdelante = 400, version = "1906"): Promise<Festividad[]> {
  const filas = await prisma.diaLiturgico
    .findMany({
      where: { version, fecha: { gte: aFecha(sumarDias(hoy, -diasAtras)), lte: aFecha(sumarDias(hoy, diasAdelante)) } },
      select: { fecha: true, titulo: true, tituloEs: true, rango: true, color: true, dominical: true },
      orderBy: { fecha: "asc" },
    })
    .catch(() => []);
  return aFestividades(filas.map((f) => ({ ...f, fecha: aClave(f.fecha) })));
}
