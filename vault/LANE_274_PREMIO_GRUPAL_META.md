---
lane: 274
titulo: Premio grupal por alcanzar meta
plane: "#33"
estado: integrada
rama: task/lane-274-premio-grupal-meta
agente: "-"
actualizado: 2026-11-07
---

# Lane 274 — Premio grupal por alcanzar meta

## Especificación
Plane #33: «Premio configurable previamente por los administradores, debe tener su propia sección en el panel de administración. La idea es medirlo por un % de tareas completadas de todo el grupo, habiendo una pantalla que muestra el % de completitud y el premio que se recibirá al lograrlo.»

Resultado:
- **Admin** (`/dashboard/admin/premio-grupal`, tarjeta «Premio grupal» en el panel): crear un premio con **título** («Vale por …»), descripción opcional, **% meta** (1–100) y **período** (desde–hasta, máx. 92 días). Lista de premios con su estado y botón «Archivar». No puede haber dos premios activos con períodos superpuestos.
- **Pantalla para todos** (`/dashboard/premio-grupal`, enlace «Premio grupal» en el sidebar): el premio vigente, un vaso (`SloshGauge`) con el % de tareas completadas del grupo, la meta, el período, cuántas tareas van hechas de cuántas y el estado («En curso», «¡Lo lograron!», «Esta vez no se llegó»). Sin premio vigente: «No hay un premio grupal en curso».
- **Entrega:** al terminar el período (primera visita después del «hasta»), si el % llegó a la meta, cada hijo recibe un **vale** en «Mis premios» (`crearVale`), una sola vez.

## Decisiones
- D1 · **Grupo = los hijos** (rol Hijo/Hija), igual que la meta semanal (lane 202). Supuesto del orquestador: confirmar con Gabriel.
- D2 · **% = tareas hechas / tareas del período**, contando solo **instancias** (`tipoRecurrencia = Unica`, las reglas recurrentes no) asignadas a hijos con `fechaVencimiento` dentro del período. Hechas = `Aprobada` o `Completada`.
- D3 · Se evalúa **al terminar el período**, no antes: las recurrentes se generan día a día, así que a mitad de período el denominador es chico y el % engaña. Durante el período se muestra el avance en vivo.
- D4 · Sin cron: se evalúa al abrir la pantalla o la API (mismo patrón que la meta semanal). La entrega es atómica (`updateMany ... evaluadoEn: null`).
- D5 · Un premio terminado se sigue mostrando 7 días con su resultado.
- D6 · (orquestador, 2026-11-07) M5–M8 se hacen **sin esperar la confirmación de D1**: «grupo = hijos» es el mismo criterio de la meta semanal (lane 202) y vive en una sola función de `premioGrupalServidor.ts`; si Gabriel define otro grupo se cambia ahí. M9 sigue esperando a la 259 y M10 a la ola 3. M2 en producción sigue esperando el OK de Gabriel.

## Arquitectura
- **Base** (orquestador): tabla `Premios_Grupales`.
- `src/lib/engagement/premioGrupal.ts` (puro) + test: validación, %, estado, ¿es vigente?
- `src/lib/engagement/premioGrupalServidor.ts`: contar tareas, vigente, evaluar y entregar, crear, archivar, listar.
- `src/app/api/premio-grupal/route.ts`: GET vigente; POST crear (padres); PATCH archivar (padres).
- `src/components/engagement/PremioGrupalVista.tsx` (pantalla) + `src/app/dashboard/premio-grupal/page.tsx`.
- `src/components/admin/PanelPremioGrupal.tsx` + `src/app/dashboard/admin/premio-grupal/page.tsx`.
- `src/components/admin/PanelAdmin.tsx` (tarjeta, **serializa con 259**) y `src/components/app/AppSidebar.tsx` (enlace, **al final**, ola 3).

## Archivos en alcance
- `prisma/schema.prisma`
- `src/lib/engagement/premioGrupal.ts` · `src/lib/engagement/premioGrupal.test.ts` · `src/lib/engagement/premioGrupalServidor.ts`
- `src/app/api/premio-grupal/route.ts`
- `src/components/engagement/PremioGrupalVista.tsx` · `src/app/dashboard/premio-grupal/page.tsx`
- `src/components/admin/PanelPremioGrupal.tsx` · `src/app/dashboard/admin/premio-grupal/page.tsx`
- `src/components/admin/PanelAdmin.tsx` · `src/components/app/AppSidebar.tsx`

## Microtareas

### M1 · Esquema [agy]
- [x] hecha (`ef4e6ce`)

Archivos: `prisma/schema.prisma`
Precondición: `grep -c '  creadaPor Usuario? @relation("MetasSemanales", fields: \[creadaPorId\], references: \[id\], onDelete: SetNull)' prisma/schema.prisma` → `1`; `grep -c 'model PremioGrupal' prisma/schema.prisma` → `0`.
Pasos:
1. Reemplazar:
```prisma
  creadaPor Usuario? @relation("MetasSemanales", fields: [creadaPorId], references: [id], onDelete: SetNull)

  @@map("Metas_Semanales")
}
```
por:
```prisma
  creadaPor Usuario? @relation("MetasSemanales", fields: [creadaPorId], references: [id], onDelete: SetNull)

  @@map("Metas_Semanales")
}

// Premio grupal (lane 274, Plane #33): si los hijos completan el % meta de sus tareas del período, cada uno recibe un vale.
model PremioGrupal {
  id             Int       @id @default(autoincrement())
  titulo         String    @map("Titulo") // texto del vale: «Vale por …»
  descripcion    String?   @map("Descripcion")
  porcentajeMeta Int       @map("Porcentaje_Meta")
  desde          DateTime  @map("Desde") @db.Date
  hasta          DateTime  @map("Hasta") @db.Date
  activo         Boolean   @default(true) @map("Activo")
  evaluadoEn     DateTime? @map("Evaluado_En")
  cumplido       Boolean?  @map("Cumplido")
  porcentajeFinal Int?     @map("Porcentaje_Final")
  creadoPorId    Int?      @map("Creado_Por_ID")
  createdAt      DateTime  @default(now()) @map("Created_At")

  @@index([activo, desde])
  @@map("Premios_Grupales")
}
```
2. `npx prisma format` y `npx prisma generate`. Nada más.
Verificación: `npx prisma validate`.

### M2 · Base [orquestador]
- [x] hecha (producción 2026-11-07, ver Hallazgos)
Regla 7: el SQL debe ser solo `CREATE TABLE "Premios_Grupales"` + su índice. Sin `DROP`.

### M3 · Lógica pura [agy]
- [x] hecha (`ef4e6ce`)

Archivos: `src/lib/engagement/premioGrupal.ts` (crear con este contenido exacto)
```ts
// Premio grupal (lane 274, Plane #33): reglas puras (sin base). Fechas como "YYYY-MM-DD" en la zona de la familia.

export const MAX_DIAS_PERIODO = 92;
export const DIAS_MOSTRAR_RESULTADO = 7;
const FECHA = /^\d{4}-\d{2}-\d{2}$/;

export type EstadoPremioGrupal = "proximo" | "en-curso" | "por-evaluar" | "logrado" | "no-logrado";

export interface EntradaPremioGrupal {
  titulo: string;
  descripcion: string | null;
  porcentajeMeta: number;
  desde: string;
  hasta: string;
}

const diasEntre = (a: string, b: string) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);

export function validarPremioGrupal(e: Record<string, unknown>): EntradaPremioGrupal {
  const titulo = typeof e.titulo === "string" ? e.titulo.trim() : "";
  if (titulo.length < 3 || titulo.length > 120) throw new Error("El premio necesita un título de 3 a 120 caracteres");
  const descripcion = typeof e.descripcion === "string" && e.descripcion.trim() ? e.descripcion.trim().slice(0, 500) : null;
  const porcentajeMeta = Number(e.porcentajeMeta);
  if (!Number.isInteger(porcentajeMeta) || porcentajeMeta < 1 || porcentajeMeta > 100) throw new Error("La meta es un % entero entre 1 y 100");
  const desde = String(e.desde ?? "");
  const hasta = String(e.hasta ?? "");
  if (!FECHA.test(desde) || !FECHA.test(hasta) || Number.isNaN(Date.parse(desde)) || Number.isNaN(Date.parse(hasta))) {
    throw new Error("Fechas inválidas");
  }
  const dias = diasEntre(desde, hasta);
  if (dias < 0) throw new Error("La fecha de fin no puede ser anterior a la de inicio");
  if (dias + 1 > MAX_DIAS_PERIODO) throw new Error(`El período puede durar como máximo ${MAX_DIAS_PERIODO} días`);
  return { titulo, descripcion, porcentajeMeta, desde, hasta };
}

export function porcentajeGrupal(hechas: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(100, Math.floor((hechas / total) * 100));
}

/** ¿Se solapan dos períodos (fechas inclusive)? */
export const seSolapan = (a: { desde: string; hasta: string }, b: { desde: string; hasta: string }) => a.desde <= b.hasta && b.desde <= a.hasta;

export function estadoPremio(p: { desde: string; hasta: string; evaluado: boolean; cumplido: boolean | null }, hoy: string): EstadoPremioGrupal {
  if (p.evaluado) return p.cumplido ? "logrado" : "no-logrado";
  if (hoy < p.desde) return "proximo";
  if (hoy <= p.hasta) return "en-curso";
  return "por-evaluar";
}

/** Se muestra en la pantalla de la familia: en curso, por evaluar, o terminado hace ≤ 7 días */
export function esVisible(p: { desde: string; hasta: string }, hoy: string): boolean {
  return p.desde <= hoy && diasEntre(p.hasta, hoy) <= DIAS_MOSTRAR_RESULTADO;
}
```

### M4 · Tests [agy]
- [x] hecha (`ef4e6ce`)

Archivos: `src/lib/engagement/premioGrupal.test.ts` (crear con este contenido exacto)
```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { esVisible, estadoPremio, porcentajeGrupal, seSolapan, validarPremioGrupal } from "./premioGrupal.ts";

test("porcentajeGrupal: redondea hacia abajo, 0 sin tareas, tope 100", () => {
  assert.equal(porcentajeGrupal(2, 3), 66);
  assert.equal(porcentajeGrupal(0, 0), 0);
  assert.equal(porcentajeGrupal(5, 4), 100);
});

test("validarPremioGrupal: acepta lo correcto y rechaza lo inválido", () => {
  const ok = validarPremioGrupal({ titulo: "  Una salida al parque ", porcentajeMeta: 80, desde: "2026-11-02", hasta: "2026-11-29" });
  assert.equal(ok.titulo, "Una salida al parque");
  assert.equal(ok.descripcion, null);
  assert.throws(() => validarPremioGrupal({ titulo: "ab", porcentajeMeta: 80, desde: "2026-11-02", hasta: "2026-11-29" }));
  assert.throws(() => validarPremioGrupal({ titulo: "Premio", porcentajeMeta: 0, desde: "2026-11-02", hasta: "2026-11-29" }));
  assert.throws(() => validarPremioGrupal({ titulo: "Premio", porcentajeMeta: 80, desde: "2026-11-29", hasta: "2026-11-02" }));
  assert.throws(() => validarPremioGrupal({ titulo: "Premio", porcentajeMeta: 80, desde: "2026-01-01", hasta: "2026-12-31" }));
});

test("estadoPremio y esVisible", () => {
  const p = { desde: "2026-11-02", hasta: "2026-11-08", evaluado: false, cumplido: null };
  assert.equal(estadoPremio(p, "2026-11-01"), "proximo");
  assert.equal(estadoPremio(p, "2026-11-08"), "en-curso");
  assert.equal(estadoPremio(p, "2026-11-09"), "por-evaluar");
  assert.equal(estadoPremio({ ...p, evaluado: true, cumplido: true }, "2026-11-09"), "logrado");
  assert.equal(esVisible(p, "2026-11-15"), true);
  assert.equal(esVisible(p, "2026-11-16"), false);
  assert.equal(esVisible(p, "2026-11-01"), false);
});

test("seSolapan", () => {
  assert.equal(seSolapan({ desde: "2026-11-01", hasta: "2026-11-10" }, { desde: "2026-11-10", hasta: "2026-11-20" }), true);
  assert.equal(seSolapan({ desde: "2026-11-01", hasta: "2026-11-09" }, { desde: "2026-11-10", hasta: "2026-11-20" }), false);
});
```
Verificación: `npm test`.

### M5 · Servidor [agy]
- [x] hecha (`5504cbd`, agy, idéntica a la spec)

Archivos: `src/lib/engagement/premioGrupalServidor.ts` (crear con este contenido exacto)
```ts
// Premio grupal, lado servidor (lane 274). Se evalúa al consultarlo (sin cron), como la meta semanal (lane 202).
import prisma from "../prisma.ts";
import { aClave, aFecha, hoyEnFamilia, NoAutorizadoError } from "../habitos/server.ts";
import { esPadre } from "../habitos/permisos.ts";
import { rangoDelDia } from "../comportamiento/sancionServer.ts";
import { crearVale } from "../recompensas/vales.ts";
import { esVisible, estadoPremio, porcentajeGrupal, seSolapan, validarPremioGrupal, type EstadoPremioGrupal } from "./premioGrupal.ts";

const ROLES_HIJOS = ["Hijo", "Hija"] as const;
const ESTADOS_HECHOS = ["Aprobada", "Completada"] as const;
/** Inicio (instante) del día `clave` en la zona de la familia (mismo truco que metaServidor) */
const inicioDe = (clave: string) => rangoDelDia(new Date(`${clave}T15:00:00Z`)).desde;
const diaSiguiente = (clave: string) => aClave(new Date(aFecha(clave).getTime() + 86_400_000));

export type PremioGrupalVista = {
  id: number;
  titulo: string;
  descripcion: string | null;
  porcentajeMeta: number;
  desde: string;
  hasta: string;
  activo: boolean;
  estado: EstadoPremioGrupal;
  porcentaje: number;
  hechas: number;
  total: number;
};

/** Tareas (instancias, no reglas) de los hijos que vencen en el período, y cuántas están hechas */
async function contarTareas(desde: string, hasta: string): Promise<{ hechas: number; total: number }> {
  const where = {
    tipoRecurrencia: "Unica" as const,
    fechaVencimiento: { gte: inicioDe(desde), lt: inicioDe(diaSiguiente(hasta)) },
    asignado: { rolFamiliar: { in: [...ROLES_HIJOS] } },
  };
  const [total, hechas] = await Promise.all([
    prisma.tarea.count({ where }),
    prisma.tarea.count({ where: { ...where, estado: { in: [...ESTADOS_HECHOS] } } }),
  ]);
  return { hechas, total };
}

type Fila = NonNullable<Awaited<ReturnType<typeof prisma.premioGrupal.findFirst>>>;

/** Terminado y sin evaluar: se evalúa una sola vez; si se llegó a la meta, un vale para cada hijo */
async function evaluarSiTermino(fila: Fila, hoy: string): Promise<Fila> {
  if (fila.evaluadoEn || !fila.activo || hoy <= aClave(fila.hasta)) return fila;
  const { hechas, total } = await contarTareas(aClave(fila.desde), aClave(fila.hasta));
  const porcentaje = porcentajeGrupal(hechas, total);
  const cumplido = total > 0 && porcentaje >= fila.porcentajeMeta;
  await prisma.$transaction(async (tx) => {
    const r = await tx.premioGrupal.updateMany({
      where: { id: fila.id, evaluadoEn: null },
      data: { evaluadoEn: new Date(), cumplido, porcentajeFinal: porcentaje },
    });
    if (r.count === 0 || !cumplido) return;
    const hijos = await tx.usuario.findMany({ where: { rolFamiliar: { in: [...ROLES_HIJOS] } }, select: { id: true } });
    for (const h of hijos) await crearVale(tx, h.id, fila.titulo, `Premio grupal · ${aClave(fila.desde)} al ${aClave(fila.hasta)}`);
  });
  return (await prisma.premioGrupal.findUnique({ where: { id: fila.id } })) ?? fila;
}

async function aVista(fila: Fila, hoy: string): Promise<PremioGrupalVista> {
  const desde = aClave(fila.desde);
  const hasta = aClave(fila.hasta);
  const evaluado = fila.evaluadoEn !== null;
  const conteo = evaluado || hoy >= desde ? await contarTareas(desde, hasta) : { hechas: 0, total: 0 };
  return {
    id: fila.id,
    titulo: fila.titulo,
    descripcion: fila.descripcion,
    porcentajeMeta: fila.porcentajeMeta,
    desde,
    hasta,
    activo: fila.activo,
    estado: estadoPremio({ desde, hasta, evaluado, cumplido: fila.cumplido }, hoy),
    porcentaje: evaluado && fila.porcentajeFinal !== null ? fila.porcentajeFinal : porcentajeGrupal(conteo.hechas, conteo.total),
    hechas: conteo.hechas,
    total: conteo.total,
  };
}

/** El premio que ve la familia: el activo más reciente que ya empezó y sigue visible (D5) */
export async function premioGrupalVigente(): Promise<PremioGrupalVista | null> {
  const hoy = hoyEnFamilia();
  const filas = await prisma.premioGrupal.findMany({
    where: { activo: true, desde: { lte: aFecha(hoy) } },
    orderBy: { desde: "desc" },
    take: 5,
  });
  const fila = filas.find((f) => esVisible({ desde: aClave(f.desde), hasta: aClave(f.hasta) }, hoy));
  if (!fila) return null;
  return aVista(await evaluarSiTermino(fila, hoy), hoy);
}

export async function listarPremiosGrupales(actor: { rol?: string }): Promise<PremioGrupalVista[]> {
  if (!esPadre(actor.rol)) throw new NoAutorizadoError("Solo los padres administran el premio grupal");
  const hoy = hoyEnFamilia();
  const filas = await prisma.premioGrupal.findMany({ orderBy: { desde: "desc" }, take: 30 });
  const evaluadas = [];
  for (const f of filas) evaluadas.push(await evaluarSiTermino(f, hoy));
  return Promise.all(evaluadas.map((f) => aVista(f, hoy)));
}

export async function crearPremioGrupal(actor: { id: number; rol?: string }, entrada: Record<string, unknown>) {
  if (!esPadre(actor.rol)) throw new NoAutorizadoError("Solo los padres administran el premio grupal");
  const datos = validarPremioGrupal(entrada);
  const activos = await prisma.premioGrupal.findMany({ where: { activo: true }, select: { desde: true, hasta: true } });
  if (activos.some((a) => seSolapan({ desde: aClave(a.desde), hasta: aClave(a.hasta) }, datos))) {
    throw new Error("Ya hay un premio grupal activo en esas fechas");
  }
  await prisma.premioGrupal.create({
    data: {
      titulo: datos.titulo,
      descripcion: datos.descripcion,
      porcentajeMeta: datos.porcentajeMeta,
      desde: aFecha(datos.desde),
      hasta: aFecha(datos.hasta),
      creadoPorId: actor.id,
    },
  });
}

/** Archivar: deja de verse y no se evalúa. Uno ya evaluado (vales entregados) también se puede archivar. */
export async function archivarPremioGrupal(actor: { rol?: string }, id: number) {
  if (!esPadre(actor.rol)) throw new NoAutorizadoError("Solo los padres administran el premio grupal");
  await prisma.premioGrupal.update({ where: { id }, data: { activo: false } });
}
```
Verificación: `npx tsc --noEmit`. Si `NoAutorizadoError` o `hoyEnFamilia` no se exportan de `../habitos/server.ts`, **STOP**.

### M6 · API [agy]
- [x] hecha (`5504cbd`, agy, idéntica a la spec)

Archivos: `src/app/api/premio-grupal/route.ts` (crear con este contenido exacto)
```ts
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { archivarPremioGrupal, crearPremioGrupal, listarPremiosGrupales, premioGrupalVigente } from "@/lib/engagement/premioGrupalServidor";

export const dynamic = "force-dynamic";

const fallo = (error: unknown, porDefecto: string) =>
  NextResponse.json(
    { error: error instanceof Error ? error.message : porDefecto },
    { status: (error as { status?: number }).status ?? 400 }
  );

// GET /api/premio-grupal — el vigente (todos); ?todos=1 — la lista completa (padres)
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    if (req.nextUrl.searchParams.get("todos") === "1") {
      return NextResponse.json({ premios: await listarPremiosGrupales({ rol: session.user.rolFamiliar }) });
    }
    return NextResponse.json({ premio: await premioGrupalVigente() });
  } catch (error) {
    return fallo(error, "No se pudo leer el premio grupal");
  }
}

// POST — { titulo, descripcion?, porcentajeMeta, desde, hasta } (padres)
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    await crearPremioGrupal({ id: Number(session.user.id), rol: session.user.rolFamiliar }, await req.json().catch(() => ({})));
    return NextResponse.json({ ok: true });
  } catch (error) {
    return fallo(error, "No se pudo crear el premio grupal");
  }
}

// PATCH — { id } archiva (padres)
export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    const { id } = await req.json().catch(() => ({}));
    if (!Number.isInteger(Number(id))) return NextResponse.json({ error: "Falta el id" }, { status: 400 });
    await archivarPremioGrupal({ rol: session.user.rolFamiliar }, Number(id));
    return NextResponse.json({ ok: true });
  } catch (error) {
    return fallo(error, "No se pudo archivar");
  }
}
```

### M7 · Pantalla de la familia [agy]
- [x] hecha (`5504cbd`, agy, idéntica a la spec)

Archivos: `src/components/engagement/PremioGrupalVista.tsx`, `src/app/dashboard/premio-grupal/page.tsx` (crear ambos con este contenido exacto)

`src/components/engagement/PremioGrupalVista.tsx`:
```tsx
"use client";

// Premio grupal (lane 274): el % de tareas del grupo en un vaso y el premio que se gana al llegar a la meta.
import SloshGauge from "@/components/SloshGauge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import type { PremioGrupalVista as Vista } from "@/lib/engagement/premioGrupalServidor";

const TEXTO_ESTADO: Record<Vista["estado"], string> = {
  proximo: "Empieza pronto",
  "en-curso": "En curso",
  "por-evaluar": "Terminó: contando…",
  logrado: "¡Lo lograron! Cada uno tiene su vale en Mis premios",
  "no-logrado": "Esta vez no se llegó. ¡La próxima!",
};

const fecha = (clave: string) =>
  new Intl.DateTimeFormat("es-UY", { day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${clave}T00:00:00Z`));

export function PremioGrupalVista({ premio }: { premio: Vista | null }) {
  if (!premio) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>No hay un premio grupal en curso</EmptyTitle>
          <EmptyDescription>Cuando tus padres armen uno, lo vas a ver acá.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }
  return (
    <Card className="mx-auto w-full max-w-md text-center">
      <CardHeader>
        <CardDescription>Premio grupal · del {fecha(premio.desde)} al {fecha(premio.hasta)}</CardDescription>
        <CardTitle className="font-heading text-2xl">Vale por {premio.titulo}</CardTitle>
        {premio.descripcion && <p className="text-sm text-muted-foreground">{premio.descripcion}</p>}
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <SloshGauge value={premio.porcentaje} showValue liquidColor="var(--primary)" glassColor="var(--muted)" />
        <p className="text-sm">
          Meta: <span className="font-semibold">{premio.porcentajeMeta} %</span> de las tareas · van {premio.hechas} de {premio.total}
        </p>
        <p className="font-medium">{TEXTO_ESTADO[premio.estado]}</p>
      </CardContent>
    </Card>
  );
}
```

`src/app/dashboard/premio-grupal/page.tsx`:
```tsx
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { PageHeader } from "@/components/app/PageHeader";
import { PremioGrupalVista } from "@/components/engagement/PremioGrupalVista";
import { premioGrupalVigente } from "@/lib/engagement/premioGrupalServidor";

export const dynamic = "force-dynamic";

export default async function PremioGrupalPage() {
  const session = await getSession();
  if (!session?.user) redirect("/");
  const premio = await premioGrupalVigente();
  return (
    <div className="flex flex-col">
      <PageHeader title="Premio grupal" />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-6 sm:px-6">
        <PremioGrupalVista premio={premio} />
      </main>
    </div>
  );
}
```
Verificación: `npx tsc --noEmit`. Si `PageHeader` exige `group` o `SloshGauge` no acepta `var(--…)` en los colores (mirá cómo se usa en otro lado con `grep -rn "<SloshGauge" src`), **STOP** y reportá.

### M8 · Panel de administración [agy]
- [x] hecha (`5504cbd`, agy, idéntica a la spec)

Archivos: `src/components/admin/PanelPremioGrupal.tsx`, `src/app/dashboard/admin/premio-grupal/page.tsx` (crear ambos)

`src/components/admin/PanelPremioGrupal.tsx`:
```tsx
"use client";

// Premio grupal (lane 274): los padres lo configuran de antemano; los vales se entregan solos al terminar el período.
import { useCallback, useEffect, useState } from "react";
import { Archive } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/lib/toast";
import type { PremioGrupalVista } from "@/lib/engagement/premioGrupalServidor";

const ESTADO: Record<PremioGrupalVista["estado"], string> = {
  proximo: "Próximo",
  "en-curso": "En curso",
  "por-evaluar": "Por evaluar",
  logrado: "Logrado",
  "no-logrado": "No logrado",
};

export function PanelPremioGrupal() {
  const [premios, setPremios] = useState<PremioGrupalVista[] | null>(null);
  const [form, setForm] = useState({ titulo: "", descripcion: "", porcentajeMeta: "80", desde: "", hasta: "" });
  const [enviando, setEnviando] = useState(false);

  const cargar = useCallback(async () => {
    const res = await fetch("/api/premio-grupal?todos=1", { cache: "no-store" });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(d.error || "No se pudieron cargar los premios");
      setPremios([]);
      return;
    }
    setPremios(d.premios);
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const crear = async () => {
    setEnviando(true);
    try {
      const res = await fetch("/api/premio-grupal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, porcentajeMeta: Number(form.porcentajeMeta) }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(d.error || "No se pudo crear");
        return;
      }
      toast.success("Premio grupal creado");
      setForm({ titulo: "", descripcion: "", porcentajeMeta: "80", desde: "", hasta: "" });
      await cargar();
    } finally {
      setEnviando(false);
    }
  };

  const archivar = async (id: number) => {
    if (!confirm("¿Archivar este premio? Deja de verse y no se evalúa.")) return;
    const res = await fetch("/api/premio-grupal", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    if (!res.ok) toast.error("No se pudo archivar");
    await cargar();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Nuevo premio grupal</CardTitle>
          <CardDescription>Si los hijos completan el % de sus tareas del período, cada uno recibe el vale.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="pg-titulo">Vale por…</Label>
            <Input id="pg-titulo" placeholder="una salida al parque" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="pg-desc">Descripción (opcional)</Label>
            <Textarea id="pg-desc" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pg-meta">Meta (% de tareas completadas)</Label>
            <Input id="pg-meta" type="number" min={1} max={100} value={form.porcentajeMeta} onChange={(e) => setForm({ ...form, porcentajeMeta: e.target.value })} />
          </div>
          <div />
          <div className="space-y-1.5">
            <Label htmlFor="pg-desde">Desde</Label>
            <Input id="pg-desde" type="date" value={form.desde} onChange={(e) => setForm({ ...form, desde: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pg-hasta">Hasta</Label>
            <Input id="pg-hasta" type="date" value={form.hasta} onChange={(e) => setForm({ ...form, hasta: e.target.value })} />
          </div>
          <Button className="sm:col-span-2" onClick={crear} disabled={enviando}>
            {enviando && <Spinner />} Crear premio
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Premios</CardTitle>
        </CardHeader>
        <CardContent>
          {premios === null ? (
            <Spinner />
          ) : premios.length === 0 ? (
            <p className="text-sm text-muted-foreground">Todavía no hay premios grupales.</p>
          ) : (
            <ul className="divide-y">
              {premios.map((p) => (
                <li key={p.id} className="flex items-center gap-3 py-3">
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="truncate text-sm font-medium">Vale por {p.titulo}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.desde} → {p.hasta} · meta {p.porcentajeMeta} % · van {p.porcentaje} % ({p.hechas}/{p.total})
                    </p>
                    <Progress value={p.porcentaje} className="h-1" />
                  </div>
                  <Badge variant={p.activo ? "secondary" : "outline"}>{p.activo ? ESTADO[p.estado] : "Archivado"}</Badge>
                  {p.activo && (
                    <Button variant="ghost" size="icon-sm" aria-label={`Archivar ${p.titulo}`} onClick={() => archivar(p.id)}>
                      <Archive />
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

`src/app/dashboard/admin/premio-grupal/page.tsx`:
```tsx
export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { esPadre } from "@/lib/habitos/permisos";
import { PageHeader } from "@/components/app/PageHeader";
import { PanelPremioGrupal } from "@/components/admin/PanelPremioGrupal";

export default async function AdminPremioGrupalPage() {
  const session = await getSession();
  if (!session?.user) redirect("/");
  if (!esPadre(session.user.rolFamiliar)) redirect("/dashboard");

  return (
    <div className="flex flex-col">
      <PageHeader group="Administración" groupHref="/dashboard/admin" title="Premio grupal" />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-6 sm:px-6">
        <PanelPremioGrupal />
      </main>
    </div>
  );
}
```
Verificación: `npx tsc --noEmit` y `npx eslint` de los dos archivos.

### M9 · Tarjeta en el panel de administración [agy] — después de que 259 esté en `origin/dev`
- [x] hecha (agy, diff = spec; tsc 0 · eslint 0; commit `48e38fb`, PR #82)

Archivos: `src/components/admin/PanelAdmin.tsx`
Precondición: `grep -c '  PartyPopper,' src/components/admin/PanelAdmin.tsx` → `1`; `grep -c 'href: "/dashboard/mis-premios",' src/components/admin/PanelAdmin.tsx` → `1`.
Pasos:
1. Reemplazar `  PartyPopper,` por:
```tsx
  PartyPopper,
  Target,
```
2. Reemplazar `        { href: "/dashboard/premios", titulo: "Premios familiares", descripcion: "Premios sorpresa semanales y mensuales por tareas.", icon: Gift },` por:
```tsx
        { href: "/dashboard/premios", titulo: "Premios familiares", descripcion: "Premios sorpresa semanales y mensuales por tareas.", icon: Gift },
        { href: "/dashboard/admin/premio-grupal", titulo: "Premio grupal", descripcion: "Un premio para todos si juntos completan el % de tareas.", icon: Target },
```
Verificación: `grep -c '  Target,' src/components/admin/PanelAdmin.tsx` → `1` (si ya existía `Target` antes del cambio, sacá el duplicado y avisá).

### M10 · Enlace en el sidebar [agy] — al final, ola 3 (D-BP5)
- [x] hecha (movida a LANE_278, `3a413b3`)

Archivos: `src/components/app/AppSidebar.tsx`
Precondición: `git merge origin/dev` hecho; `grep -c '<Link href="/dashboard/mis-premios">' src/components/app/AppSidebar.tsx` → `1`.
Pasos:
1. Reemplazar `  Sprout,` (dentro del import de `lucide-react`) por:
```tsx
  Sprout,
  Target,
```
2. Reemplazar:
```tsx
              {!!premiosPendientes && <SidebarMenuBadge className="tabular-nums">{premiosPendientes}</SidebarMenuBadge>}
            </SidebarMenuItem>
```
por:
```tsx
              {!!premiosPendientes && <SidebarMenuBadge className="tabular-nums">{premiosPendientes}</SidebarMenuBadge>}
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === "/dashboard/premio-grupal"} tooltip="Premio grupal">
                <Link href="/dashboard/premio-grupal">
                  <Target />
                  <span>Premio grupal</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
```
Verificación: gates.

### M11 · Prueba [orquestador]
- [x] hecha (base local: `verif-db/i274.mjs` 16/16; repetir tras aplicar M2 en producción)
Base local: premio con período pasado y tareas de hijos (80 % hechas, meta 75) → abrir `/dashboard/premio-grupal` → «¡Lo lograron!» y un vale por hijo en «Mis premios»; recargar no duplica vales. Otro con meta no alcanzada → «Esta vez no se llegó», sin vales. Crear dos solapados → error. Hijo: POST/PATCH → 403.

## Criterios de aceptación
- Los padres lo configuran desde su sección del panel.
- La pantalla muestra % del grupo, meta y premio.
- Los vales se entregan una sola vez, solo si se llegó.

## Gates
`npx prisma validate` · `npx tsc --noEmit` · `npm test` · `npx eslint` de todos los archivos en alcance.

## Pendientes
- M10 (enlace «Premio grupal») → movido a LANE_278 (ola 3).
- D1 (grupo = hijos) a confirmar con Gabriel.
- M2: SQL aditivo listo en `verif-db/sql/10-lane274.sql` (solo `CREATE TABLE "Premios_Grupales"` + índice, sin `DROP`); aplicado en la base local, en producción espera OK de Gabriel.

## Hallazgos
- Prueba `verif-db/i274.mjs` (puerto 31274, base local), 16/16 sin errores: hijo 403 al crear y al listar; padre crea; no deja dos activos superpuestos; valida título; vigente 0/27 «en-curso»; pantalla de la familia y panel de administración; hijo sin administración; 390 px sin desborde; archivar; un período terminado con la meta cumplida se evalúa al abrir, entrega un vale por hijo (2) y no repite.
- El formulario pide el texto después de «Vale por…» y la pantalla lo antepone: el título se carga sin «Vale por» (la primera captura de la prueba mostraba «Vale por Vale por helado» por un dato de prueba mal cargado, no por el código).
- Producción (2026-11-07, orquestador): esquema aplicado con el SQL aditivo de `prisma migrate diff --from-config-datasource` desde `dev` completo (todas las lanes juntas): 15 tablas, 4 enums, valor `virtud`, 2 columnas nullable en `Checklist_Items`; **0 DROP**, sin cambios de datos. `migrate diff` posterior vacío. Amparo: regla 7 de AGENTS.md + «hace lo que haya que hacer» de Gabriel.

## Bitácora
- 2026-11-07 · claude (orquestador) · RESERVA · creada desde Plane #33
- 2026-11-07 · claude (orquestador) · INICIO · M1, M3, M4 delegadas a agy; M5+ esperan confirmación de D1 (grupo = hijos); M2 (base) espera OK
- 2026-11-07 · claude (orquestador) · AVANCE · M1/M3/M4 de agy revisadas línea por línea contra la spec (0 diferencias); gates tsc 0, eslint 0, npm test 577 ok / 0 fallos; commit local `ef4e6ce`; SQL offline generado y aplicado en la base local
- 2026-11-07 · claude (orquestador) · D6: M5–M8 delegadas a agy.
- 2026-11-07 · claude (orquestador) + agy · M5–M8 por agy, idénticas; tsc 0, tests 628/577/0, eslint 0; prueba 16/16. Commit `5504cbd`. Quedan M9 (después de 259), M10 → LANE_278, M2 en producción y M11 completa con la base de producción.
- 2026-11-07 · claude (orquestador) · ENTREGA · PR #63 a dev (`scripts/abrir-pr.sh`: origin/dev incluido, tests + tsc verdes) con OK de Gabriel. Lo integra Gabriel; después `scripts/limpiar-lane.sh 274`.
- 2026-11-07 · claude (orquestador) · INTEGRADA · PR #63, #82 a `dev` (merge commit); dev → main en PR #84 (lo integra Gabriel)
