// Voz de cada compañero (vault/COMPANERO_HEROE.md, lane 220): misma mecánica, distinta personalidad.
// `{n}` es el nombre de quien lo cuida. Sin géneros para el usuario («me alegra verte», no «contento»).
// Siempre cálidas: ni culpa por faltar ni cuentas de días perdidos.
import type { Personaje, Situacion } from "./companero.ts";

export type TipoDeFrase = Situacion | "toque";

type Frases = Record<TipoDeFrase, readonly [string, string, string?]>;

export const FRASES: Record<Personaje, Frases> = {
  monja: {
    manana: ["Buen día, {n}. Que Dios te bendiga y te acompañe hoy.", "Qué linda mañana para empezar con una oración, {n}."],
    tarde: ["Acá estoy, {n}. Un día a la vez, con calma.", "Cada cosa bien hecha es una oración, {n}."],
    noche: ["Qué lindo cerrar el día juntos, {n}. Demos gracias.", "Es hora de agradecer. Descansá en paz, {n}."],
    regreso: ["¡Qué alegría verte, {n}! Te estaba esperando con las puertas abiertas.", "Bienvenido de vuelta, {n}. Acá siempre hay lugar para vos."],
    festejo: ["¡Bendito sea Dios, {n}! Te lo merecías.", "Qué alegría, {n}: tu esfuerzo da fruto."],
    carta: ["Mirá lo que Dios nos regaló hoy, {n}.", "{n}, hay algo lindo esperándote en las cartas."],
    toque: ["Rezo por vos, {n}.", "La paz sea contigo.", "Un ratito de silencio también hace bien."],
  },
  sacerdote: {
    manana: ["¡Buen día, {n}! Hoy hay mucho para ofrecer, ¿empezamos?", "Buenos días, {n}. Con un cafecito se empieza mejor, ¿no?"],
    tarde: ["Acá seguimos, {n}. Un paso por vez.", "Qué bueno tenerte por acá, {n}."],
    noche: ["Fue un buen día, {n}. Pongámoslo en manos de Dios.", "A cerrar el día juntos, {n}. Gracias por todo."],
    regreso: ["¡Volviste, {n}! Qué alegría. Acá no se lleva cuenta de los días.", "Los brazos abiertos, {n}. Como el padre de la parábola."],
    festejo: ["¡Eso se festeja, {n}! Qué orgullo.", "¡Bien ahí, {n}! Dios sabe lo que cuesta cada paso."],
    carta: ["Venga, {n}, que le muestro algo lindo.", "{n}, mirá lo que apareció en las cartas."],
    toque: ["¡Ánimo, {n}!", "Dios te quiere mucho. Y yo también.", "Menos cara de apuro y más de paz, {n}."],
  },
  hombre: {
    manana: ["Buen día, {n}. Arrancamos con todo.", "Buenos días, {n}. Café en mano, listo para lo que venga."],
    tarde: ["Acá estoy, {n}. Vamos de a poco.", "Seguimos firmes, {n}."],
    noche: ["Buen trabajo hoy, {n}. A descansar.", "Terminamos el día juntos, {n}. Eso vale."],
    regreso: ["¡Qué bueno verte, {n}! Acá seguía, esperándote.", "Volviste, {n}. Con eso alcanza, empecemos de nuevo."],
    festejo: ["¡Eso, {n}! Te lo ganaste.", "¡Grande, {n}! Se nota el esfuerzo."],
    carta: ["Mirá esto, {n}.", "{n}, tenés algo nuevo para ver."],
    toque: ["Todo bien, {n}.", "Contá conmigo.", "Paso a paso, {n}."],
  },
  mujer: {
    manana: ["¡Buen día, {n}! Hoy va a salir lindo.", "Buenos días, {n}. Con un cafecito arrancamos mejor."],
    tarde: ["Acá estoy, {n}. ¿Cómo viene el día?", "Qué bueno que estés acá, {n}."],
    noche: ["Qué lindo cerrar el día con vos, {n}.", "Hiciste lo que pudiste y eso es mucho, {n}. A descansar."],
    regreso: ["¡Qué alegría verte, {n}! Te extrañé.", "¡Volviste! Vení, {n}, que te debo un abrazo."],
    festejo: ["¡Te lo merecías, {n}!", "¡Qué orgullo, {n}! Seguí así."],
    carta: ["¡Mirá lo que conseguimos, {n}!", "{n}, hay una sorpresa esperándote."],
    toque: ["¡Vamos, {n}!", "Me encanta acompañarte.", "Un paso a la vez, {n}."],
  },
  nino: {
    manana: ["¡Buen día, {n}! ¿Jugamos a ganar el día?", "¡Buenos días! Ya me tomé el desayuno, ¿y vos, {n}?"],
    tarde: ["¡Hola, {n}! ¿Qué hacemos ahora?", "Estoy re contento de que estés, {n}."],
    noche: ["Ya tengo sueño, {n}… ¿rezamos juntos?", "Qué día lindo tuvimos, {n}."],
    regreso: ["¡{n}! ¡Volviste! Te extrañé un montón.", "¡Qué bueno que viniste, {n}! Vení, un abrazo."],
    festejo: ["¡Siii, {n}! ¡Lo lograste!", "¡Genial, {n}! ¡Sos un grande!"],
    carta: ["¡Mirá, mirá lo que apareció, {n}!", "{n}, ¡tenés cartas nuevas!"],
    toque: ["¡Jajaja, cosquillas!", "¿Seguimos, {n}?", "¡Vamos que podemos!"],
  },
  nina: {
    manana: ["¡Buen día, {n}! Hoy tengo un montón para contarte.", "¡Buenos días! Me levanté re temprano, {n}."],
    tarde: ["¡Hola, {n}! ¿Viste qué lindo día?", "Qué lindo que estés acá, {n}."],
    noche: ["Qué día lindo, {n}. Ahora a descansar.", "Gracias por acompañarme hoy, {n}."],
    regreso: ["¡{n}! ¡Volviste! Te estuve esperando.", "¡Qué alegría, {n}! Vení que te abrazo."],
    festejo: ["¡Yupiii, {n}! ¡Te felicito!", "¡Qué bien, {n}! Estoy tan contenta por vos."],
    carta: ["¡Mirá lo que encontré, {n}!", "{n}, ¡hay cartas nuevas para vos!"],
    toque: ["¡Hola de nuevo!", "Te quiero mucho, {n}.", "¿Me contás cómo te fue?"],
  },
};

/** Primer nombre de quien lo cuida («amigo» si por algún motivo no hay) */
export const primerNombre = (nombre: string) => nombre.trim().split(/\s+/)[0] || "amigo";

/**
 * Elige una frase según una semilla (el día y la persona, para que el saludo del día sea siempre el mismo
 * al volver a entrar, pero cambie de un día a otro). Con una semilla aleatoria sirve para los toques.
 */
export function fraseDe(personaje: Personaje, tipo: TipoDeFrase, nombre: string, semilla: number): string {
  const opciones = FRASES[personaje][tipo].filter((f): f is string => !!f);
  return opciones[Math.abs(Math.floor(semilla)) % opciones.length].replaceAll("{n}", primerNombre(nombre));
}
