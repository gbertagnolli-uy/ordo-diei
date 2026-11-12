---
lane: 259
titulo: Panel para editar la rutina
plane: "#11"
estado: integrada
rama: task/lane-259-panel-editar-rutina
agente: "-"
actualizado: 2026-11-07
---

# Lane 259 — Panel para editar la rutina

## Especificación
Plane #11: «Agregar panel para editar rutina» (sin descripción).

Cómo está hoy (verificado el 2026-11-07):
- La rutina (`/dashboard/horarios`, `RutinaClientPage`) se guarda en **`localStorage` de cada dispositivo** (`ordo_diei_rutina_config_v1`). El `POST /api/rutina` la guarda en una **variable en memoria del servidor** que se pierde en cada despliegue o instancia nueva de Vercel, y nadie la vuelve a leer.
- Los padres ya pueden agregar o editar etapas desde `/dashboard/horarios` (`EditorEtapaModal`), pero **el cambio queda solo en su dispositivo**: los chicos siguen viendo la rutina vieja.

Qué se hace:
1. La rutina base de la familia (**etapas** y **notas semanales**) pasa a la base: una fila única `Rutina_Familiar`. Todos los dispositivos la leen al abrir `/dashboard/horarios`.
2. Solo un padre o una madre puede guardarla (`POST /api/rutina` → 403 para los demás).
3. Pantalla nueva **`/dashboard/admin/rutina`** («Rutina familiar» en el panel de administración): lista de etapas por hora, con editar, eliminar, nueva etapa y restablecer; y los tres textos semanales (enfoque, sábado, domingo). Cada cambio se guarda en el servidor al momento.
4. Lo propio de cada dispositivo sigue en `localStorage` sin cambios: sonido, volumen, notificaciones, el ajuste del día (posponer, pausar) y las etapas cumplidas hoy.

## Decisiones
- D1 · **Supuesto del orquestador** (Plane no trae descripción): «panel» = pantalla de administración + rutina compartida en la base. Si Gabriel quería otra cosa, se ajusta antes de empezar M5.
- D2 · Las **metas mensuales** quedan en `localStorage` en esta lane (los chicos las tildan; compartirlas pide otra regla de permisos). Queda en Pendientes.
- D3 · Si la base todavía no tiene rutina guardada, el primer **padre** que abre `/dashboard/horarios` publica la de su dispositivo (así no se pierde una rutina personalizada). Los chicos no publican nunca.
- D4 · Al abrir por primera vez un dispositivo sin nada guardado ya **no** se publica la rutina por defecto (hoy `obtenerConfiguracionRutina()` lo hace y pisaría la de la familia).
- D5 · Modelo `RutinaFamiliar` (no `ConfiguracionRutina`, que ya es un tipo de `lib/rutina/tipos.ts`). Tabla `Rutina_Familiar`.
- D6 · (orquestador, 2026-11-07) M5–M8 (servidor, API, storage, sincronizar) se hacen **sin esperar D1**: corrigen un defecto verificado (lo que edita un padre queda solo en su dispositivo y `POST /api/rutina` guarda en memoria) y sirven para cualquier lectura de «panel». Solo M9–M11 (pantalla de administración) esperan D1. M2: la tabla ya está en la base local (`verif-db/sql/10-lane259.sql`, sin DROP); en producción sigue esperando el OK de Gabriel.
- D7 · (orquestador, 2026-11-07) La prueba en ejecución mostró que, con la base vacía, el padre publicaba **dos veces** al abrir `/dashboard/horarios` (versión 2 en vez de 1): la pantalla se monta dos veces seguidas en desarrollo y cada llamada a `sincronizarDesdeServidor` veía la base vacía. Mismo contenido, sin daño, pero dos escrituras. Se corrige con M8b: las llamadas simultáneas comparten una sola sincronización.
- D8 · (orquestador, 2026-11-07) M9–M11 también se hicieron con el supuesto de D1 (pantalla de administración + rutina compartida): `PanelAdmin.tsx` no lo toca ninguna otra lane abierta (la 274 M9 va después de esta). Si Gabriel define otra cosa para «panel», se ajusta en esta misma lane antes de integrar.

## Arquitectura
- **Base** (orquestador): tabla `Rutina_Familiar` (id=1, `Etapas` jsonb, `Semanal_Config` jsonb, `Version`, `Actualizado_Por_ID`, `Actualizado_En`).
- `src/lib/rutina/validarRutina.ts` (nuevo, puro) + `validarRutina.test.ts`.
- `src/lib/rutina/servidorRutina.ts` (nuevo): leer y guardar la fila.
- `src/app/api/rutina/route.ts`: GET desde la base; POST solo padres, validado.
- `src/lib/rutina/storageRutina.ts`: publica solo cuando cambia la rutina base; `sincronizarDesdeServidor(esPadre)`.
- `src/components/rutina/RutinaClientPage.tsx`: llama a la sincronización al montar.
- `src/components/admin/PanelRutina.tsx` (nuevo) + `src/app/dashboard/admin/rutina/page.tsx` (nuevo).
- `src/components/admin/PanelAdmin.tsx`: tarjeta nueva. **Serializa con 274** (también agrega una tarjeta).

## Archivos en alcance
- `prisma/schema.prisma` (modificar)
- `src/lib/rutina/validarRutina.ts` (crear)
- `src/lib/rutina/validarRutina.test.ts` (crear)
- `src/lib/rutina/servidorRutina.ts` (crear)
- `src/app/api/rutina/route.ts` (reemplazar)
- `src/lib/rutina/storageRutina.ts` (reemplazar)
- `src/components/rutina/RutinaClientPage.tsx` (modificar)
- `src/components/admin/PanelRutina.tsx` (crear)
- `src/app/dashboard/admin/rutina/page.tsx` (crear)
- `src/components/admin/PanelAdmin.tsx` (modificar)

## Microtareas

### M1 · Esquema [agy]
- [x] hecha (agy)

Archivos: `prisma/schema.prisma`
Precondición: `grep -c '@@map("Config_Reposo")' prisma/schema.prisma` → `1`; `grep -c 'model RutinaFamiliar' prisma/schema.prisma` → `0`.
Pasos:
1. Reemplazar:
```prisma
  @@map("Config_Reposo")
}
```
por:
```prisma
  @@map("Config_Reposo")
}

// ← Lane 259: rutina base de la familia, compartida por todos los dispositivos (una sola fila, id = 1).
// Lo propio de cada dispositivo (sonido, ajuste del día, etapas cumplidas, metas) sigue en localStorage.
model RutinaFamiliar {
  id               Int      @id @default(1)
  etapas           Json     @map("Etapas")
  semanalConfig    Json     @map("Semanal_Config")
  version          Int      @default(1) @map("Version")
  actualizadoPorId Int?     @map("Actualizado_Por_ID")
  actualizadoEn    DateTime @updatedAt @map("Actualizado_En")

  @@map("Rutina_Familiar")
}
```
2. `npx prisma format` y `npx prisma generate`. **No** `db push`, `migrate` ni `db execute`.
Verificación: `npx prisma validate`.

### M2 · Aplicar en la base [orquestador]
- [x] hecha (producción 2026-11-07, ver Hallazgos)
AGENTS.md regla 7. El SQL esperado es solo `CREATE TABLE "Rutina_Familiar" (...)` con su PK. Si aparece `DROP`, no se aplica.

### M3 · Validación pura [agy]
- [x] hecha (agy)

Archivos: `src/lib/rutina/validarRutina.ts` (crear con este contenido exacto)
```ts
// Validación de la rutina familiar que guarda un padre (lane 259). Pura: sin base ni red.
import { CATEGORIAS_INFO, type DiasAplicables, type EtapaRutina, type RutinaSemanalConfig } from "./tipos.ts";

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
const MAX_ETAPAS = 100;

export type ResultadoValidacion =
  | { ok: true; etapas: EtapaRutina[]; semanalConfig: RutinaSemanalConfig }
  | { ok: false; error: string };

function diasValidos(d: unknown): d is DiasAplicables {
  if (d === "todos" || d === "laborables" || d === "finDeSemana") return true;
  return Array.isArray(d) && d.length > 0 && d.every((n) => Number.isInteger(n) && n >= 0 && n <= 6);
}

function semanalValida(s: unknown): s is RutinaSemanalConfig {
  if (!s || typeof s !== "object") return false;
  const v = s as Record<string, unknown>;
  return (
    Array.isArray(v.diasLaborables) &&
    v.diasLaborables.every((x) => typeof x === "string") &&
    typeof v.enfoqueSemanal === "string" &&
    typeof v.notasSabado === "string" &&
    typeof v.notasDomingo === "string"
  );
}

export function validarRutinaFamiliar(body: unknown): ResultadoValidacion {
  if (!body || typeof body !== "object") return { ok: false, error: "Falta la rutina" };
  const { etapas, semanalConfig } = body as { etapas?: unknown; semanalConfig?: unknown };
  if (!Array.isArray(etapas) || etapas.length === 0) return { ok: false, error: "La rutina necesita al menos una etapa" };
  if (etapas.length > MAX_ETAPAS) return { ok: false, error: `Máximo ${MAX_ETAPAS} etapas` };
  if (!semanalValida(semanalConfig)) return { ok: false, error: "Faltan las notas semanales" };

  const ids = new Set<string>();
  const limpias: EtapaRutina[] = [];
  for (const [i, e] of etapas.entries()) {
    const n = i + 1;
    if (!e || typeof e !== "object") return { ok: false, error: `Etapa ${n}: formato inválido` };
    const x = e as Record<string, unknown>;
    if (typeof x.id !== "string" || !x.id.trim()) return { ok: false, error: `Etapa ${n}: falta el id` };
    if (ids.has(x.id)) return { ok: false, error: `Etapa ${n}: id repetido` };
    ids.add(x.id);
    if (typeof x.titulo !== "string" || !x.titulo.trim() || x.titulo.length > 120) return { ok: false, error: `Etapa ${n}: título vacío o de más de 120 caracteres` };
    if (typeof x.horaInicio !== "string" || !HHMM.test(x.horaInicio)) return { ok: false, error: `Etapa ${n}: hora de inicio inválida` };
    if (typeof x.horaFin !== "string" || !HHMM.test(x.horaFin)) return { ok: false, error: `Etapa ${n}: hora de fin inválida` };
    // La de la noche cruza la medianoche (22:00 → 08:00): solo se rechaza inicio = fin
    if (x.horaInicio === x.horaFin) return { ok: false, error: `Etapa ${n}: empieza y termina a la misma hora` };
    if (typeof x.categoria !== "string" || !(x.categoria in CATEGORIAS_INFO)) return { ok: false, error: `Etapa ${n}: categoría desconocida` };
    if (typeof x.icono !== "string" || !x.icono) return { ok: false, error: `Etapa ${n}: falta el ícono` };
    if (typeof x.alarmaSonora !== "boolean") return { ok: false, error: `Etapa ${n}: alarma inválida` };
    if (typeof x.duracionMin !== "number" || x.duracionMin < 0) return { ok: false, error: `Etapa ${n}: duración inválida` };
    if (!diasValidos(x.diasSemana)) return { ok: false, error: `Etapa ${n}: días inválidos` };
    limpias.push(e as EtapaRutina);
  }
  limpias.sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
  return { ok: true, etapas: limpias, semanalConfig: semanalConfig as RutinaSemanalConfig };
}
```
Verificación: `npx tsc --noEmit`.

### M4 · Tests [agy]
- [x] hecha (agy)

Archivos: `src/lib/rutina/validarRutina.test.ts` (crear con este contenido exacto)
```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { validarRutinaFamiliar } from "./validarRutina.ts";
import { CONFIGURACION_DEFAULT } from "./tipos.ts";

const base = () => ({ etapas: structuredClone(CONFIGURACION_DEFAULT.etapas), semanalConfig: structuredClone(CONFIGURACION_DEFAULT.semanalConfig) });

test("la rutina por defecto es válida (incluida la etapa que cruza la medianoche)", () => {
  const r = validarRutinaFamiliar(base());
  assert.equal(r.ok, true);
});

test("ordena las etapas por hora de inicio", () => {
  const b = base();
  b.etapas.reverse();
  const r = validarRutinaFamiliar(b);
  assert.ok(r.ok);
  if (r.ok) assert.equal(r.etapas[0].horaInicio <= r.etapas[1].horaInicio, true);
});

test("rechaza hora mal formada, id repetido, categoría desconocida y sin etapas", () => {
  const hora = base();
  hora.etapas[0].horaInicio = "8:00";
  assert.equal(validarRutinaFamiliar(hora).ok, false);

  const repetido = base();
  repetido.etapas[1].id = repetido.etapas[0].id;
  assert.equal(validarRutinaFamiliar(repetido).ok, false);

  const cat = base();
  (cat.etapas[0] as unknown as { categoria: string }).categoria = "inventada";
  assert.equal(validarRutinaFamiliar(cat).ok, false);

  assert.equal(validarRutinaFamiliar({ etapas: [], semanalConfig: base().semanalConfig }).ok, false);
  assert.equal(validarRutinaFamiliar({ etapas: base().etapas }).ok, false);
});
```
Verificación: `npm test`. Si `tipos.ts` no se puede importar desde el test (error de módulo), **STOP** (`BLOQUEADO: import tipos.ts`).

### M5 · Servidor [agy]
- [x] hecha (`654a72c`, agy, idéntica a la spec)

Archivos: `src/lib/rutina/servidorRutina.ts` (crear con este contenido exacto)
```ts
// Rutina familiar en la base (lane 259): una sola fila, id = 1.
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import type { EtapaRutina, RutinaSemanalConfig } from "./tipos";

export interface RutinaFamiliarGuardada {
  etapas: EtapaRutina[];
  semanalConfig: RutinaSemanalConfig;
  version: number;
}

export async function leerRutinaFamiliar(): Promise<RutinaFamiliarGuardada | null> {
  const fila = await prisma.rutinaFamiliar.findUnique({ where: { id: 1 } });
  if (!fila) return null;
  return {
    etapas: fila.etapas as unknown as EtapaRutina[],
    semanalConfig: fila.semanalConfig as unknown as RutinaSemanalConfig,
    version: fila.version,
  };
}

export async function guardarRutinaFamiliar(
  etapas: EtapaRutina[],
  semanalConfig: RutinaSemanalConfig,
  usuarioId: number
): Promise<RutinaFamiliarGuardada> {
  const datos = {
    etapas: etapas as unknown as Prisma.InputJsonValue,
    semanalConfig: semanalConfig as unknown as Prisma.InputJsonValue,
    actualizadoPorId: usuarioId,
  };
  const fila = await prisma.rutinaFamiliar.upsert({
    where: { id: 1 },
    create: { id: 1, ...datos },
    update: { ...datos, version: { increment: 1 } },
  });
  return { etapas, semanalConfig, version: fila.version };
}
```

### M6 · API [agy]
- [x] hecha (`654a72c`, agy, idéntica a la spec)

Archivos: `src/app/api/rutina/route.ts` (reemplazar el contenido completo por este)
```ts
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { esPadre } from "@/lib/habitos/permisos";
import { CONFIGURACION_DEFAULT } from "@/lib/rutina/tipos";
import { validarRutinaFamiliar } from "@/lib/rutina/validarRutina";
import { guardarRutinaFamiliar, leerRutinaFamiliar } from "@/lib/rutina/servidorRutina";

export const dynamic = "force-dynamic";

// Rutina base de la familia (lane 259). `guardada: false` = todavía no hay fila en la base.
export async function GET() {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    const rutina = await leerRutinaFamiliar();
    if (!rutina) {
      return NextResponse.json({
        guardada: false,
        etapas: CONFIGURACION_DEFAULT.etapas,
        semanalConfig: CONFIGURACION_DEFAULT.semanalConfig,
        version: 0,
      });
    }
    return NextResponse.json({ guardada: true, ...rutina });
  } catch (err) {
    console.error("[API/Rutina] GET error:", err);
    return NextResponse.json({ error: "No se pudo leer la rutina" }, { status: 500 });
  }
}

// Solo padres. Cuerpo: { etapas, semanalConfig }
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!esPadre(session.user.rolFamiliar)) {
    return NextResponse.json({ error: "Solo los padres pueden cambiar la rutina" }, { status: 403 });
  }
  try {
    const v = validarRutinaFamiliar(await req.json().catch(() => null));
    if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });
    const rutina = await guardarRutinaFamiliar(v.etapas, v.semanalConfig, Number(session.user.id));
    return NextResponse.json({ ok: true, guardada: true, ...rutina });
  } catch (err) {
    console.error("[API/Rutina] POST error:", err);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
```
Verificación: `npx tsc --noEmit`.

### M7 · Storage del cliente [agy]
- [x] hecha (`654a72c`, agy, idéntica a la spec)

Archivos: `src/lib/rutina/storageRutina.ts` (reemplazar el contenido completo por este)
```ts
import { ConfiguracionRutina, CONFIGURACION_DEFAULT } from "./tipos";

const STORAGE_KEY = "ordo_diei_rutina_config_v1";

// Lane 259: la rutina BASE (etapas + notas semanales) es de la familia y vive en el servidor.
// Se publica solo cuando cambia; lo demás (sonido, ajuste del día, cumplidas, metas) es del dispositivo.
let ultimaBasePublicada: string | null = null;
const claveBase = (c: Pick<ConfiguracionRutina, "etapas" | "semanalConfig">) =>
  JSON.stringify({ etapas: c.etapas, semanalConfig: c.semanalConfig });

/**
 * Lee la configuración de rutina desde localStorage o retorna la predeterminada.
 */
export function obtenerConfiguracionRutina(): ConfiguracionRutina {
  if (typeof window === "undefined") {
    return CONFIGURACION_DEFAULT;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Dispositivo nuevo: se guarda local SIN publicar (no pisa la rutina de la familia)
      guardarConfiguracionRutina(CONFIGURACION_DEFAULT, false);
      if (ultimaBasePublicada === null) ultimaBasePublicada = claveBase(CONFIGURACION_DEFAULT);
      return CONFIGURACION_DEFAULT;
    }
    const parsed = JSON.parse(raw);
    // Garantizar que tenga las propiedades mínimas
    if (!parsed || !Array.isArray(parsed.etapas)) {
      return CONFIGURACION_DEFAULT;
    }
    const config: ConfiguracionRutina = {
      ...CONFIGURACION_DEFAULT,
      ...parsed,
      etapas: parsed.etapas.length > 0 ? parsed.etapas : CONFIGURACION_DEFAULT.etapas,
    };
    if (ultimaBasePublicada === null) ultimaBasePublicada = claveBase(config);
    return config;
  } catch (err) {
    console.error("[StorageRutina] Error al leer configuración:", err);
    return CONFIGURACION_DEFAULT;
  }
}

function publicarBase(config: ConfiguracionRutina): void {
  const base = claveBase(config);
  if (base === ultimaBasePublicada) return;
  ultimaBasePublicada = base;
  fetch("/api/rutina", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ etapas: config.etapas, semanalConfig: config.semanalConfig }),
  }).catch(() => {
    // Sin red: el dispositivo ya guardó en localStorage; se reintenta en el próximo cambio
    ultimaBasePublicada = null;
  });
}

/**
 * Guarda la configuración en localStorage, notifica a los componentes y, si cambió la rutina base, la publica.
 * `publicar = false` solo guarda local (lectura inicial y sincronización desde el servidor).
 */
export function guardarConfiguracionRutina(config: ConfiguracionRutina, publicar = true): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    // Disparar evento para que otras pestañas o componentes se actualicen reactivamente
    window.dispatchEvent(new CustomEvent("rutina-actualizada", { detail: config }));
    if (publicar) publicarBase(config);
  } catch (err) {
    console.error("[StorageRutina] Error al guardar configuración:", err);
  }
}

/**
 * Trae la rutina base de la familia y la aplica en este dispositivo si cambió.
 * Si el servidor todavía no tiene ninguna y quien abre es padre/madre, publica la de este dispositivo (vault LANE_259, D3).
 */
export async function sincronizarDesdeServidor(esPadre: boolean): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const res = await fetch("/api/rutina", { cache: "no-store" });
    if (!res.ok) return;
    const remoto = await res.json();
    const local = obtenerConfiguracionRutina();
    if (!remoto?.guardada) {
      if (esPadre) {
        ultimaBasePublicada = null;
        publicarBase(local);
      }
      return;
    }
    if (!Array.isArray(remoto.etapas) || remoto.etapas.length === 0) return;
    const next: ConfiguracionRutina = {
      ...local,
      etapas: remoto.etapas,
      semanalConfig: remoto.semanalConfig ?? local.semanalConfig,
    };
    const base = claveBase(next);
    ultimaBasePublicada = base;
    if (base === claveBase(local)) return;
    // La rutina base cambió: el ajuste de hoy deja de valer (mismo criterio que el editor)
    guardarConfiguracionRutina({ ...next, ajusteDia: null }, false);
  } catch {
    // Sin red: se sigue con la copia local
  }
}

/**
 * Restablece la rutina y metas a la versión oficial predeterminada.
 */
export function restablecerRutinaDefault(): ConfiguracionRutina {
  guardarConfiguracionRutina(CONFIGURACION_DEFAULT);
  return CONFIGURACION_DEFAULT;
}
```
Verificación: `npx tsc --noEmit`.

### M8 · Sincronizar al abrir la rutina [agy]
- [x] hecha (`654a72c`, agy, idéntica a la spec)

Archivos: `src/components/rutina/RutinaClientPage.tsx`
Precondición: `grep -c '  restablecerRutinaDefault,' src/components/rutina/RutinaClientPage.tsx` → `1`; `grep -c '  // Mantener sincronizada la config si otra parte de la app la guarda' src/components/rutina/RutinaClientPage.tsx` → `1`.
Pasos:
1. Reemplazar:
```tsx
  restablecerRutinaDefault,
} from "@/lib/rutina/storageRutina";
```
por:
```tsx
  restablecerRutinaDefault,
  sincronizarDesdeServidor,
} from "@/lib/rutina/storageRutina";
```
2. Reemplazar `  // Mantener sincronizada la config si otra parte de la app la guarda` por:
```tsx
  // Rutina base de la familia (lane 259): se trae del servidor al abrir; el evento de abajo la aplica
  useEffect(() => {
    void sincronizarDesdeServidor(esPadre);
  }, [esPadre]);

  // Mantener sincronizada la config si otra parte de la app la guarda
```
Verificación: `npx tsc --noEmit` y `npx eslint src/components/rutina/RutinaClientPage.tsx`.

### M8b · Una sola sincronización a la vez [agy]
- [x] hecha (`654a72c`, agy, idéntica a la spec)
Archivo: `src/lib/rutina/storageRutina.ts`. Reemplazar exactamente este bloque (está una sola vez):
```ts
/**
 * Trae la rutina base de la familia y la aplica en este dispositivo si cambió.
 * Si el servidor todavía no tiene ninguna y quien abre es padre/madre, publica la de este dispositivo (vault LANE_259, D3).
 */
export async function sincronizarDesdeServidor(esPadre: boolean): Promise<void> {
```
por:
```ts
// Una sola sincronización a la vez: si la pantalla se monta dos veces seguidas, la segunda llamada espera
// a la primera en lugar de ver la base vacía y publicar de nuevo (vault LANE_259, D7).
let sincronizando: Promise<void> | null = null;

/**
 * Trae la rutina base de la familia y la aplica en este dispositivo si cambió.
 * Si el servidor todavía no tiene ninguna y quien abre es padre/madre, publica la de este dispositivo (vault LANE_259, D3).
 */
export function sincronizarDesdeServidor(esPadre: boolean): Promise<void> {
  if (!sincronizando) {
    sincronizando = sincronizarUnaVez(esPadre).finally(() => {
      sincronizando = null;
    });
  }
  return sincronizando;
}

async function sincronizarUnaVez(esPadre: boolean): Promise<void> {
```
No cambies ninguna otra línea. Verificación: `npx tsc --noEmit`.

### M9 · Panel de administración [agy]
- [x] hecha (`3eba890`, agy, idéntica a la spec)

Archivos: `src/components/admin/PanelRutina.tsx` (crear con este contenido exacto)
```tsx
"use client";

// Rutina familiar (lane 259): los padres editan la rutina base que ven todos los dispositivos.
import { useCallback, useEffect, useState } from "react";
import { Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/lib/toast";
import { CATEGORIAS_INFO, CONFIGURACION_DEFAULT, type DiasAplicables, type EtapaRutina, type RutinaSemanalConfig } from "@/lib/rutina/tipos";
import { EditorEtapaModal } from "@/components/rutina/EditorEtapaModal";
import { IconoRutina } from "@/components/rutina/IconoRutina";

const NOMBRES_DIA = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function textoDias(d: DiasAplicables): string {
  if (d === "todos") return "Todos los días";
  if (d === "laborables") return "Lunes a viernes";
  if (d === "finDeSemana") return "Fin de semana";
  return d.map((n) => NOMBRES_DIA[n]).join(", ");
}

export function PanelRutina() {
  const [etapas, setEtapas] = useState<EtapaRutina[] | null>(null);
  const [semanal, setSemanal] = useState<RutinaSemanalConfig>(CONFIGURACION_DEFAULT.semanalConfig);
  const [guardando, setGuardando] = useState(false);
  const [editorAbierto, setEditorAbierto] = useState(false);
  const [etapaEditada, setEtapaEditada] = useState<EtapaRutina | null>(null);

  useEffect(() => {
    fetch("/api/rutina", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        setEtapas(d.etapas);
        if (d.semanalConfig) setSemanal(d.semanalConfig);
      })
      .catch(() => toast.error("No se pudo cargar la rutina"));
  }, []);

  const guardar = useCallback(async (nuevasEtapas: EtapaRutina[], nuevaSemanal: RutinaSemanalConfig) => {
    setGuardando(true);
    try {
      const res = await fetch("/api/rutina", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ etapas: nuevasEtapas, semanalConfig: nuevaSemanal }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(d.error || "No se pudo guardar la rutina");
        return false;
      }
      setEtapas(d.etapas);
      setSemanal(d.semanalConfig);
      toast.success("Rutina guardada");
      return true;
    } finally {
      setGuardando(false);
    }
  }, []);

  if (!etapas) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  const abrirEditor = (etapa: EtapaRutina | null) => {
    setEtapaEditada(etapa);
    setEditorAbierto(true);
  };
  const onGuardarEtapa = (etapa: EtapaRutina) => {
    const existe = etapas.some((e) => e.id === etapa.id);
    void guardar(existe ? etapas.map((e) => (e.id === etapa.id ? etapa : e)) : [...etapas, etapa], semanal);
  };
  const onEliminarEtapa = (id: string) => {
    if (etapas.length <= 1) {
      toast.error("La rutina necesita al menos una etapa");
      return;
    }
    void guardar(etapas.filter((e) => e.id !== id), semanal);
  };
  const restablecer = () => {
    if (confirm("¿Restablecer la rutina familiar a los horarios por defecto? Se pierden los cambios.")) {
      void guardar(CONFIGURACION_DEFAULT.etapas, CONFIGURACION_DEFAULT.semanalConfig);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center gap-2">
          <div className="mr-auto">
            <CardTitle>Etapas del día</CardTitle>
            <CardDescription>Lo que cambies acá lo ve toda la familia en Rutina y horarios.</CardDescription>
          </div>
          <Button size="sm" onClick={() => abrirEditor(null)} disabled={guardando}>
            <Plus /> Nueva etapa
          </Button>
          <Button size="sm" variant="ghost" onClick={restablecer} disabled={guardando}>
            <RotateCcw /> Restablecer
          </Button>
        </CardHeader>
        <CardContent>
          <ul className="divide-y">
            {etapas.map((e) => (
              <li key={e.id} className="flex items-center gap-3 py-2">
                <span className="w-24 shrink-0 text-sm tabular-nums">
                  {e.horaInicio}–{e.horaFin}
                </span>
                <IconoRutina nombre={e.icono} className="size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{e.titulo}</p>
                  <p className="text-xs text-muted-foreground">
                    {CATEGORIAS_INFO[e.categoria]?.label ?? e.categoria} · {textoDias(e.diasSemana)}
                  </p>
                </div>
                <Button variant="ghost" size="icon-sm" aria-label={`Editar ${e.titulo}`} onClick={() => abrirEditor(e)} disabled={guardando}>
                  <Pencil />
                </Button>
                <Button variant="ghost" size="icon-sm" aria-label={`Eliminar ${e.titulo}`} onClick={() => onEliminarEtapa(e.id)} disabled={guardando}>
                  <Trash2 />
                </Button>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Semana</CardTitle>
          <CardDescription>Textos de la pestaña semanal.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="rutina-enfoque">Enfoque de la semana</Label>
            <Textarea id="rutina-enfoque" value={semanal.enfoqueSemanal} onChange={(ev) => setSemanal({ ...semanal, enfoqueSemanal: ev.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rutina-sabado">Sábado</Label>
            <Textarea id="rutina-sabado" value={semanal.notasSabado} onChange={(ev) => setSemanal({ ...semanal, notasSabado: ev.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rutina-domingo">Domingo</Label>
            <Textarea id="rutina-domingo" value={semanal.notasDomingo} onChange={(ev) => setSemanal({ ...semanal, notasDomingo: ev.target.value })} />
          </div>
          <Button onClick={() => void guardar(etapas, semanal)} disabled={guardando}>
            {guardando && <Spinner />} Guardar semana
          </Button>
        </CardContent>
      </Card>

      <EditorEtapaModal
        abierto={editorAbierto}
        onOpenChange={setEditorAbierto}
        etapaParaEditar={etapaEditada}
        onGuardar={onGuardarEtapa}
        onEliminar={onEliminarEtapa}
      />
    </div>
  );
}
```
Verificación: `npx tsc --noEmit` y `npx eslint src/components/admin/PanelRutina.tsx`. Si `Spinner`, `Label` o `toast.success` no existen con esa forma, **STOP** (no inventes otro componente).

### M10 · Página de administración [agy]
- [x] hecha (`3eba890`, agy, idéntica a la spec)

Archivos: `src/app/dashboard/admin/rutina/page.tsx` (crear con este contenido exacto)
```tsx
export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { esPadre } from "@/lib/habitos/permisos";
import { PageHeader } from "@/components/app/PageHeader";
import { PanelRutina } from "@/components/admin/PanelRutina";

export default async function AdminRutinaPage() {
  const session = await getSession();
  if (!session?.user) redirect("/");
  if (!esPadre(session.user.rolFamiliar)) redirect("/dashboard");

  return (
    <div className="flex flex-col">
      <PageHeader group="Administración" groupHref="/dashboard/admin" title="Rutina familiar" />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-6 sm:px-6">
        <PanelRutina />
      </main>
    </div>
  );
}
```

### M11 · Tarjeta en el panel de administración [agy]
- [x] hecha (`3eba890`, agy, idéntica a la spec)

Archivos: `src/components/admin/PanelAdmin.tsx`
Precondición: `grep -c '  Sunset,' src/components/admin/PanelAdmin.tsx` → `1`; `grep -c 'href: "/dashboard/admin/reposo"' src/components/admin/PanelAdmin.tsx` → `1`.
Pasos:
1. Reemplazar `  Sunset,` por:
```tsx
  Sunset,
  Clock,
```
2. Reemplazar:
```tsx
        { href: "/dashboard/admin/reposo", titulo: "Reposo", descripcion: "Tiempos de la pantalla de reposo, fotos de fondo y referencias.", icon: ImageIcon },
```
por:
```tsx
        { href: "/dashboard/admin/reposo", titulo: "Reposo", descripcion: "Tiempos de la pantalla de reposo, fotos de fondo y referencias.", icon: ImageIcon },
        { href: "/dashboard/admin/rutina", titulo: "Rutina familiar", descripcion: "Etapas y horarios del día que ve toda la familia.", icon: Clock },
```
Verificación: gates.

### M12 · Prueba [orquestador]
- [x] hecha (base local: `verif-db/i259.mjs` 11/11, `i259admin.mjs` 12/12, `i259e.mjs` (e) con reloj fijo 08:10: pausar y +5 min cambian solo el ajuste local, 0 POST; sin errores de consola)
Base local con la tabla creada. (a) Padre abre `/dashboard/horarios` sin fila en la base → se crea con su rutina local. (b) Padre edita una etapa en `/dashboard/admin/rutina` → hijo (otro navegador) recarga `/dashboard/horarios` y la ve. (c) `curl` POST como hijo → 403. (d) Navegador nuevo sin localStorage no pisa la fila (`version` no cambia). (e) Pausar/posponer en un dispositivo no cambia `version`.

## Criterios de aceptación
- Un cambio de un padre llega a todos los dispositivos al abrir la rutina.
- Un hijo no puede cambiar la rutina base (UI y API).
- Ajustes del día, cumplidas, sonido y metas siguen siendo del dispositivo.

## Gates
`npx prisma validate` · `npx tsc --noEmit` · `npm test` · `npx eslint src/lib/rutina/validarRutina.ts src/lib/rutina/validarRutina.test.ts src/lib/rutina/servidorRutina.ts src/app/api/rutina/route.ts src/lib/rutina/storageRutina.ts src/components/rutina/RutinaClientPage.tsx src/components/admin/PanelRutina.tsx src/app/dashboard/admin/rutina/page.tsx src/components/admin/PanelAdmin.tsx`

## Pendientes
- D1: confirmar con Gabriel antes de integrar (D8).
- D2: metas mensuales compartidas (otra lane si Gabriel lo quiere).

## Hallazgos
- Prueba en ejecución `verif-db/i259.mjs` (puerto 31259, base local): 401 sin sesión; hijo 403 y no publica; padre publica una sola vez al abrir con la base vacía (tras M8b; antes publicaba dos veces, D7); guardar sube la versión; cuerpo inválido 400; el otro dispositivo recibe el cambio y lo muestra en «Diaria»; un dispositivo nuevo no pisa la rutina. 11/11 sin errores de consola.
- `validarRutina` deja pasar campos extra dentro de una etapa (la primera prueba guardó un `nombre` inventado). Solo pueden escribir los padres; queda anotado.
- SQL de M2 (generado sin base contra el esquema de `dev`), solo aditivo, **no aplicado** (espera OK de Gabriel):
```sql
-- CreateTable
CREATE TABLE "Rutina_Familiar" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "Etapas" JSONB NOT NULL,
    "Semanal_Config" JSONB NOT NULL,
    "Version" INTEGER NOT NULL DEFAULT 1,
    "Actualizado_Por_ID" INTEGER,
    "Actualizado_En" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rutina_Familiar_pkey" PRIMARY KEY ("id")
);
```
- La spec tenía `as any` en el test de M4 (eslint `no-explicit-any`): corregido en la spec y en el código (`as unknown as { categoria: string }`, commit 5ed982e).
- Hoy `obtenerConfiguracionRutina()` en un dispositivo nuevo publica la rutina por defecto; con la rutina en la base eso la pisaría. M7 lo corrige (D4).
- Producción (2026-11-07, orquestador): esquema aplicado con el SQL aditivo de `prisma migrate diff --from-config-datasource` desde `dev` completo (todas las lanes juntas): 15 tablas, 4 enums, valor `virtud`, 2 columnas nullable en `Checklist_Items`; **0 DROP**, sin cambios de datos. `migrate diff` posterior vacío. Amparo: regla 7 de AGENTS.md + «hace lo que haya que hacer» de Gabriel.

## Bitácora
- 2026-11-07 · claude (orquestador) · RESERVA · creada desde Plane #11
- 2026-11-07 · claude (orquestador) · INICIO · M1, M3, M4 delegadas a agy; M5+ esperan confirmación de D1 por Gabriel; M2 (base) espera OK
- 2026-11-07 · claude (orquestador) · avance · M1, M3, M4 por agy (cada línea = spec); gates: tsc 0 · eslint 0 (tras corregir el `as any` de la spec) · npm test 576/0/51; commits 136bcc6 + 5ed982e. **Espera de Gabriel**: confirmar D1 (qué es «el panel») antes de M5, y OK para M2 en producción
- 2026-11-07 · claude (orquestador) · D6: M5–M8 delegadas a agy sin esperar D1.
- 2026-11-07 · claude (orquestador) + agy · M5–M8 y M8b por agy, idénticas; tsc 0, tests 627/576/0, eslint sin errores; prueba 11/11. Commit `654a72c`. Quedan M9–M11 (esperan D1), M2 en producción y M12.
- 2026-11-07 · claude (orquestador) + agy · M9–M11 por agy idénticas; tsc 0, eslint 0, tests 627/576/0; M12 completo en base local. Commit `3eba890`. Queda M2 en producción (OK de Gabriel).
- 2026-11-07 · claude (orquestador) · ENTREGA · PR #59 a dev (`scripts/abrir-pr.sh`: origin/dev incluido, tests + tsc verdes) con OK de Gabriel. Lo integra Gabriel; después `scripts/limpiar-lane.sh 259`.
- 2026-11-07 · claude (orquestador) · INTEGRADA · PR #59 a `dev` (merge commit); dev → main en PR #84 (lo integra Gabriel)
