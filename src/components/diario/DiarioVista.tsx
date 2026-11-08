"use client";
// Diario (lane 272): pantalla completa — calendario, resumen, entradas del día y botón «Escribir».
import { useCallback, useEffect, useMemo, useState } from "react";
import { BarChart3, FileText, PenLine, Search, Smile, Tags } from "lucide-react";
import { Button } from "@/components/ui/button";
import { resumenMes, type Marcas, type TipoDiario } from "@/lib/diario/reglas";
import type { EntradaVista } from "@/lib/diario/servidor";
import { toast } from "@/lib/toast";
import { BuscadorDiario } from "./BuscadorDiario";
import { CalendarioAnimo } from "./CalendarioAnimo";
import { EditarEscalaAnimo } from "./EditarEscalaAnimo";
import { EditorEntrada } from "./EditorEntrada";
import { ProveedorEscala, useEscalaAnimo } from "./EscalaAnimo";
import { AdministrarDiario } from "./etiquetas/AdministrarDiario";
import { PanelEstadisticas } from "./estadisticas/PanelEstadisticas";
import { useCatalogo } from "./etiquetas/useCatalogo";
import { ListaDia } from "./ListaDia";
import { cambiarMarcasRemoto } from "./MarcasEntrada";
import { AdministrarPlantillas } from "./plantillas/AdministrarPlantillas";
import { usePlantillas } from "./plantillas/usePlantillas";
import { ResumenMes } from "./ResumenMes";
import { SeccionFijadas } from "./SeccionFijadas";

/** `esPadre`: en el diario familiar, la escala de ánimo y la plantilla predeterminada las cambia un padre. */
export function DiarioVista({ tipo, hoy, usuarioId, esPadre }: { tipo: TipoDiario; hoy: string; usuarioId: number; esPadre: boolean }) {
  const [mes, setMes] = useState(hoy.slice(0, 7));
  const [seleccionado, setSeleccionado] = useState(hoy);
  const [entradas, setEntradas] = useState<EntradaVista[]>([]);
  const [version, setVersion] = useState(0);
  const [editor, setEditor] = useState<{ entrada?: EntradaVista; clave: number } | null>(null);
  const acciones = useCatalogo(tipo);
  const plantillas = usePlantillas(tipo);
  const escala = useEscalaAnimo(tipo);
  const [administrandoPlantillas, setAdministrandoPlantillas] = useState(false);
  const [editandoEscala, setEditandoEscala] = useState(false);
  const puedeCambiarEscala = tipo === "personal" || esPadre;
  const [admin, setAdmin] = useState<"etiquetas" | "categorias" | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [verEstadisticas, setVerEstadisticas] = useState(false);
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
    setVerEstadisticas(false);
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
    <ProveedorEscala value={escala.escala}>
    <div className="grid gap-4 md:grid-cols-[minmax(0,22rem)_1fr] md:items-start">
      {verEstadisticas ? (
        <div className="md:col-span-2">
          <PanelEstadisticas tipo={tipo} hoy={hoy} catalogo={acciones.catalogo} version={version} onVolver={() => setVerEstadisticas(false)} onIrADia={irADia} />
        </div>
      ) : buscando ? (
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
            <Button variant="outline" onClick={() => setVerEstadisticas(true)}>
              <BarChart3 /> Estadísticas
            </Button>
            <Button variant="outline" onClick={() => setAdmin("etiquetas")}>
              <Tags /> Etiquetas y categorías
            </Button>
            <Button variant="outline" onClick={() => setAdministrandoPlantillas(true)}>
              <FileText /> Plantillas
            </Button>
            {puedeCambiarEscala && (
              <Button variant="outline" onClick={() => setEditandoEscala(true)}>
                <Smile /> Escala de ánimo
              </Button>
            )}
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
          plantillas={plantillas}
          onAdministrar={setAdmin}
          onAdministrarPlantillas={() => setAdministrandoPlantillas(true)}
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
      {administrandoPlantillas && (
        <AdministrarPlantillas
          plantillas={plantillas}
          catalogo={acciones}
          esPadre={esPadre}
          onAdministrarEtiquetas={() => setAdmin("etiquetas")}
          onCerrar={() => setAdministrandoPlantillas(false)}
        />
      )}
      {editandoEscala && <EditarEscalaAnimo acciones={escala} onCerrar={() => setEditandoEscala(false)} />}
    </div>
    </ProveedorEscala>
  );
}
