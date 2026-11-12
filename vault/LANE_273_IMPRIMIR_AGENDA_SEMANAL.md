---
lane: 273
titulo: Imprimir la agenda semanal
plane: "#32"
estado: integrada
rama: task/lane-273-imprimir-agenda-semanal
agente: "claude (orquestador) + agy"
actualizado: 2026-11-07
---

# Lane 273 — Imprimir la agenda semanal

## Especificación
Plane #32: «que el contenido a imprimir sea un calendario semanal con cada tarea detallada del usuario que va a imprimir y no de todos. La idea es que el usuario pueda mirar el papel impreso y saber todo lo que debe hacer en la semana, en qué día, a qué hora.»

Resultado:
- Página nueva `/dashboard/imprimir/agenda-semanal` con una **hoja A4 apaisada**: 7 columnas (lunes a domingo). En cada día van las tareas **del usuario que imprime**, ordenadas por hora. Cada tarea muestra la hora (o «Sin hora»), el título, la duración estimada, la descripción, los ítems del checklist con casilla vacía `☐` y con quién la comparte.
- Arriba: «Agenda de {nombre} · semana del {lunes} al {domingo}». En pantalla (no se imprimen) van los botones «‹ Semana anterior», «Semana siguiente ›» e «Imprimir».
- Un padre puede imprimir la de un hijo con `?usuarioId=N` (mismo permiso que `/dashboard/perfil`). Un hijo solo imprime la suya.
- Acceso: botón con ícono de impresora en el encabezado del panel de tareas (`TaskWorkspace`), al lado del botón «Agenda».

## Decisiones
- D1 · La proyección se hace **en el navegador** (componente cliente), igual que `MissionCalendar`. `proyectarEventosCalendario` usa la hora local; en el servidor (Vercel, UTC) correría tres horas corrida.
- D2 · Se reutiliza `proyectarEventosCalendario(..., { usuarioId })` (incluye recurrentes y rotativas proyectadas). No se escribe otra lógica de recurrencia.
- D3 · La página apaisada usa una **página CSS con nombre** (`@page agenda-semanal`) para no tocar el A4 vertical de los reportes de Homeschooling.
- D4 · Se trae solo lo que necesita la proyección: las tareas donde el usuario es el `asignado` y las reglas rotativas (cualquier responsable). Para no equivocarse se traen todas las tareas no borradas y se filtra en la proyección por `usuarioId` (como hace `/agenda`).
- D5 · (orquestador, 2026-11-07) **El CSS apaisado va en `src/components/tasks/agendaSemanal.css`, importado por `AgendaSemanalImprimible`, no en `globals.css`.** La lane 271 (abierta) modifica `globals.css` y D-BP5 prohíbe dos lanes abiertas sobre el mismo archivo; así la 273 arranca sin esperar a que la 271 entre a `dev`. El App Router de Next acepta CSS global importado desde un componente. Reemplaza a M3.
- D6 · (orquestador, 2026-11-07, hallado en el ensayo) **Al navegador viajan solo las tareas del usuario impreso.** La spec mandaba todas las tareas de la familia al componente cliente: quedaban en el HTML (un hijo veía las de sus hermanos en el código fuente), cuando `/dashboard` manda solo lo necesario. El servidor sigue trayendo todo (D4) y filtra antes de serializar: las asignadas al usuario, las demás filas de sus tareas compartidas (mismo `grupoTareaId`, para «Con …») y las rotativas donde figura en `responsablesIds`.

## Arquitectura
- `src/lib/agendaSemanal.ts` (nuevo, puro): `lunesDe(fecha)`, `armarSemana(eventos, lunes, usuarioId)` → 7 `DiaAgenda`.
- `src/lib/agendaSemanal.test.ts` (nuevo).
- `src/app/dashboard/imprimir/agenda-semanal/page.tsx` (nuevo, servidor): sesión, permiso y datos.
- `src/components/tasks/AgendaSemanalImprimible.tsx` (nuevo, cliente): navegación de semanas, proyección y hoja.
- `src/components/tasks/agendaSemanal.css` (nuevo, D5): página con nombre apaisada.
- `src/components/tasks/TaskWorkspace.tsx`: botón de imprimir. **Serializa con 261 y 262** (mismo archivo): esta microtarea va cuando 261 esté en `origin/dev`.

## Archivos en alcance
- `src/lib/agendaSemanal.ts` (crear)
- `src/lib/agendaSemanal.test.ts` (crear)
- `src/app/dashboard/imprimir/agenda-semanal/page.tsx` (crear)
- `src/components/tasks/AgendaSemanalImprimible.tsx` (crear)
- `src/components/tasks/agendaSemanal.css` (crear, D5)
- `src/components/tasks/TaskWorkspace.tsx` (modificar, M6)

## Microtareas

### M1 · Lógica pura [agy]
- [x] hecha (`bd68bd5`)

Archivos: `src/lib/agendaSemanal.ts` (crear con este contenido exacto)
```ts
// Agenda semanal imprimible (lane 273, Plane #32): agrupa los eventos proyectados de UN usuario en los 7 días de la semana.
import type { EventoCalendarioProyectado } from "./proyeccionCalendario.ts";

export interface ItemAgenda {
  id: string;
  hora: string | null; // "HH:MM" en hora local; null = sin hora
  titulo: string;
  descripcion: string | null;
  duracionMin: number | null;
  checklist: string[];
  companeros: string[]; // los otros responsables, si la tarea es compartida
}

export interface DiaAgenda {
  fecha: Date;
  items: ItemAgenda[];
}

const dosDigitos = (n: number) => String(n).padStart(2, "0");

/** Lunes 00:00 (hora local) de la semana de `fecha`. */
export function lunesDe(fecha: Date): Date {
  const d = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate(), 0, 0, 0, 0);
  const desdeLunes = (d.getDay() + 6) % 7; // domingo=6, lunes=0
  d.setDate(d.getDate() - desdeLunes);
  return d;
}

/** Domingo 23:59:59.999 (hora local) de la semana que empieza en `lunes`. */
export function domingoDe(lunes: Date): Date {
  return new Date(lunes.getFullYear(), lunes.getMonth(), lunes.getDate() + 6, 23, 59, 59, 999);
}

function mismoDia(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function armarSemana(eventos: EventoCalendarioProyectado[], lunes: Date, usuarioId: number): DiaAgenda[] {
  const dias: DiaAgenda[] = Array.from({ length: 7 }, (_, i) => ({
    fecha: new Date(lunes.getFullYear(), lunes.getMonth(), lunes.getDate() + i),
    items: [],
  }));

  for (const ev of eventos) {
    const dia = dias.find((d) => mismoDia(d.fecha, ev.start));
    if (!dia) continue;
    const res = ev.resource ?? {};
    const seg = Number(res.tiempoEjecucionEstimadoSeg) || 0;
    const asignados: { id: number; nombre: string }[] = Array.isArray(res.asignados) ? res.asignados : [];
    const checklist: { texto: string }[] = Array.isArray(res.checklistItems) ? res.checklistItems : [];
    dia.items.push({
      id: String(ev.id),
      hora: ev.allDay ? null : `${dosDigitos(ev.start.getHours())}:${dosDigitos(ev.start.getMinutes())}`,
      titulo: String(ev.title ?? res.titulo ?? ""),
      descripcion: res.descripcion ? String(res.descripcion) : null,
      duracionMin: seg > 0 ? Math.round(seg / 60) : null,
      checklist: checklist.map((c) => String(c.texto)),
      companeros: asignados.filter((a) => Number(a.id) !== usuarioId).map((a) => a.nombre),
    });
  }

  // Con hora primero (de más temprano a más tarde); las «sin hora» al final, por título
  for (const dia of dias) {
    dia.items.sort((a, b) => {
      if (a.hora && b.hora) return a.hora.localeCompare(b.hora);
      if (a.hora) return -1;
      if (b.hora) return 1;
      return a.titulo.localeCompare(b.titulo, "es");
    });
  }
  return dias;
}
```
Verificación: `npx tsc --noEmit`.

### M2 · Tests [agy]
- [x] hecha (`bd68bd5`)

Archivos: `src/lib/agendaSemanal.test.ts` (crear con este contenido exacto)
```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { armarSemana, domingoDe, lunesDe } from "./agendaSemanal.ts";

test("lunesDe: un domingo devuelve el lunes anterior; un lunes se devuelve a sí mismo", () => {
  const domingo = new Date(2026, 10, 8, 15, 30); // dom 8/11/2026
  assert.equal(lunesDe(domingo).getTime(), new Date(2026, 10, 2).getTime());
  const lunes = new Date(2026, 10, 2, 9, 0);
  assert.equal(lunesDe(lunes).getTime(), new Date(2026, 10, 2).getTime());
});

test("domingoDe: último instante del domingo", () => {
  assert.equal(domingoDe(new Date(2026, 10, 2)).getTime(), new Date(2026, 10, 8, 23, 59, 59, 999).getTime());
});

test("armarSemana: ubica por día, ordena por hora y deja las sin hora al final", () => {
  const lunes = new Date(2026, 10, 2);
  const ev = (id: string, start: Date, allDay: boolean, resource: Record<string, unknown> = {}) => ({ id, title: id, start, end: start, allDay, resource });
  const dias = armarSemana(
    [
      ev("tarde", new Date(2026, 10, 3, 18, 0), false),
      ev("sin-hora", new Date(2026, 10, 3), true),
      ev("mañana", new Date(2026, 10, 3, 8, 5), false, {
        tiempoEjecucionEstimadoSeg: 1800,
        checklistItems: [{ texto: "Tender la cama" }],
        asignados: [{ id: 7, nombre: "Ana" }, { id: 9, nombre: "Luis" }],
      }),
      ev("otra-semana", new Date(2026, 10, 10, 8, 0), false),
    ],
    lunes,
    7,
  );
  assert.equal(dias.length, 7);
  assert.deepEqual(dias[1].items.map((i) => i.id), ["mañana", "tarde", "sin-hora"]);
  assert.equal(dias[1].items[0].hora, "08:05");
  assert.equal(dias[1].items[0].duracionMin, 30);
  assert.deepEqual(dias[1].items[0].checklist, ["Tender la cama"]);
  assert.deepEqual(dias[1].items[0].companeros, ["Luis"]);
  assert.equal(dias[1].items[2].hora, null);
  assert.equal(dias.flatMap((d) => d.items).length, 3);
});
```
Verificación: `npm test` (los 3 tests nuevos en verde).

### M3 · CSS de impresión apaisada (D5: archivo propio, no `globals.css`) [agy]
- [x] hecha (`bd68bd5`)

Archivos: `src/components/tasks/agendaSemanal.css` (crear con este contenido exacto)
```css
/* Agenda semanal imprimible (lane 273, D5): A4 apaisada con una página CSS con nombre,
   sin tocar el A4 vertical de los reportes de Homeschooling (globals.css). */
.hoja-agenda-semanal {
  page: agenda-semanal;
}

@page agenda-semanal {
  size: A4 landscape;
  margin: 1cm;
}
```

### M4 · Componente imprimible [agy]
- [x] hecha (`bd68bd5`)

Archivos: `src/components/tasks/AgendaSemanalImprimible.tsx` (crear con este contenido exacto)
```tsx
"use client";

// Agenda semanal imprimible (lane 273). Proyecta en el navegador para usar la hora local (ver vault LANE_273, D1).
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { proyectarEventosCalendario, type UsuarioBasico } from "@/lib/proyeccionCalendario";
import { armarSemana, domingoDe, lunesDe } from "@/lib/agendaSemanal";
import "./agendaSemanal.css";

const fmtDia = new Intl.DateTimeFormat("es-UY", { weekday: "long", day: "numeric", month: "numeric" });
const fmtFecha = new Intl.DateTimeFormat("es-UY", { day: "numeric", month: "long", year: "numeric" });

export function AgendaSemanalImprimible({
  usuario,
  usuarios,
  tareas,
}: {
  usuario: { id: number; nombre: string };
  usuarios: UsuarioBasico[];
  tareas: Parameters<typeof proyectarEventosCalendario>[0];
}) {
  const [lunes, setLunes] = useState(() => lunesDe(new Date()));
  const domingo = domingoDe(lunes);

  const dias = useMemo(() => {
    const eventos = proyectarEventosCalendario(tareas, usuarios, lunes, domingoDe(lunes), { usuarioId: usuario.id });
    return armarSemana(eventos, lunes, usuario.id);
  }, [tareas, usuarios, lunes, usuario.id]);

  const moverSemana = (delta: number) =>
    setLunes((l) => new Date(l.getFullYear(), l.getMonth(), l.getDate() + delta * 7));

  return (
    <div className="hoja-agenda-semanal mx-auto max-w-[1400px] p-4 print:max-w-none print:p-0">
      <div className="mb-4 flex flex-wrap items-center gap-2 print:hidden">
        <Button variant="outline" size="sm" onClick={() => moverSemana(-1)}>
          <ChevronLeft /> Semana anterior
        </Button>
        <Button variant="outline" size="sm" onClick={() => moverSemana(1)}>
          Semana siguiente <ChevronRight />
        </Button>
        <Button size="sm" className="ml-auto" onClick={() => window.print()}>
          <Printer /> Imprimir
        </Button>
      </div>

      <h1 className="mb-3 text-lg font-semibold">
        Agenda de {usuario.nombre} · semana del {fmtFecha.format(lunes)} al {fmtFecha.format(domingo)}
      </h1>

      <div className="grid grid-cols-1 gap-2 md:grid-cols-7 print:grid-cols-7 print:gap-1">
        {dias.map((dia) => (
          <section key={dia.fecha.toISOString()} className="sin-corte rounded-md border p-2 print:rounded-none">
            <h2 className="mb-2 border-b pb-1 text-sm font-semibold capitalize">{fmtDia.format(dia.fecha)}</h2>
            {dia.items.length === 0 ? (
              <p className="text-xs text-muted-foreground">Sin tareas</p>
            ) : (
              <ul className="space-y-2">
                {dia.items.map((item) => (
                  <li key={item.id} className="sin-corte text-xs leading-snug">
                    <p className="font-semibold">
                      <span className="tabular-nums">{item.hora ?? "Sin hora"}</span> · {item.titulo}
                    </p>
                    {item.duracionMin !== null && <p className="text-muted-foreground">{item.duracionMin} min</p>}
                    {item.descripcion && <p className="mt-0.5 whitespace-pre-line">{item.descripcion}</p>}
                    {item.checklist.length > 0 && (
                      <ul className="mt-1 space-y-0.5">
                        {item.checklist.map((texto, i) => (
                          <li key={i}>☐ {texto}</li>
                        ))}
                      </ul>
                    )}
                    {item.companeros.length > 0 && <p className="mt-0.5 italic text-muted-foreground">Con {item.companeros.join(", ")}</p>}
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
```
Verificación: `npx tsc --noEmit` y `npx eslint src/components/tasks/AgendaSemanalImprimible.tsx`.

### M5 · Página [agy]
- [x] hecha (`bd68bd5`)

Archivos: `src/app/dashboard/imprimir/agenda-semanal/page.tsx` (crear con este contenido exacto)
```tsx
// Agenda semanal imprimible (lane 273, Plane #32). Un padre puede imprimir la de un hijo con ?usuarioId=N.
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { usuariosObjetivo } from "@/lib/habitos/permisos";
import { normalizarRotacionConfig } from "@/lib/rotacionTarea";
import { AgendaSemanalImprimible } from "@/components/tasks/AgendaSemanalImprimible";

export const dynamic = "force-dynamic";

export default async function AgendaSemanalPage({ searchParams }: { searchParams: Promise<{ usuarioId?: string }> }) {
  const session = await getSession();
  if (!session?.user) redirect("/");

  const sp = await searchParams;
  const pedidoId = sp?.usuarioId ? Number(sp.usuarioId) : undefined;
  let usuarioId = Number(session.user.id);
  if (pedidoId && Number.isInteger(pedidoId) && pedidoId !== usuarioId) {
    const permitidos = await usuariosObjetivo(session, [pedidoId]);
    if (!permitidos) redirect("/dashboard/imprimir/agenda-semanal");
    usuarioId = permitidos[0];
  }

  const [usuarios, todas] = await Promise.all([
    prisma.usuario.findMany({ select: { id: true, nombre: true, rolFamiliar: true, fotoUrl: true } }),
    prisma.tarea.findMany({ include: { checklistItems: { orderBy: { orden: "asc" } } } }),
  ]);
  const usuario = usuarios.find((u) => u.id === usuarioId);
  if (!usuario) redirect("/dashboard");

  // Al navegador viajan solo las tareas de este usuario (D6): las suyas, las otras filas de sus
  // tareas compartidas (para «Con …») y las rotativas donde es responsable.
  const misGrupos = new Set(todas.filter((t) => t.asignadoId === usuarioId && t.grupoTareaId).map((t) => t.grupoTareaId));
  const tareasRaw = todas.filter(
    (t) =>
      t.asignadoId === usuarioId ||
      (t.grupoTareaId !== null && misGrupos.has(t.grupoTareaId)) ||
      (normalizarRotacionConfig(t.rotacionConfig)?.responsablesIds.includes(usuarioId) ?? false),
  );

  // Fechas a string para el componente cliente (mismo criterio que /dashboard)
  const tareas = tareasRaw.map((t) => ({
    ...t,
    fechaVencimiento: t.fechaVencimiento ? t.fechaVencimiento.toISOString() : null,
    horaEjecucion: t.horaEjecucion ? t.horaEjecucion.toISOString() : null,
    timerStartedAt: t.timerStartedAt ? t.timerStartedAt.toISOString() : null,
  }));

  return <AgendaSemanalImprimible usuario={{ id: usuario.id, nombre: usuario.nombre }} usuarios={usuarios} tareas={tareas} />;
}
```
Verificación: `npx tsc --noEmit`. Si tsc da cualquier error, **STOP** (`BLOQUEADO: <error>`), no lo arregles por tu cuenta.

### M6 · Botón en el panel de tareas [agy] — solo cuando 261 esté en `origin/dev`
- [x] hecha (agy, idéntica a la spec, tras traer origin/dev con la 261; navegador: botón → /dashboard/imprimir/agenda-semanal sin errores)

Archivos: `src/components/tasks/TaskWorkspace.tsx`
Precondición: `git merge origin/dev` hecho por el orquestador; `grep -c '<TooltipContent>Agenda</TooltipContent>' src/components/tasks/TaskWorkspace.tsx` → `1`.
Pasos:
1. Reemplazar `import { CalendarDays, Columns3, List, PanelRight } from "lucide-react";` por `import { CalendarDays, Columns3, List, PanelRight, Printer } from "lucide-react";`
2. Debajo de `import { useSearchParams } from "next/navigation";` agregar `import Link from "next/link";`
3. Reemplazar:
```tsx
              <TooltipContent>Agenda</TooltipContent>
            </Tooltip>
```
por:
```tsx
              <TooltipContent>Agenda</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon-sm" asChild>
                  <Link href="/dashboard/imprimir/agenda-semanal" aria-label="Imprimir agenda semanal">
                    <Printer />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Imprimir agenda semanal</TooltipContent>
            </Tooltip>
```
Verificación: gates.

### M7 · Prueba visual [orquestador]
- [x] hecha (`bd68bd5`) con `verif-db/i273agenda.mjs` (16/16) + `i273con.mjs`; datos de prueba en `verif-db/sql/prueba-273.sql` (solo base local)
Base local (ver LANE_256 › Pendientes): con un hijo con tareas únicas, recurrentes y una rotativa, abrir la página, pasar semanas, vista previa de impresión de Chrome: 1 hoja apaisada, sin barra lateral ni botones, solo las tareas de ese hijo. Probar `?usuarioId=` como padre y como hijo (el hijo vuelve a la suya).

## Criterios de aceptación
- Solo aparecen tareas del usuario impreso, en el día y hora correctos (hora local).
- La impresión sale en A4 apaisada; los reportes de Homeschooling siguen en A4 vertical.
- Un hijo no puede imprimir la agenda de otro.

## Gates
`npx tsc --noEmit` · `npm test` · `npx eslint src/lib/agendaSemanal.ts src/lib/agendaSemanal.test.ts src/components/tasks/AgendaSemanalImprimible.tsx "src/app/dashboard/imprimir/agenda-semanal/page.tsx" src/components/tasks/TaskWorkspace.tsx` (el CSS no pasa por eslint)

## Pendientes

## Hallazgos
- `src/app/agenda/page.tsx` proyecta en el servidor con hora local del servidor (UTC en Vercel): las horas de esa página pueden salir corridas. No es de esta lane; queda anotado para el orquestador.

- 2026-11-07 · Ensayo: la spec original tenía 3 `any` explícitos (eslint `no-explicit-any` en M2, M4 y M5); corregidos con tipos reales (`Record<string, unknown>`, `Parameters<typeof proyectarEventosCalendario>[0]` y el tipo inferido de Prisma). Además D5 (CSS propio para no chocar con la 271 en `globals.css`) y D6 (no mandar al navegador las tareas de toda la familia).
- 2026-11-07 · Una semana con muchas tareas en un día (en la base local Juan tiene 20 tareas viejas de prueba el sábado 7/11) se imprime en varias hojas apaisadas: una columna más larga que la hoja no se puede cortar en una sola. Con carga normal sale en 1 hoja (verificado en la semana del 9 al 15/11). Si hace falta, una mejora futura es achicar la letra en impresión cuando un día tiene más de N tareas.

## Bitácora
- 2026-11-07 · claude (orquestador) · RESERVA · creada desde Plane #32
- 2026-11-07 · claude (orquestador) · INICIO · lane creada con `nueva-lane.sh` (rama `task/lane-273-imprimir-agenda-semanal`, worktree `ordo-diei-lanes/lane-273`, node_modules por junction al espejo de dev). M1–M5 no dependen de 261; M6 sí
- 2026-11-07 · claude (orquestador) · avance · Ensayo (tsc 0 · eslint 0 tras corregir 3 `any` de la spec · prueba visual) → D5 y D6 → M2–M5 reescritas desde el ensayo → agy: 5 archivos idénticos al ensayo (guardado fuera de su alcance) → tsc 0 · eslint 0 · npm test 576/0/51 · `i273agenda.mjs` 16/16 sin errores. Commit `bd68bd5`. Falta M6 (botón en `TaskWorkspace`, cuando 261 esté en `origin/dev`) y push/PR (OK de Gabriel)
- 2026-11-07 · claude (orquestador) + agy · M6 hecha con la 261 ya en dev; tsc 0; eslint sin errores nuevos.
- 2026-11-07 · claude (orquestador) · INTEGRADA · PR #80 a `dev` (merge commit); dev → main en PR #84 (lo integra Gabriel)
