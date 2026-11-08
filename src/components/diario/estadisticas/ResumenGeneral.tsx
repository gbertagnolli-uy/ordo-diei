"use client";
// Diario (lane 287): tarjeta de resumen general. Portado de vendor/Daily_You/lib/widgets/stats_overview_card.dart y de la parte de rachas de
// lib/pages/statistics_page.dart (Demizo/Daily_You@7cc237d): la racha actual en grande, al lado la más larga, los días estupendos y los días desde
// un día malo, y abajo los registros, los días con entradas y las palabras.
import type { ComponentType } from "react";
import { CalendarDays, FileText, History, Smile, TrendingUp, Type, Zap, type LucideProps } from "lucide-react";
import { calcularRachas, totalPalabras, diasConEntradas, diasEstupendos, type FilaEstadistica } from "@/lib/diario/estadisticas";

interface Dato {
  icono: ComponentType<LucideProps>;
  etiqueta: string;
  numero: number;
}

const formato = new Intl.NumberFormat("es-UY");
const plural = (n: number, uno: string, otros: string) => (n === 1 ? uno : otros);

function Linea({ dato }: { dato: Dato }) {
  const Icono = dato.icono;
  return (
    <div className="flex items-start gap-1.5 text-sm text-muted-foreground">
      <Icono className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>{dato.etiqueta}</span>
      <span className="font-bold text-primary">{formato.format(dato.numero)}</span>
    </div>
  );
}

export function ResumenGeneral({ filas, hoy }: { filas: FilaEstadistica[]; hoy: string }) {
  const rachas = calcularRachas(filas, hoy);
  const registros = filas.length;
  const dias = diasConEntradas(filas);
  const palabras = totalPalabras(filas);

  const lateral: Dato[] = [];
  if (rachas.mayor > 0) lateral.push({ icono: History, etiqueta: "Racha más larga", numero: rachas.mayor });
  if (registros > 0) lateral.push({ icono: Smile, etiqueta: "Días estupendos", numero: diasEstupendos(filas) });
  if (rachas.diasDesdeDiaMalo !== null && rachas.diasDesdeDiaMalo > 3) lateral.push({ icono: TrendingUp, etiqueta: "Días desde un día malo", numero: rachas.diasDesdeDiaMalo });

  const escritura: Dato[] = [];
  if (registros > 0) escritura.push({ icono: FileText, etiqueta: plural(registros, "registro", "registros"), numero: registros });
  if (dias > 0 && dias !== registros) escritura.push({ icono: CalendarDays, etiqueta: plural(dias, "día", "días"), numero: dias });
  if (palabras > 100) escritura.push({ icono: Type, etiqueta: "palabras", numero: palabras });

  if (registros === 0) return null;
  return (
    <section aria-label="Resumen general" className="rounded-xl border bg-card p-4">
      <div className="flex items-center gap-4">
        <div className="flex flex-col items-center px-2 text-center">
          <Zap className="size-6 text-primary" aria-hidden />
          <span className="mt-1 text-3xl font-bold text-primary">{formato.format(rachas.actual)}</span>
          <span className="text-sm text-muted-foreground">Racha actual</span>
        </div>
        {lateral.length > 0 && (
          <>
            <div className="h-16 w-px bg-border" aria-hidden />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              {lateral.map((d) => (
                <Linea key={d.etiqueta} dato={d} />
              ))}
            </div>
          </>
        )}
      </div>
      {escritura.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 border-t pt-3">
          {escritura.map((d) => (
            <Linea key={d.etiqueta} dato={d} />
          ))}
        </div>
      )}
    </section>
  );
}
