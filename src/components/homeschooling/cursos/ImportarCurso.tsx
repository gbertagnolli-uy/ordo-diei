"use client";

// Propio de Ordo (lane 170, M3): trae un curso desde un archivo .ordo-curso.json (exportado de otra materia, guardado como plantilla
// o bajado de un paquete de planes). Se valida en el servidor antes de crear nada.
import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { api } from "@/lib/homeschooling/roost/services/http";
import { toast } from "@/lib/toast";

const MAX_BYTES = 2 * 1024 * 1024;

export default function ImportarCurso({ materiaId, onImportado }: { materiaId: number; onImportado: (cursoId: number) => void }) {
  const entrada = useRef<HTMLInputElement>(null);
  const [ocupado, setOcupado] = useState(false);

  const leer = async (archivo: File) => {
    if (archivo.size > MAX_BYTES) return toast.error("El archivo es demasiado grande (máximo 2 MB)");
    setOcupado(true);
    try {
      let contenido: unknown;
      try {
        contenido = JSON.parse(await archivo.text());
      } catch {
        throw new Error("El archivo no es un curso de Ordo Diei (no se puede leer)");
      }
      const r = await api<{ id: number; lecciones: number }>(`/api/homeschooling/materias/${materiaId}/importar`, { method: "POST", body: contenido });
      toast.success(r.lecciones > 0 ? `Curso importado con ${r.lecciones} lecciones` : "Curso importado");
      onImportado(r.id);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo importar el curso");
    } finally {
      setOcupado(false);
      if (entrada.current) entrada.current.value = "";
    }
  };

  return (
    <>
      <input ref={entrada} type="file" accept=".json,application/json" className="sr-only" tabIndex={-1} aria-hidden onChange={(e) => e.target.files?.[0] && void leer(e.target.files[0])} />
      <Button variant="outline" onClick={() => entrada.current?.click()} disabled={ocupado}>
        {ocupado ? <Spinner /> : <Upload />} Importar curso
      </Button>
    </>
  );
}
