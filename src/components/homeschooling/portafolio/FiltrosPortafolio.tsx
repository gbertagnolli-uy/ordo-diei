"use client";

// Portado de vendor/roost/src/components/showcase/ShowcaseFilters.tsx (msrbuilds/roost@492af47).
// Cambios: filtros de alumno, materia y mes (en lugar de categoría y etiquetas), guardados en la URL; solo destacadas.

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { NativeSelect } from "@/components/ui/native-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function FiltrosPortafolio({
  alumnos,
  materias,
}: {
  alumnos?: { id: number; nombre: string }[];
  materias: { id: number; name: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const poner = (clave: string, valor: string | null) => {
    const nuevo = new URLSearchParams(params.toString());
    if (valor) nuevo.set(clave, valor);
    else nuevo.delete(clave);
    router.replace(nuevo.toString() ? `${pathname}?${nuevo}` : pathname);
  };

  return (
    <div className="flex flex-wrap items-end gap-3">
      {alumnos && (
        <div className="space-y-1">
          <Label htmlFor="f-alumno">Alumno</Label>
          <NativeSelect id="f-alumno" value={params.get("alumno") ?? ""} onChange={(e) => poner("alumno", e.target.value || null)}>
            <option value="">Todos</option>
            {alumnos.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nombre}
              </option>
            ))}
          </NativeSelect>
        </div>
      )}
      <div className="space-y-1">
        <Label htmlFor="f-materia">Materia</Label>
        <NativeSelect id="f-materia" value={params.get("materia") ?? ""} onChange={(e) => poner("materia", e.target.value || null)}>
          <option value="">Todas</option>
          {materias.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </NativeSelect>
      </div>
      <div className="space-y-1">
        <Label htmlFor="f-mes">Mes</Label>
        <Input id="f-mes" type="month" className="w-40" value={params.get("mes") ?? ""} onChange={(e) => poner("mes", e.target.value || null)} />
      </div>
      <label className="flex items-center gap-2 pb-1.5 text-sm">
        <Switch checked={params.get("destacadas") === "1"} onCheckedChange={(v) => poner("destacadas", v ? "1" : null)} /> Solo destacadas
      </label>
    </div>
  );
}
