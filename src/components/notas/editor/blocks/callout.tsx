"use client";
// Portado de vendor/dovli/packages/editor/src/blocks/callout.tsx (MayankJha0333/dovli@eb453e0)
/* eslint-disable @typescript-eslint/no-explicit-any -- código portado de dovli, sin cambios de lógica */
import { createReactBlockSpec } from "@blocknote/react";
import { cn } from "@/components/notas/ui";

/** A highlighted box with an icon, for tips, warnings and key points. Click the icon to change it. */

export const CALLOUT_TONES = ["note", "tip", "warning", "danger"] as const;
type Tone = (typeof CALLOUT_TONES)[number];

const TONE: Record<Tone, { emoji: string; label: string; cls: string }> = {
  note: { emoji: "💡", label: "Nota", cls: "bg-well" },
  tip: { emoji: "✅", label: "Consejo", cls: "bg-accent-soft" },
  warning: { emoji: "⚠️", label: "Advertencia", cls: "bg-[color-mix(in_srgb,var(--d-warn)_14%,transparent)]" },
  danger: { emoji: "⛔", label: "Importante", cls: "bg-danger-soft" },
};

const next = (t: Tone): Tone => CALLOUT_TONES[(CALLOUT_TONES.indexOf(t) + 1) % CALLOUT_TONES.length];

export const calloutBlock = createReactBlockSpec(
  {
    type: "callout",
    propSchema: { tone: { default: "note", values: CALLOUT_TONES }, emoji: { default: "" } },
    content: "inline",
  },
  {
    render: ({ block, editor, contentRef }) => {
      const tone = (block.props.tone as Tone) ?? "note";
      const t = TONE[tone];
      return (
        <div className={cn("my-1 flex w-full items-start gap-3 rounded-md px-3.5 py-3", t.cls)} data-callout={tone}>
          <button
            type="button"
            contentEditable={false}
            className="mt-px grid size-6 flex-none place-items-center rounded-xs text-[1.05rem] leading-none hover:bg-hover"
            aria-label={`Recuadro: ${t.label}. Tocá para cambiar el tipo`}
            title="Cambiar tipo"
            onClick={() => editor.isEditable && editor.updateBlock(block, { props: { tone: next(tone), emoji: "" } } as any)}
          >
            {block.props.emoji || t.emoji}
          </button>
          <div className="min-w-0 flex-1" ref={contentRef} />
        </div>
      );
    },
    toExternalHTML: ({ block, contentRef }) => (
      <blockquote data-callout={block.props.tone}>
        <p>
          <strong>{block.props.emoji || TONE[(block.props.tone as Tone) ?? "note"].emoji}</strong> <span ref={contentRef} />
        </p>
      </blockquote>
    ),
  },
);
