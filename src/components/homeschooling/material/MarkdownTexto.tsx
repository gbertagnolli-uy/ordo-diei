"use client";

// Propio de Ordo (lane 167, M2): markdown y texto del padre, legibles. react-markdown no admite HTML crudo ni
// `javascript:`; se apagan las imágenes (nada sale a la red sin que el padre lo sepa) y los enlaces abren en otra pestaña.
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

export default function MarkdownTexto({ texto, markdown = true, className }: { texto: string; markdown?: boolean; className?: string }) {
  if (!markdown) return <p className={cn("text-lg leading-8 whitespace-pre-wrap text-foreground", className)}>{texto}</p>;
  return (
    <div className={cn("space-y-4 text-lg leading-8 text-foreground", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: (p) => <h1 className="mt-2 text-3xl font-bold tracking-tight" {...p} />,
          h2: (p) => <h2 className="mt-4 text-2xl font-bold tracking-tight" {...p} />,
          h3: (p) => <h3 className="mt-3 text-xl font-semibold" {...p} />,
          h4: (p) => <h4 className="mt-2 text-lg font-semibold" {...p} />,
          p: (p) => <p {...p} />,
          ul: (p) => <ul className="list-disc space-y-1 pl-6" {...p} />,
          ol: (p) => <ol className="list-decimal space-y-1 pl-6" {...p} />,
          blockquote: (p) => <blockquote className="border-l-4 border-primary/40 pl-4 text-muted-foreground italic" {...p} />,
          a: ({ href, ...p }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2" {...p} />,
          code: (p) => <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.9em]" {...p} />,
          pre: (p) => <pre className="overflow-x-auto rounded-xl bg-muted p-4 font-mono text-sm" {...p} />,
          hr: () => <hr className="my-6 border-border" />,
          table: (p) => (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-base" {...p} />
            </div>
          ),
          th: (p) => <th className="border border-border bg-muted px-3 py-1.5 text-left font-semibold" {...p} />,
          td: (p) => <td className="border border-border px-3 py-1.5" {...p} />,
          img: () => null,
        }}
      >
        {texto}
      </ReactMarkdown>
    </div>
  );
}
