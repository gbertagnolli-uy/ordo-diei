"use client";
// Asistente del diario (lane 299): chip y detalle del resumen del contexto.
// Portado de vendor/moodiary/packages/feature/moodiary_assistant/lib/src/presentation/assistant_page.dart (`_CompactionNoticeChip`; ZhuJHua/moodiary@2c552dd).
import { useState } from "react";
import { FoldVertical } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AvisoCompactacion(props: { resumen: string; onRestaurar: () => void }) {
  const [abierto, setAbierto] = useState(false);

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-dashed px-3 py-2 text-xs text-muted-foreground">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <FoldVertical className="size-3.5 shrink-0" aria-hidden />
          <span>Mensajes anteriores resumidos para ahorrar contexto</span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="xs"
          onClick={() => setAbierto((v) => !v)}
        >
          {abierto ? "Ocultar" : "Ver resumen"}
        </Button>
      </div>

      {abierto && (
        <div className="flex flex-col gap-2 pt-1 border-t border-dashed">
          <p>
            Para ahorrar contexto, los mensajes anteriores se mandan al modelo resumidos. Los mensajes completos siguen en esta conversación.
          </p>
          <p className="whitespace-pre-wrap text-foreground">{props.resumen}</p>
          <div>
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={props.onRestaurar}
            >
              Mandar el historial completo otra vez
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
