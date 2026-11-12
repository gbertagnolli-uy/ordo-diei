---
lane: 264
titulo: Cronómetro de tarea — modal y ventana flotante
plane: "#21"
estado: integrada
rama: task/lane-264-cronometro-modal-flotante
agente: "-"
actualizado: 2026-11-07
---

# Lane 264 — Cronómetro de tarea: modal y ventana flotante

## Especificación
Plane #21: «Cuando se empieza una tarea haciendo click en iniciar: empieza el cronómetro y que se abra un modal con la cuenta regresiva y el título de la tarea; si el usuario sale (logout) o si se dirige a otra pantalla, debe quedar un modal de "pantalla en pantalla" que siempre se muestre abajo a la derecha, pero más chico, con el título de la tarea y la cuenta regresiva y el botón de "Finalizar" y el botón de "Pausar"».

Hoy el cronómetro solo se ve en la ficha de la tarea (`TaskDetailPanel`); el servidor ya lo guarda (`timerStartedAt`, `tiempoAcumuladoTimer` en `Tarea`), así que sigue corriendo aunque se cierre la ficha o la sesión.

Esperado:
1. Al tocar «Iniciar tarea» (o «Reanudar»): arranca el cronómetro y se abre un **modal grande** con el título y la cuenta regresiva (`mm:ss`, en rojo y con «¡Tiempo excedido!» al pasarse), con «Pausar», «Finalizar» y «Minimizar».
2. Al cerrar/minimizar el modal o ir a **cualquier otra pantalla de `/dashboard`**: aparece la **ventana flotante** abajo a la derecha, más chica, con título, cuenta regresiva, «Pausar» y «Finalizar». Tocar el título o el reloj vuelve a abrir el modal grande.
3. **Logout**: la sesión se cierra y la pantalla de login no muestra datos de nadie (es una tablet compartida por la familia). El cronómetro sigue corriendo en el servidor; cuando **ese mismo usuario** vuelve a entrar, la ventana flotante aparece sola.
4. «Pausar» (en cualquiera de las dos): pausa en el servidor y la ventana desaparece (la tarea queda «Pausada» en su lista, como hoy).
5. «Finalizar»: si la tarea pide foto de prueba y todavía no la tiene, no finaliza: avisa «Subí la foto de prueba para finalizar» y lleva a `/dashboard?s=progress`. Si no, la completa como «iniciada y finalizada» (100 %) y muestra el mismo modal de éxito que la ficha.

## Decisiones
- D1 · Logout (punto 3): la ventana **no** se muestra en el login. Mostrar la tarea de un hijo en la pantalla compartida a quien entre después sería mostrar datos de otro usuario. **Pregunta abierta para Gabriel**: si quería que se vea igual en el login, se agrega después; por defecto queda así.
- D2 · El estado «hay una tarea corriendo» sale del **servidor** (layout de `/dashboard`), no del navegador: así sobrevive a recargas, logout y cambio de dispositivo.
- D3 · Solo una tarea en curso por usuario (la primera con `timerStartedAt`). Hoy la app no impide iniciar dos; si pasa, se muestra la primera.
- D4 · La lógica de completar se extrae a `completarTarea()` para que la ficha y la ventana flotante usen exactamente la misma llamada.
- D5 · `/agenda` (fuera de `/dashboard`) no muestra la ventana en esta lane.
- D6 · (orquestador, 2026-11-07) **No hace falta esperar a la 263.** Verificado con `git diff --name-only dev...task/lane-263-…`: la 263 solo toca `TaskDetailPanel.tsx`; esta lane crea 3 archivos y modifica `useTaskActions.ts` y `src/app/dashboard/layout.tsx`, que ninguna rama `task/lane-*` abierta toca. Sin archivos en común, D-BP5 no obliga a serializar. D1 queda con su valor por defecto (la ventana no se muestra en el login) hasta que Gabriel diga otra cosa.
- D7 · (orquestador, 2026-11-07) El reloj se dibuja con `Date.now()` en el servidor y otra vez en el navegador; si entre los dos pasa un cambio de segundo, el texto no coincide y React tira «Hydration failed» (visto en la prueba M6 en `/dashboard/cartas`, solo con tarea en curso). Se corrige con `suppressHydrationWarning` en el `<span>` del reloj: es el mecanismo de React para textos que dependen de la hora; el intervalo lo actualiza al segundo siguiente. Microtarea M4b.

## Arquitectura
- `src/components/tasks/completarTarea.ts` (nuevo): `POST /api/tasks/:id/complete` y armado de los datos del modal de éxito.
- `src/store/cronometroStore.ts` (nuevo, zustand sin persistencia): `grandeId` = id de la tarea con el modal grande abierto.
- `src/components/tasks/useTaskActions.ts`: al iniciar abre el modal grande y refresca la ruta; al pausar refresca; `finishTask` usa `completarTarea`.
- `src/components/tasks/CronometroTarea.tsx` (nuevo, cliente): modal grande o ventana flotante según el store.
- `src/app/dashboard/layout.tsx`: trae los campos de la tarea en curso y dibuja `<CronometroTarea>`.

## Archivos en alcance
- `src/components/tasks/completarTarea.ts` (crear)
- `src/store/cronometroStore.ts` (crear)
- `src/components/tasks/CronometroTarea.tsx` (crear)
- `src/components/tasks/useTaskActions.ts` (modificar)
- `src/app/dashboard/layout.tsx` (modificar)

Sin archivos en común con 261/262/263/273 (D6). `layout.tsx` solo lo toca esta lane en la ola 2.

## Microtareas

### M1 · completarTarea() [agy]
- [x] hecha (`5bea30e`, agy)

Archivos: `src/components/tasks/completarTarea.ts` (crear con este contenido exacto)
```ts
// Completar una tarea (lo usan la ficha y el cronómetro flotante, lane 264): misma llamada y mismos datos del modal de éxito.
export type ModoCompletado = "iniciada_finalizada" | "realizada_directa";

export type ResultadoCompletar =
  | { ok: true; exito: Record<string, unknown> }
  | { ok: false; error: string };

export async function completarTarea(tareaId: number, elapsedSeconds: number, modoCompletado: ModoCompletado): Promise<ResultadoCompletar> {
  try {
    const res = await fetch(`/api/tasks/${tareaId}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ elapsedSeconds, modoCompletado }),
    });
    if (res.ok) {
      const data = await res.json();
      return {
        ok: true,
        exito: {
          mensaje: data.mensaje,
          puntos: data.puntos,
          basePoints: data.basePoints,
          streakBonus: data.streakBonus,
          checklistBonus: data.checklistBonus,
          porcentajePuntos: data.porcentajePuntos,
          fueIniciada: data.fueIniciada,
          isNewStreak: data.isNewStreak,
          streakDays: data.streakDays,
          isHappyHour: data.isHappyHour,
        },
      };
    }
    const errData = await res.json().catch(() => ({}));
    console.error("Error al completar:", res.status, errData);
    return { ok: false, error: errData.error || "Error al completar la tarea. Revisa tu conexión o intenta nuevamente." };
  } catch (e) {
    console.error("Error de conexión:", e);
    return { ok: false, error: "Error de conexión: " + (e instanceof Error ? e.message : String(e)) };
  }
}
```

### M2 · Store del cronómetro [agy]
- [x] hecha (`5bea30e`, agy)

Archivos: `src/store/cronometroStore.ts` (crear con este contenido exacto)
```ts
import { create } from "zustand";

// Cronómetro de tarea (lane 264): qué tarea tiene abierto el modal grande. Sin persistencia:
// si hay una tarea corriendo y nadie abrió el modal, se ve la ventana flotante.
interface CronometroState {
  grandeId: number | null;
  abrirGrande: (tareaId: number) => void;
  minimizar: () => void;
}

export const useCronometroStore = create<CronometroState>()((set) => ({
  grandeId: null,
  abrirGrande: (tareaId) => set({ grandeId: tareaId }),
  minimizar: () => set({ grandeId: null }),
}));
```

### M3 · useTaskActions abre el modal y usa completarTarea [agy]
- [x] hecha (`5bea30e`, agy)

Archivos: `src/components/tasks/useTaskActions.ts`
Precondición: `grep -c 'const res = await fetch(`/api/tasks/${task.id}/complete`' src/components/tasks/useTaskActions.ts` → `1`.
Pasos:
1. Reemplazar:
```ts
import { toast } from "@/lib/toast";
import { useEffect, useRef, useState } from "react";
import { useModalStore } from "@/store/modalStore";
```
por:
```ts
import { toast } from "@/lib/toast";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useModalStore } from "@/store/modalStore";
import { useCronometroStore } from "@/store/cronometroStore";
import { completarTarea } from "./completarTarea";
```
2. Reemplazar:
```ts
  const { openModal } = useModalStore();
```
por:
```ts
  const { openModal } = useModalStore();
  const router = useRouter();
```
3. Reemplazar:
```ts
  const togglePlay = async () => {
    if (!isPlaying) {
      try { await syncTimer("start"); } catch {}
      setStartedInSession(true);
      setIsPlaying(true);
    } else {
      try {
        const res = await syncTimer("pause");
        if (res.ok) setElapsed((await res.json()).tiempoAcumulado);
      } catch {}
      setIsPlaying(false);
    }
  };
```
por:
```ts
  const togglePlay = async () => {
    if (!isPlaying) {
      try { await syncTimer("start"); } catch {}
      setStartedInSession(true);
      setIsPlaying(true);
      // Modal grande con la cuenta regresiva; al salir queda la ventana flotante (lane 264)
      useCronometroStore.getState().abrirGrande(task.id);
    } else {
      try {
        const res = await syncTimer("pause");
        if (res.ok) setElapsed((await res.json()).tiempoAcumulado);
      } catch {}
      setIsPlaying(false);
      useCronometroStore.getState().minimizar();
    }
    // El layout vuelve a leer la tarea en curso (cronómetro flotante)
    router.refresh();
  };
```
4. Reemplazar el cuerpo de `finishTask` desde `    setLoading(true);` hasta el `return false;\n  };` que lo cierra, es decir este bloque exacto:
```ts
    setLoading(true);
    const modoCompletado = modoOverride ?? (fueIniciada ? "iniciada_finalizada" : "realizada_directa");
    try {
      const res = await fetch(`/api/tasks/${task.id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ elapsedSeconds: elapsed, modoCompletado }),
      });
      if (res.ok) {
        const data = await res.json();
        openModal("TASK_SUCCESS", {
          mensaje: data.mensaje,
          puntos: data.puntos,
          basePoints: data.basePoints,
          streakBonus: data.streakBonus,
          checklistBonus: data.checklistBonus,
          porcentajePuntos: data.porcentajePuntos,
          fueIniciada: data.fueIniciada,
          isNewStreak: data.isNewStreak,
          streakDays: data.streakDays,
          isHappyHour: data.isHappyHour,
        });
        return true;
      }
      const errData = await res.json().catch(() => ({}));
      console.error("Error al completar:", res.status, errData);
      toast.error(errData.error || "Error al completar la tarea. Revisa tu conexión o intenta nuevamente.");
    } catch (e: any) {
      console.error("Error de conexión:", e);
      toast.error("Error de conexión: " + e.message);
    } finally {
      setLoading(false);
    }
    return false;
  };
```
por:
```ts
    setLoading(true);
    const modoCompletado = modoOverride ?? (fueIniciada ? "iniciada_finalizada" : "realizada_directa");
    const r = await completarTarea(task.id, elapsed, modoCompletado);
    setLoading(false);
    if (r.ok) {
      useCronometroStore.getState().minimizar();
      openModal("TASK_SUCCESS", r.exito);
      return true;
    }
    toast.error(r.error);
    return false;
  };
```
5. En `pauseForConfirm`, reemplazar:
```ts
    if (isPlaying) {
      setIsPlaying(false);
      syncTimer("pause").catch(() => {});
    }
```
por:
```ts
    if (isPlaying) {
      setIsPlaying(false);
      syncTimer("pause").catch(() => {});
      useCronometroStore.getState().minimizar();
    }
```
Verificación: `grep -c '/complete' src/components/tasks/useTaskActions.ts` → `0`; `npx tsc --noEmit`.

### M4 · Componente CronometroTarea [agy]
- [x] hecha (`5bea30e`, agy)

Archivos: `src/components/tasks/CronometroTarea.tsx` (crear con este contenido exacto)
```tsx
"use client";

// Cronómetro de la tarea en curso (lane 264, Plane #21): modal grande al iniciar y ventana flotante
// abajo a la derecha en cualquier pantalla de /dashboard. La tarea en curso la manda el layout (servidor).
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Maximize2, Minimize2, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { useModalStore } from "@/store/modalStore";
import { useCronometroStore } from "@/store/cronometroStore";
import { formatClock } from "./taskUtils";
import { completarTarea } from "./completarTarea";

export type TareaEnCurso = {
  id: number;
  titulo: string;
  timerStartedAt: string;
  tiempoAcumuladoTimer: number;
  tiempoEjecucionEstimadoSeg: number;
  requiereFotoPrueba: boolean;
  fotoPruebaUrl: string | null;
};

export function CronometroTarea({ tarea }: { tarea: TareaEnCurso | null }) {
  const router = useRouter();
  const { openModal } = useModalStore();
  const grandeId = useCronometroStore((s) => s.grandeId);
  const abrirGrande = useCronometroStore((s) => s.abrirGrande);
  const minimizar = useCronometroStore((s) => s.minimizar);
  const [ahora, setAhora] = useState(() => Date.now());
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    if (!tarea) return;
    const id = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(id);
  }, [tarea]);

  if (!tarea) return null;

  const transcurrido = tarea.tiempoAcumuladoTimer + Math.max(0, Math.floor((ahora - Date.parse(tarea.timerStartedAt)) / 1000));
  const restante = tarea.tiempoEjecucionEstimadoSeg - transcurrido;
  const excedido = restante < 0;
  const grande = grandeId === tarea.id;

  async function pausar() {
    if (!tarea) return;
    setOcupado(true);
    try {
      await fetch(`/api/tasks/${tarea.id}/timer`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "pause" }),
      });
      minimizar();
      router.refresh();
    } catch {
      toast.error("No se pudo pausar. Revisá tu conexión.");
    } finally {
      setOcupado(false);
    }
  }

  async function finalizar() {
    if (!tarea) return;
    if (tarea.requiereFotoPrueba && !tarea.fotoPruebaUrl) {
      minimizar();
      toast.info("Subí la foto de prueba para finalizar");
      router.push("/dashboard?s=progress");
      return;
    }
    setOcupado(true);
    const r = await completarTarea(tarea.id, transcurrido, "iniciada_finalizada");
    setOcupado(false);
    if (!r.ok) {
      toast.error(r.error);
      return;
    }
    minimizar();
    openModal("TASK_SUCCESS", r.exito);
    router.refresh();
  }

  const reloj = (
    <span className={cn("font-mono font-semibold tabular-nums tracking-tight", excedido ? "text-destructive" : "text-success")}>
      {formatClock(restante)}
    </span>
  );

  if (grande) {
    return (
      <Modal isOpen onClose={minimizar} title={tarea.titulo} width="sm">
        <div className="flex flex-col items-center gap-5 text-center">
          <p className="text-sm text-muted-foreground">{excedido ? "¡Tiempo excedido!" : "Tiempo restante"}</p>
          <div className="text-6xl">{reloj}</div>
          <div className="flex w-full gap-3">
            <Button variant="outline" className="flex-1" disabled={ocupado} onClick={pausar}>
              <Pause /> Pausar
            </Button>
            <Button className="flex-1 bg-[var(--success)] text-[var(--on-success)] hover:bg-[var(--success-container)]" disabled={ocupado} onClick={finalizar}>
              <Check /> Finalizar
            </Button>
          </div>
          <Button variant="ghost" size="sm" onClick={minimizar}>
            <Minimize2 /> Minimizar
          </Button>
        </div>
      </Modal>
    );
  }

  return (
    <div
      role="region"
      aria-label="Tarea en curso"
      className="fixed right-4 bottom-24 z-50 w-64 rounded-xl border bg-popover p-3 text-popover-foreground shadow-lg print:hidden"
    >
      <button type="button" onClick={() => abrirGrande(tarea.id)} className="flex w-full items-start gap-2 text-left" aria-label="Abrir el cronómetro en grande">
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{tarea.titulo}</span>
          <span className="block text-2xl">{reloj}</span>
        </span>
        <Maximize2 className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
      </button>
      <div className="mt-2 flex gap-2">
        <Button size="sm" variant="outline" className="flex-1" disabled={ocupado} onClick={pausar}>
          <Pause /> Pausar
        </Button>
        <Button size="sm" className="flex-1 bg-[var(--success)] text-[var(--on-success)] hover:bg-[var(--success-container)]" disabled={ocupado} onClick={finalizar}>
          <Check /> Finalizar
        </Button>
      </div>
    </div>
  );
}
```
Verificación: `npx tsc --noEmit`; `npx eslint src/components/tasks/CronometroTarea.tsx`.

### M5 · El layout dibuja el cronómetro [agy]
- [x] hecha (`5bea30e`, agy)

Archivos: `src/app/dashboard/layout.tsx`
Precondición: `grep -c 'select: { id: true, estado: true, timerStartedAt: true, fechaVencimiento: true, horaEjecucion: true },' src/app/dashboard/layout.tsx` → `1`.
Pasos:
1. Debajo de `import ModoRelajado from "@/components/homeschooling/neuro/ModoRelajado";` agregar: `import { CronometroTarea, type TareaEnCurso } from "@/components/tasks/CronometroTarea";`
2. Reemplazar `      select: { id: true, estado: true, timerStartedAt: true, fechaVencimiento: true, horaEjecucion: true },` por:
```ts
      select: {
        id: true,
        estado: true,
        timerStartedAt: true,
        fechaVencimiento: true,
        horaEjecucion: true,
        // Cronómetro flotante de la tarea en curso (lane 264)
        titulo: true,
        tiempoAcumuladoTimer: true,
        tiempoEjecucionEstimadoSeg: true,
        requiereFotoPrueba: true,
        fotoPruebaUrl: true,
      },
```
3. Reemplazar `  // Lo que está pasando en la app, para que el compañero lo comente (lane 248)` por:
```ts
  // La tarea con el cronómetro en marcha se ve en todas las pantallas (lane 264)
  const enCurso = tasks.find((t) => t.timerStartedAt);
  const tareaEnCurso: TareaEnCurso | null =
    enCurso && enCurso.timerStartedAt
      ? {
          id: enCurso.id,
          titulo: enCurso.titulo,
          timerStartedAt: enCurso.timerStartedAt,
          tiempoAcumuladoTimer: enCurso.tiempoAcumuladoTimer,
          tiempoEjecucionEstimadoSeg: enCurso.tiempoEjecucionEstimadoSeg,
          requiereFotoPrueba: enCurso.requiereFotoPrueba,
          fotoPruebaUrl: enCurso.fotoPruebaUrl,
        }
      : null;
  // Lo que está pasando en la app, para que el compañero lo comente (lane 248)
```
4. Reemplazar `      <ModalManager bienvenidaHoy={bienvenidaHoy} />` por:
```tsx
      <ModalManager bienvenidaHoy={bienvenidaHoy} />
      <CronometroTarea tarea={tareaEnCurso} />
```
Verificación: `npx tsc --noEmit`; gates.

### M4b · El reloj no rompe la hidratación [agy]
- [x] hecha (`5bea30e`, agy)
Archivo: `src/components/tasks/CronometroTarea.tsx`. Un solo cambio. Reemplazá exactamente esta línea:
```tsx
    <span className={cn("font-mono font-semibold tabular-nums tracking-tight", excedido ? "text-destructive" : "text-success")}>
```
por esta:
```tsx
    <span suppressHydrationWarning className={cn("font-mono font-semibold tabular-nums tracking-tight", excedido ? "text-destructive" : "text-success")}>
```
No toques ninguna otra línea ni otro archivo. Verificación: `npx tsc --noEmit`.

### M6 · Prueba manual [orquestador]
- [x] hecha (orquestador, `verif-db/i264.mjs`: 19/19, sin errores de consola)
Base local, hijo: iniciar una tarea → modal grande con cuenta regresiva; «Minimizar» → ventana abajo a la derecha; ir a Hábitos y Cartas → sigue; tocarla → modal grande; «Pausar» → desaparece y la tarea queda Pausada; reanudar; logout → login sin ventana; volver a entrar como ese hijo → ventana; entrar como otro usuario → sin ventana; «Finalizar» con foto pendiente → aviso y `/dashboard?s=progress`; sin foto pendiente → modal de éxito. Teléfono 390 px: la ventana no tapa el Dock (Dock centrado abajo, ventana a la derecha con `bottom-24`).

## Criterios de aceptación
- Los 5 puntos de la especificación, verificados en M6.
- `npm test` y `tsc` verdes.

## Gates
`npx tsc --noEmit` · `npm test` · `npx eslint src/components/tasks/completarTarea.ts src/store/cronometroStore.ts src/components/tasks/CronometroTarea.tsx src/components/tasks/useTaskActions.ts src/app/dashboard/layout.tsx`

## Pendientes
- D1: confirmar con Gabriel el comportamiento en el login.

## Hallazgos
- La primera corrida de M6 mostró «Hydration failed» + «Encountered a script tag» solo con tarea en curso: el reloj usaba `Date.now()` en servidor y navegador. Corregido con M4b (D7); `verif-db/i264hid.mjs` lo reproduce.
- `/dashboard/habitos` da 500 (P2023 en `Habito`) en la base local mezclada por datos de la lane 257; no es de esta lane. La prueba usa `/dashboard/tienda` en su lugar.
- `useTaskActions.ts` arrastra 2 errores `no-explicit-any` de dev (dev tiene 3; esta lane quitó uno).
- En 390 px la ventana queda en y 634–748 y el botón del menú flotante debajo (≈775); el selector del Dock de la prueba no lo encontró, se verificó en la captura `cap264/264-cel.png`.

## Bitácora
- 2026-11-06 · claude (orquestador) · RESERVA · creada desde Plane #21
- 2026-11-07 · claude (orquestador) + agy · M1–M5 + M4b por agy, idénticas a la especificación; M6 19/19 sin errores de consola; tsc 0, tests 624/573/0/51. Commit `5bea30e`. Falta: PR (OK de Gabriel) y D1.
- 2026-11-07 · claude (orquestador) · ENTREGA · PR #61 a dev (`scripts/abrir-pr.sh`: origin/dev incluido, tests + tsc verdes) con OK de Gabriel. Lo integra Gabriel; después `scripts/limpiar-lane.sh 264`.
- 2026-11-07 · claude (orquestador) · INTEGRADA · PR #61 a `dev` (merge commit); dev → main en PR #84 (lo integra Gabriel)
