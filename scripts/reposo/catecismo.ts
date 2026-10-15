// Catecismo Mayor de San Pío X (texto de 1905) → preguntas numeradas.
// Fuente: OCR de la edición de 1973 (Internet Archive), con la numeración de la edición (1…708).
// Formato de entrada: «N. - ¿Pregunta? - Respuesta.» (la respuesta puede ir en otro párrafo).

export type PreguntaCatecismo = {
  n: number;
  parte: string;
  capitulo: string;
  pregunta: string;
  respuesta: string;
};

const NUMERALES: Record<string, string> = {
  PRIMERO: "I",
  PRIMERA: "I",
  SEGUNDA: "II",
  SEGUNDO: "II",
  TERCERA: "III",
  CUARTA: "IV",
  QUINTA: "V",
};

const limpiar = (s: string) =>
  s
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:?!»)])/g, "$1")
    .replace(/([¿«(¡])\s+/g, "$1")
    .trim();

const esNumeroSiguiente = (n: number, ultimo: number) => n > ultimo && n <= ultimo + 4;

// Nombres de las partes, tal como figuran en el índice de la edición.
const PARTES: Record<string, string> = {
  PRIMERA: "Parte primera · Del Símbolo de los Apóstoles, llamado vulgarmente «Credo»",
  SEGUNDA: "Parte segunda · De la oración",
  TERCERA: "Parte tercera · De los Mandamientos de la Ley de Dios y de la Iglesia",
  CUARTA: "Parte cuarta · De los Sacramentos",
  QUINTA: "Parte quinta · De las Virtudes principales y de otras cosas necesarias que ha de saber el Cristiano",
};

const NOMBRES_PROPIOS = [
  "Dios", "Iglesia", "Credo", "Padrenuestro", "Jesucristo", "Espíritu Santo", "Apóstoles", "Mandamientos", "Sacramentos",
  "Bautismo", "Confirmación", "Eucaristía", "Penitencia", "Extremaunción", "Orden", "Matrimonio", "Señor", "Virgen", "María",
  "Ave María", "Salve", "Cristo", "Misa", "Papa", "Evangelio", "Ley", "Santísima Trinidad", "Cristiano",
];

/** MAYÚSCULAS del OCR → «Primera mayúscula», recuperando los nombres propios que lo piden. */
const capitalizar = (s: string) => {
  let t = s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
  for (const n of NOMBRES_PROPIOS) t = t.replace(new RegExp(`\\b${n.toLowerCase()}\\b`, "g"), n);
  return t;
};

export function parsearCatecismo(texto: string): PreguntaCatecismo[] {
  const lineas = texto.split(/\r?\n/);
  const inicio = lineas.findIndex((l) => /^LECCIÓN PRELIMINAR\s*$/.test(l.trim()));
  if (inicio < 0) throw new Error("No se encontró «LECCIÓN PRELIMINAR»");

  const out: PreguntaCatecismo[] = [];
  let parte = "Lección preliminar";
  let capitulo = "";
  let actual: { n: number; partes: string[]; parte: string; capitulo: string } | null = null;
  let esperaTitulo: "parte" | "capitulo" | null = null;
  let seccionHistoria = false;
  let ultimo = 0;
  let tituloCapitulo = false;

  const guardar = (n: number, texto: string, p: string, c: string) => {
    // el OCR a veces pega varias preguntas en una línea: «… 709. ¿De cuántas…? - …»; se separan por el número siguiente
    const sig = new RegExp(`\\s${n + 1}[.:]\\s*-?\\s*(?=[¿A-ZÁÉÍÓÚ¡])`);
    const corte = sig.exec(texto);
    if (corte) {
      guardar(n, texto.slice(0, corte.index), p, c);
      guardar(n + 1, texto.slice(corte.index + corte[0].length), p, c);
      return;
    }
    const todo = limpiar(texto);
    // la pregunta termina en el primer «?»; lo que sigue (sin el guion separador) es la respuesta
    const i = todo.indexOf("?");
    if (i > 0) {
      const pregunta = limpiar(todo.slice(0, i + 1));
      const respuesta = limpiar(todo.slice(i + 1).replace(/^\s*[-–—]\s*/, ""));
      if (respuesta) out.push({ n, parte: p, capitulo: c, pregunta, respuesta });
      return;
    }
    // preguntas sin signo («Decidlos. - …», «Rezad el Padrenuestro. - …»): se corta en el guion o, si no lo hay, en el primer punto
    const m = /^(.*?[.:])\s*[-–—]\s+(.*)$/.exec(todo) ?? /^(.*?\.)\s+(.*)$/.exec(todo);
    if (m && m[1] && m[2]) out.push({ n, parte: p, capitulo: c, pregunta: limpiar(m[1]), respuesta: limpiar(m[2]) });
  };

  const cerrar = () => {
    if (!actual) return;
    guardar(actual.n, actual.partes.join(" "), actual.parte, actual.capitulo);
    actual = null;
  };

  for (let k = inicio; k < lineas.length; k++) {
    const l = lineas[k].trim();
    if (!l) continue;
    if (/^BREVE HISTORIA DE LA RELIGI[OÓ]N/i.test(l)) {
      cerrar();
      seccionHistoria = true;
    }
    if (seccionHistoria) break;
    let m: RegExpExecArray | null;
    if ((m = /^PARTE (PRIMERA|SEGUNDA|TERCERA|CUARTA|QUINTA)\s*$/.exec(l))) {
      cerrar();
      parte = PARTES[m[1]] ?? `Parte ${m[1].toLowerCase()}`;
      capitulo = "";
      esperaTitulo = "parte";
      continue;
    }
    if ((m = /^CAP[IÍ]TULO ([A-Z]+)\s*$/.exec(l))) {
      cerrar();
      capitulo = `Capítulo ${NUMERALES[m[1]] ?? m[1]}`;
      esperaTitulo = "capitulo";
      tituloCapitulo = false;
      continue;
    }
    // «N. - ¿…» (o «N. ¿…»): solo se acepta el número siguiente al anterior, para no confundirlo con enumeraciones
    if ((m = /^(\d{1,3})[.:]\s*-?\s*(.*)$/.exec(l)) && esNumeroSiguiente(Number(m[1]), ultimo)) {
      cerrar();
      esperaTitulo = null;
      ultimo = Number(m[1]);
      actual = { n: ultimo, partes: [m[2]], parte, capitulo };
      continue;
    }
    // subtítulos numerados dentro de un capítulo («5 °-Del propósito»): no son parte de la respuesta
    if (/^\d\s?[°o.]\s?-/.test(l)) continue;
    if (esperaTitulo && !actual && /^[A-ZÁÉÍÓÚÑÜ ,.:;'"«»“”-]+$/.test(l)) {
      // título en mayúsculas debajo de «PARTE …» / «CAPÍTULO …» (puede ocupar varias líneas)
      if (esperaTitulo === "capitulo") {
        const t = capitalizar(l);
        capitulo = tituloCapitulo ? `${capitulo} ${t.charAt(0).toLowerCase()}${t.slice(1)}` : `${capitulo} · ${t}`;
        tituloCapitulo = true;
      }
      continue; // el título de la parte ya está en PARTES
    }
    if (actual) actual.partes.push(l);
  }
  cerrar();
  return out;
}
