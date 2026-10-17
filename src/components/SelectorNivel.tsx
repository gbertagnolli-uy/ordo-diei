"use client";

// Selector de nivel con el SloshGauge y sus etiquetas al costado. Lo usan la dificultad de la tarea
// y la conducta diaria. El gauge es continuo (0–100): se arrastra libre y al soltar se acomoda en el
// centro del tramo.
import { useEffect, useState } from "react";
import SloshGauge from "@/components/SloshGauge";
import { useThemeStore } from "@/store/themeStore";

/**
 * Configuración global del selector de nivel: todos los lugares donde se usa (dificultad de la tarea,
 * conducta diaria, lo que venga) heredan esto, así se ve y se siente igual en toda la app.
 */
export const CONFIG_SELECTOR_NIVEL = {
  alto: 176,
  /** El líquido arranca vacío y se llena hasta el nivel al aparecer */
  llenarAlMontar: true,
  /** viscosidad: 0 = rígido; salpicadura: cuánto rebota en los bordes; inclinacion: cuánto se ladea al moverse */
  fluidez: { viscosidad: 0.1, salpicadura: 0.55, inclinacion: 0.7 },
} as const;

export type SelectorNivelProps<T extends string | number> = {
  id?: string;
  /** De menor a mayor: el primero queda abajo */
  niveles: readonly { valor: T; etiqueta: string }[];
  valor: T;
  onChange: (valor: T) => void;
  /** Un color por nivel, para tema claro y oscuro */
  colores: { claro: readonly string[]; oscuro: readonly string[] };
  ariaLabel: string;
  /** Solo para casos especiales: por defecto vale CONFIG_SELECTOR_NIVEL */
  alto?: number;
};

export function SelectorNivel<T extends string | number>({ id, niveles, valor, onChange, colores, ariaLabel, alto = CONFIG_SELECTOR_NIVEL.alto }: SelectorNivelProps<T>) {
  const darkMode = useThemeStore((st) => st.darkMode);
  const tramo = 100 / niveles.length;
  const indice = Math.max(0, niveles.findIndex((n) => n.valor === valor));
  const centro = (i: number) => (i + 1) * tramo;
  const indiceDe = (v: number) => Math.min(niveles.length - 1, Math.max(0, Math.ceil(v / tramo) - 1));

  const [nivel, setNivel] = useState(() => (CONFIG_SELECTOR_NIVEL.llenarAlMontar ? 0 : centro(indice)));
  useEffect(() => {
    if (!CONFIG_SELECTOR_NIVEL.llenarAlMontar) return;
    const id = requestAnimationFrame(() => setNivel(centro(indice)));
    return () => cancelAnimationFrame(id);
    // solo al montar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Si el valor cambia desde afuera (p. ej. al cargar lo registrado), el gauge lo sigue.
  const [valorPrevio, setValorPrevio] = useState(valor);
  if (valorPrevio !== valor) {
    setValorPrevio(valor);
    if (indiceDe(nivel) !== indice) setNivel(centro(indice));
  }

  return (
    <div
      id={id}
      className="flex items-center gap-4"
      onPointerUpCapture={() => setNivel(centro(indice))}
      onPointerCancelCapture={() => setNivel(centro(indice))}
    >
      <SloshGauge
        value={nivel}
        onChange={(v) => { setNivel(v); onChange(niveles[indiceDe(v)].valor); }}
        interactive
        showValue={false}
        liquidColor={colores[darkMode ? "oscuro" : "claro"][indice]}
        glassColor="var(--muted)"
        className="ring-1 ring-border"
        width={64}
        height={alto}
        radius={16}
        ticks={niveles.length}
        viscosity={CONFIG_SELECTOR_NIVEL.fluidez.viscosidad}
        splash={CONFIG_SELECTOR_NIVEL.fluidez.salpicadura}
        tilt={CONFIG_SELECTOR_NIVEL.fluidez.inclinacion}
        ariaLabel={ariaLabel}
      />
      <ul className="flex flex-col-reverse text-sm">
        {niveles.map((n, i) => (
          <li key={String(n.valor)} style={{ height: alto / niveles.length }} className={"flex items-center " + (i === indice ? "font-semibold text-foreground" : "text-muted-foreground")}>
            {n.etiqueta}
          </li>
        ))}
      </ul>
    </div>
  );
}
