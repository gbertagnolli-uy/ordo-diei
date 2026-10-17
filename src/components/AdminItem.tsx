"use client";

import { useState, type ReactNode } from "react";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { SwipeRow } from "@/components/SwipeRow";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "@/lib/toast";

interface Props {
  children: ReactNode;
  /** Solo administradores (Padre/Madre) editan y eliminan; si es false se renderiza el contenido tal cual. */
  enabled: boolean;
  /** Cómo se llama el item en la confirmación («la tarea X»). */
  nombre: string;
  /** Abre el formulario de edición existente. Si falta, no se ofrece editar. */
  onEdit?: () => void;
  /** Elimina el item (debe lanzar si falla). Si falta, no se ofrece eliminar. */
  onDelete?: () => Promise<void> | void;
  /** Texto extra de la confirmación (p. ej. qué se pierde junto con el item). */
  aviso?: string;
  className?: string;
  /** false: el padre ya pide su propia confirmación; onDelete se llama directo. */
  confirmar?: boolean;
  /** «tarjeta»: el menú «⋯» flota arriba a la derecha (grillas); «fila»: va al costado. */
  forma?: "fila" | "tarjeta";
  /** false: sin menú «⋯» (el item ya tiene el suyo); queda solo el swipe. */
  menu?: boolean;
}

/**
 * Editar / eliminar para cualquier item creable: swipe a la derecha = editar, a la izquierda = eliminar
 * (mismo SwipeRow que aprobar/rechazar tareas) y un menú «⋯» equivalente para quien no usa gestos.
 */
export function AdminItem({ children, enabled, nombre, onEdit, onDelete, aviso, className, confirmar: pedirConfirmacion = true, forma = "fila", menu = true }: Props) {
  const [confirmar, setConfirmar] = useState(false);
  const [borrando, setBorrando] = useState(false);

  if (!enabled || (!onEdit && !onDelete)) return <>{children}</>;

  const eliminar = async () => {
    setBorrando(true);
    try {
      await onDelete?.();
      setConfirmar(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo eliminar");
    } finally {
      setBorrando(false);
    }
  };

  const pedirEliminar = () => (pedirConfirmacion ? setConfirmar(true) : void onDelete?.());
  const flota = forma === "tarjeta";

  return (
    <>
      <SwipeRow
        className={className}
        right={onEdit ? { label: "Editar", icon: <Pencil className="size-5" />, color: "var(--primary)", onColor: "var(--primary-foreground)", collapse: false, onCommit: onEdit } : undefined}
        left={onDelete ? { label: "Eliminar", icon: <Trash2 className="size-5" />, color: "var(--destructive)", onColor: "#fff", collapse: false, onCommit: pedirEliminar } : undefined}
      >
        <div className={flota ? "relative" : "flex items-center"}>
          <div className="min-w-0 flex-1">{children}</div>
          {menu && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className={flota ? "absolute top-2 right-2 bg-card/80 backdrop-blur print:hidden" : "mr-2 shrink-0 print:hidden"} aria-label={`Acciones de ${nombre}`}>
                <MoreVertical />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEdit && (
                <DropdownMenuItem onSelect={onEdit}>
                  <Pencil /> Editar
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem variant="destructive" onSelect={pedirEliminar}>
                  <Trash2 /> Eliminar
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          )}
        </div>
      </SwipeRow>

      <Dialog open={confirmar} onOpenChange={(o) => !o && !borrando && setConfirmar(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>¿Eliminar {nombre}?</DialogTitle>
            <DialogDescription>{aviso ?? "Esta acción no se puede deshacer."}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmar(false)} disabled={borrando}>Cancelar</Button>
            <Button variant="destructive" onClick={eliminar} disabled={borrando}>{borrando ? "Eliminando…" : "Eliminar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default AdminItem;
