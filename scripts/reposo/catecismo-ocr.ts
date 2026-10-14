// Limpieza del OCR del Catecismo Mayor (edición de 1973, Internet Archive).
// El OCR es bueno pero deja errores sistemáticos (ligadura «fi» con tilde, palabras pegadas, «rn»/«m» por «ru»…).
// Se corrige lo seguro; lo que no, descarta la pregunta (el catecismo se guarda completo, el filtro es de la selección).
import type { PreguntaCatecismo } from "./catecismo.ts";

/** Correcciones seguras, por patrón. Se aplican en orden a pregunta y respuesta. */
export const CORRECCIONES: [RegExp, string | ((m: string) => string)][] = [
  [/¿[,.;:]\s*/g, "¿"],
  [/¿\s*Que\b/g, "¿Qué"],
  [/¿Qu[eé]([a-záéíóúñ]{3,})/g, "¿Qué $1"],
  [/¿Qu[eé]\s+([a-záéíóúñ])/g, "¿Qué $1"],
  [/\b([Cc])ómo([a-záéíóúñ]{2,})\b/g, "$1ómo $2"],
  [/\bquién([a-záéíóúñ]{3,})\b/g, "quién $1"],
  [/\bdelinfíerno\b/g, "del infierno"],
  [/\bdelprecepto\b/g, "del precepto"],
  [/\bdelprimer\b/g, "del primer"],
  [/\belfruto\b/g, "el fruto"],
  [/\belombre\b/g, "el hombre"],
  [/\belpan\b/g, "el pan"],
  [/\bdéla\b/g, "de la"],
  [/\bdélos\b/g, "de los"],
  [/\bdélo\b/g, "de lo"],
  [/\bbastapara\b/gi, (m: string) => (m[0] === "B" ? "Basta para" : "basta para")],
  [/\bestáprohibido\b/g, "está prohibido"],
  [/\baquípor\b/g, "aquí por"],
  [/\bquepecado\b/g, "que pecado"],
  [/\bsepueden\b/g, "se pueden"],
  [/\bhadado\b/g, "ha dado"],
  [/fígura/g, "figura"],
  [/fíguras/g, "figuras"],
  [/infíeles/g, "infieles"],
  [/infíerno/g, "infierno"],
  [/crucifícado/g, "crucificado"],
  [/santifícación/g, "santificación"],
  [/santifícado/g, "santificado"],
  [/refíere/g, "refiere"],
  [/efícaces/g, "eficaces"],
  [/efícaz/g, "eficaz"],
  [/signifíca/g, "significa"],
  [/difíere/g, "difiere"],
  [/ofíciosa/g, "oficiosa"],
  [/confíanza/g, "confianza"],
  [/\bcmz\b/gi, (m: string) => (m[0] === "C" ? "Cruz" : "cruz")],
  [/\bcosiste\b/g, "consiste"],
  [/\bsantificame\b/g, "santificante"],
  [/\bElpan\b/g, "El pan"],
  [/\b[Ss]epueden\b/g, (m: string) => (m[0] === "S" ? "Se pueden" : "se pueden")],
  [/\b[Ee]stá ?prohibido\b/g, (m: string) => `${m[0]}stá prohibido`],
  [/\bA YUDAR\b/g, "AYUDAR"],
  [/\bdificil\b/g, "difícil"],
  [/\bpos vergüenza\b/g, "por vergüenza"],
  [/Confirmación es España/g, "Confirmación en España"],
  [/\bElombre\b/g, "Hombre"],
  [/\bRedentorprometido\b/g, "Redentor prometido"],
  [/\berrarla\b/g, "errar la"],
  [/\bYA LOS\b/g, "Y A LOS"],
  [/\bAngel(es)?\b/g, "Ángel$1"],
  [/\bCATOLICA\b/g, "CATÓLICA"],
  [/\bespíritu Santo\b/g, "Espíritu Santo"],
  [/¿(Por|En|Para|De|A|Con|Sobre) que\b/g, "¿$1 qué"],
  [/¿Quienes\b/g, "¿Quiénes"],
  [/¿Cuales\b/g, "¿Cuáles"],
  [/¿Cuant([oa]s?)\b/g, "¿Cuánt$1"],
  [/¿Como\b/g, "¿Cómo"],
  [/¿Donde\b/g, "¿Dónde"],
  [/¿Cuando\b/g, "¿Cuándo"],
  [/^Qué /g, "¿Qué "],
  [/^si /g, "Si "],
  [/\btmeno\b/g, "bueno"],
  [/\bdestmye\b/g, "destruye"],
  [/\bdestmir\b/g, "destruir"],
  [/\binstmido\b/g, "instruido"],
  [/\bpmdente\b/g, "prudente"],
  [/\blinaj\b/g, "linaje"],
  [/\bpefecto\b/g, "perfecto"],
  [/\bcardad\b/g, "caridad"],
  [/\buramento\b/g, "juramento"],
  [/\bcondesa\b/g, "confiesa"],
  [/\bcondesan\b/g, "confiesan"],
  [/\bcondesar\b/g, "confesar"],
  [/\bcaldo\b/g, "caído"],
  [/\bsi\s+jesucristo\b/gi, "si Jesucristo"],
  [/\bpor\s*jesucristo\b/gi, "por Jesucristo"],
  [/\bsijesucristo\b/gi, "si Jesucristo"],
  [/\bporjesucristo\b/gi, "por Jesucristo"],
  [/\s{2,}/g, " "],
];

const FI_LEGITIMOS = new Set(
  `confío confía confían confíe confíen confías confíes fío fía fían fíe fíen fías desconfía desconfían desconfío fíese física físico físicos físicas fíjate fíjese`.split(
    " ",
  ),
);

/** «fí» (la ligadura fi leída con tilde) → «fi», salvo palabras que de verdad llevan «fí». */
function arreglarLigaduraFi(s: string): string {
  return s.replace(/[A-Za-záéíóúñÁÉÍÓÚÑ]*fí[A-Za-záéíóúñ]*/g, (w) => (FI_LEGITIMOS.has(w.toLowerCase()) ? w : w.replace(/fí/g, "fi")));
}

/** «por El», «a El», «sólo El es»…: el pronombre perdió la tilde en el OCR. */
const RE_EL_PRONOMBRE = /\b(por|a|sólo|solo|que|con|de|en|igual a|hacia|para) El(?=[,.;:?]|\s+(?:es|le|no|mismo|se|fue|ha|había|quiso|quien|y|mismo|nos)\b)/g;

export function corregir(s: string): string {
  let t = s;
  for (const [re, por] of CORRECCIONES) t = t.replace(re, por as string);
  t = arreglarLigaduraFi(t)
    .replace(/\s+\d\s?[°o.]\.?\s?-\s?[A-ZÁÉÍÓÚ][\s\S]*$/, "") // subtítulo del capítulo pegado al final («2°.- De los Ángeles»)
    .replace(RE_EL_PRONOMBRE, "$1 Él")
    .replace(/\bSi, señor/g, "Sí, señor")
    .replace(/\bNo, señor/g, "No, señor")
    .replace(/\b([1-9]) ?[o°]\.?(?=[ .,:;])/g, "$1.º")
    .replace(/\bI ?[o°]\.?(?=[ .,:;])/g, "1.º")
    .replace(/\s+/g, " ");
  return t.trim();
}

/** Tokens que el OCR deja irrecuperables o dudosos: la pregunta que los contiene no entra a la selección. */
export const TOKENS_DUDOSOS = new Set(
  `ca cio ma pa ico marc parea pata cruyy chñstum perdóminum ñoriday reábe reábirlo santirca santiñca petiáón veneraáón
   cormpción repmeba tmeca tnal tos k megan penitenta pobrera ycuales ypodemos ypor yquienes padrey vemaria vemaría
   puedenparticipar quienparticipa quépredecían quépenitencia quépenitentes quépretende quéprohíbe quiénpuede asíprósperas
   dédrno pié domínica bis`.split(/\s+/),
);

const tokens = (s: string) => s.toLowerCase().match(/[a-záéíóúüñ]+/g) ?? [];

/** Devuelve la pregunta corregida o `null` si quedan palabras dudosas. */
export function limpiarPregunta(p: PreguntaCatecismo): PreguntaCatecismo | null {
  const q: PreguntaCatecismo = { ...p, pregunta: corregir(p.pregunta), respuesta: corregir(p.respuesta) };
  const todo = tokens(`${q.pregunta} ${q.respuesta}`);
  if (todo.some((t) => TOKENS_DUDOSOS.has(t))) return null;
  // restos del OCR: símbolos raros, puntuación doblada o letras sueltas
  if (/[|_~^*{}\\]/.test(q.pregunta + q.respuesta)) return null;
  if (/[,.;:]{2,}/.test(q.respuesta.replace(/\.\.\./g, ""))) return null;
  if (/(?:^|\s)[b-df-hj-z](?:\s|$)/i.test(q.respuesta.replace(/\b[yaeou]\b/gi, ""))) return null;
  return q;
}
