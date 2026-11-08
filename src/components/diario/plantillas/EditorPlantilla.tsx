"use client";
// Diario (lane 286): crear o editar una plantilla. Portado de vendor/Daily_You/lib/pages/edit_template_page.dart (Demizo/Daily_You@7cc237d):
// nombre, cuerpo, botones para insertar las variables {{date}} y {{time}}, y las etiquetas que se ponen al usarla.
import { useMemo, useRef, useState } from "react";
import { CalendarDays, Clock, Tags, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { NodoDoc } from "@/lib/diario/contenido";
import { MAX_NOMBRE_PLANTILLA } from "@/lib/diario/plantillas";
import type { PlantillaVista } from "@/lib/diario/servidor-plantillas";
import { ChipEtiqueta } from "../etiquetas/ChipEtiqueta";
import { SelectorEtiquetas } from "../etiquetas/SelectorEtiquetas";
import type { AccionesCatalogo } from "../etiquetas/useCatalogo";
import { EditorTexto, type EditorTextoHandle } from "../editor/EditorTexto";
import type { AccionesPlantillas } from "./usePlantillas";

export function EditorPlantilla({
  plantilla,
  plantillas,
  catalogo,
  onAdministrarEtiquetas,
  onCerrar,
}: {
  /** Sin plantilla = nueva. */
  plantilla?: PlantillaVista;
  plantillas: AccionesPlantillas;
  catalogo: AccionesCatalogo;
  onAdministrarEtiquetas: () => void;
  onCerrar: () => void;
}) {
  const [nombre, setNombre] = useState(plantilla?.nombre ?? "");
  const [etiquetas, setEtiquetas] = useState<number[]>(plantilla?.etiquetas ?? []);
  const [eligiendo, setEligiendo] = useState(false);
  const [trabajando, setTrabajando] = useState(false);
  const doc = useRef<NodoDoc | null>(plantilla?.contenido ?? null);
  const editor = useRef<EditorTextoHandle>(null);

  // Las plantillas solo llevan etiquetas simples: los contadores piden un valor distinto en cada entrada (decisión P6)
  const catalogoSimples = useMemo<AccionesCatalogo>(
    () => ({ ...catalogo, catalogo: catalogo.catalogo ? { ...catalogo.catalogo, etiquetas: catalogo.catalogo.etiquetas.filter((e) => e.tipo === "etiqueta") } : null }),
    [catalogo],
  );
  const puestas = etiquetas.map((id) => catalogoSimples.catalogo?.etiquetas.find((e) => e.id === id)).filter((e) => e !== undefined);

  async function guardar() {
    setTrabajando(true);
    const cuerpo = { nombre, contenido: doc.current, etiquetas: puestas.map((e) => e.id) };
    const ok = plantilla ? await plantillas.editar(plantilla.id, cuerpo) : (await plantillas.crear(cuerpo)) !== null;
    setTrabajando(false);
    if (ok) onCerrar();
  }

  async function borrar() {
    if (!plantilla || !window.confirm(`¿Borrar la plantilla «${plantilla.nombre}»? No se puede deshacer.`)) return;
    setTrabajando(true);
    const ok = await plantillas.borrar(plantilla.id);
    setTrabajando(false);
    if (ok) onCerrar();
  }

  // Los botones de variables no le sacan el foco al editor: así la variable entra donde está el cursor
  const sinFoco = (e: React.MouseEvent) => e.preventDefault();

  return (
    <Sheet open onOpenChange={(a) => !a && onCerrar()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{plantilla ? "Editar plantilla" : "Nueva plantilla"}</SheetTitle>
          <SheetDescription>
            Podés usar {"{{date}}"} y {"{{time}}"} en el texto: se reemplazan por la fecha y la hora de la entrada. Con formato propio: {"{{date:yyyy-MM-dd}}"}.
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 px-4">
          <Input placeholder="Nombre de la plantilla" aria-label="Nombre de la plantilla" value={nombre} maxLength={MAX_NOMBRE_PLANTILLA} onChange={(e) => setNombre(e.target.value)} />
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onMouseDown={sinFoco} onClick={() => editor.current?.insertarTexto("{{date}}")}>
              <CalendarDays /> {"{{date}}"}
            </Button>
            <Button type="button" variant="outline" size="sm" onMouseDown={sinFoco} onClick={() => editor.current?.insertarTexto("{{time}}")}>
              <Clock /> {"{{time}}"}
            </Button>
          </div>
          <EditorTexto
            ref={editor}
            inicial={{ contenido: plantilla?.contenido ?? null, texto: plantilla?.texto ?? "" }}
            placeholder="Escribí el texto de la plantilla"
            onCambio={(d) => {
              doc.current = d;
            }}
          />
          <div className="flex flex-wrap items-center gap-1.5">
            {puestas.map((e) => (
              <ChipEtiqueta key={e.id} etiqueta={e} onQuitar={() => setEtiquetas((x) => x.filter((id) => id !== e.id))} />
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => setEligiendo(true)}>
              <Tags /> Etiquetas
            </Button>
          </div>
        </div>
        {eligiendo && (
          <SelectorEtiquetas
            acciones={catalogoSimples}
            puestas={etiquetas.map((id) => ({ id, valor: null }))}
            onCambio={(p) => setEtiquetas(p.map((x) => x.id))}
            onAdministrar={onAdministrarEtiquetas}
            onCerrar={() => setEligiendo(false)}
          />
        )}
        <SheetFooter className="flex-row items-center justify-between gap-2">
          {plantilla ? (
            <Button type="button" variant="ghost" className="text-destructive" disabled={trabajando} onClick={() => void borrar()}>
              <Trash2 /> Borrar
            </Button>
          ) : (
            <span />
          )}
          <Button type="button" disabled={trabajando || !nombre.trim()} onClick={() => void guardar()}>
            Guardar
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
