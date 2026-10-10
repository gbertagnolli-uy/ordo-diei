import fs from "node:fs";
import path from "node:path";

interface CartaCatalogo {
  clave: string;
  nombre: string;
  subtitulo?: string;
  categoria: "Santo";
  rareza: "Comun" | "Buena" | "Perfecta" | "Celestial";
  celebracion: string;
  historia: string;
  oracion: string;
  frase: string;
  fraseAutor: string;
  datasheet: Array<{ etiqueta: string; valor: string }>;
  imagenes: { [grado: string]: string };
  creditoImagen: string;
}

const conservadosRaw = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "santos-conservados.tmp.json"), "utf-8")
);

const nuevosSantos: CartaCatalogo[] = [
  {
    clave: "san-andres-apostol",
    nombre: "San Andrés Apóstol",
    subtitulo: "El Primer Llamado (Protokletos) y Hermano de Pedro",
    categoria: "Santo",
    rareza: "Perfecta",
    celebracion: "11-30",
    historia:
      "San Andrés, pescador de Betsaida en Galilea y hermano de Simón Pedro, fue primeramente discípulo de San Juan Bautista. Cuando el Precursor señaló a Jesús diciendo «He aquí el Cordero de Dios», Andrés siguió inmediatamente al Maestro. Lleno de gozo, buscó a su hermano Pedro y le anunció: «Hemos encontrado al Mesías», conduciéndolo a Jesús.\n\nTras Pentecostés, predicó con ardiente celo en Grecia y las regiones del Mar Negro. En Patras fue condenado al martirio en una cruz en forma de X (cruz aspada); al ver la cruz a lo lejos, la saludó con veneración: «¡Oh cruz buena, tanto tiempo deseada y ahora preparada para mi alma ansiosa!», predicando sobre ella durante dos días hasta expirar.",
    oracion:
      "Dios todopoderoso, que concediste a tu Apóstol San Andrés ser predicador y pastor de tu Iglesia, concédenos que interceda siempre por nosotros ante tu divino acatamiento.",
    frase: "Hemos encontrado al Mesías (que significa el Cristo).",
    fraseAutor: "San Andrés Apóstol (Jn 1, 41)",
    datasheet: [
      { etiqueta: "Oficio y título", valor: "Apóstol del Señor y Protokletos (Primer Llamado)" },
      { etiqueta: "Lugar de origen", valor: "Betsaida, Galilea" },
      { etiqueta: "Símbolo sagrado", valor: "La cruz en forma de aspa (Cruz de San Andrés)" },
      { etiqueta: "Corona martirial", valor: "Martirio en Patras de Acaya (Grecia)" },
    ],
    imagenes: { "1": "/cartas/san-andres-apostol/1.webp" },
    creditoImagen: "Dominio público / Arte sacro tradicional",
  },
  {
    clave: "santiago-el-mayor",
    nombre: "Santiago el Mayor",
    subtitulo: "Hijo del Trueno, Apóstol y Patrono de España",
    categoria: "Santo",
    rareza: "Perfecta",
    celebracion: "07-25",
    historia:
      "Santiago, hijo de Zebedeo y hermano de San Juan Evangelista, era pescador en el lago de Genesaret cuando Jesús lo llamó junto a la barca de su padre. Junto a Pedro y Juan formó el círculo más íntimo del Señor, presenciando la resurrección de la hija de Jairo, la sublime Transfiguración en el Monte Tabor y la agonía en Getsemaní.\n\nLlevó el Evangelio hasta los confines de Hispania. De regreso en Jerusalén bajo el mandato de Herodes Agripa, fue el primer apóstol en derramar su sangre por Cristo al ser decapitado hacia el año 44 d.C. Su sepulcro en Santiago de Compostela es faro inmemorial de peregrinación cristiana.",
    oracion:
      "Dios todopoderoso y eterno, que consagraste las primicias de los trabajos de tus apóstoles con la sangre de Santiago, concede a tu Iglesia ser fortalecida por su testimonio y protegida por su intercesión.",
    frase: "Podemos beber el cáliz que Tú has de beber.",
    fraseAutor: "Santiago y Juan ante el Señor (Mc 10, 39)",
    datasheet: [
      { etiqueta: "Dignidad apostólica", valor: "Primer mártir del Colegio Apostólico" },
      { etiqueta: "Sobrenombre evangélico", valor: "Boanerges (Hijo del Trueno)" },
      { etiqueta: "Sepulcro santo", valor: "Catedral de Santiago de Compostela, Galicia" },
      { etiqueta: "Patronazgo", valor: "España, los peregrinos y los caballeros" },
    ],
    imagenes: { "1": "/cartas/santiago-el-mayor/1.webp" },
    creditoImagen: "Dominio público / Arte sacro tradicional",
  },
  {
    clave: "santo-tomas-apostol",
    nombre: "Santo Tomás Apóstol",
    subtitulo: "Apóstol de la Confesión de Fe Pascual",
    categoria: "Santo",
    rareza: "Buena",
    celebracion: "07-03",
    historia:
      "Santo Tomás, llamado el Mellizo (Dídimo), se distinguió por su fidelidad generosa y valiente hacia Cristo. Aunque al principio dudó del testimonio de los otros apóstoles sobre la Resurrección, su posterior encuentro con Cristo glorioso transformó su aparente vacilación en la proclamación teológica más excelsa de la divinidad de Jesús: «¡Señor mío y Dios mío!».\n\nSegún la venerable tradición eclesial, partió hacia Oriente predicando el Evangelio en Partia y en la India, donde fundó pujantes comunidades cristianas en la costa de Malabar y selló su apostolado con la lanza del martirio en Mylapore.",
    oracion:
      "Concédenos, Señor, gloriarnos en la festividad de tu apóstol Tomás, para que seamos siempre sostenidos por su patrocinio e imitemos su ardiente fe.",
    frase: "¡Señor mío y Dios mío!",
    fraseAutor: "Santo Tomás Apóstol (Jn 20, 28)",
    datasheet: [
      { etiqueta: "Título espiritual", valor: "Apóstol de la fe viva y misionero de Oriente" },
      { etiqueta: "Confesión pascual", valor: "Palpó las llagas de Cristo y confesó su divinidad" },
      { etiqueta: "Tierra de misión", valor: "Mesopotamia y la costa de Malabar (India)" },
      { etiqueta: "Símbolo tradicional", valor: "La escuadra de arquitecto y la lanza del martirio" },
    ],
    imagenes: { "1": "/cartas/santo-tomas-apostol/1.webp" },
    creditoImagen: "Dominio público / Arte sacro tradicional",
  },
  {
    clave: "santiago-el-menor",
    nombre: "Santiago el Menor",
    subtitulo: "Apóstol y Primer Obispo de Jerusalén",
    categoria: "Santo",
    rareza: "Buena",
    celebracion: "05-03",
    historia:
      "Santiago el Menor, hijo de Alfeo y pariente del Señor, presidió como primer obispo la Iglesia Madre de Jerusalén. Reconocido por todos por su austeridad admirable, su continua plegaria de rodillas en el Templo y su sabiduría venerable, jugó un papel decisivo en el Concilio de Jerusalén afirmando la libertad evangélica.\n\nEscribió la epístola católica del Nuevo Testamento que proclama con vigor que «la fe sin obras está muerta». Consumó su vida santa siendo arrojado desde el pináculo del Templo y rematado con la maza de un batanero hacia el año 62 d.C.",
    oracion:
      "Dios nuestro, que nos alegras en la festividad anual de tus apóstoles Felipe y Santiago, concédenos ser partícipes de la pasión y resurrección de tu Unigénito.",
    frase: "La fe sin obras está completamente muerta en sí misma.",
    fraseAutor: "Santiago el Menor (Sant 2, 17)",
    datasheet: [
      { etiqueta: "Oficio sagrado", valor: "Primer Obispo de la Iglesia de Jerusalén" },
      { etiqueta: "Escrito canónico", valor: "Epístola universal de Santiago" },
      { etiqueta: "Virtud insigne", valor: "Rectitud, oración incesante y justicia evangélica" },
      { etiqueta: "Corona martirial", valor: "Precipitado del Templo de Jerusalén" },
    ],
    imagenes: { "1": "/cartas/santiago-el-menor/1.webp" },
    creditoImagen: "Dominio público / Arte sacro tradicional",
  },
  {
    clave: "san-felipe-apostol",
    nombre: "San Felipe Apóstol",
    subtitulo: "Apóstol de Betsaida y Buscador del Padre",
    categoria: "Santo",
    rareza: "Buena",
    celebracion: "05-03",
    historia:
      "Oriundo de Betsaida al igual que Pedro y Andrés, San Felipe fue llamado directamente por el Redentor al día siguiente con las breves y poderosas palabras: «Sígueme». Lleno de celo apostólico, encontró a Natanael (Bartolomé) y superó sus dudas con una sencilla invitación: «Ven y lo verás».\n\nEn la Última Cena, suplicó a Cristo con ternura: «Señor, muéstranos al Padre y eso nos basta», recibiendo la revelación fundamental: «El que me ha visto a mí, ha visto al Padre». Predicó con gran fruto en Frigia y sufrió el martirio crucificado en Hierápolis.",
    oracion:
      "Señor, que concediste a San Felipe conocerte y anunciar tu Reino, concédenos contemplar tu rostro santo y manifestar tu bondad a los hombres.",
    frase: "Ven y lo verás.",
    fraseAutor: "San Felipe Apóstol (Jn 1, 46)",
    datasheet: [
      { etiqueta: "Origen evangélico", valor: "Betsaida, Galilea" },
      { etiqueta: "Pregunta célebre", valor: "«Señor, muéstranos al Padre y nos basta» (Jn 14, 8)" },
      { etiqueta: "Misión apostólica", valor: "Asia Menor y Frigia" },
      { etiqueta: "Lugar de martirio", valor: "Hierápolis de Frigia" },
    ],
    imagenes: { "1": "/cartas/san-felipe-apostol/1.webp" },
    creditoImagen: "Dominio público / Arte sacro tradicional",
  },
  {
    clave: "san-bartolome-apostol",
    nombre: "San Bartolomé Apóstol",
    subtitulo: "Israelita sin Doblez y Mártir Apóstol",
    categoria: "Santo",
    rareza: "Buena",
    celebracion: "08-24",
    historia:
      "Identificado en los Evangelios con Natanael de Caná de Galilea, fue presentado a Jesús por San Felipe. Al verlo aproximarse, el divino Salvador pronunció sobre él el elogio supremo: «He aquí un verdadero israelita en quien no hay doblez». Admirado al saberse conocido antes bajo la higuera, confesó: «Rabbí, ¡Tú eres el Hijo de Dios, Tú eres el Rey de Israel!».\n\nLlevó el Evangelio de Jesucristo hasta Armenia y la India occidental. En Albanópolis de Armenia sufrió uno de los martirios más crueles de la antigüedad al ser desollado vivo por confesar la fe en Cristo, perseverando en alabanzas hasta el último aliento.",
    oracion:
      "Fortalece en nosotros, Señor, la fe viva con que el apóstol San Bartolomé se unió de corazón a tu Hijo, y concédenos que por sus oraciones tu Iglesia sea en el mundo sacramento de salvación.",
    frase: "Rabbí, Tú eres el Hijo de Dios, Tú eres el Rey de Israel.",
    fraseAutor: "San Bartolomé Apóstol (Jn 1, 49)",
    datasheet: [
      { etiqueta: "Elogio de Cristo", valor: "«Un verdadero israelita en quien no hay engaño» (Jn 1, 47)" },
      { etiqueta: "Tierra natal", valor: "Caná de Galilea" },
      { etiqueta: "Misión lejana", valor: "Armenia, Mesopotamia y la India" },
      { etiqueta: "Símbolo tradicional", valor: "Cuchillo de desollar y piel de mártir" },
    ],
    imagenes: { "1": "/cartas/san-bartolome-apostol/1.webp" },
    creditoImagen: "Dominio público / Arte sacro tradicional",
  },
  {
    clave: "san-mateo-apostol",
    nombre: "San Mateo Apóstol y Evangelista",
    subtitulo: "El Publicano Convertido y Evangelista del Rey Mesías",
    categoria: "Santo",
    rareza: "Buena",
    celebracion: "09-21",
    historia:
      "Llamado Leví, era recaudador de tributos para los romanos en Cafarnaúm cuando Jesús pasó junto a su mesa de cobranza y le dijo: «Sígueme». Mateo dejó al instante riquezas y seguridades mundanas para consagrarse plenamente al Señor, celebrando su vocación con un gran banquete en su casa.\n\nEscribió el primer Evangelio canónico, dirigido especialmente a los hebreos para demostrar con profecías irrefutables que Jesús de Nazaret es el Mesías prometido a la estirpe de David. Murió mártir anunciando el Reino en Etiopía.",
    oracion:
      "Dios de bondad infinita, que por tu Hijo llamaste al publicano Mateo a ser apóstol y evangelista, concédenos por su ejemplo e intercesión responder con prontitud a tu gracia.",
    frase: "Misericordia quiero y no sacrificios; porque no he venido a llamar a justos, sino a pecadores.",
    fraseAutor: "Evangelio según San Mateo (Mt 9, 13)",
    datasheet: [
      { etiqueta: "Vocación original", valor: "Recaudador de impuestos en Cafarnaúm" },
      { etiqueta: "Escrito sagrado", valor: "Primer Evangelio del Nuevo Testamento" },
      { etiqueta: "Símbolo tradicional", valor: "El Hombre alado o Ángel del Tetramorfo" },
      { etiqueta: "Patronazgo", valor: "Contadores, aduaneros y trabajadores financieros" },
    ],
    imagenes: { "1": "/cartas/san-mateo-apostol/1.webp" },
    creditoImagen: "Dominio público / Arte sacro tradicional",
  },
  {
    clave: "san-simon-apostol",
    nombre: "San Simón Apóstol",
    subtitulo: "El Zelote y Apóstol Ferviente de Cristo",
    categoria: "Santo",
    rareza: "Buena",
    celebracion: "10-28",
    historia:
      "Llamado el Zelote o el Cananeo por su ardoroso celo en la observancia de la Ley divina, San Simón purificó todo apasionamiento terrenal al ser elegido por Jesús para formar parte del Colegio de los Doce Apóstoles. En el seguimiento de Cristo aprendió que el Reino de Dios no se impone con la fuerza de las armas, sino que se edifica con el amor y el sacrificio de la propia vida.\n\nPredicó con indomable valor en Egipto, Mauritania y Mesopotamia junto a San Judas Tadeo, sellando su testimonio de fe con el martirio en Persia.",
    oracion:
      "Señor Dios todopoderoso, que por tus apóstoles nos diste a conocer la gloria de tu Nombre divino, haz que por la intercesión de San Simón crezca continuamente tu Santa Iglesia.",
    frase: "Señor, ¿quién podrá resistir al celo de tu casa?",
    fraseAutor: "Sentencia patrística sobre San Simón el Zelote",
    datasheet: [
      { etiqueta: "Sobrenombre bíblico", valor: "El Zelote (el fervoroso de Dios)" },
      { etiqueta: "Virtud insigne", valor: "Celo ardiente por la verdad divina" },
      { etiqueta: "Tierra de predicación", valor: "Egipto, África del Norte y Persia" },
      { etiqueta: "Símbolo tradicional", valor: "La sierra de carpintero (instrumento del martirio)" },
    ],
    imagenes: { "1": "/cartas/san-simon-apostol/1.webp" },
    creditoImagen: "Dominio público / Arte sacro tradicional",
  },
  {
    clave: "san-judas-tadeo",
    nombre: "San Judas Tadeo Apóstol",
    subtitulo: "Apóstol Fiel y Patrono de los Casos Difíciles",
    categoria: "Santo",
    rareza: "Buena",
    celebracion: "10-28",
    historia:
      "Hermano de Santiago el Menor y pariente del Señor, Judas Tadeo fue uno de los doce apóstoles más devotos y fervientes. En la Última Cena formuló a Jesús una pregunta profunda: «Señor, ¿por qué te has de manifestar a nosotros y no al mundo?», recibiendo la promesa de la presencia íntima de la Trinidad en el alma fiel.\n\nEs autor de la Epístola de San Judas en el Nuevo Testamento, donde exhorta a luchar valientemente por la fe católica transmitida una vez a los santos. Murió mártir en Persia y es venerado universalmente como poderoso protector de quienes atraviesan causas angustiosas e imposibles.",
    oracion:
      "San Judas Tadeo, apóstol fiel de Jesucristo, acuérdate de mí en mis tribulaciones y alcánzame la ayuda oportuna en mis necesidades más difíciles.",
    frase: "Conservaos en el amor de Dios, aguardando la misericordia de nuestro Señor Jesucristo para vida eterna.",
    fraseAutor: "San Judas Tadeo (Jds 1, 21)",
    datasheet: [
      { etiqueta: "Escrito canónico", valor: "Epístola universal de San Judas" },
      { etiqueta: "Símbolos santos", valor: "Imagen de Cristo en el pecho y la maza martirial" },
      { etiqueta: "Pregunta de la Cena", valor: "«Señor, ¿cómo te manifestarás a nosotros?» (Jn 14, 22)" },
      { etiqueta: "Patronazgo universal", valor: "Causas difíciles, desesperadas y urgentes" },
    ],
    imagenes: { "1": "/cartas/san-judas-tadeo/1.webp" },
    creditoImagen: "Dominio público / Arte sacro tradicional",
  },
  {
    clave: "san-matias-apostol",
    nombre: "San Matías Apóstol",
    subtitulo: "Elegido para Completar el Colegio de los Doce",
    categoria: "Santo",
    rareza: "Comun",
    celebracion: "05-14",
    historia:
      "San Matías fue uno de los setenta y dos discípulos que acompañaron a Jesucristo durante todo su ministerio público, desde el bautismo de Juan hasta el día de la gloriosa Ascensión. Tras la defección de Judas Iscariote, la comunidad de Jerusalén presidida por San Pedro echó suertes en oración y el Espíritu Santo eligió a Matías para ocupar su lugar en el Colegio Apostólico.\n\nFiel testigo de la Resurrección, predicó con celo santo en Judea y tierras bárbaras, consumando su vida por amor a su Maestro divino mediante el martirio.",
    oracion:
      "Dios todopoderoso, que agregaste a San Matías al colegio de los apóstoles, concédenos por su intercesión ser contados en el número de tus elegidos.",
    frase: "Es necesario que uno de los que nos acompañaron sea con nosotros testigo de su Resurrección.",
    fraseAutor: "San Pedro Apóstol en los Hechos (Hch 1, 21-22)",
    datasheet: [
      { etiqueta: "Elección providencial", valor: "Elegido por suertes tras la oración de la Iglesia naciente" },
      { etiqueta: "Condición apostólica", valor: "Testigo presencial de Cristo desde el Jordán a la Ascensión" },
      { etiqueta: "Lugar bíblico", valor: "Cenáculo de Jerusalén (Hch 1, 26)" },
      { etiqueta: "Símbolo tradicional", valor: "Hacha o alabarda del martirio" },
    ],
    imagenes: { "1": "/cartas/san-matias-apostol/1.webp" },
    creditoImagen: "Dominio público / Arte sacro tradicional",
  },
  {
    clave: "san-bernabe-apostol",
    nombre: "San Bernabé Apóstol",
    subtitulo: "Hijo de la Consolación y Apóstol de las Gentes",
    categoria: "Santo",
    rareza: "Comun",
    celebracion: "06-11",
    historia:
      "José, levita oriundo de Chipre a quien los apóstoles llamaron Bernabé (que significa «hijo de la consolación»), vendió un campo que poseía y puso el dinero a los pies de los apóstoles en señal de generosidad suprema. Fue él quien con generosa prudencia acogió al recién convertido Saulo de Tarso y lo presentó a la comunidad de Jerusalén.\n\nLleno del Espíritu Santo y de fe, fue enviado a la pujante comunidad de Antioquía, donde los discípulos comenzaron a llamarse cristianos por primera vez. Acompañó a Pablo en su primer viaje misionero y coronó su vida santa con el martirio en Salamina de Chipre.",
    oracion:
      "Señor Dios, que ordenaste que San Bernabé, lleno de fe y del Espíritu Santo, fuera destinado a iluminar a los pueblos paganos, concede que anunciemos siempre el Evangelio con valentía.",
    frase: "Era un hombre bueno, lleno del Espíritu Santo y de fe.",
    fraseAutor: "Hechos de los Apóstoles (Hch 11, 24)",
    datasheet: [
      { etiqueta: "Significado de su nombre", valor: "Hijo de la consolación y del aliento" },
      { etiqueta: "Tierra de origen", valor: "Isla de Chipre" },
      { etiqueta: "Misión histórica", valor: "Compañero apostólico de San Pablo y mentor en Antioquía" },
      { etiqueta: "Lugar de martirio", valor: "Salamina de Chipre" },
    ],
    imagenes: { "1": "/cartas/san-bernabe-apostol/1.webp" },
    creditoImagen: "Dominio público / Arte sacro tradicional",
  },
  {
    clave: "san-lucas-evangelista",
    nombre: "San Lucas Evangelista",
    subtitulo: "El Médico Querido y Evangelista de la Misericordia",
    categoria: "Santo",
    rareza: "Buena",
    celebracion: "10-18",
    historia:
      "San Lucas, médico de profesión y hombre de fina cultura de Antioquía de Siria, se convirtió a la fe cristiana y fue el fiel compañero de viajes y sufrimientos de San Pablo hasta su martirio romano («Sólo Lucas está conmigo»). Movido por el Espíritu Santo, investigó diligentemente todo desde los orígenes para escribir con exquisita delicadeza el tercer Evangelio y el libro de los Hechos de los Apóstoles.\n\nSu Evangelio es célebre como el Evangelio de la Misericordia (las parábolas del Hijo Pródigo y del Buen Samaritano) y el Evangelio de María, custodiando para la eternidad los sublimes cánticos del Magníficat, el Benedictus y el Nunc Dimittis. La tradición le atribuye también el haber pintado el primer icono de la Virgen con el Niño.",
    oracion:
      "Señor Dios, que elegiste a San Lucas para revelar por medio de su palabra y predicación el misterio de tu predilección hacia los pobres, concede a los que creemos en tu Nombre tener un solo corazón y una sola alma.",
    frase: "Habrá más alegría en el cielo por un solo pecador que se convierta que por noventa y nueve justos que no necesitan conversión.",
    fraseAutor: "Evangelio según San Lucas (Lc 15, 7)",
    datasheet: [
      { etiqueta: "Profesión original", valor: "Médico helenista y cronista fiel" },
      { etiqueta: "Obras sagradas", valor: "El Evangelio según San Lucas y los Hechos de los Apóstoles" },
      { etiqueta: "Símbolo tradicional", valor: "El Buey o Toro alado del Tetramorfo" },
      { etiqueta: "Patronazgo", valor: "Médicos, cirujanos, artistas y pintores" },
    ],
    imagenes: { "1": "/cartas/san-lucas-evangelista/1.webp" },
    creditoImagen: "Dominio público / Arte sacro tradicional",
  },
  {
    clave: "san-marcos-evangelista",
    nombre: "San Marcos Evangelista",
    subtitulo: "Evangelista del León Alado y Discípulo de Pedro",
    categoria: "Santo",
    rareza: "Buena",
    celebracion: "04-25",
    historia:
      "Juan Marcos, en cuya casa materna de Jerusalén se reunía la primera comunidad cristiana para orar, fue discípulo y estrecho colaborador de San Pedro, quien lo llamaba con paternal afecto «mi hijo Marcos». Conforme a la venerable tradición recogida por los Padres de la Iglesia, Marcos recogió en su Evangelio la predicación viva y testimonial de San Pedro dirigida a los cristianos de Roma.\n\nSu texto, el más breve y directo de los cuatro, presenta a Jesús con dinamismo y majestad como el Hijo de Dios victorioso sobre las potencias del mal. Fundó la gloriosa Iglesia de Alejandría de Egipto, donde coronó su vida con la palma del martirio.",
    oracion:
      "Dios nuestro, que ensalzaste a San Marcos Evangelista con la gracia de la predicación evangélica, concédenos aprovechar de tal manera sus enseñanzas que sigamos fielmente las huellas de Cristo.",
    frase: "El tiempo se ha cumplido y el Reino de Dios está cerca; convertíos y creed en el Evangelio.",
    fraseAutor: "Evangelio según San Marcos (Mc 1, 15)",
    datasheet: [
      { etiqueta: "Vínculo sagrado", valor: "Intérprete y amado discípulo de San Pedro Apóstol" },
      { etiqueta: "Obra inspirada", valor: "Segundo Evangelio del Nuevo Testamento" },
      { etiqueta: "Símbolo tradicional", valor: "El León alado del Tetramorfo" },
      { etiqueta: "Sede patriarcal", valor: "Fundador de la Iglesia de Alejandría y patrono de Venecia" },
    ],
    imagenes: { "1": "/cartas/san-marcos-evangelista/1.webp" },
    creditoImagen: "Dominio público / Arte sacro tradicional",
  },
  {
    clave: "san-esteban-protomartir",
    nombre: "San Esteban Protomártir",
    subtitulo: "El Primer Mártir de Cristo y Diácono Santo",
    categoria: "Santo",
    rareza: "Perfecta",
    celebracion: "12-26",
    historia:
      "San Esteban, hombre lleno de fe, de sabiduría y del Espíritu Santo, fue el primero de los siete diáconos elegidos por los Apóstoles para servir a la caridad de la Iglesia naciente en Jerusalén. Conmovía a los corazones realizando grandes prodigios y proclamando la verdad con una sabiduría que nadie lograba refutar.\n\nLlevado ante el Sanedrín, contempló los cielos abiertos y a Jesús de pie a la derecha de Dios. Al ser arrastrado fuera de la muralla para ser lapidado, oró por sus propios verdugos imitando a su Señor: «Señor, no les tomes en cuenta este pecado», abriendo la gloriosa senda de todos los mártires cristianos.",
    oracion:
      "Concédenos, Señor, imitar lo que celebramos, para que aprendamos a amar también a nuestros enemigos, pues celebramos la fiesta de aquel que supo rogar por sus propios perseguidores.",
    frase: "Veo los cielos abiertos y al Hijo del Hombre de pie a la derecha de Dios.",
    fraseAutor: "San Esteban Protomártir (Hch 7, 56)",
    datasheet: [
      { etiqueta: "Dignidad histórica", valor: "Protomártir de la Iglesia universal" },
      { etiqueta: "Orden sagrado", valor: "Primer diácono del Colegio Apostólico" },
      { etiqueta: "Oración final", valor: "«Señor Jesús, recibe mi espíritu; no les imputes este pecado»" },
      { etiqueta: "Símbolo tradicional", valor: "Las piedras de la lapidación y la palma martirial" },
    ],
    imagenes: { "1": "/cartas/san-esteban-protomartir/1.webp" },
    creditoImagen: "Dominio público / Arte sacro tradicional",
  },
  {
    clave: "san-lorenzo-martir",
    nombre: "San Lorenzo Mártir",
    subtitulo: "Diácono de Roma y Custodio de los Pobres",
    categoria: "Santo",
    rareza: "Buena",
    celebracion: "08-10",
    historia:
      "San Lorenzo, arcediano del Papa San Sixto II en la Roma del siglo III, tenía bajo su cuidado la administración de los bienes eclesiales y la asistencia a los pobres y desamparados. Durante la feroz persecución del emperador Valeriano, cuando el prefecto romano le exigió entregar todos los tesoros de la Iglesia, Lorenzo reunió a los ciegos, cojos, viudas y huérfanos, y presentándolos ante el tirano exclamó: «He aquí los verdaderos tesoros de la Iglesia».\n\nCondenado a sufrir un martirio espantoso sobre una parrilla ardiente, mantuvo una serenidad y un gozo sobrenaturales tan asombrosos que con santa ironía dijo a sus verdugos: «De este lado ya está asado; denme vuelta y coman». Su sangre convirtió a innumerables senadores y encendió la fe de Roma.",
    oracion:
      "Dios todopoderoso, que concediste a San Lorenzo vencer el fuego de los tormentos con el fuego celestial de tu caridad, concédenos extinguir en nosotros las llamas del pecado.",
    frase: "Los tesoros de la Iglesia son los pobres y los necesitados a quienes Cristo socorre.",
    fraseAutor: "San Lorenzo ante el prefecto de Roma",
    datasheet: [
      { etiqueta: "Ministerio sagrado", valor: "Archidiácono de la Iglesia de Roma" },
      { etiqueta: "Instrumento del martirio", valor: "La parrilla de hierro al rojo vivo" },
      { etiqueta: "Fecha martirial", valor: "10 de agosto del 258 d.C., Vía Tiburtina" },
      { etiqueta: "Patronazgo", valor: "Diáconos, bibliotecarios, cocineros y pobres" },
    ],
    imagenes: { "1": "/cartas/san-lorenzo-martir/1.webp" },
    creditoImagen: "Dominio público / Arte sacro tradicional",
  },
  {
    clave: "san-vicente-martir",
    nombre: "San Vicente Diácono y Mártir",
    subtitulo: "Diácono de Zaragoza e Invencible Mártir",
    categoria: "Santo",
    rareza: "Comun",
    celebracion: "01-22",
    historia:
      "San Vicente, natural de Huesca y diácono del obispo San Valero en Zaragoza, asumió con intachable elocuencia la predicación de la fe ante las autoridades romanas durante la persecución de Diocleciano. Conducido a Valencia por orden del cruel gobernador Daciano, soportó tormentos inauditos en el potro, las uñas de garfios y el lecho de fuego sin pronunciar queja alguna, con una sonrisa serena que desesperaba a sus torturadores.\n\nSan Agustín predicó sermones célebres ensalzando cómo la carne de Vicente sufría pero el Espíritu de Dios vencía victoriosamente en él. Su nombre, que significa «vencedor», es timbre de gloria de la cristiandad hispana y universal.",
    oracion:
      "Dios todopoderoso y eterno, infunde tu Espíritu Santo para que nuestros corazones ardan con aquel amor divino que concedió al mártir San Vicente superar todos los suplicios de su carne.",
    frase: "Mi fe no teme a los tormentos ni la muerte; cuanto más sufra por Cristo, mayor será mi corona en el Cielo.",
    fraseAutor: "San Vicente Mártir ante el procónsul Daciano",
    datasheet: [
      { etiqueta: "Oficio eclesiástico", valor: "Diácono de la Iglesia de Zaragoza" },
      { etiqueta: "Significado de su nombre", valor: "El que vence (Victoriosus)" },
      { etiqueta: "Lugar de martirio", valor: "Valencia (Hispania romana, año 304 d.C.)" },
      { etiqueta: "Elogio patrístico", valor: "Sermones solemnes de San Agustín de Hipona" },
    ],
    imagenes: { "1": "/cartas/san-vicente-martir/1.webp" },
    creditoImagen: "Dominio público / Arte sacro tradicional",
  },
  {
    clave: "san-sebastian-martir",
    nombre: "San Sebastián Mártir",
    subtitulo: "Capitán de la Guardia Pretoriana y Mártir de Cristo",
    categoria: "Santo",
    rareza: "Buena",
    celebracion: "01-20",
    historia:
      "Nacido en Narbona y educado en Milán, San Sebastián sirvió como distinguido capitán de la primera cohorte de la guardia pretoriana en Roma bajo el emperador Diocleciano. Aprovechaba en secreto su alto rango militar para alentar en las cárceles a los cristianos vacilantes, confirmar a los confesores en la fe y socorrer a los mártires.\n\nAl descubrirse su condición cristiana, Diocleciano ordenó atarlo a un árbol y asaetearlo en el monte Palatino. Dado por muerto, fue curado milagrosamente por la santa viuda Irene; recuperadas sus fuerzas, se presentó de nuevo ante el emperador para reprocharle con santa audacia sus crímenes contra los inocentes, siendo azotado hasta morir en el circo.",
    oracion:
      "Señor, concédenos el espíritu de fortaleza, para que instruidos por el glorioso ejemplo de tu mártir San Sebastián, aprendamos a obedecerte a Ti antes que a los hombres.",
    frase: "Soy soldado de Cristo y a Él únicamente consagro mi vida y mi fidelidad suprema.",
    fraseAutor: "San Sebastián ante el emperador Diocleciano",
    datasheet: [
      { etiqueta: "Rango terrenal", valor: "Capitán de la Guardia Pretoriana de Roma" },
      { etiqueta: "Misión secreta", valor: "Consolador de los prisioneros y mártires cristianos" },
      { etiqueta: "Símbolo tradicional", valor: "El árbol y las saetas del martirio" },
      { etiqueta: "Patronazgo", valor: "Soldados, arqueros, deportistas y defensor contra pestes" },
    ],
    imagenes: { "1": "/cartas/san-sebastian-martir/1.webp" },
    creditoImagen: "Dominio público / Arte sacro tradicional",
  },
  {
    clave: "santos-cosme-y-damian",
    nombre: "Santos Cosme y Damián",
    subtitulo: "Médicos Anárgiros y Santos Mártires",
    categoria: "Santo",
    rareza: "Comun",
    celebracion: "09-26",
    historia:
      "Hermanos gemelos nacidos en Arabia y educados en Siria, Cosme y Damián ejercieron la medicina en la ciudad de Egea de Cilicia con un amor incomparable a Dios y al prójimo. Eran llamados «anárgiros» (sin dinero) porque jamás cobraron honorario alguno por sus cuidados, uniendo a la curación de los cuerpos la predicación de Cristo para sanar las almas.\n\nDurante la persecución de Diocleciano, el juez Lisias los sometió a cadenas, hogueras y tormentos marinos sin lograr quebrantar su testimonio, siendo finalmente decapitados. Su basílica en el Foro Romano atestigua la ininterrumpida devoción de la Iglesia a los santos médicos.",
    oracion:
      "Dios todopoderoso, que glorificas la memoria de tus santos mártires Cosme y Damián, concédenos por su intercesión la salud del cuerpo y la eterna salvación del alma.",
    frase: "Gratis lo habéis recibido, dadlo gratis por amor a Cristo.",
    fraseAutor: "Lema evangélico vivido por los Santos Cosme y Damián",
    datasheet: [
      { etiqueta: "Título oriental", valor: "Anárgiros (médicos que no cobran dinero)" },
      { etiqueta: "Vínculo sagrado", valor: "Hermanos gemelos y compañeros inseparables de fe" },
      { etiqueta: "Lugar de martirio", valor: "Cirro y Egea de Cilicia (Siria romana)" },
      { etiqueta: "Patronazgo", valor: "Médicos, cirujanos, farmacéuticos y boticarios" },
    ],
    imagenes: { "1": "/cartas/santos-cosme-y-damian/1.webp" },
    creditoImagen: "Dominio público / Arte sacro tradicional",
  },
  {
    clave: "san-silvestre-papa",
    nombre: "San Silvestre I Papa",
    subtitulo: "Pontífice de la Paz Constantiniana y del Concilio de Nicea",
    categoria: "Santo",
    rareza: "Comun",
    celebracion: "12-31",
    historia:
      "San Silvestre gobernó la barca de San Pedro durante veintiún años decisivos (314–335), tras el cese de las sangrientas persecuciones romanas con el Edicto de Milán del emperador Constantino el Grande. En su pontificado la Iglesia salió de las catacumbas a la luz pública, consagrándose las monumentales basílicas de San Pedro en el Vaticano, San Juan de Letrán y San Pablo Extramuros.\n\nEnvió a sus venerables legados al Concilio Ecuménico de Nicea (325), donde los Padres conciliares proclamaron solemnemente la divinidad de Jesucristo («consubstancial al Padre») contra el arrianismo, sellando el Credo que la Iglesia confiesa hasta hoy.",
    oracion:
      "Señor, protege a tu pueblo que confía en las oraciones del Papa San Silvestre, y guíalo en la verdad a través de los tiempos hasta la gloria eterna.",
    frase: "Cristo es verdadero Dios de verdadero Dios, consubstancial al Padre en la unidad del Espíritu Santo.",
    fraseAutor: "Fórmula de fe del Concilio de Nicea bajo San Silvestre",
    datasheet: [
      { etiqueta: "Sede apostólica", valor: "33º Obispo de Roma y sucesor de San Pedro" },
      { etiqueta: "Hito universal", valor: "Concilio Ecuménico de Nicea (año 325)" },
      { etiqueta: "Basílicas erigidas", valor: "San Juan de Letrán y San Pedro del Vaticano" },
      { etiqueta: "Fiesta de memoria", valor: "31 de diciembre (víspera del Año Nuevo)" },
    ],
    imagenes: { "1": "/cartas/san-silvestre-papa/1.webp" },
    creditoImagen: "Dominio público / Arte sacro tradicional",
  },
  {
    clave: "san-gregorio-magno",
    nombre: "San Gregorio Magno",
    subtitulo: "Siervo de los Siervos de Dios y Padre de la Iglesia",
    categoria: "Santo",
    rareza: "Buena",
    celebracion: "09-03",
    historia:
      "Nacido de una noble familia patricia romana, San Gregorio fue prefecto de Roma antes de renunciar a honores y riquezas para convertir su propio palacio del monte Celio en monasterio benedictino. Elegido Papa contra su propia voluntad en un tiempo de peste y ruina para Italia, demostró ser un pastor y gobernante sublime, socorriendo con caridad incansable al pueblo hambriento y defendiendo a la Iglesia con firmeza.\n\nFue el primer pontífice en titularse humildemente «Servus servorum Dei» (Siervo de los siervos de Dios). Organizó la liturgia romana, dio su nombre al insustituible canto gregoriano, envió a San Agustín de Canterbury a evangelizar a los anglosajones y legó obras espirituales cumbre como la «Regla Pastoral» y los «Diálogos».",
    oracion:
      "Dios nuestro, que cuidas de tu pueblo con bondad y lo gobiernas con amor, concede por intercesión del Papa San Gregorio el espíritu de sabiduría a quienes has confiado la guía de tu Iglesia.",
    frase: "El amor de Dios nunca está ocioso: donde existe, obra grandes cosas; y si se niega a obrar, no es amor.",
    fraseAutor: "San Gregorio Magno (Homilías sobre los Evangelios)",
    datasheet: [
      { etiqueta: "Título pontificio", valor: "Servus Servorum Dei (Siervo de los siervos de Dios)" },
      { etiqueta: "Herencia sacra", valor: "Reforma litúrgica y el Canto Gregoriano" },
      { etiqueta: "Misión continental", valor: "Evangelización de Inglaterra (San Agustín de Canterbury)" },
      { etiqueta: "Dignidad eminente", valor: "Uno de los cuatro grandes Doctores de la Iglesia latina" },
    ],
    imagenes: { "1": "/cartas/san-gregorio-magno/1.webp" },
    creditoImagen: "Dominio público / Arte sacro tradicional",
  },
  {
    clave: "san-ambrosio-de-milan",
    nombre: "San Ambrosio de Milán",
    subtitulo: "Doctor Melifluo y Columna de la Iglesia Latina",
    categoria: "Santo",
    rareza: "Buena",
    celebracion: "12-07",
    historia:
      "Gobernador romano de Liguria y Emilia con sede en Milán, San Ambrosio acudió a la catedral para apaciguar los disturbios entre católicos y arrianos cuando una voz infantil gritó: «¡Ambrosio, obispo!». Siendo todavía catecúmeno, fue bautizado, ordenado y consagrado obispo en ocho días por unánime aclamación popular, repartiendo de inmediato todos sus cuantiosos bienes entre los pobres.\n\nPredicador insigne y defensor inquebrantable de la fe trinitaria frente a emperadores, compuso sublimes himnos litúrgicos y con la unción de sus homilías cautivó a San Agustín, guiándolo al Bautismo. Exigió pública penitencia al mismísimo emperador Teodosio tras la matanza de Tesalónica, enseñando con valentía que «el emperador está dentro de la Iglesia, no sobre la Iglesia».",
    oracion:
      "Señor, que hiciste del obispo San Ambrosio un insigne maestro de la fe católica y un ejemplo admirable de fortaleza apostólica, suscita en tu Iglesia pastores según tu divino Corazón.",
    frase: "Donde está Pedro, allí está la Iglesia; y donde está la Iglesia, allí no hay muerte sino vida eterna.",
    fraseAutor: "San Ambrosio de Milán (Enarrationes in Psalmos)",
    datasheet: [
      { etiqueta: "Sede episcopal", valor: "Obispo de Mediolanum (Milán) desde el 374 d.C." },
      { etiqueta: "Fruto pastoral", valor: "Instrucción y Bautismo de San Agustín de Hipona" },
      { etiqueta: "Firmeza evangélica", valor: "Sometió a penitencia al emperador Teodosio" },
      { etiqueta: "Herencia poética", valor: "Padre del himno latino y del rito ambrosiano" },
    ],
    imagenes: { "1": "/cartas/san-ambrosio-de-milan/1.webp" },
    creditoImagen: "Dominio público / Arte sacro tradicional",
  },
  {
    clave: "san-jeronimo",
    nombre: "San Jerónimo",
    subtitulo: "Traductor de la Sagrada Vulgata y Doctor Máximo",
    categoria: "Santo",
    rareza: "Buena",
    celebracion: "09-30",
    historia:
      "Nacido en Estridón (Dalmacia), San Jerónimo poseía una prodigiosa erudición en lenguas clásicas y un temperamento ardiente y apasionado que purificó mediante largas penitencias en el desierto de Calcis. Secretario del Papa San Dámaso I en Roma, recibió de este la magna encomienda de revisar y traducir las Sagradas Escrituras a la lengua latina común a partir de los textos originales hebreos, arameos y griegos.\n\nRetirado a una humilde gruta de Belén contigua al lugar del Nacimiento del Salvador, trabajó durante treinta y cuatro años en soledad y vigilias hasta legar a la Iglesia la venerable Vulgata Latina. Su amor apasionado por las Escrituras quedó plasmado en su célebre sentencia: «Ignorar las Escrituras es ignorar a Cristo».",
    oracion:
      "Dios de bondad, que concediste a San Jerónimo un amor vivo y delicado por la Sagrada Escritura, haz que tu pueblo se alimente copiosamente de tu Palabra divina y halle en ella la fuente de la vida.",
    frase: "Ignorar las Escrituras es ignorar a Cristo.",
    fraseAutor: "San Jerónimo (Comentario al profeta Isaías)",
    datasheet: [
      { etiqueta: "Monumento bíblico", valor: "Traducción de la Biblia Vulgata Latina" },
      { etiqueta: "Lugar de oración", valor: "La gruta de Belén de Judá" },
      { etiqueta: "Símbolos santos", valor: "El león manso, la piedra de penitencia y la calavera" },
      { etiqueta: "Dignidad eclesial", valor: "Doctor Máximo de las Sagradas Escrituras" },
    ],
    imagenes: { "1": "/cartas/san-jeronimo/1.webp" },
    creditoImagen: "Dominio público / Arte sacro tradicional",
  },
  {
    clave: "san-martin-de-tours",
    nombre: "San Martín de Tours",
    subtitulo: "Obispo de Tours y Apóstol de las Galias",
    categoria: "Santo",
    rareza: "Buena",
    celebracion: "11-11",
    historia:
      "Nacido en Panonia (actual Hungría), hijo de un tribuno militar pagano, ingresó de joven en la caballería romana. Estando en Amiens durante un invierno helador, encontró junto a la puerta de la ciudad a un mendigo tiritando de frío; no teniendo más que sus armas y su capa militar, sacó la espada, cortó la capa en dos y le entregó la mitad. En la noche siguiente vio en sueños a Cristo vestido con esa media capa diciendo a los ángeles: «Martín, todavía catecúmeno, me cubrió con su vestido».\n\nDejó el ejército para consagrarse a Dios bajo la guía de San Hilario de Poitiers, fundó el primer monasterio de las Galias en Ligugé y fue proclamado obispo de Tours. Recorrió aldeas destruyendo ídolos paganos y convirtiendo a los campesinos con infinita dulzura y milagros.",
    oracion:
      "Señor Dios, que fuiste glorificado con la vida y la muerte del obispo San Martín, renueva en nuestros corazones las maravillas de tu gracia para que ni la muerte ni la vida nos aparten de tu amor.",
    frase: "Señor, si todavía soy necesario a tu pueblo, no rehúso el trabajo; hágase tu santa voluntad.",
    fraseAutor: "San Martín de Tours en su agonía (Sulpicio Severo)",
    datasheet: [
      { etiqueta: "Gesto inmortal", valor: "Partición de su capa militar con Cristo mendigo en Amiens" },
      { etiqueta: "Sede episcopal", valor: "Tercer Obispo de Tours (Galia romana)" },
      { etiqueta: "Monaquismo galo", valor: "Fundador del Monasterio de Ligugé y de Marmoutier" },
      { etiqueta: "Patronazgo", valor: "Francia, soldados, tejedores y necesitados" },
    ],
    imagenes: { "1": "/cartas/san-martin-de-tours/1.webp" },
    creditoImagen: "Dominio público / Arte sacro tradicional",
  },
  {
    clave: "san-antonio-abad",
    nombre: "San Antonio Abad",
    subtitulo: "Padre del Monaquismo y Vencedor del Desierto",
    categoria: "Santo",
    rareza: "Buena",
    celebracion: "01-17",
    historia:
      "Hijo de acaudalados cristianos en Egipto, quedó huérfano en su juventud. Al entrar a la iglesia y escuchar las palabras del Evangelio: «Si quieres ser perfecto, ve, vende todo lo que tienes, dalo a los pobres y tendrás un tesoro en el cielo; luego ven y sígueme», las tomó como dirigidas personalmente a él. Vendió todas sus propiedades, distribuyó el fruto entre los pobres y se retiró al desierto de la Tebaida.\n\nAllí pasó décadas en soledad extrema, ayunos rigurosos y oración continua, soportando y venciendo feroces asaltos y tentaciones demoníacas con la señal de la Cruz y el Nombre de Jesús. Atraídos por su resplandor de santidad, miles de discípulos se congregaron a su alrededor en cuevas y celdas, convirtiéndose en el patriarca de los monjes del desierto. San Atanasio escribió su inmortal biografía.",
    oracion:
      "Señor Dios, que concediste a San Antonio Abad servirte con pureza de corazón en el retiro del desierto, concédenos por su intercesión negarnos a nosotros mismos para amarte siempre sobre todas las cosas.",
    frase: "Vi todas las trampas del enemigo tendidas sobre la faz de la tierra, y pregunté gimiendo: '¿Quién podrá escapar de ellas?'. Y oí una voz que me respondió: 'La humildad'.",
    fraseAutor: "San Antonio Abad (Apotegmas de los Padres del Desierto)",
    datasheet: [
      { etiqueta: "Título venerable", valor: "Padre del Monaquismo y Abad del Desierto" },
      { etiqueta: "Lugar de retiro", valor: "Desierto de la Tebaida y Monte Colzim (Egipto)" },
      { etiqueta: "Arma espiritual", valor: "La señal de la Cruz contra las tentaciones demoníacas" },
      { etiqueta: "Biografía patrística", valor: "«Vida de San Antonio» escrita por San Atanasio" },
    ],
    imagenes: { "1": "/cartas/san-antonio-abad/1.webp" },
    creditoImagen: "Dominio público / Arte sacro tradicional",
  },
  {
    clave: "san-bernardo-de-claraval",
    nombre: "San Bernardo de Claraval",
    subtitulo: "Doctor Melifluo y Cantor de María Santísima",
    categoria: "Santo",
    rareza: "Buena",
    celebracion: "08-20",
    historia:
      "Noble borgoñón dotado de fascinante elocuencia, San Bernardo ingresó en 1112 al austero monasterio cisterciense de Cíter arrastrando consigo a una treintena de parientes y amigos nobles. Fundó poco después la célebre abadía de Claraval (Clairvaux), desde donde expandió la Orden del Císter por toda Europa con cientos de nuevos monasterios entregados al «ora et labora».\n\nConsejero de papas y reyes, pacificador de cismas y ardiente heraldo del amor de Dios, compuso tratados místicos incomparables sobre el Cantar de los Cantares y homilías sobre la Santísima Virgen de una dulzura tan elevada que le valieron el título de Doctor Melifluo. A él se atribuye la invocación del final de la Salve: «¡Oh clemente, oh piadosa, oh dulce Virgen María!».",
    oracion:
      "Dios nuestro, que hiciste del abad San Bernardo una antorcha llameante en tu Iglesia por su celo y doctrina, concédenos por su intercesión arder en aquel mismo espíritu de amor.",
    frase: "Mira la estrella, invoca a María; si la sigues, no te desviarás; si le rezas, no desesperarás; si piensas en ella, no errarás.",
    fraseAutor: "San Bernardo de Claraval (Homilía sobre las alabanzas de la Virgen Madre)",
    datasheet: [
      { etiqueta: "Fundación insigne", valor: "Abadía de Claraval y reforma del Císter" },
      { etiqueta: "Título de Doctor", valor: "Doctor Melifluo (cuyas palabras manan miel)" },
      { etiqueta: "Devoción suprema", valor: "Cantor sublime de la mediación maternal de María" },
      { etiqueta: "Invocación mariana", valor: "«O clemens, o pia, o dulcis Virgo Maria»" },
    ],
    imagenes: { "1": "/cartas/san-bernardo-de-claraval/1.webp" },
    creditoImagen: "Dominio público / Arte sacro tradicional",
  },
  {
    clave: "santo-domingo-de-guzman",
    nombre: "Santo Domingo de Guzmán",
    subtitulo: "Fundador de la Orden de Predicadores y del Rosario",
    categoria: "Santo",
    rareza: "Buena",
    celebracion: "08-08",
    historia:
      "Nacido en Caleruega (Castilla), Domingo fue canónigo regular en Osma antes de emprender en el sur de Francia la misión apostólica de combatir la herejía cátara no con violencia ni riquezas, sino con pobreza evangélica radical, oración incesante y predicación fundada en la sólida teología bíblica. En Fanjeaux fundó la Orden de Predicadores (dominicos), consagrada al estudio y la proclamación de la Verdad (Veritas).\n\nConforme a la constante tradición mariana de la Iglesia confirmada por innumerables Pontífices, la Santísima Virgen se le manifestó en Prouille y le confió el rezo del Santo Rosario como arma poderosa de gracia y conversión. Sus hermanos decían de él que «sólo hablaba con Dios o de Dios», pasando las noches derramando lágrimas ante el altar por la salvación de los pecadores.",
    oracion:
      "Que tu Santa Iglesia, Señor, sea iluminada por los méritos y enseñanzas de Santo Domingo, y que quien fue predicador eminente de tu verdad sea para nosotros un intercesor constante.",
    frase: "No prediquen para agradar a los hombres, sino para ganar almas para Jesucristo.",
    fraseAutor: "Santo Domingo de Guzmán a sus frailes predicadores",
    datasheet: [
      { etiqueta: "Fundación sagrada", valor: "La Orden de Predicadores (Frailes Dominicos)" },
      { etiqueta: "Regalo mariano", valor: "El Santo Rosario confiado por la Virgen María" },
      { etiqueta: "Lema dominicano", valor: "«Veritas» y «Contemplari et contemplata aliis tradere»" },
      { etiqueta: "Virtud insigne", valor: "Solo hablaba con Dios o de Dios en ardiente caridad" },
    ],
    imagenes: { "1": "/cartas/santo-domingo-de-guzman/1.webp" },
    creditoImagen: "Dominio público / Arte sacro tradicional",
  },
  {
    clave: "santa-maria-magdalena",
    nombre: "Santa María Magdalena",
    subtitulo: "Apóstol de los Apóstoles y Testigo de la Resurrección",
    categoria: "Santo",
    rareza: "Buena",
    celebracion: "07-22",
    historia:
      "Liberada por Jesucristo de siete demonios, María Magdalena siguió al Señor desde Galilea asistiéndole con sus bienes junto a otras santas mujeres. Cuando los apóstoles huyeron atemorizados en la hora de la Pasión, ella permaneció con heroico amor al pie de la Cruz junto a la Santísima Virgen María y San Juan, y estuvo presente en la sepultura del Salvador en la roca.\n\nEn la madrugada del domingo de Pascua acudió al sepulcro mientras aún estaba oscuro para ungir el cuerpo del Maestro. Fue la primera en contemplar a Cristo Resucitado, quien la llamó por su nombre («¡María!») y le encomendó ser la «Apostola Apostolorum» (Apóstol de los Apóstoles), enviándola a anunciar a Pedro y a los demás: «¡He visto al Señor!».",
    oracion:
      "Dios todopoderoso, cuyo Unigénito encomendó a Santa María Magdalena anunciar antes que a nadie el gozo pascual, concédenos por su intercesión proclamar a Cristo vivo y contemplarlo reinando en tu gloria.",
    frase: "¡He visto al Señor, y me ha dicho estas cosas!",
    fraseAutor: "Santa María Magdalena a los Apóstoles (Jn 20, 18)",
    datasheet: [
      { etiqueta: "Título litúrgico", valor: "Apostola Apostolorum (Apóstol de los Apóstoles)" },
      { etiqueta: "Fidelidad suprema", valor: "Permaneció junto a la Cruz en el Calvario" },
      { etiqueta: "Privilegio de Pascua", valor: "Primera testigo de la Resurrección de Jesucristo" },
      { etiqueta: "Lugar de origen", valor: "Magdala, orillas del Mar de Galilea" },
    ],
    imagenes: { "1": "/cartas/santa-maria-magdalena/1.webp" },
    creditoImagen: "Dominio público / Arte sacro tradicional",
  },
  {
    clave: "santa-agueda-martir",
    nombre: "Santa Águeda Virgen y Mártir",
    subtitulo: "Doncella Mártir de Catania e Inquebrantable en la Fe",
    categoria: "Santo",
    rareza: "Comun",
    celebracion: "02-05",
    historia:
      "Nacida de noble cuna en Catania (Sicilia), Águeda consagró a Dios su pureza desde la niñez con voto de virginidad. Durante la persecución de Decio, el procónsul Quinciano intentó seducirla con halagos y amenazas, entregándola a una mujer perversa para doblegar su castidad; al ver que la doncella permanecía inconmovible como roca en su fe, ordenó someterla a crueles tormentos, entre ellos la mutilación de sus pechos.\n\nEn la cárcel, San Pedro Apóstol se le apareció en visión celestial y la sanó milagrosamente. Condenada a ser quemada sobre brasas ardientes, oró con dulzura entregando su alma a Dios mientras un terremoto sacudía la ciudad. Su velo milagroso detuvo repetidas veces la lava ardiente del volcán Etna.",
    oracion:
      "Señor, que concedas el perdón a nuestras faltas por la intercesión de Santa Águeda, virgen y mártir, que siempre te fue agradable tanto por el mérito de su pureza como por la fuerza de su martirio.",
    frase: "Mi espíritu está fundado sobre la roca viva de Jesucristo; las amenazas no me espantan ni los tormentos me doblegan.",
    fraseAutor: "Santa Águeda ante el procónsul de Catania",
    datasheet: [
      { etiqueta: "Tierra natal", valor: "Catania, Sicilia (siglo III)" },
      { etiqueta: "Consuelo divino", valor: "Sanada en prisión por el Apóstol San Pedro" },
      { etiqueta: "Protección célebre", valor: "Defensora contra el fuego y las erupciones del Etna" },
      { etiqueta: "Canon de la Misa", valor: "Mencionada en el Canon Romano tradicional" },
    ],
    imagenes: { "1": "/cartas/santa-agueda-martir/1.webp" },
    creditoImagen: "Dominio público / Arte sacro tradicional",
  },
  {
    clave: "santa-lucia-martir",
    nombre: "Santa Lucía Virgen y Mártir",
    subtitulo: "Luz de Siracusa y Virgen Mártir",
    categoria: "Santo",
    rareza: "Comun",
    celebracion: "12-13",
    historia:
      "Joven doncella de ilustre familia de Siracusa (Sicilia), acudió junto a su madre enferma al sepulcro de Santa Águeda en Catania para implorar su curación. Tras el milagro y una visión de Águeda, Lucía distribuyó toda su rica dote entre los pobres para consagrarse como esposa inviolable de Jesucristo.\n\nDenunciada como cristiana por su pretendiente pagano ante el gobernador Pascasio en la persecución de Diocleciano, el Espíritu Santo la volvió milagrosamente tan pesada e inamovible que ni bueyes ni soldados pudieron arrastrarla. Tras salir ilesa de las llamas, fue degollada a espada tras recibir la Sagrada Comunión. Su nombre, que significa «luz», ilumina a las almas devotas.",
    oracion:
      "Te rogamos, Señor, que la gloriosa intercesión de Santa Lucía, virgen y mártir, encienda nuestros corazones para que celebremos con piedad su fiesta terrena y alcancemos la luz eterna del Cielo.",
    frase: "Quienes viven en castidad y piedad son templo del Espíritu Santo, y el Espíritu Santo mora en ellos.",
    fraseAutor: "Santa Lucía ante el juez Pascasio",
    datasheet: [
      { etiqueta: "Significado de su nombre", valor: "Luz (Lux, Lucis)" },
      { etiqueta: "Tierra natal", valor: "Siracusa, Sicilia (año 304 d.C.)" },
      { etiqueta: "Invocación milagrosa", valor: "Inamovible por la fortaleza del Espíritu Santo" },
      { etiqueta: "Patronazgo", valor: "La vista, los ciegos, modistas y electricistas" },
    ],
    imagenes: { "1": "/cartas/santa-lucia-martir/1.webp" },
    creditoImagen: "Dominio público / Arte sacro tradicional",
  },
  {
    clave: "santa-cecilia-martir",
    nombre: "Santa Cecilia Virgen y Mártir",
    subtitulo: "Patrona de la Música Sagrada y Virgen Mártir de Roma",
    categoria: "Santo",
    rareza: "Comun",
    celebracion: "11-22",
    historia:
      "Noble patricia romana, Cecilia se consagró a Cristo en perpetua castidad. Entregada en matrimonio contra su deseo al joven Valeriano, le confió en la noche nupcial que un Ángel de Dios custodiaba su pureza; Valeriano creyó, fue instruido por el Papa San Urbano en las catacumbas, recibió el Bautismo y al regresar vio al resplandeciente Ángel coronando a Cecilia con lirios y rosas celestiales.\n\nValeriano y su hermano Tiburcio dieron su vida por Cristo y Cecilia los sepultó caritativamente antes de ser arrestada. Encerrada en las termas para morir asfixiada, cantaba himnos santos en medio del vapor sin daño alguno; el verdugo intentó degollarla descargando tres golpes de espada sin lograrlo, sobreviviendo tres días en los que distribuyó sus bienes a los pobres y legó su casa para templo de Dios.",
    oracion:
      "Dios todopoderoso, concédenos que la oración de Santa Cecilia nos ayude, para que imitando su fidelidad virginal alcancemos la alegría de tu Reino celestial.",
    frase: "Mientras los instrumentos sonaban en la fiesta terrena, Cecilia cantaba en su corazón al Señor: 'Que mi corazón y mi cuerpo permanezcan inmaculados'.",
    fraseAutor: "Actas de Santa Cecilia Virgen y Mártir",
    datasheet: [
      { etiqueta: "Corona angélica", valor: "Coronada con rosas y lirios invisibles del Paraíso" },
      { etiqueta: "Canto interior", valor: "Cantaba himnos a Dios en el secreto de su corazón" },
      { etiqueta: "Templo perpetuo", valor: "Basílica de Santa Cecilia en Trastévere (Roma)" },
      { etiqueta: "Patronazgo universal", valor: "Músicos, cantores, compositores y poetas" },
    ],
    imagenes: { "1": "/cartas/santa-cecilia-martir/1.webp" },
    creditoImagen: "Dominio público / Arte sacro tradicional",
  },
  {
    clave: "santa-catalina-de-alejandria",
    nombre: "Santa Catalina de Alejandría",
    subtitulo: "Sabia de Alejandría y Virgen Mártir",
    categoria: "Santo",
    rareza: "Comun",
    celebracion: "11-25",
    historia:
      "Doncella de sangre real en Alejandría de Egipto célebre por su portentosa sabiduría y belleza, Catalina conoció el cristianismo y se unió a Cristo en místico desposorio. Ante las persecuciones de Majencio, se presentó con intachable valentía ante el emperador confutando los ídolos paganos; Majencio convocó a los cincuenta filósofos más sabios del imperio para rebatirla, pero Catalina, asistida por el Espíritu Santo, los convirtió a todos a la fe cristiana.\n\nCondenada a ser destrozada en una rueda guarnecida de cuchillas de hierro, la máquina voló hecha pedazos milagrosamente al tocarla. Fue finalmente decapitada y la tradición atestigua que los Santos Ángeles tomaron su cuerpo sagrado y lo transportaron con honor hasta la cumbre del Monte Sinaí, donde se venera en el célebre monasterio que lleva su nombre.",
    oracion:
      "Dios todopoderoso, que diste la ley a Moisés en el monte Sinaí y colocaste en el mismo lugar el cuerpo sagrado de Santa Catalina virgen y mártir, concédenos por su intercesión alcanzar el monte que es Cristo.",
    frase: "Cristo es mi gloria, mi sabiduría y mi vida; por Él soporto gustosa cualquier tormento y la misma muerte.",
    fraseAutor: "Santa Catalina de Alejandría ante el emperador",
    datasheet: [
      { etiqueta: "Dignidad y sabiduría", valor: "Noble princesa de Alejandría y teóloga inspirada" },
      { etiqueta: "Disputa célebre", valor: "Convirtió a cincuenta filósofos paganos con la verdad divina" },
      { etiqueta: "Sepulcro angélico", valor: "Trasladada por los santos Ángeles al Monte Sinaí" },
      { etiqueta: "Patronazgo", valor: "Filósofos, estudiantes, juristas y doncellas" },
    ],
    imagenes: { "1": "/cartas/santa-catalina-de-alejandria/1.webp" },
    creditoImagen: "Dominio público / Arte sacro tradicional",
  },
];

const mapaNuevos = new Map(nuevosSantos.map((s) => [s.clave, s]));

// Orden riguroso de la Letanía de los Santos (Litaniae Sanctorum)
// 1. Santa María (Madre de Dios)
// 2. San José (Esposo de María)
// 3. San Juan Bautista (Precursor)
// 4-19. Apóstoles y Evangelistas
// 20-24. Mártires
// 25-31. Pontífices, Obispos y Doctores
// 32-36. Monjes, Religiosos y Fundadores
// 37-42. Vírgenes y Santas Mujeres
const ordenLetania: string[] = [
  // Madre de Dios
  "santa-maria-madre-de-dios",
  // Precursor y Patriarcas
  "san-jose",
  "san-juan-bautista",
  // Apóstoles y Evangelistas
  "san-pedro-apostol",
  "san-pablo-apostol",
  "san-andres-apostol",
  "santiago-el-mayor",
  "san-juan-evangelista",
  "santo-tomas-apostol",
  "santiago-el-menor",
  "san-felipe-apostol",
  "san-bartolome-apostol",
  "san-mateo-apostol",
  "san-simon-apostol",
  "san-judas-tadeo",
  "san-matias-apostol",
  "san-bernabe-apostol",
  "san-lucas-evangelista",
  "san-marcos-evangelista",
  // Mártires
  "san-esteban-protomartir",
  "san-lorenzo-martir",
  "san-vicente-martir",
  "san-sebastian-martir",
  "santos-cosme-y-damian",
  // Obispos y Doctores
  "san-silvestre-papa",
  "san-gregorio-magno",
  "san-ambrosio-de-milan",
  "san-agustin-de-hipona",
  "san-jeronimo",
  "san-martin-de-tours",
  "san-nicolas-de-bari",
  // Monjes y Fundadores
  "san-antonio-abad",
  "san-benito-de-nursia",
  "san-bernardo-de-claraval",
  "santo-domingo-de-guzman",
  "san-francisco-de-asis",
  // Vírgenes y Santas Mujeres
  "santa-maria-magdalena",
  "santa-agueda-martir",
  "santa-lucia-martir",
  "santa-ines-virgen-y-martir",
  "santa-cecilia-martir",
  "santa-catalina-de-alejandria",
];

const resultadoFinal: CartaCatalogo[] = [];

for (const clave of ordenLetania) {
  if (conservadosRaw[clave]) {
    resultadoFinal.push(conservadosRaw[clave]);
  } else if (mapaNuevos.has(clave)) {
    resultadoFinal.push(mapaNuevos.get(clave)!);
  } else {
    throw new Error(`Clave no encontrada: ${clave}`);
  }
}

const destino = path.join(process.cwd(), "src", "lib", "cartas", "catalogo", "santos.json");
fs.writeFileSync(destino, JSON.stringify(resultadoFinal, null, 2), "utf-8");
console.log(`Catálogo de santos generado exitosamente con ${resultadoFinal.length} santos.`);
