"use client";

import { AyudaIcono } from "@/components/AyudaIcono";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Check, ChevronRight, ChevronLeft } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Spinner } from "@/components/ui/spinner";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import {
  CLAVE_LIBRO,
  DIAS_LUN_VIE,
  MAX_PAGINAS_LIBRO,
  DIAS_TODOS,
  pasosDe,
  type Categoria,
  type Franja,
} from "@/lib/habitos/catalogo";
import type { EstadoHabito, HabitoVista } from "@/lib/habitos/server";
import { HabitoIcon } from "./HabitoIcon";
import { subirImagen } from "@/lib/subirImagen";
import { toast } from "@/lib/toast";

const ANCLAS_SUGERIDAS: Record<Franja, string[]> = {
  manana: ["Al levantarme", "Antes del desayuno", "Después de desayunar", "Antes de salir"],
  tarde: ["Al mediodía", "Después del almuerzo", "Al volver a casa", "Antes de merendar"],
  noche: ["Antes de cenar", "Después de cenar", "Antes de lavarme los dientes", "Antes de dormir, en familia"],
};

const DIAS_NOMBRES = [
  { bit: 1, label: "Lun" },
  { bit: 2, label: "Mar" },
  { bit: 3, label: "Mié" },
  { bit: 4, label: "Jue" },
  { bit: 5, label: "Vie" },
  { bit: 6, label: "Sáb" },
  { bit: 0, label: "Dom" },
];

export interface MiembroSelector {
  id: number;
  nombre: string;
  rolFamiliar: string;
}

export function HabitoDialog({
  isOpen,
  onClose,
  catalogo,
  habitosActivos,
  miembros = [],
  esPadre = false,
  usuarioActualId,
  preseleccionMiembroId,
  habitoAEditar = null,
  habitoElegidoId = null,
}: {
  isOpen: boolean;
  onClose: () => void;
  catalogo: HabitoVista[];
  habitosActivos: EstadoHabito[];
  miembros?: MiembroSelector[];
  esPadre?: boolean;
  usuarioActualId: number;
  preseleccionMiembroId?: number | null;
  habitoAEditar?: EstadoHabito | null;
  /** Hábito del catálogo ya elegido (carrusel o comunitarios): abre directo en la receta */
  habitoElegidoId?: number | null;
}) {
  const router = useRouter();
  const [isDesktop, setIsDesktop] = useState(true);

  // Detección responsive (escritorio vs móvil para dialog vs drawer)
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 640px)");
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Paso activo: 1 ó 2
  const [paso, setPaso] = useState<1 | 2>(1);
  const [guardando, setGuardando] = useState(false);

  // Usuario objetivo para padres
  const [usuarioObjetivoId, setUsuarioObjetivoId] = useState<number>(
    preseleccionMiembroId ?? usuarioActualId
  );

  // Paso 1: Selección de hábitos existentes
  const [seleccionados, setSeleccionados] = useState<number[]>([]);

  // Paso 1: Formulario de creación de hábito nuevo
  const [mostrarCrearNuevo, setMostrarCrearNuevo] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoMinimo, setNuevoMinimo] = useState("");
  const [nuevaCategoria, setNuevaCategoria] = useState<Categoria>("orden");
  const [nuevaFranja, setNuevaFranja] = useState<Franja>("manana");
  const [nuevoAncla, setNuevoAncla] = useState("Al levantarme");
  const [nuevaImagen, setNuevaImagen] = useState<string | null>(null);
  const [subiendoImagen, setSubiendoImagen] = useState(false);

  // Paso 2: Recetas por hábito seleccionado
  // Map de habitoId -> { ancla: string, diasTipo: "todos" | "lun-vie" | "custom", diasBits: number }
  const [recetas, setRecetas] = useState<
    Record<number, { ancla: string; diasTipo: string; diasBits: number }>
  >({});

  // Paso 2: libro con el que empieza "Leer un libro"
  const [libroTitulo, setLibroTitulo] = useState("");
  const [libroPaginas, setLibroPaginas] = useState("");

  // Reset del diálogo al abrirse o cambiar habitoAEditar
  useEffect(() => {
    if (!isOpen) return;
    setPaso(1);
    setGuardando(false);
    setUsuarioObjetivoId(preseleccionMiembroId ?? usuarioActualId);
    setLibroTitulo("");
    setLibroPaginas("");

    if (habitoAEditar) {
      // Modo edición de hábito propio
      const pasosEdit = pasosDe(habitoAEditar);
      setNuevoNombre(habitoAEditar.nombre);
      setNuevoMinimo(pasosEdit.length > 1 ? pasosEdit[0].titulo : "");
      setNuevaCategoria(habitoAEditar.categoria);
      setNuevaFranja(habitoAEditar.franja);
      setNuevoAncla(habitoAEditar.ancla);
      setMostrarCrearNuevo(true);
      setSeleccionados([habitoAEditar.habitoId]);
      setRecetas({
        [habitoAEditar.habitoId]: {
          ancla: habitoAEditar.ancla,
          diasTipo: habitoAEditar.dias === DIAS_LUN_VIE ? "lun-vie" : habitoAEditar.dias === DIAS_TODOS ? "todos" : "custom",
          diasBits: habitoAEditar.dias,
        },
      });
      setNuevaImagen(habitoAEditar.imagen ?? null);
    } else if (habitoElegidoId !== null) {
      // Viene del carrusel o de los comunitarios: directo a la receta
      setSeleccionados([habitoElegidoId]);
      setMostrarCrearNuevo(false);
      setNuevoNombre("");
      setNuevoMinimo("");
      setNuevaImagen(null);
      const h = catalogo.find((x) => x.id === habitoElegidoId);
      setRecetas({ [habitoElegidoId]: { ancla: h?.ancla || "Al levantarme", diasTipo: "todos", diasBits: DIAS_TODOS } });
      setPaso(2);
    } else {
      setSeleccionados([]);
      setNuevaImagen(null);
      setMostrarCrearNuevo(true);
      setNuevoNombre("");
      setNuevoMinimo("");
      setNuevaCategoria("orden");
      setNuevaFranja("manana");
      setNuevoAncla("Al levantarme");
      setRecetas({});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, habitoAEditar, habitoElegidoId, preseleccionMiembroId, usuarioActualId]);

  // Inicializar recetas cuando se avanza al paso 2
  const avanzarAPaso2 = () => {
    const nuevasRecetas = { ...recetas };

    for (const id of seleccionados) {
      if (!nuevasRecetas[id]) {
        const h = catalogo.find((x) => x.id === id);
        nuevasRecetas[id] = {
          ancla: h?.ancla || "Al levantarme",
          diasTipo: "todos",
          diasBits: DIAS_TODOS,
        };
      }
    }

    if (mostrarCrearNuevo && nuevoNombre.trim().length > 0) {
      nuevasRecetas[-1] = {
        ancla: nuevoAncla.trim() || ANCLAS_SUGERIDAS[nuevaFranja][0],
        diasTipo: "todos",
        diasBits: DIAS_TODOS,
      };
    }

    setRecetas(nuevasRecetas);
    setPaso(2);
  };

  // Cantidad total a empezar en etapa Inicio
  const enInicio = habitosActivos.filter((h) => h.etapa === "inicio").length;
  const totalNuevos = seleccionados.length + (mostrarCrearNuevo && nuevoNombre.trim() ? 1 : 0);
  const avisoDemasiados = !habitoAEditar && totalNuevos + enInicio > 2;

  const libroId = catalogo.find((h) => h.clave === CLAVE_LIBRO)?.id;
  const pideLibro = !habitoAEditar && libroId !== undefined && seleccionados.includes(libroId);
  const paginasLibro = Number(libroPaginas);
  const libroValido =
    libroTitulo.trim().length > 0 && Number.isInteger(paginasLibro) && paginasLibro >= 1 && paginasLibro <= MAX_PAGINAS_LIBRO;

  // Submit final
  const handleGuardar = async () => {
    setGuardando(true);
    try {
      if (habitoAEditar) {
        // PATCH /api/habitos/[id]
        const res = await fetch(`/api/habitos/${habitoAEditar.habitoId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nombre: nuevoNombre.trim(),
            minimo: nuevoMinimo.trim() || null,
            categoria: nuevaCategoria,
            franja: nuevaFranja,
            ancla: recetas[habitoAEditar.habitoId]?.ancla || nuevoAncla,
            ...(nuevaImagen ? { imagen: nuevaImagen } : {}),
          }),
        });
        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          throw new Error(json.error || "Error al actualizar hábito");
        }

        // Si cambiaron los días o ancla de su propia adopción
        const recetaPropia = recetas[habitoAEditar.habitoId];
        if (recetaPropia) {
          await fetch("/api/habitos/adopciones", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              habitoId: habitoAEditar.habitoId,
              dias: recetaPropia.diasBits,
              ancla: recetaPropia.ancla,
            }),
          });
        }
      } else {
        const itemsAAdoptar: {
          habitoId: number;
          dias: number;
          ancla: string;
          libro?: { titulo: string; paginas: number };
        }[] = [];

        // 1. Si creó uno nuevo: POST /api/habitos
        if (mostrarCrearNuevo && nuevoNombre.trim()) {
          const recNuevo = recetas[-1];
          const res = await fetch("/api/habitos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              nombre: nuevoNombre.trim(),
              minimo: nuevoMinimo.trim() || null,
              categoria: nuevaCategoria,
              franja: nuevaFranja,
              ancla: recNuevo?.ancla || nuevoAncla,
              imagen: nuevaImagen,
            }),
          });
          const json = await res.json();
          if (!res.ok) throw new Error(json.error || "Error al crear hábito");

          itemsAAdoptar.push({
            habitoId: json.habito.id,
            dias: recNuevo?.diasBits ?? DIAS_TODOS,
            ancla: recNuevo?.ancla || nuevoAncla,
          });
        }

        // 2. Hábitos existentes seleccionados
        for (const id of seleccionados) {
          const rec = recetas[id];
          itemsAAdoptar.push({
            habitoId: id,
            dias: rec?.diasBits ?? DIAS_TODOS,
            ancla: rec?.ancla || "Al levantarme",
            ...(id === libroId ? { libro: { titulo: libroTitulo.trim(), paginas: paginasLibro } } : {}),
          });
        }

        // 3. POST /api/habitos/adopciones
        if (itemsAAdoptar.length > 0) {
          const resAdop = await fetch("/api/habitos/adopciones", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              items: itemsAAdoptar,
              usuarioIds: [usuarioObjetivoId],
            }),
          });
          if (!resAdop.ok) {
            const json = await resAdop.json().catch(() => ({}));
            throw new Error(json.error || "Error al adoptar hábitos");
          }
        }
      }

      onClose();
      router.refresh();
      if (!esPadre && !habitoAEditar) {
        toast.success("¡Listo! Un padre tiene que aprobar que empieces este hábito. Cuando lo haga, ya vas a poder marcarlo.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al procesar solicitud");
    } finally {
      setGuardando(false);
    }
  };

  // Selector de miembro para padres (visible en ambos pasos)
  const selectorMiembro = (
    esPadre && miembros.length > 1 && !habitoAEditar && (
        <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/30">
          <Label htmlFor="para-miembro" className="font-medium text-sm">
            Para:
          </Label>
          <div className="w-56">
            <NativeSelect
              id="para-miembro"
              value={String(usuarioObjetivoId)}
              onChange={(e) => setUsuarioObjetivoId(Number(e.target.value))}
            >
              {miembros.map((m) => (
                <NativeSelectOption key={m.id} value={String(m.id)}>
                  {m.nombre} ({m.rolFamiliar})
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
        </div>
      )
  );

  // Contenido de los 2 pasos
  const renderPaso1 = () => (
    <div className="space-y-6 py-2">
      {/* Aviso suave de demasiados hábitos simultáneos */}
      {avisoDemasiados && (
        <Alert className="border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200">
          <AlertCircle className="size-4 text-amber-600 dark:text-amber-400" />
          <AlertDescription className="text-xs">
            Conviene empezar de a pocos; podés sumar más cuando estos se afiancen.
          </AlertDescription>
        </Alert>
      )}

      {/* Sección Crear / Editar Hábito Propio */}
      <div className="rounded-lg border p-4 space-y-4 bg-card">
        <div>
          <h4 className="font-medium text-sm">
            {habitoAEditar ? "Editar definición del hábito" : "Crear un hábito comunitario"}
          </h4>
          {!habitoAEditar && (
            <p className="text-xs text-muted-foreground">Toda la familia podrá verlo y adoptarlo.</p>
          )}
        </div>

        {(mostrarCrearNuevo || habitoAEditar) && (
          <div className="space-y-3 pt-2">
            <div className="space-y-1">
              <Label htmlFor="nuevo-nombre" className="text-xs">Nombre del hábito</Label>
              <Input
                id="nuevo-nombre"
                placeholder="Ej. Caminar 20 minutos, Estudiar latín..."
                value={nuevoNombre}
                maxLength={80}
                onChange={(e) => setNuevoNombre(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="nuevo-imagen" className="text-xs">Imagen del hábito</Label>
              <Input
                id="nuevo-imagen"
                type="file"
                accept="image/*"
                disabled={subiendoImagen}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setSubiendoImagen(true);
                  try {
                    setNuevaImagen((await subirImagen(file)).url);
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : "No se pudo subir la imagen");
                  } finally {
                    setSubiendoImagen(false);
                  }
                }}
              />
              {nuevaImagen && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={nuevaImagen} alt="Vista previa" className="mt-2 h-24 w-24 rounded-lg object-cover" />
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="nuevo-minimo" className="text-xs">
                Versión mínima opcional <span className="text-muted-foreground">(para micro-paso de inicio)</span>
              </Label>
              <Input
                id="nuevo-minimo"
                placeholder="Ej. Caminar 5 minutos, Leer 1 versículo..."
                value={nuevoMinimo}
                maxLength={120}
                onChange={(e) => setNuevoMinimo(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <Label className="text-xs">Categoría</Label>
                <ToggleGroup
                  type="single"
                  value={nuevaCategoria}
                  onValueChange={(val) => val && setNuevaCategoria(val as Categoria)}
                  className="justify-start gap-1"
                >
                  <ToggleGroupItem value="oracion" size="sm" className="text-xs">Oración</ToggleGroupItem>
                  <ToggleGroupItem value="orden" size="sm" className="text-xs">Orden</ToggleGroupItem>
                  <ToggleGroupItem value="cuidado" size="sm" className="text-xs">Cuidado</ToggleGroupItem>
                </ToggleGroup>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Franja del día</Label>
                <ToggleGroup
                  type="single"
                  value={nuevaFranja}
                  onValueChange={(val) => val && setNuevaFranja(val as Franja)}
                  className="justify-start gap-1"
                >
                  <ToggleGroupItem value="manana" size="sm" className="text-xs">Mañana</ToggleGroupItem>
                  <ToggleGroupItem value="tarde" size="sm" className="text-xs">Tarde</ToggleGroupItem>
                  <ToggleGroupItem value="noche" size="sm" className="text-xs">Noche</ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderPaso2 = () => {
    // Listado de hábitos a configurar en la receta
    const items = [
      ...seleccionados.map((id) => {
        const def = catalogo.find((x) => x.id === id)!;
        return {
          id,
          clave: def.clave,
          nombre: def.nombre,
          icono: def.icono,
          franja: def.franja,
          primerPaso: def.pasos[0]?.titulo || def.nombre,
          anclaSugerida: def.ancla,
        };
      }),
      ...(mostrarCrearNuevo && nuevoNombre.trim()
        ? [
            {
              id: -1,
              clave: null,
              nombre: nuevoNombre.trim(),
              icono: "Sparkles",
              franja: nuevaFranja,
              primerPaso: nuevoMinimo.trim() || nuevoNombre.trim(),
              anclaSugerida: nuevoAncla || ANCLAS_SUGERIDAS[nuevaFranja][0],
            },
          ]
        : []),
    ];

    return (
      <div className="space-y-6 py-2">
        <p className="text-xs text-muted-foreground">
          Define cuándo y qué días vas a practicar cada hábito para formar una receta clara:
        </p>

        <div className="space-y-4">
          {items.map((item) => {
            const receta = recetas[item.id] || {
              ancla: item.anclaSugerida,
              diasTipo: "todos",
              diasBits: DIAS_TODOS,
            };

            const actualizarReceta = (cambios: Partial<typeof receta>) => {
              setRecetas((prev) => ({
                ...prev,
                [item.id]: { ...receta, ...cambios },
              }));
            };

            return (
              <div key={item.id} className="rounded-lg border p-4 space-y-3 bg-card">
                <div className="flex items-center gap-2">
                  <div className="flex size-6 items-center justify-center rounded bg-muted">
                    <HabitoIcon name={item.icono} className="size-3.5" />
                  </div>
                  <h4 className="font-heading font-semibold text-base">{item.nombre}</h4>
                </div>

                {/* Receta: Después de [ancla], voy a [primerPaso] */}
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm">
                    <span className="font-medium whitespace-nowrap">Después de</span>
                    <Input
                      value={receta.ancla}
                      maxLength={120}
                      onChange={(e) => actualizarReceta({ ancla: e.target.value })}
                      placeholder="Ej. Al levantarme, después del almuerzo..."
                      className="text-sm h-8"
                    />
                    <span className="text-muted-foreground whitespace-nowrap">voy a:</span>
                    <span className="font-semibold text-primary">{item.primerPaso}</span>
                  </div>

                  {/* Chips con anclas sugeridas de su franja */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] text-muted-foreground">Sugerencias:</span>
                    {ANCLAS_SUGERIDAS[item.franja].map((sug) => (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => actualizarReceta({ ancla: sug })}
                        className={cn(
                          "rounded-md border px-2 py-0.5 text-[11px] transition-colors",
                          receta.ancla === sug
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-muted/50 hover:bg-muted"
                        )}
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                </div>

                {/* "Leer un libro": con qué libro empieza */}
                {item.clave === CLAVE_LIBRO && (
                  <div className="grid gap-3 border-t pt-3 sm:grid-cols-[1fr_8rem]">
                    <div className="space-y-1">
                      <Label htmlFor="libro-titulo" className="text-xs">Libro que vas a leer</Label>
                      <Input
                        id="libro-titulo"
                        placeholder="Ej. Las Crónicas de Narnia"
                        value={libroTitulo}
                        maxLength={200}
                        onChange={(e) => setLibroTitulo(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="libro-paginas" className="text-xs">Páginas</Label>
                      <Input
                        id="libro-paginas"
                        type="number"
                        inputMode="numeric"
                        min={1}
                        max={MAX_PAGINAS_LIBRO}
                        placeholder="Ej. 180"
                        value={libroPaginas}
                        onChange={(e) => setLibroPaginas(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {/* Días programados */}
                <div className="space-y-2 pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Días programados</Label>
                    <ToggleGroup
                      type="single"
                      value={receta.diasTipo}
                      onValueChange={(val) => {
                        if (!val) return;
                        const bits = val === "todos" ? DIAS_TODOS : val === "lun-vie" ? DIAS_LUN_VIE : receta.diasBits;
                        actualizarReceta({ diasTipo: val, diasBits: bits });
                      }}
                      className="gap-1"
                    >
                      <ToggleGroupItem value="todos" size="sm">Todos</ToggleGroupItem>
                      <ToggleGroupItem value="lun-vie" size="sm">Lun–Vie</ToggleGroupItem>
                      <ToggleGroupItem value="custom" size="sm">Elegir días</ToggleGroupItem>
                    </ToggleGroup>
                  </div>

                  {receta.diasTipo === "custom" && (
                    <div className="flex items-center justify-between gap-1 pt-1">
                      {DIAS_NOMBRES.map(({ bit, label }) => {
                        const activo = (receta.diasBits & (1 << bit)) !== 0;
                        return (
                          <button
                            key={bit}
                            type="button"
                            onClick={() => {
                              const nuevoBitmask = activo
                                ? receta.diasBits & ~(1 << bit)
                                : receta.diasBits | (1 << bit);
                              actualizarReceta({ diasBits: nuevoBitmask });
                            }}
                            className={cn(
                              "size-7 rounded-md border text-xs font-medium transition-colors",
                              activo
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-muted/40 text-muted-foreground"
                            )}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const puedeAvanzar =
    habitoAEditar
      ? nuevoNombre.trim().length > 0
      : seleccionados.length > 0 || (nuevoNombre.trim().length > 0 && !!nuevaImagen && !subiendoImagen);

  const dialogTitle = habitoAEditar
    ? "Editar hábito"
    : paso === 1
    ? "Paso 1 · ¿Qué querés empezar?"
    : "Paso 2 · Tu receta";

  const dialogDesc = habitoAEditar
    ? "Modificá la definición y receta de tu hábito."
    : paso === 1
    ? "Creá un hábito nuevo para la familia, con su imagen."
    : "Personalizá el ancla y los días de práctica para empezar con éxito.";

  const renderFooter = () => (
    <div className="flex w-full items-center justify-between gap-2 pt-2">
      <div className="text-xs text-muted-foreground font-medium">
        Indicador {paso} de 2
      </div>
      <div className="flex items-center gap-2">
        {paso === 2 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={guardando}
            onClick={() => setPaso(1)}
          >
            <ChevronLeft className="size-4" /> Volver
          </Button>
        )}
        {paso === 1 ? (
          <Button
            type="button"
            size="sm"
            disabled={!puedeAvanzar}
            onClick={avanzarAPaso2}
          >
            Siguiente <ChevronRight className="size-4" />
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            disabled={guardando || (pideLibro && !libroValido)}
            onClick={handleGuardar}
          >
            {guardando ? <Spinner /> : <Check className="size-4" />}
            {habitoAEditar ? "Guardar cambios" : "Empezar hoy"}
          </Button>
        )}
      </div>
    </div>
  );

  const tituloAyuda = habitoAEditar ? "Editar el hábito" : paso === 1 ? "Paso 1: elegir hábitos" : "Paso 2: la receta";
  const textoAyuda = habitoAEditar ? (
    <p>Cambiá el nombre, el ancla o la imagen. Los cambios los ve toda la familia.</p>
  ) : paso === 1 ? (
    <p>Elegí hasta dos hábitos para empezar o creá uno nuevo; los que crees quedan disponibles para toda la familia. Empezar con pocos ayuda a sostenerlos.</p>
  ) : (
    <p>Definí cuándo se hace: el «ancla» es lo que ya hacés y dispara el hábito (por ejemplo, «al levantarme»), y los días son los de la semana en que corresponde.</p>
  );

  if (isDesktop) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-1.5 font-heading">{dialogTitle} <AyudaIcono titulo={tituloAyuda}>{textoAyuda}</AyudaIcono></DialogTitle>
            <DialogDescription>{dialogDesc}</DialogDescription>
          </DialogHeader>

          {selectorMiembro}
          {paso === 1 ? renderPaso1() : renderPaso2()}

          <DialogFooter className="border-t pt-3">
            {renderFooter()}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="data-[vaul-drawer-direction=bottom]:max-h-[92dvh] overflow-hidden px-4">
        <DrawerHeader className="text-left">
          <DrawerTitle className="flex items-center gap-1.5 font-heading">{dialogTitle} <AyudaIcono titulo={tituloAyuda}>{textoAyuda}</AyudaIcono></DrawerTitle>
          <DrawerDescription>{dialogDesc}</DrawerDescription>
        </DrawerHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-1">
          {selectorMiembro}
          {paso === 1 ? renderPaso1() : renderPaso2()}
        </div>

        <DrawerFooter className="shrink-0 border-t pt-3">
          {renderFooter()}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
