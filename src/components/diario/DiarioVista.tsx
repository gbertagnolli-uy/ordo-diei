"use client";
// Diario (lane 272): pantalla completa — calendario, resumen, entradas del día y botón «Escribir».
import { useCallback, useEffect, useMemo, useState } from "react";
import { PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { resumenMes, type TipoDiario } from "@/lib/diario/reglas";
import type { EntradaVista } from "@/lib/diario/servidor";
import { toast } from "@/lib/toast";
import { CalendarioAnimo } from "./CalendarioAnimo";
import { EditorEntrada } from "./EditorEntrada";
import { ListaDia } from "./ListaDia";
import { ResumenMes } from "./ResumenMes";

export function DiarioVista({ tipo, hoy }: { tipo: TipoDiario; hoy: string }) {
  const [mes, setMes] = useState(hoy.slice(0, 7));
  const [seleccionado, setSeleccionado] = useState(hoy);
  const [entradas, setEntradas] = useState<EntradaVista[]>([]);
  const [version, setVersion] = useState(0);
  const [editor, setEditor] = useState<{ entrada?: EntradaVista; clave: number } | null>(null);

  useEffect(() => {
    let vivo = true;
    fetch(`/api/diario?tipo=${tipo}&mes=${mes}`)
      .then(async (r) => {
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(d.error ?? "No se pudo cargar el diario");
        if (vivo) setEntradas(d.entradas);
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "No se pudo cargar el diario"));
    return () => {
      vivo = false;
    };
  }, [tipo, mes, version]);

  const resumen = useMemo(() => resumenMes(entradas), [entradas]);
  const delDia = useMemo(() => entradas.filter((e) => e.fecha === seleccionado), [entradas, seleccionado]);
  const recargar = useCallback(() => setVersion((v) => v + 1), []);

  function cambiarMes(m: string) {
    setMes(m);
    setSeleccionado(m === hoy.slice(0, 7) ? hoy : `${m}-01`);
  }

  async function borrar(e: EntradaVista) {
    if (!window.confirm("¿Borrar esta entrada? No se puede deshacer.")) return;
    const r = await fetch(`/api/diario/${e.id}`, { method: "DELETE" });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) return toast.error(d.error ?? "No se pudo borrar");
    toast.success("Entrada borrada");
    recargar();
  }

  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,22rem)_1fr] md:items-start">
      <div className="flex flex-col gap-4">
        <CalendarioAnimo mes={mes} dias={resumen.dias} seleccionado={seleccionado} hoy={hoy} onDia={setSeleccionado} onMes={cambiarMes} />
        <ResumenMes totalEntradas={resumen.totalEntradas} diasPorAnimo={resumen.diasPorAnimo} />
      </div>
      <ListaDia entradas={delDia} tipo={tipo} onEditar={(e) => setEditor({ entrada: e, clave: Date.now() })} onBorrar={(e) => void borrar(e)} />
      <Button className="fixed right-4 bottom-20 z-30 h-12 rounded-full px-5 shadow-lg sm:right-6 sm:bottom-6" onClick={() => setEditor({ clave: Date.now() })}>
        <PenLine /> Escribir
      </Button>
      {editor && (
        <EditorEntrada
          key={editor.clave}
          abierto
          tipo={tipo}
          entrada={editor.entrada}
          fecha={seleccionado}
          hoy={hoy}
          onGuardado={() => {
            setEditor(null);
            recargar();
          }}
          onCerrar={() => setEditor(null)}
        />
      )}
    </div>
  );
}
