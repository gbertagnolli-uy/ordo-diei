// Propio de Ordo (lane 176, L2): el catálogo de memoria católica de la casa — oraciones y listas básicas de la fe, con el texto
// tradicional en español. Es la base de «Memoria» (repetición espaciada) y de los paquetes de curso católicos (L3).
// Solo contenido de uso común y de dominio público; sin traducciones propias de la Escritura.

export type CategoriaMemoria = "oracion" | "fe" | "rosario" | "moral";
export const ETIQUETA_CATEGORIA: Record<CategoriaMemoria, string> = { oracion: "Oraciones", fe: "La fe", rosario: "El Rosario", moral: "Moral cristiana" };

export interface ItemMemoria {
  clave: string;
  categoria: CategoriaMemoria;
  titulo: string;
  texto: string;
  /** Edad orientativa desde la que se suele aprender (años) */
  desde: number;
}

const lista = (...items: string[]) => items.map((t, i) => `${i + 1}. ${t}`).join("\n");

export const CATALOGO_MEMORIA: ItemMemoria[] = [
  { clave: "senal-de-la-cruz", categoria: "oracion", titulo: "La señal de la cruz", desde: 3, texto: "Por la señal de la santa Cruz, de nuestros enemigos líbranos, Señor, Dios nuestro.\nEn el nombre del Padre, y del Hijo, y del Espíritu Santo. Amén." },
  { clave: "padre-nuestro", categoria: "oracion", titulo: "Padre nuestro", desde: 4, texto: "Padre nuestro, que estás en el cielo, santificado sea tu Nombre; venga a nosotros tu reino; hágase tu voluntad en la tierra como en el cielo.\nDanos hoy nuestro pan de cada día; perdona nuestras ofensas, como también nosotros perdonamos a los que nos ofenden; no nos dejes caer en la tentación, y líbranos del mal. Amén." },
  { clave: "ave-maria", categoria: "oracion", titulo: "Ave María", desde: 4, texto: "Dios te salve, María, llena eres de gracia, el Señor es contigo; bendita tú eres entre todas las mujeres, y bendito es el fruto de tu vientre, Jesús.\nSanta María, Madre de Dios, ruega por nosotros, pecadores, ahora y en la hora de nuestra muerte. Amén." },
  { clave: "gloria", categoria: "oracion", titulo: "Gloria al Padre", desde: 4, texto: "Gloria al Padre, y al Hijo, y al Espíritu Santo.\nComo era en el principio, ahora y siempre, y por los siglos de los siglos. Amén." },
  { clave: "angel-de-la-guarda", categoria: "oracion", titulo: "Ángel de mi guarda", desde: 4, texto: "Ángel de mi guarda, dulce compañía, no me desampares ni de noche ni de día; no me dejes solo, que me perdería. Amén." },
  { clave: "bendicion-de-la-mesa", categoria: "oracion", titulo: "Bendición de la mesa", desde: 4, texto: "Bendícenos, Señor, y bendice estos alimentos que vamos a tomar, por Cristo nuestro Señor. Amén." },
  { clave: "accion-de-gracias-mesa", categoria: "oracion", titulo: "Acción de gracias después de comer", desde: 5, texto: "Te damos gracias, Señor, por estos alimentos y por todos tus beneficios, tú que vives y reinas por los siglos de los siglos. Amén." },
  { clave: "credo-apostolico", categoria: "oracion", titulo: "El Credo (de los Apóstoles)", desde: 6, texto: "Creo en Dios, Padre todopoderoso, Creador del cielo y de la tierra.\nCreo en Jesucristo, su único Hijo, Nuestro Señor, que fue concebido por obra y gracia del Espíritu Santo, nació de Santa María Virgen, padeció bajo el poder de Poncio Pilato, fue crucificado, muerto y sepultado, descendió a los infiernos, al tercer día resucitó de entre los muertos, subió a los cielos y está sentado a la derecha de Dios, Padre todopoderoso. Desde allí ha de venir a juzgar a vivos y muertos.\nCreo en el Espíritu Santo, la santa Iglesia católica, la comunión de los santos, el perdón de los pecados, la resurrección de la carne y la vida eterna. Amén." },
  { clave: "acto-de-contricion", categoria: "oracion", titulo: "Acto de contrición", desde: 7, texto: "Señor mío, Jesucristo, Dios y Hombre verdadero, Creador, Padre y Redentor mío, por ser Tú quien eres, Bondad infinita, y porque te amo sobre todas las cosas, me pesa de todo corazón haberte ofendido; también me pesa que puedes castigarme con las penas del infierno. Ayudado de tu divina gracia, propongo firmemente nunca más pecar, confesarme y cumplir la penitencia que me fuere impuesta. Amén." },
  { clave: "salve", categoria: "oracion", titulo: "La Salve", desde: 7, texto: "Dios te salve, Reina y Madre de misericordia, vida, dulzura y esperanza nuestra; Dios te salve.\nA ti llamamos los desterrados hijos de Eva; a ti suspiramos, gimiendo y llorando en este valle de lágrimas.\nEa, pues, Señora, abogada nuestra, vuelve a nosotros esos tus ojos misericordiosos; y después de este destierro muéstranos a Jesús, fruto bendito de tu vientre.\n¡Oh clementísima, oh piadosa, oh dulce Virgen María!\nRuega por nosotros, Santa Madre de Dios, para que seamos dignos de alcanzar las promesas de Nuestro Señor Jesucristo. Amén." },
  { clave: "angelus", categoria: "oracion", titulo: "El Ángelus", desde: 8, texto: "V. El Ángel del Señor anunció a María.\nR. Y concibió por obra del Espíritu Santo.\n(Dios te salve, María…)\nV. He aquí la esclava del Señor.\nR. Hágase en mí según tu palabra.\n(Dios te salve, María…)\nV. Y el Verbo se hizo carne.\nR. Y habitó entre nosotros.\n(Dios te salve, María…)\nV. Ruega por nosotros, santa Madre de Dios.\nR. Para que seamos dignos de alcanzar las promesas de nuestro Señor Jesucristo.\nOremos: Derrama, Señor, tu gracia en nuestros corazones, para que quienes, por el anuncio del Ángel, hemos conocido la encarnación de Cristo, tu Hijo, lleguemos, por su pasión y su cruz, a la gloria de la resurrección. Por el mismo Cristo nuestro Señor. Amén." },
  { clave: "san-miguel", categoria: "oracion", titulo: "Oración a San Miguel Arcángel", desde: 8, texto: "San Miguel Arcángel, defiéndenos en la lucha, sé nuestro amparo contra la perversidad y las asechanzas del demonio.\nReprímale Dios, pedimos suplicantes, y tú, Príncipe de la milicia celestial, con el poder que Dios te ha conferido, arroja al infierno a Satanás y a los demás espíritus malignos que andan por el mundo para la perdición de las almas. Amén." },

  { clave: "mandamientos", categoria: "moral", titulo: "Los diez mandamientos", desde: 6, texto: lista("Amarás a Dios sobre todas las cosas.", "No tomarás el nombre de Dios en vano.", "Santificarás las fiestas.", "Honrarás a tu padre y a tu madre.", "No matarás.", "No cometerás actos impuros.", "No robarás.", "No darás falso testimonio ni mentirás.", "No consentirás pensamientos ni deseos impuros.", "No codiciarás los bienes ajenos.") },
  { clave: "mandamientos-iglesia", categoria: "moral", titulo: "Los cinco mandamientos de la Iglesia", desde: 8, texto: lista("Oír misa entera los domingos y fiestas de guardar.", "Confesar los pecados mortales al menos una vez al año.", "Comulgar al menos por Pascua de Resurrección.", "Ayunar y abstenerse de carne cuando lo manda la santa Madre Iglesia.", "Ayudar a la Iglesia en sus necesidades.") },
  { clave: "obras-misericordia-corporales", categoria: "moral", titulo: "Las obras de misericordia corporales", desde: 7, texto: lista("Dar de comer al hambriento.", "Dar de beber al sediento.", "Vestir al desnudo.", "Dar posada al peregrino.", "Visitar a los enfermos.", "Visitar a los presos.", "Enterrar a los muertos.") },
  { clave: "obras-misericordia-espirituales", categoria: "moral", titulo: "Las obras de misericordia espirituales", desde: 8, texto: lista("Enseñar al que no sabe.", "Dar buen consejo al que lo necesita.", "Corregir al que yerra.", "Perdonar al que nos ofende.", "Consolar al triste.", "Sufrir con paciencia los defectos del prójimo.", "Rogar a Dios por vivos y difuntos.") },
  { clave: "pecados-capitales", categoria: "moral", titulo: "Los siete pecados capitales", desde: 8, texto: lista("Soberbia.", "Avaricia.", "Lujuria.", "Ira.", "Gula.", "Envidia.", "Pereza.") },

  { clave: "sacramentos", categoria: "fe", titulo: "Los siete sacramentos", desde: 6, texto: lista("Bautismo.", "Confirmación.", "Eucaristía.", "Penitencia.", "Unción de los enfermos.", "Orden sacerdotal.", "Matrimonio.") },
  { clave: "virtudes-teologales", categoria: "fe", titulo: "Las tres virtudes teologales", desde: 6, texto: lista("Fe.", "Esperanza.", "Caridad.") },
  { clave: "virtudes-cardinales", categoria: "fe", titulo: "Las cuatro virtudes cardinales", desde: 8, texto: lista("Prudencia.", "Justicia.", "Fortaleza.", "Templanza.") },
  { clave: "dones-espiritu-santo", categoria: "fe", titulo: "Los siete dones del Espíritu Santo", desde: 9, texto: lista("Sabiduría.", "Entendimiento.", "Consejo.", "Fortaleza.", "Ciencia.", "Piedad.", "Temor de Dios.") },
  { clave: "frutos-espiritu-santo", categoria: "fe", titulo: "Los doce frutos del Espíritu Santo", desde: 10, texto: lista("Caridad.", "Gozo.", "Paz.", "Paciencia.", "Longanimidad.", "Bondad.", "Benignidad.", "Mansedumbre.", "Fe.", "Modestia.", "Continencia.", "Castidad.") },

  { clave: "misterios-gozosos", categoria: "rosario", titulo: "Misterios gozosos (lunes y sábado)", desde: 6, texto: lista("La Anunciación del Ángel a María.", "La Visitación de María a su prima Isabel.", "El Nacimiento de Jesús en Belén.", "La Presentación del Niño en el Templo.", "El Niño perdido y hallado en el Templo.") },
  { clave: "misterios-luminosos", categoria: "rosario", titulo: "Misterios luminosos (jueves)", desde: 7, texto: lista("El Bautismo de Jesús en el Jordán.", "Las bodas de Caná.", "El anuncio del Reino de Dios.", "La Transfiguración.", "La institución de la Eucaristía.") },
  { clave: "misterios-dolorosos", categoria: "rosario", titulo: "Misterios dolorosos (martes y viernes)", desde: 6, texto: lista("La oración de Jesús en el Huerto.", "La flagelación del Señor.", "La coronación de espinas.", "Jesús con la cruz a cuestas.", "La crucifixión y muerte de Jesús.") },
  { clave: "misterios-gloriosos", categoria: "rosario", titulo: "Misterios gloriosos (miércoles y domingo)", desde: 6, texto: lista("La Resurrección del Señor.", "La Ascensión del Señor al cielo.", "La venida del Espíritu Santo.", "La Asunción de María al cielo.", "La coronación de María como Reina del cielo y de la tierra.") },
];

export const CLAVES_MEMORIA = new Set(CATALOGO_MEMORIA.map((i) => i.clave));
export const itemDeCatalogo = (clave: string) => CATALOGO_MEMORIA.find((i) => i.clave === clave) ?? null;

export function porCategoria(): { categoria: CategoriaMemoria; etiqueta: string; items: ItemMemoria[] }[] {
  return (Object.keys(ETIQUETA_CATEGORIA) as CategoriaMemoria[]).map((categoria) => ({ categoria, etiqueta: ETIQUETA_CATEGORIA[categoria], items: CATALOGO_MEMORIA.filter((i) => i.categoria === categoria) }));
}

/** Primeras palabras de cada línea: la pista para quien está aprendiendo */
export function pista(texto: string): string {
  return texto
    .split("\n")
    .map((l) => l.replace(/^\d+\.\s*/, "").split(/\s+/).slice(0, 2).join(" ") + "…")
    .join("\n");
}
