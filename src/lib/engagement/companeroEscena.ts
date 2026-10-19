// Escenas del compañero flotante (lane 248): qué pose y qué frase muestra según la pantalla, el momento del día
// y lo que pasa en la app. Reglas puras, sin React ni base de datos, para poder probarlas.
// `{n}` es el nombre de quien lo cuida. Sin géneros para el usuario y siempre cálido (ver companeroFrases.ts).
import { primerNombre } from "./companeroFrases.ts";
import type { Pose, Voz } from "./companero.ts";

/** Las poses que se ven flotando: «buenos días» queda afuera (trae el cartel dibujado y fondo blanco) */
export const POSES_FLOTANTES = ["neutral", "abrazo", "felicitando", "ensenando", "reflexion"] as const;
export type PoseFlotante = (typeof POSES_FLOTANTES)[number];

export const esPoseFlotante = (p: unknown): p is PoseFlotante => (POSES_FLOTANTES as readonly unknown[]).includes(p);
/** La pose que se ve flotando para una pose cualquiera (la de «buenos días» pasa a la neutral) */
export const poseFlotante = (p: Pose): PoseFlotante => (esPoseFlotante(p) ? p : "neutral");
/** De las poses que ya aprendió, las que se pueden ver flotando (siempre incluye la neutral) */
export function posesVisibles(desbloqueadas: readonly Pose[]): PoseFlotante[] {
  const v = POSES_FLOTANTES.filter((p) => desbloqueadas.includes(p));
  return v.length > 0 ? v : ["neutral"];
}
/** La que sigue en la lista, para «Cambiar de imagen» */
export function siguientePose(actual: PoseFlotante, visibles: readonly PoseFlotante[]): PoseFlotante {
  if (visibles.length === 0) return "neutral";
  const i = visibles.indexOf(actual);
  return visibles[(i + 1) % visibles.length];
}

// ── Mensajes de cada imagen: por voz y pose, al menos 4 ────────────────────────────────────────
export const MENSAJES_POSE: Record<Voz, Record<PoseFlotante, readonly string[]>> = {
  monja: {
    neutral: ["Acá estoy, {n}. Un día a la vez, con calma.", "Cada cosa bien hecha es una oración, {n}.", "Que Dios te bendiga en lo que hagas hoy, {n}.", "Con paciencia y alegría todo se hace más liviano."],
    abrazo: ["Un abrazo grande, {n}. Acá siempre hay lugar para vos.", "Qué alegría tenerte cerca, {n}.", "Te quiero mucho, {n}, con todo el corazón.", "No vas sin compañía, {n}: Dios y yo caminamos con vos."],
    felicitando: ["¡Bendito sea Dios, {n}! Te lo merecías.", "Qué alegría, {n}: tu esfuerzo da fruto.", "¡Muy bien, {n}! Todo se lo ofrecemos al Señor.", "Me llena de gozo verte avanzar, {n}."],
    ensenando: ["Mirá, {n}, hay algo lindo para descubrir.", "Aprender es una forma de alabar a Dios, {n}.", "Vení, {n}, que te muestro algo que vale la pena.", "Cada día se aprende algo nuevo si uno mira con atención."],
    reflexion: ["Un ratito de silencio también hace bien, {n}.", "Pongamos este momento en manos de Dios.", "Respirá hondo, {n}, y ofrecé lo que estás haciendo.", "La paz sea contigo, {n}."],
  },
  sacerdote: {
    neutral: ["Acá seguimos, {n}. Un paso por vez.", "Qué bueno tenerte por acá, {n}.", "Ánimo, {n}, que Dios no se cansa de ayudarnos.", "Lo importante es empezar, {n}; lo demás viene solo."],
    abrazo: ["Los brazos abiertos, {n}, como el padre de la parábola.", "Gracias por venir, {n}. Me alegra verte.", "Acá nadie lleva cuenta de los tropiezos, {n}. Seguimos.", "Dios te quiere mucho, {n}. Y yo también."],
    felicitando: ["¡Eso se festeja, {n}! Qué orgullo.", "¡Bien ahí, {n}! Dios sabe lo que cuesta cada paso.", "¡Aplauso para vos, {n}! Seguí así.", "Lo hiciste muy bien, {n}. Demos gracias."],
    ensenando: ["Venga, {n}, que le muestro algo lindo.", "Mirá, {n}: hay novedades por acá.", "Un poquito de estudio nunca viene mal, {n}.", "Fijate en esto, {n}, que te va a servir."],
    reflexion: ["Un momento de oración, {n}, y todo se ordena.", "Pongamos el día en manos de Dios, {n}.", "Menos apuro y más paz, {n}.", "Cerremos los ojos un instante y agradezcamos, {n}."],
  },
  hombre: {
    neutral: ["Todo bien, {n}. Seguimos firmes.", "Contá conmigo, {n}.", "Paso a paso, {n}, que así se llega lejos.", "Acá estoy para lo que necesites, {n}."],
    abrazo: ["¡Qué bueno verte, {n}! Un abrazo fuerte.", "Acá seguía, {n}, esperándote.", "Con vos siempre da gusto, {n}.", "Vení, {n}, que un abrazo arregla muchas cosas."],
    felicitando: ["¡Eso, {n}! Te lo ganaste.", "¡Grande, {n}! Se nota el esfuerzo.", "¡Bien hecho, {n}! Así se hace.", "Orgullo de verte avanzar, {n}."],
    ensenando: ["Mirá esto, {n}.", "{n}, tenés algo nuevo para ver.", "Te muestro algo, {n}: fijate bien.", "Hay cosas para aprender por acá, {n}."],
    reflexion: ["Un rato de calma, {n}, nos viene bien.", "Pensemos un momento en lo bueno del día, {n}.", "A veces lo mejor es frenar y rezar, {n}.", "Gracias por todo lo de hoy, {n}."],
  },
  mujer: {
    neutral: ["¡Vamos, {n}! Un paso a la vez.", "Me encanta acompañarte, {n}.", "Qué bueno que estés acá, {n}.", "¿Cómo viene el día, {n}?"],
    abrazo: ["¡Vení que te debo un abrazo, {n}!", "Te extrañé, {n}. Qué alegría verte.", "Un abrazo bien fuerte para vos, {n}.", "Cuando quieras, acá estoy, {n}."],
    felicitando: ["¡Te lo merecías, {n}!", "¡Qué orgullo, {n}! Seguí así.", "¡Bravo, {n}! Lo lograste.", "¡Mirá lo que hiciste, {n}! Aplausos."],
    ensenando: ["¡Mirá lo que conseguimos, {n}!", "{n}, hay algo lindo para que veas.", "Te enseño algo, {n}: prestá atención.", "Siempre hay algo nuevo para aprender, {n}."],
    reflexion: ["Un momento de calma nos hace bien, {n}.", "Hiciste lo que pudiste y eso es mucho, {n}.", "Respiremos hondo juntos, {n}.", "Pongamos todo en manos de Dios, {n}."],
  },
  nino: {
    neutral: ["¡Hola, {n}! ¿Qué hacemos ahora?", "Estoy re contento de que estés, {n}.", "¡Vamos que podemos, {n}!", "¿Seguimos, {n}? ¡Yo estoy listo!"],
    abrazo: ["¡{n}! ¡Qué bueno que viniste! Un abrazo.", "¡Te extrañé un montón, {n}!", "¡Abrazo grandote para vos, {n}!", "Me gusta mucho estar con vos, {n}."],
    felicitando: ["¡Siii, {n}! ¡Lo lograste!", "¡Genial, {n}! ¡Sos un grande!", "¡Viva, {n}! ¡Qué bien lo hiciste!", "¡Yupiii! ¡Aplausos para {n}!"],
    ensenando: ["¡Mirá, mirá lo que encontré, {n}!", "{n}, ¡fijate en esto!", "¡Te muestro una cosa, {n}!", "¡Hay cosas nuevas, {n}! ¡Vení!"],
    reflexion: ["Ya tengo sueño, {n}… ¿rezamos juntos?", "Shhh, un ratito de silencio, {n}.", "Gracias, Diosito, por este día. ¿Y vos, {n}?", "Qué día lindo tuvimos, {n}."],
  },
  nina: {
    neutral: ["¡Hola, {n}! ¿Viste qué lindo día?", "Qué lindo que estés acá, {n}.", "¡Vamos juntos, {n}!", "Hoy tengo un montón para contarte, {n}."],
    abrazo: ["¡{n}! ¡Un abrazo enorme para vos!", "Qué alegría verte, {n}. ¡Te extrañé!", "Vení, {n}, que te abrazo fuerte.", "Me encanta que vengas a verme, {n}."],
    felicitando: ["¡Lo lograste, {n}! ¡Qué bien!", "¡Estoy tan contenta por vos, {n}!", "¡Bravo, {n}! ¡Aplausos!", "¡Qué orgullo de {n}! ¡Seguí así!"],
    ensenando: ["¡Mirá, {n}! Encontré algo lindo.", "{n}, ¡fijate lo que hay por acá!", "Te enseño una cosita, {n}.", "¡Hay algo nuevo, {n}! ¿Lo vemos?"],
    reflexion: ["Qué día lindo, {n}. Ahora a descansar.", "Gracias por acompañarme hoy, {n}.", "Hagamos una oración chiquita, {n}.", "Un ratito de calma, {n}, y rezamos."],
  },
};

// ── Pantalla donde está ────────────────────────────────────────────────────────────────────────
export type Contexto = "tareas" | "habitos" | "oracion" | "liturgia" | "cartas" | "tienda" | "premios" | "companero" | "homeschooling" | "rutina" | "perfil" | "familia" | "reglas" | "general";

const PANTALLAS: readonly [RegExp, Contexto][] = [
  [/^\/dashboard\/oracion/, "oracion"],
  [/^\/dashboard\/liturgia/, "liturgia"],
  [/^\/dashboard\/cartas/, "cartas"],
  [/^\/dashboard\/tienda/, "tienda"],
  [/^\/dashboard\/(premios|mis-premios)/, "premios"],
  [/^\/dashboard\/companero/, "companero"],
  [/^\/dashboard\/homeschooling/, "homeschooling"],
  [/^\/dashboard\/(rutina|horarios)/, "rutina"],
  [/^\/dashboard\/habitos/, "habitos"],
  [/^\/dashboard\/perfil/, "perfil"],
  [/^\/dashboard\/rules/, "reglas"],
  [/^\/dashboard\/(admin|users|tasks)/, "familia"],
  [/^\/dashboard\/?$/, "tareas"],
];

export function contextoDePantalla(pathname: string | null | undefined): Contexto {
  if (!pathname) return "general";
  return PANTALLAS.find(([re]) => re.test(pathname))?.[1] ?? "general";
}

type Entrada = { poses: readonly PoseFlotante[]; frases: readonly string[] };

export const MENSAJES_PANTALLA: Record<Contexto, Entrada> = {
  tareas: { poses: ["neutral", "ensenando", "abrazo"], frases: ["Una tarea a la vez, {n}. Vos podés.", "¿Por cuál empezamos hoy, {n}?", "Cada tarea terminada es un paso más, {n}.", "Si una se te hace cuesta arriba, partila en pedacitos, {n}."] },
  habitos: { poses: ["neutral", "felicitando"], frases: ["Los buenos hábitos se arman de a poquito, {n}.", "Un hábito cumplido hoy vale mucho mañana, {n}.", "No importa ir despacio, {n}; importa no parar.", "Cada día que lo repetís, se hace más fácil."] },
  oracion: { poses: ["reflexion"], frases: ["Un momento de oración vale por todo el día, {n}.", "Hablarle a Dios con sencillez es suficiente, {n}.", "Rezá sin apuro, {n}; Él escucha cada palabra.", "Qué lindo que te hagas un ratito para rezar, {n}."] },
  liturgia: { poses: ["reflexion", "ensenando"], frases: ["La Iglesia reza todos los días, {n}, y vos con ella.", "Mirá en qué tiempo litúrgico estamos, {n}.", "Cada fiesta tiene algo lindo para enseñarnos, {n}.", "El Rosario se reza con calma, {n}, una Ave María a la vez."] },
  cartas: { poses: ["ensenando", "felicitando"], frases: ["¡Las cartas guardan historias de santos, {n}!", "Mirá cuántas cartas vas juntando, {n}.", "Cada santo de las cartas nos deja algo para imitar.", "Te animo a leer la historia de tu carta favorita, {n}."] },
  tienda: { poses: ["neutral", "ensenando"], frases: ["Pensalo bien antes de gastar, {n}; lo ganaste con esfuerzo.", "¿Hay algo que quieras juntar? Ahorrar también es ganar, {n}.", "Mirá con calma, {n}, no hay apuro.", "Si te falta para algo, con tareas y hábitos lo conseguís."] },
  premios: { poses: ["felicitando", "abrazo"], frases: ["Los premios llegan por el esfuerzo de cada día, {n}.", "¡Qué lindo es recibir lo que uno se ganó, {n}!", "Mirá lo que lograste juntar, {n}.", "Cada premio cuenta una historia de constancia."] },
  companero: { poses: ["abrazo", "neutral", "felicitando"], frases: ["¡Estás en mi casa, {n}! Mirá todo lo que podemos hacer.", "Cada nivel me enseña poses nuevas, {n}.", "Acá podés cambiarme de escenario y de objetos, {n}.", "Me encanta que vengas a verme, {n}."] },
  homeschooling: { poses: ["ensenando", "neutral"], frases: ["Estudiar es una forma de servir, {n}.", "Una materia a la vez, {n}; sin apuro.", "Preguntar es empezar a aprender, {n}.", "Todo lo que aprendés hoy te sirve mañana."] },
  rutina: { poses: ["neutral", "ensenando"], frases: ["Una buena rutina ordena el día, {n}.", "Cada hora tiene su lugar, {n}.", "Ordenar el tiempo es ordenar el corazón.", "Mirá qué sigue en tu día, {n}."] },
  perfil: { poses: ["abrazo", "felicitando"], frases: ["Mirá todo lo que fuiste logrando, {n}.", "Tu perfil cuenta tu camino, {n}.", "Cada día en la app suma, {n}.", "Qué lindo ver cuánto avanzaste, {n}."] },
  familia: { poses: ["neutral", "abrazo"], frases: ["Gracias por cuidar de la familia, {n}.", "Educar es una gran misión, {n}.", "Una palabra de ánimo vale más que mil retos, {n}.", "Paciencia y cariño, {n}: así se forma."] },
  reglas: { poses: ["ensenando", "neutral"], frases: ["Las reglas ayudan a vivir en paz, {n}.", "Cumplir lo acordado también es amar, {n}.", "Leelas con calma, {n}, que ordenan la casa.", "Una familia ordenada es una familia feliz."] },
  general: { poses: ["neutral", "abrazo"], frases: ["Acá estoy, {n}. Cualquier cosa, tocame.", "Sigamos, {n}, que vamos bien.", "Qué bueno acompañarte, {n}.", "Un paso a la vez, {n}."] },
};

// ── Momento del día ────────────────────────────────────────────────────────────────────────────
export type MomentoDelDia = "manana" | "tarde" | "noche";
export const momentoDelDia = (hora: number): MomentoDelDia => (hora >= 5 && hora < 12 ? "manana" : hora >= 19 || hora < 5 ? "noche" : "tarde");

export const MENSAJES_MOMENTO: Record<MomentoDelDia, Entrada> = {
  manana: { poses: ["neutral", "felicitando", "abrazo"], frases: ["¡Buen día, {n}! Hoy va a salir lindo.", "Qué linda mañana para empezar con una oración, {n}.", "Con un cafecito se arranca mejor, {n}.", "Arranquemos el día juntos, {n}."] },
  tarde: { poses: ["neutral", "ensenando"], frases: ["¿Cómo viene el día, {n}?", "Vamos por la tarde con calma, {n}.", "Todavía queda mucho día para hacer cosas buenas, {n}.", "Un mate, un respiro y seguimos, {n}."] },
  noche: { poses: ["reflexion", "abrazo"], frases: ["Qué lindo cerrar el día juntos, {n}. Demos gracias.", "Es hora de agradecer, {n}. Descansá en paz.", "Revisemos el día con cariño, {n}: lo bueno y lo que falta.", "Ya es tarde, {n}. Mañana seguimos."] },
};

// ── Lo que pasa en la app ──────────────────────────────────────────────────────────────────────
/** De más a menos importante: si hay varios a la vez, el primero gana al abrir la app */
export const EVENTOS_APP = ["nivel", "premio", "cartas", "tarea-hecha", "atrasadas", "habitos", "racha"] as const;
export type EventoApp = (typeof EVENTOS_APP)[number];

export const MENSAJES_EVENTO: Record<EventoApp, Entrada> = {
  nivel: { poses: ["felicitando"], frases: ["¡Subiste de nivel, {n}! Qué alegría acompañarte.", "¡Nivel nuevo, {n}! Mirá lo que se abre ahora.", "¡Lo lograste, {n}! Tu constancia da frutos.", "¡Qué alegría, {n}! Pasaste de nivel."] },
  premio: { poses: ["felicitando", "abrazo"], frases: ["¡Tenés un premio esperándote, {n}!", "{n}, hay una sorpresa para vos. ¡Andá a verla!", "Algo lindo te está esperando, {n}.", "¡Mirá, {n}! Te ganaste algo."] },
  cartas: { poses: ["ensenando"], frases: ["¡Mirá lo que encontré, {n}! Hay cartas nuevas.", "{n}, ¡tenés cartas por reclamar!", "Hay cartas nuevas para vos, {n}.", "Pasá por las cartas, {n}: hay una sorpresa."] },
  "tarea-hecha": { poses: ["felicitando"], frases: ["¡Muy bien, {n}! Una tarea menos.", "¡Eso es, {n}! Tarea cumplida.", "¡Bravo, {n}! Así se hace.", "Qué bien lo hiciste, {n}. ¡A seguir!"] },
  atrasadas: { poses: ["abrazo", "neutral"], frases: ["Hay tareas atrasadas, {n}. Sin apuro: de a una.", "Empecemos por la más fácil, {n}; así se agarra ritmo.", "No pasa nada, {n}. Hoy es un buen día para ponerse al día.", "Una tarea chiquita ya cambia el día, {n}."] },
  habitos: { poses: ["neutral", "ensenando"], frases: ["Te quedan hábitos para hoy, {n}.", "¿Hiciste tus hábitos de hoy, {n}?", "No te olvides de tus hábitos, {n}.", "Un hábito más y cerramos el día, {n}."] },
  racha: { poses: ["felicitando", "abrazo"], frases: ["¡Qué constancia, {n}! Seguís viniendo todos los días.", "Cada día juntos suma, {n}.", "¡Mirá tu racha, {n}! Así se forman los buenos hábitos.", "Gracias por volver cada día, {n}."] },
};

// ── Elección ───────────────────────────────────────────────────────────────────────────────────
export type OrigenEscena = "evento" | "pantalla" | "momento" | "pose";
export type Escena = { pose: PoseFlotante; frase: string; origen: OrigenEscena };

export type EntradaEscena = {
  voz: Voz;
  /** Nombre de quien lo cuida */
  nombre: string;
  contexto: Contexto;
  hora: number;
  /** Lo que está pasando ahora en la app (puede haber varios) */
  eventos?: readonly EventoApp[];
  /** Algo que acaba de pasar (tarea hecha, nivel…): manda sobre todo lo demás */
  eventoPuntual?: EventoApp;
  /** Las poses que ya aprendió */
  desbloqueadas: readonly Pose[];
  /** Es la primera escena al abrir la app: si hay algo importante pendiente, lo dice */
  inicial?: boolean;
  anterior?: { pose?: PoseFlotante | null; frase?: string | null } | null;
  azar?: () => number;
};

const elegir = <T,>(lista: readonly T[], azar: () => number): T => lista[Math.min(lista.length - 1, Math.floor(azar() * lista.length))];

/** La frase se elige distinta de la anterior (si hay de dónde) y con el nombre puesto */
function frasesSinRepetir(frases: readonly string[], nombre: string, anterior: string | null | undefined, azar: () => number): string {
  const n = primerNombre(nombre);
  const todas = frases.map((f) => f.replaceAll("{n}", n));
  const otras = anterior ? todas.filter((f) => f !== anterior) : todas;
  return elegir(otras.length > 0 ? otras : todas, azar);
}

/** Las frases de una pose, para «Cambiar de imagen» (distinta de la anterior) */
export function fraseDePose(voz: Voz, pose: PoseFlotante, nombre: string, anterior?: string | null, azar: () => number = Math.random): string {
  return frasesSinRepetir(MENSAJES_POSE[voz][pose], nombre, anterior, azar);
}

function conPoseDisponible(entrada: Entrada, visibles: readonly PoseFlotante[], azar: () => number): PoseFlotante {
  const posibles = entrada.poses.filter((p) => visibles.includes(p));
  return posibles.length > 0 ? elegir(posibles, azar) : (visibles.includes("neutral") ? "neutral" : visibles[0]);
}

export function elegirEscena(e: EntradaEscena): Escena {
  const azar = e.azar ?? Math.random;
  const visibles = posesVisibles(e.desbloqueadas);
  const eventos = EVENTOS_APP.filter((ev) => e.eventos?.includes(ev));
  const anterior = e.anterior?.frase ?? null;

  let origen: OrigenEscena;
  let evento: EventoApp | null = null;
  if (e.eventoPuntual) {
    origen = "evento";
    evento = e.eventoPuntual;
  } else if (e.inicial && eventos.length > 0) {
    origen = "evento";
    evento = eventos[0];
  } else {
    const r = azar();
    if (eventos.length > 0 && r < 0.3) {
      origen = "evento";
      evento = elegir(eventos, azar);
    } else if (e.contexto !== "general" && r < 0.7) origen = "pantalla";
    else if (r < 0.85) origen = "momento";
    else origen = "pose";
  }

  if (origen === "evento" && evento) {
    const entrada = MENSAJES_EVENTO[evento];
    return { origen, pose: conPoseDisponible(entrada, visibles, azar), frase: frasesSinRepetir(entrada.frases, e.nombre, anterior, azar) };
  }
  if (origen === "pantalla") {
    const entrada = MENSAJES_PANTALLA[e.contexto];
    return { origen, pose: conPoseDisponible(entrada, visibles, azar), frase: frasesSinRepetir(entrada.frases, e.nombre, anterior, azar) };
  }
  if (origen === "momento") {
    const entrada = MENSAJES_MOMENTO[momentoDelDia(e.hora)];
    return { origen, pose: conPoseDisponible(entrada, visibles, azar), frase: frasesSinRepetir(entrada.frases, e.nombre, anterior, azar) };
  }
  const pose = elegir(visibles, azar);
  return { origen: "pose", pose, frase: frasesSinRepetir(MENSAJES_POSE[e.voz][pose], e.nombre, anterior, azar) };
}
