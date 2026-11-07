"use client";
// Portado de vendor/dovli/apps/web/src/features/home/cards.tsx (MayankJha0333/dovli@eb453e0)
/* eslint-disable @typescript-eslint/no-explicit-any -- código portado de dovli, sin cambios de lógica */
import { previewLines, type BoardData } from "@/lib/notas/core";
import { cn } from "@/components/notas/ui";

export type Sketch = { shapes: { id: string; type: string; x: number; y: number; width: number; height: number; fill: boolean }[]; edges: [string, string][] };

export function sketchOf(board: BoardData | undefined): Sketch {
  const items: any[] = board?.elements?.length ? board.elements : (board?.skeleton ?? []);
  const shapes = items
    .filter((e) => !e.isDeleted && ["rectangle", "ellipse", "diamond"].includes(e.type))
    .map((e) => ({ id: e.id, type: e.type, x: e.x, y: e.y, width: e.width, height: e.height, fill: !!e.backgroundColor && e.backgroundColor !== "transparent" }));
  const edges: [string, string][] = items
    .filter((e) => e.type === "arrow" && !e.isDeleted)
    .map((e) => [e.start?.id ?? e.startBinding?.elementId, e.end?.id ?? e.endBinding?.elementId] as [string, string])
    .filter(([a, b]) => a && b);
  return { shapes, edges };
}

/** A tiny drawing of a whiteboard's boxes and arrows. */
export function BoardSketch({ sketch }: { sketch: Sketch }) {
  const { shapes, edges } = sketch;
  if (!shapes.length) return <div className="grid h-full place-items-center text-2xs text-ink-4">Pizarra vacía</div>;
  const byId = Object.fromEntries(shapes.map((s) => [s.id, s]));
  const xs = shapes.flatMap((s) => [s.x, s.x + s.width]);
  const ys = shapes.flatMap((s) => [s.y, s.y + s.height]);
  const minX = Math.min(...xs) - 24;
  const minY = Math.min(...ys) - 24;
  const w = Math.max(...xs) - minX + 24;
  const h = Math.max(...ys) - minY + 24;
  const center = (s: any) => [s.x + s.width / 2, s.y + s.height / 2];
  const shape = "fill-[var(--d-panel)] stroke-[var(--d-ink-2)] [stroke-width:1.2] [vector-effect:non-scaling-stroke]";
  return (
    <svg viewBox={`${minX} ${minY} ${w} ${h}`} className="absolute inset-x-2.5 bottom-[18px] top-2.5 h-[calc(100%-28px)] w-[calc(100%-20px)]" aria-hidden="true" preserveAspectRatio="xMidYMid meet">
      {edges
        .filter(([a, b]) => byId[a] && byId[b])
        .map(([a, b], i) => {
          const [x1, y1] = center(byId[a]);
          const [x2, y2] = center(byId[b]);
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} className="stroke-[var(--d-ink-3)] [stroke-width:1] [vector-effect:non-scaling-stroke]" />;
        })}
      {shapes.map((s) => {
        const cls = cn(shape, s.fill && "fill-[var(--d-sketch)]");
        if (s.type === "ellipse") return <ellipse key={s.id} cx={s.x + s.width / 2} cy={s.y + s.height / 2} rx={s.width / 2} ry={s.height / 2} className={cls} />;
        if (s.type === "diamond") {
          const [cx, cy] = center(s);
          return <polygon key={s.id} points={`${cx},${s.y} ${s.x + s.width},${cy} ${cx},${s.y + s.height} ${s.x},${cy}`} className={cls} />;
        }
        return <rect key={s.id} x={s.x} y={s.y} width={s.width} height={s.height} rx={12} className={cls} />;
      })}
    </svg>
  );
}

/** A miniature of a document: title, headings, list dots and to-do boxes. */
export function DocPreview({ title, blocks }: { title: string; blocks: any[] }) {
  const lines = previewLines(blocks, 9);
  return (
    <div className="flex flex-col gap-1 px-[13px] py-3.5">
      <div className="mb-1 truncate font-[family-name:var(--title-font,var(--d-font-display))] text-[12.5px] font-semibold leading-tight tracking-tight text-ink">{title}</div>
      {lines.map((l, i) =>
        l.kind === "rule" ? (
          <hr key={i} className="my-0.5 w-full border-0 border-t border-line" />
        ) : l.kind === "table" ? (
          <div key={i} className="grid grid-cols-[1fr_2fr] overflow-hidden rounded-[3px] border border-line">
            {Array.from({ length: 6 }).map((_, j) => (
              <i key={j} className="h-[7px] border-b border-r border-line [&:nth-child(2n)]:border-r-0 [&:nth-last-child(-n+2)]:border-b-0" />
            ))}
          </div>
        ) : (
          <div
            key={i}
            className={cn(
              "flex items-center gap-1 truncate text-[7.5px] leading-[1.35] text-ink-2",
              (l.kind === "h1" || l.kind === "h2") && "mt-[3px] text-[8.5px] font-semibold text-ink",
              l.kind === "h3" && "mt-0.5 text-[8px] font-semibold text-ink",
              l.kind === "li" && "before:size-[2.5px] before:flex-none before:rounded-full before:bg-[var(--d-ink-3)] before:content-['']",
            )}
          >
            {l.kind === "todo" && <span className="size-1.5 flex-none rounded-[2px] border border-ink-3" />}
            {l.text || " "}
          </div>
        ),
      )}
    </div>
  );
}
