"use client";
// Diario (lane 272): pantalla completa — calendario, resumen, entradas del día y botón «Escribir».
import { useCallback, useEffect, useMemo, useState } from "react";
import { PenLine, Search, Tags } from "lucide-react";
import { Button } from "@/components/ui/button";
import { resumenMes, type Marcas, type TipoDiario } from "@/lib/diario/reglas";
import type { EntradaVista } from "@/lib/diario/servidor";
import { toast } from "@/lib/toast";
import { BuscadorDiario } from "./BuscadorDiario";
import { CalendarioAnimo } from "./CalendarioAnimo";
import { EditorEntrada } from "./EditorEntrada";
import { AdministrarDiario } from "./etiquetas/AdministrarDiario";
import { useCatalogo } from "./etiquetas/useCatalogo";
import { ListaDia } from "./ListaDia";
import { cambiarMarcasRemoto } from "./MarcasEntrada";
import { ResumenMes } from "./ResumenMes";
import { SeccionFijadas } from "./SeccionFijadas";

export function DiarioVista({ tipo, hoy, usuarioId }: { tipo: TipoDiario; hoy: string; usuarioId: number }) {
  const [mes, setMes] = useState(hoy.slice(0, 7));
  const [seleccionado, setSeleccionado] = useState(hoy);
  const [entradas, setEntradas] = useState<EntradaVista[]>([]);
  const [version, setVersion] = useState(0);
  const [editor, setEditor] = useState<{ entrada?: EntradaVista; clave: number } | null>(null);
  const acciones = useCatalogo(tipo);
  const [admin, setAdmin] = useState<"etiquetas" | "categorias" | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [versionBusqueda, setVersionBusqueda] = useState(0);

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

  /** Lleva al día de una entrada (desde la búsqueda o desde «Fijadas»). */
  function irADia(fecha: string) {
    setMes(fecha.slice(0, 7));
    setSeleccionado(fecha);
    setBuscando(false);
  }

  async function marcar(e: EntradaVista, marcas: Marcas) {
    if (await cambiarMarcasRemoto(e.id, marcas)) recargar();
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
      {buscando ? (
        <div className="md:col-span-2">
          <BuscadorDiario
            tipo={tipo}
            hoy={hoy}
            usuarioId={usuarioId}
            acciones={acciones}
            onVolver={() => setBuscando(false)}
            onIrADia={irADia}
            onEditar={(e) => setEditor({ entrada: e, clave: Date.now() })}
            onCambio={recargar}
            version={versionBusqueda}
          />
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-4">
            <CalendarioAnimo mes={mes} dias={resumen.dias} seleccionado={seleccionado} hoy={hoy} onDia={setSeleccionado} onMes={cambiarMes} />
            <ResumenMes totalEntradas={resumen.totalEntradas} diasPorAnimo={resumen.diasPorAnimo} />
            <Button variant="outline" onClick={() => setBuscando(true)}>
              <Search /> Buscar
            </Button>
            <Button variant="outline" onClick={() => setAdmin("etiquetas")}>
              <Tags /> Etiquetas y categorías
            </Button>
          </div>
          <div className="flex flex-col gap-4">
            <SeccionFijadas tipo={tipo} version={version} onIrADia={irADia} />
            <ListaDia entradas={delDia} tipo={tipo} catalogo={acciones.catalogo} onEditar={(e) => setEditor({ entrada: e, clave: Date.now() })} onBorrar={(e) => void borrar(e)} onMarcar={(e, m) => void marcar(e, m)} />
          </div>
        </>
      )}
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
          acciones={acciones}
          onAdministrar={setAdmin}
          onCerrar={(huboCambios) => {
            setEditor(null);
            if (huboCambios) {
              recargar();
              setVersionBusqueda((v) => v + 1);
            }
          }}
        />
      )}
      {admin && <AdministrarDiario acciones={acciones} pestanaInicial={admin} onCerrar={() => setAdmin(null)} />}
    </div>
  );
}
