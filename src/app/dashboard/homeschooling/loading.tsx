import { Skeleton } from "@/components/ui/skeleton";

// Mientras carga una página de Estudio (consultan la base) la cabecera con las pestañas queda a la vista y acá se muestra
// un esqueleto, así el cambio de sección responde al instante.
export default function CargandoEstudio() {
  return (
    <div className="mx-auto w-full min-w-0 max-w-5xl space-y-4 p-4 sm:p-6" role="status" aria-busy="true" aria-label="Cargando">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}
