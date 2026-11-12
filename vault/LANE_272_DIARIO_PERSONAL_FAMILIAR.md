---
lane: 272
titulo: Diario personal y diario familiar
plane: "#31"
estado: integrada
rama: task/lane-272-diario-personal-familiar
agente: "-"
actualizado: 2026-11-07
---

# Lane 272 — Diario personal y diario familiar

## Especificación
Plane #31: «Nueva pantalla de Diario personal y otra de Diario familiar. Con calendario, función de registrar emociones, posibilidad de registrar varias notas en un solo día, se puede clonar proyectos como Daily_You, storypad, moodiary. Teniendo en cuenta que el UX de Storypad es muy buena y el UX Daily You está bien logrado. El diario personal debe ser privado y el diario familiar obviamente compartido.»

Resultado: dos pantallas con la misma interfaz:
- **`/dashboard/diario`** (personal): solo lo ve quien lo escribe. Nadie más, tampoco los padres.
- **`/dashboard/diario/familia`** (familiar): lo ve y escribe toda la familia; cada entrada muestra autor (avatar + nombre). Solo el autor la edita; el autor o un padre la borra.

Interfaz (UX de StoryPad para la navegación y de Daily You para el ánimo):
1. **Calendario del mes** arriba: cada día con entradas lleva un punto del color del ánimo (el último del día). Flechas de mes. Tocar un día lo selecciona (hoy por defecto).
2. **Lista del día**: todas las entradas del día seleccionado, más reciente primero: hora, carita del ánimo, título, texto (recortado a 4 líneas, «ver más»), fotos en miniatura. En el familiar, autor.
3. **Botón flotante «Escribir»** → hoja (Sheet) con: selector de **ánimo** (5 caritas, opcional, como Daily You: 1 muy mal … 5 muy bien), título opcional, texto, hasta 4 fotos (`/api/upload`), fecha (hoy por defecto, editable hasta 30 días atrás). Guardar / Cancelar.
4. **Resumen del mes** debajo del calendario: cuántas entradas y cuántos días con cada ánimo (5 barritas), sin más estadísticas.
5. Varias entradas por día, sin límite práctico (tope de seguridad 50 por usuario y día).

## Repos de referencia (UX y modelo; son Flutter, no se copia código)
- `theachoem/storypad@a76825e` (GPL-3.0): `lib/views/calendar` (calendario con ánimo), `lib/views/home` (lista por año/mes), `lib/views/stories/edit`.
- `Demizo/Daily_You@7cc237d` (GPL-3.0): `lib/models/mood.dart` (escala 1–5), `lib/pages/edit_entry_page.dart`, `lib/stats`.
- `ZhuJHua/moodiary@2c552dd` (AGPL-3.0): revisado, no aporta nada distinto para la v1.
D-BP3 se aplica a lo que se tome (textos, escala, iconografía): referencia en la cabecera del archivo `// UX basada en <repo>/<ruta>` y entrada en `THIRD_PARTY_NOTICES.md`. No se copia código Dart.

## Decisiones
- D1 · Privacidad del personal: **solo el autor**, también frente a padres (Plane: «debe ser privado»). Se hace cumplir en el servidor (todas las consultas filtran `autorId` cuando `tipo = personal`).
- D2 · Ánimo opcional, escala 1–5 de Daily You. Colores con tokens existentes (sin colores nuevos): 1 `--destructive`, 2 `--warning`, 3 `--muted-foreground`, 4 `--primary` al 60 %, 5 `--success` (los cuatro tokens existen en `globals.css`, verificado el 2026-11-07, claro y oscuro).
- D3 · Texto plano con saltos de línea (máx. 10 000 caracteres). Markdown queda para otra lane.
- D4 · Fotos por `/api/upload` (imágenes ≤ 4 MB, ya optimizadas a WebP); se guardan las URLs `/api/archivos/<uuid>`.
- D5 · Fecha de la entrada = día en la zona de la familia (`@db.Date`), separada de `creadaEn` (hora real).

## Arquitectura
- **Base** (orquestador): `Diario_Entradas` (+ enum `TipoDiario`), `Diario_Fotos`.
- `src/lib/diario/reglas.ts` (puro) + test: `ANIMOS`, `validarEntrada`, `puedeVer`, `puedeEditar`, `puedeBorrar`, `resumenMes`.
- `src/lib/diario/servidor.ts`: listar mes, crear, editar, borrar.
- `src/app/api/diario/route.ts` (GET mes, POST) y `src/app/api/diario/[id]/route.ts` (PATCH, DELETE).
- UI en `src/components/diario/`: `DiarioVista`, `CalendarioAnimo`, `ListaDia`, `EditorEntrada`, `SelectorAnimo`, `ResumenMes`.
- Páginas `src/app/dashboard/diario/page.tsx` y `src/app/dashboard/diario/familia/page.tsx`.
- Enlaces en `AppSidebar.tsx` al final (ola 3).

## Archivos en alcance
`prisma/schema.prisma` · `src/lib/diario/**` · `src/app/api/diario/**` · `src/components/diario/**` · `src/app/dashboard/diario/**` · `src/components/app/AppSidebar.tsx` · `THIRD_PARTY_NOTICES.md`

## Microtareas

### M1 · Esquema [agy]
- [x] hecha (agy)
Archivos: `prisma/schema.prisma`. Precondición: `grep -c 'model DiarioEntrada' prisma/schema.prisma` → `0`.
Pasos:
1. Al **final** del archivo agregar:
```prisma

// ← Lane 272: diario personal (solo el autor) y familiar (toda la familia). Ánimo 1–5 (escala de Daily You).
enum TipoDiario {
  personal
  familiar
}

model DiarioEntrada {
  id         Int        @id @default(autoincrement())
  tipo       TipoDiario @map("Tipo")
  autorId    Int        @map("Autor_ID")
  fecha      DateTime   @map("Fecha") @db.Date // día de la entrada en la zona de la familia
  titulo     String?    @map("Titulo")
  texto      String     @map("Texto")
  animo      Int?       @map("Animo") // 1 muy mal … 5 muy bien
  creadaEn   DateTime   @default(now()) @map("Creada_En")
  editadaEn  DateTime   @updatedAt @map("Editada_En")

  autor Usuario       @relation("DiarioEntradas", fields: [autorId], references: [id], onDelete: Cascade)
  fotos DiarioFoto[]

  @@index([tipo, fecha])
  @@index([autorId, fecha])
  @@map("Diario_Entradas")
}

model DiarioFoto {
  id        Int    @id @default(autoincrement())
  entradaId Int    @map("Entrada_ID")
  url       String @map("URL") // /api/archivos/<uuid>
  orden     Int    @default(0) @map("Orden")

  entrada DiarioEntrada @relation(fields: [entradaId], references: [id], onDelete: Cascade)

  @@map("Diario_Fotos")
}
```
2. En `model Usuario`, debajo de `  historialAcciones HistorialAccion[]` (dentro de `model Usuario`) agregar `  diarioEntradas DiarioEntrada[] @relation("DiarioEntradas")`.
3. `npx prisma format` · `npx prisma generate`. Nada más.

### M2 · Base [orquestador]
- [x] hecha (producción 2026-11-07, ver Hallazgos)
Regla 7: `CREATE TYPE "TipoDiario"`, dos `CREATE TABLE`, índices, FKs. Sin `DROP`.

### M3 · Reglas puras [agy]
- [x] hecha (agy)
Archivos: `src/lib/diario/reglas.ts` (crear con este contenido exacto)
```ts
// Diario personal y familiar (lane 272, Plane #31). Reglas puras: sin base ni red.
// Escala de ánimo 1–5 basada en Daily You (Demizo/Daily_You@7cc237d, lib/models/mood.dart).

export type TipoDiario = "personal" | "familiar";

export const ANIMOS = [
  { valor: 1, etiqueta: "Muy mal", emoji: "😣" },
  { valor: 2, etiqueta: "Mal", emoji: "🙁" },
  { valor: 3, etiqueta: "Normal", emoji: "😐" },
  { valor: 4, etiqueta: "Bien", emoji: "🙂" },
  { valor: 5, etiqueta: "Muy bien", emoji: "😄" },
] as const;

export const MAX_TEXTO = 10_000;
export const MAX_TITULO = 120;
export const MAX_FOTOS = 4;
export const MAX_DIAS_ATRAS = 30;
export const MAX_ENTRADAS_DIA = 50;
const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const URL_ARCHIVO = /^\/api\/archivos\/[0-9a-f-]{36}$/i;

export interface EntradaValida {
  fecha: string;
  titulo: string | null;
  texto: string;
  animo: number | null;
  fotos: string[];
}

const diasEntre = (a: string, b: string) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);

/** `hoy` = día de hoy en la zona de la familia ("YYYY-MM-DD"). */
export function validarEntrada(e: Record<string, unknown>, hoy: string): EntradaValida {
  const fecha = String(e.fecha ?? hoy);
  if (!FECHA.test(fecha) || Number.isNaN(Date.parse(fecha))) throw new Error("Fecha inválida");
  const atras = diasEntre(fecha, hoy);
  if (atras < 0) throw new Error("No se puede escribir en un día que todavía no llegó");
  if (atras > MAX_DIAS_ATRAS) throw new Error(`Solo se puede escribir hasta ${MAX_DIAS_ATRAS} días atrás`);
  const texto = typeof e.texto === "string" ? e.texto.trim() : "";
  if (!texto) throw new Error("Escribí algo");
  if (texto.length > MAX_TEXTO) throw new Error(`Máximo ${MAX_TEXTO} caracteres`);
  const tituloCrudo = typeof e.titulo === "string" ? e.titulo.trim() : "";
  if (tituloCrudo.length > MAX_TITULO) throw new Error(`El título puede tener hasta ${MAX_TITULO} caracteres`);
  let animo: number | null = null;
  if (e.animo !== null && e.animo !== undefined && e.animo !== "") {
    animo = Number(e.animo);
    if (!Number.isInteger(animo) || animo < 1 || animo > 5) throw new Error("Ánimo inválido");
  }
  const fotos = Array.isArray(e.fotos) ? e.fotos.map(String) : [];
  if (fotos.length > MAX_FOTOS) throw new Error(`Hasta ${MAX_FOTOS} fotos`);
  if (fotos.some((f) => !URL_ARCHIVO.test(f))) throw new Error("Foto inválida");
  return { fecha, titulo: tituloCrudo || null, texto, animo, fotos };
}

type Lector = { id: number; esPadre: boolean };
type Entrada = { tipo: TipoDiario; autorId: number };

export const puedeVer = (e: Entrada, u: Lector) => e.tipo === "familiar" || e.autorId === u.id;
export const puedeEditar = (e: Entrada, u: Lector) => e.autorId === u.id;
export const puedeBorrar = (e: Entrada, u: Lector) => e.autorId === u.id || (e.tipo === "familiar" && u.esPadre);

/** Para el calendario y el resumen: ánimo del día (el de la última entrada con ánimo) y conteos. */
export function resumenMes(entradas: { fecha: string; animo: number | null; creadaEn: string }[]) {
  const porDia = new Map<string, { animo: number | null; creadaEn: string; cantidad: number }>();
  for (const e of entradas) {
    const d = porDia.get(e.fecha) ?? { animo: null, creadaEn: "", cantidad: 0 };
    d.cantidad++;
    if (e.animo !== null && e.creadaEn >= d.creadaEn) {
      d.animo = e.animo;
      d.creadaEn = e.creadaEn;
    }
    porDia.set(e.fecha, d);
  }
  const diasPorAnimo = [0, 0, 0, 0, 0];
  for (const d of porDia.values()) if (d.animo !== null) diasPorAnimo[d.animo - 1]++;
  return {
    dias: Object.fromEntries([...porDia].map(([f, d]) => [f, { animo: d.animo, cantidad: d.cantidad }])),
    totalEntradas: entradas.length,
    diasPorAnimo,
  };
}
```

### M4 · Tests [agy]
- [x] hecha (agy)
Archivos: `src/lib/diario/reglas.test.ts` (crear con este contenido exacto)
```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { puedeBorrar, puedeEditar, puedeVer, resumenMes, validarEntrada } from "./reglas.ts";

const HOY = "2026-11-07";

test("validarEntrada: normaliza y acepta lo correcto", () => {
  const e = validarEntrada({ texto: "  Hoy fuimos a Misa  ", titulo: " ", animo: 4 }, HOY);
  assert.deepEqual(e, { fecha: HOY, titulo: null, texto: "Hoy fuimos a Misa", animo: 4, fotos: [] });
});

test("validarEntrada: rechaza vacío, futuro, > 30 días, ánimo y foto inválidos", () => {
  assert.throws(() => validarEntrada({ texto: "   " }, HOY));
  assert.throws(() => validarEntrada({ texto: "x", fecha: "2026-11-08" }, HOY));
  assert.throws(() => validarEntrada({ texto: "x", fecha: "2026-10-07" }, HOY));
  assert.throws(() => validarEntrada({ texto: "x", animo: 6 }, HOY));
  assert.throws(() => validarEntrada({ texto: "x", fotos: ["https://otro.sitio/a.jpg"] }, HOY));
});

test("privacidad: el personal solo lo ve el autor, ni siquiera un padre", () => {
  const personal = { tipo: "personal" as const, autorId: 7 };
  assert.equal(puedeVer(personal, { id: 7, esPadre: false }), true);
  assert.equal(puedeVer(personal, { id: 1, esPadre: true }), false);
  assert.equal(puedeBorrar(personal, { id: 1, esPadre: true }), false);
});

test("familiar: lo ven todos, edita el autor, borra el autor o un padre", () => {
  const familiar = { tipo: "familiar" as const, autorId: 7 };
  assert.equal(puedeVer(familiar, { id: 9, esPadre: false }), true);
  assert.equal(puedeEditar(familiar, { id: 1, esPadre: true }), false);
  assert.equal(puedeBorrar(familiar, { id: 1, esPadre: true }), true);
  assert.equal(puedeBorrar(familiar, { id: 9, esPadre: false }), false);
});

test("resumenMes: ánimo del día = el de la última entrada con ánimo", () => {
  const r = resumenMes([
    { fecha: "2026-11-02", animo: 2, creadaEn: "2026-11-02T10:00:00Z" },
    { fecha: "2026-11-02", animo: 5, creadaEn: "2026-11-02T20:00:00Z" },
    { fecha: "2026-11-02", animo: null, creadaEn: "2026-11-02T22:00:00Z" },
    { fecha: "2026-11-03", animo: null, creadaEn: "2026-11-03T09:00:00Z" },
  ]);
  assert.deepEqual(r.dias["2026-11-02"], { animo: 5, cantidad: 3 });
  assert.deepEqual(r.dias["2026-11-03"], { animo: null, cantidad: 1 });
  assert.equal(r.totalEntradas, 4);
  assert.deepEqual(r.diasPorAnimo, [0, 0, 0, 0, 1]);
});
```

### M5 · Servidor y API [agy]
- [x] hecha (agy)
Archivos: `src/lib/diario/servidor.ts`, `src/app/api/diario/route.ts`, `src/app/api/diario/[id]/route.ts` (crear con este contenido exacto)

`src/lib/diario/servidor.ts`:
```ts
// Diario (lane 272), lado servidor. La privacidad del personal se hace cumplir acá, en cada consulta (D1).
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { aClave, aFecha, hoyEnFamilia, NoAutorizadoError, NoEncontradoError } from "@/lib/habitos/server";
import { MAX_ENTRADAS_DIA, puedeBorrar, puedeEditar, validarEntrada, type TipoDiario } from "./reglas";

type Actor = { id: number; esPadre: boolean };

export type EntradaVista = {
  id: number;
  tipo: TipoDiario;
  fecha: string;
  titulo: string | null;
  texto: string;
  animo: number | null;
  creadaEn: string;
  fotos: string[];
  autor: { id: number; nombre: string; fotoUrl: string | null };
  puedoEditar: boolean;
  puedoBorrar: boolean;
};

const incluir = {
  fotos: { orderBy: { orden: "asc" as const }, select: { url: true } },
  autor: { select: { id: true, nombre: true, fotoUrl: true } },
};

type EntradaConFotos = Prisma.DiarioEntradaGetPayload<{ include: typeof incluir }>;

function aVista(e: EntradaConFotos, actor: Actor): EntradaVista {
  return {
    id: e.id,
    tipo: e.tipo,
    fecha: aClave(e.fecha),
    titulo: e.titulo,
    texto: e.texto,
    animo: e.animo,
    creadaEn: e.creadaEn.toISOString(),
    fotos: e.fotos.map((f: { url: string }) => f.url),
    autor: e.autor,
    puedoEditar: puedeEditar(e, actor),
    puedoBorrar: puedeBorrar(e, actor),
  };
}

/** Entradas de un mes ("YYYY-MM"). Personal: solo las propias. */
export async function listarMes(actor: Actor, tipo: TipoDiario, mes: string): Promise<EntradaVista[]> {
  if (!/^\d{4}-\d{2}$/.test(mes)) throw new Error("Mes inválido");
  const [y, m] = mes.split("-").map(Number);
  const desde = aFecha(`${mes}-01`);
  const hasta = new Date(Date.UTC(y, m, 1));
  const filas = await prisma.diarioEntrada.findMany({
    where: { tipo, fecha: { gte: desde, lt: hasta }, ...(tipo === "personal" ? { autorId: actor.id } : {}) },
    orderBy: [{ fecha: "desc" }, { creadaEn: "desc" }],
    include: incluir,
  });
  return filas.map((e) => aVista(e, actor));
}

export async function crearEntrada(actor: Actor, tipo: TipoDiario, body: Record<string, unknown>): Promise<EntradaVista> {
  const v = validarEntrada(body, hoyEnFamilia());
  const fecha = aFecha(v.fecha);
  const delDia = await prisma.diarioEntrada.count({ where: { autorId: actor.id, fecha } });
  if (delDia >= MAX_ENTRADAS_DIA) throw new Error("Llegaste al máximo de entradas de este día");
  const e = await prisma.diarioEntrada.create({
    data: {
      tipo,
      autorId: actor.id,
      fecha,
      titulo: v.titulo,
      texto: v.texto,
      animo: v.animo,
      fotos: { create: v.fotos.map((url, orden) => ({ url, orden })) },
    },
    include: incluir,
  });
  return aVista(e, actor);
}

async function buscarVisible(actor: Actor, id: number) {
  const e = await prisma.diarioEntrada.findUnique({ where: { id }, include: incluir });
  // Una entrada personal ajena responde «no existe» (no se revela que existe)
  if (!e || (e.tipo === "personal" && e.autorId !== actor.id)) throw new NoEncontradoError("La entrada no existe");
  return e;
}

export async function editarEntrada(actor: Actor, id: number, body: Record<string, unknown>): Promise<EntradaVista> {
  const e = await buscarVisible(actor, id);
  if (!puedeEditar(e, actor)) throw new NoAutorizadoError("Solo quien la escribió puede editarla");
  const v = validarEntrada({ ...body, fecha: body.fecha ?? aClave(e.fecha) }, hoyEnFamilia());
  const nueva = await prisma.$transaction(async (tx) => {
    await tx.diarioFoto.deleteMany({ where: { entradaId: id } });
    return tx.diarioEntrada.update({
      where: { id },
      data: {
        fecha: aFecha(v.fecha),
        titulo: v.titulo,
        texto: v.texto,
        animo: v.animo,
        fotos: { create: v.fotos.map((url, orden) => ({ url, orden })) },
      },
      include: incluir,
    });
  });
  return aVista(nueva, actor);
}

export async function borrarEntrada(actor: Actor, id: number): Promise<void> {
  const e = await buscarVisible(actor, id);
  if (!puedeBorrar(e, actor)) throw new NoAutorizadoError("No podés borrar esta entrada");
  await prisma.diarioEntrada.delete({ where: { id } });
}
```

`src/app/api/diario/route.ts`:
```ts
// GET ?tipo=personal|familiar&mes=YYYY-MM → { entradas } · POST { tipo, fecha?, titulo?, texto, animo?, fotos? } (lane 272)
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { esPadre } from "@/lib/habitos/permisos";
import { crearEntrada, listarMes } from "@/lib/diario/servidor";

export const dynamic = "force-dynamic";

const tipoDe = (v: unknown) => (v === "personal" || v === "familiar" ? v : null);
const fallo = (e: unknown) =>
  NextResponse.json({ error: e instanceof Error ? e.message : "Error" }, { status: (e as { status?: number }).status ?? 400 });

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const tipo = tipoDe(req.nextUrl.searchParams.get("tipo"));
  const mes = req.nextUrl.searchParams.get("mes") ?? "";
  if (!tipo) return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
  try {
    const actor = { id: Number(session.user.id), esPadre: esPadre(session.user.rolFamiliar) };
    return NextResponse.json({ entradas: await listarMes(actor, tipo, mes) });
  } catch (e) {
    return fallo(e);
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const tipo = tipoDe(body.tipo);
  if (!tipo) return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
  try {
    const actor = { id: Number(session.user.id), esPadre: esPadre(session.user.rolFamiliar) };
    return NextResponse.json({ entrada: await crearEntrada(actor, tipo, body) });
  } catch (e) {
    return fallo(e);
  }
}
```

`src/app/api/diario/[id]/route.ts`:
```ts
// PATCH (autor) · DELETE (autor, o un padre en el familiar) — lane 272
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { esPadre } from "@/lib/habitos/permisos";
import { borrarEntrada, editarEntrada } from "@/lib/diario/servidor";

export const dynamic = "force-dynamic";

const fallo = (e: unknown) =>
  NextResponse.json({ error: e instanceof Error ? e.message : "Error" }, { status: (e as { status?: number }).status ?? 400 });

async function contexto(params: Promise<{ id: string }>) {
  const session = await getSession();
  if (!session?.user?.id) return null;
  const { id } = await params;
  return { actor: { id: Number(session.user.id), esPadre: esPadre(session.user.rolFamiliar) }, id: Number(id) };
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const c = await contexto(params);
  if (!c) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    return NextResponse.json({ entrada: await editarEntrada(c.actor, c.id, await req.json().catch(() => ({}))) });
  } catch (e) {
    return fallo(e);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const c = await contexto(params);
  if (!c) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    await borrarEntrada(c.actor, c.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return fallo(e);
  }
}
```
Verificación: `npx tsc --noEmit`. Precondición previa: `grep -n "export class NoEncontradoError\|export class NoAutorizadoError" src/lib/habitos/server.ts` → 2 líneas, y que ambas clases tengan `status` (404/403); si no, **STOP**.

### M6 · Interfaz [agy] — código exacto (ensayado por el orquestador el 2026-11-07: tsc 0 · eslint 0 · prueba de pantalla OK)
- [x] hecha (`95fc247`)
Cambio de contrato respecto de la versión anterior de esta spec: `DiarioVista` recibe `tipo` y `hoy` (día de hoy en la zona de la familia, lo calcula la página con `hoyEnFamilia()`), no `usuarioId`; `CalendarioAnimo` recibe además `hoy` (no deja elegir días futuros). Archivo nuevo `animo.ts` con los colores de D2.
Precondición: `ls src/components/diario` → «No such file or directory» (si existe: BLOQUEADO).

#### M6.1 · `animo.ts`
Crear `src/components/diario/animo.ts` (si ya existe: BLOQUEADO) con este contenido exacto:
```tsx
// Diario (lane 272): colores del ánimo con tokens existentes (D2). Escala de Daily You (Demizo/Daily_You@7cc237d).
import { ANIMOS } from "@/lib/diario/reglas";

/** Clase de fondo por ánimo 1–5 (D2: destructive, warning, muted-foreground, primary al 60 %, success). */
export const FONDO_ANIMO: Record<number, string> = {
  1: "bg-destructive",
  2: "bg-warning",
  3: "bg-muted-foreground",
  4: "bg-primary/60",
  5: "bg-success",
};

export const animoDe = (v: number | null) => ANIMOS.find((a) => a.valor === v) ?? null;
```

#### M6.2 · `SelectorAnimo.tsx`
Crear `src/components/diario/SelectorAnimo.tsx` (si ya existe: BLOQUEADO) con este contenido exacto:
```tsx
"use client";
// Diario (lane 272): selector de ánimo de 5 caritas. UX basada en Demizo/Daily_You@7cc237d (lib/models/mood.dart).
import { ANIMOS } from "@/lib/diario/reglas";
import { cn } from "@/lib/utils";

export function SelectorAnimo({ valor, onCambio }: { valor: number | null; onCambio: (v: number | null) => void }) {
  return (
    <div role="radiogroup" aria-label="¿Cómo te sentís?" className="flex justify-between gap-1">
      {ANIMOS.map((a) => {
        const elegido = valor === a.valor;
        return (
          <button
            key={a.valor}
            type="button"
            role="radio"
            aria-checked={elegido}
            aria-label={a.etiqueta}
            title={a.etiqueta}
            onClick={() => onCambio(elegido ? null : a.valor)}
            className={cn(
              "flex size-12 items-center justify-center rounded-full text-2xl transition",
              elegido ? "scale-110 bg-primary/15 ring-2 ring-primary" : "opacity-60 hover:opacity-100",
            )}
          >
            {a.emoji}
          </button>
        );
      })}
    </div>
  );
}
```

#### M6.3 · `ResumenMes.tsx`
Crear `src/components/diario/ResumenMes.tsx` (si ya existe: BLOQUEADO) con este contenido exacto:
```tsx
// Diario (lane 272): resumen del mes — entradas y días por ánimo (5 barras).
import { ANIMOS } from "@/lib/diario/reglas";
import { FONDO_ANIMO } from "./animo";

export function ResumenMes({ totalEntradas, diasPorAnimo }: { totalEntradas: number; diasPorAnimo: number[] }) {
  const max = Math.max(1, ...diasPorAnimo);
  return (
    <section aria-label="Resumen del mes" className="rounded-xl border bg-card p-4">
      <p className="mb-3 text-sm text-muted-foreground">
        {totalEntradas} {totalEntradas === 1 ? "entrada" : "entradas"} este mes
      </p>
      <ul className="flex flex-col gap-1.5">
        {ANIMOS.map((a, i) => (
          <li key={a.valor} className="flex items-center gap-2 text-sm">
            <span aria-hidden className="w-6 text-center">{a.emoji}</span>
            <span className="sr-only">{a.etiqueta}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
              <div className={`h-full rounded-full ${FONDO_ANIMO[a.valor]}`} style={{ width: `${(diasPorAnimo[i] / max) * 100}%` }} />
            </div>
            <span className="w-6 text-right tabular-nums">{diasPorAnimo[i]}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
```

#### M6.4 · `CalendarioAnimo.tsx`
Crear `src/components/diario/CalendarioAnimo.tsx` (si ya existe: BLOQUEADO) con este contenido exacto:
```tsx
"use client";
// Diario (lane 272): calendario del mes con el ánimo de cada día. UX basada en theachoem/storypad@a76825e (lib/views/calendar).
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FONDO_ANIMO } from "./animo";

const DIAS = ["L", "M", "M", "J", "V", "S", "D"];
const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

/** Suma `n` meses a "YYYY-MM". */
export function moverMes(mes: string, n: number): string {
  const [y, m] = mes.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function CalendarioAnimo({
  mes,
  dias,
  seleccionado,
  hoy,
  onDia,
  onMes,
}: {
  mes: string;
  dias: Record<string, { animo: number | null; cantidad: number }>;
  seleccionado: string;
  hoy: string;
  onDia: (fecha: string) => void;
  onMes: (mes: string) => void;
}) {
  const [y, m] = mes.split("-").map(Number);
  const total = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const huecos = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7; // lunes = 0
  const fechas = Array.from({ length: total }, (_, i) => `${mes}-${String(i + 1).padStart(2, "0")}`);

  return (
    <section aria-label="Calendario" className="rounded-xl border bg-card p-3">
      <div className="mb-2 flex items-center justify-between">
        <Button variant="ghost" size="icon" aria-label="Mes anterior" onClick={() => onMes(moverMes(mes, -1))}>
          <ChevronLeft />
        </Button>
        <h2 className="font-medium capitalize">
          {MESES[m - 1]} {y}
        </h2>
        <Button variant="ghost" size="icon" aria-label="Mes siguiente" disabled={moverMes(mes, 1) > hoy.slice(0, 7)} onClick={() => onMes(moverMes(mes, 1))}>
          <ChevronRight />
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
        {DIAS.map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {Array.from({ length: huecos }, (_, i) => (
          <span key={`h${i}`} />
        ))}
        {fechas.map((f) => {
          const d = dias[f];
          const futuro = f > hoy;
          return (
            <button
              key={f}
              type="button"
              disabled={futuro}
              aria-pressed={f === seleccionado}
              aria-label={`${Number(f.slice(8))}${d ? `, ${d.cantidad} ${d.cantidad === 1 ? "entrada" : "entradas"}` : ""}`}
              onClick={() => onDia(f)}
              className={cn(
                "flex aspect-square flex-col items-center justify-center gap-0.5 rounded-lg text-sm transition",
                f === seleccionado ? "bg-primary text-primary-foreground" : "hover:bg-muted",
                f === hoy && f !== seleccionado && "font-semibold text-primary",
                futuro && "opacity-30",
              )}
            >
              {Number(f.slice(8))}
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  d ? (d.animo ? FONDO_ANIMO[d.animo] : "bg-foreground/40") : "bg-transparent",
                  d && f === seleccionado && "ring-1 ring-primary-foreground",
                )}
              />
            </button>
          );
        })}
      </div>
    </section>
  );
}
```

#### M6.5 · `ListaDia.tsx`
Crear `src/components/diario/ListaDia.tsx` (si ya existe: BLOQUEADO) con este contenido exacto:
```tsx
"use client";
// Diario (lane 272): entradas del día seleccionado. UX basada en theachoem/storypad@a76825e (lib/views/home).
import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { TipoDiario } from "@/lib/diario/reglas";
import type { EntradaVista } from "@/lib/diario/servidor";
import { animoDe } from "./animo";

const hora = (iso: string) => new Date(iso).toLocaleTimeString("es-UY", { hour: "2-digit", minute: "2-digit" });

function Tarjeta({
  e,
  tipo,
  onEditar,
  onBorrar,
}: {
  e: EntradaVista;
  tipo: TipoDiario;
  onEditar: (e: EntradaVista) => void;
  onBorrar: (e: EntradaVista) => void;
}) {
  const [abierta, setAbierta] = useState(false);
  const animo = animoDe(e.animo);
  const largo = e.texto.length > 280 || e.texto.split("\n").length > 4;
  return (
    <article className="rounded-xl border bg-card p-4">
      <header className="mb-2 flex items-center gap-2">
        {tipo === "familiar" && (
          <Avatar className="size-7">
            {e.autor.fotoUrl && <AvatarImage src={e.autor.fotoUrl} alt="" />}
            <AvatarFallback>{e.autor.nombre.slice(0, 1)}</AvatarFallback>
          </Avatar>
        )}
        <div className="min-w-0 flex-1">
          {tipo === "familiar" && <p className="truncate text-sm font-medium">{e.autor.nombre}</p>}
          <p className="text-xs text-muted-foreground">{hora(e.creadaEn)}</p>
        </div>
        {animo && (
          <span className="text-xl" title={animo.etiqueta} aria-label={`Ánimo: ${animo.etiqueta}`}>
            {animo.emoji}
          </span>
        )}
        {e.puedoEditar && (
          <Button variant="ghost" size="icon-sm" aria-label="Editar" onClick={() => onEditar(e)}>
            <Pencil />
          </Button>
        )}
        {e.puedoBorrar && (
          <Button variant="ghost" size="icon-sm" aria-label="Borrar" onClick={() => onBorrar(e)}>
            <Trash2 />
          </Button>
        )}
      </header>
      {e.titulo && <h3 className="mb-1 font-semibold">{e.titulo}</h3>}
      <p className={`whitespace-pre-line text-sm ${abierta ? "" : "line-clamp-4"}`}>{e.texto}</p>
      {largo && (
        <button type="button" className="mt-1 text-sm text-primary" onClick={() => setAbierta(!abierta)}>
          {abierta ? "ver menos" : "ver más"}
        </button>
      )}
      {e.fotos.length > 0 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {e.fotos.map((url) => (
            <a key={url} href={url} target="_blank" rel="noreferrer" className="shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element -- fotos ya optimizadas por /api/upload */}
              <img src={url} alt="" className="size-20 rounded-lg object-cover" />
            </a>
          ))}
        </div>
      )}
    </article>
  );
}

export function ListaDia({
  entradas,
  tipo,
  onEditar,
  onBorrar,
}: {
  entradas: EntradaVista[];
  tipo: TipoDiario;
  onEditar: (e: EntradaVista) => void;
  onBorrar: (e: EntradaVista) => void;
}) {
  if (!entradas.length) return <p className="py-8 text-center text-sm text-muted-foreground">No hay entradas este día.</p>;
  return (
    <div className="flex flex-col gap-3">
      {entradas.map((e) => (
        <Tarjeta key={e.id} e={e} tipo={tipo} onEditar={onEditar} onBorrar={onBorrar} />
      ))}
    </div>
  );
}
```

#### M6.6 · `EditorEntrada.tsx`
Crear `src/components/diario/EditorEntrada.tsx` (si ya existe: BLOQUEADO) con este contenido exacto:
```tsx
"use client";
// Diario (lane 272): hoja para escribir o editar una entrada. UX basada en Demizo/Daily_You@7cc237d (lib/pages/edit_entry_page.dart).
import { useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { MAX_DIAS_ATRAS, MAX_FOTOS, MAX_TEXTO, MAX_TITULO, type TipoDiario } from "@/lib/diario/reglas";
import type { EntradaVista } from "@/lib/diario/servidor";
import { toast } from "@/lib/toast";
import { SelectorAnimo } from "./SelectorAnimo";

const restarDias = (fecha: string, n: number) => new Date(Date.parse(`${fecha}T00:00:00Z`) - n * 86_400_000).toISOString().slice(0, 10);

/** Se monta con una `key` nueva cada vez que se abre, así el estado inicial sale de las props. */
export function EditorEntrada({
  abierto,
  tipo,
  entrada,
  fecha,
  hoy,
  onGuardado,
  onCerrar,
}: {
  abierto: boolean;
  tipo: TipoDiario;
  entrada?: EntradaVista;
  fecha: string;
  hoy: string;
  onGuardado: () => void;
  onCerrar: () => void;
}) {
  const [animo, setAnimo] = useState<number | null>(entrada?.animo ?? null);
  const [titulo, setTitulo] = useState(entrada?.titulo ?? "");
  const [texto, setTexto] = useState(entrada?.texto ?? "");
  const [fotos, setFotos] = useState<string[]>(entrada?.fotos ?? []);
  const [dia, setDia] = useState(entrada?.fecha ?? fecha);
  const [subiendo, setSubiendo] = useState(false);
  const [guardando, setGuardando] = useState(false);

  async function subir(archivos: FileList | null) {
    if (!archivos?.length) return;
    setSubiendo(true);
    try {
      const nuevas: string[] = [];
      for (const f of Array.from(archivos).slice(0, MAX_FOTOS - fotos.length)) {
        const form = new FormData();
        form.append("file", f);
        const r = await fetch("/api/upload", { method: "POST", body: form });
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(d.error ?? "No se pudo subir la foto");
        nuevas.push(d.url);
      }
      setFotos((x) => [...x, ...nuevas]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo subir la foto");
    } finally {
      setSubiendo(false);
    }
  }

  async function guardar() {
    setGuardando(true);
    try {
      const cuerpo = { tipo, fecha: dia, titulo, texto, animo, fotos };
      const r = await fetch(entrada ? `/api/diario/${entrada.id}` : "/api/diario", {
        method: entrada ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(cuerpo),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error ?? "No se pudo guardar");
      toast.success(entrada ? "Entrada actualizada" : "Entrada guardada");
      onGuardado();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Sheet open={abierto} onOpenChange={(v) => !v && onCerrar()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{entrada ? "Editar entrada" : "Nueva entrada"}</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-4 px-4">
          <SelectorAnimo valor={animo} onCambio={setAnimo} />
          <label className="flex flex-col gap-1 text-sm">
            Fecha
            <Input type="date" value={dia} min={restarDias(hoy, MAX_DIAS_ATRAS)} max={hoy} onChange={(e) => setDia(e.target.value)} />
          </label>
          <Input placeholder="Título (opcional)" value={titulo} maxLength={MAX_TITULO} onChange={(e) => setTitulo(e.target.value)} />
          <Textarea placeholder="¿Qué pasó hoy?" value={texto} maxLength={MAX_TEXTO} rows={8} onChange={(e) => setTexto(e.target.value)} />
          <div className="flex flex-wrap gap-2">
            {fotos.map((url) => (
              <div key={url} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element -- fotos ya optimizadas por /api/upload */}
                <img src={url} alt="" className="size-20 rounded-lg object-cover" />
                <button
                  type="button"
                  aria-label="Quitar foto"
                  onClick={() => setFotos((x) => x.filter((u) => u !== url))}
                  className="absolute -top-2 -right-2 rounded-full bg-background p-0.5 shadow"
                >
                  <X className="size-4" />
                </button>
              </div>
            ))}
            {fotos.length < MAX_FOTOS && (
              <label className="flex size-20 cursor-pointer items-center justify-center rounded-lg border border-dashed text-muted-foreground hover:bg-muted">
                <ImagePlus aria-hidden />
                <span className="sr-only">Agregar foto</span>
                <input type="file" accept="image/*" multiple className="hidden" disabled={subiendo} onChange={(e) => void subir(e.target.files)} />
              </label>
            )}
          </div>
        </div>
        <SheetFooter className="flex-row justify-end gap-2">
          <Button variant="outline" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button onClick={() => void guardar()} disabled={guardando || subiendo || !texto.trim()}>
            {guardando ? "Guardando…" : "Guardar"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
```

#### M6.7 · `DiarioVista.tsx`
Crear `src/components/diario/DiarioVista.tsx` (si ya existe: BLOQUEADO) con este contenido exacto:
```tsx
"use client";
// Diario (lane 272): pantalla completa — calendario, resumen, entradas del día y botón «Escribir».
import { useCallback, useEffect, useMemo, useState } from "react";
import { PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { resumenMes, type TipoDiario } from "@/lib/diario/reglas";
import type { EntradaVista } from "@/lib/diario/servidor";
import { toast } from "@/lib/toast";
import { CalendarioAnimo } from "./CalendarioAnimo";
import { EditorEntrada } from "./EditorEntrada";
import { ListaDia } from "./ListaDia";
import { ResumenMes } from "./ResumenMes";

export function DiarioVista({ tipo, hoy }: { tipo: TipoDiario; hoy: string }) {
  const [mes, setMes] = useState(hoy.slice(0, 7));
  const [seleccionado, setSeleccionado] = useState(hoy);
  const [entradas, setEntradas] = useState<EntradaVista[]>([]);
  const [version, setVersion] = useState(0);
  const [editor, setEditor] = useState<{ entrada?: EntradaVista; clave: number } | null>(null);

  useEffect(() => {
    let vivo = true;
    fetch(`/api/diario?tipo=${tipo}&mes=${mes}`)
      .then(async (r) => {
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(d.error ?? "No se pudo cargar el diario");
        if (vivo) setEntradas(d.entradas);
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "No se pudo cargar el diario"));
    return () => {
      vivo = false;
    };
  }, [tipo, mes, version]);

  const resumen = useMemo(() => resumenMes(entradas), [entradas]);
  const delDia = useMemo(() => entradas.filter((e) => e.fecha === seleccionado), [entradas, seleccionado]);
  const recargar = useCallback(() => setVersion((v) => v + 1), []);

  function cambiarMes(m: string) {
    setMes(m);
    setSeleccionado(m === hoy.slice(0, 7) ? hoy : `${m}-01`);
  }

  async function borrar(e: EntradaVista) {
    if (!window.confirm("¿Borrar esta entrada? No se puede deshacer.")) return;
    const r = await fetch(`/api/diario/${e.id}`, { method: "DELETE" });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) return toast.error(d.error ?? "No se pudo borrar");
    toast.success("Entrada borrada");
    recargar();
  }

  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,22rem)_1fr] md:items-start">
      <div className="flex flex-col gap-4">
        <CalendarioAnimo mes={mes} dias={resumen.dias} seleccionado={seleccionado} hoy={hoy} onDia={setSeleccionado} onMes={cambiarMes} />
        <ResumenMes totalEntradas={resumen.totalEntradas} diasPorAnimo={resumen.diasPorAnimo} />
      </div>
      <ListaDia entradas={delDia} tipo={tipo} onEditar={(e) => setEditor({ entrada: e, clave: Date.now() })} onBorrar={(e) => void borrar(e)} />
      <Button className="fixed right-4 bottom-20 z-30 h-12 rounded-full px-5 shadow-lg sm:right-6 sm:bottom-6" onClick={() => setEditor({ clave: Date.now() })}>
        <PenLine /> Escribir
      </Button>
      {editor && (
        <EditorEntrada
          key={editor.clave}
          abierto
          tipo={tipo}
          entrada={editor.entrada}
          fecha={seleccionado}
          hoy={hoy}
          onGuardado={() => {
            setEditor(null);
            recargar();
          }}
          onCerrar={() => setEditor(null)}
        />
      )}
    </div>
  );
}
```

Verificación: `ls src/components/diario` → los 7 archivos de arriba y ninguno más.

### M7 · Páginas [agy] — código exacto (los enlaces del sidebar van al final, ola 3)
- [x] hecha (`95fc247`; M7.3 sidebar pendiente, ola 3)
Precondición: `ls src/app/dashboard/diario` → «No such file or directory» (si existe: BLOQUEADO).

#### M7.1 · Diario personal
Crear `src/app/dashboard/diario/page.tsx` (si ya existe: BLOQUEADO) con este contenido exacto:
```tsx
export const dynamic = "force-dynamic";

// Diario personal (lane 272): solo lo ve quien lo escribe.
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { hoyEnFamilia } from "@/lib/habitos/server";
import { PageHeader } from "@/components/app/PageHeader";
import { DiarioVista } from "@/components/diario/DiarioVista";

export default async function DiarioPersonalPage() {
  const session = await getSession();
  if (!session?.user) redirect("/");
  return (
    <div className="flex flex-col">
      <PageHeader title="Mi diario" />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-6 pb-36 sm:px-6 sm:pb-24">
        <DiarioVista tipo="personal" hoy={hoyEnFamilia()} />
      </main>
    </div>
  );
}
```

#### M7.2 · Diario familiar
Crear `src/app/dashboard/diario/familia/page.tsx` (si ya existe: BLOQUEADO) con este contenido exacto:
```tsx
export const dynamic = "force-dynamic";

// Diario familiar (lane 272): lo ve y escribe toda la familia.
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { hoyEnFamilia } from "@/lib/habitos/server";
import { PageHeader } from "@/components/app/PageHeader";
import { DiarioVista } from "@/components/diario/DiarioVista";

export default async function DiarioFamiliarPage() {
  const session = await getSession();
  if (!session?.user) redirect("/");
  return (
    <div className="flex flex-col">
      <PageHeader title="Diario familiar" />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-6 pb-36 sm:px-6 sm:pb-24">
        <DiarioVista tipo="familiar" hoy={hoyEnFamilia()} />
      </main>
    </div>
  );
}
```

#### M7.3 · Sidebar [agy] — al final, ola 3
- [x] hecha (movida a LANE_278, `3a413b3`)
«Mi diario» (`BookHeart`) y «Diario familiar» (`BookUser`), mismo formato que LANE_274 M10.

### M8 · Prueba [orquestador]
- [x] hecha (base local; producción espera el SQL de M2)
Base local: hijo A escribe 3 entradas hoy (una con ánimo 2, otra 5, otra sin ánimo) → el día muestra el punto de ánimo 5 y 3 entradas. Padre: `GET ?tipo=personal` no trae las de A; `PATCH/DELETE` de una personal de A → 404. Familiar: todos ven, solo A edita, el padre borra. Fecha 31 días atrás → error. Celular: calendario y hoja usables a 360 px.

## Criterios de aceptación
- Dos pantallas; varias entradas por día; ánimo 1–5; calendario con ánimo; fotos.
- El personal es privado de verdad (API), el familiar compartido.

## Gates
`npx prisma validate` · `npx tsc --noEmit` · `npm test` · `npx eslint src/lib/diario src/app/api/diario src/components/diario src/app/dashboard/diario`

## Pendientes
- M7.3 (enlaces del diario) → movido a LANE_278 (ola 3).
- M7.3 (sidebar) al final, ola 3.

## Hallazgos
- M8, parte de API (2026-11-07, base local, puerto 3172): Juan crea 3 personales (ánimo 2, 5, sin ánimo) y 1 familiar. Juan ve sus 3; el padre `GET ?tipo=personal` no trae ninguna de Juan; padre PATCH/DELETE de una personal de Juan → **404/404**; Ana ve la familiar; Ana PATCH de la familiar de Juan → **403**; padre DELETE de la familiar → 200; fecha de hace 31 días → «Solo se puede escribir hasta 30 días atrás». Parte de pantalla (`verif-db/i272.mjs`, código de agy): crear con ánimo 4 y editar desde la hoja; el padre no ve el personal de Juan; diario familiar del padre carga; 360 px sin desborde y hoja usable; 0 errores de consola.
- La spec de M5 tenía `aVista(e: any …)` (eslint `no-explicit-any`): corregido en la spec y en el código con `Prisma.DiarioEntradaGetPayload<{ include: typeof incluir }>` (commit a2d4786).
- SQL de M2 (sin base, contra el esquema de dev), solo aditivo: `CREATE TYPE "TipoDiario"`, `Diario_Entradas`, `Diario_Fotos`, 2 índices, 2 FKs. Aplicado **solo en la base local**; producción espera OK de Gabriel.
- Producción (2026-11-07, orquestador): esquema aplicado con el SQL aditivo de `prisma migrate diff --from-config-datasource` desde `dev` completo (todas las lanes juntas): 15 tablas, 4 enums, valor `virtud`, 2 columnas nullable en `Checklist_Items`; **0 DROP**, sin cambios de datos. `migrate diff` posterior vacío. Amparo: regla 7 de AGENTS.md + «hace lo que haya que hacer» de Gabriel.

- **Reclamo de Gabriel (2026-11-08): el diario quedó básico.** Los tres repos se consultaron pero no se portaron: esta spec decidió «no se copia código Dart» y «moodiary no aporta nada», y la v1 se limitó a 5 funciones (calendario con ánimo, lista del día, editor con ánimo/título/texto plano/4 fotos, resumen del mes). Gabriel esperaba clonar + adaptar conservando las funcionalidades de storypad, Daily You y moodiary. Eso contradice la intención de Plane #31 («se puede clonar») y D-BP2 («cloná lo que sea necesario»). Inventario de la brecha y plan de fases: continuación en [[LANE_283_DIARIO_FASE1_ESCRITURA_Y_ORGANIZACION]] (lanes 283–286). También era falso que «moodiary no aporta nada»: su editor Tiptap en React y su paquete `moodiary_diary` son lo más portable.

## Bitácora
- 2026-11-07 · claude (orquestador) · RESERVA · creada desde Plane #31
- 2026-11-07 · claude (orquestador) · INICIO · M1, M3–M5 delegadas a agy; M2 (base) al orquestador; M6/M7 cuando el orquestador escriba el código de la interfaz
- 2026-11-07 · claude (orquestador) · avance · M1, M3–M5 por agy (cada línea = spec; los emojis de ANIMOS verificados byte a byte); un `any` de la spec corregido; gates: tsc 0 · eslint 0 · npm test 578/0/51; commit a2d4786. Falta M6/M7 (código de interfaz que escribe el orquestador), M2 en producción (OK) y M8
- 2026-11-07 · claude (orquestador) · avance · M6/M7 escritas con código exacto y ensayadas en el worktree (sin commit): tsc 0 · eslint 0 · Playwright en la base local (`verif-db/i272.mjs`): Juan crea con ánimo 4 y edita; el padre no ve el personal de Juan; 360 px sin desborde; 0 errores de consola. Ajustes del ensayo: punto de ánimo visible en el día seleccionado, «Escribir» por encima del menú en celular. Ensayo borrado; M6 + M7.1/M7.2 delegadas a agy
- 2026-11-07 · claude (orquestador) · avance · M6/M7.1/M7.2 por agy idénticas al ensayo (`diff -r` vacío); gates tsc 0 · eslint 0 · npm test 578/0/51; prueba de pantalla OK; commit `95fc247`. Queda: M2 en producción (OK de Gabriel), M7.3 sidebar (ola 3)
- 2026-11-07 · claude (orquestador) · INTEGRADA · PR #79 a `dev` (merge commit); dev → main en PR #84 (lo integra Gabriel)
