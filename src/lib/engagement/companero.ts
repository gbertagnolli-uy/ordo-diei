// Compañero «héroe» (vault/COMPANERO_HEROE.md, lane 220): reglas puras.
// Es la cara de la app: acompaña a todos (hijos y padres), muestra el progreso real (el nivel de siempre,
// con la XP que ya se gana) y avisa los premios con una pose según el momento. No tiene economía propia.
// Lo que antes crecía con los días de uso (lane 203) ahora sube con el nivel; los días juntos son «la relación».
export const MAX_NOMBRE = 20;
export const NOMBRE_POR_DEFECTO = "Tu compañero";

// ── Personajes ─────────────────────────────────────────────────────────────────────────────────
export const PERSONAJES = [
  { clave: "monja", titulo: "La hermana", descripcion: "Una monja joven, serena y alegre", nombreSugerido: "Hermana Clara", emoji: "⛪" },
  { clave: "sacerdote", titulo: "El padre", descripcion: "Un sacerdote joven, cercano y con humor", nombreSugerido: "Padre Tomás", emoji: "✝️" },
  { clave: "hombre", titulo: "El amigo", descripcion: "Un hombre de todos los días, firme y leal", nombreSugerido: "Mateo", emoji: "👨" },
  { clave: "mujer", titulo: "La amiga", descripcion: "Una mujer de todos los días, cálida y decidida", nombreSugerido: "Lucía", emoji: "👩" },
  { clave: "nino", titulo: "El niño", descripcion: "Un niño curioso que quiere jugar y aprender", nombreSugerido: "Benja", emoji: "👦" },
  { clave: "nina", titulo: "La niña", descripcion: "Una niña alegre que lo cuenta todo", nombreSugerido: "Sofi", emoji: "👧" },
] as const;

export type Personaje = (typeof PERSONAJES)[number]["clave"];
export const CLAVES_PERSONAJE = PERSONAJES.map((p) => p.clave) as Personaje[];
export const esPersonaje = (x: unknown): x is Personaje => typeof x === "string" && (CLAVES_PERSONAJE as string[]).includes(x);
export const datosDePersonaje = (clave: Personaje) => PERSONAJES.find((p) => p.clave === clave)!;

// ── Poses ──────────────────────────────────────────────────────────────────────────────────────
// Una imagen por pose y personaje: public/companeros/<personaje>/<pose>.webp (vault/COMPANERO_IMAGENES.md).
// Las poses más expresivas se ganan al subir de nivel; las del primer día (para saludar, abrazar y felicitar) ya están.
export const POSES = [
  { clave: "neutral", nombre: "De pie", nivel: 1, cuando: "Cuando no hay otra cosa para decir" },
  { clave: "buenos-dias", nombre: "Buenos días", nivel: 1, cuando: "Al abrir la app por la mañana" },
  { clave: "abrazo", nombre: "Abrazo", nivel: 1, cuando: "Cuando volvés después de faltar" },
  { clave: "felicitando", nombre: "Felicitando", nivel: 1, cuando: "Premios, hitos y niveles nuevos" },
  { clave: "ensenando", nombre: "Enseñando", nivel: 2, cuando: "Cartas nuevas y novedades" },
  { clave: "reflexion", nombre: "Reflexión", nivel: 3, cuando: "Al atardecer y de noche" },
] as const;

export type Pose = (typeof POSES)[number]["clave"];
export const esPose = (x: unknown): x is Pose => POSES.some((p) => p.clave === x);
export const poseDesbloqueada = (pose: Pose, nivel: number) => nivel >= POSES.find((p) => p.clave === pose)!.nivel;
export const posesDesbloqueadas = (nivel: number): Pose[] => POSES.filter((p) => nivel >= p.nivel).map((p) => p.clave);

/** La próxima pose que se gana y a qué nivel (null si ya están todas) */
export function proximaPose(nivel: number): { pose: Pose; nombre: string; nivel: number } | null {
  const p = POSES.filter((x) => x.nivel > nivel).sort((a, b) => a.nivel - b.nivel)[0];
  return p ? { pose: p.clave, nombre: p.nombre, nivel: p.nivel } : null;
}

export type Momento = {
  /** Hora de la familia (0–23) */
  hora: number;
  /** Días enteros desde la última vez que entró (null si es la primera) */
  diasSinEntrar: number | null;
  /** Hay un festejo pendiente (nivel nuevo) */
  festejo?: boolean;
  /** Hay cartas por reclamar */
  cartasNuevas?: boolean;
};

/** Situación que decide la pose y la frase */
export type Situacion = "regreso" | "festejo" | "carta" | "manana" | "tarde" | "noche";

export function situacionDe(m: Momento): Situacion {
  if (m.festejo) return "festejo";
  if (m.diasSinEntrar !== null && m.diasSinEntrar >= 2) return "regreso";
  if (m.cartasNuevas) return "carta";
  if (m.hora >= 5 && m.hora < 12) return "manana";
  if (m.hora >= 19 || m.hora < 5) return "noche";
  return "tarde";
}

const POSE_POR_SITUACION: Record<Situacion, Pose> = {
  regreso: "abrazo",
  festejo: "felicitando",
  carta: "ensenando",
  manana: "buenos-dias",
  tarde: "neutral",
  noche: "reflexion",
};

/** Pose del momento; si todavía no la ganó, se queda con la neutral */
export function poseDelMomento(m: Momento, nivel: number): Pose {
  const pose = POSE_POR_SITUACION[situacionDe(m)];
  return poseDesbloqueada(pose, nivel) ? pose : "neutral";
}

// ── Relación («días juntos») ──────────────────────────────────────────────────────────────────
// Cuenta los días distintos en que se entró. Nunca baja: faltar no le quita nada.
export const RELACIONES = [
  { desde: 0, titulo: "Recién presentados" },
  { desde: 7, titulo: "Amigos" },
  { desde: 30, titulo: "Compañeros de camino" },
  { desde: 100, titulo: "Amigos del alma" },
] as const;

export function relacionDe(diasJuntos: number): { titulo: string; proximo: { titulo: string; faltan: number } | null } {
  const d = Math.max(0, Math.floor(diasJuntos));
  const actual = [...RELACIONES].reverse().find((r) => d >= r.desde) ?? RELACIONES[0];
  const sig = RELACIONES.find((r) => r.desde > d);
  return { titulo: actual.titulo, proximo: sig ? { titulo: sig.titulo, faltan: sig.desde - d } : null };
}

// ── Nivel: marcos y espacios ──────────────────────────────────────────────────────────────────
/** Cuántos objetos de escena puede tener puestos a la vez: 1 al empezar, 2 en el nivel 4 y 3 en el 8 */
export const ranurasDeObjetos = (nivel: number) => (nivel >= 8 ? 3 : nivel >= 4 ? 2 : 1);

/** Próximo nivel en que se abre otro espacio (null si ya tiene los tres) */
export const proximaRanura = (nivel: number) => (nivel < 4 ? 4 : nivel < 8 ? 8 : null);

/** Marco de la escena: cambia cada 5 niveles (0 = sin marco) */
export const marcoDeNivel = (nivel: number) => Math.min(4, Math.floor(Math.max(1, nivel) / 5));

/**
 * Mensaje de bienvenida cuando se vuelve después de faltar (null si no corresponde).
 * Siempre cálido: no cuenta los días perdidos ni hace sentir culpa.
 */
export function mensajeDeRegreso(nombre: string, diasDesdeLaUltimaVez: number | null): string | null {
  if (diasDesdeLaUltimaVez === null || diasDesdeLaUltimaVez < 2) return null;
  return `¡Qué alegría verte de nuevo! ${nombre} estaba esperándote.`;
}

/** Limpia y valida el nombre que elige quien lo cuida */
export function validarNombre(entrada: unknown): string {
  const nombre = typeof entrada === "string" ? entrada.replace(/\s+/g, " ").trim() : "";
  if (!nombre) throw new Error("Escribí un nombre para tu compañero");
  if (nombre.length > MAX_NOMBRE) throw new Error(`El nombre no puede superar los ${MAX_NOMBRE} caracteres`);
  return nombre;
}
