---
lane: 271
titulo: Bloc de notas (migrado de dovli)
plane: "#30"
estado: integrada
rama: task/lane-271-bloc-notas-dovli
agente: "-"
actualizado: 2026-11-07
---

# Lane 271 — Bloc de notas (migrado de dovli)

## Especificación
Plane #30: «Bloc de Notas (clonando en local https://github.com/MayankJha0333/dovli y migrando y adaptando código en vez de codear todo de cero)».

Resultado: pantalla **`/dashboard/notas`** («Notas» en el sidebar) con el espacio de notas **personal** de cada usuario, igual a dovli en lo esencial:
- Árbol de páginas en un panel lateral (crear, anidar, renombrar, ícono, favoritas, papelera con restaurar).
- Editor de bloques **BlockNote** con el menú «/» de dovli (títulos, listas, checklist, citas, callout, tabla, divisor, imágenes).
- Búsqueda por título y texto. Guardado automático.
- Funciona sin conexión (IndexedDB en el navegador) y se sincroniza con la base de Ordo al volver la red; se ve igual en todos los dispositivos del usuario.

Fuera de la v1 (Pendientes): pizarras Excalidraw, IA, compartir con la familia, exportar a docx, app de escritorio/teléfono, extensión.

## Repo de origen
`MayankJha0333/dovli@eb453e0` (MIT), clonado en el scratchpad de la sesión 18058b32 (`repos/dovli`). Partes que se migran:

| dovli | Qué es | Destino en Ordo |
|---|---|---|
| `packages/core/src/*` (sin `seed.ts`, `templates.ts`) | tipos `Page`, árbol, búsqueda, enlaces, tags, markdown, merge | `src/lib/notas/core/` |
| `packages/sync/src/{engine,types,http}.ts` | motor de sync por revisiones + transporte HTTP | `src/lib/notas/sync/` |
| `packages/editor/src/*` (sin `excalidrawKit`, `FlowchartEditor`, `blocks/embeds`, `blocks/pdf`) | `PageEditor` (BlockNote), menú «/», buscar y reemplazar, formatos | `src/components/notas/editor/` |
| `apps/web/src/lib/{db,store,sync,files}.ts` | IndexedDB, store, arranque del sync, archivos locales | `src/lib/notas/cliente/` |
| `apps/web/src/features/{workspace,sidebar,page,trash}/*` (sin IA ni compartir) | UI | `src/components/notas/` |
| `apps/web/src/lib/server/cloudCore.ts` (solo `push`/`pull`) | reglas del servidor | `src/lib/notas/servidor/` (reescrito sobre Prisma, mismas reglas) |

## Decisiones
- D1 · Espacio **personal y privado** por usuario (un padre no ve las notas de un hijo). Compartir en familia: otra lane si Gabriel lo pide.
- D2 · Se mantiene el **protocolo de sync de dovli** (`PushRequest`/`PushResult`/`PageRow`, revisión por usuario) para portar el motor sin cambios; el transporte va a `/api/notas/sync/{pull,push}` con la **cookie de sesión** de Ordo (sin token Bearer ni Firebase).
- D3 · Una tabla `Notas_Paginas` (página entera en JSONB, como dovli en Firestore) + `Notas_Espacios` (contador de revisión por usuario). Máximo por página: `MAX_PAGE_CHARS` (900 000) de dovli.
- D4 · Imágenes dentro de las notas: por `/api/upload` de Ordo (≤ 4 MB, ya existe). Archivos grandes: dependen de LANE_277 (almacenamiento).
- D5 · Dependencias nuevas (las instala el orquestador, agy no): `@blocknote/core`, `@blocknote/react`, `@blocknote/mantine` 0.56, `@mantine/core` y `@mantine/hooks` 9, `idb` 8, `nanoid`. Antes de instalar, el orquestador verifica que funcionen con React 19 / Next 16 del repo.
- D6 · Trazabilidad D-BP3: copia en `vendor/dovli/` + `ORIGEN.md` + cabecera `// Portado de vendor/dovli/<ruta> (MayankJha0333/dovli@eb453e0)` en cada archivo portado + entrada en `THIRD_PARTY_NOTICES.md`.
- D7 · (orquestador, 2026-11-07) Los archivos portados conservan los `any` de dovli: segunda línea `/* eslint-disable <reglas exactas> -- código portado de dovli, sin cambios de lógica */`. No se tipa a mano.
- D8 · (orquestador, 2026-11-07) **Puente de tokens en vez de reescribir la interfaz.** `@dovli/ui/styles.css` redefine el tema global de Tailwind (`--color-*: initial`, `primary`, `sidebar`, radios, tamaños de texto): importarlo rompería todo Ordo. Y el editor y las pantallas de dovli usan ~560 clases de ese sistema (`bg-panel`, `text-ink-2`, `shadow-pop`, `surface-*`, `var(--d-*)`). Reescribirlas a mano contradice «migrar en vez de codear de cero» y multiplica errores. Se hace así:
  1. `src/components/notas/dovli.css` (lo escribe el orquestador): (a) `@theme inline` **solo con los nombres de dovli que no existen en Ordo** (panel, sheet, raised, well, hover, line, ink-1..4, danger, ok, warn, chip, overlay, sketch, sombras pop/card/sheet/shell, radios shell/sheet, animaciones); los que chocan (`primary`, `accent`, `sidebar`, `text-*`, `rounded-sm/md/lg`) conservan el significado de Ordo; (b) las variables `--d-*` definidas **dentro de `.notas-dovli`** a partir de los tokens de Ordo (claro y oscuro), así nada se filtra al resto de la app; (c) las `@utility` de dovli que se usan (`surface-*`, `chrome-*`, `label-text`, `display-text`, `focus-ring`, `scroll-fader`) y `.page-styled`. Sin la capa `@layer base` de dovli (pisaría `body`).
  2. Una línea en `src/app/globals.css`: `@import "../components/notas/dovli.css";` (se agrega a los archivos en alcance).
  3. `@dovli/ui` se porta a `src/components/notas/ui/` con la receta (sin `Logo`; **con `Toast`**, porque lo usan el editor y `editorBridge` — corregido 2026-11-07 al ensayar: los avisos de las notas se ven con el `Toaster` de dovli dentro de `.notas-dovli`); el editor y las pantallas se portan casi textuales con la receta, importando de ahí.
  Reemplaza la regla (5) de la fase 2 («componentes de `@dovli/ui` → equivalentes de `src/components/ui`»).
- D9 · (orquestador, 2026-11-07) **Pantallas de notas: se portan las de dovli recortadas; el contenedor es propio de Ordo.** El `Workspace` de dovli es una app de pantalla completa (su propio sidebar, IA, compartir, login, paleta, ajustes, plantillas, etiquetas, pizarras); dentro de Ordo la pantalla vive en el layout del dashboard, que ya tiene `AppSidebar`. Entonces:
  1. **Contenedor nuevo** `src/components/notas/NotasWorkspace.tsx` (contenido exacto lo escribe el orquestador): inicia store + sync con el `usuarioId` de la sesión, columnas «árbol de páginas | página» dentro de `.notas-dovli`, cajón en móvil, `Toaster`, `TooltipProvider`, `PagePicker`, `StyleGallery`, `CommandPalette`. Rutas internas por hash como dovli (`#p-<id>`).
  2. **Se portan con la receta, recortando** (sin reemplazar por nada) IA, compartir, exportar, login/cuenta, escritorio, plantillas, etiquetas, pizarras y respaldos: `lib/{ui,find}.ts`, `features/pages/{actions,PagePicker}`, `features/page/{PageIcon,PageInfo,PageHeader,PageMenu,PageView}`, `features/page/panels/*`, `features/sidebar/{Sidebar,PageSide,FindTab,follow}`, `features/trash/TrashView`, `features/page-styles/StyleGallery`, `features/palette/CommandPalette` (= la búsqueda entre páginas del criterio de aceptación), `components/TopBar` (agregado al vendor como M0b).
  3. **`lib/settings.ts` adaptado**: conserva solo `sidebarHidden` y `spellcheck` (los únicos que usan las pantallas portadas) y **no escribe nada en `<html>`** (el `applySettings` de dovli pisaría `data-theme`, `colorScheme` y el `theme-color` de Ordo, que maneja su propio modo oscuro con `.dark`).
  4. **Portadas de página subidas por `/api/upload`** (como las imágenes, D4), no a IndexedDB: si no, la portada no viaja a otros dispositivos.
  5. «Copiar enlace» arma `${location.origin}/dashboard/notas#p-<id>` (dovli usaba su dominio).
  6. Cada recorte se ensaya primero (tsc 0 · eslint 0 · humo en navegador) y las microtareas salen del ensayo, igual que 2a–2e.
  7. **Cajón móvil por encima del dock de Ordo** (z-50): en `Sidebar` la clase `max-[860px]:z-50` pasa a `max-[860px]:z-[60]` y el fondo oscuro del cajón (en `NotasWorkspace`) usa `z-[55]`. Sin esto el dock tapaba el pie del cajón (visto en el humo de 390 px).
  8. **Enlaces `#p-<id>` en un dispositivo nuevo** (orquestador, 2026-11-07, hallado en M-P3): `routeFromHash` solo abre la página si ya está en la base local; en un navegador nuevo la página llega después, con el primer sync, y la pantalla quedaba en Inicio aunque la dirección siguiera con `#p-<id>`. `NotasWorkspace` vuelve a resolver el hash cuando cambian las páginas, solo si la ruta es Inicio y el hash es `#p-`. No se toca el `store` portado.
  9. **Aviso de página demasiado grande en el lateral** (orquestador, 2026-11-07, hallado en M-P3): el motor de sync arma el mensaje «N página(s) demasiado grande(s) para respaldar (más de 900 KB)…», pero dovli lo mostraba en Ajustes, que no se porta; en Ordo el lateral solo decía «Sincronización en pausa. Reintentando», que es falso (reintentar no lo resuelve). `SyncNotice` muestra el mensaje del motor cuando contiene «demasiado grande» y el texto completo queda en `title` (el renglón se trunca). Los demás errores siguen con el texto genérico (el mensaje crudo del servidor no se muestra).

## Arquitectura
```
navegador                                   servidor (Next)                 base
PageEditor (BlockNote) ─ store (zustand) ─ IndexedDB
                └─ motor sync (dovli) ─ httpTransport ─ /api/notas/sync/pull|push ─ nubeNotas (Prisma) ─ Notas_Paginas / Notas_Espacios
```

## Archivos en alcance
- `vendor/dovli/**`, `THIRD_PARTY_NOTICES.md`, `package.json`, `package-lock.json` (orquestador)
- `prisma/schema.prisma`
- `src/lib/notas/**`, `src/components/notas/**`
- `src/app/api/notas/sync/pull/route.ts`, `src/app/api/notas/sync/push/route.ts`
- `src/app/dashboard/notas/page.tsx`
- `src/app/globals.css` (solo la línea `@import` del puente de tokens, D8)
- `src/components/app/AppSidebar.tsx` (último, ola 3)

## Microtareas

### Fase 0 — preparar [orquestador]
#### M0 · Vendor, notas de terceros y dependencias
- [x] hecha (orquestador)
1. Copiar `repos/dovli/{LICENSE,packages/core,packages/sync,packages/editor,packages/ui,packages/theme,apps/web/src/lib,apps/web/src/features,apps/web/src/app/api/sync}` a `vendor/dovli/` (sin `node_modules`). `vendor/dovli/ORIGEN.md`: URL, commit, fecha, lista de carpetas copiadas.
2. `THIRD_PARTY_NOTICES.md`: entrada dovli (MIT, copyright del LICENSE).
3. `npm install` de D5 con versiones exactas; `npx tsc --noEmit` y `npm run build` deben seguir verdes.
4. Confirmar que `vendor/` está excluido de `tsconfig`/eslint/tests (si no, agregar el exclude y anotarlo).

### Fase 1 — servidor (exacto)

#### M1 · Esquema [agy]
- [x] hecha (agy)
Archivos: `prisma/schema.prisma`. Precondición: `grep -c 'model NotaPagina' prisma/schema.prisma` → `0`.
Pasos:
1. Al **final** del archivo agregar:
```prisma

// ← Lane 271: bloc de notas (migrado de dovli). Página entera en JSON; `rev` crece por usuario (protocolo de sync de dovli).
model NotaEspacio {
  usuarioId Int @id @map("Usuario_ID")
  ultimaRev Int @default(0) @map("Ultima_Rev")

  usuario Usuario @relation("NotasEspacio", fields: [usuarioId], references: [id], onDelete: Cascade)

  @@map("Notas_Espacios")
}

model NotaPagina {
  id        String   @map("ID") // id de página de dovli (nanoid)
  usuarioId Int      @map("Usuario_ID")
  rev       Int      @map("Rev")
  datos     Json?    @map("Datos") // Page de dovli; null = borrada para siempre
  purgada   Boolean  @default(false) @map("Purgada")
  updatedAt DateTime @updatedAt @map("Updated_At")

  usuario Usuario @relation("NotasPaginas", fields: [usuarioId], references: [id], onDelete: Cascade)

  @@id([usuarioId, id])
  @@index([usuarioId, rev])
  @@map("Notas_Paginas")
}
```
2. En `model Usuario`, debajo de la línea `  historialAcciones HistorialAccion[]` (la que está dentro de `model Usuario`) agregar:
```prisma
  notasEspacio NotaEspacio? @relation("NotasEspacio")
  notasPaginas NotaPagina[] @relation("NotasPaginas")
```
3. `npx prisma format` · `npx prisma generate`. Nada más.

#### M2 · Base [orquestador]
- [x] hecha (producción 2026-11-07, ver Hallazgos)
Regla 7: solo `CREATE TABLE "Notas_Espacios"`, `CREATE TABLE "Notas_Paginas"`, índices y FKs. Sin `DROP`.

#### M3 · Reglas puras del push [agy]
- [x] hecha (agy)
Archivos: `src/lib/notas/servidor/reglas.ts` (crear con este contenido exacto)
```ts
// Reglas del servidor de notas (lane 271). Mismo protocolo que dovli (vendor/dovli/packages/sync/src/types.ts):
// un push se acepta solo si se basa en la última revisión guardada; si no, se devuelve la copia del servidor para mezclar.

export const MAX_PAGE_CHARS = 900_000;
const ID = /^[A-Za-z0-9_-]{1,64}$/;

export type FilaNota = { rev: number; datos: unknown | null; purgada: boolean };
export type PedidoPush = { id: string; data: unknown | null; baseRev: number | null; purged: boolean };
export type ResultadoPush = { ok: boolean; rev: number; data?: unknown | null; purged?: boolean; tooBig?: boolean };

export function validarPedido(body: unknown): PedidoPush {
  const b = (body ?? {}) as Record<string, unknown>;
  if (typeof b.id !== "string" || !ID.test(b.id)) throw new Error("Id de página inválido");
  if (b.baseRev !== null && !(Number.isInteger(b.baseRev) && (b.baseRev as number) >= 0)) throw new Error("baseRev inválido");
  const purged = b.purged === true;
  const data = purged ? null : (b.data ?? null);
  if (!purged && (data === null || typeof data !== "object")) throw new Error("Falta la página");
  if (!purged && (data as { id?: unknown }).id !== b.id) throw new Error("La página no coincide con el id");
  return { id: b.id, data, baseRev: (b.baseRev as number | null) ?? null, purged };
}

/** ¿Se guarda? `actual` es la fila del servidor (o null si no existe). */
export function decidirPush(actual: FilaNota | null, pedido: PedidoPush): { guardar: true } | { guardar: false; respuesta: ResultadoPush } {
  if (!pedido.purged && JSON.stringify(pedido.data).length > MAX_PAGE_CHARS) {
    return { guardar: false, respuesta: { ok: false, rev: actual?.rev ?? 0, tooBig: true } };
  }
  const revActual = actual?.rev ?? null;
  if (pedido.baseRev !== revActual) {
    return { guardar: false, respuesta: { ok: false, rev: actual?.rev ?? 0, data: actual?.datos ?? null, purged: actual?.purgada ?? false } };
  }
  return { guardar: true };
}
```

#### M4 · Tests [agy]
- [x] hecha (agy)
Archivos: `src/lib/notas/servidor/reglas.test.ts` (crear con este contenido exacto)
```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { MAX_PAGE_CHARS, decidirPush, validarPedido } from "./reglas.ts";

const pagina = (id: string, extra: Record<string, unknown> = {}) => ({ id, title: "Hola", blocks: [], ...extra });

test("página nueva (baseRev null) sin fila: se guarda", () => {
  assert.deepEqual(decidirPush(null, { id: "a", data: pagina("a"), baseRev: null, purged: false }), { guardar: true });
});

test("basada en la última revisión: se guarda; en una vieja: conflicto con la copia del servidor", () => {
  const actual = { rev: 5, datos: pagina("a", { title: "Servidor" }), purgada: false };
  assert.deepEqual(decidirPush(actual, { id: "a", data: pagina("a"), baseRev: 5, purged: false }), { guardar: true });
  const r = decidirPush(actual, { id: "a", data: pagina("a"), baseRev: 4, purged: false });
  assert.equal(r.guardar, false);
  if (!r.guardar) assert.deepEqual(r.respuesta, { ok: false, rev: 5, data: actual.datos, purged: false });
});

test("página demasiado grande", () => {
  const r = decidirPush(null, { id: "a", data: pagina("a", { relleno: "x".repeat(MAX_PAGE_CHARS) }), baseRev: null, purged: false });
  assert.equal(r.guardar, false);
  if (!r.guardar) assert.equal(r.respuesta.tooBig, true);
});

test("validarPedido", () => {
  assert.throws(() => validarPedido({ id: "../x", data: {}, baseRev: null }));
  assert.throws(() => validarPedido({ id: "a", data: pagina("b"), baseRev: null }));
  assert.deepEqual(validarPedido({ id: "a", purged: true, baseRev: 3 }), { id: "a", data: null, baseRev: 3, purged: true });
});
```

#### M5 · Servidor sobre Prisma [agy]
- [x] hecha (agy)
Archivos: `src/lib/notas/servidor/nube.ts` (crear con este contenido exacto)
```ts
// Nube de notas (lane 271) sobre Prisma: reemplaza a cloudCore de dovli (Firestore) con las mismas respuestas.
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { decidirPush, validarPedido, type ResultadoPush } from "./reglas";

export type FilaPull = { id: string; data: unknown | null; rev: number; purged: boolean };

export async function pullNotas(usuarioId: number, cursor: number, limite: number): Promise<FilaPull[]> {
  const filas = await prisma.notaPagina.findMany({
    where: { usuarioId, rev: { gt: Math.max(0, Math.floor(cursor) || 0) } },
    orderBy: { rev: "asc" },
    take: Math.min(Math.max(1, Math.floor(limite) || 100), 500),
  });
  return filas.map((f) => ({ id: f.id, data: f.datos, rev: f.rev, purged: f.purgada }));
}

export async function pushNota(usuarioId: number, body: unknown): Promise<ResultadoPush> {
  const pedido = validarPedido(body);
  return prisma.$transaction(async (tx) => {
    // Bloquea el contador del usuario (FOR UPDATE): dos pushes a la vez se ordenan y no se pisan
    await tx.notaEspacio.upsert({ where: { usuarioId }, create: { usuarioId, ultimaRev: 0 }, update: {} });
    await tx.$executeRaw`SELECT 1 FROM "Notas_Espacios" WHERE "Usuario_ID" = ${usuarioId} FOR UPDATE`;
    const actual = await tx.notaPagina.findUnique({ where: { usuarioId_id: { usuarioId, id: pedido.id } } });
    const decision = decidirPush(actual ? { rev: actual.rev, datos: actual.datos, purgada: actual.purgada } : null, pedido);
    if (!decision.guardar) return decision.respuesta;

    const { ultimaRev: rev } = await tx.notaEspacio.update({
      where: { usuarioId },
      data: { ultimaRev: { increment: 1 } },
    });
    // Borrada para siempre: se guarda JSON null (Prisma.DbNull) para que el resto de los dispositivos la borre
    const datos = pedido.purged ? Prisma.DbNull : (pedido.data as Prisma.InputJsonValue);
    await tx.notaPagina.upsert({
      where: { usuarioId_id: { usuarioId, id: pedido.id } },
      create: { usuarioId, id: pedido.id, rev, datos, purgada: pedido.purged },
      update: { rev, datos, purgada: pedido.purged },
    });
    return { ok: true, rev };
  });
}
```
Verificación: `npx tsc --noEmit`. Si algo no compila, **STOP** con el error textual; no lo arregles por tu cuenta.

#### M6 · Rutas [agy]
- [x] hecha (agy)
Archivos: `src/app/api/notas/sync/pull/route.ts` y `src/app/api/notas/sync/push/route.ts` (crear)

`pull/route.ts`:
```ts
// POST { cursor, limit } → { rows } (lane 271; protocolo de dovli). Solo las notas del usuario de la sesión.
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { pullNotas } from "@/lib/notas/servidor/nube";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Iniciá sesión para sincronizar" }, { status: 401 });
  const { cursor = 0, limit = 100 } = await req.json().catch(() => ({}));
  return NextResponse.json({ rows: await pullNotas(Number(session.user.id), Number(cursor), Number(limit)) });
}
```

`push/route.ts`:
```ts
// POST { id, data, baseRev, purged } → { ok, rev, data?, purged?, tooBig? } (lane 271; protocolo de dovli)
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { pushNota } from "@/lib/notas/servidor/nube";
import { MAX_PAGE_CHARS } from "@/lib/notas/servidor/reglas";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Iniciá sesión para sincronizar" }, { status: 401 });
  if (Number(req.headers.get("content-length") ?? 0) > MAX_PAGE_CHARS + 20_000) return NextResponse.json({ ok: false, rev: 0, tooBig: true });
  try {
    return NextResponse.json(await pushNota(Number(session.user.id), await req.json().catch(() => null)));
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "No se pudo guardar" }, { status: 400 });
  }
}
```

### Fase 2 — portar el cliente (receta de port, una microtarea por archivo)
Cada microtarea de esta fase la escribe el orquestador **al empezar la fase**, con este formato fijo (ver `PROTOCOLO_AGY.md` › «Receta de port»):
- Origen exacto (`vendor/dovli/...`) y destino exacto (`src/...`).
- Cambios permitidos, y solo estos: (1) cabecera de trazabilidad; (2) imports `@dovli/core|sync|editor|ui|theme` → rutas de la tabla de arriba; (3) textos visibles al español rioplatense con la tabla de textos que dé el orquestador; (4) quitar lo marcado como fuera de la v1 (IA, compartir, Excalidraw, Firebase, analytics), borrando el import y el uso, sin reemplazarlo por nada; (5) componentes de `@dovli/ui` → los equivalentes de `src/components/ui` que liste el orquestador.
- Prohibido: cambiar lógica, renombrar funciones, «mejorar» código.
- Verificación: `npx tsc --noEmit` y `npx eslint <destino>`.

Orden: `core/*` (con sus tests de dovli pasados a `node:test`) → `sync/{types,engine,http}` (`http.ts`: sin `authorization`, rutas `/api/notas/sync/*`, `credentials: "same-origin"`) → `cliente/{db,store,files,sync}` → `editor/*` → `components/notas/{sidebar,page,trash,workspace}`.

#### Fase 2a — `core/*` (escritas el 2026-11-07; ensayadas por el orquestador: tsc 0 · eslint 0 · 53/53 tests)

Decisión técnica D7 (orquestador): el código portado conserva los `any` de dovli; cada archivo que los tiene lleva, como **segunda línea**, el `eslint-disable` exacto que indica su microtarea. No se tipa nada a mano.

Precondición de todo el bloque: `ls src/lib/notas/core src/lib/notas/prueba` → «No such file or directory» (si existen: BLOQUEADO).

##### P0 · Crear `src/lib/notas/prueba/vitest.ts` [agy]
- [x] hecha (`beec616`)
Crear el archivo con este contenido exacto:
```ts
// Compatibilidad mínima con la API de vitest que usan los tests portados de dovli (lane 271),
// sobre node:test. Solo los matchers que esos tests usan; sin `.not`.
import { describe, it } from "node:test";
import assert from "node:assert/strict";

export { describe, it };

/** Como `toEqual` de vitest: las propiedades con valor `undefined` no cuentan. */
function sinIndefinidos(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(sinIndefinidos);
  if (v && typeof v === "object" && Object.getPrototypeOf(v) === Object.prototype) {
    const fuera: Record<string, unknown> = {};
    for (const [k, x] of Object.entries(v)) if (x !== undefined) fuera[k] = sinIndefinidos(x);
    return fuera;
  }
  return v;
}

/** Como `toMatchObject` de vitest: `esperado` es un subconjunto de `real` (los arrays, elemento a elemento). */
function contiene(real: unknown, esperado: unknown): boolean {
  if (Array.isArray(esperado)) {
    return Array.isArray(real) && real.length === esperado.length && esperado.every((e, i) => contiene(real[i], e));
  }
  if (esperado && typeof esperado === "object") {
    if (!real || typeof real !== "object") return false;
    return Object.entries(esperado).every(([k, e]) => contiene((real as Record<string, unknown>)[k], e));
  }
  return Object.is(real, esperado);
}

export function expect(real: unknown, mensaje?: string) {
  return {
    toBe: (esperado: unknown) => assert.strictEqual(real, esperado, mensaje),
    toEqual: (esperado: unknown) => assert.deepStrictEqual(sinIndefinidos(real), sinIndefinidos(esperado)),
    toMatchObject: (esperado: unknown) =>
      assert.ok(contiene(real, esperado), `toMatchObject: ${JSON.stringify(real)} no contiene ${JSON.stringify(esperado)}`),
    toBeNull: () => assert.strictEqual(real, null),
    toBeUndefined: () => assert.strictEqual(real, undefined),
    toBeTruthy: () => assert.ok(real),
    toBeGreaterThan: (n: number) => assert.ok((real as number) > n, `${String(real)} no es mayor que ${n}`),
    toBeLessThan: (n: number) => assert.ok((real as number) < n, `${String(real)} no es menor que ${n}`),
    toHaveLength: (n: number) => assert.strictEqual((real as { length: number }).length, n),
    toContain: (x: unknown) =>
      assert.ok(
        typeof real === "string" ? real.includes(String(x)) : (real as unknown[]).includes(x),
        `${JSON.stringify(real)} no contiene ${JSON.stringify(x)}`,
      ),
    toMatch: (re: RegExp | string) => assert.match(String(real), typeof re === "string" ? new RegExp(re) : re),
  };
}
```

##### P1 · Portar `types.ts` [agy]
- [x] hecha (`beec616`)
Origen: `vendor/dovli/packages/core/src/types.ts` · Destino: `src/lib/notas/core/types.ts` (crear; si ya existe: BLOQUEADO)
- Línea 1: `// Portado de vendor/dovli/packages/core/src/types.ts (MayankJha0333/dovli@eb453e0)`
- Línea 2: `/* eslint-disable @typescript-eslint/no-explicit-any -- código portado de dovli, sin cambios de lógica */`
- Tabla de imports (en `import` y `export ... from`): ninguno
- Tabla de textos: ninguna (no hay textos visibles).
- Quitar: nada.
- Todo lo demás: copia textual del origen, en el mismo orden.

##### P2 · Portar `pages.ts` [agy]
- [x] hecha (`beec616`)
Origen: `vendor/dovli/packages/core/src/pages.ts` · Destino: `src/lib/notas/core/pages.ts` (crear; si ya existe: BLOQUEADO)
- Línea 1: `// Portado de vendor/dovli/packages/core/src/pages.ts (MayankJha0333/dovli@eb453e0)`
- Línea 2: `/* eslint-disable @typescript-eslint/no-explicit-any -- código portado de dovli, sin cambios de lógica */`
- Tabla de imports (en `import` y `export ... from`): `"./types"` → `"./types.ts"`
- Tabla de textos: ninguna (no hay textos visibles).
- Quitar: nada.
- Todo lo demás: copia textual del origen, en el mismo orden.

##### P3 · Portar `references.ts` [agy]
- [x] hecha (`beec616`)
Origen: `vendor/dovli/packages/core/src/references.ts` · Destino: `src/lib/notas/core/references.ts` (crear; si ya existe: BLOQUEADO)
- Línea 1: `// Portado de vendor/dovli/packages/core/src/references.ts (MayankJha0333/dovli@eb453e0)`
- Línea 2: `/* eslint-disable @typescript-eslint/no-explicit-any -- código portado de dovli, sin cambios de lógica */`
- Tabla de imports (en `import` y `export ... from`): `"./pages"` → `"./pages.ts"` · `"./types"` → `"./types.ts"`
- Tabla de textos: ninguna (no hay textos visibles).
- Quitar: nada.
- Todo lo demás: copia textual del origen, en el mismo orden.

##### P4 · Portar `tags.ts` [agy]
- [x] hecha (`beec616`)
Origen: `vendor/dovli/packages/core/src/tags.ts` · Destino: `src/lib/notas/core/tags.ts` (crear; si ya existe: BLOQUEADO)
- Línea 1: `// Portado de vendor/dovli/packages/core/src/tags.ts (MayankJha0333/dovli@eb453e0)`
- Sin línea de eslint-disable.
- Tabla de imports (en `import` y `export ... from`): `"./pages"` → `"./pages.ts"` · `"./types"` → `"./types.ts"`
- Tabla de textos: ninguna (no hay textos visibles).
- Quitar: nada.
- Todo lo demás: copia textual del origen, en el mismo orden.

##### P5 · Portar `search.ts` [agy]
- [x] hecha (`beec616`)
Origen: `vendor/dovli/packages/core/src/search.ts` · Destino: `src/lib/notas/core/search.ts` (crear; si ya existe: BLOQUEADO)
- Línea 1: `// Portado de vendor/dovli/packages/core/src/search.ts (MayankJha0333/dovli@eb453e0)`
- Sin línea de eslint-disable.
- Tabla de imports (en `import` y `export ... from`): `"./pages"` → `"./pages.ts"` · `"./types"` → `"./types.ts"`
- Tabla de textos: ninguna (no hay textos visibles).
- Quitar: nada.
- Todo lo demás: copia textual del origen, en el mismo orden.

##### P6 · Portar `merge.ts` [agy]
- [x] hecha (`beec616`)
Origen: `vendor/dovli/packages/core/src/merge.ts` · Destino: `src/lib/notas/core/merge.ts` (crear; si ya existe: BLOQUEADO)
- Línea 1: `// Portado de vendor/dovli/packages/core/src/merge.ts (MayankJha0333/dovli@eb453e0)`
- Línea 2: `/* eslint-disable @typescript-eslint/no-explicit-any -- código portado de dovli, sin cambios de lógica */`
- Tabla de imports (en `import` y `export ... from`): `"./types"` → `"./types.ts"`
- Tabla de textos: ninguna (no hay textos visibles).
- Quitar: nada.
- Todo lo demás: copia textual del origen, en el mismo orden.

##### P7 · Portar `links.ts` [agy]
- [x] hecha (`beec616`)
Origen: `vendor/dovli/packages/core/src/links.ts` · Destino: `src/lib/notas/core/links.ts` (crear; si ya existe: BLOQUEADO)
- Línea 1: `// Portado de vendor/dovli/packages/core/src/links.ts (MayankJha0333/dovli@eb453e0)`
- Línea 2: `/* eslint-disable @typescript-eslint/no-explicit-any -- código portado de dovli, sin cambios de lógica */`
- Tabla de imports (en `import` y `export ... from`): ninguno
- Tabla de textos: ninguna (no hay textos visibles).
- Quitar: nada.
- Todo lo demás: copia textual del origen, en el mismo orden.

##### P8 · Portar `blocks.ts` [agy]
- [x] hecha (`beec616`)
Origen: `vendor/dovli/packages/core/src/blocks.ts` · Destino: `src/lib/notas/core/blocks.ts` (crear; si ya existe: BLOQUEADO)
- Línea 1: `// Portado de vendor/dovli/packages/core/src/blocks.ts (MayankJha0333/dovli@eb453e0)`
- Línea 2: `/* eslint-disable @typescript-eslint/no-explicit-any -- código portado de dovli, sin cambios de lógica */`
- Tabla de imports (en `import` y `export ... from`): `"./links"` → `"./links.ts"`
- Tabla de textos: ninguna (no hay textos visibles).
- Quitar: nada.
- Todo lo demás: copia textual del origen, en el mismo orden.

##### P9 · Portar `markdown.ts` [agy]
- [x] hecha (`beec616`)
Origen: `vendor/dovli/packages/core/src/markdown.ts` · Destino: `src/lib/notas/core/markdown.ts` (crear; si ya existe: BLOQUEADO)
- Línea 1: `// Portado de vendor/dovli/packages/core/src/markdown.ts (MayankJha0333/dovli@eb453e0)`
- Línea 2: `/* eslint-disable @typescript-eslint/no-explicit-any -- código portado de dovli, sin cambios de lógica */`
- Tabla de imports (en `import` y `export ... from`): `"./links"` → `"./links.ts"`
- Tabla de textos: ninguna (no hay textos visibles).
- Quitar: nada.
- Todo lo demás: copia textual del origen, en el mismo orden.

##### P10 · Portar `index.ts` [agy]
- [x] hecha (`beec616`)
Origen: `vendor/dovli/packages/core/src/index.ts` · Destino: `src/lib/notas/core/index.ts` (crear; si ya existe: BLOQUEADO)
- Línea 1: `// Portado de vendor/dovli/packages/core/src/index.ts (MayankJha0333/dovli@eb453e0)`
- Sin línea de eslint-disable.
- Tabla de imports (en `import` y `export ... from`): `"./blocks"` → `"./blocks.ts"` · `"./links"` → `"./links.ts"` · `"./markdown"` → `"./markdown.ts"` · `"./merge"` → `"./merge.ts"` · `"./pages"` → `"./pages.ts"` · `"./references"` → `"./references.ts"` · `"./search"` → `"./search.ts"` · `"./tags"` → `"./tags.ts"` · `"./types"` → `"./types.ts"`
- Tabla de textos: ninguna (no hay textos visibles).
- Quitar: las líneas `export * from "./templates";` y `export { seedPages } from "./seed";`.
- Todo lo demás: copia textual del origen, en el mismo orden.

##### P11 · Portar `core.test.ts` [agy]
- [x] hecha (`beec616`)
Origen: `vendor/dovli/packages/core/src/core.test.ts` · Destino: `src/lib/notas/core/core.test.ts` (crear; si ya existe: BLOQUEADO)
- Línea 1: `// Portado de vendor/dovli/packages/core/src/core.test.ts (MayankJha0333/dovli@eb453e0)`
- Línea 2: `/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-object-type, @typescript-eslint/no-unused-expressions -- código portado de dovli, sin cambios de lógica */`
- Tabla de imports (en `import` y `export ... from`): `"./blocks"` → `"./blocks.ts"` · `"./merge"` → `"./merge.ts"` · `"./pages"` → `"./pages.ts"` · `"./references"` → `"./references.ts"` · `"./search"` → `"./search.ts"` · `"./tags"` → `"./tags.ts"` · `"./types"` → `"./types.ts"` · `"vitest"` → `"../prueba/vitest.ts"`
- Tabla de textos: ninguna (no hay textos visibles).
- Quitar: la línea `import { seedPages } from "./seed";`; en `import { pageWithBlockIds, withBlockIds } from "./blocks";` borrar `pageWithBlockIds, ` (queda `import { withBlockIds } from "./blocks.ts";`); el test completo `it("gives every sample page heading an id, so the outline has keys", ...)` (desde la línea en blanco que lo precede hasta su `  });` inclusive). El archivo termina en `    expect(withBlockIds(a, "pg")).toBe(a);` / `  });` / `});`.
- Todo lo demás: copia textual del origen, en el mismo orden.

##### P12 · Portar `markdown.test.ts` [agy]
- [x] hecha (`beec616`)
Origen: `vendor/dovli/packages/core/src/markdown.test.ts` · Destino: `src/lib/notas/core/markdown.test.ts` (crear; si ya existe: BLOQUEADO)
- Línea 1: `// Portado de vendor/dovli/packages/core/src/markdown.test.ts (MayankJha0333/dovli@eb453e0)`
- Línea 2: `/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars -- código portado de dovli, sin cambios de lógica */`
- Tabla de imports (en `import` y `export ... from`): `"./markdown"` → `"./markdown.ts"` · `"vitest"` → `"../prueba/vitest.ts"`
- Tabla de textos: ninguna (no hay textos visibles).
- Quitar: el bloque completo `describe("the sample pages", async () => { ... });` y la línea en blanco que lo sigue (el archivo pasa de `});` del bloque anterior, línea en blanco, directo a `describe("mermaid flowcharts", ...`).
- Todo lo demás: copia textual del origen, en el mismo orden.

Verificación del bloque (la corre agy y la pega en el reporte): `npx tsc --noEmit` → sin salida · `npx eslint src/lib/notas/core src/lib/notas/prueba` → sin salida · `node --test --disable-warning=MODULE_TYPELESS_PACKAGE_JSON "src/lib/notas/core/*.test.ts"` → `ℹ pass 53` y `ℹ fail 0`.
Control del orquestador: `diff -r` contra el ensayo (`scratchpad/esperado271`) → sin diferencias.

#### Fase 2b — `sync/*` (ensayada: tsc 0 · eslint 0 · 7/7 tests del motor)

Precondición del bloque: `ls src/lib/notas/sync` → «No such file or directory» y `ls src/lib/notas/core/index.ts` existe.

##### S1 · Portar `sync/types.ts` [agy]
- [x] hecha (`c4a9fbb`)
Origen: `vendor/dovli/packages/sync/src/types.ts` · Destino: `src/lib/notas/sync/types.ts` (crear; si existe: BLOQUEADO). Copia textual del origen con **solo** estos cambios:
- Línea 1: `// Portado de vendor/dovli/packages/sync/src/types.ts (MayankJha0333/dovli@eb453e0)`
  1. Reemplazar (aparece exactamente 1 vez):
```
import type { Page } from "@dovli/core";
```
     por:
```
import type { Page } from "../core/index.ts";
```

##### S2 · Portar `sync/engine.ts` [agy]
- [x] hecha (`c4a9fbb`)
Origen: `vendor/dovli/packages/sync/src/engine.ts` · Destino: `src/lib/notas/sync/engine.ts` (crear; si existe: BLOQUEADO). Copia textual del origen con **solo** estos cambios:
- Línea 1: `// Portado de vendor/dovli/packages/sync/src/engine.ts (MayankJha0333/dovli@eb453e0)`
  1. Reemplazar (aparece exactamente 1 vez):
```
import type { SupabaseClient } from "@supabase/supabase-js";
```
     por: nada (borrar el texto, incluido su salto de línea final)
  2. Reemplazar (aparece exactamente 1 vez):
```
import { mergePage, type Page } from "@dovli/core";
```
     por:
```
import { mergePage, type Page } from "../core/index.ts";
```
  3. Reemplazar (aparece exactamente 1 vez):
```
import { supabaseTransport } from "./supabase";
```
     por: nada (borrar el texto, incluido su salto de línea final)
  4. Reemplazar (aparece exactamente 1 vez):
```
import { MAX_PAGE_CHARS, type SyncHost, type SyncStatus, type SyncTransport } from "./types";
```
     por:
```
import { MAX_PAGE_CHARS, type SyncHost, type SyncStatus, type SyncTransport } from "./types.ts";
```
  5. Reemplazar (aparece exactamente 1 vez):
```
  /** Where pages go. (Or pass `supabase` for the older Supabase setup.) */
```
     por:
```
  /** Where pages go. */
```
  6. Reemplazar (aparece exactamente 1 vez):
```
  supabase?: SupabaseClient;
```
     por: nada (borrar el texto, incluido su salto de línea final)
  7. Reemplazar (aparece exactamente 1 vez):
```
  bucket?: string;
```
     por: nada (borrar el texto, incluido su salto de línea final)
  8. Reemplazar (aparece exactamente 1 vez):
```
const transport = opts.transport ?? (opts.supabase ? supabaseTransport(opts.supabase, opts.bucket) : null);
```
     por:
```
const transport = opts.transport ?? null;
```
  9. Reemplazar (aparece exactamente 1 vez):
```
error: `${n} ${n === 1 ? "page is" : "pages are"} too big to back up (over 900 KB). ${n === 1 ? "It's" : "They're"} still saved on this device.`,
```
     por:
```
error: `${n} ${n === 1 ? "página es demasiado grande" : "páginas son demasiado grandes"} para respaldar (más de 900 KB). ${n === 1 ? "Sigue guardada" : "Siguen guardadas"} en este dispositivo.`,
```

##### S3 · Portar `sync/engine.test.ts` [agy]
- [x] hecha (`c4a9fbb`)
Origen: `vendor/dovli/packages/sync/src/engine.test.ts` · Destino: `src/lib/notas/sync/engine.test.ts` (crear; si existe: BLOQUEADO). Copia textual del origen con **solo** estos cambios:
- Línea 1: `// Portado de vendor/dovli/packages/sync/src/engine.test.ts (MayankJha0333/dovli@eb453e0)`
- Línea 2: `/* eslint-disable @typescript-eslint/no-explicit-any -- código portado de dovli, sin cambios de lógica */`
- Quitar el método `client(): any { ... }` completo de la clase `FakeCloud` (desde la línea `  client(): any {` hasta su `  }` de cierre inclusive; la clase queda terminando en `  duringPush: (() => void) | null = null;` y `}`).
- Reemplazar todas las apariciones (5) de `new FakeDevice(cloud, "transport")` por `new FakeDevice(cloud)`.
  1. Reemplazar (aparece exactamente 1 vez):
```
import { describe, expect, it } from "vitest";
```
     por:
```
import { describe, expect, it } from "../prueba/vitest.ts";
```
  2. Reemplazar (aparece exactamente 1 vez):
```
import type { Page } from "@dovli/core";
```
     por:
```
import type { Page } from "../core/index.ts";
```
  3. Reemplazar (aparece exactamente 1 vez):
```
import { SyncEngine } from "./engine";
```
     por:
```
import { SyncEngine } from "./engine.ts";
```
  4. Reemplazar (aparece exactamente 1 vez):
```
type SyncTransport, type SyncedCopy } from "./types";
```
     por:
```
type SyncTransport, type SyncedCopy } from "./types.ts";
```
  5. Reemplazar (aparece exactamente 1 vez):
```
constructor(cloud: FakeCloud, via: "supabase" | "transport" = "supabase") {
    this.engine =
      via === "supabase"
        ? new SyncEngine({ supabase: cloud.client(), host: this, isOnline: () => cloud.online })
        : new SyncEngine({ transport: transportFor(cloud), host: this, isOnline: () => cloud.online });
```
     por:
```
constructor(cloud: FakeCloud) {
    this.engine = new SyncEngine({ transport: transportFor(cloud), host: this, isOnline: () => cloud.online });
```
  6. Reemplazar (aparece exactamente 1 vez):
```
expect(a.engine.status.error).toContain("1 page is too big");
```
     por:
```
expect(a.engine.status.error).toContain("1 página es demasiado grande");
```

##### S4 · Crear `sync/http.ts` (adaptado: cookie de sesión, rutas de Ordo) [agy]
- [x] hecha (`c4a9fbb`)
Crear `src/lib/notas/sync/http.ts` (si ya existe: BLOQUEADO) con este contenido exacto:
```ts
// Portado de vendor/dovli/packages/sync/src/http.ts (MayankJha0333/dovli@eb453e0)
// Adaptado a Ordo (lane 271, D2): rutas /api/notas/sync/* con la cookie de sesión, sin token Bearer.
import type { PageRow, PushResult, SyncTransport } from "./types.ts";

/**
 * Pages through Ordo's own server (/api/notas/sync/*). The session cookie says who is signed in.
 * `baseUrl` is empty on the web (same site).
 */
export function httpTransport({ baseUrl = "" }: { baseUrl?: string } = {}): SyncTransport {
  async function call<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${baseUrl}${path}`, {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error ?? `No se pudo sincronizar (${res.status}).`);
    return data as T;
  }
  return {
    pull: async (cursor, limit) => (await call<{ rows: PageRow[] }>("/api/notas/sync/pull", { cursor, limit })).rows,
    push: (c) => call<PushResult>("/api/notas/sync/push", c),
  };
}
```

Verificación del bloque: `node --test --disable-warning=MODULE_TYPELESS_PACKAGE_JSON "src/lib/notas/sync/*.test.ts"` → `ℹ pass 7` y `ℹ fail 0`.

#### Fase 2c — `theme/*` (ensayada: tsc 0 · eslint 0)

Precondición: `ls src/lib/notas/theme` → «No such file or directory».

Para **cada** archivo `.ts` de `vendor/dovli/packages/theme/src/` (appThemes, covers, css, index, pageLook, pageStyles, tokens) crear `src/lib/notas/theme/<mismo nombre>` = copia textual con estos cambios y ningún otro:
- Línea 1: `// Portado de vendor/dovli/packages/theme/src/<archivo> (MayankJha0333/dovli@eb453e0)`.
- Todo `from "./<nombre>"` pasa a `from "./<nombre>.ts"` (en `import` y en `export ... from`).
- Tabla de textos (cada texto de la izquierda aparece exactamente 1 vez en su archivo):
  - `pageStyles.ts`: `name: "Paper & Ink"` → `name: "Papel y tinta"` · `name: "Cobalt Night"` → `name: "Noche cobalto"` · `name: "Starlight"` → `name: "Luz de estrellas"` · `name: "Monsoon"` → `name: "Monzón"` · `name: "Marigold"` → `name: "Caléndula"` · `name: "Sage Garden"` → `name: "Jardín de salvia"` · `name: "Blueprint"` → `name: "Plano"` · `name: "Dusk"` → `name: "Atardecer"` · `name: "Morning Sky"` → `name: "Cielo de mañana"` · `name: "Ink Wash"` → `name: "Aguada"` · `name: "Linen"` → `name: "Lino"` · `name: "Halftone"` → `name: "Semitono"` · `name: "Terrazzo"` → `name: "Granito"` · `name: "Lagoon"` → `name: "Laguna"` · `name: "Cherry Blossom"` → `name: "Flor de cerezo"` · `name: "Desert Dunes"` → `name: "Dunas"` · `name: "Evergreen"` → `name: "Siempreverde"` · `name: "Notebook"` → `name: "Cuaderno"` · `name: "Graphite"` → `name: "Grafito"` · `name: "Midnight"` → `name: "Medianoche"`
  - `covers.ts`: `name: "Dawn"` → `name: "Amanecer"` · `name: "Citrus"` → `name: "Cítrico"` · `name: "Meadow"` → `name: "Pradera"` · `name: "Lagoon"` → `name: "Laguna"` · `name: "Dusk"` → `name: "Atardecer"` · `name: "Ink"` → `name: "Tinta"` · `name: "Paper"` → `name: "Papel"`
  - `pageLook.ts`: `label: "System"` → `label: "Sistema"` · `label: "Round"` → `label: "Redonda"` · `label: "Line"` → `label: "Línea"` · `label: "Dots"` → `label: "Puntos"` · `label: "Wave"` → `label: "Onda"` · `name: "Custom"` → `name: "Personalizado"`
- `appThemes.ts`: sin cambios de texto (no se muestra en la v1).
##### T1 · Portar `theme/*` [agy]
- [x] hecha (`c4a9fbb`)

#### Fase 2d — `cliente/*` (ensayada: tsc 0 · eslint 0)

Precondición: `ls src/lib/notas/cliente` → «No such file or directory»; existen `src/lib/notas/sync/engine.ts` y `src/lib/notas/theme/index.ts`.

##### C1 · Portar `cliente/db.ts` [agy]
- [x] hecha (`c4a9fbb`)
Origen: `vendor/dovli/apps/web/src/lib/db.ts` · Destino: `src/lib/notas/cliente/db.ts` (crear; si existe: BLOQUEADO). Copia textual con **solo** estos cambios:
- Línea 1: `// Portado de vendor/dovli/apps/web/src/lib/db.ts (MayankJha0333/dovli@eb453e0)`
  1. Reemplazar (aparece exactamente 1 vez):
```
import type { Page, StoredFile } from "@dovli/core";
```
     por:
```
import type { Page, StoredFile } from "@/lib/notas/core";
```

##### C2 · Portar `cliente/files.ts` [agy]
- [x] hecha (`c4a9fbb`)
Origen: `vendor/dovli/apps/web/src/lib/files.ts` · Destino: `src/lib/notas/cliente/files.ts` (crear; si existe: BLOQUEADO). Copia textual con **solo** estos cambios:
- Línea 1: `// Portado de vendor/dovli/apps/web/src/lib/files.ts (MayankJha0333/dovli@eb453e0)`
  1. Reemplazar (aparece exactamente 1 vez):
```
import { fileIdFromUrl, fileUrl, type StoredFile } from "@dovli/core";
```
     por:
```
import { fileIdFromUrl, fileUrl, type StoredFile } from "@/lib/notas/core";
```
  2. Reemplazar (aparece exactamente 1 vez):
```
throw new Error(`That file is ${(file.size / 1048576).toFixed(0)} MB. The limit is 50 MB.`);
```
     por:
```
throw new Error(`Ese archivo pesa ${(file.size / 1048576).toFixed(0)} MB. El límite es 50 MB.`);
```

##### C3 · Portar `cliente/store.ts` [agy]
- [x] hecha (`c4a9fbb`)
Origen: `vendor/dovli/apps/web/src/lib/store.ts` · Destino: `src/lib/notas/cliente/store.ts` (crear; si existe: BLOQUEADO). Copia textual con **solo** estos cambios:
- Línea 1: `// Portado de vendor/dovli/apps/web/src/lib/store.ts (MayankJha0333/dovli@eb453e0)`
- Línea 2: `/* eslint-disable @typescript-eslint/no-explicit-any -- código portado de dovli, sin cambios de lógica */`
  1. Reemplazar (aparece exactamente 1 vez):
```
  seedPages,
```
     por: nada (borrar el texto, incluido su salto de línea final)
  2. Reemplazar (aparece exactamente 1 vez):
```
} from "@dovli/core";
```
     por:
```
} from "@/lib/notas/core";
```
  3. Reemplazar (aparece exactamente 1 vez):
```
import { DEFAULT_PAGE_STYLE } from "@dovli/theme";
```
     por:
```
import { DEFAULT_PAGE_STYLE } from "@/lib/notas/theme";
```
  4. Reemplazar (aparece exactamente 1 vez):
```
pages = legacy ? Object.fromEntries(Object.values(legacy).map((p) => [p.id, pageWithBlockIds(p)])) : seedPages();
```
     por:
```
pages = legacy ? Object.fromEntries(Object.values(legacy).map((p) => [p.id, pageWithBlockIds(p)])) : {};
```
  5. Reemplazar (aparece exactamente 1 vez):
```
pages = (await loadLegacy()) ?? seedPages();
```
     por:
```
pages = (await loadLegacy()) ?? {};
```
  6. Reemplazar (aparece exactamente 1 vez):
```

  resetWorkspace() {
    store.replaceAll(seedPages());
  },
```
     por: nada (borrar el texto, incluido su salto de línea final)
  7. Reemplazar (aparece exactamente 1 vez):
```
title: src.title ? `${src.title} (copy)` : "",
```
     por:
```
title: src.title ? `${src.title} (copia)` : "",
```

##### C4 · Crear `cliente/sync.ts` (adaptado a Ordo: siempre hay sesión, sin Firebase/Supabase ni compartir) [agy]
- [x] hecha (`c4a9fbb`)
Crear `src/lib/notas/cliente/sync.ts` (si ya existe: BLOQUEADO) con este contenido exacto:
```ts
// Portado de vendor/dovli/apps/web/src/lib/sync.ts (MayankJha0333/dovli@eb453e0)
// Adaptado a Ordo (lane 271, D2): siempre hay sesión; el transporte es /api/notas/sync/* con la cookie.
// Connects the store to the cloud. Every local change is noted in the "outbox" (IndexedDB);
// the shared SyncEngine sends it, pulls other devices' changes and merges conflicts.

import { useSyncExternalStore } from "react";
import { SyncEngine } from "@/lib/notas/sync/engine";
import { httpTransport } from "@/lib/notas/sync/http";
import type { SyncHost, SyncStatus } from "@/lib/notas/sync/types";
import type { Page } from "@/lib/notas/core";
import { db, getMeta, setMeta } from "./db";
import { filesToUpload, markUploaded, setRemoteFileSource } from "./files";
import { onLocalChange, store } from "./store";

/** En Ordo siempre hay sesión: las notas se sincronizan siempre. */
export const syncOn = true;

const CURSOR_KEY = "sync.cursor";
const OWNER_KEY = "sync.owner";

const host: SyncHost = {
  getPage: (id) => store.get().pages[id],
  applyFromCloud: (pages, removed) => store.applyFromCloud(pages, removed),
  pending: async () => (await db()).getAll("outbox"),
  async clearPending(id, pushed) {
    const current = store.get().pages[id] ?? null;
    if (pushed && JSON.stringify(current) !== JSON.stringify(pushed)) return; // changed again since: keep it
    await (await db()).delete("outbox", id);
  },
  getSynced: async (id) => (await db()).get("synced", id),
  setSynced: async (copy) => void (await (await db()).put("synced", copy)),
  removeSynced: async (id) => void (await (await db()).delete("synced", id)),
  getCursor: async () => (await getMeta<number>(CURSOR_KEY)) ?? 0,
  setCursor: (rev) => setMeta(CURSOR_KEY, rev),
  async pendingFiles() {
    return (await filesToUpload()).map((f) => ({ id: f.id, blob: f.blob, type: f.type }));
  },
  markFileUploaded: (id) => markUploaded(id),
};

let status: SyncStatus = { state: "signed-out", pending: 0, lastSyncedAt: null };
const listeners = new Set<() => void>();

let engine: SyncEngine | null = null;

/** Note local changes in the outbox, so they are sent once online. */
onLocalChange(async (ids, purged) => {
  const d = await db();
  const tx = d.transaction("outbox", "readwrite");
  for (const id of ids) await tx.store.put({ id, base: null, baseRev: null });
  for (const id of purged) await tx.store.put({ id, base: null, baseRev: null, purge: true });
  await tx.done;
  engine?.notifyLocalChange();
});

/** First sync on this device for this account: queue every page the cloud does not know yet. */
async function queueUnsyncedPages() {
  const d = await db();
  const synced = new Set(await d.getAllKeys("synced"));
  const tx = d.transaction("outbox", "readwrite");
  for (const p of Object.values(store.get().pages) as Page[]) if (!synced.has(p.id)) await tx.store.put({ id: p.id, base: null, baseRev: null });
  await tx.done;
}

/** Forget sync bookkeeping when a different account signs in on this device. */
async function prepareFor(userId: string) {
  const owner = await getMeta<string>(OWNER_KEY);
  if (owner === userId) return;
  const d = await db();
  await Promise.all([d.clear("synced"), d.clear("outbox")]);
  await setMeta(CURSOR_KEY, 0);
  await setMeta(OWNER_KEY, userId);
}

/** Arranca el sync para el usuario de la sesión (llamar después de initStore). */
export function startSync(userId: string) {
  if (engine) return;
  const e = new SyncEngine({
    transport: httpTransport(),
    host,
    onOnline: (cb) => {
      window.addEventListener("online", cb);
      return () => window.removeEventListener("online", cb);
    },
  });
  engine = e;
  e.subscribe((s) => {
    status = s;
    listeners.forEach((l) => l());
  });
  if (e.syncsFiles) setRemoteFileSource((id) => e.downloadFile(id), () => e.notifyLocalChange());
  // Check for changes from other devices whenever the page comes back into view (plus every 30 s).
  document.addEventListener("visibilitychange", () => document.visibilityState === "visible" && e.syncSoon(0));
  window.addEventListener("focus", () => e.syncSoon(0));
  // Losing the connection: say "offline" now, not at the next try.
  window.addEventListener("offline", () => e.syncSoon(0));

  void (async () => {
    await prepareFor(userId);
    const first = (await getMeta<number>(CURSOR_KEY)) === 0;
    e.start(userId);
    if (first) {
      // Pull the cloud first, then send whatever this device has that the cloud does not.
      await e.syncNow();
      await queueUnsyncedPages();
      e.syncSoon(0);
    }
  })();
}

export const sync = {
  get: () => status,
  now: () => engine?.syncSoon(0),
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};

export function useSyncStatus(): SyncStatus {
  return useSyncExternalStore(sync.subscribe, () => status, () => status);
}
```

Verificación de 2b–2d (la corre agy y pega la salida): `npx tsc --noEmit` → sin salida · `npx eslint src/lib/notas` → sin salida.
Control del orquestador: `diff -r` contra `scratchpad/esperado271/{sync,theme,cliente}` → sin diferencias.

#### Fase 2e — textos del core, `ui/`, puente de tokens, `editor/` y `editorBridge` (ensayada: tsc 0 · eslint 0 · 53/53 tests del core · humo en navegador OK)

Precondición del bloque: `ls src/components/notas` → «No such file or directory»; `grep -c "Untitled" src/lib/notas/core/pages.ts` → `1`.

##### P13 · Textos «Untitled» del core [agy]
- [x] hecha (`46244de`)
Archivos existentes; solo estos 3 reemplazos, nada más:
- `src/lib/notas/core/pages.ts`:
  1. Reemplazar (aparece exactamente 1 vez):
```
"Untitled board" : "Untitled")
```
     por:
```
"Pizarra sin título" : "Sin título")
```
- `src/lib/notas/core/markdown.ts`:
  1. Reemplazar (aparece exactamente 1 vez):
```
c.props?.title || "Untitled")
```
     por:
```
c.props?.title || "Sin título")
```
  2. Reemplazar (aparece exactamente 1 vez):
```
"$1") || "Untitled" }
```
     por:
```
"$1") || "Sin título" }
```
Verificación: `grep -rn "Untitled" src/lib/notas` → sin salida.

##### U1 · Portar `ui/*` (D8: sin `Logo.tsx` ni `styles.css`) [agy]
- [x] hecha (`46244de`)
Para **cada** archivo `.ts`/`.tsx` de `vendor/dovli/packages/ui/src/` **excepto** `Logo.tsx` crear `src/components/notas/ui/<mismo nombre>` = copia textual con estos cambios y ningún otro (`styles.css` no se copia):
- Cabecera: si el archivo es `Input.tsx` o `Toast.tsx`, línea 1 `"use client";` y la siguiente es la de origen; en los demás la de origen es la línea 1. Línea de origen: `// Portado de vendor/dovli/packages/ui/src/<archivo> (MayankJha0333/dovli@eb453e0)`.
- `Toast.tsx`: después de la línea de origen, la línea `/* eslint-disable react-hooks/set-state-in-effect -- código portado de dovli, sin cambios de lógica */`.
- `Dialog.tsx`:
  1. Reemplazar (aparece exactamente 1 vez):
```
{typeof title === "string" ? title : "Dialog"}
```
     por:
```
{typeof title === "string" ? title : "Diálogo"}
```
  2. Reemplazar (aparece exactamente 1 vez):
```
label="Close"
```
     por:
```
label="Cerrar"
```
- `Controls.tsx`:
  1. Reemplazar (aparece exactamente 1 vez):
```
label = "Loading"
```
     por:
```
label = "Cargando"
```
- `index.ts`:
  1. Reemplazar (aparece exactamente 1 vez):
```
export { DovliMark, DovliLogo, markSvg, MARK } from "./Logo";
```
     por: nada (borrar el texto, incluido su salto de línea final)
Verificación: `ls src/components/notas/ui` → exactamente estos 11 archivos: Button.tsx Controls.tsx Dialog.tsx Icon.tsx Input.tsx Kbd.tsx Menu.tsx Toast.tsx Tooltip.tsx cn.ts index.ts; `grep -rn "Logo" src/components/notas/ui` → sin salida.

##### K1 · Crear el puente de tokens `src/components/notas/dovli.css` (D8) [agy]
- [x] hecha (`46244de`)
Crear `src/components/notas/dovli.css` (si ya existe: BLOQUEADO) con este contenido exacto:
```css
/* Puente de tokens de dovli para Ordo (lane 271, D8).
   Adaptado de vendor/dovli/packages/ui/src/styles.css y packages/theme/src/css.ts (MayankJha0333/dovli@eb453e0).
   - Solo agrega a Tailwind los nombres de dovli que Ordo no tiene (bg-panel, text-ink-2, shadow-pop…);
     los que chocan (primary, accent, sidebar, text-sm, rounded-md…) conservan el significado de Ordo.
   - Las variables --d-* y --c-* salen de los tokens de Ordo, así siguen su tema claro y oscuro.
   - Dentro de .notas-dovli el «accent» es el de dovli (color fuerte); fuera, el de Ordo no cambia.
   - Sin la capa base de dovli (pisaría body y html de Ordo). */

@theme inline {
  --color-bg: var(--d-bg);
  --color-panel: var(--d-panel);
  --color-sheet: var(--d-sheet);
  --color-raised: var(--d-raised);
  --color-well: var(--d-well);
  --color-hover: var(--d-hover);
  --color-active: var(--d-active-bg);
  --color-active-ink: var(--d-active-ink);
  --color-line: var(--d-line);
  --color-line-strong: var(--d-line-strong);
  --color-ink: var(--d-ink);
  --color-ink-2: var(--d-ink-2);
  --color-ink-3: var(--d-ink-3);
  --color-ink-4: var(--d-ink-4);
  --color-accent-hover: var(--d-accent-hover);
  --color-accent-ink: var(--d-accent-ink);
  --color-accent-soft: var(--d-accent-soft);
  --color-primary-hover: var(--d-primary-hover);
  --color-primary-ink: var(--d-primary-ink);
  --color-brand: var(--d-brand);
  --color-brand-ink: var(--d-brand-ink);
  --color-danger: var(--d-danger);
  --color-danger-soft: var(--d-danger-soft);
  --color-ok: var(--d-ok);
  --color-warn: var(--d-warn);
  --color-overlay: var(--d-overlay);
  --color-sketch: var(--d-sketch);
  --color-chip: var(--d-chip-bg);

  --font-display: var(--d-font-display);
  --font-label: var(--d-label-font);

  --text-2xs: 0.6875rem;
  --text-2xs--line-height: 1rem;
  --text-md: 0.9375rem;
  --text-md--line-height: 1.45rem;

  --radius-shell: var(--d-radius-shell);
  --radius-sheet: var(--d-radius-sheet);

  --shadow-card: var(--d-shadow-card);
  --shadow-pop: var(--d-shadow-pop);
  --shadow-sheet: var(--d-shadow-sheet);
  --shadow-active: var(--d-shadow-active);
  --shadow-chip: var(--d-chip-shadow);
  --shadow-shell: var(--d-shadow-shell);

  --spacing-row: var(--d-row);

  --animate-fade-in: dovli-fade-in 0.16s cubic-bezier(0.2, 0.7, 0.2, 1);
  --animate-pop-in: dovli-pop-in 0.18s cubic-bezier(0.2, 0.7, 0.2, 1);
  --animate-sheet-in: dovli-sheet-in 0.32s cubic-bezier(0.2, 0.7, 0.2, 1);
  --animate-shimmer: dovli-shimmer 1.2s linear infinite;

  @keyframes dovli-fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes dovli-pop-in {
    from { opacity: 0; transform: translateY(4px) scale(0.98); }
    to { opacity: 1; transform: none; }
  }
  @keyframes dovli-sheet-in {
    from { opacity: 0.4; transform: translateY(10px); }
    to { opacity: 1; transform: none; }
  }
  @keyframes dovli-shimmer {
    from { background-position: 200% 0; }
    to { background-position: -200% 0; }
  }
}

/* Tokens de dovli a partir de los de Ordo. Al ser referencias, siguen solos el modo oscuro (.dark). */
:root {
  --d-bg: var(--background);
  --d-sidebar: var(--sidebar);
  --d-panel: var(--card);
  --d-sheet: var(--card);
  --d-sheet-solid: var(--card);
  --d-raised: var(--popover);
  --d-well: var(--muted);
  --d-hover: color-mix(in srgb, var(--foreground) 6%, transparent);
  --d-active-bg: var(--sidebar-accent);
  --d-active-ink: var(--foreground);
  --d-line: var(--border);
  --d-line-strong: var(--input);
  --d-ink: var(--foreground);
  --d-ink-2: color-mix(in srgb, var(--foreground) 82%, var(--background));
  --d-ink-3: var(--muted-foreground);
  --d-ink-4: color-mix(in srgb, var(--muted-foreground) 78%, var(--background));
  --d-accent: var(--primary);
  --d-accent-hover: color-mix(in srgb, var(--primary) 85%, var(--foreground));
  --d-accent-ink: var(--primary-foreground);
  --d-accent-soft: color-mix(in srgb, var(--primary) 12%, var(--background));
  --d-primary: var(--primary);
  --d-primary-hover: color-mix(in srgb, var(--primary) 85%, var(--foreground));
  --d-primary-ink: var(--primary-foreground);
  --d-brand: var(--primary);
  --d-brand-ink: var(--primary-foreground);
  --d-danger: var(--destructive);
  --d-danger-soft: color-mix(in srgb, var(--destructive) 10%, var(--background));
  --d-ok: var(--success);
  --d-warn: var(--warning);
  --d-selection: color-mix(in srgb, var(--primary) 20%, transparent);
  --d-overlay: rgba(0, 0, 0, 0.32);
  --d-sketch: color-mix(in srgb, var(--primary) 14%, var(--background));
  --d-glow-1: transparent;
  --d-glow-1-o: 0;
  --d-glow-2: transparent;
  --d-glow-2-o: 0;
  --d-glow-3: transparent;
  --d-glow-3-o: 0;
  --d-font-sans: var(--font-sans);
  --d-font-display: var(--font-heading, var(--font-sans));
  --d-font-mono: var(--font-mono);
  --d-display-weight: 700;
  --d-display-tracking: -0.015em;
  --d-radius-sm: 6px;
  --d-radius-md: 10px;
  --d-radius-lg: 14px;
  --d-radius-xl: 18px;
  --d-radius-shell: 16px;
  --d-radius-sheet: 24px;
  --d-shadow-sm: 0 0 0 1px color-mix(in srgb, var(--foreground) 6%, transparent), 0 1px 2px color-mix(in srgb, var(--foreground) 6%, transparent);
  --d-shadow-card: 0 0 0 1px color-mix(in srgb, var(--foreground) 6%, transparent), 0 2px 6px color-mix(in srgb, var(--foreground) 5%, transparent), 0 12px 28px color-mix(in srgb, var(--foreground) 8%, transparent);
  --d-shadow-pop: 0 0 0 1px color-mix(in srgb, var(--foreground) 8%, transparent), 0 8px 20px color-mix(in srgb, var(--foreground) 9%, transparent), 0 24px 56px color-mix(in srgb, var(--foreground) 14%, transparent);
  --d-shadow-sheet: 0 24px 60px rgba(0, 0, 0, 0.28);
  --d-shadow-active: none;
  --d-shadow-shell: 0 1px 2px color-mix(in srgb, var(--foreground) 6%, transparent);
  --d-row: 34px;
  --d-filter-sidebar: none;
  --d-filter-panel: none;
  --d-filter-raised: none;
  --d-filter-chrome: blur(12px) saturate(1.5);
  --d-shell-gap: 12px;
  --d-divider: 0 solid transparent;
  --d-label-font: var(--d-font-sans);
  --d-label-transform: none;
  --d-label-tracking: 0;
  --d-label-size: 0.78rem;
  --d-chip-bg: color-mix(in srgb, var(--card) 78%, transparent);
  --d-chip-shadow: 0 0 0 1px color-mix(in srgb, var(--foreground) 5%, transparent), 0 1px 2px color-mix(in srgb, var(--foreground) 5%, transparent);
  --d-chip-radius: 999px;

  --d-doc-sans: var(--font-sans), system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji";
  --d-doc-serif: ui-serif, "Source Serif 4", Charter, "Iowan Old Style", Georgia, serif, "Apple Color Emoji", "Segoe UI Emoji";
  --d-doc-mono: ui-monospace, "SF Mono", var(--d-font-mono), Menlo, Consolas, monospace;
  --d-doc-rounded: ui-rounded, "SF Pro Rounded", "Nunito", system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji";

  /* Vidrio de los botones y paneles flotantes de la página (dovli: «chrome», como Craft). */
  --c-font: var(--d-doc-sans);
  --c-filter: blur(28px) saturate(1.8);
  --c-pill: color-mix(in srgb, var(--card) 95%, transparent);
  --c-pill-shadow: 0 0 0 0.5px rgba(20, 22, 26, 0.08), 0 1px 2px rgba(20, 22, 26, 0.06), 0 4px 14px rgba(20, 22, 26, 0.08);
  --c-panel: color-mix(in srgb, var(--card) 86%, transparent);
  --c-panel-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.6), 0 0 0 0.5px rgba(20, 22, 26, 0.12), 0 2px 6px rgba(20, 22, 26, 0.05), 0 18px 50px rgba(20, 22, 26, 0.18);
  --c-ink: var(--foreground);
  --c-ink-2: color-mix(in srgb, var(--foreground) 78%, transparent);
  --c-ink-3: color-mix(in srgb, var(--foreground) 64%, transparent);
  --c-ink-4: color-mix(in srgb, var(--foreground) 42%, transparent);
  --c-line: color-mix(in srgb, var(--foreground) 9%, transparent);
  --c-line-strong: color-mix(in srgb, var(--foreground) 17%, transparent);
  --c-control: color-mix(in srgb, var(--card) 60%, transparent);
  --c-control-hover: color-mix(in srgb, var(--card) 92%, transparent);
  --c-control-on: color-mix(in srgb, var(--foreground) 10%, transparent);
  --c-hover: color-mix(in srgb, var(--foreground) 6%, transparent);
}
.dark {
  --d-overlay: rgba(0, 0, 0, 0.5);
  --c-pill-shadow: inset 0 0 0 0.5px rgba(255, 255, 255, 0.1), 0 1px 2px rgba(0, 0, 0, 0.3), 0 4px 14px rgba(0, 0, 0, 0.28);
  --c-panel-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08), 0 0 0 0.5px rgba(0, 0, 0, 0.5), 0 2px 6px rgba(0, 0, 0, 0.2), 0 18px 50px rgba(0, 0, 0, 0.45);
}

/* Dentro de las notas, «accent» es el color fuerte de dovli (Ordo lo usa como fondo suave). */
.notas-dovli {
  --accent: var(--d-accent);
  --accent-foreground: var(--d-accent-ink);
  color: var(--d-ink);
}
.notas-dovli ::selection { background: var(--d-selection); }
.notas-dovli input::placeholder, .notas-dovli textarea::placeholder { color: var(--d-ink-4); }

/* Utilidades de dovli (copiadas de packages/ui/src/styles.css). */
@utility surface-sidebar {
  background: var(--d-sidebar);
  -webkit-backdrop-filter: var(--d-filter-sidebar, none);
  backdrop-filter: var(--d-filter-sidebar, none);
}
@utility surface-panel {
  background: var(--d-panel);
  -webkit-backdrop-filter: var(--d-filter-panel, none);
  backdrop-filter: var(--d-filter-panel, none);
}
@utility surface-raised {
  background: var(--d-raised);
  box-shadow: var(--d-shadow-pop);
  -webkit-backdrop-filter: var(--d-filter-raised, none);
  backdrop-filter: var(--d-filter-raised, none);
}
@utility surface-chip {
  background: var(--d-chip-bg);
  box-shadow: var(--d-chip-shadow);
  border-radius: var(--d-chip-radius);
  -webkit-backdrop-filter: var(--d-filter-chrome, none);
  backdrop-filter: var(--d-filter-chrome, none);
}
@utility chrome-tokens {
  --d-ink: var(--c-ink);
  --d-ink-2: var(--c-ink-2);
  --d-ink-3: var(--c-ink-3);
  --d-ink-4: var(--c-ink-4);
  --d-line: var(--c-line);
  --d-line-strong: var(--c-line-strong);
  --d-font-sans: var(--c-font);
  --d-font-display: var(--c-font);
  --d-display-tracking: -0.01em;
  --d-display-weight: 700;
  color: var(--c-ink);
  font-family: var(--c-font);
}
@utility chrome-pill {
  @apply chrome-tokens;
  --d-hover: var(--c-hover);
  --d-active-bg: var(--c-control-on);
  --d-active-ink: var(--c-ink);
  background: var(--c-pill);
  box-shadow: var(--c-pill-shadow);
  border-radius: 999px;
  -webkit-backdrop-filter: var(--c-filter);
  backdrop-filter: var(--c-filter);
}
@utility chrome-panel {
  @apply chrome-tokens;
  --d-well: var(--c-control);
  --d-hover: var(--c-control-hover);
  --d-panel: var(--c-control-hover);
  --d-active-bg: var(--c-control-on);
  --d-active-ink: var(--c-ink);
  --d-radius-sm: 7px;
  --d-radius-md: 10px;
  --d-radius-lg: 12px;
  --d-shadow-sm: 0 0 0 0.5px var(--c-line-strong), 0 1px 2px rgba(0, 0, 0, 0.06);
  --d-shadow-card: 0 0 0 0.5px var(--c-line-strong), 0 6px 16px rgba(0, 0, 0, 0.12);
  --d-label-font: var(--c-font);
  background: var(--c-panel);
  box-shadow: var(--c-panel-shadow);
  border-radius: 14px;
  -webkit-backdrop-filter: var(--c-filter);
  backdrop-filter: var(--c-filter);
}
@utility scroll-fader {
  background: linear-gradient(to bottom, var(--d-panel) 0, var(--d-panel) 30%, transparent 100%);
  -webkit-backdrop-filter: blur(10px) saturate(1.1);
  backdrop-filter: blur(10px) saturate(1.1);
  -webkit-mask-image: linear-gradient(to bottom, #000 0, #000 34%, rgb(0 0 0 / 0.72) 58%, rgb(0 0 0 / 0.28) 80%, transparent 100%);
  mask-image: linear-gradient(to bottom, #000 0, #000 34%, rgb(0 0 0 / 0.72) 58%, rgb(0 0 0 / 0.28) 80%, transparent 100%);
  opacity: var(--fade-o, 0);
  @media print {
    display: none;
  }
}
@media (hover: hover) {
  .notas-dovli [data-backdrop-fixed] { background-attachment: fixed !important; }
  .notas-dovli .scroll-fader[data-styled] { background: var(--s-backdrop); background-attachment: fixed; }
}
@media (hover: none) {
  .notas-dovli .scroll-fader[data-styled] { background: none; }
}
@utility label-text {
  font-family: var(--d-label-font);
  font-size: var(--d-label-size);
  text-transform: var(--d-label-transform);
  letter-spacing: var(--d-label-tracking);
  font-weight: 600;
  color: var(--d-ink-3);
}
@utility display-text {
  font-family: var(--d-font-display);
  font-weight: var(--d-display-weight);
  letter-spacing: var(--d-display-tracking);
  line-height: 1.06;
  text-wrap: balance;
  color: var(--d-ink);
}
@utility focus-ring {
  outline: 2px solid var(--d-accent);
  outline-offset: 2px;
}

/* Estilos de página (copiado de packages/ui/src/styles.css). */
.page-styled {
  --d-panel: var(--s-paper);
  --d-sheet: var(--s-paper);
  --d-raised: var(--s-paper);
  --d-ink: var(--s-ink);
  --d-ink-2: color-mix(in srgb, var(--s-ink) 76%, var(--s-paper));
  --d-ink-3: color-mix(in srgb, var(--s-ink) 66%, var(--s-paper));
  --d-ink-4: color-mix(in srgb, var(--s-ink) 52%, var(--s-paper));
  --d-line: color-mix(in srgb, var(--s-ink) 12%, var(--s-paper));
  --d-line-strong: color-mix(in srgb, var(--s-ink) 22%, var(--s-paper));
  --d-well: color-mix(in srgb, var(--s-ink) 5%, var(--s-paper));
  --d-hover: color-mix(in srgb, var(--s-ink) 7%, var(--s-paper));
  --d-active-bg: color-mix(in srgb, var(--s-ink) 11%, var(--s-paper));
  --d-active-ink: var(--s-ink);
  --d-accent: var(--s-accent);
  --d-accent-soft: color-mix(in srgb, var(--s-accent) 12%, var(--s-paper));
  --d-sketch: color-mix(in srgb, var(--s-accent) 18%, var(--s-paper));
  --d-selection: color-mix(in srgb, var(--s-accent) 22%, transparent);
  --d-shadow-sm: 0 0 0 1px color-mix(in srgb, var(--s-ink) 8%, transparent), 0 1px 2px color-mix(in srgb, var(--s-ink) 6%, transparent);
  --d-shadow-card: 0 0 0 1px color-mix(in srgb, var(--s-ink) 8%, transparent), 0 10px 24px color-mix(in srgb, var(--s-ink) 10%, transparent);
  --d-filter-raised: none;
  --accent: var(--s-accent);
  color: var(--d-ink);
}
```

##### K2 · Importar el puente en `src/app/globals.css` [agy]
- [x] hecha (`46244de`)
Insertar una línea nueva **entre** la línea 3 (`@import "shadcn/tailwind.css";`) y la línea 4 (`@custom-variant dark (&:where(.dark, .dark *));`), con este texto exacto:
```css
@import "../components/notas/dovli.css";
```
Nada más cambia en `globals.css`. Verificación: `head -5 src/app/globals.css` muestra las 3 líneas `@import` originales, la nueva y `@custom-variant`.

##### Receta común del editor (E1–E19)
Origen `vendor/dovli/packages/editor/src/<archivo>` · destino `src/components/notas/editor/<archivo>` (crear; si existe: BLOQUEADO). Copia textual con **solo** estos cambios, **en este orden**:
1. **Borrar bloques** que indique la microtarea (cada bloque aparece exactamente 1 vez; la microtarea dice cuántas líneas en blanco siguientes se borran también).
2. **Imports** (todas las apariciones): `from "@dovli/core"` → `from "@/lib/notas/core"` · `from "@dovli/theme"` → `from "@/lib/notas/theme"` · `from "@dovli/ui"` → `from "@/components/notas/ui"`.
3. **Reemplazos** que indique la microtarea (el texto «viejo» ya está escrito con los imports del paso 2 aplicados).
4. **Cabecera**: en `.ts`/`.tsx`: si la microtarea dice «use client», línea 1 `"use client";`; luego `// Portado de vendor/dovli/packages/editor/src/<archivo> (MayankJha0333/dovli@eb453e0)`; luego, si la microtarea da una «línea eslint», esa línea. En `editor.css` la cabecera es `/* Portado de vendor/dovli/packages/editor/src/editor.css (MayankJha0333/dovli@eb453e0) */`.
No se copian: `excalidrawKit.ts`, `FlowchartEditor.tsx`, `blocks/embeds.tsx`, `blocks/pdf.tsx`, `index.ts`, `css.d.ts` (fuera de la v1).

##### E1 · Portar `editor/a11y.ts` [agy]
- [x] hecha (`46244de`)
- Sin «use client» ni línea eslint.
- Sin borrados ni reemplazos (solo imports y cabecera).

##### E2 · Portar `editor/bridge.ts` [agy]
- [x] hecha (`46244de`)
- línea eslint: `/* eslint-disable @typescript-eslint/no-explicit-any -- código portado de dovli, sin cambios de lógica */`
- Sin borrados ni reemplazos (solo imports y cabecera).

##### E3 · Portar `editor/convert.ts` [agy]
- [x] hecha (`46244de`)
- línea eslint: `/* eslint-disable @typescript-eslint/no-explicit-any -- código portado de dovli, sin cambios de lógica */`
- Borrar bloque 1 — estas líneas completas y, a continuación, 1 línea(s) en blanco que lo siguen:
```
/** A flowchart block's drawing as SVG markup, light, for exports. "" when it's empty or can't be drawn. */
export async function flowchartSvg(scene: string): Promise<string> {
  if (!scene) return "";
  try {
    const kit = await import("./excalidrawKit");
    return await kit.renderSvg(scene, false);
  } catch {
    return "";
  }
}
```

##### E4 · Portar `editor/dropPosition.ts` [agy]
- [x] hecha (`46244de`)
- línea eslint: `/* eslint-disable @typescript-eslint/no-explicit-any -- código portado de dovli, sin cambios de lógica */`
- Sin borrados ni reemplazos (solo imports y cabecera).

##### E5 · Portar `editor/findReplace.ts` [agy]
- [x] hecha (`46244de`)
- línea eslint: `/* eslint-disable @typescript-eslint/no-explicit-any -- código portado de dovli, sin cambios de lógica */`
- Reemplazos:
  1. Reemplazar (aparece exactamente 1 vez):
```
"That pattern isn't a valid regular expression."
```
     por:
```
"Ese patrón no es una expresión regular válida."
```

##### E6 · Portar `editor/format.ts` [agy]
- [x] hecha (`46244de`)
- línea eslint: `/* eslint-disable @typescript-eslint/no-explicit-any -- código portado de dovli, sin cambios de lógica */`
- Reemplazos:
  1. Reemplazar (aparece exactamente 1 vez):
```
label: "Default"
```
     por:
```
label: "Predeterminado"
```
  2. Reemplazar (aparece exactamente 1 vez):
```
label: "Grey"
```
     por:
```
label: "Gris"
```
  3. Reemplazar (aparece exactamente 1 vez):
```
label: "Brown"
```
     por:
```
label: "Marrón"
```
  4. Reemplazar (aparece exactamente 1 vez):
```
label: "Red"
```
     por:
```
label: "Rojo"
```
  5. Reemplazar (aparece exactamente 1 vez):
```
label: "Orange"
```
     por:
```
label: "Naranja"
```
  6. Reemplazar (aparece exactamente 1 vez):
```
label: "Yellow"
```
     por:
```
label: "Amarillo"
```
  7. Reemplazar (aparece exactamente 1 vez):
```
label: "Green"
```
     por:
```
label: "Verde"
```
  8. Reemplazar (aparece exactamente 1 vez):
```
label: "Blue"
```
     por:
```
label: "Azul"
```
  9. Reemplazar (aparece exactamente 1 vez):
```
label: "Purple"
```
     por:
```
label: "Violeta"
```
  10. Reemplazar (aparece exactamente 1 vez):
```
label: "Pink"
```
     por:
```
label: "Rosa"
```
  11. Reemplazar (aparece exactamente 1 vez):
```
title: title || "Untitled"
```
     por:
```
title: title || "Sin título"
```

##### E7 · Portar `editor/tags.ts` [agy]
- [x] hecha (`46244de`)
- Sin «use client» ni línea eslint.
- Sin borrados ni reemplazos (solo imports y cabecera).

##### E8 · Portar `editor/topEdge.ts` [agy]
- [x] hecha (`46244de`)
- Sin «use client» ni línea eslint.
- Sin borrados ni reemplazos (solo imports y cabecera).

##### E9 · Portar `editor/useIsDark.ts` [agy]
- [x] hecha (`46244de`)
- «use client»: sí
- Reemplazos:
  1. Reemplazar (aparece exactamente 1 vez):
```
const attr = document.documentElement.getAttribute("data-scheme");
  if (attr === "dark") return true;
  if (attr === "light") return false;
  try {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  } catch {
    return false;
  }
```
     por:
```
// Ordo marca el modo oscuro con la clase .dark en <html> (lane 271).
  return document.documentElement.classList.contains("dark");
```
  2. Reemplazar (aparece exactamente 1 vez):
```
attributeFilter: ["data-scheme"]
```
     por:
```
attributeFilter: ["class"]
```

##### E10 · Portar `editor/schema.tsx` [agy]
- [x] hecha (`46244de`)
- «use client»: sí · línea eslint: `/* eslint-disable @typescript-eslint/no-explicit-any -- código portado de dovli, sin cambios de lógica */`
- Reemplazos:
  1. Reemplazar (aparece exactamente 1 vez):
```
import { embedBlock, flowchartBlock } from "./blocks/embeds";
```
     por: nada (borrar el texto, incluido su salto de línea final)
  2. Reemplazar (aparece exactamente 1 vez):
```
import { pdfBlock } from "./blocks/pdf";
```
     por: nada (borrar el texto, incluido su salto de línea final)
  3. Reemplazar (aparece exactamente 1 vez):
```
    embed: embedBlock(),
    flowchart: flowchartBlock(),
```
     por: nada (borrar el texto, incluido su salto de línea final)
  4. Reemplazar (aparece exactamente 1 vez):
```
    pdf: pdfBlock(),
```
     por: nada (borrar el texto, incluido su salto de línea final)
  5. Reemplazar (aparece exactamente 1 vez):
```
box.setAttribute("aria-label", "To-do");
```
     por:
```
box.setAttribute("aria-label", "Tarea");
```

##### E11 · Portar `editor/SlashMenu.tsx` [agy]
- [x] hecha (`46244de`)
- «use client»: sí
- Reemplazos:
  1. Reemplazar (aparece exactamente 1 vez):
```
aria-label="Insert"
```
     por:
```
aria-label="Insertar"
```
  2. Reemplazar (aparece exactamente 1 vez):
```
aria-label={`Shortcut ${item.badge}`}
```
     por:
```
aria-label={`Atajo ${item.badge}`}
```
  3. Reemplazar (aparece exactamente 1 vez):
```
Nothing matches. Keep typing, or press Esc.
```
     por:
```
No hay coincidencias. Seguí escribiendo o tocá Esc.
```
  4. Reemplazar (aparece exactamente 1 vez):
```
aria-label="Loading"
```
     por:
```
aria-label="Cargando"
```

##### E12 · Portar `editor/FindBar.tsx` [agy]
- [x] hecha (`46244de`)
- «use client»: sí
- Reemplazos:
  1. Reemplazar (aparece exactamente 1 vez):
```
aria-label="Find in page"
```
     por:
```
aria-label="Buscar en la página"
```
  2. Reemplazar (aparece exactamente 1 vez):
```
label={showReplace ? "Hide replace" : "Show replace"}
```
     por:
```
label={showReplace ? "Ocultar reemplazar" : "Mostrar reemplazar"}
```
  3. Reemplazar (aparece exactamente 1 vez):
```
placeholder="Find in page"
```
     por:
```
placeholder="Buscar en la página"
```
  4. Reemplazar (aparece exactamente 1 vez):
```
aria-label="Find"
```
     por:
```
aria-label="Buscar"
```
  5. Reemplazar (aparece exactamente 1 vez):
```
`${current + 1} of ${matches.length}` : "No matches"
```
     por:
```
`${current + 1} de ${matches.length}` : "Sin resultados"
```
  6. Reemplazar (aparece exactamente 1 vez):
```
title="Match case"
```
     por:
```
title="Distinguir mayúsculas"
```
  7. Reemplazar (aparece exactamente 1 vez):
```
title="Whole words only"
```
     por:
```
title="Solo palabras completas"
```
  8. Reemplazar (aparece exactamente 1 vez):
```
          Word
```
     por:
```
          Palabra
```
  9. Reemplazar (aparece exactamente 1 vez):
```
label="Previous match"
```
     por:
```
label="Anterior"
```
  10. Reemplazar (aparece exactamente 1 vez):
```
label="Next match"
```
     por:
```
label="Siguiente"
```
  11. Reemplazar (aparece exactamente 1 vez):
```
label="Close find"
```
     por:
```
label="Cerrar búsqueda"
```
  12. Reemplazar (aparece exactamente 1 vez):
```
placeholder="Replace with"
```
     por:
```
placeholder="Reemplazar por"
```
  13. Reemplazar (aparece exactamente 1 vez):
```
aria-label="Replace with"
```
     por:
```
aria-label="Reemplazar por"
```
  14. Reemplazar (aparece exactamente 1 vez):
```
            Replace all
```
     por:
```
            Reemplazar todo
```
  15. Reemplazar (aparece exactamente 1 vez):
```
            Replace
```
     por:
```
            Reemplazar
```

##### E13 · Portar `editor/PageEditor.tsx` [agy]
- [x] hecha (`46244de`)
- «use client»: sí · línea eslint: `/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars -- código portado de dovli, sin cambios de lógica */`
- Borrar bloque 1 — estas líneas completas (ninguna línea en blanco extra):
```
    {
      title: "Whiteboard",
      subtext: "A canvas for shapes, arrows and sketches",
      aliases: ["board", "canvas", "draw", "diagram", "excalidraw"],
      group: "Pages",
      icon: glyph("board"),
      onItemClick: () => insertChild("board"),
    },
    {
      title: "Flowchart",
      subtext: "Boxes and arrows, drawn right in the page",
      aliases: ["flow", "flowchart", "diagram", "chart", "process"],
      group: "Embeds",
      icon: glyph("sync"),
      onItemClick: () => insert({ type: "flowchart" }),
    },
    {
      title: "Link preview",
      subtext: "A card for a video, image or web page",
      aliases: ["embed", "link", "url", "video", "youtube", "vimeo", "loom", "bookmark"],
      group: "Embeds",
      icon: glyph("share"),
      onItemClick: () => insert({ type: "embed", props: { link: "" } }),
    },
```
- Borrar bloque 2 — estas líneas completas (ninguna línea en blanco extra):
```
  if (bridge.uploadFile)
    items.push({
      title: "PDF",
      subtext: "Show a PDF inside the page",
      aliases: ["pdf", "document", "attachment"],
      group: "Media",
      icon: glyph("pdf"),
      onItemClick: () => insert({ type: "pdf" }),
    });
```
- Borrar bloque 3 — estas líneas completas y, a continuación, 1 línea(s) en blanco que lo siguen:
```
/** "Ask AI" in the toolbar that appears over selected text. */
function AIButton() {
  const editor = useBlockNoteEditor() as unknown as DovliEditor;
  const bridge = useBridge();
  const Components = useComponentsContext()!;
  if (!bridge.openAI || !editor.isEditable) return null;
  return (
    <Components.FormattingToolbar.Button
      className="bn-button"
      label="Ask AI"
      mainTooltip="Ask AI to rewrite, shorten, fix or translate"
      icon={<Icon name="sparkles" size={16} />}
      onClick={() => {
        const view = editor.prosemirrorView;
        const { from, to } = view.state.selection;
        const text = editor.getSelectedText();
        bridge.openAI!({
          text,
          replace: (t) => view.dispatch(view.state.tr.insertText(t, from, to)),
          insertAfter: (t) => {
            const blocks = editor.getSelection()?.blocks ?? [editor.getTextCursorPosition().block];
            const last = blocks[blocks.length - 1];
            const paras = t.split(/\n{2,}/).map((x) => ({ type: "paragraph" as const, content: x.trim() }));
            editor.insertBlocks(paras as any, last.id, "after");
          },
        });
      }}
    >
      <span className="ml-1 text-sm font-semibold">Ask AI</span>
    </Components.FormattingToolbar.Button>
  );
}
```
- Borrar bloque 4 — estas líneas completas (ninguna línea en blanco extra):
```
      // Paste a link on an empty line and it becomes a preview card, like in a chat app.
      // Pasting a link inside a sentence still makes a normal text link.
      pasteHandler: ({ event, editor, defaultPasteHandler }) => {
        const data = event.clipboardData;
        const text = data?.getData("text/plain")?.trim() ?? "";
        if (text && isLikelyUrl(text) && !data?.files?.length)
          try {
            const block: any = editor.getTextCursorPosition().block;
            const empty = block.type === "paragraph" && (!block.content || block.content.length === 0);
            if (empty) {
              const url = normalizeUrl(text);
              const [embed] = (editor as any).replaceBlocks([block.id], [{ type: "embed", props: toEmbedProps(classify(url), "loading") }]).insertedBlocks;
              const [next] = editor.insertBlocks([{ type: "paragraph" }], embed.id, "after");
              editor.setTextCursorPosition(next.id, "start");
              return true;
            }
          } catch (err) {
            console.error("[dovli] link preview paste failed", err);
          }
        return defaultPasteHandler();
      },
```
- Reemplazos:
  1. Reemplazar (aparece exactamente 1 vez):
```
import { en } from "@blocknote/core/locales";
```
     por:
```
import { es } from "@blocknote/core/locales";
```
  2. Reemplazar (aparece exactamente 1 vez):
```
import "@blocknote/mantine/style.css";
```
     por:
```
import "@blocknote/mantine/style.css";
import "./editor.css";
```
  3. Reemplazar (aparece exactamente 1 vez):
```
import { classify, displayTitle, isLikelyUrl, livePages, mergeBlocks, normalizeUrl, toEmbedProps, type Page } from "@/lib/notas/core";
```
     por:
```
import { displayTitle, livePages, mergeBlocks, type Page } from "@/lib/notas/core";
```
  4. Reemplazar (aparece exactamente 1 vez):
```
      title: "Callout",
      subtext: "A highlighted box for tips and warnings",
      aliases: ["callout", "note", "tip", "warning", "info", "alert", "box"],
      group: "Basic blocks",
```
     por:
```
      title: "Recuadro",
      subtext: "Un cuadro resaltado para consejos y avisos",
      aliases: ["recuadro", "nota", "consejo", "aviso", "callout", "note", "tip", "warning"],
      group: "Bloques básicos",
```
  5. Reemplazar (aparece exactamente 1 vez):
```
      title: "Sortable table",
      subtext: "Rows and typed columns you can sort",
      aliases: ["database", "list", "sort", "columns", "tracker", "data", "spreadsheet", "table"],
      group: "Advanced",
```
     por:
```
      title: "Tabla ordenable",
      subtext: "Filas y columnas con tipo, que se pueden ordenar",
      aliases: ["tabla", "base", "lista", "ordenar", "columnas", "datos", "planilla", "table"],
      group: "Avanzado",
```
  6. Reemplazar (aparece exactamente 1 vez):
```
      title: "Link to page",
      subtext: "Mention another page. Or type [[",
      aliases: ["link", "page", "mention", "reference", "[["],
      group: "Pages",
```
     por:
```
      title: "Enlace a página",
      subtext: "Mencioná otra página. O escribí [[",
      aliases: ["enlace", "pagina", "página", "mencion", "link", "[["],
      group: "Páginas",
```
  7. Reemplazar (aparece exactamente 1 vez):
```
      title: "Sub-page",
      subtext: "A new page inside this one",
      aliases: ["page", "subpage", "nested", "child"],
      group: "Pages",
```
     por:
```
      title: "Subpágina",
      subtext: "Una página nueva dentro de esta",
      aliases: ["subpagina", "subpágina", "pagina", "página", "subpage"],
      group: "Páginas",
```
  8. Reemplazar (aparece exactamente 1 vez):
```
const dictionary = { ...en, formatting_toolbar: { ...en.formatting_toolbar, code: { tooltip: "Inline code", secondary_tooltip: "Mod+E" } } };
```
     por:
```
const dictionary = { ...es, formatting_toolbar: { ...es.formatting_toolbar, code: { tooltip: "Código en línea", secondary_tooltip: "Mod+E" } } };
```
  9. Reemplazar (aparece exactamente 1 vez):
```
<RemoveBlockItem>Delete</RemoveBlockItem>
```
     por:
```
<RemoveBlockItem>Borrar</RemoveBlockItem>
```
  10. Reemplazar (aparece exactamente 1 vez):
```
<BlockColorsItem>Colour</BlockColorsItem>
```
     por:
```
<BlockColorsItem>Color</BlockColorsItem>
```
  11. Reemplazar (aparece exactamente 1 vez):
```
        Duplicate
```
     por:
```
        Duplicar
```
  12. Reemplazar (aparece exactamente 1 vez):
```
title: list.length > 1 ? `Move ${list.length} blocks to…` : "Move block to…"
```
     por:
```
title: list.length > 1 ? `Mover ${list.length} bloques a…` : "Mover bloque a…"
```
  13. Reemplazar (aparece exactamente 1 vez):
```
bridge.notify?.(list.length > 1 ? `Moved ${list.length} blocks` : "Moved 1 block");
```
     por:
```
bridge.notify?.(list.length > 1 ? `${list.length} bloques movidos` : "1 bloque movido");
```
  14. Reemplazar (aparece exactamente 1 vez):
```
          Move to page…
```
     por:
```
          Mover a otra página…
```
  15. Reemplazar (aparece exactamente 1 vez):
```
placeholders: { default: "Write, or type / for blocks", emptyDocument: "Start writing, or type / for blocks" },
```
     por:
```
placeholders: { default: "Escribí, o tocá / para insertar bloques", emptyDocument: "Empezá a escribir, o tocá / para insertar bloques" },
```
  16. Reemplazar (aparece exactamente 1 vez):
```
`${page.title || "Untitled"}, page content` : "Page content. Type / for blocks, [[ to link a page"
```
     por:
```
`${page.title || "Sin título"}, contenido de la página` : "Contenido de la página. Escribí / para insertar bloques y [[ para enlazar una página"
```
  17. Reemplazar (aparece exactamente 1 vez):
```
subtext: p.kind === "board" ? "Whiteboard" : "Page",
```
     por:
```
subtext: p.kind === "board" ? "Pizarra" : "Página",
```
  18. Reemplazar (aparece exactamente 2 veces; reemplazar todas):
```
group: "Link to a page",
```
     por:
```
group: "Enlazar una página",
```
  19. Reemplazar (aparece exactamente 1 vez):
```
title: `Create “${query.trim()}”`,
```
     por:
```
title: `Crear «${query.trim()}»`,
```
  20. Reemplazar (aparece exactamente 1 vez):
```
          subtext: "A new page inside this one",
```
     por:
```
          subtext: "Una página nueva dentro de esta",
```
  21. Reemplazar (aparece exactamente 1 vez):
```
                  <AIButton key="ai" />
```
     por: nada (borrar el texto, incluido su salto de línea final)

##### E14 · Portar `editor/editor.css` [agy]
- [x] hecha (`46244de`)
- Sin «use client» ni línea eslint.
- Sin borrados ni reemplazos (solo imports y cabecera).

##### E15 · Portar `editor/blocks/shared.ts` [agy]
- [x] hecha (`46244de`)
- Sin «use client» ni línea eslint.
- Sin borrados ni reemplazos (solo imports y cabecera).

##### E16 · Portar `editor/blocks/textStyles.tsx` [agy]
- [x] hecha (`46244de`)
- «use client»: sí
- Sin borrados ni reemplazos (solo imports y cabecera).

##### E17 · Portar `editor/blocks/callout.tsx` [agy]
- [x] hecha (`46244de`)
- «use client»: sí · línea eslint: `/* eslint-disable @typescript-eslint/no-explicit-any -- código portado de dovli, sin cambios de lógica */`
- Reemplazos:
  1. Reemplazar (aparece exactamente 1 vez):
```
label: "Note"
```
     por:
```
label: "Nota"
```
  2. Reemplazar (aparece exactamente 1 vez):
```
label: "Tip"
```
     por:
```
label: "Consejo"
```
  3. Reemplazar (aparece exactamente 1 vez):
```
label: "Warning"
```
     por:
```
label: "Advertencia"
```
  4. Reemplazar (aparece exactamente 1 vez):
```
label: "Important"
```
     por:
```
label: "Importante"
```
  5. Reemplazar (aparece exactamente 1 vez):
```
aria-label={`${t.label} callout. Click to change type`}
```
     por:
```
aria-label={`Recuadro: ${t.label}. Tocá para cambiar el tipo`}
```
  6. Reemplazar (aparece exactamente 1 vez):
```
title="Change type"
```
     por:
```
title="Cambiar tipo"
```

##### E18 · Portar `editor/blocks/dataTable.tsx` [agy]
- [x] hecha (`46244de`)
- «use client»: sí · línea eslint: `/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars -- código portado de dovli, sin cambios de lógica */`
- Reemplazos:
  1. Reemplazar (aparece exactamente 1 vez):
```
label: "Text"
```
     por:
```
label: "Texto"
```
  2. Reemplazar (aparece exactamente 1 vez):
```
label: "Number"
```
     por:
```
label: "Número"
```
  3. Reemplazar (aparece exactamente 1 vez):
```
label: "Date"
```
     por:
```
label: "Fecha"
```
  4. Reemplazar (aparece exactamente 1 vez):
```
label: "Tick box"
```
     por:
```
label: "Casilla"
```
  5. Reemplazar (aparece exactamente 1 vez):
```
name: "Name"
```
     por:
```
name: "Nombre"
```
  6. Reemplazar (aparece exactamente 1 vez):
```
name: "Done"
```
     por:
```
name: "Hecho"
```
  7. Reemplazar (aparece exactamente 1 vez):
```
name: "Due"
```
     por:
```
name: "Vence"
```
  8. Reemplazar (aparece exactamente 1 vez):
```
`Column ${t.columns.length + 1}`
```
     por:
```
`Columna ${t.columns.length + 1}`
```
  9. Reemplazar (aparece exactamente 1 vez):
```
aria-label={`${c.name} column options`}
```
     por:
```
aria-label={`Opciones de la columna ${c.name}`}
```
  10. Reemplazar (aparece exactamente 1 vez):
```
<MenuLabel>Column type</MenuLabel>
```
     por:
```
<MenuLabel>Tipo de columna</MenuLabel>
```
  11. Reemplazar (aparece exactamente 1 vez):
```
                          Sort ascending
```
     por:
```
                          Orden ascendente
```
  12. Reemplazar (aparece exactamente 1 vez):
```
                          Sort descending
```
     por:
```
                          Orden descendente
```
  13. Reemplazar (aparece exactamente 1 vez):
```
                            Stop sorting
```
     por:
```
                            Quitar orden
```
  14. Reemplazar (aparece exactamente 1 vez):
```
                          Delete column
```
     por:
```
                          Borrar columna
```
  15. Reemplazar (aparece exactamente 1 vez):
```
aria-label="Column name"
```
     por:
```
aria-label="Nombre de la columna"
```
  16. Reemplazar (aparece exactamente 1 vez):
```
aria-label={`Sort by ${c.name}`}
```
     por:
```
aria-label={`Ordenar por ${c.name}`}
```
  17. Reemplazar (aparece exactamente 1 vez):
```
title="Sort"
```
     por:
```
title="Ordenar"
```
  18. Reemplazar (aparece exactamente 1 vez):
```
aria-label="Add column" title="Add column"
```
     por:
```
aria-label="Agregar columna" title="Agregar columna"
```
  19. Reemplazar (aparece exactamente 1 vez):
```
label={`${c.name}, row ${i + 1}`}
```
     por:
```
label={`${c.name}, fila ${i + 1}`}
```
  20. Reemplazar (aparece exactamente 1 vez):
```
aria-label={`Delete row ${i + 1}`}
```
     por:
```
aria-label={`Borrar fila ${i + 1}`}
```
  21. Reemplazar (aparece exactamente 1 vez):
```
          New row
```
     por:
```
          Fila nueva
```

##### E19 · Portar `editor/blocks/pageLinks.tsx` [agy]
- [x] hecha (`46244de`)
- «use client»: sí
- Reemplazos:
  1. Reemplazar (aparece exactamente 1 vez):
```
{page ? "This page is in the trash" : "This page was deleted"}
```
     por:
```
{page ? "Esta página está en la papelera" : "Esta página se borró"}
```
  2. Reemplazar (aparece exactamente 1 vez):
```
{page.kind === "board" ? "Whiteboard" : childCount ? `${childCount} page${childCount > 1 ? "s" : ""} inside` : "Page"}
```
     por:
```
{page.kind === "board" ? "Pizarra" : childCount ? `${childCount} ${childCount > 1 ? "páginas" : "página"} adentro` : "Página"}
```
  3. Reemplazar (aparece exactamente 1 vez):
```
{page ? displayTitle(page) : "Page"}
```
     por:
```
{page ? displayTitle(page) : "Página"}
```
  4. Reemplazar (aparece exactamente 1 vez):
```
fallback || "Missing page"
```
     por:
```
fallback || "Página que falta"
```
  5. Reemplazar (aparece exactamente 1 vez):
```
{inlineContent.props.title || "Page"}
```
     por:
```
{inlineContent.props.title || "Página"}
```

##### B1 · Crear `src/lib/notas/cliente/editorBridge.ts` (adaptado: imágenes por `/api/upload`, D4) [agy]
- [x] hecha (`46244de`)
Crear `src/lib/notas/cliente/editorBridge.ts` (si ya existe: BLOQUEADO) con este contenido exacto:
```ts
// Portado de vendor/dovli/apps/web/src/lib/editorBridge.ts (MayankJha0333/dovli@eb453e0)
// Adaptado a Ordo (lane 271): las imágenes van por /api/upload (D4) para que viajen entre dispositivos;
// sin Excalidraw, IA, selector de páginas ni vista de etiquetas (fuera de la v1).
// Plugs the web store into the shared editor package, so the editor never imports app code.
import { connectEditor } from "@/components/notas/editor/bridge";
import { toast } from "@/components/notas/ui";
import { store, useStore } from "./store";

async function subirImagen(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const r = await fetch("/api/upload", { method: "POST", body: form });
  const d = await r.json().catch(() => ({}));
  if (!r.ok || typeof d.url !== "string") throw new Error(d.error ?? "No se pudo subir el archivo");
  return d.url;
}

connectEditor({
  usePages: (select) => useStore((s) => select(s.pages)),
  getPages: () => store.get().pages,
  openPage: (id) => store.navigate({ name: "page", id }),
  createPage: (input) => store.createPage(input),
  saveBlocks: (pageId, blocks) => store.updatePage(pageId, { blocks }),
  uploadFile: async (file) => {
    try {
      return await subirImagen(file);
    } catch (err) {
      toast(err instanceof Error ? err.message : "No se pudo agregar ese archivo.", { tone: "danger" });
      throw err;
    }
  },
  notify: (message) => toast(message),
});
```

Verificación de 2e (la corre agy y pega la salida): `grep -rn "@dovli/" src/components/notas src/lib/notas` → sin salida · `ls src/components/notas/editor src/components/notas/editor/blocks`.
Control del orquestador: `diff -r` contra `scratchpad/esperado271/{ui,editor,notas,cliente,core-p13,app}` → sin diferencias; después tsc, eslint, npm test y humo en navegador.

#### Fase 2f — pantallas de notas (D9), `/dashboard/notas` y textos de core/theme (ensayada: tsc 0 · eslint 0 · humo en navegador 12/12, 0 errores de consola)

Precondición del bloque: `ls src/components/notas/sidebar src/app/dashboard/notas` → «No such file or directory»; `grep -c "cmdk" package.json` → `1` (M0c hecho por el orquestador).

##### P14 · `timeAgo` en español (`core/pages.ts`) [agy]
- [x] hecha (`a06ad4d`)
Archivo existente `src/lib/notas/core/pages.ts`; solo estos reemplazos, nada más:
  1. Reemplazar (aparece exactamente 1 vez):
```
if (s < 45) return "just now";
```
     por:
```
if (s < 45) return "recién";
```
  2. Reemplazar (aparece exactamente 1 vez):
```
if (m < 60) return `${m} min ago`;
```
     por:
```
if (m < 60) return `hace ${m} min`;
```
  3. Reemplazar (aparece exactamente 1 vez):
```
if (h < 24) return `${h} hr ago`;
```
     por:
```
if (h < 24) return `hace ${h} h`;
```
  4. Reemplazar (aparece exactamente 1 vez):
```
if (d < 7) return `${d} day${d === 1 ? "" : "s"} ago`;
```
     por:
```
if (d < 7) return `hace ${d} ${d === 1 ? "día" : "días"}`;
```

##### T2 · `lookName` en español (`theme/pageLook.ts`) [agy]
- [x] hecha (`a06ad4d`)
Archivo existente `src/lib/notas/theme/pageLook.ts`; solo estos reemplazos, nada más:
  1. Reemplazar (aparece exactamente 1 vez):
```
if (!r.style) return "Plain";
```
     por:
```
if (!r.style) return "Simple";
```
  2. Reemplazar (aparece exactamente 1 vez):
```
(r.style.id === "custom" ? "Custom colours" : `${r.style.name}, customised`)
```
     por:
```
(r.style.id === "custom" ? "Colores propios" : `${r.style.name}, personalizado`)
```

##### C5 · Crear `src/lib/notas/cliente/settings.ts` (adaptado, D9.3: solo `sidebarHidden` y `spellcheck`, sin tocar `<html>`) [agy]
- [x] hecha (`a06ad4d`)
Crear `src/lib/notas/cliente/settings.ts` (si ya existe: BLOQUEADO) con este contenido exacto:
```ts
"use client";
// Adaptado de vendor/dovli/apps/web/src/lib/settings.ts (MayankJha0333/dovli@eb453e0)
// Lane 271 (D9): solo las preferencias que usan las pantallas de notas (barra lateral oculta y corrector).
// No escribe nada en <html>: el tema, el tamaño de letra y el modo oscuro son los de Ordo.
import { useSyncExternalStore } from "react";

export const SETTINGS_KEY = "ordo.notas.settings.v1";

export interface Settings {
  /** Ocultar la barra lateral de las notas en pantallas anchas (⌘\\). En pantallas chicas es un cajón igual. */
  sidebarHidden: boolean;
  spellcheck: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  sidebarHidden: false,
  spellcheck: true,
};

function read(): Settings {
  try {
    const raw = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? "{}");
    return {
      sidebarHidden: raw.sidebarHidden === true,
      spellcheck: raw.spellcheck !== false,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

let state: Settings = typeof window === "undefined" ? DEFAULT_SETTINGS : read();
const listeners = new Set<() => void>();

export const settings = {
  get: () => state,
  set(patch: Partial<Settings>) {
    state = { ...state, ...patch };
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(state));
    } catch {
      /* ventana privada: vale solo para esta visita */
    }
    listeners.forEach((l) => l());
  },
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};

if (typeof window !== "undefined") {
  // Otra pestaña cambió una preferencia.
  window.addEventListener("storage", (e) => {
    if (e.key === SETTINGS_KEY) {
      state = read();
      listeners.forEach((l) => l());
    }
  });
}

export function useSettings<T>(select: (s: Settings) => T): T {
  return useSyncExternalStore(settings.subscribe, () => select(state), () => select(DEFAULT_SETTINGS));
}
```

##### Receta común de las pantallas (F1–F25)
Cada microtarea F da origen (`vendor/dovli/...`) y destino (crear; si existe: BLOQUEADO). El destino es una copia textual del origen con **solo** estos cambios, **en este orden**:
1. **Cortar** (si la microtarea lo dice): borrar desde la línea indicada hasta el final del archivo; el archivo termina con un solo salto de línea.
2. **Borrar bloques** que indique la microtarea (cada uno aparece exactamente 1 vez; la microtarea dice cuántas líneas en blanco siguientes se borran también).
3. **Imports**, en este orden y en todas sus apariciones: `"@dovli/editor/page-editor"` → `"@/components/notas/editor/PageEditor"` · `from "@dovli/editor"` → `from "@/components/notas/editor"` · `from "@dovli/core"` → `from "@/lib/notas/core"` · `from "@dovli/theme"` → `from "@/lib/notas/theme"` · `from "@dovli/ui"` → `from "@/components/notas/ui"` · `from "@/lib/store"` → `from "@/lib/notas/cliente/store"` · `from "@/lib/ui"` → `from "@/lib/notas/cliente/ui"` · `from "@/lib/settings"` → `from "@/lib/notas/cliente/settings"` · `from "@/lib/find"` → `from "@/lib/notas/cliente/find"` · `from "@/lib/files"` → `from "@/lib/notas/cliente/files"` · `from "@/lib/sync"` → `from "@/lib/notas/cliente/sync"` · `from "@/components/TopBar"` → `from "@/components/notas/TopBar"` · `from "@/features/` → `from "@/components/notas/`.
4. **Reemplazos literales** de la microtarea (el texto «viejo» ya tiene aplicados los imports del paso 3).
5. **Líneas completas** de la microtarea: la línea cuyo contenido, sin la sangría, es exactamente el texto viejo pasa a ser el nuevo, **conservando su sangría**.
6. **Cabecera**: si dice «use client», línea 1 `"use client";`; luego `// Portado de vendor/dovli/<origen> (MayankJha0333/dovli@eb453e0)`; luego, si da «línea eslint», esa línea.

##### F1 · `src/lib/notas/cliente/ui.ts` [agy]
- [x] hecha (`a06ad4d`)
Origen: `vendor/dovli/apps/web/src/lib/ui.ts` · Destino: `src/lib/notas/cliente/ui.ts`
- «use client»: sí · línea eslint: `/* eslint-disable @typescript-eslint/no-explicit-any -- código portado de dovli, sin cambios de lógica */`
- Sin cortes ni reemplazos (solo imports y cabecera).

##### F2 · `src/lib/notas/cliente/find.ts` [agy]
- [x] hecha (`a06ad4d`)
Origen: `vendor/dovli/apps/web/src/lib/find.ts` · Destino: `src/lib/notas/cliente/find.ts`
- «use client»: sí
- Sin cortes ni reemplazos (solo imports y cabecera).

##### F3 · `src/components/notas/editor/index.ts` [agy]
- [x] hecha (`a06ad4d`)
Origen: `vendor/dovli/packages/editor/src/index.ts` · Destino: `src/components/notas/editor/index.ts`
- Sin «use client» ni línea eslint.
- Sin cortes ni reemplazos (solo imports y cabecera).

##### F4 · `src/components/notas/TopBar.tsx` [agy]
- [x] hecha (`a06ad4d`)
Origen: `vendor/dovli/apps/web/src/components/TopBar.tsx` · Destino: `src/components/notas/TopBar.tsx`
- «use client»: sí
- Reemplazos literales:
  1. Reemplazar (aparece exactamente 1 vez):
```
label="Open sidebar"
```
     por:
```
label="Abrir la barra lateral"
```
  2. Reemplazar (aparece exactamente 1 vez):
```
label="Show sidebar"
```
     por:
```
label="Mostrar la barra lateral"
```
  3. Reemplazar (aparece exactamente 1 vez):
```
label="New page"
```
     por:
```
label="Página nueva"
```
  4. Reemplazar (aparece exactamente 1 vez):
```
aria-label="Breadcrumb"
```
     por:
```
aria-label="Ruta"
```

##### F5 · `src/components/notas/pages/actions.ts` [agy]
- [x] hecha (`a06ad4d`)
Origen: `vendor/dovli/apps/web/src/features/pages/actions.ts` · Destino: `src/components/notas/pages/actions.ts`
- «use client»: sí
- Borrar bloque 1 — estas líneas completas y, a continuación, 1 línea(s) en blanco que lo siguen:
```
export function useFromTemplate() {
  return useCallback((t: Template, parentId: string | null = null) => {
    const built = t.build();
    const page = store.createPage({ parentId, kind: t.kind, mark: t.mark, ...built });
    store.navigate({ name: "page", id: page.id });
    toast(`Created from the ${t.name} template`);
  }, []);
}
```
- Reemplazos literales:
  1. Reemplazar (aparece exactamente 1 vez):
```
import { useCallback } from "react";
```
     por: nada (borrar el texto, incluido su salto de línea final)
  2. Reemplazar (aparece exactamente 1 vez):
```
import { displayTitle, type Page, type Template } from "@/lib/notas/core";
```
     por:
```
import { displayTitle, type Page } from "@/lib/notas/core";
```
  3. Reemplazar (aparece exactamente 1 vez):
```
import { siteOrigin } from "@/lib/desktop";
```
     por: nada (borrar el texto, incluido su salto de línea final)
  4. Reemplazar (aparece exactamente 1 vez):
```
`${siteOrigin()}/app#p-${page.id}`
```
     por:
```
`${location.origin}/dashboard/notas#p-${page.id}`
```
  5. Reemplazar (aparece exactamente 1 vez):
```
`Moved “${displayTitle(page)}” and ${n} page${n > 1 ? "s" : ""} inside to the trash`
```
     por:
```
`Se movió «${displayTitle(page)}» y ${n} ${n > 1 ? "páginas" : "página"} de adentro a la papelera`
```
  6. Reemplazar (aparece exactamente 1 vez):
```
`Moved “${displayTitle(page)}” to the trash`
```
     por:
```
`Se movió «${displayTitle(page)}» a la papelera`
```
  7. Reemplazar (aparece exactamente 1 vez):
```
label: "Undo"
```
     por:
```
label: "Deshacer"
```
  8. Reemplazar (aparece exactamente 1 vez):
```
"Page duplicated"
```
     por:
```
"Página duplicada"
```
  9. Reemplazar (aparece exactamente 1 vez):
```
`Move “${displayTitle(page)}” to…`
```
     por:
```
`Mover «${displayTitle(page)}» a…`
```
  10. Reemplazar (aparece exactamente 1 vez):
```
"Moved to the top level"
```
     por:
```
"Movida al primer nivel"
```
  11. Reemplazar (aparece exactamente 1 vez):
```
`Moved into “${displayTitle(store.get().pages[to])}”`
```
     por:
```
`Movida adentro de «${displayTitle(store.get().pages[to])}»`
```
  12. Reemplazar (aparece exactamente 1 vez):
```
"Link copied. It opens this page for anyone signed in to your account."
```
     por:
```
"Enlace copiado. Abre esta página con tu sesión de Ordo."
```
  13. Reemplazar (aparece exactamente 1 vez):
```
"Couldn't reach the clipboard."
```
     por:
```
"No se pudo usar el portapapeles."
```

##### F6 · `src/components/notas/pages/PagePicker.tsx` [agy]
- [x] hecha (`a06ad4d`)
Origen: `vendor/dovli/apps/web/src/features/pages/PagePicker.tsx` · Destino: `src/components/notas/pages/PagePicker.tsx`
- «use client»: sí
- Reemplazos literales:
  1. Reemplazar (aparece exactamente 1 vez):
```
"Choose a page"
```
     por:
```
"Elegí una página"
```
  2. Reemplazar (aparece exactamente 2 veces; reemplazar todas):
```
"Search pages"
```
     por:
```
"Buscar páginas"
```
  3. Reemplazar (aparece exactamente 1 vez):
```
>Top level (no parent page)<
```
     por:
```
>Primer nivel (sin página madre)<
```
  4. Reemplazar (aparece exactamente 1 vez):
```
>No pages match.<
```
     por:
```
>Ninguna página coincide.<
```

##### F7 · `src/components/notas/home/cards.tsx` [agy]
- [x] hecha (`a06ad4d`)
Origen: `vendor/dovli/apps/web/src/features/home/cards.tsx` · Destino: `src/components/notas/home/cards.tsx`
- «use client»: sí · línea eslint: `/* eslint-disable @typescript-eslint/no-explicit-any -- código portado de dovli, sin cambios de lógica */`
- Cortar desde la línea que empieza con `export function DocCard({` (inclusive) hasta el final.
- Reemplazos literales:
  1. Reemplazar (aparece exactamente 1 vez):
```
import { useMemo, type ReactNode } from "react";
```
     por: nada (borrar el texto, incluido su salto de línea final)
  2. Reemplazar (aparece exactamente 1 vez):
```
import { displayTitle, previewLines, timeAgo, type BoardData, type Page, type Template } from "@/lib/notas/core";
```
     por:
```
import { previewLines, type BoardData } from "@/lib/notas/core";
```
  3. Reemplazar (aparece exactamente 1 vez):
```
import { coverPreset, getStyle, resolveLook, styleVars, type PageStyle } from "@/lib/notas/theme";
```
     por: nada (borrar el texto, incluido su salto de línea final)
  4. Reemplazar (aparece exactamente 1 vez):
```
import { store, useStore } from "@/lib/notas/cliente/store";
```
     por: nada (borrar el texto, incluido su salto de línea final)
  5. Reemplazar (aparece exactamente 1 vez):
```
>Empty board<
```
     por:
```
>Pizarra vacía<
```

##### F8 · `src/components/notas/page/PageIcon.tsx` [agy]
- [x] hecha (`a06ad4d`)
Origen: `vendor/dovli/apps/web/src/features/page/PageIcon.tsx` · Destino: `src/components/notas/page/PageIcon.tsx`
- «use client»: sí
- Sin cortes ni reemplazos (solo imports y cabecera).

##### F9 · `src/components/notas/page/PageInfo.tsx` [agy]
- [x] hecha (`a06ad4d`)
Origen: `vendor/dovli/apps/web/src/features/page/PageInfo.tsx` · Destino: `src/components/notas/page/PageInfo.tsx`
- «use client»: sí
- Reemplazos literales:
  1. Reemplazar (aparece exactamente 1 vez):
```
aria-label="Linked from"
```
     por:
```
aria-label="Enlazada desde"
```
  2. Reemplazar (aparece exactamente 1 vez):
```
>Linked from {list.length} page{list.length > 1 ? "s" : ""}<
```
     por:
```
>Enlazada desde {list.length} {list.length > 1 ? "páginas" : "página"}<
```

##### F10 · `src/components/notas/page/PageHeader.tsx` [agy]
- [x] hecha (`a06ad4d`)
Origen: `vendor/dovli/apps/web/src/features/page/PageHeader.tsx` · Destino: `src/components/notas/page/PageHeader.tsx`
- «use client»: sí · línea eslint: `/* eslint-disable react-hooks/set-state-in-effect, @next/next/no-img-element -- código portado de dovli, sin cambios de lógica */`
- Reemplazos literales:
  1. Reemplazar (aparece exactamente 1 vez):
```
import { resolveFileUrl, saveFile } from "@/lib/notas/cliente/files";
```
     por:
```
import { resolveFileUrl } from "@/lib/notas/cliente/files";
import { getBridge } from "@/components/notas/editor";
```
  2. Reemplazar (aparece exactamente 1 vez):
```
              const url = await saveFile(f);
              set(`file:${url.replace("dovli-file://", "")}`);
            } catch (err) {
              toast(err instanceof Error ? err.message : "Couldn't add that picture.", { tone: "danger" });
            }
```
     por:
```
              const url = await getBridge()?.uploadFile?.(f);
              if (url) set(url);
            } catch {
              /* el puente de subida ya mostró el aviso */
            }
```
  3. Reemplazar (aparece exactamente 1 vez):
```
label="Icon kind"
```
     por:
```
label="Tipo de ícono"
```
  4. Reemplazar (aparece exactamente 2 veces; reemplazar todas):
```
"Marks"
```
     por:
```
"Signos"
```
  5. Reemplazar (aparece exactamente 1 vez):
```
"Paste or type one emoji, like 🪴"
```
     por:
```
"Pegá o escribí un emoji, como 🪴"
```
  6. Reemplazar (aparece exactamente 1 vez):
```
placeholder="Or paste any emoji" aria-label="Any emoji"
```
     por:
```
placeholder="O pegá cualquier emoji" aria-label="Cualquier emoji"
```
  7. Reemplazar (aparece exactamente 1 vez):
```
>Gradients<
```
     por:
```
>Degradados<
```
  8. Reemplazar (aparece exactamente 1 vez):
```
>Your own picture<
```
     por:
```
>Tu propia imagen<
```
  9. Reemplazar (aparece exactamente 1 vez):
```
"Paste a full image address starting with https://"
```
     por:
```
"Pegá la dirección completa de una imagen, que empiece con https://"
```
  10. Reemplazar (aparece exactamente 1 vez):
```
placeholder="Or paste a link" aria-label="Image address"
```
     por:
```
placeholder="O pegá un enlace" aria-label="Dirección de la imagen"
```
  11. Reemplazar (aparece exactamente 1 vez):
```
>Change cover<
```
     por:
```
>Cambiar portada<
```
  12. Reemplazar (aparece exactamente 1 vez):
```
placeholder={page.kind === "board" ? "Untitled board" : "Untitled"}
```
     por:
```
placeholder={page.kind === "board" ? "Pizarra sin título" : "Sin título"}
```
  13. Reemplazar (aparece exactamente 1 vez):
```
aria-label="Page title"
```
     por:
```
aria-label="Título de la página"
```
- Líneas completas (sin sangría → nuevo texto, misma sangría):
  - `Remove icon` → `Quitar ícono`
  - `Use` → `Usar`
  - `Upload` → `Subir`
  - `Remove cover` → `Quitar portada` (2 líneas así; todas)

##### F11 · `src/components/notas/page/PageMenu.tsx` [agy]
- [x] hecha (`a06ad4d`)
Origen: `vendor/dovli/apps/web/src/features/page/PageMenu.tsx` · Destino: `src/components/notas/page/PageMenu.tsx`
- «use client»: sí
- Borrar bloque 1 — estas líneas completas (ninguna línea en blanco extra):
```
        <MenuSub>
          <MenuSubTrigger icon="download">Export</MenuSubTrigger>
          <MenuSubContent>
            <MenuItem onSelect={() => void exportPagePdf(page).catch(failed)}>PDF</MenuItem>
            <MenuItem onSelect={() => void exportPageImage(page).catch(failed)}>Image (.png)</MenuItem>
            {isDoc && (
              <>
                <MenuItem onSelect={() => void exportPageDocx(page).catch(failed)}>Word (.docx)</MenuItem>
                <MenuItem onSelect={() => void exportPageMarkdown(page).catch(failed)}>Markdown (.md)</MenuItem>
                <MenuItem onSelect={() => void exportPageHtml(page).catch(failed)}>Web page (.html)</MenuItem>
              </>
            )}
          </MenuSubContent>
        </MenuSub>
```
- Reemplazos literales:
  1. Reemplazar (aparece exactamente 1 vez):
```
import { MenuContent, MenuItem, MenuRoot, MenuSeparator, MenuSub, MenuSubContent, MenuSubTrigger, MenuTrigger, modKey, toast } from "@/components/notas/ui";
```
     por:
```
import { MenuContent, MenuItem, MenuRoot, MenuSeparator, MenuTrigger, modKey } from "@/components/notas/ui";
```
  2. Reemplazar (aparece exactamente 1 vez):
```
import { exportPagePdf } from "@/lib/pdf";
```
     por: nada (borrar el texto, incluido su salto de línea final)
  3. Reemplazar (aparece exactamente 1 vez):
```
import { exportPageDocx, exportPageHtml, exportPageImage, exportPageMarkdown } from "@/lib/transfer";
```
     por: nada (borrar el texto, incluido su salto de línea final)
  4. Reemplazar (aparece exactamente 1 vez):
```
import { summarizePage } from "@/components/notas/ai/AIPanel";
```
     por: nada (borrar el texto, incluido su salto de línea final)
  5. Reemplazar (aparece exactamente 1 vez):
```
const failed = (e: unknown) => toast(e instanceof Error ? e.message : "Couldn't export the page. Please try again.", { tone: "danger" });
```
     por: nada (borrar el texto, incluido su salto de línea final)
  6. Reemplazar (aparece exactamente 1 vez):
```
        <MenuItem icon="share" onSelect={() => ui.set({ share: page.id })}>
          Share
        </MenuItem>
```
     por: nada (borrar el texto, incluido su salto de línea final)
  7. Reemplazar (aparece exactamente 1 vez):
```
        {isDoc && (
          <MenuItem icon="sparkles" onSelect={() => summarizePage(page)}>
            Summarise with AI
          </MenuItem>
        )}
```
     por: nada (borrar el texto, incluido su salto de línea final)
  8. Reemplazar (aparece exactamente 1 vez):
```
{page.favorite ? "Remove from favourites" : "Add to favourites"}
```
     por:
```
{page.favorite ? "Quitar de favoritas" : "Agregar a favoritas"}
```
- Líneas completas (sin sangría → nuevo texto, misma sangría):
  - `Copy link` → `Copiar enlace`
  - `Find and replace` → `Buscar y reemplazar`
  - `Page style` → `Estilo de página`
  - `Add a page inside` → `Agregar una página adentro`
  - `Duplicate` → `Duplicar`
  - `Move to…` → `Mover a…`
  - `Move to trash` → `Mover a la papelera`

##### F12 · `src/components/notas/page/PageView.tsx` [agy]
- [x] hecha (`a06ad4d`)
Origen: `vendor/dovli/apps/web/src/features/page/PageView.tsx` · Destino: `src/components/notas/page/PageView.tsx`
- «use client»: sí · línea eslint: `/* eslint-disable @typescript-eslint/no-explicit-any -- código portado de dovli, sin cambios de lógica */`
- Borrar bloque 1 — estas líneas completas y, a continuación, 1 línea(s) en blanco que lo siguen:
```
  if (page.kind === "board")
    return (
      <div className="flex h-full flex-col">
        <TopBar crumbs={crumbs} bareActions showCrumbs={trail.length > 0}>
          {actions}
        </TopBar>
        <div className="flex flex-none items-center gap-3 px-4 pb-3 pt-1 [border-bottom:1px_solid_var(--d-line)]">
          <IconPicker
            page={page}
            trigger={
              <button type="button" aria-label="Change page icon" className="flex-none rounded-sm transition-transform hover:brightness-95 active:scale-[0.97]">
                <PageIconGlyph mark={page.mark} size="sm" />
              </button>
            }
          />
          <TitleField page={page} onEnter={() => (document.activeElement as HTMLElement)?.blur()} className="min-w-0 flex-1 text-2xl" />
          <span className="whitespace-nowrap text-sm text-ink-3 max-[640px]:hidden">Edited {timeAgo(page.updatedAt)}</span>
        </div>
        <Suspense fallback={<div className="grid flex-1 place-items-center"><Spinner label="Opening whiteboard" /></div>}>
          <Whiteboard key={page.id} page={page} />
        </Suspense>
      </div>
    );
```
- Borrar bloque 2 — estas líneas completas (ninguna línea en blanco extra):
```
                {tags.slice(0, 4).map((t) => (
                  <button key={t} type="button" onClick={() => store.navigate({ name: "tag", tag: t })} className="ml-1 h-6 rounded-full bg-accent-soft px-2.5 text-xs font-medium text-accent hover:brightness-95">
                    #{t}
                  </button>
                ))}
```
- Reemplazos literales:
  1. Reemplazar (aparece exactamente 1 vez):
```
import { ancestors, childrenOf, displayTitle, outline, pageTags, subpageCardIds, timeAgo, wordCount } from "@/lib/notas/core";
```
     por:
```
import { ancestors, childrenOf, displayTitle, outline, subpageCardIds, timeAgo, wordCount } from "@/lib/notas/core";
```
  2. Reemplazar (aparece exactamente 1 vez):
```
export const Whiteboard = lazy(() => import("@/features/whiteboard/Whiteboard"));
```
     por: nada (borrar el texto, incluido su salto de línea final)
  3. Reemplazar (aparece exactamente 1 vez):
```
  const tags = pageTags(page);
```
     por: nada (borrar el texto, incluido su salto de línea final)
  4. Reemplazar (aparece exactamente 1 vez):
```
import { Button, Icon, Spinner, cn } from "@/components/notas/ui";
```
     por:
```
import { Button, Icon, cn } from "@/components/notas/ui";
```
  5. Reemplazar (aparece exactamente 1 vez):
```
import { settings, useSettings } from "@/lib/notas/cliente/settings";
```
     por:
```
import { useSettings } from "@/lib/notas/cliente/settings";
```
  6. Reemplazar (aparece exactamente 1 vez):
```
`Edited ${timeAgo(page.updatedAt)}`, `${words} ${words === 1 ? "word" : "words"}`, ...(kids.length ? [`${kids.length} ${kids.length === 1 ? "page" : "pages"} inside`] : [])
```
     por:
```
`Editada ${timeAgo(page.updatedAt)}`, `${words} ${words === 1 ? "palabra" : "palabras"}`, ...(kids.length ? [`${kids.length} ${kids.length === 1 ? "página" : "páginas"} adentro`] : [])
```
  7. Reemplazar (aparece exactamente 1 vez):
```
aria-label="Change page icon"
```
     por:
```
aria-label="Cambiar el ícono de la página"
```
  8. Reemplazar (aparece exactamente 1 vez):
```
>Opening page<
```
     por:
```
>Abriendo la página<
```
  9. Reemplazar (aparece exactamente 1 vez):
```
aria-label="Also inside this page"
```
     por:
```
aria-label="También adentro de esta página"
```
  10. Reemplazar (aparece exactamente 1 vez):
```
>Also inside this page<
```
     por:
```
>También adentro de esta página<
```
  11. Reemplazar (aparece exactamente 1 vez):
```
{k.kind === "board" ? "Whiteboard" : `Edited ${timeAgo(k.updatedAt)}`}
```
     por:
```
{k.kind === "board" ? "Pizarra" : `Editada ${timeAgo(k.updatedAt)}`}
```
  12. Reemplazar (aparece exactamente 1 vez):
```
<span>← → move between headings</span>
```
     por:
```
<span>← → para pasar de un encabezado a otro</span>
```
- Líneas completas (sin sangría → nuevo texto, misma sangría):
  - `Add icon` → `Agregar ícono`
  - `Add cover` → `Agregar portada`
  - `Stop presenting (Esc)` → `Terminar la presentación (Esc)`

##### F13 · `src/components/notas/page/panels/kit.tsx` [agy]
- [x] hecha (`a06ad4d`)
Origen: `vendor/dovli/apps/web/src/features/page/panels/kit.tsx` · Destino: `src/components/notas/page/panels/kit.tsx`
- «use client»: sí
- Sin cortes ni reemplazos (solo imports y cabecera).

##### F14 · `src/components/notas/page/panels/FormatPanel.tsx` [agy]
- [x] hecha (`a06ad4d`)
Origen: `vendor/dovli/apps/web/src/features/page/panels/FormatPanel.tsx` · Destino: `src/components/notas/page/panels/FormatPanel.tsx`
- «use client»: sí
- Reemplazos literales:
  1. Reemplazar (aparece exactamente 1 vez):
```
label: "Title"
```
     por:
```
label: "Título"
```
  2. Reemplazar (aparece exactamente 1 vez):
```
label: "Subtitle"
```
     por:
```
label: "Subtítulo"
```
  3. Reemplazar (aparece exactamente 1 vez):
```
label: "Heading"
```
     por:
```
label: "Encabezado"
```
  4. Reemplazar (aparece exactamente 1 vez):
```
label: "Strong"
```
     por:
```
label: "Destacado"
```
  5. Reemplazar (aparece exactamente 1 vez):
```
label: "Body"
```
     por:
```
label: "Cuerpo"
```
  6. Reemplazar (aparece exactamente 1 vez):
```
label: "Caption"
```
     por:
```
label: "Leyenda"
```
  7. Reemplazar (aparece exactamente 1 vez):
```
>Opening the page…<
```
     por:
```
>Abriendo la página…<
```
  8. Reemplazar (aparece exactamente 1 vez):
```
<PanelTitle>Format</PanelTitle>
```
     por:
```
<PanelTitle>Formato</PanelTitle>
```
  9. Reemplazar (aparece exactamente 1 vez):
```
>Put the cursor in some text to format it.<
```
     por:
```
>Poné el cursor en un texto para darle formato.<
```
  10. Reemplazar (aparece exactamente 1 vez):
```
title="Titles"
```
     por:
```
title="Títulos"
```
  11. Reemplazar (aparece exactamente 1 vez):
```
title="Content"
```
     por:
```
title="Contenido"
```
  12. Reemplazar (aparece exactamente 1 vez):
```
title="Groups"
```
     por:
```
title="Grupos"
```
  13. Reemplazar (aparece exactamente 1 vez):
```
title="Text"
```
     por:
```
title="Texto"
```
  14. Reemplazar (aparece exactamente 1 vez):
```
title="Decorations"
```
     por:
```
title="Decoraciones"
```
  15. Reemplazar (aparece exactamente 1 vez):
```
title="Colour"
```
     por:
```
title="Color"
```
  16. Reemplazar (aparece exactamente 1 vez):
```
title="Font"
```
     por:
```
title="Fuente"
```
  17. Reemplazar (aparece exactamente 1 vez):
```
as === "card" ? "Turned into a page card" : "Turned into a page"
```
     por:
```
as === "card" ? "Convertido en tarjeta de página" : "Convertido en página"
```
  18. Reemplazar (aparece exactamente 1 vez):
```
label: "Open"
```
     por:
```
label: "Abrir"
```
  19. Reemplazar (aparece exactamente 1 vez):
```
{as === "page" ? "Page" : "Card"}
```
     por:
```
{as === "page" ? "Página" : "Tarjeta"}
```
  20. Reemplazar (aparece exactamente 1 vez):
```
>Moves the selected blocks into a new page inside this one.<
```
     por:
```
>Mueve los bloques seleccionados a una página nueva dentro de esta.<
```
  21. Reemplazar (aparece exactamente 1 vez):
```
label="Bold"
```
     por:
```
label="Negrita"
```
  22. Reemplazar (aparece exactamente 1 vez):
```
label="Italic"
```
     por:
```
label="Cursiva"
```
  23. Reemplazar (aparece exactamente 1 vez):
```
label="Strikethrough"
```
     por:
```
label="Tachado"
```
  24. Reemplazar (aparece exactamente 1 vez):
```
label="Code"
```
     por:
```
label="Código"
```
  25. Reemplazar (aparece exactamente 1 vez):
```
label="To-do"
```
     por:
```
label="Tarea"
```
  26. Reemplazar (aparece exactamente 1 vez):
```
label="Toggle"
```
     por:
```
label="Desplegable"
```
  27. Reemplazar (aparece exactamente 1 vez):
```
label="Bullet list"
```
     por:
```
label="Lista con viñetas"
```
  28. Reemplazar (aparece exactamente 1 vez):
```
label="Numbered list"
```
     por:
```
label="Lista numerada"
```
  29. Reemplazar (aparece exactamente 1 vez):
```
label="Move left (outdent)"
```
     por:
```
label="Mover a la izquierda (menos sangría)"
```
  30. Reemplazar (aparece exactamente 1 vez):
```
label="Move right (indent)"
```
     por:
```
label="Mover a la derecha (más sangría)"
```
  31. Reemplazar (aparece exactamente 1 vez):
```
"Align left"
```
     por:
```
"Alinear a la izquierda"
```
  32. Reemplazar (aparece exactamente 1 vez):
```
"Centre"
```
     por:
```
"Centrar"
```
  33. Reemplazar (aparece exactamente 1 vez):
```
"Align right"
```
     por:
```
"Alinear a la derecha"
```
  34. Reemplazar (aparece exactamente 1 vez):
```
"Justify"
```
     por:
```
"Justificar"
```
  35. Reemplazar (aparece exactamente 1 vez):
```
aria-label="Text colour"
```
     por:
```
aria-label="Color del texto"
```
- Líneas completas (sin sangría → nuevo texto, misma sangría):
  - `Focus` → `Foco`
  - `Box` → `Recuadro`

##### F15 · `src/components/notas/page/panels/StylePanel.tsx` [agy]
- [x] hecha (`a06ad4d`)
Origen: `vendor/dovli/apps/web/src/features/page/panels/StylePanel.tsx` · Destino: `src/components/notas/page/panels/StylePanel.tsx`
- «use client»: sí · línea eslint: `/* eslint-disable @next/next/no-img-element -- código portado de dovli, sin cambios de lógica */`
- Reemplazos literales:
  1. Reemplazar (aparece exactamente 1 vez):
```
<PanelTitle>Style</PanelTitle>
```
     por:
```
<PanelTitle>Estilo</PanelTitle>
```
  2. Reemplazar (aparece exactamente 1 vez):
```
`Page style: ${lookName(r)}. See all styles`
```
     por:
```
`Estilo de página: ${lookName(r)}. Ver todos los estilos`
```
  3. Reemplazar (aparece exactamente 1 vez):
```
title="Colour"
```
     por:
```
title="Color"
```
  4. Reemplazar (aparece exactamente 1 vez):
```
label="Backdrop"
```
     por:
```
label="Fondo"
```
  5. Reemplazar (aparece exactamente 1 vez):
```
label="Paper"
```
     por:
```
label="Papel"
```
  6. Reemplazar (aparece exactamente 1 vez):
```
label="Text"
```
     por:
```
label="Texto"
```
  7. Reemplazar (aparece exactamente 1 vez):
```
label="Accent"
```
     por:
```
label="Acento"
```
  8. Reemplazar (aparece exactamente 1 vez):
```
title="Cover"
```
     por:
```
title="Portada"
```
  9. Reemplazar (aparece exactamente 1 vez):
```
>Cover picture<
```
     por:
```
>Imagen de portada<
```
  10. Reemplazar (aparece exactamente 1 vez):
```
page.cover ? "Change cover" : "Add a cover"
```
     por:
```
page.cover ? "Cambiar portada" : "Agregar portada"
```
  11. Reemplazar (aparece exactamente 1 vez):
```
title="Dividers"
```
     por:
```
title="Separadores"
```
  12. Reemplazar (aparece exactamente 1 vez):
```
title="Font"
```
     por:
```
title="Fuente"
```
  13. Reemplazar (aparece exactamente 1 vez):
```
title="Advanced"
```
     por:
```
title="Avanzado"
```
  14. Reemplazar (aparece exactamente 1 vez):
```
label="Wide page"
```
     por:
```
label="Página ancha"
```
- Líneas completas (sin sangría → nuevo texto, misma sangría):
  - `All styles` → `Todos los estilos`
  - `Plain` → `Simple`
  - `Reset` → `Restablecer`
  - `Remove` → `Quitar`
  - `Wide page` → `Página ancha`

##### F16 · `src/components/notas/page/panels/InfoPanel.tsx` [agy]
- [x] hecha (`a06ad4d`)
Origen: `vendor/dovli/apps/web/src/features/page/panels/InfoPanel.tsx` · Destino: `src/components/notas/page/panels/InfoPanel.tsx`
- «use client»: sí · línea eslint: `/* eslint-disable @typescript-eslint/no-explicit-any -- código portado de dovli, sin cambios de lógica */`
- Borrar bloque 1 — estas líneas completas y, a continuación, 1 línea(s) en blanco que lo siguen:
```
const REVIEWS: { id: ReviewFocus; label: string }[] = [
  { id: "full", label: "Full review, with fixes" },
  { id: "grammar", label: "Check spelling and grammar" },
  { id: "structure", label: "Get feedback on structure" },
  { id: "tone", label: "Check tone of voice" },
  { id: "clarity", label: "Make sure it's clear" },
];
```
- Borrar bloque 2 — estas líneas completas (ninguna línea en blanco extra):
```
            <Prop icon="user" label="Author">
              {account?.name || account?.email || "You, on this device"}
            </Prop>
```
- Borrar bloque 3 — estas líneas completas y, a continuación, 1 línea(s) en blanco que lo siguen:
```
          {tags.length > 0 && (
            <Section title="Tags" collapsible>
              <div className="flex flex-wrap gap-1.5">
                {tags.map((t) => (
                  <button key={t} type="button" onClick={go(() => store.navigate({ name: "tag", tag: t }))} className="h-7 rounded-full bg-accent-soft px-3 text-sm font-medium text-accent hover:brightness-95">
                    #{t}
                  </button>
                ))}
              </div>
            </Section>
          )}
```
- Borrar bloque 4 — estas líneas completas (ninguna línea en blanco extra):
```
          {isDoc && (
            <Section title="Document review" collapsible>
              <ul className="m-0 flex list-none flex-col p-0">
                <li className="border-b border-line">
                  <button type="button" onClick={go(() => summarizePage(page))} className="flex h-10 w-full items-center gap-2.5 rounded-sm px-1 text-left text-base text-ink hover:bg-hover">
                    <Icon name="summary" size={15} className="text-accent" />
                    <span className="flex-1">Summarise with AI</span>
                    <Icon name="chevron" size={12} className="text-ink-4" />
                  </button>
                </li>
                {REVIEWS.map((r) => (
                  <li key={r.id} className="border-b border-line last:border-b-0">
                    <button type="button" onClick={go(() => reviewPage(page, r.id))} className="flex h-10 w-full items-center gap-2.5 rounded-sm px-1 text-left text-base text-ink hover:bg-hover">
                      <Icon name="sparkles" size={15} className="text-accent" />
                      <span className="flex-1">{r.label}</span>
                      <Icon name="chevron" size={12} className="text-ink-4" />
                    </button>
                  </li>
                ))}
              </ul>
              <p className="m-0 mt-1.5 text-xs text-ink-3">Opens in the assistant: what to fix first, with fixes you can pick and apply. Nothing changes until you do.</p>
            </Section>
          )}
```
- Borrar bloque 5 — estas líneas completas (ninguna línea en blanco extra):
```
          {isDoc && (
            <div className="rounded-md bg-well px-3 py-2">
              <div className="mb-1.5 flex items-center gap-3 text-base text-ink">
                <Icon name="download" size={16} className="text-ink-3" />
                Export
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {(
                  [
                    ["PDF", () => void exportPagePdf(page).catch((e) => toast(e.message, { tone: "danger" }))],
                    ["Word", () => void exportPageDocx(page).catch((e) => toast(e.message, { tone: "danger" }))],
                    ["Markdown", () => void exportPageMarkdown(page)],
                    ["Image", () => void exportPageImage(page).catch((e) => toast(e.message, { tone: "danger" }))],
                    ["Web page", () => void exportPageHtml(page)],
                  ] as const
                ).map(([label, fn]) => (
                  <button key={label} type="button" onClick={go(fn)} className="h-8 rounded-sm bg-panel text-sm text-ink shadow-sm hover:bg-hover">
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
```
- Borrar bloque 6 — estas líneas completas (ninguna línea en blanco extra):
```
          <ActionRow icon="history" onClick={go(() => ui.set({ settings: "sync" }))}>
            View backups
          </ActionRow>
```
- Reemplazos literales:
  1. Reemplazar (aparece exactamente 1 vez):
```
import { ancestors, backlinksOf, childrenOf, displayTitle, outline, pageTags, pageText, timeAgo, wordCount, type Page } from "@/lib/notas/core";
```
     por:
```
import { ancestors, backlinksOf, childrenOf, displayTitle, outline, pageText, timeAgo, wordCount, type Page } from "@/lib/notas/core";
```
  2. Reemplazar (aparece exactamente 1 vez):
```
import { useAuth } from "@/lib/auth";
```
     por: nada (borrar el texto, incluido su salto de línea final)
  3. Reemplazar (aparece exactamente 1 vez):
```
import { ui } from "@/lib/notas/cliente/ui";
```
     por: nada (borrar el texto, incluido su salto de línea final)
  4. Reemplazar (aparece exactamente 1 vez):
```
import { toast } from "@/components/notas/ui";
```
     por: nada (borrar el texto, incluido su salto de línea final)
  5. Reemplazar (aparece exactamente 1 vez):
```
import { exportPagePdf } from "@/lib/pdf";
```
     por: nada (borrar el texto, incluido su salto de línea final)
  6. Reemplazar (aparece exactamente 1 vez):
```
import { exportPageDocx, exportPageHtml, exportPageImage, exportPageMarkdown } from "@/lib/transfer";
```
     por: nada (borrar el texto, incluido su salto de línea final)
  7. Reemplazar (aparece exactamente 1 vez):
```
import { reviewPage, summarizePage, type ReviewFocus } from "@/components/notas/ai/AIPanel";
```
     por: nada (borrar el texto, incluido su salto de línea final)
  8. Reemplazar (aparece exactamente 1 vez):
```
  const account = useAuth((s) => s.account);
```
     por: nada (borrar el texto, incluido su salto de línea final)
  9. Reemplazar (aparece exactamente 1 vez):
```
  const tags = useMemo(() => pageTags(page), [page]);
```
     por: nada (borrar el texto, incluido su salto de línea final)
  10. Reemplazar (aparece exactamente 1 vez):
```
<PanelTitle>Info</PanelTitle>
```
     por:
```
<PanelTitle>Información</PanelTitle>
```
  11. Reemplazar (aparece exactamente 1 vez):
```
label="Info panel tab"
```
     por:
```
label="Pestaña del panel"
```
  12. Reemplazar (aparece exactamente 1 vez):
```
label: "Page info"
```
     por:
```
label: "Datos de la página"
```
  13. Reemplazar (aparece exactamente 1 vez):
```
label: "Actions"
```
     por:
```
label: "Acciones"
```
  14. Reemplazar (aparece exactamente 1 vez):
```
title="Properties"
```
     por:
```
title="Propiedades"
```
  15. Reemplazar (aparece exactamente 1 vez):
```
label="Created"
```
     por:
```
label="Creada"
```
  16. Reemplazar (aparece exactamente 1 vez):
```
label="Edited"
```
     por:
```
label="Editada"
```
  17. Reemplazar (aparece exactamente 1 vez):
```
title="Location"
```
     por:
```
title="Ubicación"
```
  18. Reemplazar (aparece exactamente 1 vez):
```
title="Stats"
```
     por:
```
title="Estadísticas"
```
  19. Reemplazar (aparece exactamente 1 vez):
```
["Words", stats.words]
```
     por:
```
["Palabras", stats.words]
```
  20. Reemplazar (aparece exactamente 1 vez):
```
["Characters", stats.chars]
```
     por:
```
["Caracteres", stats.chars]
```
  21. Reemplazar (aparece exactamente 1 vez):
```
["Blocks", stats.blocks]
```
     por:
```
["Bloques", stats.blocks]
```
  22. Reemplazar (aparece exactamente 1 vez):
```
["Reading time", `${stats.minutes} min`]
```
     por:
```
["Tiempo de lectura", `${stats.minutes} min`]
```
  23. Reemplazar (aparece exactamente 1 vez):
```
{kids === 1 ? "1 page inside" : `${kids} pages inside`}
```
     por:
```
{kids === 1 ? "1 página adentro" : `${kids} páginas adentro`}
```
  24. Reemplazar (aparece exactamente 1 vez):
```
title="On this page"
```
     por:
```
title="En esta página"
```
  25. Reemplazar (aparece exactamente 1 vez):
```
title="Linked from"
```
     por:
```
title="Enlazada desde"
```
  26. Reemplazar (aparece exactamente 1 vez):
```
hint="Esc to stop"
```
     por:
```
hint="Esc para terminar"
```
  27. Reemplazar (aparece exactamente 1 vez):
```
{page.favorite ? "Remove from favourites" : "Add to favourites"}
```
     por:
```
{page.favorite ? "Quitar de favoritas" : "Agregar a favoritas"}
```
- Líneas completas (sin sangría → nuevo texto, misma sangría):
  - `Home` → `Notas`
  - `Present` → `Presentar`
  - `Find and replace` → `Buscar y reemplazar`
  - `Move to…` → `Mover a…`
  - `Duplicate` → `Duplicar`
  - `Copy link` → `Copiar enlace`
  - `Move to trash` → `Mover a la papelera`

##### F17 · `src/components/notas/page/panels/PageToolbar.tsx` [agy]
- [x] hecha (`a06ad4d`)
Origen: `vendor/dovli/apps/web/src/features/page/panels/PageToolbar.tsx` · Destino: `src/components/notas/page/panels/PageToolbar.tsx`
- «use client»: sí · línea eslint: `/* eslint-disable react-hooks/refs -- código portado de dovli, sin cambios de lógica */`
- Borrar bloque 1 — estas líneas completas y, a continuación, 1 línea(s) en blanco que lo siguen:
```
/** Whether a page is shared (people or a link), remembered per page for this visit. */
const shareState = new Map<string, { people: number; link: "viewer" | "editor" | null }>();

/** Who can see this page, in a sentence, for the Share button's tooltip. */
function useShareState(page: Page) {
  const signedIn = useAuth((s) => s.status === "signed-in");
  const shareOpen = useUI((s) => s.share);
  const [state, setState] = useState(() => shareState.get(page.id) ?? null);
  const wasOpen = useRef<string | null>(null);
  useEffect(() => {
    let live = true;
    setState(shareState.get(page.id) ?? null);
    const justClosed = wasOpen.current === page.id && shareOpen === null;
    wasOpen.current = shareOpen;
    // Check once per page per visit, and again right after its Share window closes.
    if (!sharingOn || !signedIn || page.kind !== "doc" || shareOpen) return;
    if (shareState.has(page.id) && !justClosed) return;
    share.settings(page.id).then(
      (s) => {
        const v = {
          people: s.people.filter((p) => p.role !== "owner").length,
          link: s.link?.enabled ? s.link.role : null,
        };
        shareState.set(page.id, v);
        if (live) setState(v);
      },
      () => {},
    );
    return () => {
      live = false;
    };
  }, [page.id, page.kind, signedIn, shareOpen]);
  const shared = !!state && (state.people > 0 || !!state.link);
  const who = state?.people ? `${state.people} ${state.people === 1 ? "person has" : "people have"} access` : "";
  const viaLink = state?.link ? (state.link === "editor" ? "anyone with the link can edit" : "anyone with the link can view") : "";
  const tip = shared
    ? `${[who, viaLink]
        .filter(Boolean)
        .join(", and ")
        .replace(/^./, (c) => c.toUpperCase())}. Click to change.`
    : "Only you can access this page. Click to share it or export it.";
  return { shared, tip };
}
```
- Borrar bloque 2 — estas líneas completas (ninguna línea en blanco extra):
```
      <Tooltip label={tip}>
        <button
          type="button"
          onClick={() => ui.set({ share: page.id })}
          className="flex h-9 items-center gap-1.5 px-3.5 text-[13px] font-semibold text-ink chrome-pill transition-[filter] hover:brightness-[0.97] max-[640px]:px-2.5"
        >
          <Icon name={shared ? "link" : "lock"} size={15} />
          <span className="max-[480px]:sr-only">{shared ? "Shared" : "Share"}</span>
        </button>
      </Tooltip>
```
- Reemplazos literales:
  1. Reemplazar (aparece exactamente 1 vez):
```
import { useAuth } from "@/lib/auth";
```
     por: nada (borrar el texto, incluido su salto de línea final)
  2. Reemplazar (aparece exactamente 1 vez):
```
import { share, sharingOn } from "@/lib/share";
```
     por: nada (borrar el texto, incluido su salto de línea final)
  3. Reemplazar (aparece exactamente 1 vez):
```
import { ui, useUI } from "@/lib/notas/cliente/ui";
```
     por: nada (borrar el texto, incluido su salto de línea final)
  4. Reemplazar (aparece exactamente 1 vez):
```
  const { shared, tip } = useShareState(page);
```
     por: nada (borrar el texto, incluido su salto de línea final)
  5. Reemplazar (aparece exactamente 1 vez):
```
    format: "Format",
    style: "Style",
    info: "Info",
```
     por:
```
    format: "Formato",
    style: "Estilo",
    info: "Información",
```
  6. Reemplazar (aparece exactamente 1 vez):
```
label="Format"
```
     por:
```
label="Formato"
```
  7. Reemplazar (aparece exactamente 1 vez):
```
label="Style"
```
     por:
```
label="Estilo"
```
  8. Reemplazar (aparece exactamente 1 vez):
```
label="Info"
```
     por:
```
label="Información"
```

##### F18 · `src/components/notas/sidebar/follow.ts` [agy]
- [x] hecha (`a06ad4d`)
Origen: `vendor/dovli/apps/web/src/features/sidebar/follow.ts` · Destino: `src/components/notas/sidebar/follow.ts`
- Sin «use client» ni línea eslint.
- Sin cortes ni reemplazos (solo imports y cabecera).

##### F19 · `src/components/notas/sidebar/FindTab.tsx` [agy]
- [x] hecha (`a06ad4d`)
Origen: `vendor/dovli/apps/web/src/features/sidebar/FindTab.tsx` · Destino: `src/components/notas/sidebar/FindTab.tsx`
- «use client»: sí · línea eslint: `/* eslint-disable @typescript-eslint/no-explicit-any -- código portado de dovli, sin cambios de lógica */`
- Reemplazos literales:
  1. Reemplazar (aparece exactamente 1 vez):
```
  page: "this page",
  tree: "this page and pages inside",
```
     por:
```
  page: "esta página",
  tree: "esta página y las de adentro",
```
  2. Reemplazar (aparece exactamente 1 vez):
```
s.regex ? "Pattern" : "Text"
```
     por:
```
s.regex ? "Patrón" : "Texto"
```
  3. Reemplazar (aparece exactamente 1 vez):
```
`Search options: ${what} in ${SCOPE_LABEL[s.scope]}`
```
     por:
```
`Opciones de búsqueda: ${what} en ${SCOPE_LABEL[s.scope]}`
```
  4. Reemplazar (aparece exactamente 1 vez):
```
<MenuLabel>Search in</MenuLabel>
```
     por:
```
<MenuLabel>Buscar en</MenuLabel>
```
  5. Reemplazar (aparece exactamente 1 vez):
```
`Replaced ${n} ${n === 1 ? "match" : "matches"}${pagesChanged ? ` (${pagesChanged} other ${pagesChanged === 1 ? "page" : "pages"})` : ""}`
```
     por:
```
`Se reemplazaron ${n} ${n === 1 ? "coincidencia" : "coincidencias"}${pagesChanged ? ` (${pagesChanged === 1 ? "1 otra página" : `${pagesChanged} otras páginas`})` : ""}`
```
  6. Reemplazar (aparece exactamente 1 vez):
```
`${at + 1} / ${flat.length} ${flat.length === 1 ? "result" : "results"}` : "No results"
```
     por:
```
`${at + 1} / ${flat.length} ${flat.length === 1 ? "resultado" : "resultados"}` : "Sin resultados"
```
  7. Reemplazar (aparece exactamente 1 vez):
```
aria-label="Find in page"
```
     por:
```
aria-label="Buscar en la página"
```
  8. Reemplazar (aparece exactamente 1 vez):
```
placeholder="Find"
```
     por:
```
placeholder="Buscar"
```
  9. Reemplazar (aparece exactamente 1 vez):
```
aria-label="Find"
```
     por:
```
aria-label="Buscar"
```
  10. Reemplazar (aparece exactamente 1 vez):
```
aria-label="Clear search"
```
     por:
```
aria-label="Borrar la búsqueda"
```
  11. Reemplazar (aparece exactamente 1 vez):
```
placeholder="Replace with"
```
     por:
```
placeholder="Reemplazar por"
```
  12. Reemplazar (aparece exactamente 1 vez):
```
aria-label="Replace with"
```
     por:
```
aria-label="Reemplazar por"
```
  13. Reemplazar (aparece exactamente 1 vez):
```
label="Previous match"
```
     por:
```
label="Anterior"
```
  14. Reemplazar (aparece exactamente 1 vez):
```
label="Next match"
```
     por:
```
label="Siguiente"
```
  15. Reemplazar (aparece exactamente 1 vez):
```
label="Close find"
```
     por:
```
label="Cerrar la búsqueda"
```
  16. Reemplazar (aparece exactamente 1 vez):
```
aria-label="Results"
```
     por:
```
aria-label="Resultados"
```
- Líneas completas (sin sangría → nuevo texto, misma sangría):
  - `{what} in {SCOPE_LABEL[s.scope]}` → `{what} en {SCOPE_LABEL[s.scope]}`
  - `This page` → `Esta página`
  - `This page and pages inside` → `Esta página y las de adentro`
  - `Match case` → `Distinguir mayúsculas`
  - `Whole words only` → `Solo palabras completas`
  - `Ignore accents (é = e)` → `Ignorar tildes (é = e)`
  - `Regular expression` → `Expresión regular`
  - `Replace` → `Reemplazar` (2 líneas así; todas)
  - `Replace all` → `Reemplazar todo`
  - `Type to find words in {s.scope === "tree" ? "this page and the pages inside it" : "this page"}. Enter goes to the next one.` → `Escribí para buscar palabras en {s.scope === "tree" ? "esta página y las de adentro" : "esta página"}. Enter va a la siguiente.`

##### F20 · `src/components/notas/sidebar/PageSide.tsx` [agy]
- [x] hecha (`a06ad4d`)
Origen: `vendor/dovli/apps/web/src/features/sidebar/PageSide.tsx` · Destino: `src/components/notas/sidebar/PageSide.tsx`
- «use client»: sí · línea eslint: `/* eslint-disable @typescript-eslint/no-explicit-any, @next/next/no-img-element -- código portado de dovli, sin cambios de lógica */`
- Reemplazos literales:
  1. Reemplazar (aparece exactamente 1 vez):
```
label: "Contents"
```
     por:
```
label: "Contenido"
```
  2. Reemplazar (aparece exactamente 1 vez):
```
label: "To-dos"
```
     por:
```
label: "Tareas"
```
  3. Reemplazar (aparece exactamente 1 vez):
```
label: "Attachments"
```
     por:
```
label: "Adjuntos"
```
  4. Reemplazar (aparece exactamente 1 vez):
```
label: "Links"
```
     por:
```
label: "Enlaces"
```
  5. Reemplazar (aparece exactamente 1 vez):
```
label: "Find"
```
     por:
```
label: "Buscar"
```
  6. Reemplazar (aparece exactamente 1 vez):
```
>Whiteboards have no headings.<
```
     por:
```
>Las pizarras no tienen encabezados.<
```
  7. Reemplazar (aparece exactamente 1 vez):
```
>Add a heading and it shows up here, so you can jump to it.<
```
     por:
```
>Agregá un encabezado y aparece acá, para saltar a él.<
```
  8. Reemplazar (aparece exactamente 1 vez):
```
aria-label="Headings"
```
     por:
```
aria-label="Encabezados"
```
  9. Reemplazar (aparece exactamente 1 vez):
```
>No to-dos on this page. Type [] at the start of a line to add one.<
```
     por:
```
>No hay tareas en esta página. Escribí [] al principio de una línea para agregar una.<
```
  10. Reemplazar (aparece exactamente 1 vez):
```
aria-label={t.text || "To-do"}
```
     por:
```
aria-label={t.text || "Tarea"}
```
  11. Reemplazar (aparece exactamente 1 vez):
```
{t.text || "Empty to-do"}
```
     por:
```
{t.text || "Tarea vacía"}
```
  12. Reemplazar (aparece exactamente 1 vez):
```
>Pictures, videos, PDFs and files you add to this page are listed here.<
```
     por:
```
>Acá aparecen las imágenes, videos, PDF y archivos que agregues a esta página.<
```
  13. Reemplazar (aparece exactamente 1 vez):
```
>Nothing links here yet. Type [[ in any page to link to another one.<
```
     por:
```
>Todavía nada enlaza acá. Escribí [[ en cualquier página para enlazar otra.<
```
  14. Reemplazar (aparece exactamente 1 vez):
```
`Linked from ${from.length}`
```
     por:
```
`Enlazada desde ${from.length}`
```
  15. Reemplazar (aparece exactamente 1 vez):
```
title="Links to"
```
     por:
```
title="Enlaza a"
```
  16. Reemplazar (aparece exactamente 1 vez):
```
title="Pages inside"
```
     por:
```
title="Páginas adentro"
```
  17. Reemplazar (aparece exactamente 1 vez):
```
title="On the web"
```
     por:
```
title="En la web"
```
  18. Reemplazar (aparece exactamente 1 vez):
```
>Edited {timeAgo(page.updatedAt)}<
```
     por:
```
>Editada {timeAgo(page.updatedAt)}<
```
  19. Reemplazar (aparece exactamente 1 vez):
```
aria-label="About this page"
```
     por:
```
aria-label="Sobre esta página"
```
  20. Reemplazar (aparece exactamente 1 vez):
```
`Find (${modKey()}F)`
```
     por:
```
`Buscar (${modKey()}F)`
```
- Líneas completas (sin sangría → nuevo texto, misma sangría):
  - `{done} of {items.length} done` → `{done} de {items.length} hechas`

##### F21 · `src/components/notas/sidebar/Sidebar.tsx` [agy]
- [x] hecha (`a06ad4d`)
Origen: `vendor/dovli/apps/web/src/features/sidebar/Sidebar.tsx` · Destino: `src/components/notas/sidebar/Sidebar.tsx`
- «use client»: sí · línea eslint: `/* eslint-disable react-hooks/set-state-in-effect -- código portado de dovli, sin cambios de lógica */`
- Borrar bloque 1 — estas líneas completas (ninguna línea en blanco extra):
```
  const shared = useSharedWithMe();
  const signedIn = useAuth((a) => a.status === "signed-in");
  // Pages others shared with you: fetched when signed in, and again when Dovli comes back into view.
  useEffect(() => {
    if (!signedIn) return;
    void refreshShared();
    const onShow = () => document.visibilityState === "visible" && void refreshShared();
    document.addEventListener("visibilitychange", onShow);
    window.addEventListener("focus", onShow);
    return () => {
      document.removeEventListener("visibilitychange", onShow);
      window.removeEventListener("focus", onShow);
    };
  }, [signedIn]);
```
- Borrar bloque 2 — estas líneas completas (ninguna línea en blanco extra):
```
        <NavRow icon="templates" label="Templates" active={route.name === "templates"} onClick={() => store.navigate({ name: "templates" })} />
```
- Borrar bloque 3 — estas líneas completas y, a continuación, 1 línea(s) en blanco que lo siguen:
```
        {shared.length > 0 && (
          <section aria-label="Shared with me" className="mt-4">
            <Fold title="Shared with me" open={open.shared} count={shared.length} onToggle={() => toggle("shared")} />
            {open.shared && (
              <ul className="m-0 flex list-none flex-col gap-px p-0">
                {shared.map((x) => (
                  <li key={`${x.workspaceId}/${x.pageId}`}>
                    <a href={`/p/${encodeURIComponent(x.workspaceId)}/${encodeURIComponent(x.pageId)}`} className={cn(rowBase, "no-underline")} title={`Shared by ${x.sharedByName} · ${x.role === "editor" ? "you can edit" : "view only"}`}>
                      <span className="w-[18px] flex-none text-center font-serif text-ink-3">{x.mark || "¶"}</span>
                      <span className="flex-1 truncate">{x.title}</span>
                      {x.role === "viewer" && <Icon name="eye" size={13} className="flex-none text-ink-4" aria-label="View only" />}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
```
- Borrar bloque 4 — estas líneas completas y, a continuación, 1 línea(s) en blanco que lo siguen:
```
        <section aria-label="Tags" className="mt-4">
          <Fold title="Tags" open={open.tags} count={tags.length} onToggle={() => toggle("tags")} />
          {open.tags &&
            (tags.length ? (
              <ul className="m-0 flex list-none flex-col gap-px p-0">
                {tags.map((t) => (
                  <li key={t.tag}>
                    <button
                      type="button"
                      className={cn(rowBase, route.name === "tag" && route.tag === t.tag && rowActive)}
                      onClick={() => store.navigate({ name: "tag", tag: t.tag })}
                    >
                      <Icon name="hash" size={14} className="text-ink-3" />
                      <span className="flex-1 truncate">{t.tag}</span>
                      <span className="text-xs tabular-nums text-ink-4">{t.pages.length}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <Hint>Type # and a word in any page to tag it.</Hint>
            ))}
        </section>
```
- Reemplazos literales:
  1. Reemplazar (aparece exactamente 1 vez):
```
import { childrenOf, displayTitle, favoritePages, tagIndex, type Page } from "@/lib/notas/core";
```
     por:
```
import { childrenOf, displayTitle, favoritePages, type Page } from "@/lib/notas/core";
```
  2. Reemplazar (aparece exactamente 1 vez):
```
import { Icon, IconButton, Kbd, SectionLabel, cn, modKey, type IconName, DovliMark } from "@/components/notas/ui";
```
     por:
```
import { Icon, IconButton, Kbd, SectionLabel, cn, modKey, type IconName } from "@/components/notas/ui";
```
  3. Reemplazar (aparece exactamente 1 vez):
```
import { useAuth } from "@/lib/auth";
```
     por: nada (borrar el texto, incluido su salto de línea final)
  4. Reemplazar (aparece exactamente 1 vez):
```
import { refreshShared, useSharedWithMe } from "@/lib/share";
```
     por: nada (borrar el texto, incluido su salto de línea final)
  5. Reemplazar (aparece exactamente 1 vez):
```
  const tags = useMemo(() => tagIndex(pages).slice(0, 12), [pages]);
```
     por: nada (borrar el texto, incluido su salto de línea final)
  6. Reemplazar (aparece exactamente 1 vez):
```
          <DovliMark size={26} />
```
     por:
```
          <Icon name="page" size={22} className="text-accent" />
```
  7. Reemplazar (aparece exactamente 1 vez):
```
        <IconButton icon="settings" label="Settings" shortcut={`${modKey()},`} size="sm" className="justify-self-end" onClick={() => ui.set({ settings: "appearance" })} />
```
     por:
```
        <span aria-hidden="true" />
```
  8. Reemplazar (aparece exactamente 1 vez):
```
        <NavRow icon="home" label="All pages" active={route.name === "home"} onClick={() => store.navigate({ name: "home" })} />
```
     por: nada (borrar el texto, incluido su salto de línea final)
  9. Reemplazar (aparece exactamente 1 vez):
```
aria-label={open ? "Collapse" : "Expand"}
```
     por:
```
aria-label={open ? "Contraer" : "Expandir"}
```
  10. Reemplazar (aparece exactamente 1 vez):
```
label="Page actions"
```
     por:
```
label="Acciones de la página"
```
  11. Reemplazar (aparece exactamente 1 vez):
```
`Add a page inside ${displayTitle(page)}`
```
     por:
```
`Agregar una página dentro de ${displayTitle(page)}`
```
  12. Reemplazar (aparece exactamente 1 vez):
```
aria-label="Main"
```
     por:
```
aria-label="Principal"
```
  13. Reemplazar (aparece exactamente 2 veces; reemplazar todas):
```
label="New page"
```
     por:
```
label="Página nueva"
```
  14. Reemplazar (aparece exactamente 1 vez):
```
<span className="flex-1 text-left">Search</span>
```
     por:
```
<span className="flex-1 text-left">Buscar</span>
```
  15. Reemplazar (aparece exactamente 1 vez):
```
aria-label="Favourites"
```
     por:
```
aria-label="Favoritas"
```
  16. Reemplazar (aparece exactamente 1 vez):
```
title="Favourites"
```
     por:
```
title="Favoritas"
```
  17. Reemplazar (aparece exactamente 1 vez):
```
<Hint>Add pages to favourites to keep them close.</Hint>
```
     por:
```
<Hint>Agregá páginas a favoritas para tenerlas a mano.</Hint>
```
  18. Reemplazar (aparece exactamente 2 veces; reemplazar todas):
```
aria-label="Pages"
```
     por:
```
aria-label="Páginas"
```
  19. Reemplazar (aparece exactamente 1 vez):
```
title="Pages"
```
     por:
```
title="Páginas"
```
  20. Reemplazar (aparece exactamente 1 vez):
```
<Hint>No pages yet.</Hint>
```
     por:
```
<Hint>Todavía no hay páginas.</Hint>
```
  21. Reemplazar (aparece exactamente 1 vez):
```
label="Trash"
```
     por:
```
label="Papelera"
```
  22. Reemplazar (aparece exactamente 1 vez):
```
aria-label="Sidebar"
```
     por:
```
aria-label="Barra lateral"
```
  23. Reemplazar (aparece exactamente 1 vez):
```
>Dovli<
```
     por:
```
>Notas<
```
  24. Reemplazar (aparece exactamente 1 vez):
```
>, go to all pages<
```
     por:
```
>, ir al inicio de las notas<
```
  25. Reemplazar (aparece exactamente 1 vez):
```
label="Hide sidebar"
```
     por:
```
label="Ocultar la barra lateral"
```
  26. Reemplazar (aparece exactamente 1 vez):
```
label="Close sidebar"
```
     por:
```
label="Cerrar la barra lateral"
```
  27. Reemplazar (aparece exactamente 1 vez):
```
aria-label="Sidebar view"
```
     por:
```
aria-label="Vista de la barra lateral"
```
  28. Reemplazar (aparece exactamente 1 vez):
```
["space", "Show all pages"]
```
     por:
```
["space", "Mostrar todas las páginas"]
```
  29. Reemplazar (aparece exactamente 1 vez):
```
page ? `Show the contents of ${displayTitle(page)}` : "Open a page to see its contents"
```
     por:
```
page ? `Mostrar el contenido de ${displayTitle(page)}` : "Abrí una página para ver su contenido"
```
  30. Reemplazar (aparece exactamente 1 vez):
```
max-[860px]:z-50
```
     por:
```
max-[860px]:z-[60]
```

##### F22 · `src/components/notas/trash/TrashView.tsx` [agy]
- [x] hecha (`a06ad4d`)
Origen: `vendor/dovli/apps/web/src/features/trash/TrashView.tsx` · Destino: `src/components/notas/trash/TrashView.tsx`
- «use client»: sí
- Reemplazos literales:
  1. Reemplazar (aparece exactamente 1 vez):
```
import { wide } from "@/components/notas/home/Home";
```
     por:
```
const wide = "mx-auto flex max-w-[1180px] flex-col gap-10 px-8 pb-24 pt-10 max-[640px]:gap-8 max-[640px]:px-4 max-[640px]:pb-20 max-[640px]:pt-6";
```
  2. Reemplazar (aparece exactamente 1 vez):
```
`${inside} page${inside > 1 ? "s" : ""} inside · `
```
     por:
```
`${inside} ${inside > 1 ? "páginas" : "página"} adentro · `
```
  3. Reemplazar (aparece exactamente 1 vez):
```
days === 0 ? "Deleted for good today" : `Deleted for good in ${days} day${days > 1 ? "s" : ""}`
```
     por:
```
days === 0 ? "Se borra para siempre hoy" : `Se borra para siempre en ${days} ${days > 1 ? "días" : "día"}`
```
  4. Reemplazar (aparece exactamente 1 vez):
```
`Restored “${displayTitle(page)}”`
```
     por:
```
`Se restauró «${displayTitle(page)}»`
```
  5. Reemplazar (aparece exactamente 1 vez):
```
label: "Open"
```
     por:
```
label: "Abrir"
```
  6. Reemplazar (aparece exactamente 1 vez):
```
>Trash<
```
     por:
```
>Papelera<
```
  7. Reemplazar (aparece exactamente 1 vez):
```
>Deleted pages wait here for {TRASH_DAYS} days, then go for good. Restore one to put it back where it was.<
```
     por:
```
>Las páginas borradas esperan acá {TRASH_DAYS} días y después se borran para siempre. Restaurá una para devolverla a su lugar.<
```
  8. Reemplazar (aparece exactamente 1 vez):
```
>Delete everything here for good?<
```
     por:
```
>¿Borrar para siempre todo lo que hay acá?<
```
  9. Reemplazar (aparece exactamente 1 vez):
```
"Trash emptied"
```
     por:
```
"Papelera vaciada"
```
  10. Reemplazar (aparece exactamente 1 vez):
```
title="The trash is empty"
```
     por:
```
title="La papelera está vacía"
```
- Líneas completas (sin sangría → nuevo texto, misma sangría):
  - `Restore` → `Restaurar`
  - `Delete forever` → `Borrar para siempre`
  - `Trash` → `Papelera`
  - `Cancel` → `Cancelar`
  - `Empty trash` → `Vaciar la papelera` (2 líneas así; todas)
  - `Pages you delete show up here, so you can change your mind.` → `Las páginas que borrás aparecen acá, por si cambiás de idea.`

##### F23 · `src/components/notas/page-styles/StyleGallery.tsx` [agy]
- [x] hecha (`a06ad4d`)
Origen: `vendor/dovli/apps/web/src/features/page-styles/StyleGallery.tsx` · Destino: `src/components/notas/page-styles/StyleGallery.tsx`
- «use client»: sí · línea eslint: `/* eslint-disable @typescript-eslint/no-explicit-any -- código portado de dovli, sin cambios de lógica */`
- Reemplazos literales:
  1. Reemplazar (aparece exactamente 1 vez):
```
const name = s ? s.name : "Plain";
```
     por:
```
const name = s ? s.name : "Simple";
```
  2. Reemplazar (aparece exactamente 1 vez):
```
"plain original default white"
```
     por:
```
"simple original predeterminado blanco plain"
```
  3. Reemplazar (aparece exactamente 1 vez):
```
title="Page style" description="Changes only this page. Your app theme stays the same."
```
     por:
```
title="Estilo de página" description="Cambia solo esta página. El tema de Ordo sigue igual."
```
  4. Reemplazar (aparece exactamente 1 vez):
```
placeholder="Search styles, like blue or flowers" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search styles"
```
     por:
```
placeholder="Buscá estilos, como noche o jardín" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar estilos"
```
  5. Reemplazar (aparece exactamente 1 vez):
```
>No styles match “{q}”.<
```
     por:
```
>Ningún estilo coincide con «{q}».<
```

##### F24 · `src/components/notas/palette/CommandPalette.tsx` [agy]
- [x] hecha (`a06ad4d`)
Origen: `vendor/dovli/apps/web/src/features/palette/CommandPalette.tsx` · Destino: `src/components/notas/palette/CommandPalette.tsx`
- «use client»: sí
- Borrar bloque 1 — estas líneas completas (ninguna línea en blanco extra):
```
    { id: "board", icon: "board", title: "New whiteboard", keywords: "create canvas draw board", run: () => newPage("board") },
    { id: "home", icon: "home", title: "Go to Home", keywords: "home start", run: () => store.navigate({ name: "home" }) },
```
- Borrar bloque 2 — estas líneas completas (ninguna línea en blanco extra):
```
    { id: "templates", icon: "templates", title: "Browse templates", keywords: "templates", run: () => store.navigate({ name: "templates" }) },
    { id: "link", icon: "link", title: "Notes from a link", keywords: "web website url article clip save read summarise summarize notes link", run: () => ui.set({ linkNotes: { parentId: null } }) },
```
- Borrar bloque 3 — estas líneas completas (ninguna línea en blanco extra):
```
    { id: "settings", icon: "settings", title: "Settings", keywords: "settings preferences options", shortcut: `${mod},`, run: () => ui.set({ settings: "appearance" }) },
    { id: "account", icon: "user", title: "Account and sign in", keywords: "account sign in login sync google apple email", run: () => ui.set({ settings: "account" }) },
    { id: "import", icon: "importIcon", title: "Import from Notion, Evernote, Confluence…", keywords: "import notion evernote enex confluence craft onenote word docx markdown html zip upload", run: () => ui.set({ settings: "data" }) },
    { id: "export", icon: "download", title: "Export everything", keywords: "export download backup zip markdown html", run: () => void exportWorkspace() },
    { id: "shortcuts", icon: "keyboard", title: "Keyboard shortcuts", keywords: "keys shortcuts help", run: () => ui.set({ settings: "shortcuts" }) },
```
- Borrar bloque 4 — estas líneas completas (ninguna línea en blanco extra):
```
                  {isLikelyUrl(q) && (
                    <Row value="create-link-notes" icon="link" title="Make notes from this link" hint={q.trim()} onSelect={run(() => ui.set({ linkNotes: { parentId: null, url: normalizeUrl(q) } }))} />
                  )}
```
- Borrar bloque 5 — estas líneas completas y, a continuación, 1 línea(s) en blanco que lo siguen:
```
              {APP_THEMES.filter((t) => matches(`theme ${t.name} dark light appearance`)).length > 0 && term && (
                <Command.Group heading="Theme" className={group}>
                  {APP_THEMES.filter((t) => matches(`theme ${t.name} dark light appearance`)).map((t) => (
                    <Row key={t.id} value={`theme-${t.id}`} icon={t.scheme === "dark" ? "moon" : "sun"} title={`Theme: ${t.name}`} hint={t.description} onSelect={run(() => settings.set({ theme: t.id }))} />
                  ))}
                  {matches("theme match device system auto") && <Row value="theme-system" icon="monitor" title="Theme: Match device" onSelect={run(() => settings.set({ theme: "system" }))} />}
                </Command.Group>
              )}
```
- Borrar bloque 6 — estas líneas completas y, a continuación, 1 línea(s) en blanco que lo siguen:
```
              {term && templates.filter((t) => matches(`template ${t.name} ${t.description}`)).length > 0 && (
                <Command.Group heading="Templates" className={group}>
                  {templates
                    .filter((t) => matches(`template ${t.name} ${t.description}`))
                    .slice(0, 5)
                    .map((t) => (
                      <Row key={t.id} value={`tpl-${t.id}`} mark={t.mark} title={t.name} hint={t.description} onSelect={run(() => use(t))} />
                    ))}
                </Command.Group>
              )}
```
- Borrar bloque 7 — estas líneas completas (ninguna línea en blanco extra):
```
              {term && tags.filter((t) => matches(`#${t.tag} tag`)).length > 0 && (
                <Command.Group heading="Tags" className={group}>
                  {tags
                    .filter((t) => matches(`#${t.tag} tag`))
                    .slice(0, 6)
                    .map((t) => (
                      <Row key={t.tag} value={`tag-${t.tag}`} icon="hash" title={t.tag} hint={`${t.pages.length} page${t.pages.length > 1 ? "s" : ""}`} onSelect={run(() => store.navigate({ name: "tag", tag: t.tag }))} />
                    ))}
                </Command.Group>
              )}
```
- Reemplazos literales:
  1. Reemplazar (aparece exactamente 1 vez):
```
import { ancestors, displayTitle, isLikelyUrl, normalizeUrl, recentPages, searchPages, tagIndex, templates } from "@/lib/notas/core";
```
     por:
```
import { ancestors, displayTitle, recentPages, searchPages } from "@/lib/notas/core";
```
  2. Reemplazar (aparece exactamente 1 vez):
```
import { APP_THEMES } from "@/lib/notas/theme";
```
     por: nada (borrar el texto, incluido su salto de línea final)
  3. Reemplazar (aparece exactamente 1 vez):
```
import { settings } from "@/lib/notas/cliente/settings";
```
     por: nada (borrar el texto, incluido su salto de línea final)
  4. Reemplazar (aparece exactamente 1 vez):
```
import { exportWorkspace } from "@/lib/transfer";
```
     por: nada (borrar el texto, incluido su salto de línea final)
  5. Reemplazar (aparece exactamente 1 vez):
```
import { newPage, useFromTemplate } from "@/components/notas/pages/actions";
```
     por:
```
import { newPage } from "@/components/notas/pages/actions";
```
  6. Reemplazar (aparece exactamente 1 vez):
```
  const use = useFromTemplate();
```
     por: nada (borrar el texto, incluido su salto de línea final)
  7. Reemplazar (aparece exactamente 1 vez):
```
  const tags = useMemo(() => tagIndex(pages).slice(0, 30), [pages]);
```
     por: nada (borrar el texto, incluido su salto de línea final)
  8. Reemplazar (aparece exactamente 1 vez):
```
      { id: "share", icon: "share", title: "Share this page", keywords: "share link publish", run: () => ui.set({ share: p.id }) },
```
     por: nada (borrar el texto, incluido su salto de línea final)
  9. Reemplazar (aparece exactamente 1 vez):
```
title: "New page", keywords: "create add page document"
```
     por:
```
title: "Página nueva", keywords: "crear agregar página nueva documento"
```
  10. Reemplazar (aparece exactamente 1 vez):
```
title: "Open trash", keywords: "trash deleted restore bin"
```
     por:
```
title: "Abrir la papelera", keywords: "papelera borradas restaurar"
```
  11. Reemplazar (aparece exactamente 1 vez):
```
title: p.favorite ? "Remove page from favourites" : "Add page to favourites", keywords: "favourite star pin"
```
     por:
```
title: p.favorite ? "Quitar la página de favoritas" : "Agregar la página a favoritas", keywords: "favorita estrella fijar"
```
  12. Reemplazar (aparece exactamente 1 vez):
```
title: "Change page style", keywords: "style look backdrop theme page"
```
     por:
```
title: "Cambiar el estilo de la página", keywords: "estilo aspecto fondo tema página"
```
  13. Reemplazar (aparece exactamente 2 veces; reemplazar todas):
```
"Search and commands"
```
     por:
```
"Búsqueda y comandos"
```
  14. Reemplazar (aparece exactamente 1 vez):
```
>Search and commands<
```
     por:
```
>Búsqueda y comandos<
```
  15. Reemplazar (aparece exactamente 1 vez):
```
>Type to search pages and commands. Use the arrow keys and Enter.<
```
     por:
```
>Escribí para buscar páginas y comandos. Usá las flechas y Enter.<
```
  16. Reemplazar (aparece exactamente 1 vez):
```
placeholder="Search pages, or type a command"
```
     por:
```
placeholder="Buscá páginas o escribí un comando"
```
  17. Reemplazar (aparece exactamente 1 vez):
```
>Nothing here yet. Start typing to search.<
```
     por:
```
>Todavía no hay nada. Empezá a escribir para buscar.<
```
  18. Reemplazar (aparece exactamente 1 vez):
```
heading="Recent"
```
     por:
```
heading="Recientes"
```
  19. Reemplazar (aparece exactamente 1 vez):
```
heading="Pages"
```
     por:
```
heading="Páginas"
```
  20. Reemplazar (aparece exactamente 1 vez):
```
heading="Create"
```
     por:
```
heading="Crear"
```
  21. Reemplazar (aparece exactamente 1 vez):
```
heading="Commands"
```
     por:
```
heading="Comandos"
```
  22. Reemplazar (aparece exactamente 1 vez):
```
title={`New page “${q.trim()}”`}
```
     por:
```
title={`Página nueva «${q.trim()}»`}
```
  23. Reemplazar (aparece exactamente 1 vez):
```
>Search looks inside every page<
```
     por:
```
>La búsqueda mira dentro de todas las páginas<
```
- Líneas completas (sin sangría → nuevo texto, misma sangría):
  - `<Kbd>↓</Kbd> to move` → `<Kbd>↓</Kbd> para moverte`
  - `<Kbd>↵</Kbd> to open` → `<Kbd>↵</Kbd> para abrir`

##### F25 · `src/components/notas/sidebar/SyncNotice.tsx` [agy]
- [x] hecha (`a06ad4d`)
Origen: `vendor/dovli/apps/web/src/features/sidebar/SyncNotice.tsx` · Destino: `src/components/notas/sidebar/SyncNotice.tsx`
- «use client»: sí
- Reemplazos literales:
  1. Reemplazar (aparece exactamente 1 vez):
```
import { useAuth } from "@/lib/auth";
```
     por: nada (borrar el texto, incluido su salto de línea final)
  2. Reemplazar (aparece exactamente 1 vez):
```
import { desktop } from "@/lib/desktop";
```
     por: nada (borrar el texto, incluido su salto de línea final)
  3. Reemplazar (aparece exactamente 1 vez):
```
import { ui } from "@/lib/notas/cliente/ui";
```
     por: nada (borrar el texto, incluido su salto de línea final)
  4. Reemplazar (aparece exactamente 1 vez):
```
  const account = useAuth((a) => a.account);
```
     por: nada (borrar el texto, incluido su salto de línea final)
  5. Reemplazar (aparece exactamente 1 vez):
```
  // The desktop app shows all of this in its title bar, always in view.
  if (desktop) note = null;
  else if (save === "error")
```
     por:
```
  if (save === "error")
```
  6. Reemplazar (aparece exactamente 1 vez):
```
        <button
          type="button"
          onClick={() => ui.set({ settings: account ? "sync" : "data" })}
```
     por:
```
        <p
```
  7. Reemplazar (aparece exactamente 1 vez):
```
        </button>
```
     por:
```
        </p>
```
  8. Reemplazar (aparece exactamente 1 vez):
```
"Couldn't save. Storage is full or blocked"
```
     por:
```
"No se pudo guardar. El almacenamiento está lleno o bloqueado"
```
  9. Reemplazar (aparece exactamente 1 vez):
```
"Sync paused. Retrying"
```
     por:
```
"Sincronización en pausa. Reintentando"
```
  10. Reemplazar (aparece exactamente 1 vez):
```
`Offline. ${sync.pending} change${sync.pending > 1 ? "s" : ""} will sync later`
```
     por:
```
`Sin conexión. ${sync.pending > 1 ? `${sync.pending} cambios se van` : "1 cambio se va"} a sincronizar después`
```

##### W1 · Crear `src/components/notas/NotasWorkspace.tsx` (contenedor de Ordo, D9.1) [agy]
- [x] hecha (`a06ad4d`)
Crear `src/components/notas/NotasWorkspace.tsx` (si ya existe: BLOQUEADO) con este contenido exacto:
```tsx
"use client";
// Contenedor de las notas dentro de Ordo (lane 271, D9). Hace lo que hacía el Workspace de dovli
// (vendor/dovli/apps/web/src/features/workspace/Workspace.tsx): arranca el almacenamiento y el sync,
// sigue el #hash de la dirección y muestra la barra lateral y la página. Sin IA, compartir, cuenta,
// ajustes, plantillas, etiquetas ni pizarras (fuera de la v1).
import "@/lib/notas/cliente/editorBridge";
import { useEffect } from "react";
import { Button, EmptyState, Spinner, Toaster, TooltipProvider, cn, modKey } from "@/components/notas/ui";
import { setAccountStorage } from "@/lib/notas/cliente/db";
import { settings, useSettings } from "@/lib/notas/cliente/settings";
import { initStore, routeFromHash, store, useStore } from "@/lib/notas/cliente/store";
import { startSync } from "@/lib/notas/cliente/sync";
import { ui, useUI } from "@/lib/notas/cliente/ui";
import { TopBar } from "@/components/notas/TopBar";
import { PageView } from "@/components/notas/page/PageView";
import { newPage } from "@/components/notas/pages/actions";
import { PagePicker } from "@/components/notas/pages/PagePicker";
import { StyleGallery } from "@/components/notas/page-styles/StyleGallery";
import { CommandPalette } from "@/components/notas/palette/CommandPalette";
import { Sidebar } from "@/components/notas/sidebar/Sidebar";
import { startSidebarFollow } from "@/components/notas/sidebar/follow";
import { TrashView } from "@/components/notas/trash/TrashView";

/** Lo que se ve sin una página abierta. */
function Inicio() {
  const hayPaginas = useStore((s) => Object.values(s.pages).some((p) => !p.deletedAt));
  return (
    <div className="flex h-full flex-col">
      <TopBar />
      <div className="grid min-h-0 flex-1 place-items-center overflow-y-auto p-6">
        <EmptyState
          icon="page"
          title={hayPaginas ? "Elegí una página" : "Todavía no tenés notas"}
          action={
            <Button icon="pagePlus" onClick={() => newPage()}>
              Página nueva
            </Button>
          }
        >
          {hayPaginas ? `Abrila desde la barra lateral o buscala con ${modKey()}K.` : "Creá tu primera página para empezar a escribir."}
        </EmptyState>
      </div>
    </div>
  );
}

export default function NotasWorkspace({ usuarioId }: { usuarioId: string }) {
  const ready = useStore((s) => s.ready);
  const route = useStore((s) => s.route);
  const nav = useUI((s) => s.nav);
  const sidebarHidden = useSettings((s) => s.sidebarHidden);

  // Cada usuario tiene su propia base local; se elige antes de abrirla.
  useEffect(() => {
    setAccountStorage(usuarioId);
    void initStore().then(() => startSync(usuarioId));
  }, [usuarioId]);

  // Atrás / adelante y los enlaces #p-<id> dentro de las páginas.
  useEffect(() => {
    const onHash = () => store.navigate(routeFromHash(store.get().pages), { replace: true });
    window.addEventListener("popstate", onHash);
    window.addEventListener("hashchange", onHash);
    return () => {
      window.removeEventListener("popstate", onHash);
      window.removeEventListener("hashchange", onHash);
    };
  }, []);

  // Al cambiar de página se cierra el cajón del celular.
  useEffect(() => ui.set({ nav: false }), [route]);

  useEffect(() => {
    if (ready) startSidebarFollow();
  }, [ready]);

  // Atajos: Ctrl/⌘ K busca, Ctrl/⌘ \ muestra u oculta la barra lateral, Ctrl/⌘ Alt N crea una página.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      const k = e.key.toLowerCase();
      if (k === "k" && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        ui.set({ palette: !ui.get().palette });
      } else if (e.key === "\\" && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        if (window.matchMedia("(max-width: 860px)").matches) ui.set({ nav: !ui.get().nav });
        else settings.set({ sidebarHidden: !settings.get().sidebarHidden });
      } else if ((k === "n" || e.code === "KeyN") && e.altKey) {
        e.preventDefault();
        newPage();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!ready)
    return (
      <div className="notas-dovli grid h-[calc(100dvh-6rem)] place-items-center bg-bg">
        <Spinner label="Abriendo tus notas" />
      </div>
    );

  return (
    <div className="notas-dovli h-[calc(100dvh-6rem)] bg-bg">
      <TooltipProvider>
        <div
          className={cn(
            "grid h-full gap-[var(--d-shell-gap)] p-[var(--d-shell-gap)] max-[860px]:grid-cols-1 max-[860px]:gap-0 max-[860px]:p-0",
            sidebarHidden ? "grid-cols-[minmax(0,1fr)]" : "grid-cols-[272px_minmax(0,1fr)]",
          )}
        >
          <div className={cn("contents", sidebarHidden && "min-[861px]:hidden")}>
            <Sidebar />
          </div>
          <div
            aria-hidden="true"
            onClick={() => ui.set({ nav: false })}
            className={cn("fixed inset-0 z-[55] bg-overlay transition-opacity min-[861px]:hidden", nav ? "opacity-100" : "pointer-events-none opacity-0")}
          />
          <div
            id="main"
            tabIndex={-1}
            className="relative min-h-0 min-w-0 overflow-hidden rounded-shell shadow-shell surface-panel focus:outline-none max-[860px]:rounded-none"
          >
            {route.name === "page" ? <PageView key={route.id} id={route.id} /> : route.name === "trash" ? <TrashView /> : <Inicio />}
          </div>
        </div>
        <CommandPalette />
        <PagePicker />
        <StyleGallery />
        <Toaster />
      </TooltipProvider>
    </div>
  );
}
```

##### W2 · Crear `src/app/dashboard/notas/page.tsx` (= M-P1 de la fase 3) [agy]
- [x] hecha (`a06ad4d`)
Crear `src/app/dashboard/notas/page.tsx` (si ya existe: BLOQUEADO) con este contenido exacto:
```tsx
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { NotasCliente } from "./NotasCliente";

export const dynamic = "force-dynamic";

// Bloc de notas personal (lane 271): cada usuario ve solo sus páginas.
export default async function NotasPage() {
  const session = await getSession();
  if (!session?.user) redirect("/");
  return <NotasCliente usuarioId={String(session.user.id)} />;
}
```

##### W3 · Crear `src/app/dashboard/notas/NotasCliente.tsx` (carga sin SSR) [agy]
- [x] hecha (`a06ad4d`)
Crear `src/app/dashboard/notas/NotasCliente.tsx` (si ya existe: BLOQUEADO) con este contenido exacto:
```tsx
"use client";
// IndexedDB y el editor (BlockNote) existen solo en el navegador: las notas se cargan sin SSR.
import dynamic from "next/dynamic";

const NotasWorkspace = dynamic(() => import("@/components/notas/NotasWorkspace"), { ssr: false });

export function NotasCliente({ usuarioId }: { usuarioId: string }) {
  return <NotasWorkspace usuarioId={usuarioId} />;
}
```

Verificación de 2f (la corre agy y pega la salida): `grep -rn "@dovli/\|@/features/\|@/lib/store\|@/lib/ui\"" src/components/notas src/lib/notas src/app/dashboard/notas | grep -v "^[^:]*:[0-9]*: *//\|/\*\| \*"` → sin salida.
Control del orquestador: `diff -r` de cada destino contra `scratchpad/esperado271/2f/` → sin diferencias; después tsc, eslint, npm test, `npm run build` y `verif-db/i271notas.mjs`.

#### Fase 2g — arreglos hallados en M-P3 (D9.8, D9.9) (ensayada: tsc 0 · eslint 0 · M-P3 4/4 · humo 12/12, 0 errores)

##### G1 · Enlace `#p-<id>` en un dispositivo nuevo (`NotasWorkspace.tsx`, D9.8) [agy]
- [x] hecha (`ae49195`)
Archivo existente `src/components/notas/NotasWorkspace.tsx`; solo estos 2 reemplazos, nada más:
  1. Reemplazar (aparece exactamente 1 vez):
```
  const route = useStore((s) => s.route);
```
     por:
```
  const route = useStore((s) => s.route);
  const cantidad = useStore((s) => Object.keys(s.pages).length);
```
  2. Reemplazar (aparece exactamente 1 vez):
```
  // Al cambiar de página se cierra el cajón del celular.
```
     por (la línea en blanco entre el bloque nuevo y el comentario es parte del texto):
```
  // Enlace #p-<id> abierto en un dispositivo que todavía no tenía la página: se abre cuando llega con el sync.
  useEffect(() => {
    if (!ready || route.name !== "home" || !location.hash.startsWith("#p-")) return;
    const r = routeFromHash(store.get().pages);
    if (r.name === "page") store.navigate(r, { replace: true });
  }, [ready, route, cantidad]);

  // Al cambiar de página se cierra el cajón del celular.
```

##### G2 · Aviso «demasiado grande» en el lateral (`SyncNotice.tsx`, D9.9) [agy]
- [x] hecha (`ae49195`)
Archivo existente `src/components/notas/sidebar/SyncNotice.tsx`; solo estos 2 reemplazos, nada más:
  1. Reemplazar (aparece exactamente 1 vez; es una sola línea):
```
  else if (sync.state === "error") note = { icon: "alert", text: "Sincronización en pausa. Reintentando", tone: "danger" };
```
     por (dos líneas):
```
  else if (sync.state === "error")
    note = { icon: "alert", text: sync.error?.includes("demasiado grande") ? sync.error : "Sincronización en pausa. Reintentando", tone: "danger" };
```
  2. Reemplazar (aparece exactamente 1 vez; son 2 líneas):
```
        <p
          className={cn(
```
     por (3 líneas):
```
        <p
          title={note.text}
          className={cn(
```

Verificación de 2g (la corre agy y pega la salida): `git diff --stat` → exactamente `src/components/notas/NotasWorkspace.tsx | 8 ++++++++` y `src/components/notas/sidebar/SyncNotice.tsx | 4 +++-`.

### Fase 3 — pantalla y enlace
- [x] **Hecha como W2 de la fase 2f (`a06ad4d`).** M-P1 [agy] `src/app/dashboard/notas/page.tsx`: sesión obligatoria; carga `Workspace` con `next/dynamic` y `ssr: false` (IndexedDB y BlockNote son solo del navegador). Código exacto lo deja el orquestador tras la fase 2 (depende del nombre final del componente).
- M-P2 [agy] Enlace «Notas» en `AppSidebar.tsx` (ícono `NotebookPen`), mismo formato que el de LANE_274 M10, **al final de la ola 3**.
- [x] **Hecha 2026-11-07** con `verif-db/i271mp3.mjs` (4/4: otro dispositivo recibe la página; dos dispositivos sin red escriben cada uno lo suyo y al reconectar los dos tienen ambos textos; página > 900 KB avisa en el lateral) + `verif-db/i271notas.mjs` (12/12, incluye «otro usuario no ve nada»). Destapó D9.8 y D9.9 (fase 2g). M-P3 [orquestador] Prueba: crear páginas anidadas, escribir, cerrar y abrir en otro navegador con el mismo usuario (aparece), editar la misma página en dos pestañas sin red y reconectar (mezcla sin perder texto), otro usuario no ve nada, página > 900 KB avisa «demasiado grande».

## Criterios de aceptación
- Notas personales con editor de bloques, árbol, papelera y búsqueda, en español.
- Se sincronizan entre dispositivos del mismo usuario; ningún otro usuario las ve (API filtrada por sesión).
- El código migrado tiene su cabecera de origen y `THIRD_PARTY_NOTICES.md` lo lista.

## Gates
`npx prisma validate` · `npx tsc --noEmit` · `npm test` · `npx eslint src/lib/notas src/components/notas src/app/api/notas` · `npm run build` (por las dependencias nuevas).

## Pendientes
- M-P2 (enlace «Notas») → movido a LANE_278 (ola 3).
- LANE_277 (archivos grandes) para PDFs y adjuntos > 4 MB dentro de las notas.
- Fuera de la v1: pizarras, IA, compartir en familia, exportar.

## Hallazgos
- 2026-11-07 · Fase 2b–2d: agy declaró «Desvíos: ninguno», pero `diff -r` contra el ensayo mostró 2: cambió el alto del SVG `speckles` en `theme/pageStyles.ts` (100 → 85, cambio de lógica) y copió en `cliente/sync.ts` el comentario de la línea 2 de `http.ts`. Restaurados desde el ensayo antes del commit. El reporte de agy no alcanza como control: el `diff -r` contra el ensayo es obligatorio.
- SQL de M2 (sin base, contra el esquema de dev), solo aditivo: `Notas_Espacios`, `Notas_Paginas`, índice `(Usuario_ID, Rev)`, 2 FKs. Aplicado **solo en la base local**; producción espera OK de Gabriel.
- 2026-11-07 · Humo de la fase 2e (página temporal `/dashboard/notas-humo`, base local, puerto 3171): menú «/» en español con los grupos Encabezados · Bloques básicos · Avanzado · Medios · Subencabezados · Otros · Páginas; el texto sobrevive a la recarga (IndexedDB), llega a otro navegador del mismo usuario por el sync y otro usuario no lo ve; 0 errores de consola. La captura «translúcida» del menú era la animación de entrada (opacidad 0,75 → 1 en ~200 ms). Escribir durante el primer pull no pierde texto (3 rondas). Lección para el arnés de la Fase 3: la página que se abre se elige **después** del primer sync (si no, un navegador nuevo crea una página propia y tapa la sincronizada). Arnés guardado en `scratchpad/humo271/` y `verif-db/i271humo.mjs`.

- 2026-11-07 · Fase 2f por agy en 2 corridas **en serie** (la memoria del equipo no alcanzó para 2 en paralelo + servidor + base: Claude Code cortó los procesos). Prompts de ~43 KB superaron el límite de 32 KB de la línea de comandos de Windows → se pasaron por archivo (ver PROTOCOLO_AGY). Corrida 1: 3 desvíos de forma, corregidos desde el ensayo: no reemplazó el import dentro de un comentario de `editor/index.ts` (la receta dice «todas sus apariciones»), y borró una línea en blanco final en `PageInfo.tsx` y otra tras un bloque borrado en `InfoPanel.tsx`. Corrida 2: 0 desvíos, pero agy dice haber comparado contra `scratchpad/esperado271/2f`, carpeta que no se le dio: **lección: el resultado esperado se guarda fuera del alcance de agy** (no en el scratchpad que se le agrega con `--add-dir`).
- 2026-11-07 · `npm run build` deja 3 avisos de Turbopack: «'highlight' is not recognized as a valid pseudo-element» en `editor/editor.css` (`::highlight(dovli-find)`, Custom Highlight API, CSS válido). Verificado en `.next/static`: las reglas llegan intactas al CSS de producción; el aviso es del parser, no rompe nada.
- 2026-11-07 · Limitación conocida: las etiquetas de búsqueda de `StyleGallery` siguen en inglés (vienen de `theme/pageStyles.ts`), así que la búsqueda de estilos encuentra por nombre en español pero no por etiqueta. No bloquea la v1.

- 2026-11-07 · M-P3: en el camino «sin red» aparece en la consola de desarrollo «Cannot update a component (NotasWorkspace) while rendering a different component (Router)», junto con el «Failed to fetch RSC payload… Falling back to browser navigation» de Next al cortar la red. Aparece también sin el código de D9.8 (variante `i271mp3e.mjs`, abriendo desde el árbol) y no en el humo con red (12/12, 0 errores). Solo desarrollo, sin efecto en el resultado (la mezcla y el aviso pasan). Pendiente de bajo riesgo: revisar si los listeners `popstate`/`hashchange` de `NotasWorkspace` reciben un evento que Next dispara dentro del render de su Router.
- Producción (2026-11-07, orquestador): esquema aplicado con el SQL aditivo de `prisma migrate diff --from-config-datasource` desde `dev` completo (todas las lanes juntas): 15 tablas, 4 enums, valor `virtud`, 2 columnas nullable en `Checklist_Items`; **0 DROP**, sin cambios de datos. `migrate diff` posterior vacío. Amparo: regla 7 de AGENTS.md + «hace lo que haya que hacer» de Gabriel.

## Bitácora
- 2026-11-07 · claude (orquestador) · RESERVA · creada desde Plane #30
- 2026-11-07 · claude (orquestador) · INICIO · Fase 1 (M1, M3–M6) delegada a agy; M0 (vendor + dependencias) y M2 (base) quedan al orquestador
- 2026-11-07 · claude (orquestador) · avance · Fase 1 (M1, M3–M6) por agy, cada línea = spec; gates: tsc 0 · eslint 0 · npm test 577/0/51; commit 77adda7. Falta M0 (vendor + dependencias), Fase 2 (port del cliente), Fase 3 y M2 en producción
- 2026-11-07 · claude (orquestador) · avance · M0: vendor/dovli (8 carpetas, 220 archivos, sin node_modules) + ORIGEN.md + THIRD_PARTY_NOTICES (dovli MIT; BlockNote MPL-2.0, Mantine MIT, idb ISC, nanoid MIT); deps exactas del lockfile de dovli: @blocknote/{core,react,mantine} 0.56.0, @mantine/{core,hooks} 9.7.3, idb 8.0.4, nanoid 6.0.2 (peers React ^19 OK; yjs opcional); vendor ya excluido de tsconfig/eslint/tests; tsc 0, npm run build OK; commit 447e685. Siguiente: Fase 2 (port del cliente)
- 2026-11-07 · claude (orquestador) · avance · Fase 2 en preparación. ENSAYO del port de `core/*` SIN COMMITEAR en el worktree (`src/lib/notas/core/*`, `src/lib/notas/prueba/vitest.ts`), hecho con `scratchpad/ensayo-core.py`: 53/53 tests ok con el shim vitest→node:test. Decisión técnica D7: segunda línea `/* eslint-disable <reglas exactas> -- código portado de dovli, sin cambios de lógica */` (no-explicit-any; core.test también no-empty-object-type y no-unused-expressions; markdown.test también no-unused-vars). Quitar: import `seedPages` y `pageWithBlockIds` + `it("gives every sample page…")` en core.test; `describe("the sample pages")` en markdown.test; `templates`/`seed` en index.ts. El shim `expect` acepta un 2.º argumento (mensaje). Pendiente: confirmar tsc 0, borrar el ensayo, escribir P1…Pn con esto y despachar a agy.
- 2026-11-07 · claude (orquestador) · avance · Fase 2a (core, P0–P12) por agy: idéntica al ensayo (`diff -r` vacío); gates tsc 0 · eslint 0 · npm test 630/0/51; commit `beec616`. Fase 2b–2d (sync, theme, cliente) escrita desde ensayos verificados (tsc 0 · eslint 0 · 7/7 tests del motor con el mensaje en español) y delegada a agy. Adaptaciones fijadas: `http.ts` con cookie y `/api/notas/sync/*`; `cliente/sync.ts` con `startSync(userId)` y sin Firebase/Supabase/compartir; `store.ts` sin páginas de ejemplo (cuenta nueva = vacía)
- 2026-11-07 · claude (orquestador) · avance · Fase 2b–2d (sync, theme, cliente) por agy; 2 desvíos no reportados corregidos (ver Hallazgos); gates tsc 0 · eslint 0 · npm test 637/0/51; commit `c4a9fbb`. Siguiente: P13 (textos «Untitled» del core), `ui/`, `dovli.css` y `editor/`
- 2026-11-07 · claude (orquestador) · avance · Fase 2e ENSAYADA (ui, puente de tokens `dovli.css` + import en `globals.css`, editor sin pizarra/flowchart/embeds/PDF/IA, `editorBridge` con `/api/upload`, P13 «Sin título»): tsc 0 · eslint 0 · 53/53 core · humo OK (ver Hallazgos). Ensayo guardado en `scratchpad/esperado271/{ui,editor,notas,cliente,core-p13,app}` y retirado del worktree (limpio en `c4a9fbb`). Microtareas P13, U1, K1, K2, E1–E19, B1 generadas con `gen-micro271c.py` y despachadas a agy en 2 corridas paralelas con archivos disjuntos
- 2026-11-07 · claude (orquestador) · avance · Fase 2e por agy (2 corridas paralelas): `diff -r` contra el ensayo **vacío** en los 6 destinos y en `editor/` (sin desvíos esta vez); gates tsc 0 · eslint 0 · npm test 637/0/51; commits `46244de` (2e) y `340a9b9` (M0b: `components/TopBar.tsx` al vendor, faltaba en M0). Siguiente: fase 2f (pantallas, D9), ensayada en copia aparte `scratchpad/ens2f` (tsc solo espera `cmdk`, eslint 0)
- 2026-11-07 · claude (orquestador) · avance · Fase 2f por agy (2 corridas en serie): tras corregir 3 desvíos de forma, `diff` contra el ensayo vacío en los 31 archivos; gates tsc 0 · eslint 0 · npm test 688/637/0/51 · `npm run build` OK (`/dashboard/notas`); el humo `verif-db/i271notas.mjs` (12/12) corrió sobre estos mismos bytes en el ensayo. Commit `a06ad4d` (incluye M-P1). Falta: M-P2 (enlace en AppSidebar, al final de la ola 3), M-P3 (prueba manual del orquestador: dos pestañas sin red + página > 900 KB; necesita base local y servidor) y SQL de M2 en producción (OK de Gabriel)
- 2026-11-07 · claude (orquestador) · avance · M-P3 (prueba manual) hecha: destapó 2 bugs reales, arreglados como D9.8 (enlace `#p-` en dispositivo nuevo quedaba en Inicio) y D9.9 (el aviso «demasiado grande» no se veía: dovli lo mostraba en Ajustes). Ensayo → microtareas G1, G2 → agy (idéntico al ensayo, guardado fuera de su alcance) → tsc 0 · eslint 0 · npm test 637/0 · M-P3 4/4 · humo 12/12 sin errores. Commit `ae49195`. Falta: M-P2 (enlace en AppSidebar, al final de la ola 3) y SQL de M2 en producción (OK de Gabriel)
- 2026-11-07 · claude (orquestador) · INTEGRADA · PR #78 a `dev` (merge commit); dev → main en PR #84 (lo integra Gabriel)
