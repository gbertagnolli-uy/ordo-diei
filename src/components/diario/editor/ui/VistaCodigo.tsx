"use client";
// Portado de vendor/moodiary/editor/src/ui/nodes/CodeBlockNodeView.tsx (ZhuJHua/moodiary@2c552dd)
// El botón de copiar usa el portapapeles del navegador (en moodiary lo hacía Flutter por el puente).
import { useEffect, useRef, useState } from "react";
import { NodeViewContent, NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { Check, Copy } from "lucide-react";

export default function VistaCodigo({ node }: NodeViewProps) {
  const language = (node.attrs.language as string | null) || "Texto";
  const [copied, setCopied] = useState(false);
  const timer = useRef(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(node.textContent);
    } catch {
      return;
    }
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1500);
  }

  const Icon = copied ? Check : Copy;
  return (
    <NodeViewWrapper className="md-code">
      <div className="md-code__head" contentEditable={false}>
        <span className="md-code__lang">{language}</span>
        <button type="button" className="md-code__copy" onMouseDown={(e) => e.preventDefault()} onClick={() => void copy()}>
          <Icon />
          <span>{copied ? "Copiado" : "Copiar"}</span>
        </button>
      </div>
      <pre>
        <NodeViewContent<"code"> as="code" />
      </pre>
    </NodeViewWrapper>
  );
}
