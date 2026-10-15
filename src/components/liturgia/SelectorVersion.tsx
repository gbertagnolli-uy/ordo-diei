"use client";

import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { NOMBRES_VERSION, NOTA_MISAL_1910 } from "@/lib/liturgia/cliente";
import { esVersionLiturgica, VERSIONES } from "@/lib/liturgia/tipos";
import type { VersionLiturgica } from "@/lib/liturgia/tipos";

/**
 * Selector de versión (D43, S7): único para todas las pantallas, en su cabecera.
 * Predeterminada 1906. En Missale (`notaMisal`) 1888 y 1906 muestran la nota de D53.
 */
export function SelectorVersion({
  version,
  onChange,
  notaMisal = false,
}: {
  version: VersionLiturgica;
  onChange: (v: VersionLiturgica) => void;
  notaMisal?: boolean;
}) {
  return (
    <div className="flex flex-col items-start gap-1">
      <label className="sr-only" htmlFor="liturgia-version">Versión del calendario</label>
      <NativeSelect
        size="sm"
        value={version}
        onChange={(e) => esVersionLiturgica(e.target.value) && onChange(e.target.value)}
        id="liturgia-version"
      >
        {VERSIONES.map((v) => (
          <NativeSelectOption key={v} value={v}>
            {NOMBRES_VERSION[v]}
          </NativeSelectOption>
        ))}
      </NativeSelect>
      {notaMisal && version !== "1570" && <p className="text-xs text-muted-foreground">{NOTA_MISAL_1910}</p>}
    </div>
  );
}
