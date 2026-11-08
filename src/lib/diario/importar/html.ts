// Diario (lane 292): HTML de las notas de otras apps (Daylio, Diarium) a Markdown. Hace el papel del paquete `html2md` que usan
// vendor/Daily_You/lib/utils/imports/{import_daylio,import_diarium}.dart (Demizo/Daily_You@7cc237d).
import { decodificarEntidades } from "./comun.ts";

interface Lista {
  ordenada: boolean;
  n: number;
}

const BLOQUES = new Set(["p", "div", "section", "article", "header", "footer", "tr", "table", "figure"]);

/** Markdown de un trozo de HTML: negrita, cursiva, tachado, enlaces, listas, citas, títulos, código y saltos. El resto de las etiquetas se descarta. */
export function htmlAMarkdown(html: string): string {
  const fuente = html.replace(/\r\n?/g, "\n");
  if (!/<[a-z!/]/i.test(fuente)) return decodificarEntidades(fuente).trim();

  let salida = "";
  const listas: Lista[] = [];
  const enlaces: (string | null)[] = [];
  const citas: number[] = [];
  let pre = false;

  const parrafo = () => {
    if (salida && !salida.endsWith("\n\n")) salida = salida.replace(/[ \t]+$/, "").replace(/\n?$/, "\n\n");
  };
  const linea = () => {
    if (salida && !salida.endsWith("\n")) salida += "\n";
  };

  for (const trozo of fuente.split(/(<[^>]+>)/)) {
    if (!trozo) continue;
    const etiqueta = /^<\s*(\/)?\s*([a-z][a-z0-9]*)\b([^>]*)>$/i.exec(trozo);
    if (!etiqueta) {
      if (trozo.startsWith("<!--") || (trozo.startsWith("<") && trozo.endsWith(">"))) continue;
      const texto = decodificarEntidades(pre ? trozo : trozo.replace(/\s+/g, " "));
      if (!pre && !texto.trim() && (!salida || salida.endsWith("\n"))) continue;
      salida += !pre && (!salida || salida.endsWith("\n")) ? texto.replace(/^ /, "") : texto;
      continue;
    }
    const cierra = !!etiqueta[1];
    const nombre = etiqueta[2].toLowerCase();
    const atributos = etiqueta[3];
    if (nombre === "br") {
      salida += "\\\n";
    } else if (nombre === "hr") {
      parrafo();
      salida += "---\n\n";
    } else if (/^h[1-6]$/.test(nombre)) {
      if (cierra) salida += "\n\n";
      else {
        parrafo();
        salida += `${"#".repeat(Number(nombre[1]))} `;
      }
    } else if (nombre === "b" || nombre === "strong") salida += "**";
    else if (nombre === "i" || nombre === "em") salida += "*";
    else if (nombre === "s" || nombre === "strike" || nombre === "del") salida += "~~";
    else if (nombre === "code" && !pre) salida += "`";
    else if (nombre === "pre") {
      pre = !cierra;
      if (cierra) salida += "\n```\n\n";
      else {
        parrafo();
        salida += "```\n";
      }
    } else if (nombre === "blockquote") {
      if (cierra) {
        const desde = citas.pop();
        if (desde !== undefined) {
          const dentro = salida.slice(desde).trim();
          salida = `${salida.slice(0, desde)}${dentro.split("\n").map((l) => (l ? `> ${l}` : ">")).join("\n")}\n\n`;
        }
      } else {
        parrafo();
        citas.push(salida.length);
      }
    } else if (nombre === "ul" || nombre === "ol") {
      if (cierra) {
        listas.pop();
        if (!listas.length) parrafo();
        else linea();
      } else {
        if (!listas.length) parrafo();
        else linea();
        listas.push({ ordenada: nombre === "ol", n: 0 });
      }
    } else if (nombre === "li") {
      if (cierra) linea();
      else {
        linea();
        const l = listas[listas.length - 1];
        if (l) l.n++;
        salida += `${"  ".repeat(Math.max(0, listas.length - 1))}${l?.ordenada ? `${l.n}.` : "-"} `;
      }
    } else if (nombre === "a") {
      if (cierra) {
        const href = enlaces.pop();
        salida += href ? `](${href})` : "";
      } else {
        const href = /\bhref\s*=\s*"([^"]*)"|\bhref\s*=\s*'([^']*)'/i.exec(atributos);
        const url = href ? decodificarEntidades(href[1] ?? href[2]) : null;
        enlaces.push(url && /^(https?:|mailto:)/i.test(url) ? url : null);
        if (enlaces[enlaces.length - 1]) salida += "[";
      }
    } else if (BLOQUES.has(nombre)) {
      parrafo();
    }
  }
  return salida.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}
