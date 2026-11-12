---
lane: 277
titulo: Archivos grandes (libros, audiolibros, videos)
plane: "- (infraestructura para #29 y #35)"
estado: integrada
rama: task/lane-277-archivos-grandes
agente: "claude (orquestador) + agy"
actualizado: 2026-11-07
---

# Lane 277 — Archivos grandes (libros, audiolibros, videos)

## Especificación
No es un ítem de Plane: es el **prerrequisito** de la Biblioteca (270, Plane #29: leer libros y escuchar audiolibros) y de Social (276, Plane #35: videos).

Hoy (verificado el 2026-11-07, `src/lib/archivos.ts`): todo archivo subido se guarda **dentro de la base** (`Archivo.datos`, bytea) y pasa por una función de Vercel, que corta el cuerpo en **4,5 MB**; la app limita a 4 MB. Un ePub va de 1 a 20 MB, un audiolibro de 50 a 500 MB y un video de 10 a 200 MB: no entran, y guardarlos en Postgres agrandaría la base de producción.

Qué se hace: almacenamiento de objetos con **subida directa del navegador** (sin pasar por la función):
1. El navegador pide permiso a `POST /api/almacen/subida` (tipo, tamaño, propósito). El servidor valida sesión, tipo y tamaño, y devuelve una **URL firmada de subida** (vence en minutos) y la clave del objeto.
2. El navegador sube el archivo directo al almacenamiento con esa URL (con barra de progreso).
3. Para leerlo, `GET /api/almacen/<clave>` valida permisos y **redirige** a una URL firmada de lectura de corta duración (sirve rangos: el audio y el video se pueden adelantar).
4. La tabla `Objetos_Almacen` guarda clave, tipo, tamaño, propósito, dueño y fecha.

## Decisión pendiente de Gabriel (bloquea esta lane)
- **D1 · Proveedor.** Propuesta del orquestador: **Supabase Storage** (el proyecto ya usa Supabase para la base: misma cuenta y factura; bucket privado; URLs firmadas de subida y lectura por API REST, sin paquete nuevo). Alternativa: Vercel Blob (paquete `@vercel/blob`, token `BLOB_READ_WRITE_TOKEN`).
- **D2 · Clave de servicio.** Con Supabase hace falta `SUPABASE_SERVICE_ROLE_KEY` en `.env.local` y en Vercel (hoy solo están `NEXT_PUBLIC_SUPABASE_URL` y la clave anónima). La carga Gabriel; nunca se escribe en el vault ni en el código.
- **D3 · Topes por tipo** (propuesta): ePub/PDF 100 MB · audio (mp3, m4a/m4b, ogg) 1 GB · video (mp4, webm) 300 MB · imagen 15 MB.
- **D4 · Cuota y costo.** Supabase cobra almacenamiento y salida de datos; Gabriel confirma el plan antes de habilitar audiolibros y videos.

## Decisiones del orquestador
- D5 · (2026-11-07) **Fase A sin esperar a Gabriel**: las reglas puras (`src/lib/almacen/reglas.ts`: propósitos, tipos MIME y extensiones, topes, armado y validación de la clave) y el permiso `puedeLeer` no dependen del proveedor. Se hacen ya, con los topes de la propuesta D3 como constantes en un solo lugar: si Gabriel cambia D3 se edita una tabla. El esquema (`ObjetoAlmacen`) **no** entra en la fase A: `prisma/schema.prisma` lo tienen abiertas la 270 y la 276 (D-BP5).
- D6 · El tipo de propósito y la tabla de topes son la única fuente para el servidor (validar antes de firmar) y para el navegador (rechazar antes de pedir la firma).

## Arquitectura (con D1 = Supabase)
- Bucket privado `ordo` (lo crea el orquestador en el panel de Supabase, con el tamaño máximo por archivo de D3).
- `src/lib/almacen/reglas.ts` (puro) + test: tipos y topes por propósito (`libro`, `audiolibro`, `video`, `imagen`), armado de clave `<proposito>/<usuarioId>/<uuid>.<ext>`.
- `src/lib/almacen/supabase.ts`: `firmarSubida(clave)`, `firmarLectura(clave, segundos)`, `borrarObjeto(clave)` con `fetch` a `${NEXT_PUBLIC_SUPABASE_URL}/storage/v1/...` y la clave de servicio (solo servidor).
- `prisma/schema.prisma`: modelo `ObjetoAlmacen` (`Objetos_Almacen`).
- `src/app/api/almacen/subida/route.ts` (POST) y `src/app/api/almacen/[...clave]/route.ts` (GET → redirect 302).
- `src/lib/almacen/subirArchivo.ts` (cliente): pide la URL, sube con `XMLHttpRequest` (progreso), confirma.
- Los permisos de lectura los define cada módulo que lo usa (Biblioteca: la familia; Social: según el post); esta lane deja un gancho `puedeLeer(objeto, usuario)` que por defecto permite al dueño y a los padres.

## Archivos en alcance
`prisma/schema.prisma` · `src/lib/almacen/**` · `src/app/api/almacen/**`

## Microtareas

### Fase A (D5) — sin depender del proveedor

#### A1 · Reglas puras del almacén [agy]
- [x] hecha (`0521845`, agy, idéntica al ensayo)
Precondición: la carpeta `src/lib/almacen/` no existe.
Crear `src/lib/almacen/reglas.ts` con **exactamente** este contenido:
```ts
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
```
Verificación: `npx tsc --noEmit`; `npx eslint src/lib/almacen` → 0 problemas.

#### A2 · Test de las reglas [agy]
- [x] hecha (`0521845`, agy, idéntica al ensayo)
Crear `src/lib/almacen/reglas.test.ts` con **exactamente** este contenido:
```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { armarClave, esProposito, leerClave, puedeLeer, validarArchivo } from "./reglas.ts";

const MB = 1024 * 1024;
const UUID = "3f2b8c1e-9a4d-4e6f-8b7a-1c2d3e4f5a6b";

test("esProposito acepta solo los cuatro propósitos", () => {
  for (const p of ["libro", "audiolibro", "video", "imagen"]) assert.equal(esProposito(p), true);
  assert.equal(esProposito("documento"), false);
  assert.equal(esProposito(undefined), false);
});

test("validarArchivo acepta tipo y tamaño dentro del tope", () => {
  assert.deepEqual(validarArchivo("libro", "application/epub+zip", 30 * MB), { ok: true, tipo: "application/epub+zip", extension: "epub" });
  assert.deepEqual(validarArchivo("audiolibro", "audio/mpeg", 200 * MB), { ok: true, tipo: "audio/mpeg", extension: "mp3" });
  assert.deepEqual(validarArchivo("video", "video/mp4; codecs=avc1", 10 * MB), { ok: true, tipo: "video/mp4", extension: "mp4" });
});

test("validarArchivo deduce el tipo por la extensión cuando el navegador no lo da", () => {
  assert.deepEqual(validarArchivo("audiolibro", "", 100 * MB, "Capitulo 1.M4B"), { ok: true, tipo: "audio/x-m4b", extension: "m4b" });
  assert.deepEqual(validarArchivo("libro", "application/octet-stream", MB, "libro.epub"), { ok: true, tipo: "application/epub+zip", extension: "epub" });
  assert.equal(validarArchivo("libro", "", MB, "sin-extension").ok, false);
});

test("validarArchivo rechaza propósito, tipo y tamaño inválidos", () => {
  assert.deepEqual(validarArchivo("documento", "application/pdf", MB), { ok: false, error: "Propósito desconocido" });
  assert.deepEqual(validarArchivo("libro", "audio/mpeg", MB), { ok: false, error: "Tipo de archivo no permitido para libro" });
  assert.deepEqual(validarArchivo("imagen", "image/png", 0), { ok: false, error: "Tamaño inválido" });
  assert.deepEqual(validarArchivo("imagen", "image/png", 1.5), { ok: false, error: "Tamaño inválido" });
  assert.deepEqual(validarArchivo("video", "video/webm", 301 * MB), { ok: false, error: "El archivo supera el máximo de 300 MB" });
  assert.equal(validarArchivo("libro", "application/pdf", 100 * MB).ok, true);
  assert.equal(validarArchivo("libro", "application/pdf", 100 * MB + 1).ok, false);
});

test("armarClave y leerClave van y vuelven", () => {
  const clave = armarClave("audiolibro", 3, UUID.toUpperCase(), "m4b");
  assert.equal(clave, `audiolibro/3/${UUID}.m4b`);
  assert.deepEqual(leerClave(clave), { proposito: "audiolibro", usuarioId: 3, uuid: UUID, extension: "m4b" });
});

test("armarClave lanza y leerClave devuelve null ante datos inválidos", () => {
  assert.throws(() => armarClave("libro", 0, UUID, "epub"));
  assert.throws(() => armarClave("libro", 3, "no-es-uuid", "epub"));
  assert.throws(() => armarClave("libro", 3, UUID, "e/pub"));
  assert.equal(leerClave(`libro/3/../${UUID}.epub`), null);
  assert.equal(leerClave(`otro/3/${UUID}.epub`), null);
  assert.equal(leerClave(`libro/3/${UUID}.epub/extra`), null);
  assert.equal(leerClave(`libro/03/${UUID}.epub`), null);
});

test("puedeLeer: el dueño y los padres", () => {
  assert.equal(puedeLeer({ duenoId: 3 }, { id: 3, esPadre: false }), true);
  assert.equal(puedeLeer({ duenoId: 3 }, { id: 4, esPadre: false }), false);
  assert.equal(puedeLeer({ duenoId: 3 }, { id: 1, esPadre: true }), true);
});
```
Verificación: `node --test --disable-warning=MODULE_TYPELESS_PACKAGE_JSON src/lib/almacen/reglas.test.ts` → 7 pass, 0 fail.

### Fase B — después de D1–D4
Se escriben con código exacto **cuando Gabriel decida D1–D4** (cambia la API del proveedor). Orden: esquema → reglas puras + tests → cliente del proveedor → rutas → `subirArchivo` → prueba con un ePub de 30 MB y un mp3 de 200 MB en una base local.

## Criterios de aceptación
- Un archivo de 200 MB se sube desde el navegador con progreso y se reproduce adelantando (rangos).
- Ningún archivo grande pasa por una función de Vercel ni se guarda en Postgres.
- Sin sesión o sin permiso, `GET /api/almacen/...` responde 401/404.

## Gates
`npx prisma validate` · `npx tsc --noEmit` · `npm test` · `npx eslint src/lib/almacen src/app/api/almacen`

## Pendientes
- D1–D4 de Gabriel (fase B: proveedor, esquema, rutas, subida).

## Hallazgos

## Bitácora
- 2026-11-07 · claude (orquestador) · RESERVA · creada como prerrequisito de 270 y 276
- 2026-11-07 · claude (orquestador) · D5/D6: fase A (reglas puras + `puedeLeer`) sin esperar a D1–D4.
- 2026-11-07 · claude (orquestador) + agy · fase A: A1–A2 idénticas al ensayo; tsc 0, eslint 0, tests 631/580/0. Fase B espera D1–D4 de Gabriel y que 270/276 liberen `prisma/schema.prisma`.
- 2026-11-07 · claude (orquestador) · ENTREGA · PR #65 a dev (`scripts/abrir-pr.sh`: origin/dev incluido, tests + tsc verdes) con OK de Gabriel. Lo integra Gabriel; después `scripts/limpiar-lane.sh 277`.
- 2026-11-07 · claude (orquestador) · INTEGRADA · PR #65 a `dev` (merge commit); dev → main en PR #84 (lo integra Gabriel)
