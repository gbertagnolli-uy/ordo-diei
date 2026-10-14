// Requisitos de desbloqueo de un producto (SPEC §6). Función pura: se evalúa en la tienda (para
// mostrar el candado y el progreso) y otra vez en el servidor al comprar.
import type { z } from "zod";
import type { RequisitoSchema } from "./esquemas.ts";

export type Requisito = z.infer<typeof RequisitoSchema>;

/** Todo lo que se necesita saber de la persona, cargado una sola vez por pantalla */
export interface ContextoRequisitos {
  nivel: number;
  xp: number;
  racha: number;
  tareasCompletadas: number;
  rol: string;
  /** cartaId → grado de veneración alcanzado (0 = bloqueada) */
  gradoPorCarta: Map<number, number>;
  productosComprados: Set<number>;
  desbloqueadoPorPadre: boolean;
  /** cartaId → nombre, solo para armar el texto */
  nombreCarta?: Map<number, string>;
  nombreProducto?: Map<number, string>;
}

export interface RequisitoEvaluado {
  requisito: Requisito;
  cumplido: boolean;
  actual: number;
  objetivo: number;
  /** Lo que se le muestra a la persona: «Nivel 7» */
  texto: string;
}

const GRADOS = ["", "I", "II", "III", "IV"];

export function evaluarRequisito(r: Requisito, ctx: ContextoRequisitos): RequisitoEvaluado {
  const num = (actual: number, objetivo: number, texto: string): RequisitoEvaluado => ({
    requisito: r,
    cumplido: actual >= objetivo,
    actual: Math.min(actual, objetivo),
    objetivo,
    texto,
  });
  switch (r.tipo) {
    case "nivel":
      return num(ctx.nivel, r.min, `Nivel ${r.min}`);
    case "xp":
      return num(ctx.xp, r.min, `${r.min} XP`);
    case "racha":
      return num(ctx.racha, r.dias, `Racha de ${r.dias} ${r.dias === 1 ? "día" : "días"}`);
    case "tareas":
      return num(ctx.tareasCompletadas, r.cantidad, `Completar ${r.cantidad} tareas`);
    case "coleccion": {
      const tiene = [...ctx.gradoPorCarta.values()].filter((g) => g >= 1).length;
      return num(tiene, r.cantidad, `Tener ${r.cantidad} cartas consagradas`);
    }
    case "carta": {
      const grado = ctx.gradoPorCarta.get(r.cartaId) ?? 0;
      const nombre = ctx.nombreCarta?.get(r.cartaId) ?? "una carta";
      const sufijo = r.gradoMin > 1 ? ` (Grado ${GRADOS[r.gradoMin]})` : "";
      return num(grado, r.gradoMin, `Consagrar ${nombre}${sufijo}`);
    }
    case "compraPrevia": {
      const nombre = ctx.nombreProducto?.get(r.productoId) ?? "otro producto";
      return num(ctx.productosComprados.has(r.productoId) ? 1 : 0, 1, `Comprar antes: ${nombre}`);
    }
    case "rol":
      return {
        requisito: r,
        cumplido: r.roles.includes(ctx.rol),
        actual: r.roles.includes(ctx.rol) ? 1 : 0,
        objetivo: 1,
        texto: `Solo para: ${r.roles.join(", ")}`,
      };
    case "padre":
      return {
        requisito: r,
        cumplido: ctx.desbloqueadoPorPadre,
        actual: ctx.desbloqueadoPorPadre ? 1 : 0,
        objetivo: 1,
        texto: "Pedile a tus padres que lo desbloqueen",
      };
  }
}

export const evaluarRequisitos = (rs: Requisito[], ctx: ContextoRequisitos): RequisitoEvaluado[] =>
  rs.map((r) => evaluarRequisito(r, ctx));

export const todosCumplidos = (evaluados: RequisitoEvaluado[]) => evaluados.every((e) => e.cumplido);
