"use client";

// Escena del compañero (lane 220): fondo + objetos + personaje en su pose, con el marco que da el nivel.
// Tocarlo lo hace decir algo. Todo el arte tiene respaldo (ver ImagenConRespaldo), así que funciona sin imágenes.
import { useState } from "react";
import { cn } from "@/lib/utils";
import { ImagenConRespaldo } from "@/components/engagement/ImagenConRespaldo";
import { accesorioDe, RUTA_IMAGEN, type Equipados } from "@/lib/engagement/accesorios";
import { datosDePersonaje, tieneFondo, type Personaje, type Pose } from "@/lib/engagement/companero";
import { fraseDe } from "@/lib/engagement/companeroFrases";

const MARCOS = [
  "",
  "ring-2 ring-amber-700/60",
  "ring-2 ring-slate-400",
  "ring-4 ring-amber-400",
  "ring-4 ring-amber-300 shadow-lg shadow-amber-300/60",
];

// Color de respaldo de cada escenario mientras no esté la ilustración
const FONDOS: Record<string, string> = {
  capilla: "from-amber-100 to-stone-300",
  jardin: "from-emerald-100 to-lime-300",
  hogar: "from-orange-100 to-amber-300",
  noche: "from-indigo-900 to-slate-700",
};

// Dónde se apoya cada objeto (según el orden en que se pusieron)
const LUGARES = ["bottom-[4%] left-[4%]", "bottom-[4%] right-[4%]", "bottom-[30%] right-[3%]"];

export const rutaDePose = (personaje: Personaje, pose: Pose) => `/companeros/${personaje}/${pose}.webp`;
/** La imagen del objeto que identifica al héroe */
export const rutaDeObjeto = (personaje: Personaje) => `/companeros/${personaje}/objeto.webp`;

type Props = {
  personaje: Personaje;
  pose: Pose;
  equipados: Equipados;
  marco: number;
  /** Nombre de quien lo cuida, para las frases al tocarlo */
  quien: string;
  /** Lo que dice al principio (opcional) */
  frase?: string;
  className?: string;
};

export function EscenaCompanero({ personaje, pose, equipados, marco, quien, frase, className }: Props) {
  const [dice, setDice] = useState(frase ?? null);
  const datos = datosDePersonaje(personaje);
  const fondo = accesorioDe(equipados.fondo);

  return (
    <button
      type="button"
      aria-label={`${datos.nombre}: tocalo para que te diga algo`}
      onClick={() => setDice(fraseDe(personaje, "toque", quien, Math.floor(Math.random() * 1000)))}
      className={cn(
        "relative block aspect-[3/4] w-full overflow-hidden rounded-xl bg-gradient-to-b text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
        FONDOS[equipados.fondo] ?? FONDOS.capilla,
        MARCOS[Math.min(marco, MARCOS.length - 1)],
        className,
      )}
    >
      {fondo && <ImagenConRespaldo srcs={[RUTA_IMAGEN(fondo)]} alt="" className="absolute inset-0 size-full object-cover" respaldo={null} />}
      {equipados.objetos.map((clave, i) => {
        const o = accesorioDe(clave);
        if (!o) return null;
        return (
          <span key={clave} className={cn("absolute aspect-square w-1/4", LUGARES[i] ?? LUGARES[0])}>
            <ImagenConRespaldo
              srcs={[RUTA_IMAGEN(o)]}
              alt={o.nombre}
              className="size-full object-contain"
              respaldo={<span aria-hidden className="flex size-full items-end justify-center text-3xl">{o.emoji}</span>}
            />
          </span>
        );
      })}
      <ImagenConRespaldo
        srcs={[rutaDePose(personaje, pose), rutaDePose(personaje, "neutral")]}
        alt={`${datos.nombre}, ${pose.replace("-", " ")}`}
        // «multiply» hace desaparecer el blanco de las poses que quedaron con fondo (buenos días)
        className={cn("absolute inset-x-0 bottom-0 mx-auto h-[92%] w-auto max-w-full object-contain", tieneFondo(pose) && "mix-blend-multiply")}
        respaldo={<span aria-hidden className="absolute inset-x-0 bottom-[12%] text-center text-7xl">{datos.emoji}</span>}
      />
      {dice && (
        <span role="status" className="absolute inset-x-2 top-2 rounded-xl border bg-background/95 px-3 py-2 text-sm shadow-sm">
          {dice}
        </span>
      )}
    </button>
  );
}
