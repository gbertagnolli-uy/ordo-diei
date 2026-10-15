"use client";

// Propio de Ordo (lane 176, L2): hoja para copiar a mano (caligrafía). El texto en letra grande, con renglones debajo de cada
// línea para escribir encima o al lado. Sin pantalla: se imprime y se copia en el cuaderno.
import { useEffect } from "react";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HojaCopia({ titulo, texto, alumno }: { titulo: string; texto: string; alumno: string }) {
  useEffect(() => {
    const t = setTimeout(() => window.print(), 400);
    return () => clearTimeout(t);
  }, []);
  const lineas = texto.split("\n").flatMap((l) => (l.length > 70 ? (l.match(/.{1,70}(\s|$)/g) ?? [l]) : [l]));
  return (
    <div className="mx-auto w-full min-w-0 max-w-3xl space-y-4 p-4 sm:p-6 print:max-w-none print:p-0">
      <div className="flex items-center justify-between gap-3 rounded-xl border bg-card p-3 print:hidden">
        <p className="text-sm text-muted-foreground">Hoja para copiar a mano. Si no se abrió la impresión, tocá el botón.</p>
        <Button onClick={() => window.print()}>
          <Printer /> Imprimir
        </Button>
      </div>
      <article className="space-y-5 text-black">
        <header className="border-b-2 border-black pb-2">
          <p className="text-xs tracking-widest uppercase">Para copiar · {alumno}</p>
          <h1 className="text-3xl font-bold">{titulo}</h1>
        </header>
        <div className="space-y-6">
          {lineas.map((l, i) => (
            <div key={i} className="sin-corte">
              <p className="text-2xl leading-9">{l.trim()}</p>
              <div className="mt-3 h-7 border-b border-black" />
            </div>
          ))}
        </div>
      </article>
    </div>
  );
}
