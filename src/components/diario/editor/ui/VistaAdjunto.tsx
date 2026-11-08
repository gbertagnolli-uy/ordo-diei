"use client";
// Portado de vendor/moodiary/editor/src/ui/nodes/AttachmentNodeView.tsx (ZhuJHua/moodiary@2c552dd)
// Cambios (lane 294): en moodiary tocar la ficha avisa a Flutter (`postAttachmentTap`); acá abre el archivo en otra pestaña
// (en solo lectura) y la flecha es un enlace de descarga que también funciona al editar. La extensión sale del nombre, no del `src`.
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { ArrowUpRight } from "lucide-react";
import { extensionDe, formatearTamano } from "@/lib/diario/adjuntos";

export default function VistaAdjunto({ node, selected, editor }: NodeViewProps) {
  const src = typeof node.attrs.src === "string" ? node.attrs.src : "";
  const nombre = (node.attrs.name as string | null) || "Archivo";
  const ext = extensionDe(nombre).slice(0, 4);
  const tamano = formatearTamano(node.attrs.size as number | null);

  return (
    <NodeViewWrapper className={`md-block md-attachment${selected ? " is-selected" : ""}`} data-block-node="" contentEditable={false}>
      <div
        className="md-block__body md-attachment__card"
        title="Abrir"
        onClick={() => {
          if (!editor.isEditable && src) window.open(src, "_blank", "noopener,noreferrer");
        }}
      >
        <span className="md-attachment__tile">{ext ? ext.toUpperCase() : "?"}</span>
        <span className="md-attachment__text">
          <span className="md-attachment__name">{nombre}</span>
          {tamano && <span className="md-attachment__size">{tamano}</span>}
        </span>
        <a
          className="md-attachment__open"
          href={src ? `${src}?descargar=1` : undefined}
          download={nombre}
          aria-label={`Descargar ${nombre}`}
          title="Descargar"
          onClick={(e) => e.stopPropagation()}
        >
          <ArrowUpRight aria-hidden="true" />
        </a>
      </div>
    </NodeViewWrapper>
  );
}
