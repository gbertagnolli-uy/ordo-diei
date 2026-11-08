"use client";
// Barra de formato del editor. En moodiary la barra es de Flutter (`editor_action_bar`); acá es React y usa las mismas
// órdenes de `core/commands.ts` y el estado de `core/state.ts` (ZhuJHua/moodiary@2c552dd).
import { useState, type ReactNode } from "react";
import type { Editor } from "@tiptap/core";
import { useEditorState } from "@tiptap/react";
import {
  Bold,
  Code,
  Eraser,
  Heading2,
  Heading3,
  Highlighter,
  ImagePlus,
  Mic,
  Paperclip,
  IndentDecrease,
  IndentIncrease,
  Italic,
  Link as LinkIcon,
  Link2,
  List,
  ListChecks,
  ListOrdered,
  Minus,
  Redo2,
  Search,
  SquareCode,
  Strikethrough,
  Table,
  TextQuote,
  Trash2,
  Underline,
  Undo2,
  Unlink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { execCommand, normalizeHref, type ExecArgs } from "../core/commands";
import { deriveState } from "../core/state";
import { cn } from "@/lib/utils";

interface Boton {
  icono: ReactNode;
  etiqueta: string;
  activo?: boolean;
  deshabilitado?: boolean;
  onClick: () => void;
}

function Tecla({ icono, etiqueta, activo, deshabilitado, onClick }: Boton) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={etiqueta}
      title={etiqueta}
      aria-pressed={activo}
      disabled={deshabilitado}
      // Evita que el botón le quite el foco (y la selección) al editor
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(activo && "bg-primary/15 text-primary")}
    >
      {icono}
    </Button>
  );
}

const Separador = () => <span aria-hidden className="mx-0.5 h-5 w-px bg-border" />;

export function BarraFormato({
  editor,
  subiendo,
  onImagen,
  onAdjuntar,
  onVoz,
  onBuscar,
  buscando,
  puedeEnlazar,
}: {
  editor: Editor;
  subiendo: boolean;
  onImagen: () => void;
  /** Lane 294: elegir un audio, un video corto o un documento. */
  onAdjuntar: () => void;
  /** Lane 294: abrir la grabadora de notas de voz. */
  onVoz: () => void;
  /** Abre o cierra la barra de búsqueda dentro del texto (lane 290). */
  onBuscar: () => void;
  buscando: boolean;
  /** Hay un diario del que sacar entradas para enlazar (lane 290). */
  puedeEnlazar: boolean;
}) {
  const estado = useEditorState({ editor, selector: ({ editor: e }) => deriveState(e) });
  const [enlace, setEnlace] = useState<string | null>(null);
  const run = (cmd: string, args?: ExecArgs) => execCommand(editor, cmd, args);

  function abrirEnlace() {
    setEnlace(estado.link?.href ?? "");
  }

  function aplicarEnlace() {
    const href = normalizeHref(enlace ?? "");
    if (!href) return;
    run("setLink", { href });
    setEnlace(null);
  }

  return (
    <div role="toolbar" aria-label="Formato del texto" className="flex flex-col gap-1 rounded-xl border bg-card p-1">
      <div className="flex flex-wrap items-center gap-0.5">
        <Tecla icono={<Undo2 />} etiqueta="Deshacer" deshabilitado={!estado.canUndo} onClick={() => run("undo")} />
        <Tecla icono={<Redo2 />} etiqueta="Rehacer" deshabilitado={!estado.canRedo} onClick={() => run("redo")} />
        <Separador />
        <Tecla icono={<Bold />} etiqueta="Negrita" activo={estado.marks.bold} onClick={() => run("toggleBold")} />
        <Tecla icono={<Italic />} etiqueta="Cursiva" activo={estado.marks.italic} onClick={() => run("toggleItalic")} />
        <Tecla icono={<Underline />} etiqueta="Subrayado" activo={estado.marks.underline} onClick={() => run("toggleUnderline")} />
        <Tecla icono={<Strikethrough />} etiqueta="Tachado" activo={estado.marks.strike} onClick={() => run("toggleStrike")} />
        <Tecla icono={<Highlighter />} etiqueta="Resaltado" activo={estado.marks.highlight} onClick={() => run("toggleHighlight")} />
        <Tecla icono={<Code />} etiqueta="Código en línea" activo={estado.marks.code} onClick={() => run("toggleCode")} />
        <Tecla icono={<Eraser />} etiqueta="Quitar formato" onClick={() => run("clearFormatting")} />
        <Separador />
        <Tecla icono={<Heading2 />} etiqueta="Título" activo={estado.block === "heading2"} onClick={() => run("setHeading", { level: 2 })} />
        <Tecla icono={<Heading3 />} etiqueta="Subtítulo" activo={estado.block === "heading3"} onClick={() => run("setHeading", { level: 3 })} />
        <Tecla icono={<TextQuote />} etiqueta="Cita" activo={estado.block === "blockquote"} onClick={() => run("toggleBlockquote")} />
        <Tecla icono={<SquareCode />} etiqueta="Bloque de código" activo={estado.block === "codeBlock"} onClick={() => run("toggleCodeBlock")} />
        <Separador />
        <Tecla icono={<List />} etiqueta="Lista" activo={estado.list === "bullet"} onClick={() => run("toggleBulletList")} />
        <Tecla icono={<ListOrdered />} etiqueta="Lista numerada" activo={estado.list === "ordered"} onClick={() => run("toggleOrderedList")} />
        <Tecla icono={<ListChecks />} etiqueta="Lista de tareas" activo={estado.list === "task"} onClick={() => run("toggleTaskList")} />
        <Tecla icono={<IndentIncrease />} etiqueta="Aumentar sangría" deshabilitado={!estado.canIndent} onClick={() => run("indent")} />
        <Tecla icono={<IndentDecrease />} etiqueta="Reducir sangría" deshabilitado={!estado.canOutdent} onClick={() => run("outdent")} />
        <Separador />
        <Tecla icono={<LinkIcon />} etiqueta="Enlace" activo={estado.marks.link} onClick={abrirEnlace} />
        {estado.marks.link && <Tecla icono={<Unlink />} etiqueta="Quitar enlace" onClick={() => run("unsetLink")} />}
        {puedeEnlazar && <Tecla icono={<Link2 />} etiqueta="Enlazar otra entrada" onClick={() => run("insertDiaryLink")} />}
        <Tecla icono={<ImagePlus />} etiqueta="Insertar imagen" deshabilitado={subiendo} onClick={onImagen} />
        <Tecla icono={<Paperclip />} etiqueta="Adjuntar audio, video o documento" deshabilitado={subiendo} onClick={onAdjuntar} />
        <Tecla icono={<Mic />} etiqueta="Grabar nota de voz" deshabilitado={subiendo} onClick={onVoz} />
        <Tecla icono={<Table />} etiqueta="Insertar tabla" onClick={() => run("insertTable")} />
        <Tecla icono={<Minus />} etiqueta="Separador" onClick={() => run("insertHorizontalRule")} />
        <Separador />
        <Tecla icono={<Search />} etiqueta="Buscar en el texto (Ctrl+F)" activo={buscando} onClick={onBuscar} />
      </div>
      {enlace !== null && (
        <form
          className="flex items-center gap-2 px-1 pb-1"
          onSubmit={(e) => {
            e.preventDefault();
            aplicarEnlace();
          }}
        >
          <Input autoFocus placeholder="https://…" value={enlace} onChange={(e) => setEnlace(e.target.value)} aria-label="Dirección del enlace" />
          <Button type="submit" size="sm" disabled={!normalizeHref(enlace)}>
            Aplicar
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => setEnlace(null)}>
            Cancelar
          </Button>
        </form>
      )}
      {estado.inTable && (
        <div className="flex flex-wrap items-center gap-1 px-1 pb-1 text-xs">
          <span className="text-muted-foreground">Tabla:</span>
          <Button type="button" size="xs" variant="outline" onMouseDown={(e) => e.preventDefault()} onClick={() => run("tableAddRowAfter")}>
            + Fila
          </Button>
          <Button type="button" size="xs" variant="outline" onMouseDown={(e) => e.preventDefault()} onClick={() => run("tableDeleteRow")}>
            − Fila
          </Button>
          <Button type="button" size="xs" variant="outline" onMouseDown={(e) => e.preventDefault()} onClick={() => run("tableAddColumnAfter")}>
            + Columna
          </Button>
          <Button type="button" size="xs" variant="outline" onMouseDown={(e) => e.preventDefault()} onClick={() => run("tableDeleteColumn")}>
            − Columna
          </Button>
          <Button type="button" size="xs" variant="outline" onMouseDown={(e) => e.preventDefault()} onClick={() => run("tableToggleHeaderRow")}>
            Encabezado
          </Button>
          <Button type="button" size="xs" variant="destructive" onMouseDown={(e) => e.preventDefault()} onClick={() => run("tableDelete")}>
            <Trash2 /> Borrar tabla
          </Button>
        </div>
      )}
    </div>
  );
}
