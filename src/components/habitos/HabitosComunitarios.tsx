"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { AdminItem } from "@/components/AdminItem";
import { useOutsideClick } from "@/hooks/use-outside-click";
import { CATEGORIAS } from "@/lib/habitos/catalogo";
import { HabitoIcon } from "./HabitoIcon";
import type { EstadoHabito, HabitoVista } from "@/lib/habitos/server";

// Basado en @aceternity/expandable-card-demo-standard, con hábitos creados por usuarios.
export function HabitosComunitarios({
  habitos,
  habitosActivos,
  onElegir,
  esAdmin = false,
  onEditar,
  onEliminar,
}: {
  habitos: HabitoVista[];
  habitosActivos: EstadoHabito[];
  onElegir: (habitoId: number) => void;
  /** Padre/Madre: editar y eliminar (archivar) cualquier hábito comunitario por swipe. */
  esAdmin?: boolean;
  onEditar?: (h: HabitoVista) => void;
  onEliminar?: (h: HabitoVista) => Promise<void>;
}) {
  const [active, setActive] = useState<HabitoVista | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => e.key === "Escape" && setActive(null);
    document.body.style.overflow = active ? "hidden" : "auto";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "auto";
    };
  }, [active]);

  useOutsideClick(ref as React.RefObject<HTMLDivElement>, () => setActive(null));

  const yaPractica = (h: HabitoVista) => habitosActivos.some((x) => x.habitoId === h.id);
  const textoCta = (h: HabitoVista) => (yaPractica(h) ? "Ya lo practicás" : "Adoptar");

  return (
    <>
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-10 h-full w-full bg-black/40"
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {active && (
          <div className="fixed inset-0 z-[100] grid place-items-center">
            <motion.button
              key={`close-${active.id}-${id}`}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.05 } }}
              className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-background lg:hidden"
              onClick={() => setActive(null)}
              aria-label="Cerrar"
            >
              <X className="size-4" />
            </motion.button>
            <motion.div
              layoutId={`card-${active.id}-${id}`}
              ref={ref}
              className="flex h-full w-full max-w-[500px] flex-col overflow-hidden bg-card sm:rounded-3xl md:h-fit md:max-h-[90%]"
            >
              <motion.div layoutId={`image-${active.id}-${id}`}>
                <Imagen h={active} className="h-80 w-full object-cover object-top sm:rounded-t-lg" />
              </motion.div>
              <div>
                <div className="flex items-start justify-between gap-3 p-4">
                  <div>
                    <motion.h3 layoutId={`title-${active.id}-${id}`} className="font-bold text-foreground">
                      {active.nombre}
                    </motion.h3>
                    <motion.p layoutId={`description-${active.id}-${id}`} className="text-muted-foreground">
                      {CATEGORIAS[active.categoria]}
                      {active.creador ? ` · por ${active.creador.nombre}` : ""}
                    </motion.p>
                  </div>
                  <motion.button
                    layoutId={`button-${active.id}-${id}`}
                    disabled={yaPractica(active)}
                    onClick={() => {
                      const hid = active.id;
                      setActive(null);
                      onElegir(hid);
                    }}
                    className="rounded-full bg-primary px-4 py-3 text-sm font-bold text-primary-foreground disabled:opacity-50"
                  >
                    {textoCta(active)}
                  </motion.button>
                </div>
                <div className="relative px-4 pb-6 pt-2">
                  <motion.div
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col gap-2 text-sm text-muted-foreground"
                  >
                    {active.descripcion && <p>{active.descripcion}</p>}
                    <p>
                      <strong className="text-foreground">Después de</strong> {active.ancla},{" "}
                      {active.pasos[0]?.titulo ?? active.nombre}.
                    </p>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <ul className="mx-auto w-full max-w-2xl gap-4">
        {habitos.map((h) => (
          <motion.li
            layoutId={`card-${h.id}-${id}`}
            key={h.id}
            onClick={() => setActive(h)}
            className="cursor-pointer rounded-xl hover:bg-muted/50"
          >
            <AdminItem
              enabled={esAdmin}
              nombre={`el hábito «${h.nombre}»`}
              className="rounded-xl"
              aviso="Se archiva: nadie en la familia podrá adoptarlo. El progreso ya registrado queda guardado."
              onEdit={onEditar ? () => onEditar(h) : undefined}
              onDelete={onEliminar ? () => onEliminar(h) : undefined}
            >
            <div className="flex flex-col items-center justify-between p-4 md:flex-row">
            <div className="flex flex-col gap-4 md:flex-row">
              <motion.div layoutId={`image-${h.id}-${id}`}>
                <Imagen h={h} className="size-40 rounded-lg object-cover object-top md:size-14" />
              </motion.div>
              <div>
                <motion.h3 layoutId={`title-${h.id}-${id}`} className="text-center font-medium md:text-left">
                  {h.nombre}
                </motion.h3>
                <motion.p
                  layoutId={`description-${h.id}-${id}`}
                  className="text-center text-muted-foreground md:text-left"
                >
                  {CATEGORIAS[h.categoria]}
                  {h.creador ? ` · por ${h.creador.nombre}` : ""}
                </motion.p>
              </div>
            </div>
            <motion.button
              layoutId={`button-${h.id}-${id}`}
              className="mt-4 rounded-full bg-muted px-4 py-2 text-sm font-bold hover:bg-primary hover:text-primary-foreground md:mt-0"
            >
              {textoCta(h)}
            </motion.button>
            </div>
            </AdminItem>
          </motion.li>
        ))}
      </ul>
    </>
  );
}

// Los hábitos anteriores a las imágenes no tienen: se muestra su ícono.
function Imagen({ h, className }: { h: HabitoVista; className: string }) {
  if (!h.imagen) {
    return (
      <div className={`${className} flex items-center justify-center bg-muted`}>
        <HabitoIcon name={h.icono} className="size-1/3" />
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={h.imagen} alt={h.nombre} className={`${className} bg-muted`} />;
}
