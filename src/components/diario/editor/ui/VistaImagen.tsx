"use client";
// Portado de vendor/moodiary/editor/src/ui/nodes/ImageNodeView.tsx (ZhuJHua/moodiary@2c552dd)
// Sin traducción de nombres a URLs ni vista previa por el puente: el `src` ya es la URL de la imagen.
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";

export default function VistaImagen({ node, selected }: NodeViewProps) {
  const src = typeof node.attrs.src === "string" ? node.attrs.src : undefined;
  const width = typeof node.attrs.widthPercent === "number" ? node.attrs.widthPercent : null;

  return (
    <NodeViewWrapper
      className={`md-block md-image${selected ? " is-selected" : ""}`}
      style={width ? { width: `${width}%` } : undefined}
      data-block-node=""
      contentEditable={false}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- imágenes ya optimizadas por /api/upload */}
      <img className="md-block__body md-image__img" src={src} alt={(node.attrs.name as string | null) ?? ""} draggable={false} />
    </NodeViewWrapper>
  );
}
