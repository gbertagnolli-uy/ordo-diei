"use client";
// Diario (lane 284): categoría de la entrada (moodiary: jerárquica, con color, una por entrada).
// Portado de la idea de vendor/moodiary/.../category_repository.dart (ZhuJHua/moodiary@2c552dd); el selector es de esta app.
import { useMemo } from "react";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { aplanarArbol } from "@/lib/diario/etiquetas";
import type { CategoriaVista } from "@/lib/diario/servidor-catalogo";

export function SelectorCategoria({ categorias, valor, onCambio, onAdministrar }: { categorias: CategoriaVista[]; valor: number | null; onCambio: (id: number | null) => void; onAdministrar: () => void }) {
  const arbol = useMemo(() => aplanarArbol(categorias), [categorias]);
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <Label htmlFor="categoria-entrada">Categoría</Label>
        <button type="button" onClick={onAdministrar} className="text-sm text-primary">
          Administrar
        </button>
      </div>
      <NativeSelect id="categoria-entrada" className="w-full" value={valor ?? ""} onChange={(e) => onCambio(e.target.value ? Number(e.target.value) : null)}>
        <NativeSelectOption value="">Sin categoría</NativeSelectOption>
        {arbol.map((c) => (
          <NativeSelectOption key={c.id} value={c.id}>
            {"— ".repeat(c.nivel - 1)}
            {c.nombre}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </div>
  );
}
