"use client";
// Editor de texto enriquecido del diario (lane 283). Tiptap 3 + React, portado del editor web de moodiary
// (vendor/moodiary/editor, ZhuJHua/moodiary@2c552dd). Sirve para escribir (con barra de formato) y, con
// `editable={false}`, para mostrar una entrada con el mismo aspecto.
import { useCallback, useImperativeHandle, useMemo, useRef, useState, type Ref } from "react";
import type { Editor, JSONContent } from "@tiptap/core";
import { EditorContent, useEditor } from "@tiptap/react";
import { ACEPTAR_ADJUNTOS, clasificarAdjunto } from "@/lib/diario/adjuntos";
import { docDesdeTexto, type NodoDoc } from "@/lib/diario/contenido";
import type { TipoDiario } from "@/lib/diario/reglas";
import { toast } from "@/lib/toast";
import { useAbrirEntrada } from "../enlaces/ContextoEnlaces";
import { crearExtensiones, crearPropiedades } from "./core/kit";
import { execCommand } from "./core/commands";
import { subirAdjunto, subirImagen } from "./subir";
import { BarraBusqueda } from "./ui/BarraBusqueda";
import { BarraFormato } from "./ui/BarraFormato";
import { SugerenciaEnlace } from "./ui/SugerenciaEnlace";
import { GrabadoraDeVoz } from "./ui/GrabadoraDeVoz";
import VistaAdjunto from "./ui/VistaAdjunto";
import VistaAudio from "./ui/VistaAudio";
import VistaCodigo from "./ui/VistaCodigo";
import VistaImagen from "./ui/VistaImagen";
import VistaVideo from "./ui/VistaVideo";

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
  /** Lane 290: el diario del que salen las entradas para enlazar con «[[». Sin esto no se ofrece enlazar. */
  tipo?: TipoDiario;
  /** Lane 290: la entrada que se está editando (no se ofrece enlazarla a sí misma). */
  entradaId?: number | null;
}

export function EditorTexto({ ref, inicial, editable = true, placeholder = "¿Qué pasó hoy?", onCambio, className, tipo, entradaId = null }: Props) {
  const editorRef = useRef<Editor | null>(null);
  const [buscando, setBuscando] = useState(false);
  const abrirEntrada = useAbrirEntrada();
  const contextoRef = useRef(tipo ? { tipo, excluirId: entradaId } : null);
  contextoRef.current = tipo ? { tipo, excluirId: entradaId } : null;
  const [subiendo, setSubiendo] = useState(false);
  const inputArchivo = useRef<HTMLInputElement>(null);
  const inputAdjunto = useRef<HTMLInputElement>(null);
  const [grabando, setGrabando] = useState(false);
  const onCambioRef = useRef(onCambio);
  onCambioRef.current = onCambio;

  // El contenido inicial se lee una sola vez: después el editor es la fuente de verdad
  const docInicial = useMemo(() => (inicial.contenido ?? docDesdeTexto(inicial.texto)) as JSONContent, []); // eslint-disable-line react-hooks/exhaustive-deps
  const extensiones = useMemo(() => crearExtensiones(placeholder, { codeBlock: VistaCodigo, image: VistaImagen, audio: VistaAudio, video: VistaVideo, attachment: VistaAdjunto }, () => contextoRef.current), []); // eslint-disable-line react-hooks/exhaustive-deps

  // Imágenes (las normaliza el servidor) y, desde la lane 294, audio, video corto y documentos (≤ 4 MB)
  const insertarArchivos = useCallback((files: File[], pos?: number): boolean => {
    const aceptados = files.filter((f) => f.type.startsWith("image/") || clasificarAdjunto(f.name, f.type));
    if (!aceptados.length) return false;
    setSubiendo(true);
    void (async () => {
      try {
        for (const f of aceptados) {
          const sinExtension = f.name.replace(/\.[^.]+$/, "");
          const esImagen = f.type.startsWith("image/");
          const subido = esImagen ? null : await subirAdjunto(f);
          const url = subido ? subido.url : await subirImagen(f);
          const ed = editorRef.current;
          if (!ed || ed.isDestroyed) return;
          if (pos != null) ed.commands.setTextSelection(pos);
          if (!subido) execCommand(ed, "insertImage", { src: url, name: sinExtension });
          else if (subido.categoria === "audio") execCommand(ed, "insertAudio", { src: url, name: sinExtension });
          else if (subido.categoria === "video") execCommand(ed, "insertVideo", { src: url, name: subido.nombre });
          else execCommand(ed, "insertAttachment", { src: url, name: subido.nombre, mime: subido.mime, size: subido.bytes });
        }
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "No se pudo subir el archivo");
      } finally {
        setSubiendo(false);
      }
    })();
    return true;
  }, []);

  // La nota de voz recién grabada se sube y se agrega al texto como un audio
  const guardarNotaDeVoz = useCallback(async (archivo: File) => {
    setSubiendo(true);
    try {
      const subido = await subirAdjunto(archivo);
      const ed = editorRef.current;
      if (ed && !ed.isDestroyed) execCommand(ed, "insertAudio", { src: subido.url, name: subido.nombre.replace(/\.[^.]+$/, "") });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar la nota de voz");
    } finally {
      setSubiendo(false);
    }
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
      ...crearPropiedades({ getEditor: () => editorRef.current, subirArchivos: insertarArchivos }),
    },
    onCreate: ({ editor: e }) => {
      editorRef.current = e;
    },
    onUpdate: ({ editor: e }) => onCambioRef.current?.(e.getJSON() as NodoDoc),
  });

  return (
    <div
      className={`md-editor ${className ?? ""}`}
      onKeyDown={(e) => {
        // Ctrl+F busca dentro del texto en vez de en la página
        if (editable && editor && (e.ctrlKey || e.metaKey) && !e.altKey && e.key.toLowerCase() === "f") {
          e.preventDefault();
          setBuscando(true);
        }
      }}
      onClick={(e) => {
        // En solo lectura, tocar un enlace a otra entrada la abre (en el editor solo coloca el cursor)
        if (editable || !abrirEntrada || !(e.target instanceof Element)) return;
        const id = Number(e.target.closest('[data-type="diaryLink"]')?.getAttribute("data-id"));
        if (Number.isInteger(id) && id > 0) abrirEntrada(id);
      }}
    >
      {editable && editor && (
        <div className="sticky top-0 z-10 mb-2 flex flex-col gap-1 bg-background pb-1">
          <BarraFormato editor={editor} subiendo={subiendo} onImagen={() => inputArchivo.current?.click()} onAdjuntar={() => inputAdjunto.current?.click()} onVoz={() => setGrabando(true)} onBuscar={() => setBuscando(!buscando)} buscando={buscando} puedeEnlazar={!!tipo} />
          {buscando && <BarraBusqueda editor={editor} onCerrar={() => setBuscando(false)} />}
          <input
            ref={inputArchivo}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => {
              insertarArchivos(Array.from(e.target.files ?? []));
              e.target.value = "";
            }}
          />
          <input
            ref={inputAdjunto}
            type="file"
            accept={ACEPTAR_ADJUNTOS}
            multiple
            hidden
            onChange={(e) => {
              insertarArchivos(Array.from(e.target.files ?? []));
              e.target.value = "";
            }}
          />
        </div>
      )}
      <EditorContent editor={editor} className="md-content" />
      {editable && tipo && <SugerenciaEnlace />}
      {editable && grabando && <GrabadoraDeVoz onGuardar={guardarNotaDeVoz} onCerrar={() => setGrabando(false)} />}
    </div>
  );
}
