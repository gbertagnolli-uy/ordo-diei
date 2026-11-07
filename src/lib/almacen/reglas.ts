// Reglas del almacenamiento de archivos grandes (lane 277, fase A: D5, D6).
// Puro: sin red ni base. Lo usan el servidor (antes de firmar una subida) y el navegador (antes de pedir la firma).

export const PROPOSITOS = ["libro", "audiolibro", "video", "imagen"] as const;
export type Proposito = (typeof PROPOSITOS)[number];

const MB = 1024 * 1024;

/** Topes y tipos por propósito (propuesta D3: si Gabriel la cambia, se edita solo esta tabla). Tipo MIME → extensión. */
export const REGLAS: Record<Proposito, { maxBytes: number; tipos: Record<string, string> }> = {
  libro: {
    maxBytes: 100 * MB,
    tipos: { "application/epub+zip": "epub", "application/pdf": "pdf" },
  },
  audiolibro: {
    maxBytes: 1024 * MB,
    tipos: { "audio/mpeg": "mp3", "audio/mp4": "m4a", "audio/x-m4a": "m4a", "audio/x-m4b": "m4b", "audio/ogg": "ogg" },
  },
  video: {
    maxBytes: 300 * MB,
    tipos: { "video/mp4": "mp4", "video/webm": "webm" },
  },
  imagen: {
    maxBytes: 15 * MB,
    tipos: { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif" },
  },
};

export function esProposito(x: unknown): x is Proposito {
  return typeof x === "string" && (PROPOSITOS as readonly string[]).includes(x);
}

export type Validacion = { ok: true; tipo: string; extension: string } | { ok: false; error: string };

/**
 * Valida propósito, tipo y tamaño. Si el navegador no informa el tipo (pasa con .m4b), se deduce de la extensión del nombre.
 * Devuelve el tipo MIME normalizado y la extensión con la que se guarda.
 */
export function validarArchivo(proposito: unknown, tipo: string, tamano: number, nombre = ""): Validacion {
  if (!esProposito(proposito)) return { ok: false, error: "Propósito desconocido" };
  const regla = REGLAS[proposito];
  let mime = tipo.split(";")[0].trim().toLowerCase();
  if (!mime || mime === "application/octet-stream") {
    const ext = nombre.includes(".") ? nombre.split(".").pop()!.toLowerCase() : "";
    mime = Object.keys(regla.tipos).find((m) => regla.tipos[m] === ext) ?? mime;
  }
  const extension = regla.tipos[mime];
  if (!extension) return { ok: false, error: `Tipo de archivo no permitido para ${proposito}` };
  if (!Number.isInteger(tamano) || tamano <= 0) return { ok: false, error: "Tamaño inválido" };
  if (tamano > regla.maxBytes) return { ok: false, error: `El archivo supera el máximo de ${regla.maxBytes / MB} MB` };
  return { ok: true, tipo: mime, extension };
}

const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const CLAVE_RE = new RegExp(`^(${PROPOSITOS.join("|")})/([1-9][0-9]*)/(${UUID})\\.([a-z0-9]{2,5})$`);

export type Clave = { proposito: Proposito; usuarioId: number; uuid: string; extension: string };

/** Clave del objeto: `<propósito>/<usuarioId>/<uuid>.<extensión>`. Lanza si algún dato no es válido. */
export function armarClave(proposito: Proposito, usuarioId: number, uuid: string, extension: string): string {
  const clave = `${proposito}/${usuarioId}/${uuid.toLowerCase()}.${extension}`;
  if (!CLAVE_RE.test(clave)) throw new Error("Clave de almacenamiento inválida");
  return clave;
}

/** Lee una clave; null si no tiene exactamente la forma de `armarClave` (así no se cuela `..` ni otra carpeta). */
export function leerClave(clave: string): Clave | null {
  const m = CLAVE_RE.exec(clave);
  if (!m) return null;
  return { proposito: m[1] as Proposito, usuarioId: Number(m[2]), uuid: m[3], extension: m[4] };
}

/** Permiso de lectura por defecto: el dueño y los padres. Cada módulo (Biblioteca, Social) puede ampliarlo. */
export function puedeLeer(objeto: { duenoId: number }, usuario: { id: number; esPadre: boolean }): boolean {
  return usuario.esPadre || objeto.duenoId === usuario.id;
}
