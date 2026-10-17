// Validación de la configuración del reposo (panel de administración, SPEC §5.5).
import { z } from "zod";

export const cambiosConfigSchema = z
  .object({
    segundosLogin: z.number().int().min(10, "Mínimo 10 segundos").max(300, "Máximo 300 segundos"),
    segundosSesion: z.number().int().min(10, "Mínimo 10 segundos").max(300, "Máximo 300 segundos"),
    unsplashConsulta: z.string().trim().max(100, "Máximo 100 caracteres").nullable(),
    tamPool: z.number().int().min(20, "Mínimo 20 fotos").max(500, "Máximo 500 fotos"),
    mostrarRefCatecismo: z.boolean(),
  })
  .partial()
  .strict();

export type CambiosConfig = z.infer<typeof cambiosConfigSchema>;

/** Una consulta vacía equivale a «sin consulta propia» (vuelve al tema Nature). */
export function normalizarCambios(c: CambiosConfig): CambiosConfig {
  if (c.unsplashConsulta !== undefined && c.unsplashConsulta !== null && c.unsplashConsulta.trim() === "") {
    return { ...c, unsplashConsulta: null };
  }
  return c;
}
