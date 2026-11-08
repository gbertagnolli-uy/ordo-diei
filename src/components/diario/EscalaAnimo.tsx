"use client";
// Diario (lane 286): la escala de ánimo en uso, disponible para todo el diario. Portado de vendor/Daily_You/lib/widgets/{mood_icon,mood_scale_glyph}.dart
// y lib/providers/mood_scale_provider.dart (Demizo/Daily_You@7cc237d): el ícono de cada nivel sale de la escala configurada, no de una lista fija.
import { createContext, useCallback, useContext, useEffect, useState, type CSSProperties } from "react";
import { Circle } from "lucide-react";
import { ESCALA_PREDETERMINADA, type EscalaAnimo, type NivelAnimo } from "@/lib/diario/escala";
import type { TipoDiario } from "@/lib/diario/reglas";
import { toast } from "@/lib/toast";
import { FONDO_ANIMO } from "./animo";
import { IconoEtiqueta } from "./etiquetas/iconos";

const Contexto = createContext<EscalaAnimo>(ESCALA_PREDETERMINADA);
export const ProveedorEscala = Contexto.Provider;
/** La escala del diario abierto (la predeterminada si no hay proveedor o todavía no cargó). */
export const useEscala = () => useContext(Contexto);

/** Daily You `MoodScaleGlyph`: el emoji, o el ícono del catálogo con el color del nivel; sin ícono, un círculo. */
export function GlifoAnimo({ nivel, tamano = 24 }: { nivel: NivelAnimo; tamano?: number }) {
  return <IconoEtiqueta icono={nivel.icono} tipoIcono={nivel.tipoIcono} reemplazo={Circle} color={nivel.color} tamano={tamano} />;
}

/** Fondo de un punto o barra de un nivel: el color elegido o, si no hay, el del tema (el de siempre). */
export function fondoDe(nivel: NivelAnimo): { className?: string; style?: CSSProperties } {
  return nivel.color ? { style: { backgroundColor: nivel.color } } : { className: FONDO_ANIMO[nivel.valor] };
}

const COLOR_PREDETERMINADO: Record<number, string> = {
  1: "var(--destructive)",
  2: "var(--warning)",
  3: "var(--muted-foreground)",
  4: "color-mix(in oklch, var(--primary) 60%, transparent)",
  5: "var(--success)",
};

/** El color del nivel como valor CSS (para gráficos): el elegido o el del tema, el mismo que `fondoDe`. */
export const colorDe = (nivel: NivelAnimo): string => nivel.color ?? COLOR_PREDETERMINADO[nivel.valor] ?? "var(--primary)";

type Pedido = { escala: EscalaAnimo };

async function pedir(url: string, metodo: string, cuerpo?: unknown): Promise<EscalaAnimo> {
  const r = await fetch(url, { method: metodo, headers: cuerpo ? { "content-type": "application/json" } : undefined, body: cuerpo ? JSON.stringify(cuerpo) : undefined });
  const d = (await r.json().catch(() => ({}))) as Partial<Pedido> & { error?: string };
  if (!r.ok || !d.escala) throw new Error(d.error ?? "No se pudo completar");
  return d.escala;
}

export interface AccionesEscala {
  escala: EscalaAnimo;
  /** Devuelve si salió bien (si no, ya avisó con un toast). */
  guardar: (niveles: EscalaAnimo) => Promise<boolean>;
  restablecer: () => Promise<boolean>;
}

/** Carga la escala del diario y expone cómo cambiarla (hace el papel de `MoodScaleProvider`). */
export function useEscalaAnimo(tipo: TipoDiario): AccionesEscala {
  const [escala, setEscala] = useState<EscalaAnimo>(ESCALA_PREDETERMINADA);

  useEffect(() => {
    let vivo = true;
    pedir(`/api/diario/escala?tipo=${tipo}`, "GET")
      .then((e) => vivo && setEscala(e))
      .catch(() => {
        /* sin escala propia se usa la predeterminada */
      });
    return () => {
      vivo = false;
    };
  }, [tipo]);

  const guardar = useCallback(
    async (niveles: EscalaAnimo) => {
      try {
        setEscala(await pedir("/api/diario/escala", "PUT", { tipo, niveles }));
        return true;
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "No se pudo guardar la escala");
        return false;
      }
    },
    [tipo],
  );

  const restablecer = useCallback(async () => {
    try {
      setEscala(await pedir(`/api/diario/escala?tipo=${tipo}`, "DELETE"));
      return true;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo restablecer la escala");
      return false;
    }
  }, [tipo]);

  return { escala, guardar, restablecer };
}
