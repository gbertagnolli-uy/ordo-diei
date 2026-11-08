"use client";
// Editor de texto enriquecido del diario (lane 283). Tiptap 3 + React, portado del editor web de moodiary
// (vendor/moodiary/editor, ZhuJHua/moodiary@2c552dd). Sirve para escribir (con barra de formato) y, con
// `editable={false}`, para mostrar una entrada con el mismo aspecto.
import { useCallback, useImperativeHandle, useMemo, useRef, useState, type Ref } from "react";
import type { Editor, JSONContent } from "@tiptap/core";
import { EditorContent, useEditor } from "@tiptap/react";
import { docDesdeTexto, type NodoDoc } from "@/lib/diario/contenido";
import { toast } from "@/lib/toast";
import { crearExtensiones, crearPropiedades } from "./core/kit";
import { execCommand } from "./core/commands";
import { subirImagen } from "./subir";
import { BarraFormato } from "./ui/BarraFormato";
import VistaCodigo from "./ui/VistaCodigo";
import VistaImagen from "./ui/VistaImagen";

export interface ContenidoInicial {
  /** Documento Tiptap; null = entrada en texto plano (lane 272), se abre como un párrafo por línea. */
  contenido: NodoDoc | null;
  texto: string;
}

/** Lo que el que lo usa puede pedirle al editor (lane 286: insertar una plantilla o una variable). */
export interface EditorTextoHandle {
  /**
   * Daily You `insertTemplateText`: si el editor está vacío lo reemplaza; si el cursor está en el texto inserta ahí;
   * si no, agrega al final.
   */
  insertarContenido: (doc: NodoDoc) => void;
  /** Inserta texto en la posición del cursor (aunque el editor haya perdido el foco al tocar un botón). */
  insertarTexto: (texto: string) => void;
}

interface Props {
  ref?: Ref<EditorTextoHandle>;
  inicial: ContenidoInicial;
  editable?: boolean;
  placeholder?: string;
  /** Se llama en cada cambio del documento. */
  onCambio?: (doc: NodoDoc) => void;
  className?: string;
}

export function EditorTexto({ ref, inicial, editable = true, placeholder = "¿Qué pasó hoy?", onCambio, className }: Props) {
  const editorRef = useRef<Editor | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const inputArchivo = useRef<HTMLInputElement>(null);
  const onCambioRef = useRef(onCambio);
  onCambioRef.current = onCambio;

  // El contenido inicial se lee una sola vez: después el editor es la fuente de verdad
  const docInicial = useMemo(() => (inicial.contenido ?? docDesdeTexto(inicial.texto)) as JSONContent, []); // eslint-disable-line react-hooks/exhaustive-deps
  const extensiones = useMemo(() => crearExtensiones(placeholder, { codeBlock: VistaCodigo, image: VistaImagen }), []); // eslint-disable-line react-hooks/exhaustive-deps

  const insertarImagenes = useCallback((files: File[], pos?: number): boolean => {
    const imagenes = files.filter((f) => f.type.startsWith("image/"));
    if (!imagenes.length) return false;
    setSubiendo(true);
    void (async () => {
      try {
        for (const f of imagenes) {
          const url = await subirImagen(f);
          const ed = editorRef.current;
          if (!ed || ed.isDestroyed) return;
          if (pos != null) ed.commands.setTextSelection(pos);
          execCommand(ed, "insertImage", { src: url, name: f.name.replace(/\.[^.]+$/, "") });
        }
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "No se pudo subir la imagen");
      } finally {
        setSubiendo(false);
      }
    })();
    return true;
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      insertarContenido(doc) {
        const ed = editorRef.current;
        if (!ed || ed.isDestroyed) return;
        if (ed.isEmpty) {
          ed.chain().setContent(doc as JSONContent, { emitUpdate: true }).focus("end").run();
          return;
        }
        const bloques = (doc.content ?? []) as JSONContent[];
        (ed.isFocused ? ed.chain().focus() : ed.chain().focus("end")).insertContent(bloques).run();
      },
      insertarTexto(texto) {
        const ed = editorRef.current;
        if (!ed || ed.isDestroyed) return;
        ed.chain().focus().insertContent(texto).run();
      },
    }),
    [],
  );

  const editor = useEditor({
    immediatelyRender: false,
    extensions: extensiones,
    content: docInicial,
    editable,
    enableContentCheck: false,
    editorProps: {
      attributes: { class: "md-prose", "aria-label": "Texto de la entrada", role: "textbox", "aria-multiline": "true" },
      ...crearPropiedades({ getEditor: () => editorRef.current, subirImagenes: insertarImagenes }),
    },
    onCreate: ({ editor: e }) => {
      editorRef.current = e;
    },
    onUpdate: ({ editor: e }) => onCambioRef.current?.(e.getJSON() as NodoDoc),
  });

  return (
    <div className={`md-editor ${className ?? ""}`}>
      {editable && editor && (
        <div className="sticky top-0 z-10 mb-2 bg-background pb-1">
          <BarraFormato editor={editor} subiendo={subiendo} onImagen={() => inputArchivo.current?.click()} />
          <input
            ref={inputArchivo}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => {
              insertarImagenes(Array.from(e.target.files ?? []));
              e.target.value = "";
            }}
          />
        </div>
      )}
      <EditorContent editor={editor} className="md-content" />
    </div>
  );
}
