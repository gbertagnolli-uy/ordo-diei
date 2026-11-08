"use client";
// Portado de vendor/moodiary/editor/src/ui/nodes/ImageNodeView.tsx (ZhuJHua/moodiary@2c552dd)
// Sin traducción de nombres a URLs ni vista previa por el puente: el `src` ya es la URL de la imagen.
// Lane 294: en solo lectura, tocar la imagen abre el visor de fotos con todas las imágenes del texto (en moodiary lo hace `postImagePreview`).
import { useState } from "react";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { imagenesDe, type NodoDoc } from "@/lib/diario/contenido";
import { VisorDeFotos } from "../../visor/VisorDeFotos";

export default function VistaImagen({ node, selected, editor }: NodeViewProps) {
  const src = typeof node.attrs.src === "string" ? node.attrs.src : undefined;
  const width = typeof node.attrs.widthPercent === "number" ? node.attrs.widthPercent : null;
  const [visor, setVisor] = useState<{ fotos: string[]; inicio: number } | null>(null);

  function abrirVisor() {
    if (editor.isEditable || !src) return;
    const fotos = imagenesDe(editor.getJSON() as NodoDoc);
    setVisor({ fotos, inicio: Math.max(0, fotos.indexOf(src)) });
  }

  return (
    <NodeViewWrapper
      className={`md-block md-image${selected ? " is-selected" : ""}`}
      style={width ? { width: `${width}%` } : undefined}
      data-block-node=""
      contentEditable={false}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- imágenes ya optimizadas por /api/upload */}
      <img
        className="md-block__body md-image__img"
        src={src}
        alt={(node.attrs.name as string | null) ?? ""}
        draggable={false}
        onClick={abrirVisor}
        style={editor.isEditable ? undefined : { cursor: "zoom-in" }}
      />
      {visor && <VisorDeFotos fotos={visor.fotos} inicio={visor.inicio} onCerrar={() => setVisor(null)} />}
    </NodeViewWrapper>
  );
}
