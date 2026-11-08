"use client";
// Asistente del diario (lane 298): el Markdown de las respuestas. react-markdown no admite HTML crudo ni `javascript:`; las imágenes están apagadas
// (nada sale a la red por una respuesta del modelo) y los enlaces abren en otra pestaña. Es lo que cuida a la clave guardada en el navegador (D1).
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

export function MarkdownChat({ texto, className }: { texto: string; className?: string }) {
  return (
    <div className={cn("space-y-2 text-sm leading-6 break-words text-foreground", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        urlTransform={(url) => (/^(https?:|mailto:)/i.test(url) ? url : "")}
        components={{
          h1: (p) => <h1 className="mt-2 text-lg font-bold" {...p} />,
          h2: (p) => <h2 className="mt-2 text-base font-bold" {...p} />,
          h3: (p) => <h3 className="mt-1 text-sm font-semibold" {...p} />,
          h4: (p) => <h4 className="mt-1 text-sm font-semibold" {...p} />,
          ul: (p) => <ul className="list-disc space-y-0.5 pl-5" {...p} />,
          ol: (p) => <ol className="list-decimal space-y-0.5 pl-5" {...p} />,
          blockquote: (p) => <blockquote className="border-l-4 border-primary/40 pl-3 text-muted-foreground italic" {...p} />,
          a: ({ href, ...p }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2" {...p} />,
          code: (p) => <code className="rounded bg-muted px-1 py-0.5 font-mono text-[0.9em]" {...p} />,
          pre: (p) => <pre className="overflow-x-auto rounded-lg bg-muted p-3 font-mono text-xs" {...p} />,
          hr: () => <hr className="my-3 border-border" />,
          table: (p) => (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs" {...p} />
            </div>
          ),
          th: (p) => <th className="border border-border bg-muted px-2 py-1 text-left font-semibold" {...p} />,
          td: (p) => <td className="border border-border px-2 py-1" {...p} />,
          img: () => null,
        }}
      >
        {texto}
      </ReactMarkdown>
    </div>
  );
}
