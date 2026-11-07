"use client";
// Portado de vendor/dovli/apps/web/src/features/page/panels/FormatPanel.tsx (MayankJha0333/dovli@eb453e0)
// The Aa panel: text styles, turning blocks into pages, marks, lists, indent, alignment,
// decorations, colour and font. Works on the selected text, or else on the block with the cursor.

import { useEffect, useReducer } from "react";
import {
  TEXT_COLORS,
  formatState,
  getBridge,
  indent,
  setAlign,
  setColor,
  setFont,
  setTextStyle,
  toggleDecoration,
  toggleList,
  toggleMark,
  turnIntoPage,
  type DovliEditor,
  type FontId,
  type TextStyleId,
} from "@/components/notas/editor";
import { PAGE_FONTS } from "@/lib/notas/theme";
import { Icon, cn, toast } from "@/components/notas/ui";
import type { Page } from "@/lib/notas/core";
import { store } from "@/lib/notas/cliente/store";
import { IconRow, IconRowButton, PanelTitle, Section, Tile, keepSelection } from "./kit";

const TITLES: { id: TextStyleId; label: string; cls: string }[] = [
  { id: "title", label: "Título", cls: "font-display text-lg font-bold" },
  { id: "subtitle", label: "Subtítulo", cls: "font-display text-md font-bold" },
  { id: "heading", label: "Encabezado", cls: "font-display text-base font-bold" },
];
const CONTENT: { id: TextStyleId; label: string; cls: string }[] = [
  { id: "strong", label: "Destacado", cls: "font-bold" },
  { id: "body", label: "Cuerpo", cls: "" },
  { id: "caption", label: "Leyenda", cls: "text-sm text-ink-3" },
];

/** Re-draw the panel whenever the selection or the page changes. */
function useEditorTick(editor: DovliEditor | null) {
  const [, tick] = useReducer((n: number) => n + 1, 0);
  useEffect(() => {
    if (!editor) return;
    const offs = [editor.onSelectionChange(tick), editor.onChange(tick)];
    return () => offs.forEach((off) => (typeof off === "function" ? off() : undefined));
  }, [editor]);
}

export function FormatPanel({ page, editor }: { page: Page; editor: DovliEditor | null }) {
  useEditorTick(editor);
  if (!editor) return <p className="m-0 p-2 text-sm text-ink-3">Abriendo la página…</p>;
  const f = formatState(editor);
  const off = !f.textual;
  const run = (fn: () => void) => () => fn();

  return (
    <div>
      <PanelTitle>Formato</PanelTitle>
      {off && <p className="m-0 mb-2 rounded-md bg-well px-3 py-2 text-sm text-ink-3">Poné el cursor en un texto para darle formato.</p>}

      <Section title="Títulos">
        <div className="grid grid-cols-3 gap-1.5">
          {TITLES.map((t) => (
            <Tile key={t.id} {...keepSelection} active={f.textStyle === t.id} disabled={off} className={t.cls} onClick={run(() => setTextStyle(editor, t.id))}>
              {t.label}
            </Tile>
          ))}
        </div>
      </Section>

      <Section title="Contenido">
        <div className="grid grid-cols-3 gap-1.5">
          {CONTENT.map((t) => (
            <Tile key={t.id} {...keepSelection} active={f.textStyle === t.id} disabled={off} className={t.cls} onClick={run(() => setTextStyle(editor, t.id))}>
              {t.label}
            </Tile>
          ))}
        </div>
      </Section>

      <Section title="Grupos">
        <div className="grid grid-cols-2 gap-1.5">
          {(["page", "card"] as const).map((as) => (
            <Tile
              key={as}
              {...keepSelection}
              onClick={() => {
                const bridge = getBridge();
                const id = bridge && turnIntoPage(editor, bridge, page.id, as);
                if (id)
                  toast(as === "card" ? "Convertido en tarjeta de página" : "Convertido en página", {
                    action: { label: "Abrir", onClick: () => store.navigate({ name: "page", id }) },
                  });
              }}
            >
              <span
                aria-hidden="true"
                className={cn("grid h-6 w-5 place-items-start rounded-[4px] p-[3px] shadow-sm", as === "card" ? "w-7 bg-panel" : "bg-panel")}
              >
                <span className="h-0.5 w-full rounded bg-ink-4" />
              </span>
              {as === "page" ? "Página" : "Tarjeta"}
            </Tile>
          ))}
        </div>
        <p className="m-0 mt-1.5 text-xs text-ink-3">Mueve los bloques seleccionados a una página nueva dentro de esta.</p>
      </Section>

      <Section title="Texto">
        <div className="flex flex-col gap-1.5">
          <IconRow>
            <IconRowButton {...keepSelection} icon="bold" label="Negrita" active={f.marks.bold} disabled={off} onClick={run(() => toggleMark(editor, "bold"))} />
            <IconRowButton {...keepSelection} icon="italic" label="Cursiva" active={f.marks.italic} disabled={off} onClick={run(() => toggleMark(editor, "italic"))} />
            <IconRowButton {...keepSelection} icon="strike" label="Tachado" active={f.marks.strike} disabled={off} onClick={run(() => toggleMark(editor, "strike"))} />
            <IconRowButton {...keepSelection} icon="code" label="Código" active={f.marks.code} disabled={off} onClick={run(() => toggleMark(editor, "code"))} />
          </IconRow>
          <IconRow>
            <IconRowButton {...keepSelection} icon="checkbox" label="Tarea" active={f.list === "checkListItem"} disabled={off} onClick={run(() => toggleList(editor, "checkListItem"))} />
            <IconRowButton {...keepSelection} icon="toggle" label="Desplegable" active={f.list === "toggleListItem"} disabled={off} onClick={run(() => toggleList(editor, "toggleListItem"))} />
            <IconRowButton {...keepSelection} icon="bulletList" label="Lista con viñetas" active={f.list === "bulletListItem"} disabled={off} onClick={run(() => toggleList(editor, "bulletListItem"))} />
            <IconRowButton {...keepSelection} icon="numberList" label="Lista numerada" active={f.list === "numberedListItem"} disabled={off} onClick={run(() => toggleList(editor, "numberedListItem"))} />
          </IconRow>
          <div className="grid grid-cols-[2fr_4fr] gap-1.5">
            <IconRow>
              <IconRowButton {...keepSelection} icon="outdent" label="Mover a la izquierda (menos sangría)" disabled={!f.canOutdent} onClick={run(() => indent(editor, "out"))} />
              <IconRowButton {...keepSelection} icon="indent" label="Mover a la derecha (más sangría)" disabled={!f.canIndent} onClick={run(() => indent(editor, "in"))} />
            </IconRow>
            <IconRow>
              {(
                [
                  ["left", "alignLeft", "Alinear a la izquierda"],
                  ["center", "alignCenter", "Centrar"],
                  ["right", "alignRight", "Alinear a la derecha"],
                  ["justify", "alignJustify", "Justificar"],
                ] as const
              ).map(([a, icon, label]) => (
                <IconRowButton key={a} {...keepSelection} icon={icon} label={label} active={f.align === a} disabled={off} onClick={run(() => setAlign(editor, a))} />
              ))}
            </IconRow>
          </div>
        </div>
      </Section>

      <Section title="Decoraciones">
        <div className="grid grid-cols-2 gap-1.5">
          <Tile {...keepSelection} active={f.decoration === "focus"} disabled={off} onClick={run(() => toggleDecoration(editor, "focus"))}>
            <span aria-hidden="true" className="h-4 w-[3px] rounded-full bg-accent" />
            Foco
          </Tile>
          <Tile {...keepSelection} active={f.decoration === "box"} disabled={off} onClick={run(() => toggleDecoration(editor, "box"))}>
            <span aria-hidden="true" className="h-4 w-6 rounded-[4px] bg-line-strong" />
            Recuadro
          </Tile>
        </div>
      </Section>

      <Section title="Color">
        <div className="grid grid-cols-5 gap-2" role="radiogroup" aria-label="Color del texto">
          {TEXT_COLORS.map((c) => (
            <button
              key={c.id}
              type="button"
              role="radio"
              aria-checked={f.color === c.id}
              aria-label={c.label}
              title={c.label}
              disabled={off}
              {...keepSelection}
              onClick={run(() => setColor(editor, c.id))}
              className={cn(
                "mx-auto grid size-9 place-items-center rounded-full transition-transform hover:scale-105 disabled:opacity-40",
                f.color === c.id ? "shadow-[0_0_0_2px_var(--d-panel),0_0_0_4px_var(--d-ink)]" : "",
              )}
              style={{ background: c.swatch }}
            >
              {f.color === c.id && <Icon name="check" size={14} className="text-[var(--d-panel)] mix-blend-difference" />}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Fuente">
        <div className="grid grid-cols-4 gap-1.5">
          {(Object.keys(PAGE_FONTS) as FontId[]).map((id) => (
            <Tile key={id} {...keepSelection} active={f.font === id} disabled={off} className="h-14 flex-col gap-0" onClick={run(() => setFont(editor, id))}>
              <span className="text-lg leading-none" style={{ fontFamily: PAGE_FONTS[id].family }}>
                {PAGE_FONTS[id].sample}
              </span>
              <span className="text-xs text-ink-2">{PAGE_FONTS[id].label}</span>
            </Tile>
          ))}
        </div>
      </Section>
    </div>
  );
}
