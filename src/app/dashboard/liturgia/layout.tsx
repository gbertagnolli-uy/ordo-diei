import { CabeceraPagina } from "@/components/liturgia/CabeceraPagina";

// Marco común de la liturgia: barra superior con breadcrumb y el contenido con sus márgenes.
export default function LiturgiaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col">
      <CabeceraPagina />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
