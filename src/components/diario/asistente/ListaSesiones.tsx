"use client";
// Asistente del diario (lane 298): las conversaciones guardadas, agrupadas por cuándo se usaron. Portado de la idea de
// vendor/moodiary/.../presentation/assistant_page.dart (`AssistantSessionListPage`, `_HistoryGroupLabel`; ZhuJHua/moodiary@2c552dd).
import { MessageSquare, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { agruparSesiones, tituloVisible, type GrupoHistorial, type Sesion } from "@/lib/diario/asistente/sesiones";
import { cn } from "@/lib/utils";
import { Panel } from "./ProveedoresAsistente";

const TITULO_GRUPO: Record<GrupoHistorial, string> = { hoy: "Hoy", ultimos: "Últimos 7 días", antes: "Antes" };

const hora = (t: number) => new Date(t).toLocaleString("es-UY", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export function ListaSesiones({ sesiones, activaId, onVolver, onAbrir, onNueva, onBorrar }: { sesiones: Sesion[]; activaId: string | null; onVolver: () => void; onAbrir: (id: string) => void; onNueva: () => void; onBorrar: (id: string) => void }) {
  const grupos = agruparSesiones(sesiones, new Date());
  return (
    <Panel titulo="Conversaciones" onVolver={onVolver}>
      <div className="mb-3">
        <Button type="button" onClick={onNueva}>
          <Plus /> Conversación nueva
        </Button>
      </div>
      {grupos.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Todavía no hay conversaciones.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {grupos.map((g) => (
            <section key={g.grupo}>
              <h4 className="mb-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">{TITULO_GRUPO[g.grupo]}</h4>
              <ul className="flex flex-col gap-1.5">
                {g.sesiones.map((s) => (
                  <li key={s.id} className={cn("flex items-center gap-2 rounded-xl border p-2.5", s.id === activaId && "border-primary/50 bg-primary/5")}>
                    <button type="button" className="flex min-w-0 flex-1 items-start gap-2 text-left" onClick={() => onAbrir(s.id)}>
                      <MessageSquare className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate text-sm font-medium">{tituloVisible(s)}</span>
                        <span className="truncate text-xs text-muted-foreground">
                          {hora(s.actualizadaEn)} · {s.modelo || "sin modelo"}
                        </span>
                      </span>
                    </button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Borrar «${tituloVisible(s)}»`}
                      onClick={() => {
                        if (window.confirm("¿Borrar esta conversación?")) onBorrar(s.id);
                      }}
                    >
                      <Trash2 />
                    </Button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </Panel>
  );
}
