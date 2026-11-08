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
    <div className="hoja-agenda-semanal mx-auto max-w-[1400px] print:max-w-none print:p-0">
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
