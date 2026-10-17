// Accesorios del compañero (vault/COMPANERO_HEROE.md, lane 220): catálogo y reglas puras.
// Son «de escena»: un fondo y objetos que se apoyan al lado, así una sola imagen sirve para los 6 personajes.
// En esta versión son solo cosméticos (no dan ventajas ni tocan la economía de la app).
// Imágenes: public/companeros/fondos/<clave>.webp y public/companeros/objetos/<clave>.webp.
import { MONEDAS, textoCostos, type Costo } from "../tienda/monedas.ts";
import { ranurasDeObjetos } from "./companero.ts";

export type Rareza = "comun" | "raro" | "epico" | "legendario";
export const RAREZAS: Record<Rareza, { nombre: string }> = {
  comun: { nombre: "Común" },
  raro: { nombre: "Raro" },
  epico: { nombre: "Épico" },
  legendario: { nombre: "Legendario" },
};

export type Accesorio = {
  clave: string;
  tipo: "fondo" | "objeto";
  nombre: string;
  descripcion: string;
  rareza: Rareza;
  /** Nivel mínimo para comprarlo */
  nivel: number;
  /** Lo que cuesta; vacío = viene de regalo */
  costos: Costo[];
  emoji: string;
};

export const ACCESORIOS: Accesorio[] = [
  { clave: "capilla", tipo: "fondo", nombre: "Capilla", descripcion: "Una capilla sencilla, con la luz de los vitrales.", rareza: "comun", nivel: 1, costos: [], emoji: "⛪" },
  { clave: "jardin", tipo: "fondo", nombre: "Jardín", descripcion: "El jardín de casa en una mañana de sol.", rareza: "comun", nivel: 2, costos: [{ moneda: "puntos", monto: 50 }], emoji: "🌳" },
  { clave: "hogar", tipo: "fondo", nombre: "Hogar", descripcion: "La sala de casa, con la mesa puesta.", rareza: "comun", nivel: 3, costos: [{ moneda: "puntos", monto: 50 }], emoji: "🏠" },
  { clave: "noche", tipo: "fondo", nombre: "Noche estrellada", descripcion: "Un cielo lleno de estrellas y la luna sobre los montes.", rareza: "raro", nivel: 5, costos: [{ moneda: "puntos", monto: 150 }], emoji: "🌙" },
  { clave: "veladora", tipo: "objeto", nombre: "Veladora", descripcion: "Una vela encendida que acompaña la oración.", rareza: "comun", nivel: 1, costos: [], emoji: "🕯️" },
  { clave: "maceta", tipo: "objeto", nombre: "Maceta con flores", descripcion: "Flores frescas para alegrar el rincón.", rareza: "comun", nivel: 2, costos: [{ moneda: "puntos", monto: 40 }], emoji: "🪴" },
  { clave: "libros", tipo: "objeto", nombre: "Pila de libros", descripcion: "Buenas lecturas siempre a mano.", rareza: "comun", nivel: 3, costos: [{ moneda: "puntos", monto: 40 }], emoji: "📚" },
  { clave: "banderin", tipo: "objeto", nombre: "Banderín de la cruz", descripcion: "Un banderín para las fiestas de la familia.", rareza: "raro", nivel: 4, costos: [{ moneda: "puntos", monto: 100 }], emoji: "🚩" },
  { clave: "rosario", tipo: "objeto", nombre: "Rosario de madera", descripcion: "Colgado del gancho, listo para rezar.", rareza: "epico", nivel: 6, costos: [{ moneda: "incienso", monto: 3 }], emoji: "📿" },
  { clave: "virgen", tipo: "objeto", nombre: "Imagen de la Virgen", descripcion: "Nuestra Madre cuida el rincón de tu compañero.", rareza: "legendario", nivel: 9, costos: [{ moneda: "incienso", monto: 8 }], emoji: "🙏" },
];

export const accesorioDe = (clave: string) => ACCESORIOS.find((a) => a.clave === clave) ?? null;
export const esDeRegalo = (a: Accesorio) => a.costos.length === 0;
export const RUTA_IMAGEN = (a: Pick<Accesorio, "tipo" | "clave">) => `/companeros/${a.tipo === "fondo" ? "fondos" : "objetos"}/${a.clave}.webp`;

/** Los de regalo ya son suyos; el resto, una vez comprado */
export const clavesDeRegalo = () => ACCESORIOS.filter(esDeRegalo).map((a) => a.clave);
export const tieneAccesorio = (clave: string, comprados: readonly string[]) => {
  const a = accesorioDe(clave);
  return !!a && (esDeRegalo(a) || comprados.includes(clave));
};

export type Equipados = { fondo: string; objetos: string[] };
export const EQUIPADOS_INICIALES: Equipados = { fondo: "capilla", objetos: ["veladora"] };

/** Lee lo guardado con cuidado: lo que no existe o no es suyo se descarta */
export function leerEquipados(json: unknown, comprados: readonly string[], nivel: number): Equipados {
  const o = json && typeof json === "object" ? (json as Record<string, unknown>) : {};
  const fondo = typeof o.fondo === "string" && accesorioDe(o.fondo)?.tipo === "fondo" && tieneAccesorio(o.fondo, comprados) ? o.fondo : EQUIPADOS_INICIALES.fondo;
  // Sin nada guardado, lo de regalo; una lista vacía guardada se respeta
  const objetos = (Array.isArray(o.objetos) ? o.objetos : EQUIPADOS_INICIALES.objetos)
    .filter((c): c is string => typeof c === "string" && accesorioDe(c)?.tipo === "objeto" && tieneAccesorio(c, comprados))
    .filter((c, i, todos) => todos.indexOf(c) === i)
    .slice(0, ranurasDeObjetos(nivel));
  return { fondo, objetos };
}

/**
 * Pone o saca un accesorio. Devuelve el nuevo estado o lanza un error claro.
 * El fondo siempre hay uno puesto: elegir otro lo reemplaza.
 */
export function cambiarEquipado(actual: Equipados, clave: string, puesto: boolean, comprados: readonly string[], nivel: number): Equipados {
  const a = accesorioDe(clave);
  if (!a) throw new Error("Ese accesorio no existe");
  if (!tieneAccesorio(clave, comprados)) throw new Error("Todavía no tenés ese accesorio");
  if (a.tipo === "fondo") {
    if (!puesto) throw new Error("Elegí otro escenario para cambiar el actual");
    return { ...actual, fondo: clave };
  }
  const sin = actual.objetos.filter((c) => c !== clave);
  if (!puesto) return { ...actual, objetos: sin };
  if (sin.length >= ranurasDeObjetos(nivel)) throw new Error("No tenés más lugar: sacá otro objeto primero");
  return { ...actual, objetos: [...sin, clave] };
}

export type MotivoNoCompra = "ya-lo-tenes" | "nivel" | "saldo";

/** Razón por la que todavía no se puede comprar (null si se puede) */
export function motivoNoCompra(a: Accesorio, comprados: readonly string[], nivel: number, saldos: Record<keyof typeof MONEDAS, number>): MotivoNoCompra | null {
  if (tieneAccesorio(a.clave, comprados)) return "ya-lo-tenes";
  if (nivel < a.nivel) return "nivel";
  if (a.costos.some((c) => (saldos[c.moneda] ?? 0) < c.monto)) return "saldo";
  return null;
}

export const textoPrecio = (a: Accesorio) => (esDeRegalo(a) ? "De regalo" : textoCostos(a.costos));
