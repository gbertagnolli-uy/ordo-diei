// Diario (lane 285): texto con las coincidencias marcadas. Portado de vendor/moodiary/.../search_result_card.dart y de
// vendor/Daily_You/lib/utils/search_highlight.dart (ZhuJHua/moodiary@2c552dd, Demizo/Daily_You@7cc237d). Se arma con elementos, nunca con HTML.
import type { Segmento } from "@/lib/diario/busqueda";

export function TextoResaltado({ segmentos }: { segmentos: Segmento[] }) {
  return (
    <>
      {segmentos.map((s, i) =>
        s.coincide ? (
          <mark key={i} className="rounded-sm bg-primary/25 px-0.5 text-foreground">
            {s.texto}
          </mark>
        ) : (
          <span key={i}>{s.texto}</span>
        ),
      )}
    </>
  );
}
