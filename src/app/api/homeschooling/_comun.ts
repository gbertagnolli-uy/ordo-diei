import { z } from "zod";

export const claveFecha = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha no válida");
export const idPositivo = z.number().int().positive();
export const diasSemana = z.array(z.number().int().min(1).max(7)).min(1, "Elegí al menos un día");

export const datosPlan = z.object({
  recursoId: idPositivo,
  alumnoId: idPositivo,
  inicio: claveFecha,
  fin: claveFecha,
  diasSemana,
});
