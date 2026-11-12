---
lane: 260
titulo: Carta consagrada — progreso al próximo grado
plane: "#17"
estado: integrada
rama: task/lane-260-carta-progreso-siguiente-grado
agente: "-"
actualizado: 2026-11-07
---

# Lane 260 — Carta consagrada: progreso hasta el próximo grado

## Especificación
Plane #17: «Después de consagrada una carta en nivel 1, mostrar el progreso hasta el próximo nivel. Mostrar x/xx fragmentos, para que el próximo objetivo sea subir de nivel la carta».

Hoy (`src/components/cartas/ColeccionView.tsx`):
- «En camino» (sin consagrar) muestra `fragmentos/requeridos`, `%` y una barra.
- «Cartas consagradas» muestra solo nombre, «Grado I…IV» y subtítulo: **no** dice cuánto falta para el próximo grado.
- El detalle (`DetalleCartaView.tsx`) sí dice «Faltan N fragmentos para Grado II», pero calculado en `src/lib/cartas/server.ts` con `Math.floor(req * 1.5)`, que **no coincide** con `gradoDe()` (`src/lib/cartas/fragmentos.ts`, regla D14: Grado II desde el 150 %). Ejemplo verificado: `req = 5`, `fragmentos = 7` → el servidor dice «faltan 3 para Grado III» pero `gradoDe(7, 5) = 1` (7/5 = 1,4 < 1,5): la carta sigue en Grado I y le falta **1** para el II.

Esperado, en cada carta consagrada de la grilla y mientras no sea Grado IV:
- una línea `x/xx fragmentos · Grado II` (xx = fragmentos totales que pide el próximo grado, x = los que tiene);
- una barra fina con el avance **desde el umbral del grado actual** hasta el del próximo (si recién llega a Grado I, la barra arranca en 0).
- En Grado IV: «Grado IV glorioso» sin barra.

## Decisiones
- D1 · Una sola fuente para los umbrales: `umbralGrado()` en `fragmentos.ts`, consistente con `gradoDe()` (usa `Math.ceil(req * 1.5)`). `server.ts` pasa a usarla, lo que corrige el «faltan» del detalle.
- D2 · El progreso se calcula con el grado **real** por fragmentos (`gradoDe`), no con el reclamado: si ya alcanzó un grado sin reclamarlo, el botón de reclamo existente (`accionReclamo`) lo muestra, y la barra apunta al siguiente.

## Arquitectura
- `src/lib/cartas/fragmentos.ts`: funciones puras `umbralGrado(grado, requeridos)` y `progresoSiguienteGrado(fragmentos, requeridos)`.
- `src/lib/cartas/fragmentos.test.ts` (nuevo): tests de las funciones.
- `src/lib/cartas/server.ts`: el bloque «Progreso hacia el siguiente grado» usa `progresoSiguienteGrado`.
- `src/components/cartas/ColeccionView.tsx`: línea + barra en la grilla de consagradas.

## Archivos en alcance
- `src/lib/cartas/fragmentos.ts` (modificar)
- `src/lib/cartas/fragmentos.test.ts` (crear)
- `src/lib/cartas/server.ts` (modificar)
- `src/components/cartas/ColeccionView.tsx` (modificar)

## Microtareas

### M1 · Funciones de umbral [agy]
- [x] hecha (agy)

Archivos: `src/lib/cartas/fragmentos.ts`
Precondición: `grep -c 'export function gradoDe' src/lib/cartas/fragmentos.ts` → `1`.
Pasos:
1. Inmediatamente **después** del cierre `}` de la función `gradoDe` (la que termina con `  return 4;\n}`), agregar:
```ts

/**
 * Fragmentos totales desde los que rige cada grado (D14), con el mismo redondeo que `gradoDe`:
 * I = 100 %, II = 150 % (redondeado hacia arriba), III = 200 %, IV = 300 %.
 */
export function umbralGrado(grado: 1 | 2 | 3 | 4, requeridos: number): number {
  if (grado === 1) return requeridos;
  if (grado === 2) return Math.ceil(requeridos * 1.5);
  if (grado === 3) return requeridos * 2;
  return requeridos * 3;
}

export interface ProgresoSiguienteGrado {
  /** Grado que alcanzan hoy los fragmentos (puede no estar reclamado todavía) */
  gradoActual: GradoCarta;
  /** null si ya es Grado IV */
  siguienteGrado: 1 | 2 | 3 | 4 | null;
  /** Fragmentos totales que pide el siguiente grado (0 si no hay) */
  meta: number;
  /** Fragmentos que faltan para el siguiente grado (0 si no hay) */
  faltan: number;
  /** Avance de 0 a 100 entre el umbral del grado actual y el del siguiente */
  porcentaje: number;
}

export function progresoSiguienteGrado(fragmentos: number, requeridos: number): ProgresoSiguienteGrado {
  const gradoActual = gradoDe(fragmentos, requeridos);
  if (requeridos <= 0 || gradoActual === 4) {
    return { gradoActual, siguienteGrado: null, meta: 0, faltan: 0, porcentaje: 100 };
  }
  const siguienteGrado = (gradoActual + 1) as 1 | 2 | 3 | 4;
  const meta = umbralGrado(siguienteGrado, requeridos);
  const desde = gradoActual === 0 ? 0 : umbralGrado(gradoActual as 1 | 2 | 3, requeridos);
  const tramo = Math.max(1, meta - desde);
  const porcentaje = Math.max(0, Math.min(100, Math.floor(((fragmentos - desde) / tramo) * 100)));
  return { gradoActual, siguienteGrado, meta, faltan: Math.max(0, meta - fragmentos), porcentaje };
}
```
Verificación: `npx tsc --noEmit`.

### M2 · Tests [agy]
- [x] hecha (agy)

Archivos: `src/lib/cartas/fragmentos.test.ts` (crear con este contenido exacto)
```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { gradoDe, progresoSiguienteGrado, umbralGrado } from "./fragmentos.ts";

test("umbralGrado coincide con gradoDe en cada borde (req par e impar)", () => {
  for (const req of [4, 5, 7, 10]) {
    for (const g of [1, 2, 3, 4] as const) {
      const u = umbralGrado(g, req);
      assert.equal(gradoDe(u, req), g, `req=${req} grado=${g} umbral=${u}`);
      assert.equal(gradoDe(u - 1, req), g - 1, `req=${req} justo antes del grado ${g}`);
    }
  }
});

test("progresoSiguienteGrado: recién consagrada arranca en 0 % hacia el Grado II", () => {
  const p = progresoSiguienteGrado(10, 10);
  assert.deepEqual(p, { gradoActual: 1, siguienteGrado: 2, meta: 15, faltan: 5, porcentaje: 0 });
});

test("progresoSiguienteGrado: req impar usa el mismo redondeo que gradoDe", () => {
  const p = progresoSiguienteGrado(7, 5);
  assert.equal(p.gradoActual, 1);
  assert.equal(p.meta, 8);
  assert.equal(p.faltan, 1);
});

test("progresoSiguienteGrado: sin consagrar mide hasta el Grado I y en Grado IV no hay siguiente", () => {
  assert.equal(progresoSiguienteGrado(3, 10).meta, 10);
  assert.equal(progresoSiguienteGrado(3, 10).porcentaje, 30);
  const tope = progresoSiguienteGrado(30, 10);
  assert.equal(tope.siguienteGrado, null);
  assert.equal(tope.faltan, 0);
});
```
Verificación: `node --test --disable-warning=MODULE_TYPELESS_PACKAGE_JSON src/lib/cartas/fragmentos.test.ts` → 4 tests ok.

### M3 · El detalle usa la misma regla [agy]
- [x] hecha (agy)

Archivos: `src/lib/cartas/server.ts`
Precondición: `grep -c 'fragmentosParaSiguienteGrado = Math.floor(req \* 1.5) - fragmentos;' src/lib/cartas/server.ts` → `1`; `grep -n 'progresoSiguienteGrado' src/lib/cartas/server.ts` → nada.
Pasos:
1. Reemplazar este bloque exacto:
```ts
  let siguienteGrado: number | null = null;
  let fragmentosParaSiguienteGrado = 0;

  if (fragmentos < req) {
    siguienteGrado = 1;
    fragmentosParaSiguienteGrado = req - fragmentos;
  } else if (fragmentos < Math.floor(req * 1.5)) {
    siguienteGrado = 2;
    fragmentosParaSiguienteGrado = Math.floor(req * 1.5) - fragmentos;
  } else if (fragmentos < req * 2) {
    siguienteGrado = 3;
    fragmentosParaSiguienteGrado = req * 2 - fragmentos;
  } else if (fragmentos < req * 3) {
    siguienteGrado = 4;
    fragmentosParaSiguienteGrado = req * 3 - fragmentos;
  } else {
    siguienteGrado = null;
    fragmentosParaSiguienteGrado = 0;
  }
```
por:
```ts
  // Misma regla que gradoDe (D14): una sola fuente para los umbrales (lane 260)
  const progresoGrado = progresoSiguienteGrado(fragmentos, req);
  const siguienteGrado: number | null = progresoGrado.siguienteGrado;
  const fragmentosParaSiguienteGrado = progresoGrado.faltan;
```
2. En el `import { ... } from "./fragmentos.ts";` existente de `server.ts`, agregar `progresoSiguienteGrado` a la lista. Si `server.ts` no importa nada de `./fragmentos.ts`, agregar la línea `import { progresoSiguienteGrado } from "./fragmentos.ts";` debajo de `import { rachaEfectiva } from "./racha.ts";`.
Verificación: `npx tsc --noEmit`; `npm test`.

### M4 · Línea y barra en la grilla de consagradas [agy]
- [x] hecha (agy)

Archivos: `src/components/cartas/ColeccionView.tsx`
Precondición: `grep -c '^                  const romano = TEXTOS_CARTAS.gradosRomanos\[carta.grado\] || "I";$' src/components/cartas/ColeccionView.tsx` → `1` (exactamente **18 espacios** de sangría: es la línea dentro de `coleccionDesbloqueadas.map`; la otra aparición, con 16 espacios dentro de `cartasFiltradas.map`, **no se toca**).
Pasos:
1. Debajo de `import { TEXTOS_CARTAS } from "@/lib/cartas/textos";` agregar: `import { progresoSiguienteGrado } from "@/lib/cartas/fragmentos";`
2. Reemplazar **solo la línea con 18 espacios de sangría** (la de `coleccionDesbloqueadas.map`):
```tsx
                  const romano = TEXTOS_CARTAS.gradosRomanos[carta.grado] || "I";
```
por:
```tsx
                  const romano = TEXTOS_CARTAS.gradosRomanos[carta.grado] || "I";
                  const progreso = progresoSiguienteGrado(carta.fragmentos, carta.fragmentosRequeridos);
```
3. Dentro de ese mismo `map` de `coleccionDesbloqueadas`, reemplazar:
```tsx
                          <span className="text-[11px] text-muted-foreground truncate">
                            {carta.subtitulo || TEXTOS_CARTAS.rarezas[carta.rareza]}
                          </span>
                        </div>
```
por:
```tsx
                          <span className="text-[11px] text-muted-foreground truncate">
                            {carta.subtitulo || TEXTOS_CARTAS.rarezas[carta.rareza]}
                          </span>
                          {progreso.siguienteGrado ? (
                            <>
                              <span className="text-[11px] text-muted-foreground tabular-nums">
                                {carta.fragmentos}/{progreso.meta} fragmentos · Grado {TEXTOS_CARTAS.gradosRomanos[progreso.siguienteGrado]}
                              </span>
                              <Progress
                                value={progreso.porcentaje}
                                className="h-1"
                                aria-label={`Progreso hacia el Grado ${TEXTOS_CARTAS.gradosRomanos[progreso.siguienteGrado]}`}
                              />
                            </>
                          ) : (
                            <span className="text-[11px] font-medium text-primary">Grado IV glorioso</span>
                          )}
                        </div>
```
Si el bloque del paso 3 aparece más de una vez, aplicarlo **solo** en el que está dentro de `coleccionDesbloqueadas.map`; si no se puede distinguir: DETENERSE.
Verificación: `grep -c 'progresoSiguienteGrado' src/components/cartas/ColeccionView.tsx` → `2` (import y uso); gates.

### M5 · Verificación visual [orquestador]
- [x] hecha (base local)
Pestaña Colección con una carta Grado I, una II y una IV (base local): textos y barras correctos; detalle de una carta de `req` impar con el «Faltan» correcto.

## Criterios de aceptación
- Cada consagrada (I–III) muestra `x/xx fragmentos · Grado <siguiente>` y una barra fina.
- Grado IV muestra «Grado IV glorioso».
- El «Faltan N fragmentos para Grado …» del detalle coincide con `gradoDe`.

## Gates
`npx tsc --noEmit` · `npm test` · `npx eslint src/lib/cartas/fragmentos.ts src/lib/cartas/fragmentos.test.ts src/lib/cartas/server.ts src/components/cartas/ColeccionView.tsx`

## Pendientes

## Hallazgos
- M5 (2026-11-07, base local con `seed-cartas.ts` + cartas de Juan con requisito 25): Colección → «30/38 fragmentos · Grado II», «37/38 fragmentos · Grado II», «40/50 fragmentos · Grado III», «Grado IV glorioso»; 3 barras con `aria-label`. Detalle de Santo Tomás (37 de 25): «Faltan 1 fragmentos para Grado II» (con el `floor` viejo daba Grado III).
- Preexistentes en `dev`, fuera del alcance de esta lane: la insignia del detalle dice «Grado I · Grado I · Desbloqueada» (grado repetido) y «Faltan 1 fragmentos» (sin singular). Sin lane todavía.
- Desfase de redondeo entre `server.ts` (`Math.floor(req*1.5)`) y `gradoDe` (150 % exacto) para `req` impar: se corrige en M3.

## Bitácora
- 2026-11-06 · claude (orquestador) · RESERVA · creada desde Plane #17
- 2026-11-07 · claude (orquestador) · INICIO · worktree creado, M1–M4 delegadas a agy
- 2026-11-07 · claude (orquestador) · avance · M1–M3 por agy; M4 BLOQUEADA por agy con razón (ancla duplicada en ColeccionView, error de la spec) → precondición corregida (sangría de 18 espacios) y M4 relanzada; cada línea verificada contra la spec; gates: tsc 0 · eslint 0 · npm test 577/0/51; commit 0c79ef7. Falta M5 (visual) y push/PR
- 2026-11-07 · claude (orquestador) · avance · M5 verificada en base local (ver Hallazgos). Falta push/PR
- 2026-11-07 · claude (orquestador) · INTEGRADA · PR #72 a `dev` (merge commit); dev → main en PR #84 (lo integra Gabriel)
