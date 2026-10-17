// Validación (zod) de lo que los padres cargan al crear un producto (SPEC §4–§7)
import { z } from "zod";
import { CLAVES_MONEDA } from "./monedas.ts";

const monto = z.number().int("El monto debe ser entero").min(1, "El monto mínimo es 1").max(1_000_000, "Monto demasiado alto");

export const CostoSchema = z.object({
  moneda: z.enum(CLAVES_MONEDA as [string, ...string[]]),
  monto,
});

export const OpcionPrecioSchema = z
  .object({ costos: z.array(CostoSchema).min(1, "Cada forma de pago necesita al menos una moneda").max(4) })
  .refine((o) => new Set(o.costos.map((c) => c.moneda)).size === o.costos.length, {
    message: "No repitas una moneda dentro de la misma forma de pago",
  });

export const PreciosSchema = z.array(OpcionPrecioSchema).min(1, "Agregá al menos una forma de pago").max(6);

export const RequisitoSchema = z.discriminatedUnion("tipo", [
  z.object({ tipo: z.literal("nivel"), min: z.number().int().min(2).max(99) }),
  z.object({ tipo: z.literal("xp"), min: z.number().int().min(1).max(10_000_000) }),
  z.object({ tipo: z.literal("racha"), dias: z.number().int().min(1).max(3650) }),
  z.object({ tipo: z.literal("carta"), cartaId: z.number().int().positive(), gradoMin: z.number().int().min(1).max(4).default(1) }),
  z.object({ tipo: z.literal("coleccion"), cantidad: z.number().int().min(1).max(1000) }),
  z.object({ tipo: z.literal("tareas"), cantidad: z.number().int().min(1).max(100_000) }),
  z.object({ tipo: z.literal("compraPrevia"), productoId: z.number().int().positive() }),
  z.object({ tipo: z.literal("rol"), roles: z.array(z.string().min(1)).min(1) }),
  z.object({ tipo: z.literal("padre") }),
]);

export const RequisitosSchema = z.array(RequisitoSchema).max(8);

export const CATEGORIAS = ["premios", "vales", "cartas"] as const;

export const ProductoEntradaSchema = z.object({
  tipo: z.enum(["fisico", "vale"]),
  titulo: z.string().trim().min(2, "Poné un título").max(80),
  descripcion: z.string().trim().max(400).optional().nullable(),
  imagenClave: z.string().trim().max(80).optional().nullable(),
  categoria: z.enum(CATEGORIAS).default("premios"),
  precios: PreciosSchema,
  requisitos: RequisitosSchema.default([]),
  stockTotal: z.number().int().min(1).max(10_000).optional().nullable(),
  limiteUsuario: z.number().int().min(1).max(1000).optional().nullable(),
  periodoLimite: z.enum(["siempre", "dia", "semana", "mes"]).default("siempre"),
  disponibleDesde: z.string().datetime().optional().nullable(),
  disponibleHasta: z.string().datetime().optional().nullable(),
  destinatarios: z.array(z.number().int().positive()).optional().nullable(),
  requiereAprobacion: z.boolean().default(false),
  descuentoRacha: z.boolean().default(false),
  destacado: z.boolean().default(false),
  activo: z.boolean().default(true),
});

export type ProductoEntrada = z.infer<typeof ProductoEntradaSchema>;
