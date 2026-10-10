// Esquemas zod para cartas católicas (contrato vault §5 y formulario admin)

import { z } from "zod";
import { CONFIG_RAREZAS } from "./economia.ts";

export const esquemaRareza = z.enum(["Comun", "Buena", "Perfecta", "Celestial"]);
export const esquemaCategoria = z.enum(["Santo", "Angel", "Misterio", "Tema", "Persona"]);
export const esquemaOrigen = z.enum(["Sistema", "Manual"]);

// Formato MM-DD o null para celebración litúrgica
export const regexCelebracion = /^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
export const esquemaCelebracion = z
  .string()
  .regex(regexCelebracion, "Formato debe ser MM-DD (ej: 10-04)")
  .nullable();

// Elemento individual del datasheet
export const esquemaDatoDatasheet = z.object({
  etiqueta: z.string().trim().min(1, "La etiqueta es requerida"),
  valor: z.string().trim().min(1, "El valor es requerido"),
});

export type DatoDatasheet = z.infer<typeof esquemaDatoDatasheet>;

// Imágenes por grado en el catálogo JSON (1 obligatoria, 2-4 opcionales)
export const esquemaImagenesCatalogo = z.object({
  1: z.string().min(1, "La imagen del grado 1 es requerida"),
  2: z.string().optional(),
  3: z.string().optional(),
  4: z.string().optional(),
});

// Contrato de cada carta en los archivos JSON de src/lib/cartas/catalogo/ (vault §5)
export const esquemaCartaCatalogo = z.object({
  clave: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]+$/, "La clave debe ser un slug en minúsculas (ej: san-francisco-de-asis)"),
  nombre: z.string().trim().min(1, "El nombre es requerido"),
  subtitulo: z.string().trim().optional(),
  categoria: esquemaCategoria,
  rareza: esquemaRareza,
  celebracion: esquemaCelebracion,
  historia: z.string().trim().min(10, "La historia debe tener al menos 10 caracteres"),
  oracion: z.string().trim().min(5, "La oración debe tener al menos 5 caracteres"),
  frase: z.string().trim().min(5, "La frase debe tener al menos 5 caracteres"),
  fraseAutor: z.string().trim().optional(),
  datasheet: z
    .array(esquemaDatoDatasheet)
    .min(4, "El datasheet debe tener al menos 4 datos")
    .max(8, "El datasheet no puede superar 8 datos"),
  imagenes: esquemaImagenesCatalogo,
  creditoImagen: z.string().trim().optional(),
  fragmentosRequeridos: z.number().int().positive().optional(),
});

export type CartaCatalogo = z.infer<typeof esquemaCartaCatalogo>;

// Esquema para formulario de alta / edición de carta en el panel admin (lane 36)
export const esquemaCartaAdmin = z
  .object({
    id: z.number().int().optional(),
    clave: z
      .string()
      .trim()
      .regex(/^[a-z0-9-]+$/, "La clave debe ser un slug en minúsculas (ej: san-francisco-de-asis)")
      .optional(),
    nombre: z.string().trim().min(1, "El nombre es requerido"),
    subtitulo: z.string().trim().nullable().optional(),
    categoria: esquemaCategoria,
    rareza: esquemaRareza,
    celebracion: esquemaCelebracion.optional(),
    historia: z.string().trim().min(10, "La historia debe tener al menos 10 caracteres"),
    oracion: z.string().trim().min(5, "La oración debe tener al menos 5 caracteres"),
    frase: z.string().trim().min(5, "La frase debe tener al menos 5 caracteres"),
    fraseAutor: z.string().trim().nullable().optional(),
    datasheet: z
      .array(esquemaDatoDatasheet)
      .min(4, "El datasheet debe tener al menos 4 datos")
      .max(8, "El datasheet no puede superar 8 datos"),
    imagenUrl: z.string().trim().min(1, "La imagen del Grado I es requerida"),
    imagenGrado2Url: z.string().trim().nullable().optional(),
    imagenGrado3Url: z.string().trim().nullable().optional(),
    imagenGrado4Url: z.string().trim().nullable().optional(),
    creditoImagen: z.string().trim().nullable().optional(),
    fragmentosRequeridos: z.number().int().positive().optional(),
    activa: z.boolean().default(true),
  })
  .transform((data) => {
    // Si no se especificaron fragmentosRequeridos, usar los predeterminados de la rareza
    const req = data.fragmentosRequeridos ?? CONFIG_RAREZAS[data.rareza].fragmentosRequeridos;
    return {
      ...data,
      fragmentosRequeridos: req,
    };
  });

export type CartaAdminInput = z.input<typeof esquemaCartaAdmin>;
export type CartaAdminOutput = z.infer<typeof esquemaCartaAdmin>;

/** Helper para generar clave slug a partir del nombre */
export function generarClaveSlug(nombre: string): string {
  return nombre
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remover tildes
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}
