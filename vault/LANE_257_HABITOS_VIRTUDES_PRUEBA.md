---
lane: 257
titulo: "Hábitos: más hábitos, virtudes y prueba de realización"
plane: "#5"
estado: integrada
rama: task/lane-257-habitos-virtudes-prueba
agente: "-"
actualizado: 2026-11-07
---

# Lane 257 — Hábitos: más hábitos, virtudes y prueba de realización

## Especificación
Plane #5: «Agregar más hábitos. Agregar práctica de virtudes. Agregar prueba de realización (en el caso de lectura, mandar escribir resumen de lo leído y presentar a los padres).»

Tres partes, en este orden (la A no depende de nada; B y C dependen del cambio de base):

**A · Prueba de realización en lectura.** Cuando un hijo (no padre) marca «Hecho» en **Lectura espiritual** (`lectura`) o **Leer un libro** (`libro`), tiene que escribir un **resumen de lo leído de al menos 80 caracteres**. El resumen va en la `nota` del registro, que ya queda pendiente de aprobación. En «Hábitos por aprobar» el padre ve el resumen debajo del hábito antes de aprobar o rechazar. El servidor también lo exige (400 si falta).

**B · Categoría «Virtudes».** Nueva categoría `virtud` (además de oración, orden y cuidado personal): se puede elegir al crear o editar un hábito; da puntos como orden y cuidado.

**C · Más hábitos del sistema** (incluye hábitos de virtud). Lista **propuesta** abajo; se carga solo cuando Gabriel la apruebe.

## Decisiones
- D1 · El mínimo de 80 caracteres y las dos claves (`lectura`, `libro`) son propuesta del orquestador; están en una sola constante (`pruebaRealizacion.ts`) para cambiarlos sin tocar nada más.
- D2 · Si quien marca es padre o madre, no se pide resumen (su «hecho» no pasa por aprobación).
- D3 · `virtud` da puntos (`daPuntos` solo excluye `oracion`); no se cambia.
- D4 · **Orden de despliegue obligatorio:** el `ALTER TYPE` (M7) se aplica en la base **antes** de desplegar B o C. `asegurarCatalogo()` hace `upsert` de todo `CATALOGO` en cada arranque: con un hábito `virtud` y sin el valor en el enum, rompe la pantalla de hábitos en producción.

### Propuesta para C (pendiente de Gabriel — no se carga sin su OK)
| Clave | Nombre | Categoría | Franja | Ancla | Ícono | Pasos (días para subir) |
|---|---|---|---|---|---|---|
| `obediencia` | Obedecer a la primera | virtud | tarde | Cuando papá o mamá me piden algo | Award | «Sin protestar» 7 · «A la primera» 14 · «Con alegría» null |
| `servicio` | Un servicio escondido | virtud | tarde | Antes de cenar | Heart | «Un servicio» null |
| `gratitud` | Dar gracias por tres cosas | virtud | noche | En las oraciones de la noche | Sparkles | «Tres gracias» null |
| `sacrificio` | Un pequeño sacrificio | virtud | tarde | En la merienda | Flame | «Ofrecer una renuncia» null |
| `mesa` | Poner y levantar la mesa | orden | tarde | En cada comida | CheckCircle2 | «Levantar mi plato» 7 · «Poner y levantar la mesa» 14 |

## Arquitectura
- `src/lib/habitos/pruebaRealizacion.ts` (nuevo, puro) + test.
- `src/lib/habitos/server.ts` › `registrar()`: valida el resumen.
- `src/components/habitos/HabitoCard.tsx`: diálogo de resumen; prop nueva `pideResumen`.
- `src/components/habitos/HabitosClient.tsx`: le pasa `pideResumen`.
- `src/lib/habitos/aprobaciones.ts` + `src/components/habitos/SolicitudesHabitos.tsx`: muestran la nota.
- B: `prisma/schema.prisma` (enum), `catalogo.ts` (tipo y etiqueta), validaciones en `api/habitos/route.ts` y `server.ts`, `HabitoDialog.tsx`.
- C: `catalogo.ts` (`ClaveSistema` + `CATALOGO`) + `engine.test.ts` sin cambios (lista 9 claves fijas).

## Archivos en alcance
- `src/lib/habitos/pruebaRealizacion.ts` (crear) · `src/lib/habitos/pruebaRealizacion.test.ts` (crear)
- `src/lib/habitos/server.ts` · `src/components/habitos/HabitoCard.tsx` · `src/components/habitos/HabitosClient.tsx`
- `src/lib/habitos/aprobaciones.ts` · `src/components/habitos/SolicitudesHabitos.tsx`
- `prisma/schema.prisma` · `src/lib/habitos/catalogo.ts` · `src/app/api/habitos/route.ts` · `src/components/habitos/HabitoDialog.tsx`

## Microtareas

### Parte A — prueba de realización

#### M1 · Regla pura [agy]
- [x] hecha (agy)

Archivos: `src/lib/habitos/pruebaRealizacion.ts` (crear con este contenido exacto)
```ts
// Prueba de realización de hábitos (lane 257, Plane #5): al marcar «hecho» una lectura,
// quien no es padre escribe un resumen de lo leído que ven los padres al aprobar.

export const CLAVES_CON_RESUMEN: readonly string[] = ["lectura", "libro"];
export const MIN_RESUMEN = 80;

export function requiereResumen(clave: string | null | undefined): boolean {
  return clave != null && CLAVES_CON_RESUMEN.includes(clave);
}

/** Mensaje de error si falta el resumen; null si está bien o no hace falta. */
export function errorResumen(p: { clave: string | null; marca: string | null; esPadre: boolean; nota?: string | null }): string | null {
  if (p.esPadre || p.marca !== "hecho" || !requiereResumen(p.clave)) return null;
  const largo = (p.nota ?? "").trim().length;
  if (largo < MIN_RESUMEN) {
    return `Escribí un resumen de lo que leíste (mínimo ${MIN_RESUMEN} caracteres; llevás ${largo})`;
  }
  return null;
}
```

#### M2 · Tests [agy]
- [x] hecha (agy)

Archivos: `src/lib/habitos/pruebaRealizacion.test.ts` (crear con este contenido exacto)
```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { MIN_RESUMEN, errorResumen, requiereResumen } from "./pruebaRealizacion.ts";

const largo = "a".repeat(MIN_RESUMEN);

test("requiereResumen: solo lectura y libro", () => {
  assert.equal(requiereResumen("lectura"), true);
  assert.equal(requiereResumen("libro"), true);
  assert.equal(requiereResumen("rosario"), false);
  assert.equal(requiereResumen(null), false);
});

test("hijo marcando hecho una lectura: exige el mínimo", () => {
  assert.match(String(errorResumen({ clave: "libro", marca: "hecho", esPadre: false, nota: "corto" })), /mínimo/);
  assert.equal(errorResumen({ clave: "libro", marca: "hecho", esPadre: false, nota: largo }), null);
  assert.match(String(errorResumen({ clave: "lectura", marca: "hecho", esPadre: false, nota: `  ${"b".repeat(MIN_RESUMEN - 1)}  ` })), /mínimo/);
});

test("no se exige a padres, ni al omitir, ni en otros hábitos", () => {
  assert.equal(errorResumen({ clave: "libro", marca: "hecho", esPadre: true, nota: null }), null);
  assert.equal(errorResumen({ clave: "libro", marca: "no", esPadre: false, nota: null }), null);
  assert.equal(errorResumen({ clave: "cama", marca: "hecho", esPadre: false, nota: null }), null);
});
```
Verificación: `npm test`.

#### M3 · Validar en el servidor [agy]
- [x] hecha (agy)

Archivos: `src/lib/habitos/server.ts`
Precondición: `grep -c '  const esLibro = habito.clave === CLAVE_LIBRO;' src/lib/habitos/server.ts` → `1`.
Pasos:
1. Debajo de `import { puedeEditarHabito } from "./permisos.ts";` agregar la línea `import { errorResumen } from "./pruebaRealizacion.ts";`
2. Reemplazar `  const esLibro = habito.clave === CLAVE_LIBRO;` por:
```ts
  const esLibro = habito.clave === CLAVE_LIBRO;

  // Prueba de realización (lane 257): el «hecho» de una lectura lleva resumen para los padres
  const faltaResumen = errorResumen({ clave: habito.clave, marca, esPadre, nota });
  if (faltaResumen) throw new Error(faltaResumen);
```
Verificación: `npx tsc --noEmit` y `npm test`.

#### M4 · Diálogo de resumen en la tarjeta [agy]
- [x] hecha (agy)

Archivos: `src/components/habitos/HabitoCard.tsx`
Precondición: `grep -c 'onConfirmar={(paginas) => handleMarcar("hecho", undefined, paginas)}' src/components/habitos/HabitoCard.tsx` → `1`; `grep -c 'onClick={() => handleMarcar("hecho")}' src/components/habitos/HabitoCard.tsx` → `1`.
Pasos:
1. Reemplazar `import { LibroProgreso, PaginasHecho, type DatosLibro } from "./LibroLectura";` por:
```tsx
import { LibroProgreso, PaginasHecho, type DatosLibro } from "./LibroLectura";
import { MIN_RESUMEN } from "@/lib/habitos/pruebaRealizacion";
```
2. Reemplazar:
```tsx
  onCargarLibro,
}: {
  h: EstadoHabito;
```
por:
```tsx
  onCargarLibro,
  pideResumen = false,
}: {
  h: EstadoHabito;
  /** Lane 257: al marcar «hecho» pide un resumen de lo leído (hijo + lectura/libro) */
  pideResumen?: boolean;
```
3. Reemplazar `  const [notaOpcional, setNotaOpcional] = useState("");` por:
```tsx
  const [notaOpcional, setNotaOpcional] = useState("");
  // Resumen de lectura (lane 257): null = cerrado; { paginas } = esperando el texto para marcar «hecho»
  const [resumenPara, setResumenPara] = useState<{ paginas?: number } | null>(null);
  const [resumen, setResumen] = useState("");

  const pedirHecho = (paginas?: number) => {
    if (!pideResumen) {
      handleMarcar("hecho", undefined, paginas);
      return;
    }
    setResumen("");
    // Igual que el popover de nota: esperar a que se cierre el popover de páginas
    setTimeout(() => setResumenPara({ paginas }), 150);
  };
```
4. Reemplazar `                onConfirmar={(paginas) => handleMarcar("hecho", undefined, paginas)}` por `                onConfirmar={(paginas) => pedirHecho(paginas)}`
5. Reemplazar `                onClick={() => handleMarcar("hecho")}` por `                onClick={() => pedirHecho()}`
6. Reemplazar:
```tsx
            {/* Modal centrado para nota opcional */}
```
por:
```tsx
            {/* Resumen de lo leído (lane 257) */}
            <Dialog open={resumenPara !== null} onOpenChange={(abierto) => !abierto && setResumenPara(null)}>
              <DialogContent className="sm:max-w-md space-y-3">
                <DialogHeader>
                  <DialogTitle className="text-sm">¿Qué leíste hoy?</DialogTitle>
                  <DialogDescription className="text-xs">
                    Contalo con tus palabras. Tus padres lo leen antes de aprobar.
                  </DialogDescription>
                </DialogHeader>
                <Textarea
                  placeholder="Hoy leí sobre..."
                  value={resumen}
                  onChange={(e) => setResumen(e.target.value)}
                  rows={5}
                />
                <p className={cn("text-xs tabular-nums", resumen.trim().length < MIN_RESUMEN ? "text-muted-foreground" : "text-[var(--success)]")}>
                  {resumen.trim().length}/{MIN_RESUMEN} caracteres como mínimo
                </p>
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="outline" onClick={() => setResumenPara(null)}>
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    disabled={ocupado || resumen.trim().length < MIN_RESUMEN}
                    onClick={() => {
                      const paginas = resumenPara?.paginas;
                      setResumenPara(null);
                      handleMarcar("hecho", resumen.trim(), paginas);
                    }}
                  >
                    Enviar a mis padres
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Modal centrado para nota opcional */}
```
Verificación: `npx tsc --noEmit` y `npx eslint src/components/habitos/HabitoCard.tsx`.

#### M5 · Pasar `pideResumen` [agy]
- [x] hecha (agy)

Archivos: `src/components/habitos/HabitosClient.tsx`
Precondición: `grep -c '                      onCargarLibro={handleCargarLibro}' src/components/habitos/HabitosClient.tsx` → `1`.
Pasos:
1. Debajo de `import { toast } from "@/lib/toast";` agregar `import { requiereResumen } from "@/lib/habitos/pruebaRealizacion";`
2. Reemplazar `                      onCargarLibro={handleCargarLibro}` por:
```tsx
                      onCargarLibro={handleCargarLibro}
                      pideResumen={!esPadre && requiereResumen(h.clave)}
```
Verificación: `npx tsc --noEmit`.

#### M6 · El padre ve el resumen al aprobar [agy]
- [x] hecha (agy)

Archivos: `src/lib/habitos/aprobaciones.ts`, `src/components/habitos/SolicitudesHabitos.tsx`
Precondición: `grep -c 'select: { id: true, usuarioId: true, fecha: true, habito: { select: { nombre: true, icono: true } } },' src/lib/habitos/aprobaciones.ts` → `1`.
Pasos en `aprobaciones.ts`:
1. Reemplazar `  registros: { id: number; nombre: string; icono: string; fecha: string }[];` por `  registros: { id: number; nombre: string; icono: string; fecha: string; nota: string | null }[];`
2. Reemplazar `      select: { id: true, usuarioId: true, fecha: true, habito: { select: { nombre: true, icono: true } } },` por `      select: { id: true, usuarioId: true, fecha: true, nota: true, habito: { select: { nombre: true, icono: true } } },`
3. Reemplazar `        .map((x) => ({ id: x.id, nombre: x.habito.nombre, icono: x.habito.icono, fecha: aClave(x.fecha) })),` por `        .map((x) => ({ id: x.id, nombre: x.habito.nombre, icono: x.habito.icono, fecha: aClave(x.fecha), nota: x.nota })),`

Pasos en `SolicitudesHabitos.tsx`:
4. Reemplazar `type Fila = ItemSolicitud & { nombre: string; icono: string; detalle: string };` por `type Fila = ItemSolicitud & { nombre: string; icono: string; detalle: string; nota?: string | null };`
5. Reemplazar:
```tsx
    detalle: `${DETALLE.registro} · ${format(parseISO(r.fecha), "EEEE d", { locale: es })}`,
  })),
```
por:
```tsx
    detalle: `${DETALLE.registro} · ${format(parseISO(r.fecha), "EEEE d", { locale: es })}`,
    nota: r.nota,
  })),
```
6. Reemplazar:
```tsx
                    <ItemDescription>{f.detalle}</ItemDescription>
```
por:
```tsx
                    <ItemDescription>{f.detalle}</ItemDescription>
                    {f.nota && (
                      <p className="mt-1 whitespace-pre-line rounded-md bg-muted px-2 py-1.5 text-xs text-foreground">{f.nota}</p>
                    )}
```
Verificación: gates de la parte A.

### Parte B — categoría Virtudes

#### M7 · Enum en el esquema [agy] + base [orquestador]
- [x] hecha (agy) · - [ ] aplicada en la base (orquestador)

Archivos: `prisma/schema.prisma`
Precondición: `grep -c 'enum CategoriaHabito {' prisma/schema.prisma` → `1`.
Pasos (agy): reemplazar:
```prisma
enum CategoriaHabito {
  oracion
  orden
  cuidado
}
```
por:
```prisma
enum CategoriaHabito {
  oracion
  orden
  cuidado
  virtud // lane 257: práctica de virtudes
}
```
y correr `npx prisma generate` (nada más).
Orquestador: `migrate diff` (regla 7) → debe dar solo `ALTER TYPE "CategoriaHabito" ADD VALUE 'virtud';`. Aplicarlo **antes** de desplegar (D4).

#### M8 · Tipo, etiqueta y validaciones [agy]
- [x] hecha (agy)

Archivos: `src/lib/habitos/catalogo.ts`, `src/app/api/habitos/route.ts`, `src/lib/habitos/server.ts`, `src/components/habitos/HabitoDialog.tsx`
Precondición: `grep -rc '\["oracion", "orden", "cuidado"\]' src/app/api/habitos/route.ts src/lib/habitos/server.ts` → `1` y `2`.
Pasos:
1. `catalogo.ts`: reemplazar `export type Categoria = "oracion" | "orden" | "cuidado";` por `export type Categoria = "oracion" | "orden" | "cuidado" | "virtud";`
2. `catalogo.ts`: reemplazar `  cuidado: "Cuidado personal",` por:
```ts
  cuidado: "Cuidado personal",
  virtud: "Virtudes",
```
3. En `src/app/api/habitos/route.ts` (1 vez) y `src/lib/habitos/server.ts` (2 veces): reemplazar `["oracion", "orden", "cuidado"]` por `["oracion", "orden", "cuidado", "virtud"]`.
4. `HabitoDialog.tsx`: reemplazar `                  <ToggleGroupItem value="cuidado" size="sm" className="text-xs">Cuidado</ToggleGroupItem>` por:
```tsx
                  <ToggleGroupItem value="cuidado" size="sm" className="text-xs">Cuidado</ToggleGroupItem>
                  <ToggleGroupItem value="virtud" size="sm" className="text-xs">Virtudes</ToggleGroupItem>
```
Verificación: `grep -rn '"oracion", "orden", "cuidado"\]' src` → 0 resultados; gates.

### Parte C — hábitos nuevos (solo con OK de Gabriel a la tabla de arriba)

#### M9 · Catálogo [agy] — BLOQUEADA hasta el OK
- [ ] hecha
Archivos: `src/lib/habitos/catalogo.ts`. Pasos que dejará escritos el orquestador al recibir el OK (copiar el formato de `cama` y de `angelus`, con los valores exactos de la tabla aprobada, `recomendado: false`, `misterios: 0`, e `identidad` que dicte Gabriel). Agy no redacta textos: si falta un texto, **STOP**.

#### M10 · Prueba [orquestador]
- [ ] hecha
Base local. A: hijo marca «Leer un libro» (páginas → diálogo → resumen de 79 caracteres: botón deshabilitado; 80: envía); `curl` sin nota → 400; padre ve el resumen en «Hábitos por aprobar»; padre marcando no ve diálogo. B: crear un hábito de categoría Virtudes; aparece con la etiqueta «Virtudes» en hábitos comunitarios y da puntos al aprobarse.

## Criterios de aceptación
- Un hijo no puede marcar hecha una lectura sin resumen (UI y API); el padre lo ve al aprobar.
- La categoría «Virtudes» se puede elegir y se guarda.
- Los hábitos nuevos del sistema aparecen solo después del OK de Gabriel y del `ALTER TYPE`.

## Gates
`npx prisma validate` · `npx tsc --noEmit` · `npm test` · `npx eslint src/lib/habitos/pruebaRealizacion.ts src/lib/habitos/pruebaRealizacion.test.ts src/lib/habitos/server.ts src/components/habitos/HabitoCard.tsx src/components/habitos/HabitosClient.tsx src/lib/habitos/aprobaciones.ts src/components/habitos/SolicitudesHabitos.tsx src/lib/habitos/catalogo.ts src/app/api/habitos/route.ts src/components/habitos/HabitoDialog.tsx`

## Pendientes
- OK de Gabriel: tabla de la parte C, mínimo de 80 caracteres (D1).
- M7 base antes de desplegar B/C (D4).
- Actualizar `HABITOS_Y_NIVELES.md` y `APROBACION_HABITOS.md` del vault al integrar.

## Hallazgos
- SQL de M7: `ALTER TYPE "CategoriaHabito" ADD VALUE 'virtud';` (generado sin base). Aplicado **solo en la base local**; en producción espera el OK de Gabriel y va **antes** del despliegue (D4).
- M10 A/B (2026-11-07, base local, puerto 3157): API `PUT /api/habitos/registro` de un hijo sobre «Lectura espiritual» sin nota → 400 «Escribí un resumen… llevás 0»; 79 → 400; 80 → 200; padre sin nota → 200; «Leer un libro» con páginas y sin nota → 400. Pantalla: «Hecho» abre «¿Qué leíste hoy?»; con 79 caracteres «Enviar a mis padres» deshabilitado, con 80+ habilitado; al enviar queda «Hecho hoy». `GET /api/habitos/aprobaciones` del padre trae la nota. Parte B: el padre crea «Obedecer a la primera» con categoría `virtud` → aparece en «Hábitos comunitarios» como «Virtudes». No probado aún: la pantalla del padre aprobando y los puntos al aprobar una virtud.
- Base local: estaba creada en WIN1252 (locale de Windows); recreada en UTF8 (`verif-db/iniciar.mjs` con `initdbFlags`).
- Producción (2026-11-07, orquestador): esquema aplicado con el SQL aditivo de `prisma migrate diff --from-config-datasource` desde `dev` completo (todas las lanes juntas): 15 tablas, 4 enums, valor `virtud`, 2 columnas nullable en `Checklist_Items`; **0 DROP**, sin cambios de datos. `migrate diff` posterior vacío. Amparo: regla 7 de AGENTS.md + «hace lo que haya que hacer» de Gabriel.

## Bitácora
- 2026-11-07 · claude (orquestador) · RESERVA · creada desde Plane #5
- 2026-11-07 · claude (orquestador) · INICIO · Parte A (M1–M6) y B (M7 esquema, M8) delegadas a agy; base (M7) y Parte C esperan a Gabriel
- 2026-11-07 · claude (orquestador) · avance · A y B por agy (cada línea = spec), gates: tsc 0 · eslint 0 · npm test 576/0/51; commit 1508f5a; M10 A/B casi completa (ver Hallazgos). Faltan: SQL en producción (OK de Gabriel), Parte C (OK de Gabriel), push/PR
- 2026-11-07 · claude (orquestador) · INTEGRADA · PR #77 a `dev` (merge commit); dev → main en PR #84 (lo integra Gabriel)
