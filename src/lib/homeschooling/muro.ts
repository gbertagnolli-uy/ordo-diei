// Propio de Ordo (lane 184, Q2): textos del muro de la familia. Puros, para probarlos sin base.
export type TipoPublicacion = "aviso" | "logro";

export const MAX_TITULO_MURO = 120;
export const MAX_CUERPO_MURO = 1000;

/** Datos de un aviso listos para guardar, o el motivo por el que no sirven */
export function validarAviso(titulo: unknown, cuerpo: unknown): { ok: true; titulo: string; cuerpo: string | null } | { ok: false; error: string } {
  const t = typeof titulo === "string" ? titulo.trim() : "";
  const c = typeof cuerpo === "string" ? cuerpo.trim() : "";
  if (!t) return { ok: false, error: "Escribí el aviso" };
  if (t.length > MAX_TITULO_MURO) return { ok: false, error: `El título puede tener hasta ${MAX_TITULO_MURO} caracteres` };
  if (c.length > MAX_CUERPO_MURO) return { ok: false, error: `El detalle puede tener hasta ${MAX_CUERPO_MURO} caracteres` };
  return { ok: true, titulo: t, cuerpo: c || null };
}

/** Frases de los logros que la app anota sola */
export const LOGROS = {
  libro: (nombre: string, libro: string) => ({ titulo: `${nombre} terminó de leer «${libro}»`, cuerpo: "Un libro más en la biblioteca de la casa." }),
  oracion: (nombre: string, texto: string) => ({ titulo: `${nombre} se sabe de memoria «${texto}»`, cuerpo: "Lo recitó bien varias veces seguidas." }),
  destacada: (nombre: string, trabajo: string) => ({ titulo: `Trabajo destacado de ${nombre}: «${trabajo}»`, cuerpo: "Mamá o papá lo eligieron para el portafolio." }),
} as const;

const COLORES_LITURGICOS: Record<string, string> = { blanco: "Blanco", rojo: "Rojo", verde: "Verde", morado: "Morado", negro: "Negro", rosa: "Rosa" };
export const colorLiturgico = (c: string) => COLORES_LITURGICOS[c] ?? c;
