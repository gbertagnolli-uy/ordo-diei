---
lane: 265
titulo: Checklists globales en tareas compartidas
plane: "#22"
estado: integrada
rama: task/lane-265-checklist-global-compartidas
agente: "-"
actualizado: 2026-11-07
---

# Lane 265 — Checklists globales en tareas compartidas

## Especificación
Plane #22: «Los checklists de tareas compartidas deben ser globales. Si un usuario marca una tarea, debe aparecer como marcada y con la foto del que la completó y ya no debe poder desmarcarse.»

Cómo funciona hoy (verificado):
- Una tarea compartida (varios responsables o rotativa con co-responsables) se guarda como **una `Tarea` por responsable** con el mismo `grupoTareaId` (`generarRecurrentes.ts` copia la regla y sus `ChecklistItem`).
- Cada copia tiene **sus propios** ítems: lo que marca uno no lo ve el otro. `PUT /api/tasks/[id]/checklist` (`action: "toggle"`) cambia solo el ítem de esa copia y permite desmarcar.
- `ChecklistItem` no guarda quién lo marcó.

Esperado, **solo en tareas con `grupoTareaId`** (las individuales siguen igual):
1. Marcar un ítem lo marca en **todas** las copias del grupo (mismo `orden` y mismo `texto`).
2. Cada ítem marcado muestra la **foto (avatar) y el nombre** de quien lo marcó.
3. Un ítem marcado **no se puede desmarcar** (ni desde la UI ni por la API: 409).
4. Si dos marcan el mismo ítem a la vez, queda el primero (no se pisa el autor).

## Decisiones
- D1 · Correspondencia entre copias por `orden` + `texto` (las copias se generan clonando ambos campos de la regla). Si un padre editó el texto en una sola copia, ese ítem deja de estar sincronizado: se acepta y queda en Hallazgos.
- D2 · En tareas individuales también se guarda quién marcó (sirve para el historial), pero se puede desmarcar como hoy; al desmarcar se borra el autor.
- D3 · El update es condicional (`completado = false` en el `where`): así el primero gana sin bloqueos.

## Arquitectura
- **Base** (lo aplica el orquestador): `Checklist_Items` + `Completado_Por_ID` (FK a `Usuarios`, `ON DELETE SET NULL`) + `Completado_En`.
- `src/lib/tareas/checklistCompartido.ts` (nuevo, puro): `puedeCambiarItem({ compartida, completadoActual, completadoPedido })`.
- `src/lib/tareas/checklistCompartido.test.ts` (nuevo).
- `src/app/api/tasks/[id]/checklist/route.ts`: GET devuelve `compartida` y `completadoPor`; PUT `toggle` sincroniza el grupo.
- `src/components/dashboard/ChecklistModal.tsx`: avatar + nombre del autor, ítems marcados bloqueados en compartidas.

## Archivos en alcance
- `prisma/schema.prisma` (modificar)
- `src/lib/tareas/checklistCompartido.ts` (crear)
- `src/lib/tareas/checklistCompartido.test.ts` (crear)
- `src/app/api/tasks/[id]/checklist/route.ts` (modificar)
- `src/components/dashboard/ChecklistModal.tsx` (modificar)

## Microtareas

### M1 · Esquema [agy]
- [x] hecha (agy)

Archivos: `prisma/schema.prisma`
Precondición: `grep -c 'model ChecklistItem {' prisma/schema.prisma` → `1`.
Pasos:
1. Reemplazar:
```prisma
  completado Boolean @default(false)
  orden      Int     @default(0)

  tarea Tarea @relation(fields: [tareaId], references: [id], onDelete: Cascade)

  @@map("Checklist_Items")
```
por:
```prisma
  completado Boolean @default(false)
  orden      Int     @default(0)
  // Quién lo marcó (lane 265): en tareas compartidas se ve su foto y ya no se desmarca
  completadoPorId Int?      @map("Completado_Por_ID")
  completadoEn    DateTime? @map("Completado_En")

  tarea         Tarea    @relation(fields: [tareaId], references: [id], onDelete: Cascade)
  completadoPor Usuario? @relation("ChecklistCompletadoPor", fields: [completadoPorId], references: [id], onDelete: SetNull)

  @@map("Checklist_Items")
```
2. En `model Usuario`, reemplazar la línea `  historialAcciones HistorialAccion[]` **que está dentro de `model Usuario`** (la primera del archivo, línea ~72) por:
```prisma
  historialAcciones HistorialAccion[]
  checklistCompletados ChecklistItem[] @relation("ChecklistCompletadoPor")
```
3. Correr `npx prisma format` y `npx prisma generate`. **No** correr `db push`, `migrate` ni `db execute`.
Verificación: `npx prisma validate` → válido.

### M2 · Aplicar en la base [orquestador]
- [x] hecha (producción 2026-11-07, ver Hallazgos)
AGENTS.md regla 7: `git merge origin/dev`, `npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script > %TEMP%\265.sql`; el SQL solo debe tener `ALTER TABLE "Checklist_Items" ADD COLUMN ...` (x2), el `ADD CONSTRAINT ... FOREIGN KEY` y nada con `DROP`. Aplicar con `npx prisma db execute --file`. Anotar el SQL en Hallazgos.

### M3 · Regla pura [agy]
- [x] hecha (agy)

Archivos: `src/lib/tareas/checklistCompartido.ts` (crear con este contenido exacto)
```ts
// Checklists globales en tareas compartidas (lane 265, Plane #22).
// Compartida = la tarea tiene grupoTareaId (una copia por responsable con los mismos ítems).

export type DecisionItem =
  | { ok: true; sinCambios: boolean }
  | { ok: false; status: 409; error: string };

export function puedeCambiarItem(p: { compartida: boolean; completadoActual: boolean; completadoPedido: boolean }): DecisionItem {
  if (p.completadoActual === p.completadoPedido) return { ok: true, sinCambios: true };
  if (p.compartida && p.completadoActual && !p.completadoPedido) {
    return { ok: false, status: 409, error: "En las tareas compartidas un ítem marcado ya no se puede desmarcar" };
  }
  return { ok: true, sinCambios: false };
}
```

### M4 · Tests [agy]
- [x] hecha (agy)

Archivos: `src/lib/tareas/checklistCompartido.test.ts` (crear con este contenido exacto)
```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { puedeCambiarItem } from "./checklistCompartido.ts";

test("compartida: marcar se puede, desmarcar no", () => {
  assert.deepEqual(puedeCambiarItem({ compartida: true, completadoActual: false, completadoPedido: true }), { ok: true, sinCambios: false });
  const r = puedeCambiarItem({ compartida: true, completadoActual: true, completadoPedido: false });
  assert.equal(r.ok, false);
});

test("individual: se puede marcar y desmarcar", () => {
  assert.equal(puedeCambiarItem({ compartida: false, completadoActual: true, completadoPedido: false }).ok, true);
});

test("pedir el mismo estado no cambia nada", () => {
  assert.deepEqual(puedeCambiarItem({ compartida: true, completadoActual: true, completadoPedido: true }), { ok: true, sinCambios: true });
});
```

### M5 · API: GET con autor y PUT sincronizado [agy]
- [x] hecha (agy)

Archivos: `src/app/api/tasks/[id]/checklist/route.ts`
Precondición: M1 hecha (`npx prisma generate` corrido); `grep -c 'if (action === "toggle" && itemId) {' "src/app/api/tasks/[id]/checklist/route.ts"` → `1`.
Pasos:
1. Debajo de `import { getSession } from "@/lib/session";` agregar `import { puedeCambiarItem } from "@/lib/tareas/checklistCompartido";`
2. En el GET, reemplazar:
```ts
    const items = await prisma.checklistItem.findMany({
      where: { tareaId: taskId },
      orderBy: { orden: "asc" }
    });
```
por:
```ts
    const [tarea, items] = await Promise.all([
      prisma.tarea.findUnique({ where: { id: taskId }, select: { grupoTareaId: true } }),
      prisma.checklistItem.findMany({
        where: { tareaId: taskId },
        orderBy: { orden: "asc" },
        include: { completadoPor: { select: { id: true, nombre: true, fotoUrl: true } } },
      }),
    ]);
```
3. En el GET, reemplazar `    return NextResponse.json({ items, total, completados, porcentaje });` por `    return NextResponse.json({ items, total, completados, porcentaje, compartida: Boolean(tarea?.grupoTareaId) });`
4. Reemplazar el bloque `toggle` completo:
```ts
    if (action === "toggle" && itemId) {
      // Toggle completion of an item
      const updated = await prisma.checklistItem.update({
        where: { id: Number(itemId) },
        data: { completado: completado !== undefined ? Boolean(completado) : undefined }
      });

      // Check if all items are completed (business rule: computed completion)
      const allItems = await prisma.checklistItem.findMany({ where: { tareaId: taskId } });
      const allDone = allItems.length > 0 && allItems.every(i => i.completado);

      return NextResponse.json({ ok: true, item: updated, allCompleted: allDone, total: allItems.length, completados: allItems.filter(i => i.completado).length });
    }
```
por:
```ts
    if (action === "toggle" && itemId) {
      const item = await prisma.checklistItem.findFirst({ where: { id: Number(itemId), tareaId: taskId } });
      if (!item) return NextResponse.json({ error: "Ítem no encontrado" }, { status: 404 });
      const pedido = completado !== undefined ? Boolean(completado) : !item.completado;
      const compartida = Boolean(task.grupoTareaId);
      const decision = puedeCambiarItem({ compartida, completadoActual: item.completado, completadoPedido: pedido });
      if (!decision.ok) return NextResponse.json({ error: decision.error }, { status: decision.status });

      if (!decision.sinCambios) {
        const autor = pedido ? { completadoPorId: Number(session.user.id), completadoEn: new Date() } : { completadoPorId: null, completadoEn: null };
        if (compartida && pedido) {
          // Global (lane 265): se marca en todas las copias del grupo; el primero que marca queda como autor
          const copias = await prisma.tarea.findMany({ where: { grupoTareaId: task.grupoTareaId }, select: { id: true } });
          await prisma.checklistItem.updateMany({
            where: { tareaId: { in: copias.map((c) => c.id) }, orden: item.orden, texto: item.texto, completado: false },
            data: { completado: true, ...autor },
          });
        } else {
          await prisma.checklistItem.update({ where: { id: item.id }, data: { completado: pedido, ...autor } });
        }
      }

      const allItems = await prisma.checklistItem.findMany({
        where: { tareaId: taskId },
        orderBy: { orden: "asc" },
        include: { completadoPor: { select: { id: true, nombre: true, fotoUrl: true } } },
      });
      const updated = allItems.find((i) => i.id === item.id);
      const allDone = allItems.length > 0 && allItems.every((i) => i.completado);
      return NextResponse.json({ ok: true, item: updated, items: allItems, allCompleted: allDone, total: allItems.length, completados: allItems.filter((i) => i.completado).length });
    }
```
Verificación: `npx tsc --noEmit`.

### M6 · Modal con autor y bloqueo [agy]
- [x] hecha (agy)

Archivos: `src/components/dashboard/ChecklistModal.tsx`
Precondición: `grep -c 'const toggleItem = async (itemId: number, currentState: boolean) => {' src/components/dashboard/ChecklistModal.tsx` → `1`.
Pasos:
1. Debajo de `import { Item, ItemContent, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item";` agregar:
```tsx
import { Avatar } from "@/components/tasks/primitives";
import { toast } from "@/lib/toast";
```
2. Reemplazar:
```tsx
interface ChecklistItem {
  id: number;
  texto: string;
  completado: boolean;
  orden: number;
}
```
por:
```tsx
interface ChecklistItem {
  id: number;
  texto: string;
  completado: boolean;
  orden: number;
  completadoPor?: { id: number; nombre: string; fotoUrl: string | null } | null;
}
```
3. Reemplazar `  const [toggling, setToggling] = useState<number | null>(null);` por:
```tsx
  const [toggling, setToggling] = useState<number | null>(null);
  // Tarea compartida (lane 265): lo marcado es de todos y ya no se desmarca
  const [compartida, setCompartida] = useState(false);
```
4. Reemplazar:
```tsx
          if (data.items) {
            setItems(data.items.sort((a: ChecklistItem, b: ChecklistItem) => a.orden - b.orden));
          }
```
por:
```tsx
          if (data.items) {
            setItems(data.items.sort((a: ChecklistItem, b: ChecklistItem) => a.orden - b.orden));
          }
          setCompartida(Boolean(data.compartida));
```
5. Reemplazar:
```tsx
      if (res.ok) {
        const data = await res.json();
        setItems(prev => prev.map(i => i.id === itemId ? { ...i, completado: !currentState } : i));
        if (data.allCompleted && onComplete) {
          onComplete();
        }
      }
    } catch {} finally {
```
por:
```tsx
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        if (Array.isArray(data.items)) setItems(data.items);
        else setItems(prev => prev.map(i => i.id === itemId ? { ...i, completado: !currentState } : i));
        if (data.allCompleted && onComplete) {
          onComplete();
        }
      } else {
        toast.error(data.error || "No se pudo guardar el ítem");
      }
    } catch {} finally {
```
6. Reemplazar:
```tsx
                <button onClick={() => toggleItem(item.id, item.completado)} disabled={toggling === item.id} className="text-left">
```
por:
```tsx
                <button
                  onClick={() => toggleItem(item.id, item.completado)}
                  disabled={toggling === item.id || (compartida && item.completado)}
                  className="text-left disabled:cursor-default"
                >
```
7. Reemplazar:
```tsx
                  <ItemContent>
                    <ItemTitle className={item.completado ? "text-muted-foreground line-through" : ""}>{item.texto}</ItemTitle>
                  </ItemContent>
```
por:
```tsx
                  <ItemContent>
                    <ItemTitle className={item.completado ? "text-muted-foreground line-through" : ""}>{item.texto}</ItemTitle>
                  </ItemContent>
                  {item.completado && item.completadoPor && (
                    <span className="ml-auto flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground" title={`Lo marcó ${item.completadoPor.nombre}`}>
                      <Avatar user={item.completadoPor} size="xs" /> {item.completadoPor.nombre}
                    </span>
                  )}
```
Verificación: gates.

### M7 · Prueba manual [orquestador]
- [x] hecha (base local)
Base local: tarea con checklist asignada a dos hijos (mismo grupo). Hijo A marca el ítem 2 → hijo B abre su checklist: ítem 2 marcado con la foto de A, no se puede desmarcar. `curl` del PUT con `completado:false` → 409. Tarea individual: marcar y desmarcar funciona como antes.

## Criterios de aceptación
- Los 4 puntos de la especificación.
- Tareas individuales sin cambios de comportamiento.

## Gates
`npx prisma validate` · `npx tsc --noEmit` · `npm test` · `npx eslint src/lib/tareas/checklistCompartido.ts src/lib/tareas/checklistCompartido.test.ts "src/app/api/tasks/[id]/checklist/route.ts" src/components/dashboard/ChecklistModal.tsx`

## Pendientes
- M2 (base) la hace el orquestador antes de desplegar.

## Hallazgos
- SQL de M2 (generado sin base, `prisma migrate diff --from-schema <schema de dev> --to-schema prisma/schema.prisma --script`), **solo aditivo**:
  `ALTER TABLE "Checklist_Items" ADD COLUMN "Completado_En" TIMESTAMP(3), ADD COLUMN "Completado_Por_ID" INTEGER;` + `ADD CONSTRAINT "Checklist_Items_Completado_Por_ID_fkey" FOREIGN KEY ("Completado_Por_ID") REFERENCES "Usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;`
  Aplicado **solo en la base local**. En producción espera el OK de Gabriel (y antes de desplegar el código: sin las columnas, el GET falla).
- M7 (2026-11-07, base local, puerto 3165): Juan marca «Juntar la ropa» en su copia → la copia de Ana queda marcada con autor Juan; Ana desmarcar → **409**; Ana marcar algo ya marcado → 200 sin pisar el autor; tarea individual: marcar y desmarcar → 200/200 y queda sin autor. En pantalla (Ana): el ítem aparece tachado, con avatar «J» y «Juan Prueba», botón deshabilitado; los otros dos habilitados.
- Preexistente en `dev` (no lo causa esta lane): al seleccionar una tarea, React avisa «<p> cannot be a descendant of <p>» (título de la tarea dentro de otro `<p>`). Sin lane todavía.
- Producción (2026-11-07, orquestador): esquema aplicado con el SQL aditivo de `prisma migrate diff --from-config-datasource` desde `dev` completo (todas las lanes juntas): 15 tablas, 4 enums, valor `virtud`, 2 columnas nullable en `Checklist_Items`; **0 DROP**, sin cambios de datos. `migrate diff` posterior vacío. Amparo: regla 7 de AGENTS.md + «hace lo que haya que hacer» de Gabriel.

## Bitácora
- 2026-11-06 · claude (orquestador) · RESERVA · creada desde Plane #22
- 2026-11-07 · claude (orquestador) · INICIO · worktree creado, M1 y M3–M6 delegadas a agy; M2 (SQL en producción) espera OK de Gabriel
- 2026-11-07 · claude (orquestador) · avance · M1, M3–M6 por agy (cada línea = spec); gates: tsc 0 · eslint 0 · npm test 576/0/51; commit 61428b3; SQL aditivo verificado y aplicado solo en base local; M7 verificada. Falta M2 en producción (OK de Gabriel) y push/PR
- 2026-11-07 · claude (orquestador) · INTEGRADA · PR #76 a `dev` (merge commit); dev → main en PR #84 (lo integra Gabriel)
