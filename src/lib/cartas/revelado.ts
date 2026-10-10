// Revelación progresiva del contenido de cartas católicas según % de fragmentos (D13)

import type { CategoriaCarta, GradoCarta, RarezaCarta } from "./economia.ts";
import { gradoDe, imagenDeGrado, type CartaConImagenes } from "./fragmentos.ts";
import { TEXTOS_CARTAS } from "./textos.ts";

export interface DatoDatasheetCompleto {
  etiqueta: string;
  valor: string;
}

export interface CartaCompletaEntrada extends CartaConImagenes {
  id?: number;
  clave: string;
  nombre: string;
  subtitulo?: string | null;
  categoria: CategoriaCarta;
  rareza: RarezaCarta;
  celebracion?: string | null; // "MM-DD" o null
  historia: string;
  oracion: string;
  frase: string;
  fraseAutor?: string | null;
  datasheet: DatoDatasheetCompleto[];
  fragmentosRequeridos: number;
  creditoImagen?: string | null;
  activa?: boolean;
}

export interface DatoDatasheetVisible {
  etiqueta: string;
  valor: string; // Valor real si está visible, o "???" si está bloqueado
  visible: boolean;
  pista?: string;
  porcentajeRequerido?: number;
}

export interface CampoTextoVisible {
  valor: string; // Texto real si está visible, o "???" si está bloqueado
  visible: boolean;
  pista?: string;
  porcentajeRequerido?: number;
  autor?: string | null;
}

export interface ContenidoCartaVisible {
  id?: number;
  clave: string;
  nombre: string;
  subtitulo?: string | null;
  categoria: CategoriaCarta;
  rareza: RarezaCarta;
  celebracion: string | null;

  fragmentos: number;
  fragmentosRequeridos: number;
  porcentaje: number; // Porcentaje entero (puede superar 100)
  desbloqueada: boolean;
  grado: GradoCarta;

  // Imagen del grado actual según D19 (nunca URLs de grados superiores)
  imagenUrl: string;
  creditoImagen?: string | null;

  // Campos con revelación progresiva (D13)
  historia: CampoTextoVisible;
  oracion: CampoTextoVisible;
  frase: CampoTextoVisible;
  datasheet: DatoDatasheetVisible[];
}

/**
 * Calcula el umbral en porcentaje necesario para desbloquear el elemento k (índice 0-based)
 * de un datasheet con N elementos totales.
 */
export function calcularHitoDatasheet(indice: number, totalDatos: number): number {
  if (totalDatos <= 1) return 25;
  if (indice === 0) return 25; // El primer dato se desbloquea al 25%
  if (indice >= totalDatos - 1) return 100; // El último dato se desbloquea al 100%

  // Para elementos intermedios: ceil(N * (p - 0.25) / 0.75) >= indice + 1
  // p >= 0.25 + (0.75 * indice) / totalDatos
  const pMin = 0.25 + (0.75 * indice) / totalDatos;
  return Math.min(99, Math.max(26, Math.ceil(pMin * 100)));
}

/**
 * Calcula cuántos datos del datasheet son visibles según la fórmula D13:
 * Con N datos:
 * - p < 25 % → 0
 * - 25 % ≤ p < 100 % → clamp(ceil(N × (p − 25 %) / 75 %), 1, N − 1)
 * - p ≥ 100 % → N
 */
export function contarDatosVisiblesDatasheet(p: number, totalDatos: number): number {
  if (totalDatos <= 0) return 0;
  if (p < 0.25) return 0;
  if (p >= 1.0) return totalDatos;

  const raw = Math.ceil((totalDatos * (p - 0.25)) / 0.75);
  return Math.max(1, Math.min(totalDatos - 1, raw));
}

/**
 * Función PURA que redacta el contenido de una carta para la API (D13, D19).
 * SEGURIDAD: Nunca incluye en el objeto retornado texto oculto que el usuario
 * todavía no haya desbloqueado (historia, oración, frase, valores bloqueados del datasheet,
 * ni imágenes de grados superiores).
 */
export function contenidoVisible(
  carta: CartaCompletaEntrada,
  fragmentos: number
): ContenidoCartaVisible {
  const req = carta.fragmentosRequeridos;
  const p = req > 0 ? fragmentos / req : 0;
  const porcentaje = req > 0 ? Math.floor(p * 100) : 0;
  const desbloqueada = p >= 1.0;
  const grado = gradoDe(fragmentos, req);

  // 1. Oración: > 0% de fragmentos (p > 0)
  const oracionVisible = p > 0;
  const oracion: CampoTextoVisible = oracionVisible
    ? {
        valor: carta.oracion,
        visible: true,
      }
    : {
        valor: TEXTOS_CARTAS.pistas.bloqueada,
        visible: false,
        pista: TEXTOS_CARTAS.pistas.oracion,
        porcentajeRequerido: 1,
      };

  // 2. Frase: >= 25% de fragmentos (p >= 0.25)
  const fraseVisible = p >= 0.25;
  const frase: CampoTextoVisible = fraseVisible
    ? {
        valor: carta.frase,
        visible: true,
        autor: carta.fraseAutor ?? null,
      }
    : {
        valor: TEXTOS_CARTAS.pistas.bloqueada,
        visible: false,
        pista: TEXTOS_CARTAS.pistas.frase,
        porcentajeRequerido: 25,
      };

  // 3. Historia: >= 100% de fragmentos (p >= 1.0)
  const historiaVisible = p >= 1.0;
  const historia: CampoTextoVisible = historiaVisible
    ? {
        valor: carta.historia,
        visible: true,
      }
    : {
        valor: TEXTOS_CARTAS.pistas.bloqueada,
        visible: false,
        pista: TEXTOS_CARTAS.pistas.historia,
        porcentajeRequerido: 100,
      };

  // 4. Datasheet: progresivo entre 25% y 100%
  const totalDatos = carta.datasheet.length;
  const datosVisiblesCount = contarDatosVisiblesDatasheet(p, totalDatos);

  const datasheet: DatoDatasheetVisible[] = carta.datasheet.map((dato, index) => {
    if (index < datosVisiblesCount) {
      return {
        etiqueta: dato.etiqueta,
        valor: dato.valor,
        visible: true,
      };
    } else {
      const hito = calcularHitoDatasheet(index, totalDatos);
      return {
        etiqueta: dato.etiqueta,
        valor: TEXTOS_CARTAS.pistas.bloqueada,
        visible: false,
        pista: TEXTOS_CARTAS.pistas.datasheetHito(hito),
        porcentajeRequerido: hito,
      };
    }
  });

  // 5. Imagen del grado actual (D19)
  const imagenUrl = imagenDeGrado(carta, grado);

  return {
    id: carta.id,
    clave: carta.clave,
    nombre: carta.nombre,
    subtitulo: carta.subtitulo ?? null,
    categoria: carta.categoria,
    rareza: carta.rareza,
    celebracion: carta.celebracion ?? null,
    fragmentos,
    fragmentosRequeridos: req,
    porcentaje,
    desbloqueada,
    grado,
    imagenUrl,
    creditoImagen: carta.creditoImagen ?? null,
    historia,
    oracion,
    frase,
    datasheet,
  };
}
