---
lane: 270
titulo: Biblioteca (basada en BookOrbit)
plane: "#29"
estado: integrada
rama: task/lane-270-biblioteca-bookorbit
agente: "claude (orquestador) + agy"
actualizado: 2026-11-07
---

# Lane 270 — Biblioteca (basada en BookOrbit)

## Especificación
Plane #29: «Usar BookOrbit para crear una biblioteca, donde se puedan leer libros, escuchar audiolibros, gestionar la biblioteca, buscar, filtrar, pero sin tanta analítica de estadísticas de la biblioteca y simplificando la interfaz. Cada pantalla debe tener un objetivo principal y tener menos densidad de elementos y textos, debe ser limpia y minimalista.» También enlaza `Oghamark/homebranch`.

Pantallas (una por objetivo):
| Ruta | Objetivo | Contenido mínimo |
|---|---|---|
| `/dashboard/biblioteca` | **Encontrar un libro** | buscador arriba; filtros en una fila de chips (Libros / Audiolibros · Estado: Sin empezar / Leyendo / Leído · Estante); grilla de portadas (título y autor debajo); «Seguir leyendo» como primera fila si hay libros a medias |
| `/dashboard/biblioteca/libro/[id]` | **Empezar o seguir** | portada grande, título, autor, sinopsis (3 líneas + «más»), botón principal «Leer» / «Escuchar» / «Seguir (34 %)», estado de lectura |
| `/dashboard/biblioteca/leer/[id]` | **Leer** | lector a pantalla completa: ePub (lector existente de LANE_189 con epub.js) o PDF; guarda la posición sola |
| `/dashboard/biblioteca/escuchar/[id]` | **Escuchar** | reproductor: portada, play/pausa, −15 s/+30 s, velocidad, capítulos; guarda la posición sola |
| `/dashboard/biblioteca/gestionar` (padres) | **Cargar y ordenar** | subir libros (ePub, PDF, mp3/m4b), editar título/autor/sinopsis/portada, estantes, borrar |

Sin estadísticas, sin metadatos externos, sin Kobo/KOReader/OPDS/email, sin multi-biblioteca.

## Repos de origen
- `bookorbit/bookorbit@6ad1445` (AGPL-3.0 + `ADDITIONAL_TERMS.md`): **modelo de datos y reglas** — `server/src/db/schema/books.ts` (`books`, `book_files`), `reader.ts` (`user_book_status` con estados, `reading_progress` con CFI/página/segundos, `audiobook_progress`), `collections.ts`; lógica de estados en `server/src/modules/reading-state` y `user-book-status`; orden de pistas en `server/src/db/audio-track-order.ts`; reproductor en `client/src/features/reader/audiobook`. Es Vue + NestJS: **se porta la lógica TypeScript, no los componentes Vue**.
- `Oghamark/homebranch-web@5a5b55f` (AGPL-3.0): **interfaz React** — `src/entities/book/ui/{BookCard,AddBookButton,UploadProgressDialog,useBookUpload}`, `src/features/library/components/{SearchLibrary,CollectionToolbar}`, `src/app/routes/dashboard/{library,book,read-book,book-shelf,currently-reading}.tsx`. Usa Chakra UI: se traduce a los componentes shadcn de Ordo.
- Ambos en el scratchpad de la sesión 18058b32 (`repos/bookorbit`, `repos/homebranch/homebranch-web`). D-BP2: licencias pendientes de Gabriel; BookOrbit pide el aviso «Powered by BookOrbit» (`ADDITIONAL_TERMS.md`): se agrega en el pie de `/dashboard/biblioteca` hasta que Gabriel decida.

## Decisiones
- D1 · **Depende de LANE_277** (archivos grandes) para ePub > 4 MB, PDF grandes y audiolibros. Mientras tanto, la fase 1 funciona con archivos ≤ 4 MB vía `/api/upload` existente (ePub/PDF chicos) para no frenar la interfaz.
- D2 · Biblioteca **de la familia**: todos ven todos los libros; solo los padres cargan, editan y borran. El estado y el progreso de lectura son **por usuario**.
- D3 · Estados simplificados de BookOrbit (`user_book_status`): `sin-empezar`, `leyendo`, `leido` (BookOrbit tiene 8; los demás no se usan). Paso automático: progreso > 0 → leyendo; ≥ 98 % → leído; el usuario puede marcar «Leído» a mano.
- D4 · Lector ePub: se reutiliza `LectorEpub` de LANE_189 (epub.js), agregándole `cfiInicial` y `onPosicion(cfi, porcentaje)`. No se suma otro motor (BookOrbit usa readium/foliate).
  - **Reemplazada el 2026-11-07** por el PR #85 (`task/lane-280-lector-ebook-foliate`, integrado en `6b5b86f`): el lector de la biblioteca pasó a foliate-js a pantalla completa (`src/components/biblioteca/lector/`, motor en `public/lector/foliate/`), y `homeschooling/material/LectorEpub.tsx` se simplificó. Sin archivo de lane propio (chocó con el número 280); registro en [[LANE_280_MARCO_GLOBAL_DASHBOARD]].
- D5 · Relación con el hábito «Leer un libro» (`Libro` del módulo hábitos): fuera de la v1; anotado en Pendientes.
- D6 · (orquestador, 2026-11-07) **`THIRD_PARTY_NOTICES.md` se toca al final**, cuando la lane 271 (que también lo modifica) esté en `origin/dev` (D-BP5). Mientras tanto la licencia, el commit y los términos adicionales quedan en `vendor/bookorbit/ORIGEN.md` y `vendor/homebranch-web/ORIGEN.md`. `prisma/schema.prisma` sí se toca ya: seis lanes abiertas le agregan bloques en paralelo (precedente aceptado; se resuelve al integrar conservando ambos lados, AGENTS.md regla 5).
- D7 · (orquestador, 2026-11-07) La lane tiene `node_modules` propio (`npm install`), no un junction al espejo de `dev`: `prisma generate` con el esquema de la lane escribe en `node_modules/.prisma` y pisaría el cliente del directorio principal.
- D8 · (orquestador, 2026-11-07) **Dónde va el esquema.** El ancla de la spec («debajo de `historialAcciones HistorialAccion[]`») aparece 2 veces (en `Usuario` y en `Tarea`) y ahí mismo insertan las lanes 265, 271 y 272; el «al final» también lo usan 271 y 272. Para que la integración no choque: la relación va en `Usuario` debajo de `libros Libro[]` y los modelos van inmediatamente después de `model Libro` (hábitos), que ninguna lane abierta toca.
- D9 · (orquestador, 2026-11-07, hallado en el ensayo) **El enum se llama `EstadoBiblioteca`, no `EstadoLectura`**: `EstadoLectura` ya existe en el esquema (módulo de hábitos, `model LecturaLibro`, valores `por_leer/leyendo/leido`) y `prisma validate` rechaza el duplicado. El bloque «Modelo de datos» de arriba queda como referencia; lo que vale es la microtarea M1.
- D10 · (orquestador, 2026-11-07, ensayo de la fase 2) **PDF: posición a mano.** El visor de PDF del navegador (`<iframe>`) no avisa en qué página está; abrir un PDF lo pone «leyendo» (1 %) y el resto se marca a mano en la ficha («Marcar como leído» / «Volver a leer»). Abre en `#page=` si hay página guardada. El ePub sí guarda CFI y porcentaje solo (PUT `…/posicion` 3 s después del último cambio de página y al salir).
- D11 · (orquestador, 2026-11-07) **Audiolibros a la lane 277.** `ReproductorAudiolibro`, la página `escuchar/[id]` y la subida de audio/carpetas (agrupación de pistas de `AddBookButton`) se hacen cuando 277 permita subir audio: sin eso no hay cómo probarlos. `SubirLibro` acepta ePub y PDF ≤ 4 MB (el límite de `/api/upload` modo estudio) y rechaza audio con un mensaje.
- D12 · (orquestador, 2026-11-07) **Fases 2 y 3 juntas.** Las páginas son finas y hacían falta para probar la interfaz en el navegador, así que se ensayaron juntas: `biblioteca/page.tsx` (lista + «Gestionar» para padres), `libro/[id]`, `leer/[id]`, `gestionar` (redirige a los hijos). `LectorEpub` (lane 189) suma `cfiInicial` y `onPosicion` opcionales sin cambiar su uso en homeschooling. Las páginas traen el libro con `.catch` (la regla `react-hooks/error-boundaries` no deja JSX dentro de `try`).

## Modelo de datos (Prisma; portado de BookOrbit y simplificado)
```prisma
// ← Lane 270: Biblioteca (modelo de bookorbit/bookorbit@6ad1445 server/src/db/schema/{books,reader,collections}.ts, simplificado)
enum EstadoLectura {
  sin_empezar
  leyendo
  leido
}

model BibliotecaLibro {
  id          Int      @id @default(autoincrement())
  titulo      String   @map("Titulo")
  autor       String?  @map("Autor")
  sinopsis    String?  @map("Sinopsis")
  portadaUrl  String?  @map("Portada_URL")
  esAudiolibro Boolean @default(false) @map("Es_Audiolibro")
  cargadoPorId Int?    @map("Cargado_Por_ID")
  createdAt   DateTime @default(now()) @map("Created_At")
  updatedAt   DateTime @updatedAt @map("Updated_At")

  archivos BibliotecaArchivo[]
  estantes BibliotecaEstanteLibro[]
  estados  BibliotecaEstado[]

  @@index([titulo])
  @@map("Biblioteca_Libros")
}

model BibliotecaArchivo {
  id           Int     @id @default(autoincrement())
  libroId      Int     @map("Libro_ID")
  url          String  @map("URL") // /api/archivos/<uuid> (≤ 4 MB) o /api/almacen/<clave> (LANE_277)
  formato      String  @map("Formato") // epub | pdf | mp3 | m4b | m4a | ogg
  bytes        Int?    @map("Bytes")
  orden        Int     @default(0) @map("Orden") // pistas de audiolibro
  titulo       String? @map("Titulo") // título de la pista / capítulo
  duracionSeg  Int?    @map("Duracion_Seg")

  libro BibliotecaLibro @relation(fields: [libroId], references: [id], onDelete: Cascade)

  @@index([libroId, orden])
  @@map("Biblioteca_Archivos")
}

model BibliotecaEstante {
  id     Int    @id @default(autoincrement())
  nombre String @unique @map("Nombre")
  orden  Int    @default(0) @map("Orden")

  libros BibliotecaEstanteLibro[]

  @@map("Biblioteca_Estantes")
}

model BibliotecaEstanteLibro {
  estanteId Int @map("Estante_ID")
  libroId   Int @map("Libro_ID")

  estante BibliotecaEstante @relation(fields: [estanteId], references: [id], onDelete: Cascade)
  libro   BibliotecaLibro   @relation(fields: [libroId], references: [id], onDelete: Cascade)

  @@id([estanteId, libroId])
  @@map("Biblioteca_Estantes_Libros")
}

/// Estado y posición de lectura/escucha de un usuario en un libro (user_book_status + reading_progress + audiobook_progress)
model BibliotecaEstado {
  usuarioId      Int           @map("Usuario_ID")
  libroId        Int           @map("Libro_ID")
  estado         EstadoLectura @default(sin_empezar) @map("Estado")
  porcentaje     Float         @default(0) @map("Porcentaje")
  cfi            String?       @map("CFI") // ePub
  pagina         Int?          @map("Pagina") // PDF
  archivoId      Int?          @map("Archivo_ID") // pista actual del audiolibro
  posicionSeg    Float?        @map("Posicion_Seg")
  empezadoEn     DateTime?     @map("Empezado_En")
  terminadoEn    DateTime?     @map("Terminado_En")
  updatedAt      DateTime      @updatedAt @map("Updated_At")

  usuario Usuario         @relation("BibliotecaEstados", fields: [usuarioId], references: [id], onDelete: Cascade)
  libro   BibliotecaLibro @relation(fields: [libroId], references: [id], onDelete: Cascade)

  @@id([usuarioId, libroId])
  @@index([usuarioId, estado])
  @@map("Biblioteca_Estados")
}
```
(+ en `model Usuario`: `bibliotecaEstados BibliotecaEstado[] @relation("BibliotecaEstados")`.)

## Arquitectura
- `src/lib/biblioteca/reglas.ts` (puro) + test: `FORMATOS`, `formatoDe(nombre, mime)`, `siguienteEstado(actual, porcentaje, manual?)` (D3), `ordenarPistas(archivos)` (portado de `audio-track-order.ts`), `filtrarLibros(libros, { texto, tipo, estado, estanteId })` (búsqueda sin tildes por título y autor), `validarLibro(entrada)`.
- `src/lib/biblioteca/servidor.ts`: listar (con estado del usuario), detalle, crear/editar/borrar (padres), guardar posición (usuario), estantes.
- API: `src/app/api/biblioteca/libros/route.ts` (GET, POST), `.../libros/[id]/route.ts` (GET, PATCH, DELETE), `.../libros/[id]/posicion/route.ts` (PUT), `.../estantes/route.ts` (GET, POST, PATCH, DELETE).
- UI `src/components/biblioteca/`: `BibliotecaVista`, `TarjetaLibro`, `FiltrosBiblioteca`, `DetalleLibro`, `LectorLibro` (envuelve `LectorEpub`/PDF), `ReproductorAudiolibro`, `GestionBiblioteca`, `SubirLibro`.
- Páginas en `src/app/dashboard/biblioteca/**`; enlace en `AppSidebar.tsx` al final (ola 3).

## Archivos en alcance
`prisma/schema.prisma` · `src/lib/biblioteca/**` · `src/app/api/biblioteca/**` · `src/components/biblioteca/**` · `src/app/dashboard/biblioteca/**` · el componente lector de LANE_189 (solo agregar `cfiInicial`/`onPosicion`, ruta exacta la confirma el orquestador con `grep -rln "LectorEpub" src`) · `src/components/app/AppSidebar.tsx` · `vendor/bookorbit/**`, `vendor/homebranch-web/**`, `THIRD_PARTY_NOTICES.md` (orquestador)

## Microtareas

### Fase 0 [orquestador]
- [x] M0 (`57cbff3`; también `server/src/common/utils/{book-media,audio-track-order,natural-sort}.utils.ts`, donde está la lógica de orden de pistas) · `vendor/bookorbit/` (solo `LICENSE`, `ADDITIONAL_TERMS.md`, `NOTICE`, `server/src/db/schema/{books,reader,collections}.ts`, `server/src/db/audio-track-order.ts`, `server/src/modules/{reading-state,user-book-status,audiobook,search}/`, `client/src/features/reader/audiobook/`) y `vendor/homebranch-web/` (`LICENSE`, `src/entities/book/`, `src/features/library/`, `src/app/routes/dashboard/{library,book,read-book,book-shelf,currently-reading}.tsx`) con `ORIGEN.md` cada uno; `THIRD_PARTY_NOTICES.md`.

### Fase 1 — datos, reglas, servidor y API (ensayada: prisma validate · tsc 0 · eslint 0 · reglas 6/6 · npm test 579/0 · API 23/23 contra la base local)

#### M1 · Esquema [agy]
- [x] hecha (`9439d96`)
Archivo existente `prisma/schema.prisma`. Precondición: `grep -c "Biblioteca" prisma/schema.prisma` → `0`. Solo estos 2 cambios (D8, D9):
1. Debajo de la línea (aparece exactamente 1 vez; las columnas van con espacios):
```
  libros                     Libro[]
```
   agregar esta línea:
```
  bibliotecaEstados          BibliotecaEstado[]   @relation("BibliotecaEstados")
```
2. Debajo de estas 2 líneas (aparecen exactamente 1 vez):
```
  @@map("Libros")
}
```
   agregar este bloque (empieza con una línea en blanco):
```

// ← Lane 270: Biblioteca (modelo de bookorbit/bookorbit@6ad1445 server/src/db/schema/{books,reader,collections}.ts, simplificado)
enum EstadoBiblioteca {
  sin_empezar
  leyendo
  leido
}

model BibliotecaLibro {
  id           Int      @id @default(autoincrement())
  titulo       String   @map("Titulo")
  autor        String?  @map("Autor")
  sinopsis     String?  @map("Sinopsis")
  portadaUrl   String?  @map("Portada_URL")
  esAudiolibro Boolean  @default(false) @map("Es_Audiolibro")
  cargadoPorId Int?     @map("Cargado_Por_ID")
  createdAt    DateTime @default(now()) @map("Created_At")
  updatedAt    DateTime @updatedAt @map("Updated_At")

  archivos BibliotecaArchivo[]
  estantes BibliotecaEstanteLibro[]
  estados  BibliotecaEstado[]

  @@index([titulo])
  @@map("Biblioteca_Libros")
}

model BibliotecaArchivo {
  id          Int     @id @default(autoincrement())
  libroId     Int     @map("Libro_ID")
  url         String  @map("URL") // /api/archivos/<uuid> (≤ 4 MB) o /api/almacen/<clave> (LANE_277)
  formato     String  @map("Formato") // epub | pdf | mp3 | m4b | m4a | ogg
  bytes       Int?    @map("Bytes")
  orden       Int     @default(0) @map("Orden") // pistas de audiolibro
  titulo      String? @map("Titulo") // título de la pista / capítulo
  duracionSeg Int?    @map("Duracion_Seg")

  libro BibliotecaLibro @relation(fields: [libroId], references: [id], onDelete: Cascade)

  @@index([libroId, orden])
  @@map("Biblioteca_Archivos")
}

model BibliotecaEstante {
  id     Int    @id @default(autoincrement())
  nombre String @unique @map("Nombre")
  orden  Int    @default(0) @map("Orden")

  libros BibliotecaEstanteLibro[]

  @@map("Biblioteca_Estantes")
}

model BibliotecaEstanteLibro {
  estanteId Int @map("Estante_ID")
  libroId   Int @map("Libro_ID")

  estante BibliotecaEstante @relation(fields: [estanteId], references: [id], onDelete: Cascade)
  libro   BibliotecaLibro   @relation(fields: [libroId], references: [id], onDelete: Cascade)

  @@id([estanteId, libroId])
  @@map("Biblioteca_Estantes_Libros")
}

/// Estado y posición de lectura/escucha de un usuario en un libro (user_book_status + reading_progress + audiobook_progress)
model BibliotecaEstado {
  usuarioId   Int              @map("Usuario_ID")
  libroId     Int              @map("Libro_ID")
  estado      EstadoBiblioteca @default(sin_empezar) @map("Estado")
  porcentaje  Float            @default(0) @map("Porcentaje")
  cfi         String?          @map("CFI") // ePub
  pagina      Int?             @map("Pagina") // PDF
  archivoId   Int?             @map("Archivo_ID") // pista actual del audiolibro
  posicionSeg Float?           @map("Posicion_Seg")
  empezadoEn  DateTime?        @map("Empezado_En")
  terminadoEn DateTime?        @map("Terminado_En")
  updatedAt   DateTime         @updatedAt @map("Updated_At")

  usuario Usuario         @relation("BibliotecaEstados", fields: [usuarioId], references: [id], onDelete: Cascade)
  libro   BibliotecaLibro @relation(fields: [libroId], references: [id], onDelete: Cascade)

  @@id([usuarioId, libroId])
  @@index([usuarioId, estado])
  @@map("Biblioteca_Estados")
}
```
Después: `npx prisma format` (no debe cambiar nada más), `npx prisma validate` → «is valid», `npx prisma generate`. **Prohibido** `prisma db push`, `migrate` o `db execute` (AGENTS.md regla 7).

#### M2 · Base [orquestador]
- [x] hecha (base local; producción espera OK de Gabriel)
SQL generado sin base (`prisma migrate diff --from-schema <esquema de dev> --to-schema prisma/schema.prisma`) en `verif-db/sql/11-lane270.sql`: solo `CREATE TYPE "EstadoBiblioteca"`, 5 `CREATE TABLE`, 4 índices y 5 FKs; **0 `DROP`**. Aplicado solo en la base local; producción espera OK de Gabriel.

#### M3 · Reglas puras [agy]
- [x] hecha (`9439d96`)
Crear `src/lib/biblioteca/reglas.ts` (si ya existe: BLOQUEADO) con este contenido exacto:
```ts
// Biblioteca (lane 270): reglas puras. El orden natural está portado de
// vendor/bookorbit/server/src/common/utils/natural-sort.utils.ts y el de pistas de
// vendor/bookorbit/server/src/common/utils/book-media.utils.ts (compareAudioTracks) (bookorbit/bookorbit@6ad1445).
// Los estados de lectura son los de BookOrbit reducidos a tres (vault LANE_270, D3).

export type Formato = "epub" | "pdf" | "mp3" | "m4b" | "m4a" | "ogg";
export type EstadoBiblioteca = "sin_empezar" | "leyendo" | "leido";

export const FORMATOS: Record<Formato, { audio: boolean; mimes: string[] }> = {
  epub: { audio: false, mimes: ["application/epub+zip"] },
  pdf: { audio: false, mimes: ["application/pdf"] },
  mp3: { audio: true, mimes: ["audio/mpeg", "audio/mp3"] },
  m4b: { audio: true, mimes: ["audio/x-m4b", "audio/m4b"] },
  m4a: { audio: true, mimes: ["audio/mp4", "audio/x-m4a", "audio/m4a"] },
  ogg: { audio: true, mimes: ["audio/ogg"] },
};

const ESTADOS: readonly EstadoBiblioteca[] = ["sin_empezar", "leyendo", "leido"];
export const esEstado = (v: unknown): v is EstadoBiblioteca => typeof v === "string" && (ESTADOS as readonly string[]).includes(v);
export const esFormato = (v: unknown): v is Formato => typeof v === "string" && v in FORMATOS;
export const esAudio = (f: Formato) => FORMATOS[f].audio;

/** Porcentaje desde el que un libro cuenta como leído sin marcarlo a mano (D3). */
export const UMBRAL_LEIDO = 98;

/** Formato por la extensión del nombre; si no la tiene o no se conoce, por el tipo MIME. */
export function formatoDe(nombre: string, mime?: string | null): Formato | null {
  const ext = nombre.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1];
  if (esFormato(ext)) return ext;
  const m = (mime ?? "").toLowerCase().split(";")[0].trim();
  for (const [f, def] of Object.entries(FORMATOS) as [Formato, (typeof FORMATOS)[Formato]][]) {
    if (def.mimes.includes(m)) return f;
  }
  return null;
}

/**
 * Estado después de guardar una posición (D3). Si el usuario elige un estado a mano, vale ese.
 * Si no: un libro leído sigue leído; ≥ 98 % pasa a leído; > 0 % pasa a leyendo; si no, queda como estaba.
 */
export function siguienteEstado(actual: EstadoBiblioteca, porcentaje: number, manual?: EstadoBiblioteca | null): EstadoBiblioteca {
  if (manual) return manual;
  if (actual === "leido") return "leido";
  if (porcentaje >= UMBRAL_LEIDO) return "leido";
  if (porcentaje > 0) return "leyendo";
  return actual;
}

/** Orden natural: «Cap 2» antes que «Cap 10» (portado de naturalCompare de BookOrbit). */
export function compararNatural(a: string, b: string): number {
  const numeros = /(\d+)/;
  const pa = a.split(numeros);
  const pb = b.split(numeros);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const x = pa[i] ?? "";
    const y = pb[i] ?? "";
    if (/^\d+$/.test(x) && /^\d+$/.test(y)) {
      const d = Number.parseInt(x, 10) - Number.parseInt(y, 10);
      if (d !== 0) return d;
    } else {
      const d = x.localeCompare(y);
      if (d !== 0) return d;
    }
  }
  return 0;
}

/** Pistas de un audiolibro en orden de reproducción: primero por `orden`, después orden natural por título o URL. */
export function ordenarPistas<T extends { orden: number; titulo: string | null; url: string }>(archivos: readonly T[]): T[] {
  return [...archivos].sort((a, b) => a.orden - b.orden || compararNatural(a.titulo ?? a.url, b.titulo ?? b.url));
}

/** Minúsculas y sin tildes, para buscar «perez» y encontrar «Pérez». */
export function sinTildes(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export type FiltroBiblioteca = {
  texto?: string;
  tipo?: "libros" | "audiolibros" | null;
  estado?: EstadoBiblioteca | null;
  estanteId?: number | null;
};

export function filtrarLibros<T extends { titulo: string; autor: string | null; esAudiolibro: boolean; estado: EstadoBiblioteca; estanteIds: number[] }>(
  libros: readonly T[],
  filtro: FiltroBiblioteca,
): T[] {
  const q = sinTildes((filtro.texto ?? "").trim());
  return libros.filter(
    (l) =>
      (!q || sinTildes(`${l.titulo} ${l.autor ?? ""}`).includes(q)) &&
      (!filtro.tipo || (filtro.tipo === "audiolibros") === l.esAudiolibro) &&
      (!filtro.estado || l.estado === filtro.estado) &&
      (filtro.estanteId == null || l.estanteIds.includes(filtro.estanteId)),
  );
}

export type ArchivoValido = { url: string; formato: Formato; bytes: number | null; orden: number; titulo: string | null; duracionSeg: number | null };
export type LibroValido = {
  titulo: string;
  autor: string | null;
  sinopsis: string | null;
  portadaUrl: string | null;
  estanteIds: number[];
  archivos: ArchivoValido[] | null; // null = no se cambian (al editar)
  esAudiolibro: boolean | null; // null = no se cambia (al editar)
};

const texto = (v: unknown, campo: string, max: number, obligatorio = false): string | null => {
  if (v === undefined || v === null || (typeof v === "string" && v.trim() === "")) {
    if (obligatorio) throw new Error(`Falta ${campo}`);
    return null;
  }
  if (typeof v !== "string") throw new Error(`${campo} inválido`);
  const t = v.trim();
  if (t.length > max) throw new Error(`${campo} es demasiado largo (máximo ${max} caracteres)`);
  return t;
};

/**
 * URL de un archivo propio: los de `/api/upload` (≤ 4 MB, vienen como `/api/archivos/<uuid>?tipo=pdf&nombre=…`)
 * o, cuando exista, los de LANE_277.
 */
export const esUrlArchivo = (v: unknown): v is string =>
  typeof v === "string" && v.length <= 1000 && /^\/api\/(archivos|almacen)\/[A-Za-z0-9._\-/]+(\?[^\s#]*)?$/.test(v);

/**
 * Valida lo que manda la pantalla de gestión. Al crear (`conArchivos`), hace falta al menos un archivo;
 * un libro es audiolibro si todos sus archivos son de audio, y no se mezclan audio y texto.
 */
export function validarLibro(entrada: Record<string, unknown>, { conArchivos }: { conArchivos: boolean }): LibroValido {
  const titulo = texto(entrada.titulo, "el título", 200, true)!;
  const autor = texto(entrada.autor, "el autor", 200);
  const sinopsis = texto(entrada.sinopsis, "la sinopsis", 5000);
  const portadaUrl = entrada.portadaUrl === undefined || entrada.portadaUrl === null || entrada.portadaUrl === "" ? null : entrada.portadaUrl;
  if (portadaUrl !== null && !esUrlArchivo(portadaUrl)) throw new Error("La portada no es un archivo subido");

  const ids = entrada.estanteIds ?? [];
  if (!Array.isArray(ids) || ids.some((n) => !Number.isInteger(n) || n <= 0)) throw new Error("Estantes inválidos");
  const estanteIds = [...new Set(ids as number[])];

  if (!conArchivos) return { titulo, autor, sinopsis, portadaUrl, estanteIds, archivos: null, esAudiolibro: null };

  const lista = entrada.archivos;
  if (!Array.isArray(lista) || lista.length === 0) throw new Error("Falta el archivo del libro");
  if (lista.length > 200) throw new Error("Demasiados archivos");
  const archivos: ArchivoValido[] = lista.map((a, i) => {
    const o = (a ?? {}) as Record<string, unknown>;
    if (!esUrlArchivo(o.url)) throw new Error("Archivo inválido");
    if (!esFormato(o.formato)) throw new Error("Formato no admitido (ePub, PDF, mp3, m4b, m4a u ogg)");
    const bytes = Number.isInteger(o.bytes) && (o.bytes as number) >= 0 ? (o.bytes as number) : null;
    const duracionSeg = Number.isInteger(o.duracionSeg) && (o.duracionSeg as number) >= 0 ? (o.duracionSeg as number) : null;
    return { url: o.url, formato: o.formato, bytes, orden: i, titulo: texto(o.titulo, "el título de la pista", 200), duracionSeg };
  });
  const audio = archivos.filter((a) => esAudio(a.formato)).length;
  if (audio > 0 && audio < archivos.length) throw new Error("Un libro no puede mezclar audio y texto");
  if (audio === 0 && archivos.length > 1) throw new Error("Un libro de texto lleva un solo archivo");
  return { titulo, autor, sinopsis, portadaUrl, estanteIds, archivos, esAudiolibro: audio > 0 };
}

/** Porcentaje entre 0 y 100 (lo que mande el lector). */
export function porcentajeValido(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) throw new Error("Porcentaje inválido");
  return Math.min(100, Math.max(0, n));
}
```

Crear `src/lib/biblioteca/reglas.test.ts` (si ya existe: BLOQUEADO) con este contenido exacto:
```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { compararNatural, filtrarLibros, formatoDe, ordenarPistas, porcentajeValido, siguienteEstado, validarLibro } from "./reglas.ts";

test("formatoDe: por extensión y, si no, por MIME", () => {
  assert.equal(formatoDe("El Principito.EPUB"), "epub");
  assert.equal(formatoDe("capitulo 1.mp3"), "mp3");
  assert.equal(formatoDe("sin-extension", "application/pdf"), "pdf");
  assert.equal(formatoDe("libro", "audio/mp4; codecs=mp4a"), "m4a");
  assert.equal(formatoDe("foto.jpg", "image/jpeg"), null);
});

test("siguienteEstado: 0 sin empezar, 5 leyendo, 98 leído; un leído no vuelve a leyendo", () => {
  assert.equal(siguienteEstado("sin_empezar", 0), "sin_empezar");
  assert.equal(siguienteEstado("sin_empezar", 5), "leyendo");
  assert.equal(siguienteEstado("leyendo", 98), "leido");
  assert.equal(siguienteEstado("leido", 10), "leido");
  assert.equal(siguienteEstado("leyendo", 10, "leido"), "leido");
  assert.equal(siguienteEstado("leido", 10, "leyendo"), "leyendo");
});

test("ordenarPistas: por orden y después orden natural («Cap 2» antes que «Cap 10»)", () => {
  const p = (titulo: string, orden = 0) => ({ titulo, orden, url: `/api/archivos/${titulo}` });
  assert.deepEqual(ordenarPistas([p("Cap 10"), p("Cap 2"), p("Cap 1")]).map((x) => x.titulo), ["Cap 1", "Cap 2", "Cap 10"]);
  assert.deepEqual(ordenarPistas([p("B", 0), p("A", 1)]).map((x) => x.titulo), ["B", "A"]);
  assert.ok(compararNatural("pista 9", "pista 10") < 0);
});

test("filtrarLibros: busca sin tildes por título y autor, y filtra por tipo, estado y estante", () => {
  const libros = [
    { titulo: "Cien años de soledad", autor: "Gabriel García Márquez", esAudiolibro: false, estado: "leyendo" as const, estanteIds: [1] },
    { titulo: "El túnel", autor: "Ernesto Sábato", esAudiolibro: true, estado: "sin_empezar" as const, estanteIds: [] },
    { titulo: "Platero y yo", autor: "Juan Ramón Jiménez", esAudiolibro: false, estado: "leido" as const, estanteIds: [1, 2] },
  ];
  assert.deepEqual(filtrarLibros(libros, { texto: "garcia marquez" }).map((l) => l.titulo), ["Cien años de soledad"]);
  assert.deepEqual(filtrarLibros(libros, { texto: "TUNEL" }).map((l) => l.titulo), ["El túnel"]);
  assert.deepEqual(filtrarLibros(libros, { tipo: "audiolibros" }).map((l) => l.titulo), ["El túnel"]);
  assert.deepEqual(filtrarLibros(libros, { estado: "leido" }).map((l) => l.titulo), ["Platero y yo"]);
  assert.deepEqual(filtrarLibros(libros, { estanteId: 2 }).map((l) => l.titulo), ["Platero y yo"]);
  assert.equal(filtrarLibros(libros, {}).length, 3);
});

test("validarLibro: título obligatorio, archivos propios, sin mezclar audio y texto", () => {
  const epub = { url: "/api/archivos/abc", formato: "epub" };
  const v = validarLibro({ titulo: "  Martín Fierro ", archivos: [epub], estanteIds: [3, 3] }, { conArchivos: true });
  assert.equal(v.titulo, "Martín Fierro");
  assert.equal(v.esAudiolibro, false);
  assert.deepEqual(v.estanteIds, [3]);
  assert.throws(() => validarLibro({ archivos: [epub] }, { conArchivos: true }), /Falta el título/);
  assert.throws(() => validarLibro({ titulo: "X", archivos: [] }, { conArchivos: true }), /Falta el archivo/);
  assert.throws(() => validarLibro({ titulo: "X", archivos: [{ url: "https://otro.sitio/x.epub", formato: "epub" }] }, { conArchivos: true }), /Archivo inválido/);
  assert.throws(
    () => validarLibro({ titulo: "X", archivos: [epub, { url: "/api/archivos/p1", formato: "mp3" }] }, { conArchivos: true }),
    /mezclar audio y texto/,
  );
  const audio = validarLibro(
    { titulo: "X", archivos: [{ url: "/api/archivos/p1", formato: "mp3", titulo: "Cap 1" }, { url: "/api/archivos/p2", formato: "mp3" }] },
    { conArchivos: true },
  );
  assert.equal(audio.esAudiolibro, true);
  assert.deepEqual(audio.archivos?.map((a) => a.orden), [0, 1]);
  assert.equal(validarLibro({ titulo: "X" }, { conArchivos: false }).archivos, null);
  // Así devuelve la URL /api/upload
  const subido = { url: "/api/archivos/62bdae37-1f1d-4745-9e68-d6098470dc72?tipo=pdf&nombre=libro%201.pdf", formato: "pdf" };
  assert.equal(validarLibro({ titulo: "X", archivos: [subido] }, { conArchivos: true }).archivos?.[0].url, subido.url);
});

test("porcentajeValido: lo lleva a 0–100 y rechaza lo que no es número", () => {
  assert.equal(porcentajeValido(150), 100);
  assert.equal(porcentajeValido(-3), 0);
  assert.equal(porcentajeValido("42.5"), 42.5);
  assert.throws(() => porcentajeValido("hola"), /Porcentaje inválido/);
});
```

Verificación: `node --test --disable-warning=MODULE_TYPELESS_PACKAGE_JSON src/lib/biblioteca/reglas.test.ts` → 6 pass, 0 fail.

#### M4 · Servidor y API [agy]
- [x] hecha (`9439d96`)
Crear `src/lib/biblioteca/servidor.ts` (si ya existe: BLOQUEADO) con este contenido exacto:
```ts
// Biblioteca (lane 270), lado servidor. Biblioteca de la familia: todos ven todos los libros; solo los
// padres cargan, editan y borran (D2). El estado y la posición de lectura son de cada usuario.
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { NoAutorizadoError, NoEncontradoError } from "@/lib/habitos/server";
import {
  esEstado,
  ordenarPistas,
  porcentajeValido,
  siguienteEstado,
  validarLibro,
  type EstadoBiblioteca,
  type Formato,
} from "./reglas";

type Actor = { id: number; esPadre: boolean };

export type LibroResumen = {
  id: number;
  titulo: string;
  autor: string | null;
  portadaUrl: string | null;
  esAudiolibro: boolean;
  estanteIds: number[];
  estado: EstadoBiblioteca;
  porcentaje: number;
  actualizadoEn: string | null; // última vez que este usuario lo leyó o escuchó
};

export type ArchivoVista = { id: number; url: string; formato: Formato; orden: number; titulo: string | null; duracionSeg: number | null };

export type LibroDetalle = LibroResumen & {
  sinopsis: string | null;
  archivos: ArchivoVista[];
  posicion: { cfi: string | null; pagina: number | null; archivoId: number | null; posicionSeg: number | null };
};

export type EstanteVista = { id: number; nombre: string; orden: number };

const soloPadres = (actor: Actor) => {
  if (!actor.esPadre) throw new NoAutorizadoError("Solo los padres pueden cambiar la biblioteca");
};

const incluirResumen = (usuarioId: number) => ({
  estantes: { select: { estanteId: true } },
  estados: { where: { usuarioId } },
});

type LibroConEstado = Prisma.BibliotecaLibroGetPayload<{ include: ReturnType<typeof incluirResumen> }>;

function aResumen(l: LibroConEstado): LibroResumen {
  const e = l.estados[0];
  return {
    id: l.id,
    titulo: l.titulo,
    autor: l.autor,
    portadaUrl: l.portadaUrl,
    esAudiolibro: l.esAudiolibro,
    estanteIds: l.estantes.map((x) => x.estanteId),
    estado: e?.estado ?? "sin_empezar",
    porcentaje: e?.porcentaje ?? 0,
    actualizadoEn: e ? e.updatedAt.toISOString() : null,
  };
}

/** Todos los libros, con el estado de quien pregunta. */
export async function listarLibros(actor: Actor): Promise<LibroResumen[]> {
  const filas = await prisma.bibliotecaLibro.findMany({ orderBy: { titulo: "asc" }, include: incluirResumen(actor.id) });
  return filas.map(aResumen);
}

export async function detalleLibro(actor: Actor, id: number): Promise<LibroDetalle> {
  const l = await prisma.bibliotecaLibro.findUnique({ where: { id }, include: { ...incluirResumen(actor.id), archivos: true } });
  if (!l) throw new NoEncontradoError("El libro no existe");
  const e = l.estados[0];
  return {
    ...aResumen(l),
    sinopsis: l.sinopsis,
    archivos: ordenarPistas(l.archivos).map((a) => ({
      id: a.id,
      url: a.url,
      formato: a.formato as Formato,
      orden: a.orden,
      titulo: a.titulo,
      duracionSeg: a.duracionSeg,
    })),
    posicion: { cfi: e?.cfi ?? null, pagina: e?.pagina ?? null, archivoId: e?.archivoId ?? null, posicionSeg: e?.posicionSeg ?? null },
  };
}

async function estantesExistentes(ids: number[]) {
  if (ids.length === 0) return;
  const n = await prisma.bibliotecaEstante.count({ where: { id: { in: ids } } });
  if (n !== ids.length) throw new Error("Algún estante no existe");
}

export async function crearLibro(actor: Actor, body: Record<string, unknown>): Promise<LibroDetalle> {
  soloPadres(actor);
  const v = validarLibro(body, { conArchivos: true });
  await estantesExistentes(v.estanteIds);
  const l = await prisma.bibliotecaLibro.create({
    data: {
      titulo: v.titulo,
      autor: v.autor,
      sinopsis: v.sinopsis,
      portadaUrl: v.portadaUrl,
      esAudiolibro: v.esAudiolibro ?? false,
      cargadoPorId: actor.id,
      archivos: { create: v.archivos ?? [] },
      estantes: { create: v.estanteIds.map((estanteId) => ({ estanteId })) },
    },
  });
  return detalleLibro(actor, l.id);
}

/** Edita título, autor, sinopsis, portada y estantes. Los archivos no se cambian (se borra y se vuelve a cargar). */
export async function editarLibro(actor: Actor, id: number, body: Record<string, unknown>): Promise<LibroDetalle> {
  soloPadres(actor);
  const actual = await prisma.bibliotecaLibro.findUnique({ where: { id }, select: { id: true } });
  if (!actual) throw new NoEncontradoError("El libro no existe");
  const v = validarLibro(body, { conArchivos: false });
  await estantesExistentes(v.estanteIds);
  await prisma.$transaction([
    prisma.bibliotecaEstanteLibro.deleteMany({ where: { libroId: id } }),
    prisma.bibliotecaLibro.update({
      where: { id },
      data: {
        titulo: v.titulo,
        autor: v.autor,
        sinopsis: v.sinopsis,
        portadaUrl: v.portadaUrl,
        estantes: { create: v.estanteIds.map((estanteId) => ({ estanteId })) },
      },
    }),
  ]);
  return detalleLibro(actor, id);
}

export async function borrarLibro(actor: Actor, id: number): Promise<void> {
  soloPadres(actor);
  const r = await prisma.bibliotecaLibro.deleteMany({ where: { id } });
  if (r.count === 0) throw new NoEncontradoError("El libro no existe");
}

/**
 * Guarda dónde quedó quien lee o escucha. `porcentaje` es obligatorio; `cfi` (ePub), `pagina` (PDF) y
 * `archivoId` + `posicionSeg` (audiolibro) según el tipo. `estado` solo cuando el usuario lo elige a mano.
 */
export async function guardarPosicion(actor: Actor, libroId: number, body: Record<string, unknown>): Promise<{ estado: EstadoBiblioteca; porcentaje: number }> {
  const libro = await prisma.bibliotecaLibro.findUnique({ where: { id: libroId }, select: { archivos: { select: { id: true } } } });
  if (!libro) throw new NoEncontradoError("El libro no existe");
  const porcentaje = porcentajeValido(body.porcentaje);
  const manual = body.estado === undefined || body.estado === null ? null : body.estado;
  if (manual !== null && !esEstado(manual)) throw new Error("Estado inválido");
  const cfi = typeof body.cfi === "string" && body.cfi.length <= 2000 ? body.cfi : null;
  const pagina = Number.isInteger(body.pagina) && (body.pagina as number) > 0 ? (body.pagina as number) : null;
  const archivoId = Number.isInteger(body.archivoId) && libro.archivos.some((a) => a.id === body.archivoId) ? (body.archivoId as number) : null;
  const posicionSeg = typeof body.posicionSeg === "number" && Number.isFinite(body.posicionSeg) && body.posicionSeg >= 0 ? body.posicionSeg : null;

  const previo = await prisma.bibliotecaEstado.findUnique({ where: { usuarioId_libroId: { usuarioId: actor.id, libroId } } });
  const estado = siguienteEstado(previo?.estado ?? "sin_empezar", porcentaje, manual);
  const ahora = new Date();
  const datos = {
    estado,
    porcentaje: estado === "leido" && !manual ? Math.max(porcentaje, previo?.porcentaje ?? 0) : porcentaje,
    cfi: cfi ?? previo?.cfi ?? null,
    pagina: pagina ?? previo?.pagina ?? null,
    archivoId: archivoId ?? previo?.archivoId ?? null,
    posicionSeg: posicionSeg ?? previo?.posicionSeg ?? null,
    empezadoEn: previo?.empezadoEn ?? (estado !== "sin_empezar" ? ahora : null),
    terminadoEn: estado === "leido" ? (previo?.terminadoEn ?? ahora) : null,
  };
  const r = await prisma.bibliotecaEstado.upsert({
    where: { usuarioId_libroId: { usuarioId: actor.id, libroId } },
    create: { usuarioId: actor.id, libroId, ...datos },
    update: datos,
  });
  return { estado: r.estado, porcentaje: r.porcentaje };
}

export async function listarEstantes(): Promise<EstanteVista[]> {
  return prisma.bibliotecaEstante.findMany({ orderBy: [{ orden: "asc" }, { nombre: "asc" }], select: { id: true, nombre: true, orden: true } });
}

const nombreEstante = (v: unknown) => {
  if (typeof v !== "string" || !v.trim()) throw new Error("Falta el nombre del estante");
  const n = v.trim();
  if (n.length > 60) throw new Error("El nombre del estante es demasiado largo (máximo 60 caracteres)");
  return n;
};

const repetido = (e: unknown) => e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";

export async function crearEstante(actor: Actor, body: Record<string, unknown>): Promise<EstanteVista> {
  soloPadres(actor);
  const nombre = nombreEstante(body.nombre);
  const orden = await prisma.bibliotecaEstante.count();
  try {
    return await prisma.bibliotecaEstante.create({ data: { nombre, orden }, select: { id: true, nombre: true, orden: true } });
  } catch (e) {
    if (repetido(e)) throw new Error("Ya hay un estante con ese nombre");
    throw e;
  }
}

export async function editarEstante(actor: Actor, body: Record<string, unknown>): Promise<EstanteVista> {
  soloPadres(actor);
  const id = Number(body.id);
  if (!Number.isInteger(id) || id <= 0) throw new Error("Estante inválido");
  const data: { nombre?: string; orden?: number } = {};
  if (body.nombre !== undefined) data.nombre = nombreEstante(body.nombre);
  if (body.orden !== undefined) {
    if (!Number.isInteger(body.orden) || (body.orden as number) < 0) throw new Error("Orden inválido");
    data.orden = body.orden as number;
  }
  try {
    return await prisma.bibliotecaEstante.update({ where: { id }, data, select: { id: true, nombre: true, orden: true } });
  } catch (e) {
    if (repetido(e)) throw new Error("Ya hay un estante con ese nombre");
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") throw new NoEncontradoError("El estante no existe");
    throw e;
  }
}

export async function borrarEstante(actor: Actor, id: number): Promise<void> {
  soloPadres(actor);
  const r = await prisma.bibliotecaEstante.deleteMany({ where: { id } });
  if (r.count === 0) throw new NoEncontradoError("El estante no existe");
}
```

Crear `src/app/api/biblioteca/libros/route.ts` (si ya existe: BLOQUEADO) con este contenido exacto:
```ts
// GET → { libros } (todos, con el estado de quien pregunta) · POST (padres) { titulo, autor?, sinopsis?, portadaUrl?, estanteIds?, archivos } → { libro } — lane 270
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { esPadre } from "@/lib/habitos/permisos";
import { crearLibro, listarLibros } from "@/lib/biblioteca/servidor";

export const dynamic = "force-dynamic";

const fallo = (e: unknown) =>
  NextResponse.json({ error: e instanceof Error ? e.message : "Error" }, { status: (e as { status?: number }).status ?? 400 });

async function actorDeSesion() {
  const session = await getSession();
  if (!session?.user?.id) return null;
  return { id: Number(session.user.id), esPadre: esPadre(session.user.rolFamiliar) };
}

export async function GET() {
  const actor = await actorDeSesion();
  if (!actor) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    return NextResponse.json({ libros: await listarLibros(actor) });
  } catch (e) {
    return fallo(e);
  }
}

export async function POST(req: NextRequest) {
  const actor = await actorDeSesion();
  if (!actor) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    return NextResponse.json({ libro: await crearLibro(actor, await req.json().catch(() => ({}))) });
  } catch (e) {
    return fallo(e);
  }
}
```

Crear `src/app/api/biblioteca/libros/[id]/route.ts` (si ya existe: BLOQUEADO) con este contenido exacto:
```ts
// GET → { libro } (con archivos y la posición de quien pregunta) · PATCH / DELETE (padres) — lane 270
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { esPadre } from "@/lib/habitos/permisos";
import { borrarLibro, detalleLibro, editarLibro } from "@/lib/biblioteca/servidor";

export const dynamic = "force-dynamic";

const fallo = (e: unknown) =>
  NextResponse.json({ error: e instanceof Error ? e.message : "Error" }, { status: (e as { status?: number }).status ?? 400 });

async function contexto(params: Promise<{ id: string }>) {
  const session = await getSession();
  if (!session?.user?.id) return null;
  const { id } = await params;
  return { actor: { id: Number(session.user.id), esPadre: esPadre(session.user.rolFamiliar) }, id: Number(id) };
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const c = await contexto(params);
  if (!c) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    return NextResponse.json({ libro: await detalleLibro(c.actor, c.id) });
  } catch (e) {
    return fallo(e);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const c = await contexto(params);
  if (!c) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    return NextResponse.json({ libro: await editarLibro(c.actor, c.id, await req.json().catch(() => ({}))) });
  } catch (e) {
    return fallo(e);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const c = await contexto(params);
  if (!c) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    await borrarLibro(c.actor, c.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return fallo(e);
  }
}
```

Crear `src/app/api/biblioteca/libros/[id]/posicion/route.ts` (si ya existe: BLOQUEADO) con este contenido exacto:
```ts
// PUT { porcentaje, cfi?, pagina?, archivoId?, posicionSeg?, estado? } → { estado, porcentaje } (la posición propia) — lane 270
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { esPadre } from "@/lib/habitos/permisos";
import { guardarPosicion } from "@/lib/biblioteca/servidor";

export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id } = await params;
  const actor = { id: Number(session.user.id), esPadre: esPadre(session.user.rolFamiliar) };
  try {
    return NextResponse.json(await guardarPosicion(actor, Number(id), await req.json().catch(() => ({}))));
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Error" }, { status: (e as { status?: number }).status ?? 400 });
  }
}
```

Crear `src/app/api/biblioteca/estantes/route.ts` (si ya existe: BLOQUEADO) con este contenido exacto:
```ts
// GET → { estantes } · POST { nombre } · PATCH { id, nombre?, orden? } · DELETE ?id=N (padres) — lane 270
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { esPadre } from "@/lib/habitos/permisos";
import { borrarEstante, crearEstante, editarEstante, listarEstantes } from "@/lib/biblioteca/servidor";

export const dynamic = "force-dynamic";

const fallo = (e: unknown) =>
  NextResponse.json({ error: e instanceof Error ? e.message : "Error" }, { status: (e as { status?: number }).status ?? 400 });

async function actorDeSesion() {
  const session = await getSession();
  if (!session?.user?.id) return null;
  return { id: Number(session.user.id), esPadre: esPadre(session.user.rolFamiliar) };
}

export async function GET() {
  const actor = await actorDeSesion();
  if (!actor) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    return NextResponse.json({ estantes: await listarEstantes() });
  } catch (e) {
    return fallo(e);
  }
}

export async function POST(req: NextRequest) {
  const actor = await actorDeSesion();
  if (!actor) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    return NextResponse.json({ estante: await crearEstante(actor, await req.json().catch(() => ({}))) });
  } catch (e) {
    return fallo(e);
  }
}

export async function PATCH(req: NextRequest) {
  const actor = await actorDeSesion();
  if (!actor) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    return NextResponse.json({ estante: await editarEstante(actor, await req.json().catch(() => ({}))) });
  } catch (e) {
    return fallo(e);
  }
}

export async function DELETE(req: NextRequest) {
  const actor = await actorDeSesion();
  if (!actor) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    await borrarEstante(actor, Number(req.nextUrl.searchParams.get("id")));
    return NextResponse.json({ ok: true });
  } catch (e) {
    return fallo(e);
  }
}
```

Verificación: `npx tsc --noEmit` sin errores. Si da cualquier error, **STOP** (`BLOQUEADO: <error>`), no lo arregles por tu cuenta.

### Fase 2 — interfaz (receta de port, `PROTOCOLO_AGY.md` › «Receta de port»)
Una microtarea por componente, origen → destino:
| Origen | Destino | Notas |
|---|---|---|
| `homebranch-web/src/entities/book/ui/BookCard.tsx` | `src/components/biblioteca/TarjetaLibro.tsx` | Chakra → `Card` + `img` con `aspect-[2/3]`; título 2 líneas, autor 1 línea; barra de progreso `Progress` h-1 si `leyendo` |
| `homebranch-web/src/features/library/components/SearchLibrary.tsx` + `CollectionToolbar.tsx` | `src/components/biblioteca/FiltrosBiblioteca.tsx` | `Input` de búsqueda + `ToggleGroup` de chips; sin opciones de vista ni orden |
| `homebranch-web/src/app/routes/dashboard/library.tsx` + `currently-reading.tsx` | `src/components/biblioteca/BibliotecaVista.tsx` | fila «Seguir leyendo» + grilla `grid-cols-2 sm:grid-cols-4 lg:grid-cols-6`; filtra con `filtrarLibros` |
| `homebranch-web/src/app/routes/dashboard/book.tsx` | `src/components/biblioteca/DetalleLibro.tsx` | un botón principal; nada de estadísticas |
| `homebranch-web/src/app/routes/dashboard/read-book.tsx` | `src/components/biblioteca/LectorLibro.tsx` | usa `LectorEpub` (D4) o `<iframe>` PDF; `PUT posicion` con *debounce* de 3 s |
| `bookorbit/client/src/features/reader/audiobook/*` (lógica) | `src/components/biblioteca/ReproductorAudiolibro.tsx` | `<audio>` nativo; capítulos = pistas ordenadas; velocidad 0.75–2×; guarda cada 10 s y al pausar |
| `homebranch-web/src/entities/book/ui/{AddBookButton,UploadProgressDialog,useBookUpload}` | `src/components/biblioteca/SubirLibro.tsx` | por `/api/upload` (≤ 4 MB) hasta LANE_277; después `subirArchivo` de 277 |
| `homebranch-web/src/app/routes/dashboard/book-shelf.tsx` | `src/components/biblioteca/GestionBiblioteca.tsx` | lista simple: editar, estantes, borrar |

Microtareas (ensayadas por el orquestador el 2026-11-07 junto con las páginas de la fase 3, D10–D12; tsc 0, eslint 0, navegador `verif-db/i270ui.mjs` 22/22 sin errores de consola, 360 px sin scroll). El contenido exacto lo lleva el prompt de agy:
- [x] M5 [agy] (`d01d39a`, idéntica al ensayo) `src/components/homeschooling/material/LectorEpub.tsx`: props opcionales `cfiInicial` y `onPosicion(cfi, porcentaje)` (D4); `relocated` de epub.js + `locations.generate(1600)` para el porcentaje.
- [x] M6 [agy] (`d01d39a`, idéntica al ensayo) `src/components/biblioteca/TarjetaLibro.tsx` (+ `TarjetaLibroEsqueleto`), `FiltrosBiblioteca.tsx`, `BibliotecaVista.tsx`.
- [x] M7 [agy] (`d01d39a`, idéntica al ensayo) `src/components/biblioteca/DetalleLibro.tsx` y `LectorLibro.tsx` (D10).
- [x] M8 [agy] (`d01d39a`, idéntica al ensayo) `src/components/biblioteca/SubirLibro.tsx` (cola con estados y reintento; ePub/PDF ≤ 4 MB, D11) y `GestionBiblioteca.tsx` (estantes y libros; edición manda el libro completo).
- [x] M9 [agy] (`d01d39a`, idéntica al ensayo) Páginas `src/app/dashboard/biblioteca/{page,libro/[id]/page,leer/[id]/page,gestionar/page}.tsx` (D12).
- [x] M10 [orquestador] (sobre la salida de agy: tsc 0, eslint 0, tests 630/579/0/51, build OK, navegador 22/22 sin errores de consola, API 23/23) Gates + `node verif-db/i270ui.mjs <puerto> <capturas>` sobre la salida de agy.
- Fuera de esta tanda: `ReproductorAudiolibro` y `escuchar/[id]` (D11, con 277); enlace del sidebar (ola 3).

### Fase 3 — páginas, enlace y prueba
- [x] (`d01d39a`, D12; falta `escuchar/[id]` → 277, D11) Páginas `src/app/dashboard/biblioteca/{page,libro/[id]/page,leer/[id]/page,escuchar/[id]/page,gestionar/page}.tsx` (gestionar: `esPadre` o redirect). Código exacto tras la fase 2.
- [ ] Enlace «Biblioteca» (`Library`) en `AppSidebar.tsx`, al final de la ola 3.
- [ ] [orquestador] Prueba: subir ePub y PDF chicos, un audiolibro de 3 pistas (con 277), leer hasta 50 %, cerrar, abrir en otro dispositivo → sigue en el mismo lugar; hijo no ve «Gestionar» ni puede `POST`; búsqueda sin tildes; a 360 px cada pantalla tiene un solo botón principal.

## Criterios de aceptación
- Leer ePub/PDF y escuchar audiolibros dentro de la app, con posición guardada por usuario.
- Buscar y filtrar; gestionar (padres).
- Cada pantalla tiene un objetivo y un botón principal; sin estadísticas.

## Gates
`npx prisma validate` · `npx tsc --noEmit` · `npm test` · `npx eslint src/lib/biblioteca src/app/api/biblioteca src/components/biblioteca src/app/dashboard/biblioteca`

## Pendientes
- Enlace «Biblioteca» del sidebar → movido a LANE_278 (ola 3).
- LANE_277 (archivos grandes) para audiolibros y libros > 4 MB.
- Gabriel: licencias (D-BP2) y el aviso «Powered by BookOrbit».
- v2: vincular con el hábito «Leer un libro» (D5).

## Hallazgos
- 2026-11-07 · El ensayo destapó 3 errores de la spec antes de delegar: el enum `EstadoLectura` ya existía (D9), el ancla de la relación en `Usuario` era ambigua y chocaba con 265/271/272 (D8), y las URL de `/api/upload` traen parámetros (`?tipo=pdf&nombre=…`) que la primera versión de `esUrlArchivo` rechazaba (lo encontró la prueba de API).
- 2026-11-07 · `/api/upload` (`modo=estudio`) acepta PDF y ePub hasta 4 MB pero **no audio**: los audiolibros quedan para LANE_277 (D1), también los chicos.
- 2026-11-07 · Prueba de la API: `verif-db/i270api.mjs` (23/23 contra la base local, con el SQL de `verif-db/sql/11-lane270.sql` aplicado solo ahí).
- Producción (2026-11-07, orquestador): esquema aplicado con el SQL aditivo de `prisma migrate diff --from-config-datasource` desde `dev` completo (todas las lanes juntas): 15 tablas, 4 enums, valor `virtud`, 2 columnas nullable en `Checklist_Items`; **0 DROP**, sin cambios de datos. `migrate diff` posterior vacío. Amparo: regla 7 de AGENTS.md + «hace lo que haya que hacer» de Gabriel.

## Bitácora
- 2026-11-07 · claude (orquestador) · RESERVA · creada desde Plane #29
- 2026-11-07 · claude (orquestador) · INICIO · lane creada con `nueva-lane.sh` (rama `task/lane-270-biblioteca-bookorbit`, worktree `ordo-diei-lanes/lane-270`, `npm install` propio por D7). Fase 0 y fase 1 no dependen de 277 (D1)
- 2026-11-07 · claude (orquestador) · avance · M0 vendor (`57cbff3`). Fase 1 ensayada (prisma validate · tsc 0 · eslint 0 · reglas 6/6 · npm test 579/0 · API 23/23) → D8, D9 → microtareas M1, M3, M4 generadas desde el ensayo → agy: 8 archivos idénticos al ensayo (guardado fuera de su alcance) → mismos gates verdes. Commit `9439d96`. M2: SQL aditivo en `verif-db/sql/11-lane270.sql`, aplicado solo en local; producción espera OK de Gabriel. Siguiente: fase 2 (interfaz, receta de port desde homebranch-web)
- 2026-11-07 · claude (orquestador) + agy · fases 2 y 3 `d01d39a`: 12 archivos (7 componentes, 4 páginas, `LectorEpub` con posición) idénticos al ensayo; navegador 22/22 (subir, editar, estantes, buscar, leer y reabrir donde quedó, «Seguir leyendo», marcar leído, hijo sin «Gestionar», 360 px). Quedan: audiolibros y `escuchar/[id]` (277), enlace del sidebar (ola 3), `THIRD_PARTY_NOTICES` (después de 271).
- 2026-11-07 · claude (orquestador) · ENTREGA · PR #62 a dev (`scripts/abrir-pr.sh`: origin/dev incluido, tests + tsc verdes) con OK de Gabriel. Lo integra Gabriel; después `scripts/limpiar-lane.sh 270`.
- 2026-11-07 · claude (orquestador) · INTEGRADA · PR #62 a `dev` (merge commit); dev → main en PR #84 (lo integra Gabriel)
