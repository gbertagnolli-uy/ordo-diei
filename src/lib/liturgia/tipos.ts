// Formato estructurado de la liturgia (SPEC liturgia §4). Lo produce scripts/liturgia/parser.ts
// a partir de la salida de Divinum Officium y lo lee la app (lib/liturgia/*, /api/liturgia/*).

export type VersionLiturgica = "1906" | "1888" | "1570";
export const VERSIONES: readonly VersionLiturgica[] = ["1906", "1888", "1570"];
export const VERSION_PREDETERMINADA: VersionLiturgica = "1906";

export type ColorLiturgico = "blanco" | "rojo" | "verde" | "morado" | "negro";
export type TiempoLiturgico =
  | "adviento"
  | "navidad"
  | "epifania"
  | "septuagesima"
  | "cuaresma"
  | "pasion"
  | "pascua"
  | "pentecostes";

export type Segmento =
  | { t: "texto"; v: string }
  | { t: "rubrica"; v: string } // líneas rojas («!», instrucciones)
  | { t: "versiculo"; v: string } // ℣.
  | { t: "responsorio"; v: string } // ℟.
  | { t: "antifona"; v: string } // Ant.
  | { t: "verso"; num: string; v: string } // salmos: «92:1»
  | { t: "titulo"; v: string } // «Psalmus 92», «Hymnus»
  | { t: "cruz" } // ✠ suelta
  | { t: "falta" }; // DO no trae esta línea en español (D52): la UI dice «sin traducción»

/** Un bloque es una fila de DO: columna latina y columna española alineadas. */
export type Bloque = {
  la: Segmento[];
  /** `null` cuando no hay ninguna línea traducida (todo cayó a otro idioma). */
  es: Segmento[] | null;
  /** `true` si `es` es `null` porque DO cayó a otro idioma (D52); nunca se muestra inglés como español. */
  esFalta?: boolean;
};

export type Seccion = {
  clave: string;
  tituloLa: string;
  tituloEs: string | null;
  /** SHA-256 (hex) de cada `Bloque`, en orden (ver `BloqueLiturgico`). */
  bloques: string[];
  /** Solo Misa: parte propia del día (Introito, Colecta…) frente al Ordinario. */
  propio?: boolean;
};

export type TituloDia = {
  titulo: string;
  rango: string;
  lineas: string[];
  color: ColorLiturgico;
};

export type Documento = { titulo: TituloDia | null; secciones: Seccion[] };

/** Documento con los bloques ya resueltos (lo que devuelve la API). */
export type SeccionResuelta = Omit<Seccion, "bloques"> & { bloques: Bloque[] };
export type DocumentoResuelto = { titulo: TituloDia | null; secciones: SeccionResuelta[] };

export type TipoDocumento = "hora" | "missa" | "martyrologium" | "libro";

export type Hora =
  | "Matutinum"
  | "Laudes"
  | "Prima"
  | "Tertia"
  | "Sexta"
  | "Nona"
  | "Vespera"
  | "Completorium";
export const HORAS: readonly Hora[] = [
  "Matutinum",
  "Laudes",
  "Prima",
  "Tertia",
  "Sexta",
  "Nona",
  "Vespera",
  "Completorium",
];

/** Nombre de la versión tal como la pide Divinum Officium. */
export function nombreVersionDO(v: VersionLiturgica): string {
  return `Tridentine - ${v}`;
}

export function esVersionLiturgica(v: unknown): v is VersionLiturgica {
  return typeof v === "string" && (VERSIONES as readonly string[]).includes(v);
}

export function esHora(v: unknown): v is Hora {
  return typeof v === "string" && (HORAS as readonly string[]).includes(v);
}
