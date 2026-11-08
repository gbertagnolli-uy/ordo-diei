// Asistente del diario (lane 298): herramientas, niveles de permiso y registro de lo ya ejecutado. Reglas puras: sin base, sin red.
// Portado de vendor/moodiary/packages/feature/moodiary_assistant/lib/src/data/{assistant_defs,assistant_tools}.dart (ZhuJHua/moodiary@2c552dd).
// Diferencias (ver LANE_298 del vault): ids numéricos, ánimo 1–5, categorías con madre, sin memoria (lane 299) ni `runJavascript`,
// y `deleteDiary` es destructivo porque acá borrar una entrada es permanente (no hay papelera).

export const HERRAMIENTAS = [
  "searchDiaries",
  "getDiary",
  "diaryOverview",
  "createDiary",
  "updateDiary",
  "deleteDiary",
  "listCategories",
  "createCategory",
  "updateCategory",
  "deleteCategory",
] as const;
export type Herramienta = (typeof HERRAMIENTAS)[number];

export const esHerramienta = (v: unknown): v is Herramienta => typeof v === "string" && (HERRAMIENTAS as readonly string[]).includes(v);

/** moodiary `AssistantPermissionMode`: `confirm` pide permiso para todo lo que cambia datos, `auto` solo para lo destructivo, `full` no pide. */
export const MODOS_PERMISO = ["confirm", "auto", "full"] as const;
export type ModoPermiso = (typeof MODOS_PERMISO)[number];
export const modoPermisoDe = (v: unknown): ModoPermiso => (MODOS_PERMISO as readonly unknown[]).includes(v) ? (v as ModoPermiso) : "confirm";
export const confirmaEscrituras = (modo: ModoPermiso) => modo !== "full";

export type Nivel = "read" | "write" | "destructive";

type Objeto = Record<string, unknown>;
const esObjeto = (v: unknown): v is Objeto => typeof v === "object" && v !== null && !Array.isArray(v);

/** moodiary `assistantToolIds`: ids sueltos o en lista, sin repetir ni vacíos. Acá son enteros, pero llegan como texto o número. */
export function idsDe(entrada: Objeto): string[] {
  const crudo = entrada.ids ?? entrada.id;
  const salida = new Set<string>();
  if (typeof crudo === "string" || typeof crudo === "number") {
    const t = String(crudo).trim();
    if (t) salida.add(t);
  } else if (Array.isArray(crudo)) {
    for (const e of crudo) {
      const t = String(e).trim();
      if (t) salida.add(t);
    }
  }
  return [...salida];
}

/** moodiary `assistantToolItems`: `items` como lista u objeto, o un `ids` que se reparte, o la entrada misma. */
export function itemsDe(entrada: Objeto): Objeto[] {
  const crudo = entrada.items;
  if (Array.isArray(crudo)) return crudo.filter(esObjeto);
  if (esObjeto(crudo)) return [crudo];
  const ids = idsDe(entrada);
  if (ids.length) {
    const { ids: _quitado, ...comun } = entrada;
    void _quitado;
    return ids.map((id) => ({ ...comun, id }));
  }
  return [entrada];
}

const reescribeContenido = (args: Objeto) => itemsDe(args).some((e) => e.content !== undefined && e.content !== null);

/** moodiary `assistantToolTier`. Editar el texto de una entrada pisa lo que había: destructivo. */
export function nivelDe(h: Herramienta, args: Objeto): Nivel {
  switch (h) {
    case "searchDiaries":
    case "getDiary":
    case "diaryOverview":
    case "listCategories":
      return "read";
    case "updateDiary":
      return reescribeContenido(args) ? "destructive" : "write";
    case "createDiary":
    case "createCategory":
    case "updateCategory":
      return "write";
    case "deleteDiary":
    case "deleteCategory":
      return "destructive";
  }
}

/** moodiary `assistantToolNeedsConfirmation`. */
export function necesitaConfirmacion(modo: ModoPermiso, nivel: Nivel): boolean {
  if (modo === "confirm") return nivel !== "read";
  if (modo === "auto") return nivel === "destructive";
  return false;
}

export const PREFIJO_OMITIDA = "Skipped:";
export const PREFIJO_FALLO = "Failed:";
export const omitida = (herramienta: string) => `${PREFIJO_OMITIDA} the user declined ${herramienta}. Do not retry it; ask the user what they want instead.`;

/** Marca que el usuario le pide «seguir» a un turno cortado (moodiary `continueTurnMarker` / `continueTurnForModel`). */
export const MARCA_CONTINUAR = "[continue]";
export const CONTINUAR_PARA_EL_MODELO = "Continue exactly where you left off, without repeating what you already said.";

export const MAX_TURNOS = 12;
export const MAX_TOKENS_RESPUESTA = 8192;
export const MAX_NOTAS = 2000;

export const MAX_LECTURA = 10;
export const MAX_ESCRITURA = 20;
export const BUSQUEDA_POR_DEFECTO = 8;
export const BUSQUEDA_MAXIMA = 20;
export const MAX_EXTRACTO = 200;
export const MAX_TEXTO_COMPLETO = 4000;

export interface DefinicionHerramienta {
  nombre: Herramienta;
  descripcion: string;
  esquema: Record<string, unknown>;
}

const ANIMO = {
  type: ["integer", "null"],
  minimum: 1,
  maximum: 5,
};

/** Las herramientas tal cual se le muestran al modelo: nombre, contrato y esquema JSON. */
export const DEFINICIONES: DefinicionHerramienta[] = [
  {
    nombre: "searchDiaries",
    descripcion:
      "Search or browse the user's personal diary. Every argument is an optional filter. Give a query to search by words " +
      "(every term must appear, accents are ignored); leave it out to browse by date and/or category. " +
      "Results carry id, date, mood and a short excerpt — not the full text (use getDiary for that) — and state the total " +
      "number of matches, which may exceed what is returned; when it does, say so instead of presenting the rows as the complete set. " +
      "Mood is a number from 1 (lowest) to 5 (highest); the result names it with the user's own labels. Null means not recorded. " +
      "Call this whenever the user asks about what they wrote, and to get ids before editing or deleting entries.",
    esquema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description:
            "What to look for: keywords. Terms combine with AND — every term must appear, so prefer one or two specific words over a list of synonyms. Omit to browse by the filters below.",
        },
        categoryId: { type: "integer", description: "Restrict to one category and its subcategories (id from listCategories)." },
        startDate: { type: "string", description: "Inclusive start, YYYY-MM-DD." },
        endDate: { type: "string", description: "Inclusive end, YYYY-MM-DD." },
        sort: {
          type: "string",
          enum: ["newest", "oldest", "relevance"],
          description: "Defaults to relevance with a query, newest without one. relevance needs a query.",
        },
        limit: { type: "integer", description: `How many entries to return. Default ${BUSQUEDA_POR_DEFECTO}, max ${BUSQUEDA_MAXIMA}.`, minimum: 1, maximum: BUSQUEDA_MAXIMA },
      },
    },
  },
  {
    nombre: "getDiary",
    descripcion: `Read the full text of diary entries by id (searchDiaries returns excerpts only). Pass every id you need in one call. Max ${MAX_LECTURA} per call.`,
    esquema: {
      type: "object",
      properties: { ids: { type: "array", items: { type: "integer" }, description: `Entry ids from searchDiaries. Max ${MAX_LECTURA}.` } },
      required: ["ids"],
    },
  },
  {
    nombre: "diaryOverview",
    descripcion:
      "Aggregate stats: total entries, per-category counts, the date span, and the mood distribution. Prefer this over counting query results yourself for \"how many\", \"which category\", \"since when\" or mood-trend questions.",
    esquema: { type: "object", properties: {} },
  },
  {
    nombre: "createDiary",
    descripcion:
      "Save content as new diary entries. Call this when the user asks you to write something down or to keep it as an entry. Bodies are Markdown. The entry goes to today unless you pass a date.",
    esquema: {
      type: "object",
      properties: {
        items: {
          type: "array",
          description: `One object per entry. Pass them all in one call. Max ${MAX_ESCRITURA} per call.`,
          items: {
            type: "object",
            properties: {
              title: { type: "string", description: "Optional title." },
              content: { type: "string", description: "Body, Markdown." },
              date: { type: "string", description: "Optional day, YYYY-MM-DD (not in the future). Defaults to today." },
              mood: { ...ANIMO, description: "Mood from 1 (lowest) to 5 (highest). Null means not recorded. Omit unless the user conveyed one." },
              categoryId: { type: "integer", description: "Optional category id from listCategories." },
            },
            required: ["content"],
          },
        },
      },
      required: ["items"],
    },
  },
  {
    nombre: "updateDiary",
    descripcion:
      "Edit diary entries by id. Within an item, only the fields you pass change; the rest are left alone. Photos, tags, place and weather are never touched. Pass every edit in one call. Get the ids from searchDiaries first.",
    esquema: {
      type: "object",
      properties: {
        items: {
          type: "array",
          description: `One object per entry to edit. Max ${MAX_ESCRITURA} per call.`,
          items: {
            type: "object",
            properties: {
              id: { type: "integer", description: "Entry id from searchDiaries." },
              title: { type: "string", description: "New title." },
              content: { type: "string", description: "New body, Markdown. Replaces the whole body." },
              date: { type: "string", description: "New day, YYYY-MM-DD (not in the future)." },
              mood: { ...ANIMO, description: "New mood from 1 to 5. Null means not recorded; omit to keep it unchanged." },
              categoryId: { type: ["integer", "null"], description: "New category id; null removes the category." },
            },
            required: ["id"],
          },
        },
      },
      required: ["items"],
    },
  },
  {
    nombre: "deleteDiary",
    descripcion: `Delete diary entries by id. THIS IS PERMANENT: there is no recycle bin. Only do it when the user clearly asked. Pass every id in one call. Get the ids from searchDiaries first. Max ${MAX_ESCRITURA} per call.`,
    esquema: {
      type: "object",
      properties: { ids: { type: "array", items: { type: "integer" }, description: `Entry ids from searchDiaries. Max ${MAX_ESCRITURA}.` } },
      required: ["ids"],
    },
  },
  {
    nombre: "listCategories",
    descripcion: "List every diary category with its id and its parent. Call this to get an id before filing, renaming or deleting a category.",
    esquema: { type: "object", properties: {} },
  },
  {
    nombre: "createCategory",
    descripcion: `Add diary categories. Pass every name in one call. Max ${MAX_ESCRITURA} per call.`,
    esquema: {
      type: "object",
      properties: {
        items: {
          type: "array",
          description: "One object per category to add.",
          items: {
            type: "object",
            properties: {
              name: { type: "string", description: "Category name." },
              parentId: { type: ["integer", "null"], description: "Optional parent category id, to make a subcategory." },
            },
            required: ["name"],
          },
        },
      },
      required: ["items"],
    },
  },
  {
    nombre: "updateCategory",
    descripcion: `Rename categories by id (from listCategories), or move them under another parent. Pass every change in one call. Max ${MAX_ESCRITURA} per call.`,
    esquema: {
      type: "object",
      properties: {
        items: {
          type: "array",
          description: "One object per category to change.",
          items: {
            type: "object",
            properties: {
              id: { type: "integer", description: "Category id from listCategories." },
              name: { type: "string", description: "New name." },
              parentId: { type: ["integer", "null"], description: "New parent id; null makes it a top-level category. Omit to keep it." },
            },
            required: ["id"],
          },
        },
      },
      required: ["items"],
    },
  },
  {
    nombre: "deleteCategory",
    descripcion: `Delete categories by id. A category only goes while it holds no entries and no subcategories — refile them first. Pass every id in one call. Max ${MAX_ESCRITURA} per call.`,
    esquema: {
      type: "object",
      properties: { ids: { type: "array", items: { type: "integer" }, description: "Category ids from listCategories." } },
      required: ["ids"],
    },
  },
];

export const definicionDe = (nombre: string): DefinicionHerramienta | undefined => DEFINICIONES.find((d) => d.nombre === nombre);

// ── Registro de lo ejecutado ────────────────────────────────────────────────

export interface LlamadaRegistrada {
  id: string;
  nombre: string;
  /** Argumentos como texto JSON. */
  args: string;
  resultado: string;
  hecha: boolean;
}

export function decodificarArgs(crudo: string): Objeto {
  if (!crudo.trim()) return {};
  try {
    const v: unknown = JSON.parse(crudo);
    return esObjeto(v) ? v : {};
  } catch {
    return {};
  }
}

const recortar = (s: unknown, max = 60) => {
  const t = typeof s === "string" ? s.trim() : "";
  return t.length > max ? `${t.slice(0, max)}…` : t;
};

const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;

/** Resumen de una línea de lo que hizo una herramienta (moodiary `summaryOf` y los `_summarize*`), para la fila del chat. */
export function resumenDe(nombre: string, args: Objeto, salida: string): string {
  if (salida.startsWith(PREFIJO_FALLO)) return "Falló";
  if (salida.startsWith(PREFIJO_OMITIDA)) return "Rechazada";
  const items = itemsDe(args);
  switch (nombre) {
    case "searchDiaries": {
      const m = /^(?:at least )?(\d+) matches/.exec(salida);
      if (!m) return "Sin resultados";
      const partes = [plural(Number(m[1]), "entrada", "entradas"), recortar(args.query)];
      const desde = recortar(args.startDate);
      const hasta = recortar(args.endDate);
      if (desde) partes.push(hasta ? `${desde} – ${hasta}` : desde);
      return partes.filter(Boolean).join(" · ");
    }
    case "getDiary":
      return `Leyó ${plural(idsDe(args).length, "entrada", "entradas")}`;
    case "diaryOverview": {
      const m = /^Total entries=(\d+)/.exec(salida);
      return m ? plural(Number(m[1]), "entrada", "entradas") : "Sin entradas";
    }
    case "listCategories": {
      const n = salida.split("\n").filter((l) => l.startsWith("id=")).length;
      return n ? plural(n, "categoría", "categorías") : "Sin categorías";
    }
    case "deleteDiary":
      return items.length <= 1 ? "Borró una entrada" : `Borró ${items.length} entradas`;
    case "createDiary":
      return items.length > 1 ? plural(items.length, "entrada nueva", "entradas nuevas") : recortar(items[0]?.title) || "Entrada nueva";
    case "updateDiary":
      return items.length > 1 ? `Editó ${plural(items.length, "entrada", "entradas")}` : "Entrada editada";
    case "createCategory":
    case "updateCategory":
      return items.length > 1 ? plural(items.length, "categoría", "categorías") : recortar(items[0]?.name) || "Hecho";
    case "deleteCategory":
      return items.length > 1 ? `Borró ${plural(items.length, "categoría", "categorías")}` : "Borró una categoría";
    default:
      return "Hecho";
  }
}

/** moodiary `recordOf`: bloque `[tools already run]` que se antepone a un turno del asistente para que no repita búsquedas. */
export function registroDe(llamadas: LlamadaRegistrada[]): string {
  const lineas: string[] = [];
  for (const l of llamadas) {
    if (!l.hecha) continue;
    const args = l.args.trim() ? l.args : "{}";
    const resumen = resumenDe(l.nombre, decodificarArgs(l.args), l.resultado);
    lineas.push(`- ${l.nombre}(${args})${resumen ? ` → ${resumen}` : ""}`);
  }
  return lineas.length ? `[tools already run]\n${lineas.join("\n")}` : "";
}
