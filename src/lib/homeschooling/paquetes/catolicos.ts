// Propio de Ordo (lane 177, L3): biblioteca de cursos católicos que vienen con la app. Cada uno es un paquete de curso (formato
// `ordo-curso`, ver ../paquete.ts) que se agrega a una materia con un clic: lecciones de texto con su material para leer, para
// copiar y para conversar en familia. Contenido de uso común en la catequesis; sin textos con derechos.
import { CATALOGO_MEMORIA, itemDeCatalogo } from "../catolico.ts";
import { FORMATO_PAQUETE, VERSION_PAQUETE, type PaqueteCurso } from "../paquete.ts";

export interface PaqueteDeBiblioteca {
  clave: string;
  descripcion: string;
  edad: string;
  paquete: PaqueteCurso;
}

type Leccion = PaqueteCurso["lecciones"][number];

const leccion = (titulo: string, instrucciones: string, lectura: string, extras: Partial<Leccion> = {}): Leccion => ({
  titulo,
  instrucciones,
  url: null,
  materiales: [{ titulo, tipo: "markdown", contenido: lectura, limiteImpresiones: 2 }],
  ...extras,
});

const curso = (titulo: string, descripcion: string, minutos: number, lecciones: Leccion[]): PaqueteCurso => ({
  formato: FORMATO_PAQUETE,
  version: VERSION_PAQUETE,
  curso: { titulo, descripcion, tipo: "enlaces", unidadTipo: "leccion", minutosPorUnidad: minutos, umbralAprobacion: 70, navegacionLibre: false },
  lecciones,
});

const texto = (clave: string) => itemDeCatalogo(clave)?.texto ?? "";

// ── 1. Oraciones del cristiano ──────────────────────────────────────────────────────────────────
const ORACIONES = ["senal-de-la-cruz", "padre-nuestro", "ave-maria", "gloria", "angel-de-la-guarda", "bendicion-de-la-mesa", "credo-apostolico", "acto-de-contricion", "salve", "angelus", "san-miguel"];
const oraciones = curso(
  "Oraciones del cristiano",
  "Las oraciones que todo cristiano sabe de memoria: una por lección, para leer despacio, rezar en familia y copiar a mano.",
  15,
  ORACIONES.map((clave) => {
    const o = CATALOGO_MEMORIA.find((i) => i.clave === clave)!;
    return leccion(o.titulo, "Rezala despacio con un padre. Después copiala a mano en el cuaderno y tratá de decirla de memoria. En «Memoria» queda para repasarla.", `# ${o.titulo}\n\n${o.texto.split("\n").join("\n\n")}\n\n**Para conversar:** ¿Qué le pedimos a Dios en esta oración? ¿Cuándo la rezamos en casa?`);
  })
);

// ── 2. Los diez mandamientos ────────────────────────────────────────────────────────────────────
const MANDAMIENTOS: [string, string, string][] = [
  ["Amarás a Dios sobre todas las cosas", "Dios es lo primero. Lo amamos rezando, confiando en Él y poniéndolo antes que cualquier cosa.", "¿Qué cosas me roban tiempo que podría dedicarle a Dios?"],
  ["No tomarás el nombre de Dios en vano", "El nombre de Dios es santo. Lo decimos con respeto: para rezar, bendecir y alabar; nunca para enojarnos o burlarnos.", "¿Cómo podemos pronunciar con cariño el nombre de Jesús?"],
  ["Santificarás las fiestas", "El domingo es el día del Señor: vamos a Misa, descansamos y compartimos en familia.", "¿Qué hacemos distinto los domingos?"],
  ["Honrarás a tu padre y a tu madre", "Honramos a nuestros padres obedeciéndolos, respetándolos y ayudándolos en casa.", "¿Cómo puedo ayudar hoy a mamá y a papá sin que me lo pidan?"],
  ["No matarás", "La vida es un regalo de Dios y hay que cuidarla: la mía y la de los demás. Tampoco herimos con palabras o con peleas.", "¿Cómo cuido a mis hermanos y a los que sufren?"],
  ["No cometerás actos impuros", "Cuidamos nuestro cuerpo y nuestro corazón como templos de Dios, con modestia y pureza.", "¿Qué me ayuda a tener un corazón limpio?"],
  ["No robarás", "Lo que no es mío no se toma. También cuidamos lo prestado y devolvemos lo que nos prestaron.", "¿Qué hago si encuentro algo que no es mío?"],
  ["No darás falso testimonio ni mentirás", "Decimos siempre la verdad y no hablamos mal de los demás.", "¿Cuándo me cuesta más decir la verdad? ¿Qué me ayuda?"],
  ["No consentirás pensamientos ni deseos impuros", "La pureza empieza en la mente y en la mirada. Pedimos ayuda a la Virgen y a nuestro ángel de la guarda.", "¿A quién le pido ayuda cuando me vienen malos pensamientos?"],
  ["No codiciarás los bienes ajenos", "Nos alegramos con lo que tienen los demás y damos gracias por lo que Dios nos dio. La envidia nos hace infelices.", "¿Por qué cosas puedo dar gracias hoy?"],
];
const mandamientos = curso(
  "Los diez mandamientos",
  "Los diez mandamientos de la ley de Dios, uno por lección: qué dicen, cómo se viven en casa y un punto para conversar.",
  20,
  MANDAMIENTOS.map(([titulo, explicacion, pregunta], i) =>
    leccion(`${i + 1}. ${titulo}`, "Leé la lección con un padre. Conversen la pregunta y anotá en el cuaderno una cosa que vas a hacer para cumplirlo.", `# ${i + 1}. ${titulo}\n\n${explicacion}\n\n## Para conversar en familia\n\n${pregunta}\n\n## Para hacer\n\nEscribí en tu cuaderno una cosa concreta que vas a hacer esta semana para vivir este mandamiento.`)
  )
);

// ── 3. Los siete sacramentos ────────────────────────────────────────────────────────────────────
const SACRAMENTOS: [string, string, string][] = [
  ["Bautismo", "Nos hace hijos de Dios y miembros de la Iglesia, y nos libra del pecado original. Es la puerta de todos los sacramentos.", "Agua y las palabras «Yo te bautizo en el nombre del Padre, y del Hijo, y del Espíritu Santo»."],
  ["Confirmación", "Nos da la plenitud del Espíritu Santo para ser testigos valientes de Cristo.", "Unción con el santo crisma, con la imposición de manos."],
  ["Eucaristía", "Jesús mismo, realmente presente —Cuerpo, Sangre, Alma y Divinidad— bajo las apariencias del pan y del vino. Es el centro de la vida cristiana.", "Pan y vino consagrados por el sacerdote en la Misa."],
  ["Penitencia (confesión)", "Dios perdona los pecados cometidos después del Bautismo cuando nos arrepentimos y los confesamos.", "Los actos del penitente (examen, dolor, propósito, confesión y penitencia) y la absolución del sacerdote."],
  ["Unción de los enfermos", "Da fuerza, paz y consuelo al que está gravemente enfermo o es anciano, y lo une a la pasión de Cristo.", "Unción con el óleo de los enfermos y la oración del sacerdote."],
  ["Orden sacerdotal", "Consagra a los diáconos, sacerdotes y obispos para servir al pueblo de Dios en nombre de Cristo.", "Imposición de las manos del obispo y oración de consagración."],
  ["Matrimonio", "Une al hombre y a la mujer en alianza para toda la vida, y los hace colaboradores de Dios en la vida de los hijos.", "El consentimiento de los esposos delante de la Iglesia."],
];
const sacramentos = curso(
  "Los siete sacramentos",
  "Qué es cada sacramento, qué nos da y cómo se celebra: siete lecciones cortas para leer y conversar en familia.",
  20,
  SACRAMENTOS.map(([titulo, que, signo], i) =>
    leccion(`${i + 1}. ${titulo}`, "Leé la lección con un padre. Después buscá en casa una foto, una vela o un recuerdo de este sacramento y contá qué significa.", `# ${titulo}\n\n**Qué es y qué nos da:** ${que}\n\n**Cómo se celebra:** ${signo}\n\n## Para conversar en familia\n\n¿Quiénes de la familia han recibido este sacramento? ¿Qué recordamos de ese día?`)
  )
);

// ── 4. El Rosario en familia ────────────────────────────────────────────────────────────────────
const ROSARIO: [string, string, string][] = [
  ["Misterios gozosos", "lunes y sábado", "misterios-gozosos"],
  ["Misterios luminosos", "jueves", "misterios-luminosos"],
  ["Misterios dolorosos", "martes y viernes", "misterios-dolorosos"],
  ["Misterios gloriosos", "miércoles y domingo", "misterios-gloriosos"],
];
const rosario = curso(
  "El Rosario en familia",
  "Los cuatro grupos de misterios del Rosario: qué meditamos en cada uno y qué día se reza. Una decena por lección.",
  15,
  ROSARIO.map(([titulo, dias, clave]) =>
    leccion(titulo, "Recen una decena con los misterios de hoy, mirando una imagen o un crucifijo. Después cada uno cuenta con sus palabras qué se imaginó.", `# ${titulo}\n\nSe rezan los ${dias}.\n\n${texto(clave)}\n\n## Cómo rezar una decena\n\n1. Anunciar el misterio.\n2. Un Padre nuestro.\n3. Diez Ave María mientras se medita el misterio.\n4. Un Gloria.\n\n## Para conversar\n\n¿Qué escena nos conmovió más? ¿Qué le pedimos a la Virgen hoy?`)
  )
);

// ── 5. El año litúrgico ─────────────────────────────────────────────────────────────────────────
const TIEMPOS: [string, string, string][] = [
  ["Adviento", "morado", "Cuatro semanas de espera antes de Navidad. Preparamos el corazón para recibir a Jesús; solemos encender una corona con cuatro velas."],
  ["Navidad", "blanco", "Celebramos el nacimiento de Jesús, Dios hecho hombre. Dura hasta el Bautismo del Señor."],
  ["Cuaresma", "morado", "Cuarenta días para convertirnos y prepararnos para la Pascua con la oración, el ayuno y la limosna."],
  ["Pascua", "blanco", "Cincuenta días de alegría por la Resurrección de Jesús, hasta Pentecostés."],
  ["Tiempo ordinario", "verde", "El resto del año, para crecer día a día siguiendo a Jesús en su vida y enseñanzas."],
];
const liturgico = curso(
  "El año litúrgico",
  "Los tiempos de la Iglesia a lo largo del año, con su color y su sentido, para vivirlos en casa.",
  15,
  TIEMPOS.map(([titulo, color, sentido]) =>
    leccion(titulo, "Leé la lección con un padre y miren en el calendario cuándo cae este tiempo. Pinten con el color del tiempo un dibujo en el cuaderno.", `# ${titulo}\n\n**Color litúrgico:** ${color}.\n\n${sentido}\n\n## Para hacer en familia\n\nDecidan una costumbre sencilla para vivir este tiempo (una oración, un gesto de caridad, un adorno de la casa).`)
  )
);

// ── 6. Las obras de misericordia ────────────────────────────────────────────────────────────────
const CORPORALES: [string, string][] = [
  ["Dar de comer al hambriento", "Compartir comida, o juntar alimentos para quien lo necesita."],
  ["Dar de beber al sediento", "Ofrecer agua y atención al que tiene sed, en casa y fuera de ella."],
  ["Vestir al desnudo", "Separar ropa en buen estado para regalar."],
  ["Dar posada al peregrino", "Recibir con cariño a las visitas y ayudar al que llega de lejos."],
  ["Visitar a los enfermos", "Llamar o visitar a un enfermo, llevarle un dibujo o una oración."],
  ["Visitar a los presos", "Rezar por los presos y por sus familias."],
  ["Enterrar a los muertos", "Rezar por los difuntos y acompañar a la familia que los llora."],
];
const ESPIRITUALES: [string, string][] = [
  ["Enseñar al que no sabe", "Ayudar a un hermano más chico con una tarea."],
  ["Dar buen consejo al que lo necesita", "Escuchar y decir una palabra buena cuando alguien duda."],
  ["Corregir al que yerra", "Avisar con cariño y sin burla cuando alguien se equivoca."],
  ["Perdonar al que nos ofende", "Perdonar de corazón y volver a jugar juntos."],
  ["Consolar al triste", "Acompañar y abrazar al que llora."],
  ["Sufrir con paciencia los defectos del prójimo", "Aguantar con buen humor las manías de los demás."],
  ["Rogar a Dios por vivos y difuntos", "Rezar cada noche por la familia y por los que ya murieron."],
];
const misericordia = curso(
  "Las obras de misericordia",
  "Las catorce obras de misericordia, una por lección, cada una con algo concreto para hacer en la semana.",
  15,
  [
    ...CORPORALES.map(([t, hacer], i) => leccion(`Corporal ${i + 1}: ${t}`, "Leé la lección y elijan una forma concreta de vivirla esta semana. Anótenla en el cuaderno y, cuando la hagan, tilden.", `# ${t}\n\nObra de misericordia **corporal**.\n\n## Para hacer\n\n${hacer}\n\n«Cuanto hicisteis a uno de estos mis hermanos más pequeños, a mí me lo hicisteis» (Mt 25, 40).`)),
    ...ESPIRITUALES.map(([t, hacer], i) => leccion(`Espiritual ${i + 1}: ${t}`, "Leé la lección y elijan una forma concreta de vivirla esta semana. Anótenla en el cuaderno y, cuando la hagan, tilden.", `# ${t}\n\nObra de misericordia **espiritual**.\n\n## Para hacer\n\n${hacer}`)),
  ]
);


// ── 7. Examen de conciencia para chicos ─────────────────────────────────────────────────────────
const EXAMEN: [string, string[]][] = [
  ["Amarás a Dios sobre todas las cosas", ["¿Rezo por la mañana y por la noche?", "¿Me acuerdo de Dios durante el día o solo cuando necesito algo?", "¿Me porté bien en Misa o me distraje a propósito?"]],
  ["No tomarás el nombre de Dios en vano", ["¿Dije el nombre de Dios o de Jesús sin respeto o enojado?", "¿Me burlé de las cosas sagradas?"]],
  ["Santificarás las fiestas", ["¿Fui a Misa los domingos y fiestas?", "¿Hice algo para que el domingo fuera distinto de los demás días?"]],
  ["Honrarás a tu padre y a tu madre", ["¿Obedecí a mamá y a papá a la primera?", "¿Les contesté mal o con mala cara?", "¿Ayudé en casa sin que me lo pidieran?"]],
  ["No matarás", ["¿Me peleé o le pegué a alguien?", "¿Dije cosas que lastiman?", "¿Cuidé a mis hermanos y a mis animales?"]],
  ["No cometerás actos impuros", ["¿Cuidé mi cuerpo y mi mirada con modestia?", "¿Miré o escuché cosas que no debía?"]],
  ["No robarás", ["¿Me quedé con algo que no era mío?", "¿Cuidé las cosas prestadas y las devolví?", "¿Desperdicié comida o cosas?"]],
  ["No darás falso testimonio ni mentirás", ["¿Dije mentiras?", "¿Hablé mal de alguien a sus espaldas?", "¿Hice trampa en un juego o en la tarea?"]],
  ["No consentirás pensamientos ni deseos impuros", ["¿Dejé que me entraran malos pensamientos o los alimenté?", "¿Le pedí ayuda a la Virgen y a mi ángel de la guarda?"]],
  ["No codiciarás los bienes ajenos", ["¿Tuve envidia de lo que tienen otros?", "¿Fui ordenado y agradecido con lo que tengo?", "¿Compartí mis cosas?"]],
];
const examen = curso(
  "Examen de conciencia para chicos",
  "Preguntas sencillas, mandamiento por mandamiento, para prepararse a la confesión con un padre al lado.",
  15,
  [
    leccion("Antes de empezar", "Leé esto con un padre. Rezá un Padre nuestro pidiendo luz para conocer tus pecados.", "# Antes de empezar\n\nEl examen de conciencia es mirar con sinceridad cómo me porté, para pedirle perdón a Dios y mejorar.\n\n1. Rezo al Espíritu Santo o a mi ángel de la guarda pidiendo ayuda.\n2. Repaso los mandamientos con las preguntas de las lecciones siguientes.\n3. Me arrepiento de verdad y me propongo cambiar.\n4. Me confieso con el sacerdote y cumplo la penitencia.\n\n**Importante:** esto es una ayuda; si tenés dudas, el sacerdote te va a guiar."),
    ...EXAMEN.map(([titulo, preguntas], i) =>
      leccion(`${i + 1}. ${titulo}`, "Leé las preguntas con un padre, en voz baja. No hace falta contestarlas por escrito; si querés, anotá en el cuaderno lo que quieras recordar para confesarte.", `# ${i + 1}. ${titulo}\n\n${preguntas.map((p) => `- ${p}`).join("\n")}\n\n**Para pedir perdón:** Señor, perdóname por lo que no hice bien en esto, y ayudame a cambiar.`)
    ),
    leccion("Acto de contrición y propósito", "Rezá el acto de contrición despacio y elegí un solo propósito concreto para esta semana.", `# Acto de contrición\n\n${texto("acto-de-contricion").split("\n").join("\n\n")}\n\n## Mi propósito\n\nEscribí en tu cuaderno una sola cosa concreta que vas a hacer distinto esta semana.`),
  ]
);

export const BIBLIOTECA_CATOLICA: PaqueteDeBiblioteca[] = [
  { clave: "oraciones-del-cristiano", descripcion: "11 oraciones básicas para rezar, copiar y aprender de memoria.", edad: "4 a 10 años", paquete: oraciones },
  { clave: "diez-mandamientos", descripcion: "Cada mandamiento explicado para chicos, con una pregunta para conversar y una tarea para el cuaderno.", edad: "6 a 12 años", paquete: mandamientos },
  { clave: "siete-sacramentos", descripcion: "Qué es y qué nos da cada sacramento.", edad: "7 a 12 años", paquete: sacramentos },
  { clave: "rosario-en-familia", descripcion: "Los misterios gozosos, luminosos, dolorosos y gloriosos, y cómo rezar una decena.", edad: "6 a 12 años", paquete: rosario },
  { clave: "anio-liturgico", descripcion: "Adviento, Navidad, Cuaresma, Pascua y tiempo ordinario.", edad: "6 a 12 años", paquete: liturgico },
  { clave: "obras-de-misericordia", descripcion: "Las 14 obras de misericordia, cada una con algo para hacer esta semana.", edad: "6 a 12 años", paquete: misericordia },
  { clave: "examen-de-conciencia", descripcion: "Preguntas sencillas por mandamiento para prepararse a la confesión, con un padre al lado.", edad: "7 a 12 años", paquete: examen },
];

export const paqueteDeBiblioteca = (clave: string) => BIBLIOTECA_CATOLICA.find((p) => p.clave === clave) ?? null;
