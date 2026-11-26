"use client";
// Diario (lane 272): pantalla completa — calendario, resumen, entradas del día y botón «Escribir».
// Lane 288: calendario con portada/ánimo/etiqueta, filtro por etiqueta, selector de mes, vista del año y todo el mes cuando no hay un día elegido.
import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { BarChart3, BookHeart, CalendarHeart, Download, FileText, History, Images, Lock, MapPin, MapPinned, PenLine, Route, Search, Smile, Sparkles, Tags, Upload, Users, Waypoints } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OPCIONES_CALENDARIO, elegirDia, esOpcionesCalendario, filtrarPorEtiqueta, resumenDeDias } from "@/lib/diario/calendario";
import { OPCIONES_RECUERDOS, esOpcionesRecuerdos } from "@/lib/diario/recuerdos";
import { resumenMes, type Marcas, type TipoDiario } from "@/lib/diario/reglas";
import type { EntradaVista } from "@/lib/diario/servidor";
import { toast } from "@/lib/toast";
import { CalendarioAnimo } from "./CalendarioAnimo";
import { FiltroEtiquetasCalendario } from "./calendario/FiltroEtiquetasCalendario";
import { ProveedorEscala, useEscalaAnimo } from "./EscalaAnimo";
import { ProveedorEnlaces, ProveedorGrafo } from "./enlaces/ContextoEnlaces";
import { SeccionRecuerdos } from "./recuerdos/SeccionRecuerdos";
import { useRecuerdos } from "./recuerdos/useRecuerdos";
import { usePreferencia } from "./estadisticas/controles";
import { useCatalogo } from "./etiquetas/useCatalogo";
import { ListaDia } from "./ListaDia";
import { ProveedorLugares } from "./lugares/ContextoLugares";
import { useLugares } from "./lugares/useLugares";
import { cambiarMarcasRemoto } from "./MarcasEntrada";
import { usePlantillas } from "./plantillas/usePlantillas";
import { ResumenMes } from "./ResumenMes";
import { SeccionFijadas } from "./SeccionFijadas";

// Paneles y editores pesados bajo demanda (reduce drásticamente el JS inicial de /dashboard/diario)
const AsistenteDiario = dynamic(() => import("./asistente/AsistenteDiario").then((m) => m.AsistenteDiario), { ssr: false });
const BuscadorDiario = dynamic(() => import("./BuscadorDiario").then((m) => m.BuscadorDiario), { ssr: false });
const OpcionesDelCalendario = dynamic(() => import("./calendario/OpcionesDelCalendario").then((m) => m.OpcionesDelCalendario), { ssr: false });
const SelectorMesDiario = dynamic(() => import("./calendario/SelectorMesDiario").then((m) => m.SelectorMesDiario), { ssr: false });
const VistaAnual = dynamic(() => import("./calendario/VistaAnual").then((m) => m.VistaAnual), { ssr: false });
const EditarEscalaAnimo = dynamic(() => import("./EditarEscalaAnimo").then((m) => m.EditarEscalaAnimo), { ssr: false });
const EditorEntrada = dynamic(() => import("./EditorEntrada").then((m) => m.EditorEntrada), { ssr: false });
const GrafoEnlaces = dynamic(() => import("./grafo/GrafoEnlaces").then((m) => m.GrafoEnlaces), { ssr: false });
const GrafoLocal = dynamic(() => import("./grafo/GrafoLocal").then((m) => m.GrafoLocal), { ssr: false });
const LineaDeTiempo = dynamic(() => import("./linea/LineaDeTiempo").then((m) => m.LineaDeTiempo), { ssr: false });
const ExportarDiario = dynamic(() => import("./exportar/ExportarDiario").then((m) => m.ExportarDiario), { ssr: false });
const ImportarDiario = dynamic(() => import("./importar/ImportarDiario").then((m) => m.ImportarDiario), { ssr: false });
const CompartirEntrada = dynamic(() => import("./compartir/CompartirEntrada").then((m) => m.CompartirEntrada), { ssr: false });
const GaleriaDiario = dynamic(() => import("./galeria/GaleriaDiario").then((m) => m.GaleriaDiario), { ssr: false });
const EnEsteDiaDialog = dynamic(() => import("./recuerdos/EnEsteDiaDialog").then((m) => m.EnEsteDiaDialog), { ssr: false });
const OpcionesDeRecuerdos = dynamic(() => import("./recuerdos/OpcionesRecuerdos").then((m) => m.OpcionesDeRecuerdos), { ssr: false });
const AdministrarDiario = dynamic(() => import("./etiquetas/AdministrarDiario").then((m) => m.AdministrarDiario), { ssr: false });
const PanelEstadisticas = dynamic(() => import("./estadisticas/PanelEstadisticas").then((m) => m.PanelEstadisticas), { ssr: false });
const AdministrarLugares = dynamic(() => import("./lugares/AdministrarLugares").then((m) => m.AdministrarLugares), { ssr: false });
const MapaHuellas = dynamic(() => import("./mapa/MapaHuellas").then((m) => m.MapaHuellas), { ssr: false });
const AdministrarPlantillas = dynamic(() => import("./plantillas/AdministrarPlantillas").then((m) => m.AdministrarPlantillas), { ssr: false });

/** `esPadre`: en el diario familiar, la escala de ánimo y la plantilla predeterminada las cambia un padre. */
export function DiarioVista({ tipo, hoy, usuarioId, esPadre }: { tipo: TipoDiario; hoy: string; usuarioId: number; esPadre: boolean }) {
  const [mes, setMes] = useState(hoy.slice(0, 7));
  /** `null` = ningún día elegido: la lista muestra todo el mes (storypad). */
  const [seleccionado, setSeleccionado] = useState<string | null>(hoy);
  const [entradas, setEntradas] = useState<EntradaVista[]>([]);
  const [version, setVersion] = useState(0);
  const [editor, setEditor] = useState<{ entrada?: EntradaVista; clave: number } | null>(null);
  const acciones = useCatalogo(tipo);
  const plantillas = usePlantillas(tipo);
  const lugares = useLugares(tipo);
  const [administrandoLugares, setAdministrandoLugares] = useState(false);
  const escala = useEscalaAnimo(tipo);
  const [administrandoPlantillas, setAdministrandoPlantillas] = useState(false);
  const [editandoEscala, setEditandoEscala] = useState(false);
  const puedeCambiarEscala = tipo === "personal" || esPadre;
  const [admin, setAdmin] = useState<"etiquetas" | "categorias" | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [verEstadisticas, setVerEstadisticas] = useState(false);
  const [verAnio, setVerAnio] = useState(false);
  const [verLinea, setVerLinea] = useState(false);
  const [verGaleria, setVerGaleria] = useState(false);
  /** Lane 297: el mapa de huellas. */
  const [verMapa, setVerMapa] = useState(false);
  /** Lane 298: el asistente de IA (solo en el diario personal). */
  const [verAsistente, setVerAsistente] = useState(false);
  /** Lane 295: el grafo de enlaces. `desdeGeneral`: el local se abrió desde el general, y al salir se vuelve a él. */
  const [grafo, setGrafo] = useState<{ modo: "general" } | { modo: "local"; id: number; desdeGeneral: boolean } | null>(null);
  const [compartiendo, setCompartiendo] = useState<EntradaVista | null>(null);
  /** "MM-DD" del día cuyas entradas de otros años se están viendo, o null. */
  const [enEsteDia, setEnEsteDia] = useState<string | null>(null);
  const [editandoRecuerdos, setEditandoRecuerdos] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [importando, setImportando] = useState(false);
  const [eligiendoMes, setEligiendoMes] = useState(false);
  const [editandoVista, setEditandoVista] = useState(false);
  const [filtroEtiqueta, setFiltroEtiqueta] = useState<number | null>(null);
  const [versionBusqueda, setVersionBusqueda] = useState(0);
  const [opciones, setOpciones] = usePreferencia(`diario.calendario.${tipo}`, OPCIONES_CALENDARIO, esOpcionesCalendario);
  const [opcionesRecuerdos, setOpcionesRecuerdos] = usePreferencia(`diario.recuerdos.${tipo}`, OPCIONES_RECUERDOS, esOpcionesRecuerdos);
  const recuerdos = useRecuerdos(tipo, opcionesRecuerdos, version);

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

  // Una etiqueta borrada que había quedado guardada (en las opciones o en el filtro) deja de usarse (Daily You la vuelve a «ninguna»)
  const existe = (id: number | null) => id !== null && !!acciones.catalogo?.etiquetas.some((e) => e.id === id);
  const etiquetaDeCalendario = existe(opciones.etiqueta) ? opciones.etiqueta : null;
  const etiquetaFiltrada = existe(filtroEtiqueta) ? filtroEtiqueta : null;

  const visibles = useMemo(() => filtrarPorEtiqueta(entradas, etiquetaFiltrada), [entradas, etiquetaFiltrada]);
  const resumen = useMemo(() => resumenMes(visibles), [visibles]);
  const dias = useMemo(() => resumenDeDias(visibles, etiquetaDeCalendario), [visibles, etiquetaDeCalendario]);
  const delDia = useMemo(() => (seleccionado ? visibles.filter((e) => e.fecha === seleccionado) : visibles), [visibles, seleccionado]);
  const recargar = useCallback(() => setVersion((v) => v + 1), []);
  /** Día para escribir: el elegido o, con todo el mes a la vista, hoy (si es este mes) o el 1. */
  const fechaActiva = seleccionado ?? (mes === hoy.slice(0, 7) ? hoy : `${mes}-01`);

  /** moodiary `_pickDayIn`: al cambiar de mes se queda en el mismo número de día. */
  function irAMes(m: string, conEntradas: ReadonlySet<string> | null = null) {
    setMes(m);
    setSeleccionado(elegirDia(m, Number(fechaActiva.slice(8)), hoy, conEntradas));
  }

  function irAHoy() {
    setMes(hoy.slice(0, 7));
    setSeleccionado(hoy);
  }

  /** Lleva al día de una entrada (desde la búsqueda o desde «Fijadas»). */
  function irADia(fecha: string) {
    setMes(fecha.slice(0, 7));
    setSeleccionado(fecha);
    setBuscando(false);
    setVerEstadisticas(false);
    setVerAnio(false);
    setVerLinea(false);
    setVerGaleria(false);
    setVerMapa(false);
    setVerAsistente(false);
    setGrafo(null);
  }

  /** Lane 290 (moodiary `linkTap`): tocar un enlace a otra entrada lleva al día de esa entrada. */
  async function abrirEntrada(id: number) {
    try {
      const r = await fetch(`/api/diario/enlaces/${id}?tipo=${tipo}`);
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error ?? "La entrada no existe o no está disponible");
      irADia(d.entrada.fecha);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo abrir la entrada");
    }
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
    <ProveedorLugares value={lugares.lista ?? []}>
    <ProveedorEnlaces value={(id) => void abrirEntrada(id)}>
    <ProveedorGrafo value={(id) => setGrafo({ modo: "local", id, desdeGeneral: false })}>
    <div className="grid gap-4 md:grid-cols-[minmax(0,22rem)_1fr] md:items-start">
      <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-card/70 px-3 py-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <Button asChild size="sm" variant={tipo === "personal" ? "default" : "ghost"} className="h-8 gap-1.5 text-xs">
            <Link href="/dashboard/diario">
              <BookHeart className="size-3.5" /> Mi diario
            </Link>
          </Button>
          <Button asChild size="sm" variant={tipo === "familiar" ? "default" : "ghost"} className="h-8 gap-1.5 text-xs">
            <Link href="/dashboard/diario/familia">
              <Users className="size-3.5" /> Diario familiar
            </Link>
          </Button>
          <span className="hidden items-center gap-1 pl-1 text-xs text-muted-foreground sm:inline-flex">
            {tipo === "personal" ? (
              <>
                <Lock className="size-3" /> Privado: solo vos podés leerlo
              </>
            ) : (
              "Compartido: visible para toda la familia"
            )}
          </span>
        </div>
        <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={() => setEditor({ clave: Date.now() })}>
          <PenLine className="size-3.5" /> Escribir
        </Button>
      </div>
      {grafo?.modo === "general" ? (
        <div className="md:col-span-2 diario-entra">
          <GrafoEnlaces
            tipo={tipo}
            hoy={hoy}
            catalogo={acciones.catalogo}
            version={version}
            onVolver={() => setGrafo(null)}
            onIrADia={irADia}
            onCentrar={(id) => setGrafo({ modo: "local", id, desdeGeneral: true })}
            onEscribir={() => {
              setGrafo(null);
              setEditor({ clave: Date.now() });
            }}
          />
        </div>
      ) : grafo?.modo === "local" ? (
        <div className="md:col-span-2 diario-entra">
          <GrafoLocal key={grafo.id} tipo={tipo} centroInicial={grafo.id} catalogo={acciones.catalogo} version={version} onSalir={() => setGrafo(grafo.desdeGeneral ? { modo: "general" } : null)} onIrADia={irADia} />
        </div>
      ) : verEstadisticas ? (
        <div className="md:col-span-2 diario-entra">
          <PanelEstadisticas tipo={tipo} hoy={hoy} catalogo={acciones.catalogo} version={version} onVolver={() => setVerEstadisticas(false)} onIrADia={irADia} />
        </div>
      ) : verAsistente && tipo === "personal" ? (
        <div className="md:col-span-2 diario-entra">
          <AsistenteDiario usuarioId={usuarioId} onVolver={() => setVerAsistente(false)} />
        </div>
      ) : verMapa ? (
        <div className="md:col-span-2 diario-entra">
          <MapaHuellas tipo={tipo} lugares={lugares} catalogo={acciones.catalogo} version={version} onVolver={() => setVerMapa(false)} onIrADia={irADia} />
        </div>
      ) : verGaleria ? (
        <div className="md:col-span-2 diario-entra">
          <GaleriaDiario tipo={tipo} hoy={hoy} usuarioId={usuarioId} acciones={acciones} onVolver={() => setVerGaleria(false)} onIrADia={irADia} version={version} />
        </div>
      ) : verLinea ? (
        <div className="md:col-span-2 diario-entra">
          <LineaDeTiempo tipo={tipo} catalogo={acciones.catalogo} version={version} onVolver={() => setVerLinea(false)} onIrADia={irADia} />
        </div>
      ) : verAnio ? (
        <div className="md:col-span-2 diario-entra">
          <VistaAnual
            tipo={tipo}
            hoy={hoy}
            version={version}
            anioInicial={Number(mes.slice(0, 4))}
            onVolver={() => setVerAnio(false)}
            onElegirMes={(m, conEntradas) => {
              irAMes(m, conEntradas);
              setVerAnio(false);
            }}
            onIrADia={irADia}
          />
        </div>
      ) : buscando ? (
        <div className="md:col-span-2 diario-entra">
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
          <div className="flex flex-col gap-4 diario-vuelve">
            <FiltroEtiquetasCalendario catalogo={acciones.catalogo} elegida={etiquetaFiltrada} cantidad={visibles.length} onElegir={setFiltroEtiqueta} />
            <CalendarioAnimo
              mes={mes}
              dias={dias}
              cantidadMes={visibles.length}
              seleccionado={seleccionado}
              hoy={hoy}
              opciones={{ ...opciones, etiqueta: etiquetaDeCalendario }}
              catalogo={acciones.catalogo}
              onDia={(f) => setSeleccionado(f === seleccionado ? null : f)}
              onMes={irAMes}
              onHoy={irAHoy}
              onAbrirSelector={() => setEligiendoMes(true)}
              onOpciones={() => setEditandoVista(true)}
              onAnio={() => setVerAnio(true)}
            />
            <ResumenMes totalEntradas={resumen.totalEntradas} diasPorAnimo={resumen.diasPorAnimo} />
            <Button variant="outline" onClick={() => setVerLinea(true)}>
              <Route /> Línea de tiempo
            </Button>
            <Button variant="outline" onClick={() => setVerGaleria(true)}>
              <Images /> Galería
            </Button>
            <Button variant="outline" onClick={() => setGrafo({ modo: "general" })}>
              <Waypoints /> Grafo de enlaces
            </Button>
            <Button variant="outline" onClick={() => setEnEsteDia(fechaActiva.slice(5))}>
              <CalendarHeart /> En este día
            </Button>
            <Button variant="outline" onClick={() => setEditandoRecuerdos(true)}>
              <History /> Recuerdos
            </Button>
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
            <Button variant="outline" onClick={() => setAdministrandoLugares(true)}>
              <MapPin /> Lugares
            </Button>
            <Button variant="outline" onClick={() => setVerMapa(true)}>
              <MapPinned /> Mapa de huellas
            </Button>
            {tipo === "personal" && (
              <Button variant="outline" onClick={() => setVerAsistente(true)}>
                <Sparkles /> Asistente
              </Button>
            )}
            <Button variant="outline" onClick={() => setExportando(true)}>
              <Download /> Exportar
            </Button>
            <Button variant="outline" onClick={() => setImportando(true)}>
              <Upload /> Importar
            </Button>
            {puedeCambiarEscala && (
              <Button variant="outline" onClick={() => setEditandoEscala(true)}>
                <Smile /> Escala de ánimo
              </Button>
            )}
          </div>
          <div className="flex flex-col gap-4 diario-vuelve">
            {recuerdos && <SeccionRecuerdos grupos={recuerdos.grupos} opciones={opcionesRecuerdos} onAbrir={(g) => (g.enEsteDia ? setEnEsteDia(recuerdos.hoy.slice(5)) : irADia(g.entradas[0].entrada.fecha))} />}
            <SeccionFijadas tipo={tipo} version={version} onIrADia={irADia} />
            <ListaDia
              entradas={delDia}
              tipo={tipo}
              catalogo={acciones.catalogo}
              onEditar={(e) => setEditor({ entrada: e, clave: Date.now() })}
              onBorrar={(e) => void borrar(e)}
              onMarcar={(e, m) => void marcar(e, m)}
              onCompartir={setCompartiendo}
              agrupar={seleccionado === null}
              vacio={seleccionado ? (etiquetaFiltrada !== null ? "No hay entradas con esa etiqueta este día." : "No hay entradas este día.") : etiquetaFiltrada !== null ? "No hay entradas con esa etiqueta este mes." : "No hay entradas este mes."}
            />
          </div>
        </>
      )}
      <Button className="fixed bottom-6 left-4 z-30 h-11 rounded-full px-5 shadow-lg sm:hidden" onClick={() => setEditor({ clave: Date.now() })}>
        <PenLine /> Escribir
      </Button>
      {editor && (
        <EditorEntrada
          key={editor.clave}
          abierto
          tipo={tipo}
          entrada={editor.entrada}
          fecha={fechaActiva}
          hoy={hoy}
          acciones={acciones}
          plantillas={plantillas}
          lugares={lugares}
          onAdministrar={setAdmin}
          onAdministrarPlantillas={() => setAdministrandoPlantillas(true)}
          onAdministrarLugares={() => setAdministrandoLugares(true)}
          onCerrar={(huboCambios) => {
            setEditor(null);
            if (huboCambios) {
              recargar();
              setVersionBusqueda((v) => v + 1);
            }
          }}
        />
      )}
      {eligiendoMes && (
        <SelectorMesDiario
          tipo={tipo}
          version={version}
          mes={mes}
          hoy={hoy}
          onElegir={(m) => {
            irAMes(m);
            setEligiendoMes(false);
          }}
          onCerrar={() => setEligiendoMes(false)}
        />
      )}
      {enEsteDia && (
        <EnEsteDiaDialog
          tipo={tipo}
          diaMes={enEsteDia}
          hoy={hoy}
          onCerrar={() => setEnEsteDia(null)}
          onIrADia={irADia}
          onResponder={(f) => {
            setEnEsteDia(null);
            irADia(f);
            setEditor({ clave: Date.now() });
          }}
        />
      )}
      {compartiendo && <CompartirEntrada entrada={compartiendo} tipo={tipo} catalogo={acciones.catalogo} onCerrar={() => setCompartiendo(null)} />}
      {importando && <ImportarDiario tipo={tipo} onTerminado={recargar} onCerrar={() => setImportando(false)} />}
      {exportando && <ExportarDiario tipo={tipo} catalogo={acciones.catalogo} onCerrar={() => setExportando(false)} />}
      {editandoRecuerdos && <OpcionesDeRecuerdos opciones={opcionesRecuerdos} onCambiar={setOpcionesRecuerdos} onCerrar={() => setEditandoRecuerdos(false)} />}
      {editandoVista && <OpcionesDelCalendario opciones={{ ...opciones, etiqueta: etiquetaDeCalendario }} catalogo={acciones.catalogo} onCambiar={setOpciones} onCerrar={() => setEditandoVista(false)} />}
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
      {administrandoLugares && <AdministrarLugares lugares={lugares} onCerrar={() => setAdministrandoLugares(false)} />}
      {editandoEscala && <EditarEscalaAnimo acciones={escala} onCerrar={() => setEditandoEscala(false)} />}
    </div>
    </ProveedorGrafo>
    </ProveedorEnlaces>
    </ProveedorLugares>
    </ProveedorEscala>
  );
}
