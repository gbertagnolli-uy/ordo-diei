// Compañero «héroe» (vault/COMPANERO_HEROE.md, lane 220): reglas puras.
// Es la cara de la app: acompaña a todos (hijos y padres), muestra el progreso real (el nivel de siempre,
// con la XP que ya se gana) y avisa los premios con una pose según el momento. No tiene economía propia.
// Lo que antes crecía con los días de uso (lane 203) ahora sube con el nivel; los días juntos son «la relación».
export const MAX_NOMBRE = 20;
export const NOMBRE_POR_DEFECTO = "Tu compañero";

// ── Personajes ─────────────────────────────────────────────────────────────────────────────────
// Los héroes son los de las carpetas de arte (public/companeros/<clave>/): la clave es el nombre sin tildes ni espacios.
// `voz` es la forma de hablar (companeroFrases.ts); `arte` dice cuántas imágenes tiene y `objeto` es lo que lo identifica
// (una imagen por héroe: public/companeros/<clave>/objeto.webp, con el emoji de respaldo hasta que exista).
// vault/COMPANERO_PERSONAJES_OBJETOS.md tiene la lista legible con el pedido de cada objeto.
export type Voz = "monja" | "sacerdote" | "hombre" | "mujer" | "nino" | "nina";
/** completo = las 6 poses · parcial = alguna pose (el resto muestra la neutral) · pendiente = todavía sin imagen, no se puede elegir */
export type Arte = "completo" | "parcial" | "pendiente";
type Heroe = { clave: string; nombre: string; titulo: string; descripcion: string; voz: Voz; emoji: string; arte: Arte; objeto: { nombre: string; emoji: string } };

export const PERSONAJES = [
  { clave: "angelito", nombre: "Angelito", titulo: "El ángel de la guarda", descripcion: "Un angelito rubio que te cuida", voz: "nino", emoji: "👼", arte: "completo", objeto: { nombre: "Farolito de luz", emoji: "🏮" } },
  { clave: "barbara", nombre: "Bárbara", titulo: "La joven valiente", descripcion: "Una joven de campo, firme y alegre", voz: "mujer", emoji: "👩", arte: "completo", objeto: { nombre: "Torrecita de tres ventanas", emoji: "🏰" } },
  { clave: "catalina", nombre: "Catalina", titulo: "La maestra del chaleco verde", descripcion: "Una mujer con ganas de enseñar", voz: "mujer", emoji: "👩‍🏫", arte: "completo", objeto: { nombre: "Rueda de madera con una pluma", emoji: "🎡" } },
  { clave: "cecilia", nombre: "Cecilia", titulo: "La cantora", descripcion: "Una joven que reza cantando", voz: "mujer", emoji: "🎶", arte: "completo", objeto: { nombre: "Laúd pequeño", emoji: "🪕" } },
  { clave: "daniel", nombre: "Daniel", titulo: "El fuerte", descripcion: "Un hombre corpulento, noble y leal", voz: "hombre", emoji: "💪", arte: "completo", objeto: { nombre: "Rollo con una profecía", emoji: "📜" } },
  { clave: "dom-pio", nombre: "Dom Pío", titulo: "El monje", descripcion: "Un monje sereno que reza y trabaja", voz: "sacerdote", emoji: "🧔", arte: "completo", objeto: { nombre: "Campanita del monasterio", emoji: "🔔" } },
  { clave: "felipe", nombre: "Felipe", titulo: "El lector", descripcion: "Un niño curioso que siempre tiene un libro", voz: "nino", emoji: "👦", arte: "completo", objeto: { nombre: "Dos panes y un pescado", emoji: "🍞" } },
  { clave: "isaias", nombre: "Isaías", titulo: "El grandote bueno", descripcion: "Un campesino barbudo y de gran corazón", voz: "hombre", emoji: "🧔", arte: "parcial", objeto: { nombre: "Brasa en unas tenazas", emoji: "🔥" } },
  { clave: "josecito", nombre: "Josecito", titulo: "El más chiquito", descripcion: "Un bebé que camina y todo lo quiere abrazar", voz: "nino", emoji: "👶", arte: "completo", objeto: { nombre: "Martillito de carpintero", emoji: "🔨" } },
  { clave: "laura", nombre: "Laura", titulo: "La niña piadosa", descripcion: "Una niña alegre que lee su librito", voz: "nina", emoji: "👧", arte: "completo", objeto: { nombre: "Lirio blanco", emoji: "🌷" } },
  { clave: "lucas", nombre: "Lucas", titulo: "El joven sacerdote", descripcion: "Un sacerdote joven con su bolso de visitas", voz: "sacerdote", emoji: "✝️", arte: "parcial", objeto: { nombre: "Evangelio y pluma", emoji: "🖋️" } },
  { clave: "madre-isabel", nombre: "Madre Isabel", titulo: "La madre", descripcion: "Una monja serena y alegre", voz: "monja", emoji: "⛪", arte: "completo", objeto: { nombre: "Rosas en un pañuelo", emoji: "🌹" } },
  { clave: "magdalena", nombre: "Magdalena", titulo: "La del canasto", descripcion: "Una mujer de campo que saluda con una sonrisa", voz: "mujer", emoji: "🧺", arte: "parcial", objeto: { nombre: "Frasco de perfume", emoji: "🫙" } },
  { clave: "maria", nombre: "María", titulo: "La amiga de todos", descripcion: "Una niña cariñosa que abraza y felicita", voz: "nina", emoji: "👧", arte: "completo", objeto: { nombre: "Rosario celeste", emoji: "📿" } },
  { clave: "mariana", nombre: "Mariana", titulo: "La azucena", descripcion: "Todavía sin ilustraciones", voz: "nina", emoji: "🌼", arte: "pendiente", objeto: { nombre: "Azucena", emoji: "🌼" } },
  { clave: "marta", nombre: "Marta", titulo: "La de la casa", descripcion: "Una mujer trabajadora, de delantal", voz: "mujer", emoji: "🍲", arte: "parcial", objeto: { nombre: "Cucharón de madera", emoji: "🥄" } },
  { clave: "maximiliano", nombre: "Maximiliano", titulo: "El caminante", descripcion: "Un chico que va de camino con paso decidido", voz: "nino", emoji: "🚶", arte: "parcial", objeto: { nombre: "Dos coronas, blanca y roja", emoji: "👑" } },
  { clave: "miguel", nombre: "Miguel", titulo: "El amigo fiel", descripcion: "Todavía sin ilustraciones", voz: "hombre", emoji: "🛡️", arte: "pendiente", objeto: { nombre: "Escudo pequeño", emoji: "🛡️" } },
  { clave: "padre-santiago", nombre: "Padre Santiago", titulo: "El padre", descripcion: "Un sacerdote cercano, de sotana negra", voz: "sacerdote", emoji: "✝️", arte: "completo", objeto: { nombre: "Concha de peregrino", emoji: "🐚" } },
  { clave: "pedro", nombre: "Pedro", titulo: "El de la túnica verde", descripcion: "Un hombre de todos los días, firme y leal", voz: "hombre", emoji: "👨", arte: "completo", objeto: { nombre: "Llaves grandes", emoji: "🔑" } },
  { clave: "rafael", nombre: "Rafael", titulo: "El caminante", descripcion: "Todavía sin ilustraciones", voz: "hombre", emoji: "🐟", arte: "pendiente", objeto: { nombre: "Bastón y pez", emoji: "🐟" } },
  { clave: "rosa", nombre: "Rosa", titulo: "La florecita", descripcion: "Una niña de campo, cálida y decidida", voz: "nina", emoji: "🌹", arte: "completo", objeto: { nombre: "Corona de rosas", emoji: "🌹" } },
  { clave: "san-miguel-arcangel", nombre: "San Miguel Arcángel", titulo: "El arcángel", descripcion: "El defensor con su armadura y su espada", voz: "hombre", emoji: "⚔️", arte: "completo", objeto: { nombre: "Espada de llamas", emoji: "🗡️" } },
  { clave: "teresa", nombre: "Teresa", titulo: "La pequeña", descripcion: "Una niña sencilla que lo hace todo con amor", voz: "nina", emoji: "🌹", arte: "completo", objeto: { nombre: "Ramito de rosas y crucifijo", emoji: "🌹" } },
  { clave: "veronica", nombre: "Verónica", titulo: "La del velo", descripcion: "Todavía sin ilustraciones", voz: "mujer", emoji: "🕊️", arte: "pendiente", objeto: { nombre: "Velo con un rostro", emoji: "🕊️" } },
  { clave: "vicente", nombre: "Vicente", titulo: "El generoso", descripcion: "Un chico de campo, siempre listo para ayudar", voz: "nino", emoji: "🧒", arte: "completo", objeto: { nombre: "Bolsita de monedas", emoji: "💰" } },
] as const satisfies readonly Heroe[];

export type Personaje = (typeof PERSONAJES)[number]["clave"];
export const CLAVES_PERSONAJE = PERSONAJES.map((p) => p.clave) as Personaje[];
export const esPersonaje = (x: unknown): x is Personaje => typeof x === "string" && (CLAVES_PERSONAJE as string[]).includes(x);
export const datosDePersonaje = (clave: Personaje) => PERSONAJES.find((p) => p.clave === clave)!;
/** Los que ya se pueden elegir (tienen al menos una imagen) */
export const PERSONAJES_ELEGIBLES = PERSONAJES.filter((p) => p.arte !== "pendiente");
export const esElegible = (x: unknown): x is Personaje => esPersonaje(x) && datosDePersonaje(x).arte !== "pendiente";

/** Los 6 personajes genéricos de la primera versión (lane 220) pasaron a ser héroes: quien ya tenía uno conserva el parecido */
const PERSONAJES_VIEJOS: Record<string, Personaje> = { monja: "madre-isabel", sacerdote: "padre-santiago", hombre: "pedro", mujer: "barbara", nino: "felipe", nina: "laura" };
/** Lo que está guardado en la base → héroe (null si no hay o ya no existe) */
export const personajeGuardado = (x: unknown): Personaje | null => (esPersonaje(x) ? x : typeof x === "string" ? (PERSONAJES_VIEJOS[x] ?? null) : null);

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
/** Poses que se dejan tal cual vienen, con su fondo blanco (algunas traen el cartel «¡Buenos días!» dibujado): la escena lo funde con CSS */
export const POSES_CON_FONDO: readonly Pose[] = ["buenos-dias"];
export const tieneFondo = (pose: Pose) => POSES_CON_FONDO.includes(pose);
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
